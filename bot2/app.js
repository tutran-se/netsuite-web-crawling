// require("dotenv").config();

const path = require("path");
const fs = require("fs");
const puppeteer = require("puppeteer");
const xlsx = require("xlsx");

const { TOTP } = require("otpauth");

// Create a new TOTP object
let totp = new TOTP({
  secret: process.env.NETSUITE_SECRET_KEY,
  algorithm: "SHA1",
  digits: 6,
  period: 30,
});

const saveFiletoDataFolder = ({ fileNameString, fileType }) => {
  const sourceDir = path.resolve(__dirname, "download");
  const targetDir = path.resolve(__dirname, "data");

  const filenames = fs.readdirSync(sourceDir);
  const filename = filenames[0];

  // const sourcePath = path.join(sourceDir, filename);
  // const targetPath = path.join(targetDir, `${fileNameString}.${fileType}`);

  // fs.copyFileSync(sourcePath, targetPath); // Copy the file
  // fs.unlinkSync(sourcePath); // Delete the original file
  const sourcePath = path.join(sourceDir, filename);
  const workbook = xlsx.readFile(sourcePath);
  const newFilename = path.basename(fileNameString, ".xls") + ".xlsb";
  const targetPath = path.join(targetDir, newFilename);
  xlsx.writeFile(workbook, targetPath, { bookType: "xlsb" });
  fs.unlinkSync(sourcePath);
  console.log(`Done saving ${fileNameString}.${fileType}`);
};

