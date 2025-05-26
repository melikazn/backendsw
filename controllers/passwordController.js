const pool = require("../config/db");
const bcrypt = require("bcryptjs");
const { getMessage } = require("../helpers/languageHelper");

// Ändra användarens lösenord efter att ha verifierat det gamla
exports.changePassword = async (req, res) => {
  const userId = req.user.id; 
  const lang = req.user.language || 'sv';
  const { currentPassword, newPassword } = req.body; 

  // Kontrollera att båda fälten är ifyllda
  if (!currentPassword || !newPassword) {
    return res.status(400).json({ message: getMessage("bothPasswordsRequired", lang) });
  }

  // Validera lösenordets styrka :
  // Minst en liten bokstav, en stor bokstav, en siffra, och minst 6 tecken långt
  const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).{6,}$/;

  if (!passwordRegex.test(newPassword)) {
    return res.status(400).json({
      message: getMessage("weakPassword", lang) || 
        "Lösenordet måste vara minst 6 tecken långt och innehålla stora bokstäver, små bokstäver och siffror."
    });
  }

  try {
    // Hämta användarens befintliga information från databasen
    const [[user]] = await pool.query("SELECT * FROM users WHERE id = ?", [userId]);

    // Om användaren inte finns (ovanligt), returnera 404
    if (!user) {
      return res.status(404).json({ message: getMessage("userNotFound", lang) });
    }

    // Jämför det gamla lösenordet med det som finns i databasen
    const isMatch = await bcrypt.compare(currentPassword, user.password);

    // Om det inte stämmer överens, neka bytet
    if (!isMatch) {
      return res.status(400).json({ message: getMessage("invalidPassword", lang) });
    }

    // Hasha det nya lösenordet för säker lagring
    const hashedPassword = await bcrypt.hash(newPassword, 10);

    // Uppdatera lösenordet i databasen
    await pool.query("UPDATE users SET password = ? WHERE id = ?", [hashedPassword, userId]);

    // Skicka ett lyckat svar
    res.status(200).json({ message: getMessage("passwordChanged", lang) });
  } catch (error) {
    // Vid oväntat fel, returnera ett felmeddelande
    res.status(500).json({ message: getMessage("errorSaving", lang), error: error.message });
  }
};

