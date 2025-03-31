// const ErrorHandler = require("../../utils/errorHandler");
// const catchAsyncError = require("../../utils/catchAsyncError");
// const APIFeatures = require("../../utils/apiFeatures");
// const truckModel = require("./truck.model");
// const { isValidObjectId, default: mongoose } = require("mongoose");
// const { v4: uuid } = require("uuid");

// // Create a new document
// exports.createTruck = catchAsyncError(async (req, res, next) => {
//   console.log("createTruck", req.body);

//   // const truck_id = `#${uuid().slice(0, 6)}`;
//   // console.log({ truck_id })
//   const truck = await truckModel.create({ ...req.body });
//   res.status(201).json({ truck });
// });

// // Get a single document by ID
// exports.getTruck = catchAsyncError(async (req, res, next) => {
//   const { id } = req.params;
//   if (!isValidObjectId(id)) {
//     return next(new ErrorHandler("Invalid Truck ID", 400));
//   }

//   const truck = await truckModel.findById(id);
//   if (!truck) {
//     return next(new ErrorHandler("Truck not found.", 404));
//   }

//   res.status(200).json({ truck });
// });

// // Get all documents
// exports.getAllTruck = catchAsyncError(async (req, res, next) => {
//   console.log("getAllTruck", req.query);
//   const qry = {};
//   if (!req.user) {
//     qry.is_avail = true;
//   }

//   const apiFeature = new APIFeatures(
//     truckModel.find(qry).sort({ createdAt: -1 }),
//     req.query
//   ).search("truck_id");

//   let trucks = await apiFeature.query;
//   console.log("Trucks", trucks);
//   let truckCount = trucks.length;
//   if (req.query.resultPerPage && req.query.currentPage) {
//     apiFeature.pagination();

//     console.log("truckCount", truckCount);
//     trucks = await apiFeature.query.clone();
//   }
//   console.log("trucks", trucks);
//   res.status(200).json({ trucks, truckCount });
// });

// // Update truck
// exports.updateTruck = catchAsyncError(async (req, res, next) => {
//   const { id } = req.params;
//   const truck = await truckModel.findByIdAndUpdate(id, req.body, {
//     new: true,
//     runValidators: true,
//     validateBeforeSave: true
//   });

//   res.status(200).json({ truck });
// });

// // Delete a document by ID
// exports.deleteTruck = catchAsyncError(async (req, res, next) => {
//   const { id } = req.params;
//   let truck = await truckModel.findById(id);

//   if (!truck)
//     return next(new ErrorHandler("Truck not found", 404));

//   await truck.deleteOne();

//   res.status(200).json({
//     message: "Truck Deleted successfully.",
//   });
// });

const ErrorHandler = require("../../utils/errorHandler");
const catchAsyncError = require("../../utils/catchAsyncError");
const APIFeatures = require("../../utils/apiFeatures");
const truckModel = require("./truck.model");
const { isValidObjectId, model } = require("mongoose");

//Creating a new truck
exports.createTruck = catchAsyncError(async (req, res, next) => {
  if (!req.body || !req.body.truck_id || !req.body.plate_no || !req.body.name) {
    return next(
      new ErrorHandler("Please provide all the required fields", 400)
    );
  }

  if (Object.keys(req.body).length === 0) {
    return next(new ErrorHandler("Request body cannot be empty", 400));
  }

  const truck = await truckModel.create(req.body);
  res
    .status(201)
    .json({ message: "Truck Created Successfully", truck, success: true });
});

//Get All trucks
exports.getAllTruck = catchAsyncError(async (req, res, next) => {
  const query = req.user ? {} : { is_avail: true };

  try {
    const apiFeature = new APIFeatures(
      truckModel
        .find(query)
        .populate({
          path: "inspections",
          populate: [
            {
              path: "inspections.driver_id",
              select: "name email",
              model: "User",
            },
          ],
        })
        .select(
          "truck_id driver_id plate_no name is_avail inspections createdAt updatedAt"
        )
        // .search("driver_id")
        .sort({ createdAt: -1 }),
      req.query
    )
      .search("truck_id")
      .pagination();

    const [trucks, truckCount] = await Promise.all([
      apiFeature.query.lean(),
      truckModel.countDocuments(query),
    ]);

    // Add debug logging
    console.log("Query executed:", apiFeature.query.getFilter());
    console.log(
      "First truck inspections:",
      trucks.length > 0 ? trucks[0].inspections : "No trucks found"
    );

    if (!trucks.length) {
      return res.status(200).json({
        success: true,
        message: "No trucks found",
        trucks: [],
        truckCount: 0,
      });
    }

    res.status(200).json({
      success: true,
      trucks,
      truckCount,
      message: "Trucks fetched successfully",
    });
  } catch (error) {
    console.error("Error in getAllTruck:", error);
    return next(
      new ErrorHandler("Error fetching trucks: " + error.message, 500)
    );
  }
});

//Get Single Truck
exports.getTruck = catchAsyncError(async (req, res, next) => {
  const { id } = req.params;

  if (!isValidObjectId(id)) {
    return next(new ErrorHandler("Invalid Truck ID", 400));
  }

  const truck = await truckModel.findById(id);
  if (!truck) {
    return next(new ErrorHandler("Truck not found", 404));
  }

  res.status(200).json({ truck, success: true });
});

//Update Single Truck
exports.updateTruck = catchAsyncError(async (req, res, next) => {
  const { id } = req.params;
  if (!isValidObjectId(id)) {
    return next(new ErrorHandler("Invalid Truck ID", 400));
  }

  if (!req.body || Object.keys(req.body).length === 0) {
    return next(new ErrorHandler("Request body cannot be empty", 400));
  }

  let truck = await truckModel.findById(id);
  if (!truck) {
    return next(new ErrorHandler("Truck not found", 404));
  }

  truck.set(req.body);
  await truck.save();

  res
    .status(200)
    .json({ message: "Truck updated successfully", truck, success: true });
});

//Delete single truck
exports.deleteTruck = catchAsyncError(async (req, res, next) => {
  const { id } = req.params;

  if (!isValidObjectId(id)) {
    return next(new ErrorHandler("Invalid Truck ID", 400));
  }

  const truck = await truckModel.findById(id);

  if (!truck) {
    return next(new ErrorHandler("Truck not found", 404));
  }

  await truck.deleteOne();
  res
    .status(200)
    .json({ message: "Truck deleted successfully", success: true });
});
