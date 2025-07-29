require('dotenv').config();
const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');
const mongoose = require('mongoose');
const path = require('path');
const app = express();
const PORT = process.env.PORT || 5000;

// MongoDB Connection
mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/talimul_islam', {
  useNewUrlParser: true,
  useUnifiedTopology: true
})
.then(() => console.log('MongoDB connected successfully'))
.catch(err => console.error('MongoDB connection error:', err));

// Middleware
app.use(cors());
app.use(bodyParser.json());
app.use(express.static('public'));

// Payment Model
const Payment = mongoose.model('Payment', new mongoose.Schema({
  name: String,
  email: String,
  phone: String,
  paymentMethod: String,
  txnId: String,
  courseId: String,
  amount: Number,
  status: { type: String, default: 'pending' },
  date: { type: Date, default: Date.now }
}));

// Routes
// Get all pending payments
app.get('/api/admin/payments', async (req, res) => {
  try {
    const payments = await Payment.find({ status: 'pending' });
    res.json({ success: true, payments });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// Get single payment
app.get('/api/admin/payments/:id', async (req, res) => {
  try {
    const payment = await Payment.findById(req.params.id);
    if (!payment) {
      return res.status(404).json({ success: false, error: 'Payment not found' });
    }
    res.json({ success: true, payment });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// Update payment status
app.patch('/api/admin/payments/:id', async (req, res) => {
  try {
    const { status } = req.body;
    const payment = await Payment.findByIdAndUpdate(
      req.params.id,
      { status },
      { new: true }
    );
    res.json({ success: true, payment });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// Unlock course
app.post('/api/courses/unlock/:paymentId', async (req, res) => {
  try {
    // Here you would implement your course unlocking logic
    // For now, we'll just return success
    res.json({ 
      success: true, 
      message: 'Course unlocked successfully',
      paymentId: req.params.paymentId
    });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// Serve static files in production
if (process.env.NODE_ENV === 'production') {
  app.use(express.static(path.join(__dirname, 'public')));
  app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
  });
}

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ 
    success: false,
    error: 'Internal server error' 
  });
});

// Start server
app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});