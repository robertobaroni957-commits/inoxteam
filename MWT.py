import http.server
import socketserver
import os
import json
import sys
import mimetypes
import tkinter as tk
from tkinter import scrolledtext
import threading
import queue
import webbrowser
import subprocess
import winreg

# Determine the base directory for the executable or script
if getattr(sys, 'frozen', False):
    # We are running in a bundle, the executable's dir is what we want
    DIRECTORY = os.path.dirname(sys.executable)
else:
    # We are running in a normal Python environment
    DIRECTORY = os.path.dirname(os.path.abspath(__file__))

def get_default_browser_path():
    try:
        with winreg.OpenKey(winreg.HKEY_CURRENT_USER, r"Software\Microsoft\Windows\Shell\Associations\UrlAssociations\https\UserChoice") as key:
            prog_id = winreg.QueryValueEx(key, "ProgId")[0]
        with winreg.OpenKey(winreg.HKEY_CLASSES_ROOT, fr"{prog_id}\shell\open\command") as key:
            command = winreg.QueryValueEx(key, None)[0]
            parts = command.split('"')
            return parts[1] if len(parts) > 1 else command.split(' ')[0]
    except Exception as e:
        print(f"Could not determine default browser: {e}")
        return None

class Handler(http.server.SimpleHTTPRequestHandler):
    def __init__(self, *args, **kwargs):
        # Serve files from the application's base directory
        super().__init__(*args, directory=DIRECTORY, **kwargs)

    def do_GET(self):
        # --- API ENDPOINTS ---
        if self.path.startswith('/api/races'):
            print("="*40)
            print(f"RICHIESTA RICEVUTA: {self.path}")
            print(f"DIRECTORY DI BASE: {DIRECTORY}")
            
            gare_dir = os.path.join(DIRECTORY, 'gare')
            print(f"Percorso calcolato per la cartella 'gare': {gare_dir}")

            if not os.path.exists(gare_dir):
                print("!!! ERRORE: La cartella 'gare' non esiste al percorso calcolato.")
                self.send_error(404, "Cartella 'gare' non trovata.")
                return
            
            dir_contents = os.listdir(gare_dir)
            races_dirs = [d for d in dir_contents if os.path.isdir(os.path.join(gare_dir, d)) and d.isdigit()]
            races_dirs.sort(key=int)

            races_with_titles = []
            for race_id in races_dirs:
                details_path = os.path.join(gare_dir, race_id, 'event_details.json')
                title = f"Gara {race_id}" # Titolo di fallback
                try:
                    if os.path.exists(details_path):
                        with open(details_path, 'r', encoding='utf-8') as f:
                            details = json.load(f)
                            title = details.get('title', title)
                except Exception as e:
                    print(f"!!! ATTENZIONE: Impossibile leggere o processare il file '{details_path}'. Errore: {e}")

                races_with_titles.append({'id': race_id, 'title': title})
            
            print(f"Gare con titoli trovate: {races_with_titles}")

            self.send_response(200)
            self.send_header('Content-type', 'application/json')
            self.end_headers()
            self.wfile.write(json.dumps(races_with_titles).encode('utf-8'))
            print("Risposta JSON per /api/races inviata.")
            print("="*40)
            return

        elif self.path == '/api/config':
            self.send_response(200)
            self.send_header('Content-type', 'application/json')
            self.end_headers()
            config_path = os.path.join(DIRECTORY, 'config.json')
            if os.path.exists(config_path):
                with open(config_path, 'r', encoding='utf-8') as f:
                    self.wfile.write(f.read().encode('utf-8'))
            else:
                self.wfile.write(b'{}') # Return empty object if not found
            return

        elif self.path == '/api/health_check':
            self.send_response(200)
            self.send_header('Content-type', 'application/json')
            self.end_headers()
            self.wfile.write(json.dumps({'status': 'ok'}).encode('utf-8'))
            return
        
        elif self.path.startswith('/api/race/'):
            parts = self.path.split('/')
            if len(parts) == 5 and parts[2] == 'race' and parts[4] == 'classification':
                race_id = parts[3]
                file_path = os.path.join(DIRECTORY, 'gare', race_id, 'fin.json')
                if os.path.exists(file_path):
                    with open(file_path, 'r', encoding='utf-8') as f:
                        data = json.load(f)
                    self.send_response(200)
                    self.send_header('Content-type', 'application/json')
                    self.end_headers()
                    self.wfile.write(json.dumps(data).encode('utf-8'))
                else:
                    self.send_error(404, 'File di classifica non trovato.')
            else:
                self.send_error(400, 'Richiesta API non valida.')
            return
        
        # --- STATIC FILE SERVING ---
        # For all other paths (index.html, cumulative_results.json, etc.),
        # let the parent handler do its job. It will serve files from DIRECTORY.
        return super().do_GET()


# --- Funzioni Server ---

