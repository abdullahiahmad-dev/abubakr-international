const mongoose = require("mongoose");
const Student = require("../models/Student");
const Subject = require("../models/Subject");
const Result = require("../models/Result");
const Session = require("../models/Session");
const { ordinalSuffix, pickRemark } = require("../utils/format");

exports.showForm = async (req, res) => {
  try {
    const { classLevel = "", adminNo = "", sessionId = "", term = "", stream = "" } = req.query;

    // Get all sessions for dropdown
    const sessions = await Session.find().sort({ year: -1 });

    let students = [];
    let student = null;
    let subjects = [];

    // If class is chosen → load its students
    if (classLevel) {
      let query = { classLevel };
      
      // If it's an SS class and stream is specified, filter by stream
      if (classLevel.startsWith("SS") && stream) {
        query.stream = stream;
      }
      
      students = await Student.find(query).sort("adminNo");
    }

    // If class + admin + session + term selected → load student + subjects (+ existing results)
    if (classLevel && adminNo && sessionId && term) {
      student = await Student.findOne({ adminNo });

      if (student) {
        // For SS classes, load both General subjects and stream-specific subjects
        if (student.classLevel.startsWith("SS")) {
          // Find General subjects
          const generalSubjectsDoc = await Subject.findOne({
            classLevel: student.classLevel,
            stream: "General"
          });
          
          // Find stream-specific subjects
          const streamSubjectsDoc = await Subject.findOne({
            classLevel: student.classLevel,
            stream: student.stream || "General"
          });
          
          // Combine subjects from both General and stream-specific
          let allSubjects = [];
          
          if (generalSubjectsDoc && Array.isArray(generalSubjectsDoc.subjects)) {
            allSubjects = [...allSubjects, ...generalSubjectsDoc.subjects];
          }
          
          if (streamSubjectsDoc && Array.isArray(streamSubjectsDoc.subjects) && 
              streamSubjectsDoc.stream !== "General") {
            allSubjects = [...allSubjects, ...streamSubjectsDoc.subjects];
          }
          
          // Remove duplicates
          allSubjects = [...new Set(allSubjects)];
          
          subjects = allSubjects.map(name => ({
            name,
            firstCA: "",
            secondCA: "",
            exam: "",
            grade: ""
          }));
        } else {
          // For non-SS classes, just load subjects for the class
          const subjectDoc = await Subject.findOne({ 
            classLevel: student.classLevel 
          });

          if (subjectDoc && Array.isArray(subjectDoc.subjects)) {
            subjects = subjectDoc.subjects.map(name => ({
              name,
              firstCA: "",
              secondCA: "",
              exam: "",
              grade: ""
            }));
          }
        }

        const existingResults = await Result.find({
          student: student._id,
          session: sessionId,
          term
        }).populate("session");

        if (existingResults.length) {
          // Create a map of all existing results by subject name for easier lookup
          const resultsMap = {};
          existingResults.forEach(r => {
            resultsMap[r.subject] = r;
          });

          // Merge scores - handle both exact matches and potential renamed subjects
          subjects = subjects.map(s => {
            // First try exact match
            let r = resultsMap[s.name];
            
            // If no exact match, try to find a result with a similar subject name
            // This handles cases where the subject was renamed
            if (!r) {
              const resultKeys = Object.keys(resultsMap);
              for (const key of resultKeys) {
                // Simple similarity check - you can make this more sophisticated
                if (key.toLowerCase().includes(s.name.toLowerCase()) || 
                    s.name.toLowerCase().includes(key.toLowerCase())) {
                  r = resultsMap[key];
                  // Update the result to use the new subject name
                  Result.updateOne(
                    { _id: r._id },
                    { subject: s.name }
                  ).catch(err => console.error("Error updating subject name:", err));
                  break;
                }
              }
            }
            
            if (r) {
              return {
                name: s.name,
                firstCA: r.firstCA ?? "",
                secondCA: r.secondCA ?? "",
                exam: r.exam ?? "",
                grade: r.grade || ""
              };
            }
            return s;
          });

          // Pull common fields from the FIRST result row
          const firstResult = existingResults[0];
          req.extras = {
            psychomotor: firstResult.psychomotor || {},
            daysPresent: firstResult.daysPresent || "",
            daysAbsent: firstResult.daysAbsent || "",
            generalConduct: firstResult.generalConduct || "",
            formTeacherRemark: firstResult.formTeacherRemark || "",
            principalRemark: firstResult.principalRemark || ""
          };
        }
      }
    }

    return res.render("results/addResult", {
      success: req.query.success === "1",
      classLevel,
      adminNo,
      sessionId,
      term,
      stream,
      sessions,
      students,
      student,
      subjects,
      extras: req.extras || {}
    });
  } catch (err) {
    console.error("showForm error:", err);
    return res.status(500).send("Server error");
  }
};

