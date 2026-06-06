const SchoolProfile = require('../models/SchoolProfile');
const { cloudinary } = require('../config/cloudinary');
const fs = require('fs');

// Renders the school profile form
exports.getSchoolProfile = async (req, res) => {
  try {
    const profile = await SchoolProfile.findOne();
    res.render('admin/schoolProfileForm', {
      title: 'Edit School Profile',
      profile: profile,
      user: req.user
    });
  } catch (error) {
    console.error(error);
    res.redirect('/dashboard');
  }
};

// Handles the main form submission with file upload
exports.upsertSchoolProfile = async (req, res) => {
  try {
    const { name, address, motto, phoneNumbers } = req.body;
    let logoUrl = req.body.existingLogo; // Get existing logo URL if no new file is uploaded

    // If a new file is uploaded
    if (req.file) {
      try {
        const result = await cloudinary.uploader.upload(req.file.path, { 
          folder: "school-logos" 
        });
        logoUrl = result.secure_url;

        // Remove file from local "uploads/" after upload
        fs.unlinkSync(req.file.path);
      } catch (uploadError) {
        console.error("Cloudinary upload error:", uploadError);
        return res.status(500).send("Error uploading logo");
      }
    }

    const profileData = {
      name,
      address,
      motto,
      logoUrl,
      phoneNumbers: Array.isArray(phoneNumbers) ? phoneNumbers : [phoneNumbers].filter(Boolean)
    };

    await SchoolProfile.findOneAndUpdate(
      {},
      profileData,
      { new: true, upsert: true, runValidators: true }
    );

    res.render('admin/schoolProfileForm', {
      title: 'Edit School Profile',
      profile: await SchoolProfile.findOne(),
      user: req.user,
      successMessage: 'School profile has been successfully updated!'
    });

  } catch (error) {
    console.error(error);
    res.status(500).send("Error saving school profile");
  }
};