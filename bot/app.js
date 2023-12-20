require("dotenv").config();

const path = require("path");
const fs = require("fs");
const puppeteer = require("puppeteer");

const { dbConnect } = require("./configs/dbConnect");
const redisClient = require("./configs/redisInstance");
const Product = require("./models/ProductModel");
const StatusData = require("./models/StatusModel");
const { readAndGetProductItems } = require("./helpers");

const readAndSaveData = async () => {
  try {
    console.log("===== START READ AND SAVE DATA TO MONOGODB + REDIS ====");

    const products = await readAndGetProductItems();

    // == DELETE ALL ITEMS THAT ARE NOT IN THE "products" ARRAY ==
    console.log(
      "DELETE ALL MONGODB ITEMS THAT ARE NOT IN THE 'products' ARRAY"
    );
    const allItemSavedInMongoDB = await Product.find({});

    // filter out all items that are not in the "products" array from allItemSavedInMongoDB
    const allItemThatNotInTheProductsArray = allItemSavedInMongoDB.filter(
      (item) => {
        return !products.find((product) => {
          return (
            product.product_code === item.product_code &&
            item.provider === "Mitsubishi"
          );
        });
      }
    );

    const idsToDelete = allItemThatNotInTheProductsArray.map(
      (item) => item._id
    );

    await Product.deleteMany({ _id: { $in: idsToDelete } });

    // await Promise.all(allPromisesDelete);

    // == SAVE/UPDATE ALL "product" ITEMS TO MONGODB ==
    console.log("SAVE/UPDATE ALL 'product' ITEMS TO MONGODB");
    const bulkOps = products.map((product) => ({
      updateOne: {
        filter: {
          product_code: product.product_code,
          provider: "Mitsubishi",
        },
        update: { $set: product },
        upsert: true,
      },
    }));
    Product.bulkWrite(bulkOps);

    // DELETE ALL REDIS ITEMS THAT ARE NOT IN THE "products" ARRAY
    console.log("DELETE ALL REDIS ITEMS THAT ARE NOT IN THE 'products' ARRAY");

    const deleteItemFromRedis = async (item) => {
      const key = `product:${String(item.product_code).toLowerCase()}`;
      await redisClient.del(key);
    };

    for (
      let index = 0;
      index < allItemThatNotInTheProductsArray.length;
      index++
    ) {
      const item = allItemThatNotInTheProductsArray[index];
      try {
        await deleteItemFromRedis(item);
      } catch (error) {
        console.error(`Error deleting item at index ${index}:`, error);
        // Handle error as needed
      }
    }

    // == SAVE/UPDATE ALL "product" ITEMS TO REDIS DB ==
    console.time("redis");
    console.log("SAVE/UPDATE ALL 'product' ITEMS TO REDIS DB");

    // await Promise.all(allPromisesItems);
    const setItemInRedis = async (product) => {
      const key = `product:${String(product.product_code).toLowerCase()}`;
      const value = JSON.stringify(product);
      await redisClient.set(key, value);
    };

    for (const product of products) {
      try {
        await setItemInRedis(product);
      } catch (error) {
        console.error("Error setting item in Redis:", error);
        // Handle error as needed, possibly breaking the loop if it should stop on error
      }
    }

    // save status
    const now = new Date();
    const statusData = {
      lastUpdated: now.toISOString(),
      provider: "Mitsubishi",
      day: now.getUTCDate(),
      month: now.getUTCMonth() + 1,
      year: now.getUTCFullYear(),
      hour: now.getUTCHours(),
      minute: now.getUTCMinutes(),
    };

    const key = `status:Mitsubishi`;
    const value = JSON.stringify(statusData);
    await redisClient.set(key, value);

    // increase total
    await StatusData.findOneAndUpdate(
      {
        provider: "Mitsubishi",
      },
      {
        $inc: { total: 1 },
        $set: statusData,
      },
      {
        upsert: true,
      }
    );

    console.timeEnd("redis");
    console.timeEnd("time");

    console.log("FINISH");
  } catch (error) {
    console.log(error);
  }
};

