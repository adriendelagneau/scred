"use client";

import { useEffect, useState } from "react";

import { socket } from "../socket";

export default function Socket() {
  const [isConnected, setIsConnected] = useState(false);
  const [transport, setTransport] = useState("N/A");

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

    socket.on("connect", onConnect);
    socket.on("disconnect", onDisconnect);

    return () => {
      socket.off("connect", onConnect);
      socket.off("disconnect", onDisconnect);
    };
  }, []);

  return (
    <div className="flex items-center gap-2">
      <p>Real-time chat :</p>
      {isConnected ? (
        <div className="h-5 w-5 rounded-full bg-green-500" />
      ) : (
        <div className="h-5 w-5 rounded-full bg-red-500" />
      )}
    </div>
  );
}
