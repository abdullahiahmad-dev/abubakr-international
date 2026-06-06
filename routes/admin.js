const express = require("express");
const router = express.Router();
const sessionController = require("../controllers/sessionController");
const { isAuthenticated, isAdmin } = require("../middleware/auth");

// Session routes
router.get("/sessions", isAuthenticated, isAdmin, sessionController.getSessions);
router.post("/sessions", isAuthenticated, isAdmin, sessionController.createSession);
router.post("/sessions/:id/delete", isAuthenticated, isAdmin, sessionController.deleteSession);



module.exports = router;