const searchAndViewPage = ({ page, reportName }) => {
  //Báo cáo tình hình thực hiện PO chưa hoàn thành_ETA
  return new Promise(async (resolve, reject) => {
    try {
      // await for input with placeholder "Search"
      const searchBox = await page.waitForSelector(
        'input[placeholder="Search"]'
      );
      await searchBox.type(reportName);

      await page.waitForTimeout(2000);

      await Promise.all([
        page.keyboard.press("Enter"),
        page.waitForNavigation({ timeout: 60000 }),
      ]);
      await page.waitForTimeout(5000);

      // find a link with text "View" and click on it
      const viewLink2 = (await page.$x('//a[contains(text(), "View")]'))[0];

      // Click on the link
      await viewLink2.click();

      await page.waitForNavigation({ timeout: 60000 });
      await page.waitForTimeout(10000);
      resolve();
    } catch (error) {
      reject(error);
    }
  });
};

const saveFiletoDataFolder = ({ fileNameString, fileType }) => {
  const filenames = fs.readdirSync(path.resolve(__dirname, "download"));
  const filename = filenames[0];

  fs.renameSync(
    `${path.resolve(__dirname, "download")}/${filename}`,
    `${path.resolve(
      __dirname,
      "data/Mitsubishi"
    )}/${fileNameString}.${fileType}`
  );
  console.log(`Done saving ${fileNameString}.${fileType}`);
};

