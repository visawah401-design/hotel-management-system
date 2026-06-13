# Hotel Management System 🏨

एक complete, production-ready **Hotel Management System** जो online booking, room management, guest check-in/check-out और facilities management के साथ है।

## 🎯 Features

### Guest/User Features
- ✅ User Registration और Login
- ✅ Available rooms देखना
- ✅ Room booking करना (check-in, check-out dates के साथ)
- ✅ My Bookings देखना
- ✅ Check-in/Check-out करना
- ✅ Booking cancel करना
- ✅ User profile manage करना

### Admin Features
- ✅ Rooms add/edit/delete करना
- ✅ Room pricing manage करना
- ✅ सभी bookings देख सकते हैं
- ✅ Facilities manage करना
- ✅ Dashboard analytics (future)

### Technical Features
- ✅ Modern UI/UX design
- ✅ Responsive layout (mobile friendly)
- ✅ JWT authentication
- ✅ Password hashing
- ✅ Database persistence
- ✅ RESTful API
- ✅ Error handling

## 🛠️ Tech Stack

### Backend
- **Node.js** - JavaScript runtime
- **Express.js** - Web framework
- **MongoDB** - NoSQL Database
- **JWT** - Authentication
- **Bcryptjs** - Password hashing

### Frontend
- **React** - UI library
- **React Router** - Navigation
- **Axios** - HTTP client
- **CSS3** - Styling

## 📁 Project Structure

```
Hotel/
├── server/                 # Backend
│   ├── models/            # Database models
│   │   ├── User.js
│   │   ├── Room.js
│   │   ├── Booking.js
│   │   ├── Payment.js
│   │   └── Facility.js
│   ├── routes/            # API routes
│   │   ├── users.js
│   │   ├── rooms.js
│   │   ├── bookings.js
│   │   ├── payments.js
│   │   └── facilities.js
│   ├── middleware/        # Custom middleware
│   ├── server.js          # Main server file
│   ├── package.json
│   └── .env              # Environment variables (create करना होगा)
│
├── client/                # Frontend
│   ├── public/           # Static files
│   │   └── index.html
│   ├── src/
│   │   ├── pages/        # Page components
│   │   │   ├── Home.js
│   │   │   ├── Rooms.js
│   │   │   ├── Bookings.js
│   │   │   ├── Login.js
│   │   │   ├── Register.js
│   │   │   ├── Admin.js
│   │   │   └── *.css
│   │   ├── components/   # Reusable components
│   │   │   └── RoomCard.js
│   │   ├── App.js        # Main app component
│   │   ├── App.css
│   │   ├── index.js      # React entry point
│   │   └── index.css
│   ├── package.json
│   └── public/index.html
│
├── .env.example          # Environment template
├── .gitignore           # Git ignore file
└── README.md            # यह file
```

## 🚀 Getting Started

