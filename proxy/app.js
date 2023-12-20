const express = require("express");
const { createProxyMiddleware } = require("http-proxy-middleware");
const helmet = require("helmet");
const cors = require("cors");
const { isAuthenticated } = require("./middlewares/isAuthenticated");
const { isAdmin } = require("./middlewares/isAdmin");
const app = express();

app.use(cors({ origin: "*" }));
app.use(helmet());
app.use(
  express.json({
    limit: "10MB",
  })
);

const PRODUCTS_SERVICE_URL = process.env.PRODUCTS_SERVICE_URL;
const USERS_SERVICE_URL = process.env.USERS_SERVICE_URL;
const REPORTS_SERVICE_URL = process.env.REPORTS_SERVICE_URL;

const defaultOptions = {
  changeOrigin: true,
  onProxyReq: (proxyReq, req) => {
    // Modify the request body before it is forwarded
    if (req.body) {
      if (req.user) {
        proxyReq.setHeader("X-User", JSON.stringify(req.user));
      }
      const bodyData = JSON.stringify(req.body);
      proxyReq.setHeader("Content-Type", "application/json");
      proxyReq.setHeader("Content-Length", Buffer.byteLength(bodyData));
      proxyReq.write(bodyData);
    }
  },
};

// REPORT SERVICE
app.use(
  "/api/v1/reports",
  isAuthenticated,
  createProxyMiddleware({
    ...defaultOptions,
    target: REPORTS_SERVICE_URL,
  })
);
// PRODUCT SERVICE
app.use(
  "/api/v1/products",
  isAuthenticated,
  createProxyMiddleware({
    ...defaultOptions,
    target: PRODUCTS_SERVICE_URL,
  })
);

// USER SERVICE

app.use(
  "/api/v1/users/login",
  createProxyMiddleware({
    ...defaultOptions,
    target: USERS_SERVICE_URL,
  })
);

app.use(
  "/api/v1/users/me",
  isAuthenticated,
  createProxyMiddleware({
    ...defaultOptions,
    target: USERS_SERVICE_URL,
  })
);

app.use(
  "/api/v1/users/changePassword",
  isAuthenticated,
  createProxyMiddleware({
    ...defaultOptions,
    target: USERS_SERVICE_URL,
  })
);

app.use(
  "/api/v1/users",
  isAuthenticated,
  isAdmin,
  createProxyMiddleware({
    ...defaultOptions,
    target: USERS_SERVICE_URL,
  })
);

const PORT = process.env.PORT || 4000;

const runServer = async () => {
  try {
    app.listen(PORT, () => {
      console.log("[Proxy_Service] Server is running on port " + PORT);
    });
  } catch (error) {
    console.log(error);
  }
};

runServer();
