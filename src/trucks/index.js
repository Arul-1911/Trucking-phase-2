const express = require("express");
const router = express.Router();
const { auth, isAdmin } = require("../../middlewares/auth");
const {
  createTruck,
  getAllTruck,
  getTruck,
  updateTruck,
  deleteTruck,
} = require("./truck.controller");

router.get("/", auth, getAllTruck);
router.get("/:id", auth, getTruck);
router.post("/", auth, isAdmin, createTruck);
router.put("/:id", auth, updateTruck);
router.delete("/:id", auth, isAdmin, deleteTruck);

module.exports = { truckRoute: router };
