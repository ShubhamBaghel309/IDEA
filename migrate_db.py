from models import Base, Assignment
from sqlalchemy import create_engine, text
import os

# Connect to database
DATABASE_URL = os.getenv('DATABASE_URL', 'sqlite:///./classroom.db')
engine = create_engine(DATABASE_URL)

# Add the new columns manually using ALTER TABLE statements
try:
    with engine.connect() as conn:
        # Check if columns exist first
        result = conn.execute(text('PRAGMA table_info(assignments);'))
        columns = [row[1] for row in result.fetchall()]
        
        if 'assignment_type' not in columns:
            conn.execute(text('ALTER TABLE assignments ADD COLUMN assignment_type VARCHAR(50) DEFAULT "text";'))
            print('Added assignment_type column')
        
        if 'file_name' not in columns:
            conn.execute(text('ALTER TABLE assignments ADD COLUMN file_name VARCHAR(255);'))
            print('Added file_name column')
            
        if 'file_path' not in columns:
            conn.execute(text('ALTER TABLE assignments ADD COLUMN file_path VARCHAR(500);'))
            print('Added file_path column')
            
        conn.commit()
        print('Database migration completed successfully')
        
except Exception as e:
    print(f'Error during migration: {e}')
