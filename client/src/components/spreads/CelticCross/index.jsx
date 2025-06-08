import React from 'react';
import Button from '../../common/Button';

const CelticCross = ({ onCardsDrawn, deck = [] }) => {
  return (
    <div className="flex flex-col items-center space-y-6 p-6">
      <div className="text-center">
        <h3 className="text-xl font-semibold text-gray-900 mb-2">
          Celtic Cross
        </h3>
        <p className="text-gray-600">
          Coming soon - Advanced 10-card spread
        </p>
      </div>
      <div className="w-64 h-64 border-2 border-dashed border-gray-300 rounded-lg flex items-center justify-center">
        <span className="text-gray-500">Celtic Cross Layout</span>
      </div>
      <Button disabled variant="outline">
        Coming Soon
      </Button>
    </div>
  );
};

export default CelticCross;
