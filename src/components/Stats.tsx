import React from 'react';
import { Card } from 'react-daisyui';

const Stats = ({ calculateStats }) => {
  const { weeklyRate, monthlyRate } = calculateStats();

  return (
    <div className="stats-container mt-4">
      <Card className="shadow-lg compact bg-base-100">
        <Card.Body>
          <Card.Title>Weekly Stats</Card.Title>
          <div>Ready to leave: {weeklyRate}%</div>
        </Card.Body>
      </Card>
      <Card className="shadow-lg compact bg-base-100 mt-4">
        <Card.Body>
          <Card.Title>Monthly Stats</Card.Title>
          <div>Ready to leave: {monthlyRate}%</div>
        </Card.Body>
      </Card>
    </div>
  );
};

export default Stats;
