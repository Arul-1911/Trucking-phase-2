const express = require("express");
const {
  createInspection,
  getInspectionsByTruck,
  getAllinsepctions,
  updateInspectionByTruck,
  deleteinsoectionByTruck,
  updateInspectionTemplate,
  editCategoryInTemplate,
  deleteCategoryFromTemplate,
  addSubItemToCategory,
  deleteSubItemFromCategory,
} = require("./truckMaintanence.controller");
const { auth, isAdmin } = require("../../middlewares/auth");

const router = express.Router();

// Global Category & Sub-Item Management Routes
router.put("/template", auth, isAdmin, updateInspectionTemplate); // Update global categories & sub-items
router.put("/template/category", auth, editCategoryInTemplate); // Edit a category name
router.delete("/template/category", auth, deleteCategoryFromTemplate); // Delete a category (removes sub-items too)
router.put("/template/category/subitem", auth, addSubItemToCategory); // Add a new sub-item to a category
router.delete("/template/category/subitem", auth, deleteSubItemFromCategory); // Delete a specific sub-item from a category

// Truck Inspection Routes
router.post("/", auth, createInspection); // Create a new truck inspection
router.get("/admin/all", auth, isAdmin, getAllinsepctions); // Get all inspections for admin
router.get("/:truck_id", auth, getInspectionsByTruck); // Get all inspections for a truck
router.put("/:truck_id", auth, updateInspectionByTruck); // Update an inspection
router.delete("/:truck_id", auth, deleteinsoectionByTruck); // Delete an inspection

module.exports = { InspectionRoute: router };