exports.saveResult = async (req, res) => {
  try {
    const { studentId, sessionId, term } = req.body;
    let classLevel = req.body.classLevel;

    // If classLevel wasn't provided in the form, derive it from student
    if (!classLevel) {
      const st = await Student.findById(studentId);
      if (st) classLevel = st.classLevel;
    }

    // Get the student to check their stream
    const student = await Student.findById(studentId);
    
    // For SS classes, we need to check if subjects exist in either General or stream-specific
    let allSubjects = [];
    
    if (classLevel.startsWith("SS")) {
      // Find General subjects
      const generalSubjectsDoc = await Subject.findOne({
        classLevel: classLevel,
        stream: "General"
      });
      
      // Find stream-specific subjects
      const streamSubjectsDoc = await Subject.findOne({
        classLevel: classLevel,
        stream: student.stream || "General"
      });
      
      // Combine subjects from both General and stream-specific
      if (generalSubjectsDoc && Array.isArray(generalSubjectsDoc.subjects)) {
        allSubjects = [...allSubjects, ...generalSubjectsDoc.subjects];
      }
      
      if (streamSubjectsDoc && Array.isArray(streamSubjectsDoc.subjects) && 
          streamSubjectsDoc.stream !== "General") {
        allSubjects = [...allSubjects, ...streamSubjectsDoc.subjects];
      }
      
      // Remove duplicates
      allSubjects = [...new Set(allSubjects)];
    } else {
      // For non-SS classes, just get subjects for the class
      const subjectDoc = await Subject.findOne({ classLevel });
      if (subjectDoc && Array.isArray(subjectDoc.subjects)) {
        allSubjects = subjectDoc.subjects;
      }
    }

    if (!allSubjects.length) {
      return res.redirect("/results/add?error=nosubjects");
    }

    let totalSum = 0;
    let subjectCount = allSubjects.length;

    // iterate by index (matches the view inputs named firstCA_<idx>, etc.)
    for (let i = 0; i < allSubjects.length; i++) {
      const subjName = allSubjects[i];

      const firstCA = Number(req.body[`firstCA_${i}`] || 0);
      const secondCA = Number(req.body[`secondCA_${i}`] || 0);
      const exam = Number(req.body[`exam_${i}`] || 0);
      const total = firstCA + secondCA + exam;

      let grade = req.body[`grade_${i}`];
      if (!grade) {
        grade = total >= 70 ? "A"
              : total >= 60 ? "B"
              : total >= 50 ? "C"
              : total >= 45 ? "D"
              : total >= 40 ? "E"
              : "F";
      }

      totalSum += total;

      await Result.findOneAndUpdate(
        { student: studentId, session: sessionId, term, subject: subjName },
        {
          student: studentId,
          classLevel,
          session: sessionId,
          term,
          subject: subjName,
          firstCA,
          secondCA,
          exam,
          total,
          grade,
          // New common fields
          psychomotor: {
            punctuality: req.body.punctuality,
            independency: req.body.independency,
            physicalHealth: req.body.physicalHealth,
            classroomBehaviour: req.body.classroomBehaviour,
            homework: req.body.homework,
            selfControl: req.body.selfControl,
            relationship: req.body.relationship,
            spokenEnglish: req.body.spokenEnglish,
            schoolProperty: req.body.schoolProperty,
            creativity: req.body.creativity,
            attentiveness: req.body.attentiveness,
            emotionalStability: req.body.emotionalStability,
            cleanliness: req.body.cleanliness,
            gamesSports: req.body.gamesSports
          },
          daysPresent: req.body.daysPresent,
          daysAbsent: req.body.daysAbsent,
          generalConduct: req.body.generalConduct,
          formTeacherRemark: req.body.formTeacherRemark,
          principalRemark: req.body.principalRemark,
        },
        { upsert: true, new: true }
      );
    }

    // Calculate overall grade once
    const avg = totalSum / subjectCount;
    let overallGrade = "F";
    if (avg >= 70) overallGrade = "A";
    else if (avg >= 60) overallGrade = "B";
    else if (avg >= 50) overallGrade = "C";
    else if (avg >= 45) overallGrade = "D";
    else if (avg >= 40) overallGrade = "E";

    // Update all results for that student with same overall grade
    await Result.updateMany(
      { student: studentId, session: sessionId, term },
      { overallGrade }
    );

    return res.redirect("/results/add?success=1");
  } catch (err) {
    console.error("saveResult error:", err);
    return res.status(500).send("Server error");
  }
};

