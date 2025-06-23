import os
from typing import List, Dict, Any, TypedDict, Optional, Tuple, BinaryIO, Union
from dotenv import load_dotenv
import google.generativeai as genai
import logging
import requests
import json
from langchain_google_genai import ChatGoogleGenerativeAI
from langchain_core.messages import HumanMessage, SystemMessage, AIMessage
from langchain_core.tools import tool
from langchain_core.documents import Document
from langchain.text_splitter import RecursiveCharacterTextSplitter
from langchain_core.vectorstores import VectorStore
from langchain_core.embeddings import Embeddings
# Update imports to use langchain_community
from langchain_community.vectorstores.chroma import Chroma
# Update to use the new package for HuggingFaceEmbeddings
from langchain_huggingface import HuggingFaceEmbeddings
import langgraph.graph as lg
import PyPDF2
import io
import uuid
from datetime import datetime
import chromadb
import time
from duckduckgo_search import DDGS
import requests.exceptions
import ast
import re
import nbformat
from pathlib import Path
from fastapi import HTTPException

# Define ChromaDBError here for compatibility
try:
    from chromadb.errors import ChromaDBError
except ImportError:
    # Fallback definition if the import fails
    class ChromaDBError(Exception):
        """Custom exception for ChromaDB errors when chromadb module is not properly installed."""
        pass

# Load the environment variables from .env file
load_dotenv()

