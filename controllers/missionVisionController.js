const MissionVision = require("../models/MissionVision");

exports.getAll = async (req, res) => {
  const missions = await MissionVision.find({ type: "mission" });
  const visions = await MissionVision.find({ type: "vision" });
  res.render("admin/mission-vision", { missions, visions });
};

exports.create = async (req, res) => {
  const { type, title, description, points } = req.body;
  await MissionVision.create({
    type,
    title,
    description,
    points: points.split(",").map(p => p.trim()) // split string into array
  });
  res.redirect("/admin/mission-vision");
};

exports.delete = async (req, res) => {
  await MissionVision.findByIdAndDelete(req.params.id);
  res.redirect("/admin/mission-vision");
};
