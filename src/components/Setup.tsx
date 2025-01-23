import React from 'react';
import { Card, Button, Input } from 'react-daisyui';

const Setup = ({
  currentSchedule,
  addTimeBlock,
  updateTime,
  addChecklistItem,
  updateChecklistItem,
  removeChecklistItem,
  removeTimeBlock
}) => {
  return (
    <div>
      {currentSchedule.timeBlocks.map((block, blockIndex) => (
        <Card key={blockIndex} className="mb-4">
          <Card.Body>
            <div className="flex">
              <Input
                type="time"
                className="w-1/2"
                value={block.time}
                onChange={(e) => updateTime(blockIndex, e.target.value)}
              />
              <Button
                className="w-1/2 btn-error"
                onClick={() => removeTimeBlock(blockIndex)}
              >
                <i className="fas fa-trash-alt mr-2"></i>Remove Block
              </Button>
            </div>
            {block.items.map((item, itemIndex) => (
              <div
                key={itemIndex}
                className={`flex items-center mt-2 ${
                  itemIndex === block.items.length - 1 &&
                  blockIndex === currentSchedule.timeBlocks.length - 1
                    ? 'ready-to-leave'
                    : ''
                }`}
              >
                <Input
                  type="text"
                  className="input input-bordered w-full max-w-xs"
                  value={item}
                  onChange={(e) =>
                    updateChecklistItem(blockIndex, itemIndex, e.target.value)
                  }
                />
                <Button
                  className="btn btn-error ml-2"
                  onClick={() => removeChecklistItem(blockIndex, itemIndex)}
                >
                  <i className="fas fa-trash-alt"></i>
                </Button>
              </div>
            ))}
            <Button
              className="btn btn-primary mt-2"
              onClick={() => addChecklistItem(blockIndex)}
            >
              <i className="fas fa-plus-circle mr-2"></i>Add Item
            </Button>
          </Card.Body>
        </Card>
      ))}
      <Button className="btn btn-primary mt-4" onClick={addTimeBlock}>
        <i className="fas fa-plus-circle mr-2"></i>Add Time Block
      </Button>
    </div>
  );
};

export default Setup;
