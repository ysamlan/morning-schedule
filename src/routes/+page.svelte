<script lang="ts">
    import { localStore } from '$lib/localStore.svelte';
    import type { AlertTime, ChecklistItem } from '$lib/types';
    import { onMount, onDestroy } from 'svelte';
    import { playAlert, playSuccess, speak, cancelSpeech } from '$lib/audio';
    import { preloadAnnouncement, playAnnouncement, clearCache } from '$lib/audioCache';
    import ModeToggle from '../components/ModeToggle.svelte';
    import TimeSetup from '../components/TimeSetup.svelte';
    import AlertTimeBlock from '../components/AlertTimeBlock.svelte';
    import ClearDataButton from '../components/ClearDataButton.svelte';
    import Clock from '../components/Clock.svelte';
    import { STATUS_TTS_ERROR, STATUS_TTS_NOT_INITIALIZED, STATUS_TTS_READY } from '$lib/types';
    import { browser } from '$app/environment';
    let alertTimes = localStore('alertTimes', [] as AlertTime[]);
    let isSetupMode = localStore('isSetupMode', true);
    let lastAnnouncedTime = localStore('lastAnnouncedTime', '');
    let lastAnnouncedDate = localStore('lastAnnouncedDate', '');
    
    let newTime = '';
    let editingTimeId = '';
    let newItemName: { [key: string]: string } = {};
    let checkInterval: number;
    let worker: Worker;

  /**
   * @type {Number} Counting the progress of the worker
   */
  let step = 0;
  /**
   * @type {Number} The total number of steps of the worker
   */
  let total = 0;
  /**
   * @type {Number|undefined} The end result the worker returns.
   */
  let result;
  /**
   * @type {String} The current status of the worker.
   */
  let workerStatus = STATUS_TTS_NOT_INITIALIZED;
  /**
   * @type {String} Holds messages that are returend by the worker.
   */
  let workerMessage;

  /**
   * @type {ComlinkWorker<typeof import('$lib/ttsWorker')>} Holds messages that are returend by the worker.
   */
  let ttsWorker;

    async function initWebWorker() {
    // This function initiates the web worker
    if (browser) {
      // Check if we are in a browser
      if (window.Worker) {

        ttsWorker = new ComlinkWorker<typeof import('$lib/ttsWorker')>(
            new URL('$lib/ttsWorker', import.meta.url), {
                name: 'ttsComlink',
                type: 'module',
            }
        );
        
      }
    }
  }

  async function asyncSpeak() {
    console.log(await ttsWorker.speak('hello worlffsdfad'));
    let blob = await ttsWorker.getSpeech('hello worlffsdfad');    
    const audio = new Audio();
    audio.src = URL.createObjectURL(blob);
    audio.play();
  }

    function handleAddTime() {
        if (newTime) {
            // Add a new time with an initial blank checklist item
            const newTimeId = crypto.randomUUID();
            alertTimes.value.push({ 
                id: newTimeId, 
                time: newTime, 
                items: [{ id: crypto.randomUUID(), name: '', isCompleted: false }] 
            });
            // Initialize newItemName for this time slot
            newItemName[newTimeId] = '';
            newTime = '';
        }
    }

    function handleEditTime(alertTimeId: string) {
        if (newTime && editingTimeId === alertTimeId) {
            alertTimes.value = alertTimes.value.map(at => 
                at.id === alertTimeId ? { ...at, time: newTime } : at
            );
            newTime = '';
            editingTimeId = '';
        } else {
            const time = alertTimes.value.find(at => at.id === alertTimeId)?.time || '';
            newTime = time;
            editingTimeId = alertTimeId;
        }
    }

    function handleAddItem(alertTimeId: string) {
        if (newItemName[alertTimeId]) {
            alertTimes.value.find(at => at.id === alertTimeId)!.items.push({
                id: crypto.randomUUID(),
                name: newItemName[alertTimeId],
                isCompleted: false
            });
            newItemName[alertTimeId] = '';
            
            // Preload audio for the updated checklist
            const alertTime = alertTimes.value.find(at => at.id === alertTimeId);
            if (alertTime) {
                preloadAnnouncement(alertTime).catch(console.error);
            }
        }
    }

    function handleAddBlankItem(alertTimeId: string) {
        // Find the time and add the item directly
        const alertTime = alertTimes.value.find(at => at.id === alertTimeId);
        if (alertTime) {
            alertTime.items.push({
                id: crypto.randomUUID(),
                name: '',
                isCompleted: false
            });
            // Force a reactive update
            alertTimes.value = [...alertTimes.value];
        }
    }

    function handleUpdateItemName(alertTimeId: string, itemId: string, newName: string) {
        // Find the item directly and update it without recreating the entire structure
        const alertTime = alertTimes.value.find(at => at.id === alertTimeId);
        if (alertTime) {
            const item = alertTime.items.find(item => item.id === itemId);
            if (item) {
                item.name = newName;
                // Force a reactive update
                alertTimes.value = [...alertTimes.value];
            }
        }
    }

    function handleRemoveItem(alertTimeId: string, itemId: string) {

        // Find the time and remove the item directly
        const alertTime = alertTimes.value.find(at => at.id === alertTimeId);
        if (alertTime) {
            alertTime.items = alertTime.items.filter(item => item.id !== itemId);
            // Force a reactive update
            alertTimes.value = [...alertTimes.value];
        }
    }

    function toggleChecklistItem(alertTimeId: string, itemId: string) {
        
        // Find and update the item directly
        const alertTime = alertTimes.value.find(at => at.id === alertTimeId);
        if (alertTime) {
            const item = alertTime.items.find(item => item.id === itemId);
            if (item) {
                item.isCompleted = !item.isCompleted;
                // Force a reactive update
                alertTimes.value = [...alertTimes.value];
                
                // Update audio cache immediately for completion status changes
                // as this directly affects what will be announced
                console.log('Updating audio cache after completion status change');
                clearCache(alertTimeId);
                preloadAnnouncement(alertTime).catch(console.error);
            }
        }
    }

    function isTimeToReset(): boolean {
        if (!lastAnnouncedDate.value) return false;
        const today = new Date().toISOString().split('T')[0];
        return lastAnnouncedDate.value != today;
    }

    function isTimeMatch(alertTime: AlertTime): boolean {
        const now = new Date();
        const [hours, minutes] = alertTime.time.split(':').map(Number);
        return now.getHours() === hours && now.getMinutes() === minutes;
    }

    function announceItems(alertTime: AlertTime) {
        const incompleteItems = alertTime.items.filter(item => !item.isCompleted);
        if (incompleteItems.length > 0) {
            playAlert();
            const itemText = incompleteItems.map(item => item.name).join(', ');
            const text = `Time for ${alertTime.time}. You need to: ${itemText}`;
            
            // For test compatibility, use speak in test environment
            if (typeof window === 'undefined' || !('speechSynthesis' in window)) {
                speak(text);
            } else {
                playAnnouncement(alertTime).catch(error => {
                    console.error('Failed to play announcement:', error);
                });
            }
        }
    }

    function checkTimes() {
        if (isSetupMode.value) return;

        // Reset items for a new day when needed
        if (isTimeToReset()) {
            alertTimes.value = alertTimes.value.map(at => ({
                ...at,
                items: at.items.map(item => ({ ...item, isCompleted: false }))
            }));
            lastAnnouncedTime.value = '';
            lastAnnouncedDate.value = '';
            
            // Clear all audio caches for the new day
            clearCache();
        }

        // Preload announcements for the next hour
        const now = new Date();
        const nextHour = new Date(now.getTime() + 60 * 60 * 1000);
        alertTimes.value.forEach(alertTime => {
            const [hours, minutes] = alertTime.time.split(':').map(Number);
            const alertDate = new Date();
            alertDate.setHours(hours, minutes, 0, 0);
            
            // If the alert time is within the next hour, preload its announcement
            if (alertDate > now && alertDate <= nextHour) {
                preloadAnnouncement(alertTime).catch(console.error);
            }
        });

        alertTimes.value.forEach(alertTime => {
            if (isTimeMatch(alertTime) && lastAnnouncedTime.value !== alertTime.time) {
                lastAnnouncedDate.value = new Date().toISOString().split('T')[0];
                lastAnnouncedTime.value = alertTime.time;
                announceItems(alertTime);
            }
        });
    }

    onMount(() => {
        checkInterval = window.setInterval(checkTimes, 1000);
        
        initWebWorker();
        // Initial preload of announcements
        if (!isSetupMode.value) {
            alertTimes.value.forEach(alertTime => {
                preloadAnnouncement(alertTime).catch(console.error);
            });
        }
    });

    onDestroy(() => {
        if (checkInterval) clearInterval(checkInterval);
        cancelSpeech();
        clearCache();
    });

    // Watch for changes to isSetupMode and rebuild audio cache when switching to checklist mode
    $: if (isSetupMode.value === false) {
        console.log('Switched to checklist mode, rebuilding audio cache');
        clearCache();
        alertTimes.value.forEach(alertTime => {
            preloadAnnouncement(alertTime).catch(console.error);
            console.log(`Preloaded announcement for ${alertTime.time}`);
        });
        console.log('Audio cache rebuilt');
    }
