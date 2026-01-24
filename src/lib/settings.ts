
export interface FollowUpSettings {
    defaultInterval: number; // days
    enableDailyReminder: boolean;
    excludeWeekends: boolean;
}

export const DEFAULT_SETTINGS: FollowUpSettings = {
    defaultInterval: 3,
    enableDailyReminder: true,
    excludeWeekends: true,
};

const STORAGE_KEY = 'followup_settings';

export function getFollowUpSettings(): FollowUpSettings {
    try {
        const stored = localStorage.getItem(STORAGE_KEY);
        if (stored) {
            return { ...DEFAULT_SETTINGS, ...JSON.parse(stored) };
        }
    } catch (e) {
        console.error('Failed to parse followup settings', e);
    }
    return DEFAULT_SETTINGS;
}

export function saveFollowUpSettings(settings: FollowUpSettings): void {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(settings));
    window.dispatchEvent(new Event('followup-settings-changed'));
}

export function calculateNextFollowUpDate(settings: FollowUpSettings = getFollowUpSettings()): string {
    const date = new Date();
    date.setDate(date.getDate() + settings.defaultInterval);

    if (settings.excludeWeekends) {
        const day = date.getDay();
        if (day === 6) { // Saturday
            date.setDate(date.getDate() + 2);
        } else if (day === 0) { // Sunday
            date.setDate(date.getDate() + 1);
        }
    }

    return date.toISOString().split('T')[0];
}
