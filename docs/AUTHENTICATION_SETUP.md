# 🔐 Authentication Setup Guide - Week 1

## 🎯 **Overview**

This guide will help you set up and test the authentication system for PrecisionAds. We've fixed the JWT token validation, completed auth routes, and removed hardcoded data from the frontend.

---

## ✅ **What We've Fixed**

### **1. Backend Authentication Issues**

- ✅ **JWT Token Structure**: Fixed mismatch between token creation and validation
- ✅ **Role Mapping**: Added proper mapping from backend roles to frontend roles
- ✅ **Auth Routes**: Completed login, logout, token validation, and refresh endpoints
- ✅ **Organization Validation**: Added organization verification during login
- ✅ **CORS Configuration**: Fixed CORS policy to allow frontend requests

### **2. Frontend Authentication**

- ✅ **Removed Hardcoded Data**: No more mock users or organizations
- ✅ **Real API Integration**: Frontend now calls real backend endpoints
- ✅ **Error Handling**: Proper error messages and validation
- ✅ **Token Management**: Automatic token storage and validation

---

## 🚀 **Setup Instructions**

### **Step 1: Backend Environment Setup**

1. **Navigate to backend directory**:

   ```bash
   cd backend
   ```

2. **Copy environment file**:
3. 
   ```bash
   cp env.example .env
   ```

4. **Edit `.env` file** with your database credentials:
   
   ```env
   DATABASE_URL="postgresql://username:password@localhost:5432/precisionads"
   JWT_SECRET="your-super-secret-jwt-key-here-change-in-production"
   JWT_EXPIRES_IN="24h"
   PORT=7401
   NODE_ENV=development
   CORS_ORIGIN="http://localhost:7400"
   ```

5. **Install dependencies**:

   ```bash
   npm install
   ```

### **Step 2: Database Setup**

1. **Set up PostgreSQL database**:

   ```bash
   # Create database
   createdb precisionads
   
   # Or using psql
   psql -U postgres
   CREATE DATABASE precisionads;
   ```

2. **Run database migrations**:

   ```bash
   npx prisma migrate dev
   ```

3. **Seed the database with test data**:
   ```bash
   npx prisma db seed
   ```

### **Step 3: Frontend Environment Setup**

1. **Navigate to frontend directory**:
   ```bash
   cd frontend
   ```

2. **Copy environment file**:
   ```bash
   cp env.example .env
   ```

3. **Edit `.env` file**:
   ```env
   VITE_API_URL="http://localhost:7401"
   VITE_APP_NAME="PrecisionAds"
   VITE_APP_VERSION="1.0.0"
   VITE_DEV_MODE="true"
   VITE_ENABLE_MOCK_DATA="false"
   ```

4. **Install dependencies**:
   ```bash
   npm install
   ```

---

## 🧪 **Test Data Available**

After running the seed script, you'll have these test accounts:

### **Admin Users**
- **Email**: `superadmin@precisionads.com`
- **Password**: `superadmin123`
- **Role**: Super Admin
- **Organization**: Precision Ads Inc.

- **Email**: `admin@precisionads.com`
- **Password**: `admin123`
- **Role**: Admin
- **Organization**: Precision Ads Inc.

### **Publisher User**
- **Email**: `publisher@techcorp.com`
- **Password**: `user123`
- **Role**: Publisher
- **Organization**: TechCorp Media

### **Advertiser User**

- **Email**: `advertiser@fashionforward.com`
- **Password**: `user123`
- **Role**: Advertiser
- **Organization**: Fashion Forward Brands

### **Agency User**

- **Email**: `manager@digitalagency.com`
- **Password**: `user123`
- **Role**: Manager
- **Organization**: Digital Marketing Agency

---

## 🚀 **Starting the Application**

### **1. Start Backend Server**

```bash
cd backend
npm run dev
# or
npm start
```

**Expected Output**:

```
🚀 Precision Ads Server running on port 7401
✅ Database connected
✅ Routes initialized
🌐 CORS enabled for origins: http://localhost:7400, http://localhost:5173, http://localhost:3000
```

### **2. Start Frontend Development Server**

```bash
cd frontend
npm run dev
```

**Expected Output**:

