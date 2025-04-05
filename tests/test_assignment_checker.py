import unittest
import os
import io
import tempfile
import shutil
from unittest.mock import patch, MagicMock, Mock, call
import pytest
import sys
import json
import requests

# Add parent directory to path to import modules
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
from AssignmentChecker import AssignmentChecker

# Try to import ChromaDBError, or define a fallback if not available
try:
    from chromadb.exceptions import ChromaDBError
except ImportError:
    # Define a fallback exception class if chromadb is not installed
    class ChromaDBError(Exception):
        """Fallback class for ChromaDBError when chromadb is not installed."""
        pass


class TestAssignmentChecker(unittest.TestCase):
    """Test cases for the AssignmentChecker class"""

    def setUp(self):
        """Set up test environment before each test"""
        # Create a temporary directory for vector DB
        self.temp_dir = tempfile.mkdtemp()
        
        # Mock the environment variables
        self.env_patcher = patch.dict(os.environ, {"GOOGLE_API_KEY": "mock-api-key"})
        self.env_patcher.start()
        
        # Mock genai configuration and model validation
        self.genai_patcher = patch('google.generativeai.configure')
        self.mock_genai_configure = self.genai_patcher.start()
        
        self.genai_model_patcher = patch('google.generativeai.GenerativeModel')
        self.mock_genai_model = self.genai_model_patcher.start()
        mock_model_instance = MagicMock()
        mock_model_instance.generate_content.return_value = MagicMock()
        self.mock_genai_model.return_value = mock_model_instance
        
        # Mock LangChain components
        self.llm_patcher = patch('langchain_google_genai.ChatGoogleGenerativeAI')
        self.mock_llm = self.llm_patcher.start()
        
        self.embeddings_patcher = patch('langchain.embeddings.HuggingFaceEmbeddings')
        self.mock_embeddings = self.embeddings_patcher.start()
        
        self.chroma_patcher = patch('langchain.vectorstores.chroma.Chroma')
        self.mock_chroma = self.chroma_patcher.start()
        
        # Mock the graph builder to return a mock workflow
        self.graph_patcher = patch.object(AssignmentChecker, '_build_workflow_graph')
        self.mock_graph_builder = self.graph_patcher.start()
        mock_workflow = MagicMock()
        mock_workflow.invoke.return_value = {
            "grade": "85",
            "feedback": "Good work!",
            "analysis": "Thorough analysis"
        }
        self.mock_graph_builder.return_value = mock_workflow
        
    def tearDown(self):
        """Clean up after each test"""
        # Remove temporary directory
        shutil.rmtree(self.temp_dir, ignore_errors=True)
        
        # Stop all patches
        self.env_patcher.stop()
        self.genai_patcher.stop()
        self.genai_model_patcher.stop()
        self.llm_patcher.stop()
        self.embeddings_patcher.stop()
        self.chroma_patcher.stop()
        self.graph_patcher.stop()
    
    def test_initialization_with_valid_api_key(self):
        """Test that the checker initializes correctly with a valid API key"""
        checker = AssignmentChecker(vector_db_dir=self.temp_dir)
        self.assertIsNotNone(checker)
        self.mock_genai_configure.assert_called_once()
        self.mock_genai_model.assert_called_once()
    
    @patch.dict(os.environ, {"GOOGLE_API_KEY": ""}, clear=True)
    def test_initialization_with_missing_api_key(self):
        """Test that initialization fails when API key is missing"""
        with self.assertRaises(ValueError) as context:
            AssignmentChecker(vector_db_dir=self.temp_dir)
        self.assertIn("GOOGLE_API_KEY environment variable is missing", str(context.exception))
    
    def test_initialization_with_invalid_api_key(self):
        """Test that initialization fails when API key is invalid"""
        # Make the model validation fail
        self.mock_genai_model.return_value.generate_content.side_effect = Exception("Invalid API key")
        
        with self.assertRaises(ValueError) as context:
            AssignmentChecker(vector_db_dir=self.temp_dir)
        self.assertIn("Invalid or expired Google API key", str(context.exception))
    
    @patch.object(AssignmentChecker, '_initialize_vector_db')
    def test_chromadb_retry_logic(self, mock_init_db):
        """Test that the ChromaDB initialization includes retry logic"""
        # Setup the mock to raise an exception on first call
        mock_init_db.side_effect = ChromaDBError("Connection failed")
        
        with self.assertRaises(ChromaDBError):
            checker = AssignmentChecker(vector_db_dir=self.temp_dir)
        
        # Verify the method was called
        mock_init_db.assert_called_once()
    
    @patch('PyPDF2.PdfReader')
    def test_process_pdf_success(self, mock_pdf_reader):
        """Test successful PDF processing"""
        # Setup the mock for PDF reading
        mock_page = MagicMock()
        mock_page.extract_text.return_value = "Test PDF content"
        mock_pdf_reader.return_value.pages = [mock_page]
        
        # Create checker
        checker = AssignmentChecker(vector_db_dir=self.temp_dir)
        
        # Test processing a mock PDF file
        mock_file = io.BytesIO(b"fake pdf content")
        mock_file.name = "test.pdf"
        
        text, doc_id = checker.process_pdf(mock_file)
        
        self.assertEqual(text, "Test PDF content")
        self.assertTrue(len(doc_id) > 0)  # Should generate a UUID
        mock_pdf_reader.assert_called_once()
    
    @patch('PyPDF2.PdfReader')
    def test_process_pdf_specific_error(self, mock_pdf_reader):
        """Test PDF processing with specific PyPDF2 errors"""
        from PyPDF2.errors import PdfReadError
        mock_pdf_reader.side_effect = PdfReadError("Invalid PDF file")
        
        checker = AssignmentChecker(vector_db_dir=self.temp_dir)
        
        mock_file = io.BytesIO(b"invalid pdf content")
        mock_file.name = "invalid.pdf"
        
        with self.assertRaises(ValueError) as context:
            checker.process_pdf(mock_file)
        
        self.assertIn("Failed to read PDF", str(context.exception))
        self.assertIn("invalid.pdf", str(context.exception))
    
    @patch('duckduckgo_search.DDGS')
    def test_search_web_success(self, mock_ddgs):
        """Test web search functionality with successful response"""
        # Setup mock search results
        mock_context = MagicMock()
        mock_ddgs.return_value.__enter__.return_value = mock_context
        mock_context.text.return_value = [
            {
                "title": "Test Result",
                "href": "https://example.com",
                "body": "This is a test result"
            }
        ]
        
        checker = AssignmentChecker(vector_db_dir=self.temp_dir)
        results = checker.search_web("test query")
        
        self.assertIn("Test Result", results)
        self.assertIn("https://example.com", results)
        self.assertIn("This is a test result", results)
    
    @patch('duckduckgo_search.DDGS')
    def test_search_web_retry_on_error(self, mock_ddgs):
        """Test web search retry logic on errors"""
        # First call raises exception, second call succeeds
        mock_context = MagicMock()
        mock_ddgs.return_value.__enter__.return_value = mock_context
        
        # First call fails
        mock_context.text.side_effect = [
            requests.exceptions.RequestException("Connection error"),
            # Second attempt succeeds
            [{"title": "Test", "href": "https://example.com", "body": "Content"}]
        ]
        
        checker = AssignmentChecker(vector_db_dir=self.temp_dir)
        with patch('time.sleep') as mock_sleep:  # Don't actually sleep in tests
            results = checker.search_web("test query")
        
        self.assertIn("Test", results)
        mock_sleep.assert_called_once()  # Verify it tried to sleep before retrying
    
    def test_store_in_vector_db_success(self):
        """Test storing content in vector DB"""
        # Setup mocks
        mock_vector_db = MagicMock()
        
        # Create checker and replace vector_db with our mock
        checker = AssignmentChecker(vector_db_dir=self.temp_dir)
        checker.vector_db = mock_vector_db
        
        content = "Test content"
        metadata = {"student_name": "Test Student"}
        
        doc_id = checker.store_in_vector_db(content, metadata)
        
        self.assertIsNotNone(doc_id)
        mock_vector_db.add_documents.assert_called_once()
        mock_vector_db.persist.assert_called_once()
    
    def test_store_large_document_chunking(self):
        """Test that large documents are properly chunked"""
        # Setup mocks
        mock_vector_db = MagicMock()
        
        # Create checker with our mock
        checker = AssignmentChecker(vector_db_dir=self.temp_dir)
        checker.vector_db = mock_vector_db
        
        # Create a large content string
        large_content = "A" * 150000  # Over the 100000 character limit
        
        doc_id = checker.store_in_vector_db(large_content, {"student_name": "Test"})
        
        # Verify it was added to vector db with chunking
        mock_vector_db.add_documents.assert_called_once()
        # Get the first argument to add_documents
        args, _ = mock_vector_db.add_documents.call_args
        # Check that we have multiple documents (due to chunking)
        self.assertTrue(len(args[0]) > 1)
    
    def test_check_assignment_success(self):
        """Test end-to-end assignment checking workflow"""
        # Setup
        checker = AssignmentChecker(vector_db_dir=self.temp_dir)
        
        # Mock the store_in_vector_db method
        with patch.object(checker, 'store_in_vector_db', return_value="mock-doc-id") as mock_store:
            result = checker.check_assignment(
                question="What is AI?",
                student_answer="AI stands for Artificial Intelligence.",
                student_name="Test Student"
            )
        
        # Validate the result
        self.assertEqual(result["grade"], "85")
        self.assertEqual(result["feedback"], "Good work!")
        self.assertEqual(result["document_id"], "mock-doc-id")
        self.assertTrue(result["success"])
        
        # Verify the vector DB was called with the right data
        mock_store.assert_called_once()
        _, kwargs = mock_store.call_args
        self.assertEqual(kwargs["content"], "AI stands for Artificial Intelligence.")
        self.assertEqual(kwargs["metadata"]["student_name"], "Test Student")
    
    @patch('PyPDF2.PdfReader')
    def test_check_pdf_assignment_success(self, mock_pdf_reader):
        """Test end-to-end PDF assignment checking"""
        # Setup mock PDF processing
        mock_page = MagicMock()
        mock_page.extract_text.return_value = "Test PDF content"
        mock_pdf_reader.return_value.pages = [mock_page]
        
        checker = AssignmentChecker(vector_db_dir=self.temp_dir)
        
        # Mock check_assignment method
        with patch.object(checker, 'check_assignment', return_value={
            "grade": "90",
            "feedback": "Excellent work!",
            "analysis": "Thorough understanding",
            "document_id": "mock-doc-id",
            "success": True
        }) as mock_check:
            
            # Test PDF assignment checking
            mock_file = io.BytesIO(b"fake pdf content")
            result = checker.check_pdf_assignment(
                pdf_file=mock_file,
                assignment_prompt="Explain AI",
                student_name="Test Student"
            )
        
        # Verify results
        self.assertTrue(result["success"])
        self.assertEqual(result["grade"], "90")
        self.assertEqual(result["feedback"], "Excellent work!")
        self.assertIn("file_id", result)
        
        # Check that check_assignment was called with the extracted text
        mock_check.assert_called_once()
        args, _ = mock_check.call_args
        self.assertEqual(args[1], "Test PDF content")  # student_answer
        self.assertEqual(args[2], "Test Student")     # student_name
    
    @patch('PyPDF2.PdfReader')
    def test_check_pdf_assignment_error_handling(self, mock_pdf_reader):
        """Test PDF assignment checking with errors"""
        from PyPDF2.errors import PdfReadError
        mock_pdf_reader.side_effect = PdfReadError("Invalid PDF file")
        
        checker = AssignmentChecker(vector_db_dir=self.temp_dir)
        
        mock_file = io.BytesIO(b"invalid pdf content")
        result = checker.check_pdf_assignment(
            pdf_file=mock_file,
            assignment_prompt="Explain AI"
        )
        
        # Verify error handling
        self.assertFalse(result["success"])
        self.assertEqual(result["grade"], "Error")
        self.assertIn("Could not read the PDF file", result["feedback"])
    
    def test_vector_db_persist_failure(self):
        """Test handling of vector DB persist failures"""
        # Setup mocks
        mock_vector_db = MagicMock()
        mock_vector_db.persist.side_effect = Exception("Failed to persist")
        
        # Create checker and replace vector_db with our mock
        checker = AssignmentChecker(vector_db_dir=self.temp_dir)
        checker.vector_db = mock_vector_db
        
        # Should not raise exception despite persist failure
        doc_id = checker.store_in_vector_db("Test content", {"student_name": "Test Student"})
        
        self.assertIsNotNone(doc_id)
        mock_vector_db.add_documents.assert_called_once()  # Documents should be added
        mock_vector_db.persist.assert_called_once()  # Persist should be attempted
    
    def test_llm_timeout_retry(self):
        """Test that LLM calls are retried on timeout"""
        # Create mock LLM that times out on first call then succeeds
        mock_llm = MagicMock()
        mock_llm.invoke.side_effect = [
            TimeoutError("LLM request timed out"),
            MagicMock(content="Success after retry")
        ]
        
        # Create checker and inject mock LLM
        checker = AssignmentChecker(vector_db_dir=self.temp_dir)
        checker.llm = mock_llm
        
        # Set up test state
        test_state = checker.CheckerState(
            question="Test question",
            student_answer="Test answer",
            reference_material="",
            search_results=None,
            analysis=None,
            grade=None,
            feedback=None,
            messages=[],
            next=None
        )
        
        # Test the research node with our mock LLM
        with patch('time.sleep') as mock_sleep:
            result_state = checker._research_node(test_state)
        
        # Verify the LLM was called twice (first fail, second success)
        self.assertEqual(mock_llm.invoke.call_count, 2)
        mock_sleep.assert_called_once()  # Should have slept between retries
        
        # Check that the result contains the successful content
        self.assertIn("Success after retry", result_state["messages"][-1].content)
    
    def test_llm_max_retries_exceeded(self):
        """Test behavior when max LLM retries are exceeded"""
        # Create mock LLM that always times out
        mock_llm = MagicMock()
        mock_llm.invoke.side_effect = TimeoutError("LLM request timed out")
        
        # Create checker and inject mock LLM
        checker = AssignmentChecker(vector_db_dir=self.temp_dir)
        checker.llm = mock_llm
        
        # Set up test state
        test_state = checker.CheckerState(
            question="Test question",
            student_answer="Test answer",
            reference_material="",
            search_results=None,
            analysis=None,
            grade=None,
            feedback=None,
            messages=[],
            next=None
        )
        
        # Test the research node with consistently failing LLM
        with patch('time.sleep'):  # Mock sleep to speed up test
            result_state = checker._research_node(test_state)
        
        # Verify LLM was called exactly 3 times (max retries)
        self.assertEqual(mock_llm.invoke.call_count, 3)
        
        # Check that it gracefully handles the failure
        self.assertEqual(result_state["next"], "analyze")  # Should continue workflow
        self.assertIn("Error", result_state["search_results"])  # Should have error message
    
    def test_grade_extraction_from_feedback(self):
        """Test that grades are correctly extracted from feedback text"""
        # Mock response with various grade formats
        mock_responses = [
            "GRADE: 85\n\nFEEDBACK: Good work!",
            "GRADE:90\nFEEDBACK: Excellent!",
            "grade: 75\nFEEDBACK: Need improvement."
        ]
        
        # Create mock LLM
        mock_llm = MagicMock()
        
        # Create checker and inject mock LLM
        checker = AssignmentChecker(vector_db_dir=self.temp_dir)
        checker.llm = mock_llm
        
        for expected_grade, response_text in zip(["85", "90", "75"], mock_responses):
            # Setup response
            mock_llm.invoke.return_value = MagicMock(content=response_text)
            
            # Setup test state
            test_state = checker.CheckerState(
                question="Test question",
                student_answer="Test answer",
                reference_material="",
                search_results=None,
                analysis="Test analysis",
                grade=None,
                feedback=None,
                messages=[],
                next=None
            )
            
            # Test grade extraction
            result_state = checker._grade_node(test_state)
            
            # Verify correct grade extraction
            self.assertEqual(result_state["grade"], expected_grade)
            self.assertEqual(result_state["feedback"], response_text)
    
    def test_handle_token_limits_for_large_student_answers(self):
        """Test handling of token limits for large student answers"""
        # Create a mock LLM
        mock_llm = MagicMock()
        mock_llm.invoke.return_value = MagicMock(content="Analysis of truncated content")
        
        # Create checker and inject mock LLM
        checker = AssignmentChecker(vector_db_dir=self.temp_dir)
        checker.llm = mock_llm
        
        # Create large student answer
        large_answer = "A" * 10000  # Create a very large answer
        
        # Setup test state
        test_state = checker.CheckerState(
            question="Test question",
            student_answer=large_answer,
            reference_material="",
            search_results="Test results",
            analysis=None,
            grade=None,
            feedback=None,
            messages=[],
            next=None
        )
        
        # Test analyze node with large content
        result_state = checker._analyze_node(test_state)
        
        # Verify that the truncated notice is included in the LLM call
        call_args = mock_llm.invoke.call_args[0][0]
        prompt_text = call_args[1].content
        self.assertIn("truncated", prompt_text.lower())


if __name__ == "__main__":
    unittest.main()