const ErrorHandler = require("../../utils/errorHandler");
const catchAsyncError = require("../../utils/catchAsyncError");
const APIFeatures = require("../../utils/apiFeatures");
const { tripModel, locRecordModel } = require("./trip.model");
const { userModel } = require("../user/user.model");
const { isValidObjectId, default: mongoose } = require("mongoose");
const truckModel = require("../trucks/truck.model");
const { s3UploadMulti } = require("../../utils/s3");
const millModel = require("../mill/mill.model");
const locationModel = require("../location/location.model");

const populateTrip = [
  { path: "source_loc", select: "name lat long" },
  { path: "load_loc", select: "name lat long" },
  { path: "unload_loc", select: "name lat long" },
  { path: "end_loc", select: "name lat long" },
  { path: "truck", select: "truck_id plate_no name" },
];

// Create a new document
// exports.createTrip = catchAsyncError(async (req, res, next) => {
//   console.log("createTrip", req.body);
//   const { loc, source_loc } = req.body;

//   if (!loc) {
//     return next(new ErrorHandler("Current Location is required", 400));
//   }
//   loc.time = Date.now();

//   if (!source_loc) {
//     return next(new ErrorHandler("Source Location is required", 400));
//   }

//   const userId = req.userId;
//   const user = await userModel.findById(userId).select("+hasTrip");
//   if (!user) {
//     return next(new ErrorHandler("Driver not found.", 404));
//   }

//   if (user.hasTrip) {
//     return next(
//       new ErrorHandler(
//         "Your current trip is not completed. Can't start another one.",
//         400
//       )
//     );
//   }

//   const { truck } = req.body;
//   if (!truck) {
//     return next(new ErrorHandler("Please select a truck", 400));
//   }

//   const isAvailTruck = await truckModel.findOne({ _id: truck, is_avail: true });
//   if (!isAvailTruck) {
//     return next(new ErrorHandler("The truck is already in use.", 400));
//   }

//   // Create the source location
//   const newSourceLoc = await locationModel.create(source_loc); // ALWAYS CREATE
//   const sourceLocId = newSourceLoc._id;

//   const trip = await tripModel.create({
//     ...req.body,
//     source_loc: sourceLocId,
//     driver: [{ dId: userId, time: Date.now() }],
//   });
//   if (trip) {
//     isAvailTruck.is_avail = false;
//     await isAvailTruck.save();

//     user.hasTrip = true;
//     await user.save();

//     // creating location
//     await locRecordModel.create({ trip: trip._id, source_loc: loc });
//   }
//   res.status(201).json({ trip });
// });

// exports.createTrip = catchAsyncError(async (req, res, next) => {
//   console.log("createTrip", req.body);
//   const { loc, source_loc, end_loc } = req.body;

//   if (!loc) {
//     return next(new ErrorHandler("Current Location is required", 400));
//   }
//   loc.time = Date.now();

//   if (!source_loc) {
//     return next(new ErrorHandler("Source Location is required", 400));
//   }

//   const userId = req.userId;
//   const user = await userModel.findById(userId).select("+hasTrip");
//   if (!user) {
//     return next(new ErrorHandler("Driver not found.", 404));
//   }

//   if (user.hasTrip) {
//     return next(
//       new ErrorHandler(
//         "Your current trip is not completed. Can't start another one.",
//         400
//       )
//     );
//   }

//   const { truck } = req.body;
//   if (!truck) {
//     return next(new ErrorHandler("Please select a truck", 400));
//   }

//   const isAvailTruck = await truckModel.findOne({ _id: truck, is_avail: true });
//   if (!isAvailTruck) {
//     return next(new ErrorHandler("The truck is already in use.", 400));
//   }

//   // Check if the source location already exists
//   let existingSourceLoc = await locationModel.findOne({
//     name: source_loc.name,
//     lat: source_loc.lat,
//     long: source_loc.long,
//   });

//   let sourceLocId;
//   if (existingSourceLoc) {
//     sourceLocId = existingSourceLoc._id;
//   } else {
//     // Create the source location
//     const newSourceLoc = await locationModel.create(source_loc);
//     sourceLocId = newSourceLoc._id;
//   }

//   // Check if the end location already exists
//   let endLocId;
//   if (end_loc) {
//     let existingEndLoc = await locationModel.findOne({
//       name: end_loc.name,
//       lat: end_loc.lat,
//       long: end_loc.long,
//     });