def start_server_thread(httpd_queue):
    """Avvia il server in un thread separato e mette l'oggetto httpd in una coda."""
    try:
        # We need a new handler class for each server instance to correctly set the directory
        class ThreadedHandler(Handler):
             pass

        socketserver.TCPServer.allow_reuse_address = True
        PORT = int(os.environ.get('PORT', 8000))
        HOST = '0.0.0.0'
        httpd = socketserver.TCPServer((HOST, PORT), ThreadedHandler)
        print(f"🚀 Server avviato su http://{HOST}:{PORT}")
        httpd_queue.put(httpd) # Metti il server nella coda per il thread principale
        httpd.serve_forever()
    except Exception as e:
        import traceback
        print(f"Errore fatale durante l'avvio del server: {e}")
        traceback.print_exc()
        httpd_queue.put(None)

# --- GUI Application ---

class ConsoleRedirector:
    """Un oggetto che reindirizza l'output della console a un widget di testo Tkinter."""
    def __init__(self, text_widget):
        self.text_widget = text_widget

    def write(self, s):
        self.text_widget.insert(tk.END, s)
        self.text_widget.see(tk.END)

    def flush(self):
        pass

def resource_path(relative_path):
    """ Get absolute path to resource, works for dev and for PyInstaller """
    try:
        # PyInstaller creates a temp folder and stores path in _MEIPASS
        base_path = sys._MEIPASS
    except Exception:
        base_path = os.path.abspath(".")

    return os.path.join(base_path, relative_path)

class App:
    def __init__(self, root):
        self.root = root
        self.root.title("Masters Winter Tour Ranking Manager")
        self.root.geometry("700x500")
        
        # Imposta l'icona della finestra
        try:
            icon_path = resource_path("icons8-ciclismo-su-pista-80.ico")
            self.root.iconbitmap(icon_path)
        except tk.TclError:
            print("Icona non trovata, verrà usata l'icona predefinita.")

        self.httpd = None
        self.server_thread = None
        self.httpd_queue = queue.Queue()
        self.browser_process = None

        # Frame per i controlli
        control_frame = tk.Frame(root, padx=10, pady=10)
        control_frame.pack(fill=tk.X)

        self.start_button = tk.Button(control_frame, text="Avvia Server", command=self.start_server)
        self.start_button.pack(side=tk.LEFT, padx=5)

        self.stop_button = tk.Button(control_frame, text="Ferma Server", command=self.stop_server, state=tk.DISABLED)
        self.stop_button.pack(side=tk.LEFT, padx=5)

        self.status_label = tk.Label(control_frame, text="Server non attivo.")
        self.status_label.pack(side=tk.LEFT, padx=10)

        # Finestra per i log di debug
        log_frame = tk.Frame(root, padx=10, pady=10)
        log_frame.pack(fill=tk.BOTH, expand=True)

        log_label = tk.Label(log_frame, text="Log del Server:")
        log_label.pack(anchor=tk.W)

        self.log_text = scrolledtext.ScrolledText(log_frame, wrap=tk.WORD, height=10)
        self.log_text.pack(fill=tk.BOTH, expand=True, pady=5)
        
        sys.stdout = ConsoleRedirector(self.log_text)
        sys.stderr = ConsoleRedirector(self.log_text)

        print("Benvenuto! Clicca 'Avvia Server' per iniziare.")
        self.root.protocol("WM_DELETE_WINDOW", self.on_closing)

    def start_server(self):
        print("\n--- AVVIO SERVER IN CORSO ---")
        self.start_button.config(state=tk.DISABLED)
        self.stop_button.config(state=tk.NORMAL)
        
        self.server_thread = threading.Thread(target=start_server_thread, args=(self.httpd_queue,))
        self.server_thread.daemon = True
        self.server_thread.start()

        self.root.after(100, self.check_queue)
    
    def check_queue(self):
        try:
            self.httpd = self.httpd_queue.get_nowait()
            if self.httpd:
                port = self.httpd.server_address[1]
                url = f"http://localhost:{port}"
                self.status_label.config(text=f"Server attivo su: {url}")
                print("Per visualizzare la classifica, apri il browser a questo indirizzo.")
                
                if sys.platform == "win32":
                    browser_path = get_default_browser_path()
                    if browser_path:
                        self.browser_process = subprocess.Popen([browser_path, url])
                    else:
                        webbrowser.open(url) # Fallback
                else:
                    webbrowser.open(url)
            else:
                self.status_label.config(text="Errore avvio server.")
                self.stop_server()
        except queue.Empty:
            self.root.after(100, self.check_queue)

    def stop_server(self):
        print("\n--- ARRESTO SERVER IN CORSO ---")
        if self.httpd:
            shutdown_thread = threading.Thread(target=self.httpd.shutdown)
            shutdown_thread.daemon = True
            shutdown_thread.start()
            self.httpd = None

        if self.browser_process:
            self.browser_process.terminate()
            self.browser_process = None

        self.start_button.config(state=tk.NORMAL)
        self.stop_button.config(state=tk.DISABLED)
        self.status_label.config(text="Server non attivo.")
        print("✅ Server fermato correttamente.")

    def on_closing(self):
        if self.httpd:
            self.stop_server()
        self.root.destroy()

if __name__ == "__main__":
    root = tk.Tk()
    app = App(root)
    root.mainloop()