const ejs = require("ejs");

// Add these imports at the top
const SchoolInfo = require('../models/SchoolInfo');
const SchoolProfile = require('../models/SchoolProfile');

exports.viewResult = async (req, res) => {
  try {
    const { classLevel = "", adminNo = "", sessionId = "", term = "", calculateByStream = "false" } = req.query;

    const sessions = await Session.find().sort({ year: -1 });
    let students = [];
    let student = null;
    let results = [];
    let stats = {};
    let studentResultsList = [];
    
    // Get school profile information
    let schoolProfile = await SchoolProfile.findOne({});

    if (classLevel) {
      students = await Student.find({ classLevel }).sort("adminNo");
    } else {
      students = await Student.find().sort("classLevel adminNo");
    }

    // Get school information for the current session and term
    let schoolInfo = null;
    if (sessionId && term) {
      schoolInfo = await SchoolInfo.findOne({
        session: sessionId,
        term: term
      });
    }

    if (sessionId && term) {
      if (adminNo) {
        let studentQuery = { adminNo };
        if (classLevel) {
          studentQuery.classLevel = classLevel;
        }
        
        student = await Student.findOne(studentQuery);
        if (student) {
          results = await Result.find({
            student: student._id,
            session: sessionId,
            term,
          })
            .populate("session")
            .sort("subject");

          if (results.length) {
            stats = await calculateStudentStats(results, student, classLevel, sessionId, term, calculateByStream === "true");
            
            // --- UPDATED FEE ASSIGNMENT LOGIC ---
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
          }
        }
      } else {
        // ... (logic for multiple students)
        const studentIds = students.map(s => s._id);
        const allResults = await Result.find({
          student: { $in: studentIds },
          session: sessionId,
          term,
        })
          .populate("session")
          .populate("student")
          .sort("student subject");

        const resultsByStudent = {};
        allResults.forEach(result => {
          const studentId = result.student._id.toString();
          if (!resultsByStudent[studentId]) {
            resultsByStudent[studentId] = {
              student: result.student,
              results: []
            };
          }
          resultsByStudent[studentId].results.push(result);
        });

        for (const studentId in resultsByStudent) {
          const studentData = resultsByStudent[studentId];
          if (studentData.results.length) {
            const studentStats = await calculateStudentStats(
              studentData.results, 
              studentData.student, 
              studentData.student.classLevel, 
              sessionId, 
              term,
              calculateByStream === "true"
            );
            
            // --- UPDATED FEE ASSIGNMENT LOGIC ---
            if (schoolInfo) {
              studentStats.nextTermResumption = new Date(schoolInfo.nextTermResumption).toLocaleDateString();
              
              if (studentData.student.classLevel.includes('Nursery')) {
                studentStats.nextTermFees = `₦${schoolInfo.nurseryFees.toLocaleString()}`;
              } else if (studentData.student.classLevel.includes('Primary')) {
                studentStats.nextTermFees = `₦${schoolInfo.primaryFees.toLocaleString()}`;
              } else if (studentData.student.classLevel.includes('JSS')) {
                studentStats.nextTermFees = `₦${schoolInfo.juniorSecondaryFees.toLocaleString()}`;
              } else if (studentData.student.classLevel.includes('SS')) {
                studentStats.nextTermFees = `₦${schoolInfo.seniorSecondaryFees.toLocaleString()}`;
              } else {
                studentStats.nextTermFees = 'To be announced';
              }
            } else {
              studentStats.nextTermResumption = 'To be announced';
              studentStats.nextTermFees = 'To be announced';
            }
            
            studentResultsList.push({
              student: studentData.student,
              results: studentData.results,
              stats: studentStats
            });
          }
        }

        studentResultsList.sort((a, b) => {
          if (a.student.classLevel < b.student.classLevel) return -1;
          if (a.student.classLevel > b.student.classLevel) return 1;
          if (a.student.adminNo < b.student.adminNo) return -1;
          if (a.student.adminNo > b.student.adminNo) return 1;
          return 0;
        });
      }
    }

    return res.render("results/viewResult", {
      classLevel,
      adminNo,
      sessionId,
      term,
      calculateByStream,
      sessions,
      students,
      student,
      results,
      stats,
      studentResultsList: studentResultsList.length > 0 ? studentResultsList : null,
      schoolProfile // Pass the school profile to the template
    });
  } catch (err) {
    console.error("viewResult error:", err);
    return res.status(500).send("Server error");
  }
};

