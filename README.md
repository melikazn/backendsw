
# 🇸🇪  Swedish For All – Backend

Detta är backenddelen av Swedish Learning App – en plattform för språkinlärning riktad till persisktalande som studerar svenska. Backend är byggd med Node.js, Express och MySQL.

---

## 🛠 Teknikstack

- **Node.js + Express** – API-server
- **MySQL** – Relationsdatabas
- **JWT** – Autentisering
- **Bcrypt** – Lösenordshantering
- **dotenv** – Miljövariabler
- **CORS** – Cross-origin support
- **Custom Middleware** – Skyddade routes, felhantering m.m.

---

## 📁 Projektstruktur

```bash
├── controllers/         # API-logik (users, vocabulary, tests, forum, etc.)
├── routes/              # Alla express-rutter
├── middleware/          # Autentisering, errors
├── config/              # Databasinställninga
├── helpers/             # Hjälpfunktioner 
├── uploads/             # Uppladdade filer (video, bilder)
├── vocab_json/          # Importfiler för ordförråd
├── .env                 # Miljövariabler
├── index.js             # Entry point
```

---

## ▶️ Starta projektet

```bash
# Installera beroenden
npm install

# Starta servern
node index
```

Backend körs då på `http://localhost:5050`.

---

## 🧪 API-funktionalitet

- ✅ CRUD för ordförråd, tester, användare, videor, meddelanden, forum
- ✅ JWT-baserad autentisering
- ✅ Skyddade routes för admin och användare
- ✅ Notifikationssystem och globala meddelanden
- ✅ Tidsmätning för tester, nivåprogression m.m.

---

## 🗃 Databas

Projektet använder en relationsdatabas (MySQL). Tabeller inkluderar bl.a.:

- `users`, `tests`, `test_results`
- `questions`, `answers`
- `vocabulary`
- `videos`, `categories`, `sections`
- `forum_posts`, `messages`, `notifications`


---

## 🧾 Import av ordförråd

```bash
node importVocabulary.js
```

Denna fil läser från `vocab_json/` och importerar ord till databasen.

---

## 🧑‍💻 Utvecklat av

Melika Zolfagharian  
Mittuniversitetet – Fullstackprojekt 2025
