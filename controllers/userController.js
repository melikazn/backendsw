// Importera moduler
const bcrypt = require("bcryptjs"); 
const jwt = require("jsonwebtoken"); 
const pool = require("../config/db");
const crypto = require("crypto"); 
const { getMessage } = require("../helpers/languageHelper"); 

// Registrera ny användare
exports.registerUser = async (req, res) => {
  const lang = req.user?.language || 'sv'; 
  const { name, email, password } = req.body;

  try {
    // Hasha användarens lösenord med bcrypt
    const hashedPassword = await bcrypt.hash(password, 10);

    // Generera en unik hemlighet som används för JWT-signering 
    const jwtSecret = crypto.randomBytes(64).toString("hex");

    // Spara användaren i databasen
    await pool.query(
      "INSERT INTO users (name, email, password, jwt_secret) VALUES (?, ?, ?, ?)",
      [name, email, hashedPassword, jwtSecret]
    );

    // Skicka bekräftelsemeddelande
    res.status(201).json({ message: getMessage("userRegistered", lang) });
  } catch (error) {
    res.status(500).json({ message: getMessage("errorRegistering", lang), error: error.message });
  }
};

//  Logga in användare
exports.loginUser = async (req, res) => {
  const lang = req.user?.language || 'sv';
  const { email, password } = req.body;

  try {
    // Hämta användare med angiven e-post
    const [rows] = await pool.query("SELECT * FROM users WHERE email = ?", [email]);

    // Om ingen användare hittades, returnera fel
    if (rows.length === 0) {
      return res.status(400).json({ message: getMessage("userNotFound", lang) });
    }

    const user = rows[0];

    // Jämför inmatat lösenord med det hashade lösenordet
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(400).json({ message: getMessage("invalidPassword", lang) });
    }

    // Skapa JWT-token med användarens personliga jwt_secret
    const token = jwt.sign({ userId: user.id }, user.jwt_secret, { expiresIn: "7d" });

    // Skicka tillbaka token och användardata
    res.status(200).json({
      message: getMessage("loginSuccess", lang),
      token,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        level: user.level,
        role: user.role 
      },
    });
  } catch (error) {
    res.status(500).json({ message: getMessage("errorLoggingIn", lang), error: error.message });
  }
};

// Hämta inloggad användares profil
exports.getUserProfile = async (req, res) => {
  const lang = req.user.language || 'sv';
  try {
    // Hämta användarens profilinfo
    const [rows] = await pool.query("SELECT id, name, email, level FROM users WHERE id = ?", [req.user.id]);
    const user = rows[0];

    res.status(200).json(user);
  } catch (error) {
    res.status(500).json({ message: getMessage("errorFetchingProfile", lang) });
  }
};