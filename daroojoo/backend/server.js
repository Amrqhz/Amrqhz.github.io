const express = require("express");
const cors = require("cors");
const fs = require("fs-extra");
const path = require("path");

const app = express();
app.use(cors());
app.use(express.json());

// مسیر فایل دیتابیس
const dbPath = path.join(__dirname, "db.json");

// تابع کمکی برای خواندن و نوشتن در فایل db.json
async function readDB() {
  const data = await fs.readFile(dbPath, "utf8");
  return JSON.parse(data);
}
async function writeDB(data) {
  await fs.writeFile(dbPath, JSON.stringify(data, null, 2));
}

// مسیرهای اصلی
const patientRouter = require("./routes/patient")(readDB, writeDB);
const pharmacyRouter = require("./routes/pharmacy")(readDB, writeDB);
const prescriptionRouter = require("./routes/prescription")(readDB, writeDB);

app.use("/api/patient", patientRouter);
app.use("/api/pharmacy", pharmacyRouter);
app.use("/api/prescription", prescriptionRouter);

// سرو frontend برای تست
app.use("/", express.static(path.join(__dirname, "../frontend")));

const PORT = 3000;
app.listen(PORT, () => console.log(`✅ Server running on http://localhost:${PORT}`));
