import dotenv from "dotenv";
dotenv.config();

// Global error handlers for uncaught exceptions and unhandled rejections
// uncaughtException handler (synchronous errors)
process.on("uncaughtException", (err) => {
  console.log("UNCAUGHT EXCEPTION! 💥 Shutting down...");
  console.log(err.name, err.message);
  process.exit(1);
});

import createApp from "./app";
import { connectDatabase, initializeDatabase } from "./config/database";
// Import all models to ensure they are registered with Mongoose
import "./models";
// Import SuperAdmin seeder
import { seedSuperAdmin } from "./seeders/superadmin.seeder";

let server: any;

// Main server startup function - connects to database and starts Express server
const startServer = async (): Promise<void> => {
  try {
    // Create Express app first (so server can start even if DB fails)
    const app = createApp();
    const PORT = parseInt(process.env.PORT || "3002", 10); // this is the port for the user-api
    const HOST = process.env.HOST || "0.0.0.0"; // Bind to all interfaces for Railway

    // Start server first (non-blocking for database)
    server = app.listen(PORT, HOST, () => {
      console.log(`🚀 User API running on ${HOST}:${PORT}`);
      console.log(`📝 Environment: ${process.env.NODE_ENV || "development"}`);
      console.log(
        `🔄 Database auto-sync: Collections will be created automatically when needed`
      );
    });

    // Try to connect to database (non-blocking - server already running)
    try {
      await connectDatabase();
      
      // Initialize database to ensure it's ready
      await initializeDatabase();

      // Run SuperAdmin seeder to ensure SuperAdmin role and user exist
      await seedSuperAdmin();
    } catch (dbError) {
      console.warn(
        "⚠️ Database connection failed, but server is running:",
        dbError
      );
      console.log("🔄 Server will continue without database connection");
      console.log("💡 Database operations will fail until connection is established");
    }
  } catch (error) {
    console.error("❌ Failed to start server:", error);
    process.exit(1);
  }
};

startServer();

// unhandledRejection handler (asynchronous errors)
process.on("unhandledRejection", (err) => {
  console.log("UNHANDLED REJECTION! 💥 Shutting down...");
  console.log((err as Error).name, (err as Error).message);

  // gracefully shut down the server
  if (server) {
    server.close(() => {
      process.exit(1);
    });
  } else {
    process.exit(1);
  }
});
