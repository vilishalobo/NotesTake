const express = require('express');
const router = express.Router();
const multer = require('multer');
const { Readable } = require('stream');
const { getBucket, waitForGridFS } = require('../config/gridfsConfig');
const mongoose = require('mongoose');

// Configure multer for memory storage
const storage = multer.memoryStorage();
const upload = multer({
  storage: storage,
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB limit
  },
  fileFilter: (req, file, cb) => {
    // Only accept images
    if (file.mimetype.startsWith('image/')) {
      cb(null, true);
    } else {
      cb(new Error('Only image files are allowed!'), false);
    }
  },
});

// Upload image
router.post('/upload', upload.single('image'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No file uploaded' });
    }

    // Wait for GridFS to be ready
    await waitForGridFS();

    const bucket = getBucket();
    
    // Create a readable stream from buffer
    const readableStream = Readable.from(req.file.buffer);
    
    // Create upload stream
    const uploadStream = bucket.openUploadStream(req.file.originalname, {
      contentType: req.file.mimetype,
    });

    // Pipe the file buffer to GridFS
    readableStream.pipe(uploadStream);

    uploadStream.on('finish', () => {
      res.status(201).json({
        success: true,
        fileId: uploadStream.id.toString(),
        filename: req.file.originalname,
      });
    });

    uploadStream.on('error', (error) => {
      console.error('Upload error:', error);
      res.status(500).json({ error: 'Failed to upload image' });
    });
  } catch (error) {
    console.error('Upload error:', error);
    res.status(500).json({ error: error.message });
  }
});

// Get image
router.get('/:fileId', async (req, res) => {
  try {
    await waitForGridFS();
    
    const bucket = getBucket();
    const fileId = new mongoose.Types.ObjectId(req.params.fileId);

    // Find file info
    const files = await bucket.find({ _id: fileId }).toArray();
    
    if (!files || files.length === 0) {
      return res.status(404).json({ error: 'Image not found' });
    }

    const file = files[0];

    // Set response headers
    res.set('Content-Type', file.contentType);
    res.set('Content-Disposition', `inline; filename="${file.filename}"`);

    // Create download stream and pipe to response
    const downloadStream = bucket.openDownloadStream(fileId);
    downloadStream.pipe(res);

    downloadStream.on('error', (error) => {
      console.error('Download error:', error);
      res.status(500).json({ error: 'Failed to retrieve image' });
    });
  } catch (error) {
    console.error('Get image error:', error);
    res.status(500).json({ error: error.message });
  }
});

// Delete image
router.delete('/:fileId', async (req, res) => {
  try {
    await waitForGridFS();
    
    const bucket = getBucket();
    const fileId = new mongoose.Types.ObjectId(req.params.fileId);

    await bucket.delete(fileId);
    res.json({ success: true, message: 'Image deleted' });
  } catch (error) {
    console.error('Delete error:', error);
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
