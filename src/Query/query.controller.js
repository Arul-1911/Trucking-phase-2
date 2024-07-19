const queryModel = require("./query.model");
const catchAsyncError = require("../../utils/catchAsyncError");

const ErrorHandler = require("../../utils/errorHandler");

exports.createQuery = catchAsyncError(async (req, res, next) => {
  const { name, email, query } = req.body;

  if (!name || !email || !query) {
    return next(new ErrorHandler("All Fieleds are required", 400));
  }
  console.log("in this route")

  const querys = await queryModel.create({
    name,
    email,
    query,
  });

  res.status(201).json({
    success: true,
    querys,
    message: "New Query Created Successfully",
  });
});

exports.getQuerys = catchAsyncError(async (req, res, next) => {
  const { currentPage, resultPerPage, key } = req.query;
  let query = {};
  if (key && key.trim() != 0) {
    query.name = { $regex: key, $options: "i" };
  }
  const skip = resultPerPage * (currentPage - 1);

  const [queryCount, querys] = await Promise.all([
    queryModel.countDocuments(query),
    queryModel.find(query).limit(resultPerPage).skip(skip).lean(),
  ]);

  res.status(200).send({
    success: true,
    length: queryCount,
    querys,
  });
});

exports.deleteQuery = catchAsyncError(async (req, res, next) => {
  const query = await queryModel.findByIdAndDelete(req.params.id);
  if (!query) {
    return next(new ErrorHandler("Query not found", 404));
  }
  res.status(200).json({
    success: true,
    message: "Query Deleted successfully",
  });
});

exports.getQuery = catchAsyncError(async (req, res, next) => {
  const query = await queryModel.findById(req.params.id);
  if (!query) {
    return next(new ErrorHandler("Query not found", 404));
  }
  res.status(200).json({
    success: true,
    query,
    message: "Query find successfully",
  });
});

exports.updateQuery = catchAsyncError(async (req, res, next) => {
  const querys = await queryModel.findById(req.params.id);
  const { name, email, query, status } = req.body;
  if (!querys) {
    return next(new ErrorHandler("Query not found", 404));
  }
  if (name) querys.name = name;
  if (email) querys.email = email;
  if (query) querys.query = query;
  if (status) querys.status = status;
  await querys.save();
  res.status(200).json({
    success: true,
    message: "Query updated successfully",
  });
});
