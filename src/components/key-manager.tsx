'use client';

import { useEffect, useState } from 'react';
import { authClient } from '@/lib/auth/auth-client';
import { generateIdentityKeyPair, exportPublicKey } from '@/utils/crypto';
import { setIdentityKey, getIdentityKey } from '@/lib/idb';

export default function KeyManager() {
  const { 
    data: session, 
    isPending,
    error
  } = authClient.useSession();
  const [message, setMessage] = useState('Initializing...');

  useEffect(() => {
    if (isPending) {
      setMessage('Authenticating...');
      return;
    }

    if (error) {
      setMessage(`Authentication error: ${error.message}`);
      return;
    }

    if (!session) {
      setMessage('Please log in to secure your account.');
      return;
    }

    const manageKeys = async () => {
      if (session.user) {
        setMessage(`Welcome, ${session.user.name}. Checking security keys...`);
        try {
          let identityKeyPair = await getIdentityKey('identityKey');

          if (!identityKeyPair) {
            setMessage('No keys found. Generating new identity keys...');
            identityKeyPair = await generateIdentityKeyPair();
            await setIdentityKey('identityKey', identityKeyPair);
            setMessage('Private key stored securely on your device.');

            const publicKeyB64 = await exportPublicKey(identityKeyPair.publicKey);

            setMessage('Sending public key to server...');
            const response = await fetch('/api/keys', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ publicKey: publicKeyB64 }),
            });

            if (response.ok) {
              setMessage('Your account is now fully secured and ready.');
            } else if (response.status === 409) {
              setMessage('Security keys are already set up on the server.');
            } else {
              throw new Error('Failed to store public key on the server.');
            }
          } else {
            setMessage('Security keys are properly configured.');
          }
        } catch (err) {
          console.error('Key management error:', err);
          setMessage('Error during key management. See console for details.');
        }
      }
    };

    manageKeys();
  }, [session, isPending, error]);

  return (
    <div className="p-4 bg-gray-800 text-white rounded-lg shadow-md">
      <p className="text-lg font-semibold">Security Status</p>
      <p className="text-sm">{message}</p>
    </div>
  );
}