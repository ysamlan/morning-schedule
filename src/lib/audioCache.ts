import type { AlertTime } from './types';
import { speak } from './tts';

interface CachedAudio {
    blob: Blob;
    url: string;
    audio: HTMLAudioElement;
}

const audioCache = new Map<string, CachedAudio>();

function generateAnnouncementText(alertTime: AlertTime): string {
    const incompleteItems = alertTime.items.filter(item => !item.isCompleted);
    if (incompleteItems.length === 0) return '';
    const itemText = incompleteItems.map(item => item.name).join(', ');
    return `Time for ${alertTime.time}. You need to: ${itemText}`;
}

function getCacheKey(alertTime: AlertTime): string {
    const text = generateAnnouncementText(alertTime);
    return `${alertTime.id}-${text}`;
}

export function clearCache(alertTimeId?: string): void {
    if (alertTimeId) {
        // Clear specific alert time's cached audio
        for (const [key, cached] of audioCache.entries()) {
            if (key.startsWith(`${alertTimeId}-`)) {
                URL.revokeObjectURL(cached.url);
                audioCache.delete(key);
            }
        }
    } else {
        // Clear all cached audio
        for (const cached of audioCache.values()) {
            URL.revokeObjectURL(cached.url);
        }
        audioCache.clear();
    }
}

export async function preloadAnnouncement(alertTime: AlertTime): Promise<void> {
    const text = generateAnnouncementText(alertTime);
    if (!text) return; // Nothing to announce

    const cacheKey = getCacheKey(alertTime);
    
    // If already cached and valid, nothing to do
    if (audioCache.has(cacheKey)) return;

    try {
        // Generate audio using vits-web
        const wav = await speak({ 
            text,
            returnAudio: true // New option to return audio without playing
        });

        // Cache the audio
        const url = URL.createObjectURL(wav);
        const audio = new Audio(url);
        await new Promise((resolve, reject) => {
            audio.oncanplaythrough = resolve;
            audio.onerror = reject;
            audio.load();
        });

        audioCache.set(cacheKey, { blob: wav, url, audio });
    } catch (error) {
        console.warn('Failed to preload announcement:', error);
        // Don't cache failures - we'll fall back to regular TTS if needed
    }
}

export async function playAnnouncement(alertTime: AlertTime): Promise<void> {
    const cacheKey = getCacheKey(alertTime);
    const cached = audioCache.get(cacheKey);

    if (cached) {
        try {
            // Use cached audio
            await cached.audio.play();
            return;
        } catch (error) {
            console.warn('Failed to play cached audio:', error);
            // Fall through to regular TTS on failure
        }
    }

    // Fall back to regular TTS if no cache or cache failed
    const text = generateAnnouncementText(alertTime);
    if (text) {
        await speak({ text });
    }
}

// Clean up cache when window unloads
if (typeof window !== 'undefined') {
    window.addEventListener('unload', () => clearCache());
}
