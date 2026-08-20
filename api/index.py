import os
import sys

# Add backend folder to Python path
sys.path.append(os.path.join(os.path.dirname(__file__), "..", "backend"))

from main import app

# Export app for Vercel Serverless Function
handler = app
