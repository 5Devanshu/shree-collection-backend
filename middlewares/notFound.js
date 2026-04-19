/**
 * 404 Not Found Middleware
 * Handles requests to undefined routes
 */

const notFound = (req, res) => {
  res.status(404).json({
    success: false,
    message: `Route ${req.originalUrl} not found`,
  });
};

export default notFound;
