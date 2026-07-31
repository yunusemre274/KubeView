import React, { useState, useEffect, useRef } from 'react'
import { Play, Pause, Trash2, Terminal, AlertTriangle, ShieldCheck, RefreshCw, Cpu, Layers } from 'lucide-react'

export default function PodLogViewer({ pod }) {
  const containers = pod?.containers || [{ name: 'app', image: 'nginx:alpine', status: 'Running' }]
  const [selectedContainer, setSelectedContainer] = useState(containers[0]?.name || 'app')
  const [logLines, setLogLines] = useState([])
  const [isPaused, setIsPaused] = useState(false)
  const [isAutoScrollPaused, setIsAutoScrollPaused] = useState(false)
  const [streamStatus, setStreamStatus] = useState('CONNECTING') // 'CONNECTING' | 'CONNECTED' | 'PAUSED' | 'CLOSED'

  const terminalRef = useRef(null)
  const wsRef = useRef(null)
  const isPausedRef = useRef(isPaused)
  const isAutoScrollPausedRef = useRef(isAutoScrollPaused)

  useEffect(() => {
    isPausedRef.current = isPaused
  }, [isPaused])

  useEffect(() => {
    isAutoScrollPausedRef.current = isAutoScrollPaused
  }, [isAutoScrollPaused])

  // Connect to WebSocket log stream on component mount or container change
  useEffect(() => {
    setLogLines([])
    setStreamStatus('CONNECTING')

    const host = window.location.hostname || 'localhost'
    const port = 8000
    const namespace = pod?.namespace || 'default'
    const podName = pod?.name || 'web-frontend-deploy-74b89'
    const wsUrl = `ws://${host}:${port}/api/v1/pods/logs/stream?pod=${encodeURIComponent(podName)}&namespace=${encodeURIComponent(namespace)}&container=${encodeURIComponent(selectedContainer)}&tailLines=150`

    let ws = null
    let mockInterval = null

    try {
      ws = new WebSocket(wsUrl)
      wsRef.current = ws

      ws.onopen = () => {
        setStreamStatus('CONNECTED')
      }

      ws.onmessage = (event) => {
        if (isPausedRef.current) return
        try {
          const data = JSON.parse(event.data)
          if (data.type === 'POD_LOG_CHUNK' && data.payload?.line) {
            appendLogLine(data.payload.line)
          }
        } catch (e) {
          if (typeof event.data === 'string') {
            appendLogLine(event.data)
          }
        }
      }

      ws.onerror = () => {
        // Fallback to client-side mock stream generator if backend WS is unreachable
        startMockLogStream()
      }

      ws.onclose = () => {
        if (streamStatus !== 'CLOSED') {
          setStreamStatus('CLOSED')
        }
      }
    } catch (e) {
      startMockLogStream()
    }

    function startMockLogStream() {
      setStreamStatus('CONNECTED')
      const mockInitial = [
        `${new Date(Date.now() - 300000).toISOString()} [INFO] Starting container '${selectedContainer}' in pod '${podName}'`,
        `${new Date(Date.now() - 240000).toISOString()} [INFO] Loading configuration from /etc/${selectedContainer}/config.yaml`,
        `${new Date(Date.now() - 180000).toISOString()} [INFO] HTTP Server started listening on port 8080`,
        `${new Date(Date.now() - 120000).toISOString()} [WARN] High memory usage detected: 82% of limit (420Mi/512Mi)`,
        `${new Date(Date.now() - 60000).toISOString()} [INFO] Health check GET /healthz 200 OK - 14ms`,
        `${new Date(Date.now() - 10000).toISOString()} [INFO] Ready to process incoming pod logs stream`
      ]
      setLogLines(mockInitial)

      let seq = 1
      mockInterval = setInterval(() => {
        if (isPausedRef.current) return
        seq++
        const timestamp = new Date().toISOString()
        let line = ''
        if (seq % 6 === 0) {
          line = `${timestamp} [WARN] Threshold warning: Connection queue capacity at ${75 + (seq % 20)}%`
        } else if (seq % 11 === 0) {
          line = `${timestamp} [ERROR] Database query timeout: Failed to acquire connection lock after 5000ms`
        } else {
          line = `${timestamp} [INFO] Processed task id=worker-${seq} status=COMPLETED duration=${10 + (seq % 15)}ms`
        }
        appendLogLine(line)
      }, 2200)
    }

    return () => {
      if (ws) {
        ws.close()
      }
      if (mockInterval) {
        clearInterval(mockInterval)
      }
    }
  }, [selectedContainer, pod?.name, pod?.namespace])

  const appendLogLine = (newLine) => {
    setLogLines((prev) => {
      const next = [...prev, newLine]
      // Max line limit: keep max 500 lines to prevent memory bloat
      if (next.length > 500) {
        return next.slice(next.length - 500)
      }
      return next
    })
  }

  // Auto-scroll effect
  useEffect(() => {
    if (!isAutoScrollPaused && terminalRef.current) {
      terminalRef.current.scrollTop = terminalRef.current.scrollHeight
    }
  }, [logLines, isAutoScrollPaused])

  // Detect user scroll up to pause auto-scroll
  const handleScroll = () => {
    if (!terminalRef.current) return
    const { scrollTop, scrollHeight, clientHeight } = terminalRef.current
    const isAtBottom = scrollHeight - (scrollTop + clientHeight) < 25
    if (isAtBottom && isAutoScrollPaused) {
      setIsAutoScrollPaused(false)
    } else if (!isAtBottom && !isAutoScrollPaused) {
      setIsAutoScrollPaused(true)
    }
  }

  const handleClearLogs = () => {
    setLogLines([])
  }

  const togglePause = () => {
    setIsPaused(!isPaused)
  }

  // Highlight log line based on keywords
  const formatLogLine = (line, idx) => {
    const isError = /ERROR|FATAL|EXCEPTION|FAIL|CrashLoopBackOff/i.test(line)
    const isWarn = /WARN|WARNING/i.test(line)

    return (
      <div
        key={idx}
        className={`px-2 py-0.5 whitespace-pre-wrap font-mono-tech text-[10.5px] leading-tight border-b border-slate-900/40 hover:bg-slate-900/60 ${
          isError
            ? 'text-red-300 bg-red-950/30 font-semibold'
            : isWarn
            ? 'text-amber-300 bg-amber-950/20'
            : 'text-slate-300'
        }`}
      >
        <span className="text-slate-500 mr-2 select-none text-[9.5px]">[{idx + 1}]</span>
        {line}
      </div>
    )
  }

  return (
    <div className="flex flex-col h-[420px] bg-slate-950 rounded-lg border border-slate-700/80 overflow-hidden shadow-2xl font-mono-tech">
      
      {/* 1. CONTAINER SELECTOR TAB BAR & CONTROL BUTTONS */}
      <div className="bg-slate-900 px-3 py-2 border-b border-slate-800 flex items-center justify-between gap-2 shrink-0">
        
        {/* Left: Container selector dropdown / tabs */}
        <div className="flex items-center gap-1.5 overflow-x-auto">
          <span className="text-[10px] text-slate-400 font-industrial tracking-wider flex items-center gap-1 shrink-0">
            <Layers className="w-3 h-3 text-sky-400" /> KONTEYNIR:
          </span>
          <div className="flex items-center gap-1">
            {containers.map((c) => (
              <button
                key={c.name}
                onClick={() => setSelectedContainer(c.name)}
                className={`text-[10px] px-2 py-0.5 rounded font-mono-tech transition ${
                  selectedContainer === c.name
                    ? 'bg-sky-500/20 text-sky-300 border border-sky-500/50 font-bold'
                    : 'bg-slate-800 text-slate-400 border border-slate-700 hover:text-slate-200'
                }`}
              >
                ● {c.name}
              </button>
            ))}
          </div>
        </div>

        {/* Right: Live Stream Status Indicator & Action Buttons */}
        <div className="flex items-center gap-1.5 shrink-0">
          <span className={`text-[9.5px] px-1.5 py-0.5 rounded font-bold flex items-center gap-1 border ${
            isPaused
              ? 'bg-amber-500/10 text-amber-300 border-amber-500/30'
              : streamStatus === 'CONNECTED'
              ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30'
              : 'bg-slate-800 text-slate-400 border-slate-700'
          }`}>
            <span className={`w-1.5 h-1.5 rounded-full ${isPaused ? 'bg-amber-400' : streamStatus === 'CONNECTED' ? 'bg-emerald-400 animate-pulse' : 'bg-slate-500'}`} />
            {isPaused ? 'DURAKLATILDI' : streamStatus === 'CONNECTED' ? 'CANLI AKIŞ' : 'BAĞLANILIYOR'}
          </span>

          <button
            onClick={togglePause}
            title={isPaused ? 'Akışı Devam Ettir' : 'Akışı Duraklat'}
            className={`p-1 rounded text-[10px] flex items-center gap-1 border transition ${
              isPaused
                ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40 hover:bg-emerald-500/30'
                : 'bg-amber-500/20 text-amber-300 border-amber-500/40 hover:bg-amber-500/30'
            }`}
          >
            {isPaused ? <Play className="w-3 h-3" /> : <Pause className="w-3 h-3" />}
          </button>

          <button
            onClick={handleClearLogs}
            title="Görünüm Loglarını Temizle"
            className="p-1 rounded text-[10px] bg-slate-800 text-slate-300 border border-slate-700 hover:bg-slate-700 hover:text-white"
          >
            <Trash2 className="w-3 h-3" />
          </button>
        </div>
      </div>

      {/* 2. AUTO-SCROLL PAUSE WARNING BADGE */}
      {isAutoScrollPaused && (
        <div className="bg-amber-500/20 text-amber-300 px-3 py-1 text-[10px] border-b border-amber-500/30 flex items-center justify-between shrink-0">
          <span className="flex items-center gap-1.5">
            <AlertTriangle className="w-3 h-3 text-amber-400" />
            Yukarı kaydırıldı — otomatik kaydırma duraklatıldı.
          </span>
          <button
            onClick={() => {
              setIsAutoScrollPaused(false)
              if (terminalRef.current) {
                terminalRef.current.scrollTop = terminalRef.current.scrollHeight
              }
            }}
            className="underline hover:text-white font-bold"
          >
            En alta in ⬇️
          </button>
        </div>
      )}

      {/* 3. TERMINAL LOG VIEWPORT */}
      <div
        ref={terminalRef}
        onScroll={handleScroll}
        className="flex-1 overflow-y-auto overflow-x-auto p-2 bg-slate-950 font-mono-tech select-text"
      >
        {logLines.length === 0 ? (
          <div className="h-full flex items-center justify-center text-slate-500 text-xs gap-2">
            <RefreshCw className="w-4 h-4 animate-spin text-sky-400" />
            <span>Konteynır logları bekleniyor...</span>
          </div>
        ) : (
          logLines.map((line, idx) => formatLogLine(line, idx))
        )}
      </div>

      {/* 4. FOOTER SUMMARY */}
      <div className="bg-slate-900 px-3 py-1 border-t border-slate-800 text-[9.5px] text-slate-400 flex justify-between items-center shrink-0">
        <span>Konteynır: <strong className="text-sky-300">{selectedContainer}</strong></span>
        <span>Toplam Satır: <strong className="text-emerald-400">{logLines.length}</strong> / 500 max</span>
      </div>
    </div>
  )
}
