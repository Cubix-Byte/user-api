# User API Microservice

User Authentication Microservice with MongoDB, Express, TypeScript, and JWT.

## Features

- ✅ User Registration & Login
- ✅ JWT Authentication (Access & Refresh Tokens)
- ✅ Role-Based Access Control (RBAC)
- ✅ Password Hashing with bcrypt
- ✅ Account Lockout after failed login attempts
- ✅ Change Password
- ✅ User Profile Management
- ✅ MongoDB with Mongoose ODM
- ✅ TypeScript
- ✅ Input Validation with Zod
- ✅ Error Handling Middleware
- ✅ Security (Helmet, CORS)

## Prerequisites

- Node.js (v22 or v24)
- MongoDB
- npm or yarn

## Installation

1. Install dependencies:

```bash
npm install
```

2. Create `.env` file:

```bash
cp .env.example .env
```

3. Update `.env` with your configuration:

```
MONGODB_URI=mongodb://localhost:27017/user-api
JWT_SECRET=your-secret-key
JWT_REFRESH_SECRET=your-refresh-secret-key
PORT=3001
INTERNAL_API_KEY=your-internal-api-key
```

**IMPORTANT**: The `INTERNAL_API_KEY` must match the same value in all other microservices (academic-api, etc.) for inter-service communication to work.

## Running the Application

### Development Mode

```bash
npm run dev
```

### Production Build

```bash
npm run build
npm start
```

### Database Seeding

```bash
# Reset and seed database with roles and permissions
npm run db:reset-and-seed
```

## API Endpoints

### Authentication

- `POST /api/v1/auth/register` - Register new user
- `POST /api/v1/auth/login` - Login user
- `POST /api/v1/auth/refresh` - Refresh access token
- `POST /api/v1/auth/logout` - Logout user (requires authentication)
- `GET /api/v1/auth/profile` - Get user profile (requires authentication)
- `POST /api/v1/auth/change-password` - Change password (requires authentication)

### Health Check

- `GET /health` - API health check
- `GET /api/v1/health` - Service health check

## Project Structure

```
user-api/
├── src/
│   ├── config/          # Configuration files (database, etc.)
│   ├── controllers/     # Request handlers
│   │   └── v1/          # API version 1 controllers
│   ├── middlewares/     # Custom middleware (auth, error handling, etc.)
│   ├── models/          # Mongoose models
│   ├── repositories/    # Database operations
│   ├── routes/          # API routes
│   ├── services/        # Business logic
│   ├── types/           # TypeScript type definitions
│   ├── utils/           # Utility functions and helpers
│   │   ├── constants/   # Constants
│   │   ├── helpers/     # Helper functions
│   │   ├── requestValidators/  # Request validation schemas
│   │   └── seeders/     # Database seeders
│   ├── app.ts           # Express app setup
│   └── server.ts        # Server entry point
├── .env.example         # Example environment variables
├── .gitignore
├── package.json
├── tsconfig.json
└── README.md
```

## Technologies Used

- **Express.js** - Web framework
- **TypeScript** - Type-safe JavaScript
- **MongoDB** - Database
- **Mongoose** - ODM for MongoDB
- **JWT** - Authentication
- **Zod** - Schema validation
- **Bcrypt** - Password hashing
- **Helmet** - Security headers
- **CORS** - Cross-origin resource sharing
- **Morgan** - HTTP request logger

## License

ISC
