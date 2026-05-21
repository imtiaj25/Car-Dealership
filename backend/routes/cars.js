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

function sortCars(cars, sort) {
  const sortedCars = [...cars];

  if (sort === "price-low") {
    return sortedCars.sort((a, b) => Number(a.price) - Number(b.price));
  }

  if (sort === "price-high") {
    return sortedCars.sort((a, b) => Number(b.price) - Number(a.price));
  }

  if (sort === "year") {
    return sortedCars.sort((a, b) => Number(b.year) - Number(a.year));
  }

  return sortedCars.reverse();
}

function filterMemoryCars(cars, filters) {
  const { minPrice, maxPrice, category, brand, model, search, sort = "newest" } = filters;

  const filteredCars = cars.filter((car) => {
    const price = Number(car.price);
    const searchableText = `${car.brand} ${car.model} ${car.category} ${car.condition} ${car.fuelType}`.toLowerCase();

    if (minPrice && price < Number(minPrice)) return false;
    if (maxPrice && price > Number(maxPrice)) return false;
    if (category && ![car.category, car.condition].includes(category)) return false;
    if (brand && car.brand.toLowerCase() !== brand.toLowerCase()) return false;
    if (model && !car.model.toLowerCase().includes(model.toLowerCase())) return false;
    if (search && !searchableText.includes(search.toLowerCase())) return false;

    return true;
  });

  return sortCars(filteredCars, sort);
}

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

    if (!req.app.locals.useDatabase) {
      return res.json(filterMemoryCars(req.app.locals.memoryCars, req.query));
    }

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

    const carData = {
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
    };

    if (!req.app.locals.useDatabase) {
      const car = {
        ...carData,
        _id: `local-${Date.now()}`,
        createdAt: new Date().toISOString()
      };
      req.app.locals.memoryCars.unshift(car);
      return res.status(201).json(car);
    }

    const car = await Car.create(carData);

    res.status(201).json(car);
  } catch (error) {
    res.status(400).json({ message: "Unable to add car.", error: error.message });
  }
});

router.delete("/:id", async (req, res) => {
  try {
    if (!req.app.locals.useDatabase) {
      const beforeCount = req.app.locals.memoryCars.length;
      req.app.locals.memoryCars = req.app.locals.memoryCars.filter((car) => car._id !== req.params.id);

      if (beforeCount === req.app.locals.memoryCars.length) {
        return res.status(404).json({ message: "Car not found." });
      }

      return res.json({ message: "Car deleted successfully." });
    }

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
