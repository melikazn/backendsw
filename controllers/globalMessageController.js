// Importerar databaskoppling och språkhanterare
const pool = require("../config/db");
const { getMessage } = require("../helpers/languageHelper");

// Skicka ett globalt meddelande till alla användare 
exports.sendGlobalMessage = async (req, res) => {
  const adminLang = req.user.language || 'sv';
  const { title, message } = req.body;
  const senderId = req.user.id;

  // Kontrollera att meddelandet inte är tomt
  if (!message) {
    return res.status(400).json({ message: getMessage("globalMessageRequired", adminLang) });
  }

  try {
    // Hämta alla användare från databasen
    const [users] = await pool.query("SELECT id FROM users");

    // Om inga användare finns
    if (users.length === 0) {
      return res.status(200).json({ message: getMessage("noUsers", adminLang) });
    }

    // Filtrera bort admin från listan och bygg en lista med notifikationer
    const values = users
      .filter(user => user.id !== senderId)
      .map(user => [user.id, title || null, message, null]);

    // Infoga notifikationer i bulk om det finns mottagare
    if (values.length > 0) {
      await pool.query(
        "INSERT INTO notifications (user_id, title, message, link) VALUES ?",
        [values]
      );
    }

    // Bekräfta att meddelandet har skickats
    res.status(200).json({ message: getMessage("globalMessageSent", adminLang) });
  } catch (error) {
    // Hantera oväntade fel
    res.status(500).json({ message: getMessage("errorSaving", adminLang), error: error.message });
  }
};

//  Användare skickar privat meddelande till admin
exports.sendMessageToAdmin = async (req, res) => {
  const { subject, message } = req.body;
  const userId = req.user.id;

  // Kontrollera att meddelandetext finns
  if (!message || message.trim() === "") {
    return res.status(400).json({ message: "Meddelande krävs." });
  }

  try {
    // Spara meddelandet i tabellen "messages"
    const [result] = await pool.query(
      "INSERT INTO messages (user_id, subject, message, created_at) VALUES (?, ?, ?, NOW())",
      [userId, subject || null, message]
    );
    const messageId = result.insertId;

    // Hämta första tillgängliga admin för att skicka en notifikation
    const [[admin]] = await pool.query("SELECT id FROM users WHERE role = 'admin' LIMIT 1");

    // Skapa notifikation till admin
    await pool.query(`
      INSERT INTO notifications (user_id, title, message, link, created_at)
      VALUES (?, ?, ?, ?, NOW())
    `, [
      admin.id,
      subject || "Meddelande från användare",
      "Du har fått ett nytt meddelande från en användare.",
      `/dashboard/messages/thread/${messageId}`
    ]);

    res.status(200).json({ message: "Meddelande skickat." });
  } catch (error) {
    res.status(500).json({ message: "Kunde inte spara meddelandet.", error: error.message });
  }
};

//Hämta alla meddelanden för en viss användare
exports.getUserMessages = async (req, res) => {
  const userId = req.user.id;

  try {
      // Hämtae alla meddelanden och deras senaste aktivitet 
    const [rows] = await pool.query(`
      SELECT 
        m.id, 
        m.subject, 
        m.message, 
        m.admin_reply, 
        m.answered, 
        m.created_at,
        m.sender_role,
        GREATEST(
          IFNULL(m.created_at, '1970-01-01'),
          IFNULL(MAX(r.created_at), '1970-01-01')
        ) AS latest_activity
      FROM messages m
      LEFT JOIN message_replies r ON r.message_id = m.id
      WHERE m.user_id = ?
      GROUP BY m.id
      ORDER BY latest_activity DESC
    `, [userId]);

    res.status(200).json(rows);
  } catch (error) {
    res.status(500).json({
      message: "Kunde inte hämta dina meddelanden.",
      error: error.message,
    });
  }
};


//Admin: Hämta alla användares meddelanden
exports.getAllMessages = async (req, res) => {
  try {
    const [rows] = await pool.query(`
      SELECT 
        m.id, 
        m.subject, 
        m.message, 
        m.admin_reply, 
        m.answered, 
        m.created_at,
        u.name AS sender,
        GREATEST(
          IFNULL(m.created_at, '1970-01-01'), 
          IFNULL(MAX(r.created_at), '1970-01-01')
        ) AS latest_activity
      FROM messages m
      JOIN users u ON m.user_id = u.id
      LEFT JOIN message_replies r ON r.message_id = m.id
      GROUP BY m.id
      ORDER BY latest_activity DESC
    `);

    res.status(200).json(rows);
  } catch (error) {
    res.status(500).json({ message: "Kunde inte hämta meddelanden.", error: error.message });
  }
};


// Admin: Svara på ett meddelande
exports.replyToMessage = async (req, res) => {
  const { messageId } = req.params;
  const { reply } = req.body;

  if (!reply) {
    // Kontrollera att svaret inte är tomt
    return res.status(400).json({ message: "Svar kan inte vara tomt." });
  }

  try {
    await pool.query(
      // Uppdatera meddelandet med admins svar
      "UPDATE messages SET admin_reply = ?, answered = 1 WHERE id = ?",
      [reply, messageId]
    );
    res.status(200).json({ message: "Svar skickat till användaren." });
  } catch (error) {
    res.status(500).json({ message: "Kunde inte spara svaret.", error: error.message });
  }
};


