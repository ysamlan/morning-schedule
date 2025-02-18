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

// Speak text using the Web Speech API
export function speak(text: string): void {
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
        const utterance = new SpeechSynthesisUtterance(text);
        utterance.rate = 0.9; // Slightly slower for better clarity
        utterance.pitch = 1.0;
        window.speechSynthesis.speak(utterance);
    }
}

// Cancel any ongoing speech
export function cancelSpeech(): void {
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
        window.speechSynthesis.cancel();
    }
}
