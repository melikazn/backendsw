// Importerar databaskoppling och språkhanterare
const pool = require("../config/db");
const { getMessage } = require("../helpers/languageHelper");

// Hämta notisar
exports.getNotifications = async (req, res) => {
  const userId = req.user.id;
  const lang = req.user.language || 'sv';
  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.limit) || 5;
  const offset = (page - 1) * limit;

  try {
    // Rensa gamla notiser - behåll endast de 15 senaste (kontrollerar att databasen inte växer för mycket)
    await pool.query(`
      DELETE FROM notifications 
      WHERE user_id = ? AND id NOT IN (
        SELECT id FROM (
          SELECT id FROM notifications 
          WHERE user_id = ?
          ORDER BY created_at DESC
          LIMIT 15
        ) AS latest
      )
    `, [userId, userId]);

    //  Hämta paginerade notiser
    const [notifications] = await pool.query(`
      SELECT id, title, message, is_read, created_at, link
      FROM notifications
      WHERE user_id = ?
      ORDER BY created_at DESC
      LIMIT ? OFFSET ?
    `, [userId, limit, offset]);

    //  Räkna total för paginering
    const [[{ total }]] = await pool.query(`
      SELECT COUNT(*) as total
      FROM notifications
      WHERE user_id = ?
    `, [userId]);

    const totalPages = Math.ceil(total / limit);

    res.status(200).json({
      page,
      totalPages,
      limit,
      results: notifications
    });
  } catch (error) {
    console.error("❌ Fel vid hämtning/rensning av notiser:", error);
    res.status(500).json({ message: getMessage("errorFetching", lang), error: error.message });
  }
};


//  Markera en notis som läst
exports.markAsRead = async (req, res) => {
  const userId = req.user.id;
  const lang = req.user.language || 'sv';
  const { id } = req.params;

  try {
    // Uppdatera notisen i databasen till läst 
    const [result] = await pool.query(`
      UPDATE notifications
      SET is_read = 1
      WHERE id = ? AND user_id = ?
    `, [id, userId]);
    // Om ingen rad uppdaterades betyder det att notisen inte finns
    if (result.affectedRows === 0) {
      return res.status(404).json({ message: getMessage("notificationNotFound", lang) });
    }
    // Skicka bekräftelse
    res.status(200).json({ message: getMessage("notificationMarkedRead", lang) });
  } catch (error) {
    console.error("❌ Fel vid uppdatering av notis:", error);
    res.status(500).json({ message: getMessage("errorSaving", lang), error: error.message });
  }
};

// Hämta en enskild notis
exports.getNotificationById = async (req, res) => {
  const userId = req.user.id;
  const { id } = req.params;

  try {
     // Hämta notisen från databasen
    const [[notification]] = await pool.query(`
      SELECT * FROM notifications
      WHERE id = ? AND user_id = ?
    `, [id, userId]);
        // Om den inte hittas, returnera erroe
    if (!notification) {
      return res.status(404).json({ message: "Meddelandet hittades inte." });
    }

    res.status(200).json(notification);
  } catch (err) {
    console.error("❌ Fel vid hämtning av enskild notis:", err);
    res.status(500).json({ message: "Kunde inte hämta meddelandet.", error: err.message });
  }
};
