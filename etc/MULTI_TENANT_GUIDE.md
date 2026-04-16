# Multi-Tenant User API - Complete Guide

## 🎉 **Successfully Implemented Multi-Tenant Architecture!**

### ✅ What's Been Added

#### 1. **Multi-Tenancy Support**
- ✅ Tenant model with school information
- ✅ Username unique per tenant (not globally)
- ✅ TenantId and TenantName in User model
- ✅ Superadmin can work without tenant
- ✅ All other users (admin, teacher, student, parent) require tenant

#### 2. **New Models Created**
- ✅ **Tenant** - School/Organization management
- ✅ **Teacher** - Teacher profiles linked to users
- ✅ **Student** - Student profiles linked to users  
- ✅ **Parent** - Parent profiles linked to users
- ✅ **User** - Updated with username, tenantId, tenantName, userType

#### 3. **Authentication Changes**
- ✅ Login with **username + password + tenantName**
- ✅ Superadmin login: username + password (no tenant needed)
- ✅ Tenant user login: username + password + tenantName
- ✅ Password hashed with bcrypt
- ✅ Username unique within tenant scope

#### 4. **User Types**
- `superadmin` - No tenant, global access
- `admin` - Tenant admin
- `teacher` - Tenant teacher
- `student` - Tenant student
- `parent` - Tenant parent

## 📋 **Database Schema**

### Tenant Schema
```javascript
{
  schoolName: String (unique),
  schoolAddress: String,
  city: String,
  state: String,
  countryCode: String,
  zipCode: String,
  schoolPhone: String,
  profilePicture: String (optional),
  topIcon: String (optional),
  schoolWebsite: String (optional),
  profileStatus: 'active' | 'inactive',
  demoPassword: String (hashed),
  colorTheme: [
    { key: String, value: String }
  ]
}
```

### User Schema (Updated)
```javascript
{
  username: String (unique per tenant),
  firstName: String,
  lastName: String,
  email: String,
  password: String (hashed),
  phoneNumber: String (optional),
  role: ObjectId (ref: Role),
  tenantId: ObjectId (ref: Tenant, required for non-superadmin),
  tenantName: String (required for non-superadmin),
  userType: 'superadmin' | 'admin' | 'teacher' | 'student' | 'parent',
  // ... other fields
}
```

### Teacher Schema
```javascript
{
  userId: ObjectId (ref: User, same as teacherId),
  tenantId: ObjectId (ref: Tenant),
  employeeId: String (unique per tenant),
  subject: String,
  department: String,
  hireDate: Date,
  salary: Number,
  address: {
    street, city, state, zipCode, country
  }
}
```

### Student Schema
```javascript
{
  userId: ObjectId (ref: User, same as studentId),
  tenantId: ObjectId (ref: Tenant),
  studentId: String (unique per tenant),
  admissionDate: Date,
  rollNumber: String,
  grade: String,
  section: String,
  parentIds: [ObjectId] (ref: Parent)
}
```

### Parent Schema
```javascript
{
  userId: ObjectId (ref: User, same as parentId),
  tenantId: ObjectId (ref: Tenant),
  relationship: 'father' | 'mother' | 'guardian',
  occupation: String,
  cnic: String (unique per tenant),
  emergencyContact: String,
  childrenIds: [ObjectId] (ref: Student)
}
```

## 🔐 **Authentication Flow**

### Superadmin Login
```json
POST /api/v1/auth/login
{
  "username": "superadmin",
  "password": "Super123"
}
```

### Tenant User Login (Admin/Teacher/Student/Parent)
```json
POST /api/v1/auth/login
{
  "username": "john123",
  "password": "Password123",
  "tenantName": "Brighton School"
}
```

## 📊 **API Endpoints**

### Authentication
- `POST /api/v1/auth/register` - Register user
- `POST /api/v1/auth/login` - Login (username + password + tenantName)
- `POST /api/v1/auth/refresh` - Refresh token
- `POST /api/v1/auth/logout` - Logout
- `GET /api/v1/auth/profile` - Get profile
- `POST /api/v1/auth/change-password` - Change password

### Tenants
- `POST /api/v1/tenants` - Create tenant (Admin only)
- `GET /api/v1/tenants` - Get all tenants
- `GET /api/v1/tenants/:id` - Get tenant by ID
- `PUT /api/v1/tenants/:id` - Update tenant (Admin only)
- `DELETE /api/v1/tenants/:id` - Delete tenant (Admin only)

### Teachers
- `POST /api/v1/teachers` - Create teacher (Admin only)
- `GET /api/v1/teachers` - Get all teachers
- `GET /api/v1/teachers/:id` - Get teacher by ID
- `PUT /api/v1/teachers/:id` - Update teacher (Admin only)
- `DELETE /api/v1/teachers/:id` - Delete teacher (Admin only)

