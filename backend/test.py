"""
TRACE AI Backend - Main FastAPI Application
Provides AI-powered analysis endpoints for the TRACE AI browser extension
"""


import os
from dotenv import load_dotenv
from openai import OpenAI


# Load environment variables
load_dotenv()


# Configure Google Gemini AI using OpenAI format
GOOGLE_API_KEY = os.getenv("GOOGLE_API_KEY")
if not GOOGLE_API_KEY:
    raise ValueError("GOOGLE_API_KEY environment variable is required")

# Initialize OpenAI client for Google Gemini
client = OpenAI(
    api_key=GOOGLE_API_KEY,
    base_url="https://generativelanguage.googleapis.com/v1beta/openai/"
)



response = client.chat.completions.create(
    model="gemini-2.5-flash-preview-05-20",
    messages=[
        {
            "role": "system",
            "content": "You are a cybersecurity expert explaining risks to non-technical users. Use simple, clear language and avoid technical jargon."
        },
        {
            "role": "user",
            "content": "Explain in simple, non-technical terms why submitting a form over HTTP (instead of HTTPS) is dangerous. Focus on how this affects regular internet users. Keep it to 2-3 sentences and avoid technical jargon."
        }
    ],
    max_tokens=15000,
    temperature=0.7
)

print(response)

# Print the response from Google Gemini
print(response.choices[0].message.content.strip())
        
