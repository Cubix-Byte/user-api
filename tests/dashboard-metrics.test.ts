import request from 'supertest';
import createApp from '../src/app';
import { User, Role, Tenant } from '../src/models';

const app = createApp();

describe('Dashboard Metrics API Tests', () => {
  let superadminRole: any;
  let superadminUser: any;
  let superadminToken: string;
  let testTenant1: any;
  let testTenant2: any;
  let testTenant3: any;

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
    superadminUser = new User({
      username: 'superadmin@brighton.com',
      email: 'superadmin@brighton.com',
      password: 'Super123',
      firstName: 'Super',
      lastName: 'Admin',
      phoneNumber: '+1234567890',
      userType: 'superadmin',
      role: superadminRole._id,
      isEmailVerified: true,
      isActive: true,
      isDeleted: false,
      createdBy: 'test'
    });
    await superadminUser.save();

    // Login to get token
    const loginResponse = await request(app)
      .post('/user/api/v1/auth/superadmin-login')
      .send({
        username: 'superadmin@brighton.com',
        password: 'Super123'
      });

    superadminToken = loginResponse.body.data.tokens.accessToken;

    // Create test tenants with different statuses
    testTenant1 = new Tenant({
      schoolName: 'Active School 1',
      schoolAddress: '123 Active Street',
      city: 'Karachi',
      state: 'Sindh',
      countryCode: 'PK',
      zipCode: '75000',
      schoolPhone: '+92-21-1234567',
      profileStatus: 'active',
      demoPassword: 'Demo123',
      colorTheme: [{ key: 'primary', value: '#007bff' }],
      isActive: true,
      isDeleted: false,
      createdBy: 'test'
    });
    await testTenant1.save();

    testTenant2 = new Tenant({
      schoolName: 'Active School 2',
      schoolAddress: '456 Active Avenue',
      city: 'Lahore',
      state: 'Punjab',
      countryCode: 'PK',
      zipCode: '54000',
      schoolPhone: '+92-42-1234567',
      profileStatus: 'active',
      demoPassword: 'Demo123',
      colorTheme: [{ key: 'primary', value: '#28a745' }],
      isActive: true,
      isDeleted: false,
      createdBy: 'test'
    });
    await testTenant2.save();

    testTenant3 = new Tenant({
      schoolName: 'Inactive School 1',
      schoolAddress: '789 Inactive Road',
      city: 'Islamabad',
      state: 'Federal',
      countryCode: 'PK',
      zipCode: '44000',
      schoolPhone: '+92-51-1234567',
      profileStatus: 'inactive',
      demoPassword: 'Demo123',
      colorTheme: [{ key: 'primary', value: '#dc3545' }],
      isActive: true,
      isDeleted: false,
      createdBy: 'test'
    });
    await testTenant3.save();
  });

  afterAll(async () => {
    await User.deleteMany({});
    await Role.deleteMany({});
    await Tenant.deleteMany({});
  });

  describe('📊 Dashboard Metrics', () => {
    it('should get dashboard metrics successfully', async () => {
      const response = await request(app)
        .get('/user/api/v1/tenants/dashboard/metrics')
        .set('Authorization', `Bearer ${superadminToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveProperty('totalSchools');
      expect(response.body.data).toHaveProperty('activeSchools');
      expect(response.body.data).toHaveProperty('inactiveSchools');
      expect(response.body.data).toHaveProperty('summary');

      // Verify counts
      expect(response.body.data.totalSchools).toBe(3);
      expect(response.body.data.activeSchools).toBe(2);
      expect(response.body.data.inactiveSchools).toBe(1);

      // Verify summary
      expect(response.body.data.summary.total).toBe(3);
      expect(response.body.data.summary.active).toBe(2);
      expect(response.body.data.summary.inactive).toBe(1);
      expect(response.body.data.summary.activePercentage).toBe(67); // 2/3 * 100 = 66.67, rounded to 67
      expect(response.body.data.summary.inactivePercentage).toBe(33); // 1/3 * 100 = 33.33, rounded to 33
    });

    it('should require authentication for dashboard metrics', async () => {
      const response = await request(app)
        .get('/user/api/v1/tenants/dashboard/metrics')
        .expect(401);

      expect(response.body.success).toBe(false);
    });
  });

  describe('📈 Tenant Status Statistics', () => {
    it('should get tenant status statistics successfully', async () => {
      const response = await request(app)
        .get('/user/api/v1/tenants/status/stats')
        .set('Authorization', `Bearer ${superadminToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveProperty('active');
      expect(response.body.data).toHaveProperty('inactive');
      expect(response.body.data).toHaveProperty('total');

      // Verify counts
      expect(response.body.data.total).toBe(3);
      expect(response.body.data.active).toBe(2);
      expect(response.body.data.inactive).toBe(1);
    });

    it('should require authentication for status statistics', async () => {
      const response = await request(app)
        .get('/user/api/v1/tenants/status/stats')
        .expect(401);

      expect(response.body.success).toBe(false);
    });
  });

  describe('🔄 Real-time Updates', () => {
    it('should update metrics when tenant status changes', async () => {
      // Update tenant status from inactive to active
      await request(app)
        .put(`/user/api/v1/tenants/${testTenant3._id}`)
        .set('Authorization', `Bearer ${superadminToken}`)
        .send({ profileStatus: 'active' })
        .expect(200);

      // Get updated metrics
      const response = await request(app)
        .get('/user/api/v1/tenants/dashboard/metrics')
        .set('Authorization', `Bearer ${superadminToken}`)
        .expect(200);

      // Verify updated counts
      expect(response.body.data.totalSchools).toBe(3);
      expect(response.body.data.activeSchools).toBe(3);
      expect(response.body.data.inactiveSchools).toBe(0);
      expect(response.body.data.summary.activePercentage).toBe(100);
      expect(response.body.data.summary.inactivePercentage).toBe(0);
    });
  });
});
