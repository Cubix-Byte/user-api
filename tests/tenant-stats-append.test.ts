import request from 'supertest';
import createApp from '../src/app';
import { User, Role, Tenant } from '../src/models';
import mongoose from 'mongoose';

const app = createApp();

describe('Tenant Stats Append API Tests', () => {
    let superadminToken: string;
    let testTenant: any;
    let teacherRole: any;
    let studentRole: any;
    let parentRole: any;

    beforeAll(async () => {
        // Cleanup
        await User.deleteMany({});
        await Role.deleteMany({});
        await Tenant.deleteMany({});

        // Create SUPERADMIN role and user
        const superadminRole = new Role({
            name: 'SUPERADMIN',
            displayName: 'Super Administrator',
            level: 5,
            permissions: [],
            isActive: true,
            isDeleted: false,
            createdBy: 'test'
        });
        await superadminRole.save();

        const superadminUser = new User({
            username: 'superadmin@test.com',
            email: 'superadmin@test.com',
            password: 'Super123',
            firstName: 'Super',
            lastName: 'Admin',
            userType: 'superadmin',
            role: superadminRole._id,
            isEmailVerified: true,
            isActive: true,
            isDeleted: false,
        });
        await superadminUser.save();

        // Login to get token
        const loginResponse = await request(app)
            .post('/user/api/v1/auth/superadmin-login')
            .send({
                username: 'superadmin@test.com',
                password: 'Super123'
            });
        superadminToken = loginResponse.body.data.tokens.accessToken;

        // Create a test tenant
        testTenant = new Tenant({
            schoolName: 'Test School',
            tenantName: 'testschool',
            profileStatus: 'active',
            isActive: true,
            isDeleted: false,
        });
        await testTenant.save();

        // Create roles for the tenant
        teacherRole = new Role({ name: 'TEACHER', tenantId: testTenant._id, isActive: true, isDeleted: false, level: 3, permissions: [] });
        studentRole = new Role({ name: 'STUDENT', tenantId: testTenant._id, isActive: true, isDeleted: false, level: 1, permissions: [] });
        parentRole = new Role({ name: 'PARENT', tenantId: testTenant._id, isActive: true, isDeleted: false, level: 1, permissions: [] });
        await Promise.all([teacherRole.save(), studentRole.save(), parentRole.save()]);

        // Create users for the tenant
        const users = [
            { firstName: 'T1', lastName: 'U', email: 't1@t.com', username: 't1', userType: 'teacher', role: teacherRole._id, tenantId: testTenant._id, tenantName: 'testschool' },
            { firstName: 'T2', lastName: 'U', email: 't2@t.com', username: 't2', userType: 'teacher', role: teacherRole._id, tenantId: testTenant._id, tenantName: 'testschool' },
            { firstName: 'S1', lastName: 'U', email: 's1@t.com', username: 's1', userType: 'student', role: studentRole._id, tenantId: testTenant._id, tenantName: 'testschool' },
            { firstName: 'P1', lastName: 'U', email: 'p1@t.com', username: 'p1', userType: 'parent', role: parentRole._id, tenantId: testTenant._id, tenantName: 'testschool' },
        ];

        for (const userData of users) {
            const user = new User({ ...userData, isActive: true, isDeleted: false });
            await user.save();
        }
    });

    afterAll(async () => {
        await User.deleteMany({});
        await Role.deleteMany({});
        await Tenant.deleteMany({});
    });

    it('should include user stats in getAllTenants response', async () => {
        const response = await request(app)
            .get('/user/api/v1/tenants')
            .set('Authorization', `Bearer ${superadminToken}`)
            .expect(200);

        expect(response.body.success).toBe(true);
        expect(response.body.data.tenants).toBeDefined();

        const tenant = response.body.data.tenants.find((t: any) => t.id === testTenant._id.toString());
        expect(tenant).toBeDefined();
        expect(tenant.stats).toBeDefined();
        expect(tenant.stats.teachers).toBe(2);
        expect(tenant.stats.students).toBe(1);
        expect(tenant.stats.parents).toBe(1);
        expect(tenant.stats.total).toBe(4);
    });
});
