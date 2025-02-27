import { describe, it, expect, beforeEach, vi } from 'vitest';
import { preloadAnnouncement, playAnnouncement, clearCache, _getCacheSize, _clearCacheForTesting } from './audioCache';
import { speak } from './tts';
import type { AlertTime } from './types';

// Mock the speak function
vi.mock('./tts', () => ({
    speak: vi.fn().mockImplementation(async ({ text, returnAudio }) => {
        if (returnAudio) {
            return new Blob(['mock audio data'], { type: 'audio/wav' });
        }
        return Promise.resolve();
    })
}));

// Mock toast
vi.mock('@zerodevx/svelte-toast', () => ({
    toast: {
        push: vi.fn()
    }
}));

describe('audioCache', () => {
    let mockAlertTime: AlertTime;

    beforeEach(() => {
        _clearCacheForTesting();
        mockAlertTime = {
            id: 'test-id',
            time: '10:00',
            items: [
                { id: '1', name: 'Task 1', isCompleted: false },
                { id: '2', name: 'Task 2', isCompleted: true },
                { id: '3', name: 'Task 3', isCompleted: false }
            ]
        };
        
        // Reset all mocks
        vi.clearAllMocks();
        
        // Mock URL.createObjectURL and Audio
        global.URL.createObjectURL = vi.fn().mockReturnValue('mock-url');
        global.URL.revokeObjectURL = vi.fn();
        
        // @ts-ignore - partial mock of Audio
        global.Audio = vi.fn().mockImplementation(() => {
            const audio = {
                load: vi.fn().mockImplementation(() => {
                    // Simulate async loading
                    setTimeout(() => {
                        if (audio.oncanplaythrough) {
                            audio.oncanplaythrough();
                        }
                    }, 0);
                }),
                play: vi.fn().mockResolvedValue(undefined),
                oncanplaythrough: null
            };
            return audio;
        });
    });

    it('should cache audio for incomplete items', async () => {
        expect(_getCacheSize()).toBe(0);
        
        await preloadAnnouncement(mockAlertTime);
        expect(_getCacheSize()).toBe(1);
        expect(speak).toHaveBeenCalledTimes(1);
        
        // Same text should reuse cache
        await preloadAnnouncement(mockAlertTime);
        expect(_getCacheSize()).toBe(1);
        expect(speak).toHaveBeenCalledTimes(1);
    });

    it('should reuse cached audio for same text even with different IDs', async () => {
        await preloadAnnouncement(mockAlertTime);
        expect(_getCacheSize()).toBe(1);
        expect(speak).toHaveBeenCalledTimes(1);
        
        // Different ID but same text should reuse cache
        const differentIdAlertTime = {
            ...mockAlertTime,
            id: 'different-id'
        };
        await preloadAnnouncement(differentIdAlertTime);
        expect(_getCacheSize()).toBe(1);
        expect(speak).toHaveBeenCalledTimes(1);
    });

    it('should create new cache entry for different text', async () => {
        await preloadAnnouncement(mockAlertTime);
        expect(_getCacheSize()).toBe(1);
        
        // Change task name to force different text
        const differentTextAlertTime = {
            ...mockAlertTime,
            items: mockAlertTime.items.map(item =>
                item.id === '1' ? { ...item, name: 'Different Task' } : item
            )
        };
        await preloadAnnouncement(differentTextAlertTime);
        expect(_getCacheSize()).toBe(2);
        expect(speak).toHaveBeenCalledTimes(2);
    });

    it('should not create cache entry for completed items', async () => {
        const allCompletedAlertTime = {
            ...mockAlertTime,
            items: mockAlertTime.items.map(item => ({ ...item, isCompleted: true }))
        };
        
        await preloadAnnouncement(allCompletedAlertTime);
        expect(_getCacheSize()).toBe(0);
        expect(speak).not.toHaveBeenCalled();
    });

    it('should use cached audio when playing announcement', async () => {
        await preloadAnnouncement(mockAlertTime);
        expect(_getCacheSize()).toBe(1);
        expect(speak).toHaveBeenCalledTimes(1);
        
        await playAnnouncement(mockAlertTime);
        expect(speak).toHaveBeenCalledTimes(1); // Should not call speak again
    });

    it('should fall back to regular TTS if cache fails', async () => {
        // Mock Audio.play to fail
        // @ts-ignore - partial mock of Audio
        global.Audio = vi.fn().mockImplementation(() => {
            const audio = {
                load: vi.fn().mockImplementation(() => {
                    // Simulate async loading
                    setTimeout(() => {
                        if (audio.oncanplaythrough) {
                            audio.oncanplaythrough();
                        }
                    }, 0);
                }),
                play: vi.fn().mockRejectedValue(new Error('Audio playback failed')),
                oncanplaythrough: null
            };
            return audio;
        });
        
        await preloadAnnouncement(mockAlertTime);
        expect(_getCacheSize()).toBe(1);
        expect(speak).toHaveBeenCalledTimes(1);
        
        await playAnnouncement(mockAlertTime);
        expect(speak).toHaveBeenCalledTimes(2); // Should call speak again as fallback
    });
});
