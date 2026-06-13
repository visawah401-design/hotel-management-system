const express = require('express');
const Payment = require('../models/Payment');
const Booking = require('../models/Booking');

const router = express.Router();

// Create Payment
router.post('/', async (req, res) => {
  try {
    const { bookingId, amount, paymentMethod } = req.body;

    const payment = new Payment({
      bookingId,
      amount,
      paymentMethod,
      transactionId: `TXN${Date.now()}`,
      status: 'Completed', // In real scenario, integrate with payment gateway
    });

    const newPayment = await payment.save();

    // Update booking status
    await Booking.findByIdAndUpdate(bookingId, { status: 'Confirmed' });

    res.status(201).json(newPayment);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

// Get All Payments
router.get('/', async (req, res) => {
  try {
    const payments = await Payment.find().populate('bookingId');
    res.json(payments);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Get Payment by ID
router.get('/:id', async (req, res) => {
  try {
    const payment = await Payment.findById(req.params.id).populate('bookingId');
    if (!payment) {
      return res.status(404).json({ message: 'Payment not found' });
    }
    res.json(payment);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

module.exports = router;
