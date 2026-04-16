import request from 'supertest';
import createApp from '../src/app';

const app = createApp();
import { User, Role } from '../src/models';
import bcrypt from 'bcryptjs';

describe('Authentication API', () => {
  let testRole: any;
  let testUser: any;

  beforeAll(async () => {
    // Create a test role
    testRole = new Role({
      name: 'TEST_USER',
      displayName: 'Test User Role',
      level: 1,
      permissions: [],
      isActive: true,
      isDeleted: false,
      createdBy: 'test'
    });
    await testRole.save();

    // Create a test user
    const hashedPassword = await bcrypt.hash('Test123!', 10);
    testUser = new User({
      username: 'testuser@example.com',
      email: 'testuser@example.com',
      password: hashedPassword,
      firstName: 'Test',
      lastName: 'User',
      phoneNumber: '+1234567890',
      userType: 'student',
      role: testRole._id,
      isEmailVerified: true,
      isActive: true,
      isDeleted: false,
      createdBy: 'test'
    });
    await testUser.save();
  });

  afterAll(async () => {
    // Clean up test data
    await User.deleteMany({});
    await Role.deleteMany({});
  });

  describe('POST /user/api/v1/auth/register', () => {
    it('should register a new user successfully', async () => {
      const userData = {
        username: 'newuser@example.com',
        email: 'newuser@example.com',
        password: 'NewUser123!',
        firstName: 'New',
        lastName: 'User',
        phoneNumber: '+1234567891',
        userType: 'student'
      };

      const response = await request(app)
        .post('/user/api/v1/auth/register')
        .send(userData)
        .expect(201);

      expect(response.body.success).toBe(true);
      expect(response.body.message).toContain('User registered successfully');
      expect(response.body.data.user.email).toBe(userData.email);
      expect(response.body.data.user.password).toBeUndefined(); // Password should not be returned
    });

    it('should fail to register with invalid email', async () => {
      const userData = {
        username: 'invalid-email',
        email: 'invalid-email',
        password: 'ValidPass123!',
        firstName: 'Test',
        lastName: 'User',
        phoneNumber: '+1234567892',
        userType: 'student'
      };

      const response = await request(app)
        .post('/user/api/v1/auth/register')
        .send(userData)
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain('validation');
    });

    it('should fail to register with weak password', async () => {
      const userData = {
        username: 'weakpass@example.com',
        email: 'weakpass@example.com',
        password: '123',
        firstName: 'Test',
        lastName: 'User',
        phoneNumber: '+1234567893',
        userType: 'student'
      };

      const response = await request(app)
        .post('/user/api/v1/auth/register')
        .send(userData)
        .expect(400);

      expect(response.body.success).toBe(false);
    });

    it('should fail to register with duplicate email', async () => {
      const userData = {
        username: 'testuser@example.com',
        email: 'testuser@example.com',
        password: 'Test123!',
        firstName: 'Test',
        lastName: 'User',
        phoneNumber: '+1234567894',
        userType: 'student'
      };

      const response = await request(app)
        .post('/user/api/v1/auth/register')
        .send(userData)
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain('already exists');
    });
  });

  describe('POST /user/api/v1/auth/login', () => {
    it('should login with valid credentials', async () => {
      const loginData = {
        email: 'testuser@example.com',
        password: 'Test123!'
      };

      const response = await request(app)
        .post('/user/api/v1/auth/login')
        .send(loginData)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.accessToken).toBeDefined();
      expect(response.body.data.refreshToken).toBeDefined();
      expect(response.body.data.user.email).toBe(loginData.email);
    });

    it('should fail to login with invalid email', async () => {
      const loginData = {
        email: 'nonexistent@example.com',
        password: 'Test123!'
      };

      const response = await request(app)
        .post('/user/api/v1/auth/login')
        .send(loginData)
        .expect(401);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain('Invalid credentials');
    });

    it('should fail to login with invalid password', async () => {
      const loginData = {
        email: 'testuser@example.com',
        password: 'WrongPassword123!'
      };

      const response = await request(app)
        .post('/user/api/v1/auth/login')
        .send(loginData)
        .expect(401);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain('Invalid credentials');
    });

    it('should fail to login with missing fields', async () => {
      const loginData = {
        email: 'testuser@example.com'
        // password missing
      };

      const response = await request(app)
        .post('/user/api/v1/auth/login')
        .send(loginData)
        .expect(400);

      expect(response.body.success).toBe(false);
    });
  });

  describe('POST /user/api/v1/auth/refresh', () => {
    let refreshToken: string;

    beforeAll(async () => {
      // Get a refresh token by logging in
      const loginData = {
        email: 'testuser@example.com',
        password: 'Test123!'
      };

      const response = await request(app)
        .post('/user/api/v1/auth/login')
        .send(loginData);

      refreshToken = response.body.data.refreshToken;
    });

    it('should refresh token successfully', async () => {
      const response = await request(app)
        .post('/user/api/v1/auth/refresh')
        .send({ refreshToken })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.accessToken).toBeDefined();
      expect(response.body.data.refreshToken).toBeDefined();
    });

    it('should fail to refresh with invalid token', async () => {
      const response = await request(app)
        .post('/user/api/v1/auth/refresh')
        .send({ refreshToken: 'invalid-token' })
        .expect(401);

      expect(response.body.success).toBe(false);
    });

    it('should fail to refresh with missing token', async () => {
      const response = await request(app)
        .post('/user/api/v1/auth/refresh')
        .send({})
        .expect(400);

      expect(response.body.success).toBe(false);
    });
  });

  describe('GET /user/api/v1/auth/profile', () => {
    let accessToken: string;

    beforeAll(async () => {
      // Get an access token by logging in
      const loginData = {
        email: 'testuser@example.com',
        password: 'Test123!'
      };

      const response = await request(app)
        .post('/user/api/v1/auth/login')
        .send(loginData);

      accessToken = response.body.data.accessToken;
    });

    it('should get user profile with valid token', async () => {
      const response = await request(app)
        .get('/user/api/v1/auth/profile')
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.user.email).toBe('testuser@example.com');
      expect(response.body.data.user.password).toBeUndefined();
    });

    it('should fail to get profile without token', async () => {
      const response = await request(app)
        .get('/user/api/v1/auth/profile')
        .expect(401);

      expect(response.body.success).toBe(false);
    });

    it('should fail to get profile with invalid token', async () => {
      const response = await request(app)
        .get('/user/api/v1/auth/profile')
        .set('Authorization', 'Bearer invalid-token')
        .expect(401);

      expect(response.body.success).toBe(false);
    });
  });

  describe('POST /user/api/v1/auth/logout', () => {
    let accessToken: string;

    beforeAll(async () => {
      // Get an access token by logging in
      const loginData = {
        email: 'testuser@example.com',
        password: 'Test123!'
      };

      const response = await request(app)
        .post('/user/api/v1/auth/login')
        .send(loginData);

      accessToken = response.body.data.accessToken;
    });

    it('should logout successfully', async () => {
      const response = await request(app)
        .post('/user/api/v1/auth/logout')
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.message).toContain('logged out');
    });

    it('should fail to logout without token', async () => {
      const response = await request(app)
        .post('/user/api/v1/auth/logout')
        .expect(401);

      expect(response.body.success).toBe(false);
    });
  });

  describe('POST /user/api/v1/auth/change-password', () => {
    let accessToken: string;

    beforeAll(async () => {
      // Get an access token by logging in
      const loginData = {
        email: 'testuser@example.com',
        password: 'Test123!'
      };

      const response = await request(app)
        .post('/user/api/v1/auth/login')
        .send(loginData);

      accessToken = response.body.data.accessToken;
    });

    it('should change password successfully', async () => {
      const changePasswordData = {
        currentPassword: 'Test123!',
        newPassword: 'NewTest123!'
      };

      const response = await request(app)
        .post('/user/api/v1/auth/change-password')
        .set('Authorization', `Bearer ${accessToken}`)
        .send(changePasswordData)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.message).toContain('Password changed successfully');
    });

    it('should fail to change password with wrong current password', async () => {
      const changePasswordData = {
        currentPassword: 'WrongPassword123!',
        newPassword: 'AnotherNew123!'
      };

      const response = await request(app)
        .post('/user/api/v1/auth/change-password')
        .set('Authorization', `Bearer ${accessToken}`)
        .send(changePasswordData)
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain('Current password is incorrect');
    });

    it('should fail to change password without token', async () => {
      const changePasswordData = {
        currentPassword: 'Test123!',
        newPassword: 'NewTest123!'
      };

      const response = await request(app)
        .post('/user/api/v1/auth/change-password')
        .send(changePasswordData)
        .expect(401);

      expect(response.body.success).toBe(false);
    });
  });
});
