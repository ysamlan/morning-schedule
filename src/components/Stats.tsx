import React from 'react';
import { Card } from 'react-daisyui';

const Stats = ({ calculateStats }) => {
  const { weeklyRate, monthlyRate } = calculateStats();

  return (
    <div className="stats-container mt-4">
      <div className="card bg-base-100 w-96 shadow-sm">
        <div className="card-body">
          <h2 className="card-title">Stats</h2>
          <p>
            Weekly: Ready to leave: {weeklyRate}%
            Monthly: Ready to leave: {monthlyRate}%
          </p>
          <div className="card-actions justify-end">
            <button className="btn btn-primary">Buy Now</button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Stats;
