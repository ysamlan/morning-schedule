import { describe, test, expect, beforeEach, vi } from 'vitest';
import '@testing-library/jest-dom/vitest';
import { render, screen, within, fireEvent } from '@testing-library/svelte';
import { get } from 'svelte/store';
import Page from './+page.svelte';
import { appStore } from '$lib/store';

// Mock the audio module
vi.mock('$lib/audio');

describe('/+page.svelte', () => {
    beforeEach(() => {
        // Reset store to initial state
        appStore.clearData();
        vi.useFakeTimers();
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

        const store = get(appStore);
        expect(store.alertTimes).toHaveLength(1);
        expect(store.alertTimes[0].time).toBe('09:00');
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

        const updatedStore = get(appStore);
        expect(updatedStore.alertTimes[0].items).toHaveLength(1);
        expect(updatedStore.alertTimes[0].items[0].name).toBe('Take medication');
    });

    test('should toggle item completion in daily mode', async () => {
        render(Page);
        
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

        const store = get(appStore);
        expect(store.alertTimes[0].items[0].isCompleted).toBe(true);
    });
});