//     if (existingEndLoc) {
//       endLocId = existingEndLoc._id;
//     } else {
//       // Create the end location
//       const newEndLoc = await locationModel.create(end_loc);
//       endLocId = newEndLoc._id;
//     }
//   }

//   const trip = await tripModel.create({
//     ...req.body,
//     source_loc: sourceLocId,
//     end_loc: endLocId,
//     driver: [{ dId: userId, time: Date.now() }],
//   });
//   if (trip) {
//     isAvailTruck.is_avail = false;
//     await isAvailTruck.save();

//     user.hasTrip = true;
//     await user.save();

//     // creating location
//     await locRecordModel.create({ trip: trip._id, source_loc: loc });
//   }
//   res.status(201).json({ trip });
// });

// To Create a trip
exports.createTrip = catchAsyncError(async (req, res, next) => {
  console.log("createTrip Request Body:", req.body);

  const {
    start_milage,
    source_loc: sourceLocId,
    load_loc: loadLocId,
    truck: truckId,
    trip_description,
    dispatch,
    loc,
  } = req.body;

  if (!start_milage) {
    return next(new ErrorHandler("Start Milage is required", 400));
  }

  if (!loc || !loc.name || loc.lat == null || loc.long == null) {
    return next(new ErrorHandler("Current Location is required", 400));
  }

  loc.time = Date.now();

  if (!sourceLocId) {
    return next(new ErrorHandler("Source Location is required", 400));
  }

  if (!loadLocId) {
    return next(new ErrorHandler("Load Location is required", 400));
  }

  if (!truckId) {
    return next(new ErrorHandler("Please select a truck", 400));
  }

  const userId = req.userId;
  if (!userId) {
    return next(new ErrorHandler("Authentication required.", 401));
  }

  const user = await userModel.findById(userId).select("+hasTrip");
  if (!user) {
    return next(new ErrorHandler("Driver not found.", 404));
  }

  if (user.hasTrip) {
    return next(
      new ErrorHandler(
        "Your current trip is not completed. Can't start another one.",
        400
      )
    );
  }

  const isAvailTruck = await truckModel.findOne({
    _id: truckId,
    is_avail: true,
  });

  if (!isAvailTruck) {
    return next(new ErrorHandler("The truck is already in use.", 400));
  }

  // Verify the provided location ID exists
  const sourceLocationExists = await locationModel.findById(sourceLocId).lean();
  if (!sourceLocationExists) {
    return next(new ErrorHandler("Source Location not found.", 404));
  }

  const loadLocationExists = await locationModel.findById(loadLocId).lean();
  if (!loadLocationExists) {
    return next(new ErrorHandler("Load Location not found.", 404));
  }

  // Trip data
  const tripData = {
    start_milage,
    source_loc: sourceLocId,
    load_loc: loadLocId,
    truck: truckId,
    trip_description,
    dispatch,
    driver: [{ dId: userId, time: Date.now() }],
  };

  const trip = await tripModel.create(tripData);

  if (trip) {
    isAvailTruck.is_avail = false;
    await isAvailTruck.save();
    user.hasTrip = true;
    await user.save();

    // Creating location record
    const locRecord = await locRecordModel.create({
      trip: trip._id,
      source_loc: loc,
    });

    // Populate the response with loc fields
    const populatedTrip = await tripModel
      .findById(trip._id)
      .populate({
        path: "source_loc",
        select: "name lat long",
      })
      .populate({
        path: "load_loc",
        select: "name lat long",
      });

    res.status(201).json({
      success: true,
      trip: populatedTrip,
      location: locRecord.source_loc,
      message: "Trip created successfully",
    });
  } else {
    return next(new ErrorHandler("Failed to create trip.", 500));
  }
});

// Get Current Trip or Trip by _id of Driver
exports.getDriverTrip = catchAsyncError(async (req, res, next) => {
  const userId = req.userId;

  const driver = await userModel.findById(userId).select("+hasTrip");
  if (!driver.hasTrip) {
    return next(new ErrorHandler("No On-going trip", 400));
  }

  const trip = await tripModel
    .findOne({ "driver.dId": userId, status: "on-going" })
    .populate(populateTrip);
  if (!trip) {
    return next(new ErrorHandler("No On-going trip", 400));
  }

  res.status(200).json({ trip, end_time: trip.end_time });
});

