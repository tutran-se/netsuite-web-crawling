require("dotenv").config();
const xlsx = require("xlsx");
const path = require("path");
const { dbConnect } = require("../configs/dbConnect");
const Product = require("../models/ProductModel");
const { createClient } = require("redis");
const client = createClient({
  url: "redis://default:redispw@localhost:55000",
});

client.on("error", (err) => console.log("Redis Client Error", err));
const main = async () => {
  try {
    // for mitsubishi
    dbConnect();
    await client.connect();
    let products = [];
    console.time("time");

    // COMPANY INVENTORY
    const wb_company_inventory = xlsx.readFile(
      path.join(__dirname, "..", "data", "Mitsubishi", "COMPANY-INVENTORY.xls")
    );

    // COMPANY ETA
    const wb_company_eta = xlsx.readFile(
      path.join(__dirname, "..", "data", "Mitsubishi", "COMPANY-ETA.xls")
    );

    // COMPANY LEAD TIME
    const wb_company_leadtime = xlsx.readFile(
      path.join(__dirname, "..", "data", "Mitsubishi", "COMPANY-LEADTIME.xls")
    );

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

    // Get work sheets
    const ws_company_inventory =
      wb_company_inventory.Sheets[wb_company_inventory.SheetNames[0]];

    const ws_company_eta = wb_company_eta.Sheets[wb_company_eta.SheetNames[0]];

    const ws_company_leadtime =
      wb_company_leadtime.Sheets[wb_company_leadtime.SheetNames[0]];

    const ws_provider_inventory =
      wb_provider_inventory.Sheets[wb_provider_inventory.SheetNames[0]];

    // get product code and initital data from company inventory sheet
    let row = 13;

    while (true) {
      const cellAddress = "A" + row;
      const cell = ws_company_inventory[cellAddress];
      if (!cell || !cell.v || String(cell.v).trim().includes("Total")) {
        break;
      }

      let product = {
        provider: "Mitsubishi",
      };
      product.product_code = cell.v;
      product.ton_kho_hang = 0;
      product.hang_sap_ve_kho_hang = 0;
      product.eta_items = [];

      // get quantity from company inventory sheet
      product.ton_kho_HN = ws_company_inventory["BT" + row]
        ? Number(ws_company_inventory["BT" + row].v)
        : 0;
      product.ton_kho_HCM = ws_company_inventory["AF" + row]
        ? Number(ws_company_inventory["AF" + row].v)
        : 0;
      product.ton_kho_KGG_HN = ws_company_inventory["BL" + row]
        ? Number(ws_company_inventory["BL" + row].v)
        : 0;
      product.ton_kho_KGG_HCM = ws_company_inventory["X" + row]
        ? Number(ws_company_inventory["X" + row].v)
        : 0;
      product.giu_hang_HN =
        ws_company_inventory["BS" + row] && ws_company_inventory["BK" + row]
          ? Number(ws_company_inventory["BS" + row].v) +
            Number(ws_company_inventory["BK" + row].v)
          : 0;
      product.giu_hang_HCM =
        ws_company_inventory["W" + row] && ws_company_inventory["AE" + row]
          ? Number(ws_company_inventory["W" + row].v) +
            Number(ws_company_inventory["AE" + row].v)
          : 0;
      product.hang_sap_ve =
        ws_company_inventory["AD" + row] && ws_company_inventory["BR" + row]
          ? Number(ws_company_inventory["AD" + row].v) +
            Number(ws_company_inventory["BR" + row].v)
          : 0;
      product.hang_chua_mua =
        ws_company_inventory["AI" + row] && ws_company_inventory["BW" + row]
          ? Number(ws_company_inventory["AI" + row].v) +
            Number(ws_company_inventory["BW" + row].v)
          : 0;

      let UPC_CODE = ws_company_inventory["B" + row]
        ? ws_company_inventory["B" + row].v
        : null;

      // get quantity from provider inventory sheet
      if (UPC_CODE) {
        let row = 3;
        while (true) {
          const cellAddress = "B" + row;
          const cell = ws_provider_inventory[cellAddress];
          if (!cell || !cell.v) {
            break;
          }
          if (
            String(cell.v).toLowerCase().trim() ===
            String(UPC_CODE).toLowerCase().trim()
          ) {
            product.ton_kho_hang = ws_provider_inventory["E" + row]
              ? Number(ws_provider_inventory["E" + row].v)
              : 0;
            product.hang_sap_ve_kho_hang = ws_provider_inventory["F" + row]
              ? Number(ws_provider_inventory["F" + row].v)
              : 0;
            break;
          }

          row++;
        }
      }

      // get lead time from company lead time sheet
      let row_lead_time = 2;

      while (true) {
        const cellAddress = "A" + row_lead_time;
        const cell = ws_company_leadtime[cellAddress];
        if (!cell || !cell.v) {
          break;
        }
        if (
          String(cell.v).toLowerCase().trim() ===
          String(product.product_code).toLowerCase().trim()
        ) {
          product.lead_time = ws_company_leadtime["D" + row_lead_time]
            ? Number(ws_company_leadtime["D" + row_lead_time].v)
            : 0;
          break;
        }

        row_lead_time++;
      }

      // get eta from company eta sheet
      let row_eta = 2;

      while (true) {
        const cellAddress = "D" + row_eta;
        const cell = ws_company_eta[cellAddress];
        if (!cell || !cell.v) {
          break;
        }
        if (
          String(cell.v).toLowerCase().trim() ===
          String(product.product_code).toLowerCase().trim()
        ) {
          product.eta_items.push({
            eta_delivered_date: ws_company_eta["H" + row_eta]
              ? ws_company_eta["H" + row_eta].w
              : null,
            eta_quantity: ws_company_eta["F" + row_eta]
              ? Number(ws_company_eta["F" + row_eta].v)
              : 0,
            confirm_vendor_date: ws_company_eta["I" + row_eta]
              ? ws_company_eta["I" + row_eta].w
              : null,
            company_location_area: ws_company_eta["J" + row_eta]
              ? ws_company_eta["J" + row_eta].v
              : null,
          });
          break;
        }
        row_eta++;
      }

      products.push(product);
      row++;
    }
    console.log(products.length);
    const bulkOps = products.map((product) => ({
      updateOne: {
        filter: { product_code: product.product_code, provider: "Mitsubishi" },
        update: { $set: product },
        upsert: true,
      },
    }));
    Product.bulkWrite(bulkOps);

    // save to redis
    console.time("redis");
    const allPromisesItems = products.map((product) => {
      return new Promise(async (resolve, reject) => {
        try {
          const key = `product:${product.product_code}`;
          const value = JSON.stringify(product);
          await client.set(key, value);
          resolve();
        } catch (error) {
          reject(error);
        }
      });
    });

    await Promise.all(allPromisesItems);

    console.timeEnd("redis");
    console.timeEnd("time");
  } catch (error) {
    console.log(error);
  }
};

main();

// const {
//   getProductDetails,
//   getProductDetailsRedis,
// } = require("../controllers/product/productController");

// const main = async () => {
//   dbConnect();
//   // add line break in console
//   console.log("\n");
//   // await getProductDetails();

//   console.log("\n");
//   await getProductDetailsRedis();
// };

// main();
