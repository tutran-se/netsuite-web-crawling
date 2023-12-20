const xlsx = require("xlsx");
const path = require("path");
const { differenceInCalendarWeeks } = require("date-fns");

const getRangeAndData = (ws) => {
  const range = xlsx.utils.decode_range(ws["!ref"]); // Get the range of cells in the worksheet
  const data = new Array(range.e.r - range.s.r + 1); // Create a new 2D array to store the worksheet data

  console.log("length", data.length);
  for (let row = range.s.r; row <= range.e.r; row++) {
    data[row - range.s.r] = new Array(range.e.c - range.s.c + 1);
    for (let col = range.s.c; col <= range.e.c; col++) {
      const cell_address = xlsx.utils.encode_cell({ r: row, c: col });
      const cell = ws[cell_address];
      data[row - range.s.r][col - range.s.c] = cell ? cell.v : undefined; // Store the cell value in the array, or undefined if the cell is empty
    }
  }

  return { range, data };
};

const getCollectionData = async ({ collectionName }) => {
  try {
    let result;
    console.log("test");
    if (collectionName === "company_inventory") {
      // COMPANY INVENTORY
      const wb_company_inventory = xlsx.readFile(
        path.join(
          __dirname,
          "..",
          "data",
          "Mitsubishi",
          "COMPANY-INVENTORY.xls"
        )
      );
      const company_inventory_collection = getRangeAndData(
        wb_company_inventory.Sheets[wb_company_inventory.SheetNames[0]]
      );

      result = company_inventory_collection;
    }
    if (collectionName === "company_eta") {
      // COMPANY INVENTORY
      // COMPANY ETA
      const wb_company_eta = xlsx.readFile(
        path.join(__dirname, "..", "data", "Mitsubishi", "COMPANY-ETA.xls")
      );
      const company_eta_collection = getRangeAndData(
        wb_company_eta.Sheets[wb_company_eta.SheetNames[0]]
      );

      result = company_eta_collection;
    }

    if (collectionName === "company_leadtime") {
      const wb_company_leadtime = xlsx.readFile(
        path.join(__dirname, "..", "data", "Mitsubishi", "COMPANY-LEADTIME.xls")
      );
      const company_leadtime_collection = getRangeAndData(
        wb_company_leadtime.Sheets[wb_company_leadtime.SheetNames[0]]
      );

      result = company_leadtime_collection;
    }

    if (collectionName === "provider_inventory") {
      // PROVIDER INVENTORY
      const wb_provider_inventory = xlsx.readFile(
        path.join(
          __dirname,
          "..",
          "data",
          "Mitsubishi",
          "PROVIDER-INVENTORY.xlsx"
        )
      );
      // const provider_inventory_collection = getRangeAndData(
      //   wb_provider_inventory.Sheets[wb_provider_inventory.SheetNames[0]]
      // );

      const sheet_name = wb_provider_inventory.SheetNames[0]; // Get the first sheet
      const worksheet = wb_provider_inventory.Sheets[sheet_name];
      const cell_address = "A3"; // Cell address of the cell you want to get the value of
      const cell = worksheet[cell_address];
      const cell_value = cell ? cell.v : undefined; // Get the value of the cell, or undefined if the cell is empty
      console.log(cell_value);

      result = cell_value;
    }

    return result;
  } catch (error) {
    console.log(error);
  }
};

