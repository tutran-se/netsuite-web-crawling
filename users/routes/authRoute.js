const express = require("express");
const {
  createUser,
  logIn,
  getCurrentUser,
  changePassword,
  updateOneUserInfor,
  updateOneUserStatus,
  deleteUsers,
  getAllInventorySearchByUser,
  getAllUsers,
} = require("../controllers/auth/authController");

const Router = express.Router();

Router.route("/login").post(logIn);
Router.route("/me").get(getCurrentUser);

// chanage password page for all users
Router.route("/changePassword").post(changePassword);

// manager user only for admin
Router.route("/list").post(getAllUsers); // get list of users
Router.route("/new").post(createUser); // create new user infor
Router.route("/updateInfor").post(updateOneUserInfor); // update user infor
Router.route("/updateStatus").post(updateOneUserStatus); // update user status
Router.route("/deleteMultiple").post(deleteUsers); // delete users and change status to deleted

Router.route("/inventoriesList").post(getAllInventorySearchByUser);

module.exports = Router;
