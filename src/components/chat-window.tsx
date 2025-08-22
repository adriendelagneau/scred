"use client";

import { useEffect, useState, useRef } from "react";
import { io, Socket } from "socket.io-client";

import { getIdentityKey } from "@/lib/idb";
import {
  importPublicKey,
  deriveSharedSecret,
  deriveKeysFromRoot,
  encryptMessage,
  decryptMessage,
} from "@/utils/crypto";

import { ChatUser } from "./user-list";

interface ChatWindowProps {
  peerUser: ChatUser;
  onBack: () => void;
}

interface Message {
  id: number;
  text: string;
  sender: "me" | "peer";
}

interface RatchetState {
  chainKey: CryptoKey;
  messageKey: CryptoKey;
  messageCount: number;
}

// Define the type for our encrypted payload
interface EncryptedPayload {
  iv: string;
  ciphertext: string;
}

export default function ChatWindow({ peerUser, onBack }: ChatWindowProps) {
  const [ratchetState, setRatchetState] = useState<RatchetState | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState("");
  const [status, setStatus] = useState("Initializing secure session...");
  const socketRef = useRef<Socket | null>(null);

  useEffect(() => {
    // Initialize Socket.IO connection
    const websocketUrl =
      process.env.NEXT_PUBLIC_WEBSOCKET_URL || "http://localhost:3001";
    const newSocket = io(websocketUrl);
    socketRef.current = newSocket;

    newSocket.on("connect", () => {
      console.log("Connected to WebSocket server");
      setStatus("Connected to signaling server...");
    });

    // Listen for incoming messages
    newSocket.on("private_message", async (payload: EncryptedPayload) => {
      // TODO: This is where you would handle the receiving part of the ratchet.
      // This requires a more complex state management for receiving chains.
      // For now, we'll assume we can decrypt with the *current* message key for demonstration.
      if (!ratchetState) return;

      try {
        const decryptedText = await decryptMessage(
          ratchetState.messageKey,
          payload.iv,
          payload.ciphertext
        );
        const receivedMessage: Message = {
          id: Date.now(),
          text: decryptedText,
          sender: "peer",
        };
        setMessages((prev) => [...prev, receivedMessage]);

        // IMPORTANT: You would need to advance the receiving ratchet here.
      } catch (error) {
        console.error("Failed to decrypt incoming message:", error);
      }
    });

    // Disconnect on component unmount
    return () => {
      newSocket.disconnect();
    };
  }, [ratchetState]); // Added ratchetState dependency to ensure the listener has the latest state

  useEffect(() => {
    const initializeSession = async () => {
      try {
        const myIdentityKeyPair = await getIdentityKey("identityKey");
        if (!myIdentityKeyPair)
          throw new Error("Could not find your own identity key.");

        if (!peerUser.identityKey?.publicKey)
          throw new Error("Peer user does not have a public key.");
        const peerPublicKey = await importPublicKey(
          peerUser.identityKey.publicKey
        );

        const sharedSecretBits = await deriveSharedSecret(
          myIdentityKeyPair.privateKey,
          peerPublicKey
        );

        const rootKey = await crypto.subtle.importKey(
          "raw",
          sharedSecretBits,
          { name: "HKDF" },
          false,
          ["deriveBits"]
        );
        setStatus("Root key established.");

        const { chainKey, messageKey } = await deriveKeysFromRoot(rootKey);
        setRatchetState({ chainKey, messageKey, messageCount: 0 });

        // Join a room for this chat
        // TODO: Use a more robust room name (e.g., sorted IDs of both users)
        const roomName = peerUser.name;
        socketRef.current?.emit("join_room", roomName);
        setStatus(`Secure session established with ${peerUser.name}!`);

        // eslint-disable-next-line @typescript-eslint/no-explicit-any
      } catch (err: any) {
        setStatus(`Error: ${err.message}`);
        console.error(err);
      }
    };

    if (socketRef.current?.connected) {
      initializeSession();
    }
  }, [peerUser, socketRef.current?.connected]); // Depend on peerUser and connection status

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim() || !ratchetState || !socketRef.current) return;

    const { messageKey } = ratchetState;

    // 1. Encrypt the message
    const encryptedPayload = await encryptMessage(messageKey, newMessage);
    console.log(`Message encrypted with key #${ratchetState.messageCount}`);

    // 2. Emit the encrypted message to the server
    // TODO: Use the same robust room name as above
    const roomName = peerUser.name;
    socketRef.current.emit("private_message", {
      room: roomName,
      payload: encryptedPayload,
    });

    // 3. Display your own message locally
    const nextMessage: Message = {
      id: Date.now(),
      text: newMessage, // Display the original text
      sender: "me",
    };
    setMessages((prev) => [...prev, nextMessage]);
    setNewMessage("");

    // 4. Advance the sending ratchet
    const { chainKey: nextChainKey, messageKey: nextMessageKey } =
      await deriveKeysFromRoot(ratchetState.chainKey);
    setRatchetState({
      chainKey: nextChainKey,
      messageKey: nextMessageKey,
      messageCount: ratchetState.messageCount + 1,
    });
    console.log(
      `Ratchet advanced. Ready to encrypt message #${ratchetState.messageCount + 1}`
    );
  };

  return (
    <div className="flex h-[70vh] w-full max-w-2xl flex-col rounded-lg bg-white p-4 shadow-md">
      <div className="mb-4 flex items-center justify-between border-b pb-2">
        <button onClick={onBack} className="text-blue-500 hover:underline">
          ← Back
        </button>
        <h2 className="text-xl font-bold">Chat with {peerUser.name}</h2>
        <div />
      </div>
      <div className="mb-4 rounded-lg bg-gray-100 p-2 text-center">
        <p className="text-sm text-gray-600">
          <strong>Status:</strong> {status}
        </p>
      </div>
      <div className="mb-4 flex-1 overflow-y-auto rounded-lg bg-gray-50 p-4">
        {messages.map((msg) => (
          <div
            key={msg.id}
            className={`flex ${msg.sender === "me" ? "justify-end" : "justify-start"}`}
          >
            <div
              className={`max-w-xs rounded-lg p-3 md:max-w-md ${msg.sender === "me" ? "bg-blue-500 text-white" : "bg-gray-200"}`}
            >
              {msg.text}
            </div>
          </div>
        ))}
      </div>
      <form onSubmit={handleSendMessage} className="flex">
        <input
          type="text"
          value={newMessage}
          onChange={(e) => setNewMessage(e.target.value)}
          className="flex-1 rounded-l-lg border p-2"
          placeholder={
            ratchetState
              ? "Type your message..."
              : "Waiting for secure session..."
          }
          disabled={!ratchetState}
        />
        <button
          type="submit"
          className="rounded-r-lg bg-blue-500 p-2 text-white disabled:bg-gray-400"
          disabled={!ratchetState || !newMessage.trim()}
        >
          Envoyer
        </button>
      </form>
    </div>
  );
}
