'use client';

import { useEffect, useState } from 'react';
import { ChatUser } from './user-list';
import { getIdentityKey } from '@/lib/idb';
import {
  importPublicKey,
  deriveSharedSecret,
  generateIdentityKeyPair,
  deriveKeysFromRoot,
  encryptMessage,
  decryptMessage,
} from '@/utils/crypto';

interface ChatWindowProps {
  peerUser: ChatUser;
  onBack: () => void;
}

interface Message {
  id: number;
  text: string;
  sender: 'me' | 'peer';
}

// This will represent our symmetric ratchet state
interface RatchetState {
  chainKey: CryptoKey;
  messageKey: CryptoKey;
  messageCount: number;
}

export default function ChatWindow({ peerUser, onBack }: ChatWindowProps) {
  const [ratchetState, setRatchetState] = useState<RatchetState | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [status, setStatus] = useState('Initializing secure session...');

  useEffect(() => {
    const initializeSession = async () => {
      try {
        const myIdentityKeyPair = await getIdentityKey('identityKey');
        if (!myIdentityKeyPair) throw new Error("Could not find your own identity key.");

        if (!peerUser.identityKey?.publicKey) throw new Error("Peer user does not have a public key.");
        const peerPublicKey = await importPublicKey(peerUser.identityKey.publicKey);

        const myEphemeralKeyPair = await generateIdentityKeyPair();


        const sharedSecretBits = await deriveSharedSecret(myIdentityKeyPair.privateKey, peerPublicKey);

        const rootKey = await crypto.subtle.importKey(
          "raw",
          sharedSecretBits,
          { name: "HKDF" },
          false,
          ["deriveBits"]
        );

        setStatus('Root key established.');

        // ** NEW: Derive first chain and message keys from the root key **
        const { chainKey, messageKey } = await deriveKeysFromRoot(rootKey);
        setRatchetState({ chainKey, messageKey, messageCount: 0 });

        setStatus(`Secure session established with ${peerUser.name}!`);
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      } catch (err: any) {
        setStatus(`Error: ${err.message}`);
        console.error(err);
      }
    };

    initializeSession();
  }, [peerUser]);

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim() || !ratchetState) return;

    const { messageKey } = ratchetState;

    // 1. Encrypt the message with the current message key
    const { iv, ciphertext } = await encryptMessage(messageKey, newMessage);
    console.log(`Message encrypted with key #${ratchetState.messageCount}`);

    // --- Simulation: Immediately decrypt to prove it works ---
    const decryptedText = await decryptMessage(messageKey, iv, ciphertext);
    // --- End Simulation ---

    const nextMessage: Message = {
      id: Date.now(),
      text: decryptedText,
      sender: 'me',
    };
    setMessages([...messages, nextMessage]);
    setNewMessage('');

    // 2. **Advance the ratchet**
    // Derive the NEXT message key from the current chain key
    const { chainKey: nextChainKey, messageKey: nextMessageKey } = await deriveKeysFromRoot(ratchetState.chainKey);
    setRatchetState({
      chainKey: nextChainKey,
      messageKey: nextMessageKey,
      messageCount: ratchetState.messageCount + 1,
    });
    console.log(`Ratchet advanced. Ready to encrypt message #${ratchetState.messageCount + 1}`);
  };

  return (
    <div className="w-full max-w-2xl p-4 bg-white rounded-lg shadow-md flex flex-col h-[70vh]">
      <div className="flex items-center justify-between mb-4 border-b pb-2">
        <button onClick={onBack} className="text-blue-500 hover:underline">← Back</button>
        <h2 className="text-xl font-bold">Chat with {peerUser.name}</h2>
        <div />
      </div>
      <div className="text-center p-2 bg-gray-100 rounded-lg mb-4">
        <p className="text-sm text-gray-600"><strong>Status:</strong> {status}</p>
      </div>
      <div className="flex-1 overflow-y-auto bg-gray-50 p-4 rounded-lg mb-4">
        {messages.map((msg) => (
          <div key={msg.id} className={`flex ${msg.sender === 'me' ? 'justify-end' : 'justify-start'}`}>
            <div className={`max-w-xs md:max-w-md p-3 rounded-lg ${msg.sender === 'me' ? 'bg-blue-500 text-white' : 'bg-gray-200'}`}>
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
          className="flex-1 p-2 border rounded-l-lg"
          placeholder={ratchetState ? "Type your message..." : "Waiting for secure session..."}
          disabled={!ratchetState}
        />
        <button
          type="submit"
          className="bg-blue-500 text-white p-2 rounded-r-lg disabled:bg-gray-400"
          disabled={!ratchetState || !newMessage.trim()}
        >
          Envoyer
        </button>
      </form>
    </div>
  );
}