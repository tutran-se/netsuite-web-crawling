const { differenceInCalendarWeeks } = require("date-fns");
const redisClient = require("../../configs/redisInstance");
const Product = require("../../models/ProductModel");
const StatusData = require("../../models/StatusModel");
const User = require("../../models/UserModel");
// const { product_search_items } = require("./sample");

// Controllers

// get product details while user search

exports.getProductDetails = async (req, res) => {
  try {
    // search_date include day, month, year
    // product_search_items: [{product_code, expected_quantity}]
    const { product_search_items, search_date } = req.body;

    // const user = JSON.parse(req.headers["x-user"]);

    // const user_location = user?.location || "HN";
    // const userId = user._id;
    // const user_role = user?.role;
    // const user_status = user?.status;

    const userId = JSON.parse(req.headers["x-user"])._id;

    const user = await User.findById(userId);

    const user_location = user?.location || "HN";
    const user_role = user?.role;
    const user_status = user?.status;

    // check if user status is active
    if (user_status !== "active") {
      return res.status(400).json({
        errorType: "ACCOUNT_ERROR",
        ok: false,
        vn_msg: "Tài khoản đã bị xóa/khóa.",
        en_msg: "Account is deleted/blocked.",
      });
    }
    // Parameters
    // let userId = "63eb87f0e60aa6346e5e1204";
    // const user_location = "HN";
    // const search_date = {
    //   day: 2,
    //   month: 1,
    //   year: 2023,
    // };

    // --------///

    // get product details from redis
    const promises = [];
    for (let i = 0; i < product_search_items.length; i++) {
      let promise = new Promise(async (resolve, reject) => {
        const item = product_search_items[i];
        const redisKey = `product:${String(item.product_code).toLowerCase()}`;
        const productDetailsJSON = await redisClient.get(redisKey);
        const productDetails = JSON.parse(productDetailsJSON);
        item.order = i;
        item.productDetails = productDetails ? productDetails : null;
        if (!productDetails) {
          return resolve(item);
        }

        // ---- //

        // tien_do
        const {
          ton_kho_HN,
          ton_kho_HCM,
          ton_kho_KGG_HN,
          ton_kho_KGG_HCM,
          hang_sap_ve,
          hang_chua_mua,
          ton_kho_hang,
          hang_sap_ve_kho_hang,
          lead_time,
          eta_items,
        } = item.productDetails;

        const expected_quantity = Number(item.expected_quantity);
        if (user_location === "HN") {
          // check expected quantity
          switch (true) {
            // case 1
            case expected_quantity <= ton_kho_HN + ton_kho_KGG_HN:
              item.productDetails.tien_do = "Có sẵn";
              item.productDetails.tien_do_en = "Available";
              break;

            // case 2
            case expected_quantity <=
              ton_kho_HN + ton_kho_KGG_HN + ton_kho_HCM + ton_kho_KGG_HCM:
              item.productDetails.tien_do = "5-7 ngày";
              item.productDetails.tien_do_en = "5-7 days";
              break;

            // case 3
            case expected_quantity <=
              ton_kho_HN +
                ton_kho_KGG_HN +
                ton_kho_HCM +
                ton_kho_KGG_HCM +
                ton_kho_hang:
              item.productDetails.tien_do = "7-10 ngày";
              item.productDetails.tien_do_en = "7-10 days";
              break;

            // case 4
            case expected_quantity <=
              ton_kho_HN +
                ton_kho_KGG_HN +
                ton_kho_HCM +
                ton_kho_KGG_HCM +
                ton_kho_hang +
                hang_sap_ve -
                hang_chua_mua:
              let endDateString;

              // find the end date
              let retainQuantity =
                expected_quantity -
                ton_kho_HN -
                ton_kho_KGG_HN -
                ton_kho_KGG_HN -
                ton_kho_HCM -
                ton_kho_hang +
                hang_chua_mua;

              if (eta_items.length === 0) {
                if (!lead_time) {
                  item.productDetails.tien_do = "Không có leadtime";
                  item.productDetails.tien_do_en = "No leadtime";
                  break;
                }

                let leadStartWeek = parseInt(lead_time / 5);
                item.productDetails.tien_do = `${leadStartWeek}-${
                  leadStartWeek + 2
                } tuần`;
                item.productDetails.tien_do_en = `${leadStartWeek}-${
                  leadStartWeek + 2
                } weeks`;

                break;
              }
              if (eta_items.length !== 0) {
                for (let i = 0; i < eta_items.length; i++) {
                  let etaItem = eta_items[i];
                  if (retainQuantity <= etaItem.eta_quantity) {
                    endDateString = etaItem.eta_delivered_date;
                    break;
                  }
                  retainQuantity -= etaItem.eta_quantity;
                }

                // caculate weeks between endDate and searchDate using date-fns
                const { day, month, year } = search_date;

                const startDate = new Date(`${year}-${month}-${day}`);
                const endDate = new Date(endDateString);

                let diff_weeks = differenceInCalendarWeeks(endDate, startDate);

                if (diff_weeks <= 0) {
                  item.productDetails.tien_do = "7-10 ngày";
                  item.productDetails.tien_do_en = "7-10 days";
                  break;
                }

                item.productDetails.tien_do = `${diff_weeks}-${
                  diff_weeks + 2
                } tuần`;
                item.productDetails.tien_do_en = `${diff_weeks}-${
                  diff_weeks + 2
                } weeks`;

                break;
              }

            // case 5
            case expected_quantity >
              ton_kho_HN +
                ton_kho_KGG_HN +
                ton_kho_HCM +
                ton_kho_KGG_HCM +
                ton_kho_hang +
                hang_sap_ve -
                hang_chua_mua &&
              expected_quantity <
                ton_kho_HN +
                  ton_kho_KGG_HN +
                  ton_kho_HCM +
                  ton_kho_KGG_HCM +
                  ton_kho_hang +
                  hang_sap_ve -
                  hang_chua_mua +
                  hang_sap_ve_kho_hang:
              if (!lead_time) {
                item.productDetails.tien_do = "Không có leadtime";
                item.productDetails.tien_do_en = "No leadtime";
                break;
              }

              let leadStartWeek = parseInt(lead_time / 5);
              item.productDetails.tien_do = `${leadStartWeek}-${
                leadStartWeek + 2
              } tuần`;
              item.productDetails.tien_do_en = `${leadStartWeek}-${
                leadStartWeek + 2
              } weeks`;
              item.productDetails.isSpecial = true;

              break;

            // case 6
            case expected_quantity >
              ton_kho_HN +
                ton_kho_KGG_HN +
                ton_kho_HCM +
                ton_kho_KGG_HCM +
                ton_kho_hang +
                hang_sap_ve -
                hang_chua_mua:
              if (!lead_time) {
                item.productDetails.tien_do = "Không có leadtime";
                item.productDetails.tien_do_en = "No leadtime";
                break;
              }

              let weeks = parseInt(lead_time / 5);
              item.productDetails.tien_do = `${parseInt(weeks)}-${
                weeks + 2
              } tuần`;
              item.productDetails.tien_do_en = `${parseInt(weeks)}-${
                weeks + 2
              } weeks`;

              break;

            default:
              item.productDetails.tien_do =
                "Không có dữ liệu do không có hàng trong kho";
              item.productDetails.tien_do_en =
                "No data because there is no stock";
              break;
          }
        }

        if (user_location === "HCM") {
          // check expected quantity
          switch (true) {
            // case 1
            case expected_quantity <= ton_kho_HCM + ton_kho_KGG_HCM:
              item.productDetails.tien_do = "Có sẵn";
              item.productDetails.tien_do_en = "Available";
              break;

            // case 3
            case expected_quantity <=
              ton_kho_HN + ton_kho_KGG_HN + ton_kho_HCM + ton_kho_KGG_HCM:
              item.productDetails.tien_do = "5-7 ngày";
              item.productDetails.tien_do_en = "5-7 days";
              break;

            // case 2
            case expected_quantity <=
              ton_kho_HCM + ton_kho_KGG_HCM + ton_kho_hang:
              item.productDetails.tien_do = "2-5 ngày";
              item.productDetails.tien_do_en = "2-5 days";
              break;

            // case 4
            case expected_quantity <=
              ton_kho_HN +
                ton_kho_KGG_HN +
                ton_kho_HCM +
                ton_kho_KGG_HCM +
                ton_kho_hang:
              item.productDetails.tien_do = "5-7 ngày";
              item.productDetails.tien_do_en = "5-7 days";
              break;

            // case 5
            case expected_quantity <=
              ton_kho_HN +
                ton_kho_KGG_HN +
                ton_kho_HCM +
                ton_kho_KGG_HCM +
                ton_kho_hang +
                hang_sap_ve -
                hang_chua_mua:
              let endDateString;

              // find the end date
              let retainQuantity =
                expected_quantity -
                ton_kho_HN -
                ton_kho_KGG_HN -
                ton_kho_KGG_HN -
                ton_kho_HCM -
                ton_kho_hang +
                hang_chua_mua;

              if (eta_items.length === 0) {
                if (!lead_time) {
                  item.productDetails.tien_do = "Không có leadtime";
                  item.productDetails.tien_do_en = "No leadtime";
                  break;
                }

                let leadStartWeek = parseInt(lead_time / 5);
                item.productDetails.tien_do = `${leadStartWeek}-${
                  leadStartWeek + 2
                } tuần`;
                item.productDetails.tien_do_en = `${leadStartWeek}-${
                  leadStartWeek + 2
                } weeks`;

                break;
              }
              if (eta_items.length === 0) {
                for (let i = 0; i < eta_items.length; i++) {
                  let etaItem = eta_items[i];
                  if (Number(retainQuantity) <= Number(etaItem.eta_quantity)) {
                    endDateString = etaItem.eta_delivered_date;
                    break;
                  }
                  retainQuantity -= etaItem.eta_quantity;
                }

                // caculate weeks between endDate and searchDate using date-fns
                const { day, month, year } = search_date;

                const startDate = new Date(`${year}-${month}-${day}`);
                const endDate = new Date(endDateString);

                let diff_weeks = differenceInCalendarWeeks(
                  new Date(endDate),
                  new Date(startDate)
                );

                if (diff_weeks <= 0) {
                  item.productDetails.tien_do = "7-10 ngày";
                  item.productDetails.tien_do_en = "7-10 days";
                  break;
                }
                item.productDetails.tien_do = `${diff_weeks}-${
                  diff_weeks + 2
                } tuần`;
                item.productDetails.tien_do_en = `${diff_weeks}-${
                  diff_weeks + 2
                } weeks`;

                break;
              }

            // case 6
            case expected_quantity >
              ton_kho_HN +
                ton_kho_KGG_HN +
                ton_kho_HCM +
                ton_kho_KGG_HCM +
                ton_kho_hang +
                hang_sap_ve -
                hang_chua_mua &&
              expected_quantity <
                ton_kho_HN +
                  ton_kho_KGG_HN +
                  ton_kho_HCM +
                  ton_kho_KGG_HCM +
                  ton_kho_hang +
                  hang_sap_ve -
                  hang_chua_mua +
                  hang_sap_ve_kho_hang:
              if (!lead_time) {
                item.productDetails.tien_do = "Không có leadtime";
                item.productDetails.tien_do_en = "No leadtime";
                break;
              }
              let leadStartWeek = parseInt(lead_time / 5);
              item.productDetails.tien_do = `${leadStartWeek}-${
                leadStartWeek + 2
              } tuần`;
              item.productDetails.tien_do_en = `${leadStartWeek}-${
                leadStartWeek + 2
              } weeks`;
              item.productDetails.isSpecial = true;
              break;

            // case 7
            case expected_quantity >
              ton_kho_HN +
                ton_kho_KGG_HN +
                ton_kho_HCM +
                ton_kho_KGG_HCM +
                ton_kho_hang +
                hang_sap_ve -
                hang_chua_mua:
              if (!lead_time) {
                item.productDetails.tien_do = "Không có leadtime";
                item.productDetails.tien_do_en = "No leadtime";
                break;
              }
              let weeks = parseInt(lead_time / 5);

              item.productDetails.tien_do = `${parseInt(weeks)}-${
                weeks + 2
              } tuần`;
              item.productDetails.tien_do_en = `${parseInt(weeks)}-${
                weeks + 2
              } weeks`;

              break;

            default:
              item.productDetails.tien_do =
                "Không có dữ liệu do không có hàng trong kho";
              item.productDetails.tien_do_en =
                "No data because there is no stock";
              break;
          }
        }

        resolve(item);
      });

      promises.push(promise);
    }

    const results = await Promise.all(promises);

    // sort by id in ascending order
    results.sort((a, b) => a.order - b.order);
    // console.log("Sample:", productItems.slice(0, 1));

    // publish event message to User service

    if (user_role !== "admin") {
      const eventMessage = {
        userId,
        search_date,
        items: results,
      };

      await redisClient.publish(
        "inventorySearchByUser",
        JSON.stringify(eventMessage)
      );
    }
    res.status(200).json({
      ok: true,
      total: results.length,
      items: results,
    });
  } catch (error) {
    console.log(error);
    res.status(500).json({
      ok: true,
      msg: "Something went wrong",
      error,
    });
  }
};

// check single product code
exports.getSuggestions = async (req, res) => {
  try {
    const { searchTerm } = req.body;
    const suggestions = await Product.find({
      product_code: { $regex: searchTerm, $options: "i" },
    })
      .select("product_code")
      .limit(10);

    res.status(200).json({
      ok: true,
      items: suggestions,
    });
  } catch (error) {
    console.log(error);
    res.status(500).json({
      ok: true,
      msg: "Something went wrong",
      error,
    });
  }
};

// get status Data
exports.getStatusData = async (req, res) => {
  try {
    const items = await StatusData.find();
    res.status(200).json({
      ok: true,
      item: items[0],
    });
  } catch (error) {
    res.status(500).json({
      ok: true,
      msg: "Something went wrong",
      error,
    });
  }
};
