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
from langchain.vectorstores.chroma import Chroma
from langchain.embeddings import HuggingFaceEmbeddings
import langgraph.graph as lg
import pyttsx3
import PyPDF2
import io
import uuid
import os
from datetime import datetime
import chromadb

# Load the environment variables
load_dotenv()

# Set up the logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

class AssignmentChecker:
    def __init__(self, vector_db_dir="./vector_db"):
        # genai.configure(api_key=os.getenv("GOOGLE_API_KEY"))
        # self.chat = ChatGoogleGenerativeAI()
        # self.graph = lg.Graph()
        # self.graph.load_graph()
        # self.graph.load_data()
        """
        initializing the Assignment Checker with gemini 2.5 pro lattest models and tools 
        """

        # configuring genai
        genai.configure(api_key=os.getenv("GOOGLE_API_KEY"))

        self.llm=ChatGoogleGenerativeAI(
            model='gemini-2.5-pro-exp-03-25',
            google_api_key=os.getenv("GOOGLE_API_KEY"),
            temperature=0.1,
            convert_system_message_to_human=True,
        )
        
        self.vector_db_dir = vector_db_dir
        
        # Initialize embeddings model - using a smaller model for efficiency
        self.embeddings = HuggingFaceEmbeddings(
            model_name="sentence-transformers/all-MiniLM-L6-v2"
        )
        
        # Initialize ChromaDB vector store
        self._initialize_vector_db()
        
        # Build the workflow graph
        self.checker_app = self._build_workflow_graph()
        logger.info("AssignmentChecker initialized successfully with vector database")

    def process_pdf(self, pdf_file: BinaryIO) -> Tuple[str, str]:
        """
        Process a PDF file to extract text content and store in vector DB.
        
        Args:
            pdf_file: The PDF file as a binary stream
            
        Returns:
            Tuple of (extracted_text, document_id)
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
            
        except Exception as e:
            logger.error(f"Error processing PDF: {str(e)}")
            raise ValueError(f"Failed to process PDF: {str(e)}")
    
    def _initialize_vector_db(self):
        """
            Initialize the vector database for storing and retrieving assignments.
        
            This creates a persistent ChromaDB collection for assignments with their 
            embeddings for semantic search capabilities.
        """
        try :
            os.makedirs(self.vector_db_dir, exist_ok=True)

            # Initialize the ChromaDB vector store

            self.vector_db=Chroma(
                collection_name="assignments",
                embedding_function=self.embeddings,
                persist_directory=self.vector_db_dir,
            )
            logger.info("Vector database initialized successfully")
        except Exception as e:
            logger.error(f"Error initializing vector database: {str(e)}")
            self.vector_db = Chroma(
                collection_name="assignments",
                embedding_function=self.embeddings
            )

    @tool
    def search_web(self, query: str) -> str:
        """Search the web for information related to the assignment topic."""
        # Using a free API for demonstration (replace with a more robust solution in production)
        search_url = f"https://api.duckduckgo.com/?query={query}&limit=3"
        
        try:
            response = requests.get(search_url)
            results = response.json()
            
            formatted_results = ""
            for i, result in enumerate(results):
                formatted_results += f"Source {i+1}: {result.get('title', 'No title')}\n"
                formatted_results += f"URL: {result.get('link', 'No link')}\n"
                formatted_results += f"Snippet: {result.get('snippet', 'No snippet')}\n\n"
            
            return formatted_results if formatted_results else "No search results found."
        
        except Exception as e:
            logger.error(f"Search error: {e}")
            return f"Error performing web search: {str(e)}"

    # Storing in the vector store 
    def store_in_vector_db(self, content: str, metadata: Dict[str, Any]) -> str:
        """
        Store content in the vector database with associated metadata.
        
        Args:
            content: Text content to store
            metadata: Associated metadata (student name, question, grade, etc.)
            
        Returns:
            The document ID in the vector database
        """
        try:
            # generating unique if for document if not provided in the metadata 
            doc_id = metadata.get("id", str(uuid.uuid4()))
            # Ensure ID is in metadata
            metadata["id"] = doc_id

            ## adding time stamp if not present 
            if "timestamp" not in metadata:
                metadata["timestamp"] = datetime.now().isoformat()

            # Split text into chunks if it's too long
            text_splitter = RecursiveCharacterTextSplitter(
                chunk_size=1000,
                chunk_overlap=100
            )
            chunks = text_splitter.split_text(content)

            documents = [
                Document(
                    page_content=chunk,
                    metadata=metadata
                ) for chunk in chunks
            ]
            # Add to vector store
            self.vector_db.add_documents(documents)
            self.vector_db.persist()  # Save to disk
            
            logger.info(f"Content stored in vector DB with ID: {doc_id}, chunks: {len(chunks)}")
            return doc_id
            
        except Exception as e:
            logger.error(f"Error storing in vector database: {str(e)}")
            raise ValueError(f"Failed to store in vector database: {str(e)}")
    

    class CheckerState(TypedDict):
        question:str
        student_answer:str
        reference_material:str
        search_results:str
        analysis:str
        grade:Optional[str]
        feedback:Optional[str]
        messages:List[Any]
        next:Optional[str]

    def _research_node(self,state:CheckerState) -> CheckerState:
        """
        Research node: Searches for relevant information to help grade the assignment.
        
        This node generates a search query based on the question and answer,
        then performs a web search to gather relevant information.
        """
        question = state["question"]
        student_answer = state["student_answer"]

        research_prompt = f"""
        I need to check a student's assignment answer for accuracy and quality.
        Assignment question: {question}
        Student's answer: {student_answer}
        What specific information should I search for to verify the accuracy and completeness 
        of this answer? Generate a concise search query that will help me find relevant information.
        """

        messages=[
            SystemMessage(
                content="You are an expert educational research assistant. Generate effective search queries to find relevant information that will help verify students answers"
            ),
            HumanMessage(
                content=research_prompt
            )
        ]
        response=self.llm.invoke(messages)
        search_query=response.content

        logger.info(f"Generated search query: {search_query}")

        #Execute the search query
        search_results=self.search_web(search_query)
        return {
        **state,
        "search_results": search_results,
        "messages": state.get("messages", []) + [
            HumanMessage(content=research_prompt),
            AIMessage(content=response.content)
        ],
        "next": "analyze"
        }
    
    
    def _analyze_node(self, state: CheckerState) -> CheckerState:
        """
        Analyze node: Evaluates the student answer against research findings.
        
        This node performs a detailed analysis of the student's answer based on
        the question, reference material, and search results.
        """
        question = state["question"]
        student_answer = state["student_answer"]
        search_results = state.get("search_results", "")
        reference_material = state.get("reference_material", "")
        
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
        
        Provide a detailed analysis that identifies specific strengths and weaknesses.
        """
        
        messages = [
            SystemMessage(content="You are an expert educational analyst with deep subject matter expertise. Analyze student work with precision and insight."),
            HumanMessage(content=analysis_prompt)
        ]
        
        response = self.llm.invoke(messages)
        
        return {
            **state,
            "analysis": response.content,
            "messages": state.get("messages", []) + [
                HumanMessage(content=analysis_prompt),
                AIMessage(content=response.content)
            ],
            "next": "grade"
        }
    
    def _grade_node(self, state: CheckerState) -> CheckerState:
        """
        Grade node: Assigns a grade and provides personalized feedback.
        
        This node uses the analysis to generate a grade and detailed feedback for
        the student, focusing on helping them improve.
        """
        question = state["question"]
        student_answer = state["student_answer"]
        analysis = state.get("analysis", "")
        
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
        [Your detailed feedback here, organized into clear sections]
        """
        
        messages = [
            SystemMessage(content="You are an experienced teacher providing fair and constructive feedback. Be specific, balanced, and focused on helping the student improve."),
            HumanMessage(content=grading_prompt)
        ]
        
        response = self.llm.invoke(messages)
        
        # Extract grade from response
        feedback_text = response.content
        grade = "See detailed feedback"
        
        try:
            if "GRADE:" in feedback_text:
                grade_line = [line for line in feedback_text.split('\n') if "GRADE:" in line][0]
                grade = grade_line.split("GRADE:")[1].strip()
        except:
            pass
        logger.info(f"Assigned grade: {grade}")

        #Updating the state with the grade and feedback and state can be used to retrive the info later 
        return {
            **state,
            "grade": grade,
            "feedback": feedback_text,
            "messages": state.get("messages", []) + [
                HumanMessage(content=grading_prompt),
                AIMessage(content=response.content)
            ],
            "next": None
        }
    def _build_workflow_graph(self)->Any:
        """
        Build and compile the langgraph workflow for the assignment checker.
        This creates a directed graph with nodes for each step in the process:

         The workflow consists of these steps:
            1. Research - search for relevant information
            2. Analysis - analyze the student's answer
            3. Grading - assign a grade and provide feedback
        

        Returns: Compiled workflow graph
        """

        workflow = lg.Graph()

        workflow.add_node("research",self._research_node)
        workflow.add_node("analyze",self._analyze_node)
        workflow.add_node("grade",self._grade_node)

        # adding conditional edge to start

        def route_start(state):
            return "research"
        
        workflow.add_edge("start", "research", route_start)
        workflow.add_edge("research", "analyze")
        workflow.add_edge("analyze", "grade")

        #Compile the graph
        workflow.compile()
        logger.info("Workflow graph built successfully")
        

    def check_assignment(self, question: str, student_answer: str, student_name: str = "", reference_material: str = "") -> Dict[str, Any]:
        """
        Check a student assignment and provide grading and feedback.
        """
        initial_state = self.CheckerState(
            question=question,
            student_answer=student_answer,
            reference_material=reference_material,
            search_results=None,
            analysis=None,
            grade=None,
            feedback=None,
            messages=[],
            next="start"
        )
        
        try:
            logger.info(f"Starting assignment checking process for {student_name if student_name else 'a student'}")
            result = self.checker_app.invoke(initial_state)
            
            # Store the checked assignment in the vector database
            metadata = {
                "student_name": student_name if student_name else "Unknown",
                "question": question,
                "grade": result.get("grade", "No grade"),
                "timestamp": datetime.now().isoformat(),
                "type": "assignment"
            }
            
            doc_id = self.store_in_vector_db(
                content=student_answer,
                metadata=metadata
            )
            
            return {
                "grade": result.get("grade", "Unable to determine grade"),
                "feedback": result.get("feedback", "No feedback generated"),
                "analysis": result.get("analysis", "No analysis performed"),
                "document_id": doc_id,
                "success": True
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
            
        except Exception as e:
            logger.error(f"Error checking PDF assignment: {e}")
            return {
                "grade": "Error",
                "feedback": f"An error processing the PDF assignment: {str(e)}",
                "success": False
            }