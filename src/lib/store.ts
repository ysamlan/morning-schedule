import { writable } from 'svelte/store';
import type { AppState, AlertTime, ChecklistItem } from './types';
import { DEFAULT_APP_STATE } from './types';

function createAppStore() {
    const storedData = typeof localStorage !== 'undefined' 
        ? localStorage.getItem('morningTasks')
        : null;
    const initialState: AppState = storedData 
        ? JSON.parse(storedData)
        : DEFAULT_APP_STATE;
    
    const { subscribe, set, update } = writable<AppState>(initialState);

    return {
        subscribe,
        toggleMode: () => update(state => ({ 
            ...state, 
            isSetupMode: !state.isSetupMode 
        })),
        addAlertTime: (time: string) => update(state => {
            const newAlertTime: AlertTime = {
                id: crypto.randomUUID(),
                time,
                items: []
            };
            return {
                ...state,
                alertTimes: [...state.alertTimes, newAlertTime].sort((a, b) => a.time.localeCompare(b.time))
            };
        }),
        removeAlertTime: (id: string) => update(state => ({
            ...state,
            alertTimes: state.alertTimes.filter(at => at.id !== id)
        })),
        addChecklistItem: (alertTimeId: string, name: string) => update(state => {
            const newItem: ChecklistItem = {
                id: crypto.randomUUID(),
                name,
                isCompleted: false
            };
            return {
                ...state,
                alertTimes: state.alertTimes.map(at => 
                    at.id === alertTimeId 
                        ? { ...at, items: [...at.items, newItem] }
                        : at
                )
            };
        }),
        removeChecklistItem: (alertTimeId: string, itemId: string) => update(state => ({
            ...state,
            alertTimes: state.alertTimes.map(at => 
                at.id === alertTimeId 
                    ? { ...at, items: at.items.filter(item => item.id !== itemId) }
                    : at
            )
        })),
        toggleChecklistItem: (alertTimeId: string, itemId: string) => update(state => ({
            ...state,
            alertTimes: state.alertTimes.map(at => 
                at.id === alertTimeId 
                    ? {
                        ...at,
                        items: at.items.map(item => 
                            item.id === itemId 
                                ? { ...item, isCompleted: !item.isCompleted }
                                : item
                        )
                    }
                    : at
            )
        })),
        setCompletionAnimation: (alertTimeId: string, show: boolean) => update(state => ({
            ...state,
            alertTimes: state.alertTimes.map(at =>
                at.id === alertTimeId
                    ? { ...at, showCompletionAnimation: show }
                    : at
            )
        })),
        setLastAnnouncedTime: (time: string) => update(state => ({
            ...state,
            lastAnnouncedTime: time
        })),
        resetChecklist: () => update(state => ({
            ...state,
            alertTimes: state.alertTimes.map(at => ({
                ...at,
                items: at.items.map(item => ({ ...item, isCompleted: false })),
                showCompletionAnimation: false
            })),
            lastAnnouncedTime: undefined
        }))
    };
}

export const appStore = createAppStore();

// Subscribe to store changes and save to localStorage
if (typeof localStorage !== 'undefined') {
    appStore.subscribe(state => {
        localStorage.setItem('morningTasks', JSON.stringify(state));
    });
}
