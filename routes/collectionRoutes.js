// routes/collectionRoutes.js
const express = require('express');
const router = express.Router();
const collectionController = require('../controllers/collectionController');
const { isAuthenticated, isAdmin } = require("../middleware/auth");
// Collection routes
router.get('/collections/new', isAuthenticated, isAdmin, collectionController.getCreateCollection);
router.post('/collections', isAuthenticated, isAdmin, collectionController.postCreateCollection);
router.get('/collections', isAuthenticated, isAdmin, collectionController.getCollections);
router.get('/collections/:id', isAuthenticated, isAdmin, collectionController.getCollectionDetails);
router.post('/collections/:id/payment', isAuthenticated, isAdmin, collectionController.postRecordPayment);

module.exports = router;