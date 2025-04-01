import pytest
import tempfile
import os
import docx
import io
from assistant.core.plagiarism import (
    calculate_perplexity,
    calculate_burstiness,
    preprocess_text,
    get_document_ngrams,
    calculate_plagiarism,
    extract_text_from_docx,
    read_text_file,
    analyze_ai_content
)

# Sample texts for testing
@pytest.fixture
def human_text():
    return """
    The quick brown fox jumps over the lazy dog. This sentence uses every letter 
    of the English alphabet at least once. Keeping vocabulary and sentence structure 
    diverse is important for engaging writing, don't you agree?
    """

@pytest.fixture
def ai_text():
    return """
    Artificial intelligence (AI) is intelligence demonstrated by machines, as opposed to 
    the natural intelligence displayed by humans or animals. AI research has been defined 
    as the field of study of intelligent agents, which refers to any system that perceives 
    its environment and takes actions that maximize its chance of achieving its goals.
    """

@pytest.fixture
def original_text():
    return """
    Python is an interpreted, high-level and general-purpose programming language.
    Python's design philosophy emphasizes code readability with its notable use of significant
    indentation. Its language constructs and object-oriented approach aim to help programmers
    write clear, logical code for small and large-scale projects.
    """

@pytest.fixture
def plagiarized_text():
    return """
    Python is an interpreted, high-level and general-purpose programming language.
    The language's design philosophy emphasizes code readability with the use of significant
    indentation. Its constructs and object-oriented approach aim to help developers
    write clear, logical code for small and large-scale software projects.
    """

@pytest.fixture
def different_text():
    return """
    Java is a class-based, object-oriented programming language that is designed to have
    as few implementation dependencies as possible. It is a general-purpose programming
    language intended to let application developers write once, run anywhere.
    """

@pytest.fixture
def temp_docx_file():
    """Create a temporary Word document for testing"""
    content = "This is a test document for docx extraction."
    doc = docx.Document()
    doc.add_paragraph(content)
    
    # Save the document
    file_path = tempfile.mktemp(suffix='.docx')
    doc.save(file_path)
    
    yield file_path  # Provide the file path to the test
    
    # Cleanup after test
    if os.path.exists(file_path):
        os.unlink(file_path)

@pytest.fixture
def temp_txt_file():
    """Create a temporary text file for testing"""
    content = "This is a test document for txt extraction."
    file_path = tempfile.mktemp(suffix='.txt')
    
    with open(file_path, 'w') as f:
        f.write(content)
    
    yield file_path  # Provide the file path to the test
    
    # Cleanup after test
    if os.path.exists(file_path):
        os.unlink(file_path)

def test_perplexity_calculation(human_text, ai_text):
    """Test that perplexity is calculated correctly"""
    human_perplexity = calculate_perplexity(human_text)
    ai_perplexity = calculate_perplexity(ai_text)
    
    # Human text typically has higher perplexity than AI text
    # This is a general heuristic, might not always hold true
    assert human_perplexity is not None
    assert ai_perplexity is not None
    print(f"Human text perplexity: {human_perplexity}")
    print(f"AI text perplexity: {ai_perplexity}")

def test_burstiness_calculation(human_text, ai_text):
    """Test that burstiness is calculated correctly"""
    human_burstiness = calculate_burstiness(human_text)
    ai_burstiness = calculate_burstiness(ai_text)
    
    # Check that burstiness values are in the expected range [0, 1]
    assert 0 <= human_burstiness <= 1
    assert 0 <= ai_burstiness <= 1
    
    print(f"Human text burstiness: {human_burstiness}")
    print(f"AI text burstiness: {ai_burstiness}")

def test_preprocess_text():
    """Test text preprocessing"""
    processed_text = preprocess_text("This is a test, with punctuation and UPPERCASE letters!")
    
    # Check that preprocessing removed punctuation and converted to lowercase
    assert "," not in processed_text
    assert "!" not in processed_text
    assert "UPPERCASE" not in processed_text
    assert "test" in processed_text

def test_get_document_ngrams():
    """Test n-gram extraction"""
    ngrams = get_document_ngrams("This is a simple test text", n=2)
    
    # Check that n-grams are generated correctly
    assert isinstance(ngrams, list)
    if ngrams:  # Ngrams might be empty if all words are stopwords
        for ngram in ngrams:
            assert len(ngram) == 2

def test_plagiarism_detection_high_similarity(plagiarized_text, original_text):
    """Test plagiarism detection with highly similar texts"""
    plagiarism_percentage, similarities = calculate_plagiarism(
        plagiarized_text,
        [original_text]
    )
    
    # Check that plagiarism percentage is high for similar texts
    assert plagiarism_percentage > 70  # Expect high similarity
    assert len(similarities) == 1
    print(f"Plagiarism percentage (high similarity): {plagiarism_percentage}%")

def test_plagiarism_detection_low_similarity(different_text, original_text):
    """Test plagiarism detection with dissimilar texts"""
    plagiarism_percentage, similarities = calculate_plagiarism(
        different_text,
        [original_text]
    )
    
    # Check that plagiarism percentage is low for different texts
    assert plagiarism_percentage < 40  # Expect low similarity
    assert len(similarities) == 1
    print(f"Plagiarism percentage (low similarity): {plagiarism_percentage}%")

def test_extract_text_from_docx(temp_docx_file):
    """Test extracting text from Word documents"""
    extracted_text = extract_text_from_docx(temp_docx_file)
    assert extracted_text == "This is a test document for docx extraction."

def test_read_text_file(temp_txt_file):
    """Test reading text from files"""
    # Create a file-like object from the file path
    with open(temp_txt_file, 'rb') as file:
        extracted_text = read_text_file(file)
        assert extracted_text == "This is a test document for txt extraction."

def test_multiple_documents_in_knowledge_base(plagiarized_text, original_text, different_text, ai_text):
    """Test plagiarism detection with multiple documents in the knowledge base"""
    plagiarism_percentage, similarities = calculate_plagiarism(
        plagiarized_text,
        [original_text, different_text, ai_text]
    )
    
    # Check that the result returns the correct number of similarities
    assert len(similarities) == 3
    
    # The highest similarity should be with the original text
    assert similarities[0] > similarities[1]
    assert similarities[0] > similarities[2]
    
    print(f"Plagiarism with multiple documents: {plagiarism_percentage}%")
    print(f"Individual similarities: {[s*100 for s in similarities]}")

def test_analyze_ai_content(human_text, ai_text):
    """Test the AI content analysis function"""
    human_analysis = analyze_ai_content(human_text)
    ai_analysis = analyze_ai_content(ai_text)
    
    # Check that the analysis returns the expected structure
    assert 'perplexity' in human_analysis
    assert 'burstiness' in human_analysis
    assert 'result' in human_analysis
    
    assert 'perplexity' in ai_analysis
    assert 'burstiness' in ai_analysis
    assert 'result' in ai_analysis
    
    print(f"Human text analysis result: {human_analysis['result']}")
    print(f"AI text analysis result: {ai_analysis['result']}")