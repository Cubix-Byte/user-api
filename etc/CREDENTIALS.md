# 🔐 User API Test Credentials

## Superadmin Login

### **Credentials:**
```json
{
  "username": "superadmin",
  "password": "Super123"
}
```

### **Login Endpoint:**
```
POST http://localhost:3001/api/v1/auth/login
Content-Type: application/json

{
  "username": "superadmin",
  "password": "Super123"
}
```

### **Note:**
- ✅ Superadmin does NOT need `tenantName`
- ✅ Username: `superadmin`
- ✅ Password: `Super123`
- ✅ Email: `superadmin@brighton.com`

---

## PowerShell Test Command

```powershell
$loginBody = @{
    username = "superadmin"
    password = "Super123"
} | ConvertTo-Json

Invoke-RestMethod -Uri "http://localhost:3001/api/v1/auth/login" `
    -Method POST `
    -ContentType "application/json" `
    -Body $loginBody
```

---

## cURL Test Command

```bash
curl -X POST http://localhost:3001/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "username": "superadmin",
    "password": "Super123"
  }'
```

---

## Quick Setup Commands

```bash
# 1. Build the project
npm run build

# 2. Seed database with roles
npm run seed

# 3. Create superadmin user
npm run create:superadmin

# 4. Start server
npm run dev
```

---

## Response Expected

```json
{
  "success": true,
  "message": "Login successful",
  "data": {
    "user": {
      "id": "...",
      "username": "superadmin",
      "email": "superadmin@brighton.com",
      "firstName": "Super",
      "lastName": "Admin",
      "userType": "superadmin",
      "role": {
        "id": "...",
        "name": "ADMIN",
        "displayName": "Administrator"
      }
    },
    "accessToken": "eyJhbGc...",
    "refreshToken": "eyJhbGc..."
  }
}
```

---

## Troubleshooting

### Issue: "Invalid email or password"
**Solution:** Make sure:
1. Username is exactly: `superadmin` (lowercase)
2. Password is exactly: `Super123`
3. No extra spaces in JSON
4. Server is running on port 3001

### Issue: "User not found"
**Solution:** Run:
```bash
npm run create:superadmin
```

### Issue: "Role not found"
**Solution:** Run:
```bash
npm run seed
```

---

## 🎉 Ready to Test!

Use the credentials above in Postman or your API client.

