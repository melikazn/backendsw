// Importera nödvändiga moduler
const multer = require("multer"); // Hanterar filuppladdning i Express
const path = require("path");     // Ger verktyg för att hantera filvägar och filändelser

// Konfigurera lagringsinställningar för videofiler
const storage = multer.diskStorage({
  // Var videofiler ska sparas på servern
  destination: function (req, file, cb) {
    cb(null, "uploads/videos"); // Alla videofiler sparas i katalogen uploads/videos
  },
  // Hur filerna ska namnges
  filename: function (req, file, cb) {
    // Skapa ett unikt filnamn med timestamp + originalnamn
    const uniqueName = Date.now() + "-" + file.originalname;
    cb(null, uniqueName);
  }
});

// Skapa en Multer-instans med begränsningar och filfilter
const upload = multer({
  storage, // Använd lagringsinställningarna ovan
  limits: { fileSize: 1000 * 1024 * 1024 },
  fileFilter: function (req, file, cb) {
    // Kontrollera filändelse 
    const ext = path.extname(file.originalname).toLowerCase();

    // Lista över tillåtna videoformat
    if ([".mp4", ".mov", ".avi", ".mkv", ".webm"].includes(ext)) {
      cb(null, true);
    } else {
      cb(new Error("Endast videoformat stöds")); // Avvisa andra filformat
    }
  }
});

// Exportera Multer-instansen så den kan användas i routes
module.exports = upload;
