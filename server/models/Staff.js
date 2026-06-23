const mongoose = require('mongoose');

const staffSchema = new mongoose.Schema({
  staffId: { type: String, required: true, unique: true },
  name: { type: String, required: true },
  role: { type: String, required: true },
  shift: { type: String },
  status: { type: String, default: 'Present' }, // Current day's status
  stats: {
    P: { type: Number, default: 0 }, // Present
    A: { type: Number, default: 0 }, // Absent
    L: { type: Number, default: 0 }, // Leave
    H: { type: Number, default: 0 }  // Half Day
  },
  history: {
    type: Map,
    of: String // e.g., { '2026-05-29': 'Present' }
  },
  archived: { type: Boolean, default: false },
  archivedAt: { type: String },
  archivedBy: { type: String }
}, { timestamps: true });

const Staff = mongoose.model('Staff', staffSchema);

module.exports = Staff;