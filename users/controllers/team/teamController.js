const User = require("../../models/UserModel");
const Team = require("../../models/TeamModel");

exports.getAllTeams = async (req, res) => {
  try {
    const teams = await Team.find();

    res.status(200).json({
      ok: true,
      items: teams,
    });
  } catch (error) {
    console.log(error);
    res.status(500).json({
      ok: true,
      en_msg: "Something went wrong",
      vn_msg: "Đã xảy ra lỗi",
    });
  }
};

exports.getOneTeam = async (req, res) => {
  try {
    const { id } = req.params;
    const team = await Team.findById(id);

    // find all users in team
    const users = await User.find({ teamName: team.name });

    res.status(200).json({
      ok: true,
      item: {
        users,
        team,
      },
    });
  } catch (error) {
    console.log(error);
    res.status(500).json({
      ok: true,
      en_msg: "Something went wrong",
      vn_msg: "Đã xảy ra lỗi",
    });
  }
};
exports.createOneTeam = async (req, res) => {
  try {
    const { name } = req.body;
    const team = await Team.create({ name });

    res.status(200).json({
      ok: true,
      item: team,
    });
  } catch (error) {
    console.log(error);
    res.status(500).json({
      ok: true,
      en_msg: "Something went wrong",
      vn_msg: "Đã xảy ra lỗi",
    });
  }
};

exports.updateTeam = async (req, res) => {
  try {
    const { id } = req.params;
    const { name } = req.body;

    const team = await Team.findByIdAndUpdate(id, { name }, { new: true });

    res.status(200).json({
      ok: true,
      item: team,
    });
  } catch (error) {
    console.log(error);
    res.status(500).json({
      ok: true,
      en_msg: "Something went wrong",
      vn_msg: "Đã xảy ra lỗi",
    });
  }
};

exports.deleteTeam = async (req, res) => {
  try {
    const { id } = req.params;

    const team = await Team.findByIdAndDelete(id);

    // delete all users in team
    await User.deleteMany({ teamName: team.name });

    res.status(200).json({
      ok: true,
    });
  } catch (error) {
    console.log(error);
    res.status(500).json({
      ok: true,
      en_msg: "Something went wrong",
      vn_msg: "Đã xảy ra lỗi",
    });
  }
};
