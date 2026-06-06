const Subject = require("../models/Subject");
const Result = require("../models/Result");

// Render add subjects page
exports.getAddSubjects = async (req, res) => {
  res.render("subjects/add");
};

// Bulk Add Subjects
// Bulk Add Subjects
exports.postAddSubjects = async (req, res) => {
  try {
    const { classLevels, subjects, stream } = req.body;

    // Handle case where classLevels might be a string (single selection) or array
    const selectedClasses = Array.isArray(classLevels) ? classLevels : [classLevels];

    // Split comma-separated subjects into an array
    const subjectList = subjects.split(",").map(s => s.trim());

    // Process each selected class
    for (const classLevel of selectedClasses) {
      // Build query for SS classes with streams
      let query = { classLevel };
      if (["SS 1", "SS 2", "SS 3"].includes(classLevel)) {
        query.stream = stream || "General";
      }

      let record = await Subject.findOne(query);

      if (record) {
        // Merge unique subjects instead of overwriting
        record.subjects = [...new Set([...record.subjects, ...subjectList])];
        await record.save();
      } else {
        await Subject.create({
          classLevel,
          stream: ["SS 1", "SS 2", "SS 3"].includes(classLevel) ? (stream || "General") : "General",
          subjects: subjectList,
        });
      }
    }

    // Redirect to view page with the first selected class
    const firstClass = selectedClasses[0];
    res.redirect(
      `/subjects/view?classLevel=${firstClass}${
        ["SS 1", "SS 2", "SS 3"].includes(firstClass)
          ? `&stream=${stream || "General"}`
          : ""
      }`
    );
  } catch (err) {
    console.error("Error adding subjects:", err);
    res.status(500).send("Server Error");
  }
};

// View subjects for a class
exports.viewSubjects = async (req, res) => {
  try {
    const { classLevel, stream } = req.query;
    let record = null;
    let query = { classLevel };

    if (classLevel && (classLevel === "SS 1" || classLevel === "SS 2" || classLevel === "SS 3")) {
      query.stream = stream || "General";
    }

    if (classLevel) {
      record = await Subject.findOne(query);
    }

    res.render("subjects/view", { 
      record, 
      selectedClass: classLevel || "", 
      stream: stream || "General" 
    });
  } catch (err) {
    console.error("Error viewing subjects:", err);
    res.status(500).send("Server Error");
  }
};

// Add single subject
exports.addSingleSubject = async (req, res) => {
  try {
    const { classLevel, subject, stream } = req.body;
    let query = { classLevel };

    if (classLevel && (classLevel === "SS 1" || classLevel === "SS 2" || classLevel === "SS 3")) {
      query.stream = stream || "General";
    }

    let record = await Subject.findOne(query);
    if (!record) {
      record = await Subject.create({ 
        classLevel, 
        stream: classLevel && (classLevel === "SS 1" || classLevel === "SS 2" || classLevel === "SS 3") ? (stream || "General") : "General",
        subjects: [subject] 
      });
    } else {
      if (!record.subjects.includes(subject)) {
        record.subjects.push(subject);
        await record.save();
      }
    }

    res.redirect(`/subjects/view?classLevel=${classLevel}${classLevel && (classLevel === "SS 1" || classLevel === "SS 2" || classLevel === "SS 3") ? `&stream=${stream || 'General'}` : ''}`);
  } catch (err) {
    console.error("Error adding single subject:", err);
    res.status(500).send("Server Error");
  }
};
exports.editSubject = async (req, res) => {
  try {
    const { classLevel, oldSubject, newSubject, stream } = req.body;
    let query = { classLevel };

    if (classLevel && (classLevel === "SS 1" || classLevel === "SS 2" || classLevel === "SS 3")) {
      query.stream = stream || "General";
    }

    // Find the record
    const subjectRecord = await Subject.findOne(query);
    
    if (!subjectRecord) {
      return res.status(404).send("Subject record not found");
    }

    // Update the subject name in the array
    const subjectIndex = subjectRecord.subjects.indexOf(oldSubject);
    if (subjectIndex !== -1) {
      subjectRecord.subjects[subjectIndex] = newSubject;
      await subjectRecord.save();
      
      // Also update any existing results that reference the old subject
      // CORRECTED: Just use 'subject' field directly, not 'subject.name'
      await Result.updateMany(
        { 
          classLevel,
          subject: oldSubject 
        },
        { $set: { subject: newSubject } }
      );
    }

    res.redirect(`/subjects/view?classLevel=${classLevel}${classLevel && (classLevel === "SS 1" || classLevel === "SS 2" || classLevel === "SS 3") ? `&stream=${stream || 'General'}` : ''}`);
  } catch (err) {
    console.error("Error editing subject:", err);
    res.status(500).send("Server Error");
  }
};

// Delete a subject
exports.deleteSubject = async (req, res) => {
  try {
    const { classLevel, subject, stream } = req.body;
    let query = { classLevel };

    if (classLevel && (classLevel === "SS 1" || classLevel === "SS 2" || classLevel === "SS 3")) {
      query.stream = stream || "General";
    }

    await Subject.updateOne(
      query,
      { $pull: { subjects: subject } }  // removes the subject from array
    );

    res.redirect(`/subjects/view?classLevel=${classLevel}${classLevel && (classLevel === "SS 1" || classLevel === "SS 2" || classLevel === "SS 3") ? `&stream=${stream || 'General'}` : ''}`);
  } catch (err) {
    console.error("Error deleting subject:", err);
    res.status(500).send("Server Error");
  }
};
