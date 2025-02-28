// use this with Comlink

import { STATUS_TTS_READY } from "./types";
import * as vitsWeb from '@diffusionstudio/vits-web';

export function speak(
  data: string,
): number {
  
  // SUPER EXPENSIVE COMPUTATION CODE HERE...
  return data.length;
}

export function init(){
  return STATUS_TTS_READY;
}

export async function getSpeech(data: string): Promise<Blob> {
  const start = performance.now();
  const blob = await vitsWeb.predict({
    text: data,
    voiceId: 'en_US-amy-medium',
  });
  console.log('Time taken:', performance.now() - start + ' ms');
  return blob;
} 

// NEXT STEPS
// maybe drop the cache altogether and just write a function
// that returns the speech blob directly
// see https://github.com/diffusionstudio/vits-web/blob/main/example/worker.ts