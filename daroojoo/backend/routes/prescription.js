const express = require("express");
const router = express.Router();

module.exports = (readDB, writeDB) => {
  // ایجاد نسخه جدید توسط بیمار
  router.post("/create", async (req, res) => {
    const { patientId, code, idNumber, insurance } = req.body;
    const db = await readDB();
    const patient = db.patients.find((p) => p.id === patientId);
    if (!patient) return res.status(404).json({ error: "Patient not found" });

    const newPres = {
      id: Date.now().toString(),
      code,
      idNumber,
      insurance,
      patientId,
      status: "pending",
      matchedPharmacy: null,
      payment: false
    };
    db.prescriptions.push(newPres);
    await writeDB(db);
    res.json({ message: "Prescription created", prescription: newPres });
  });

  // دریافت همه نسخه‌ها
  router.get("/", async (req, res) => {
    const db = await readDB();
    res.json(db.prescriptions);
  });

  // داروخانه پذیرش نسخه
  router.post("/accept", async (req, res) => {
    const { presId, pharmacyId } = req.body;
    const db = await readDB();
    const pres = db.prescriptions.find((p) => p.id === presId);
    if (!pres) return res.status(404).json({ error: "Not found" });
    pres.status = "accepted";
    pres.matchedPharmacy = pharmacyId;
    await writeDB(db);
    res.json({ message: "Prescription accepted", prescription: pres });
  });

  // پرداخت و آماده‌سازی نسخه
  router.post("/pay", async (req, res) => {
    const { presId } = req.body;
    const db = await readDB();
    const pres = db.prescriptions.find((p) => p.id === presId);
    if (!pres) return res.status(404).json({ error: "Not found" });
    pres.status = "paid";
    pres.payment = true;
    await writeDB(db);
    res.json({ message: "Payment done", prescription: pres });
  });

  router.post("/ready", async (req, res) => {
    const { presId } = req.body;
    const db = await readDB();
    const pres = db.prescriptions.find((p) => p.id === presId);
    if (!pres) return res.status(404).json({ error: "Not found" });
    pres.status = "ready";
    await writeDB(db);
    res.json({ message: "Prescription ready", prescription: pres });
  });

  return router;
};
