const express = require("express");
const Booking = require("../models/Booking");
const Car = require("../models/Car");

const router = express.Router();

router.get("/", async (req, res) => {
  try {
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
