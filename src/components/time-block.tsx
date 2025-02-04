import { useState } from "react";
import { TimeBlock as TimeBlockType, ChecklistItem } from "../types";
import { cn } from "../utils/cn";

interface TimeBlockProps {
  block: TimeBlockType;
  onUpdateItems: (items: ChecklistItem[]) => void;
  onUpdateTime: (time: string) => void;
  onDelete: () => void;
  mode: "checklist" | "setup";
}

export function TimeBlock({
  block,
  onUpdateItems,
  onUpdateTime,
  onDelete,
  mode
}: TimeBlockProps) {
  const [newItemText, setNewItemText] = useState("");

  const handleCheckItem = (itemId: string) => {
    const updatedItems = block.items.map(item =>
      item.id === itemId ? { ...item, completed: !item.completed } : item
    );
    onUpdateItems(updatedItems);
  };

  const handleAddItem = () => {
    if (!newItemText.trim()) return;
    
    const newItem: ChecklistItem = {
      id: crypto.randomUUID(),
      text: newItemText.trim(),
      completed: false
    };
    
    onUpdateItems([...block.items, newItem]);
    setNewItemText("");
  };

  const handleDeleteItem = (itemId: string) => {
    onUpdateItems(block.items.filter(item => item.id !== itemId));
  };

  if (mode === "checklist") {
    return (
      <div className="p-4 border rounded-lg mb-4 bg-white shadow-sm">
        <div className="text-lg font-medium mb-2">
          {block.time}
        </div>
        <ul className="space-y-2">
          {block.items.map((item) => (
            <li
              key={item.id}
              className={cn(
                "flex items-center gap-2",
                item.isLastItem && "font-bold text-green-800"
              )}
            >
              <input
                type="checkbox"
                checked={item.completed}
                onChange={() => handleCheckItem(item.id)}
                className="h-4 w-4"
              />
              <span className={item.completed ? "line-through" : ""}>
                {item.text}
              </span>
            </li>
          ))}
        </ul>
      </div>
    );
  }

  return (
    <div className="p-4 border rounded-lg mb-4 bg-white shadow-sm">
      <div className="flex items-center gap-4 mb-4">
        <input
          type="time"
          value={block.time}
          onChange={(e) => onUpdateTime(e.target.value)}
          className="border rounded px-2 py-1"
        />
        <button
          onClick={onDelete}
          className="text-red-500 hover:text-red-700"
        >
          Delete Time Block
        </button>
      </div>

      <ul className="space-y-2">
        {block.items.map((item) => (
          <li
            key={item.id}
            className={cn(
              "flex items-center gap-2",
              item.isLastItem && "font-bold text-green-800"
            )}
          >
            <span>{item.text}</span>
            {!item.isLastItem && (
              <button
                onClick={() => handleDeleteItem(item.id)}
                className="text-red-500 hover:text-red-700 ml-auto"
              >
                Delete
              </button>
            )}
          </li>
        ))}
      </ul>

      <div className="mt-4 flex gap-2">
        <input
          type="text"
          value={newItemText}
          onChange={(e) => setNewItemText(e.target.value)}
          placeholder="Add new item..."
          className="border rounded px-2 py-1 flex-1"
          onKeyPress={(e) => e.key === "Enter" && handleAddItem()}
        />
        <button
          onClick={handleAddItem}
          className="bg-blue-500 text-white px-4 py-1 rounded hover:bg-blue-600"
        >
          Add
        </button>
      </div>
    </div>
  );
}
