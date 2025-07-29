require('dotenv').config();
const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');
const mongoose = require('mongoose');
const path = require('path'); // Added path module
const app = express();
const PORT = process.env.PORT || 5000;

// MongoDB Connection (updated to remove deprecated options)
mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/talimul_islam')
.then(() => console.log('MongoDB connected successfully'))
.catch(err => console.error('MongoDB connection error:', err));

// Middleware
app.use(cors());
app.use(bodyParser.json());
app.use(express.static('public'));

// Routes
const paymentRoutes = require('./routes/payments');
const reviewRoutes = require('./routes/reviews');
app.use('/api/payments', paymentRoutes);
app.use('/api/reviews', reviewRoutes);
app.use('/api/admin/payments', paymentRoutes);
app.use('/api/admin/reviews', reviewRoutes);

// Serve frontend files
if (process.env.NODE_ENV === 'production') {
  // Serve static files from frontend directory
  app.use(express.static(path.join(__dirname, '../frontend')));
  
  // Handle SPA by redirecting all requests to index.html
  app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, '../frontend', 'CourseDetails.html'));
  });
}

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ 
    success: false,
    error: 'Something broke!' 
  });
});

// Start server
app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});