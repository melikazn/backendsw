let ioInstance; // Håller socket.io-instansen så att den kan användas globalt
let onlineUsers = {}; // Ett objekt där nyckeln är userId och värdet är socketId

// Sätt upp socket.io och lyssna på events
const setupSocket = (io) => {
  // Spara instansen för senare användning
  ioInstance = io; 

  io.on("connection", (socket) => {
    console.log("🔌 Användare ansluten:", socket.id);

    // När en användare registrerar sitt userId efter anslutning
    socket.on("register", (userId) => {
      console.log(`👤 User ${userId} kopplad till socket ${socket.id}`);
      // Spara kopplingen
      onlineUsers[userId] = socket.id; 
    });

    //  När en användare kopplas från (t.ex. stänger fliken)
    socket.on("disconnect", () => {
      console.log("🔌 Användare frånkopplad:", socket.id);
      // Ta bort användaren från onlineUsers
      for (let user in onlineUsers) {
        if (onlineUsers[user] === socket.id) {
          delete onlineUsers[user];
        }
      }
    });
  });
};

// Skicka en notifikation till en viss användare om hen är online
const sendNotification = (userId, message) => {
  // Hämta socketId för userId
  const socketId = onlineUsers[userId]; 
  if (socketId && ioInstance) {
    // Skicka meddelande till rätt socket
    ioInstance.to(socketId).emit("notification", message);
    console.log(`📢 Notis skickad till User ${userId}: ${message}`);
  } else {
    // Användaren är offline – kan meddelandet spara i databasen istället
    console.log(`⚠️ User ${userId} är inte online. Notis sparas endast i databasen.`);
  }
};

// Exporterar funktionerna för att användas i din server
module.exports = { setupSocket, sendNotification };
