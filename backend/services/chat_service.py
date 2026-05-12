from groq import Groq
from dotenv import load_dotenv
import os

load_dotenv(dotenv_path=".env")

client = Groq(
    api_key=os.getenv("GROQ_API_KEY")
)

def ask_ai(question, context):

    try:

        prompt = f"""
        Answer the question based on the context below.

        Context:
        {context}

        Question:
        {question}
        """

        completion = client.chat.completions.create(
            model="llama-3.1-8b-instant",
            messages=[
                {
                    "role": "user",
                    "content": prompt
                }
            ]
        )

        return completion.choices[0].message.content

    except Exception as e:

        return f"AI Error: {str(e)}"