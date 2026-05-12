// frontend/src/App.jsx

import { useState, useEffect, useRef } from "react";
import jsPDF from "jspdf";

function App() {

  const [files, setFiles] = useState([]);

  const [question, setQuestion] = useState("");

  const [loading, setLoading] = useState(false);

  const [messages, setMessages] = useState([]);

  const [uploadStatus, setUploadStatus] = useState("");

  const [chatHistory, setChatHistory] = useState([]);

  const [mediaFiles, setMediaFiles] = useState([]);

  const [selectedMedia, setSelectedMedia] = useState("");

  const [timestamp, setTimestamp] = useState(0);

  const mediaRef = useRef(null);

  const chatEndRef = useRef(null);

  const inputRef = useRef(null);


  // =========================
  // LOAD CHAT HISTORY
  // =========================

  useEffect(() => {

    const savedChats =
      JSON.parse(
        localStorage.getItem(
          "chatHistory"
        )
      ) || [];

    setChatHistory(savedChats);

  }, []);


  // =========================
  // AUTO SCROLL
  // =========================

  useEffect(() => {

    chatEndRef.current?.scrollIntoView({
      behavior: "smooth"
    });

  }, [messages]);


  // =========================
  // DELETE CHAT
  // =========================

  const deleteChat = (chatId) => {

    const updatedChats =
      chatHistory.filter(
        (chat) =>
          chat.id !== chatId
      );

    setChatHistory(updatedChats);

    localStorage.setItem(
      "chatHistory",
      JSON.stringify(updatedChats)
    );
  };


  // =========================
  // OPEN CHAT
  // =========================

  const openChat = (chat) => {

    setMessages(chat.messages);
  };


  // =========================
  // DOWNLOAD PDF
  // =========================

  const downloadChatPDF = () => {

    const doc = new jsPDF();

    let y = 20;

    doc.setFontSize(18);

    doc.text(
      "AI Chat History",
      20,
      y
    );

    y += 20;

    messages.forEach((msg) => {

      const sender =
        msg.type === "user"
          ? "User"
          : "AI";

      const text =
        `${sender}: ${msg.text}`;

      const splitText =
        doc.splitTextToSize(
          text,
          170
        );

      doc.setFontSize(12);

      doc.text(
        splitText,
        20,
        y
      );

      y += (
        splitText.length * 8
      ) + 10;

      if (y > 260) {

        doc.addPage();

        y = 20;
      }
    });

    doc.save(
      "chat-history.pdf"
    );
  };


  // =========================
  // PLAY MEDIA AT TIMESTAMP
  // =========================

  const playAtTimestamp = (
    mediaPath,
    time
  ) => {

    setSelectedMedia(mediaPath);

    setTimestamp(time);

    setTimeout(() => {

      if (mediaRef.current) {

        mediaRef.current.currentTime =
          time;

        mediaRef.current.play();
      }

    }, 500);
  };


  // =========================
  // UPLOAD FILES
  // =========================

  const uploadFile = async () => {

    if (files.length === 0) {

      setUploadStatus(
        "Please select files"
      );

      return;
    }

    setLoading(true);

    try {

      const formData =
        new FormData();


      files.forEach((file) => {

        formData.append(
          "files",
          file
        );

      });


      const response =
        await fetch(
          "http://127.0.0.1:8000/upload",
          {
            method: "POST",
            body: formData
          }
        );


      const data =
        await response.json();

      setUploadStatus(
        data.message
      );


      // GET MEDIA FILES
      const mediaResponse =
        await fetch(
          "http://127.0.0.1:8000/media"
        );

      const mediaData =
        await mediaResponse.json();

      setMediaFiles(
        mediaData
      );

    } catch (error) {

      console.log(error);

      setUploadStatus(
        "Upload failed"
      );
    }

    setLoading(false);
  };


  // =========================
  // ASK QUESTION
  // =========================

  const askQuestion = async () => {

    if (!question.trim()) {

      return;
    }


    const userMessage = {

      type: "user",

      text: question,

      time:
        new Date()
        .toLocaleTimeString(
          [],
          {
            hour: "2-digit",
            minute: "2-digit"
          }
        )
    };


    const updatedMessages = [

      ...messages,

      userMessage
    ];


    setMessages(
      updatedMessages
    );

    setLoading(true);

    try {

      const response =
        await fetch(
          `http://127.0.0.1:8000/chat?question=${question}`
        );


      const data =
        await response.json();


      let foundTimestamp = null;

      let foundFile = null;


      // FIND TIMESTAMP
      mediaFiles.forEach((media) => {

        media.segments.forEach(
          (segment) => {

            if (

              data.answer
              .toLowerCase()
              .includes(
                segment.text
                .toLowerCase()
                .slice(0, 15)
              )
            ) {

              foundTimestamp =
                segment.start;

              foundFile =
                media.filepath;
            }
          }
        );
      });


      const aiMessage = {

        type: "ai",

        text: data.answer,

        time:
          new Date()
          .toLocaleTimeString(
            [],
            {
              hour: "2-digit",
              minute: "2-digit"
            }
          ),

        timestamp:
          foundTimestamp,

        filepath:
          foundFile
      };


      const finalMessages = [

        ...updatedMessages,

        aiMessage
      ];


      setMessages(
        finalMessages
      );


      // SAVE CHAT
      const newChat = {

        id: Date.now(),

        title:
          question.slice(0, 30),

        messages:
          finalMessages
      };


      const updatedChats = [

        newChat,

        ...chatHistory
      ];


      setChatHistory(
        updatedChats
      );


      localStorage.setItem(

        "chatHistory",

        JSON.stringify(
          updatedChats
        )
      );

    } catch (error) {

      console.log(error);

      const errorMessage = {

        type: "ai",

        text:
          "Something went wrong",

        time:
          new Date()
          .toLocaleTimeString(
            [],
            {
              hour: "2-digit",
              minute: "2-digit"
            }
          )
      };


      setMessages((prev) => [

        ...prev,

        errorMessage
      ]);
    }

    setQuestion("");

    inputRef.current.focus();

    setLoading(false);
  };


  return (

    <div className="min-h-screen bg-black flex">


      {/* SIDEBAR */}
      <div className="w-72 bg-zinc-950 border-r border-zinc-800 text-white flex flex-col p-6 overflow-y-auto">

        <h1 className="text-3xl font-bold mb-8">
          AI Chat
        </h1>


        <button
          onClick={() =>
            setMessages([])
          }
          className="bg-white text-black py-3 rounded-2xl font-semibold mb-8 hover:bg-zinc-300 transition"
        >
          + New Chat
        </button>


        <h2 className="text-zinc-400 text-sm uppercase mb-4">

          Chat History

        </h2>


        <div className="space-y-3">

          {
            chatHistory.map((chat) => (

              <div
                key={chat.id}
                className="flex gap-2"
              >

                <button
                  onClick={() =>
                    openChat(chat)
                  }
                  className="flex-1 text-left bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 p-4 rounded-2xl transition"
                >

                  <p className="text-sm text-white truncate">

                    {chat.title}

                  </p>

                </button>


                <button
                  onClick={() =>
                    deleteChat(chat.id)
                  }
                  className="bg-red-500 hover:bg-red-600 px-4 rounded-2xl text-white"
                >
                  ✕
                </button>

              </div>
            ))
          }

        </div>

      </div>


      {/* MAIN */}
      <div className="flex-1 flex justify-center items-center p-6">

        <div className="bg-zinc-950 border border-zinc-800 rounded-3xl shadow-2xl w-full max-w-6xl h-[94vh] flex flex-col overflow-hidden">


          {/* HEADER */}
          <div className="border-b border-zinc-800 px-8 py-5 flex justify-between items-center bg-black">

            <div>

              <h1 className="text-2xl font-bold text-white">

                AI Multimedia Chatbot

              </h1>

              <p className="text-zinc-400 text-sm mt-1">

                Upload PDFs, audio & video with timestamps

              </p>

            </div>


            <button
              onClick={downloadChatPDF}
              className="bg-white text-black hover:bg-zinc-300 px-5 py-2 rounded-2xl font-medium transition"
            >
              Download PDF
            </button>

          </div>


          {/* UPLOAD */}
          <div className="border-b border-zinc-800 p-6 bg-zinc-950 flex flex-col md:flex-row md:items-center gap-5">

            <div className="flex flex-col gap-2">

              <input
                type="file"
                multiple
                accept=".pdf,.mp3,.wav,.mp4"
                onChange={(e) =>
                  setFiles(
                    Array.from(
                      e.target.files
                    )
                  )
                }
                className="bg-zinc-900 border border-zinc-700 text-white rounded-2xl p-3"
              />


              {
                files.length > 0 && (

                  <div className="text-zinc-400 text-sm space-y-1">

                    <p className="text-white font-medium">

                      Selected Files:

                    </p>

                    {
                      files.map(
                        (file, index) => (

                          <p key={index}>
                            • {file.name}
                          </p>
                        )
                      )
                    }

                  </div>
                )
              }

            </div>


            <button
              onClick={uploadFile}
              disabled={loading}
              className="bg-white text-black hover:bg-zinc-300 disabled:bg-zinc-500 px-6 py-3 rounded-2xl font-semibold transition"
            >
              Upload Files
            </button>

          </div>


          {/* STATUS */}
          {
            uploadStatus && (

              <div className="bg-zinc-900 border-b border-zinc-800 text-zinc-300 px-6 py-3 text-sm">

                {uploadStatus}

              </div>
            )
          }


          {/* MEDIA PLAYER */}
          {
            selectedMedia && (

              <div className="p-4 border-b border-zinc-800 bg-black">

                <video
                  ref={mediaRef}
                  controls
                  className="w-full rounded-2xl"
                >

                  <source
                    src={`http://127.0.0.1:8000/${selectedMedia}`}
                  />

                </video>

              </div>
            )
          }


          {/* CHAT */}
          <div className="flex-1 overflow-y-auto bg-black px-6 py-8 space-y-6">

            {
              messages.map((msg, index) => (

                <div
                  key={index}
                  className={`flex items-start gap-4 ${
                    msg.type === "user"
                      ? "justify-end"
                      : "justify-start"
                  }`}
                >

                  <div
                    className={`relative max-w-[75%] rounded-2xl px-5 py-4 shadow-lg

                    ${
                      msg.type === "user"
                        ? "bg-white text-black"
                        : "bg-zinc-900 border border-zinc-800 text-white"
                    }
                    `}
                  >

                    <p className="whitespace-pre-wrap leading-7 text-sm">

                      {msg.text}

                    </p>


                    {/* PLAY BUTTON */}
                    {
                      msg.timestamp !== null
                      && msg.filepath && (

                        <button
                          onClick={() =>
                            playAtTimestamp(
                              msg.filepath,
                              msg.timestamp
                            )
                          }
                          className="mt-4 bg-white text-black px-4 py-2 rounded-xl text-sm font-semibold"
                        >
                          ▶ Play Relevant Portion
                        </button>
                      )
                    }

                  </div>

                </div>
              ))
            }


            {
              loading && (

                <div className="text-white">

                  Thinking...

                </div>
              )
            }


            <div ref={chatEndRef}></div>

          </div>


          {/* INPUT */}
          <div className="border-t border-zinc-800 bg-zinc-950 p-5 flex gap-4">

            <input
              ref={inputRef}
              type="text"
              placeholder="Ask something..."
              value={question}

              onChange={(e) =>
                setQuestion(
                  e.target.value
                )
              }

              onKeyDown={(e) => {

                if (
                  e.key === "Enter"
                ) {

                  askQuestion();
                }
              }}

              className="flex-1 bg-zinc-900 border border-zinc-700 rounded-2xl px-5 py-4 text-white outline-none focus:border-white transition"
            />


            <button
              onClick={askQuestion}
              disabled={
                loading
                || !question.trim()
              }
              className="bg-white text-black hover:bg-zinc-300 disabled:bg-zinc-600 disabled:text-zinc-400 px-8 rounded-2xl font-semibold transition"
            >
              Send
            </button>

          </div>

        </div>

      </div>

    </div>
  );
}

export default App;