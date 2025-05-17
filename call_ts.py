import subprocess

def call_ts_greet(name):
    result = subprocess.run(
        ['node', 'index.js', name],
        capture_output=True,
        text=True
    )
    return result.stdout.strip()

greeting = call_ts_greet("Alice")
print(greeting)  # hello "Alice"
