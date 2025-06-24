import requests
import json

# Test the assignment upload functionality
def test_assignment_upload():
    base_url = "http://localhost:8000"
    
    # Test data
    teacher_credentials = {
        "email": "teacher@test.com",
        "password": "password123"
    }
    
    try:
        # Login as teacher
        login_response = requests.post(f"{base_url}/auth/login", json=teacher_credentials)
        if login_response.status_code == 200:
            token = login_response.json()["access_token"]
            print("✅ Teacher login successful")
            
            # Get classrooms
            headers = {"Authorization": f"Bearer {token}"}
            classrooms_response = requests.get(f"{base_url}/classrooms", headers=headers)
            
            if classrooms_response.status_code == 200:
                classrooms = classrooms_response.json()
                if classrooms:
                    classroom_id = classrooms[0]["id"]
                    print(f"✅ Found classroom with ID: {classroom_id}")
                    
                    # Test text assignment creation
                    assignment_data = {
                        "title": "Test Assignment",
                        "description": "This is a test assignment",
                        "instructions": "Please complete this assignment",
                        "max_points": 100,
                        "due_date": "2025-07-01T23:59:59.000Z"
                    }
                    
                    assignment_response = requests.post(
                        f"{base_url}/classrooms/{classroom_id}/assignments",
                        json=assignment_data,
                        headers=headers
                    )
                    
                    if assignment_response.status_code == 200:
                        print("✅ Text assignment created successfully")
                        assignment_id = assignment_response.json()["assignment_id"]
                        
                        # Get assignments to verify
                        get_assignments_response = requests.get(
                            f"{base_url}/classrooms/{classroom_id}/assignments",
                            headers=headers
                        )
                        
                        if get_assignments_response.status_code == 200:
                            assignments = get_assignments_response.json()
                            print(f"✅ Retrieved {len(assignments)} assignments")
                            for assignment in assignments:
                                print(f"   - {assignment['title']} (Type: {assignment.get('assignment_type', 'N/A')})")
                        
                    else:
                        print(f"❌ Failed to create assignment: {assignment_response.status_code}")
                        print(assignment_response.text)
                
                else:
                    print("❌ No classrooms found")
            else:
                print(f"❌ Failed to get classrooms: {classrooms_response.status_code}")
        
        else:
            print(f"❌ Teacher login failed: {login_response.status_code}")
            
    except requests.exceptions.ConnectionError:
        print("❌ Cannot connect to backend server. Make sure it's running on http://localhost:8000")
    except Exception as e:
        print(f"❌ Test failed with error: {e}")

if __name__ == "__main__":
    print("🧪 Testing Assignment Upload Functionality...")
    test_assignment_upload()
