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
        analysis: str  # Analysis of the student's work
        grade: Optional[str]  # The grade assigned to the work
        feedback: Optional[str]  # Detailed feedback for the student
        messages: List[Any]  # History of messages in the workflow
        next: Optional[str]  # Next node to execute in the workflow
        
    def _build_workflow_graph(self) -> Any:
        """
        Build and compile the langgraph workflow for the assignment checker.
        
        Creates a directed graph with nodes for each step in the process:
        The workflow consists of these steps:
           1. Research - search for relevant information
           2. Analysis - analyze the student's answer
           3. Grading - assign a grade and provide feedback
        
        Returns: 
            Compiled workflow graph
        """
        # Create a basic graph with fixed routing instead of dynamic routing
        # This approach is compatible with langgraph 0.3.25
        workflow = lg.Graph()
        
        # Add nodes to the graph
        workflow.add_node("research", self._research_node)
        workflow.add_node("analyze", self._analyze_node)
        workflow.add_node("grade", self._grade_node)
        
        # Add START edge - this is critical
        workflow.add_edge(lg.START, "research")
        
        # Add fixed edges between nodes to define workflow
        workflow.add_edge("research", "analyze")
        workflow.add_edge("analyze", "grade")
        
        # Add edge from grade to END
        workflow.add_edge("grade", lg.END)
        
        # Compile the graph
        compiled_workflow = workflow.compile()
        logger.info("Workflow graph built successfully")
        
        return compiled_workflow
        
    def _research_node(self, state: Dict[str, Any]) -> Dict[str, Any]:
        """
        Research node: Searches for relevant information to help grade the assignment.
        
        This node generates a search query based on the question and answer,
        then performs a web search to gather relevant information.
        
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
        
        # Set up the conversation with the LLM
        messages = [
            SystemMessage(
                content="You are an expert educational research assistant. Generate effective and simple search queries to find relevant information that will help verify student answers. Do not use formatting like asterisks, bullets, or markdown."
            ),
            HumanMessage(
                content=research_prompt
            )
        ]
        
        # Handle timeout and add retry logic
        max_retries = 3
        for attempt in range(max_retries):
            try:
                response = self.llm.invoke(
                    messages,
                    timeout=60  # 60 second timeout
                )
                search_query = response.content
                logger.info(f"Generated search query: {search_query}")
                
                # Execute the search query
                search_results = self.search_web(search_query)
                
                # Update and return the state
                state["search_results"] = search_results
                state["messages"] = state.get("messages", []) + [
                    HumanMessage(content=research_prompt),
                    AIMessage(content=response.content)
                ]
                return state
            except Exception as e:
                logger.warning(f"LLM call failed (attempt {attempt+1}/{max_retries}): {str(e)}")
                if attempt < max_retries - 1:
                    backoff_time = 2 ** attempt  # Exponential backoff
                    logger.info(f"Retrying in {backoff_time} seconds...")
                    time.sleep(backoff_time)
                else:
                    logger.error(f"Failed to get LLM response after {max_retries} attempts")
                    state["search_results"] = "Error: Unable to generate search query due to LLM service issues."
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
                
                # Update state
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
                    return state
    
    def _grade_node(self, state: Dict[str, Any]) -> Dict[str, Any]:
        """
        Grade node: Assigns a grade and provides personalized feedback.
        
        This node uses the analysis to generate a grade and detailed feedback for
        the student, focusing on helping them improve.
        
        Args:
            state: Current state of the workflow
            
        Returns:
            Updated state with grade and feedback
        """
        # Extract required information from state
        question = state["question"]
        student_answer = state["student_answer"]
        analysis = state.get("analysis", "")
        
        # Handle large student answers that may exceed token limits
        max_length = 6000
        if len(student_answer) > max_length:
            logger.info(f"Student answer exceeds {max_length} chars, truncating for grading")
            student_answer = student_answer[:max_length] + f"\n\n[Note: Answer truncated from {len(student_answer)} characters due to length limits]"
        
        # Create a prompt for grading and feedback
        grading_prompt = f"""
        Based on your analysis, please:
        
        1. Assign a numerical grade (0-100) to this answer
        2. Provide detailed, constructive feedback that will help the student improve
        3. Include specific examples from their answer to illustrate your points
        4. Suggest concrete steps for improvement
        5. Highlight strengths to reinforce positive aspects
        
        Assignment question: {question}
        
        Student's answer: {student_answer}
        
        Your analysis: {analysis}
        
        Format your response as follows:
        
        GRADE: [numerical grade]
        
        FEEDBACK:
        [Your detailed feedback here, organized into clear sections with simple headings. Use plain text only - no asterisks, bullet points, or markdown formatting.]
        """
        
        # Set up the conversation with the LLM
        messages = [
            SystemMessage(content="You are an experienced teacher providing fair and constructive feedback. Be specific, balanced, and focused on helping the student improve. Use plain text formatting only - no asterisks, bullet points, or markdown."),
            HumanMessage(content=grading_prompt)
        ]
        
        # Handle timeout and add retry logic
        max_retries = 3
        for attempt in range(max_retries):
            try:
                response = self.llm.invoke(
                    messages,
                    timeout=90  # 90-second timeout for grading
                )
                
                # Extract grade from response
                feedback_text = response.content
                grade = "See detailed feedback"
                
                try:
                    if "GRADE:" in feedback_text:
                        grade_lines = [line for line in feedback_text.split('\n') if "GRADE:" in line]
                        if grade_lines:
                            grade_line = grade_lines[0]
                            grade = grade_line.split("GRADE:")[1].strip()
                except (IndexError, AttributeError) as ex:
                    logger.warning(f"Could not extract grade from feedback text: {str(ex)}")
                except Exception as ex:
                    logger.warning(f"Unexpected error extracting grade: {str(ex)}")
                    
                logger.info(f"Assigned grade: {grade}")
                
                # Update the state with the grade and feedback
                state["grade"] = grade
                state["feedback"] = feedback_text
                state["messages"] = state.get("messages", []) + [
                    HumanMessage(content=grading_prompt),
                    AIMessage(content=response.content)
                ]
                return state
            except Exception as e:
                logger.warning(f"Grading LLM call failed (attempt {attempt+1}/{max_retries}): {str(e)}")
                if attempt < max_retries - 1:
                    backoff_time = 2 ** attempt  # Exponential backoff
                    logger.info(f"Retrying grading in {backoff_time} seconds...")
                    time.sleep(backoff_time)
                else:
                    logger.error(f"Failed to get grading after {max_retries} attempts")
                    state["grade"] = "Error: Unable to grade due to service issues"
                    state["feedback"] = "The system encountered an error while trying to grade this assignment. Please try again later."
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
        # Initialize the state for the workflow
        initial_state = {
            "question": question,
            "student_answer": student_answer,
            "reference_material": reference_material,
            "search_results": None,
            "analysis": None,
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
            # No need to specify input node as the graph has a START edge
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
            
            # Return the results
            return {
                "grade": final_state.get("grade", "Unable to determine grade"),
                "feedback": final_state.get("feedback", "No feedback generated"),
                "analysis": final_state.get("analysis", "No analysis performed"),
                "document_id": doc_id,
                "success": True
            }
            
        except ValueError as e:
            logger.error(f"Value error in assignment checking workflow: {e}")
            return {
                "grade": "Error",
                "feedback": f"Invalid input: {str(e)}",
                "analysis": "",
                "success": False
            }
        except Exception as e:
            logger.error(f"Error in assignment checking workflow: {e}")
            return {
                "grade": "Error",
                "feedback": f"An error occurred during checking: {str(e)}",
                "analysis": "",
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