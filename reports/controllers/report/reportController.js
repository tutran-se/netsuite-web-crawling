exports.getBaoCaoDSBan = async (req, res) => {
  try {
    // get the dir of the root folder
    const rootDir = process.cwd();

    const excelPath = rootDir + "/files/BC_DOANH_SO_BAN.xlsb";

    res.sendFile(excelPath);
  } catch (error) {
    console.log(error);
    res.status(500).json({
      ok: true,
      msg: "Something went wrong",
      error,
    });
  }
};

exports.getBaoCaoDSKy = async (req, res) => {
  try {
    // get the dir of the root folder

    const rootDir = process.cwd();

    const excelPath = rootDir + "/files/BC_DOANH_SO_KY.xlsb";

    res.sendFile(excelPath);
  } catch (error) {
    console.log(error);
    res.status(500).json({
      ok: true,
      msg: "Something went wrong",
      error,
    });
  }
};

exports.getBaoCaoHH = async (req, res) => {
  try {
    // get the dir of the root folder

    const rootDir = process.cwd();

    const excelPath = rootDir + "/files/BC_HOA_HONG.xlsb";

    res.sendFile(excelPath);
  } catch (error) {
    console.log(error);
    res.status(500).json({
      ok: true,
      msg: "Something went wrong",
      error,
    });
  }
};

exports.getBaoCaoTinhTrangGiuHang = async (req, res) => {
  try {
    // get the dir of the root folder

    const rootDir = process.cwd();

    const excelPath = rootDir + "/files/BC_TINH_TRANG_GIU_HANG.xlsb";

    res.sendFile(excelPath);
  } catch (error) {
    console.log(error);
    res.status(500).json({
      ok: true,
      msg: "Something went wrong",
      error,
    });
  }
};

exports.getBaoCaoTonKho = async (req, res) => {
  try {
    // get the dir of the root folder

    const rootDir = process.cwd();

    const excelPath = rootDir + "/files/BC_TON_KHO_SS.xlsb";

    res.sendFile(excelPath);
  } catch (error) {
    console.log(error);
    res.status(500).json({
      ok: true,
      msg: "Something went wrong",
      error,
    });
  }
};
