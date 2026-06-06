// controllers/pinController.js
const Pin = require("../models/Pin");
const Student = require("../models/Student");
const Result = require("../models/Result");
const Session = require("../models/Session");
const SchoolProfile = require("../models/SchoolProfile"); // Add this import
const SchoolInfo = require("../models/SchoolInfo"); // Add this import
const { calculateStudentStats } = require("../utils/resultUtils");

// Show result checking page
exports.checkResultPage = async (req, res) => {
  try {
    const sessions = await Session.find().sort({ year: -1 });
    const schoolProfile = await SchoolProfile.findOne({}); // Get school profile
    
    res.render("results/checkResult", {
      sessions,
      schoolProfile, // Pass school profile to template
      error: null,
      results: null,
      studentResultsList: null,
      stats: null,
      student: null,
      classLevel: null,
      sessionId: null,
      term: null,
      adminNo: null,
    });
  } catch (err) {
    console.error(err);
    res.status(500).send("Error loading page");
  }
};

// Handle PIN verification
exports.checkResult = async (req, res) => {
  try {
    const { adminNo, pinCode, sessionId, term } = req.body;
    
    // Get sessions for the form
    const sessions = await Session.find().sort({ year: -1 });
    
    // Get school profile information
    const schoolProfile = await SchoolProfile.findOne({});

    // Find student
    const student = await Student.findOne({ adminNo });
    if (!student) {
      return res.render("results/checkResult", {
        sessions,
        schoolProfile, // Pass school profile to template
        error: "Student not found",
        results: null,
        studentResultsList: null,
        stats: null,
        student: null,
        classLevel: null,
        sessionId: null,
        term: null,
        adminNo: null,
      });
    }

    // Validate PIN - Add error handling here
    let pin;
    try {
      pin = await Pin.findOne({ code: pinCode });
    } catch (pinError) {
      console.error("Error finding PIN:", pinError);
      return res.render("results/checkResult", {
        sessions,
        schoolProfile, // Pass school profile to template
        error: "Error validating PIN. Please try again.",
        results: null,
        studentResultsList: null,
        stats: null,
        student: null,
        classLevel: null,
        sessionId: null,
        term: null,
        adminNo: null,
      });
    }
    
    if (!pin) {
      return res.render("results/checkResult", {
        sessions,
        schoolProfile, // Pass school profile to template
        error: "Invalid PIN",
        results: null,
        studentResultsList: null,
        stats: null,
        student: null,
        classLevel: null,
        sessionId: null,
        term: null,
        adminNo: null,
      });
    }

    // Check if PIN is expired
    if (pin.status === 'expired') {
      return res.render("results/checkResult", {
        sessions,
        schoolProfile, // Pass school profile to template
        error: "This PIN has expired (reached maximum usage)",
        results: null,
        studentResultsList: null,
        stats: null,
        student: null,
        classLevel: null,
        sessionId: null,
        term: null,
        adminNo: null,
      });
    }

    // Check if PIN is already in use by another student
    if (pin.status === 'active' && pin.firstUsedBy.toString() !== student._id.toString()) {
      return res.render("results/checkResult", {
        sessions,
        schoolProfile, // Pass school profile to template
        error: "This PIN is already in use by another student",
        results: null,
        studentResultsList: null,
        stats: null,
        student: null,
        classLevel: null,
        sessionId: null,
        term: null,
        adminNo: null,
      });
    }

    // Get school information for the current session and term
    let schoolInfo = null;
    if (sessionId && term) {
      schoolInfo = await SchoolInfo.findOne({
        session: sessionId,
        term: term
      });
    }

    // Get student results
    const results = await Result.find({
      student: student._id,
      session: sessionId,
      term,
    })
      .populate("session")
      .populate("student")
      .sort("subject");

    if (!results.length) {
      return res.render("results/checkResult", {
        sessions,
        schoolProfile, // Pass school profile to template
        error: "Result not found",
        results: null,
        studentResultsList: null,
        stats: null,
        student: null,
        classLevel: null,
        sessionId: null,
        term: null,
        adminNo: null,
      });
    }

    // Calculate statistics
    const stats = await calculateStudentStats(results, student, student.classLevel, sessionId, term);
    
    // Add next term resumption and fees information
    if (schoolInfo) {
      stats.nextTermResumption = new Date(schoolInfo.nextTermResumption).toLocaleDateString();
      
      // Determine the appropriate fee based on student's class level
      if (student.classLevel.includes('Nursery')) {
        stats.nextTermFees = `₦${schoolInfo.nurseryFees.toLocaleString()}`;
      } else if (student.classLevel.includes('Primary')) {
        stats.nextTermFees = `₦${schoolInfo.primaryFees.toLocaleString()}`;
      } else if (student.classLevel.includes('JSS')) {
        stats.nextTermFees = `₦${schoolInfo.juniorSecondaryFees.toLocaleString()}`;
      } else if (student.classLevel.includes('SS')) {
        stats.nextTermFees = `₦${schoolInfo.seniorSecondaryFees.toLocaleString()}`;
      } else {
        // Fallback for any other class levels
        stats.nextTermFees = 'To be announced';
      }
    } else {
      stats.nextTermResumption = 'To be announced';
      stats.nextTermFees = 'To be announced';
    }

    // Update PIN usage
    pin.usageCount += 1;
    pin.usedBy = `Parent of ${student.name}`;
    pin.usedAt = new Date();
    pin.studentId = student._id;
    
    // If first use, set the firstUsedBy and change status to active
    if (pin.status === 'unused') {
      pin.firstUsedBy = student._id;
      pin.status = 'active';
    }
    
    // If reached max usage, mark as expired
    if (pin.usageCount >= 5) {
      pin.status = 'expired';
    }
    
    await pin.save();

    // Render results with stats
    res.render("results/checkResult", {
      sessions,
      schoolProfile, // Pass school profile to template
      error: null,
      results,
      student,
      stats,
      studentResultsList: null,
      sessionId,
      term,
      adminNo,
      classLevel: student.classLevel,
    });
  } catch (err) {
    console.error(err);
    res.status(500).send("Error checking result");
  }
};