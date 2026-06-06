const express = require("express");
const router = express.Router();
const studentController = require("../controllers/studentController");
const multer = require("multer");

// store file temporarily in "uploads/"
const upload = multer({ dest: "uploads/" });

// Routes
router.get("/biodata", studentController.getBiodataPage);
router.get("/class/:classLevel", studentController.getStudentsByClass);
router.post("/search", studentController.searchStudent);
router.post("/save", upload.single("photo"), studentController.saveStudent);
router.post("/delete", studentController.deleteStudent);
router.get("/view", studentController.viewByClass);

module.exports = router;
