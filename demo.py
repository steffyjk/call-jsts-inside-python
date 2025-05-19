import subprocess
import sys
import json
import threading
import queue
import time
from datetime import datetime

def enqueue_output(pipe, queue):
    for line in iter(pipe.readline, ''):
        queue.put(line)
    pipe.close()

def listen_realtime(username, password):
    process = subprocess.Popen(
        ['node', 'realtime.js', username, password],
        stdout=subprocess.PIPE,
        stderr=subprocess.PIPE,
        text=True,
        encoding="utf-8",
        errors="replace"
    )

    stdout_queue = queue.Queue()
    stderr_queue = queue.Queue()

    stdout_thread = threading.Thread(target=enqueue_output, args=(process.stdout, stdout_queue))
    stderr_thread = threading.Thread(target=enqueue_output, args=(process.stderr, stderr_queue))
    stdout_thread.daemon = True
    stderr_thread.daemon = True
    stdout_thread.start()
    stderr_thread.start()

    while True:
        # Process stdout lines
        try:
            while True:
                out_line = stdout_queue.get_nowait()
                out_line = out_line.strip()
                if out_line:
                    try:
                        data = json.loads(out_line)
                        print(f"{datetime.now()} 📡 IG Event:", json.dumps(data, indent=2))
                    except json.JSONDecodeError:
                        print(f"{datetime.now()} 📡 IG Output:", out_line)
        except queue.Empty:
            pass

        # Process stderr lines
        try:
            while True:
                err_line = stderr_queue.get_nowait()
                err_line = err_line.strip()
                if err_line:
                    # Filter out known warning to reduce noise
                    if "postLoginFlow warning" not in err_line and "preLoginFlow warning" not in err_line:
                        print(f"{datetime.now()} ❗ IG Error:", err_line)
        except queue.Empty:
            pass

        if process.poll() is not None:
            # If process exited and queues are empty, break
            if stdout_queue.empty() and stderr_queue.empty():
                break

        time.sleep(0.1)  # Small sleep to prevent busy waiting

    process.stdout.close()
    process.stderr.close()
    process.wait()

if __name__ == "__main__":
    print(f"{datetime.now()} Starting realtime Instagram listener for user: {"gd"}")
    listen_realtime("demo@gmail.com", "demo@e")
    print(f"{datetime.now()} Listener stopped.")
