import { DataTypes } from 'sequelize';
import sequelize from '../../config/db.js';

// Tracks every uploaded image in the Media Library
// Maps to AdminPanel.jsx sidebar → "Media Library" nav item
const Media = sequelize.define(
  'Media',
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },

    // Original filename from the admin's machine
    originalName: {
      type: DataTypes.STRING,
      allowNull: false,
      defaultValue: '',
    },

    // Railway Bucket S3 key — used for deletion
    // e.g. "product/uuid.jpg"
    s3Key: {
      type: DataTypes.STRING,
      allowNull: false,
      unique: true,
    },

    // Full public URL — served in ProductCard, ProductDescription,
    // FeaturedGrid, AdminProducts thumbnail, Hero
    url: {
      type: DataTypes.STRING,
      allowNull: false,
    },

    // secureUrl kept for API compatibility — same as url (Railway is HTTPS)
    secureUrl: {
      type: DataTypes.STRING,
      allowNull: false,
    },

    // Image dimensions
    width:  { type: DataTypes.INTEGER, allowNull: true },
    height: { type: DataTypes.INTEGER, allowNull: true },

    // File metadata
    format:   { type: DataTypes.STRING, allowNull: true },   // 'jpg', 'png', 'webp'
    bytes:    { type: DataTypes.INTEGER, allowNull: true },
    mimeType: { type: DataTypes.STRING, allowNull: true },

    // Organisational tag — filters in Media Library
    folder: {
      type: DataTypes.ENUM('product', 'hero', 'category', 'general'),
      defaultValue: 'general',
    },

    // Optional alt text for accessibility
    altText: {
      type: DataTypes.STRING,
      defaultValue: '',
    },

    // Which product this image is attached to (UUID FK — nullable)
    attachedProductId: {
      type: DataTypes.UUID,
      allowNull: true,
      defaultValue: null,
    },

    // Which admin uploaded it (UUID FK — nullable)
    uploadedById: {
      type: DataTypes.UUID,
      allowNull: true,
      defaultValue: null,
    },
  },
  {
    tableName: 'media',
    timestamps: true,
    indexes: [
      { fields: ['folder', 'createdAt'] },
    ],
  }
);

export default Media;