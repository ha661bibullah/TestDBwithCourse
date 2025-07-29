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

// Models
const paymentSchema = new mongoose.Schema({
  name: String,
  email: String,
  phone: String,
  paymentMethod: String,
  txnId: String,
  courseId: String,
  amount: Number,
  currency: String,
  status: { type: String, default: 'pending' },
  date: { type: Date, default: Date.now }
});

const courseAccessSchema = new mongoose.Schema({
  paymentId: { type: mongoose.Schema.Types.ObjectId, ref: 'Payment' },
  userId: String, // Can be email or phone
  courseId: String,
  accessGranted: { type: Boolean, default: false },
  accessDate: { type: Date, default: Date.now }
});

const reviewSchema = new mongoose.Schema({
  paymentId: { type: mongoose.Schema.Types.ObjectId, ref: 'Payment' },
  courseId: String,
  rating: { type: Number, min: 1, max: 5 },
  text: String,
  date: { type: Date, default: Date.now }
});

const Payment = mongoose.model('Payment', paymentSchema);
const CourseAccess = mongoose.model('CourseAccess', courseAccessSchema);
const Review = mongoose.model('Review', reviewSchema);

// Routes

// Payment Routes
app.post('/api/payments', async (req, res) => {
  try {
    const { name, email, phone, paymentMethod, txnId, courseId, amount, currency } = req.body;
    
    const payment = new Payment({
      name,
      email,
      phone,
      paymentMethod,
      txnId,
      courseId,
      amount,
      currency
    });
    
    await payment.save();
    
    res.status(201).json({ 
      success: true, 
      message: 'Payment submitted successfully',
      paymentId: payment._id
    });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

app.get('/api/payments/status/:id', async (req, res) => {
  try {
    const payment = await Payment.findById(req.params.id);
    if (!payment) {
      return res.status(404).json({ success: false, error: 'Payment not found' });
    }
    res.json({ success: true, status: payment.status });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// Admin Payment Routes
app.get('/api/admin/payments', async (req, res) => {
  try {
    const { status } = req.query;
    const query = status ? { status } : {};
    const payments = await Payment.find(query).sort({ date: -1 });
    res.json({ success: true, payments });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

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

app.patch('/api/admin/payments/:id', async (req, res) => {
  try {
    const { status } = req.body;
    const payment = await Payment.findByIdAndUpdate(
      req.params.id,
      { status },
      { new: true }
    );
    
    if (!payment) {
      return res.status(404).json({ success: false, error: 'Payment not found' });
    }
    
    res.json({ success: true, payment });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// Course Access Routes
app.post('/api/courses/unlock/:paymentId', async (req, res) => {
  try {
    const payment = await Payment.findById(req.params.paymentId);
    if (!payment) {
      return res.status(404).json({ success: false, error: 'Payment not found' });
    }
    
    if (payment.status !== 'approved') {
      return res.status(400).json({ 
        success: false, 
        error: 'Payment not approved',
        currentStatus: payment.status
      });
    }
    
    const existingAccess = await CourseAccess.findOne({ paymentId: payment._id });
    if (existingAccess) {
      return res.json({ 
        success: true, 
        message: 'Course already unlocked',
        access: existingAccess
      });
    }
    
    const access = new CourseAccess({
      paymentId: payment._id,
      userId: payment.email || payment.phone,
      courseId: payment.courseId,
      accessGranted: true
    });
    
    await access.save();
    
    res.status(201).json({ 
      success: true, 
      message: 'Course unlocked successfully',
      access
    });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

app.get('/api/courses/check-access/:paymentId', async (req, res) => {
  try {
    const access = await CourseAccess.findOne({ paymentId: req.params.paymentId });
    if (!access) {
      return res.json({ success: true, hasAccess: false });
    }
    res.json({ success: true, hasAccess: access.accessGranted, access });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// Review Routes
app.post('/api/reviews', async (req, res) => {
  try {
    const { paymentId, courseId, rating, text } = req.body;
    
    const payment = await Payment.findById(paymentId);
    if (!payment || payment.status !== 'approved') {
      return res.status(400).json({ success: false, error: 'Invalid or unapproved payment' });
    }
    
    const access = await CourseAccess.findOne({ paymentId });
    if (!access || !access.accessGranted) {
      return res.status(403).json({ success: false, error: 'No access to this course' });
    }
    
    const review = new Review({
      paymentId,
      courseId,
      rating,
      text
    });
    
    await review.save();
    
    res.status(201).json({ 
      success: true, 
      message: 'Review submitted successfully',
      review
    });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

app.get('/api/courses/:id/reviews', async (req, res) => {
  try {
    const reviews = await Review.find({ courseId: req.params.id })
      .populate('paymentId', 'name date')
      .sort({ date: -1 });
    
    res.json({ success: true, reviews });
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