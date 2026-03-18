const mongoose = require('mongoose');
const { GridFSBucket } = require('mongodb');

let bucket;
let isInitialized = false;

const initGridFS = () => {
  return new Promise((resolve, reject) => {
    const conn = mongoose.connection;
    
    if (conn.readyState === 1) {
      // Already connected
      bucket = new GridFSBucket(conn.db, {
        bucketName: 'uploads'
      });
      isInitialized = true;
      console.log('GridFS initialized');
      resolve();
    } else {
      // Wait for connection
      conn.once('open', () => {
        bucket = new GridFSBucket(conn.db, {
          bucketName: 'uploads'
        });
        isInitialized = true;
        console.log('GridFS initialized');
        resolve();
      });

      conn.once('error', (error) => {
        reject(error);
      });
    }
  });
};

const getBucket = () => {
  if (!isInitialized || !bucket) {
    throw new Error('GridFS not initialized. Please wait for MongoDB connection.');
  }
  return bucket;
};

const waitForGridFS = async () => {
  // Wait up to 5 seconds for GridFS to initialize
  let attempts = 0;
  while (!isInitialized && attempts < 50) {
    await new Promise(resolve => setTimeout(resolve, 100));
    attempts++;
  }
  
  if (!isInitialized) {
    throw new Error('GridFS initialization timeout');
  }
};

module.exports = { initGridFS, getBucket, waitForGridFS };
