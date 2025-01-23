import React from 'react';

const DailyTasks = ({ currentSchedule, activeAlerts, toggleChecklistItem }) => {
  return (
    <div>
      {currentSchedule.timeBlocks.map((block, blockIndex) => (
        <div className="card bg-base-100 w-96 shadow-sm">
          <div className="card-body">
            <h2 className="card-title">{block.time}</h2>
            <p>
              {block.items.map((item, itemIndex) => (
                <div key={itemIndex} className={`flex items-center mt-2 ${itemIndex === block.items.length - 1 && blockIndex === currentSchedule.timeBlocks.length - 1 ? 'ready-to-leave' : ''}`}>
                  <input type="checkbox" checked={block.completed && block.completed.has(itemIndex)} onChange={() => toggleChecklistItem(blockIndex, itemIndex)} className="checkbox" />
                  <span>{item}</span>
                </div>
              ))}

            </p>
            <div className="card-actions justify-end">
              <button className="btn btn-primary">Buy Now</button>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
};

export default DailyTasks;
