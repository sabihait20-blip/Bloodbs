import express from "express";
import { createServer as createViteServer } from "vite";
import Database from "better-sqlite3";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// ডাটাবেস ফাইল তৈরি (এটি সব তথ্য সেভ করে রাখবে)
let dbPath = process.env.DATABASE_PATH || path.join(process.cwd(), "donors.db");
if (!path.isAbsolute(dbPath)) {
  dbPath = path.resolve(process.cwd(), dbPath);
}
const dbDir = path.dirname(dbPath);

// Ensure directory exists
import fs from 'fs';
if (!fs.existsSync(dbDir)) {
  fs.mkdirSync(dbDir, { recursive: true });
}

const db = new Database(dbPath);

console.log(`Database initialized at: ${dbPath}`);

// টেবিল তৈরি যদি না থাকে
db.exec(`
  CREATE TABLE IF NOT EXISTS users (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    email TEXT UNIQUE NOT NULL,
    password TEXT NOT NULL
  )
`);

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
    whatsappNumber TEXT,
    userId TEXT,
    FOREIGN KEY(userId) REFERENCES users(id)
  )
`);

async function startServer() {
  const app = express();
  const PORT = Number(process.env.PORT) || 3000;

  app.use(express.json());

  // Health check
  app.get("/api/health", (req, res) => {
    res.json({ 
      status: "ok", 
      env: process.env.NODE_ENV,
      dbPath: dbPath
    });
  });

  // --- Auth API ---
  app.post("/api/auth/register", (req, res) => {
    const { 
      name, email, password, 
      bloodGroup, location, phone, 
      lastDonated, image, facebookUrl, whatsappNumber 
    } = req.body;
    
    if (!email || !password || !name) {
      return res.status(400).json({ error: "Name, email and password are required" });
    }

    const userId = Math.random().toString(36).substr(2, 9);
    const donorId = Math.random().toString(36).substr(2, 9);
    
    try {
      const dbTransaction = db.transaction(() => {
        // Create User
        const userStmt = db.prepare("INSERT INTO users (id, name, email, password) VALUES (?, ?, ?, ?)");
        userStmt.run(userId, name, email, password);

        // Create Donor Profile
        const donorStmt = db.prepare(`
          INSERT INTO donors (id, name, bloodGroup, location, phone, lastDonated, image, available, facebookUrl, whatsappNumber, userId)
          VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `);
        donorStmt.run(
          donorId,
          name,
          bloodGroup,
          location,
          phone,
          lastDonated,
          image || `https://picsum.photos/seed/${userId}/400/400`,
          1, // available by default
          facebookUrl || null,
          whatsappNumber || null,
          userId
        );
      });

      dbTransaction();
      res.status(201).json({ id: userId, name, email });
    } catch (error: any) {
      console.error('Registration error:', error);
      res.status(400).json({ error: error.message || "Email already exists or invalid data" });
    }
  });

  app.post("/api/auth/login", (req, res) => {
    try {
      const { email, password } = req.body;
      const user = db.prepare("SELECT * FROM users WHERE email = ? AND password = ?").get(email, password) as any;
      if (user) {
        res.json({ id: user.id, name: user.name, email: user.email });
      } else {
        res.status(401).json({ error: "ইমেইল বা পাসওয়ার্ড ভুল!" });
      }
    } catch (error) {
      console.error('Login error:', error);
      res.status(500).json({ error: "সার্ভারে সমস্যা হয়েছে" });
    }
  });

  app.post("/api/auth/forgot-password", (req, res) => {
    const { email, newPassword } = req.body;
    try {
      const user = db.prepare("SELECT id FROM users WHERE email = ?").get(email) as any;
      if (user) {
        db.prepare("UPDATE users SET password = ? WHERE email = ?").run(newPassword, email);
        res.json({ message: "পাসওয়ার্ড সফলভাবে পরিবর্তন করা হয়েছে" });
      } else {
        res.status(404).json({ error: "এই ইমেইল দিয়ে কোনো অ্যাকাউন্ট পাওয়া যায়নি" });
      }
    } catch (error) {
      res.status(500).json({ error: "পাসওয়ার্ড রিসেট করতে সমস্যা হয়েছে" });
    }
  });

  app.put("/api/auth/profile", (req, res) => {
    const { userId, name, email, password } = req.body;
    try {
      if (password) {
        db.prepare("UPDATE users SET name = ?, email = ?, password = ? WHERE id = ?").run(name, email, password, userId);
      } else {
        db.prepare("UPDATE users SET name = ?, email = ? WHERE id = ?").run(name, email, userId);
      }
      
      // Update donor name too
      db.prepare("UPDATE donors SET name = ? WHERE userId = ?").run(name, userId);
      
      res.json({ id: userId, name, email });
    } catch (error) {
      res.status(500).json({ error: "প্রোফাইল আপডেট করতে সমস্যা হয়েছে" });
    }
  });

  // --- Donor API ---
  app.get("/api/donors", (req, res) => {
    const donors = db.prepare("SELECT * FROM donors").all();
    res.json(donors.map(d => ({ ...d, available: Boolean(d.available) })));
  });

  app.post("/api/donors", (req, res) => {
    const donor = req.body;
    const stmt = db.prepare(`
      INSERT INTO donors (id, name, bloodGroup, location, phone, lastDonated, image, available, facebookUrl, whatsappNumber, userId)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
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
      donor.whatsappNumber || null,
      donor.userId || null
    );
    res.status(201).json(donor);
  });

  app.put("/api/donors/:id", (req, res) => {
    const { id } = req.params;
    const donor = req.body;
    
    // Check ownership if userId is provided
    if (donor.userId) {
      const existing = db.prepare("SELECT userId FROM donors WHERE id = ?").get(id) as any;
      if (existing && existing.userId && existing.userId !== donor.userId) {
        return res.status(403).json({ error: "Unauthorized" });
      }
    }

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
