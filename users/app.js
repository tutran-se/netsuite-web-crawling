require("dotenv").config();

// MongoDB + Redis
const { dbConnect } = require("./configs/dbConnect");
const redisClient = require("./configs/redisInstance");
const helmet = require("helmet");

// Import modules
const express = require("express");
const cors = require("cors");

// Import routes

// Initialize App
const app = express();

// Midlewares
app.use(cors({ origin: "*" }));

app.use(helmet());
app.use(express.json({ limit: "10MB" }));

// Routes
const authRoute = require("./routes/authRoute");
const InventorySearchByUser = require("./models/InventorySearchByUser");
const redisConfigClient = require("./configs/redisConfig");

app.use("/api/v1/users", authRoute);

app.get("/api/v1/users/health", async (_, res) => {
  try {
    res.send("Hello from user service !!!!");
  } catch (error) {
    console.log(error);
  }
});

// Listen Server
const PORT = process.env.PORT || 5001;

const runServer = async () => {
  try {
    // connect to db
    dbConnect();

    // connect to redis
    await redisClient.connect();
    await redisConfigClient.connect();

    await redisClient.subscribe("inventorySearchByUser", async (data) => {
      // console.log(data);
      let { userId, search_date, items } = JSON.parse(data);

      let { month, day, year } = search_date;

      let date = new Date(year, month - 1, day);

      date.setUTCHours(0, 0, 0, 0);

      // convert date to ISO format
      date = date.toISOString();

      for (let item of items) {
        if (item.productDetails) {
          // upsert InventorySearchByUser with same data and user id, and then increse quantity by 1 for a partiticular provider
          const foundInventorySearchByUser =
            await InventorySearchByUser.findOne({
              date,
              user: userId,
            });

          if (foundInventorySearchByUser) {
            let foundProviders = foundInventorySearchByUser.providers;

            const foundProvider = foundProviders.find(
              (provider) => provider.name === item.productDetails.provider
            );

            if (foundProvider) {
              await InventorySearchByUser.updateOne(
                {
                  date,
                  user: userId,
                  "providers.name": item.productDetails.provider,
                },
                {
                  $inc: { "providers.$.quantity": 1 },
                }
              );
            } else {
              await InventorySearchByUser.updateOne(
                {
                  date,
                  user: userId,
                },
                {
                  $push: {
                    providers: {
                      name: item.productDetails.provider,
                      quantity: 1,
                    },
                  },
                }
              );
            }
          } else {
            const newInventorySearchByUser = new InventorySearchByUser({
              date,
              user: userId,
              providers: [
                {
                  name: item.productDetails.provider,
                  quantity: 1,
                },
              ],
            });
            await newInventorySearchByUser.save();
          }
        }
      }
    });

    app.listen(PORT, () => {
      console.log("[User_Service] Server is running on port " + PORT);
    });
  } catch (error) {
    console.log(error);
  }
};

runServer();
