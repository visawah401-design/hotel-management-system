const express = require('express');
const Booking = require('../models/Booking');
const Room = require('../models/Room');
const auth = require('../middleware/auth');
const optionalAuth = require('../middleware/optionalAuth');

const router = express.Router();

// Create Booking
router.post('/', optionalAuth, async (req, res) => { // Auth is used to optionally get req.user
  try {
    // More fields from the frontend form
    const {
      name, mobile, address, room, roomType, roomNumbers, roomRate, roomCount,
      checkIn, checkOut, rawCheckIn, rawCheckOut, guests, totalAmount,
      advance, paymentMethod, status, actualCheckIn, photo, companyName, guestGstin,
      paymentStatus, razorpayPaymentId, nights,
    } = req.body;

    // Generate unique booking ID with timestamp to avoid collisions
    let newId;
    let isUnique = false;
    let attempts = 0;
    const maxAttempts = 10;

    while (!isUnique && attempts < maxAttempts) {
      newId = 'VSW-' + Math.floor(100000 + Math.random() * 900000);
      const existingBooking = await Booking.findOne({ id: newId });
      if (!existingBooking) {
        isUnique = true;
      }
      attempts++;
    }

    if (!isUnique) {
      newId = 'VSW-' + Date.now() + '-' + Math.random().toString(36).substr(2, 9);
    }

    const booking = new Booking({
      id: newId, // Using the same ID format as localStorage
      name, mobile, address, room, roomType, roomNumbers, roomRate, roomCount,
      checkIn, checkOut, rawCheckIn, rawCheckOut, guests, totalAmount,
      advance, paymentMethod, status, actualCheckIn, photo, companyName, guestGstin, userId: req.user?.id, // Link booking to user if logged in
      paymentStatus, razorpayPaymentId, nights
    });

    const newBooking = await booking.save();

    res.status(201).json(newBooking);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

// Get All Bookings
router.get('/', optionalAuth, async (req, res) => { // Now protected for admins
  try {
    const bookings = await Booking.find().sort({ createdAt: -1 }); // Sort by creation date
    res.json(bookings);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Get public booking availability (dates and room numbers only)
router.get('/availability', async (req, res) => {
  try {
    // Only return non-sensitive data needed for conflict checking on the frontend
    const bookings = await Booking.find({ status: { $in: ['Pending', 'Checked-In'] } }).select('roomNumbers rawCheckIn rawCheckOut');
    res.json(bookings);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Get User Bookings
router.get('/user/:userId', optionalAuth, async (req, res) => { // Protected
  try {
    const bookings = await Booking.find({ userId: req.params.userId })
      .populate('roomId');
    res.json(bookings);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Get Booking by ID
router.get('/:id', async (req, res) => { // Public for guest portal access
  try {
    const booking = await Booking.findOne({ id: req.params.id }); // Find by custom VSW- ID
    if (!booking) {
      return res.status(404).json({ message: 'Booking not found' });
    }
    res.json(booking);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Update Booking
router.put('/:id', auth, async (req, res) => { // Protected
  try {
    const booking = await Booking.findOneAndUpdate({ id: req.params.id }, req.body, { new: true });
    if (!booking) {
      return res.status(404).json({ message: 'Booking not found' });
    }
    res.json(booking);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

// Check-in
router.put('/:id/checkin', auth, async (req, res) => { // Protected
  try {
    const { actualCheckIn } = req.body;
    const booking = await Booking.findOneAndUpdate({ id: req.params.id }, { status: 'Checked-In', actualCheckIn }, { new: true });
    if (!booking) {
      return res.status(404).json({ message: 'Booking not found' });
    }
    res.json(booking);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Check-out
router.put('/:id/checkout', auth, async (req, res) => { // Protected
  try {
    const { actualCheckOut } = req.body;
    const booking = await Booking.findOneAndUpdate({ id: req.params.id }, { status: 'Checked-Out', actualCheckOut }, { new: true });
    if (!booking) {
      return res.status(404).json({ message: 'Booking not found' });
    }
    res.json(booking);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Cancel Booking
router.put('/:id/cancel', auth, async (req, res) => { // Protected
  try {
    const { reason, auditTime } = req.body;
    const booking = await Booking.findOneAndUpdate({ id: req.params.id }, { status: 'Cancelled', archived: true, cancelledAt: auditTime, cancelledBy: 'Super Admin', cancelReason: reason }, { new: true });
    if (!booking) {
      return res.status(404).json({ message: 'Booking not found' });
    }
    res.json(booking);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Permanently delete a booking
router.delete('/:id', auth, async (req, res) => {
  try {
    const booking = await Booking.findOneAndDelete({ id: req.params.id });
    if (!booking) {
      return res.status(404).json({ message: 'Booking not found' });
    }
    res.json({ message: 'Booking deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

module.exports = router;
