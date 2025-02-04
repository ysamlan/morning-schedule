export interface ChecklistItem {
  id: string;
  text: string;
  completed: boolean;
  isLastItem?: boolean;
}

export interface TimeBlock {
  id: string;
  time: string;
  items: ChecklistItem[];
}

export interface DayHistory {
  date: string;
  completed: boolean;
}

export interface AppState {
  timeBlocks: TimeBlock[];
  history: DayHistory[];
}

export const DEFAULT_TIME_BLOCK: TimeBlock = {
  id: "default",
  time: "07:30",
  items: [
    {
      id: "ready-to-leave",
      text: "Ready to leave!",
      completed: false,
      isLastItem: true
    }
  ]
};
