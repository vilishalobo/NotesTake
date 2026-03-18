const mongoose = require('mongoose');

const noteSchema = new mongoose.Schema({
  userId: { 
    type: String, 
    required: true 
  },
  ownerEmail: {
    type: String,
    required: true,
  },
  sharedWith: {
    type: [String], // Array of user IDs who can access this note
    default: [],
  },
  sharedWithEmails: {
    type: [String], // Array of emails for display purposes
    default: [],
  },
  title: { 
    type: String, 
    required: true 
  },
  content: { 
    type: String,
    default: '' 
  },
  tags: { 
    type: [String], 
    default: [] 
  },
  images: {
    type: [String], // Array of GridFS file IDs
    default: [],
  },
  isShared: {
    type: Boolean,
    default: false,
  },
  createdAt: { 
    type: Date, 
    default: Date.now 
  },
  updatedAt: { 
    type: Date, 
    default: Date.now 
  },
});

// Update the updatedAt field before saving
noteSchema.pre('save', function(next) {
  this.updatedAt = Date.now();
  next();
});

// Update the updatedAt field before updating
noteSchema.pre('findOneAndUpdate', function(next) {
  this.set({ updatedAt: Date.now() });
  next();
});

const Note = mongoose.model('Note', noteSchema);

module.exports = Note;