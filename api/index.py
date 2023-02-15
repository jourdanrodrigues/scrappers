from http.server import BaseHTTPRequestHandler

from main import SyncEntries

class handler(BaseHTTPRequestHandler):
    def do_GET(self):
        self._handle_request()

    def do_POST(self):
        self._handle_request()

    def _handle_request(self):
        SyncEntries.sync()

        self.send_response(200)
        self.send_header('Content-type', 'text/plain')
        self.end_headers()
        self.wfile.write('Hello World!'.encode('utf-8'))
