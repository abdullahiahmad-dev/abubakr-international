// routes/teacherRoutes.js

const express = require("express");
const router = express.Router();
const teacherController = require("../controllers/teacherController");
const { isAuthenticated, isAdmin } = require("../middleware/auth");

// Apply authentication to all routes
router.use(isAuthenticated);

// Routes that ONLY admins can access
router.get("/add", isAdmin, teacherController.getAddTeacherPage);
router.post("/add", isAdmin, teacherController.saveTeacher);
router.get("/view", isAdmin, teacherController.viewTeachers);
router.post("/delete/:id", isAdmin, teacherController.deleteTeacher);

// Route for updating a teacher (any authenticated user can access, controller handles permissions)
router.post("/update/:id", teacherController.updateTeacher);

module.exports = router;
