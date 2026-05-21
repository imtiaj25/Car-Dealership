const mongoose = require("mongoose");

const carSchema = new mongoose.Schema(
  {
    image: {
      type: String,
      required: true
    },
    brand: {
      type: String,
      required: true,
      trim: true
    },
    model: {
      type: String,
      required: true,
      trim: true
    },
    price: {
      type: Number,
      required: true,
      min: 0
    },
    year: {
      type: Number,
      required: true
    },
    mileage: {
      type: Number,
      required: true,
      min: 0
    },
    fuelType: {
      type: String,
      required: true,
      trim: true
    },
    condition: {
      type: String,
      enum: ["New", "Used"],
      required: true
    },
    category: {
      type: String,
      enum: ["Electric", "Family", "SUV", "Sports"],
      required: true
    },
    description: {
      type: String,
      default: ""
    },
    sellerName: {
      type: String,
      default: "LuxeDrive Sales"
    },
    sellerPhone: {
      type: String,
      default: "+1 (555) 812-4490"
    },
    sellerEmail: {
      type: String,
      default: "sales@luxedrive.example"
    }
  },
  {
    timestamps: true
  }
);

module.exports = mongoose.model("Car", carSchema);
