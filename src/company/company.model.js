const mongoose = require("mongoose");

const companySchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, "Company name is required."],
      unique: true,
    },
  },
  { timestamps: true }
);

const companyModel = mongoose.model("Company", companySchema);
module.exports = companyModel;
