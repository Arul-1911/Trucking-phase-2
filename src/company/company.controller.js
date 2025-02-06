const Company = require("./company.model.js");
const ErrorHandler = require("../../utils/errorHandler");
const catchAsyncError = require("../../utils/catchAsyncError");
const mongoose = require("mongoose");

// Create a new company
exports.createCompany = catchAsyncError(async (req, res, next) => {
  if (!req.body.name) {
    return next(new ErrorHandler("Company name is required.", 400));
  }
  const existingCompany = await Company.findOne({ name: req.body.name });
  if (existingCompany) {
    return next(new ErrorHandler("Company  already exists.", 400));
  }
  const company = await Company.create(req.body);
  res
    .status(201)
    .json({ success: true, company, message: "Company Created Successfully" });
});

// Get All Company list
exports.getAllCompanies = catchAsyncError(async (req, res) => {
  const companies = await Company.find();
  res.status(200).json({
    success: true,
    companies,
    message: "Companies fetched Successfully",
  });
});

// Get Single Company
exports.getCompanyById = catchAsyncError(async (req, res, next) => {
  if (!mongoose.isValidObjectId(req.params.id)) {
    return next(new ErrorHandler("Invalid company ID", 400));
  }
  const company = await Company.findById(req.params.id);
  if (!company) return next(new ErrorHandler("Company not found", 404));
  res
    .status(200)
    .json({ success: true, company, message: "Company found successfully" });
});

// Update company
exports.updateCompany = catchAsyncError(async (req, res, next) => {
  if (!mongoose.isValidObjectId(req.params.id)) {
    return next(new ErrorHandler("Invalid company ID", 400));
  }
  let company = await Company.findById(req.params.id);
  if (!company) return next(new ErrorHandler("Company not found", 404));

  if (req.body.name) {
    const existingCompany = await Company.findOne({ name: req.body.name });
    if (existingCompany && existingCompany.id !== req.params.id) {
      return next(new ErrorHandler("Company name already exists.", 400));
    }
  }

  company = await Company.findByIdAndUpdate(req.params.id, req.body, {
    new: true,
    runValidators: true,
    validateBeforeSave: true,
  });
  res
    .status(200)
    .json({ success: true, company, message: "Company Updated Successfully" });
});

// Delete Company
exports.deleteCompany = catchAsyncError(async (req, res, next) => {
  if (!mongoose.isValidObjectId(req.params.id)) {
    return next(new ErrorHandler("Invalid company ID", 400));
  }
  const company = await Company.findById(req.params.id);
  if (!company) return next(new ErrorHandler("Company not found", 404));

  await company.deleteOne();
  res
    .status(200)
    .json({ success: true, message: "Company Deleted successfully." });
});
