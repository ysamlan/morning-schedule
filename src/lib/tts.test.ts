/// <reference types="vitest/globals" />

import { describe, it, expect, vi, beforeEach, afterEach, beforeAll, afterAll } from 'vitest';
import * as vitsWeb from '@diffusionstudio/vits-web';
import { speak, isInitialized, _resetForTesting } from './tts';

interface MockProgressEvent {
    loaded: number;
    total: number;
    url: string;
}

// Mock vits-web module
vi.mock('@diffusionstudio/vits-web', () => ({
    predict: vi.fn(),
    stored: vi.fn(),
    download: vi.fn(),
}));

// Configure test environment
const { window } = new (require('jsdom').JSDOM)();
global.window = window;
global.Audio = vi.fn().mockImplementation(() => ({
    play: vi.fn().mockResolvedValue(undefined),
}));
global.URL.createObjectURL = vi.fn();

// Mock SpeechSynthesisUtterance globally
class MockSpeechSynthesisUtterance {
    text: string;
    rate: number;
    pitch: number;
    volume: number;
    onend: (() => void) | null;
    onerror: ((event: any) => void) | null;

    constructor(text: string) {
        this.text = text;
        this.rate = 1;
        this.pitch = 1;
        this.volume = 1;
        this.onend = null;
        this.onerror = null;
    }
}

global.SpeechSynthesisUtterance = MockSpeechSynthesisUtterance as any;

// Mock console to avoid polluting test output
const originalConsole = { ...console };
beforeAll(() => {
    console.warn = vi.fn();
    console.error = vi.fn();
    console.log = vi.fn();
});

afterAll(() => {
    console.warn = originalConsole.warn;
    console.error = originalConsole.error;
    console.log = originalConsole.log;
});

describe('TTS Service', () => {
    let storedVoices: string[] = [];
    const mockSpeechSynthesis = {
        speak: vi.fn((utterance) => {
            setTimeout(() => utterance.onend?.(), 100);
        }),
    };

    function setupMocks(options: { shouldFailInitialization?: boolean } = {}) {
        // Reset TTS state
        _resetForTesting();

        // Reset mocks and state
        vi.clearAllMocks();
        storedVoices = [];

        // Mock browser TTS
        Object.defineProperty(window, 'speechSynthesis', {
            value: mockSpeechSynthesis,
            writable: true,
        });

        if (options.shouldFailInitialization) {
            vi.mocked(vitsWeb.stored).mockRejectedValue(new Error('vits-web error'));
            vi.mocked(vitsWeb.download).mockRejectedValue(new Error('vits-web error'));
            vi.mocked(vitsWeb.predict).mockRejectedValue(new Error('vits-web error'));
        } else {
            // Setup vits-web mocks
            vi.mocked(vitsWeb.stored).mockImplementation(async () => storedVoices);
            vi.mocked(vitsWeb.download).mockImplementation(async (voiceId, progressCallback) => {
                storedVoices = ['en_US-amy-medium'];
                if (progressCallback) {
                    const progress: MockProgressEvent = { loaded: 100, total: 100, url: 'test-url' };
                    progressCallback(progress);
                }
                return undefined;
            });
            vi.mocked(vitsWeb.predict).mockResolvedValue(new Blob(['mock wav data']));
        }
    }

    beforeEach(() => {
        setupMocks();
    });

    afterEach(() => {
        vi.clearAllMocks();
        _resetForTesting();
    });

    it('should use vits-web when initialized', async () => {
        // First call will trigger initialization and download
        await speak({ text: 'Hello' });

        expect(vitsWeb.stored).toHaveBeenCalled();
        expect(vitsWeb.download).toHaveBeenCalledWith('en_US-amy-medium', expect.any(Function));
        expect(vitsWeb.predict).toHaveBeenCalledWith({
            text: 'Hello',
            voiceId: 'en_US-amy-medium',
        });
        expect(global.Audio).toHaveBeenCalled();

        // Second call should use the cached voice
        await speak({ text: 'Hello again' });
        expect(vitsWeb.download).toHaveBeenCalledTimes(1); // Should not download again
        expect(vitsWeb.predict).toHaveBeenCalledTimes(2);
    });

    it('should fall back to browser TTS when vits-web fails', async () => {
        setupMocks({ shouldFailInitialization: true });

        await speak({ text: 'Hello', rate: 1.5, pitch: 1.2, volume: 0.8 });

        expect(mockSpeechSynthesis.speak).toHaveBeenCalled();
        const utterance = mockSpeechSynthesis.speak.mock.calls[0][0];
        expect(utterance.text).toBe('Hello');
        expect(utterance.rate).toBe(1.5);
        expect(utterance.pitch).toBe(1.2);
        expect(utterance.volume).toBe(0.8);

        // Should not retry vits-web initialization
        expect(vitsWeb.stored).toHaveBeenCalledTimes(1);
    });

    it('should indicate initialization status', () => {
        expect(isInitialized()).toBeDefined();
    });
});
