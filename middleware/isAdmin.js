// Importerar databasanslutningen
const pool = require("../config/db");

// Middleware för att kontrollera om användaren är en admin
const isAdmin = async (req, res, next) => {
  try {
    // Hämtar användarens roll från databasen med hjälp av user.id från authMiddleware
    const [rows] = await pool.query("SELECT role FROM users WHERE id = ?", [req.user.id]);

    // Om ingen användare hittas, eller om rollen inte är "admin" - neka åtkomst
    if (rows.length === 0 || rows[0].role !== "admin") {
      return res.status(403).json({ message: "Åtkomst nekad – admin krävs" });
    }

    // Användaren är en admin - fortsätt till nästa middleware eller controller
    next();
  } catch (error) {
    // Fångar eventuella fel
    res.status(500).json({ message: "Fel vid kontroll av admin-behörighet" });
  }
};

// Exporterar middleware-funktionen så den kan användas i routes
module.exports = isAdmin;
