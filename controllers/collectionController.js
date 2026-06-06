// controllers/collectionController.js
const Collection = require("../models/Collection");

// GET: Show form to create a new collection
exports.getCreateCollection = async (req, res) => {
  try {
    res.render("collections/create", {
      error: null
    });
  } catch (err) {
    console.error(err);
    res.status(500).send("Error loading page");
  }
};

// POST: Create a new collection
exports.postCreateCollection = async (req, res) => {
  try {
    const { personName, totalAmount, description } = req.body;
    
    // Create new collection
    const newCollection = new Collection({
      personName,
      totalAmount: parseFloat(totalAmount),
      collectedAmount: 0,
      remainingAmount: parseFloat(totalAmount),
      status: 'pending',
      description,
      createdBy: "Admin" // Hardcoded to "Admin" instead of req.user
    });

    await newCollection.save();
    
    // Redirect to collections list
    res.redirect("/collections");
  } catch (err) {
    console.error(err);
    res.render("collections/create", {
      error: "Error creating collection"
    });
  }
};

// GET: Show all collections
exports.getCollections = async (req, res) => {
  try {
    const collections = await Collection.find()
      .sort({ createdAt: -1 });
    
    res.render("collections/index", {
      collections
    });
  } catch (err) {
    console.error(err);
    res.status(500).send("Error fetching collections");
  }
};

// GET: Show collection details
exports.getCollectionDetails = async (req, res) => {
  try {
    const collection = await Collection.findById(req.params.id);
    
    if (!collection) {
      return res.status(404).send("Collection not found");
    }
    
    res.render("collections/details", {
      collection
    });
  } catch (err) {
    console.error(err);
    res.status(500).send("Error fetching collection details");
  }
};

// POST: Record a payment
exports.postRecordPayment = async (req, res) => {
  try {
    const { amount, note } = req.body;
    const collectionId = req.params.id;
    
    const collection = await Collection.findById(collectionId);
    
    if (!collection) {
      return res.status(404).send("Collection not found");
    }
    
    const paymentAmount = parseFloat(amount);
    
    // Check if payment amount is valid
    if (paymentAmount <= 0) {
      return res.render("collections/details", {
        collection,
        error: "Payment amount must be greater than 0"
      });
    }
    
    // Check if payment exceeds remaining amount
    if (paymentAmount > collection.remainingAmount) {
      return res.render("collections/details", {
        collection,
        error: "Payment amount exceeds remaining balance"
      });
    }
    
    // Add payment to history
    collection.paymentHistory.push({
      amount: paymentAmount,
      collectedBy: "Admin", // Hardcoded to "Admin" instead of req.user
      note
    });
    
    // Update collected amount
    collection.collectedAmount += paymentAmount;
    
    // Save the collection (pre-save hook will update remaining amount and status)
    await collection.save();
    
    // Redirect back to collection details
    res.redirect(`/collections/${collectionId}`);
  } catch (err) {
    console.error(err);
    res.status(500).send("Error recording payment");
  }
};