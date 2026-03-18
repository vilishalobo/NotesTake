const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const http = require('http');
const { Server } = require('socket.io');
require('dotenv').config();

const app = express();
const server = http.createServer(app);

// Dynamic CORS configuration
const corsOptions = {
  origin: function (origin, callback) {
    // Allow requests with no origin (mobile apps, Postman, etc.)
    if (!origin) return callback(null, true);
    
    // Allow localhost and all note-stake-frontend Vercel deployments
    if (
      origin.includes('localhost') || 
      (origin.includes('note-stake-frontend') && origin.endsWith('.vercel.app'))
    ) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS']
};

// Configure Socket.IO with dynamic CORS
const io = new Server(server, {
  cors: corsOptions
});

const PORT = process.env.PORT || 5000;

// Middleware
app.use(express.json());
app.use(cors(corsOptions));

// Import GridFS config
const { initGridFS } = require('./config/gridfsConfig');

// Connect to MongoDB
mongoose.connect(process.env.MONGODB_URI)
  .then(() => {
    console.log('MongoDB connected');
    initGridFS();
  })
  .catch((err) => console.error('MongoDB connection error:', err));

// Socket.IO Connection Handling
const activeUsers = new Map();

io.on('connection', (socket) => {
  console.log(`✅ User connected: ${socket.id}`);

  socket.on('join-note', ({ noteId, userId, userName }) => {
    socket.join(noteId);
    
    if (!activeUsers.has(noteId)) {
      activeUsers.set(noteId, new Set());
    }
    activeUsers.get(noteId).add({ socketId: socket.id, userId, userName });

    socket.to(noteId).emit('user-joined', { userId, userName });
    
    const usersInNote = Array.from(activeUsers.get(noteId) || []);
    socket.emit('active-users', usersInNote);
    
    console.log(`👥 User ${userName} joined note ${noteId}`);
  });

  socket.on('leave-note', ({ noteId, userId }) => {
    socket.leave(noteId);
    
    if (activeUsers.has(noteId)) {
      const users = activeUsers.get(noteId);
      const userArray = Array.from(users);
      const updatedUsers = userArray.filter(u => u.socketId !== socket.id);
      
      if (updatedUsers.length === 0) {
        activeUsers.delete(noteId);
      } else {
        activeUsers.set(noteId, new Set(updatedUsers));
      }
    }
    
    socket.to(noteId).emit('user-left', { userId });
  });

  socket.on('note-created', ({ note, userId }) => {
    io.emit('note-created', { note, userId });
    console.log(`📝 New note created by ${userId}: ${note.title}`);
  });

  socket.on('note-updated', ({ noteId, updatedNote, userId }) => {
    io.emit('note-changed', { updatedNote, updatedBy: userId });
    console.log(`📝 Note ${noteId} updated by ${userId}`);
  });

  socket.on('note-deleted', ({ noteId, userId }) => {
    io.emit('note-removed', { noteId, deletedBy: userId });
    console.log(`🗑️ Note ${noteId} deleted by ${userId}`);
  });

  socket.on('note-shared', ({ noteId, sharedWithUserId }) => {
    io.emit('note-shared-update', { noteId, sharedWithUserId });
    console.log(`🔗 Note ${noteId} shared with user ${sharedWithUserId}`);
  });

  socket.on('disconnect', () => {
    console.log(`❌ User disconnected: ${socket.id}`);
    
    activeUsers.forEach((users, noteId) => {
      const userArray = Array.from(users);
      const disconnectedUser = userArray.find(u => u.socketId === socket.id);
      
      if (disconnectedUser) {
        const updatedUsers = userArray.filter(u => u.socketId !== socket.id);
        
        if (updatedUsers.length === 0) {
          activeUsers.delete(noteId);
        } else {
          activeUsers.set(noteId, new Set(updatedUsers));
        }
        
        socket.to(noteId).emit('user-left', { userId: disconnectedUser.userId });
      }
    });
  });
});

// Basic route to test server
app.get('/', (req, res) => {
  res.send('Server is running with Socket.IO real-time collaboration');
});

// Import models
const Note = require('./models/Note');
const User = require('./models/User');

// ===== USER ROUTES =====

// Register/Update user (call this when user logs in)
app.post('/api/users', async (req, res) => {
  try {
    const { userId, email } = req.body;
    
    const user = await User.findOneAndUpdate(
      { userId },
      { userId, email },
      { upsert: true, new: true }
    );
    
    res.json(user);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// Get user by email
app.get('/api/users/email/:email', async (req, res) => {
  try {
    const user = await User.findOne({ email: req.params.email });
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }
    res.json(user);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ===== NOTES CRUD ROUTES =====

// Create note
app.post('/api/notes', async (req, res) => {
  try {
    const noteData = {
      ...req.body,
      updatedAt: new Date()
    };
    
    const note = new Note(noteData);
    const savedNote = await note.save();
    
    res.status(201).json(savedNote);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// Get all notes for a user (including shared notes)
app.get('/api/notes', async (req, res) => {
  try {
    const userId = req.query.userId;
    
    // Find notes where user is owner OR note is shared with them
    const notes = await Note.find({
      $or: [
        { userId: userId },           // Notes they own
        { sharedWith: userId }        // Notes shared with them
      ]
    }).sort({ updatedAt: -1 });
    
    res.json(notes);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Update note by id
app.put('/api/notes/:id', async (req, res) => {
  try {
    const updateData = {
      ...req.body,
      updatedAt: new Date()
    };
    
    const updatedNote = await Note.findByIdAndUpdate(
      req.params.id,
      updateData,
      { new: true }
    );
    
    res.json(updatedNote);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// Delete note by id
app.delete('/api/notes/:id', async (req, res) => {
  try {
    await Note.findByIdAndDelete(req.params.id);
    res.json({ message: 'Note deleted' });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// Share note with another user
app.post('/api/notes/:id/share', async (req, res) => {
  try {
    const { shareWithEmail } = req.body;
    
    // Find user by email
    const userToShareWith = await User.findOne({ email: shareWithEmail });
    
    if (!userToShareWith) {
      return res.status(404).json({ error: 'User not found with that email' });
    }
    
    // Update note to include shared user
    const note = await Note.findByIdAndUpdate(
      req.params.id,
      { 
        $addToSet: { 
          sharedWith: userToShareWith.userId,
          sharedWithEmails: shareWithEmail 
        },
        isShared: true
      },
      { new: true }
    );
    
    if (!note) {
      return res.status(404).json({ error: 'Note not found' });
    }
    
    res.json({ 
      success: true, 
      note,
      message: `Note shared with ${shareWithEmail}` 
    });
  } catch (err) {
    console.error('Share error:', err);
    res.status(400).json({ error: err.message });
  }
});

// Unshare note
app.delete('/api/notes/:id/share/:email', async (req, res) => {
  try {
    const { email } = req.params;
    
    const userToUnshare = await User.findOne({ email });
    
    if (!userToUnshare) {
      return res.status(404).json({ error: 'User not found' });
    }
    
    const note = await Note.findByIdAndUpdate(
      req.params.id,
      { 
        $pull: { 
          sharedWith: userToUnshare.userId,
          sharedWithEmails: email 
        }
      },
      { new: true }
    );
    
    // If no one else is shared with, set isShared to false
    if (note.sharedWith.length === 0) {
      note.isShared = false;
      await note.save();
    }
    
    res.json({ success: true, note });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// ===== AI & IMAGE ROUTES =====

const aiRoutes = require('./api/aiRoutes');
app.use('/api/ai', aiRoutes);

const imageRoutes = require('./api/imageRoutes');
app.use('/api/images', imageRoutes);

// Start server with Socket.IO
server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
  console.log(`Socket.IO real-time collaboration enabled`);
  console.log(`Shared notes feature active`);
  console.log(`WebSocket server listening on ws://localhost:${PORT}`);
});
