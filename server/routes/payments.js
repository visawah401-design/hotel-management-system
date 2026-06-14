const express = require('express');
const Payment = require('../models/Payment');
const Booking = require('../models/Booking');
const Razorpay = require('razorpay');
const crypto = require('crypto');

const router = express.Router();

// Razorpay: Create Order
router.post('/create-order', async (req, res) => {
  try {
    const { amount } = req.body;
    if (!amount || amount < 1) {
      return res.status(400).json({ message: 'Minimum amount must be at least 1 INR' });
    }

    const razorpay = new Razorpay({
      key_id: process.env.RAZORPAY_KEY_ID,
      key_secret: process.env.RAZORPAY_KEY_SECRET,
    });

    const options = {
      amount: Math.round(amount * 100), // amount in paise
      currency: 'INR',
      receipt: `rcpt_${Date.now()}`
    };

    const order = await razorpay.orders.create(options);
    res.json(order);
  } catch (error) {
    res.status(500).json({ message: error.message || 'Razorpay order creation failed' });
  }
});

// Razorpay: Verify Signature
router.post('/verify-payment', async (req, res) => {
  try {
    const { razorpay_order_id, razorpay_payment_id, razorpay_signature } = req.body;
    
    if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature) {
      return res.status(400).json({ message: 'Missing payment verification fields' });
    }

    const body = razorpay_order_id + "|" + razorpay_payment_id;
    const expectedSignature = crypto
      .createHmac('sha256', process.env.RAZORPAY_KEY_SECRET)
      .update(body.toString())
      .digest('hex');

    if (expectedSignature === razorpay_signature) {
      res.json({ success: true, message: 'Payment verified successfully' });
    } else {
      res.status(400).json({ success: false, message: 'Invalid payment signature' });
    }
  } catch (error) {
    res.status(500).json({ message: error.message || 'Payment verification failed' });
  }
});

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
