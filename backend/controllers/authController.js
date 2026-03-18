const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { User } = require('../models');

/**
 * Handles new user registration.
 */
const register = async (req, res) => {
  try {
    const { username, email, password, firstName, lastName } = req.body;

    // Basic input validation
    if (!username || !email || !password) {
      return res.status(400).json({ message: 'Please provide username, email, and password.' });
    }

    // Check if a user with the given email already exists
    const existingUser = await User.findOne({ where: { email } });
    if (existingUser) {
      return res.status(409).json({ message: 'A user with this email already exists.' });
    }

    // Hash the password before storing it
    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(password, salt);

    // Create the new user in the database
    const newUser = await User.create({
      username,
      email,
      passwordHash,
      firstName,
      lastName,
    });

    // Create a JWT payload
    const payload = {
      id: newUser.id,
      username: newUser.username,
    };

    // Sign the JWT
    const token = jwt.sign(payload, process.env.JWT_SECRET, {
      expiresIn: '1d',
    });

    // Respond with success message and token
    res.status(201).json({
      message: 'User registered successfully.',
      userId: newUser.id,
      token,
    });
  } catch (error) {
    console.error('Registration error:', error);
    if (error.name === 'SequelizeDatabaseError') {
      return res.status(500).json({ message: 'Database schema mismatch. Please delete your database.sqlite file and restart the server.' });
    }
    res.status(500).json({ message: 'An error occurred during registration.' });
  }
};

/**
 * Handles user login.
 */
const login = async (req, res) => {
  if (!process.env.JWT_SECRET) {
    throw new Error('FATAL ERROR: JWT_SECRET is not defined.');
  }
  try {
    const { email, password } = req.body;

    // Basic input validation
    if (!email || !password) {
      return res.status(400).json({ message: 'Please provide both email and password.' });
    }

    // Find the user by email
    const user = await User.findOne({ where: { email } });
    if (!user) {
      return res.status(401).json({ message: 'Invalid email or password.' });
    }

    // Compare the provided password with the stored hash
    const isMatch = await bcrypt.compare(password, user.passwordHash);
    if (!isMatch) {
      return res.status(401).json({ message: 'Invalid email or password.' });
    }

    // Create a JWT payload
    const payload = {
      id: user.id,
      username: user.username,
    };

    // Sign the JWT
    const token = jwt.sign(payload, process.env.JWT_SECRET, {
      expiresIn: '1d',
    });

    // Respond with the token and user info
    res.json({
      token,
      user: {
        id: user.id,
        username: user.username,
        email: user.email,
        createdAt: user.createdAt,
        updatedAt: user.updatedAt,
      },
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ message: 'An error occurred during login.' });
  }
};

/**
 * Gets the profile of the currently authenticated user.
 */
const getProfile = async (req, res) => {
  try {
    const user = await User.findByPk(req.user.id, {
      attributes: { exclude: ['passwordHash'] },
    });

    if (!user) {
      return res.status(404).json({ message: 'User not found.' });
    }

    res.json({
      id: user.id,
      username: user.username,
      email: user.email,
      firstName: user.firstName,
      lastName: user.lastName,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt,
    });
  } catch (error) {
    console.error('Get profile error:', error);
    res.status(500).json({ message: 'An error occurred while fetching the profile.' });
  }
};

/**
 * Updates the profile of the currently authenticated user.
 */
const updateProfile = async (req, res) => {
  try {
    const { username, email, firstName, lastName, password } = req.body;
    const user = await User.findByPk(req.user.id);

    if (!user) {
      return res.status(404).json({ message: 'User not found.' });
    }

    // Update user fields
    user.username = username || user.username;
    user.email = email || user.email;
    user.firstName = firstName || user.firstName;
    user.lastName = lastName || user.lastName;

    if (password) {
      const salt = await bcrypt.genSalt(10);
      user.passwordHash = await bcrypt.hash(password, salt);
    }

    await user.save();

    res.json({
      message: 'Profile updated successfully.',
      user: {
        id: user.id,
        username: user.username,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        createdAt: user.createdAt,
        updatedAt: user.updatedAt,
      },
    });
  } catch (error) {
    console.error('Update profile error:', error);
    // Handle potential unique constraint errors (e.g., email already exists)
    if (error.name === 'SequelizeUniqueConstraintError') {
      return res.status(409).json({ message: 'Email or username already in use.' });
    }
    res.status(500).json({ message: 'An error occurred while updating the profile.' });
  }
};


module.exports = { register, login, getProfile, updateProfile };
