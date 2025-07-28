const mongoose = require('mongoose');

const PaymentSchema = new mongoose.Schema({
  name: { type: String, required: true },
  email: { type: String, required: true },
  phone: { type: String, required: true },
  paymentMethod: { type: String, required: true },
  txnId: { type: String, required: true },
  courseId: { type: String, required: true },
  amount: { type: Number, required: true, default: 1500 },
  currency: { type: String, default: 'BDT' },
  status: { type: String, enum: ['pending', 'approved', 'rejected'], default: 'pending' },
  processed: { type: Boolean, default: false },
  unlockedAt: { type: Date }
}, { timestamps: true });

module.exports = mongoose.model('Payment', PaymentSchema);