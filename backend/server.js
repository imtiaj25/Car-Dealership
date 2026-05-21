const path = require("path");
const express = require("express");
const cors = require("cors");
const dotenv = require("dotenv");
const mongoose = require("mongoose");

const Car = require("./models/Car");
const sampleCars = require("./data/sampleCars");
const carRoutes = require("./routes/cars");
const bookingRoutes = require("./routes/bookings");

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;
const MONGODB_URI =
  process.env.MONGODB_URI || "mongodb://127.0.0.1:27017/luxedrive_dealership";

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Uploaded vehicle photos are served from this public folder.
app.use("/uploads", express.static(path.join(__dirname, "public", "uploads")));

app.use("/api/cars", carRoutes);
app.use("/api/bookings", bookingRoutes);

// Serve the frontend from the backend so beginners only need one local server.
const frontendPath = path.join(__dirname, "..", "frontend");
app.use(express.static(frontendPath));

app.get("*", (req, res) => {
  res.sendFile(path.join(frontendPath, "index.html"));
});

async function seedCars() {
  const carCount = await Car.countDocuments();

  if (carCount === 0) {
    await Car.insertMany(sampleCars);
    console.log("Sample cars added to MongoDB.");
  }
}

async function startServer() {
  try {
    await mongoose.connect(MONGODB_URI);
    console.log("Connected to MongoDB.");

    await seedCars();

    app.listen(PORT, () => {
      console.log(`LuxeDrive running at http://localhost:${PORT}`);
    });
  } catch (error) {
    console.error("Server startup failed:", error.message);
    process.exit(1);
  }
}

startServer();
