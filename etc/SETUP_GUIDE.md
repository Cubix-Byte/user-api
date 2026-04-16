# User API Microservice - Setup Guide

## ✅ What Has Been Completed

### 1. **Project Structure**
Complete microservice boilerplate has been set up with:
- ✅ TypeScript configuration
- ✅ Express.js application setup
- ✅ MongoDB with Mongoose ODM
- ✅ Clean architecture (Controllers → Services → Repositories)
- ✅ Middleware (Authentication, Authorization, Validation, Error Handling)
- ✅ Database seeders for roles and permissions

### 2. **Features Implemented**
- ✅ User Registration
- ✅ User Login with JWT
- ✅ Token Refresh (Access & Refresh tokens)
- ✅ User Logout
- ✅ Get User Profile
- ✅ Change Password
- ✅ Role-Based Access Control (RBAC)
- ✅ Account lockout after failed login attempts
- ✅ Password hashing with bcrypt

### 3. **Security Features**
- ✅ Helmet.js for security headers
- ✅ CORS configuration
- ✅ Input validation with Zod
- ✅ JWT authentication
- ✅ Password complexity requirements
- ✅ Rate limiting via login attempts

### 4. **Additional Files**
- ✅ Postman Collection (`postman_collection.json`)
- ✅ README.md with documentation
- ✅ .env.example for configuration
- ✅ Database seeders
- ✅ .gitignore

## 🚀 How to Run the Application

### Prerequisites
1. **Node.js** (v22 or v24)
2. **MongoDB** (running locally or remote)

### Step 1: Install Dependencies
```bash
cd user-api
npm install
```
✅ **DONE** - Dependencies already installed

### Step 2: Configure Environment Variables
Create a `.env` file in the `user-api` folder:
```env
NODE_ENV=development
PORT=3001
MONGODB_URI=mongodb://localhost:27017/user-api
ALLOWED_ORIGINS=http://localhost:3000,http://localhost:3001
JWT_SECRET=your-super-secret-jwt-key-change-this-in-production-12345
JWT_REFRESH_SECRET=your-super-secret-refresh-key-change-this-in-production-12345
JWT_EXPIRES_IN=15m
JWT_REFRESH_EXPIRES_IN=7d
```

### Step 3: Start MongoDB
Make sure MongoDB is running:
```bash
# Windows
mongod

# Or use MongoDB service
net start MongoDB

# Linux/Mac
sudo systemctl start mongod
```

### Step 4: Seed the Database
```bash
npm run seed
```
This will create:
- **Permissions**: USER_*, ROLE_*, PERMISSION_*, SYSTEM_*
- **Roles**: ADMIN, MODERATOR, USER

### Step 5: Run the Application

**Development Mode:**
```bash
npm run dev
```

**Production Mode:**
```bash
npm run build
npm start
```

The API will be available at: `http://localhost:3001`

## 📝 API Endpoints

### Health Check
- `GET /health` - API health check
- `GET /api/v1/health` - Service health check

### Authentication (Public)
- `POST /api/v1/auth/register` - Register new user
- `POST /api/v1/auth/login` - Login user
- `POST /api/v1/auth/refresh` - Refresh access token

### Authentication (Protected - Requires JWT Token)
- `POST /api/v1/auth/logout` - Logout user
- `GET /api/v1/auth/profile` - Get user profile
- `POST /api/v1/auth/change-password` - Change password

## 🧪 Testing with Postman

1. Import the `postman_collection.json` file into Postman
2. The collection includes all API endpoints with example requests
3. Authentication tokens are automatically saved after login

### Quick Test Flow:
1. **Register Admin**: Use "Register Admin" request
2. **Login**: Use "Login" request (tokens auto-saved)
3. **Get Profile**: Use "Get Profile" request (uses saved token)
4. **Change Password**: Test password change
5. **Logout**: Clear tokens

## 📁 Project Structure

