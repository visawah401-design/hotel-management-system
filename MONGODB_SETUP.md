# 🏨 Hotel Management System - MongoDB Setup Guide

## Option 1: MongoDB Atlas (Cloud) - Recommended ✅

### Step 1: Create MongoDB Atlas Account
1. Go to https://www.mongodb.com/cloud/atlas
2. Click "Try Free" 
3. Sign up with email or Google account
4. Create organization and project

### Step 2: Create a Free Cluster
1. Click "Build a Database"
2. Select "M0 Free" tier (forever free)
3. Select region (closest to your location)
4. Click "Create"
5. Wait for cluster to be created (5-10 minutes)

### Step 3: Get Connection String
1. Click "Connect" button on cluster
2. Choose "Drivers" 
3. Select "Node.js" and version "5.9 or later"
4. Copy the connection string
5. Replace `<password>` with your database user password
6. Replace `myFirstDatabase` with `hotel-management`

Example format:
```
mongodb+srv://username:password@cluster.mongodb.net/hotel-management?retryWrites=true&w=majority
```

### Step 4: Update .env File
Update server/.env with your connection string:
```
MONGODB_URI=mongodb+srv://YOUR_USERNAME:YOUR_PASSWORD@YOUR_CLUSTER.mongodb.net/hotel-management?retryWrites=true&w=majority
```

---

## Option 2: Local MongoDB (If Installed)

### For Windows - Using MongoDB Community Edition

If you have MongoDB installed locally:

```
MONGODB_URI=mongodb://127.0.0.1:27017/hotel-management
```

Then start MongoDB:
```
mongod
```

---

## ✅ Quick Test Commands

After setting up MongoDB and updating .env:

### Terminal 1 - Start Backend
```
cd "c:\Users\sachi\OneDrive\Desktop\Hotel\server"
npm start
```
✅ Should show: "Server running on port 5000"

### Terminal 2 - Start Frontend  
```
cd "c:\Users\sachi\OneDrive\Desktop\Hotel\client"
npm start
```
✅ Should open browser at http://localhost:3000

---

## Test Accounts

After system starts, register new user or use:
- **Email:** user@hotel.com
- **Password:** User@123

---

## Troubleshooting

### Error: "ENOTFOUND _mongodb._tcp..."
- Check MongoDB Atlas connection string
- Verify username and password are correct
- Check IP whitelist (Atlas > Security > Network Access > Add Current IP)

### Error: "Cannot find MongoDB"
- MongoDB not installed locally
- Use MongoDB Atlas (cloud option) instead
- Or install MongoDB Community Edition from mongodb.com

### Error: "connect ECONNREFUSED 127.0.0.1:27017"
- MongoDB service not running
- Start mongod service in Windows Services
- Or use MongoDB Atlas (cloud)

---

**Need Help?** Keep this file open for reference!
