// connect to redis
const { createClient } = require("redis");
const redisConfigClient = createClient({
  url: process.env.REDIS_URL,
});

redisConfigClient.on("error", (err) => console.log("Redis Client Error", err));

// export redis client
module.exports = redisConfigClient;
