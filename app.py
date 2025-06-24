import os
import uvicorn
import shutil
from fastapi import FastAPI, File, UploadFile, Form, HTTPException, Depends, status
from fastapi.responses import JSONResponse, FileResponse
from fastapi.middleware.cors import CORSMiddleware
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from pydantic import BaseModel
from typing import Optional, Dict, Any, List
from dotenv import load_dotenv
import logging
import io
import jwt
from datetime import datetime, timedelta
from passlib.context import CryptContext
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker, Session
import secrets
import json
from pathlib import Path

# Import our existing modules
from AssignmentChecker import AssignmentChecker
from assistant.core.plagiarism import calculate_plagiarism, analyze_ai_content, extract_text_from_docx, read_text_file
from models import Base, User, Classroom, Assignment, Submission, UserRole, AssignmentStatus, SubmissionStatus, ClassroomEnrollment

# Load environment variables
load_dotenv()

# Setup logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Database setup
DATABASE_URL = os.getenv("DATABASE_URL", "sqlite:///./classroom.db")
engine = create_engine(DATABASE_URL)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
Base.metadata.create_all(bind=engine)

# Security setup
SECRET_KEY = os.getenv("SECRET_KEY", secrets.token_urlsafe(32))
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 30
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")
security = HTTPBearer()

# Initialize AssignmentChecker lazily (only when needed)
checker = None

def get_checker():
    global checker
    if checker is None:
        print("🔄 Initializing AI models (first time only)...")
        checker = AssignmentChecker(vector_db_dir="./vector_db")
        print("✅ AI models loaded successfully!")
    return checker

# Initialize FastAPI
app = FastAPI(title="Assignment Analysis API")

# Add CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Allow all origins for now to debug
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Dependency to get database session
def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

# Authentication utilities
def verify_password(plain_password, hashed_password):
    return pwd_context.verify(plain_password, hashed_password)

def get_password_hash(password):
    return pwd_context.hash(password)

def create_access_token(data: dict, expires_delta: Optional[timedelta] = None):
    to_encode = data.copy()
    if expires_delta:
        expire = datetime.utcnow() + expires_delta
    else:
        expire = datetime.utcnow() + timedelta(minutes=15)
    to_encode.update({"exp": expire})
    encoded_jwt = jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)
    return encoded_jwt

async def get_current_user(credentials: HTTPAuthorizationCredentials = Depends(security), db: Session = Depends(get_db)):
    try:
        payload = jwt.decode(credentials.credentials, SECRET_KEY, algorithms=[ALGORITHM])
        email: str = payload.get("sub")
        if email is None:
            raise HTTPException(status_code=401, detail="Invalid authentication credentials")
    except jwt.PyJWTError:
        raise HTTPException(status_code=401, detail="Invalid authentication credentials")
    
    user = db.query(User).filter(User.email == email).first()
    if user is None:
        raise HTTPException(status_code=401, detail="User not found")
    return user

# Pydantic models
class UserCreate(BaseModel):
    email: str
    name: str
    password: str
    role: UserRole

class UserLogin(BaseModel):
    email: str
    password: str

class Token(BaseModel):
    access_token: str
    token_type: str
    user: Dict[str, Any]

class ClassroomCreate(BaseModel):
    name: str
    description: Optional[str] = ""

class AssignmentCreate(BaseModel):
    title: str
    description: str
    instructions: Optional[str] = ""
    max_points: Optional[float] = 100.0
    due_date: Optional[datetime] = None
    allowed_file_types: Optional[List[str]] = ["pdf", "txt", "py", "cpp", "ipynb", "java", "js"]
    max_file_size_mb: Optional[int] = 10

class TextAssignmentRequest(BaseModel):
    student_name: str
    question: str
    answer: str
    reference_material: Optional[str] = ""

class PlagiarismResult(BaseModel):
    score: float
    ai_generated: bool
    ai_analysis: Dict[str, Any]
    similarity_scores: List[float]

class AssignmentResponse(BaseModel):
    student_name: str
    grade: str
    feedback: str
    analysis: str
    document_id: Optional[str] = ""
    file_id: Optional[str] = ""
    plagiarism: Optional[PlagiarismResult] = None
    file_analysis: Optional[Dict[str, Any]] = {}
    optimized_solutions: Optional[List[Dict[str, Any]]] = []
    success: bool

class FileChecker:
    """Enhanced file checker for multiple programming languages and formats"""
    
    SUPPORTED_EXTENSIONS = {
        'python': ['.py', '.ipynb'],
        'cpp': ['.cpp', '.c', '.cc', '.cxx', '.h', '.hpp'],
        'java': ['.java'],
        'javascript': ['.js', '.jsx', '.ts', '.tsx'],
        'documents': ['.pdf', '.txt', '.docx', '.md'],
        'data': ['.csv', '.json', '.xml'],
        'web': ['.html', '.css']
    }
    
    @staticmethod
    def extract_code_content(file_content: bytes, file_extension: str) -> str:
        """Extract content from various file types"""
        try:
            if file_extension == '.ipynb':
                # Handle Jupyter notebooks
                import json
                notebook = json.loads(file_content.decode('utf-8'))
                content = ""
                for cell in notebook.get('cells', []):
                    if cell.get('cell_type') == 'code':
                        content += '\n'.join(cell.get('source', []))
                    elif cell.get('cell_type') == 'markdown':
                        content += '\n'.join(cell.get('source', []))
                return content
            
            elif file_extension in ['.py', '.cpp', '.c', '.java', '.js', '.html', '.css', '.txt', '.md']:
                # Handle text-based files
                return file_content.decode('utf-8')
            
            elif file_extension == '.pdf':
                # Handle PDF files
                from PyPDF2 import PdfReader
                reader = PdfReader(io.BytesIO(file_content))
                text = ""
                for page in reader.pages:
                    text += page.extract_text()
                return text
            
            elif file_extension == '.docx':
                # Handle Word documents
                return extract_text_from_docx(io.BytesIO(file_content))
            
            else:
                return file_content.decode('utf-8', errors='ignore')
                
        except Exception as e:
            logger.error(f"Error extracting content from {file_extension}: {str(e)}")
            return ""

# Add these new models after the existing Pydantic models
class RefreshToken(BaseModel):
    refresh_token: str

class TokenResponse(BaseModel):
    access_token: str
    refresh_token: str
    token_type: str
    user: Dict[str, Any]

class FileSubmission(BaseModel):
    file_name: str
    file_type: str
    content: str
    size: int

class MultiFileSubmission(BaseModel):
    files: List[FileSubmission]
    text_content: Optional[str] = None
    submission_notes: Optional[str] = None

class GradingCriteria(BaseModel):
    criteria_name: str
    weight: float
    description: str
    max_points: float

class AIFeedback(BaseModel):
    score: float
    feedback: str
    suggestions: List[str]
    code_quality: Optional[Dict[str, Any]]
    plagiarism_score: Optional[float]
    ai_generated_probability: Optional[float]