// Helper function to calculate student statistics
async function calculateStudentStats(results, student, classLevel, sessionId, term, calculateByStream = false) {
  const totalObtained = results.reduce((sum, r) => sum + (r.total || 0), 0);
  const totalPossible = results.length * 100;
  const avg = totalObtained / results.length;

  // Calculate overall grade
  let overallGrade = "F";
  if (avg >= 70) overallGrade = "A";
  else if (avg >= 60) overallGrade = "B";
  else if (avg >= 50) overallGrade = "C";
  else if (avg >= 45) overallGrade = "D";
  else if (avg >= 40) overallGrade = "E";

  // Calculate class statistics - different logic for SS classes when calculateByStream is true
  let classResults = [];
  
  if (calculateByStream && student.classLevel.startsWith("SS") && student.stream) {
    // Calculate position within the same stream only
    classResults = await Result.aggregate([
      { 
        $match: { 
          classLevel: classLevel || student.classLevel, 
          session: new mongoose.Types.ObjectId(sessionId),
          term 
        } 
      },
      {
        $lookup: {
          from: "students",
          localField: "student",
          foreignField: "_id",
          as: "studentData"
        }
      },
      {
        $unwind: "$studentData"
      },
      {
        $match: {
          "studentData.stream": student.stream
        }
      },
      { $group: { _id: "$student", totalScore: { $sum: "$total" } } }
    ]);
  } else {
    // Calculate position across all students in the class
    classResults = await Result.aggregate([
      { 
        $match: { 
          classLevel: classLevel || student.classLevel, 
          session: new mongoose.Types.ObjectId(sessionId),
          term 
        } 
      },
      { $group: { _id: "$student", totalScore: { $sum: "$total" } } }
    ]);
  }

  const classTotals = classResults.map(r => r.totalScore);
  const classMax = Math.max(...classTotals);
  const classMin = Math.min(...classTotals);
  const sorted = [...classTotals].sort((a, b) => b - a);
  const position = sorted.indexOf(totalObtained) + 1;
  const classSize = classTotals.length;

  // Calculate subject positions and stats
  for (let r of results) {
    let subjectResults = [];
    
    if (calculateByStream && student.classLevel.startsWith("SS") && student.stream) {
      // Calculate subject position within the same stream only
      subjectResults = await Result.aggregate([
        {
          $match: {
            classLevel: classLevel || student.classLevel,
            session: new mongoose.Types.ObjectId(sessionId),
            term,
            subject: r.subject,
          }
        },
        {
          $lookup: {
            from: "students",
            localField: "student",
            foreignField: "_id",
            as: "studentData"
          }
        },
        {
          $unwind: "$studentData"
        },
        {
          $match: {
            "studentData.stream": student.stream
          }
        }
      ]);
    } else {
      // Calculate subject position across all students
      subjectResults = await Result.find({
        classLevel: classLevel || student.classLevel,
        session: sessionId,
        term,
        subject: r.subject,
      }).populate("student");
    }

    subjectResults.sort((a, b) => (b.total || 0) - (a.total || 0));

    const subjectPos = subjectResults.findIndex(sr => {
      if (!sr.student || !sr.student._id) return false;
      return String(sr.student._id) === String(student._id);
    }) + 1;

    const subjectMin = subjectResults[subjectResults.length - 1]?.total || 0;
    const subjectMax = subjectResults[0]?.total || 0;

    let remark = "";
    switch (r.grade) {
      case "A": remark = "Excellent"; break;
      case "B": remark = "Very Good"; break;
      case "C": remark = "Good"; break;
      case "D": remark = "Fair"; break;
      case "E": remark = "Poor"; break;
      case "F": remark = "Fail"; break;
      default: remark = "-";
    }

    r.subjectPosition = ordinalSuffix(subjectPos);
    r.subjectMin = subjectMin;
    r.subjectMax = subjectMax;
    r.subjectRemark = remark;
  }

  // Get the first result for common fields
  const firstRow = results[0];
  
  return {
    totalObtained,
    totalPossible,
    avg: avg.toFixed(2),
    overallGrade,
    classMax,
    classMin,
    position: ordinalSuffix(position),
    classSize,
    daysPresent: firstRow.daysPresent,
    daysAbsent: firstRow.daysAbsent,
    generalConduct: firstRow.generalConduct,
    formTeacherRemark: firstRow.formTeacherRemark,
    principalRemark: firstRow.principalRemark,
    psychomotor: firstRow.psychomotor,
    calculatedByStream: calculateByStream && student.classLevel.startsWith("SS") && student.stream
  };
}