exports.getTripHisDetail = catchAsyncError(async (req, res, next) => {
  const userId = req.userId;
  const { id } = req.params;

  const trip = await tripModel
    .findOne({ "driver.dId": userId, _id: id })
    .populate(populateTrip);
  if (!trip) {
    return next(new ErrorHandler("No On-going trip", 400));
  }

  res.status(200).json({ trip });
});

// Shift Change
exports.shiftChange = catchAsyncError(async (req, res, next) => {
  console.log("shiftChange", req.body);
  const userId = req.userId;
  const { trip_id, loc } = req.body;
  if (!loc) {
    return next(new ErrorHandler("Current Location is required", 400));
  }
  loc.time = Date.now();

  const user = await userModel.findById(userId).select("+hasTrip");
  if (user.hasTrip) {
    return next(
      new ErrorHandler(
        "Your current trip is not completed. Can't overtake another one.",
        400
      )
    );
  }

  if (!isValidObjectId(trip_id)) {
    return next(new ErrorHandler("Invalid trip id.", 400));
  }

  let trip = await tripModel
    .findOne({ _id: trip_id, status: "on-going" })
    .select("+driver");
  if (!trip) {
    return next(new ErrorHandler("Trip Not Found or Trip is completed.", 404));
  }

  const prevDriverId = trip.driver[trip.driver.length - 1].dId;
  const prevDriver = await userModel.findOne({
    _id: prevDriverId,
    hasTrip: true,
  });
  if (!prevDriver) {
    return next(
      new ErrorHandler("Trip is already overtaken / completed.", 400)
    );
  }

  const session = await mongoose.startSession();
  session.startTransaction();
  try {
    trip = await tripModel
      .findByIdAndUpdate(
        trip_id,
        {
          $push: {
            driver: { dId: userId, time: Date.now() },
          },
        },
        {
          new: true,
          runValidators: true,
          validateBeforeSave: true,
          session,
        }
      )
      .populate(populateTrip);

    await locRecordModel.findOneAndUpdate(
      { trip: trip._id },
      { $push: { shift_change: loc } },
      { session }
    );
    user.hasTrip = true;
    await user.save({ session });

    prevDriver.hasTrip = false;
    await prevDriver.save({ session });

    await session.commitTransaction();
    res.status(200).json({ trip, previousDriver: prevDriverId });
  } catch (err) {
    await session.abortTransaction();
    next(err);
  } finally {
    await session.endSession();
  }
});

// Update trip
const getMissingFields = (reqFields, body) => {
  return Object.entries(reqFields)
    .filter(([k, v]) => !body[k])
    .map(([k, v]) => reqFields[k])
    .join(", ")
    .replace(/,([^,]*)$/, " and$1");
};

// exports.updateTrip = catchAsyncError(async (req, res, next) => {
//   console.log("updateTrip", req.body, req.query);
//   const { loc } = req.body;
//   if (!loc) {
//     return next(new ErrorHandler("Current Location is required", 400));
//   }
//   loc.time = Date.now();

//   const { id } = req.params;
//   let updatedData = {};
//   let record = {};
//   let missingFields = null;

//   if (req.body.trip_description) {
//     updatedData.trip_description = req.body.trip_description;
//   }

//   switch (req.query.UPDATE_TRIP) {
//     case "LOAD_ARRIVAL_TIME":
//       updatedData.$push = { load_loc_arr_time: Date.now() };
//       record = { load_loc_arr: loc };
//       break;

//     case "LOAD_TIME_START":
//       updatedData.$push = { load_time_start: Date.now() };
//       record = { load_start: loc };
//       break;

//     case "LOAD_TIME_END":
//       updatedData.$push = { load_time_end: Date.now() };
//       record = { load_end: loc };
//       break;

//     case "ADD_LOAD_LOCATION":
//       const { load_loc: addLoadLoc } = req.body;
//       if (!addLoadLoc) {
//         return next(new ErrorHandler("Load location is required.", 400));
//       }

//       // Create the load location
//       const newLoadLoc = await locationModel.create(addLoadLoc); // ALWAYS CREATE
//       const loadLocId = newLoadLoc._id;

//       updatedData.$push = { load_loc: loadLocId };
//       break;

//     case "UNLOAD_TRIP":
//       var reqFields = {
//         unload_loc: "Mill ID",
//         prod_detail: "Product Details",
//         slip_id: "Slip ID",
//         block_no: "Block Number",
//         load_milage: "Current Milage",
//       };
//       missingFields = getMissingFields(reqFields, req.body);
//       console.log({ missingFields });
//       if (missingFields) {
//         return next(new ErrorHandler(`${missingFields} are required.`, 400));
//       }

