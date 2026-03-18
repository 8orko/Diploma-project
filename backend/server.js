// Import required packages
require('dotenv').config(); // Loads environment variables from a .env file into process.env
const express = require('express');
const cors = require('cors');
const { sequelize } = require('./models/index.js');

// Import route handlers
const authRoutes = require('./routes/authRoutes');
const timeBlockRoutes = require('./routes/timeBlockRoutes');
const taskRoutes = require('./routes/taskRoutes');

// --- Initialization ---
const app = express();
const PORT = process.env.PORT || 5000;

// --- Middleware ---
// Enable Cross-Origin Resource Sharing for all routes
app.use(cors());
// Parse incoming JSON requests and put the parsed data in req.body
app.use(express.json());

// --- API Routes ---
// Mount the authentication routes on the '/api/auth' path
app.use('/api/auth', authRoutes);

// Mount the time block routes on the '/api/time-blocks' path
app.use('/api/timeblocks', timeBlockRoutes);
// Mount the task routes on the '/api/tasks' path
app.use('/api/tasks', taskRoutes);

// A simple health check endpoint to confirm the server is running
app.get('/', (req, res) => {
  res.send('Time Blocking API server is running...');
});

// --- Server Startup ---
const startServer = async () => {
  try {
    // Sync all defined models to the DB.
    // { alter: true } updates the tables to match the models without dropping them.
    await sequelize.sync({ alter: true });
    console.log('Database connection has been established successfully.');

    // Start listening for incoming requests
    app.listen(PORT, () => {
      console.log(`Server is running on http://localhost:${PORT}`);
    });
  } catch (error) {
    console.error('Unable to connect to the database:', error);
  }
};

// Start the server
if (require.main === module) {
  startServer();
}

module.exports = app;