// controllers/resultController.js
// Make sure these are uncommented and properly imported
// Hardcoded class levels
const CLASS_LEVELS = [
  "Pre-Nursery","Nursery 1","Nursery 2" ,"Nursery 2B","Nursery 3",
  "Primary 1","Primary 2","Primary 3","Primary 4","Primary 5","Primary 6",
  "JSS 1","JSS 2","JSS 3"
];

exports.viewResultPage = async (req, res) => {
  try {
    const sessions = await Session.find().sort({ year: -1 });
    res.render("results/viewResults", {
      classes: CLASS_LEVELS,
      sessions,
      results: null,
      filters: null
    });
  } catch (err) {
    console.error(err);
    res.status(500).send("Error loading view result page");
  }
};

exports.loadResults = async (req, res) => {
  try {
    const { classLevel, sessionId, term } = req.body;
    const sessions = await Session.find().sort({ year: -1 });

    // Aggregate results: keep subjects + scores per student
    let results = await Result.aggregate([
      {
        $match: {
          classLevel,
          session: new mongoose.Types.ObjectId(sessionId),
          term
        }
      },
      {
        $group: {
          _id: "$student", 
          totalScore: { $sum: "$total" },
          subjectCount: { $sum: 1 },
          scores: {
            $push: {
              subject: "$subject",
              score: "$total"
            }
          }
        }
      },
      { $sort: { totalScore: -1 } }
    ]);

    // Populate student details
    results = await Student.populate(results, { path: "_id" });

    // Assign positions
    results.forEach((r, i) => {
      r.position = i + 1;
    });

    res.render("results/viewResults", {
      classes: CLASS_LEVELS,
      sessions,
      results,
      filters: { classLevel, sessionId, term }
    });
  } catch (err) {
    console.error(err);
    res.status(500).send("Error loading results");
  }
};

// Add this to your resultController.js
const pdf = require('html-pdf');
const path = require('path');
const fs = require('fs');

