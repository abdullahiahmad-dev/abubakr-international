// controllers/promotionController.js
const Student = require("../models/Student");

// List of all class levels (from your Student model)
const classLevels = [
  "Pre-Nursery","Nursery 1","Nursery 2","Nursery 2B","Nursery 3",
  "Primary 1","Primary 2","Primary 3","Primary 4","Primary 5","Primary 6",
  "JSS 1","JSS 2","JSS 3","SS 1","SS 2","SS 3"
];

exports.getPromotionPage = async (req, res) => {
  res.render("admin/promotions", { classLevels });
};

exports.promoteStudents = async (req, res) => {
  try {
    const { sequence } = req.body; // e.g. "Nursery 1 → Nursery 2 → Nursery 3"
    const sequenceArray = sequence.split("→").map(c => c.trim());

    // Loop through sequence and promote each group to next class
    for (let i = 0; i < sequenceArray.length - 1; i++) {
      const fromClass = sequenceArray[i];
      const toClass = sequenceArray[i + 1];
      await Student.updateMany({ classLevel: fromClass }, { classLevel: toClass });
    }

    res.send("✅ Promotion completed successfully!");
  } catch (error) {
    console.error(error);
    res.status(500).send("❌ Error promoting students");
  }
};
