const express = require('express');
const Facility = require('../models/Facility');

const router = express.Router();

// Get All Facilities
router.get('/', async (req, res) => {
  try {
    const facilities = await Facility.find();
    res.json(facilities);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Create Facility
router.post('/', async (req, res) => {
  const facility = new Facility(req.body);
  try {
    const newFacility = await facility.save();
    res.status(201).json(newFacility);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

// Update Facility
router.put('/:id', async (req, res) => {
  try {
    const facility = await Facility.findByIdAndUpdate(req.params.id, req.body, { new: true });
    if (!facility) {
      return res.status(404).json({ message: 'Facility not found' });
    }
    res.json(facility);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

// Delete Facility
router.delete('/:id', async (req, res) => {
  try {
    const facility = await Facility.findByIdAndDelete(req.params.id);
    if (!facility) {
      return res.status(404).json({ message: 'Facility not found' });
    }
    res.json({ message: 'Facility deleted' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

module.exports = router;
