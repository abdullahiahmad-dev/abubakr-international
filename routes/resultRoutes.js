const express = require("express");
const router = express.Router();
const resultController = require("../controllers/resultController");
const { isAuthenticated, isAdmin } = require("../middleware/auth");

// All steps handled by this GET using query params
router.get("/add", resultController.showForm);

// Save results
router.post("/save", resultController.saveResult);
router.get("/view", resultController.viewResult);
// Add this route to your results routes file
router.get('/download', resultController.downloadPDF);

// View result page
router.get("/viewClassResult", resultController.viewResultPage);

// Load results after selecting filters
router.post("/viewClassResult", resultController.loadResults);


module.exports = router;
