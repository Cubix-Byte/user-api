import express from "express";
import cors from "cors";
import helmet from "helmet";
import compression from "compression";
import routes from "./routes";
import internalRoutes from "./routes/internal.routes";
import { errorHandler } from "./middlewares/error.middleware";
import morgan from "morgan";
import { ROUTES } from "./utils/constants/routes";
import {
  enhancedGlobalAuthMiddleware,
  debugMiddleware,
} from "./config/global-auth.config";

// Express application factory function - sets up all middleware and routes
const createApp = (): express.Application => {
  const app = express();

  // Security middleware - configure helmet to not interfere with CORS
  app.use(helmet());
  // CORS configuration - allow all origins
  app.use(
    cors({
      origin: "*",
      methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
      allowedHeaders: ["Content-Type", "Authorization", "x-api-key"],
      optionsSuccessStatus: 200,
    })
  );
  app.use(compression());

  // Body parsing middleware
  app.use(express.json({ limit: "10mb" }));
  app.use(express.urlencoded({ extended: true }));

  // Logger
  if (process.env.NODE_ENV === "development") {
    app.use(morgan("dev"));
  }

  // Debug middleware for superadmin routes
  // app.use(debugMiddleware);

  // Global authentication middleware with trial validation
  // Temporarily disabled for Railway debugging
  app.use(enhancedGlobalAuthMiddleware);

  // Add a simple middleware to log all requests
  app.use((req, res, next) => {
    console.log(`🔧 Request: ${req.method} ${req.path} from ${req.ip}`);
    next();
  });

  // Health check endpoint (root level)
  app.get("/health", (req, res) => {
    res.json({
      success: true,
      message: "User API is running",
      timestamp: new Date().toISOString(),
      service: "user-api",
      environment: process.env.NODE_ENV || "development",
      port: process.env.PORT || "3001",
      host: process.env.HOST || "0.0.0.0",
    });
  });

  // Debug endpoint for Railway troubleshooting
  app.get("/debug", (req, res) => {
    res.json({
      success: true,
      message: "Debug endpoint working",
      timestamp: new Date().toISOString(),
      environment: {
        NODE_ENV: process.env.NODE_ENV,
        PORT: process.env.PORT,
        HOST: process.env.HOST,
        MONGODB_URI: process.env.MONGODB_URI ? "***configured***" : "not set",
        ALLOWED_ORIGINS: process.env.ALLOWED_ORIGINS || "not set",
        RAILWAY_STATIC_URL: process.env.RAILWAY_STATIC_URL || "not set",
      },
      request: {
        method: req.method,
        url: req.url,
        headers: req.headers,
        ip: req.ip,
        userAgent: req.get("User-Agent"),
        origin: req.get("Origin"),
        referer: req.get("Referer"),
      },
    });
  });

  // Routes with service-specific base path
  app.use(ROUTES.BASE, routes);

  // Internal routes (for microservice-to-microservice communication)
  app.use(ROUTES.INTERNAL, internalRoutes);

  // Error handling middleware
  app.use(errorHandler);

  return app;
};

export default createApp;