//  Trådbaserat svar från admin eller användare
exports.replyToThread = async (req, res) => {
  const { messageId } = req.params;
  const { content } = req.body;
  const senderRole = req.user.role === "admin" ? "admin" : "user";

  // Kontrollera att svaret inte är tomt
  if (!content || content.trim() === "") {
    return res.status(400).json({ message: "Svar krävs." });
  }

  try {
    // Spara svaret med sändarens roll
    await pool.query(
      `INSERT INTO message_replies (message_id, sender_role, content, created_at)
       VALUES (?, ?, ?, NOW())`,
      [messageId, senderRole, content.trim()]
    );
    // Hämta information om mottagaren
    const [[message]] = await pool.query(`
      SELECT m.subject, m.user_id, u.id AS admin_id
      FROM messages m
      JOIN users u ON u.role = 'admin'
      WHERE m.id = ?
    `, [messageId]);

    if (!message) {
      return res.status(404).json({ message: "Tråden hittades inte." });
    }

    const link = `/dashboard/messages/thread/${messageId}`;

    // Skicka notifikation beroende på vem som svarar
    if (senderRole === "admin") {
      await pool.query(`
        INSERT INTO notifications (user_id, title, message, link, created_at)
        VALUES (?, ?, ?, ?, NOW())
      `, [
        message.user_id,
        message.subject || "Svar från admin",
        "Du har fått ett nytt svar från admin.",
        link
      ]);
    } else {
      await pool.query(`
        INSERT INTO notifications (user_id, title, message, link, created_at)
        VALUES (?, ?, ?, ?, NOW())
      `, [
        message.admin_id,
        message.subject || "Svar från användare",
        "Du har fått ett nytt svar från en användare.",
        link
      ]);
    }

    res.status(200).json({ message: "Svar sparat och notifikation skickad." });
  } catch (err) {
    console.error("❌ Fel vid svar på tråd:", err);
    res.status(500).json({ message: "Kunde inte spara svaret.", error: err.message });
  }
};


// Hämta en tråd för användare
exports.getMessageThread = async (req, res) => {
  const { messageId } = req.params;
  const userId = req.user.id;

  try {
    // Kontrollera att användaren äger meddelandet
    const [[message]] = await pool.query(
      `SELECT * FROM messages WHERE id = ? AND user_id = ?`,
      [messageId, userId]
    );

    if (!message) {
      return res.status(404).json({ message: "Meddelandet hittades inte." });
    }

    const [replies] = await pool.query(
      // Hämta alla svar i rätt ordning
      `SELECT * FROM message_replies WHERE message_id = ? ORDER BY created_at ASC`,
      [messageId]
    );

    res.status(200).json({ message, replies });
  } catch (err) {
    res.status(500).json({ message: "Kunde inte hämta tråden.", error: err.message });
  }
};

//Hämta en tråd för admin
exports.getAdminMessageThread = async (req, res) => {
  const { messageId } = req.params;

  try {
    // Hämta själva meddelandet samt användarens namn
    const [[message]] = await pool.query(`
      SELECT m.*, u.name as sender
      FROM messages m
      JOIN users u ON m.user_id = u.id
      WHERE m.id = ?
    `, [messageId]);

    if (!message) {
      return res.status(404).json({ message: "Meddelandet hittades inte." });
    }
    // Hämta tillhörande svar
    const [replies] = await pool.query(`
      SELECT * FROM message_replies WHERE message_id = ? ORDER BY created_at ASC
    `, [messageId]);

    res.status(200).json({ message, replies });
  } catch (err) {
    res.status(500).json({ message: "Kunde inte hämta tråden.", error: err.message });
  }
};

// Skicka ett privat meddelande från admin till användare
exports.sendPrivateMessageToUser = async (req, res) => {
  const { userId, subject, message } = req.body;
  const senderId = req.user.id;

  if (!message || message.trim() === "") {
    return res.status(400).json({ message: "Meddelande krävs." });
  }

  try {
    // Spara meddelandet som admin till användare
    const [result] = await pool.query(
      `INSERT INTO messages (user_id, subject, message, sender_role, created_at)
       VALUES (?, ?, ?, 'admin', NOW())`,
      [userId, subject || null, message]
    );

    const messageId = result.insertId;
    // Skicka notifikation om admin inte skickar till sig själv
    if (userId !== senderId) {
      await pool.query(
        `INSERT INTO notifications (user_id, title, message, link, created_at)
         VALUES (?, ?, ?, ?, NOW())`,
        [
          userId,
          subject || "Privat meddelande",
          message,
          `/dashboard/messages/thread/${messageId}`
        ]
      );
    }

    res.status(200).json({ message: "Meddelande skickat till användaren." });
  } catch (error) {
    console.error("❌ Fel vid meddelandeskick:", error);
    res.status(500).json({ message: "Kunde inte skicka meddelandet.", error: error.message });
  }
};


//  Radera ett meddelande och alla dess svar
exports.deleteMessage = async (req, res) => {
  const { messageId } = req.params;

  try {
    // Ta bort alla svar kopplade till meddelandet först
    await pool.query("DELETE FROM message_replies WHERE message_id = ?", [messageId]);
    const [result] = await pool.query("DELETE FROM messages WHERE id = ?", [messageId]);
// Radera själva meddelandet
    if (result.affectedRows === 0) {
      return res.status(404).json({ message: "Meddelandet hittades inte." });
    }

    res.status(200).json({ message: "Meddelandet raderat." });
  } catch (error) {
    console.error("❌ Fel vid radering av meddelande:", error);
    res.status(500).json({ message: "Kunde inte radera meddelandet.", error: error.message });
  }
};
