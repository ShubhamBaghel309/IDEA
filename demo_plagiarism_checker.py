"""
Demo script to test the plagiarism detection functionality without the StreamLit UI
This can be used to test the core functionality of the plagiarism.py module
"""

import os
import tempfile
from assistant.core.plagiarism import calculate_plagiarism, extract_text_from_docx, read_text_file
import docx

def create_test_docx(content, filename):
    """Create a test Word document with the given content"""
    doc = docx.Document()
    doc.add_paragraph(content)
    doc.save(filename)
    return filename

def create_test_txt(content, filename):
    """Create a test text file with the given content"""
    with open(filename, 'w') as f:
        f.write(content)
    return filename

def test_knowledge_base_workflow():
    """Test the complete workflow of creating and using a knowledge base"""
    print("\n===== Testing Knowledge Base Workflow =====")
    
    # Create a temporary directory for test files
    with tempfile.TemporaryDirectory() as temp_dir:
        # Create knowledge base documents
        kb_texts = [
            "Machine learning is a field of study in artificial intelligence concerned with the development of algorithms and statistical models that computer systems use to perform tasks without explicit instructions, relying on patterns and inference instead.",
            "Natural language processing (NLP) is a subfield of linguistics, computer science, and artificial intelligence concerned with the interactions between computers and human language.",
            "Computer vision is an interdisciplinary field that deals with how computers can be made to gain high-level understanding from digital images or videos."
        ]
        
        kb_files = []
        kb_contents = []
        
        # Create text files for knowledge base
        print("Creating knowledge base documents...")
        for i, text in enumerate(kb_texts):
            filename = os.path.join(temp_dir, f"kb_document_{i+1}.txt")
            create_test_txt(text, filename)
            kb_files.append(filename)
            kb_contents.append(text)
            print(f"Created: {filename}")
        
        # Create a Word document for knowledge base
        docx_content = "Deep learning is part of a broader family of machine learning methods based on artificial neural networks with representation learning."
        docx_filename = os.path.join(temp_dir, "kb_document_docx.docx")
        create_test_docx(docx_content, docx_filename)
        kb_files.append(docx_filename)
        kb_contents.append(docx_content)
        print(f"Created: {docx_filename}")
        
        # Test cases to check against knowledge base
        test_cases = [
            {
                "name": "High Plagiarism",
                "content": "Machine learning is a field of study in artificial intelligence concerned with the development of algorithms and statistical models that systems use to perform tasks without explicit instructions.",
                "expected": "high"
            },
            {
                "name": "Medium Plagiarism",
                "content": "Machine learning involves algorithms that allow computers to learn from data without being explicitly programmed to perform specific tasks.",
                "expected": "medium"
            },
            {
                "name": "Low Plagiarism",
                "content": "Quantum computing uses quantum bits which can represent both 0 and 1 simultaneously through superposition.",
                "expected": "low"
            },
            {
                "name": "Word Document Match",
                "content": "Deep learning is part of machine learning based on neural networks with representation learning techniques.",
                "expected": "high"
            }
        ]
        
        # Test each case against the knowledge base
        print("\nTesting documents against knowledge base...")
        for test_case in test_cases:
            print(f"\nTest Case: {test_case['name']}")
            print(f"Document: {test_case['content'][:60]}...")
            
            # Calculate plagiarism
            plagiarism_percentage, similarities = calculate_plagiarism(
                test_case['content'],
                kb_contents
            )
            
            print(f"Overall Plagiarism: {plagiarism_percentage:.2f}%")
            print("Individual document similarities:")
            
            for i, (file, similarity) in enumerate(zip(kb_files, similarities)):
                print(f"- {os.path.basename(file)}: {similarity*100:.2f}%")
            
            # Verify against expected result
            result_category = "low" if plagiarism_percentage < 30 else "medium" if plagiarism_percentage < 60 else "high"
            match_result = "✓ MATCH" if result_category == test_case["expected"] else "✗ MISMATCH"
            print(f"Result: {result_category.upper()} plagiarism ({match_result} with expected {test_case['expected'].upper()})")

if __name__ == "__main__":
    test_knowledge_base_workflow()