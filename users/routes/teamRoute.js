const express = require("express");

const {
  getAllTeams,
  getOneTeam,
  createOneTeam,
  updateTeam,
  deleteTeam,
} = require("../controllers/team/teamController");

const Router = express.Router();
// Get all teams
Router.route("/").get(getAllTeams);

// Create one team
Router.route("/").post(getOneTeam);

// Get one team
Router.route("/:id").get(createOneTeam);

// Update one team
Router.route("/:id").put(updateTeam);

// Delete one team
Router.route("/:id").delete(deleteTeam);

module.exports = Router;
