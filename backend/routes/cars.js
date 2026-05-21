const path = require("path");
const express = require("express");
const multer = require("multer");
const Car = require("../models/Car");

const router = express.Router();

function escapeRegex(value) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, path.join(__dirname, "..", "public", "uploads"));
  },
  filename: (req, file, cb) => {
    const uniqueName = `${Date.now()}-${file.originalname.replace(/\s+/g, "-")}`;
    cb(null, uniqueName);
  }
});

const upload = multer({
  storage,
  limits: {
    fileSize: 5 * 1024 * 1024
  },
  fileFilter: (req, file, cb) => {
    if (file.mimetype.startsWith("image/")) {
      cb(null, true);
      return;
    }

    cb(new Error("Only image uploads are allowed."));
  }
});

router.get("/", async (req, res) => {
  try {
    const {
      minPrice,
      maxPrice,
      category,
      brand,
      model,
      search,
      sort = "newest"
    } = req.query;

    const query = {};

    if (minPrice || maxPrice) {
      query.price = {};
      if (minPrice) query.price.$gte = Number(minPrice);
      if (maxPrice) query.price.$lte = Number(maxPrice);
    }

    if (category) {
      if (["New", "Used"].includes(category)) {
        query.condition = category;
      } else {
        query.category = category;
      }
    }

    if (brand) query.brand = new RegExp(`^${escapeRegex(brand)}$`, "i");
    if (model) query.model = new RegExp(escapeRegex(model), "i");

    if (search) {
      const searchPattern = new RegExp(search, "i");
      query.$or = [
        { brand: searchPattern },
        { model: searchPattern },
        { category: searchPattern },
        { fuelType: searchPattern }
      ];
    }

    const sortMap = {
      newest: { createdAt: -1 },
      "price-low": { price: 1 },
      "price-high": { price: -1 },
      year: { year: -1 }
    };

    const cars = await Car.find(query).sort(sortMap[sort] || sortMap.newest);
    res.json(cars);
  } catch (error) {
    res.status(500).json({ message: "Unable to fetch cars.", error: error.message });
  }
});

router.post("/", upload.single("image"), async (req, res) => {
  try {
    const image = req.file ? `/uploads/${req.file.filename}` : req.body.imageUrl;

    if (!image) {
      return res.status(400).json({ message: "Please upload an image or enter an image URL." });
    }

    const car = await Car.create({
      image,
      brand: req.body.brand,
      model: req.body.model,
      price: Number(req.body.price),
      year: Number(req.body.year),
      mileage: Number(req.body.mileage),
      fuelType: req.body.fuelType,
      condition: req.body.condition,
      category: req.body.category,
      description: req.body.description,
      sellerName: req.body.sellerName,
      sellerPhone: req.body.sellerPhone,
      sellerEmail: req.body.sellerEmail
    });

    res.status(201).json(car);
  } catch (error) {
    res.status(400).json({ message: "Unable to add car.", error: error.message });
  }
});

router.delete("/:id", async (req, res) => {
  try {
    const deletedCar = await Car.findByIdAndDelete(req.params.id);

    if (!deletedCar) {
      return res.status(404).json({ message: "Car not found." });
    }

    res.json({ message: "Car deleted successfully." });
  } catch (error) {
    res.status(500).json({ message: "Unable to delete car.", error: error.message });
  }
});

module.exports = router;