//       const {
//         unload_loc: unloadLocData,
//         prod_detail,
//         slip_id,
//         block_no,
//         load_milage,
//       } = req.body;
//       updatedData = {
//         unload_loc: unloadLocData,
//         prod_detail,
//         slip_id,
//         block_no,
//         load_milage,
//       };

//       const files = req.files;
//       console.log({ files, c: files.length > 0 });
//       if (files && files.length > 0) {
//         const results = await s3UploadMulti(files, "jeff");
//         let location = results.map((result) => result.Location);
//         updatedData.docs = location;
//       }
//       updatedData.second_trip_start_time = Date.now();
//       record = { second_trip: loc };
//       break;

//     case "UNLOAD_ARRIVAL_TIME":
//       updatedData.$push = { unload_loc_arr_time: Date.now() };
//       record = { unload_loc_arr: loc };
//       break;

//     case "UNLOAD_TIME_START":
//       updatedData.$push = { unload_time_start: Date.now() };
//       record = { unload_start: loc };
//       break;

//     case "UNLOAD_TIME_END":
//       updatedData.$push = { unload_time_end: Date.now() };
//       record = { unload_end: loc };
//       break;

//     case "ADD_UNLOAD_LOCATION":
//       const { unload_loc: addUnloadLoc } = req.body;
//       if (!addUnloadLoc) {
//         return next(new ErrorHandler("Unload location is required.", 400));
//       }

//       // Create the unload location
//       const newUnloadLoc = await locationModel.create(addUnloadLoc); // ALWAYS CREATE
//       const unloadLocId = newUnloadLoc._id;

//       updatedData.$push = { unload_loc: unloadLocId };
//       break;

//     case "PRODUCT_DETAILS":
//       var reqFields = {
//         unload_milage: "Current Milage",
//         gross_wt: "Gross Wt.",
//         tare_wt: "Tare Wt.",
//         net_wt: "Net Wt.",
//       };
//       missingFields = getMissingFields(reqFields, req.body);
//       console.log({ missingFields });
//       if (missingFields) {
//         return next(new ErrorHandler(`${missingFields} are required.`, 400));
//       }
//       const { unload_milage, gross_wt, tare_wt, net_wt } = req.body;
//       updatedData = { unload_milage, gross_wt, tare_wt, net_wt };
//       record = { product: loc };
//       break;

//     case "CONT_WAREHOUSE":
//       updatedData.unload_depart_time = Date.now();
//       updatedData.end_loc = "65ae4c081c0736fbf1828ccf"; //Hardcoded Warehouse Id
//       record = { unload_depart: loc };
//       break;

//     case "ARRIVE_WAREHOUSE":
//       updatedData.warehouse_arr_time = Date.now();
//       record = { warehouse_arr: loc };
//       break;

//     default:
//       const { end_milage, end_loc } = req.body;
//       if (!end_milage && !end_loc) {
//         const tripUnloadLoc = await tripModel.findById(id);
//         const mill = await millModel.findById(tripUnloadLoc.unload_loc); //This line might not be correct

//         console.log({ tripUnloadLoc, mill });
//         updatedData.end_loc = mill.address;
//         updatedData.end_milage = tripUnloadLoc.unload_milage;
//       } else {
//         // Create the end location
//         const newEndLoc = await locationModel.create(end_loc); // ALWAYS CREATE
//         const endLocId = newEndLoc._id;

//         updatedData.end_loc = endLocId;
//         updatedData.end_milage = end_milage;
//       }

//       updatedData.end_time = Date.now();
//       updatedData.status = "completed";
//       record = { end_loc: loc };
//       break;
//   }

//   console.log(updatedData, Object.entries(req.body));
//   const trip = await tripModel.findOneAndUpdate(
//     { _id: id, status: "on-going" },
//     updatedData,
//     {
//       new: true,
//       runValidators: true,
//       validateBeforeSave: true,
//     }
//   );
//   if (!trip) {
//     return next(new ErrorHandler("Trip not found.", 404));
//   }

//   await locRecordModel.findOneAndUpdate({ trip: trip._id }, record);

