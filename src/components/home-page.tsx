"use client";

import { useState } from "react";

import ChatWindow from "./chat-window";
import KeyManager from "./key-manager";
import UserList, { ChatUser } from "./user-list";

export default function HomePage() {
  const [selectedUser, setSelectedUser] = useState<ChatUser | null>(null);

  return (
    <div className="flex w-full flex-col items-center gap-8 p-8">
      <div className="w-full max-w-md">
        <h1 className="mb-4 text-center text-2xl font-bold">
          Welcome to Scred
        </h1>
        <KeyManager />
      </div>

      <div className="w-full">
        {selectedUser ? (
          <div className="flex justify-center">
            <ChatWindow
              peerUser={selectedUser}
              onBack={() => setSelectedUser(null)}
            />
          </div>
        ) : (
          <div className="flex justify-center">
            <UserList onSelectUser={setSelectedUser} />
          </div>
        )}
      </div>
    </div>
  );
}
