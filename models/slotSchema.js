const mongoose = require('mongoose');

const slotSchema = new mongoose.Schema({
  date: {
    type: String,
    required: true, // ensures a date is provided for the slot
  },
  startTime: {
    type: String, // start time for slot
    required: true,
  },
  endTime: {
    type: String, // end time for slot
    required: true,
  },
  status: {
    type: String, // "available" or "not-available"
    default: "available",
    enum: ["available", "not-available"],
    required: true,
  },
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User', // reference to User model
    required: true
  }
});

const Slot = mongoose.model('Slot', slotSchema);

module.exports = Slot;