const getInforOfOnProduct = ({
  productCode,
  expectedQuantity,
  searchDate,
  sale_location,
}) => {
  return new Promise((resolve, reject) => {
    try {
      // let myRowCounter = 14;
      // while (true) {
      //   const { data, range } = company_inventory_collection;
      //   let cell_address = "A" + myRowCounter;
      //   const { r, c } = xlsx.utils.decode_cell(cell_address); // Get the row and column indices of the cell
      //   const cell_value = data[r - range.s.r][c - range.s.c];
      //   if (cell_value === productCode) {
      //     console.log(cell_value);
      //     console.log(productCode);
      //     break;
      //   }
      //   myRowCounter++;
      // }
      // const { r, c } = xlsx.utils.decode_cell(cell_address); // Get the row and column indices of the cell
      // const cell_value = data[r - range.s.r][c - range.s.c]; // Get the value of the cell from the 2D array

      // const ws_company_eta =
      //   wb_company_eta.Sheets[wb_company_eta.SheetNames[0]];

      // const ws_company_leadtime =
      //   wb_company_leadtime.Sheets[wb_company_leadtime.SheetNames[0]];

      // const ws_provider_inventory =
      //   wb_provider_inventory.Sheets[wb_provider_inventory.SheetNames[0]];

      // name of all columns

      // let ton_kho_HN = 0;

      // let ton_kho_HCM = 0;

      // let ton_kho_KGG_HN = 0;

      // let ton_kho_KGG_HCM = 0;

      // let giu_hang_HN = 0;

      // let giu_hang_HCM = 0;

      // let hang_sap_ve = 0;

      // let hang_chua_mua = 0;

      // let ton_kho_hang = 0;

      // let hang_sap_ve_kho_hang = 0;

      // let tien_do = "";

      // let UPC_CODE = "";

      // // loop through all rows of company inventory sheet until reach the end of the sheet
      // let isFoundedProduct = false;
      // let row = 13;

      // console.log("check ma");
      // while (true) {
      //   const cellAddress = "A" + row;
      //   const cell = ws_company_inventory[cellAddress];
      //   // console.log(cell);
      //   if (!cell || !cell.v || String(cell.v.trim()).includes("Total")) {
      //     break;
      //   }
      //   if (
      //     String(cell.v).toLowerCase().trim() ===
      //     String(productCode).toLowerCase().trim()
      //   ) {
      //     console.log("fsdf");
      //     console.log(row);
      //     console.log(ws_company_inventory.length);
      //     console.log(ws_company_inventory["H" + row]);

      //     ton_kho_HN = Number(ws_company_inventory["BT" + row].v || 0);

      //     console.log("ton_kho_HN", ton_kho_HN);
      //     ton_kho_HCM = Number(ws_company_inventory["AF" + row].v || 0);

      //     console.log("ton_kho_HCM", ton_kho_HCM);
      //     ton_kho_KGG_HN = Number(ws_company_inventory["BL" + row].v || 0);

      //     ton_kho_KGG_HCM = Number(ws_company_inventory["X" + row].v || 0);

      //     giu_hang_HN =
      //       Number(ws_company_inventory["BS" + row].v || 0) +
      //       Number(ws_company_inventory["BK" + row].v || 0);

      //     giu_hang_HCM =
      //       Number(ws_company_inventory["W" + row].v || 0) +
      //       Number(ws_company_inventory["AE" + row].v || 0);

      //     hang_sap_ve =
      //       Number(ws_company_inventory["AD" + row].v || 0) +
      //       Number(ws_company_inventory["BR" + row].v || 0);

      //     hang_chua_mua =
      //       Number(ws_company_inventory["AI" + row].v || 0) +
      //       Number(ws_company_inventory["BW" + row].v || 0);

      //     isFoundedProduct = true;

      //     UPC_CODE = ws_company_inventory["B" + row].v;

      //     break;
      //   }

      //   row++;
      // }

      // console.log(UPC_CODE);
      // console.log(isFoundedProduct);
      // // loop through all rows of provider inventory sheet until reach the end of the sheet if product is founded in company inventory sheet
      // if (UPC_CODE) {
      //   let row = 13;

      //   while (true) {
      //     const cellAddress = "A" + row;
      //     const cell = ws_provider_inventory[cellAddress];
      //     if (!cell || !cell.v) {
      //       break;
      //     }
      //     if (
      //       String(cell.v).toLowerCase().trim() ===
      //       String(productCode).toLowerCase().trim()
      //     ) {
      //       ton_kho_hang = Number(ws_provider_inventory["E" + row].v || 0);
      //       hang_sap_ve_kho_hang = Number(
      //         ws_provider_inventory["F" + row].v || 0
      //       );

      //       break;
      //     }

      //     row++;
      //   }
      // }

      // if (isFoundedProduct) {
      //   if (sale_location === "HN") {
      //     // check expected quantity
      //     switch (true) {
      //       case expectedQuantity <= ton_kho_HN + ton_kho_KGG_HN:
      //         tien_do = "Có sẵn";
      //         break;
      //       case expectedQuantity <=
      //         ton_kho_HN + ton_kho_KGG_HN + ton_kho_HCM + ton_kho_KGG_HCM:
      //         tien_do = "5-7 ngày";
      //         break;
      //       case expectedQuantity <=
      //         ton_kho_HN +
      //           ton_kho_KGG_HN +
      //           ton_kho_HCM +
      //           ton_kho_KGG_HCM +
      //           ton_kho_hang:
      //         tien_do = "7-10 ngày";
      //         break;
      //       case expectedQuantity <=
      //         ton_kho_HN +
      //           ton_kho_KGG_HN +
      //           ton_kho_HCM +
      //           ton_kho_KGG_HCM +
      //           ton_kho_hang +
      //           hang_sap_ve -
      //           hang_chua_mua:
      //         let endDate;

      //         let chech_lech_ton_kho_hang_vs_hang_mong_muon =
      //           ton_kho_hang - expectedQuantity;

      //         if (!chech_lech_ton_kho_hang_vs_hang_mong_muon) {
      //           tien_do = "Có sẵn hàng ở tồn kho hãng";
      //           break;
      //         }

      //         // looop through all rows of company eta sheet until reach the end of the sheet
      //         let allETAItems = [];
      //         let row = 2;

      //         while (true) {
      //           const cellAddress = "D" + row;
      //           const cell = ws_company_eta[cellAddress];
      //           if (!cell || !cell.v) {
      //             break;
      //           }
      //           if (
      //             String(cell.v).toLowerCase().trim() ===
      //             String(productCode).toLowerCase().trim()
      //           ) {
      //             let eta_quantity = Number(ws_company_eta["F" + row].v || 0);
      //             let eta_delivered_date = ws_company_eta["H" + row].v;
      //             allETAItems.push({ eta_delivered_date, eta_quantity });
      //           }
      //           row++;
      //         }

      //         // if eta items is empty
      //         if (!allETAItems.length) {
      //           tien_do = "Không có dữ liệu ETA";
      //           break;
      //         }

      //         let totalQuantityOfETAItems = allETAItems.reduce(
      //           (total, item) => total + item.eta_quantity,
      //           0
      //         );

      //         let diff = totalQuantityOfETAItems - hang_chua_mua;

      //         // nếu hàng chưa mua lớn hơn hoặc bằng số hàng đang về của eta thì sao?
      //         if (diff <= 0) {
      //           tien_do = "Bla bla bla";
      //           break;
      //         }

      //         // nếu hàng muốn mua mà nhỏ hơn số hàng đang về eta thì sao?
      //         if (diff < expectedQuantity) {
      //           tien_do = "Bla bla bla";
      //           break;
      //         }

      //         let retainQuantity = expectedQuantity + hang_chua_mua;

      //         for (let i = 0; i < allETAItems.length; i++) {
      //           let etaItem = allETAItems[i];
      //           if (retainQuantity <= etaItem.eta_quantity) {
      //             endDate = etaItem.eta_delivered_date;
      //             break;
      //           }
      //           retainQuantity -= etaItem.eta_quantity;
      //         }

      //         if (!endDate) {
      //           tien_do = "Không có dữ liệu ETA";
      //           break;
      //         }

      //         // caculate weeks between endDate and searchDate using date-fns

      //         let diff_weeks = differenceInCalendarWeeks(
      //           new Date(endDate),
      //           new Date(searchDate)
      //         );

      //         if (diff_weeks <= 0) {
      //           tien_do = "bla blab bla";
      //           break;
      //         }

      //         tien_do = `${diff_weeks}-${diff_weeks + 2} tuần`;
      //         break;

      //       case expectedQuantity >
      //         ton_kho_HN +
      //           ton_kho_KGG_HN +
      //           ton_kho_HCM +
      //           ton_kho_KGG_HCM +
      //           ton_kho_hang +
      //           hang_sap_ve -
      //           hang_chua_mua:
      //         // looop through all rows of company lead time sheet until reach the end of the sheet
      //         let leadTime = 0;
      //         let row1 = 2;

      //         while (true) {
      //           const cellAddress = "A" + row1;
      //           const cell = ws_company_leadtime[cellAddress];
      //           if (!cell || !cell.v) {
      //             break;
      //           }
      //           if (
      //             String(cell.v).toLowerCase().trim() ===
      //             String(productCode).toLowerCase().trim()
      //           ) {
      //             leadTime = Number(ws_company_leadtime["D" + row1].v || 0);
      //             break;
      //           }
      //           row1++;
      //         }

      //         if (!leadTime) {
      //           tien_do = "Không có dữ liệu lead time";
      //           break;
      //         }

      //         let leadStartWeek = parseInt(leadTime / 5);
      //         tien_do = `${leadStartWeek}-${leadStartWeek + 2} tuần`;
      //         break;

      //       case expectedQuantity >
      //         ton_kho_HN +
      //           ton_kho_KGG_HN +
      //           ton_kho_HCM +
      //           ton_kho_KGG_HCM +
      //           ton_kho_hang +
      //           hang_sap_ve -
      //           hang_chua_mua:

      //       default:
      //         tien_do = "Không có dữ liệu do không có hàng trong kho";
      //         break;
      //     }
      //   }
      // }

      // let all_eta_items = [];

      // // looop through all rows of company eta sheet until reach the end of the sheet

      // let row_eta = 2;

      // while (true) {
      //   const cellAddress = "D" + row_eta;
      //   const cell = ws_company_eta[cellAddress];
      //   if (!cell || !cell.v) {
      //     break;
      //   }
      //   if (
      //     String(cell.v).toLowerCase().trim() ===
      //     String(productCode).toLowerCase().trim()
      //   ) {
      //     let eta_quantity = Number(ws_company_eta["F" + row_eta].v || 0);
      //     let eta_delivered_date = ws_company_eta["H" + row_eta].v;
      //     let confirm_vendor_date = ws_company_eta["I" + row_eta].v;
      //     let company_location_area = ws_company_eta["J" + row_eta].v;
      //     all_eta_items.push({
      //       eta_delivered_date,
      //       eta_quantity,
      //       confirm_vendor_date,
      //       company_location_area,
      //     });
      //     break;
      //   }
      //   row_eta++;
      // }

      // let reponse_result = {
      //   ton_kho_HN,
      //   ton_kho_HCM,
      //   ton_kho_KGG_HN,
      //   ton_kho_KGG_HCM,
      //   giu_hang_HN,
      //   giu_hang_HCM,
      //   hang_sap_ve,
      //   hang_chua_mua,
      //   ton_kho_hang,
      //   hang_sap_ve_kho_hang,
      //   tien_do,
      //   isFoundedProduct,
      //   all_eta_items,
      // };

      resolve("reponse_result");
    } catch (error) {
      reject(error);
    }
  });
};

const main = async () => {
  try {
    console.time("time");
    const collections = await getCollectionData({
      collectionName: "company_inventory",
    });
    // console.log(collections);
    console.timeEnd("time");
  } catch (error) {
    console.log(error);
  }
};

main();
