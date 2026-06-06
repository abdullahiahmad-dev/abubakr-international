const express = require('express');
const router = express.Router();
const schoolProfileController = require('../controllers/schoolProfileController');

const {isAdmin,isAuthenticated} = require('../middleware/auth');

const multer = require("multer");


const upload = multer({ dest: "uploads/" });


router.get('/', isAdmin,isAuthenticated ,schoolProfileController.getSchoolProfile);


router.post('/', upload.single('logo'), isAdmin, isAuthenticated, schoolProfileController.upsertSchoolProfile);

module.exports = router;