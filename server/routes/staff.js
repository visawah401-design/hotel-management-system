const express = require('express');
const Staff = require('../models/Staff');
const auth = require('../middleware/auth');

const router = express.Router();

// GET all staff
router.get('/', auth, async (req, res) => {
    try {
        const staffList = await Staff.find({ archived: { $ne: true } }).sort({ createdAt: 1 });
        res.json(staffList);
    } catch (error) {
        res.status(500).json({ message: 'Server Error' });
    }
});

// POST a new staff member
router.post('/', auth, async (req, res) => {
    const { name, role, shift } = req.body;
    try {
        const lastStaff = await Staff.findOne().sort({ staffId: -1 });
        const lastIdNum = lastStaff ? parseInt(lastStaff.staffId.split('-')[1]) : 100;
        const staffId = `EMP-${lastIdNum + 1}`;

        const newStaff = new Staff({
            staffId,
            name,
            role,
            shift,
            status: 'Present',
            history: {},
            stats: { P: 0, A: 0, L: 0, H: 0 }
        });
        const savedStaff = await newStaff.save();
        res.status(201).json(savedStaff);
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
});

// PUT update staff attendance
router.put('/:id/attendance', auth, async (req, res) => {
    const { newStatus, todayStr } = req.body;
    try {
        const staff = await Staff.findById(req.params.id);
        if (!staff) {
            return res.status(404).json({ message: 'Staff not found' });
        }

        const oldStatus = staff.history.get(todayStr);

        // Decrement old status count if it exists for today
        if (oldStatus && staff.stats[oldStatus.charAt(0)]) {
            staff.stats[oldStatus.charAt(0)] -= 1;
        }

        // Increment new status count
        if (staff.stats[newStatus.charAt(0)] !== undefined) {
            staff.stats[newStatus.charAt(0)] += 1;
        }

        staff.history.set(todayStr, newStatus);
        staff.status = newStatus; // Update current status
        staff.markModified('stats');
        staff.markModified('history');

        const updatedStaff = await staff.save();
        res.json(updatedStaff);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// DELETE (archive) a staff member
router.delete('/:id', auth, async (req, res) => {
    // This is a soft delete
    const { archivedAt, archivedBy } = req.body;
    const staff = await Staff.findByIdAndUpdate(req.params.id, { archived: true, status: 'Inactive', archivedAt, archivedBy }, { new: true });
    res.json(staff);
});

module.exports = router;