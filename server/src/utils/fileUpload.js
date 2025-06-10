// server/src/utils/fileUpload.js
const path = require('path');
const fs = require('fs').promises;
const logger = require('./logger');

/**
 * Upload file to specified directory
 */
const uploadFile = async (file, directory = 'uploads') => {
  try {
    if (!file) {
      throw new Error('No file provided');
    }

    // Create upload directory if it doesn't exist
    const uploadDir = path.join(process.cwd(), 'uploads', directory);
    await fs.mkdir(uploadDir, { recursive: true });

    // Generate unique filename
    const timestamp = Date.now();
    const ext = path.extname(file.originalname);
    const filename = `${timestamp}-${Math.random().toString(36).substr(2, 9)}${ext}`;
    const filePath = path.join(uploadDir, filename);

    // Save file
    await fs.writeFile(filePath, file.buffer);

    // Return relative URL
    const relativeUrl = `/uploads/${directory}/${filename}`;
    
    logger.info('File uploaded successfully', {
      originalName: file.originalname,
      filename,
      size: file.size,
      directory
    });

    return relativeUrl;

  } catch (error) {
    logger.error('File upload error', { error: error.message });
    throw error;
  }
};

/**
 * Delete file from filesystem
 */
const deleteFile = async (filePath) => {
  try {
    if (!filePath) {
      return false;
    }

    // Convert relative URL to absolute path
    let absolutePath;
    if (filePath.startsWith('/uploads/')) {
      absolutePath = path.join(process.cwd(), filePath);
    } else {
      absolutePath = filePath;
    }

    // Check if file exists
    try {
      await fs.access(absolutePath);
    } catch (error) {
      logger.warn('File not found for deletion', { filePath: absolutePath });
      return false;
    }

    // Delete file
    await fs.unlink(absolutePath);
    
    logger.info('File deleted successfully', { filePath: absolutePath });
    return true;

  } catch (error) {
    logger.error('File deletion error', { 
      error: error.message, 
      filePath 
    });
    return false;
  }
};

/**
 * Get file info
 */
const getFileInfo = async (filePath) => {
  try {
    if (!filePath) {
      return null;
    }

    let absolutePath;
    if (filePath.startsWith('/uploads/')) {
      absolutePath = path.join(process.cwd(), filePath);
    } else {
      absolutePath = filePath;
    }

    const stats = await fs.stat(absolutePath);
    
    return {
      size: stats.size,
      created: stats.birthtime,
      modified: stats.mtime,
      isFile: stats.isFile(),
      isDirectory: stats.isDirectory()
    };

  } catch (error) {
    logger.error('Error getting file info', { 
      error: error.message, 
      filePath 
    });
    return null;
  }
};

/**
 * Validate file type
 */
const validateFileType = (file, allowedTypes = []) => {
  if (!file || !file.mimetype) {
    return false;
  }

  if (allowedTypes.length === 0) {
    return true; // No restrictions
  }

  return allowedTypes.includes(file.mimetype);
};

/**
 * Validate file size
 */
const validateFileSize = (file, maxSize = 5 * 1024 * 1024) => { // 5MB default
  if (!file || !file.size) {
    return false;
  }

  return file.size <= maxSize;
};

module.exports = {
  uploadFile,
  deleteFile,
  getFileInfo,
  validateFileType,
  validateFileSize
};