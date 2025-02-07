const express = require("express");
const router = express.Router();
const { auth } = require("../../middlewares/auth");
const {
  createCompany,
  getAllCompanies,
  getCompanyById,
  updateCompany,
  deleteCompany,
} = require("./company.controller");

router.post("/", auth, createCompany);
router.get("/", getAllCompanies);
router.get("/:id", getCompanyById);
router.put("/:id", auth, updateCompany);
router.delete("/:id", auth, deleteCompany);

module.exports = { companyRoute: router };
