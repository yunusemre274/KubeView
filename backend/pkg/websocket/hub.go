package websocket

import (
	"encoding/json"
	"fmt"
	"net/http"
	"sync"

	"github.com/gorilla/websocket"
	"github.com/k8s-tersane/tersane/backend/pkg/api"
)

var upgrader = websocket.Upgrader{
	ReadBufferSize:  1024,
	WriteBufferSize: 1024,
	// Allow all origins for development & cluster port-forwarding
	CheckOrigin: func(r *http.Request) bool {
		return true
	},
}

// Client represents a single connected WebSocket client.
type Client struct {
	hub  *Hub
	conn *websocket.Conn
	send chan []byte
}

// Hub maintains the set of active clients and broadcasts messages to them.
type Hub struct {
	clients    map[*Client]bool
	broadcast  chan []byte
	register   chan *Client
	unregister chan *Client
	mu         sync.RWMutex

	// Provider for sending initial cluster state upon client connection
	initialStateProvider func() api.InitialStatePayload
}

// NewHub initializes and returns a Hub instance.
func NewHub(initialStateProvider func() api.InitialStatePayload) *Hub {
	return &Hub{
		broadcast:            make(chan []byte, 256),
		register:             make(chan *Client),
		unregister:           make(chan *Client),
		clients:              make(map[*Client]bool),
		initialStateProvider: initialStateProvider,
	}
}

// Run starts the Hub message loop.
func (h *Hub) Run() {
	for {
		select {
		case client := <-h.register:
			h.mu.Lock()
			h.clients[client] = true
			h.mu.Unlock()
			fmt.Println("[websocket-hub] New client connected. Sending initial cluster state...")

			// Send Initial State
			if h.initialStateProvider != nil {
				initialState := h.initialStateProvider()
				msg := api.NewWSMessage(api.TypeInitialState, initialState)
				bytes, err := json.Marshal(msg)
				if err == nil {
					client.send <- bytes
				}
			}

		case client := <-h.unregister:
			h.mu.Lock()
			if _, ok := h.clients[client]; ok {
				delete(h.clients, client)
				close(client.send)
				fmt.Println("[websocket-hub] Client disconnected.")
			}
			h.mu.Unlock()

		case message := <-h.broadcast:
			h.mu.RLock()
			for client := range h.clients {
				select {
				case client.send <- message:
				default:
					close(client.send)
					delete(h.clients, client)
				}
			}
			h.mu.RUnlock()
		}
	}
}

// BroadcastMessage marshals and sends a WSMessage envelope to all clients.
func (h *Hub) BroadcastMessage(msg api.WSMessage) {
	bytes, err := json.Marshal(msg)
	if err != nil {
		fmt.Printf("[error] Failed to marshal WSMessage for broadcast: %v\n", err)
		return
	}
	h.broadcast <- bytes
}

// ServeWS handles HTTP requests for WebSocket upgrades.
func (h *Hub) ServeWS(w http.ResponseWriter, r *http.Request) {
	conn, err := upgrader.Upgrade(w, r, nil)
	if err != nil {
		fmt.Printf("[error] WebSocket upgrade failed: %v\n", err)
		return
	}

	client := &Client{
		hub:  h,
		conn: conn,
		send: make(chan []byte, 256),
	}
	h.register <- client

	go client.writePump()
	go client.readPump()
}

func (c *Client) readPump() {
	defer func() {
		c.hub.unregister <- c
		c.conn.Close()
	}()

	for {
		_, message, err := c.conn.ReadMessage()
		if err != nil {
			break
		}

		// Handle Ping/Pong
		var incoming api.WSMessage
		if err := json.Unmarshal(message, &incoming); err == nil {
			if incoming.Type == api.TypePing {
				pongMsg := api.NewWSMessage(api.TypePong, "pong")
				bytes, _ := json.Marshal(pongMsg)
				c.send <- bytes
			}
		}
	}
}

func (c *Client) writePump() {
	defer func() {
		c.conn.Close()
	}()

	for {
		message, ok := <-c.send
		if !ok {
			// Hub closed the channel
			c.conn.WriteMessage(websocket.CloseMessage, []byte{})
			return
		}

		w, err := c.conn.NextWriter(websocket.TextMessage)
		if err != nil {
			return
		}
		w.Write(message)

		if err := w.Close(); err != nil {
			return
		}
	}
}
