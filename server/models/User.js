const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
  // Azure Entra ID information
  azureId: {
    type: String,
    required: true,
    unique: true
  },
  email: {
    type: String,
    required: true,
    unique: true
  },
  name: {
    type: String,
    required: true
  },
  
  // Application-specific fields
  role: {
    type: String,
    enum: ['commercial', 'admin'],
    default: 'commercial'
  },
  isActive: {
    type: Boolean,
    default: true
  },
  
  // Profile information
  profilePicture: String,
  department: String,
  
  // Timestamps
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  },
  lastLogin: {
    type: Date,
    default: Date.now
  }
});

// Update the updatedAt field before saving
userSchema.pre('save', function(next) {
  this.updatedAt = Date.now();
  next();
});

module.exports = mongoose.model('User', userSchema);