### Prerequisites
- **Node.js** (v14+) - [Download](https://nodejs.org/)
- **MongoDB** - [Community Edition](https://www.mongodb.com/try/download/community) या [Atlas (Cloud)](https://www.mongodb.com/cloud/atlas)
- **npm** या **yarn** package manager

### Installation Steps

#### 1️⃣ Backend Setup

```bash
# server folder में जाएं
cd server

# Dependencies install करें
npm install

# .env file बनाएं
cp ../.env.example .env

# .env file को edit करें और सही values डालें:
# PORT=5000
# MONGODB_URI=mongodb://localhost:27017/hotel-management
# JWT_SECRET=your_secret_key_here
# NODE_ENV=development
```

#### 2️⃣ MongoDB Setup

**Option 1: Local MongoDB**
```bash
# MongoDB को start करें (Windows)
mongod

# या Mac/Linux में:
mongod --dbpath /usr/local/var/mongodb
```

**Option 2: MongoDB Atlas (Cloud)**
- [MongoDB Atlas](https://www.mongodb.com/cloud/atlas) पर account बनाएं
- Cluster create करें
- Connection string copy करें
- .env में `MONGODB_URI` को update करें

#### 3️⃣ Frontend Setup

```bash
# client folder में जाएं
cd client

# Dependencies install करें
npm install
```

## 🏃 Running the Application

### Terminal 1 - Backend Server शुरु करें:
```bash
cd server
npm start
# या development mode के लिए:
npm run dev
```
**Backend running होगा:** `http://localhost:5000`

### Terminal 2 - Frontend शुरु करें:
```bash
cd client
npm start
```
**Frontend खुलेगा:** `http://localhost:3000`

## 📝 Default Test Credentials

### Admin Account बनाने के लिए:
1. `/register` पर जाएं
2. नया account create करें
3. Database में manually role को 'admin' से update करें

या समय समय पर admin account बना सकते हैं:
```bash
# MongoDB Shell में
use hotel-management
db.users.updateOne({ email: 'admin@example.com' }, { $set: { role: 'admin' } })
```

## 📚 API Endpoints

### Users
- `POST /api/users/register` - नया user register करें
- `POST /api/users/login` - Login करें
- `GET /api/users/:id` - User profile देखें
- `PUT /api/users/:id` - Profile update करें

### Rooms
- `GET /api/rooms` - सभी rooms देखें
- `GET /api/rooms/:id` - Specific room देखें
- `POST /api/rooms` - नया room add करें (Admin)
- `PUT /api/rooms/:id` - Room update करें (Admin)
- `DELETE /api/rooms/:id` - Room delete करें (Admin)
- `GET /api/rooms/available` - Available rooms देखें

### Bookings
- `POST /api/bookings` - नई booking create करें
- `GET /api/bookings` - सभी bookings (Admin)
- `GET /api/bookings/user/:userId` - User की bookings
- `GET /api/bookings/:id` - Specific booking
- `PUT /api/bookings/:id/checkin` - Check-in करें
- `PUT /api/bookings/:id/checkout` - Check-out करें
- `PUT /api/bookings/:id/cancel` - Booking cancel करें

### Payments
- `POST /api/payments` - Payment create करें
- `GET /api/payments` - सभी payments
- `GET /api/payments/:id` - Specific payment

### Facilities
- `GET /api/facilities` - सभी facilities
- `POST /api/facilities` - नई facility add करें
- `PUT /api/facilities/:id` - Facility update करें
- `DELETE /api/facilities/:id` - Facility delete करें

## 🎨 UI Features

### Home Page
- Welcome banner
- Features showcase
- About section

### Rooms Page
- Room grid display
- Room details (price, capacity, amenities)
- Booking modal
- Status indicators

### Bookings Page
- User के सभी bookings
- Status tracking
- Check-in/Check-out buttons
- Cancel option

### Admin Dashboard
- Room management
- Booking management
- Analytics (future)

### Authentication
- Registration form
- Login form
- Password security

## 🔧 Configuration

### .env file:
```
PORT=5000
MONGODB_URI=mongodb://localhost:27017/hotel-management
JWT_SECRET=your_very_secure_secret_key_change_this
NODE_ENV=development
```

## 🐛 Troubleshooting

### MongoDB Connection Error
```
Error: connect ECONNREFUSED 127.0.0.1:27017
```
**Solution:** MongoDB service को start करें:
```bash
# Windows
mongod

# Mac
brew services start mongodb-community

# Linux
sudo systemctl start mongod
```

### Port Already in Use
```bash
# Port 5000 को kill करें (Windows PowerShell):
Get-Process -Id (Get-NetTCPConnection -LocalPort 5000).OwningProcess | Stop-Process

# Mac/Linux:
lsof -ti:5000 | xargs kill -9
```

### Dependencies Missing
```bash
cd server
npm install
cd ../client
npm install
```

## 📱 Mobile Responsive

- ✅ Responsive navbar
- ✅ Mobile-friendly grid layouts
- ✅ Touch-friendly buttons
- ✅ Mobile form optimization

## 🔐 Security Features

- JWT token authentication
- Password hashing with bcryptjs
- Input validation
- Error handling
- CORS enabled

## 🚀 Future Enhancements

- [ ] Payment gateway integration (Razorpay/Stripe)
- [ ] Email notifications
- [ ] SMS notifications
- [ ] Guest reviews system
- [ ] Advanced analytics
- [ ] Multi-language support
- [ ] Photo uploads
- [ ] Advanced search filters
- [ ] Booking cancellation policy
- [ ] Loyalty program

## 📞 Support

अगर कोई issue है तो:
1. MongoDB connection check करें
2. सभी dependencies installed हैं check करें
3. .env file properly configured है check करें
4. Browser console में errors देखें
5. Network tab में API calls check करें

## 📄 License

This project is open source and available under the MIT License.

---

**Happy Coding!** 🎉

बनाया गया: 2024
Last Updated: 2024
