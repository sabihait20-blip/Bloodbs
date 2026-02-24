import express from "express";
import { createServer as createViteServer } from "vite";
import Database from "better-sqlite3";
import path from "path";
import { fileURLToPath } from "url";
import { WebSocketServer, WebSocket } from "ws";
import { createServer } from "http";

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

// Clear existing data for a fresh start (as requested)
// db.prepare("DELETE FROM donors").run(); 
// db.prepare("DELETE FROM users").run();

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
    donationCount INTEGER DEFAULT 0,
    userId TEXT,
    FOREIGN KEY(userId) REFERENCES users(id)
  )
`);

db.exec(`
  CREATE TABLE IF NOT EXISTS requests (
    id TEXT PRIMARY KEY,
    requesterName TEXT NOT NULL,
    bloodGroup TEXT NOT NULL,
    location TEXT NOT NULL,
    phone TEXT NOT NULL,
    status TEXT DEFAULT 'pending',
    createdAt DATETIME DEFAULT CURRENT_TIMESTAMP
  )
`);

db.exec(`
  CREATE TABLE IF NOT EXISTS donations (
    id TEXT PRIMARY KEY,
    donorId TEXT NOT NULL,
    donatedAt DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY(donorId) REFERENCES donors(id)
  )
`);

async function startServer() {
  const app = express();
  const httpServer = createServer(app);
  const wss = new WebSocketServer({ server: httpServer });
  const PORT = Number(process.env.PORT) || 3000;

  // WebSocket broadcast helper
  const broadcast = (data: any) => {
    wss.clients.forEach((client) => {
      if (client.readyState === WebSocket.OPEN) {
        client.send(JSON.stringify(data));
      }
    });
  };

  app.use(express.json({ limit: '10mb' }));

  // Health check
  app.get("/api/health", (req, res) => {
    res.json({ 
      status: "ok", 
      env: process.env.NODE_ENV,
      dbPath: dbPath
    });
  });

  // Stats API
  app.get("/api/stats", (req, res) => {
    try {
      const totalDonors = db.prepare("SELECT COUNT(*) as count FROM donors").get() as any;
      const donationsCompleted = db.prepare("SELECT COUNT(*) as count FROM donations").get() as any;
      const urgentRequests = db.prepare("SELECT COUNT(*) as count FROM requests WHERE status = 'pending'").get() as any;
      const activeDistricts = db.prepare("SELECT COUNT(DISTINCT location) as count FROM donors").get() as any;

      res.json({
        totalDonors: totalDonors.count,
        donationsCompleted: donationsCompleted.count,
        urgentRequests: urgentRequests.count,
        activeDistricts: activeDistricts.count
      });
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch stats" });
    }
  });

  app.post("/api/requests", (req, res) => {
    const { requesterName, bloodGroup, location, phone } = req.body;
    if (!requesterName || !bloodGroup || !location || !phone) {
      return res.status(400).json({ error: "All fields are required" });
    }
    const id = Math.random().toString(36).substr(2, 9);
    try {
      db.prepare("INSERT INTO requests (id, requesterName, bloodGroup, location, phone) VALUES (?, ?, ?, ?, ?)").run(id, requesterName, bloodGroup, location, phone);
      
      const newRequest = { id, requesterName, bloodGroup, location, phone, status: 'pending' };
      broadcast({ type: 'NEW_REQUEST', payload: newRequest });
      
      res.status(201).json(newRequest);
    } catch (error) {
      res.status(500).json({ error: "Failed to create request" });
    }
  });

  app.get("/api/requests", (req, res) => {
    try {
      const requests = db.prepare("SELECT * FROM requests WHERE status = 'accepted' ORDER BY createdAt DESC").all();
      res.json(requests);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch requests" });
    }
  });

  app.put("/api/requests/:id", (req, res) => {
    const { id } = req.params;
    const { status } = req.body;
    
    if (!['accepted', 'rejected'].includes(status)) {
      return res.status(400).json({ error: "Invalid status" });
    }

    try {
      db.prepare("UPDATE requests SET status = ? WHERE id = ?").run(status, id);
      
      if (status === 'accepted') {
        const request = db.prepare("SELECT * FROM requests WHERE id = ?").get() as any;
        broadcast({ type: 'REQUEST_ACCEPTED', payload: request });
      }
      
      res.json({ success: true });
    } catch (error) {
      res.status(500).json({ error: "Failed to update request" });
    }
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

  app.post("/api/donors/log-donation", (req, res) => {
    const { donorId } = req.body;
    if (!donorId) return res.status(400).json({ error: "Donor ID is required" });

    try {
      const today = new Date().toLocaleDateString('bn-BD', { year: 'numeric', month: 'long', day: 'numeric' });
      db.prepare("UPDATE donors SET donationCount = donationCount + 1, lastDonated = ? WHERE id = ?").run(today, donorId);
      
      const updatedDonor = db.prepare("SELECT * FROM donors WHERE id = ?").get() as any;
      
      // Also log in donations table
      const donationId = Math.random().toString(36).substr(2, 9);
      db.prepare("INSERT INTO donations (id, donorId, donatedAt) VALUES (?, ?, CURRENT_TIMESTAMP)").run(donationId, donorId);

      res.json({ ...updatedDonor, available: Boolean(updatedDonor.available) });
    } catch (error) {
      res.status(500).json({ error: "Failed to log donation" });
    }
  });

  app.post("/api/donors", (req, res) => {
    const donor = req.body;
    const stmt = db.prepare(`
      INSERT INTO donors (id, name, bloodGroup, location, phone, lastDonated, image, available, facebookUrl, whatsappNumber, donationCount, userId)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
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
      donor.donationCount || 0,
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
      SET name = ?, bloodGroup = ?, location = ?, phone = ?, lastDonated = ?, image = ?, available = ?, facebookUrl = ?, whatsappNumber = ?, donationCount = ?
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
      donor.donationCount || 0,
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

  httpServer.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
