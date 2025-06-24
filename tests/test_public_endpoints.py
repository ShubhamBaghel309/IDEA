import requests

def test_public_endpoints():
    print("Testing public API endpoints...")
    
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
    test_public_endpoints()
