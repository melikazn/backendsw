// Importerar databaskoppling och språkhanterare
const pool = require("../config/db");
const { getMessage } = require("../helpers/languageHelper");

// FAVORITVIDEOR 

// Lägger till en video som favorit för den inloggade användaren
exports.addFavoriteVideo = async (req, res) => {
  const userId = req.user.id;
  const lang = req.user.language || 'sv'; // Standard: svenska om språk saknas
  const { videoId } = req.params;

  try {
    // Försöker lägga till raden – IGNORE förhindrar fel om den redan finns
    await pool.query(`
      INSERT IGNORE INTO favorite_videos (user_id, video_id) VALUES (?, ?)
    `, [userId, videoId]);

    // Skickar tillbaka meddelande baserat på användarens språk
    res.status(200).json({ message: getMessage("favoriteAdded", lang) });
  } catch (error) {
    res.status(500).json({ message: getMessage("errorSaving", lang), error: error.message });
  }
};

// Tar bort en video från favoriter
exports.removeFavoriteVideo = async (req, res) => {
  const userId = req.user.id;
  const lang = req.user.language || 'sv';
  const { videoId } = req.params;

  try {
    // Tar bort raden där både användar-ID och video-ID matchar
    await pool.query(`
      DELETE FROM favorite_videos WHERE user_id = ? AND video_id = ?
    `, [userId, videoId]);

    res.status(200).json({ message: getMessage("favoriteRemoved", lang) });
  } catch (error) {
    res.status(500).json({ message: getMessage("errorSaving", lang), error: error.message });
  }
};

// Hämtar alla favoritvideor för den inloggade användaren
exports.getFavoriteVideos = async (req, res) => {
  const userId = req.user.id;

  try {
    // Hämtar favoritvideor samt deras sektion och nivå för visning i frontend
    const [favorites] = await pool.query(`
      SELECT 
        v.id, 
        v.title, 
        v.filename, 
        v.section_id,
        s.level
      FROM favorite_videos f
      JOIN videos v ON f.video_id = v.id
      JOIN sections s ON v.section_id = s.id
      WHERE f.user_id = ?
    `, [userId]);

    res.status(200).json(favorites);
  } catch (error) {
    res.status(500).json({
      message: getMessage("errorFetching", req.user.language || 'sv'),
      error: error.message
    });
  }
};

// Kollar om en specifik video är favorit för användaren
exports.isFavoriteVideo = async (req, res) => {
  const userId = req.user.id;
  const { videoId } = req.params;

  try {
    // Om en rad hittas, är videon en favorit
    const [rows] = await pool.query(`
      SELECT 1 FROM favorite_videos WHERE user_id = ? AND video_id = ?
    `, [userId, videoId]);

    res.status(200).json({ isFavorite: rows.length > 0 });
  } catch (error) {
    res.status(500).json({ message: getMessage("errorFetching", req.user.language || 'sv'), error: error.message });
  }
};

//FAVORITORD

// Lägger till ett ord som favorit
exports.addFavoriteWord = async (req, res) => {
  const userId = req.user.id;
  const { wordId } = req.params;
  const lang = req.user.language || 'sv';

  try {
    // Förhindrar duplicering med INSERT IGNORE
    await pool.query(`
      INSERT IGNORE INTO favorite_words (user_id, word_id) VALUES (?, ?)
    `, [userId, wordId]);

    res.status(200).json({ message: getMessage("favoriteAdded", lang) });
  } catch (error) {
    res.status(500).json({ message: getMessage("errorSaving", lang), error: error.message });
  }
};

// Tar bort ett ord från användarens favoriter
exports.removeFavoriteWord = async (req, res) => {
  const userId = req.user.id;
  const { wordId } = req.params;
  const lang = req.user.language || 'sv';

  try {
    // Raderar endast raden som matchar båda ID:n
    await pool.query(`
      DELETE FROM favorite_words WHERE user_id = ? AND word_id = ?
    `, [userId, wordId]);

    res.status(200).json({ message: getMessage("favoriteRemoved", lang) });
  } catch (error) {
    res.status(500).json({ message: getMessage("errorSaving", lang), error: error.message });
  }
};

// Hämtar alla ord användaren har lagt till som favoriter
exports.getFavoriteWords = async (req, res) => {
  const userId = req.user.id;

  try {
    const [rows] = await pool.query(`
      SELECT v.id, v.word, v.translation, v.level
      FROM favorite_words f
      JOIN vocabulary v ON f.word_id = v.id
      WHERE f.user_id = ?
    `, [userId]);

    res.status(200).json(rows);
  } catch (err) {
    console.error("Fel vid hämtning av favoritord:", err);
    res.status(500).json({ message: "Fel vid hämtning av favoritord", error: err.message });
  }
};

// Returnerar true/false beroende på om ett ord är favorit
exports.isFavoriteWord = async (req, res) => {
  const userId = req.user.id;
  const { wordId } = req.params;

  try {
    const [rows] = await pool.query(`
      SELECT 1 FROM favorite_words WHERE user_id = ? AND word_id = ?
    `, [userId, wordId]);

    res.status(200).json({ isFavorite: rows.length > 0 });
  } catch (error) {
    res.status(500).json({ message: getMessage("errorFetching", req.user.language || 'sv'), error: error.message });
  }
};
