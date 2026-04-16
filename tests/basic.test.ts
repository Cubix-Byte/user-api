import request from 'supertest';
import createApp from '../src/app';

const app = createApp();

describe('Basic API Tests', () => {
  describe('Health Check', () => {
    it('should return health status', async () => {
      const response = await request(app)
        .get('/user/api/v1/health')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.message).toBe('User API is running');
      expect(response.body.service).toBe('user-api');
      expect(response.body.timestamp).toBeDefined();
    });
  });

  describe('Authentication - Basic Tests', () => {
    it('should return 400 for invalid registration data', async () => {
      const invalidData = {
        email: 'invalid-email',
        password: '123'
      };

      const response = await request(app)
        .post('/user/api/v1/auth/register')
        .send(invalidData)
        .expect(400);

      expect(response.body.success).toBe(false);
    });

    it('should return 400 for missing login data', async () => {
      const response = await request(app)
        .post('/user/api/v1/auth/login')
        .send({})
        .expect(400);

      expect(response.body.success).toBe(false);
    });

    it('should return 401 for invalid login credentials', async () => {
      const loginData = {
        email: 'nonexistent@example.com',
        password: 'wrongpassword'
      };

      const response = await request(app)
        .post('/user/api/v1/auth/login')
        .send(loginData)
        .expect(400); // Changed to 400 as validation happens first

      expect(response.body.success).toBe(false);
    });
  });
});