# Set up the logging configuration
logging.basicConfig(level=logging.INFO, 
                   format='%(asctime)s - %(name)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)

class AssignmentChecker:
    """
    A class that handles automated assignment checking and grading using AI.
    
    This class provides functionality to:
    - Process assignment submissions (text and PDF)
    - Store submissions in a vector database
    - Analyze and grade assignments using LLM workflows
    - Provide detailed feedback on student work
    """
    
    def __init__(self, vector_db_dir="./vector_db"):
        """
        Initialize the Assignment Checker with Gemini 2.5 Pro model and vector database
        
        Args:
            vector_db_dir (str): Directory to store the vector database files
        """
        # Validate API key is present and valid
        api_key = os.getenv("GOOGLE_API_KEY")
        if not api_key:
            raise ValueError("GOOGLE_API_KEY environment variable is missing. Please set it in your .env file.")
        
        # Configure Gemini API
        genai.configure(api_key=api_key)
        
        # Validate API key by making a small test request
        try:
            model = genai.GenerativeModel('gemini-2.0-flash')
            model.generate_content("test")
            logger.info("API key validation successful")
        except Exception as e:
            raise ValueError(f"Invalid or expired Google API key: {str(e)}")
        
        # Initialize the LLM with specific parameters for optimal results
        self.llm = ChatGoogleGenerativeAI(
            model='gemini-2.0-flash',
            google_api_key=api_key,
            temperature=0.1,  # Low temperature for more consistent, factual responses
            convert_system_message_to_human=True,
            timeout=120,  # Add timeout to prevent hanging
        )
        
        self.vector_db_dir = vector_db_dir
        
        # Initialize embeddings model - using a smaller model for efficiency
        self.embeddings = HuggingFaceEmbeddings(
            model_name="sentence-transformers/all-MiniLM-L6-v2"
        )
        
        # Initialize ChromaDB vector store
        self._initialize_vector_db()
          # Build the workflow graph for assignment checking process
        self.checker_app = self._build_workflow_graph()
        logger.info("AssignmentChecker initialized successfully with vector database")
    
    def analyze_jupyter_notebook(self, notebook_content: str) -> Dict[str, Any]:
        """
        Analyze Jupyter notebook content for code quality and educational value.
        
        Args:
            notebook_content: The notebook file content as a string
            
        Returns:
            Dictionary containing detailed analysis of the notebook
        """
        try:
            # Parse the notebook
            notebook = nbformat.reads(notebook_content, as_version=4)
            
            analysis = {
                'total_cells': len(notebook.cells),
                'code_cells': 0,
                'markdown_cells': 0,
                'code_blocks': [],
                'complexity_score': 0,
                'issues': [],
                'optimized_solutions': []
            }
            
            for i, cell in enumerate(notebook.cells):
                if cell.cell_type == 'code':
                    analysis['code_cells'] += 1
                    
                    # Analyze each code cell
                    code_analysis = self._analyze_python_code(cell.source, f"Cell {i+1}")
                    analysis['code_blocks'].append(code_analysis)
                    analysis['complexity_score'] += code_analysis.get('complexity', 0)
                    
                    if code_analysis.get('issues'):
                        analysis['issues'].extend(code_analysis['issues'])
                    
                elif cell.cell_type == 'markdown':
                    analysis['markdown_cells'] += 1
            
            # Calculate average complexity
            if analysis['code_cells'] > 0:
                analysis['complexity_score'] = analysis['complexity_score'] / analysis['code_cells']
            
            return analysis
            
        except Exception as e:
            logger.error(f"Error analyzing Jupyter notebook: {str(e)}")
            return {
                'error': f"Failed to analyze notebook: {str(e)}",
                'total_cells': 0,
                'code_cells': 0,
                'markdown_cells': 0
            }
    
    def _analyze_python_code(self, code: str, block_name: str = "Code Block") -> Dict[str, Any]:
        """
        Analyze Python code using AST parsing for detailed insights.
        
        Args:
            code: Python code to analyze
            block_name: Name identifier for the code block
            
        Returns:
            Dictionary containing code analysis results
        """
        analysis = {
            'block_name': block_name,
            'lines_of_code': len([line for line in code.split('\n') if line.strip()]),
            'complexity': 0,
            'functions': [],
            'classes': [],
            'imports': [],
            'issues': [],
            'suggestions': []
        }
        
        try:
            tree = ast.parse(code)
            
            for node in ast.walk(tree):
                # Count functions
                if isinstance(node, ast.FunctionDef):
                    analysis['functions'].append(node.name)
                    analysis['complexity'] += 1
                
                # Count classes
                elif isinstance(node, ast.ClassDef):
                    analysis['classes'].append(node.name)
                    analysis['complexity'] += 2
                
                # Count imports
                elif isinstance(node, (ast.Import, ast.ImportFrom)):
                    if isinstance(node, ast.Import):
                        for alias in node.names:
                            analysis['imports'].append(alias.name)
                    else:
                        analysis['imports'].append(f"from {node.module}")
                
                # Count control structures
                elif isinstance(node, (ast.If, ast.For, ast.While, ast.Try)):
                    analysis['complexity'] += 1
            
            # Check for common issues
            self._check_code_issues(code, analysis)
            
        except SyntaxError as e:
            analysis['issues'].append(f"Syntax error: {str(e)}")
        except Exception as e:
            analysis['issues'].append(f"Analysis error: {str(e)}")
        
        return analysis
    
    def _check_code_issues(self, code: str, analysis: Dict[str, Any]):
        """Check for common code issues and provide suggestions."""
        lines = code.split('\n')
        
        for i, line in enumerate(lines, 1):
            # Check for long lines
            if len(line) > 100:
                analysis['issues'].append(f"Line {i}: Line too long ({len(line)} chars)")
                analysis['suggestions'].append(f"Line {i}: Consider breaking long line into multiple lines")
            
            # Check for missing docstrings in functions
            if line.strip().startswith('def ') and i < len(lines) - 1:
                next_line = lines[i].strip() if i < len(lines) else ""
                if not next_line.startswith('"""') and not next_line.startswith("'''"):
                    func_name = line.split('def ')[1].split('(')[0]
                    analysis['suggestions'].append(f"Function '{func_name}': Consider adding a docstring")
    
    def analyze_cpp_file(self, cpp_content: str) -> Dict[str, Any]:
        """
        Analyze C++ file content for syntax and structure.
        
        Args:
            cpp_content: The C++ file content as a string
            
        Returns:
            Dictionary containing C++ code analysis
        """
        analysis = {
            'lines_of_code': len([line for line in cpp_content.split('\n') if line.strip()]),
            'includes': [],
            'functions': [],
            'classes': [],
            'namespaces': [],
            'issues': [],
            'suggestions': []
        }
        
        try:
            lines = cpp_content.split('\n')
            
            for i, line in enumerate(lines, 1):
                line = line.strip()
                
                # Find includes
                if line.startswith('#include'):
                    analysis['includes'].append(line)
                
                # Find function definitions (basic regex)
                func_match = re.search(r'(\w+)\s+(\w+)\s*\([^)]*\)\s*{', line)
                if func_match and not line.startswith('//'):
                    analysis['functions'].append(func_match.group(2))
                
                # Find class definitions
                class_match = re.search(r'class\s+(\w+)', line)
                if class_match:
                    analysis['classes'].append(class_match.group(1))
                
                # Find namespaces
                namespace_match = re.search(r'namespace\s+(\w+)', line)
                if namespace_match:
                    analysis['namespaces'].append(namespace_match.group(1))
                
                # Check for common issues
                if len(line) > 120:
                    analysis['issues'].append(f"Line {i}: Line too long ({len(line)} chars)")
                
                if 'using namespace std' in line:
                    analysis['suggestions'].append(f"Line {i}: Consider avoiding 'using namespace std' in headers")
        
        except Exception as e:
            analysis['issues'].append(f"Analysis error: {str(e)}")
        
        return analysis
    
    def analyze_subject_content(self, content: str, subject: str) -> Dict[str, Any]:
        """
        Analyze content for subject-specific educational value.
        
        Args:
            content: The content to analyze
            subject: The subject area (history, science, math, etc.)
            
        Returns:
            Dictionary containing subject-specific analysis
        """
        analysis = {
            'subject': subject,
            'key_concepts': [],
            'factual_accuracy': 'pending',
            'depth_score': 0,
            'recommendations': []
        }
        
        # Subject-specific keyword analysis
        subject_keywords = {
            'history': ['timeline', 'century', 'empire', 'revolution', 'war', 'ancient', 'medieval'],
            'science': ['hypothesis', 'experiment', 'theory', 'data', 'analysis', 'method', 'result'],
            'math': ['equation', 'formula', 'theorem', 'proof', 'calculate', 'solve', 'graph'],
            'literature': ['theme', 'character', 'plot', 'metaphor', 'symbolism', 'analysis'],
            'programming': ['function', 'variable', 'loop', 'condition', 'algorithm', 'data structure']
        }
        
        keywords = subject_keywords.get(subject.lower(), [])
        content_lower = content.lower()
        
        for keyword in keywords:
            if keyword in content_lower:
                analysis['key_concepts'].append(keyword)
        
        # Calculate depth score based on content length and key concepts
        word_count = len(content.split())
        concept_count = len(analysis['key_concepts'])
        
        analysis['depth_score'] = min(10, (word_count / 100) + (concept_count * 2))
        
        # Provide recommendations
        if concept_count < 3:
            analysis['recommendations'].append(f"Consider including more {subject}-specific terminology")
        
        if word_count < 200:
            analysis['recommendations'].append("Consider expanding the response with more detailed explanations")
        
        return analysis
    
    def generate_optimized_solution(self, code: str, issues: List[str]) -> str:
        """
        Generate an optimized version of problematic code.
        
        Args:
            code: The original code with issues
            issues: List of identified issues
            
        Returns:
            Optimized code suggestions
        """
        if not issues:
            return "No optimization needed - code looks good!"
        
        optimization_prompt = f"""
        Original code:
        {code}
        
        Identified issues:
        {', '.join(issues)}
        
        Please provide an optimized version of this code that addresses the identified issues.
        Focus on:
        1. Improving readability
        2. Following best practices
        3. Fixing any syntax or logic errors
        4. Adding appropriate comments
        
        Provide only the improved code with brief explanations of changes.
        """
        
        try:
            messages = [
                SystemMessage(content="You are an expert code reviewer and optimizer. Provide clean, well-documented code improvements."),
                HumanMessage(content=optimization_prompt)
            ]
            
            response = self.llm.invoke(messages, timeout=60)
            return response.content
            
        except Exception as e:
            logger.error(f"Error generating optimized solution: {str(e)}")
            return f"Error generating optimization: {str(e)}"
        
    def process_pdf(self, pdf_file: BinaryIO) -> Tuple[str, str]:
        """
        Process a PDF file to extract text content and store in vector DB.
        
        Args:
            pdf_file: The PDF file as a binary stream
            
        Returns:
            Tuple of (extracted_text, document_id)
            
        Raises:
            ValueError: If processing the PDF fails
        """
        try:
            # Generate a unique ID for this submission
            doc_id = str(uuid.uuid4())
            
            # Create reader object
            pdf_reader = PyPDF2.PdfReader(pdf_file)
            
            # Extract text from all pages
            text = ""
            for page_num in range(len(pdf_reader.pages)):
                page = pdf_reader.pages[page_num]
                text += page.extract_text()
            
            logger.info(f"PDF processed successfully. ID: {doc_id}, Length: {len(text)} chars")
            
            return text, doc_id
            
        except PyPDF2.errors.PdfReadError as e:
            # Handle specific PyPDF2 errors
            pdf_name = getattr(pdf_file, 'name', 'unknown')
            error_msg = f"Failed to read PDF '{pdf_name}': {str(e)}"
            logger.error(error_msg)
            raise ValueError(error_msg)
        except Exception as e:
            # Handle other unexpected errors
            pdf_name = getattr(pdf_file, 'name', 'unknown')
            error_msg = f"Error processing PDF '{pdf_name}': {str(e)}"
            logger.error(error_msg)
            raise ValueError(error_msg)
    
    def _initialize_vector_db(self):
        """
        Initialize the vector database for storing and retrieving assignments.
    
        This creates a persistent ChromaDB collection for assignments with their 
        embeddings for semantic search capabilities. Falls back to in-memory DB
        if there's an error with persistent storage.
        """
        max_retries = 3
        retry_delay = 2  # seconds
        
        for attempt in range(max_retries):
            try:
                # Create the directory if it doesn't exist
                os.makedirs(self.vector_db_dir, exist_ok=True)
                
                # Initialize the ChromaDB vector store with persistence
                self.vector_db = Chroma(
                    collection_name="assignments",
                    embedding_function=self.embeddings,
                    persist_directory=self.vector_db_dir,
                )
                logger.info("Vector database initialized successfully")
                return
                
            except ChromaDBError as e:
                logger.warning(f"ChromaDB error (attempt {attempt+1}/{max_retries}): {str(e)}")
                if attempt < max_retries - 1:
                    logger.info(f"Retrying in {retry_delay} seconds...")
                    time.sleep(retry_delay)
                    retry_delay *= 2  # Exponential backoff
                else:
                    logger.error(f"Failed to initialize ChromaDB after {max_retries} attempts")
                    
            except Exception as e:
                logger.error(f"Unexpected error initializing vector database: {str(e)}")
                break
                
        # Fallback to in-memory database
        logger.warning("Falling back to in-memory vector database")
        self.vector_db = Chroma(
            collection_name="assignments",
            embedding_function=self.embeddings
        )
            
    @tool
    def search_web(self, query: str) -> str:
        """
        Search the web for information related to the assignment topic.
        
        Args:
            query: The search query to send to the search engine
            
        Returns:
            Formatted search results as a string
        """
        try:
            # Using duckduckgo_search package
            with DDGS() as ddgs:
                results = ddgs.text(query, max_results=3)
                
            formatted_results = ""
            for i, result in enumerate(results):
                formatted_results += f"Source {i+1}: {result.get('title', 'No title')}\n"
                formatted_results += f"URL: {result.get('href', 'No link')}\n"
                formatted_results += f"Snippet: {result.get('body', 'No snippet')}\n\n"
            
            return formatted_results if formatted_results else "No search results found."
            
        except requests.exceptions.RequestException as e:
            logger.error(f"Search request error: {e}")
            # Implement retry logic
            for attempt in range(3):
                try:
                    logger.info(f"Retrying search (attempt {attempt+1}/3)")
                    time.sleep(1)  # Wait a second before retrying
                    with DDGS() as ddgs:
                        results = ddgs.text(query, max_results=3)
                    
                    formatted_results = ""
                    for i, result in enumerate(results):
                        formatted_results += f"Source {i+1}: {result.get('title', 'No title')}\n"
                        formatted_results += f"URL: {result.get('href', 'No link')}\n"
                        formatted_results += f"Snippet: {result.get('body', 'No snippet')}\n\n"
                    
                    return formatted_results if formatted_results else "No search results found."
                except:
                    continue
                    
            return f"Error performing web search after multiple attempts: {str(e)}"
            
        except json.JSONDecodeError as e:
            logger.error(f"Search JSON decode error: {e}")
            return f"Error parsing search results: {str(e)}"
            
        except Exception as e:
            logger.error(f"Unexpected search error: {e}")
            return f"Error performing web search: {str(e)}"
            
    def store_in_vector_db(self, content: str, metadata: Dict[str, Any]) -> str:
        """
        Store content in the vector database with associated metadata.
        
        Args:
            content: Text content to store
            metadata: Associated metadata (student name, question, grade, etc.)
            
        Returns:
            The document ID in the vector database
            
        Raises:
            ValueError: If storing in the vector database fails
        """
        try:
            # Generate unique ID for document if not provided in the metadata 
            doc_id = metadata.get("id", str(uuid.uuid4()))
            
            # Ensure ID is in metadata
            metadata["id"] = doc_id
            
            # Add timestamp if not present 
            if "timestamp" not in metadata:
                metadata["timestamp"] = datetime.now().isoformat()
                
            # Handle very long documents by streaming chunks
            text_splitter = RecursiveCharacterTextSplitter(
                chunk_size=1000,
                chunk_overlap=100
            )
            
            # Process large documents in smaller batches to avoid memory issues
            max_content_length = 100000  # Characters
            if len(content) > max_content_length:
                logger.info(f"Large document detected ({len(content)} chars). Processing in chunks.")
                chunks = []
                for i in range(0, len(content), max_content_length):
                    chunk_content = content[i:i+max_content_length]
                    chunks.extend(text_splitter.split_text(chunk_content))
            else:
                chunks = text_splitter.split_text(content)
            
            # Create Document objects for each chunk
            documents = [
                Document(
                    page_content=chunk,
                    metadata=metadata
                ) for chunk in chunks
            ]
            
            # Add to vector store
            self.vector_db.add_documents(documents)
            
            # Persist to disk with error checking
            try:
                self.vector_db.persist()
                logger.info(f"Vector DB persistence successful - {len(chunks)} chunks saved")
            except Exception as persist_error:
                logger.error(f"Failed to persist vector DB: {str(persist_error)}")
                # Continue without failing - data is still in memory
            
            logger.info(f"Content stored in vector DB with ID: {doc_id}, chunks: {len(chunks)}")
            return doc_id
            
        except ChromaDBError as e:
            logger.error(f"ChromaDB error when storing content: {str(e)}")
            raise ValueError(f"Failed to store in vector database: {str(e)}")
        except Exception as e:
            logger.error(f"Error storing in vector database: {str(e)}")
            raise ValueError(f"Failed to store in vector database: {str(e)}")
    
    class CheckerState(TypedDict):
        """
        Type definition for the state used in the assignment checking workflow.
        
        This defines the structure of the state object that is passed between
        nodes in the workflow graph.
        """
        question: str  # The assignment question or prompt
        student_answer: str  # The student's submitted answer
        reference_material: str  # Reference material to compare against (optional)
        search_results: str  # Results from web searches
        analysis: str  # Analysis of the student's work        grade: Optional[str]  # The grade assigned to the work
        feedback: Optional[str]  # Detailed feedback for the student
        messages: List[Any]  # History of messages in the workflow
        next: Optional[str]  # Next node to execute in the workflow
        
    def _build_workflow_graph(self) -> Any:
        """
        Build and compile the langgraph workflow for the assignment checker.
        
        Creates a directed graph with nodes for each step in the process:
        The enhanced workflow consists of these steps:
           1. File Analysis - analyze file type and extract detailed information
           2. Research - search for relevant information
           3. Detailed Analysis - comprehensive analysis including code quality
           4. Solution Generation - generate optimized solutions for code issues
           5. Comprehensive Grading - assign grade and provide detailed feedback
        
        Returns: 
            Compiled workflow graph
        """
        # Create a basic graph with fixed routing instead of dynamic routing
        # This approach is compatible with langgraph 0.3.25
        workflow = lg.Graph()
        
        # Add nodes to the enhanced graph
        workflow.add_node("file_analysis", self._file_analysis_node)
        workflow.add_node("research", self._research_node)
        workflow.add_node("detailed_analysis", self._detailed_analysis_node)
        workflow.add_node("solution_generation", self._solution_generation_node)
        workflow.add_node("comprehensive_grading", self._comprehensive_grading_node)
        
        # Add START edge - this is critical
        workflow.add_edge(lg.START, "file_analysis")
        
        # Add fixed edges between nodes to define enhanced workflow
        workflow.add_edge("file_analysis", "research")
        workflow.add_edge("research", "detailed_analysis")
        workflow.add_edge("detailed_analysis", "solution_generation")
        workflow.add_edge("solution_generation", "comprehensive_grading")
        
        # Add edge from comprehensive_grading to END
        workflow.add_edge("comprehensive_grading", lg.END)
        
        # Compile the graph
        compiled_workflow = workflow.compile()
        logger.info("Enhanced workflow graph built successfully")
        
        return compiled_workflow
        
    def _research_node(self, state: Dict[str, Any]) -> Dict[str, Any]:
        """
        Research node: Searches for relevant information to help grade the assignment.
        
        Args:
            state: Current state of the workflow
            
        Returns:
            Updated state with search results
        """
        question = state["question"]
        student_answer = state["student_answer"]
        
        # Create a prompt to generate an effective search query
        research_prompt = f"""
        I need to check a student's assignment answer for accuracy and quality.
        Assignment question: {question}
        Student's answer: {student_answer}
        
        Generate a simple, concise search query (just one or two keywords or phrases) that will help me find relevant information
        to verify the accuracy and completeness of this answer. Do not include formatting characters like asterisks, bullet points,
        or markdown formatting. Just provide plain text terms.
        """
        
        try:
            # Set up the conversation with the LLM
            messages = [
                SystemMessage(
                    content="You are an expert educational research assistant. Generate effective and simple search queries to find relevant information that will help verify student answers. Do not use formatting like asterisks, bullets, or markdown."
                ),
                HumanMessage(
                    content=research_prompt
                )
            ]
            
            # Get search query from LLM
            response = self.llm.invoke(messages)
            search_query = response.content.strip()
            
            try:
                # Attempt web search
                search_results = self.search_web(query=search_query)
            except Exception as search_error:
                # Silently handle search errors and continue
                logger.debug(f"Search failed: {str(search_error)}")
                search_results = None
            
            # Update state with search results
            state["search_results"] = search_results
            logger.info(f"Generated search query: {search_query}")
            
            return state
            
        except Exception as e:
            # Handle any other errors silently
            logger.debug(f"Research error: {str(e)}")
            state["search_results"] = None
            return state
    
    def _analyze_node(self, state: Dict[str, Any]) -> Dict[str, Any]:
        """
        Analyze node: Evaluates the student answer against research findings.
        
        This node performs a detailed analysis of the student's answer based on
        the question, reference material, and search results.
        
        Args:
            state: Current state of the workflow
            
        Returns:
            Updated state with analysis
        """
        # Extract required information from state
        question = state["question"]
        student_answer = state["student_answer"]
        search_results = state.get("search_results", "")
        reference_material = state.get("reference_material", "")
        
        # Handle large student answers that may exceed token limits
        max_length = 8000
        if len(student_answer) > max_length:
            logger.info(f"Student answer exceeds {max_length} chars, truncating for analysis")
            student_answer = student_answer[:max_length] + f"\n\n[Note: Answer truncated from {len(student_answer)} characters due to length limits]"
        
        # Create a prompt for detailed analysis
        analysis_prompt = f"""
        Please analyze this student's answer thoroughly.
        
        Assignment question: {question}
        
        Student's answer: {student_answer}
        
        Reference material: {reference_material}
        
        Research findings from web: {search_results}
        
        Analyze:
        1. Accuracy: Are the facts, concepts, and information correct?
        2. Completeness: Does the answer address all aspects of the question?
        3. Understanding: Does the student demonstrate understanding of the core concepts?
        4. Critical thinking: Is there evidence of analysis, evaluation, or original thought?
        5. Structure: Is the answer well-organized and clearly expressed?
        
        Provide a detailed analysis that identifies specific strengths and weaknesses. Use plain text formatting without asterisks, 
        bullet points, or other markdown. Present your analysis in clear paragraphs with simple section headings only.
        """
        
        # Set up the conversation with the LLM
        messages = [
            SystemMessage(content="You are an expert educational analyst with deep subject matter expertise. Analyze student work with precision and insight. Use plain text formatting in your response - no asterisks, bullet points, or markdown formatting."),
            HumanMessage(content=analysis_prompt)
        ]
        
        # Handle timeout and add retry logic
        max_retries = 3
        for attempt in range(max_retries):
            try:
                response = self.llm.invoke(
                    messages,
                    timeout=120  # 2-minute timeout for analysis
                )
                
                # Update state - FIXED INDENTATION
                state["analysis"] = response.content
                state["messages"] = state.get("messages", []) + [
                    HumanMessage(content=analysis_prompt),
                    AIMessage(content=response.content)
                ]
                return state
            
            except Exception as e:
                logger.warning(f"Analysis LLM call failed (attempt {attempt+1}/{max_retries}): {str(e)}")
                if attempt < max_retries - 1:
                    backoff_time = 2 ** attempt  # Exponential backoff
                    logger.info(f"Retrying analysis in {backoff_time} seconds...")
                    time.sleep(backoff_time)
                else:
                    logger.error(f"Failed to get analysis after {max_retries} attempts")
                    state["analysis"] = "Error: Unable to complete analysis due to service issues."
                    return state  # FIXED: Added proper return statement
        
    def _file_analysis_node(self, state: Dict[str, Any]) -> Dict[str, Any]:
        """
        File Analysis node: Analyzes the file type and extracts detailed information.
        
        This node determines the file type and performs specialized analysis
        for different formats (.ipynb, .py, .cpp, etc.).
        
        Args:
            state: Current state of the workflow
            
        Returns:
            Updated state with file analysis results
        """
        student_answer = state["student_answer"]
        question = state["question"]
        
        # Initialize analysis results
        file_analysis = {
            'file_type': 'text',
            'detailed_analysis': {},
            'issues_found': [],
            'suggestions': []
        }
        
        try:
            # Detect file type based on content patterns
            if student_answer.strip().startswith('{') and '"cells"' in student_answer:
                # Jupyter notebook
                file_analysis['file_type'] = 'jupyter_notebook'
                notebook_analysis = self.analyze_jupyter_notebook(student_answer)
                file_analysis['detailed_analysis'] = notebook_analysis
                
            elif any(pattern in student_answer for pattern in ['def ', 'import ', 'class ', 'if __name__']):
                # Python code
                file_analysis['file_type'] = 'python_code'
                code_analysis = self._analyze_python_code(student_answer, "Main Code")
                file_analysis['detailed_analysis'] = code_analysis
                
            elif any(pattern in student_answer for pattern in ['#include', 'int main', 'class ', 'namespace ']):
                # C++ code
                file_analysis['file_type'] = 'cpp_code'
                cpp_analysis = self.analyze_cpp_file(student_answer)
                file_analysis['detailed_analysis'] = cpp_analysis
                
            # Extract subject from question for subject-specific analysis
            subject = 'general'
            if any(keyword in question.lower() for keyword in ['history', 'historical']):
                subject = 'history'
            elif any(keyword in question.lower() for keyword in ['science', 'experiment', 'hypothesis']):
                subject = 'science'
            elif any(keyword in question.lower() for keyword in ['math', 'equation', 'calculate']):
                subject = 'math'
            elif any(keyword in question.lower() for keyword in ['programming', 'code', 'algorithm']):
                subject = 'programming'
            
            # Perform subject-specific analysis
            subject_analysis = self.analyze_subject_content(student_answer, subject)
            file_analysis['subject_analysis'] = subject_analysis
            
            # Update state
            state["file_analysis"] = file_analysis
            logger.info(f"File analysis completed - Type: {file_analysis['file_type']}, Subject: {subject}")
            
        except Exception as e:
            logger.error(f"Error in file analysis: {str(e)}")
            state["file_analysis"] = {
                'file_type': 'text',
                'error': f"Analysis error: {str(e)}"
            }
        
        return state
    
    def _detailed_analysis_node(self, state: Dict[str, Any]) -> Dict[str, Any]:
        """
        Detailed Analysis node: Performs comprehensive analysis including code quality.
        
        This node combines the file analysis results with educational assessment
        to provide detailed insights about the student's work.
        
        Args:
            state: Current state of the workflow
            
        Returns:
            Updated state with detailed analysis
        """
        question = state["question"]
        student_answer = state["student_answer"]
        search_results = state.get("search_results", "")
        file_analysis = state.get("file_analysis", {})
        
        # Create comprehensive analysis prompt
        analysis_prompt = f"""
        Please provide a comprehensive analysis of this student's work:
        
        Assignment Question: {question}
        
        Student's Answer: {student_answer[:6000]}{"...[truncated]" if len(student_answer) > 6000 else ""}
        
        File Analysis Results: {json.dumps(file_analysis, indent=2)}
        
        Research Context: {search_results}
        
        Analyze the following aspects:
        1. Technical Accuracy: Are the concepts, facts, and implementations correct?
        2. Code Quality (if applicable): Structure, readability, best practices
        3. Educational Value: Does the work demonstrate learning and understanding?
        4. Completeness: Are all aspects of the question addressed?
        5. Critical Thinking: Evidence of analysis, problem-solving, and insight
        6. Subject-Specific Requirements: Domain-specific criteria
        
        Provide detailed feedback in each area with specific examples and suggestions.
        The feedback should be in a structured format with clear headings and subheadings.
        The feedback should be in a clear and concise manner.
        The feedback should be in a way that is easy to understand and follow.
        Theere should not be any unnecassary symbols like "* "asterisks, bullet points, or markdown formatting.
        """
        
        try:
            messages = [
                SystemMessage(content="You are an expert educational analyst specializing in comprehensive assessment. Provide detailed, constructive analysis focusing on both technical and educational aspects."),
                HumanMessage(content=analysis_prompt)
            ]
            
            response = self.llm.invoke(messages, timeout=120)
            
            state["detailed_analysis"] = response.content
            state["messages"] = state.get("messages", []) + [
                HumanMessage(content=analysis_prompt),
                AIMessage(content=response.content)
            ]
            
        except Exception as e:
            logger.error(f"Error in detailed analysis: {str(e)}")
            state["detailed_analysis"] = f"Error in detailed analysis: {str(e)}"
        
        return state
    
    def _solution_generation_node(self, state: Dict[str, Any]) -> Dict[str, Any]:
        """
        Solution Generation node: Generates optimized solutions for identified issues.
        
        This node creates improved solutions for any code or content issues
        found during analysis.
        
        Args:
            state: Current state of the workflow
            
        Returns:
            Updated state with optimized solutions
        """
        student_answer = state["student_answer"]
        file_analysis = state.get("file_analysis", {})
        detailed_analysis = state.get("detailed_analysis", "")
        
        optimized_solutions = []
        
        try:
            # Generate solutions for code-related submissions
            if file_analysis.get('file_type') in ['python_code', 'cpp_code', 'jupyter_notebook']:
                detailed_info = file_analysis.get('detailed_analysis', {})
                
                if isinstance(detailed_info, dict):
                    issues = detailed_info.get('issues', [])
                    if issues:
                        solution = self.generate_optimized_solution(student_answer, issues)
                        optimized_solutions.append({
                            'type': 'code_optimization',
                            'issues': issues,
                            'solution': solution
                        })
                
                # For Jupyter notebooks, analyze individual code blocks
                if file_analysis.get('file_type') == 'jupyter_notebook':
                    code_blocks = detailed_info.get('code_blocks', [])
                    for block in code_blocks:
                        if block.get('issues'):
                            solution = self.generate_optimized_solution(
                                f"# {block.get('block_name', 'Code Block')}\n" + student_answer,
                                block['issues']
                            )
                            optimized_solutions.append({
                                'type': 'notebook_block_optimization',
                                'block': block.get('block_name', 'Unknown Block'),
                                'issues': block['issues'],
                                'solution': solution
                            })
            
            # Generate general improvement suggestions
            if "improvement" in detailed_analysis.lower() or "suggest" in detailed_analysis.lower():
                general_prompt = f"""
                Based on the detailed analysis, provide specific actionable suggestions for improvement:
                
                Analysis: {detailed_analysis}
                
                Provide 3-5 concrete steps the student can take to improve their work.
                """
                
                messages = [
                    SystemMessage(content="You are an educational mentor providing specific, actionable improvement suggestions."),
                    HumanMessage(content=general_prompt)
                ]
                
                response = self.llm.invoke(messages, timeout=60)
                optimized_solutions.append({
                    'type': 'general_improvements',
                    'suggestions': response.content
                })
            
            state["optimized_solutions"] = optimized_solutions
            logger.info(f"Generated {len(optimized_solutions)} optimization solutions")
            
        except Exception as e:
            logger.error(f"Error generating solutions: {str(e)}")
            state["optimized_solutions"] = [{
                'type': 'error',
                'message': f"Error generating solutions: {str(e)}"
            }]
        
        return state
    
    def _comprehensive_grading_node(self, state: Dict[str, Any]) -> Dict[str, Any]:
        """
        Comprehensive grading node that evaluates the assignment and provides structured feedback.
        
        Args:
            state: Current state of the workflow
            
        Returns:
            Updated state with grading information
        """
        try:
            # Extract information from state
            question = state.get('question', '')
            student_answer = state.get('student_answer', '')
            
            # Create a structured grading prompt
            grading_prompt = f"""
            You are a teacher grading an assignment. Provide a clear, structured report of the student's answers.
            
            Question: {question}
            Student's Answer: {student_answer}
            
            Format your response exactly as follows:
            
            GRADE: [numerical grade out of 100]
            
            QUESTION ANALYSIS:
            [For each question in the assignment, list as:]
            Q1: [Question text]
            Status: [CORRECT/INCORRECT]
            Student's Answer: [What student wrote]
            Correct Answer: [If incorrect, provide the correct answer]
            Explanation: [If incorrect, briefly explain why]
            
            [Repeat for each question]
              SUMMARY:
            Total Correct Answers: [number]
            Total Incorrect Answers: [number]
            Key Strengths: [List 2-3 main strengths]
            Areas for Improvement: [List 2-3 main areas to improve]

            Return in plain text format with clear headings and paragraphs.
            Do not use JSON format, asterisks, bullet points, or markdown formatting.
            Use simple text with clear sections and line breaks for readability.
            """
            
            # Get grading from LLM
            response = self.llm.invoke([
                SystemMessage(content="You are a teacher providing clear, structured feedback. Focus on accuracy and provide specific corrections where needed."),
                HumanMessage(content=grading_prompt)
            ])
            
            # Ensure we have valid feedback
            feedback = response.content.strip()
            if not feedback:
                feedback = "No feedback generated"
            
            # Update state with grading information
            state['grade'] = feedback
            state['feedback'] = feedback  # Explicitly set feedback
            
            return state
            
        except Exception as e:
            logger.error(f"Error in grading: {str(e)}")
            error_feedback = f"Error in grading process: {str(e)}"
            state['grade'] = error_feedback
            state['feedback'] = error_feedback  # Ensure feedback is set even in error case
            return state
    
    def _grade_node(self, state: Dict[str, Any]) -> Dict[str, Any]:
        """
        Final grading node that provides a clear, concise grade and feedback.
        
        Args:
            state: Current state of the workflow
            
        Returns:
            Updated state with final grade and feedback
        """
        try:
            # Extract information from state
            question = state.get('question', '')
            student_answer = state.get('student_answer', '')
            analysis = state.get('analysis', '')
            
            # Create a focused grading prompt
            grading_prompt = f"""
            You are a strict but fair teacher. Grade this assignment based on accuracy and completeness.
            
            Question: {question}
            Student's Answer: {student_answer}
            
            Provide:
            1. A numerical grade (0-100)
            2. A brief explanation of the grade
            3. What was correct
            4. What was incorrect
            
            Format as:
            GRADE: [number]
            
            CORRECT:
            - [List correct points]
            
            INCORRECT:
            - [List incorrect points]
            
            EXPLANATION:
            [Brief explanation of the grade]
            """
            
            # Get grading from LLM
            response = self.llm.invoke([
                SystemMessage(content="You are a strict but fair teacher. Provide clear, concise grading feedback."),
                HumanMessage(content=grading_prompt)
            ])
            
            # Update state with grading information
            state['grade'] = response.content
            
            return state
            
        except Exception as e:
            logger.error(f"Error in grading: {str(e)}")
            state['grade'] = "Error in grading process"
            return state
    
    def check_assignment(self, question: str, student_answer: str, student_name: str = "", reference_material: str = "") -> Dict[str, Any]:
        """
        Check a student assignment and provide grading and feedback.
        
        Args:
            question: The assignment question or prompt
            student_answer: The student's submitted answer
            student_name: The student's name (optional)
            reference_material: Reference material to compare against (optional)
            
        Returns:
            Dictionary containing grade, feedback, analysis, and success status
        """
        # Initialize the state for the enhanced workflow
        initial_state = {
            "question": question,
            "student_answer": student_answer,
            "reference_material": reference_material,
            "search_results": None,
            "file_analysis": None,
            "detailed_analysis": None,
            "optimized_solutions": None,
            "analysis": None,  # Keep for backward compatibility
            "grade": None,
            "feedback": None,
            "messages": []
        }
        
        try:
            logger.info(f"Starting assignment checking process for {student_name if student_name else 'a student'}")
            
            # Ensure checker_app is not None before invoking
            if self.checker_app is None:
                logger.error("Workflow graph not initialized")
                raise ValueError("Assignment checking workflow not initialized properly")
                
            # Execute the workflow with the initial state
            final_state = self.checker_app.invoke(initial_state)
            
            # Prepare metadata for vector database storage
            metadata = {
                "student_name": student_name if student_name else "Unknown",
                "question": question,
                "grade": final_state.get("grade", "No grade"),
                "timestamp": datetime.now().isoformat(),
                "type": "assignment"
            }
            
            # Store the checked assignment in the vector database
            doc_id = self.store_in_vector_db(
                content=student_answer,
                metadata=metadata
            )
            
            # Ensure feedback is not None and properly formatted
            feedback = final_state.get("grade", "No feedback generated")
            if feedback is None:
                feedback = "No feedback generated"
            
            # Return the enhanced results with explicit feedback
            return {
                "grade": final_state.get("grade", "Unable to determine grade"),
                "feedback": feedback,  # Use the ensured feedback
                "analysis": final_state.get("detailed_analysis", final_state.get("analysis", "No analysis performed")),
                "file_analysis": final_state.get("file_analysis", {}),
                "optimized_solutions": final_state.get("optimized_solutions", []),
                "document_id": doc_id,
                "success": True
            }
            
        except Exception as e:
            logger.error(f"Error in assignment checking: {str(e)}")
            error_feedback = f"Error processing assignment: {str(e)}"
            return {
                "grade": "Error",
                "feedback": error_feedback,  # Ensure feedback is set even in error case
                "analysis": "Error occurred during analysis",
                "file_analysis": {},
                "optimized_solutions": [],
                "document_id": None,
                "success": False
            }

    def check_pdf_assignment(self, pdf_file: BinaryIO, assignment_prompt: str, student_name: str = "", reference_material: str = "") -> Dict[str, Any]:
        """
        Process a PDF assignment file, extract text, and check the entire assignment.
        
        Args:
            pdf_file: The PDF file as a binary stream
            assignment_prompt: The assignment question or instructions
            student_name: The student's name (optional)
            reference_material: Reference material to compare against (optional)
            
        Returns:
            Dictionary containing grade, feedback, analysis, file_id, and success status
        """
        try:
            # Process PDF and extract text
            extracted_text, file_id = self.process_pdf(pdf_file)
            
            # Prepare an enhanced prompt that asks the model to consider all questions
            enhanced_question = f"""
            ASSIGNMENT INSTRUCTIONS:
            {assignment_prompt}
            
            Please evaluate this entire assignment submission. The assignment may contain multiple questions 
            or parts that need to be addressed. Consider all aspects of the submission when providing feedback.
            """
            
            # Check the extracted text as a single submission
            result = self.check_assignment(
                question=enhanced_question, 
                student_answer=extracted_text, 
                student_name=student_name,
                reference_material=reference_material
            )
            
            # Add the file ID to the result
            result["file_id"] = file_id
            
            return result
            
        except PyPDF2.errors.PdfReadError as e:
            # Handle specific PDF reading errors
            logger.error(f"PDF read error: {e}")
            return {
                "grade": "Error",
                "feedback": f"Could not read the PDF file: {str(e)}",
                "success": False
            }
        except ValueError as e:
            # Handle value errors from process_pdf()
            logger.error(f"PDF processing error: {e}")
            return {
                "grade": "Error",
                "feedback": f"Problem processing the PDF: {str(e)}",
                "success": False
            }
        except Exception as e:
            # Handle other unexpected errors
            logger.error(f"Error checking PDF assignment: {e}")
            return {
                "grade": "Error",
                "feedback": f"An error occurred while processing the assignment: {str(e)}",
                "success": False
            }

    def analyze_assignment(self, assignment_text: str) -> dict:
        """Analyze an assignment submission and provide detailed feedback."""
        try:
            # Initialize feedback structure
            feedback = {
                "overallScore": 0,
                "questions": [],
                "suggestions": [],
                "warnings": {
                    "plagiarism": False,
                    "aiGenerated": False
                }
            }

            # Check for AI-generated content
            if self.detect_ai_content(assignment_text):
                feedback["warnings"]["aiGenerated"] = True
                feedback["suggestions"].append("Your submission appears to be AI-generated. Please submit original work.")

            # Check for plagiarism
            if self.detect_plagiarism(assignment_text):
                feedback["warnings"]["plagiarism"] = True
                feedback["suggestions"].append("Potential plagiarism detected. Please ensure all work is original.")

            # Extract questions and answers
            qa_pairs = self.extract_qa_pairs(assignment_text)
            
            total_score = 0
            for qa in qa_pairs:
                question = qa["question"]
                student_answer = qa["answer"]
                
                # Get correct answer and explanation
                correct_answer = self.get_correct_answer(question)
                is_correct = self.compare_answers(student_answer, correct_answer)
                
                # Calculate score for this question (0-100)
                question_score = self.calculate_question_score(student_answer, correct_answer)
                total_score += question_score
                
                # Add question feedback
                feedback["questions"].append({
                    "question": question,
                    "studentAnswer": student_answer,
                    "isCorrect": is_correct,
                    "correctAnswer": correct_answer if not is_correct else None,
                    "explanation": self.get_explanation(question) if not is_correct else None,
                    "score": question_score
                })

            # Calculate overall score
            feedback["overallScore"] = round(total_score / len(qa_pairs)) if qa_pairs else 0

            # Add general suggestions based on overall performance
            if feedback["overallScore"] < 60:
                feedback["suggestions"].extend([
                    "Review the course materials and notes thoroughly.",
                    "Practice answering similar questions to improve understanding.",
                    "Consider seeking help from your instructor or teaching assistant."
                ])

            return feedback

        except Exception as e:
            logger.error(f"Error analyzing assignment: {str(e)}")
            raise HTTPException(
                status_code=500,
                detail="Failed to analyze assignment. Please try again."
            )

    def calculate_question_score(self, student_answer: str, correct_answer: str) -> int:
        """Calculate a score (0-100) for a question based on answer quality."""
        # Calculate similarity score (0-1)
        similarity = self.calculate_similarity(student_answer, correct_answer)
        
        # Convert to percentage (0-100)
        score = round(similarity * 100)
        
        # Apply penalties for very short answers
        if len(student_answer.split()) < 10:
            score = max(0, score - 20)
        
        return score

    def get_correct_answer(self, question: str) -> str:
        """Get the correct answer for a given question."""
        # This would typically involve querying a database or knowledge base
        # For now, return a placeholder
        return "Correct answer placeholder"

    def compare_answers(self, student_answer: str, correct_answer: str) -> bool:
        """Compare student answer with correct answer."""
        # This would typically involve more sophisticated comparison
        # For now, use simple string similarity
        similarity = self.calculate_similarity(student_answer, correct_answer)
        return similarity > 0.8

    def get_explanation(self, question: str) -> str:
        """Get explanation for a question."""
        # This would typically involve querying a database or knowledge base
        # For now, return a placeholder
        return "Explanation placeholder"

    def calculate_similarity(self, text1: str, text2: str) -> float:
        """Calculate similarity between two texts."""
        # This would typically involve more sophisticated NLP
        # For now, use simple string matching
        text1 = text1.lower()
        text2 = text2.lower()
        words1 = set(text1.split())
        words2 = set(text2.split())
        intersection = words1.intersection(words2)
        union = words1.union(words2)
        return len(intersection) / len(union) if union else 0