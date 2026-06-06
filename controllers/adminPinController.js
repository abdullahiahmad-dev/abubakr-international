const Pin = require("../models/Pin");
const Session = require("../models/Session");
const { Parser } = require("json2csv");
const ExcelJS = require("exceljs");

// helper: random pin generator
function generatePin(length = 12) {
  const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
  let code = "";
  for (let i = 0; i < length; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return code;
}

// GET: show form
exports.getGeneratePage = async (req, res) => {
  try {
    const sessions = await Session.find().sort({ year: -1 });
    res.render("pins/generate", { sessions , user:req.user});
  } catch (err) {
    console.error(err);
    res.status(500).send("Error loading page");
  }
};

exports.postGeneratePins = async (req, res) => {
  try {
    const { count, sessionId, term } = req.body;
    let pins = [];

    for (let i = 0; i < count; i++) {
      let code = generatePin(12);
      pins.push({
        code,
        session: sessionId,
        term,
        status: "unused",
        usageCount: 0
      });
    }

    await Pin.insertMany(pins);
    
    // Get all pins with session populated and sorted by creation date (newest first)
    const allPins = await Pin.find()
      .populate('session')
      .sort({ createdAt: -1 });
    
    // Get sessions for the filter dropdown
    const sessions = await Session.find().sort({ year: -1 });

    res.render("pins/success", { 
      pins: allPins, // Pass all pins instead of just the newly created ones
      sessions,
      selectedSession: sessionId,
      selectedTerm: term,
      filterStatus: 'all', // Default to showing all pins
      user: req.user // Add this line
    });
  } catch (err) {
    console.error(err);
    res.status(500).send("Error generating pins");
  }
};

// exports.getPins = async (req, res) => {
//   try {
//     const { session: selectedSession, term: selectedTerm, status: filterStatus } = req.query;
    
//     // Build filter object
//     let filter = {};
//     if (selectedSession && selectedSession !== 'all') {
//       filter.session = selectedSession;
//     }
//     if (selectedTerm && selectedTerm !== 'all') {
//       filter.term = selectedTerm;
//     }
//     if (filterStatus && filterStatus !== 'all') {
//       filter.status = filterStatus;
//     }
    
//     // Get pins with filters applied
//     const pins = await Pin.find(filter)
//       .populate('session')
//       .sort({ createdAt: -1 });
    
//     // Get sessions for the filter dropdown
//     const sessions = await Session.find().sort({ year: -1 });

//     res.render("pins/success", { 
//       pins,
//       sessions,
//       selectedSession: selectedSession || 'all',
//       selectedTerm: selectedTerm || 'all',
//       filterStatus: filterStatus || 'all',
//       user: req.user // Add this line
//     });
//   } catch (err) {
//     console.error(err);
//     res.status(500).send("Error fetching pins");
//   }
// };

// Add this new controller to handle filtering
exports.getPins = async (req, res) => {
  try {
    const { session: selectedSession, term: selectedTerm, status: filterStatus } = req.query;
    
    // Build filter object
    let filter = {};
    if (selectedSession && selectedSession !== 'all') {
      filter.session = selectedSession;
    }
    if (selectedTerm && selectedTerm !== 'all') {
      filter.term = selectedTerm;
    }
    if (filterStatus && filterStatus !== 'all') {
      filter.status = filterStatus;
    }
    
    // Get pins with filters applied
    const pins = await Pin.find(filter)
      .populate('session')
      .sort({ createdAt: -1 });
    
    // Get sessions for the filter dropdown
    const sessions = await Session.find().sort({ year: -1 });

    res.render("pins/success", { 
      pins,
      sessions,
      selectedSession: selectedSession || 'all',
      selectedTerm: selectedTerm || 'all',
      filterStatus: filterStatus || 'all',
      user: req.user,
    });
  } catch (err) {
    console.error(err);
    res.status(500).send("Error fetching pins");
  }
};

// GET: download as CSV
exports.downloadCSV = async (req, res) => {
  try {
    const pins = await Pin.find().populate("session").lean();
    const fields = ["code", "status", "term", "session.year", "usedBy", "usedAt"];
    const parser = new Parser({ fields });
    const csv = parser.parse(pins);

    res.header("Content-Type", "text/csv");
    res.attachment("pins.csv");
    return res.send(csv);
  } catch (err) {
    console.error(err);
    res.status(500).send("Error exporting CSV");
  }
};

// GET: download as Excel
exports.downloadExcel = async (req, res) => {
  try {
    const pins = await Pin.find().populate("session").lean();
    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet("Pins");

    worksheet.columns = [
      { header: "PIN Code", key: "code", width: 25 },
      { header: "Status", key: "status", width: 12 },
      { header: "Session", key: "session", width: 15 },
      { header: "Term", key: "term", width: 15 },
      { header: "Used By", key: "usedBy", width: 25 },
      { header: "Used At", key: "usedAt", width: 20 }
    ];

    pins.forEach(p => {
      worksheet.addRow({
        code: p.code,
        status: p.status,
        session: p.session ? p.session.year : "",
        term: p.term,
        usedBy: p.usedBy || "",
        usedAt: p.usedAt ? p.usedAt.toISOString().slice(0, 19).replace("T", " ") : ""
      });
    });

    res.setHeader("Content-Type", "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet");
    res.setHeader("Content-Disposition", "attachment; filename=pins.xlsx");

    await workbook.xlsx.write(res);
    res.end();
  } catch (err) {
    console.error(err);
    res.status(500).send("Error exporting Excel");
  }
};
