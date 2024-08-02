// Importa el servidor de Express desde tu archivo app.js
import app from "./app.js";
import { ORIGIN, PORT } from "./config.js";

import { createServer } from "http";
import { Server } from "socket.io";

// Crea el servidor HTTP utilizando Express
const httpServer = createServer(app);

const io = new Server(httpServer, {
  cors: {
    origin: ORIGIN,
    credentials: true,
  },
});

io.on("connection", (socket) => {
  socket.on("nueva-abertura", (nuevaAbertura) => {
    io.emit("nueva-abertura", nuevaAbertura);
  });

  socket.on("actualizar-abertura", (actualizarAbertura) => {
    io.emit("actualizar-abertura", actualizarAbertura);
  });
  socket.on("crear-salida", (nuevaSalida) => {
    io.emit("crear-salida", nuevaSalida);
  });
});

httpServer.listen(PORT, () => {
  console.log(`Servidor corriendo en el puerto ${PORT}`);
});
