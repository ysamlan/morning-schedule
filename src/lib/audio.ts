// Audio context singleton to handle browser audio API
let audioContext: AudioContext | null = null;

export function getAudioContext(): AudioContext {
    if (!audioContext) {
        audioContext = new AudioContext();
    }
    return audioContext;
}

// Create and play a beep sound
export async function playAlert(frequency: number = 440, duration: number = 0.3): Promise<void> {
    const context = getAudioContext();
    const oscillator = context.createOscillator();
    const gainNode = context.createGain();

    oscillator.connect(gainNode);
    gainNode.connect(context.destination);

    oscillator.frequency.value = frequency;
    gainNode.gain.value = 0.1;

    oscillator.start(context.currentTime);
    oscillator.stop(context.currentTime + duration);
}

// Play success sound (higher pitched, cheerful sound)
export async function playSuccess(): Promise<void> {
    await playAlert(880, 0.1);
    setTimeout(() => playAlert(1320, 0.2), 100);
}

// Import our enhanced TTS service
import { speak as ttsSpeak, initializeVits } from './tts';

// Initialize TTS on module load
if (typeof window !== 'undefined') {
    initializeVits().catch(console.error);
}

// Speak text using our enhanced TTS service with vits-web and browser fallback
export async function speak(text: string): Promise<void> {
    // For testing compatibility, if we're in a test environment, just simulate the speech
    if (typeof window === 'undefined' || !('speechSynthesis' in window)) {
        // Simulate speech timing in tests
        return new Promise(resolve => setTimeout(resolve, 50));
    }

    await ttsSpeak({ 
        text,
        rate: 0.9, // Slightly slower for better clarity
        pitch: 1.0,
        volume: 1.0
    });
}

// Cancel any ongoing speech
export function cancelSpeech(): void {
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
        window.speechSynthesis.cancel();
    }
}
