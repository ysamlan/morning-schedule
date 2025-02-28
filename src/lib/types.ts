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


export const STATUS_FINISHED = 'STATUS_FINISHED';
export const STATUS_PROCESSING = 'STATUS_PROCESSING';
export const STATUS_IDLE = 'STATUS_IDLE';
export const STATUS_ERROR = 'STATUS_ERROR';
export const MESSAGE_START = 'START';

