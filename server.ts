import express from "express";
import { createServer as createViteServer } from "vite";
import Database from "better-sqlite3";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const db = new Database("donors.db");

// Initialize database
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

// Seed database if empty
const count = db.prepare("SELECT COUNT(*) as count FROM donors").get() as { count: number };
if (count.count === 0) {
  const mockDonors = [
    {
      id: '1',
      name: 'আরিফ হোসেন',
      bloodGroup: 'A+',
      location: 'ঢাকা, বাংলাদেশ',
      phone: '01712345678',
      lastDonated: '৩ মাস আগে',
      image: 'https://picsum.photos/seed/donor1/400/400',
      available: 1,
      facebookUrl: 'https://facebook.com',
      whatsappNumber: '01712345678',
    },
    {
      id: '2',
      name: 'তানজিলা আক্তার',
      bloodGroup: 'O+',
      location: 'চট্টগ্রাম, বাংলাদেশ',
      phone: '01812345678',
      lastDonated: '৫ মাস আগে',
      image: 'https://picsum.photos/seed/donor2/400/400',
      available: 1,
      whatsappNumber: '01812345678',
    },
    {
      id: '3',
      name: 'রাকিবুল ইসলাম',
      bloodGroup: 'B+',
      location: 'সিলেট, বাংলাদেশ',
      phone: '01912345678',
      lastDonated: '১ মাস আগে',
      image: 'https://picsum.photos/seed/donor3/400/400',
      available: 0,
    },
    {
      id: '4',
      name: 'সুমাইয়া বিনতে',
      bloodGroup: 'AB+',
      location: 'রাজশাহী, বাংলাদেশ',
      phone: '01612345678',
      lastDonated: '৬ মাস আগে',
      image: 'https://picsum.photos/seed/donor4/400/400',
      available: 1,
    },
    {
      id: '5',
      name: 'মেহেদী হাসান',
      bloodGroup: 'O-',
      location: 'খুলনা, বাংলাদেশ',
      phone: '01512345678',
      lastDonated: '২ মাস আগে',
      image: 'https://picsum.photos/seed/donor5/400/400',
      available: 1,
    },
    {
      id: '6',
      name: 'ফাতেমা তুজ জোহরা',
      bloodGroup: 'A-',
      location: 'বরিশাল, বাংলাদেশ',
      phone: '01312345678',
      lastDonated: '৪ মাস আগে',
      image: 'https://picsum.photos/seed/donor6/400/400',
      available: 1,
    },
  ];

  const insert = db.prepare(`
    INSERT INTO donors (id, name, bloodGroup, location, phone, lastDonated, image, available, facebookUrl, whatsappNumber)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);

  for (const d of mockDonors) {
    insert.run(d.id, d.name, d.bloodGroup, d.location, d.phone, d.lastDonated, d.image, d.available, d.facebookUrl || null, d.whatsappNumber || null);
  }
}

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json());

  // API Routes
  app.get("/api/donors", (req, res) => {
    const donors = db.prepare("SELECT * FROM donors").all();
    res.json(donors.map(d => ({ ...d, available: Boolean(d.available) })));
  });

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

  app.delete("/api/donors/:id", (req, res) => {
    const { id } = req.params;
    db.prepare("DELETE FROM donors WHERE id = ?").run(id);
    res.status(204).send();
  });

  // Vite middleware for development
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
