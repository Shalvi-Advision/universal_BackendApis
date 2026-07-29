const razorpayService = require('../utils/razorpayService');

/**
 * @desc    Create Razorpay order
 * @route   POST /api/razorpay/order
 * @access  Private
 */
const createOrder = async (req, res, next) => {
  try {
    const { amount, currency = 'INR', receipt, notes } = req.body;

    // Validate amount
    if (!amount || Number.isNaN(Number(amount)) || Number(amount) <= 0) {
      return res.status(400).json({
        success: false,
        message: 'Invalid amount provided',
      });
    }

    const options = {
      amount: Math.round(Number(amount) * 100), // paise; round to avoid float drift
      currency,
      receipt: receipt || `rcpt_${Date.now()}`,
      notes: notes || {},
    };

    // Built from the tenant's own key pair, not a shared module-level client.
    const order = await razorpayService.createOrder(options, req.tenant?.project);

    res.status(200).json({
      success: true,
      id: order.id,
      amount: order.amount,
      currency: order.currency,
      receipt: order.receipt,
    });
  } catch (error) {
    console.error('Razorpay order creation error:', error);
    next(error);
  }
};

/**
 * @desc    Verify Razorpay payment signature
 * @route   POST /api/razorpay/verify
 * @access  Private
 *
 * Note: this endpoint only reports whether a signature is authentic. It does
 * NOT mark any order paid — order placement re-verifies the signature itself
 * (see utils/orderService.js), so a client cannot get an order marked paid by
 * calling this and then claiming success.
 */
const verifyPayment = async (req, res, next) => {
  try {
    const { razorpay_order_id, razorpay_payment_id, razorpay_signature } = req.body;

    if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature) {
      return res.status(400).json({
        success: false,
        status: 'failure',
        message: 'Missing required payment verification fields',
      });
    }

    const isAuthentic = await razorpayService.verifySignature(
      { razorpay_order_id, razorpay_payment_id, razorpay_signature },
      req.tenant?.project
    );

    if (!isAuthentic) {
      return res.status(400).json({
        success: false,
        status: 'failure',
        message: 'Payment verification failed',
      });
    }

    // Confirm the gateway's own view of the payment.
    try {
      const payment = await razorpayService.fetchPayment(
        razorpay_payment_id,
        req.tenant?.project
      );

      return res.status(200).json({
        success: true,
        status: 'success',
        message: 'Payment verified successfully',
        paymentDetails: {
          paymentId: payment.id,
          orderId: payment.order_id,
          amount: payment.amount,
          currency: payment.currency,
          status: payment.status,
          method: payment.method,
          captured: payment.captured,
        },
      });
    } catch (fetchError) {
      console.error('Error fetching payment details:', fetchError);
      // Signature was valid even if the lookup failed.
      return res.status(200).json({
        success: true,
        status: 'success',
        message: 'Payment verified successfully',
      });
    }
  } catch (error) {
    console.error('Payment verification error:', error);
    next(error);
  }
};

module.exports = {
  createOrder,
  verifyPayment,
};
