const mongoose = require("mongoose");

const subItemSchema = new mongoose.Schema({
  item: {
    type: String,
    required: [true, "Item name is required."],
    trim: true,
  },
  status: {
    type: String,
    enum: ["Good", "Needs Attention"],
    required: [true, "Status is required."],
    default: "Good",
  },
  description: {
    type: String,
    trim: true,
    default: "",
  },
});

const categorySchema = new mongoose.Schema({
  category: {
    type: String,
    required: [true, "Category name is required."],
    trim: true,
  },
  sub_items: [subItemSchema],
});

const truckInspectionSchema = new mongoose.Schema(
  {
    truck_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Truck",
      required: [true, "Truck ID is required."],
    },
    driver_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: [true, "Driver ID is required."],
    },
    oil_level: {
      type: String,
      required: [true, "Oil level is required."],
      trim: true,
    },
    inspection_categories: [categorySchema],
  },
  { timestamps: true }
);

const TruckInspection = mongoose.model(
  "TruckInspection",
  truckInspectionSchema
);

module.exports = TruckInspection;
