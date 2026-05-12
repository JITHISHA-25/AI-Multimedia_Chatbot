# backend/main.py

from fastapi import FastAPI, UploadFile, File
from fastapi.middleware.cors import CORSMiddleware

from typing import List

import shutil
import os
import fitz
import whisper

from groq import Groq
from dotenv import load_dotenv

load_dotenv()


# =========================
# FASTAPI APP
# =========================

app = FastAPI()


# =========================
# CORS
# =========================

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# =========================
# GROQ CLIENT
# =========================

client = Groq(
    api_key=os.getenv("GROQ_API_KEY")
)


# =========================
# WHISPER MODEL
# =========================

whisper_model = whisper.load_model("tiny")


# =========================
# UPLOAD FOLDER
# =========================

UPLOAD_FOLDER = "uploads"

os.makedirs(
    UPLOAD_FOLDER,
    exist_ok=True
)


# =========================
# GLOBAL STORAGE
# =========================

stored_text = ""

uploaded_media = []


# =========================
# HOME ROUTE
# =========================

@app.get("/")
def home():

    return {
        "message":
        "AI Multimedia Chatbot Backend Running"
    }


# =========================
# UPLOAD FILES
# =========================

@app.post("/upload")
async def upload_file(
    files: List[UploadFile] = File(...)
):

    global stored_text
    global uploaded_media

    uploaded_files = []

    combined_text = ""

    uploaded_media = []


    for file in files:

        file_path = (
            f"{UPLOAD_FOLDER}/{file.filename}"
        )


        # SAVE FILE
        with open(file_path, "wb") as buffer:

            shutil.copyfileobj(
                file.file,
                buffer
            )


        text = ""


        # =========================
        # PDF PROCESSING
        # =========================

        if file.filename.endswith(".pdf"):

            doc = fitz.open(file_path)

            for page in doc:

                text += page.get_text()


        # =========================
        # AUDIO / VIDEO PROCESSING
        # =========================

        elif (
            file.filename.endswith(".mp3")
            or file.filename.endswith(".wav")
            or file.filename.endswith(".mp4")
        ):

            result = whisper_model.transcribe(
                file_path
            )


            # STORE MEDIA INFO
            uploaded_media.append({

                "filename":
                file.filename,

                "filepath":
                file_path,

                "segments":
                result["segments"]
            })


            segments_text = ""


            for segment in result["segments"]:

                start = round(
                    segment["start"],
                    2
                )

                end = round(
                    segment["end"],
                    2
                )

                segment_text = (
                    segment["text"]
                )


                segments_text += f"""

START: {start}s
END: {end}s

TEXT:
{segment_text}

"""


            text += segments_text


        # =========================
        # STORE FILE CONTENT
        # =========================

        combined_text += f"""

==============================
FILE NAME: {file.filename}
==============================

{text}

"""


        uploaded_files.append(
            file.filename
        )


    stored_text = combined_text


    return {

        "message":
        "Files uploaded successfully",

        "files":
        uploaded_files,

        "preview":
        stored_text[:3000]
    }


# =========================
# CHAT ENDPOINT
# =========================

@app.get("/chat")
def chat(question: str):

    global stored_text


    if stored_text == "":

        return {
            "answer":
            "No files uploaded yet."
        }


    try:

        prompt = f"""
You are an AI assistant.

Carefully analyze ALL uploaded files.

Audio/video files contain timestamps.

When answering:
- include timestamps if relevant
- mention which file contains the answer

Uploaded Files Content:

{stored_text}

User Question:
{question}

Give a detailed answer.
"""


        completion = (
            client.chat.completions.create(

                model="llama-3.3-70b-versatile",

                messages=[
                    {
                        "role": "user",
                        "content": prompt
                    }
                ],

                temperature=0.3,
            )
        )


        answer = (
            completion
            .choices[0]
            .message.content
        )


        return {

            "question":
            question,

            "answer":
            answer
        }


    except Exception as e:

        return {

            "question":
            question,

            "answer":
            f"AI Error: {str(e)}"
        }


# =========================
# GET MEDIA FILES
# =========================

@app.get("/media")
def get_media():

    return uploaded_media