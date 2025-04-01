import torch
import nltk
from nltk.util import ngrams
from nltk.lm.preprocessing import pad_sequence
from nltk.probability import FreqDist
import streamlit as st
from collections import Counter
from transformers import GPT2Tokenizer, GPT2LMHeadModel
import plotly.express as px
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

nltk.download('punkt')
nltk.download('stopwords')
nltk.download('punkt_tab', quiet=True)

# Load tokenizer and model
tokenizer = GPT2Tokenizer.from_pretrained('gpt2')  # we are using a pretrained model
model = GPT2LMHeadModel.from_pretrained('gpt2')

# Function to extract text from Word document
def extract_text_from_docx(file):
    doc = docx.Document(file)
    full_text = []
    for para in doc.paragraphs:
        full_text.append(para.text)
    return '\n'.join(full_text)

# Function to read plain text file
def read_text_file(file):
    content = file.read()
    if isinstance(content, bytes):
        return content.decode('utf-8')
    return content

def calculate_perplexity(text):
    encoded_input = tokenizer.encode(text, add_special_tokens=False, return_tensors='pt')  # preprocessing
    # pt indicates that the output would be a pytorch tensor
    input_ids = encoded_input[0]  # this takes the entire sequence of token and not only the first token

    with torch.no_grad():  # this disables gradient calculation i.e. model weights are not updated
        outputs = model(input_ids)
        logits = outputs.logits

    perplexity = torch.exp(F.cross_entropy(logits.view(-1, logits.size(-1)), input_ids.view(-1)))  # e to the power H(entropy)
    return perplexity.item()

def calculate_burstiness(text):
    tokens = nltk.word_tokenize(text.lower())
    word_freq = FreqDist(tokens)  # this gives the dictionary with each token as a key having the count as key
    repeated_count = sum(count > 1 for count in word_freq.values())  # no of words that appear more than once
    burstiness_score = repeated_count / len(word_freq) if len(word_freq) > 0 else 0  # different method
    return burstiness_score

def preprocess_text(text):
    """Preprocess text by removing stopwords and punctuation"""
    stop_words = set(stopwords.words('english'))
    tokens = nltk.word_tokenize(text.lower())
    tokens = [token for token in tokens if token not in stop_words and token not in string.punctuation]
    return ' '.join(tokens)

def get_document_ngrams(text, n=3):
    """Extract n-grams from text"""
    tokens = nltk.word_tokenize(preprocess_text(text))
    return list(ngrams(tokens, n))

def calculate_plagiarism(document_text, knowledge_base_texts, n=3):
    """Calculate plagiarism percentage using cosine similarity on TF-IDF vectors"""
    # Prepare corpus with document and knowledge base texts
    corpus = [document_text] + knowledge_base_texts
    
    # Create TF-IDF vectors
    vectorizer = TfidfVectorizer()
    tfidf_matrix = vectorizer.fit_transform(corpus)
    
    # Calculate cosine similarity between document and each knowledge base text
    similarities = []
    for i in range(1, len(corpus)):
        similarity = cosine_similarity(tfidf_matrix[0:1], tfidf_matrix[i:i+1])[0][0]
        similarities.append(similarity)
    
    # Return the highest similarity score as plagiarism percentage
    max_similarity = max(similarities) if similarities else 0
    return max_similarity * 100, similarities

# Streamlit App
st.title("GPT Shield & Plagiarism Detector")

# Create tabs
tab1, tab2 = st.tabs(["AI Detection", "Plagiarism Checker"])

with tab1:
    st.header("AI Content Detection")
    text_area = st.text_area("Enter your text")
    if text_area is not None and text_area.strip() != "":
        if st.button("Analyze AI Content"):
            col1, col2, col3 = st.columns([1, 1, 1])
            with col1:
                st.info("Your input text")
                st.success(text_area)
            with col2:
                st.info("Calculated Score")
                perplexity = calculate_perplexity(text_area)
                burstiness_score = calculate_burstiness(text_area)
                st.success(f"Perplexity Score: {perplexity}")
                st.success(f"Burstiness Score: {burstiness_score}")

            # Adjusted threshold values based on testing
            perplexity_threshold = 10000  # Lowered to reduce false positives
            burstiness_threshold = 0.15  # Increased to allow more human-like variability

            # Decision logic
            with col3:
                st.info("Analysis Result")
                if perplexity >= perplexity_threshold and burstiness_score >= burstiness_threshold:
                    st.error("Text Analysis: Likely AI Generated Content")
                elif perplexity <= perplexity_threshold and burstiness_score <= burstiness_threshold:
                    st.success("Text Analysis: Likely Human-Written Content")
                elif perplexity >= perplexity_threshold and burstiness_score <= burstiness_threshold:
                    st.warning("Text Analysis: Could be Complex Human Text or Poorly Generated AI Text")
                elif perplexity <= perplexity_threshold and burstiness_score >= burstiness_threshold:
                    st.info("Text Analysis: Could be Simple Human Text")

