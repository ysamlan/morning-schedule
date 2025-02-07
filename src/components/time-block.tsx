import { useState } from "react";
import { TimeBlock as TimeBlockType, ChecklistItem } from "../types";
import { Checkbox } from "./ui/checkbox";

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

  const handleCheckItem = (itemId: string, checked: boolean) => {
    const updatedItems = block.items.map(item =>
      item.id === itemId ? { ...item, completed: checked } : item
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
      <div className="time-block">
        <div className="time-block-header">
          <span>{block.time}</span>
        </div>
        <ul className="checklist">
          {block.items.map((item) => (
            <li
              key={item.id}
              className={`checklist-item ${item.isLastItem ? 'last-item' : ''}`}
            >
              <Checkbox
                checked={item.completed}
                onCheckedChange={(checked) => handleCheckItem(item.id, checked as boolean)}
                id={item.id}
              />
              <label
                htmlFor={item.id}
                className={item.completed ? "completed" : ""}
              >
                {item.text}
              </label>
            </li>
          ))}
        </ul>
      </div>
    );
  }

  return (
    <div className="time-block">
      <div className="time-block-header">
        <input
          type="time"
          value={block.time}
          onChange={(e) => onUpdateTime(e.target.value)}
        />
        <button onClick={onDelete}>Delete Time Block</button>
      </div>

      <ul className="checklist">
        {block.items.map((item) => (
          <li
            key={item.id}
            className={`checklist-item ${item.isLastItem ? 'last-item' : ''}`}
          >
            <span>{item.text}</span>
            {!item.isLastItem && (
              <button onClick={() => handleDeleteItem(item.id)}>
                Delete
              </button>
            )}
          </li>
        ))}
      </ul>

      <div className="add-item">
        <input
          type="text"
          value={newItemText}
          onChange={(e) => setNewItemText(e.target.value)}
          placeholder="Add new item..."
          onKeyPress={(e) => e.key === "Enter" && handleAddItem()}
        />
        <button onClick={handleAddItem}>
          Add
        </button>
      </div>
    </div>
  );
}
