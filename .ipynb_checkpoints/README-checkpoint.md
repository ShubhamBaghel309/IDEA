# AI Teacher Assistant

![GDSC Solution Challenge](https://img.shields.io/badge/GDSC-Solution%20Challenge%202024-blue)
![SDG 4](https://img.shields.io/badge/SDG-4%20Quality%20Education-red)

## 📚 Project Overview

AI Teacher Assistant is an intelligent system designed to automate assignment grading and provide personalized feedback to students. By leveraging advanced AI technologies, we aim to reduce teacher workload while ensuring students receive timely, detailed, and constructive feedback on their work.

### 🎯 Addressing SDG 4: Quality Education

This project directly contributes to the UN Sustainable Development Goal 4 (Quality Education) by:

- Reducing teacher workload, enabling more time for personal interaction with students
- Providing equitable access to quality feedback for all students
- Enabling personalized learning at scale
- Making education more accessible and efficient

## ✨ Current Features

- **Intelligent Assignment Grading**: Automated assessment using Google's Gemini 2.5 Pro model
- **Multi-stage Assessment Pipeline**: Three-node workflow (research → analyze → grade)
- **Detailed Feedback Generation**: Numerical grades with structured, actionable feedback
- **Multiple Format Support**: Handles both text assignments and PDF submissions
- **Knowledge Storage**: Vector database (ChromaDB) for efficient assignment storage and retrieval

## 🚀 Planned Enhancements

### MVP Features (4-day Timeline)

1. **Complete Frontend UI**
   - Separate dashboards for teachers and students
   - Assignment creation workflow
   - Submission interface
   - Results visualization

2. **Plagiarism Detection**
   - Vector similarity comparison
   - Highlighted potentially plagiarized sections
   - Similarity percentage calculation

3. **Enhanced AI Grading**
   - Rubric-based assessment options
   - Confidence scores for evaluations
   - Teacher review/override capability

4. **User Authentication**
   - Login/registration for teachers and students
   - Assignment ownership and access control

### Advanced Features (1-month Timeline)

- **Voice Assistant Interface** using Google Text-to-Speech and Speech-to-Text
- **Advanced Plagiarism Detection** with external source checking
- **Learning Analytics Dashboard** to track progress and identify knowledge gaps
- **Collaborative Feedback** with peer review capabilities
- **LMS Integration** with Canvas, Google Classroom, and Moodle

## 🏗️ Technical Architecture

### Backend
- FastAPI for API endpoints
- LangGraph for AI workflow management
- Google Gemini AI for natural language processing
- ChromaDB for vector storage

### Frontend (In Development)
- React with Material UI for Google-like design language
- Data visualization components for feedback display
- Responsive design for mobile access

### Google Services Integration
- Gemini API for advanced language processing
- Firebase for authentication and real-time database
- Google Cloud Run for deployment
- Google Cloud Storage for file management

## 💻 Setup and Usage

### Prerequisites
- Python 3.9+
- Node.js (for frontend)
- Google API key (for Gemini access)

### Installation

1. Clone the repository
```bash
git clone https://github.com/yourusername/ai-teacher-assistant.git
cd ai-teacher-assistant
```

2. Install backend dependencies
```bash
pip install -r requirements.txt
```

3. Set up environment variables
```bash
# Create a .env file with your Google API key
echo "GOOGLE_API_KEY=your_api_key_here" > .env
```

4. Run the backend server
```bash
python app.py
```

5. Install and run frontend (in separate terminal)
```bash
cd frontend
npm install
npm start
```


## test cases

```bash
python -m pytest tests/ -v
```

## 📊 Implementation Plan

### Day 1: Frontend Development
- Create teacher and student dashboards
- Implement assignment creation interface
- Build submission form with better UX
- Design feedback display components

### Day 2: Enhanced AI Grading + Plagiarism Detection
- Implement rubric-based assessment
- Add vector similarity checking for plagiarism detection
- Create visualization for plagiarism results
- Add confidence scores to AI assessments

### Day 3: Integration & Authentication
- Set up Firebase authentication
- Connect frontend and backend
- Implement role-based access control
- Add data persistence

### Day 4: Testing, Deployment & Documentation
- Test the entire workflow
- Deploy to Google Cloud Run
- Create documentation
- Prepare demo for presentation

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## 📄 License

This project is licensed under the MIT License - see the LICENSE file for details.
