# AI Teacher Assistant

An intelligent system that automatically grades and provides feedback on student assignments using AI models.

## Features

- **Text Assignment Grading**: Submit and automatically grade text-based assignments
- **PDF Assignment Grading**: Upload and grade PDF assignments
- **Plagiarism Detection**: Automatically checks submitted work for plagiarism
- **Detailed Feedback**: Get comprehensive feedback with analysis and improvement suggestions
- **Personalized Reports**: Generate complete assignment reports tailored to each student
- **Interactive Assistance**: One-on-one conversation with the AI teacher assistant
- **Vector Database Storage**: Assignments are stored in a vector database for knowledge retrieval
- **Research-Augmented Grading**: Integration with web search for enhanced grading accuracy

## Tech Stack

- **FastAPI**: Backend API framework
- **LangChain**: Framework for LLM application development
- **Google Gemini**: Primary LLM model for grading logic
- **Groq**: Optional fast inference engine
- **ChromaDB**: Vector database for storing assignments
- **LangGraph**: Workflow orchestration for multi-step reasoning
- **HuggingFace Embeddings**: Document embedding for vector search

## Setup

1. Clone the repository
2. Install dependencies:
   ```
   pip install -r requirements.txt
   ```
3. Set up environment variables:
   ```
   # Create a .env file with:
   GOOGLE_API_KEY=your_google_api_key
   GROQ_API_KEY=your_groq_api_key
   ```
4. Run the API:
   ```
   python app.py
   ```

## API Endpoints

### Check Text Assignment

```
POST /check-text-assignment
```

Request body:
```json
{
  "student_name": "John Doe",
  "question": "Explain the process of photosynthesis.",
  "answer": "Photosynthesis is the process by which...",
  "reference_material": "Optional reference material..."
}
```

### Check PDF Assignment

```
POST /check-pdf-assignment
```

Form data:
- `student_name`: Student name
- `assignment_instructions`: Assignment question/instructions
- `reference_material`: Optional reference material
- `pdf_file`: PDF file containing the student's work

### Health Check

```
GET /health
```

## How It Works

The assignment checker uses a workflow graph with three main steps:

1. **Research**: Searches for relevant information about the topic
2. **Analysis**: Performs detailed analysis of the student's answer
3. **Grading**: Assigns a grade and provides constructive feedback

The system uses vector embeddings to store assignments, allowing for efficient retrieval and comparison of similar assignments.

## Project Structure

- `app.py`: FastAPI application with API endpoints
- `AssignmentChecker.py`: Core logic for checking assignments
- `tutorial.ipynb`: Jupyter notebook for tutorials/examples
- `requirements.txt`: Project dependencies

## Requirements

See `requirements.txt` for complete dependencies.

## Future Improvements

- Integration with learning management systems
- Support for more file formats
- Enhanced plagiarism detection
- Student progress tracking
- Customizable grading rubrics
