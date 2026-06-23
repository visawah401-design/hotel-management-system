const mongoose = require('mongoose');

const bookingSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  id: { type: String, required: true, unique: true },
  name: { type: String, required: true },
  mobile: { type: String, required: true },
  address: { type: String },
  room: { type: String, required: true },
  roomType: { type: String },
  roomNumbers: [{ type: String }],
  roomRate: { type: Number },
  roomCount: { type: Number, default: 1 },
  checkIn: { type: String, required: true },
  checkOut: { type: String, required: true },
  rawCheckIn: { type: Date },
  rawCheckOut: { type: Date },
  guests: { type: Number, default: 1 },
  totalAmount: { type: Number, required: true },
  advance: { type: Number, default: 0 },
  paymentMethod: { type: String },
  status: { type: String, default: 'Pending' }, // Pending, Checked-In, Checked-Out, Cancelled
  actualCheckIn: { type: String },
  actualCheckOut: { type: String },
  photo: { type: String },
  companyName: { type: String },
  guestGstin: { type: String },
  paymentStatus: { type: String }, // Completed, Pending
  razorpayPaymentId: { type: String },
  nights: { type: Number },
  // For archival
  archived: { type: Boolean, default: false },
  cancelledAt: { type: String },
  cancelledBy: { type: String },
  cancelReason: { type: String },
  // For guest portal alerts
  checkoutAlert: { type: Boolean, default: false },
  // Standard Timestamps
  createdAt: {
    type: Date,
    default: Date.now
  }
});

const Booking = mongoose.model('Booking', bookingSchema);

module.exports = Booking;