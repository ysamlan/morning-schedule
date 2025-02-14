export interface ChecklistItem {
    id: string;
    name: string;
    isCompleted: boolean;
}

export interface AlertTime {
    id: string;
    time: string;
    items: ChecklistItem[];
}

export interface AppState {
    isSetupMode: boolean;
    alertTimes: AlertTime[];
}

export const DEFAULT_APP_STATE: AppState = {
    isSetupMode: true,
    alertTimes: []
};
