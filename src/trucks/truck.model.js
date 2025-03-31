// const mongoose = require('mongoose');

// const truckSchema = new mongoose.Schema({
// 	truck_id: {
// 		type: String,
// 		required: [true, "Truck ID is required."]
// 	},
// 	plate_no: {
// 		type: String,
// 		required: [true, "Truck Plate No. is required."],
// 	},
//   name: {
// 		type: String,
// 		required: [true, "Truck Name is required."],
// 	},
//   is_avail: {
//     type: Boolean,
//     default: true,
//   }
// }, { timestamps: true });

// const truckModel = mongoose.model('Truck', truckSchema);

// module.exports = truckModel;

const mongoose = require("mongoose");

//Sub Items Schema
const subItemsSchema = new mongoose.Schema({
  item: {
    type: String,
    required: [true, "Item name is required."],
    trim: true,
    minlength: [2, "Item name must be at least 3 characters long."],
  },
  status: {
    type: String,
    enum: ["Good", "Needs Attention"],
    required: [true, "Status is required"],
    default: "Good",
  },
  description: {
    type: String,
    trim: true,
    default: "",
  },
});

//Categories Schema
const categoriesSchema = new mongoose.Schema({
  category: {
    type: String,
    required: [true, "Category name is required"],
    trim: true,
    minlength: [2, "Category name must be at least 3 characters long"],
  },
  sub_items: {
    type: [subItemsSchema],
    default: [],
  },
});

//Truck Schema
const truckSchema = new mongoose.Schema(
  {
    truck_id: {
      type: String,
      required: [true, "Truck Id is required"],
      trim: true,
    },
    plate_no: {
      type: String,
      required: [true, "Truck Plate no. is required"],
      trim: true,
    },
    name: {
      type: String,
      required: [true, "Truck name is required"],
      trim: true,
    },
    is_avail: {
      type: Boolean,
      default: true,
    },
    inspections: {
      type: [
        {
          driver_id: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            required: [true, "Driver Id is required"],
          },
          oil_level: {
            type: String,
            required: [true, "Oil level is required"],
            trim: true,
          },
          inspection_categories: {
            type: [categoriesSchema],
            default: [],
          },
        },
      ],
    },
  },
  { timestamps: true }
);

const Truck = mongoose.model("Truck", truckSchema);
module.exports = Truck;