//   if (!req.query.UPDATE_TRIP) {
//     await truckModel.findByIdAndUpdate(trip.truck, { is_avail: true });
//     await userModel.findByIdAndUpdate(req.userId, { hasTrip: false });
//   }

//   res.status(200).json({ trip });
// });
exports.updateTrip = catchAsyncError(async (req, res, next) => {
  console.log("updateTrip", req.body, req.query);
  const { loc } = req.body;
  if (!loc) {
    return next(new ErrorHandler("Current Location is required", 400));
  }
  loc.time = Date.now();

  const { id } = req.params;
  let updatedData = {};
  let record = {};
  let missingFields = null;

  const existingTrip = await tripModel.findById(id);
  if (!existingTrip) {
    return next(new ErrorHandler("Trip not found.", 404));
  }

  let loadLocLength = existingTrip.load_loc?.length;
  let unLoadLocLength = existingTrip.unload_loc?.length;

  if (req.body.trip_description) {
    updatedData.trip_description = req.body.trip_description;
  }

  switch (req.query.UPDATE_TRIP) {
    case "LOAD_ARRIVAL_TIME":
      if (existingTrip.load_loc_arr_time?.length >= loadLocLength) {
        return next(
          new ErrorHandler(
            "Load Arrival time already added for all pickup locations."
          ),
          400
        );
      }

      updatedData.$push = { load_loc_arr_time: Date.now() };
      record = { load_loc_arr: loc };
      break;

    case "LOAD_TIME_START":
      if (existingTrip.load_time_start?.length >= loadLocLength) {
        return next(
          new ErrorHandler(
            "Load Start time already added for all pickup locations."
          ),
          400
        );
      }
      updatedData.$push = { load_time_start: Date.now() };
      record = { load_start: loc };
      break;

    case "LOAD_TIME_END":
      if (existingTrip.load_time_end?.length >= loadLocLength) {
        return next(
          new ErrorHandler(
            "Load End time already added for all pickup locations."
          ),
          400
        );
      }
      updatedData.$push = { load_time_end: Date.now() };
      record = { load_end: loc };
      break;

    case "ADD_LOAD_LOCATION":
      const { load_loc: addLoadLoc } = req.body;
      if (!addLoadLoc) {
        return next(new ErrorHandler("Load location is required.", 400));
      }

      // Check if the load location already exists
      let existingLoadLoc = await locationModel.findOne({
        name: addLoadLoc.name,
        lat: addLoadLoc.lat,
        long: addLoadLoc.long,
      });

      let loadLocId;
      if (existingLoadLoc) {
        loadLocId = existingLoadLoc._id;
      } else {
        // Create the load location
        const newLoadLoc = await locationModel.create(addLoadLoc);
        loadLocId = newLoadLoc._id;
      }

      updatedData.$push = { load_loc: loadLocId };
      break;

    case "UNLOAD_TRIP":
      var reqFields = {
        unload_loc: "Mill ID",
        prod_detail: "Product Details",
        slip_id: "Slip ID",
        block_no: "Block Number",
        load_milage: "Current Milage",
      };
      missingFields = getMissingFields(reqFields, req.body);
      console.log({ missingFields });
      if (missingFields) {
        return next(new ErrorHandler(`${missingFields} are required.`, 400));
      }

      const {
        unload_loc: unloadLocData,
        prod_detail,
        slip_id,
        block_no,
        load_milage,
      } = req.body;
      updatedData = {
        unload_loc: unloadLocData,
        prod_detail,
        slip_id,
        block_no,
        load_milage,
      };

      const files = req.files;
      console.log({ files, c: files.length > 0 });
      if (files && files.length > 0) {
        const results = await s3UploadMulti(files, "jeff");
        let location = results.map((result) => result.Location);
        updatedData.docs = location;
      }
      updatedData.second_trip_start_time = Date.now();
      record = { second_trip: loc };
      break;

    case "UNLOAD_ARRIVAL_TIME":
      if (existingTrip.unload_loc_arr_time?.length >= unLoadLocLength) {
        return next(
          new ErrorHandler(
            "Arrival time already added for all drop locations."
          ),
          400
        );
      }
      updatedData.$push = { unload_loc_arr_time: Date.now() };
      record = { unload_loc_arr: loc };
      break;

    case "UNLOAD_TIME_START":
      if (existingTrip.unload_time_start?.length >= loadLocLength) {
        return next(
          new ErrorHandler("Start time already added for all drop locations."),
          400
        );
      }
      updatedData.$push = { unload_time_start: Date.now() };
      record = { unload_start: loc };
      break;

    case "UNLOAD_TIME_END":
      if (existingTrip.unload_time_end?.length >= loadLocLength) {
        return next(
          new ErrorHandler("End time already added for all drop locations."),
          400
        );
      }
      updatedData.$push = { unload_time_end: Date.now() };
      record = { unload_end: loc };
      break;

    case "ADD_UNLOAD_LOCATION":
      const { unload_loc: addUnloadLoc } = req.body;
      if (!addUnloadLoc) {
        return next(new ErrorHandler("Unload location is required.", 400));
      }

      // Check if the unload location already exists
      let existingUnloadLoc = await locationModel.findOne({
        name: addUnloadLoc.name,
        lat: addUnloadLoc.lat,
        long: addUnloadLoc.long,
      });

      let unloadLocId;
      if (existingUnloadLoc) {
        unloadLocId = existingUnloadLoc._id;
      } else {
        // Create the unload location
        const newUnloadLoc = await locationModel.create(addUnloadLoc);
        unloadLocId = newUnloadLoc._id;
      }

      updatedData.$push = { unload_loc: unloadLocId };
      break;

    case "PRODUCT_DETAILS":
      var reqFields = {
        unload_milage: "Current Milage",
        gross_wt: "Gross Wt.",
        tare_wt: "Tare Wt.",
        net_wt: "Net Wt.",
      };
      missingFields = getMissingFields(reqFields, req.body);
      console.log({ missingFields });
      if (missingFields) {
        return next(new ErrorHandler(`${missingFields} are required.`, 400));
      }
      const { unload_milage, gross_wt, tare_wt, net_wt } = req.body;
      updatedData = { unload_milage, gross_wt, tare_wt, net_wt };
      record = { product: loc };
      break;

    case "CONT_WAREHOUSE":
      updatedData.unload_depart_time = Date.now();
      updatedData.end_loc = "65ae4c081c0736fbf1828ccf"; //Hardcoded Warehouse Id
      record = { unload_depart: loc };
      break;

    case "ARRIVE_WAREHOUSE":
      updatedData.warehouse_arr_time = Date.now();
      record = { warehouse_arr: loc };
      break;

    //   default:
    //     const { end_milage, end_loc } = req.body;
    //     if (!end_milage && !end_loc) {
    //       const tripUnloadLoc = await tripModel.findById(id);
    //       const mill = await millModel.findById(tripUnloadLoc.unload_loc); //This line might not be correct

    //       console.log({ tripUnloadLoc, mill });
    //       updatedData.end_loc = mill.address;
    //       updatedData.end_milage = tripUnloadLoc.unload_milage;
    //     } else {
    //       // Create the end location
    //       const newEndLoc = await locationModel.create(end_loc); // ALWAYS CREATE
    //       const endLocId = newEndLoc._id;

    //       updatedData.end_loc = endLocId;
    //       updatedData.end_milage = end_milage;
    //     }

    //     updatedData.end_time = Date.now();
    //     updatedData.status = "completed";
    //     record = { end_loc: loc };
    //     break;
    // }

    default:
      const { end_milage } = req.body;
      if (!end_milage) {
        return next(new ErrorHandler("End mileage is required.", 400));
      }

      updatedData.end_milage = end_milage;
      updatedData.end_time = Date.now();
      updatedData.status = "completed";
      record = { end_loc: loc };
      break;
  }

  console.log(updatedData, Object.entries(req.body));
  const trip = await tripModel
    .findOneAndUpdate({ _id: id, status: "on-going" }, updatedData, {
      new: true,
      runValidators: true,
      validateBeforeSave: true,
    })
    // .populate("load_loc unload_loc end_loc", "name lat long");
    .populate({
      path: "source_loc",
      select: "name lat long",
    })
    .populate({
      path: "load_loc",
      select: "name lat long",
    })
    .populate({
      path: "unload_loc",
      select: "name lat long",
    });
  if (!trip) {
    return next(new ErrorHandler("Trip not found.", 404));
  }

  await locRecordModel.findOneAndUpdate({ trip: trip._id }, record);

  if (!req.query.UPDATE_TRIP) {
    await truckModel.findByIdAndUpdate(trip.truck, { is_avail: true });
    await userModel.findByIdAndUpdate(req.userId, { hasTrip: false });
  }

  res.status(200).json({ trip });
});

