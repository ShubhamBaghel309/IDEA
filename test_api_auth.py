import requests
import json

def test_auth_and_analysis():
    print("Testing API authentication and analysis endpoints...")
    
    # Test login first
    login_data = {
        'email': 'test@example.com',
        'password': 'testpassword'
    }
    
    try:
        response = requests.post('http://localhost:8000/auth/login', json=login_data)
        print(f'Login status: {response.status_code}')
        
        if response.status_code == 200:
            data = response.json()
            token = data.get('access_token')
            print(f'Token received: {bool(token)}')
            
            if token:
                # Test analyze-code with token
                headers = {'Authorization': f'Bearer {token}'}
                form_data = {
                    'code': 'print("hello world")', 
                    'language': 'python', 
                    'question': 'test code analysis'
                }
                
                analysis_response = requests.post(
                    'http://localhost:8000/analyze-code', 
                    data=form_data, 
                    headers=headers
                )
                print(f'Analysis status: {analysis_response.status_code}')
                
                if analysis_response.status_code == 200:
                    print('✓ Authentication and API working correctly')
                    result = analysis_response.json()
                    print(f'Analysis result keys: {list(result.keys())}')
                else:
                    print(f'✗ Analysis failed: {analysis_response.text}')
            else:
                print('✗ No token received')
        else:
            print(f'✗ Login failed: {response.text}')
            # Try to register a test user
            register_data = {
                'name': 'Test User',
                'email': 'test@example.com',
                'password': 'testpassword',
                'role': 'teacher'
            }
            reg_response = requests.post('http://localhost:8000/auth/register', json=register_data)
            print(f'Registration attempt: {reg_response.status_code}')
            if reg_response.status_code == 200:
                print('✓ User registered, testing analysis now...')
                # Retry login
                response = requests.post('http://localhost:8000/auth/login', json=login_data)
                if response.status_code == 200:
                    data = response.json()
                    token = data.get('access_token')
                    headers = {'Authorization': f'Bearer {token}'}
                    form_data = {
                        'code': 'print("hello world")', 
                        'language': 'python', 
                        'question': 'test code analysis'
                    }
                    analysis_response = requests.post(
                        'http://localhost:8000/analyze-code', 
                        data=form_data, 
                        headers=headers
                    )
                    print(f'Analysis after registration: {analysis_response.status_code}')
                    if analysis_response.status_code != 200:
                        print(f'Analysis error: {analysis_response.text}')
            
    except Exception as e:
        print(f'Error: {str(e)}')

if __name__ == "__main__":
    test_auth_and_analysis()
