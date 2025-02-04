import { AppState, DEFAULT_TIME_BLOCK, DayHistory, TimeBlock } from "../types";
import { format } from "date-fns";

const STORAGE_KEY = "morning-tasks-state";

export function loadState(): AppState {
  const stored = localStorage.getItem(STORAGE_KEY);
  if (!stored) {
    return {
      timeBlocks: [DEFAULT_TIME_BLOCK],
      history: []
    };
  }
  return JSON.parse(stored);
}

export function saveState(state: AppState) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
}

export function addDayHistory(completed: boolean) {
  const state = loadState();
  const today = format(new Date(), "yyyy-MM-dd");
  
  const history: DayHistory[] = [
    ...state.history.filter(h => h.date !== today),
    { date: today, completed }
  ];
  
  saveState({ ...state, history });
}

export function resetDayChecklist() {
  const state = loadState();
  const resetBlocks: TimeBlock[] = state.timeBlocks.map(block => ({
    ...block,
    items: block.items.map(item => ({ ...item, completed: false }))
  }));
  
  saveState({ ...state, timeBlocks: resetBlocks });
  return resetBlocks;
}

export function shouldPlayAlert(timeBlock: TimeBlock): boolean {
  return !timeBlock.items.every(item => item.completed);
}

export function speakItems(items: string[]) {
  if ('speechSynthesis' in window) {
    const utterance = new SpeechSynthesisUtterance(
      `Time to: ${items.join(", ")}`
    );
    window.speechSynthesis.speak(utterance);
  }
}
