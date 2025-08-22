/* eslint-disable @typescript-eslint/no-require-imports */

const { createServer } = require("http");
const { Server } = require("socket.io");

const httpServer = createServer();

// L'URL de votre client Next.js. Utilise une variable d'environnement pour la production.
const clientURL = process.env.CLIENT_URL || "http://localhost:3000";

const io = new Server(httpServer, {
  cors: {
    origin: clientURL,
    methods: ["GET", "POST"]
  }
});

io.on("connection", (socket) => {
  console.log(`Un utilisateur s'est connecté : ${socket.id}`);

  // Permet à un utilisateur de rejoindre une "salle" de chat
  socket.on("join_room", (roomName) => {
    socket.join(roomName);
    console.log(`L'utilisateur ${socket.id} a rejoint la salle : ${roomName}`);
  });

  // Gère l'envoi de messages privés à une salle spécifique
  socket.on("private_message", (data) => {
    const { room, payload } = data;
    // Émet le message à tous les autres clients dans la salle
    socket.to(room).emit("private_message", payload);
    console.log(`Message de ${socket.id} relayé à la salle : ${room}`);
  });

  socket.on("disconnect", () => {
    console.log(`L'utilisateur ${socket.id} s'est déconnecté`);
  });
});

const PORT = process.env.PORT || 3001;
httpServer.listen(PORT, () => {
  console.log(`Serveur Socket.IO écoute sur le port ${PORT}`);
});
