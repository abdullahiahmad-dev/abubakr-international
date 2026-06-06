const Event = require("../models/Event");

exports.getAll = async (req, res) => {
  const events = await Event.find().sort({ date: 1 });
  res.render("admin/events", { events });
};

exports.create = async (req, res) => {
  const { title, description, date, time, image } = req.body;
  await Event.create({ title, description, date, time, image });
  res.redirect("/admin/events");
};

exports.delete = async (req, res) => {
  await Event.findByIdAndDelete(req.params.id);
  res.redirect("/admin/events");
};
