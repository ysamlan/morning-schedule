export interface ChecklistItem {
    id: string;
    name: string;
    isCompleted: boolean;
}

export interface AlertTime {
    id: string;
    time: string;
    items: ChecklistItem[];
    showCompletionAnimation?: boolean;
}

export interface AppState {
    isSetupMode: boolean;
    alertTimes: AlertTime[];
    lastAnnouncedTime?: string;
    lastAnnouncedDate?: string;  // Store as YYYY-MM-DD
}

export const DEFAULT_APP_STATE: AppState = {
    isSetupMode: true,
    alertTimes: []
};
