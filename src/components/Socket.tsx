"use client";

import { useEffect, useState } from "react";

import { socket } from "../socket";

export default function Socket() {
  const [isConnected, setIsConnected] = useState(false);
  const [transport, setTransport] = useState("N/A");
  const [messages, setMessages] = useState<string[]>([]);
  const [inputValue, setInputValue] = useState("");

  useEffect(() => {
    if (socket.connected) {
      onConnect();
    }

    function onConnect() {
      setIsConnected(true);
      setTransport(socket.io.engine.transport.name);

      socket.io.engine.on("upgrade", (transport) => {
        setTransport(transport.name);
      });
    }

    function onDisconnect() {
      setIsConnected(false);
      setTransport("N/A");
    }

    function onChatMessage(value: string) {
      setMessages((previous) => [...previous, value]);
    }

    socket.on("connect", onConnect);
    socket.on("disconnect", onDisconnect);
    socket.on("chat message", onChatMessage);

    return () => {
      socket.off("connect", onConnect);
      socket.off("disconnect", onDisconnect);
      socket.off("chat message", onChatMessage);
    };
  }, []);

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (inputValue) {
      socket.emit("chat message", inputValue);
      setInputValue("");
    }
  };

  return (
    <div className="w-full max-w-2xl">
      <div className="flex items-center gap-2 mb-4">
        <p>Real-time chat :</p>
        {isConnected ? (
          <div className="h-5 w-5 rounded-full bg-green-500" />
        ) : (
          <div className="h-5 w-5 rounded-full bg-red-500" />
        )}
      </div>
      <div className="border rounded-lg p-4 h-64 overflow-y-auto mb-4">
        <ul className="space-y-2">
          {messages.map((msg, index) => (
            <li key={index} className="p-2 rounded-lg bg-gray-100 dark:bg-gray-800">
              {msg}
            </li>
          ))}
        </ul>
      </div>
      <form onSubmit={handleSubmit} className="flex gap-2">
        <input
          type="text"
          value={inputValue}
          onChange={(e) => setInputValue(e.target.value)}
          className="flex-grow p-2 border rounded-lg"
          placeholder="Type a message..."
        />
        <button type="submit" className="p-2 bg-blue-500 text-white rounded-lg">
          Send
        </button>
      </form>
    </div>
  );
}
