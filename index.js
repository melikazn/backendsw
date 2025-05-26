// Importerar nödvändiga moduler
const express = require("express");
const dotenv = require("dotenv");
const cors = require("cors");
const path = require("path");
const http = require("http");
const userRoutes = require("./routes/userRoutes");
const adminRoutes = require("./routes/adminRoutes");
const { Server } = require("socket.io");

// Läser in miljövariabler från .env-filen
dotenv.config();

// Skapar en Express-app
const app = express();

// Använder antingen port från .env eller 5000 som standard
const PORT = process.env.PORT || 5000;

// Skapar en HTTP-server som används av både Express och Socket.IO
const server = http.createServer(app);

// Initierar Socket.IO och tillåter alla domäner (
const io = new Server(server, {
  cors: {
    origin: "*"
  }
});

// Gör Socket.IO-instansen tillgänglig i hela appen via req.app.get("io")
app.set("io", io);

// Aktiverar CORS så frontend kan kommunicera med backend
app.use(cors({
  origin: "http://localhost:5173",
  credentials: true
}));

// Mellanvara för att kunna läsa JSON- och URL-encoded-request bodies
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Kontroll: säkerställ att routes är korrekt exporterade som funktioner
if (typeof userRoutes !== 'function') {
  console.error("❌ userRoutes är inte en router. Kontrollera module.exports i routes/userRoutes.js");
  process.exit(1);
}
if (typeof adminRoutes !== 'function') {
  console.error("❌ adminRoutes är inte en router. Kontrollera module.exports i routes/adminRoutes.js");
  process.exit(1);
}

// Registrerar user- och admin-routes med prefix
app.use("/api/users", userRoutes);
app.use("/api/admin", adminRoutes);

// En enkel rot-endpoint för att verifiera att API:n är igång
app.get("/", (req, res) => {
  res.send("Swedish App API is running...");
});

// Tillgängliggör alla filer i "uploads"-mappen publikt
app.use("/uploads", express.static(path.join(__dirname, "uploads")));

// Hanterar nya WebSocket-anslutningar
io.on("connection", (socket) => {
  console.log("🔌 Ny användare ansluten till WebSocket: " + socket.id);

  socket.on("disconnect", () => {
    console.log("🔌 Användare frånkopplad: " + socket.id);
  });
});

// Startar servern
server.listen(PORT, () => {
  console.log(`Server running at http://localhost:${PORT}`);
});