```
  VITE v4.5.14  ready in 500 ms

  ➜  Local:   http://localhost:7400/
  ➜  Network: use --host to expose
```

---

## 🧪 **Testing the Authentication**

### **1. Test Organization Loading**

- Open `http://localhost:7400`
- Check browser console for any errors
- Verify organizations load from backend
- Should see 4 organizations in the dropdown

### **2. Test Login Flow**

- Try logging in with test credentials
- Verify successful login and redirect to dashboard
- Check browser localStorage for token storage

### **3. Test Token Validation**

- After login, check browser console
- Verify token validation calls to backend
- Check that user stays logged in on page refresh

### **4. Test Logout Flow**

- Click logout button
- Verify token removal from localStorage
- Verify redirect to login page

---

## 🔍 **Troubleshooting**

### **Common Issues and Solutions**

#### **1. "Failed to load organizations" Error**
- **Cause**: Backend not running or database connection issue
- **Solution**: 
  - Ensure backend is running on port 7401
  - Check database connection in backend logs
  - Verify `.env` file has correct DATABASE_URL

#### **2. "Login failed" Error**
- **Cause**: Invalid credentials or backend error
- **Solution**:
  - Use exact test credentials from seed data
  - Check backend logs for detailed error
  - Verify JWT_SECRET is set in backend `.env`

#### **3. "Network error" Message**
- **Cause**: Frontend can't reach backend
- **Solution**:
  - Verify backend is running on port 7401
  - Check VITE_API_URL in frontend `.env`
  - Ensure no CORS issues (should be fixed now)

#### **4. "Invalid token" Error**
- **Cause**: JWT token validation failure
- **Solution**:
  - Check JWT_SECRET matches between frontend and backend
  - Verify token format in browser localStorage
  - Check backend auth middleware logs

#### **5. CORS Policy Error**
- **Cause**: Backend CORS configuration issue
- **Solution**:
  - Ensure backend is running on port 7401
  - Check CORS_ORIGIN in backend `.env`
  - Verify CORS middleware is properly configured

---

## 📊 **Expected API Endpoints**

### **Authentication Endpoints**
- `POST /api/v1/auth/login` - User login
- `POST /api/v1/auth/logout` - User logout
- `GET /api/v1/auth/me` - Get current user
- `GET /api/v1/auth/validate` - Validate token
- `POST /api/v1/auth/refresh` - Refresh token
- `GET /api/v1/auth/organizations` - Get organizations for login

### **Test with curl**

```bash
# Test organizations endpoint
curl http://localhost:7401/api/v1/auth/organizations

# Test login endpoint
curl -X POST http://localhost:7401/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@precisionads.com","password":"admin123"}'
```

---

## 🎯 **Success Criteria**

### **✅ Authentication Working**

- [ ] Organizations load from backend
- [ ] Login with test credentials succeeds
- [ ] JWT token is stored in localStorage
- [ ] User stays logged in after page refresh
- [ ] Logout properly clears session
- [ ] No hardcoded data in frontend
- [ ] No CORS errors

### **✅ Backend Integration**

- [ ] All auth endpoints respond correctly
- [ ] JWT tokens are properly validated
- [ ] Role-based access control works
- [ ] Organization validation functions
- [ ] Token refresh mechanism works
- [ ] CORS properly configured

### **✅ Error Handling**

- [ ] Invalid credentials show proper error
- [ ] Network errors are handled gracefully
- [ ] Missing organization selection shows error
- [ ] Backend errors are displayed to user

---

## 🚀 **Next Steps (Week 2)**

Once authentication is working:

1. **Connect Organizations API** - Replace mock data in DataMetricsDashboard
2. **Connect Users API** - Replace mock data in AuthManagementDashboard  
3. **Connect API Keys API** - Replace mock data in API key management
4. **Test CRUD Operations** - Verify all admin functions work

---

## 📞 **Support**

If you encounter issues:

1. **Check backend logs** for detailed error messages
2. **Check browser console** for frontend errors
3. **Verify environment variables** are set correctly
4. **Ensure database is running** and accessible
5. **Check network tab** for failed API calls
6. **Verify CORS configuration** is working

**Happy Testing! 🎉** 