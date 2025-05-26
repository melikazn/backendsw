// Importera nödvändiga moduler och hjälpfunktioner
const pool = require("../config/db"); // Databasanslutning 
const { getMessage } = require("../helpers/languageHelper"); // För att hämta språk-specifika meddelanden
const { sendNotification } = require("../helpers/socketHelper"); // För att skicka notifikationer i realtid via WebSocket
// Skapa ett inl'gg
exports.createPost = async (req, res) => {
  // Hämta användarens ID och språk
  const userId = req.user.id;
  const lang = req.user.language || 'sv';
  const { title, content } = req.body;

  // Validering: både titel och innehåll måste finnas
  if (!title || !content) {
    return res.status(400).json({ message: getMessage("titleContentRequired", lang) });
  }

  try {
    // Lägg till foruminlägget i databasen
    const [result] = await pool.query(
      "INSERT INTO forum_posts (user_id, title, content) VALUES (?, ?, ?)",
      [userId, title, content]
    );
    const postId = result.insertId;

    // Hämta admin-användarens ID för att skicka notis
    const [[admin]] = await pool.query("SELECT id FROM users WHERE role = 'admin' LIMIT 1");

    if (admin) {
      const notifyTitle = "Nytt foruminlägg";
      const notifyMessage = `En ny fråga har publicerats: "${title}"`;

      // Skicka en notifikation till admin
      await pool.query(`
        INSERT INTO notifications (user_id, title, message, link, created_at)
        VALUES (?, ?, ?, ?, NOW())
      `, [
        admin.id,
        notifyTitle,
        notifyMessage,
        `/admin/forum/${postId}`
      ]);
    }

    res.status(201).json({
      message: getMessage("questionCreated", lang),
      id: postId
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: getMessage("errorSaving", lang), error: error.message });
  }
};


//Hämta alla inlägg
exports.getAllPosts = async (req, res) => {
  // Läs in språk, sidnummer och söksträng från query-parametrar
  const lang = req.user?.language || 'sv';
  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.limit) || 10;
  const offset = (page - 1) * limit;
  const search = req.query.search || "";
  const searchQuery = `%${search}%`;

  try {
    // Hämta foruminlägg med användarnamn och profilbild
    const [posts] = await pool.query(`
      SELECT p.id, p.title, p.content, p.created_at, p.likes, p.dislikes, u.name AS author,  u.profile_image
      FROM forum_posts p
      JOIN users u ON p.user_id = u.id
      WHERE p.is_deleted = 0 AND p.title LIKE ?
      ORDER BY p.created_at DESC
      LIMIT ? OFFSET ?
    `, [searchQuery, limit, offset]);

    res.status(200).json({
      page,
      limit,
      total: posts.length,
      results: posts
    });
  } catch (error) {
    console.error("❌ Fel i getAllPosts:", error);
    res.status(500).json({ message: getMessage("errorFetching", lang), error: error.message });
  }
};


// Alternativ namn för frontend-sökning
exports.getAllForumPosts = async (req, res) => {

  const lang = req.user?.language || 'sv';
  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.limit) || 10;
  const offset = (page - 1) * limit;
  const search = req.query.search || "";
  const searchQuery = `%${search}%`;

  try {
    const [posts] = await pool.query(`
      SELECT p.id, p.title, p.content, p.created_at, p.likes, p.dislikes, u.name AS author,  u.profile_image
      FROM forum_posts p
      JOIN users u ON p.user_id = u.id
      WHERE p.is_deleted = 0 AND p.title LIKE ?
      ORDER BY p.created_at DESC
      LIMIT ? OFFSET ?
    `, [searchQuery, limit, offset]);

    // Lägg till svar till varje post
    for (const post of posts) {
      const [answers] = await pool.query(`
        SELECT a.id, a.content, a.created_at, u.name AS author,  u.profile_image
        FROM forum_answers a
        JOIN users u ON a.user_id = u.id
        WHERE a.post_id = ? AND a.is_deleted = 0
        ORDER BY a.created_at ASC
      `, [post.id]);
      post.answers = answers;
    }

    // Hämta totalt antal träffar för paginering
    const [[{ total }]] = await pool.query(`
      SELECT COUNT(*) as total FROM forum_posts
      WHERE is_deleted = 0 AND title LIKE ?
    `, [searchQuery]);

    res.status(200).json({
      page,
      limit,
      total,
      results: posts
    });
  } catch (error) {
    res.status(500).json({ message: getMessage("errorFetching", lang), error: error.message });
  }
};

