"""Real loopback listener/close lifecycle; no Docker or Kubernetes required."""
import importlib.util
from pathlib import Path
import socket
import unittest

spec = importlib.util.spec_from_file_location("manual_lab_ports", Path(__file__).resolve().parents[2] / "scripts" / "manual_lab.py")
runner = importlib.util.module_from_spec(spec)
spec.loader.exec_module(runner)


class PortLifecycle(unittest.TestCase):
    def test_live_listener_is_never_free(self):
        with socket.socket() as server:
            server.setsockopt(socket.SOL_SOCKET, socket.SO_REUSEADDR, 1)
            server.bind(("127.0.0.1", 0))
            server.listen(1)
            self.assertFalse(runner.free_port(server.getsockname()[1]))

    def test_closed_go_style_connection_does_not_block_restart(self):
        with socket.socket() as server, socket.socket() as client:
            # Go's TCP listener sets SO_REUSEADDR. Its accepted connection can
            # leave TIME_WAIT after the app has stopped listening.
            server.setsockopt(socket.SOL_SOCKET, socket.SO_REUSEADDR, 1)
            server.bind(("127.0.0.1", 0))
            address = server.getsockname()
            server.listen(1)
            client.settimeout(2)
            client.connect(address)
            connection, _ = server.accept()
            with connection:
                connection.settimeout(2)
                connection.shutdown(socket.SHUT_WR)
                self.assertEqual(client.recv(1), b"")
                client.close()
                self.assertEqual(connection.recv(1), b"")
            server.close()
            self.assertTrue(runner.free_port(address[1]))


if __name__ == "__main__":
    unittest.main()