class ClassroomAnalytics(BaseModel):
    total_students: int
    total_assignments: int
    average_grade: float
    submission_rate: float
    top_performers: List[Dict[str, Any]]
    recent_activity: List[Dict[str, Any]]
    assignment_completion: Dict[str, float]
    grade_distribution: Dict[str, int]

class StudentProgress(BaseModel):
    student_id: int
    student_name: str
    completed_assignments: int
    total_assignments: int
    average_grade: float
    recent_submissions: List[Dict[str, Any]]
    grade_trend: List[Dict[str, Any]]
    attendance_rate: float

# Add these new functions after the existing authentication utilities
def create_refresh_token(data: dict):
    to_encode = data.copy()
    expire = datetime.utcnow() + timedelta(days=7)  # Refresh tokens last 7 days
    to_encode.update({"exp": expire, "type": "refresh"})
    return jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)

def verify_refresh_token(token: str):
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        if payload.get("type") != "refresh":
            raise HTTPException(status_code=401, detail="Invalid token type")
        return payload
    except jwt.PyJWTError:
        raise HTTPException(status_code=401, detail="Invalid refresh token")

# Authentication endpoints
@app.post("/auth/register", response_model=TokenResponse)
async def register(user: UserCreate, db: Session = Depends(get_db)):
    if db.query(User).filter(User.email == user.email).first():
        raise HTTPException(status_code=400, detail="Email already registered")
    
    hashed_password = get_password_hash(user.password)
    db_user = User(
        email=user.email,
        name=user.name,
        role=user.role,
        hashed_password=hashed_password
    )
    db.add(db_user)
    db.commit()
    db.refresh(db_user)
    
    access_token_expires = timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    access_token = create_access_token(
        data={"sub": user.email}, expires_delta=access_token_expires
    )
    refresh_token = create_refresh_token(data={"sub": user.email})
    
    return TokenResponse(
        access_token=access_token,
        refresh_token=refresh_token,
        token_type="bearer",
        user={
            "id": db_user.id,
            "email": db_user.email,
            "name": db_user.name,
            "role": db_user.role.value
        }
    )

@app.post("/auth/login", response_model=TokenResponse)
async def login(user: UserLogin, db: Session = Depends(get_db)):
    db_user = db.query(User).filter(User.email == user.email).first()
    if not db_user or not verify_password(user.password, db_user.hashed_password):
        raise HTTPException(status_code=401, detail="Incorrect email or password")
    
    access_token_expires = timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    access_token = create_access_token(
        data={"sub": user.email}, expires_delta=access_token_expires
    )
    refresh_token = create_refresh_token(data={"sub": user.email})
    
    return TokenResponse(
        access_token=access_token,
        refresh_token=refresh_token,
        token_type="bearer",
        user={
            "id": db_user.id,
            "email": db_user.email,
            "name": db_user.name,
            "role": db_user.role.value
        }
    )

# Add refresh token endpoint
@app.post("/auth/refresh", response_model=TokenResponse)
async def refresh_token(refresh_token: RefreshToken, db: Session = Depends(get_db)):
    try:
        payload = verify_refresh_token(refresh_token.refresh_token)
        email = payload.get("sub")
        if email is None:
            raise HTTPException(status_code=401, detail="Invalid refresh token")
        
        user = db.query(User).filter(User.email == email).first()
        if user is None:
            raise HTTPException(status_code=401, detail="User not found")
        
        access_token_expires = timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
        access_token = create_access_token(
            data={"sub": email}, expires_delta=access_token_expires
        )
        new_refresh_token = create_refresh_token(data={"sub": email})
        
        return TokenResponse(
            access_token=access_token,
            refresh_token=new_refresh_token,
            token_type="bearer",
            user={
                "id": user.id,
                "email": user.email,
                "name": user.name,
                "role": user.role.value
            }
        )
    except Exception as e:
        raise HTTPException(status_code=401, detail=str(e))

# Add password reset request endpoint
@app.post("/auth/password-reset-request")
async def request_password_reset(email: str, db: Session = Depends(get_db)):
    user = db.query(User).filter(User.email == email).first()
    if user:
        # In a real application, you would:
        # 1. Generate a password reset token
        # 2. Store it in the database with an expiration
        # 3. Send an email with a reset link
        # For now, we'll just return a success message
        return {"message": "If an account exists with this email, you will receive a password reset link"}
    return {"message": "If an account exists with this email, you will receive a password reset link"}

# Add password reset endpoint
@app.post("/auth/password-reset")
async def reset_password(token: str, new_password: str, db: Session = Depends(get_db)):
    try:
        # In a real application, you would:
        # 1. Verify the token from the database
        # 2. Check if it's expired
        # 3. Update the password
        # For now, we'll just return a success message
        return {"message": "Password has been reset successfully"}
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

