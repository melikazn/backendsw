// Importera moduler
const pool = require("../config/db");
const fs = require("fs");
const path = require("path");

//Ladda upp en ny video och koppla den till en sektion
exports.uploadVideo = async (req, res) => {
  const { sectionId, title, description } = req.body;
  const file = req.file;

  // Kontrollera att fil och nödvändiga fält finns
  if (!file) return res.status(400).json({ message: "Ingen videofil bifogad." });
  if (!sectionId || !title) return res.status(400).json({ message: "Titel och sektion krävs." });

  try {
    const filename = file.filename;

    // Spara video i databasen
    await pool.query(
      `INSERT INTO videos (section_id, title, description, filename)
       VALUES (?, ?, ?, ?)`,
      [sectionId, title, description || "", filename]
    );

    // Skapa full URL till filen
    const videoUrl = `${req.protocol}://${req.get("host")}/uploads/videos/${filename}`;
    res.status(201).json({ message: "Videon har laddats upp", video_url: videoUrl });
  } catch (err) {
    console.error("❌ Fel vid videouppladdning:", err);
    res.status(500).json({ message: "Serverfel", error: err.message });
  }
};

// Hämta alla videor med sektion- och nivåinformation
exports.getAllVideos = async (req, res) => {
  try {
    const [videos] = await pool.query(`
      SELECT v.id, v.title, v.description, v.filename, v.uploaded_at, s.name AS section_name, s.level
      FROM videos v
      JOIN sections s ON v.section_id = s.id
      ORDER BY v.uploaded_at DESC
    `);

    const baseUrl = `${req.protocol}://${req.get("host")}`;
    const videosWithUrl = videos.map(v => ({
      ...v,
      video_url: `${baseUrl}/uploads/videos/${v.filename}`
    }));

    res.status(200).json(videosWithUrl);
  } catch (err) {
    console.error("❌ Fel vid hämtning av videor:", err);
    res.status(500).json({ message: "Kunde inte hämta videor." });
  }
};

// Uppdatera titel och beskrivning för en video
exports.updateVideo = async (req, res) => {
  const { id } = req.params;
  const { title, description } = req.body;

  if (!title) return res.status(400).json({ message: "Titel krävs." });

  try {
    await pool.query(
      `UPDATE videos SET title = ?, description = ? WHERE id = ?`,
      [title, description || "", id]
    );
    res.status(200).json({ message: "Videon har uppdaterats." });
  } catch (err) {
    console.error("❌ Fel vid uppdatering av video:", err);
    res.status(500).json({ message: "Serverfel", error: err.message });
  }
};

// Radera video från databas och filsystem
exports.deleteVideo = async (req, res) => {
  const { id } = req.params;

  try {
    // Hämta filnamn från databasen
    const [[video]] = await pool.query("SELECT filename FROM videos WHERE id = ?", [id]);

    if (!video) {
      return res.status(404).json({ message: "Videon hittades inte." });
    }

    const filePath = path.join(__dirname, "..", "uploads", "videos", video.filename);

    // Ta bort videofilen från filsystemet
    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
    }

    // Ta bort video från databasen
    await pool.query("DELETE FROM videos WHERE id = ?", [id]);

    res.status(200).json({ message: "Videon har raderats." });
  } catch (err) {
    console.error("❌ Fel vid borttagning av video:", err);
    res.status(500).json({ message: "Serverfel", error: err.message });
  }
};

// Hämta alla videor för en viss sektion
exports.getVideosBySectionId = async (req, res) => {
  const sectionId = req.params.id;

  try {
    const [videos] = await pool.query(`
      SELECT v.id, v.title, v.description, v.filename, v.uploaded_at, s.name AS section_name, s.level
      FROM videos v
      JOIN sections s ON v.section_id = s.id
      WHERE v.section_id = ?
      ORDER BY v.uploaded_at DESC
    `, [sectionId]);

    const baseUrl = `${req.protocol}://${req.get("host")}`;
    const videosWithUrl = videos.map(v => ({
      ...v,
      video_url: `${baseUrl}/uploads/videos/${v.filename}`
    }));

    res.status(200).json(videosWithUrl);
  } catch (err) {
    console.error("❌ Fel vid hämtning av sektionens videor:", err);
    res.status(500).json({ message: "Kunde inte hämta videor för sektionen." });
  }
};

// Hämta videor baserat på sektion
exports.getVideosBySection = async (req, res) => {
  const sectionId = req.query.sectionId;

  if (!sectionId) {
    return res.status(400).json({ message: "Sektionens ID krävs" });
  }

  try {
    // Hämta videor och deras sektion-info
    const [videos] = await pool.query(
      `SELECT v.*, s.name AS section_name, s.level
       FROM videos v
       JOIN sections s ON v.section_id = s.id
       WHERE v.section_id = ?`,
      [sectionId]
    );

    // Bygg fullständig URL till varje video
    const baseUrl = `${req.protocol}://${req.get("host")}`;
    const formatted = videos.map(v => ({
      ...v,
      video_url: `${baseUrl}/uploads/videos/${v.filename}`
    }));

    res.status(200).json(formatted);
  } catch (err) {
    console.error("❌ Fel vid hämtning av videor för sektionen:", err);
    res.status(500).json({ message: "Kunde inte hämta videor", error: err.message });
  }
};
// Hämta alla videor för en viss nivå
exports.getVideosByLevel = async (req, res) => {
  const level = req.params.level;

  try {
    const [videos] = await pool.query(`
      SELECT v.*, s.name AS section_name, s.level
      FROM videos v
      JOIN sections s ON v.section_id = s.id
      WHERE s.level = ?
      ORDER BY v.uploaded_at DESC
    `, [level]);

    const baseUrl = `${req.protocol}://${req.get("host")}`;
    const formatted = videos.map(v => ({
      ...v,
      video_url: `${baseUrl}/uploads/videos/${v.filename}`
    }));

    res.status(200).json(formatted);
  } catch (err) {
    console.error("❌ Fel vid hämtning av videor per nivå:", err);
    res.status(500).json({ message: "Kunde inte hämta videor för vald nivå." });
  }
};
