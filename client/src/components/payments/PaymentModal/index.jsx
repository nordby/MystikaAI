import React, { useState } from 'react';
import  { Modal }  from '../../common/Modal';
import Button from '../../common/Button';

const PaymentModal = ({ isOpen, onClose, plan }) => {
  const [loading, setLoading] = useState(false);

  const handlePayment = async () => {
    setLoading(true);
    setTimeout(() => {
      setLoading(false);
      onClose();
      alert('Payment successful! Premium features activated.');
    }, 2000);
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Upgrade to Premium" size="medium">
      <div className="space-y-6">
        <div className="text-center">
          <h3 className="text-lg font-medium text-gray-900">
            {plan?.name || 'Premium Plan'}
          </h3>
          <p className="text-2xl font-bold text-indigo-600 mt-2">
            ${plan?.price || '9.99'}/month
          </p>
        </div>
        <div className="space-y-3">
          <h4 className="font-medium text-gray-900">Includes:</h4>
          <ul className="space-y-2 text-sm text-gray-600">
            <li className="flex items-center">
              <span className="text-green-500 mr-2">✓</span>
              Unlimited readings
            </li>
            <li className="flex items-center">
              <span className="text-green-500 mr-2">✓</span>
              AI-powered insights
            </li>
          </ul>
        </div>
        <div className="flex space-x-4">
          <Button variant="outline" onClick={onClose} disabled={loading} className="flex-1">
            Cancel
          </Button>
          <Button onClick={handlePayment} loading={loading} className="flex-1">
            Subscribe Now
          </Button>
        </div>
      </div>
    </Modal>
  );
};

export default PaymentModal;
