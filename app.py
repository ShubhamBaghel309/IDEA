import os
import uvicorn
from fastapi import FastAPI, File, UploadFile, Form, HTTPException
from fastapi.responses import JSONResponse
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import Optional, Dict, Any
from dotenv import load_dotenv
import logging
import io

# Import our AssignmentChecker
from AssignmentChecker import AssignmentChecker

# Load environment variables
load_dotenv()

# Setup logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Initialize AssignmentChecker with vector database
checker = AssignmentChecker(vector_db_dir="./vector_db")

# Initialize FastAPI
app = FastAPI(title="AI Teacher Assistant API")

# Add CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Update for production
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Define API models
class TextAssignmentRequest(BaseModel):
    student_name: str
    question: str
    answer: str
    reference_material: Optional[str] = ""

class AssignmentResponse(BaseModel):
    student_name: str
    grade: str
    feedback: str
    analysis: Optional[str] = None
    document_id: Optional[str] = None
    file_id: Optional[str] = None
    success: bool

@app.post("/check-text-assignment", response_model=AssignmentResponse)
async def check_text_assignment(request: TextAssignmentRequest):
    """
    Check a text-based assignment submission.
    """
    logger.info(f"Checking text assignment for student: {request.student_name}")
    
    try:
        result = checker.check_assignment(
            question=request.question,
            student_answer=request.answer,
            student_name=request.student_name,
            reference_material=request.reference_material
        )
        
        return AssignmentResponse(
            student_name=request.student_name,
            grade=result["grade"],
            feedback=result["feedback"],
            analysis=result.get("analysis", ""),
            document_id=result.get("document_id", ""),
            success=result.get("success", True)
        )
    
    except Exception as e:
        logger.error(f"Error checking assignment: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Error checking assignment: {str(e)}")

@app.post("/check-pdf-assignment", response_model=AssignmentResponse)
async def check_pdf_assignment(
    student_name: str = Form(...),
    assignment_instructions: str = Form(...),  # Changed from "question"
    reference_material: str = Form(""),
    pdf_file: UploadFile = File(...)
):
    """
    Check an assignment submitted as a PDF file.
    """
    if not pdf_file.filename.endswith('.pdf'):
        raise HTTPException(status_code=400, detail="File must be a PDF")
    
    logger.info(f"Checking PDF assignment for student: {student_name}")
    
    try:
        # Process the PDF file
        file_contents = await pdf_file.read()
        
        # Check the assignment using the PDF content
        result = checker.check_pdf_assignment(
            pdf_file=io.BytesIO(file_contents),
            assignment_instructions=assignment_instructions,  # Changed parameter name
            student_name=student_name,
            reference_material=reference_material
        )
        
        return AssignmentResponse(
            student_name=student_name,
            grade=result["grade"],
            feedback=result["feedback"],
            analysis=result.get("analysis", ""),
            document_id=result.get("document_id", ""),
            file_id=result.get("file_id", ""),
            success=result.get("success", True)
        )
    
    except Exception as e:
        logger.error(f"Error checking PDF assignment: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Error checking PDF assignment: {str(e)}")

@app.get("/health")
async def health_check():
    """Health check endpoint"""
    return {"status": "healthy", "vector_db": "connected"}

if __name__ == "__main__":
    uvicorn.run("app:app", host="0.0.0.0", port=8000, reload=True)