const downloadFiles = async () => {
  // Launch a headless browser using Puppeteer
  // const browser = await puppeteer.launch({ headless: false });
  let browser;
  try {
    console.log("==== START DOWNLOAD EXCEL FILES ====");
    console.time("Time for download excel files");
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
    await page.goto(process.env.NETSUITE_LOGIN_URL);

    // Set the browser window to full screen mode
    await page.evaluate(() => {
      document.documentElement.requestFullscreen();
    });

    const email = process.env.NETSUITE_EMAIL;
    const password = process.env.NETSUITE_PASSWORD;

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

    // SECURITY QUESTION
    console.log("==== SECURITY QUESTION ====");
    // Find the <tr> element containing the question with anwser 1
    const questionTr1 = await page.$$eval("tr", (trs) =>
      trs.find((tr) =>
        tr.textContent.includes("What was the name of your favorite teacher")
      )
    );

    const questionTr2 = await page.$$eval("tr", (trs) =>
      trs.find((tr) =>
        tr.textContent.includes(
          "In what city did you meet your spouse/significant other"
        )
      )
    );

    let answerValue = "";
    if (questionTr1) {
      answerValue = "doantien";
    }
    if (questionTr2) {
      answerValue = "doantien1";
    }
    if (!questionTr1 && !questionTr2) {
      answerValue = "doantien2";
    }

    const answerInput = await page.$('input[name="answer"]');
    const submitButton = await page.$('input[type="submit"]');

    // wait for the answer input to appear
    await page.waitForSelector('input[name="answer"]');
    await page.waitForSelector('input[type="submit"]');

    await answerInput.type(answerValue);

    // submit
    await submitButton.click();

    await page.waitForTimeout(5000);

    // ====== COMPANY_INVENTORY =========
    console.log("==== SEARCH AND DOWNLOAD: COMPANY_INVENTORY ====");
    console.time("Time for download COMPANY_INVENTORY");
    await searchAndViewPage({
      page,
      reportName: "Báo cáo tồn kho hiện tại_Akabot_DH_DHID_FAFA_RTT",
    });

    await page.waitForSelector("button#xlsbutton");
    // download report by click on button

    await page.waitForFunction(
      () => document.querySelector("button#xlsbutton").disabled === false
    );

    const downloadReportInventoryButton = await page.$(
      'button[type="button"][id="xlsbutton"]'
    );

    await downloadReportInventoryButton.click();

    await page.waitForTimeout(10000);

    // let retry = 0;
    // while (true) {
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
    console.timeEnd("Time for download COMPANY_INVENTORY");

    saveFiletoDataFolder({
      fileNameString: "COMPANY-INVENTORY",
      fileType: "xls",
    });

    // ====== COMPANY_ETA =========
    console.log("==== SEARCH AND DOWNLOAD: COMPANY_ETA ====");
    console.time("Time for download COMPANY_ETA");
    // reset retry
    retry = 0;
    // go one page back
    await page.waitForTimeout(10000);

    await searchAndViewPage({
      page,
      reportName: "Báo cáo tình hình thực hiện PO chưa hoàn thành_ETA",
    });

    await page.waitForTimeout(10000);

    await page.waitForSelector('div[data-button-code="exportXLS"]');

    const exportETAButton = await page.$('div[data-button-code="exportXLS"]');

    // click on button
    await exportETAButton.click();

    await page.waitForTimeout(10000);

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
    // while (true) {
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

    saveFiletoDataFolder({
      fileNameString: "COMPANY-ETA",
      fileType: "xls",
    });

    console.timeEnd("Time for download COMPANY_ETA");

    // ====== COMPANY_LEADTIME =========
    console.log("==== SEARCH AND DOWNLOAD: COMPANY_LEADTIME ====");
    console.time("Time for download COMPANY_LEADTIME");
    // reset retry
    // retry = 0;

    await page.waitForTimeout(10000);
    await searchAndViewPage({
      page,
      reportName: "NS TAX CODE_LEAD TIME_AKABOT",
    });

    await page.waitForTimeout(5000);

    await page.waitForSelector('div[data-button-code="exportXLS"]');

    const exportLeadTimeButton = await page.$(
      'div[data-button-code="exportXLS"]'
    );

    // click on button
    await exportLeadTimeButton.click();

    await page.waitForTimeout(10000);

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
    // while (true) {
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

    saveFiletoDataFolder({
      fileNameString: "COMPANY-LEADTIME",
      fileType: "xls",
    });

    console.timeEnd("Time for download COMPANY_LEADTIME");

    // ====== PROVIDER-INVENTORY =========
    console.log("==== SEARCH AND DOWNLOAD: PROVIDER-INVENTORY ====");
    console.time("Time for download PROVIDER-INVENTORY");
    // reset retry
    // retry = 0;

    await Promise.all([
      page.goto("https://distributors.mitsubishi-electric.vn/login"),
      page.waitForNavigation({ timeout: 60000 }),
    ]);

    const userName = process.env.MITSUI_USERNAME;
    const password2 = process.env.MITSUI_PASSWORD;

    // wait for page fully loaded
    await page.waitForSelector("input[type='text']");
    await page.waitForSelector("input[type='password']");

    // Fill in the login form
    // fill in userName with input type=text
    await page.type("input[type='text']", userName);

    // fill in password with input type=password
    await page.type("input[type='password']", password2);

    await page.keyboard.press("Enter");

    await page.waitForNavigation({ timeout: 60000 });

    // refresh page
    await page.reload();

    await page.waitForTimeout(10000);

    // click on div with aria-label = "Export"
    await page.waitForSelector("div[aria-label='Export']");
    await page.click("div[aria-label='Export']");

    // while (true) {
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
      fileNameString: "PROVIDER-INVENTORY",
      fileType: "xlsx",
    });

    console.timeEnd("Time for download PROVIDER-INVENTORY");

    // save file to data folder

    console.timeEnd("Time for download excel files");

    // close browser
    await browser.close();
  } catch (error) {
    // if got error, close browser and re-run
    await browser.close();
    console.log(error);
    // wait for 10 minutes
    await new Promise((resolve) => setTimeout(resolve, 600000));
    await downloadFiles();
  }
};
const main = async () => {
  try {
    // connect MongoDB
    dbConnect();

    // connect redis
    await redisClient.connect();

    console.log("Redis Connected");

    await downloadFiles();
    await readAndSaveData();
  } catch (error) {
    console.log(error);
  }
};

main();