</script>

<main class="min-h-screen bg-gray-50 dark:bg-gray-900">
    <Clock />
    <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
        {#if isSetupMode.value}
            <TimeSetup bind:newTime onAddTime={handleAddTime} />
        {:else}
            <h2 class="text-2xl font-bold text-gray-900 dark:text-white mb-6">Daily Checklist</h2>
        {/if}

        {#each alertTimes.value as alertTime}
            <AlertTimeBlock
                {alertTime}
                isSetupMode={isSetupMode.value}
                bind:editingTimeId
                bind:newTime
                {newItemName}
                onEditTime={handleEditTime}
                onRemoveTime={(id) => alertTimes.value = alertTimes.value.filter(at => at.id !== id)}
                onAddItem={handleAddItem}
                onAddBlankItem={handleAddBlankItem}
                onToggleItem={toggleChecklistItem}
                onUpdateItemName={handleUpdateItemName}
                onRemoveItem={handleRemoveItem}
                onManualAlert={announceItems}
            />
        {/each}

        {#if isSetupMode.value}
            <div class="flex justify-center mt-12">
                <ClearDataButton />
            </div>
        {/if}
    </div>

    <ModeToggle bind:isSetupMode={isSetupMode.value} />





<!-- temporary web worker testing stuff -->
<div class="flex w-full h-dvh items-center justify-center">
    <div class="p-6 bg-gray-50 rounded flex flex-col gap-y-4 min-w-[500px] shadow-xl border border-gray-150">
      <h1 class="text-xl font-bold">Web Worker in Sveltekit</h1>
      <p class="max-w-prose text-sm">
        This is a simple setup that demonstrates the use of <a class="underline decoration-blue-700" href="https://developer.mozilla.org/en-US/docs/Web/API/Web_Workers_API/Using_web_workers"
          >web workers</a
        > in Sveltekit.
      </p>
  
      <dl class="grid grid-cols-2 items-center text-sm">
        <dt>worker status</dt>
        <dd><pre>{workerStatus}</pre></dd>
        <dt>worker message</dt>
        <dd><pre>{workerMessage}</pre></dd>
        <dt>result</dt>
        <dd><pre>{result}</pre></dd>
      </dl>
  
      <progress class="accent-blue w-full bg-white border border-gray-200 rounded" max={total} value={step} />
  
      <div class="grid grid-cols-2 gap-x-2 w-full">
        
        <button 
        on:click={asyncSpeak}>
        comlink calc</button>
        
      </div>
      <footer>
        <span class="text-sm"
          >See the source code at <a class="underline decoration-blue-700" href="https://github.com/jnsprnw/webworker-sveltekit">https://github.com/jnsprnw/webworker-sveltekit</a>.</span
        >
      </footer>
    </div>
  </div>
<!-- end temp web worker testing stuff -->  

</main>

<style lang="postcss">
    @reference "tailwindcss/theme";
    :global(html) {
        background-color: theme(colors.gray.50);
    }
</style>
