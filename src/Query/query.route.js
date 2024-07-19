const express = require("express");
const { createQuery } = require("./query.controller");
const { auth } = require("../../middlewares/auth");
const router = express.Router();



router.post("/create-query", createQuery);

module.exports = router;
