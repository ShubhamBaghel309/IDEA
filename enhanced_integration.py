"""
Integration script to add enhanced assignment checking capabilities to the existing app.
This script provides endpoints for the enhanced assignment checker.
"""

from fastapi import APIRouter, UploadFile, File, Form, HTTPException
from pydantic import BaseModel
from typing import Optional, List, Dict, Any
import json
import io
import logging
from EnhancedAssignmentChecker import EnhancedAssignmentChecker

# Set up logging
logger = logging.getLogger(__name__)

# Initialize the enhanced checker
try:
    enhanced_checker = EnhancedAssignmentChecker()
    logger.info("Enhanced Assignment Checker initialized successfully")
except Exception as e:
    logger.error(f"Failed to initialize Enhanced Assignment Checker: {e}")
    enhanced_checker = None

# Create router for enhanced endpoints
enhanced_router = APIRouter(prefix="/enhanced", tags=["Enhanced Assignment Checking"])

# Pydantic models for enhanced endpoints
class EnhancedTextAssignmentRequest(BaseModel):
    student_name: str
    question: str
    answer: str
    file_type: str = "text"
    subject: str = "general"
    reference_material: str = ""

class EnhancedJupyterAnalysisRequest(BaseModel):
    student_name: str
    assignment_prompt: str
    notebook_content: str  # JSON string of the notebook
    reference_material: str = ""

class CodeBlockFeedback(BaseModel):
    cell_index: int
    syntax_status: str
    complexity: int
    strengths: List[str]
    improvements: List[str]
    grade_impact: str

class OptimizedSolution(BaseModel):
    cell_index: int
    original_issues: List[Dict[str, Any]]
    optimized_solution: str

class EnhancedAssignmentResponse(BaseModel):
    student_name: str
    grade: str
    feedback: str
    detailed_analysis: str
    file_analysis: Dict[str, Any]
    code_feedback: List[CodeBlockFeedback]
    optimized_solutions: List[OptimizedSolution]
    document_id: str
    success: bool

@enhanced_router.post("/check-text-assignment", response_model=EnhancedAssignmentResponse)
async def check_enhanced_text_assignment(request: EnhancedTextAssignmentRequest):
    """
    Check a text-based assignment with enhanced analysis capabilities.
    """
    if not enhanced_checker:
        raise HTTPException(status_code=503, detail="Enhanced Assignment Checker not available")
    
    logger.info(f"Enhanced text assignment check for: {request.student_name}")
    
    try:
        result = enhanced_checker.check_enhanced_assignment(
            question=request.question,
            student_answer=request.answer,
            file_type=request.file_type,
            subject=request.subject,
            student_name=request.student_name,
            reference_material=request.reference_material
        )
        
        return EnhancedAssignmentResponse(
            student_name=request.student_name,
            grade=result["grade"],
            feedback=result["feedback"],
            detailed_analysis=result["detailed_analysis"],
            file_analysis=result["file_analysis"],
            code_feedback=[CodeBlockFeedback(**fb) for fb in result["code_feedback"]],
            optimized_solutions=[OptimizedSolution(**sol) for sol in result["optimized_solutions"]],
            document_id=result["document_id"],
            success=result["success"]
        )
        
    except Exception as e:
        logger.error(f"Enhanced text assignment check failed: {e}")
        raise HTTPException(status_code=500, detail=f"Assignment checking failed: {str(e)}")

@enhanced_router.post("/check-jupyter-notebook", response_model=EnhancedAssignmentResponse)
async def check_jupyter_notebook(
    student_name: str = Form(...),
    assignment_prompt: str = Form(...),
    reference_material: str = Form(""),
    notebook_file: UploadFile = File(...)
):
    """
    Check a Jupyter notebook with detailed code block analysis.
    """
    if not enhanced_checker:
        raise HTTPException(status_code=503, detail="Enhanced Assignment Checker not available")
    
    if not notebook_file.filename.endswith('.ipynb'):
        raise HTTPException(status_code=400, detail="File must be a Jupyter notebook (.ipynb)")
    
    logger.info(f"Enhanced Jupyter notebook check for: {student_name}")
    
    try:
        # Read notebook content
        notebook_content = await notebook_file.read()
        notebook_text = notebook_content.decode('utf-8')
        
        # Check with enhanced analyzer
        result = enhanced_checker.check_enhanced_assignment(
            question=assignment_prompt,
            student_answer=notebook_text,
            file_type="jupyter",
            subject="programming",
            student_name=student_name,
            reference_material=reference_material
        )
        
        return EnhancedAssignmentResponse(
            student_name=student_name,
            grade=result["grade"],
            feedback=result["feedback"],
            detailed_analysis=result["detailed_analysis"],
            file_analysis=result["file_analysis"],
            code_feedback=[CodeBlockFeedback(**fb) for fb in result["code_feedback"]],
            optimized_solutions=[OptimizedSolution(**sol) for sol in result["optimized_solutions"]],
            document_id=result["document_id"],
            success=result["success"]
        )
        
    except Exception as e:
        logger.error(f"Jupyter notebook check failed: {e}")
        raise HTTPException(status_code=500, detail=f"Notebook checking failed: {str(e)}")

