const xlsx = require("xlsx");
const path = require("path");
const getTotalRows = ({ workSheet }) => {
  // const range = xlsx.utils.decode_range(workSheet["!ref"]); // Get the range

  // const totalRows = range.e.r - range.s.r + 1; // Calculate the total rows. '+1' is necessary because the range is 0-indexed.

  // return totalRows;
  let rowCount = 0;
  for (let row in workSheet) {
    if (row[0] === "!") continue; // Skip properties that start with '!'
    const rowNum = parseInt(row.match(/\d+/));
    rowCount = Math.max(rowCount, rowNum);
  }
  return rowCount;
};

const getWorkSheet = ({ fileName }) => {
  const wb = xlsx.readFile(
    path.join(__dirname, ".", "data", "Mitsubishi", `${fileName}`)
  );

  const workSheet = wb.Sheets[wb.SheetNames[0]];

  return workSheet;
};

exports.readAndGetProductItems = async () => {
  try {
    let products = [];

    // Get work sheets
    const ws_company_inventory = getWorkSheet({
      fileName: "COMPANY-INVENTORY.xls",
    });

    const ws_company_eta = getWorkSheet({
      fileName: "COMPANY-ETA.xls",
    });

    const ws_company_leadtime = getWorkSheet({
      fileName: "COMPANY-LEADTIME.xls",
    });

    const ws_provider_inventory = getWorkSheet({
      fileName: "PROVIDER-INVENTORY.xlsx",
    });

    // Get worksheet total rows
    const totalRows_company_inventory = getTotalRows({
      workSheet: ws_company_inventory,
    });

    const totalRows_company_eta = getTotalRows({
      workSheet: ws_company_eta,
    });

    const totalRows_company_leadtime = getTotalRows({
      workSheet: ws_company_leadtime,
    });

    const totalRows_provider_inventory = getTotalRows({
      workSheet: ws_provider_inventory,
    });

    for (let row = 13; row <= totalRows_company_inventory; row++) {
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
        Number(ws_company_inventory["BS" + row]?.v || 0) +
        Number(ws_company_inventory["BK" + row]?.v || 0);

      product.giu_hang_HCM =
        Number(ws_company_inventory["W" + row]?.v || 0) +
        Number(ws_company_inventory["AE" + row]?.v || 0);

      product.hang_sap_ve =
        Number(ws_company_inventory["AD" + row]?.v || 0) +
        Number(ws_company_inventory["BR" + row]?.v || 0);

      product.hang_chua_mua =
        Number(ws_company_inventory["AI" + row]?.v || 0) +
        Number(ws_company_inventory["BW" + row]?.v || 0);

      // Get quantity from provider inventory sheet
      let UPC_CODE = ws_company_inventory["B" + row]
        ? ws_company_inventory["B" + row].v
        : null;

      if (UPC_CODE) {
        for (let row = 3; row <= totalRows_provider_inventory; row++) {
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
        }
      }

      // get lead time from company lead time sheet
      for (let row = 2; row <= totalRows_company_leadtime; row++) {
        const cellAddress = "A" + row;
        const cell = ws_company_leadtime[cellAddress];
        if (!cell || !cell.v) {
          break;
        }
        if (
          String(cell.v).toLowerCase().trim() ===
          String(product.product_code).toLowerCase().trim()
        ) {
          product.lead_time = ws_company_leadtime["D" + row]
            ? Number(ws_company_leadtime["D" + row].v)
            : 0;
          break;
        }
      }
      // get eta from company eta sheet
      let tempEtaItems = [];

      for (let row = 2; row <= totalRows_company_eta; row++) {
        const cellAddress = "D" + row;
        const cell = ws_company_eta[cellAddress];
        if (!cell || !cell.v) {
          break;
        }
        if (
          String(cell.v).toLowerCase().trim() ===
          String(product.product_code).toLowerCase().trim()
        ) {
          tempEtaItems.push({
            eta_delivered_date: ws_company_eta["H" + row]
              ? ws_company_eta["H" + row].w
              : null,
            eta_quantity: ws_company_eta["F" + row]
              ? Number(ws_company_eta["F" + row].v)
              : 0,
            confirm_vendor_date: ws_company_eta["I" + row]
              ? ws_company_eta["I" + row].w
              : null,
            company_location_area: ws_company_eta["J" + row]
              ? ws_company_eta["J" + row].v
              : null,
          });
        }
      }

      // sort tempEtaitems by eta_delivered_date in ascending order
      product.eta_items = tempEtaItems.sort((a, b) => {
        return new Date(a.eta_delivered_date) - new Date(b.eta_delivered_date);
      });

      products.push(product);
    }
    console.log(products.length);

    return products;
  } catch (error) {
    console.log(error);
  }
};