```
user-api/
├── src/
│   ├── config/
│   │   └── database.ts              # MongoDB connection
│   ├── controllers/
│   │   └── v1/
│   │       └── auth.controller.ts   # Auth endpoints
│   ├── middlewares/
│   │   ├── auth.middleware.ts       # JWT authentication
│   │   ├── rbac.middleware.ts       # Role-based access control
│   │   ├── error.middleware.ts      # Error handling
│   │   └── validate.middleware.ts   # Request validation
│   ├── models/
│   │   ├── BaseDocument.ts          # Base model schema
│   │   ├── User.ts                  # User model
│   │   ├── Role.ts                  # Role model
│   │   ├── Permission.ts            # Permission model
│   │   └── index.ts                 # Model exports
│   ├── repositories/
│   │   ├── user.repository.ts       # User DB operations
│   │   ├── role.repository.ts       # Role DB operations
│   │   └── permission.repository.ts # Permission DB operations
│   ├── routes/
│   │   ├── auth.routes.ts           # Auth routes
│   │   └── index.ts                 # Route aggregation
│   ├── services/
│   │   └── auth.service.ts          # Auth business logic
│   ├── types/
│   │   └── auth.types.ts            # TypeScript types
│   ├── utils/
│   │   ├── constants/
│   │   │   ├── routes.ts            # Route constants
│   │   │   └── serverResponses.ts   # Response messages
│   │   ├── helpers/
│   │   │   ├── jwt.helper.ts        # JWT utilities
│   │   │   └── response.ts          # Response helpers
│   │   ├── requestValidators/
│   │   │   └── auth.validator.ts    # Validation schemas
│   │   └── seeders/
│   │       ├── rolePermissionSeeder.ts
│   │       └── resetDatabase.ts
│   ├── app.ts                       # Express app setup
│   └── server.ts                    # Server entry point
├── dist/                            # Build output
├── node_modules/
├── .env.example
├── .gitignore
├── package.json
├── tsconfig.json
├── postman_collection.json
├── README.md
└── SETUP_GUIDE.md
```

## 🔑 Default Roles

### ADMIN (Level 1)
- Full access to all features
- Can manage users, roles, and permissions
- Can perform all system operations

### MODERATOR (Level 2)
- Can read users, roles, and permissions
- Limited administrative access

### USER (Level 3)
- Basic user access
- Can read own profile

## 📊 Database Schema

### User Schema
```typescript
{
  firstName: string
  lastName: string
  email: string (unique)
  password: string (hashed)
  phoneNumber?: string
  role: ObjectId (ref: Role)
  isEmailVerified: boolean
  lastLogin?: Date
  loginAttempts: number
  lockUntil?: Date
  refreshToken?: string
  isActive: boolean
  isDeleted: boolean
  createdAt: Date
  updatedAt: Date
}
```

### Role Schema
```typescript
{
  name: string (ADMIN | MODERATOR | USER)
  displayName: string
  permissions: ObjectId[] (ref: Permission)
  level: number (1-5)
  isActive: boolean
  isDeleted: boolean
  createdAt: Date
  updatedAt: Date
}
```

### Permission Schema
```typescript
{
  name: string
  displayName: string
  resource: string (USER | ROLE | PERMISSION | SYSTEM)
  action: string (CREATE | READ | UPDATE | DELETE | LIST | MANAGE)
  conditions?: any
  isActive: boolean
  isDeleted: boolean
  createdAt: Date
  updatedAt: Date
}
```

## 🔐 Security Features

1. **Password Requirements:**
   - Minimum 6 characters
   - At least one lowercase letter
   - At least one uppercase letter
   - At least one number

2. **Account Lockout:**
   - Account locked after 5 failed login attempts
   - Lock duration: 2 hours

3. **JWT Tokens:**
   - Access token: 15 minutes (default)
   - Refresh token: 7 days (default)

## 🛠️ Available Scripts

```bash
npm run dev          # Start development server with hot reload
npm run build        # Build TypeScript to JavaScript
npm start            # Start production server
npm run seed         # Seed database with roles and permissions
npm run db:reset     # Reset database (drop all collections)
npm run db:reset-and-seed  # Reset and seed database
npm test             # Run tests (when configured)
```

## 🌐 Connecting to Remote MongoDB

To use MongoDB Atlas or remote MongoDB:

```env
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/user-api?retryWrites=true&w=majority
```

## ✨ Key Differences from Monolithic Backend

1. **No Swagger** - Removed all Swagger dependencies and documentation
2. **Microservice Focus** - Only auth and user management features
3. **Postman Collection** - Provided for API testing
4. **Clean Separation** - No teacher, student, parent, or other domain models
5. **Lightweight** - Minimal dependencies for faster startup

## 🎯 Next Steps

1. Start MongoDB
2. Run `npm run seed` to create roles and permissions
3. Run `npm run dev` to start the server
4. Import Postman collection and test the APIs
5. Register an admin user
6. Test all endpoints

## 📞 Support

If you encounter any issues:
1. Check MongoDB is running
2. Verify .env configuration
3. Check if port 3001 is available
4. Review logs for detailed error messages

---

**Status**: ✅ Ready to use!
**Build**: ✅ Successful
**Dependencies**: ✅ Installed
**Postman Collection**: ✅ Available

Just start MongoDB and run the application!

