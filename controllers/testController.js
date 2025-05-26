//Importera databasanslutning och språkmeddelande-hanterare
const pool = require("../config/db");
const { getMessage } = require("../helpers/languageHelper");

// Skapa ett nytt test kopplat till en sektion
exports.createTest = async (req, res) => {
  const { section_id, title } = req.body;
  const lang = req.user.language || 'sv';

  // Validera att båda fälten är ifyllda
  if (!section_id || !title) {
    return res.status(400).json({ message: getMessage("sectionIdTitleRequired", lang) });
  }

  try {
    // Lägg till test i databasen
    const [result] = await pool.query(
      "INSERT INTO tests (section_id, title) VALUES (?, ?)",
      [section_id, title]
    );

    const insertedId = result.insertId;

    res.status(201).json({
      message: getMessage("testAdded", lang),
      id: insertedId
    });
  } catch (error) {
    // Returnera felmeddelande vid misslyckad lagring
    res.status(500).json({ message: getMessage("errorSavingTest", lang), error: error.message });
  }
};

//Sök efter test med matchande titel
exports.searchTests = async (req, res) => {
  const search = req.query.search || "";
  const searchQuery = `%${search}%`;
  const lang = req.user.language || 'sv';

  try {
    // Hämta tester som innehåller söktermen i titeln
    const [tests] = await pool.query(`
      SELECT id, title, section_id
      FROM tests
      WHERE title LIKE ?
      ORDER BY id DESC
    `, [searchQuery]);

    res.status(200).json(tests);
  } catch (error) {
    res.status(500).json({ message: getMessage("errorSearchingTests", lang), error: error.message });
  }
};

// Hämta alla tester kopplade till en viss sektion
exports.getTestsBySectionId = async (req, res) => {
  const { id } = req.params;
  const lang = req.user.language || 'sv';

  try {
    // Hämta alla tester för given sektion, sorterat nyast först
    const [tests] = await pool.query(
      "SELECT id, title, total_questions FROM tests WHERE section_id = ? ORDER BY id DESC",
      [id]
    );

    res.status(200).json(tests);
  } catch (error) {
    res.status(500).json({
      message: getMessage("errorFetching", lang),
      error: error.message
    });
  }
};

// Radera ett test från databasen
exports.deleteTest = async (req, res) => {
  const { id } = req.params;

  try {
    // Kör DELETE-fråga baserat på testets ID
    await pool.query("DELETE FROM tests WHERE id = ?", [id]);
    res.status(200).json({ message: "Test borttaget" });
  } catch (err) {
    res.status(500).json({ message: "Fel vid borttagning", error: err.message });
  }
};

// Uppdatera ett test (titel och nivå)
exports.updateTest = async (req, res) => {
  const { id } = req.params;
  const { title, level } = req.body;

  try {
    // Uppdaterar fälten title och level för angivet test
    const [result] = await pool.query(
      "UPDATE tests SET title = ?, level = ? WHERE id = ?",
      [title, level, id]
    );

    res.status(200).json({ message: "Test uppdaterat" });
  } catch (error) {
    res.status(500).json({ message: "Kunde inte uppdatera testet", error: error.message });
  }
};
