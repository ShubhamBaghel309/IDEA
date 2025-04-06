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
    """Calculate the perplexity score of a given text."""
    encoded_input = tokenizer.encode(text, add_special_tokens=False, return_tensors='pt')
    input_ids = encoded_input[0]

    with torch.no_grad():
        outputs = model(input_ids)
        logits = outputs.logits

    perplexity = torch.exp(F.cross_entropy(logits.view(-1, logits.size(-1)), input_ids.view(-1)))
    return perplexity.item()

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
    
    # Normalize perplexity (typical range: 10-5000 for GPT models)
    # Lower perplexity is more suspicious, so we invert the scale
    max_perplexity = 5000
    perplexity_score = max(0, 100 - min(100, (perplexity / max_perplexity) * 100))
    
    # Normalize burstiness (typical range: 0-1)
    # Higher burstiness suggests more repetitive patterns
    burstiness_score = burstiness * 100
    
    # Combined score, weighted more toward perplexity
    plagiarism_score = (perplexity_score * 0.7) + (burstiness_score * 0.3)
    
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
    
    return plagiarism_score, similarities

def analyze_ai_content(text):
    """Analyze whether the content is AI-generated or human-written."""
    perplexity = calculate_perplexity(text)
    burstiness = calculate_burstiness(text)
    
    # Adjusted threshold values based on testing
    perplexity_threshold = 10000  # Lowered to reduce false positives
    burstiness_threshold = 0.15  # Increased to allow more human-like variability
    
    # Determine the likely source of the content
    if perplexity >= perplexity_threshold and burstiness >= burstiness_threshold:
        result = "AI Generated Content"
    elif perplexity <= perplexity_threshold and burstiness <= burstiness_threshold:
        result = "Human-Written Content"
    elif perplexity >= perplexity_threshold and burstiness <= burstiness_threshold:
        result = "Complex Human Text or Poorly Generated AI Text"
    elif perplexity <= perplexity_threshold and burstiness >= burstiness_threshold:
        result = "Simple Human Text"
        
    return {
        'perplexity': perplexity,
        'burstiness': burstiness,
        'result': result
    }