const downloadFiles = async () => {
  let browser;
  try {
    console.log("==== START DOWNLOAD EXCEL FILES ====");
    console.time("Time for download excel files");
    // Launch a headless browser using Puppeteer

    // browser = await puppeteer.launch({ headless: false });
    browser = await puppeteer.launch({
      headless: true,
      executablePath: "/usr/bin/google-chrome",
      args: ["--no-sandbox", "--disable-gpu"],
    });
    const page = await browser.newPage();

    // Set viewport size
    await page.setViewport({
      width: 1280,
      height: 800,
    });

    const client = await page.target().createCDPSession();

    // set downloadPath configuration in puppeteer
    await client.send("Page.setDownloadBehavior", {
      behavior: "allow",
      downloadPath: path.resolve(__dirname, "download"),
    });

    // LOGIN PAGE
    console.log("==== LOGIN ====");
    // Navigate to the login page
    await page.goto(process.env.NETSUITE_LOGIN_URL_2);

    // Set the browser window to full screen mode
    await page.evaluate(() => {
      document.documentElement.requestFullscreen();
    });

    const email = process.env.NETSUITE_EMAIL_2;
    const password = process.env.NETSUITE_PASSWORD_2;

    // wait for the login form to appear
    await page.waitForSelector("#email");
    await page.waitForSelector("#password");

    // Fill in the login form
    await page.type("#email", email);
    await page.type("#password", password);

    // Submit the form
    await Promise.all([page.waitForNavigation(), page.click("#submitButton")]);

    // // Wait for the page to load
    await page.waitForTimeout(3000);
    await page.waitForTimeout(10000);

    // Generate a current OTP
    let token = totp.generate();

    const answerInput = await page.$('input[placeholder="6-digit code"]');
    const submitButton = await page.$('div[aria-label="Submit"]');

    // // wait for the answer input to appear
    await page.waitForSelector('input[placeholder="6-digit code"]');
    await page.waitForSelector('div[aria-label="Submit"]');

    await answerInput.type(token);

    // submit
    await submitButton.click();

    await page.waitForTimeout(5000);

    // // ====== BÁO CÁO TÌNH TRẠNG GIỮ HÀNG =========
    // console.log("==== BÁO CÁO TÌNH TRẠNG GIỮ HÀNG ====");

    // await page.goto(process.env.LINK_BC_TINH_TRANG_GIU_HANG);

    // await page.waitForSelector("button#xlsbutton");
    // // download report by click on button

    // await page.waitForFunction(
    //   () => document.querySelector("button#xlsbutton").disabled === false
    // );

    // const downloadReportInventoryButton = await page.$(
    //   'button[type="button"][id="xlsbutton"]'
    // );

    // await downloadReportInventoryButton.click();

    // await page.waitForTimeout(10000);

    // for (let retry = 0; retry < 4; retry++) {
    //   const filenames = fs.readdirSync(path.resolve(__dirname, "download"));
    //   const filename = filenames[0];
    //   if (!filename) {
    //     console.log("File not found");
    //     await page.waitForTimeout(10000);
    //     if (retry >= 3) {
    //       console.log("Retry >= 3 times");
    //       throw new Error("Retry >= 3 times");
    //     }
    //     retry++;
    //   }
    //   if (filename && !filename.includes("crdownload")) {
    //     console.log("File downloaded");
    //     break;
    //   }

    //   if (filename && filename.includes("crdownload")) {
    //     console.log("File is downloading");
    //     await page.waitForTimeout(10000);
    //     continue;
    //   }
    // }

    // saveFiletoDataFolder({
    //   fileNameString: "BC_TINH_TRANG_GIU_HANG",
    //   fileType: "xls",
    // });

    // // ====== BÁO CÁO DOANH SỐ KÝ =========
    // console.log("==== BÁO CÁO DOANH SỐ KÝ ====");

    // await page.goto(process.env.LINK_BC_DOANH_SO_KY);

    // await page.waitForSelector('div[data-button-code="exportXLS"]');

    // const button2 = await page.$('div[data-button-code="exportXLS"]');

    // // click on button
    // await button2.click();

    // await page.waitForTimeout(10000);

    // for (let retry = 0; retry < 4; retry++) {
    //   const filenames = fs.readdirSync(path.resolve(__dirname, "download"));
    //   const filename = filenames[0];
    //   if (!filename) {
    //     console.log("File not found");
    //     await page.waitForTimeout(10000);
    //     if (retry >= 3) {
    //       console.log("Retry >= 3 times");
    //       throw new Error("Retry >= 3 times");
    //     }
    //     retry++;
    //   }
    //   if (filename && !filename.includes("crdownload")) {
    //     console.log("File downloaded");
    //     break;
    //   }

    //   if (filename && filename.includes("crdownload")) {
    //     console.log("File is downloading");
    //     await page.waitForTimeout(10000);
    //     continue;
    //   }
    // }

    // saveFiletoDataFolder({
    //   fileNameString: "BC_DOANH_SO_KY",
    //   fileType: "xls",
    // });

    // ====== BÁO CÁO DOANH SỐ BÁN =========
    console.log("==== BÁO CÁO DOANH SỐ BÁN ====");

    await page.goto(process.env.LINK_BC_DOANH_SO_BAN);

    await page.waitForSelector('div[data-button-code="exportXLS"]');

    const button3 = await page.$('div[data-button-code="exportXLS"]');

    // click on button
    await button3.click();

    await page.waitForTimeout(60000);

    for (let retry = 0; retry < 4; retry++) {
      const filenames = fs.readdirSync(path.resolve(__dirname, "download"));
      const filename = filenames[0];
      if (!filename) {
        console.log("File not found");
        if (retry >= 3) {
          console.log("Retry >= 3 times");
          throw new Error("Retry >= 3 times");
        }
        retry++;
      }
      if (filename && !filename.includes("crdownload")) {
        console.log("File downloaded");
        break;
      }

      if (filename && filename.includes("crdownload")) {
        console.log("File is downloading");
        await page.waitForTimeout(10000);
        continue;
      }
    }

    saveFiletoDataFolder({
      fileNameString: "BC_DOANH_SO_BAN",
      fileType: "xls",
    });

    // ====== BÁO CÁO HOA HỒNG =========
    console.log("==== BÁO CÁO HOA HỒNG ====");

    await page.goto(process.env.LINK_BC_HOA_HONG);

    await page.waitForSelector('div[data-button-code="exportXLS"]');

    const button4 = await page.$('div[data-button-code="exportXLS"]');

    // click on button
    await button4.click();

    await page.waitForTimeout(60000);

    for (let retry = 0; retry < 4; retry++) {
      const filenames = fs.readdirSync(path.resolve(__dirname, "download"));
      const filename = filenames[0];
      if (!filename) {
        console.log("File not found");
        await page.waitForTimeout(10000);
        if (retry >= 3) {
          console.log("Retry >= 3 times");
          throw new Error("Retry >= 3 times");
        }
        retry++;
      }
      if (filename && !filename.includes("crdownload")) {
        console.log("File downloaded");
        break;
      }

      if (filename && filename.includes("crdownload")) {
        console.log("File is downloading");
        await page.waitForTimeout(10000);
        continue;
      }
    }

    saveFiletoDataFolder({
      fileNameString: "BC_HOA_HONG",
      fileType: "xls",
    });

    // ====== BÁO CÁO TỒN KHO SS =========
    console.log("==== BÁO CÁO TỒN KHO SS ====");

    await page.goto(process.env.LINK_BC_TON_KHO_SS);

    await page.waitForSelector('div[data-button-code="exportXLS"]');

    const button5 = await page.$('div[data-button-code="exportXLS"]');

    // click on button
    await button5.click();

    await page.waitForTimeout(60000);

    for (let retry = 0; retry < 4; retry++) {
      const filenames = fs.readdirSync(path.resolve(__dirname, "download"));
      const filename = filenames[0];
      if (!filename) {
        console.log("File not found");
        await page.waitForTimeout(10000);
        if (retry >= 3) {
          console.log("Retry >= 3 times");
          throw new Error("Retry >= 3 times");
        }
        retry++;
      }
      if (filename && !filename.includes("crdownload")) {
        console.log("File downloaded");
        break;
      }

      if (filename && filename.includes("crdownload")) {
        console.log("File is downloading");
        await page.waitForTimeout(10000);
        continue;
      }
    }

    saveFiletoDataFolder({
      fileNameString: "BC_TON_KHO_SS",
      fileType: "xls",
    });

    // close browser
    await browser.close();
  } catch (error) {
    // // if got error, close browser and re-run
    await browser.close();
    console.log(error);
    // // wait for 10 minutes
    await new Promise((resolve) => setTimeout(resolve, 600000));
    await downloadFiles();
  }
};
const main = async () => {
  try {
    await downloadFiles();
  } catch (error) {
    console.log(error);
  }
};

main();
