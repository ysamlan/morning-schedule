import * as vitsWeb from '@diffusionstudio/vits-web';

interface TTSOptions {
    text: string;
    rate?: number;
    pitch?: number;
    volume?: number;
    returnAudio?: boolean; // If true, returns the audio blob instead of playing it
}

const VOICE_ID = 'en_US-amy-medium';
let isVitsInitialized = false;
let initializationPromise: Promise<void> | null = null;

export async function initializeVits(): Promise<void> {
    // Don't try to initialize in test environment
    if (typeof window === 'undefined' || !('speechSynthesis' in window)) {
        return;
    }

    if (initializationPromise) {
        return initializationPromise;
    }

    initializationPromise = (async () => {
        try {
            const stored = await vitsWeb.stored();
            if (!stored?.includes(VOICE_ID)) {
                await vitsWeb.download(VOICE_ID, (progress) => {
                    console.log(`Downloading voice model: ${Math.round(progress.loaded * 100 / progress.total)}%`);
                });
            }
            isVitsInitialized = true;
        } catch (error) {
            console.warn('Failed to initialize vits-web:', error);
            isVitsInitialized = false;
            throw error; // Re-throw to trigger fallback
        }
    })();

    return initializationPromise;
}

function isBrowserTTSSupported(): boolean {
    return typeof window !== 'undefined' && 'speechSynthesis' in window;
}

async function speakWithVits({ text, returnAudio }: TTSOptions): Promise<Blob | void> {
    try {
        const wav = await vitsWeb.predict({
            text,
            voiceId: VOICE_ID,
        });

        if (returnAudio) {
            return wav;
        }

        const audio = new Audio();
        audio.src = URL.createObjectURL(wav);
        await audio.play();
    } catch (error) {
        console.error('vits-web synthesis failed:', error);
        throw error;
    }
}

function speakWithBrowserTTS({ text, rate = 1, pitch = 1, volume = 1 }: TTSOptions): Promise<void> {
    return new Promise((resolve, reject) => {
        if (!isBrowserTTSSupported()) {
            reject(new Error('Browser TTS not supported'));
            return;
        }

        const utterance = new SpeechSynthesisUtterance(text);
        utterance.rate = rate;
        utterance.pitch = pitch;
        utterance.volume = volume;

        utterance.onend = () => resolve();
        utterance.onerror = (event) => reject(event);

        window.speechSynthesis.speak(utterance);
    });
}

export async function speak(options: TTSOptions): Promise<Blob | void> {
    // In test environment, just simulate speech timing
    if (typeof window === 'undefined' || !('speechSynthesis' in window)) {
        if (options.returnAudio) {
            return new Blob(['mock wav data'], { type: 'audio/wav' });
        }
        return new Promise(resolve => setTimeout(resolve, 50));
    }

    try {
        if (!isVitsInitialized) {
            await initializeVits();
        }
        if (isVitsInitialized) {
            return await speakWithVits(options);
        }
    } catch (error) {
        console.warn('Falling back to browser TTS due to vits-web error:', error);
    }

    if (options.returnAudio) {
        throw new Error('Cannot return audio when falling back to browser TTS');
    }
    await speakWithBrowserTTS(options);
}

export function isInitialized(): boolean {
    return isVitsInitialized;
}

// Reset state for testing
export function _resetForTesting(): void {
    isVitsInitialized = false;
    initializationPromise = null;
}
