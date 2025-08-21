// Helper function to convert ArrayBuffer to Base64
function arrayBufferToBase64(buffer: ArrayBuffer) {
  let binary = "";
  const bytes = new Uint8Array(buffer);
  const len = bytes.byteLength;
  for (let i = 0; i < len; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return window.btoa(binary);
}

// Helper function to convert Base64 to ArrayBuffer
function base64ToArrayBuffer(base64: string) {
  const binary_string = window.atob(base64);
  const len = binary_string.length;
  const bytes = new Uint8Array(len);
  for (let i = 0; i < len; i++) {
    bytes[i] = binary_string.charCodeAt(i);
  }
  return bytes.buffer;
}

export const generateIdentityKeyPair = async () => {
  return crypto.subtle.generateKey(
    {
      name: "ECDH",
      namedCurve: "P-256",
    },
    true, // extractable
    ["deriveKey", "deriveBits"]
  );
};

export const exportPublicKey = async (key: CryptoKey) => {
  const exported = await crypto.subtle.exportKey("spki", key);
  return arrayBufferToBase64(exported);
};

export const importPublicKey = async (keyData: string) => {
  const buffer = base64ToArrayBuffer(keyData);
  return crypto.subtle.importKey(
    "spki",
    buffer,
    {
      name: "ECDH",
      namedCurve: "P-256",
    },
    true,
    []
  );
};

export const deriveSharedSecret = async (
  privateKey: CryptoKey,
  publicKey: CryptoKey
) => {
  return crypto.subtle.deriveKey(
    {
      name: "ECDH",
      public: publicKey, // Corrected property name
    },
    privateKey,
    {
      name: "AES-GCM",
      length: 256,
    },
    true,
    ["encrypt", "decrypt"]
  );
};

export const encryptMessage = async (
  sharedSecret: CryptoKey,
  message: string
) => {
  const iv = crypto.getRandomValues(new Uint8Array(12));
  const encodedMessage = new TextEncoder().encode(message);

  const ciphertext = await crypto.subtle.encrypt(
    {
      name: "AES-GCM",
      iv: iv,
    },
    sharedSecret,
    encodedMessage
  );

  return {
    iv: arrayBufferToBase64(iv.buffer),
    ciphertext: arrayBufferToBase64(ciphertext),
  };
};

export const decryptMessage = async (
  sharedSecret: CryptoKey,
  iv: string,
  ciphertext: string
) => {
  const ivBuffer = base64ToArrayBuffer(iv);
  const ciphertextBuffer = base64ToArrayBuffer(ciphertext);

  const decrypted = await crypto.subtle.decrypt(
    {
      name: "AES-GCM",
      iv: ivBuffer,
    },
    sharedSecret,
    ciphertextBuffer
  );

  return new TextDecoder().decode(decrypted);
};