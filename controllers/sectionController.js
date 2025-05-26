//Importerar databas och språkhantering
const pool = require("../config/db");
const { getMessage } = require("../helpers/languageHelper");

// Skapa en ny kategori
exports.createCategory = async (req, res) => {
  const { name } = req.body;
  const lang = req.user.language || 'sv';

  // Kontrollera att namn finns med i anropet
  if (!name) return res.status(400).json({ message: getMessage("categoryNameRequired", lang) });

  try {
    // Kolla om kategori redan finns för att undvika dubbletter
    const [existing] = await pool.query("SELECT * FROM categories WHERE name = ?", [name]);
    if (existing.length > 0) return res.status(409).json({ message: getMessage("categoryExists", lang) });

    // Lägg till ny kategori i databasen
    await pool.query("INSERT INTO categories (name) VALUES (?)", [name]);
    res.status(201).json({ message: getMessage("categoryAdded", lang) });
  } catch (error) {
    res.status(500).json({ message: getMessage("errorSaving", lang) });
  }
};

//Hämta alla kategorier
exports.getCategories = async (req, res) => {
  const lang = req.user.language || 'sv';
  try {
    // Hämtar alla rader från tabellen 'categories'
    const [rows] = await pool.query("SELECT * FROM categories");
    res.status(200).json(rows);
  } catch (error) {
    res.status(500).json({ message: getMessage("errorFetching", lang) });
  }
};

//  Hämta en kategori baserat på id
exports.getCategoryById = async (req, res) => {
  const { id } = req.params;
  const lang = req.user.language || 'sv';
  try {
    // Slår upp kategorin på ID
    const [rows] = await pool.query("SELECT * FROM categories WHERE id = ?", [id]);
    if (rows.length === 0) return res.status(404).json({ message: getMessage("categoryNotFound", lang) });

    res.status(200).json(rows[0]);
  } catch (error) {
    res.status(500).json({ message: getMessage("errorFetching", lang) });
  }
};

// Uppdatera kategori
exports.updateCategory = async (req, res) => {
  const { name } = req.body;
  const { id } = req.params;
  const lang = req.user.language || 'sv';

  try {
    // Uppdaterar kategorins namn baserat på ID
    await pool.query("UPDATE categories SET name = ? WHERE id = ?", [name, id]);
    res.status(200).json({ message: getMessage("categoryUpdated", lang) });
  } catch (error) {
    res.status(500).json({ message: getMessage("errorSaving", lang) });
  }
};

// Radera kategori
exports.deleteCategory = async (req, res) => {
  const { id } = req.params;
  const lang = req.user.language || 'sv';

  try {
    // Tar bort kategorin från databasen
    await pool.query("DELETE FROM categories WHERE id = ?", [id]);
    res.status(200).json({ message: getMessage("categoryDeleted", lang) });
  } catch (error) {
    res.status(500).json({ message: getMessage("errorSaving", lang) });
  }
};

// Skapa en sektion inom en kategori
exports.createSection = async (req, res) => {
  const { category_name, name, level } = req.body;
  const lang = req.user.language || 'sv';
 // Kontrollera att alla fält är ifyllda
  if (!category_name || !name || !level) {
    return res.status(400).json({ message: getMessage("sectionFieldsRequired", lang) });
  }

  try {
    // Hämta ID från kategori utifrån namn
    const [rows] = await pool.query("SELECT id FROM categories WHERE name = ?", [category_name]);
    if (rows.length === 0) return res.status(404).json({ message: getMessage("categoryNotFound", lang) });

    const category_id = rows[0].id;
    // Skapa sektionen
    await pool.query("INSERT INTO sections (category_id, name, level) VALUES (?, ?, ?)", [category_id, name, level]);
    res.status(201).json({ message: getMessage("sectionAdded", lang) });
  } catch (error) {
    res.status(500).json({ message: getMessage("errorSaving", lang) });
  }
};

