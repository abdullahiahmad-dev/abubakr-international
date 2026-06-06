// routes/promotionRoutes.js
const express = require("express");
const router = express.Router();
const promotionController = require("../controllers/promotionController");
const { isAuthenticated, isAdmin } = require("../middleware/auth");

router.get("/promotion",isAuthenticated,isAdmin, promotionController.getPromotionPage);
router.post("/promote",isAuthenticated,isAdmin, promotionController.promoteStudents);

module.exports = router;