const lookUp = (key) => [
  {
    $lookup: {
      from: "locations",
      foreignField: "_id",
      localField: key,
      as: `${key}`,
    },
  },
  { $unwind: { path: `$${key}`, preserveNullAndEmptyArrays: true } },
  {
    $project: {
      [`${key}.createdAt`]: 0,
      [`${key}.updatedAt`]: 0,
      [`${key}._id`]: 0,
      [`${key}.__v`]: 0,
    },
  },
];

// Trip History
exports.getTripHistory = catchAsyncError(async (req, res, next) => {
  const userId = req.userId;
  const aggregateQry = [
    {
      $match: {
        "driver.dId": new mongoose.Types.ObjectId(userId),
        status: "completed",
      },
    },
    ...lookUp("source_loc"),
    ...lookUp("end_loc"),
    {
      $lookup: {
        from: "trucks",
        localField: "truck",
        foreignField: "_id",
        as: "truck",
      },
    },
    { $unwind: { path: "$truck", preserveNullAndEmptyArrays: true } },
    {
      $project: {
        "truck._id": 0,
        "truck.is_avail": 0,
        "truck.createdAt": 0,
        "truck.updatedAt": 0,
        "truck.__v": 0,
      },
    },
  ];

  const trips = await tripModel.aggregate(aggregateQry);

  res.status(200).json({ trips });
});

