"""
TRACE AI Backend - Main FastAPI Application
Provides AI-powered analysis endpoints for the TRACE AI browser extension
"""

from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
import os
from dotenv import load_dotenv
from openai import OpenAI
import httpx
from bs4 import BeautifulSoup
import re
import asyncio

# Load environment variables
load_dotenv()

# Initialize FastAPI app
app = FastAPI(
    title="TRACE AI Backend",
    description="AI-powered web form security analysis API",
    version="1.0.0"
)

# Add CORS middleware to allow browser extension requests
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # In production, specify your extension ID
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Configure Google Gemini AI using OpenAI format
GOOGLE_API_KEY = os.getenv("GOOGLE_API_KEY")
if not GOOGLE_API_KEY:
    raise ValueError("GOOGLE_API_KEY environment variable is required")

# Initialize OpenAI client for Google Gemini
client = OpenAI(
    api_key=GOOGLE_API_KEY,
    base_url="https://generativelanguage.googleapis.com/v1beta/openai/"
)

# Pydantic models for request/response
class ExplanationRequest(BaseModel):
    """Base model for explanation requests"""
    pass

class DataRequestConcernRequest(BaseModel):
    """Model for data request concern analysis"""
    form_purpose: str
    form_html: str # Changed from field_in_question

class PrivacyPolicyRequest(BaseModel):
    """Model for privacy policy analysis"""
    policy_url: str

class ExplanationResponse(BaseModel):
    """Model for AI explanation responses"""
    explanation: str
    success: bool
    error: str = None

@app.get("/")
async def health_check():
    """Health check endpoint"""
    return {"status": "healthy", "service": "TRACE AI Backend", "version": "1.0.0"}

@app.post("/explain/insecure_submission", response_model=ExplanationResponse)
async def explain_insecure_submission(request: ExplanationRequest):
    """
    Get AI explanation for insecure form submission risks
    """
    try:
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
            max_tokens=10000,
            temperature=0.7
        )
        
        return ExplanationResponse(
            explanation=response.choices[0].message.content,
            success=True
        )
    except Exception as e:
        # Provide fallback explanation when AI service is unavailable
        fallback_explanation = (
            "When a form sends data over HTTP instead of HTTPS, your information travels "
            "unencrypted across the internet. This means anyone monitoring network traffic "
            "could see your personal details, passwords, or other sensitive information."
        )
        
        return ExplanationResponse(
            explanation=fallback_explanation,
            success=True,  # Return success with fallback explanation
            error=f"AI service unavailable, using fallback explanation: {str(e)}"
        )

@app.post("/explain/password_insecure_form", response_model=ExplanationResponse)
async def explain_password_insecure_form(request: ExplanationRequest):
    """
    Get AI explanation for password risks in insecure forms
    """
    try:
        response = client.chat.completions.create(
            model="gemini-2.5-flash-preview-05-20",
            messages=[
                {
                    "role": "system",
                    "content": "You are a cybersecurity expert explaining risks to non-technical users. Use simple, clear language and avoid technical jargon."
                },
                {
                    "role": "user",
                    "content": "Explain in simple terms why entering a password on an insecure (HTTP) form is extremely dangerous. Focus on what could happen to the user's password and accounts. Keep it to 2-3 sentences and use language that non-technical users can understand."
                }
            ],
            max_tokens=10000,
            temperature=0.7
        )
        
        return ExplanationResponse(
            explanation=response.choices[0].message.content,
            success=True
        )
    except Exception as e:
        # Provide fallback explanation when AI service is unavailable
        fallback_explanation = (
            "Entering your password on an insecure form is extremely risky because hackers can easily "
            "intercept your password as it travels to the website. They could then use your password "
            "to access your accounts and steal your personal information or money."
        )
        
        return ExplanationResponse(
            explanation=fallback_explanation,
            success=True,  # Return success with fallback explanation
            error=f"AI service unavailable, using fallback explanation: {str(e)}"
        )

