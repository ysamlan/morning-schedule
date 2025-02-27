import type { AlertTime } from './types';
import { speak } from './tts';
import { toast } from '@zerodevx/svelte-toast';

interface CachedAudio {
    blob: Blob;
    url: string;
    audio: HTMLAudioElement;
    text: string; // Store the text to enable reuse
}

const audioCache = new Map<string, CachedAudio>();

function generateAnnouncementText(alertTime: AlertTime): string {
    const incompleteItems = alertTime.items.filter(item => !item.isCompleted);
    if (incompleteItems.length === 0) return '';
    const itemText = incompleteItems.map(item => item.name).join(', ');
    return `Time for ${alertTime.time}. You need to: ${itemText}`;
}

function getTextHash(text: string): string {
    // Simple hash function for text - good enough for our use case
    let hash = 0;
    for (let i = 0; i < text.length; i++) {
        const char = text.charCodeAt(i);
        hash = ((hash << 5) - hash) + char;
        hash = hash & hash;
    }
    return hash.toString(36);
}

function getCacheKey(text: string): string {
    return `text-${getTextHash(text)}`;
}

export function clearCache(alertTimeId?: string): void {
    if (alertTimeId) {
        // Only clear entries that are no longer needed
        const alertTimeText = Array.from(audioCache.values())
            .filter(cached => cached.text.includes(`Time for ${alertTimeId}`))
            .map(cached => cached.text);
        
        for (const text of alertTimeText) {
            const key = getCacheKey(text);
            const cached = audioCache.get(key);
            if (cached) {
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

    const cacheKey = getCacheKey(text);
    
    // If already cached and valid, nothing to do
    if (audioCache.has(cacheKey)) return;

    try {
        // Generate audio using vits-web
        const wav = await speak({ 
            text,
            returnAudio: true
        });

        // Cache the audio
        const url = URL.createObjectURL(wav);
        const audio = new Audio(url);
        await new Promise((resolve, reject) => {
            audio.oncanplaythrough = resolve;
            audio.onerror = reject;
            audio.load();
        });

        audioCache.set(cacheKey, { blob: wav, url, audio, text });
    } catch (error) {
        console.warn('Failed to preload announcement:', error);
        // Don't cache failures - we'll fall back to regular TTS if needed
    }
}

export async function playAnnouncement(alertTime: AlertTime): Promise<void> {
    const text = generateAnnouncementText(alertTime);
    if (!text) return; // Nothing to announce

    // Show toast notification
    toast.push(`🔔 ${text}`);

    const cacheKey = getCacheKey(text);
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
    await speak({ text });
}

// For testing
export function _getCacheSize(): number {
    return audioCache.size;
}

export function _clearCacheForTesting(): void {
    clearCache();
}

// Clean up cache when window unloads
if (typeof window !== 'undefined') {
    window.addEventListener('unload', () => clearCache());
}