// --------------------------------- ADMIN ----------------------------------------
// Get a single document by ID
exports.getTrip = catchAsyncError(async (req, res, next) => {
  const { id } = req.params;
  console.log("getTrip: trip id = ", id);
  if (!isValidObjectId(id)) {
    return next(new ErrorHandler("Invalid Trip ID", 400));
  }

  const trip = await tripModel
    .findById(id)
    .select("+driver")
    .populate([
      ...populateTrip,
      {
        path: "driver.dId",
        select: "first_name last_name mobile_no country_code",
      },
    ]);
  if (!trip) {
    return next(new ErrorHandler("Trip Not Found", 404));
  }

  res.status(200).json({ trip });
});

// Get all documents
exports.getAllTrip = catchAsyncError(async (req, res, next) => {
  const { status, keyword, currentPage, resultPerPage, currentDriver } =
    req.query;
  delete req.query.currentDriver;

  const apiFeature = new APIFeatures(
    tripModel.find({ status }).sort({ createdAt: -1 }).populate(populateTrip),
    req.query
  );

  let trips = await apiFeature.query;
  if (currentDriver)
    trips = trips.filter((trip) =>
      trip.driver.map((d) => d.dId.toString()).includes(currentDriver)
    );

  let tripCount = trips.length;
  if (resultPerPage && currentPage) {
    trips = trips.slice(
      (Number(currentPage) - 1) * 10,
      (Number(currentPage) - 1) * 10 + Number(resultPerPage)
    );
  }

  res.status(200).json({ trips, tripCount });
});

// Delete a document by ID
exports.deleteTrip = catchAsyncError(async (req, res, next) => {
  const { id } = req.params;
  let trip = await tripModel.findById(id);

  if (!trip) return next(new ErrorHandler("Trip not found", 404));

  const tripWithTruck = await tripModel.findOne({
    truck: trip.truck,
    status: "on-going",
    _id: { $ne: trip._id },
  });
  if (!tripWithTruck) {
    await truckModel.findByIdAndUpdate(trip.truck, { is_avail: true });
  }

  for (let user of trip.driver) {
    const users = await userModel.findById(user.dId).select("+hasTrip");
    if (users && users?.hasTrip) {
      users.hasTrip = false;
      await users.save();
    }
  }
  await trip.deleteOne();

  res.status(200).json({
    message: "Trip Deleted successfully.",
  });
});

exports.cancelTrip = catchAsyncError(async (req, res, next) => {
  const { id } = req.params;
  let trip = await tripModel.findById(id);

  if (!trip) return next(new ErrorHandler("Trip not found", 404));

  for (let user of trip.driver) {
    const users = await userModel.findById(user.dId).select("+hasTrip");
    if (users && users?.hasTrip) {
      users.hasTrip = false;
      await users.save();
    }
  }
  const truck = await truckModel.findById(trip.truck);
  truck.is_avail = true;
  await truck.save();
  trip.status = "canceled";
  await trip.save();
  res.status(200).json({
    message: "Trip Canceled successfully.",
  });
});