@app.post("/explain/data_request_concern", response_model=ExplanationResponse)
async def explain_data_request_concern(request: DataRequestConcernRequest):
    """
    Get AI explanation for excessive data request concerns by analyzing form HTML
    """
    try:
        # Truncate form_html if it's too long to avoid exceeding token limits
        MAX_HTML_LENGTH = 10000  # Approx 2500-3000 tokens
        truncated_html = request.form_html
        if len(request.form_html) > MAX_HTML_LENGTH:
            truncated_html = request.form_html[:MAX_HTML_LENGTH] + "... [HTML truncated]"

        response = client.chat.completions.create(
            model="gemini-2.5-flash-preview-05-20",
            messages=[
                {
                    "role": "system",
                    "content": """You are a privacy and security expert helping non-technical users understand data collection practices on web forms.
Your task is to analyze the provided HTML of a web form.
First, determine the likely purpose of the form based on its HTML content.
Then, identify any input fields, labels, or data requests within the HTML that seem unusual, excessive, or suspicious for the form's determined purpose.
Explain your findings in simple, clear, non-technical language.
Focus on practical advice and what the user should consider.
If specific fields are suspicious, mention them and why.
If the form seems reasonable for its determined purpose, state that.
Keep your explanation concise, ideally 2-4 sentences."""
                },
                {
                    "role": "user",
                    "content": f"""Please analyze the following HTML snippet of a web form:
---HTML START---
{truncated_html}
---HTML END---
Determine the likely purpose of this form based on its HTML content. Then, identify any input fields or data requests within the HTML that seem unusual, excessive, or suspicious for the form's determined purpose.
Explain your findings in simple, non-technical terms. If specific fields are suspicious, mention them and why. If the form seems reasonable for its purpose, state that."""
                }
            ],
            max_tokens=10000, 
            temperature=0.7
        )
        
        return ExplanationResponse(
            explanation=response.choices[0].message.content,
            success=True
        )
    except Exception as e:
        # Provide fallback explanation when AI service is unavailable
        fallback_explanation = (
            f"When filling out a '{request.form_purpose}' form, always consider if the information asked is truly necessary for the service. "
            "Be extra careful with sensitive data like your SSN, financial details, or very personal information, especially if the site isn't well-known or doesn't clearly state how your data is used. "
            "If something feels off, it's better to be cautious and not submit the form."
        )
        
        return ExplanationResponse(
            explanation=fallback_explanation,
            success=True,  # Return success with fallback explanation
            error=f"AI service unavailable, using fallback explanation: {str(e)}"
        )

@app.post("/analyze_privacy_policy", response_model=ExplanationResponse)
async def analyze_privacy_policy(request: PrivacyPolicyRequest):
    """
    Analyze a privacy policy for red flags and concerning clauses
    """
    try:
        # Fetch the privacy policy content
        async with httpx.AsyncClient(timeout=30.0) as http_client:
            try:
                response = await http_client.get(request.policy_url, follow_redirects=True)
                response.raise_for_status()
            except httpx.HTTPError as e:
                return ExplanationResponse(
                    explanation="Unable to access the privacy policy. The link may be broken or the site may be blocking automated access.",
                    success=False,
                    error=f"HTTP error: {str(e)}"
                )
        
        # Extract text content from HTML
        soup = BeautifulSoup(response.content, 'html.parser')
        
        # Remove script and style elements
        for script in soup(["script", "style"]):
            script.decompose()
        
        # Get text content
        text_content = soup.get_text()
        
        # Clean up the text
        lines = (line.strip() for line in text_content.splitlines())
        chunks = (phrase.strip() for line in lines for phrase in line.split("  "))
        text_content = ' '.join(chunk for chunk in chunks if chunk)
        
        # Limit text length to avoid token limits (approximately 8000 characters)
        if len(text_content) > 8000:
            text_content = text_content[:8000] + "... [content truncated]"        
        print("Making AI request...")  # Debugging: indicate AI request is starting
        
        # Use AI to analyze the privacy policy
        try:
            ai_response = client.chat.completions.create(
                model="gemini-2.5-flash-preview-05-20",
                messages=[
                    {
                        "role": "system",
                        "content": "You are a privacy expert helping non-technical users understand privacy policies. Focus on identifying concerning practices in simple, clear language."
                    },
                    {
                        "role": "user",
                        "content": f"""Please analyze this privacy policy and identify the main red flags or concerning practices that a regular internet user should be aware of. 

Privacy Policy Text:
{text_content}

Please provide a concise summary focusing on:
1. How the company shares or sells user data
2. What data they collect beyond what's necessary
3. How long they keep user data
4. Any concerning clauses about data usage

Format your response as bullet points in simple, non-technical language. Keep it to 3-4 key points maximum. If the policy seems reasonable, say so."""
                    }
                ],
                max_tokens=30000,
                temperature=0.7
            )
            
            print("AI request completed successfully")  # Debugging: confirm AI request completion
            print(f"AI response: {ai_response.choices[0].message.content}")  # Debugging: print the AI response to console
            
            return ExplanationResponse(
                explanation=ai_response.choices[0].message.content,
                success=True
            )
            
        except Exception as ai_error:
            print(f"AI request failed with error: {str(ai_error)}")  # Debugging: print AI-specific errors
            raise ai_error  # Re-raise to be caught by outer exception handler
        
    except Exception as e:
        # Provide fallback analysis when AI service is unavailable
        fallback_explanation = (
            "Unable to analyze this privacy policy automatically. "
            "When reviewing privacy policies yourself, look for: "
            "• How they share your data with third parties "
            "• What data they collect beyond what's necessary for their service "
            "• How long they keep your information "
            "• Whether you can delete your data easily"
        )
        
        return ExplanationResponse(
            explanation=fallback_explanation,
            success=True,
            error=f"Analysis service unavailable: {str(e)}"
        )

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)