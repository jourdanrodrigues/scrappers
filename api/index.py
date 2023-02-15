from http.server import BaseHTTPRequestHandler

from main import SyncEntries

class handler(BaseHTTPRequestHandler):
    def do_GET(self):
        SyncEntries.sync()

        self.send_response(200)
        self.send_header('Content-type', 'text/plain')
        self.end_headers()
        self.wfile.write('Hello World!'.encode('utf-8'))
