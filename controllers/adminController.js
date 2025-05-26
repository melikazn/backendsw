// Importerar databaskoppling 
const pool = require("../config/db");

// Hämtar sammanställd statistik till admins dashboard
exports.getAdminStatistics = async (req, res) => {
  try {
    // Antal registrerade användare
    const [[{ totalUsers }]] = await pool.query("SELECT COUNT(*) AS totalUsers FROM users");

    // Antal genomförda tester
    const [[{ testsCompleted }]] = await pool.query("SELECT COUNT(*) AS testsCompleted FROM results");

    // Användarnivåer (A1–C1) och hur många användare som finns på varje
    const [levelProgress] = await pool.query(`
      SELECT level, COUNT(*) AS count
      FROM users
      GROUP BY level
    `);

    // Beräknar procentandel per nivå jämfört med totala användare
    const totalCount = totalUsers || 1; 
    const levelProgressWithPercent = levelProgress.map(row => ({
      ...row,
      percentage: parseFloat(((row.count / totalCount) * 100).toFixed(1))
    }));

    // Antal foruminlägg 
    const [[{ forumPosts }]] = await pool.query(
      "SELECT COUNT(*) AS forumPosts FROM forum_posts WHERE is_deleted = 0"
    );

    // Antal svar i forumet 
    const [[{ forumAnswers }]] = await pool.query(
      "SELECT COUNT(*) AS forumAnswers FROM forum_answers WHERE is_deleted = 0"
    );

    // Antal obesvarade privata meddelanden till admin
    const [[{ newMessages }]] = await pool.query(
      "SELECT COUNT(*) AS newMessages FROM messages WHERE answered = 0"
    );

    // Antal nya foruminlägg 
    const [[{ newForumPosts }]] = await pool.query(
      "SELECT COUNT(*) AS newForumPosts FROM forum_posts WHERE is_deleted = 0"
    );

    // Antal nya användare de senaste 7 dagarna
    const [[{ usersLast7Days }]] = await pool.query(`
      SELECT COUNT(*) AS usersLast7Days
      FROM users
      WHERE created_at >= NOW() - INTERVAL 7 DAY
    `);

    // Antal nya användare de senaste 30 dagarna
    const [[{ usersLast30Days }]] = await pool.query(`
      SELECT COUNT(*) AS usersLast30Days
      FROM users
      WHERE created_at >= NOW() - INTERVAL 30 DAY
    `);

    // Genomsnittligt testresultat per nivå (poäng av 20)
    const [averageScorePerLevel] = await pool.query(`
      SELECT u.level, ROUND(AVG(r.correct_answers / NULLIF(r.total_questions, 0) * 20), 2) AS averageScore
      FROM results r
      JOIN users u ON r.user_id = u.id
      WHERE r.total_questions > 0
      GROUP BY u.level
    `);

    // Returnerar all statistik som ett JSON-objekt
    res.status(200).json({
      totalUsers,
      testsCompleted,
      levelProgress: levelProgressWithPercent,
      forumPosts,
      forumAnswers,
      newMessages,
      newForumPosts,
      usersLast7Days,
      usersLast30Days,
      averageScorePerLevel
    });
  } catch (error) {
    console.error("Statistikfel:", error);
    res.status(500).json({
      message: "Fel vid hämtning av statistik",
      error: error.message
    });
  }
};

// Hämtar lista med alla användare för adminpanelen
exports.getAllUsers = async (req, res) => {
  try {
    const [users] = await pool.query(`
      SELECT id, name, email, level, created_at
      FROM users
      ORDER BY created_at DESC
    `);

    res.status(200).json(users);
  } catch (error) {
    res.status(500).json({ message: "Kunde inte hämta användare", error: error.message });
  }
};

// Markerar en specifik notifikation som läst 
exports.markNotificationAsRead = async (req, res) => {
  const { id } = req.params;

  try {
    await pool.query(
      "UPDATE notifications SET is_read = 1 WHERE id = ?",
      [id]
    );
    res.status(200).json({ message: "Notifikation markerad som läst." });
  } catch (error) {
    res.status(500).json({ message: "Fel vid uppdatering av notifikation", error: error.message });
  }
};

// Hämtar alla olästa notifikationer för inloggad användare
exports.getUnreadNotifications = async (req, res) => {
  const userId = req.user.id;

  try {
    const [notifications] = await pool.query(`
      SELECT id, user_id, message, created_at
      FROM notifications
      WHERE is_read = 0 AND user_id = ?
      ORDER BY created_at DESC
    `, [userId]);

    res.status(200).json(notifications);
  } catch (error) {
    res.status(500).json({ message: "Kunde inte hämta notifikationer", error: error.message });
  }
};

//Hämta alla användare 
exports.getAllUsers = async (req, res) => {
  try {
    // Hämta användarlistan från databasen
    const [users] = await pool.query(
      "SELECT id, name, email, level FROM users ORDER BY created_at DESC"
    );
    res.status(200).json(users);
  } catch (error) {
    res.status(500).json({ message: "Kunde inte hämta användare", error: error.message });
  }
};
// Ta bort en användare 
exports.deleteUser = async (req, res) => {
  const { id } = req.params;

  try {
    // Tabort användaren från databasen
    await pool.query("DELETE FROM users WHERE id = ?", [id]);
    res.status(200).json({ message: "Användaren har raderats." });
  } catch (error) {
    console.error("❌ Fel vid borttagning av användare:", error);
    res.status(500).json({ message: "Kunde inte ta bort användaren", error: error.message });
  }
};