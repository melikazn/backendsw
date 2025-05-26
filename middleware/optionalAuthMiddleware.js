// Importerar JWT-biblioteket och databasanslutningen
const jwt = require("jsonwebtoken");
const pool = require("../config/db");

// Middleware som försöker autentisera användaren, men tillåter fortsatt åtkomst även utan token
const optionalAuthMiddleware = async (req, res, next) => {
  // Försök hämta token från Authorization-headern
  const token = req.header("Authorization")?.replace("Bearer ", "");

  // Om ingen token finns, fortsätt utan att sätta req.user
  if (!token) {
    req.user = null;
    return next(); // Tillåt att fortsätta utan att vara inloggad
  }

  try {
    // Dekoda JWT för att extrahera userId
    const decoded = jwt.decode(token);

    // Om decoding misslyckas eller userId saknas, fortsätt utan att sätta användare
    if (!decoded || !decoded.userId) {
      req.user = null;
      return next();
    }

    // Hämta användaren från databasen baserat på ID
    const [rows] = await pool.query(
      "SELECT id, name, email, role, jwt_secret FROM users WHERE id = ?",
      [decoded.userId]
    );

    // Om användaren inte finns i databasen, fortsätt utan användare
    if (rows.length === 0) {
      req.user = null;
      return next();
    }

    const user = rows[0];

    // Validera token med användarens specifika JWT-hemlighet
    jwt.verify(token, user.jwt_secret, (err) => {
      if (err) {
        // Token är ogiltig 
        req.user = null;
      } else {
        // Token är giltig, sätt användaren i req.user
        req.user = {
          id: user.id,
          name: user.name,
          email: user.email,
          role: user.role,
        };
      }

      // Gå vidare oavsett om token är giltig eller inte
      next();
    });
  } catch (error) {
    // Fångar oväntade fel och fortsätter ändå
    req.user = null;
    next();
  }
};

// Exporterar middleware-funktionen för användning i routes
module.exports = optionalAuthMiddleware;
