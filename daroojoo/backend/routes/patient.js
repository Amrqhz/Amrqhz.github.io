const express = require("express");
const router = express.Router();

module.exports = (readDB, writeDB) => {
  // ثبت نام بیمار
  router.post("/signup", async (req, res) => {
    const { name, phone, city, password } = req.body;
    if (!name || !phone || !password)
      return res.status(400).json({ error: "Missing fields" });

    const db = await readDB();
    if (db.patients.find((p) => p.phone === phone))
      return res.status(400).json({ error: "Phone already registered" });

    const newPatient = { id: Date.now().toString(), name, phone, city, password };
    db.patients.push(newPatient);
    await writeDB(db);
    res.json({ message: "Signup successful", patient: newPatient });
  });

  // ورود بیمار
  router.post("/login", async (req, res) => {
    const { phone, password } = req.body;
    const db = await readDB();
    const user = db.patients.find(
      (p) => p.phone === phone && p.password === password
    );
    if (!user) return res.status(401).json({ error: "Invalid credentials" });
    res.json({ message: "Login successful", patient: user });
  });

  module.exports = router;
  return router;
};
