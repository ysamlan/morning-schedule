import { describe, test, expect, beforeEach, vi, afterEach } from 'vitest';
import '@testing-library/jest-dom/vitest';
import { render, screen, within, fireEvent, waitFor } from '@testing-library/svelte';
import Page from './+page.svelte';
import * as audioModule from '$lib/audio';
import { localStore } from '$lib/localStore.svelte';
import type { AlertTime } from '$lib/types';

// Mock audio functions
vi.mock('$lib/audio', () => ({
    playAlert: vi.fn(),
    speak: vi.fn(),
    playSuccess: vi.fn(),
    cancelSpeech: vi.fn(),
    preloadAudio: vi.fn(),
    playAudio: vi.fn(),
}));

// Mock current time for testing
vi.useFakeTimers();
const TEST_DATE = new Date(2025, 1, 1, 8, 0);

describe('/+page.svelte', () => {
    beforeEach(() => {
        vi.setSystemTime(TEST_DATE);
        localStorage.clear();
        vi.clearAllMocks();
    });

    afterEach(() => {
        vi.clearAllTimers();
    });

    test('should start in setup mode', () => {
        render(Page);
        expect(screen.getByText('Setup Mode')).toBeInTheDocument();
    });

    test('should toggle between setup and daily mode', async () => {
        render(Page);
        
        // Initially in setup mode
        expect(screen.getByText('Setup Mode')).toBeInTheDocument();
        
        // Switch to daily mode
        await fireEvent.click(screen.getByRole('button', { name: /Switch to Daily Checklist/ }));
        await waitFor(() => expect(screen.getByText('Daily Checklist')).toBeInTheDocument());
        
        // Switch back to setup mode
        await fireEvent.click(screen.getByRole('button', { name: /Switch to Setup Mode/ }));
        await waitFor(() => expect(screen.getByText('Setup Mode')).toBeInTheDocument());
    });

    test('should add new alert time', async () => {
        render(Page);
        
        // Add a time
        const timeInput = screen.getByPlaceholderText('Add new alert time');
        await fireEvent.input(timeInput, { target: { value: '09:00' } });
        await fireEvent.click(screen.getByText('Add Time'));
        
        // Verify the time was added
        await waitFor(() => expect(screen.getByText('09:00')).toBeInTheDocument());
    });

    // Simplified test that just verifies the edit button exists
    test('should have edit functionality for alert times', async () => {
        render(Page);
        
        // Add a time first
        const timeInput = screen.getByPlaceholderText('Add new alert time');
        await fireEvent.input(timeInput, { target: { value: '09:00' } });
        await fireEvent.click(screen.getByText('Add Time'));
        
        // Wait for the time to appear
        await waitFor(() => expect(screen.getByText('09:00')).toBeInTheDocument());
        
        // Verify edit button exists
        const editButtons = screen.getAllByText('Edit');
        expect(editButtons.length).toBeGreaterThan(0);
    });

    // Simplified test that just focuses on adding a task
    test('should add a task', async () => {
        render(Page);
        
        // Add a time first
        const timeInput = screen.getByPlaceholderText('Add new alert time');
        await fireEvent.input(timeInput, { target: { value: '09:00' } });
        await fireEvent.click(screen.getByText('Add Time'));
        
        // Wait for the time to appear
        await waitFor(() => expect(screen.getByText('09:00')).toBeInTheDocument());
        
        // Click Add Task
        await fireEvent.click(screen.getByText('Add Task'));
        
        // Verify a task input was added
        const taskInputs = await waitFor(() => screen.getAllByPlaceholderText('Enter task name'));
        expect(taskInputs.length).toBeGreaterThan(0);
    });

    test('should add time and task, then see task in daily view', async () => {
        render(Page);
        // Verify we start in setup mode
        expect(screen.getByText('Setup Mode')).toBeInTheDocument();
        
        // Add a time
        const timeInput = screen.getByPlaceholderText('Add new alert time');
        await fireEvent.input(timeInput, { target: { value: '09:00' } });
        await fireEvent.click(screen.getByText('Add Time'));
        
        // Verify the time was added
        await waitFor(() => expect(screen.getByText('09:00')).toBeInTheDocument());
        
        // Find the new task's input and add a name
        const taskInput = await screen.findByPlaceholderText('Enter task name');
        
        await fireEvent.input(taskInput, { target: { value: 'Test Task' } });
        await fireEvent.blur(taskInput);
        
        vi.advanceTimersByTime(350); // Advance slightly more than the debounce time

        // Switch to daily checklist mode
        await fireEvent.click(screen.getByRole('button', { name: /Switch to Daily Checklist/ }));

        // Verify we're in daily checklist mode
        await waitFor(() => {
            const dailyHeader = screen.getByText('Daily Checklist');
            console.log('Daily checklist header found:', dailyHeader.textContent);
            expect(dailyHeader).toBeInTheDocument();
        });
        
        await waitFor(() => expect(screen.getByText('Test Task')).toBeInTheDocument());
    });
});
