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
router.get("/", auth, getAllCompanies);
router.get("/:id", auth, getCompanyById);
router.put("/:id", auth, updateCompany);
router.delete("/:id", auth, deleteCompany);

module.exports = { companyRoute: router };
