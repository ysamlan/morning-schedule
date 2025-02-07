import { useEffect, useState, useCallback } from "react";
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

  // Load initial state
  useEffect(() => {
    const state = loadState();
    setTimeBlocks(state.timeBlocks);
  }, []);

  // Save state when timeBlocks change
  const saveTimeBlocks = useCallback((blocks: TimeBlock[]) => {
    if (blocks.length > 0) {
      const currentHistory = loadState().history;
      saveState({ timeBlocks: blocks, history: currentHistory });
    }
  }, []);

  useEffect(() => {
    saveTimeBlocks(timeBlocks);
  }, [timeBlocks, saveTimeBlocks]);

  // Set up alerts
  useEffect(() => {
    if (mode !== "checklist") return;

    const intervals: number[] = [];
    const now = new Date();

    timeBlocks.forEach((block) => {
      if (!shouldPlayAlert(block)) return;

      const [hours, minutes] = block.time.split(":").map(Number);
      const alertTime = new Date();
      alertTime.setHours(hours, minutes, 0, 0);

      const timeUntilAlert = alertTime.getTime() - now.getTime();
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
    });

    return () => intervals.forEach(clearTimeout);
  }, [timeBlocks, mode]);

  // Check for day reset
  useEffect(() => {
    const lastBlock = timeBlocks[timeBlocks.length - 1];
    if (!lastBlock) return;

    const now = new Date();
    const lastTime = parse(lastBlock.time, "HH:mm", now);
    
    if (isAfter(now, lastTime)) {
      const allCompleted = lastBlock.items.every(item => item.completed);
      addDayHistory(allCompleted);
      const resetBlocks = resetDayChecklist();
      setTimeBlocks(resetBlocks);
    }
  }, [timeBlocks]);

  const handleUpdateItems = useCallback((blockId: string, items: ChecklistItem[]) => {
    setTimeBlocks(blocks =>
      blocks.map(block =>
        block.id === blockId ? { ...block, items } : block
      )
    );
  }, []);

  const handleUpdateTime = useCallback((blockId: string, time: string) => {
    setTimeBlocks(blocks =>
      blocks.map(block =>
        block.id === blockId ? { ...block, time } : block
      ).sort((a, b) => a.time.localeCompare(b.time))
    );
  }, []);

  const handleDeleteBlock = useCallback((blockId: string) => {
    setTimeBlocks(blocks => blocks.filter(block => block.id !== blockId));
  }, []);

  const handleAddTimeBlock = useCallback(() => {
    const newBlock: TimeBlock = {
      id: crypto.randomUUID(),
      time: "09:00",
      items: []
    };
    setTimeBlocks(blocks => [...blocks, newBlock].sort((a, b) => 
      a.time.localeCompare(b.time)
    ));
  }, []);

  return (
    <div className="container">
      <h1>Morning Tasks</h1>
      
      <ModeTabs activeMode={mode} onModeChange={setMode} />

      {mode === "setup" && (
        <div className="actions">
          <button onClick={handleAddTimeBlock}>
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
  );
}

export default App;
