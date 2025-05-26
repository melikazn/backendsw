// Importerar JSON Web Token för att hantera tokenverifiering
const jwt = require("jsonwebtoken");

// Importerar databasanslutningen
const pool = require("../config/db");

// Middleware för att skydda rutter som kräver autentisering
const authMiddleware = async (req, res, next) => {
  // Hämtar JWT från "Authorization"-headern och tar bort "Bearer "
  const token = req.header("Authorization")?.replace("Bearer ", "");

  // Om ingen token finns skickas ett error (401)
  if (!token) {
    return res.status(401).json({ message: "Ingen token, åtkomst nekad" });
  }

  try {
    // Dekodar token för att extrahera userId utan att verifiera signaturen än
    const decoded = jwt.decode(token);

    // Om token inte är korrekt formaterad eller saknar userId - avvisa
    if (!decoded || !decoded.userId) {
      return res.status(401).json({ message: "Ogiltig tokenstruktur" });
    }

    // Hämtar användarens info från databasen inklusive deras unika jwt_secret
    const [rows] = await pool.query(
      "SELECT id, name, email, role, jwt_secret FROM users WHERE id = ?",
      [decoded.userId]
    );

    // Om ingen användare hittas - avvisa
    if (rows.length === 0) {
      return res.status(401).json({ message: "Användare hittades inte" });
    }

    const user = rows[0];

    // Verifierar token-signaturen med användarens unika jwt_secret
    jwt.verify(token, user.jwt_secret, (err, verified) => {
      if (err) {
        return res.status(401).json({ message: "Token är ogiltig" });
      }

      // Lägger till användarinformation i req.user så den är tillgänglig i andra controllers
      req.user = {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
      };

      // Går vidare till nästa middleware eller controller
      next();
    });
  } catch (error) {
    console.error("Autentiseringsfel:", error);
    res.status(401).json({ message: "Tokenverifiering misslyckades", error: error.message });
  }
};

// Exporterar middleware så den kan användas i routes
module.exports = authMiddleware;
