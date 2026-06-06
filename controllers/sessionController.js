const Session = require("../models/Session");

exports.getSessions = async (req, res) => {
  const sessions = await Session.find().sort({ createdAt: -1 });
  res.render("admin/sessions", { sessions });
};

exports.createSession = async (req, res) => {
  try {
    const { name } = req.body;
    await Session.create({ name });
    res.redirect("/admin/sessions");
  } catch (error) {
    res.status(500).send("Error creating session: " + error.message);
  }
};

exports.deleteSession = async (req, res) => {
  try {
    const { id } = req.params;
    await Session.findByIdAndDelete(id);
    res.redirect("/admin/sessions");
  } catch (error) {
    res.status(500).send("Error deleting session: " + error.message);
  }
};

