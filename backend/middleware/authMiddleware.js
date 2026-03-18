const jwt = require('jsonwebtoken');
const { User } = require('../models');

/**
 * Middleware to verify JWT tokens.
 * It checks for a token in the 'Authorization' header, verifies it, and attaches the
 * decoded user payload to the request object (`req.user`).
 */
const protect = (req, res, next) => {
  // Get the token from the Authorization header (format: "Bearer <token>")
  const authHeader = req.header('Authorization');
  
  if (!authHeader) {
    return res.status(401).json({ message: 'Access denied. No token provided.' });
  }

  const tokenParts = authHeader.split(' ');
  if (tokenParts.length !== 2 || tokenParts[0] !== 'Bearer') {
    return res.status(401).json({ message: 'Access denied. Token is not in the correct format.' });
  }
  
  const token = tokenParts[1];

  try {
    // Verify the token using the secret key
    const decodedPayload = jwt.verify(token, process.env.JWT_SECRET || 'your_super_secret_key_for_development');
    
    // Attach the decoded user information (e.g., id, username) to the request object
    req.user = decodedPayload;
    
    // Proceed to the next middleware or route handler
    next();
  } catch (error) {
    // If the token is invalid (e.g., expired, malformed)
    res.status(401).json({ message: 'Access denied. Invalid token.' });
  }
};

module.exports = { protect };
