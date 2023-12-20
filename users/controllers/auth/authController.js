const jwt = require("jsonwebtoken");
const InventorySearchByUser = require("../../models/InventorySearchByUser");
const User = require("../../models/UserModel");

let JWT_SECRET = process.env.JWT_SECRET;

exports.logIn = async (req, res) => {
  try {
    const { email, password } = req.body;
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(400).json({
        errorType: "VALIDATION_ERROR",
        ok: false,
        vn_msg: "Email không tồn tại.",
        en_msg: "Email does not exist.",
      });
    }
    if (password !== user.password) {
      return res.status(400).json({
        errorType: "VALIDATION_ERROR",
        ok: false,
        vn_msg: "Mật khẩu không đúng.",
        en_msg: "Password is incorrect.",
      });
    }

    // check if user status is active
    if (user.status !== "active") {
      return res.status(400).json({
        errorType: "ACCOUNT_ERROR",
        ok: false,
        vn_msg: "Tài khoản đã bị xóa/khóa.",
        en_msg: "Account is deleted/blocked.",
      });
    }
    const token = jwt.sign(
      {
        _id: user._id,
        email: user.email,
        role: user.role,
        location: user.location,
        status: user.status,
      },
      JWT_SECRET,
      { expiresIn: "365d" }
    );

    res.status(200).json({
      ok: true,
      item: {
        _id: user._id,
        email: user.email,
        role: user.role,
        location: user.location,
        status: user.status,
      },
      token,
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

exports.getCurrentUser = async (req, res) => {
  try {
    let userId = JSON.parse(req.headers["x-user"])._id;
    let user = await User.findById(userId).select("-password");
    if (!user) {
      return res.status(400).json({
        ok: false,
        errorType: "VALIDATION_ERROR",
        vn_msg: "Tài khoản không tồn tại.",
        en_msg: "Account does not exist.",
      });
    }
    // check user status not active
    if (user.status !== "active") {
      return res.status(400).json({
        errorType: "ACCOUNT_ERROR",
        ok: false,
        vn_msg: "Tài khoản đã bị xóa/khóa.",
        en_msg: "Account is deleted/blocked.",
      });
    }

    if (user.role === "sale_manager") {
      const teamName = user.teamName;
      // get all users in team with role sale_employee
      const users = await User.find({ teamName, role: "sale_employee" }).select(
        "-password"
      );

      return res.status(200).json({
        ok: true,
        item: {
          ...user._doc,
          members: users,
        },
      });
    }

    res.status(200).json({
      ok: true,
      item: user,
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

exports.createUser = async (req, res) => {
  try {
    const { name, email, location, role } = req.body;
    const user = await User.findOne({ email });
    if (user) {
      return res.status(400).json({
        ok: false,
        errorType: "VALIDATION_ERROR",
        vn_msg: "Tài khoản đã tồn tại.",
        en_msg: "Account already exists.",
      });
    }
    const newUser = await User.create({ email, name, location, role });

    // delete password
    newUser.password = undefined;

    // store user to Redis
    // await redisConfigClient.set(`user:${newUser._id}`, JSON.stringify(newUser));

    res.status(200).json({
      ok: true,
      item: newUser,
    });
  } catch (error) {
    console.log(error);
    res.status(500).json({
      ok: true,
      en_msg: "Something went wrong.",
      vn_msg: "Đã xảy ra lỗi.",
    });
  }
};

exports.getAllUsers = async (req, res) => {
  try {
    const { pageNumber, pageSize = 10, searchTerm } = req.body;
    const limit = parseInt(pageSize);
    const skip = (parseInt(pageNumber) - 1) * limit;

    let query = {
      status: { $ne: "deleted" },
      role: { $ne: "admin" },
    };
    if (searchTerm) {
      query = { ...query, $text: { $search: searchTerm } };
    }

    const totalDocs = await User.countDocuments(query);

    const users = await User.find(query)
      .skip(skip)
      .limit(limit)
      .select("-password");

    res.status(200).json({
      ok: true,
      items: users,
      length: users.length,
      total: totalDocs,
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

exports.updateOneUserInfor = async (req, res) => {
  try {
    const { name, oldEmail, newEmail, id, location, role } = req.body;

    if (oldEmail !== newEmail) {
      const user = await User.findOne({ email: newEmail });
      if (user) {
        return res.status(400).json({
          errorType: "VALIDATION_ERROR",
          ok: false,
          vn_msg: "Tài khoản đã tồn tại.",
          en_msg: "Account already exists.",
        });
      }
    }

    const updatedUser = await User.findByIdAndUpdate(
      id,
      { name, email: newEmail, location, role },
      { new: true }
    );

    // delete password
    updatedUser.password = undefined;

    // store user to Redis
    // await redisConfigClient.set(
    //   `user:${updatedUser._id}`,
    //   JSON.stringify(updatedUser)
    // );

    res.status(200).json({
      ok: true,
      user: {
        _id: updatedUser._id,
        email: updatedUser.email,
        name: updatedUser.name,
        location: updatedUser.location,
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

exports.updateOneUserStatus = async (req, res) => {
  try {
    const { id, status } = req.body;

    const user = await User.findById(id);

    if (!user) {
      return res.status(400).json({
        ok: false,
        errorType: "VALIDATION_ERROR",
        vn_msg: "Tài khoản không tồn tại.",
        en_msg: "Account does not exist.",
      });
    }

    // update user status

    const updatedUser = await User.findByIdAndUpdate(
      id,
      {
        status,
      },
      {
        new: true,
      }
    );

    // delete password
    updatedUser.password = undefined;

    // store user to Redis
    // await redisConfigClient.set(
    //   `user:${updatedUser._id}`,
    //   JSON.stringify(updatedUser)
    // );

    res.status(200).json({
      ok: true,
      user: {
        _id: updatedUser._id,
        email: updatedUser.email,
        name: updatedUser.name,
        location: updatedUser.location,
        status: updatedUser.status,
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
exports.deleteUsers = async (req, res) => {
  try {
    const { userIds } = req.body;

    await User.updateMany(
      { _id: { $in: userIds } },
      { $set: { status: "deleted" } }
    );

    // delete users from Redis
    // userIds.forEach(async (id) => {
    //   await redisConfigClient.del(`user:${id}`);
    // });

    res.status(200).json({
      ok: true,
      en_msg: "Deleted successfully.",
      vn_msg: "Xóa thành công.",
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

exports.changePassword = async (req, res) => {
  try {
    const { oldPassword, newPassword } = req.body;

    if (oldPassword === newPassword) {
      return res.status(400).json({
        errorType: "VALIDATION_ERROR",
        ok: false,
        vn_msg: "Mật khẩu mới không được trùng mật khẩu cũ.",
        en_msg: "New password must not be the same as old password.",
      });
    }

    let userId = JSON.parse(req.headers["x-user"])._id;

    const user = await User.findById(userId);

    // if account is deleted
    if (user.status === "deleted") {
      return res.status(400).json({
        errorType: "ACCOUNT_ERROR",
        ok: false,
        vn_msg: "Tài khoản đã bị xóa.",
        en_msg: "Account has been deleted.",
      });
    }

    // if account is blocked
    if (user.status === "blocked") {
      return res.status(400).json({
        errorType: "ACCOUNT_ERROR",
        ok: false,
        vn_msg: "Tài khoản đã bị khóa.",
        en_msg: "Account has been blocked.",
      });
    }
    // check if old password is correct
    if (user.password !== oldPassword) {
      return res.status(400).json({
        errorType: "VALIDATION_ERROR",
        ok: false,
        vn_msg: "Mật khẩu cũ không đúng.",
        en_msg: "Old password is incorrect.",
      });
    }

    await User.findByIdAndUpdate(
      userId,
      { password: newPassword },
      { new: true }
    );

    res.status(200).json({
      ok: true,
      vn_msg: "Đổi mật khẩu thành công.",
      en_msg: "Change password successfully.",
    });
  } catch (error) {
    console.log(error);
    res.status(500).json({
      ok: true,
      en_msg: "Something went wrong.",
      vn_msg: "Đã xảy ra lỗi.",
    });
  }
};

exports.getAllInventorySearchByUser = async (req, res) => {
  try {
    const { startDate, endDate, pageNumber, pageSize } = req.body;

    const limit = parseInt(pageSize);
    const skip = (parseInt(pageNumber) - 1) * limit;

    // get all inventories sorted by date in ascending order

    // popluate user and select only user name and email
    const inventories = await InventorySearchByUser.find({
      date: { $gte: new Date(startDate), $lte: new Date(endDate) },
    })
      .limit(limit)
      .skip(skip)
      .sort({ date: 1 })
      .populate("user", "name email");

    // total number of inventories
    const totalDocs = await InventorySearchByUser.countDocuments({
      date: { $gte: new Date(startDate), $lte: new Date(endDate) },
    });

    res.status(200).json({
      ok: true,
      items: inventories,
      total: totalDocs,
      length: inventories.length,
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
