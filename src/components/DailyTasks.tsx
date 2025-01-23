import React from 'react';
import { Card, Checkbox } from 'react-daisyui';

const DailyTasks = ({ currentSchedule, activeAlerts, toggleChecklistItem }) => {
  return (
    <div>
      {currentSchedule.timeBlocks.map((block, blockIndex) => (
        <Card key={blockIndex} className={`mb-4 ${activeAlerts.has(blockIndex) ? 'alert-active' : ''}`}>
          <Card.Body>
            <Card.Title>{block.time}</Card.Title>
            {block.items.map((item, itemIndex) => (
              <div key={itemIndex} className={`flex items-center mt-2 ${itemIndex === block.items.length - 1 && blockIndex === currentSchedule.timeBlocks.length - 1 ? 'ready-to-leave' : ''}`}>
                <Checkbox
                  checked={block.completed && block.completed.has(itemIndex)}
                  onChange={() => toggleChecklistItem(blockIndex, itemIndex)}
                />
                <span>{item}</span>
              </div>
            ))}
          </Card.Body>
        </Card>
      ))}
    </div>
  );
};

export default DailyTasks;
