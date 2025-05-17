import subprocess

def stream_greetings(name):
    process = subprocess.Popen(
        ['node', 'index.js', name],
        stdout=subprocess.PIPE,
        stderr=subprocess.PIPE,
        text=True
    )

    # Read stdout line by line
    for line in process.stdout:
        try:
            data = line.strip()
            print("From TS:", data)
        except Exception as e:
            print("Error:", e)

    process.stdout.close()
    process.wait()

# Example usage
stream_greetings("Tiger")