exports.downloadPDF = async (req, res) => {
  try {
    const { classLevel = "", adminNo = "", sessionId = "", term = "", calculateByStream = "false" } = req.query;
    
    // Get the same data as in viewResult
    const sessions = await Session.find().sort({ year: -1 });
    let students = [];
    let student = null;
    let results = [];
    let stats = {};
    let studentResultsList = [];
    
    // Get school profile information
    let schoolProfile = await SchoolProfile.findOne({});

    if (classLevel) {
      students = await Student.find({ classLevel }).sort("adminNo");
    } else {
      students = await Student.find().sort("classLevel adminNo");
    }

    // Get school information for the current session and term
    let schoolInfo = null;
    if (sessionId && term) {
      schoolInfo = await SchoolInfo.findOne({
        session: sessionId,
        term: term
      });
    }

    if (sessionId && term) {
      if (adminNo) {
        let studentQuery = { adminNo };
        if (classLevel) {
          studentQuery.classLevel = classLevel;
        }
        
        student = await Student.findOne(studentQuery);
        if (student) {
          results = await Result.find({
            student: student._id,
            session: sessionId,
            term,
          })
            .populate("session")
            .sort("subject");

          if (results.length) {
            stats = await calculateStudentStats(results, student, classLevel, sessionId, term, calculateByStream === "true");
            
            // Fee assignment logic
            if (schoolInfo) {
              stats.nextTermResumption = new Date(schoolInfo.nextTermResumption).toLocaleDateString();
              
              if (student.classLevel.includes('Nursery')) {
                stats.nextTermFees = `₦${schoolInfo.nurseryFees.toLocaleString()}`;
              } else if (student.classLevel.includes('Primary')) {
                stats.nextTermFees = `₦${schoolInfo.primaryFees.toLocaleString()}`;
              } else if (student.classLevel.includes('JSS')) {
                stats.nextTermFees = `₦${schoolInfo.juniorSecondaryFees.toLocaleString()}`;
              } else if (student.classLevel.includes('SS')) {
                stats.nextTermFees = `₦${schoolInfo.seniorSecondaryFees.toLocaleString()}`;
              } else {
                stats.nextTermFees = 'To be announced';
              }
            } else {
              stats.nextTermResumption = 'To be announced';
              stats.nextTermFees = 'To be announced';
            }
          }
        }
      } else {
        // Logic for multiple students
        const studentIds = students.map(s => s._id);
        const allResults = await Result.find({
          student: { $in: studentIds },
          session: sessionId,
          term,
        })
          .populate("session")
          .populate("student")
          .sort("student subject");

        const resultsByStudent = {};
        allResults.forEach(result => {
          const studentId = result.student._id.toString();
          if (!resultsByStudent[studentId]) {
            resultsByStudent[studentId] = {
              student: result.student,
              results: []
            };
          }
          resultsByStudent[studentId].results.push(result);
        });

        for (const studentId in resultsByStudent) {
          const studentData = resultsByStudent[studentId];
          if (studentData.results.length) {
            const studentStats = await calculateStudentStats(
              studentData.results, 
              studentData.student, 
              studentData.student.classLevel, 
              sessionId, 
              term,
              calculateByStream === "true"
            );
            
            // Fee assignment logic
            if (schoolInfo) {
              studentStats.nextTermResumption = new Date(schoolInfo.nextTermResumption).toLocaleDateString();
              
              if (studentData.student.classLevel.includes('Nursery')) {
                studentStats.nextTermFees = `₦${schoolInfo.nurseryFees.toLocaleString()}`;
              } else if (studentData.student.classLevel.includes('Primary')) {
                studentStats.nextTermFees = `₦${schoolInfo.primaryFees.toLocaleString()}`;
              } else if (studentData.student.classLevel.includes('JSS')) {
                studentStats.nextTermFees = `₦${schoolInfo.juniorSecondaryFees.toLocaleString()}`;
              } else if (studentData.student.classLevel.includes('SS')) {
                studentStats.nextTermFees = `₦${schoolInfo.seniorSecondaryFees.toLocaleString()}`;
              } else {
                studentStats.nextTermFees = 'To be announced';
              }
            } else {
              studentStats.nextTermResumption = 'To be announced';
              studentStats.nextTermFees = 'To be announced';
            }
            
            studentResultsList.push({
              student: studentData.student,
              results: studentData.results,
              stats: studentStats
            });
          }
        }

        studentResultsList.sort((a, b) => {
          if (a.student.classLevel < b.student.classLevel) return -1;
          if (a.student.classLevel > b.student.classLevel) return 1;
          if (a.student.adminNo < b.student.adminNo) return -1;
          if (a.student.adminNo > b.student.adminNo) return 1;
          return 0;
        });
      }
    }

    // Generate filename
    let filename = "";
    if (student) {
      filename = `${student.fullName.replace(/[^a-z0-9]/gi, "_")}_${results[0].session.name}_RESULT.pdf`;
    } else if (studentResultsList.length > 0) {
      filename = `${classLevel}_${studentResultsList[0].results[0].session.name}_RESULTS.pdf`;
    } else {
      filename = "results.pdf";
    }

    // Render the PDF template
    const templatePath = path.join(__dirname, '../views/results/pdfTemplate.ejs');
    const html = await ejs.renderFile(templatePath, {
      classLevel,
      adminNo,
      sessionId,
      term,
      calculateByStream,
      sessions,
      students,
      student,
      results,
      stats,
      studentResultsList: studentResultsList.length > 0 ? studentResultsList : null,
      schoolProfile
    });

    // PDF options
    const options = {
      format: 'A4',
      orientation: 'portrait',
      border: {
        top: '10mm',
        right: '10mm',
        bottom: '10mm',
        left: '10mm'
      },
      header: {
        height: '0mm'
      },
      footer: {
        height: '0mm'
      }
    };

    // Create PDF
    pdf.create(html, options).toBuffer((err, buffer) => {
      if (err) {
        console.error("PDF generation error:", err);
        return res.status(500).send("Error generating PDF");
      }
      
      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
      res.send(buffer);
    });
  } catch (err) {
    console.error("downloadPDF error:", err);
    return res.status(500).send("Server error");
  }
};
