const mongoose = require("mongoose");

const subItemSchema = new mongoose.Schema({
  item: {
    type: String,
    required: [true, "Item name is required."],
    trim: true,
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

const inspectionTemplateSchema = new mongoose.Schema({
  categories: [categorySchema],
});

const InspectionTemplate = mongoose.model(
  "InspectionTemplate",
  inspectionTemplateSchema
);

module.exports = InspectionTemplate;
