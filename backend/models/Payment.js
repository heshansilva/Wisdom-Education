import mongoose from 'mongoose';

const paymentSchema = mongoose.Schema(
  {
    // Link to the student who made the payment
    student: {
      type: mongoose.Schema.Types.ObjectId,
      required: true,
      ref: 'User',
    },
    // Link to the teacher who received the payment
    teacher: {
      type: mongoose.Schema.Types.ObjectId,
      required: true,
      ref: 'User',
    },
    // Link to the class this payment is for
    class: {
      type: mongoose.Schema.Types.ObjectId,
      required: true,
      ref: 'Class',
    },
    amount: {
      type: Number,
      required: true,
    },
    // We'll store the month/year the fee is FOR, not just when it was paid
    feeMonth: {
      type: String, 
      required: true,
    },
    feeYear: {
      type: Number, 
      required: true,
    },
    paymentDate: { // The date the payment was actually received
      type: Date,
      default: Date.now,
    },
  },
  {
    timestamps: true, // Records when this entry was created/updated
  }
);

const Payment = mongoose.model('Payment', paymentSchema);

export default Payment;
