const Teacher = require("../models/Teacher");
const bcrypt = require("bcrypt");

// GET Add Teacher Page
exports.getAddTeacherPage = (req, res) => {
  // Access user and userRole from req
  const user = req.user;
  const userRole = req.userRole;
  
  res.render("teachers/add", { 
    message: null, 
    user: user,
    userRole: userRole
  });
};

// POST Save Teacher
exports.saveTeacher = async (req, res) => {
  try {
    // Access user and userRole from req
    const user = req.user;
    const userRole = req.userRole;
    
    // Check if user has permission to add teachers
    if (userRole !== 'admin') {
      return res.status(403).json({ success: false, message: "Access denied. Only admins can add teachers." });
    }
    
    const { fullName, email, password, role } = req.body;

    // hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    const newTeacher = new Teacher({
      fullName,
      email,
      password: hashedPassword,
      role: role || "teacher" // Default to "teacher" if role is not provided
    });

    await newTeacher.save();
    res.json({ success: true, message: "Teacher has been successfully created!" });
  } catch (err) {
    console.error("Save teacher error:", err);
    res.status(500).json({ success: false, message: "Error saving teacher. Try again." });
  }
};

exports.viewTeachers = async (req, res) => {
  try {
    // Access user and userRole from req
    const user = req.user;
    const userRole = req.userRole;
    
    const teachers = await Teacher.find();
    res.render("teachers/list", { 
      teachers, 
      user: user,
      userRole: userRole
    });
  } catch (err) {
    console.error("Error fetching teachers:", err);
    res.status(500).render("error", { 
      message: "Error loading teachers",
      user: req.user,
      userRole: req.userRole
    });
  }
};

// POST Update Teacher (updated to return JSON instead of rendering a page)
exports.updateTeacher = async (req, res) => {
  try {
    const user = req.user;
    const userRole = req.userRole;
    const { id } = req.params;
    const { fullName, email, role, password } = req.body;

    // Permission Check:
    // - Admins can update anyone.
    // - Teachers can only update their own profile.
    if (userRole !== 'admin' && user.id !== id) {
      return res.status(403).json({ success: false, message: "Access denied. You can only update your own profile." });
    }

    const teacher = await Teacher.findById(id);
    if (!teacher) {
      return res.status(404).json({ success: false, message: "Teacher not found" });
    }
    
    // --- Build the update object conditionally ---
    const updateData = { fullName }; // Name can always be updated

    // Only admins can change email and role
    if (userRole === 'admin') {
      // Check for duplicate email if admin is changing it
      if (teacher.email !== email) {
        const existingTeacher = await Teacher.findOne({ email, _id: { $ne: id } });
        if (existingTeacher) {
          return res.status(400).json({ success: false, message: "Email already exists. Please use a different email." });
        }
      }
      updateData.email = email;
      updateData.role = role;
    }

    // Password can be updated by anyone (if provided)
    if (password && password.trim() !== '') {
      updateData.password = await bcrypt.hash(password, 10);
    }
    
    await Teacher.findByIdAndUpdate(id, updateData);
    
    // Return success response
    res.json({ success: true, message: "Teacher has been successfully updated!" });
  } catch (err) {
    console.error("Error updating teacher:", err);
    res.status(500).json({ success: false, message: "Error updating teacher. Try again." });
  }
};

exports.deleteTeacher = async (req, res) => {
  try {
    // Access user and userRole from req
    const user = req.user;
    const userRole = req.userRole;
    
    // Check if user has permission to delete teachers
    if (userRole !== 'admin') {
      return res.status(403).render("error", { 
        message: "Access denied. Only admins can delete teachers.",
        user: user,
        userRole: userRole
      });
    }
    
    const { id } = req.params;
    await Teacher.findByIdAndDelete(id);
    res.redirect("/teachers/view"); // redirect back to teacher list after delete
  } catch (err) {
    console.error("Error deleting teacher:", err);
    res.status(500).render("error", { 
      message: "Server Error",
      user: req.user,
      userRole: req.userRole
    });
  }
};
