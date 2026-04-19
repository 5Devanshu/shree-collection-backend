const cloudinary = require('../config/cloudinary');

// ── Helper — upload buffer directly to Cloudinary ─────────────────────────────
const uploadBufferToCloudinary = (buffer, mimetype) => {
  return new Promise((resolve, reject) => {
    const stream = cloudinary.uploader.upload_stream(
      {
        folder:   'shree_collection',
        resource_type: 'image',
        transformation: [
          {
            width:        1200,
            height:       1200,
            crop:         'limit',
            quality:      'auto',
            fetch_format: 'auto',
          },
        ],
        public_id: `img_${Date.now()}`,
      },
      (error, result) => {
        if (error) return reject(error);
        resolve(result);
      }
    );
    stream.end(buffer);
  });
};

// ── @desc    Upload single image
// ── @route   POST /api/upload
// ── @access  Admin only
const uploadImage = async (req, res, next) => {
  try {
    console.log('Upload route hit');

    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: 'No file uploaded',
      });
    }

    console.log('File received:', req.file.originalname, req.file.mimetype);

    const result = await uploadBufferToCloudinary(
      req.file.buffer,
      req.file.mimetype
    );

    console.log('Cloudinary upload success:', result.secure_url);

    res.status(200).json({
      success:   true,
      message:   'Image uploaded successfully',
      url:       result.secure_url,
      public_id: result.public_id,
    });
  } catch (err) {
    console.error('Upload error:', err.message);
    next(err);
  }
};

// ── @desc    Upload multiple images (max 5)
// ── @route   POST /api/upload/multiple
// ── @access  Admin only
const uploadMultipleImages = async (req, res, next) => {
  try {
    if (!req.files || req.files.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'No files uploaded',
      });
    }

    const uploads = await Promise.all(
      req.files.map(file =>
        uploadBufferToCloudinary(file.buffer, file.mimetype)
      )
    );

    const data = uploads.map(result => ({
      url:       result.secure_url,
      public_id: result.public_id,
    }));

    res.status(200).json({
      success: true,
      message: `${data.length} image${data.length > 1 ? 's' : ''} uploaded successfully`,
      data,
    });
  } catch (err) {
    console.error('Multi-upload error:', err.message);
    next(err);
  }
};

// ── @desc    Delete image from Cloudinary
// ── @route   DELETE /api/upload/:public_id
// ── @access  Admin only
const deleteImage = async (req, res, next) => {
  try {
    const public_id = decodeURIComponent(req.params.public_id);
    const result    = await cloudinary.uploader.destroy(public_id);

    if (result.result !== 'ok') {
      return res.status(400).json({
        success: false,
        message: 'Could not delete image — it may have already been removed',
      });
    }

    res.status(200).json({
      success: true,
      message: 'Image deleted from Cloudinary successfully',
    });
  } catch (err) {
    next(err);
  }
};

module.exports = { uploadImage, uploadMultipleImages, deleteImage };