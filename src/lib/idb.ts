import { openDB, DBSchema, IDBPDatabase } from "idb";

interface SecureChatDB extends DBSchema {
  identity: {
    key: string;
    value: CryptoKeyPair;
  };
}

let dbPromise: Promise<IDBPDatabase<SecureChatDB>>;

const getDb = () => {
  // This check ensures we are in the browser
  if (typeof window !== "undefined" && !dbPromise) {
    dbPromise = openDB<SecureChatDB>("secure-chat-db", 1, {
      upgrade(db) {
        if (!db.objectStoreNames.contains("identity")) {
          db.createObjectStore("identity");
        }
      },
    });
  }
  return dbPromise;
};

export const setIdentityKey = async (keyName: string, keyPair: CryptoKeyPair) => {
  const db = await getDb();
  return db.put("identity", keyPair, keyName);
};

export const getIdentityKey = async (keyName: string): Promise<CryptoKeyPair | undefined> => {
  const db = await getDb();
  return db.get("identity", keyName);
};
