const mongoose = require("mongoose");

const tripSchema = new mongoose.Schema(
  {
    driver: [
      {
        dId: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "User",
          required: [true, "Driver is required."],
        },
        time: {
          type: mongoose.Schema.Types.Date,
          required: [true, "Shift Time is required"],
        },
      },
    ],
    status: {
      type: String,
      default: "on-going",
      enum: ["on-going", "completed", "canceled"],
    },

    source_loc: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Location",
      required: [true, "Source location is required."],
    },
    load_loc: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Location",
        // required: [true, "At least one Load location is required."],
      },
    ],
    unload_loc: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Location",
      },
    ],
    end_loc: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Location",
      // required: [true, "End location is required."],
    },

    trip_description: String,

    truck: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Truck",
      required: [true, "Truck is required for a trip."],
    },
    start_milage: {
      type: Number,
      required: [true, "Start Milage is Required."],
    },
    load_milage: Number,
    unload_milage: Number,
    end_milage: Number,
    dispatch: String,

    load_loc_arr_time: [{ type: Date }],
    load_time_start: [{ type: Date }],
    load_time_end: [{ type: Date }],

    unload_loc_arr_time: [{ type: Date }],
    unload_time_start: [{ type: Date }],
    unload_time_end: [{ type: Date }],

    prod_detail: String,
    gross_wt: Number,
    tare_wt: Number,
    net_wt: Number,

    docs: [{ type: String }],
    slip_id: String,
    block_no: String,

    unload_depart_time: [{ type: Date }],
    warehouse_arr_time: { type: Date },

    second_trip_start_time: { type: Date },
    end_time: { type: Date },
  },
  { timestamps: true }
);

tripSchema.pre("validate", function (next) {
  if (!this.end_loc && this.status === "completed") {
    this.invalidate(
      "end_loc",
      "End location is required when the trip is completed."
    );
  }
  next();
});

const tripModel = mongoose.model("Trip", tripSchema);

const locRecordSchema = new mongoose.Schema(
  {
    trip: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Trip",
      required: [true, "Trip Id required."],
    },
    source_loc: {},
    load_loc_arr: [{}],
    load_start: [{}],
    load_end: [{}],

    second_trip: {},
    unload_loc_arr: [{}],
    unload_start: [{}],
    unload_end: [{}],

    product: {},
    unload_depart: [{}],
    warehouse_arr: {},

    end_loc: {},
    shift_change: [{}],
  },
  { timestamps: true }
);

const locRecordModel = mongoose.model("LocRecord", locRecordSchema);

module.exports = { tripModel, locRecordModel };
