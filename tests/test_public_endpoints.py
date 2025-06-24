import requests
import time

def wait_for_server(timeout=120):
    """Wait for server to be ready"""
    print("⏳ Waiting for server startup (AI models loading)...")
    for i in range(timeout):
        try:
            response = requests.get('http://localhost:8000/health', timeout=2)
            if response.status_code == 200:
                print("✅ Server ready!")
                return True
        except:
            pass
        if i % 10 == 0:  # Print every 10 seconds
            print(f"   Still waiting... ({i}s elapsed)")
        time.sleep(1)
    return False

def test_public_endpoints():
    print("🚀 Testing public API endpoints...")
    
    # Wait for server to be ready
    if not wait_for_server():
        print("❌ Server not ready, exiting")
        return
    
    print("\n📊 Testing endpoints...")
    
    # Test analyze-code-public
    try:
        response = requests.post('http://localhost:8000/analyze-code-public', data={
            'code': 'print("hello world")',
            'language': 'python',
            'question': 'Analyze this code',
            'student_name': 'Test Student'
        })
        print(f"analyze-code-public: Status {response.status_code}")
        if response.status_code == 200:
            print("✓ Code analysis endpoint working!")
        else:
            print(f"✗ Error: {response.text[:200]}")
    except Exception as e:
        print(f"✗ Error testing code endpoint: {e}")
    
    # Test analyze-file-public with a simple text file
    try:
        test_file_content = "def hello():\n    print('Hello World')\n\nhello()"
        files = {'file': ('test.py', test_file_content, 'text/plain')}
        data = {
            'question': 'Analyze this Python code',
            'student_name': 'Test Student'
        }
        
        response = requests.post('http://localhost:8000/analyze-file-public', 
                               files=files, data=data)
        print(f"analyze-file-public: Status {response.status_code}")
        if response.status_code == 200:
            print("✓ File analysis endpoint working!")
        else:
            print(f"✗ Error: {response.text[:200]}")
    except Exception as e:
        print(f"✗ Error testing file endpoint: {e}")

if __name__ == "__main__":
    print("🎯 AI Teacher Assistant - API Test Suite")
    print("📝 Note: First startup takes 60-120s for AI model loading")
    print("=" * 50)
    test_public_endpoints()
