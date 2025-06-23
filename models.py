from sqlalchemy import Column, Integer, String, Text, DateTime, Boolean, ForeignKey, Float, Enum
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import relationship
from datetime import datetime
import enum

Base = declarative_base()

class UserRole(enum.Enum):
    TEACHER = "teacher"
    STUDENT = "student"

class AssignmentStatus(enum.Enum):
    DRAFT = "draft"
    PUBLISHED = "published"
    CLOSED = "closed"

class SubmissionStatus(enum.Enum):
    NOT_SUBMITTED = "not_submitted"
    SUBMITTED = "submitted"
    GRADED = "graded"
    RETURNED = "returned"

class User(Base):
    __tablename__ = "users"
    
    id = Column(Integer, primary_key=True, index=True)
    email = Column(String(255), unique=True, index=True, nullable=False)
    name = Column(String(255), nullable=False)
    role = Column(Enum(UserRole), nullable=False)
    hashed_password = Column(String(255), nullable=False)
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    
    # Relationships
    created_assignments = relationship("Assignment", back_populates="teacher")
    submissions = relationship("Submission", back_populates="student")
    enrollments = relationship("ClassroomEnrollment", back_populates="user")

class Classroom(Base):
    __tablename__ = "classrooms"
    
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(255), nullable=False)
    description = Column(Text)
    class_code = Column(String(10), unique=True, nullable=False)
    teacher_id = Column(Integer, ForeignKey("users.id"))
    created_at = Column(DateTime, default=datetime.utcnow)
    is_active = Column(Boolean, default=True)
    
    # Relationships
    teacher = relationship("User")
    assignments = relationship("Assignment", back_populates="classroom")
    enrollments = relationship("ClassroomEnrollment", back_populates="classroom")

class ClassroomEnrollment(Base):
    __tablename__ = "classroom_enrollments"
    
    id = Column(Integer, primary_key=True, index=True)
    classroom_id = Column(Integer, ForeignKey("classrooms.id"))
    user_id = Column(Integer, ForeignKey("users.id"))
    enrolled_at = Column(DateTime, default=datetime.utcnow)
    
    # Relationships
    classroom = relationship("Classroom", back_populates="enrollments")
    user = relationship("User", back_populates="enrollments")

class Assignment(Base):
    __tablename__ = "assignments"
    
    id = Column(Integer, primary_key=True, index=True)
    title = Column(String(255), nullable=False)
    description = Column(Text, nullable=False)
    instructions = Column(Text)
    max_points = Column(Float, default=100.0)
    due_date = Column(DateTime)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    status = Column(Enum(AssignmentStatus), default=AssignmentStatus.DRAFT)
    
    # Foreign keys
    classroom_id = Column(Integer, ForeignKey("classrooms.id"))
    teacher_id = Column(Integer, ForeignKey("users.id"))
    
    # File handling
    allowed_file_types = Column(String(500))  # JSON string of allowed extensions
    max_file_size_mb = Column(Integer, default=10)
    
    # Relationships
    classroom = relationship("Classroom", back_populates="assignments")
    teacher = relationship("User", back_populates="created_assignments")
    submissions = relationship("Submission", back_populates="assignment")

class Submission(Base):
    __tablename__ = "submissions"
    
    id = Column(Integer, primary_key=True, index=True)
    assignment_id = Column(Integer, ForeignKey("assignments.id"))
    student_id = Column(Integer, ForeignKey("users.id"))
    
    # Submission content
    text_content = Column(Text)  # For text submissions
    file_path = Column(String(500))  # Path to uploaded file
    file_name = Column(String(255))  # Original filename
    file_type = Column(String(50))   # File extension
    
    # Submission metadata
    submitted_at = Column(DateTime)
    status = Column(Enum(SubmissionStatus), default=SubmissionStatus.NOT_SUBMITTED)
    
    # Grading
    grade = Column(String(10))  # A, B, C, etc. or numeric
    points_earned = Column(Float)
    feedback = Column(Text)
    ai_analysis = Column(Text)
    plagiarism_score = Column(Float)
    is_ai_generated = Column(Boolean, default=False)
    
    # Timestamps
    created_at = Column(DateTime, default=datetime.utcnow)
    graded_at = Column(DateTime)
    returned_at = Column(DateTime)
    
    # Relationships
    assignment = relationship("Assignment", back_populates="submissions")
    student = relationship("User", back_populates="submissions")
