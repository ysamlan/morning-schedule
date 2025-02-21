import { describe, test, expect, beforeEach, vi } from 'vitest';
import '@testing-library/jest-dom/vitest';
import { render, screen, within, fireEvent } from '@testing-library/svelte';
import Page from './+page.svelte';
import * as audio from '$lib/audio';
import { localStore } from '$lib/localStore.svelte';
import type { AlertTime } from '$lib/types';

// Set up spies for audio functions
const audioSpies = {
    playAlert: vi.spyOn(audio, 'playAlert'),
    speak: vi.spyOn(audio, 'speak'),
    playSuccess: vi.spyOn(audio, 'playSuccess'),
    cancelSpeech: vi.spyOn(audio, 'cancelSpeech')
};

// Mock crypto.randomUUID to return predictable values
let mockIdCounter = 0;
vi.stubGlobal('crypto', {
    randomUUID: () => `test-id-${mockIdCounter++}`
});

describe('/+page.svelte', () => {
    beforeEach(() => {
        // Reset store to initial state and ID counter
        localStore.clearData();
        mockIdCounter = 0;
        vi.useFakeTimers();
        // Reset all spies
        Object.values(audioSpies).forEach(spy => spy.mockClear());
    });

    test('should start in setup mode', () => {
        render(Page);
        expect(screen.getByText('Switch to Daily Checklist Mode')).toBeInTheDocument();
        expect(screen.getByText('Setup Mode')).toBeInTheDocument();
    });

    test('should toggle between setup and daily mode', async () => {
        render(Page);
        const toggleButton = screen.getByText('Switch to Daily Checklist Mode');
        
        await fireEvent.click(toggleButton);
        expect(screen.getByText('Switch to Setup Mode')).toBeInTheDocument();
        
        await fireEvent.click(screen.getByText('Switch to Setup Mode'));
        expect(screen.getByText('Switch to Daily Checklist Mode')).toBeInTheDocument();
    });

    test('should add new alert time', async () => {
        render(Page);
        const timeInput = screen.getByPlaceholderText('Add new alert time');
        const addButton = screen.getByText('Add Time');

        await fireEvent.input(timeInput, { target: { value: '09:00' } });
        await fireEvent.click(addButton);

        const alertTimes = JSON.parse(localStorage.getItem('alertTimes')!) as AlertTime[];
        expect(alertTimes).toHaveLength(1);
        expect(alertTimes[0].time).toBe('09:00');
    });

    test('should add checklist item to alert time', async () => {
        render(Page);
        
        // First add an alert time
        const timeInput = screen.getByPlaceholderText('Add new alert time');
        await fireEvent.input(timeInput, { target: { value: '09:00' } });
        await fireEvent.click(screen.getByText('Add Time'));

        // Find the setup mode section and then find the alert time within it
        const setupSection = screen.getByText('Setup Mode').closest('div');
        const alertTimeSection = within(setupSection).getByRole('heading', { name: '09:00' }).closest('div');
        const itemInput = within(alertTimeSection).getByPlaceholderText('Add new checklist item');
        await fireEvent.input(itemInput, { target: { value: 'Take medication' } });
        await fireEvent.click(within(alertTimeSection).getByText('Add Item'));

        const alertTimes =  JSON.parse(localStorage.getItem('alertTimes')!) as AlertTime[];
        expect(alertTimes[0].items).toHaveLength(1);
        expect(alertTimes[0].items[0].name).toBe('Take medication');
    });

    test('should toggle item completion in daily mode', async () => {
        render(Page);
        
        // Set the time to 8:30 AM (before our 9:00 AM test time)
        vi.setSystemTime(new Date(2025, 1, 1, 8, 30));
        
        // Setup: Add time and item
        const timeInput = screen.getByPlaceholderText('Add new alert time');
        await fireEvent.input(timeInput, { target: { value: '09:00' } });
        await fireEvent.click(screen.getByText('Add Time'));
        
        // Find the setup mode section and then find the alert time within it
        const setupSection = screen.getByText('Setup Mode').closest('div');
        const alertTimeSection = within(setupSection).getByRole('heading', { name: '09:00' }).closest('div');
        const itemInput = within(alertTimeSection).getByPlaceholderText('Add new checklist item');
        await fireEvent.input(itemInput, { target: { value: 'Take medication' } });
        await fireEvent.click(within(alertTimeSection).getByText('Add Item'));

        // Switch to daily mode
        await fireEvent.click(screen.getByText('Switch to Daily Checklist Mode'));

        // Find the daily mode section and the checkbox within it
        const dailySection = screen.getByText('Daily Checklist').closest('div');
        const checkbox = within(dailySection).getByRole('checkbox');
        
        await fireEvent.click(checkbox);

        const alertTimes =  JSON.parse(localStorage.getItem('alertTimes')!) as AlertTime[];
        expect(alertTimes[0].items[0].isCompleted).toBe(true);
    });

    test('should persist tasks between setup and task list modes', async () => {
        render(Page);
        
        // Set initial time to 8:30 AM
        vi.setSystemTime(new Date(2025, 1, 1, 8, 30));
        
        // Add two different times with tasks in setup mode
        const timeInput = screen.getByPlaceholderText('Add new alert time');
        
        // Add first time (9:00) and its tasks
        await fireEvent.input(timeInput, { target: { value: '09:00' } });
        await fireEvent.click(screen.getByText('Add Time'));

        // Find the setup mode section and then find the alert time within it
        const setupSection = screen.getByText('Setup Mode').closest('div');
        const firstTimeSection = within(setupSection).getByRole('heading', { name: '09:00' }).closest('div');
        const firstItemInput = within(firstTimeSection).getByPlaceholderText('Add new checklist item');
        
        await fireEvent.input(firstItemInput, { target: { value: 'Take morning vitamins' } });
        await fireEvent.click(within(firstTimeSection).getByText('Add Item'));
        
        // Add second time (10:00) and its tasks
        await fireEvent.input(timeInput, { target: { value: '10:00' } });
        await fireEvent.click(screen.getByText('Add Time'));
        
        const secondTimeSection = within(setupSection).getByRole('heading', { name: '10:00' }).closest('div');
        const secondItemInput = within(secondTimeSection).getByPlaceholderText('Add new checklist item');
        
        await fireEvent.input(secondItemInput, { target: { value: 'Check email' } });
        await fireEvent.click(within(secondTimeSection).getByText('Add Item'));
        
        // Switch to daily mode and verify tasks are present
        await fireEvent.click(screen.getByText('Switch to Daily Checklist Mode'));
        
        const dailySection = screen.getByText('Daily Checklist').closest('div');
        
        // Verify both tasks are visible and unchecked
        expect(within(dailySection).getByText('Take morning vitamins')).toBeInTheDocument();
        expect(within(dailySection).getByText('Check email')).toBeInTheDocument();
        
        const checkboxes = within(dailySection).getAllByRole('checkbox');
        expect(checkboxes).toHaveLength(2);
        checkboxes.forEach(checkbox => {
            expect(checkbox).not.toBeChecked();
        });
        
        // Complete one task
        await fireEvent.click(checkboxes[0]);
        
        // Switch back to setup mode and verify tasks still exist
        await fireEvent.click(screen.getByText('Switch to Setup Mode'));
        
        const updatedSetupSection = screen.getByText('Setup Mode').closest('div');
        expect(within(updatedSetupSection).getByText('Take morning vitamins')).toBeInTheDocument();
        expect(within(updatedSetupSection).getByText('Check email')).toBeInTheDocument();
        
        // Switch to daily mode again and verify completion state persisted
        await fireEvent.click(screen.getByText('Switch to Daily Checklist Mode'));
        
        const updatedDailySection = screen.getByText('Daily Checklist').closest('div');
        const updatedCheckboxes = within(updatedDailySection).getAllByRole('checkbox');
        expect(updatedCheckboxes[0]).toBeChecked();
        expect(updatedCheckboxes[1]).not.toBeChecked();
        
        // Verify store state directly
        const alertTimes =  JSON.parse(localStorage.getItem('alertTimes')!) as AlertTime[];
        expect(alertTimes).toHaveLength(2);
        expect(alertTimes[0].time).toBe('09:00');
        expect(alertTimes[0].items[0].name).toBe('Take morning vitamins');
        expect(alertTimes[0].items[0].isCompleted).toBe(true);
        expect(alertTimes[1].time).toBe('10:00');
        expect(alertTimes[1].items[0].name).toBe('Check email');
        expect(alertTimes[1].items[0].isCompleted).toBe(false);
    });

    test('should only alert once per minute when time matches', async () => {
        render(Page);
        
        // Set initial time to 8:55 AM
        vi.setSystemTime(new Date(2025, 1, 1, 8, 55));
        
        // Add an alert time for 9:00 with a task
        const timeInput = screen.getByPlaceholderText('Add new alert time');
        await fireEvent.input(timeInput, { target: { value: '09:00' } });
        await fireEvent.click(screen.getByText('Add Time'));
        
        const setupSection = screen.getByText('Setup Mode').closest('div');
        const alertTimeSection = within(setupSection).getByRole('heading', { name: '09:00' }).closest('div');
        const itemInput = within(alertTimeSection).getByPlaceholderText('Add new checklist item');
        await fireEvent.input(itemInput, { target: { value: 'Take medication' } });
        await fireEvent.click(within(alertTimeSection).getByText('Add Item'));

        // Switch to daily mode
        await fireEvent.click(screen.getByText('Switch to Daily Checklist Mode'));

        // Advance time to 9:00 AM
        vi.setSystemTime(new Date(2025, 1, 1, 9, 0));
        vi.advanceTimersByTime(1000); // Trigger the interval check

        // Wait for the setTimeout in announceItems
        await vi.advanceTimersByTimeAsync(50);

        // Verify alert was played once
        expect(audioSpies.playAlert).toHaveBeenCalledTimes(1);
        expect(audioSpies.speak).toHaveBeenCalledTimes(1);
        expect(audioSpies.speak).toHaveBeenCalledWith('Time for 09:00. You need to: Take medication');

        // Reset spy call counts
        Object.values(audioSpies).forEach(spy => spy.mockClear());

        // Advance time by 30 seconds (still 9:00)
        vi.advanceTimersByTime(30000);

        // Verify no additional alerts were played
        expect(audioSpies.playAlert).not.toHaveBeenCalled();
        expect(audioSpies.speak).not.toHaveBeenCalled();

        // Advance to next minute (9:01)
        vi.setSystemTime(new Date(2025, 1, 1, 9, 1));
        vi.advanceTimersByTime(1000);

        // Verify no alerts at 9:01
        expect(audioSpies.playAlert).not.toHaveBeenCalled();
        expect(audioSpies.speak).not.toHaveBeenCalled();

        // Reset spy call counts
        Object.values(audioSpies).forEach(spy => spy.mockClear());

        // Go to the next day, wait for the timer reset, and verify the next day's alerts fire
        // Go to next alert time
        vi.setSystemTime(new Date(2025, 1, 2, 8, 59));
        // Wait for the timer reset for the day
        await vi.advanceTimersByTimeAsync(50);
        vi.setSystemTime(new Date(2025, 1, 2, 9, 0));
        vi.advanceTimersByTime(1000);

        // wait for announcement 
        await vi.advanceTimersByTimeAsync(50);

        // Verify alerts play again for the next day
        expect(audioSpies.playAlert).toHaveBeenCalledTimes(1);
        expect(audioSpies.speak).toHaveBeenCalledTimes(1);
    });

    test('should update lastAnnouncedTime when alert fires', async () => {
        render(Page);
        
        // Set initial time to before adding the alert
        vi.setSystemTime(new Date(2025, 1, 20, 14, 16, 0));
        
        // Add two alert times - one for 14:17 and one for 14:18 to prevent reset
        const timeInput = screen.getByPlaceholderText('Add new alert time');
        
        // Add first alert time
        await fireEvent.input(timeInput, { target: { value: '14:17' } });
        await fireEvent.click(screen.getByText('Add Time'));
        
        // Add second alert time
        await fireEvent.input(timeInput, { target: { value: '14:18' } });
        await fireEvent.click(screen.getByText('Add Time'));
        
        // Verify alert times were added correctly
        const alertTimes =  JSON.parse(localStorage.getItem('alertTimes')!) as AlertTime[];
        expect(alertTimes).toHaveLength(2);
        expect(alertTimes[0].time).toBe('14:17');
        expect(alertTimes[1].time).toBe('14:18');
        
        // Add a checklist item to the first alert time
        const firstAlertSection = screen.getByRole('heading', { name: '14:17' }).closest('div');
        const itemInput = within(firstAlertSection).getByPlaceholderText('Add new checklist item');
        await fireEvent.input(itemInput, { target: { value: 'Test item' } });
        await fireEvent.click(within(firstAlertSection).getByText('Add Item'));
        
        // Switch to daily mode
        await fireEvent.click(screen.getByText('Switch to Daily Checklist Mode'));
        
        // Now set the time to the first alert time
        vi.setSystemTime(new Date(2025, 1, 20, 14, 17, 0));
        
        // Run the interval check
        await vi.advanceTimersByTime(1000);
        
        // Get fresh store state
        const lastAnnouncedTime = JSON.parse(localStorage.getItem('lastAnnouncedTime')!) as string;
        expect(lastAnnouncedTime).toBe('14:17');
        expect(audioSpies.playAlert).toHaveBeenCalled();
        
        // Verify the alert doesn't fire again
        await vi.advanceTimersByTime(1000);
        expect(audioSpies.playAlert).toHaveBeenCalledTimes(1);
    });
});
