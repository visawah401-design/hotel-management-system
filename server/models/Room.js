const mongoose = require('mongoose');

const roomSchema = new mongoose.Schema(
  {
    roomNumber: {
      type: String,
      required: [true, 'Please provide a room number'],
      unique: true,
      trim: true,
    },
    roomType: {
      type: String,
      required: [true, 'Please provide a room type'],
      enum: ['Single', 'Double', 'Suite', 'Deluxe'],
    },
    capacity: {
      type: Number,
      required: [true, 'Please provide room capacity'],
      min: 1,
    },
    pricePerNight: {
      type: Number,
      required: [true, 'Please provide room price'],
      min: 0,
    },
    status: {
      type: String,
      enum: ['Available', 'Occupied', 'Maintenance'],
      default: 'Available',
    },
    amenities: {
      type: [String],
      default: [],
    },
    description: {
      type: String,
      trim: true,
    },
    images: {
      type: [String],
      default: [],
    },
    floor: {
      type: Number,
      required: false,
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model('Room', roomSchema);
