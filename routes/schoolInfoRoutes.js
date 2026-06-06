// routes/admin/schoolInfoRoutes.js
const express = require('express');
const router = express.Router();
const schoolInfoController = require('../controllers/schoolInfoController');
const { isAuthenticated, isAdmin } = require("../middleware/auth");




// GET /admin/school-info - List all school information
router.get('/',isAuthenticated,isAdmin, schoolInfoController.getAllSchoolInfo);

// GET /admin/school-info/add - Form to add new school information
router.get('/add', isAuthenticated, isAdmin, schoolInfoController.getSchoolInfoForm);

// GET /admin/school-info/edit/:id - Form to edit school information
router.get('/edit/:id', isAuthenticated, isAdmin, schoolInfoController.getSchoolInfoForm);

// POST /admin/school-info/add - Create new school information
router.post('/add', isAuthenticated, isAdmin, schoolInfoController.createOrUpdateSchoolInfo);

// POST /admin/school-info/edit/:id - Update school information
router.post('/edit/:id', isAuthenticated, isAdmin, schoolInfoController.createOrUpdateSchoolInfo);

// POST /admin/school-info/delete/:id - Delete school information
router.post('/delete/:id', isAuthenticated, isAdmin, schoolInfoController.deleteSchoolInfo);

// GET /admin/school-info/current - Get current school information
router.get('/current', isAuthenticated, isAdmin, schoolInfoController.getCurrentSchoolInfo);

module.exports = router;