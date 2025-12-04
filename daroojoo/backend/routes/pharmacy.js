const express = require("express");
const router = express.Router();

module.exports = (readDB, writeDB) => {
  // ثبت نام داروخانه
  router.post("/signup", async (req, res) => {
    const { name, city, phone, manager, username, password } = req.body;
    if (!name || !username || !password)
      return res.status(400).json({ error: "Missing fields" });

    const db = await readDB();
    if (db.pharmacies.find((p) => p.username === username))
      return res.status(400).json({ error: "Username exists" });

    const newPharmacy = {
      id: Date.now().toString(),
      name,
      city,
      phone,
      manager,
      username,
      password,
      inventory: []
    };
    db.pharmacies.push(newPharmacy);
    await writeDB(db);
    res.json({ message: "Signup successful", pharmacy: newPharmacy });
  });

  // ورود داروخانه
  router.post("/login", async (req, res) => {
    const { username, password } = req.body;
    const db = await readDB();
    const ph = db.pharmacies.find(
      (p) => p.username === username && p.password === password
    );
    if (!ph) return res.status(401).json({ error: "Invalid credentials" });
    res.json({ message: "Login successful", pharmacy: ph });
  });

  // افزودن یا حذف دارو از موجودی
  router.post("/inventory/add", async (req, res) => {
    const { pharmacyId, code } = req.body;
    const db = await readDB();
    const ph = db.pharmacies.find((p) => p.id === pharmacyId);
    if (!ph) return res.status(404).json({ error: "Pharmacy not found" });
    if (!ph.inventory.includes(code)) ph.inventory.push(code);
    await writeDB(db);
    res.json({ message: "Added", inventory: ph.inventory });
  });

  router.post("/inventory/remove", async (req, res) => {
    const { pharmacyId, code } = req.body;
    const db = await readDB();
    const ph = db.pharmacies.find((p) => p.id === pharmacyId);
    if (!ph) return res.status(404).json({ error: "Pharmacy not found" });
    ph.inventory = ph.inventory.filter((c) => c !== code);
    await writeDB(db);
    res.json({ message: "Removed", inventory: ph.inventory });
  });

  return router;
};
