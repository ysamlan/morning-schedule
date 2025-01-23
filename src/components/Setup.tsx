import React from 'react';

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
        <div className="card bg-base-100 w-96 shadow-sm">
          <div className="card-body">
            <div className="flex">
              <input type="time" className="input w-1/2" value={block.time}
                onChange={(e) => updateTime(blockIndex, e.target.value)} />
              <button
                className="w-1/2 btn"
                onClick={() => removeTimeBlock(blockIndex)}
              >
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="2.5" stroke="currentColor" class="size-[1.2em]"><path stroke-linecap="round" stroke-linejoin="round" d="M21 8.25c0-2.485-2.099-4.5-4.688-4.5-1.935 0-3.597 1.126-4.312 2.733-.715-1.607-2.377-2.733-4.313-2.733C5.1 3.75 3 5.765 3 8.25c0 7.22 9 12 9 12s9-4.78 9-12Z" /></svg>
                Remove Block
              </button>
            </div>

            {block.items.map((item, itemIndex) => (
              <div
                key={itemIndex}
                className={`flex items-center mt-2 ${itemIndex === block.items.length - 1 &&
                  blockIndex === currentSchedule.timeBlocks.length - 1
                  ? 'ready-to-leave'
                  : ''
                  }`}
              >
                <input
                  type="text"
                  className="input input-bordered w-full max-w-xs"
                  value={item}
                  onChange={(e) =>
                    updateChecklistItem(blockIndex, itemIndex, e.target.value)
                  }
                />
                <button
                  className="btn btn-error ml-2"
                  onClick={() => removeChecklistItem(blockIndex, itemIndex)}
                >
                  trash
                </button>
              </div>
            ))}
            <div className="card-actions justify-end">
              <button onClick={() => addChecklistItem(blockIndex)} className="btn btn-primary">Add Item</button>
            </div>
          </div>
        </div >
      ))}
      <button onClick={addTimeBlock} className="btn btn-primary">Add Time Block</button>
    </div >
  );
};

export default Setup;
