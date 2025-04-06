import subprocess
import time
import webbrowser
import os
import threading
import signal
import sys

def run_fastapi():
    """Run the FastAPI backend server"""
    print("Starting FastAPI backend server...")
    # Using uvicorn directly as specified in app.py's __main__ block
    return subprocess.Popen(
        ["uvicorn", "app:app", "--host", "0.0.0.0", "--port", "8000", "--reload"],
        stdout=subprocess.PIPE,
        stderr=subprocess.STDOUT,
        text=True,
        bufsize=1,
        universal_newlines=True
    )

def run_streamlit():
    """Run the Streamlit frontend"""
    print("Starting Streamlit frontend...")
    return subprocess.Popen(
        ["streamlit", "run", "streamlit_app.py"],
        stdout=subprocess.PIPE,
        stderr=subprocess.STDOUT,
        text=True,
        bufsize=1,
        universal_newlines=True
    )

def log_output(process, app_name):
    """Log the output from a process with app name prefix"""
    for line in process.stdout:
        print(f"[{app_name}] {line.strip()}")

def signal_handler(sig, frame):
    """Handle Ctrl+C to gracefully shut down both servers"""
    print("\nShutting down servers...")
    if 'fastapi_process' in globals() and fastapi_process:
        fastapi_process.terminate()
    if 'streamlit_process' in globals() and streamlit_process:
        streamlit_process.terminate()
    sys.exit(0)

if __name__ == "__main__":
    # Register signal handler for Ctrl+C
    signal.signal(signal.SIGINT, signal_handler)

    # Start FastAPI backend
    fastapi_process = run_fastapi()
    # Start a thread to log FastAPI output
    fastapi_thread = threading.Thread(
        target=log_output, 
        args=(fastapi_process, "FastAPI"),
        daemon=True
    )
    fastapi_thread.start()

    # Give FastAPI a moment to start up
    time.sleep(2)

    # Start Streamlit frontend
    streamlit_process = run_streamlit()
    # Start a thread to log Streamlit output
    streamlit_thread = threading.Thread(
        target=log_output, 
        args=(streamlit_process, "Streamlit"),
        daemon=True
    )
    streamlit_thread.start()

    # Attempt to open browser automatically
    time.sleep(2)
    print("Opening browser to Streamlit frontend...")
    webbrowser.open('http://localhost:8501')

    print("\nServers are running!")
    print("FastAPI backend available at: http://localhost:8000")
    print("Streamlit frontend available at: http://localhost:8501")
    print("\nPress Ctrl+C to stop both servers.")

    # Keep the main thread alive
    try:
        while True:
            # Check if processes are still running
            if fastapi_process.poll() is not None:
                print("FastAPI backend crashed or stopped!")
                break
            if streamlit_process.poll() is not None:
                print("Streamlit frontend crashed or stopped!")
                break
            time.sleep(1)
    except KeyboardInterrupt:
        pass
    finally:
        # Cleanup
        if fastapi_process and fastapi_process.poll() is None:
            fastapi_process.terminate()
        if streamlit_process and streamlit_process.poll() is None:
            streamlit_process.terminate()