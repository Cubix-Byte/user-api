import request from 'supertest';
import createApp from '../src/app';

const app = createApp();
import { User, Role } from '../src/models';
import bcrypt from 'bcryptjs';

describe('Superadmin Authentication API', () => {
  let superadminRole: any;
  let superadminUser: any;

  beforeAll(async () => {
    // Create SUPERADMIN role
    superadminRole = new Role({
      name: 'SUPERADMIN',
      displayName: 'Super Administrator',
      level: 5,
      permissions: [],
      isActive: true,
      isDeleted: false,
      createdBy: 'test'
    });
    await superadminRole.save();

    // Create superadmin user
    const hashedPassword = await bcrypt.hash('Super123', 10);
    superadminUser = new User({
      username: 'superadmin@brighton.com',
      email: 'superadmin@brighton.com',
      password: hashedPassword,
      firstName: 'Super',
      lastName: 'Admin',
      phoneNumber: '+1234567890',
      userType: 'superadmin',
      role: superadminRole._id,
      isEmailVerified: true,
      isActive: true,
      isDeleted: false,
      createdBy: 'system'
    });
    await superadminUser.save();
  });

  afterAll(async () => {
    // Clean up test data
    await User.deleteMany({});
    await Role.deleteMany({});
  });

  describe('POST /user/api/v1/auth/superadmin/login', () => {
    it('should login superadmin with valid credentials', async () => {
      const loginData = {
        email: 'superadmin@brighton.com',
        password: 'Super123'
      };

      const response = await request(app)
        .post('/user/api/v1/auth/superadmin/login')
        .send(loginData)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.accessToken).toBeDefined();
      expect(response.body.data.refreshToken).toBeDefined();
      expect(response.body.data.user.email).toBe(loginData.email);
      expect(response.body.data.user.userType).toBe('superadmin');
    });

    it('should fail to login superadmin with invalid email', async () => {
      const loginData = {
        email: 'wrong@brighton.com',
        password: 'Super123'
      };

      const response = await request(app)
        .post('/user/api/v1/auth/superadmin/login')
        .send(loginData)
        .expect(401);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain('Invalid credentials');
    });

    it('should fail to login superadmin with invalid password', async () => {
      const loginData = {
        email: 'superadmin@brighton.com',
        password: 'WrongPassword123'
      };

      const response = await request(app)
        .post('/user/api/v1/auth/superadmin/login')
        .send(loginData)
        .expect(401);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain('Invalid credentials');
    });

    it('should fail to login with regular user credentials', async () => {
      // Create a regular user
      const regularRole = new Role({
        name: 'STUDENT',
        displayName: 'Student Role',
        level: 1,
        permissions: [],
        isActive: true,
        isDeleted: false,
        createdBy: 'test'
      });
      await regularRole.save();

      const hashedPassword = await bcrypt.hash('Regular123', 10);
      const regularUser = new User({
        username: 'regular@example.com',
        email: 'regular@example.com',
        password: hashedPassword,
        firstName: 'Regular',
        lastName: 'User',
        phoneNumber: '+1234567891',
        userType: 'student',
        role: regularRole._id,
        isEmailVerified: true,
        isActive: true,
        isDeleted: false,
        createdBy: 'test'
      });
      await regularUser.save();

      const loginData = {
        email: 'regular@example.com',
        password: 'Regular123'
      };

      const response = await request(app)
        .post('/user/api/v1/auth/superadmin/login')
        .send(loginData)
        .expect(401);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain('Invalid credentials');
    });

    it('should fail to login with missing fields', async () => {
      const loginData = {
        email: 'superadmin@brighton.com'
        // password missing
      };

      const response = await request(app)
        .post('/user/api/v1/auth/superadmin/login')
        .send(loginData)
        .expect(400);

      expect(response.body.success).toBe(false);
    });

    it('should fail to login with invalid email format', async () => {
      const loginData = {
        email: 'invalid-email-format',
        password: 'Super123'
      };

      const response = await request(app)
        .post('/user/api/v1/auth/superadmin/login')
        .send(loginData)
        .expect(400);

      expect(response.body.success).toBe(false);
    });
  });
});
