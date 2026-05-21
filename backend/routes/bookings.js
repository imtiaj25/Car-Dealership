const express = require("express");
const fs = require("fs/promises");
const Booking = require("../models/Booking");
const Car = require("../models/Car");

const router = express.Router();

async function readJson(filePath, fallback) {
  try {
    return JSON.parse(await fs.readFile(filePath, "utf8"));
  } catch (error) {
    return fallback;
  }
}

async function writeJson(filePath, data) {
  await fs.writeFile(filePath, JSON.stringify(data, null, 2));
}

router.get("/", async (req, res) => {
  try {
    if (!req.app.locals.useDatabase) {
      const bookings = await readJson(req.app.locals.bookingsFile, req.app.locals.memoryBookings);
      req.app.locals.memoryBookings = bookings;
      return res.json(bookings);
    }

    const bookings = await Booking.find()
      .populate("car", "brand model image price")
      .sort({ createdAt: -1 });

    res.json(bookings);
  } catch (error) {
    res.status(500).json({ message: "Unable to fetch bookings.", error: error.message });
  }
});

router.post("/", async (req, res) => {
  try {
    if (!req.app.locals.useDatabase) {
      const cars = await readJson(req.app.locals.carsFile, req.app.locals.memoryCars);
      const bookings = await readJson(req.app.locals.bookingsFile, req.app.locals.memoryBookings);
      const selectedCar = cars.find((car) => car._id === req.body.car);

      if (!selectedCar) {
        return res.status(404).json({ message: "Selected car was not found." });
      }

      const booking = {
        _id: `booking-${Date.now()}`,
        name: req.body.name,
        phone: req.body.phone,
        email: req.body.email,
        car: selectedCar._id,
        carName: `${selectedCar.brand} ${selectedCar.model}`,
        preferredDate: req.body.preferredDate,
        createdAt: new Date().toISOString()
      };

      bookings.unshift(booking);
      req.app.locals.memoryBookings = bookings;
      await writeJson(req.app.locals.bookingsFile, bookings);
      return res.status(201).json(booking);
    }

    const selectedCar = await Car.findById(req.body.car);

    if (!selectedCar) {
      return res.status(404).json({ message: "Selected car was not found." });
    }

    const booking = await Booking.create({
      name: req.body.name,
      phone: req.body.phone,
      email: req.body.email,
      car: selectedCar._id,
      carName: `${selectedCar.brand} ${selectedCar.model}`,
      preferredDate: req.body.preferredDate
    });

    res.status(201).json(booking);
  } catch (error) {
    res.status(400).json({ message: "Unable to save booking.", error: error.message });
  }
});

module.exports = router;