// Hämta sektioner, kan filtreras på kategori och nivå
exports.getSections = async (req, res) => {
  const { categoryId, level } = req.query;

  let query = `
    SELECT sections.*, categories.name AS category_name
    FROM sections
    JOIN categories ON sections.category_id = categories.id
    WHERE 1
  `;
  const params = [];
// Lägg till villkor för kategori-id om det skickats
  if (categoryId) {
    query += " AND sections.category_id = ?";
    params.push(categoryId);
  }
// Lägg till villkor för nivå om det skickats
  if (level) {
    query += " AND sections.level = ?";
    params.push(level.toUpperCase());
  }

  try {
    const [rows] = await pool.query(query, params);
    res.status(200).json(rows);
  } catch (err) {
    res.status(500).json({ message: "Fel vid hämtning av sektioner", error: err.message });
  }
};

// Hämta en specifik sektion baserat på ID
exports.getSectionById = async (req, res) => {
  const { id } = req.params; // Hämtar sektionens ID från URL-parametrarna
  const lang = req.user.language || 'sv'; 

  try {
    // Hämtar sektionen och dess tillhörande kategori-namn genom att joina tabellerna sections och categories
    const [rows] = await pool.query(
      `SELECT sections.*, categories.name AS category_name
       FROM sections
       JOIN categories ON sections.category_id = categories.id
       WHERE sections.id = ?`,
      [id]
    );

    // Om inga resultat hittas, returnera 404 med felmeddelande
    if (rows.length === 0) {
      return res.status(404).json({ message: getMessage("sectionNotFound", lang) });
    }

    // Returnera sektionen inklusive kategori-namnet om den hittas
    res.status(200).json(rows[0]);
  } catch (error) {
    // Vid fel returnera 500 med generiskt felmeddelande
    res.status(500).json({ message: getMessage("errorFetching", lang), error: error.message });
  }
};

// Uppdatera sektion
exports.updateSection = async (req, res) => {
  const { name, level } = req.body;
  const { id } = req.params;
  const lang = req.user.language || 'sv';

  try {
    // Uppdaterar namn och nivå för den angivna sektionen
    await pool.query("UPDATE sections SET name = ?, level = ? WHERE id = ?", [name, level, id]);
    res.status(200).json({ message: getMessage("sectionUpdated", lang) });
  } catch (error) {
    // Returnerar ett felmeddelande vid misslyckad uppdatering
    res.status(500).json({ message: getMessage("errorSaving", lang) });
  }
};

//Radera sektion
exports.deleteSection = async (req, res) => {
  const { id } = req.params;
  const lang = req.user.language || 'sv';

  try {
    // Raderar sektionen från databasen
    await pool.query("DELETE FROM sections WHERE id = ?", [id]);
    res.status(200).json({ message: getMessage("sectionDeleted", lang) });
  } catch (error) {
    // Hantera eventuella fel
    res.status(500).json({ message: getMessage("errorSaving", lang) });
  }
};

//Hämta sektioner för en viss nivå - för användare
exports.getSectionsForUser = async (req, res) => {
  const level = req.query.level;

  try {
    
    let query = "SELECT * FROM sections";
    let params = [];
// Lägg till nivå-filter om det finns
    if (level) {
      query += " WHERE level = ?";
      params.push(level);
    }
   // Hämta sektionerna
    const [sections] = await pool.query(query, params);
    res.status(200).json(sections);
  } catch (err) {
    // Felhantering
    console.error("❌ Fel vid hämtning av sektioner:", err);
    res.status(500).json({ message: "Serverfel" });
  }
};

// Hämta sektioner kopplade till specifik kategori och nivå
exports.getSectionsByCategory = async (req, res) => {
  const { categoryId, level } = req.query;
// Kontrollera att både kategori-id och nivå är angivna
  if (!categoryId || !level) {
    return res.status(400).json({ message: "Både kategori-id och nivå krävs" });
  }

  try {
    // Hämta sektioner som matchar kategori och nivå
    const [rows] = await pool.query(
      "SELECT * FROM sections WHERE category_id = ? AND level = ?",
      [categoryId, level.toUpperCase()]
    );
    res.status(200).json(rows);
  } catch (error) {
    // Fel vid databashämtning
    console.error("Fel vid hämtning av sektioner:", error);
    res.status(500).json({ message: "Fel vid hämtning av sektioner" });
  }
};

