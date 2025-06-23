# 🎓 AI Teacher Assistant

![GDSC Solution Challenge](https://img.shields.io/badge/GDSC-Solution%20Challenge%202025-blue)
![SDG 4](https://img.shields.io/badge/SDG-4%20Quality%20Education-red)

An AI-powered classroom management system for automated assignment grading, plagiarism detection, and intelligent feedback generation using Google Gemini AI.

## 🚀 Features

- **AI-Powered Grading** - Automated assessment with detailed feedback
- **Plagiarism Detection** - AI content detection and similarity analysis
- **Multi-Format Support** - PDF, text, Python, C++, Java, JS, Jupyter notebooks
- **Classroom Management** - Teacher/student dashboards with analytics
- **Real-time Analysis** - Instant feedback and progress tracking

## 🛠️ Tech Stack

**Backend:** FastAPI, SQLAlchemy, Google Gemini AI, ChromaDB  
**Frontend:** React 18, TypeScript, Tailwind CSS, Vite  
**Database:** SQLite with vector storage

## ⚡ Quick Start

### Prerequisites
- Python 3.9+
- Node.js 18+
- Google Gemini API Key

### 🔧 Setup & Installation

1. **Clone the repository**
```bash
git clone <your-repo-url>
cd ai-teacher-assistant
```

2. **Environment Setup**
```bash
# Create .env file
echo "GOOGLE_API_KEY=your_gemini_api_key_here" > .env
echo "SECRET_KEY=your_jwt_secret_key" >> .env
```

3. **Backend Setup**
```bash
# Create virtual environment
python -m venv myenv

# Activate virtual environment
myenv\Scripts\activate          # Windows
source myenv/bin/activate       # Linux/Mac

# Install dependencies
pip install -r requirements.txt

# Start backend server
uvicorn app:app --host 0.0.0.0 --port 8000 --reload
```

4. **Frontend Setup** (New terminal)
```bash
# Navigate to frontend
cd FRONTEND

# Install dependencies
npm install

# Start development server
npm run dev
```

5. **Access Application**
- Frontend: http://localhost:3000
- Backend API: http://localhost:8000
- API Docs: http://localhost:8000/docs

## 🔗 Key API Endpoints

```http
# Public endpoints (no auth required)
POST /analyze-code-public        # Code analysis
POST /analyze-file-public        # File analysis
POST /check-text-assignment      # Text grading
POST /check-pdf-assignment       # PDF grading

# Authenticated endpoints
POST /auth/register              # User registration
POST /auth/login                 # User login
POST /classrooms/create          # Create classroom
POST /classrooms/join/{code}     # Join classroom
```

## 🧪 Testing

```bash
# Test backend API
curl -X GET "http://localhost:8000/health"

# Run test files
python test_api.py
python test_public_endpoints.py
```

## 📄 License

MIT License - Built for GDSC Solution Challenge 2025

---

**Empowering Quality Education through AI** 🎓✨
