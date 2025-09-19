const mongoose = require('mongoose');

const taskSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true,
    trim: true
  },
  description: {
    type: String,
    trim: true
  },
  
  // Task scheduling
  scheduledDate: {
    type: Date,
    required: true
  },
  scheduledTime: {
    type: String,
    required: true
  },
  duration: {
    type: Number, // Duration in minutes
    default: 60
  },
  
  // Task assignment
  assignedTo: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  
  // Task status
  status: {
    type: String,
    enum: ['pending', 'scheduled', 'completed', 'cancelled'],
    default: 'pending'
  },
  
  // Outlook integration
  outlookEventId: {
    type: String // Microsoft Graph Calendar Event ID
  },
  outlookMeetingUrl: String,
  
  // Task details
  category: {
    type: String,
    default: 'general'
  },
  personalContacto: String,
  
  // Client information (for commercial tasks)
  clientName: String,
  clientEmail: String,
  clientPhone: String,
  
  // Timestamps
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  },
  completedAt: Date
});

// Update the updatedAt field before saving
taskSchema.pre('save', function(next) {
  this.updatedAt = Date.now();
  next();
});

// Index for efficient queries
taskSchema.index({ assignedTo: 1, scheduledDate: 1 });
taskSchema.index({ createdBy: 1 });
taskSchema.index({ status: 1 });

module.exports = mongoose.model('Task', taskSchema);
