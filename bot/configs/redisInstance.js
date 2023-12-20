// connect to redis
const { createClient } = require("redis");
const redisClient = createClient({
  url: process.env.REDIS_URL,
});

redisClient.on("error", (err) => console.log("Redis Client Error", err));

// export redis client
module.exports = redisClient;
