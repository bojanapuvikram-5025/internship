const express = require('express');
const cors = require('cors');
const path = require('path');
const dotenv = require('dotenv');
const connectDB = require('./backend/config/db');

// Load environment variables
dotenv.config();

// Connect to Database
connectDB();

const app = express();

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Serve static assets from public directory
app.use(express.static(path.join(__dirname, 'public')));

// Serve uploaded files from MongoDB (with fallback to local directory)
const File = require('./backend/models/File');
app.get('/uploads/:filename', async (req, res, next) => {
  try {
    const file = await File.findOne({ filename: req.params.filename });
    if (file) {
      res.set('Content-Type', file.contentType);
      return res.send(file.data);
    }
    next();
  } catch (error) {
    next();
  }
});

// Serve uploaded files statically (fallback)
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Routes
app.use('/api/auth', require('./backend/routes/authRoutes'));
app.use('/api/profile', require('./backend/routes/profileRoutes'));
app.use('/api/jobs', require('./backend/routes/jobRoutes'));
app.use('/api/applications', require('./backend/routes/applicationRoutes'));
app.use('/api/notifications', require('./backend/routes/notificationRoutes'));

// Wildcard router to send user to landing or other pages if direct URL is hit
app.get('*', (req, res) => {
  // Direct direct requests of non-API routes to index.html to allow client side routing or simple page loading
  // Since we are using static page routing (index.html, login.html), if an unknown URL is hit, we redirect to home page.
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({
    success: false,
    message: err.message || 'Server Error'
  });
});

const PORT = process.env.PORT || 5000;
if (process.env.NODE_ENV !== 'production') {
  app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}
module.exports = app;
