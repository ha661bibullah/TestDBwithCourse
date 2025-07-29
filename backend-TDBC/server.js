require('dotenv').config();
const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');
const mongoose = require('mongoose');
const path = require('path'); // ✅ path module যুক্ত করা হলো

const app = express();
const PORT = process.env.PORT || 5000;

// ✅ MongoDB Connection
mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/talimul_islam', {
  useNewUrlParser: true,
  useUnifiedTopology: true
})
.then(() => console.log('MongoDB connected successfully'))
.catch(err => console.error('MongoDB connection error:', err));

// ✅ Middleware
app.use(cors());
app.use(bodyParser.json());
app.use(express.static('public'));

// ✅ Routes
const paymentRoutes = require('./routes/payments');
const reviewRoutes = require('./routes/reviews');

app.use('/api/payments', paymentRoutes);
app.use('/api/reviews', reviewRoutes);
app.use('/api/admin/payments', paymentRoutes);
app.use('/api/admin/reviews', reviewRoutes);

// ✅ Serve frontend files in production
if (process.env.NODE_ENV === 'production') {
  // 'frontend-TDBC' ফোল্ডারটি উপরের স্তরে রয়েছে, তাই '..' ব্যবহার করে যেতে হবে
  app.use(express.static(path.join(__dirname, '..', 'frontend-TDBC')));

  app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, '..', 'frontend-TDBC', 'CourseDetails.html'));
  });
}

// ✅ Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ 
    success: false,
    error: 'Something broke!' 
  });
});

// ✅ Start server
app.listen(PORT, () => {
  console.log(`🚀 Server running on http://localhost:${PORT}`);
});
