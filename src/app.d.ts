// See https://svelte.dev/docs/kit/types#app.d.ts
// for information about these interfaces
declare global {
	namespace App {
		// interface Error {}
		// interface Locals {}
		// interface PageData {}
		// interface PageState {}
		// interface Platform {}
	}

	interface Window {
		updateAudioCacheTimeout?: number;
		setTimeout(handler: TimerHandler, timeout?: number, ...arguments: any[]): number;
		clearTimeout(timeoutId?: number): void;
	}
}

export {};
