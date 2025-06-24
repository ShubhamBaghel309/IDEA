import requests
import json

# Test the API endpoints
BASE_URL = "http://localhost:8000"

# First, let's check if the join endpoint works
class_code = "W_Q1XKPN"  # From the database check earlier

# Get a student token (we need to login first)
print("Testing join classroom functionality...")

# Try to join with the class code
headers = {
    "Authorization": "Bearer YOUR_STUDENT_TOKEN",  # Replace with actual token
    "Content-Type": "application/json"
}

try:
    response = requests.post(f"{BASE_URL}/classrooms/join/{class_code}", headers=headers)
    print(f"Join classroom response: {response.status_code}")
    if response.status_code != 200:
        print(f"Error: {response.text}")
    else:
        print(f"Success: {response.json()}")
except Exception as e:
    print(f"Request failed: {e}")

# Test getting classrooms
try:
    response = requests.get(f"{BASE_URL}/classrooms", headers=headers)
    print(f"Get classrooms response: {response.status_code}")
    if response.status_code == 200:
        classrooms = response.json()
        print(f"Found {len(classrooms)} classrooms")
        for classroom in classrooms:
            print(f"  - {classroom['name']} (Code: {classroom['class_code']})")
    else:
        print(f"Error: {response.text}")
except Exception as e:
    print(f"Request failed: {e}")
