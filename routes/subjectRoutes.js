// subjectRoutes.js
const express = require("express");
const router = express.Router();
const subjectController = require("../controllers/subjectController");

// Add/Update subjects
router.get("/add", subjectController.getAddSubjects);
router.post("/add", subjectController.postAddSubjects);

// View subjects
router.get("/view", subjectController.viewSubjects);

// Add a single subject
router.post("/add-single", subjectController.addSingleSubject);

// Delete a subject
router.post("/delete", subjectController.deleteSubject);
// Add this to your subject routes
router.post('/edit', subjectController.editSubject);
module.exports = router;
