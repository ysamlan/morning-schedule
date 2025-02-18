// Mock audio functions for testing
export async function playAlert(): Promise<void> {
    // No-op in tests
}

export async function playSuccess(): Promise<void> {
    // No-op in tests
}

export function speak(text: string): void {
    // No-op in tests
}

export function cancelSpeech(): void {
    // No-op in tests
}
