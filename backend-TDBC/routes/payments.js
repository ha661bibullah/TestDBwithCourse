// routes/payments.js
const express = require('express');
const router = express.Router();
const Payment = require('../models/Payment');

// Submit payment
router.post('/', async (req, res) => {
  try {
    const requiredFields = ['name', 'email', 'phone', 'paymentMethod', 'txnId', 'courseId'];
    const missingFields = requiredFields.filter(field => !req.body[field]);
    
    if (missingFields.length > 0) {
      return res.status(400).json({ 
        error: 'Missing required fields',
        missingFields 
      });
    }

    const newPayment = new Payment(req.body);
    await newPayment.save();
    
    res.status(201).json({ 
      success: true,
      paymentId: newPayment._id,
      payment: newPayment
    });
  } catch (error) {
    res.status(500).json({ 
      error: 'Internal server error',
      details: error.message 
    });
  }
});

// Check payment status
router.get('/status/:id', async (req, res) => {
  try {
    const payment = await Payment.findById(req.params.id);
    if (payment) {
      res.json({
        status: payment.status,
        courseId: payment.courseId,
        paymentId: payment._id,
        amount: payment.amount
      });
    } else {
      res.status(404).json({ 
        status: 'not_found',
        message: 'Payment not found' 
      });
    }
  } catch (error) {
    res.status(500).json({ 
      error: 'Internal server error',
      details: error.message 
    });
  }
});

// Admin: Get all payments
router.get('/', async (req, res) => {
  try {
    const { status } = req.query;
    let query = {};
    
    if (status) {
      query.status = status;
    }
    
    const payments = await Payment.find(query).sort({ createdAt: -1 });
    
    res.json({ 
      success: true,
      count: payments.length,
      payments 
    });
  } catch (error) {
    res.status(500).json({ 
      success: false,
      error: 'Internal server error' 
    });
  }
});

// Admin: Get single payment
router.get('/:id', async (req, res) => {
  try {
    const payment = await Payment.findById(req.params.id);
    if (payment) {
      res.json({ 
        success: true,
        payment 
      });
    } else {
      res.status(404).json({ 
        success: false,
        error: 'Payment not found' 
      });
    }
  } catch (error) {
    res.status(500).json({ 
      success: false,
      error: 'Internal server error' 
    });
  }
});

// Admin: Update payment status
router.patch('/:id', async (req, res) => {
  try {
    const { status } = req.body;
    const payment = await Payment.findById(req.params.id);
    
    if (!payment) {
      return res.status(404).json({ 
        success: false,
        error: 'Payment not found' 
      });
    }

    if (!status || !['pending', 'approved', 'rejected'].includes(status)) {
      return res.status(400).json({ 
        success: false,
        error: 'Invalid status value' 
      });
    }

    payment.status = status;
    await payment.save();
    
    res.json({ 
      success: true,
      payment 
    });
  } catch (error) {
    res.status(500).json({ 
      success: false,
      error: 'Internal server error' 
    });
  }
});

// Unlock course
router.post('/unlock/:paymentId', async (req, res) => {
  try {
    const payment = await Payment.findById(req.params.paymentId);
    
    if (!payment) {
      return res.status(404).json({ 
        success: false,
        error: 'Payment not found' 
      });
    }

    if (payment.status !== 'approved') {
      return res.status(400).json({ 
        success: false,
        error: 'Payment not approved' 
      });
    }

    payment.processed = true;
    payment.unlockedAt = new Date();
    await payment.save();
    
    res.json({ 
      success: true,
      message: 'Course unlocked successfully',
      courseId: payment.courseId,
      paymentId: payment._id,
      unlockedAt: payment.unlockedAt
    });
  } catch (error) {
    res.status(500).json({ 
      success: false,
      error: 'Internal server error' 
    });
  }
});

module.exports = router;