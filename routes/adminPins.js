const express = require("express");
const router = express.Router();
const adminPinController = require("../controllers/adminPinController");
const { isAuthenticated, isAdmin } = require("../middleware/auth");

// Only admin can access these routes
router.get("/generate", isAuthenticated, isAdmin, adminPinController.getGeneratePage);
router.post("/generate", isAuthenticated, isAdmin, adminPinController.postGeneratePins);
router.get("/pins", isAuthenticated, isAdmin, adminPinController.getPins);
router.get("/download-csv", isAuthenticated, isAdmin, adminPinController.downloadCSV);
router.get("/download-excel", isAuthenticated, isAdmin, adminPinController.downloadExcel);

module.exports = router;