@enhanced_router.post("/check-cpp-assignment")
async def check_cpp_assignment(
    student_name: str = Form(...),
    assignment_prompt: str = Form(...),
    reference_material: str = Form(""),
    cpp_file: UploadFile = File(...)
):
    """
    Check a C++ assignment with syntax and structure analysis.
    """
    if not enhanced_checker:
        raise HTTPException(status_code=503, detail="Enhanced Assignment Checker not available")
    
    allowed_extensions = ['.cpp', '.c', '.cc', '.cxx', '.h', '.hpp']
    if not any(cpp_file.filename.endswith(ext) for ext in allowed_extensions):
        raise HTTPException(status_code=400, detail="File must be a C++ source file")
    
    logger.info(f"Enhanced C++ assignment check for: {student_name}")
    
    try:
        # Read C++ file content
        cpp_content = await cpp_file.read()
        cpp_text = cpp_content.decode('utf-8')
        
        # Check with enhanced analyzer
        result = enhanced_checker.check_enhanced_assignment(
            question=assignment_prompt,
            student_answer=cpp_text,
            file_type="cpp",
            subject="programming",
            student_name=student_name,
            reference_material=reference_material
        )
        
        return EnhancedAssignmentResponse(
            student_name=student_name,
            grade=result["grade"],
            feedback=result["feedback"],
            detailed_analysis=result["detailed_analysis"],
            file_analysis=result["file_analysis"],
            code_feedback=[CodeBlockFeedback(**fb) for fb in result["code_feedback"]],
            optimized_solutions=[OptimizedSolution(**sol) for sol in result["optimized_solutions"]],
            document_id=result["document_id"],
            success=result["success"]
        )
        
    except Exception as e:
        logger.error(f"C++ assignment check failed: {e}")
        raise HTTPException(status_code=500, detail=f"C++ checking failed: {str(e)}")

@enhanced_router.get("/analysis-stats/{document_id}")
async def get_analysis_stats(document_id: str):
    """
    Get detailed statistics for a previously analyzed assignment.
    """
    if not enhanced_checker:
        raise HTTPException(status_code=503, detail="Enhanced Assignment Checker not available")
    
    try:
        # This would typically query the vector database for the document
        # For now, return a placeholder response
        return {
            "document_id": document_id,
            "analysis_available": True,
            "code_blocks_analyzed": 0,
            "issues_found": 0,
            "suggestions_provided": 0,
            "message": "Detailed analysis stats would be retrieved from vector database"
        }
        
    except Exception as e:
        logger.error(f"Failed to retrieve analysis stats: {e}")
        raise HTTPException(status_code=500, detail=f"Stats retrieval failed: {str(e)}")

@enhanced_router.post("/batch-check")
async def batch_check_assignments(assignments: List[EnhancedTextAssignmentRequest]):
    """
    Check multiple assignments in batch for efficiency.
    """
    if not enhanced_checker:
        raise HTTPException(status_code=503, detail="Enhanced Assignment Checker not available")
    
    if len(assignments) > 10:
        raise HTTPException(status_code=400, detail="Maximum 10 assignments per batch")
    
    logger.info(f"Batch checking {len(assignments)} assignments")
    
    results = []
    for i, assignment in enumerate(assignments):
        try:
            result = enhanced_checker.check_enhanced_assignment(
                question=assignment.question,
                student_answer=assignment.answer,
                file_type=assignment.file_type,
                subject=assignment.subject,
                student_name=assignment.student_name,
                reference_material=assignment.reference_material
            )
            
            results.append({
                "index": i,
                "student_name": assignment.student_name,
                "grade": result["grade"],
                "success": result["success"],
                "document_id": result["document_id"]
            })
            
        except Exception as e:
            logger.error(f"Batch item {i} failed: {e}")
            results.append({
                "index": i,
                "student_name": assignment.student_name,
                "grade": "Error",
                "success": False,
                "error": str(e)
            })
    
    return {
        "batch_results": results,
        "total_processed": len(results),
        "successful": len([r for r in results if r["success"]]),
        "failed": len([r for r in results if not r["success"]])
    }

@enhanced_router.get("/supported-formats")
async def get_supported_formats():
    """
    Get information about supported file formats and subjects.
    """
    return {
        "file_types": {
            "text": "Plain text assignments",
            "jupyter": "Jupyter notebooks (.ipynb)",
            "python": "Python source files (.py)",
            "cpp": "C++ source files (.cpp, .c, .h)",
            "java": "Java source files (.java)",
            "javascript": "JavaScript files (.js, .jsx)"
        },
        "subjects": {
            "programming": "Programming assignments with code analysis",
            "history": "History assignments with fact checking",
            "science": "Science assignments with concept analysis",
            "math": "Mathematics assignments with equation analysis",
            "general": "General text assignments"
        },
        "features": {
            "code_analysis": "Detailed syntax and structure analysis",
            "solution_generation": "Optimized code solutions for issues",
            "rubric_grading": "Comprehensive rubric-based grading",
            "subject_specific": "Subject-specific evaluation criteria",
            "batch_processing": "Multiple assignment processing"
        }
    }

# Health check endpoint
@enhanced_router.get("/health")
async def enhanced_health_check():
    """
    Check the health of the enhanced assignment checker.
    """
    if not enhanced_checker:
        return {
            "status": "unhealthy",
            "enhanced_checker": "not_available",
            "message": "Enhanced Assignment Checker not initialized"
        }
    
    try:
        # Test basic functionality
        test_result = enhanced_checker.check_enhanced_assignment(
            question="Test question",
            student_answer="Test answer",
            file_type="text",
            subject="general"
        )
        
        return {
            "status": "healthy",
            "enhanced_checker": "available",
            "vector_db": "connected",
            "llm": "responding",
            "test_check": "passed"
        }
        
    except Exception as e:
        return {
            "status": "degraded",
            "enhanced_checker": "available",
            "error": str(e),
            "message": "Enhanced checker available but experiencing issues"
        }

# Export the router for integration
__all__ = ['enhanced_router', 'enhanced_checker']
