@echo off
echo Starting AI Classroom Application...

echo Starting FastAPI backend...
cd "c:\Users\deshr\OneDrive\Desktop\study\GDSC2\GDSC SUBMISSION\GDSC"
start /B python app.py

echo Waiting for backend to start...
timeout /t 3 /nobreak

echo Starting React frontend...
cd "c:\Users\deshr\OneDrive\Desktop\study\GDSC2\GDSC SUBMISSION\GDSC\FRONTEND"
start /B npm run dev

echo Application started!
echo Backend API: http://localhost:8000
echo Frontend: http://localhost:5173
echo API Documentation: http://localhost:8000/docs

pause
