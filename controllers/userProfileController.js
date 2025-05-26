// Importera moduler
const pool = require("../config/db"); 
const fs = require("fs");             // Inbyggt modul för filhantering
const path = require("path");       
const { getMessage } = require("../helpers/languageHelper"); 

// Ladda upp profilbild och spara filnamn i databasen
exports.uploadProfileImage = async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ message: "Ingen fil bifogad" });

    // Skapa sökvägen till filen som ska sparas i databasen
    const imagePath = "/uploads/" + req.file.filename;

    // Uppdatera användarens profilbild i databasen
    await pool.query("UPDATE users SET profile_image = ? WHERE id = ?", [imagePath, req.user.id]);

    // Skicka tillbaka framgångsmeddelande och sökväg
    res.status(200).json({ message: "Profilbild uppdaterad", path: imagePath });
  } catch (error) {
    // Fångar eventuella fel
    console.error("Fel vid uppladdning av bild:", error);
    res.status(500).json({ message: "Serverfel" });
  }
};

// Radera profilbild både från servern och databasen
exports.deleteProfileImage = async (req, res) => {
  const userId = req.user.id;
  const lang = req.user.language || 'sv';

  try {
    // Hämta den aktuella profilbildens filnamn från databasen
    const [rows] = await pool.query("SELECT profile_image FROM users WHERE id = ?", [userId]);
    const profileImage = rows[0].profile_image;

    // Om användaren inte har någon profilbild sparad
    if (!profileImage) {
      return res.status(404).json({ message: getMessage("noProfileImage", lang) });
    }

    // Skapa fullständig sökväg till bildfilen
    const imagePath = path.join(__dirname, "../uploads/", profileImage);

    // Om filen finns på filsystemet – ta bort den
    if (fs.existsSync(imagePath)) {
      fs.unlinkSync(imagePath);
    }

    // Uppdatera databasen för att ta bort referensen till profilbilden
    await pool.query("UPDATE users SET profile_image = NULL WHERE id = ?", [userId]);

    res.status(200).json({ message: getMessage("profileImageDeleted", lang) });
  } catch (error) {
    res.status(500).json({ message: getMessage("errorDeletingProfileImage", lang), error: error.message });
  }
};

// hämta aktuell användarprofil 
exports.getUserProfile = async (req, res) => {
  try {
    const userId = req.user.id;

    // Hämta användarens data från databasen
    const [[user]] = await pool.query(
      "SELECT id, name, email, role, level, profile_image FROM users WHERE id = ?",
      [userId]
    );

    // Om användaren inte finns i databasen
    if (!user) {
      return res.status(404).json({ message: "Användare hittades inte" });
    }

    // Om det finns en profilbild, generera fullständig URL
    if (user.profileImage) {
      user.profileImage = `${req.protocol}://${req.get("host")}/uploads/${user.profileImage}`;
    }
    // Returnera användarprofilen
    res.status(200).json(user); 
  } catch (error) {
    console.error("Fel vid hämtning av profil:", error);
    res.status(500).json({ message: "Något gick fel vid hämtning av profil." });
  }
};
