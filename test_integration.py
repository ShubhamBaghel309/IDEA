#!/usr/bin/env python3
"""
Integration test script to verify frontend-backend connectivity
"""

import requests
import json
import time

# Test configuration
BACKEND_URL = "http://localhost:8000"
FRONTEND_URL = "http://localhost:8080"

def test_backend_health():
    """Test if backend is responding"""
    try:
        response = requests.get(f"{BACKEND_URL}/health", timeout=5)
        if response.status_code == 200:
            print("✅ Backend health check: PASSED")
            print(f"   Response: {response.json()}")
            return True
        else:
            print(f"❌ Backend health check: FAILED (Status: {response.status_code})")
            return False
    except Exception as e:
        print(f"❌ Backend health check: FAILED (Error: {e})")
        return False

def test_frontend_accessibility():
    """Test if frontend is accessible"""
    try:
        response = requests.get(FRONTEND_URL, timeout=5)
        if response.status_code == 200:
            print("✅ Frontend accessibility: PASSED")
            return True
        else:
            print(f"❌ Frontend accessibility: FAILED (Status: {response.status_code})")
            return False
    except Exception as e:
        print(f"❌ Frontend accessibility: FAILED (Error: {e})")
        return False

def test_text_assignment_endpoint():
    """Test text assignment checking"""
    try:
        test_data = {
            "student_name": "Integration Test Student",
            "question": "What is the capital of France?",
            "answer": "The capital of France is Paris. It is a beautiful city known for its culture, art, and history.",
            "reference_material": "Paris is the capital and largest city of France."
        }
        
        response = requests.post(
            f"{BACKEND_URL}/check-text-assignment",
            json=test_data,
            timeout=30
        )
        
        if response.status_code == 200:
            result = response.json()
            print("✅ Text assignment endpoint: PASSED")
            print(f"   Grade: {result.get('grade', 'N/A')}")
            print(f"   Student: {result.get('student_name', 'N/A')}")
            print(f"   Success: {result.get('success', False)}")
            return True
        else:
            print(f"❌ Text assignment endpoint: FAILED (Status: {response.status_code})")
            print(f"   Response: {response.text}")
            return False
    except Exception as e:
        print(f"❌ Text assignment endpoint: FAILED (Error: {e})")
        return False

def test_code_analysis_endpoint():
    """Test code analysis endpoint"""
    try:
        test_code = '''
def hello_world():
    print("Hello, World!")
    return "Hello, World!"

if __name__ == "__main__":
    hello_world()
'''
        
        # Create form data
        data = {
            'code': test_code,
            'language': 'python',
            'question': 'Write a function that prints Hello World'
        }
        
        response = requests.post(
            f"{BACKEND_URL}/analyze-code",
            data=data,
            timeout=30
        )
        
        if response.status_code == 200:
            result = response.json()
            print("✅ Code analysis endpoint: PASSED")
            print(f"   Grade: {result.get('grade', 'N/A')}")
            print(f"   Analysis available: {bool(result.get('analysis'))}")
            return True
        else:
            print(f"❌ Code analysis endpoint: FAILED (Status: {response.status_code})")
            print(f"   Response: {response.text}")
            return False
    except Exception as e:
        print(f"❌ Code analysis endpoint: FAILED (Error: {e})")
        return False

def main():
    """Run all integration tests"""
    print("🚀 Starting AI Classroom Integration Tests")
    print("=" * 50)
    
    tests = [
        test_backend_health,
        test_frontend_accessibility,
        test_text_assignment_endpoint,
        test_code_analysis_endpoint
    ]
    
    passed = 0
    total = len(tests)
    
    for test in tests:
        try:
            if test():
                passed += 1
        except Exception as e:
            print(f"❌ Test failed with exception: {e}")
        print()  # Add spacing between tests
    
    print("=" * 50)
    print(f"🎯 Test Results: {passed}/{total} tests passed")
    
    if passed == total:
        print("🎉 ALL TESTS PASSED! Your AI Classroom is fully functional!")
        print("\n📋 What you can do now:")
        print("   1. Visit http://localhost:8080 to access the frontend")
        print("   2. Go to http://localhost:8080/upload-assignment to test assignment upload")
        print("   3. Try uploading different types of assignments (text, PDF, code)")
        print("   4. Check the AI grading and feedback functionality")
    else:
        print("⚠️  Some tests failed. Please check the issues above.")
    
    return passed == total

if __name__ == "__main__":
    main()
