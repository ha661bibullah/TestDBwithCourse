const express = require('express');
const router = express.Router();
const Review = require('../models/Review');
const Payment = require('../models/Payment');

// Submit review
router.post('/', async (req, res) => {
  try {
    const { paymentId, rating, text, courseId } = req.body;
    
    if (!paymentId || !rating || !courseId) {
      return res.status(400).json({ 
        success: false,
        error: 'Missing required fields' 
      });
    }

    // Verify payment is approved
    const payment = await Payment.findById(paymentId);
    if (!payment || payment.status !== 'approved') {
      return res.status(400).json({ 
        success: false,
        error: 'Payment not approved' 
      });
    }

    const newReview = new Review({
      paymentId,
      name: payment.name,
      email: payment.email,
      rating: parseInt(rating),
      comment: text || '',
      courseId
    });

    await newReview.save();
    
    res.status(201).json({ 
      success: true,
      message: 'Review submitted successfully',
      reviewId: newReview._id
    });
  } catch (error) {
    res.status(500).json({ 
      success: false,
      error: 'Internal server error' 
    });
  }
});

// Admin: Get all reviews
router.get('/', async (req, res) => {
  try {
    const { status } = req.query;
    let query = {};
    
    if (status) {
      query.status = status;
    }
    
    const reviews = await Review.find(query).sort({ createdAt: -1 });
    
    res.json({ 
      success: true,
      count: reviews.length,
      reviews 
    });
  } catch (error) {
    res.status(500).json({ 
      success: false,
      error: 'Internal server error' 
    });
  }
});

module.exports = router;