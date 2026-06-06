const express = require("express");
const router = express.Router();
const pinController = require("../controllers/pinController");

// Parent result checking
router.get("/check-result", pinController.checkResultPage);
router.post("/check-result", pinController.checkResult);

module.exports = router;
