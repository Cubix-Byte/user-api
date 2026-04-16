import request from 'supertest';
import createApp from '../src/app';

const app = createApp();

describe('Health Check API', () => {
  describe('GET /user/api/v1/health', () => {
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
});
