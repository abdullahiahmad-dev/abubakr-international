const Student = require("../models/Student");
const Result = require("../models/Result");

function getRemark(score) {
  if (score >= 70) return "Excellent";
  if (score >= 60) return "Very Good";
  if (score >= 50) return "Good";
  if (score >= 45) return "Fair";
  if (score >= 40) return "Poor";
  return "Fail";
}

function ordinalSuffix(i) {
  const j = i % 10, k = i % 100;
  if (j === 1 && k !== 11) return i + "st";
  if (j === 2 && k !== 12) return i + "nd";
  if (j === 3 && k !== 13) return i + "rd";
  return i + "th";
}

const calculateStudentStats = async (results, student, classLevel, sessionId, term) => {
  try {
    const totalObtained = results.reduce((sum, r) => sum + r.total, 0);
    const totalPossible = results.length * 100;
    const avg = totalObtained / results.length;

    let overallGrade;
    if (avg >= 90) overallGrade = 'A+';
    else if (avg >= 80) overallGrade = 'A';
    else if (avg >= 70) overallGrade = 'B';
    else if (avg >= 60) overallGrade = 'C';
    else if (avg >= 50) overallGrade = 'D';
    else overallGrade = 'F';

    // Get class stats
    const classStudents = await Student.find({ classLevel });
    const classStudentIds = classStudents.map(s => s._id);

    const classResults = await Result.find({
      student: { $in: classStudentIds },
      session: sessionId,
      term,
    }).populate("student");

    const studentTotals = {};
    classResults.forEach(r => {
      const sid = r.student._id.toString();
      if (!studentTotals[sid]) {
        studentTotals[sid] = { total: 0, count: 0, student: r.student };
      }
      studentTotals[sid].total += r.total;
      studentTotals[sid].count += 1;
    });

    const studentAverages = Object.values(studentTotals).map(data => ({
      studentId: data.student._id.toString(),
      average: data.total / data.count,
      student: data.student,
    }));

    studentAverages.sort((a, b) => b.average - a.average);

    let position = 1;
    let classMax = 0;
    let classMin = 100;

    for (let i = 0; i < studentAverages.length; i++) {
      if (studentAverages[i].average > classMax) classMax = studentAverages[i].average;
      if (studentAverages[i].average < classMin) classMin = studentAverages[i].average;

      if (studentAverages[i].studentId === student._id.toString()) {
        position = i + 1;
      }
    }

    // 🔑 Add subject positions/min/max/remark
    for (let r of results) {
      const subjectResults = await Result.find({
        student: { $in: classStudentIds },
        session: sessionId,
        term,
        subject: r.subject,
      }).populate("student");

      subjectResults.sort((a, b) => (b.total || 0) - (a.total || 0));

      const subjectPos =
        subjectResults.findIndex(sr => String(sr.student._id) === String(student._id)) + 1;

      const subjectMin = subjectResults[subjectResults.length - 1]?.total || 0;
      const subjectMax = subjectResults[0]?.total || 0;

      r.subjectPosition = ordinalSuffix(subjectPos);
      r.subjectMin = subjectMin;
      r.subjectMax = subjectMax;
      r.subjectRemark = getRemark(r.total || 0);
    }

    return {
      totalObtained,
      totalPossible,
      avg: avg.toFixed(2),
      overallGrade,
      classMax: classMax.toFixed(2),
      classMin: classMin.toFixed(2),
      position: ordinalSuffix(position),
      classSize: studentAverages.length,
      psychomotor: results[0]?.psychomotor || {},
      generalConduct: results[0]?.generalConduct || '',
      formTeacherRemark: results[0]?.formTeacherRemark || '',
      principalRemark: results[0]?.principalRemark || '',
      daysPresent: results[0]?.daysPresent || 0,
      daysAbsent: results[0]?.daysAbsent || 0,
    };
  } catch (err) {
    console.error("Error calculating stats:", err);
    return {
      totalObtained: 0, totalPossible: 0, avg: 0,
      overallGrade: 'N/A', classMax: 0, classMin: 0,
      position: 0, classSize: 0,
      psychomotor: {}, generalConduct: '',
      formTeacherRemark: '', principalRemark: '',
      daysPresent: 0, daysAbsent: 0,
    };
  }
};

module.exports = { calculateStudentStats };
