import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import useUserStore from '../../../store/userStore';
import useAuthStore from '../../../store/authStore';
import PaymentModal from '../PaymentModal/PaymentModal';
import './Subscription.css';

const Subscription = ({ className = '' }) => {
  const { subscription, updateSubscription } = useUserStore();
  const { user } = useAuthStore();
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState('premium');
  const [showCancelModal, setShowCancelModal] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const plans = {
    free: {
      name: 'Free',
      price: 0,
      period: 'forever',
      features: [
        '3 readings per day',
        'Basic Three-Card spread',
        'Standard card interpretations',
        'Reading history (last 7 days)'
      ],
      limits: {
        dailyReadings: 3,
        spreads: ['threeCard'],
        historyDays: 7
      }
    },
    basic: {
      name: 'Basic',
      price: 9.99,
      period: 'month',
      features: [
        '15 readings per day',
        'All basic spreads',
        'Enhanced interpretations',
        'Reading history (30 days)',
        'Email support'
      ],
      limits: {
        dailyReadings: 15,
        spreads: ['threeCard', 'celtic', 'relationship'],
        historyDays: 30
      }
    },
    premium: {
      name: 'Premium',
      price: 19.99,
      period: 'month',
      features: [
        'Unlimited readings',
        'All spreads including advanced',
        'AI-powered interpretations',
        'Unlimited reading history',
        'Personal reading journal',
        'Priority support',
        'Offline access',
        'Custom card designs'
      ],
      limits: {
        dailyReadings: Infinity,
        spreads: 'all',
        historyDays: Infinity
      }
    },
    yearly: {
      name: 'Premium Yearly',
      price: 199.99,
      period: 'year',
      originalPrice: 239.88,
      savings: 39.89,
      features: [
        'Everything in Premium',
        '2 months free',
        'Exclusive yearly spreads',
        'Personal astrologer consultation (1/year)',
        'Custom card deck designs',
        'Priority feature access'
      ],
      limits: {
        dailyReadings: Infinity,
        spreads: 'all',
        historyDays: Infinity
      }
    }
  };

  const currentPlan = plans[subscription?.type] || plans.free;
  const isActiveSubscription = subscription?.type && subscription.type !== 'free';
  const isExpired = subscription?.expiresAt && new Date(subscription.expiresAt) < new Date();

  useEffect(() => {
    if (isExpired && isActiveSubscription) {
      // Downgrade to free plan if subscription expired
      updateSubscription({
        type: 'free',
        expiresAt: null,
        features: plans.free.features
      });
    }
  }, [isExpired, isActiveSubscription]);

  const handleUpgrade = (planType) => {
    if (planType === 'free') return;
    setSelectedPlan(planType);
    setShowPaymentModal(true);
  };

  const handleCancelSubscription = async () => {
    setIsLoading(true);
    try {
      // In a real app, this would call the backend to cancel the subscription
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      updateSubscription({
        type: 'free',
        expiresAt: null,
        features: plans.free.features
      });
      
      setShowCancelModal(false);
    } catch (error) {
      console.error('Failed to cancel subscription:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return '';
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const getDaysRemaining = () => {
    if (!subscription?.expiresAt) return null;
    const now = new Date();
    const expires = new Date(subscription.expiresAt);
    const diffTime = expires - now;
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays > 0 ? diffDays : 0;
  };

  const daysRemaining = getDaysRemaining();

  return (
    <div className={`subscription-page ${className}`}>
      <div className="subscription-header">
        <h1>Your Subscription</h1>
        <p>Manage your Mistika subscription and explore premium features</p>
      </div>

      {/* Current Plan Status */}
      <motion.div
        className={`current-plan ${subscription?.type || 'free'}`}
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <div className="plan-info">
          <div className="plan-details">
            <h2>{currentPlan.name} Plan</h2>
            {subscription?.type !== 'free' && (
              <div className="plan-price">
                <span className="amount">${currentPlan.price}</span>
                <span className="period">/{currentPlan.period}</span>
              </div>
            )}
            
            {isActiveSubscription && (
              <div className="subscription-status">
                {isExpired ? (
                  <span className="status expired">Expired</span>
                ) : (
                  <>
                    <span className="status active">Active</span>
                    {daysRemaining !== null && (
                      <span className="expiry">
                        {daysRemaining > 0 
                          ? `${daysRemaining} days remaining`
                          : 'Expires today'
                        }
                      </span>
                    )}
                  </>
                )}
              </div>
            )}

            {subscription?.expiresAt && (
              <p className="next-billing">
                {isExpired ? 'Expired on' : 'Renews on'} {formatDate(subscription.expiresAt)}
              </p>
            )}
          </div>

          <div className="plan-actions">
            {subscription?.type === 'free' || isExpired ? (
              <button 
                className="upgrade-btn"
                onClick={() => handleUpgrade('premium')}
              >
                Upgrade Now
              </button>
            ) : (
              <div className="action-buttons">
                <button 
                  className="change-plan-btn"
                  onClick={() => setShowPaymentModal(true)}
                >
                  Change Plan
                </button>
                <button 
                  className="cancel-btn"
                  onClick={() => setShowCancelModal(true)}
                >
                  Cancel Subscription
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Current Plan Features */}
        <div className="current-features">
          <h3>Your Current Features</h3>
          <div className="features-grid">
            {currentPlan.features.map((feature, index) => (
              <motion.div
                key={index}
                className="feature-item"
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.1 }}
              >
                <span className="feature-icon">✓</span>
                <span className="feature-text">{feature}</span>
              </motion.div>
            ))}
          </div>
        </div>

        {/* Usage Stats */}
        {isActiveSubscription && (
          <div className="usage-stats">
            <h3>This Month's Usage</h3>
            <div className="stats-grid">
              <div className="stat-item">
                <span className="stat-number">42</span>
                <span className="stat-label">Readings</span>
              </div>
              <div className="stat-item">
                <span className="stat-number">8</span>
                <span className="stat-label">Different Spreads</span>
              </div>
              <div className="stat-item">
                <span className="stat-number">156</span>
                <span className="stat-label">Cards Drawn</span>
              </div>
            </div>
          </div>
        )}
      </motion.div>

      {/* Available Plans */}
      <div className="available-plans">
        <h2>Choose Your Perfect Plan</h2>
        <div className="plans-comparison">
          {Object.entries(plans).map(([planKey, plan], index) => (
            <motion.div
              key={planKey}
              className={`plan-card ${planKey} ${subscription?.type === planKey ? 'current' : ''}`}
              initial={{ opacity: 0, y: 50 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
            >
              {planKey === 'premium' && (
                <div className="popular-badge">Most Popular</div>
              )}
              {plan.savings && (
                <div className="savings-badge">Save ${plan.savings}</div>
              )}

              <div className="plan-header">
                <h3>{plan.name}</h3>
                <div className="plan-pricing">
                  {plan.price === 0 ? (
                    <span className="free-price">Free</span>
                  ) : (
                    <>
                      <span className="price">${plan.price}</span>
                      <span className="period">/{plan.period}</span>
                    </>
                  )}
                  {plan.originalPrice && (
                    <span className="original-price">${plan.originalPrice}/year</span>
                  )}
                </div>
              </div>

              <ul className="plan-features">
                {plan.features.map((feature, featureIndex) => (
                  <li key={featureIndex}>
                    <span className="check-icon">✓</span>
                    {feature}
                  </li>
                ))}
              </ul>

              <div className="plan-action">
                {subscription?.type === planKey ? (
                  <button className="current-plan-btn" disabled>
                    Current Plan
                  </button>
                ) : planKey === 'free' ? (
                  <button 
                    className="downgrade-btn"
                    onClick={() => setShowCancelModal(true)}
                    disabled={subscription?.type === 'free'}
                  >
                    Downgrade
                  </button>
                ) : (
                  <button
                    className="select-plan-btn"
                    onClick={() => handleUpgrade(planKey)}
                  >
                    {subscription?.type === 'free' ? 'Upgrade' : 'Switch Plan'}
                  </button>
                )}
              </div>
            </motion.div>
          ))}
        </div>
      </div>

      {/* Payment Modal */}
      <PaymentModal
        isOpen={showPaymentModal}
        onClose={() => setShowPaymentModal(false)}
        plan={selectedPlan}
        onSuccess={(newSubscription) => {
          updateSubscription(newSubscription);
          setShowPaymentModal(false);
        }}
        onError={(error) => {
          console.error('Payment error:', error);
        }}
      />

      {/* Cancel Confirmation Modal */}
      <AnimatePresence>
        {showCancelModal && (
          <motion.div
            className="modal-overlay"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setShowCancelModal(false)}
          >
            <motion.div
              className="cancel-modal"
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.8 }}
              onClick={e => e.stopPropagation()}
            >
              <h3>Cancel Subscription</h3>
              <p>
                Are you sure you want to cancel your subscription? You'll lose access to premium 
                features at the end of your current billing period.
              </p>
              
              <div className="what-youll-lose">
                <h4>You'll lose access to:</h4>
                <ul>
                  <li>Unlimited readings</li>
                  <li>Advanced spreads</li>
                  <li>AI-powered interpretations</li>
                  <li>Reading history beyond 7 days</li>
                </ul>
              </div>

              <div className="modal-actions">
                <button 
                  className="keep-subscription-btn"
                  onClick={() => setShowCancelModal(false)}
                >
                  Keep Subscription
                </button>
                <button 
                  className="confirm-cancel-btn"
                  onClick={handleCancelSubscription}
                  disabled={isLoading}
                >
                  {isLoading ? 'Cancelling...' : 'Yes, Cancel'}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default Subscription;