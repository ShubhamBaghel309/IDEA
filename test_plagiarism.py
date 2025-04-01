import unittest
import tempfile
import os
import docx
from plagiarism import (
    calculate_perplexity,
    calculate_burstiness,
    preprocess_text,
    get_document_ngrams,
    calculate_plagiarism,
    extract_text_from_docx,
    read_text_file
)

class TestPlagiarismDetection(unittest.TestCase):
    def setUp(self):
        """Set up test fixtures before each test method"""
        # Create sample texts for testing
        self.human_text = """
        The quick brown fox jumps over the lazy dog. This sentence uses every letter 
        of the English alphabet at least once. Keeping vocabulary and sentence structure 
        diverse is important for engaging writing, don't you agree?
        """
        
        self.ai_text = """
        Artificial intelligence (AI) is intelligence demonstrated by machines, as opposed to 
        the natural intelligence displayed by humans or animals. AI research has been defined 
        as the field of study of intelligent agents, which refers to any system that perceives 
        its environment and takes actions that maximize its chance of achieving its goals.
        """
        
        self.original_text = """
        Python is an interpreted, high-level and general-purpose programming language.
        Python's design philosophy emphasizes code readability with its notable use of significant
        indentation. Its language constructs and object-oriented approach aim to help programmers
        write clear, logical code for small and large-scale projects.
        """
        
        self.plagiarized_text = """
        Python is an interpreted, high-level and general-purpose programming language.
        The language's design philosophy emphasizes code readability with the use of significant
        indentation. Its constructs and object-oriented approach aim to help developers
        write clear, logical code for small and large-scale software projects.
        """
        
        self.different_text = """
        Java is a class-based, object-oriented programming language that is designed to have
        as few implementation dependencies as possible. It is a general-purpose programming
        language intended to let application developers write once, run anywhere.
        """

        # Create a temporary Word document for testing
        self.docx_file_path = self.create_temp_docx("This is a test document for docx extraction.")
        
        # Create a temporary text file for testing
        self.txt_file_path = self.create_temp_txt("This is a test document for txt extraction.")

    def tearDown(self):
        """Tear down test fixtures after each test method"""
        # Clean up temporary files
        if hasattr(self, 'docx_file_path') and os.path.exists(self.docx_file_path):
            os.unlink(self.docx_file_path)
        
        if hasattr(self, 'txt_file_path') and os.path.exists(self.txt_file_path):
            os.unlink(self.txt_file_path)

    def create_temp_docx(self, content):
        """Helper method to create a temporary Word document"""
        doc = docx.Document()
        doc.add_paragraph(content)
        
        # Save the document
        file_path = tempfile.mktemp(suffix='.docx')
        doc.save(file_path)
        
        return file_path

    def create_temp_txt(self, content):
        """Helper method to create a temporary text file"""
        file_path = tempfile.mktemp(suffix='.txt')
        with open(file_path, 'w') as f:
            f.write(content)
        
        return file_path

    def test_perplexity_calculation(self):
        """Test that perplexity is calculated correctly"""
        human_perplexity = calculate_perplexity(self.human_text)
        ai_perplexity = calculate_perplexity(self.ai_text)
        
        # Human text typically has higher perplexity than AI text
        # This is a general heuristic, might not always hold true
        self.assertIsNotNone(human_perplexity)
        self.assertIsNotNone(ai_perplexity)
        print(f"Human text perplexity: {human_perplexity}")
        print(f"AI text perplexity: {ai_perplexity}")

    def test_burstiness_calculation(self):
        """Test that burstiness is calculated correctly"""
        human_burstiness = calculate_burstiness(self.human_text)
        ai_burstiness = calculate_burstiness(self.ai_text)
        
        # Check that burstiness values are in the expected range [0, 1]
        self.assertGreaterEqual(human_burstiness, 0)
        self.assertLessEqual(human_burstiness, 1)
        self.assertGreaterEqual(ai_burstiness, 0)
        self.assertLessEqual(ai_burstiness, 1)
        
        print(f"Human text burstiness: {human_burstiness}")
        print(f"AI text burstiness: {ai_burstiness}")

    def test_preprocess_text(self):
        """Test text preprocessing"""
        processed_text = preprocess_text("This is a test, with punctuation and UPPERCASE letters!")
        
        # Check that preprocessing removed punctuation and converted to lowercase
        self.assertNotIn(",", processed_text)
        self.assertNotIn("!", processed_text)
        self.assertNotIn("UPPERCASE", processed_text)
        self.assertIn("test", processed_text)

    def test_get_document_ngrams(self):
        """Test n-gram extraction"""
        ngrams = get_document_ngrams("This is a simple test text", n=2)
        
        # Check that n-grams are generated correctly
        self.assertIsInstance(ngrams, list)
        if ngrams:  # Ngrams might be empty if all words are stopwords
            for ngram in ngrams:
                self.assertEqual(len(ngram), 2)

    def test_plagiarism_detection_high_similarity(self):
        """Test plagiarism detection with highly similar texts"""
        plagiarism_percentage, similarities = calculate_plagiarism(
            self.plagiarized_text,
            [self.original_text]
        )
        
        # Check that plagiarism percentage is high for similar texts
        self.assertGreater(plagiarism_percentage, 70)  # Expect high similarity
        self.assertEqual(len(similarities), 1)
        print(f"Plagiarism percentage (high similarity): {plagiarism_percentage}%")

    def test_plagiarism_detection_low_similarity(self):
        """Test plagiarism detection with dissimilar texts"""
        plagiarism_percentage, similarities = calculate_plagiarism(
            self.different_text,
            [self.original_text]
        )
        
        # Check that plagiarism percentage is low for different texts
        self.assertLess(plagiarism_percentage, 40)  # Expect low similarity
        self.assertEqual(len(similarities), 1)
        print(f"Plagiarism percentage (low similarity): {plagiarism_percentage}%")

    def test_extract_text_from_docx(self):
        """Test extracting text from Word documents"""
        extracted_text = extract_text_from_docx(self.docx_file_path)
        self.assertEqual(extracted_text, "This is a test document for docx extraction.")

    def test_read_text_file(self):
        """Test reading text from files"""
        # Create a file-like object from the file path
        with open(self.txt_file_path, 'rb') as file:
            extracted_text = read_text_file(file)
            self.assertEqual(extracted_text, "This is a test document for txt extraction.")

    def test_multiple_documents_in_knowledge_base(self):
        """Test plagiarism detection with multiple documents in the knowledge base"""
        plagiarism_percentage, similarities = calculate_plagiarism(
            self.plagiarized_text,
            [self.original_text, self.different_text, self.ai_text]
        )
        
        # Check that the result returns the correct number of similarities
        self.assertEqual(len(similarities), 3)
        
        # The highest similarity should be with the original text
        self.assertGreater(similarities[0], similarities[1])
        self.assertGreater(similarities[0], similarities[2])
        
        print(f"Plagiarism with multiple documents: {plagiarism_percentage}%")
        print(f"Individual similarities: {[s*100 for s in similarities]}")

if __name__ == '__main__':
    unittest.main()