### Students
- `POST /api/v1/students` - Create student (Admin only)
- `GET /api/v1/students` - Get all students
- `GET /api/v1/students/:id` - Get student by ID
- `PUT /api/v1/students/:id` - Update student (Admin only)
- `DELETE /api/v1/students/:id` - Delete student (Admin only)

### Parents
- `POST /api/v1/parents` - Create parent (Admin only)
- `GET /api/v1/parents` - Get all parents
- `GET /api/v1/parents/:id` - Get parent by ID
- `PUT /api/v1/parents/:id` - Update parent (Admin only)
- `POST /api/v1/parents/:id/add-child` - Add child (Admin only)
- `POST /api/v1/parents/:id/remove-child` - Remove child (Admin only)
- `DELETE /api/v1/parents/:id` - Delete parent (Admin only)

## 🚀 **Quick Start Guide**

### 1. Start MongoDB
```bash
mongod
```

### 2. Seed Database
```bash
npm run seed
```

### 3. Start Server
```bash
npm run dev
```

### 4. Test with Postman

#### Step 1: Create Superadmin
```bash
POST /api/v1/auth/register
{
  "username": "superadmin",
  "firstName": "Super",
  "lastName": "Admin",
  "email": "superadmin@example.com",
  "password": "Super123",
  "roleName": "ADMIN",
  "userType": "superadmin"
}
```

#### Step 2: Login as Superadmin
```bash
POST /api/v1/auth/login
{
  "username": "superadmin",
  "password": "Super123"
}
```

#### Step 3: Create Tenant (School)
```bash
POST /api/v1/tenants
{
  "schoolName": "Brighton School",
  "schoolAddress": "123 Main St",
  "city": "New York",
  "state": "NY",
  "countryCode": "US",
  "zipCode": "10001",
  "schoolPhone": "+1234567890",
  "profileStatus": "active",
  "demoPassword": "Demo123",
  "colorTheme": [
    {"key": "primary", "value": "#1976d2"},
    {"key": "secondary", "value": "#dc004e"}
  ]
}
```
Save the `tenantId` from response!

#### Step 4: Create Teacher
```bash
POST /api/v1/teachers
{
  "username": "teacher123",
  "firstName": "John",
  "lastName": "Doe",
  "email": "john@brighton.com",
  "password": "Teacher123",
  "tenantId": "{tenantId from step 3}",
  "tenantName": "Brighton School",
  "employeeId": "EMP001",
  "subject": "Mathematics",
  "department": "Science"
}
```

#### Step 5: Login as Teacher
```bash
POST /api/v1/auth/login
{
  "username": "teacher123",
  "password": "Teacher123",
  "tenantName": "Brighton School"
}
```

## 🎯 **Key Features**

### Multi-Tenancy
- ✅ Username unique per tenant (not global)
- ✅ Each tenant (school) is isolated
- ✅ Users belong to specific tenants
- ✅ Superadmin has global access

### User Linking
- ✅ Teacher created → User created with same ID
- ✅ Student created → User created with same ID
- ✅ Parent created → User created with same ID
- ✅ `userId === teacherId/studentId/parentId`

### Security
- ✅ Password hashing with bcrypt
- ✅ JWT authentication
- ✅ Role-based access control
- ✅ Tenant-level isolation

## 📦 **Postman Collection**

Import `postman_collection_v2.json` for complete API testing with:
- ✅ All CRUD operations
- ✅ Authentication flows
- ✅ Auto-save tokens
- ✅ Variables for tenantId, teacherId, etc.

## 🎨 **Testing Flow**

1. **Create Superadmin** → Login → Save token
2. **Create Tenant** → Save tenantId
3. **Create Teacher** → Login as Teacher
4. **Create Student** → Save studentId
5. **Create Parent** → Link with Student
6. **Test all CRUD operations**

## 📝 **Important Notes**

1. **Username Uniqueness**: Username is unique WITHIN a tenant, not globally
2. **Login Format**: 
   - Superadmin: username + password
   - Others: username + password + tenantName
3. **User Creation**: When creating teacher/student/parent, a user is automatically created
4. **ID Matching**: userId === teacherId/studentId/parentId
5. **Password**: Always hashed before storing

## ✨ **Success!**

Your multi-tenant user API is ready with:
- ✅ Complete CRUD for Tenants, Teachers, Students, Parents
- ✅ Username-based login with tenant support
- ✅ Proper user isolation per tenant
- ✅ Comprehensive Postman collection
- ✅ Production-ready code

**Build Status**: ✅ Successful
**Tests**: Ready for testing
**Documentation**: Complete

Happy coding! 🚀