//  Hämta ett inlägg med alla dess svar
exports.getPostWithAnswers = async (req, res) => {
  const lang = req.user?.language || 'sv';
  const { postId } = req.params;

  try {
    // Hämta själva frågan
    const [[post]] = await pool.query(`
      SELECT p.id, p.title, p.content, p.created_at, u.name AS author,  u.profile_image
      FROM forum_posts p
      JOIN users u ON p.user_id = u.id
      WHERE p.id = ? AND p.is_deleted = 0
    `, [postId]);

    if (!post) {
      return res.status(404).json({ message: getMessage("questionNotFound", lang) });
    }

    // Hämta svar till frågan
    const [answers] = await pool.query(`
      SELECT a.id, a.content, a.created_at, u.name AS author,  u.profile_image
      FROM forum_answers a
      JOIN users u ON a.user_id = u.id
      WHERE a.post_id = ? AND a.is_deleted = 0
      ORDER BY a.created_at ASC
    `, [postId]);

    res.status(200).json({ post, answers });
  } catch (error) {
    res.status(500).json({ message: getMessage("errorFetching", lang), error: error.message });
  }
};


// Svara på ett inlägg
exports.answerPost = async (req, res) => {
  const userId = req.user.id;
  const lang = req.user.language || 'sv';
  const { postId } = req.params;
  const { content } = req.body;

  if (!content) {
    return res.status(400).json({ message: getMessage("answerContentRequired", lang) });
  }

  try {
    // Spara svaret i databasen
    await pool.query(
      "INSERT INTO forum_answers (post_id, user_id, content) VALUES (?, ?, ?)",
      [postId, userId, content]
    );

    // Hämta ägarens ID för att kunna skicka notis
    const [[postOwner]] = await pool.query(`
      SELECT user_id, title FROM forum_posts WHERE id = ?
    `, [postId]);

    if (postOwner) {
      const notifyMessage = getMessage("newAnswer", lang) + ` \"${postOwner.title}\"`;

      await pool.query(`
        INSERT INTO notifications (user_id, message)
        VALUES (?, ?)
      `, [postOwner.user_id, notifyMessage]);

      sendNotification(postOwner.user_id, notifyMessage);
    }

    res.status(201).json({ message: getMessage("answerPublished", lang) });
  } catch (error) {
    res.status(500).json({ message: getMessage("errorSaving", lang), error: error.message });
  }
};

// Admin tar bort ett inlägg
exports.deletePost = async (req, res) => {
  const lang = req.user.language || 'sv';
  const { postId } = req.params;

  try {
    await pool.query("UPDATE forum_posts SET is_deleted = 1 WHERE id = ?", [postId]);
    res.status(200).json({ message: getMessage("questionDeleted", lang) });
  } catch (error) {
    res.status(500).json({ message: getMessage("errorSaving", lang), error: error.message });
  }
};

// ✅ Admin tar bort ett svar
exports.deleteAnswer = async (req, res) => {
  const lang = req.user.language || 'sv';
  const { answerId } = req.params;

  try {
    await pool.query("UPDATE forum_answers SET is_deleted = 1 WHERE id = ?", [answerId]);
    res.status(200).json({ message: getMessage("answerDeleted", lang) });
  } catch (error) {
    res.status(500).json({ message: getMessage("errorSaving", lang), error: error.message });
  }
};
// Like/dislike en fråga
exports.votePost = async (req, res) => {
  const lang = req.user?.language || 'sv';
  const userId = req.user.id;
  const { postId } = req.params;
  const { type } = req.body; // "like" eller "dislike"

  if (!["like", "dislike"].includes(type)) {
    return res.status(400).json({ message: "Ogiltig typ av röstning." });
  }

  try {
     // Kolla om användaren redan röstat
    const [existing] = await pool.query(
      "SELECT * FROM forum_votes WHERE user_id = ? AND post_id = ?",
      [userId, postId]
    );

    if (existing.length === 0) {
        // Ny röst
      await pool.query(
        "INSERT INTO forum_votes (user_id, post_id, type) VALUES (?, ?, ?)",
        [userId, postId, type]
      );
      await pool.query(`UPDATE forum_posts SET ${type}s = ${type}s + 1 WHERE id = ?`, [postId]);
      return res.status(200).json({ message: "Röst registrerad." });
    }

    const previousType = existing[0].type;

    if (previousType === type) {
      // Samma rösttyp  då tas bort rösten
      await pool.query(
        "DELETE FROM forum_votes WHERE user_id = ? AND post_id = ?",
        [userId, postId]
      );
      await pool.query(`UPDATE forum_posts SET ${type}s = ${type}s - 1 WHERE id = ?`, [postId]);
      return res.status(200).json({ message: "Röst borttagen." });
    } else {
      // Byt rösttyp
      await pool.query(
        "UPDATE forum_votes SET type = ? WHERE user_id = ? AND post_id = ?",
        [type, userId, postId]
      );
      await pool.query(`
        UPDATE forum_posts
        SET ${type}s = ${type}s + 1, ${previousType}s = ${previousType}s - 1
        WHERE id = ?
      `, [postId]);

      return res.status(200).json({ message: "Röst uppdaterad." });
    }

  } catch (error) {
    console.error("Fel vid röstning:", error);
    res.status(500).json({ message: getMessage("errorSaving", lang), error: error.message });
  }
};

