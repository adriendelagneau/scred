'use client';

import { useState, useEffect } from 'react';

// Define the type for a user we expect from the API
export interface ChatUser {
  id: string;
  name: string | null;
  email: string;
  isOnline: boolean;
  identityKey: {
    publicKey: string;
  } | null;
}

export default function UserList({ onSelectUser }: { onSelectUser: (user: ChatUser) => void }) {
  const [users, setUsers] = useState<ChatUser[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchUsers = async () => {
      try {
        setIsLoading(true);
        const response = await fetch('/api/users');
        if (!response.ok) {
          throw new Error('Failed to fetch users.');
        }
        const data = await response.json();
        setUsers(data);
      } catch (err: any) {
        setError(err.message);
      } finally {
        setIsLoading(false);
      }
    };

    fetchUsers();
  }, []);

  if (isLoading) {
    return <div>Loading users...</div>;
  }

  if (error) {
    return <div className="text-red-500">Error: {error}</div>;
  }

  return (
    <div className="w-full max-w-md p-4 bg-white rounded-lg shadow-md">
      <h2 className="text-xl font-bold mb-4">Start a Conversation</h2>
      {users.length === 0 ? (
        <p>No other users available to chat.</p>
      ) : (
        <ul>
          {users.map((user) => (
            <li key={user.id} className="flex items-center justify-between py-2 border-b">
              <div>
                <p className="font-semibold">{user.name || user.email}</p>
                <p className={`text-sm ${user.isOnline ? 'text-green-500' : 'text-gray-500'}`}>
                  {user.isOnline ? 'Online' : 'Offline'}
                </p>
              </div>
              <button 
                className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 transition-colors"
                onClick={() => onSelectUser(user)}
              >
                Chat
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
