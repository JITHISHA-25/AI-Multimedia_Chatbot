import google.generativeai as genai
from dotenv import load_dotenv
import os

load_dotenv(dotenv_path=".env")

api_key = os.getenv("GEMINI_API_KEY")

print("API KEY:", api_key)

genai.configure(api_key=api_key)

model = genai.GenerativeModel("gemini-1.5-flash")

response = model.generate_content("Hello")

print(response.text)