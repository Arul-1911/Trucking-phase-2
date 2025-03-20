const express = require("express");
const router = express.Router();
const { auth, isAdmin } = require("../../middlewares/auth");
const {
  createCompany,
  getAllCompanies,
  getCompanyById,
  updateCompany,
  deleteCompany,
} = require("./company.controller");

router.post("/", auth, isAdmin, createCompany);
router.get("/", getAllCompanies);
router.get("/:id", getCompanyById);
router.put("/:id", auth, isAdmin, updateCompany);
router.delete("/:id", auth, isAdmin, deleteCompany);

module.exports = { companyRoute: router };
