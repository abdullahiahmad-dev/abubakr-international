// controllers/schoolInfoController.js
const SchoolInfo = require('../models/SchoolInfo');
const Session = require('../models/Session');

// Get all school information
exports.getAllSchoolInfo = async (req, res) => {
  try {
    const schoolInfos = await SchoolInfo.find({})
      .populate('session')
      .sort({ session: -1, term: -1 });
    
    res.render('admin/schoolInfoList', {
      title: 'School Information Management',
      schoolInfos,
      user: req.user,

    });
  } catch (error) {
    console.error(error);

    res.redirect('/admin/dashboard');
  }
};

// Get form to add or edit school information
exports.getSchoolInfoForm = async (req, res) => {
  try {
    const sessions = await Session.find({}).sort({ name: -1 });
    const { id } = req.params;
    
    let schoolInfo = null;
    if (id) {
      schoolInfo = await SchoolInfo.findById(id);
    }
    
    res.render('admin/schoolInfoForm', {
      title: id ? 'Edit School Information' : 'Add School Information',
      sessions,
      schoolInfo,
      user: req.user,
      
    });
  } catch (error) {
    console.error(error);

    res.redirect('/admin/school-info');
  }
};

// Create or update school information
exports.createOrUpdateSchoolInfo = async (req, res) => {
  try {
    const { id } = req.params;
    const {
      session,
      term,
      nextTermResumption,
      // --- UPDATED DESTRUCTURING ---
      nurseryFees,
      primaryFees,
      juniorSecondaryFees,
      seniorSecondaryFees
    } = req.body;
    
    // Check if school info for this session and term already exists
    const existingInfo = await SchoolInfo.findOne({
      session,
      term,
      _id: { $ne: id || null }
    });
    
    if (existingInfo) {
      
      return res.redirect('/admin/school-info/add');
    }
    
    const schoolInfoData = {
      session,
      term,
      nextTermResumption,
      // --- UPDATED DATA OBJECT ---
      nurseryFees,
      primaryFees,
      juniorSecondaryFees,
      seniorSecondaryFees
    };
    
    let schoolInfo;
    if (id) {
      schoolInfo = await SchoolInfo.findByIdAndUpdate(
        id,
        schoolInfoData,
        { new: true, runValidators: true }
      );
      
    } else {
      schoolInfo = new SchoolInfo(schoolInfoData);
      await schoolInfo.save();
      
    }
    
    res.redirect('/admin/school-info');
  } catch (error) {
    console.error(error);

    res.redirect('/admin/school-info/add');
  }
};

// Delete school information
exports.deleteSchoolInfo = async (req, res) => {
  try {
    const { id } = req.params;
    await SchoolInfo.findByIdAndDelete(id);
    
    res.redirect('/admin/school-info');
  } catch (error) {
    console.error(error);

    res.redirect('/admin/school-info');
  }
};

// Get current school information for a specific session and term
exports.getCurrentSchoolInfo = async (req, res) => {
  try {
    const { sessionId, term } = req.query;
    
    if (!sessionId || !term) {
      return res.json({ error: 'Session ID and term are required' });
    }
    
    const schoolInfo = await SchoolInfo.findOne({ session: sessionId, term })
      .populate('session');
    
    if (!schoolInfo) {
      return res.json({ error: 'No information found for this session and term' });
    }
    
    res.json(schoolInfo);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Error fetching school information' });
  }
};