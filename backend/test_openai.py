from langchain_openai import ChatOpenAI
from dotenv import load_dotenv
import os

load_dotenv()

print("API KEY:", os.getenv("OPENAI_API_KEY"))

llm = ChatOpenAI(model="gpt-3.5-turbo")

response = llm.invoke("Hello")

print(response.content)