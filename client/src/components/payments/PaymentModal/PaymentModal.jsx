import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import useUserStore from '../../../store/userStore';
import useAuthStore from '../../../store/authStore';
import './PaymentModal.css';

const PaymentModal = ({ 
  isOpen, 
  onClose, 
  plan = 'premium',
  onSuccess,
  onError 
}) => {
  const { user } = useAuthStore();
  const { updateSubscription } = useUserStore();
  
  const [step, setStep] = useState('plan'); // plan, payment, processing, success, error
  const [selectedPlan, setSelectedPlan] = useState(plan);
  const [paymentMethod, setPaymentMethod] = useState('card');
  const [formData, setFormData] = useState({
    cardNumber: '',
    expiryDate: '',
    cvv: '',
    name: '',
    email: user?.email || '',
    billingAddress: {
      line1: '',
      city: '',
      state: '',
      zip: '',
      country: 'US'
    }
  });
  const [errors, setErrors] = useState({});
  const [isProcessing, setIsProcessing] = useState(false);

  const plans = {
    basic: {
      name: 'Basic',
      price: 9.99,
      period: 'month',
      features: [
        'Up to 5 readings per day',
        'Basic card spreads',
        'Reading history',
        'Email support'
      ],
      popular: false
    },
    premium: {
      name: 'Premium',
      price: 19.99,
      period: 'month',
      features: [
        'Unlimited readings',
        'All card spreads',
        'Advanced interpretations',
        'Personal reading journal',
        'Priority support',
        'Offline access'
      ],
      popular: true
    },
    yearly: {
      name: 'Premium Yearly',
      price: 199.99,
      period: 'year',
      features: [
        'Everything in Premium',
        '2 months free',
        'Exclusive spreads',
        'Personal astrologer consultation',
        'Custom card designs'
      ],
      popular: false,
      discount: '17% off'
    }
  };

  useEffect(() => {
    if (isOpen) {
      setStep('plan');
      setErrors({});
    }
  }, [isOpen]);

  const handleInputChange = (field, value) => {
    if (field.includes('.')) {
      const [parent, child] = field.split('.');
      setFormData(prev => ({
        ...prev,
        [parent]: {
          ...prev[parent],
          [child]: value
        }
      }));
    } else {
      setFormData(prev => ({
        ...prev,
        [field]: value
      }));
    }
    
    // Clear error when user starts typing
    if (errors[field]) {
      setErrors(prev => ({
        ...prev,
        [field]: null
      }));
    }
  };

  const validateForm = () => {
    const newErrors = {};

    if (!formData.name.trim()) {
      newErrors.name = 'Name is required';
    }

    if (!formData.email.trim()) {
      newErrors.email = 'Email is required';
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = 'Email is invalid';
    }

    if (paymentMethod === 'card') {
      if (!formData.cardNumber.replace(/\s/g, '')) {
        newErrors.cardNumber = 'Card number is required';
      } else if (formData.cardNumber.replace(/\s/g, '').length < 13) {
        newErrors.cardNumber = 'Card number is invalid';
      }

      if (!formData.expiryDate) {
        newErrors.expiryDate = 'Expiry date is required';
      } else if (!/^\d{2}\/\d{2}$/.test(formData.expiryDate)) {
        newErrors.expiryDate = 'Invalid format (MM/YY)';
      }

      if (!formData.cvv) {
        newErrors.cvv = 'CVV is required';
      } else if (formData.cvv.length < 3) {
        newErrors.cvv = 'CVV is invalid';
      }
    }

    if (!formData.billingAddress.line1.trim()) {
      newErrors['billingAddress.line1'] = 'Address is required';
    }

    if (!formData.billingAddress.city.trim()) {
      newErrors['billingAddress.city'] = 'City is required';
    }

    if (!formData.billingAddress.zip.trim()) {
      newErrors['billingAddress.zip'] = 'ZIP code is required';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const formatCardNumber = (value) => {
    const v = value.replace(/\s+/g, '').replace(/[^0-9]/gi, '');
    const matches = v.match(/\d{4,16}/g);
    const match = matches && matches[0] || '';
    const parts = [];

    for (let i = 0, len = match.length; i < len; i += 4) {
      parts.push(match.substring(i, i + 4));
    }

    if (parts.length) {
      return parts.join(' ');
    } else {
      return v;
    }
  };

  const formatExpiryDate = (value) => {
    const v = value.replace(/\s+/g, '').replace(/[^0-9]/gi, '');
    
    if (v.length >= 2) {
      return v.substring(0, 2) + '/' + v.substring(2, 4);
    }
    
    return v;
  };

  const handlePayment = async () => {
    if (!validateForm()) return;

    setIsProcessing(true);
    setStep('processing');

    try {
      // Simulate payment processing
      await new Promise(resolve => setTimeout(resolve, 3000));

      // In a real app, this would integrate with Stripe, PayPal, etc.
      const paymentResult = await processPayment({
        plan: selectedPlan,
        amount: plans[selectedPlan].price,
        paymentMethod,
        formData
      });

      if (paymentResult.success) {
        // Update user subscription
        const newSubscription = {
          type: selectedPlan,
          expiresAt: new Date(Date.now() + (selectedPlan === 'yearly' ? 365 : 30) * 24 * 60 * 60 * 1000),
          features: plans[selectedPlan].features
        };

        updateSubscription(newSubscription);
        setStep('success');
        onSuccess?.(newSubscription);
      } else {
        throw new Error(paymentResult.error || 'Payment failed');
      }
    } catch (error) {
      setStep('error');
      onError?.(error.message);
    } finally {
      setIsProcessing(false);
    }
  };

  const processPayment = async (paymentData) => {
    // Mock payment processing - replace with real payment gateway
    console.log('Processing payment:', paymentData);
    
    // Simulate random success/failure for demo
    if (Math.random() > 0.1) {
      return { success: true, transactionId: 'txn_' + Date.now() };
    } else {
      return { success: false, error: 'Payment was declined' };
    }
  };

  const modalVariants = {
    hidden: { opacity: 0, scale: 0.8 },
    visible: { opacity: 1, scale: 1 },
    exit: { opacity: 0, scale: 0.8 }
  };

  const stepVariants = {
    hidden: { opacity: 0, x: 20 },
    visible: { opacity: 1, x: 0 },
    exit: { opacity: 0, x: -20 }
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <motion.div
        className="payment-modal-overlay"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
      >
        <motion.div
          className="payment-modal"
          variants={modalVariants}
          initial="hidden"
          animate="visible"
          exit="exit"
          onClick={e => e.stopPropagation()}
        >
          <div className="modal-header">
            <h2>Upgrade Your Plan</h2>
            <button className="close-btn" onClick={onClose}>×</button>
          </div>

          <div className="modal-content">
            <AnimatePresence mode="wait">
              {step === 'plan' && (
                <motion.div
                  key="plan"
                  variants={stepVariants}
                  initial="hidden"
                  animate="visible"
                  exit="exit"
                  className="plan-selection"
                >
                  <h3>Choose Your Plan</h3>
                  <div className="plans-grid">
                    {Object.entries(plans).map(([key, planData]) => (
                      <div
                        key={key}
                        className={`plan-card ${selectedPlan === key ? 'selected' : ''} ${planData.popular ? 'popular' : ''}`}
                        onClick={() => setSelectedPlan(key)}
                      >
                        {planData.popular && <div className="popular-badge">Most Popular</div>}
                        {planData.discount && <div className="discount-badge">{planData.discount}</div>}
                        
                        <h4>{planData.name}</h4>
                        <div className="price">
                          <span className="amount">${planData.price}</span>
                          <span className="period">/{planData.period}</span>
                        </div>
                        
                        <ul className="features">
                          {planData.features.map((feature, index) => (
                            <li key={index}>{feature}</li>
                          ))}
                        </ul>
                      </div>
                    ))}
                  </div>
                  
                  <button 
                    className="continue-btn"
                    onClick={() => setStep('payment')}
                  >
                    Continue with {plans[selectedPlan].name}
                  </button>
                </motion.div>
              )}

              {step === 'payment' && (
                <motion.div
                  key="payment"
                  variants={stepVariants}
                  initial="hidden"
                  animate="visible"
                  exit="exit"
                  className="payment-form"
                >
                  <div className="order-summary">
                    <h3>Order Summary</h3>
                    <div className="summary-item">
                      <span>{plans[selectedPlan].name}</span>
                      <span>${plans[selectedPlan].price}/{plans[selectedPlan].period}</span>
                    </div>
                    <div className="summary-total">
                      <span>Total</span>
                      <span>${plans[selectedPlan].price}</span>
                    </div>
                  </div>

                  <div className="payment-methods">
                    <h4>Payment Method</h4>
                    <div className="method-buttons">
                      <button
                        className={`method-btn ${paymentMethod === 'card' ? 'active' : ''}`}
                        onClick={() => setPaymentMethod('card')}
                      >
                        💳 Credit Card
                      </button>
                      <button
                        className={`method-btn ${paymentMethod === 'paypal' ? 'active' : ''}`}
                        onClick={() => setPaymentMethod('paypal')}
                      >
                        🟦 PayPal
                      </button>
                    </div>
                  </div>

                  {paymentMethod === 'card' && (
                    <div className="card-form">
                      <div className="form-row">
                        <div className="form-group">
                          <label>Card Number</label>
                          <input
                            type="text"
                            value={formData.cardNumber}
                            onChange={(e) => handleInputChange('cardNumber', formatCardNumber(e.target.value))}
                            placeholder="1234 5678 9012 3456"
                            maxLength="19"
                            className={errors.cardNumber ? 'error' : ''}
                          />
                          {errors.cardNumber && <span className="error-text">{errors.cardNumber}</span>}
                        </div>
                      </div>

                      <div className="form-row">
                        <div className="form-group">
                          <label>Expiry Date</label>
                          <input
                            type="text"
                            value={formData.expiryDate}
                            onChange={(e) => handleInputChange('expiryDate', formatExpiryDate(e.target.value))}
                            placeholder="MM/YY"
                            maxLength="5"
                            className={errors.expiryDate ? 'error' : ''}
                          />
                          {errors.expiryDate && <span className="error-text">{errors.expiryDate}</span>}
                        </div>

                        <div className="form-group">
                          <label>CVV</label>
                          <input
                            type="text"
                            value={formData.cvv}
                            onChange={(e) => handleInputChange('cvv', e.target.value.replace(/\D/g, ''))}
                            placeholder="123"
                            maxLength="4"
                            className={errors.cvv ? 'error' : ''}
                          />
                          {errors.cvv && <span className="error-text">{errors.cvv}</span>}
                        </div>
                      </div>
                    </div>
                  )}

                  <div className="billing-form">
                    <h4>Billing Information</h4>
                    
                    <div className="form-row">
                      <div className="form-group">
                        <label>Full Name</label>
                        <input
                          type="text"
                          value={formData.name}
                          onChange={(e) => handleInputChange('name', e.target.value)}
                          placeholder="John Doe"
                          className={errors.name ? 'error' : ''}
                        />
                        {errors.name && <span className="error-text">{errors.name}</span>}
                      </div>

                      <div className="form-group">
                        <label>Email</label>
                        <input
                          type="email"
                          value={formData.email}
                          onChange={(e) => handleInputChange('email', e.target.value)}
                          placeholder="john@example.com"
                          className={errors.email ? 'error' : ''}
                        />
                        {errors.email && <span className="error-text">{errors.email}</span>}
                      </div>
                    </div>

                    <div className="form-group">
                      <label>Address</label>
                      <input
                        type="text"
                        value={formData.billingAddress.line1}
                        onChange={(e) => handleInputChange('billingAddress.line1', e.target.value)}
                        placeholder="123 Main St"
                        className={errors['billingAddress.line1'] ? 'error' : ''}
                      />
                      {errors['billingAddress.line1'] && <span className="error-text">{errors['billingAddress.line1']}</span>}
                    </div>

                    <div className="form-row">
                      <div className="form-group">
                        <label>City</label>
                        <input
                          type="text"
                          value={formData.billingAddress.city}
                          onChange={(e) => handleInputChange('billingAddress.city', e.target.value)}
                          placeholder="New York"
                          className={errors['billingAddress.city'] ? 'error' : ''}
                        />
                        {errors['billingAddress.city'] && <span className="error-text">{errors['billingAddress.city']}</span>}
                      </div>

                      <div className="form-group">
                        <label>State</label>
                        <input
                          type="text"
                          value={formData.billingAddress.state}
                          onChange={(e) => handleInputChange('billingAddress.state', e.target.value)}
                          placeholder="NY"
                        />
                      </div>

                      <div className="form-group">
                        <label>ZIP</label>
                        <input
                          type="text"
                          value={formData.billingAddress.zip}
                          onChange={(e) => handleInputChange('billingAddress.zip', e.target.value)}
                          placeholder="10001"
                          className={errors['billingAddress.zip'] ? 'error' : ''}
                        />
                        {errors['billingAddress.zip'] && <span className="error-text">{errors['billingAddress.zip']}</span>}
                      </div>
                    </div>
                  </div>

                  <div className="form-actions">
                    <button className="back-btn" onClick={() => setStep('plan')}>
                      Back
                    </button>
                    <button 
                      className="pay-btn"
                      onClick={handlePayment}
                      disabled={isProcessing}
                    >
                      Pay ${plans[selectedPlan].price}
                    </button>
                  </div>
                </motion.div>
              )}

              {step === 'processing' && (
                <motion.div
                  key="processing"
                  variants={stepVariants}
                  initial="hidden"
                  animate="visible"
                  exit="exit"
                  className="processing-step"
                >
                  <div className="processing-content">
                    <div className="spinner"></div>
                    <h3>Processing Payment</h3>
                    <p>Please wait while we process your payment...</p>
                  </div>
                </motion.div>
              )}

              {step === 'success' && (
                <motion.div
                  key="success"
                  variants={stepVariants}
                  initial="hidden"
                  animate="visible"
                  exit="exit"
                  className="success-step"
                >
                  <div className="success-content">
                    <div className="success-icon">✅</div>
                    <h3>Payment Successful!</h3>
                    <p>Welcome to {plans[selectedPlan].name}! Your subscription is now active.</p>
                    <button className="done-btn" onClick={onClose}>
                      Done
                    </button>
                  </div>
                </motion.div>
              )}

              {step === 'error' && (
                <motion.div
                  key="error"
                  variants={stepVariants}
                  initial="hidden"
                  animate="visible"
                  exit="exit"
                  className="error-step"
                >
                  <div className="error-content">
                    <div className="error-icon">❌</div>
                    <h3>Payment Failed</h3>
                    <p>There was an issue processing your payment. Please try again.</p>
                    <div className="error-actions">
                      <button className="retry-btn" onClick={() => setStep('payment')}>
                        Try Again
                      </button>
                      <button className="cancel-btn" onClick={onClose}>
                        Cancel
                      </button>
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};

export default PaymentModal;