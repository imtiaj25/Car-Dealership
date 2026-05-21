const express = require("express");
const Booking = require("../models/Booking");
const Car = require("../models/Car");

const router = express.Router();

router.get("/", async (req, res) => {
  try {
    if (!req.app.locals.useDatabase) {
      return res.json(req.app.locals.memoryBookings);
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
      const selectedCar = req.app.locals.memoryCars.find((car) => car._id === req.body.car);

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

      req.app.locals.memoryBookings.unshift(booking);
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
