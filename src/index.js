const adminRoute = require("./admin");
const { userRoute } = require("./user");
const { enquiryRoute } = require("./enquiry");
const { truckRoute } = require("./trucks");
const { tripRoute } = require("./trips");
const { millRoute } = require("./mill");
const { contentRoute } = require("./content");
const { locationRoute } = require("./location");
const { notificationRoute } = require("./notification");
const { companyRoute } = require("./company");
const { InspectionRoute } = require("./truckMaintanence");

module.exports = {
  adminRoute,
  userRoute,
  enquiryRoute,
  truckRoute,
  tripRoute,
  locationRoute,
  millRoute,
  contentRoute,
  notificationRoute,
  companyRoute,
  InspectionRoute,
};
