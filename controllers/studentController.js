const Student = require("../models/Student");
const { cloudinary } = require("../config/cloudinary");
const fs = require("fs");

// Load page
exports.getBiodataPage = async (req, res) => {
  res.render("students/biodata", { student: null, students: [], selectedClass: null });
};

// Load admin numbers when class selected (AJAX)
exports.getStudentsByClass = async (req, res) => {
  const { classLevel } = req.params;
  try {
    const students = await Student.find({ classLevel }).select("adminNo fullName");
    res.json(students);
  } catch (err) {
    res.status(500).json({ error: "Error fetching students" });
  }
};

// Search student by adminNo
exports.searchStudent = async (req, res) => {
  const { adminNo } = req.body;
  try {
    const student = await Student.findOne({ adminNo });
    res.render("students/biodata", { student, students: [], selectedClass: student?.classLevel });
  } catch (err) {
    res.status(500).send("Error searching student");
  }
};

// Save or update student
exports.saveStudent = async (req, res) => {
  try {
    const { adminNo, fullName, gender, dob, stream, classLevel, parentName, parentPhone, address, originalAdminNo } = req.body;
    let photoUrl = req.body.existingPhoto;

    if (req.file) {
      try {
        const result = await cloudinary.uploader.upload(req.file.path, { 
          folder: "school-biodata" 
        });
        photoUrl = result.secure_url;

        // remove file from local "uploads/" after upload
        fs.unlinkSync(req.file.path);
      } catch (uploadError) {
        console.error("Cloudinary upload error:", uploadError);
        return res.status(500).send("Error uploading image");
      }
    }

    // Use originalAdminNo if it exists (for updates), otherwise use adminNo (for new students)
    const queryId = originalAdminNo || adminNo;
    
    const student = await Student.findOneAndUpdate(
      { adminNo: queryId }, // Use the original admin number to find the student
      { adminNo, fullName, gender, dob, classLevel, stream, parentName, parentPhone, address, photoUrl },
      { upsert: true, new: true }
    );

    res.render("students/biodata", { 
      student, 
      students: [], 
      selectedClass: null, 
      successMessage: `${student.fullName} has been successfully created/updated!`
    });
  } catch (err) {
    console.error("Save student error:", err);
    res.status(500).send("Error saving student");
  }
};

// Delete student
exports.deleteStudent = async (req, res) => {
  const { adminNo } = req.body;
  try {
    await Student.findOneAndDelete({ adminNo });
    res.redirect("/students/biodata");
  } catch (err) {
    res.status(500).send("Error deleting student");
  }
};

// Render the view page
exports.viewByClass = async (req, res) => {
  try {
    const { classLevel } = req.query;
    let students = [];

    if (classLevel) {
      students = await Student.find({ classLevel }).sort({ fullName: 1 });
    }

    res.render("students/view", { 
      students, 
      selectedClass: classLevel || "" 
    });
  } catch (err) {
    console.error("Error loading students:", err);
    res.status(500).send("Server Error");
  }
};
