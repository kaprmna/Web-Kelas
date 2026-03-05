import React, { useState, useEffect, useRef } from "react"
import Swal from "sweetalert2"

function Chat() {
  const [message, setMessage] = useState("")
  const [messages, setMessages] = useState([])
  const messagesEndRef = useRef(null)

  const scrollToBottom = () => {
    setTimeout(() => {
      messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
    }, 100)
  }

  const fetchMessages = async () => {
    try {
      const res = await fetch("/api/chat")
      const data = await res.json()
      setMessages(data)
      //scrollToBottom()
    } catch (err) {
      console.error("Error loading chat:", err)
    }
  }

  useEffect(() => {
    fetchMessages()
    const interval = setInterval(fetchMessages, 10000)
    return () => clearInterval(interval)
  }, [])

  const sendMessage = async () => {
    if (message.trim() === "") return

    try {
      await fetch("/api/chat", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          message: message.trim(),
        }),
      })

      setMessage("")
      fetchMessages()
    } catch (err) {
      Swal.fire("Error", "Failed to send message", "error")
    }
  }

  const handleKeyPress = (e) => {
    if (e.key === "Enter") {
      e.preventDefault()
      sendMessage()
    }
  }

  return (
    <div id="ChatAnonim">
      <div className="text-center text-4xl font-semibold">
        Text Anonim
      </div>

       <div className="mt-5" id="KotakPesan" style={{ overflowY: "auto" }}>
        {messages.map((msg, index) => (
           <div key={index} className="flex items-start text-sm py-[1%]">
            <img src="/AnonimUser.png" alt="User Profile" className="h-7 w-7 mr-2 " />
            <div className="relative top-[0.30rem]">{msg.message}</div>
          </div>
        ))}
        <div ref={messagesEndRef}></div>
      </div>

      <div id="InputChat" className="flex items-center mt-5">
        <input
          className="bg-transparent flex-grow pr-4 placeholder:text-white placeholder:opacity-60"
          type="text"
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          onKeyPress={handleKeyPress}
          placeholder="Ketik pesan Anda..."
          maxLength={60}
        />
        <button onClick={sendMessage} className="ml-2">
          <img src="/paper-plane.png" alt="" className="h-4 w-4 lg:h-6 lg:w-6" />
        </button>
      </div>
    </div>
  )
}

export default Chat
