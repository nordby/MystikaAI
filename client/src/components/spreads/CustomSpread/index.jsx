import React from 'react';
import Button from '../../common/Button';

const CustomSpread = ({ onCardsDrawn, deck = [] }) => {
  return (
    <div className="flex flex-col items-center space-y-6 p-6">
      <div className="text-center">
        <h3 className="text-xl font-semibold text-gray-900 mb-2">
          Custom Spread
        </h3>
        <p className="text-gray-600">
          Create your own unique card layout
        </p>
      </div>
      <div className="w-64 h-64 border-2 border-dashed border-gray-300 rounded-lg flex items-center justify-center">
        <span className="text-gray-500">Custom Layout</span>
      </div>
      <Button disabled variant="outline">
        Premium Feature
      </Button>
    </div>
  );
};

export default CustomSpread;
