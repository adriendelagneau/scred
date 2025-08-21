'use client';

import { useState } from 'react';
import KeyManager from './key-manager';
import UserList, { ChatUser } from './user-list';
import ChatWindow from './chat-window';

export default function HomePage() {
  const [selectedUser, setSelectedUser] = useState<ChatUser | null>(null);

  return (
    <div className="p-8 flex flex-col items-center gap-8 w-full">
      <div className="w-full max-w-md">
        <h1 className="text-2xl font-bold mb-4 text-center">Welcome to Scred</h1>
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
