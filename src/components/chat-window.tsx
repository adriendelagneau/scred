"use client";

import { useEffect, useState } from "react";
import { ChatUser } from "./user-list";
import { getIdentityKey } from "@/lib/idb";
import {
  importPublicKey,
  deriveSharedSecret,
  generateIdentityKeyPair,
} from "@/utils/crypto";

interface ChatWindowProps {
  peerUser: ChatUser;
  onBack: () => void;
}

export default function ChatWindow({ peerUser, onBack }: ChatWindowProps) {
  const [rootKey, setRootKey] = useState<CryptoKey | null>(null);
  const [status, setStatus] = useState("Initializing secure session...");

  useEffect(() => {
    const initializeSession = async () => {
      try {
        // 1. Get our own private identity key from IndexedDB
        const myIdentityKeyPair = await getIdentityKey("identityKey");
        if (!myIdentityKeyPair) {
          throw new Error(
            "Could not find your own identity key. Please reload."
          );
        }
        setStatus("Your identity key loaded.");

        // 2. Import the peer's public identity key
        if (!peerUser.identityKey?.publicKey) {
          throw new Error("Peer user does not have a public key.");
        }
        const peerPublicKey = await importPublicKey(
          peerUser.identityKey.publicKey
        );
        setStatus("Peer's public key loaded.");

        // 3. Generate our ephemeral key pair for this session
        const myEphemeralKeyPair = await generateIdentityKeyPair();
        setStatus("Ephemeral keys generated.");

        // 4. Perform DH calculations to establish the shared secret (Master Secret)
        // This is a simplified version of the X3DH key agreement protocol.
        const sharedSecret1 = await deriveSharedSecret(
          myIdentityKeyPair.privateKey,
          peerPublicKey
        );
        const sharedSecret2 = await deriveSharedSecret(
          myEphemeralKeyPair.privateKey,
          peerPublicKey
        );

        // In a real implementation, we would combine these secrets using a KDF.
        // For now, we'll just use the first one as our initial Root Key.
        setRootKey(sharedSecret1);
        setStatus(`Secure session established with ${peerUser.name}!`);

        console.log("INITIAL ROOT KEY (Shared Secret):", sharedSecret1);
        console.log(
          "This key should be identical for both you and",
          peerUser.name
        );
      } catch (err: any) {
        setStatus(`Error: ${err.message}`);
        console.error(err);
      }
    };

    initializeSession();
  }, [peerUser]);

  return (
    <div className="w-full max-w-2xl p-4 bg-white rounded-lg shadow-md">
      <div className="flex items-center justify-between mb-4">
        <button onClick={onBack} className="text-blue-500 hover:underline">
          ← Back to Users
        </button>
        <h2 className="text-xl font-bold">Chat with {peerUser.name}</h2>
        <div />
      </div>
      <div className="p-4 bg-gray-100 rounded-lg">
        <p className="text-sm text-gray-600">
          <strong>Status:</strong> {status}
        </p>
        {rootKey && (
          <p className="text-sm text-green-600 font-mono mt-2">
            RootKey successfully derived.
          </p>
        )}
      </div>
      {/* Chat messages and input will go here */}
    </div>
  );
}
