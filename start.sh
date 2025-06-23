#!/bin/bash

# Script to start both backend and frontend for the AI Classroom app

echo "Starting AI Classroom Application..."

# Start the backend API
echo "Starting FastAPI backend..."
cd "c:\Users\deshr\OneDrive\Desktop\study\GDSC2\GDSC SUBMISSION\GDSC" && python app.py &

# Wait a moment for backend to start
sleep 3

# Start the frontend
echo "Starting React frontend..."
cd "c:\Users\deshr\OneDrive\Desktop\study\GDSC2\GDSC SUBMISSION\GDSC\FRONTEND" && npm run dev &

echo "Application started!"
echo "Backend API: http://localhost:8000"
echo "Frontend: http://localhost:5173"
echo "API Documentation: http://localhost:8000/docs"

wait
