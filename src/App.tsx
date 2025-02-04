import { useEffect, useState } from "react";
import { TimeBlock as TimeBlockComponent } from "./components/time-block";
import { ModeTabs } from "./components/mode-tabs";
import { TimeBlock, ChecklistItem } from "./types";
import {
  loadState,
  saveState,
  shouldPlayAlert,
  speakItems,
  resetDayChecklist,
  addDayHistory,
} from "./utils/storage";
import { format, parse, isAfter } from "date-fns";

function App() {
  const [timeBlocks, setTimeBlocks] = useState<TimeBlock[]>([]);
  const [mode, setMode] = useState<"checklist" | "setup">("checklist");

  useEffect(() => {
    const state = loadState();
    setTimeBlocks(state.timeBlocks);
  }, []);

  useEffect(() => {
    // Save state whenever timeBlocks change
    if (timeBlocks.length > 0) {
      saveState({ timeBlocks, history: loadState().history });
    }
  }, [timeBlocks]);

  useEffect(() => {
    // Set up alerts for each time block
    const intervals: number[] = [];

    timeBlocks.forEach((block, index) => {
      const [hours, minutes] = block.time.split(":").map(Number);
      const alertTime = new Date();
      alertTime.setHours(hours, minutes, 0, 0);

      // If all items are completed, don't set up the alert
      if (shouldPlayAlert(block)) {
        const timeUntilAlert = alertTime.getTime() - new Date().getTime();
        if (timeUntilAlert > 0) {
          const intervalId = window.setTimeout(() => {
            const incompleteItems = block.items
              .filter(item => !item.completed)
              .map(item => item.text);

            if (incompleteItems.length > 0) {
              speakItems(incompleteItems);
            }
          }, timeUntilAlert);
          intervals.push(intervalId);
        }
      }
    });

    return () => intervals.forEach(clearTimeout);
  }, [timeBlocks]);

  // Check if it's a new day and reset if needed
  useEffect(() => {
    const lastBlock = timeBlocks[timeBlocks.length - 1];
    if (!lastBlock) return;

    const now = new Date();
    const lastTime = parse(lastBlock.time, "HH:mm", new Date());
    
    if (isAfter(now, lastTime)) {
      const allCompleted = lastBlock.items.every(item => item.completed);
      addDayHistory(allCompleted);
      setTimeBlocks(resetDayChecklist());
    }
  }, [timeBlocks]);

  const handleUpdateItems = (blockId: string, items: ChecklistItem[]) => {
    setTimeBlocks(blocks =>
      blocks.map(block =>
        block.id === blockId ? { ...block, items } : block
      )
    );
  };

  const handleUpdateTime = (blockId: string, time: string) => {
    setTimeBlocks(blocks =>
      blocks.map(block =>
        block.id === blockId ? { ...block, time } : block
      ).sort((a, b) => a.time.localeCompare(b.time))
    );
  };

  const handleDeleteBlock = (blockId: string) => {
    setTimeBlocks(blocks => blocks.filter(block => block.id !== blockId));
  };

  const handleAddTimeBlock = () => {
    const newBlock: TimeBlock = {
      id: crypto.randomUUID(),
      time: "09:00",
      items: []
    };
    setTimeBlocks(blocks => [...blocks, newBlock].sort((a, b) => 
      a.time.localeCompare(b.time)
    ));
  };

  return (
    <div className="min-h-screen bg-gray-100 p-4">
      <div className="max-w-2xl mx-auto">
        <h1 className="text-2xl font-bold mb-6">Morning Tasks</h1>
        
        <ModeTabs activeMode={mode} onModeChange={setMode} />

        {mode === "setup" && (
          <div className="mb-6">
            <button
              onClick={handleAddTimeBlock}
              className="bg-green-500 text-white px-4 py-2 rounded hover:bg-green-600"
            >
              Add Time Block
            </button>
          </div>
        )}

        {timeBlocks.map((block) => (
          <TimeBlockComponent
            key={block.id}
            block={block}
            onUpdateItems={(items) => handleUpdateItems(block.id, items)}
            onUpdateTime={(time) => handleUpdateTime(block.id, time)}
            onDelete={() => handleDeleteBlock(block.id)}
            mode={mode}
          />
        ))}
      </div>
    </div>
  );
}

export default App;
