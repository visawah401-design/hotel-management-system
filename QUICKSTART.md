# Quick Start Guide 🚀

## पहली बार शुरु करने के लिए इन steps को follow करें:

### Step 1: MongoDB Setup करें (एक बार)

**Option A: Local MongoDB (Recommended for beginners)**
1. [MongoDB Community Edition](https://www.mongodb.com/try/download/community) download करें
2. Install करें (सभी default options रखें)
3. Installation खत्म करने के बाद, PowerShell में ये command चलाएं:
```powershell
mongod
```
यह MongoDB server को start करेगा (keep करें open)

**Option B: MongoDB Atlas (Cloud - Easy)**
1. [MongoDB Atlas](https://www.mongodb.com/cloud/atlas) पर जाएं
2. Account बनाएं (free tier available है)
3. Cluster create करें
4. Connection string copy करें
5. `.env` file में `MONGODB_URI` को update करें

---

### Step 2: Backend Dependencies Install करें

```powershell
# Hotel folder में जाएं (अगर पहले से नहीं हैं)
cd server

# सभी npm packages install करें
npm install
```

**Expected packages:** express, mongoose, dotenv, bcryptjs, jsonwebtoken, cors

---

### Step 3: Frontend Dependencies Install करें

```powershell
# server folder से बाहर आएं
cd ..

# client folder में जाएं
cd client

# React और सभी dependencies install करें
npm install
```

**Expected packages:** react, react-dom, react-router-dom, axios

---

### Step 4: .env File Setup करें

```powershell
# server folder में जाएं
cd server

# .env file बनाएं (copy करके):
copy ..\.env.example .env

# Notepad से open करें
notepad .env
```

यह content होना चाहिए:
```
PORT=5000
MONGODB_URI=mongodb://localhost:27017/hotel-management
JWT_SECRET=my_secret_key_12345
NODE_ENV=development
```

Save करें (Ctrl+S)

---

### Step 5: दोनों Server शुरु करें

**Terminal 1 - Backend Server:**
```powershell
cd server
npm start
```
✅ Message दिखेगा: `Server running on port 5000`

**Terminal 2 - Frontend (नया Terminal खोलें):**
```powershell
cd client
npm start
```
✅ Automatically browser खुलेगा: `http://localhost:3000`

---

## ✅ All Set! अब आप यह सब कर सकते हैं:

### Test करने के लिए:

1. **Home Page देखें** (`/`)
   - Beautiful welcome screen
   - Features description

2. **Register करें** (`/register`)
   - नया user account बनाएं
   - Email: test@example.com
   - Password: कोई भी strong password

3. **Login करें** (`/login`)
   - अभी बनाए गए credentials use करें

4. **Rooms Booking करें** (`/rooms`)
   - Available rooms देखें
   - कोई भी room select करें
   - Check-in/Check-out dates select करें
   - Booking confirm करें

5. **My Bookings देखें** (`/bookings`)
   - अपनी bookings list देखें
   - Check-in करें
   - Check-out करें
   - Cancel भी कर सकते हैं

---

## 🔑 Admin Features को Enable करने के लिए:

1. **User बनाएं** (normal registration)
2. **MongoDB Compass** खोलें (या command line)
3. Database: `hotel-management`
4. Collection: `users`
5. अपने user के `role` को `admin` में change करें
6. अब `/admin` page access कर सकते हैं

```javascript
// MongoDB में यह command चलाएं:
db.users.updateOne(
  { email: "your-email@example.com" }, 
  { $set: { role: "admin" } }
)
```

---

## 📊 Admin Dashboard में क्या कर सकते हैं:

- ✅ नए rooms add करें
- ✅ Existing rooms को edit/delete करें
- ✅ सभी bookings देखें
- ✅ Guest information देखें

---

## 🛑 अगर कोई Error आये:

### "Cannot find module 'mongoose'"
```powershell
cd server
npm install
```

### "MongoDB Connection Refused"
```powershell
# Terminal खोलें और चलाएं:
mongod
```
(इसे चलते हुए रखें)

### "Port 5000 already in use"
```powershell
# Port को free करें:
Get-Process -Id (Get-NetTCPConnection -LocalPort 5000).OwningProcess | Stop-Process
```

### Browser में blank page दिखे
```powershell
# client folder में जाएं
cd client

# npm cache clear करें
npm cache clean --force

# फिर से npm install करें
npm install

# फिर से start करें
npm start
```

---

## 🎯 Development Tips:

- **Backend changes** के लिए `nodemon` automatically restart करता है
- **Frontend changes** को hot reload होता है (file save करते ही update दिख जाता है)
- **API Test** करने के लिए [Postman](https://www.postman.com/) use कर सकते हैं
- **MongoDB visualize** करने के लिए [MongoDB Compass](https://www.mongodb.com/products/tools/compass) download करें

---

## 📚 अगले Steps:

1. **Features customize करें** - अपनी requirements के हिसाब से
2. **Database add करें** - Test data के लिए कुछ rooms add करें
3. **Styling improve करें** - अपनी पसंद के colors/fonts use करें
4. **Payment gateway add करें** - Razorpay/Stripe integrate करें
5. **Deploy करें** - Heroku/Vercel पर

---

## 🎉 Congratulations!

आपका **Hotel Management System** काम करने के लिए तैयार है!

अगर कोई सवाल हो तो README.md file देखें या GitHub issues में पूछें।

**Happy Coding!** 🚀