# Classroom endpoints
@app.post("/classrooms/create")
async def create_classroom(
    classroom: ClassroomCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    if current_user.role != UserRole.TEACHER:
        raise HTTPException(status_code=403, detail="Only teachers can create classrooms")
    
    # Generate unique class code
    class_code = secrets.token_urlsafe(8)[:8].upper()
    
    db_classroom = Classroom(
        name=classroom.name,
        description=classroom.description,
        class_code=class_code,
        teacher_id=current_user.id
    )
    db.add(db_classroom)
    db.commit()
    db.refresh(db_classroom)
    
    return {"classroom_id": db_classroom.id, "class_code": class_code}

@app.post("/classrooms/{classroom_id}/assignments")
async def create_assignment(
    classroom_id: int,
    assignment: AssignmentCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    if current_user.role != UserRole.TEACHER:
        raise HTTPException(status_code=403, detail="Only teachers can create assignments")
    
    # Verify classroom ownership
    classroom = db.query(Classroom).filter(
        Classroom.id == classroom_id,
        Classroom.teacher_id == current_user.id
    ).first()
    if not classroom:
        raise HTTPException(status_code=404, detail="Classroom not found")
    
    db_assignment = Assignment(
        title=assignment.title,
        description=assignment.description,
        instructions=assignment.instructions,
        max_points=assignment.max_points,
        due_date=assignment.due_date,
        classroom_id=classroom_id,
        teacher_id=current_user.id,
        assignment_type="text",  # Default to text for regular assignments
        allowed_file_types=json.dumps(assignment.allowed_file_types),
        max_file_size_mb=assignment.max_file_size_mb,
        status=AssignmentStatus.PUBLISHED  # Auto-publish text assignments
    )
    db.add(db_assignment)
    db.commit()
    db.refresh(db_assignment)
    
    return {"assignment_id": db_assignment.id}

@app.post("/classrooms/{classroom_id}/assignments/upload")
async def create_assignment_with_file(
    classroom_id: int,
    title: str = Form(...),
    description: str = Form(...),
    instructions: str = Form(""),
    max_points: float = Form(100.0),
    due_date: Optional[str] = Form(None),
    assignment_type: str = Form("file"),  # "file" or "generated"
    file: Optional[UploadFile] = File(None),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    if current_user.role != UserRole.TEACHER:
        raise HTTPException(status_code=403, detail="Only teachers can create assignments")
    
    # Verify classroom ownership
    classroom = db.query(Classroom).filter(
        Classroom.id == classroom_id,
        Classroom.teacher_id == current_user.id
    ).first()
    if not classroom:
        raise HTTPException(status_code=404, detail="Classroom not found")
    
    # Parse due_date if provided
    parsed_due_date = None
    if due_date:
        try:
            parsed_due_date = datetime.fromisoformat(due_date.replace('Z', '+00:00'))
        except ValueError:
            raise HTTPException(status_code=400, detail="Invalid due_date format")
    
    file_path = None
    file_name = None
    
    # Handle file upload if provided
    if file and assignment_type == "file":
        # Create uploads directory if it doesn't exist
        upload_dir = Path("uploads/assignments")
        upload_dir.mkdir(parents=True, exist_ok=True)
        
        # Generate unique filename
        file_extension = file.filename.split('.')[-1] if '.' in file.filename else ''
        unique_filename = f"{secrets.token_urlsafe(16)}.{file_extension}"
        file_path = str(upload_dir / unique_filename)
        file_name = file.filename
        
        # Save file
        try:
            with open(file_path, "wb") as buffer:
                shutil.copyfileobj(file.file, buffer)
        except Exception as e:
            raise HTTPException(status_code=500, detail=f"Failed to save file: {str(e)}")
    
    # Create assignment
    db_assignment = Assignment(
        title=title,
        description=description,
        instructions=instructions,
        max_points=max_points,
        due_date=parsed_due_date,
        classroom_id=classroom_id,
        teacher_id=current_user.id,
        assignment_type=assignment_type,
        file_name=file_name,
        file_path=file_path,
        allowed_file_types=json.dumps(["pdf", "txt", "py", "cpp", "ipynb", "java", "js"]),
        max_file_size_mb=10,        status=AssignmentStatus.PUBLISHED  # Auto-publish uploaded assignments
    )
    db.add(db_assignment)
    db.commit()
    db.refresh(db_assignment)
    
    return {
        "assignment_id": db_assignment.id,
        "message": "Assignment created successfully",
        "assignment_type": assignment_type,
        "file_uploaded": file is not None
    }

@app.get("/assignments/{assignment_id}/download")
async def download_assignment_file(
    assignment_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    # Get assignment
    assignment = db.query(Assignment).filter(Assignment.id == assignment_id).first()
    if not assignment:
        raise HTTPException(status_code=404, detail="Assignment not found")
    
    # Verify access (students must be enrolled, teachers must own the assignment)
    if current_user.role == UserRole.TEACHER and assignment.teacher_id != current_user.id:
        raise HTTPException(status_code=403, detail="Not your assignment")
    elif current_user.role == UserRole.STUDENT:
        enrollment = db.query(ClassroomEnrollment).filter(
            ClassroomEnrollment.classroom_id == assignment.classroom_id,
            ClassroomEnrollment.user_id == current_user.id
        ).first()
        if not enrollment:
            raise HTTPException(status_code=403, detail="Not enrolled in this classroom")
    
    # Check if assignment has a file
    if not assignment.file_path or not assignment.file_name:
        raise HTTPException(status_code=404, detail="No file attached to this assignment")
    
    # Check if file exists
    if not os.path.exists(assignment.file_path):
        raise HTTPException(status_code=404, detail="Assignment file not found")
    
    # Return file
    return FileResponse(
        path=assignment.file_path,
        filename=assignment.file_name,
        media_type='application/octet-stream'
    )

@app.post("/assignments/{assignment_id}/submit")
async def submit_assignment(
    assignment_id: int,
    submission: MultiFileSubmission,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    # Verify assignment exists and is active
    assignment = db.query(Assignment).filter(Assignment.id == assignment_id).first()
    if not assignment:
        raise HTTPException(status_code=404, detail="Assignment not found")
    
    if assignment.status != AssignmentStatus.ACTIVE:
        raise HTTPException(status_code=400, detail="Assignment is not active")
    
    # Check if user has already submitted
    existing_submission = db.query(Submission).filter(
        Submission.assignment_id == assignment_id,
        Submission.student_id == current_user.id
    ).first()
    
    if existing_submission:
        raise HTTPException(status_code=400, detail="You have already submitted this assignment")
    
    # Process each file
    processed_files = []
    for file in submission.files:
        # Validate file type
        if file.file_type not in assignment.allowed_file_types:
            raise HTTPException(
                status_code=400,
                detail=f"File type {file.file_type} is not allowed for this assignment"
            )
        
        # Validate file size
        if file.size > assignment.max_file_size_mb * 1024 * 1024:
            raise HTTPException(
                status_code=400,
                detail=f"File {file.file_name} exceeds maximum size of {assignment.max_file_size_mb}MB"
            )
        
        # Process file based on type
        if file.file_type in ['py', 'cpp', 'java', 'js']:
            # Code analysis
            code_analysis = await analyze_code(
                code=file.content,
                language=file.file_type,
                question=assignment.instructions
            )
            processed_files.append({
                "file_name": file.file_name,
                "analysis": code_analysis
            })
        elif file.file_type == 'ipynb':
            # Jupyter notebook analysis
            notebook_analysis = await analyze_jupyter(
                notebook_content=file.content,
                assignment_title=assignment.title
            )
            processed_files.append({
                "file_name": file.file_name,
                "analysis": notebook_analysis
            })
        elif file.file_type in ['pdf', 'txt', 'docx']:
            # Document analysis
            doc_analysis = await analyze_file(
                file_content=file.content,
                file_type=file.file_type,
                question=assignment.instructions
            )
            processed_files.append({
                "file_name": file.file_name,
                "analysis": doc_analysis
            })
    
    # Generate AI feedback
    ai_feedback = await generate_ai_feedback(
        assignment=assignment,
        submission=submission,
        processed_files=processed_files
    )
    
    # Create submission record
    db_submission = Submission(
        assignment_id=assignment_id,
        student_id=current_user.id,
        status=SubmissionStatus.SUBMITTED,
        submission_data={
            "files": [f.dict() for f in submission.files],
            "text_content": submission.text_content,
            "submission_notes": submission.submission_notes,
            "processed_files": processed_files,
            "ai_feedback": ai_feedback.dict()
        }
    )
    
    db.add(db_submission)
    db.commit()
    db.refresh(db_submission)
    
    return {
        "submission_id": db_submission.id,
        "status": "submitted",
        "ai_feedback": ai_feedback
    }

async def generate_ai_feedback(
    assignment: Assignment,
    submission: MultiFileSubmission,
    processed_files: List[Dict[str, Any]]
) -> AIFeedback:
    """Generate comprehensive AI feedback for a submission"""
    
    # Initialize feedback components
    total_score = 0
    feedback_points = []
    suggestions = []
    code_quality = {}
    plagiarism_scores = []
    ai_generated_scores = []
    
    # Process each file
    for file, analysis in zip(submission.files, processed_files):
        if file.file_type in ['py', 'cpp', 'java', 'js']:
            # Code quality analysis
            code_quality[file.file_name] = analysis['analysis'].get('code_quality', {})
            
            # Add code-specific suggestions
            if 'suggestions' in analysis['analysis']:
                suggestions.extend(analysis['analysis']['suggestions'])
        
        # Check for plagiarism
        if 'plagiarism_score' in analysis['analysis']:
            plagiarism_scores.append(analysis['analysis']['plagiarism_score'])
        
        # Check for AI-generated content
        if 'ai_generated_probability' in analysis['analysis']:
            ai_generated_scores.append(analysis['analysis']['ai_generated_probability'])
        
        # Add to total score
        if 'score' in analysis['analysis']:
            total_score += analysis['analysis']['score']
    
    # Process text content if present
    if submission.text_content:
        text_analysis = await check_text_assignment(TextAssignmentRequest(
            student_name=submission.student_name,
            question=assignment.instructions,
            answer=submission.text_content,
            reference_material=assignment.reference_material
        ))
        
        if text_analysis.plagiarism:
            plagiarism_scores.append(text_analysis.plagiarism.score)
            ai_generated_scores.append(text_analysis.plagiarism.ai_generated)
        
        total_score += text_analysis.grade
    
    # Calculate final scores
    final_score = total_score / (len(processed_files) + (1 if submission.text_content else 0))
    avg_plagiarism = sum(plagiarism_scores) / len(plagiarism_scores) if plagiarism_scores else 0
    avg_ai_generated = sum(ai_generated_scores) / len(ai_generated_scores) if ai_generated_scores else 0
    
    # Generate overall feedback
    feedback = f"Overall Score: {final_score:.2f}/100\n\n"
    if suggestions:
        feedback += "Suggestions for Improvement:\n"
        for suggestion in suggestions:
            feedback += f"- {suggestion}\n"
    
    if avg_plagiarism > 0.6:  # 30% threshold
        feedback += f"\nPlagiarism Warning: {avg_plagiarism*100:.1f}% similarity detected\n"
    
    if avg_ai_generated > 0.7:  # 70% threshold
        feedback += f"\nAI Generation Warning: {avg_ai_generated*100:.1f}% probability of AI-generated content\n"
    
    return AIFeedback(
        score=final_score,
        feedback=feedback,
        suggestions=suggestions,
        code_quality=code_quality,
        plagiarism_score=avg_plagiarism,
        ai_generated_probability=avg_ai_generated
    )

@app.post("/check-text-assignment", response_model=AssignmentResponse)
async def check_text_assignment(request: TextAssignmentRequest):
    """
    Check a text-based assignment submission.
    """
    logger.info(f"Checking text assignment for student: {request.student_name}")
    
    try:
        # Step 1: Check for plagiarism and AI-generated content
        answer_text = request.answer
        
        # Create knowledge base from reference material if available
        knowledge_base_texts = []
        if request.reference_material:
            knowledge_base_texts.append(request.reference_material)
        
        # Get AI content analysis first (includes perplexity and burstiness)
        ai_analysis = analyze_ai_content(answer_text)
        ai_result_text = ai_analysis['result']
        
        # Now calculate plagiarism score (which also uses perplexity)
        plagiarism_score, similarity_scores = calculate_plagiarism(answer_text, knowledge_base_texts)
        
        # More aggressive AI detection logic - use OR instead of AND
        # Detect AI content if:
        # 1. The text pattern analysis suggests AI-generated content OR
        # 2. The statistical score is above our lowered threshold of 20%
        is_ai_generated = "AI Generated" in ai_result_text or plagiarism_score > 20
        
        # Log more detailed detection info
        logger.info(f"Detailed AI detection - Score: {plagiarism_score:.2f}%, AI result: {ai_result_text}, Final decision: {is_ai_generated}")
        
        # Create plagiarism result
        plagiarism_result = PlagiarismResult(
            score=plagiarism_score,
            ai_generated=is_ai_generated,
            ai_analysis=ai_analysis,
            similarity_scores=similarity_scores
        )
        
        logger.info(f"Plagiarism score: {plagiarism_score:.2f}%, AI-generated: {is_ai_generated}")
        
        # Step 2: Only proceed with assignment checking if not flagged as AI-generated with high plagiarism
        if is_ai_generated and plagiarism_score > 50:  # Lowered from 60 to catch more AI content
            # For highly suspicious content, return early with a warning
            return AssignmentResponse(
                student_name=request.student_name,
                grade="Failed",
                feedback="This submission appears to be generated by AI tools or contains significant plagiarism. Our analysis indicates unusual language patterns. Please submit original work.",
                analysis="Automatic grading skipped due to academic integrity concerns. The text demonstrates unusual perplexity and burstiness patterns consistent with AI-generated text.",
                plagiarism=plagiarism_result,
                success=False
            )
        
        # Step 3: Proceed with normal assignment checking
        result = get_checker().check_assignment(
            question=request.question,
            student_answer=request.answer,
            student_name=request.student_name,
            reference_material=request.reference_material
        )
        
        # Step 4: Return combined results with enhanced analysis
        return AssignmentResponse(
            student_name=request.student_name,
            grade=result["grade"],
            feedback=result["feedback"],
            analysis=result.get("analysis", ""),
            document_id=result.get("document_id", ""),
            plagiarism=plagiarism_result,
            file_analysis=result.get("file_analysis", {}),
            optimized_solutions=result.get("optimized_solutions", []),
            success=result.get("success", True)
        )
    
    except Exception as e:
        logger.error(f"Error checking assignment: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Error checking assignment: {str(e)}")

@app.post("/check-pdf-assignment", response_model=AssignmentResponse)
async def check_pdf_assignment(
    student_name: str = Form(...),
    assignment_prompt: str = Form(...),  # Changed from "assignment_instructions"
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
        # Step 1: Process the PDF file
        file_contents = await pdf_file.read()
        file_bytes = io.BytesIO(file_contents)
        
        # Extract text for plagiarism check
        from PyPDF2 import PdfReader
        reader = PdfReader(file_bytes)
        extracted_text = ""
        for page in reader.pages:
            extracted_text += page.extract_text()
        
        # Reset file pointer for assignment checker
        file_bytes.seek(0)
        
        # Step 2: Check for plagiarism and AI-generated content
        knowledge_base_texts = []
        if reference_material:
            knowledge_base_texts.append(reference_material)
        
        # Get AI content analysis first (includes perplexity and burstiness)
        ai_analysis = analyze_ai_content(extracted_text)
        ai_result_text = ai_analysis['result']
        
        # Now calculate plagiarism score (which also uses perplexity)
        plagiarism_score, similarity_scores = calculate_plagiarism(extracted_text, knowledge_base_texts)
        
        # More aggressive AI detection logic - use OR instead of AND
        # Detect AI content if:
        # 1. The text pattern analysis suggests AI-generated content OR
        # 2. The statistical score is above our lowered threshold of 20%
        is_ai_generated = "AI Generated" in ai_result_text or plagiarism_score > 20
        
        # Log more detailed detection info
        logger.info(f"Detailed AI detection - Score: {plagiarism_score:.2f}%, AI result: {ai_result_text}, Final decision: {is_ai_generated}")
        
        # Create plagiarism result
        plagiarism_result = PlagiarismResult(
            score=plagiarism_score,
            ai_generated=is_ai_generated,
            ai_analysis=ai_analysis,
            similarity_scores=similarity_scores
        )
        
        logger.info(f"Plagiarism score: {plagiarism_score:.2f}%, AI-generated: {is_ai_generated}")
        
        # Step 3: Only proceed with assignment checking if not flagged as AI-generated with high plagiarism
        if is_ai_generated and plagiarism_score > 50:  # Lowered from 60 to catch more AI content
            # For highly suspicious content, return early with a warning
            return AssignmentResponse(
                student_name=student_name,
                grade="Failed",
                feedback="This submission appears to be generated by AI tools or contains significant plagiarism. Our analysis indicates unusual language patterns. Please submit original work.",
                analysis="Automatic grading skipped due to academic integrity concerns. The text demonstrates unusual perplexity and burstiness patterns consistent with AI-generated text.",
                plagiarism=plagiarism_result,
                success=False
            )
        
        # Step 4: Proceed with normal assignment checking
        result = get_checker().check_pdf_assignment(
            pdf_file=file_bytes,
            assignment_prompt=assignment_prompt,  # Updated parameter name
            student_name=student_name,
            reference_material=reference_material
        )
        
        # Step 5: Return combined results with enhanced analysis
        return AssignmentResponse(
            student_name=student_name,
            grade=result["grade"],
            feedback=result["feedback"],
            analysis=result.get("analysis", ""),
            document_id=result.get("document_id", ""),
            file_id=result.get("file_id", ""),
            plagiarism=plagiarism_result,
            file_analysis=result.get("file_analysis", {}),
            optimized_solutions=result.get("optimized_solutions", []),
            success=result.get("success", True)
        )
    
    except Exception as e:
        logger.error(f"Error checking PDF assignment: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Error checking PDF assignment: {str(e)}")

# Enhanced File Analysis Endpoints

@app.post("/analyze-file")
async def analyze_file(
    file: UploadFile = File(...),
    question: str = Form(...),
    student_name: str = Form(""),
    current_user: User = Depends(get_current_user)
):
    """
    Analyze uploaded file with enhanced capabilities for different file types.
    Supports .py, .cpp, .ipynb, .txt, .pdf files with detailed analysis.
    """
    logger.info(f"Enhanced file analysis requested by {current_user.email} for file: {file.filename}")
    
    try:
        # Read file content
        content = await file.read()
        
        # Determine file type and process accordingly
        file_extension = Path(file.filename).suffix.lower()
        
        if file_extension == '.pdf':
            # Process PDF
            pdf_file = io.BytesIO(content)
            result = get_checker().check_pdf_assignment(
                pdf_file=pdf_file,
                assignment_prompt=question,
                student_name=student_name
            )
        else:
            # Process text-based files
            try:
                text_content = content.decode('utf-8')
            except UnicodeDecodeError:
                try:
                    text_content = content.decode('latin-1')
                except:
                    raise HTTPException(status_code=400, detail="Unable to decode file content")
            
            # Use enhanced assignment checker
            result = get_checker().check_assignment(
                question=question,
                student_answer=text_content,
                student_name=student_name
            )
        
        # Add file metadata to response
        response_data = {
            **result,
            "file_name": file.filename,
            "file_type": file_extension,
            "file_size": len(content)
        }
        
        return JSONResponse(content=response_data)
        
    except Exception as e:
        logger.error(f"Error in enhanced file analysis: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Error analyzing file: {str(e)}")

@app.post("/analyze-code")
async def analyze_code(
    code: str = Form(...),
    language: str = Form(...),
    question: str = Form(""),
    current_user: User = Depends(get_current_user)
):
    """
    Analyze code submissions with language-specific insights.
    Supports Python, C++, JavaScript, Java, and more.
    """
    logger.info(f"Code analysis requested by {current_user.email} for {language} code")
    
    try:
        # Create a comprehensive question for code analysis
        enhanced_question = f"""
        Code Analysis Task ({language}):
        {question}
        
        Please analyze this {language} code for:
        1. Syntax and structure
        2. Code quality and best practices
        3. Efficiency and optimization opportunities
        4. Educational value and learning demonstration
        """
        
        result = get_checker().check_assignment(
            question=enhanced_question,
            student_answer=code,
            student_name=current_user.name or current_user.email
        )
        
        # Add code-specific metadata
        response_data = {
            **result,
            "language": language,
            "code_length": len(code),
            "lines_of_code": len([line for line in code.split('\n') if line.strip()])
        }
        
        return JSONResponse(content=response_data)
        
    except Exception as e:
        logger.error(f"Error in code analysis: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Error analyzing code: {str(e)}")

@app.post("/analyze-jupyter")
async def analyze_jupyter(
    notebook_content: str = Form(...),
    assignment_title: str = Form(""),
    current_user: User = Depends(get_current_user)
):
    """
    Analyze Jupyter notebook submissions with cell-by-cell analysis.
    """
    logger.info(f"Jupyter notebook analysis requested by {current_user.email}")
    
    try:
        # Validate notebook content
        if not notebook_content.strip():
            raise HTTPException(status_code=400, detail="Notebook content is empty")
            
        try:
            # Parse notebook content to validate JSON format
            notebook = json.loads(notebook_content)
            if not isinstance(notebook, dict) or 'cells' not in notebook:
                raise ValueError("Invalid notebook format")
        except json.JSONDecodeError:
            raise HTTPException(status_code=400, detail="Invalid notebook format: Not a valid JSON")
        except ValueError as e:
            raise HTTPException(status_code=400, detail=str(e))

        enhanced_question = f"""
        Jupyter Notebook Analysis:
        Assignment: {assignment_title}
        
        Please analyze this Jupyter notebook for:
        1. Code quality in each cell
        2. Documentation and markdown explanations
        3. Data analysis methodology (if applicable)
        4. Overall educational structure and flow
        5. Results interpretation and conclusions
        """
        
        # Use the assignment checker to analyze the notebook
        result = get_checker().check_assignment(
            question=enhanced_question,
            student_answer=notebook_content,
            student_name=current_user.name or current_user.email
        )
        
        # Add notebook-specific metadata
        response_data = {
            **result,
            "file_type": "jupyter_notebook",
            "notebook_metadata": {
                "total_cells": len(notebook.get('cells', [])),
                "code_cells": sum(1 for cell in notebook.get('cells', []) if cell.get('cell_type') == 'code'),
                "markdown_cells": sum(1 for cell in notebook.get('cells', []) if cell.get('cell_type') == 'markdown')
            }
        }
        
        return JSONResponse(content=response_data)
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error in Jupyter analysis: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Error analyzing notebook: {str(e)}")

# Non-authenticated versions of analysis endpoints for public use
@app.post("/analyze-code-public")
async def analyze_code_public(
    code: str = Form(...),
    language: str = Form(...),
    question: str = Form(""),
    student_name: str = Form("Anonymous")
):
    """
    Analyze code submissions without authentication.
    Supports Python, C++, JavaScript, Java, and more.
    """
    logger.info(f"Public code analysis requested for {language} code")
    
    try:
        # Create a comprehensive question for code analysis
        enhanced_question = f"""
        Code Analysis Task ({language}):
        {question}
        
        Please analyze this {language} code for:
        1. Syntax and structure
        2. Code quality and best practices
        3. Efficiency and optimization opportunities
        4. Educational value and learning demonstration
        """
        
        result = get_checker().check_assignment(
            question=enhanced_question,
            student_answer=code,
            student_name=student_name
        )
        
        # Add code-specific metadata
        response_data = {
            **result,
            "language": language,
            "code_length": len(code),
            "lines_of_code": len([line for line in code.split('\n') if line.strip()])
        }
        
        return JSONResponse(content=response_data)
        
    except Exception as e:
        logger.error(f"Error in public code analysis: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Error analyzing code: {str(e)}")

@app.post("/analyze-file-public")
async def analyze_file_public(
    file: UploadFile = File(...),
    question: str = Form(...),
    student_name: str = Form("Anonymous")
):
    """
    Analyze uploaded file without authentication.
    Supports .py, .cpp, .ipynb, .txt, .pdf files with detailed analysis.
    """
    logger.info(f"Public file analysis requested for file: {file.filename}")
    
    try:
        # Read file content
        content = await file.read()
        
        # Determine file type and process accordingly
        file_extension = Path(file.filename).suffix.lower()
        
        if file_extension == '.pdf':
            # Process PDF
            pdf_file = io.BytesIO(content)
            result = get_checker().check_pdf_assignment(
                pdf_file=pdf_file,
                assignment_prompt=question,
                student_name=student_name
            )
        else:
            # Process text-based files
            try:
                text_content = content.decode('utf-8')
            except UnicodeDecodeError:
                try:
                    text_content = content.decode('latin-1')
                except:
                    raise HTTPException(status_code=400, detail="Unable to decode file content")
            
            # Use enhanced assignment checker
            result = get_checker().check_assignment(
                question=question,
                student_answer=text_content,
                student_name=student_name
            )
        
        # Add file metadata to response
        response_data = {
            **result,
            "file_name": file.filename,
            "file_type": file_extension,
            "file_size": len(content)
        }
        
        return JSONResponse(content=response_data)
        
    except Exception as e:
        logger.error(f"Error in public file analysis: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Error analyzing file: {str(e)}")

@app.post("/analyze-jupyter-public")
async def analyze_jupyter_public(
    notebook_content: str = Form(...),
    assignment_title: str = Form(""),
    student_name: str = Form("Anonymous")
):
    """
    Analyze Jupyter notebook submissions without authentication.
    """
    logger.info(f"Public Jupyter notebook analysis requested")
    
    try:
        # Validate notebook content
        if not notebook_content.strip():
            raise HTTPException(status_code=400, detail="Notebook content is empty")
            
        try:
            # Parse notebook content to validate JSON format
            notebook = json.loads(notebook_content)
            if not isinstance(notebook, dict) or 'cells' not in notebook:
                raise ValueError("Invalid notebook format")
        except json.JSONDecodeError:
            raise HTTPException(status_code=400, detail="Invalid notebook format: Not a valid JSON")
        except ValueError as e:
            raise HTTPException(status_code=400, detail=str(e))

        enhanced_question = f"""
        Jupyter Notebook Analysis:
        Assignment: {assignment_title}
        
        Please analyze this Jupyter notebook for:
        1. Code quality in each cell
        2. Documentation and markdown explanations
        3. Data analysis methodology (if applicable)
        4. Overall educational structure and flow
        5. Results interpretation and conclusions
        """
        
        # Use the assignment checker to analyze the notebook
        result = get_checker().check_assignment(
            question=enhanced_question,
            student_answer=notebook_content,
            student_name=student_name
        )
        
        # Add notebook-specific metadata
        response_data = {
            **result,
            "file_type": "jupyter_notebook",
            "notebook_metadata": {
                "total_cells": len(notebook.get('cells', [])),
                "code_cells": sum(1 for cell in notebook.get('cells', []) if cell.get('cell_type') == 'code'),
                "markdown_cells": sum(1 for cell in notebook.get('cells', []) if cell.get('cell_type') == 'markdown')
            }
        }
        
        return JSONResponse(content=response_data)
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error in public Jupyter analysis: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Error analyzing notebook: {str(e)}")

@app.get("/file-analysis/{file_type}/capabilities")
async def get_file_capabilities(file_type: str):
    """
    Get information about what analysis capabilities are available for different file types.
    """
    capabilities = {
        "python": {
            "syntax_analysis": True,
            "complexity_scoring": True,
            "best_practices": True,
            "optimization_suggestions": True,
            "ast_parsing": True
        },
        "cpp": {
            "syntax_analysis": True,
            "structure_analysis": True,
            "best_practices": True,
            "optimization_suggestions": True,
            "include_analysis": True
        },
        "jupyter": {
            "cell_analysis": True,
            "code_quality": True,
            "documentation_check": True,
            "data_analysis": True,
            "visualization_review": True
        },
        "pdf": {
            "text_extraction": True,
            "content_analysis": True,
            "structure_analysis": True,
            "plagiarism_check": True
        },
        "general": {
            "content_analysis": True,
            "subject_specific": True,
            "depth_scoring": True,
            "improvement_suggestions": True
        }
    }
    
    return capabilities.get(file_type.lower(), capabilities.get("general"))

# Additional API endpoints for frontend integration

# Get all classrooms for current user
@app.get("/classrooms")
async def get_classrooms(current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    if current_user.role == UserRole.TEACHER:
        # Teachers see their own classrooms
        classrooms = db.query(Classroom).filter(Classroom.teacher_id == current_user.id).all()
    else:
        # Students see enrolled classrooms
        enrollments = db.query(ClassroomEnrollment).filter(ClassroomEnrollment.user_id == current_user.id).all()
        classroom_ids = [e.classroom_id for e in enrollments]
        classrooms = db.query(Classroom).filter(Classroom.id.in_(classroom_ids)).all() if classroom_ids else []
    
    return classrooms

# Get specific classroom
@app.get("/classrooms/{classroom_id}")
async def get_classroom(classroom_id: int, current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    classroom = db.query(Classroom).filter(Classroom.id == classroom_id).first()
    if not classroom:
        raise HTTPException(status_code=404, detail="Classroom not found")
    
    # Check access
    if current_user.role == UserRole.TEACHER and classroom.teacher_id != current_user.id:
        raise HTTPException(status_code=403, detail="Not your classroom")
    elif current_user.role == UserRole.STUDENT:
        enrollment = db.query(ClassroomEnrollment).filter(
            ClassroomEnrollment.classroom_id == classroom_id,
            ClassroomEnrollment.user_id == current_user.id
        ).first()
        if not enrollment:
            raise HTTPException(status_code=403, detail="Not enrolled in this classroom")
    
    return classroom

# Join classroom with class code
@app.post("/classrooms/join/{class_code}")
async def join_classroom(class_code: str, current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    if current_user.role != UserRole.STUDENT:
        raise HTTPException(status_code=403, detail="Only students can join classrooms")
    
    classroom = db.query(Classroom).filter(Classroom.class_code == class_code).first()
    if not classroom:
        raise HTTPException(status_code=404, detail="Classroom not found")
    
    # Check if already enrolled
    existing = db.query(ClassroomEnrollment).filter(
        ClassroomEnrollment.classroom_id == classroom.id,
        ClassroomEnrollment.user_id == current_user.id
    ).first()
    
    if existing:
        raise HTTPException(status_code=400, detail="Already enrolled in this classroom")
    
    enrollment = ClassroomEnrollment(
        classroom_id=classroom.id,
        user_id=current_user.id
    )
    db.add(enrollment)
    db.commit()
    
    return {"message": "Successfully joined classroom"}

# Get assignments for a classroom
@app.get("/classrooms/{classroom_id}/assignments")
async def get_assignments(classroom_id: int, current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    # Verify access to classroom
    if current_user.role == UserRole.TEACHER:
        classroom = db.query(Classroom).filter(
            Classroom.id == classroom_id,
            Classroom.teacher_id == current_user.id
        ).first()
        if not classroom:
            raise HTTPException(status_code=403, detail="Not your classroom")
    else:
        enrollment = db.query(ClassroomEnrollment).filter(
            ClassroomEnrollment.classroom_id == classroom_id,
            ClassroomEnrollment.user_id == current_user.id
        ).first()
        if not enrollment:
            raise HTTPException(status_code=403, detail="Not enrolled in this classroom")
    
    assignments = db.query(Assignment).filter(Assignment.classroom_id == classroom_id).all()
    return assignments

# Get specific assignment
@app.get("/assignments/{assignment_id}")
async def get_assignment(assignment_id: int, current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    assignment = db.query(Assignment).filter(Assignment.id == assignment_id).first()
    if not assignment:
        raise HTTPException(status_code=404, detail="Assignment not found")
    
    # Verify access
    if current_user.role == UserRole.TEACHER and assignment.teacher_id != current_user.id:
        raise HTTPException(status_code=403, detail="Not your assignment")
    elif current_user.role == UserRole.STUDENT:
        enrollment = db.query(ClassroomEnrollment).filter(
            ClassroomEnrollment.classroom_id == assignment.classroom_id,
            ClassroomEnrollment.user_id == current_user.id
        ).first()
        if not enrollment:
            raise HTTPException(status_code=403, detail="Not enrolled in this classroom")
    
    return assignment

# Get submissions for an assignment (teachers only)
@app.get("/assignments/{assignment_id}/submissions")
async def get_assignment_submissions(assignment_id: int, current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    if current_user.role != UserRole.TEACHER:
        raise HTTPException(status_code=403, detail="Only teachers can view submissions")
    
    assignment = db.query(Assignment).filter(
        Assignment.id == assignment_id,
        Assignment.teacher_id == current_user.id
    ).first()
    if not assignment:
        raise HTTPException(status_code=404, detail="Assignment not found")
    
    submissions = db.query(Submission).filter(Submission.assignment_id == assignment_id).all()
    return submissions

# Get student's own submission
@app.get("/assignments/{assignment_id}/my-submission")
async def get_my_submission(assignment_id: int, current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    if current_user.role != UserRole.STUDENT:
        raise HTTPException(status_code=403, detail="Only students can access this endpoint")
    
    submission = db.query(Submission).filter(
        Submission.assignment_id == assignment_id,
        Submission.student_id == current_user.id
    ).first()
    
    if not submission:
        raise HTTPException(status_code=404, detail="No submission found")
    
    return submission

# Get all submissions for current student
@app.get("/submissions/my-submissions")
async def get_my_submissions(current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    if current_user.role != UserRole.STUDENT:
        raise HTTPException(status_code=403, detail="Only students can access this endpoint")
    
    submissions = db.query(Submission).filter(Submission.student_id == current_user.id).all()
    return submissions

# Grade a submission (teachers only)
@app.put("/submissions/{submission_id}/grade")
async def grade_submission(
    submission_id: int,
    grading: dict,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    if current_user.role != UserRole.TEACHER:
        raise HTTPException(status_code=403, detail="Only teachers can grade submissions")
    
    submission = db.query(Submission).filter(Submission.id == submission_id).first()
    if not submission:
        raise HTTPException(status_code=404, detail="Submission not found")
    
    # Verify assignment ownership
    if submission.assignment.teacher_id != current_user.id:
        raise HTTPException(status_code=403, detail="Not your assignment")
    
    # Update submission with grading
    submission.grade = grading.get("grade")
    submission.points_earned = grading.get("points_earned")
    submission.feedback = grading.get("feedback")
    submission.status = SubmissionStatus.GRADED
    submission.graded_at = datetime.utcnow()
    
    db.commit()
    db.refresh(submission)
    
    return submission

# Get user profile
@app.get("/users/profile")
async def get_profile(current_user: User = Depends(get_current_user)):
    return {
        "id": current_user.id,
        "email": current_user.email,
        "name": current_user.name,
        "role": current_user.role.value
    }

# Update user profile
@app.put("/users/profile")
async def update_profile(updates: dict, current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    if "name" in updates:
        current_user.name = updates["name"]
    if "email" in updates:
        # Check if email is already taken
        existing = db.query(User).filter(User.email == updates["email"], User.id != current_user.id).first()
        if existing:
            raise HTTPException(status_code=400, detail="Email already registered")
        current_user.email = updates["email"]
    
    db.commit()
    db.refresh(current_user)
    
    return {
        "id": current_user.id,
        "email": current_user.email,
        "name": current_user.name,
        "role": current_user.role.value
    }

# Get classroom students (teachers only)
@app.get("/classrooms/{classroom_id}/students")
async def get_classroom_students(classroom_id: int, current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    if current_user.role != UserRole.TEACHER:
        raise HTTPException(status_code=403, detail="Only teachers can view student rosters")
    
    classroom = db.query(Classroom).filter(
        Classroom.id == classroom_id,
        Classroom.teacher_id == current_user.id
    ).first()
    if not classroom:
        raise HTTPException(status_code=404, detail="Classroom not found")
    
    enrollments = db.query(ClassroomEnrollment).filter(ClassroomEnrollment.classroom_id == classroom_id).all()
    return enrollments

@app.get("/health")
async def health_check():
    """Health check endpoint"""
    return {"status": "healthy", "vector_db": "connected"}

@app.get("/classrooms/{classroom_id}/analytics", response_model=ClassroomAnalytics)
async def get_classroom_analytics(
    classroom_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    # Verify access
    if current_user.role != UserRole.TEACHER:
        raise HTTPException(status_code=403, detail="Only teachers can view analytics")
    
    classroom = db.query(Classroom).filter(Classroom.id == classroom_id).first()
    if not classroom:
        raise HTTPException(status_code=404, detail="Classroom not found")
    
    # Get classroom data
    students = db.query(ClassroomEnrollment).filter(
        ClassroomEnrollment.classroom_id == classroom_id
    ).all()
    
    assignments = db.query(Assignment).filter(
        Assignment.classroom_id == classroom_id
    ).all()
    
    submissions = db.query(Submission).join(Assignment).filter(
        Assignment.classroom_id == classroom_id
    ).all()
    
    # Calculate analytics
    total_students = len(students)
    total_assignments = len(assignments)
    
    # Calculate average grade
    grades = [s.grade for s in submissions if s.grade]
    average_grade = sum(grades) / len(grades) if grades else 0
    
    # Calculate submission rate
    total_possible_submissions = total_students * total_assignments
    submission_rate = len(submissions) / total_possible_submissions if total_possible_submissions > 0 else 0
    
    # Get top performers
    student_grades = {}
    for submission in submissions:
        if submission.student_id not in student_grades:
            student_grades[submission.student_id] = []
        if submission.grade:
            student_grades[submission.student_id].append(submission.grade)
    
    top_performers = []
    for student_id, grades in student_grades.items():
        avg_grade = sum(grades) / len(grades)
        student = db.query(User).filter(User.id == student_id).first()
        top_performers.append({
            "student_id": student_id,
            "name": student.name,
            "average_grade": avg_grade
        })
    
    top_performers.sort(key=lambda x: x["average_grade"], reverse=True)
    top_performers = top_performers[:5]  # Top 5 students
    
    # Get recent activity
    recent_activity = []
    for submission in sorted(submissions, key=lambda x: x.submitted_at, reverse=True)[:10]:
        student = db.query(User).filter(User.id == submission.student_id).first()
        assignment = db.query(Assignment).filter(Assignment.id == submission.assignment_id).first()
        recent_activity.append({
            "type": "submission",
            "student_name": student.name,
            "assignment_title": assignment.title,
            "timestamp": submission.submitted_at.isoformat()
        })
    
    # Calculate assignment completion rates
    assignment_completion = {}
    for assignment in assignments:
        submissions_count = len([s for s in submissions if s.assignment_id == assignment.id])
        completion_rate = submissions_count / total_students if total_students > 0 else 0
        assignment_completion[assignment.title] = completion_rate
    
    # Calculate grade distribution
    grade_distribution = {
        "A": 0, "B": 0, "C": 0, "D": 0, "F": 0
    }
    for submission in submissions:
        if submission.grade in grade_distribution:
            grade_distribution[submission.grade] += 1
    
    return ClassroomAnalytics(
        total_students=total_students,
        total_assignments=total_assignments,
        average_grade=average_grade,
        submission_rate=submission_rate,
        top_performers=top_performers,
        recent_activity=recent_activity,
        assignment_completion=assignment_completion,
        grade_distribution=grade_distribution
    )

@app.get("/classrooms/{classroom_id}/students/{student_id}/progress", response_model=StudentProgress)
async def get_student_progress(
    classroom_id: int,
    student_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    # Verify access
    if current_user.role != UserRole.TEACHER and current_user.id != student_id:
        raise HTTPException(status_code=403, detail="Not authorized to view this student's progress")
    
    # Get student data
    student = db.query(User).filter(User.id == student_id).first()
    if not student:
        raise HTTPException(status_code=404, detail="Student not found")
    
    # Get classroom assignments
    assignments = db.query(Assignment).filter(
        Assignment.classroom_id == classroom_id
    ).all()
    
    # Get student's submissions
    submissions = db.query(Submission).filter(
        Submission.student_id == student_id,
        Submission.assignment_id.in_([a.id for a in assignments])
    ).all()
    
    # Calculate progress
    completed_assignments = len([s for s in submissions if s.status == SubmissionStatus.GRADED])
    total_assignments = len(assignments)
    
    # Calculate average grade
    grades = [s.grade for s in submissions if s.grade]
    average_grade = sum(grades) / len(grades) if grades else 0
    
    # Get recent submissions
    recent_submissions = []
    for submission in sorted(submissions, key=lambda x: x.submitted_at, reverse=True)[:5]:
        assignment = db.query(Assignment).filter(Assignment.id == submission.assignment_id).first()
        recent_submissions.append({
            "assignment_title": assignment.title,
            "submitted_at": submission.submitted_at.isoformat(),
            "grade": submission.grade,
            "status": submission.status.value
        })
    
    # Calculate grade trend
    grade_trend = []
    for submission in sorted(submissions, key=lambda x: x.submitted_at):
        if submission.grade:
            grade_trend.append({
                "assignment_title": db.query(Assignment).filter(Assignment.id == submission.assignment_id).first().title,
                "grade": submission.grade,
                "submitted_at": submission.submitted_at.isoformat()
            })
    
    # Calculate attendance rate (placeholder - implement actual attendance tracking)
    attendance_rate = 0.95  # Example value
    
    return StudentProgress(
        student_id=student_id,
        student_name=student.name,
        completed_assignments=completed_assignments,
        total_assignments=total_assignments,
        average_grade=average_grade,
        recent_submissions=recent_submissions,
        grade_trend=grade_trend,
        attendance_rate=attendance_rate
    )

@app.post("/classrooms/{classroom_id}/attendance")
async def mark_attendance(
    classroom_id: int,
    date: datetime,
    present_student_ids: List[int],
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    # Verify teacher access
    if current_user.role != UserRole.TEACHER:
        raise HTTPException(status_code=403, detail="Only teachers can mark attendance")
    
    # Verify classroom access
    classroom = db.query(Classroom).filter(Classroom.id == classroom_id).first()
    if not classroom:
        raise HTTPException(status_code=404, detail="Classroom not found")
    
    # Get all enrolled students
    enrolled_students = db.query(ClassroomEnrollment).filter(
        ClassroomEnrollment.classroom_id == classroom_id
    ).all()
    
    # Mark attendance for each student
    for enrollment in enrolled_students:
        is_present = enrollment.user_id in present_student_ids
        # In a real application, you would store this in an attendance table
        # For now, we'll just return a success message
        pass
    
    return {"message": "Attendance marked successfully"}

if __name__ == "__main__":
    uvicorn.run("app:app", host="0.0.0.0", port=8000, reload=True)