with tab2:
    st.header("Plagiarism Checker")
    
    # Session state initialization for knowledge base
    if 'knowledge_base' not in st.session_state:
        st.session_state.knowledge_base = []
        st.session_state.knowledge_base_names = []
    
    # Knowledge base section
    st.subheader("Knowledge Base")
    
    col1, col2 = st.columns([1, 1])
    
    with col1:
        # Upload documents to knowledge base
        uploaded_files = st.file_uploader(
            "Upload text or Word documents for knowledge base", 
            type=['txt', 'docx'], 
            accept_multiple_files=True
        )
        
        if uploaded_files:
            add_to_base = st.button("Add to Knowledge Base")
            if add_to_base:
                for file in uploaded_files:
                    # Extract text based on file type
                    if file.name.endswith('.docx'):
                        # Create a temporary file for docx processing
                        with tempfile.NamedTemporaryFile(delete=False, suffix='.docx') as temp_file:
                            temp_file.write(file.getvalue())
                            temp_file_path = temp_file.name
                        
                        text = extract_text_from_docx(temp_file_path)
                        os.unlink(temp_file_path)  # Delete the temporary file
                    else:
                        text = read_text_file(file)
                    
                    # Add to knowledge base
                    st.session_state.knowledge_base.append(text)
                    st.session_state.knowledge_base_names.append(file.name)
                
                st.success(f"Added {len(uploaded_files)} document(s) to the knowledge base")
    
    with col2:
        # Display current knowledge base
        if st.session_state.knowledge_base:
            st.write(f"Knowledge Base: {len(st.session_state.knowledge_base)} document(s)")
            for idx, name in enumerate(st.session_state.knowledge_base_names):
                st.write(f"- {name}")
            
            # Option to clear knowledge base
            if st.button("Clear Knowledge Base"):
                st.session_state.knowledge_base = []
                st.session_state.knowledge_base_names = []
                st.success("Knowledge base cleared")
        else:
            st.info("No documents in knowledge base yet")
    
    # Document checking section
    st.subheader("Check Document for Plagiarism")
    
    document_file = st.file_uploader("Upload document to check", type=['txt', 'docx'])
    
    if document_file and st.session_state.knowledge_base:
        check_plagiarism = st.button("Check Plagiarism")
        
        if check_plagiarism:
            # Extract text based on file type
            if document_file.name.endswith('.docx'):
                # Create a temporary file for docx processing
                with tempfile.NamedTemporaryFile(delete=False, suffix='.docx') as temp_file:
                    temp_file.write(document_file.getvalue())
                    temp_file_path = temp_file.name
                
                document_text = extract_text_from_docx(temp_file_path)
                os.unlink(temp_file_path)  # Delete the temporary file
            else:
                document_text = read_text_file(document_file)
            
            # Calculate plagiarism
            max_plagiarism, similarities = calculate_plagiarism(
                document_text, 
                st.session_state.knowledge_base
            )
            
            # Display results
            st.write("### Plagiarism Results")
            st.write(f"Overall Plagiarism: {max_plagiarism:.2f}%")
            
            # Create a bar chart for individual document similarities
            if similarities:
                fig = px.bar(
                    x=st.session_state.knowledge_base_names,
                    y=[s*100 for s in similarities],
                    labels={'x': 'Document', 'y': 'Similarity (%)'},
                    title='Similarity with Knowledge Base Documents'
                )
                st.plotly_chart(fig)
                
                # Detailed breakdown
                st.write("### Detailed Similarity Breakdown")
                for idx, (name, similarity) in enumerate(zip(st.session_state.knowledge_base_names, similarities)):
                    st.write(f"- {name}: {similarity*100:.2f}%")
    
    elif not st.session_state.knowledge_base and document_file:
        st.warning("Please add documents to the knowledge base first")


