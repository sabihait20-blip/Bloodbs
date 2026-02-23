import express from "express";
import { createServer as createViteServer } from "vite";
import Database from "better-sqlite3";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// ডাটাবেস ফাইল তৈরি (এটি সব তথ্য সেভ করে রাখবে)
const db = new Database("donors.db");

// টেবিল তৈরি যদি না থাকে
db.exec(`
  CREATE TABLE IF NOT EXISTS donors (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    bloodGroup TEXT NOT NULL,
    location TEXT NOT NULL,
    phone TEXT NOT NULL,
    lastDonated TEXT NOT NULL,
    image TEXT NOT NULL,
    available INTEGER NOT NULL,
    facebookUrl TEXT,
    whatsappNumber TEXT
  )
`);

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json());

  // দাতা তালিকা পাওয়ার API
  app.get("/api/donors", (req, res) => {
    const donors = db.prepare("SELECT * FROM donors").all();
    res.json(donors.map(d => ({ ...d, available: Boolean(d.available) })));
  });

  // নতুন দাতা যোগ করার API
  app.post("/api/donors", (req, res) => {
    const donor = req.body;
    const stmt = db.prepare(`
      INSERT INTO donors (id, name, bloodGroup, location, phone, lastDonated, image, available, facebookUrl, whatsappNumber)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);
    stmt.run(
      donor.id,
      donor.name,
      donor.bloodGroup,
      donor.location,
      donor.phone,
      donor.lastDonated,
      donor.image,
      donor.available ? 1 : 0,
      donor.facebookUrl || null,
      donor.whatsappNumber || null
    );
    res.status(201).json(donor);
  });

  // তথ্য এডিট করার API
  app.put("/api/donors/:id", (req, res) => {
    const { id } = req.params;
    const donor = req.body;
    const stmt = db.prepare(`
      UPDATE donors 
      SET name = ?, bloodGroup = ?, location = ?, phone = ?, lastDonated = ?, image = ?, available = ?, facebookUrl = ?, whatsappNumber = ?
      WHERE id = ?
    `);
    stmt.run(
      donor.name,
      donor.bloodGroup,
      donor.location,
      donor.phone,
      donor.lastDonated,
      donor.image,
      donor.available ? 1 : 0,
      donor.facebookUrl || null,
      donor.whatsappNumber || null,
      id
    );
    res.json(donor);
  });

  // তথ্য ডিলিট করার API
  app.delete("/api/donors/:id", (req, res) => {
    const { id } = req.params;
    db.prepare("DELETE FROM donors WHERE id = ?").run(id);
    res.status(204).send();
  });

  // ডেভেলপমেন্ট মোডে Vite চালানো
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    app.use(express.static(path.join(__dirname, "dist")));
    app.get("*", (req, res) => {
      res.sendFile(path.join(__dirname, "dist", "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
