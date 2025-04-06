import torch
import nltk
from nltk.util import ngrams
from nltk.probability import FreqDist
from collections import Counter
from transformers import GPT2Tokenizer, GPT2LMHeadModel
from nltk.corpus import stopwords
import string
import torch.nn.functional as F
import os
import docx
import numpy as np
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.metrics.pairwise import cosine_similarity
import tempfile
import io

# Download NLTK resources
nltk.download('punkt', quiet=True)
nltk.download('stopwords', quiet=True)

# Load tokenizer and model
tokenizer = GPT2Tokenizer.from_pretrained('gpt2')
model = GPT2LMHeadModel.from_pretrained('gpt2')

def extract_text_from_docx(file):
    """Extract text content from a Word document file."""
    doc = docx.Document(file)
    full_text = []
    for para in doc.paragraphs:
        full_text.append(para.text)
    return '\n'.join(full_text)

def read_text_file(file):
    """Read the content of a text file."""
    content = file.read()
    if isinstance(content, bytes):
        return content.decode('utf-8')
    return content

def calculate_perplexity(text):
    """Calculate the perplexity score of a given text.
    For longer texts, we calculate perplexity in chunks to handle token limits.
    """
    # Handle empty or very short texts
    if not text or len(text) < 10:
        return 10000  # High perplexity (likely human) for very short texts

    # Tokenize the text
    try:
        # Process text in chunks to avoid token length issues
        max_length = 512  # GPT-2 context window size
        
        # For longer texts, process in chunks and take the minimum perplexity
        # This catches AI-generated segments within larger texts
        if len(text) > 1000:  # For longer texts
            chunks = [text[i:i+1000] for i in range(0, len(text), 750)]  # Overlapping chunks
            perplexities = []
            
            for chunk in chunks:
                encoded_input = tokenizer.encode(chunk, add_special_tokens=False, return_tensors='pt', truncation=True, max_length=max_length)
                if len(encoded_input[0]) == 0:
                    continue
                
                input_ids = encoded_input[0]
                
                with torch.no_grad():
                    outputs = model(input_ids)
                    logits = outputs.logits
                
                # Calculate perplexity for this chunk
                chunk_perplexity = torch.exp(F.cross_entropy(logits.view(-1, logits.size(-1)), input_ids.view(-1)))
                perplexities.append(chunk_perplexity.item())
            
            # Return the minimum perplexity found (most AI-like section)
            return min(perplexities) if perplexities else 5000
        else:
            # For shorter texts, calculate normally
            encoded_input = tokenizer.encode(text, add_special_tokens=False, return_tensors='pt', truncation=True, max_length=max_length)
            input_ids = encoded_input[0]
            
            with torch.no_grad():
                outputs = model(input_ids)
                logits = outputs.logits
            
            perplexity = torch.exp(F.cross_entropy(logits.view(-1, logits.size(-1)), input_ids.view(-1)))
            return perplexity.item()
    except Exception as e:
        print(f"Error calculating perplexity: {e}")
        return 3000  # Default to moderate perplexity on error

def calculate_burstiness(text):
    """Calculate the burstiness score of a given text."""
    tokens = nltk.word_tokenize(text.lower())
    word_freq = FreqDist(tokens)
    repeated_count = sum(count > 1 for count in word_freq.values())
    burstiness_score = repeated_count / len(word_freq) if len(word_freq) > 0 else 0
    return burstiness_score

def preprocess_text(text):
    """Preprocess text by removing stopwords and punctuation."""
    stop_words = set(stopwords.words('english'))
    tokens = nltk.word_tokenize(text.lower())
    tokens = [token for token in tokens if token not in stop_words and token not in string.punctuation]
    return ' '.join(tokens)

def get_document_ngrams(text, n=3):
    """Extract n-grams from text."""
    tokens = nltk.word_tokenize(preprocess_text(text))
    return list(ngrams(tokens, n))

def calculate_plagiarism(document_text, knowledge_base_texts, n=3):
    """Calculate plagiarism percentage using perplexity and burstiness metrics."""
    # Calculate perplexity for the document
    perplexity = calculate_perplexity(document_text)
    
    # Calculate burstiness for the document 
    burstiness = calculate_burstiness(document_text)
    
    # Calculate a combined plagiarism score
    # 1. Low perplexity and high burstiness suggest AI-generated content
    # 2. We scale and invert perplexity for a 0-100 range
    # Higher score = more likely to be plagiarized/AI-generated
    
    # Normalize perplexity (typical range: 10-1000 for GPT models)
    # Lower perplexity is more suspicious, so we invert the scale
    max_perplexity = 1000  # Significantly reduced to better catch AI content
    
    # Apply stronger inversion for lower perplexity values
    # This makes the system more sensitive to very low perplexity values
    if perplexity < 100:  # Extremely low perplexity is a very strong AI signal
        perplexity_score = 95  # Almost certainly AI-generated
    elif perplexity < 200:
        perplexity_score = 85  # Very likely AI-generated
    elif perplexity < 400:
        perplexity_score = 70  # Likely AI-generated
    else:
        # Standard scaling for moderate to high perplexity
        perplexity_score = max(0, 100 - min(100, (perplexity / max_perplexity) * 100))
    
    # Normalize burstiness (typical range: 0-1)
    # Higher burstiness suggests more repetitive patterns
    burstiness_score = burstiness * 100
    
    # Combined score, weighted even more heavily toward perplexity for better detection
    plagiarism_score = (perplexity_score * 0.9) + (burstiness_score * 0.1)
    
    # Calculate individual similarity scores for reference
    similarities = []
    for kb_text in knowledge_base_texts:
        if not kb_text:
            similarities.append(0)
            continue
            
        # Use perplexity difference as similarity metric
        kb_perplexity = calculate_perplexity(kb_text)
        perplexity_diff = abs(perplexity - kb_perplexity)
        
        # Normalize to 0-100 scale (closer perplexities suggest similarity)
        similarity = max(0, 100 - min(100, (perplexity_diff / 1000) * 100))
        similarities.append(similarity)
    
    # Print debug info
    print(f"Debug - Perplexity: {perplexity}, Score: {perplexity_score}, Final Score: {plagiarism_score}")
    
    return plagiarism_score, similarities

def analyze_ai_content(text):
    """Analyze whether the content is AI-generated or human-written."""
    perplexity = calculate_perplexity(text)
    burstiness = calculate_burstiness(text)
    
    # Much lower threshold values to catch newer AI models
    perplexity_threshold = 500  # Significantly lowered threshold for modern AI models
    burstiness_threshold = 0.1  # Burstiness is a secondary indicator
    
    # More aggressive detection logic
    if perplexity < 200:
        result = "AI Generated Content (High Confidence)"  # Very low perplexity is a strong signal
    elif perplexity < 500:
        result = "AI Generated Content (Medium Confidence)"  # Still likely AI but less certain
    elif burstiness >= burstiness_threshold or perplexity < 800:
        result = "Potential AI Generated Content"  # Some AI-like patterns detected
    else:
        result = "Likely Human-Written Content"
    
    # Print debug information
    print(f"AI Detection - Perplexity: {perplexity}, Burstiness: {burstiness}, Result: {result}")
        
    return {
        'perplexity': perplexity,
        'burstiness': burstiness,
        'result': result
    }