<script lang="ts">
    import { localStore } from '$lib/localStore.svelte';
    import type { AlertTime, ChecklistItem } from '$lib/types';
    import { onMount, onDestroy } from 'svelte';
    import { playAlert, playSuccess, speak, cancelSpeech } from '$lib/audio';

    let alertTimes = localStore('alertTimes', [] as AlertTime[]);
    let isSetupMode = localStore('isSetupMode', true);
    let lastAnnouncedTime = localStore('lastAnnouncedTime', '');
    let lastAnnouncedDate = localStore('lastAnnouncedDate', '');
    
    let newTime = '';
    let editingTimeId = '';
    let newItemName: { [key: string]: string } = {};
    let checkInterval: number;

    function handleAddTime() {
        if (newTime) {
            alertTimes.value.push({ id: crypto.randomUUID(), time: newTime, items: [] });
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
        }
    }

    function toggleChecklistItem(alertTimeId: string, itemId: string) {
        alertTimes.value = alertTimes.value.map(at => 
            at.id === alertTimeId ? { ...at, items: at.items.map(item => 
                item.id === itemId ? { ...item, isCompleted: !item.isCompleted } : item
            )} : at
        );
    }

    /**
     * Returns true if we've changed days since our last alert fired
     */
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
            speak(`Time for ${alertTime.time}. You need to: ${itemText}`);
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
        }

        alertTimes.value.forEach(alertTime => {
            if (isTimeMatch(alertTime) && lastAnnouncedTime.value !== alertTime.time) {
                lastAnnouncedDate.value = new Date().toISOString().split('T')[0];
                lastAnnouncedTime.value = alertTime.time;
                announceItems(alertTime);
            }
        });
    }

    function isLastTimeLastItem(alertTime: AlertTime, item: ChecklistItem): boolean {
        const lastTime = alertTimes.value[alertTimes.value.length - 1];
        return alertTime.id === lastTime.id && 
               item.id === alertTime.items[alertTime.items.length - 1]?.id;
    }

    onMount(() => {
        checkInterval = window.setInterval(checkTimes, 1000);
    });

    onDestroy(() => {
        if (checkInterval) clearInterval(checkInterval);
        cancelSpeech();
    });



    function setCompletionAnimation(alertTimeId: string, show: boolean) {
        alertTimes.value = alertTimes.value.map(at => 
            at.id === alertTimeId ? { ...at, showCompletionAnimation: show } : at
        );
    }
</script>

<main class="min-h-screen bg-gray-50">
    <div class="flex justify-end mb-6">
        <button 
            on:click={() => isSetupMode.value = !isSetupMode.value}
            class="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
        >
            Switch to {isSetupMode.value ? 'Daily Checklist' : 'Setup'} Mode
        </button>
    </div>

    {#if isSetupMode.value}
        <div class="space-y-8">
            <div>
                <h2 class="text-2xl font-bold text-gray-900 mb-6">Setup Mode</h2>
                <div class="flex gap-4 items-center">
                    <input
                        type="time"
                        bind:value={newTime}
                        placeholder="Add new alert time"
                        class="shadow-sm focus:ring-indigo-500 focus:border-indigo-500 block w-48 sm:text-sm border-gray-300 rounded-md"
                    />
                    <button 
                        on:click={handleAddTime}
                        class="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                    >
                        Add Time
                    </button>
                </div>
            </div>

            {#each alertTimes.value as alertTime}
                <div class="bg-white shadow rounded-lg p-6 space-y-4">
                    <div class="flex items-center justify-between">
                        {#if editingTimeId === alertTime.id}
                            <div class="flex gap-2">
                                <input
                                    type="time"
                                    bind:value={newTime}
                                    class="shadow-sm focus:ring-indigo-500 focus:border-indigo-500 block w-48 sm:text-sm border-gray-300 rounded-md"
                                />
                                <button 
                                    on:click={() => handleEditTime(alertTime.id)}
                                    class="inline-flex items-center px-3 py-1.5 border border-transparent text-xs font-medium rounded-md text-indigo-700 bg-indigo-100 hover:bg-indigo-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                                >
                                    Save
                                </button>
                            </div>
                        {:else}
                            <div class="flex gap-2 items-center">
                                <h3 class="text-lg font-medium text-gray-900">{alertTime.time}</h3>
                                <button 
                                    on:click={() => handleEditTime(alertTime.id)}
                                    class="inline-flex items-center px-3 py-1.5 border border-transparent text-xs font-medium rounded-md text-indigo-700 bg-indigo-100 hover:bg-indigo-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                                >
                                    Edit
                                </button>
                            </div>
                        {/if}
                        <button 
                            on:click={() => alertTimes.value = alertTimes.value.filter(at => at.id !== alertTime.id)}
                            class="inline-flex items-center px-3 py-1.5 border border-transparent text-xs font-medium rounded-md text-red-700 bg-red-100 hover:bg-red-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
                        >
                            Remove Time
                        </button>
                    </div>
                    
                    <div class="flex gap-4 items-center">
                        <input
                            type="text"
                            bind:value={newItemName[alertTime.id]}
                            placeholder="Add new checklist item"
                            class="shadow-sm focus:ring-indigo-500 focus:border-indigo-500 block w-full sm:text-sm border-gray-300 rounded-md"
                        />
                        <button 
                            on:click={() => handleAddItem(alertTime.id)}
                            class="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 whitespace-nowrap"
                        >
                            Add Item
                        </button>
                    </div>

                    <ul class="space-y-2">
                        {#each alertTime.items as item}
                            <li class="flex items-center justify-between group">
                                <span class="text-gray-700">{item.name}</span>
                                <button 
                                    on:click={() => alertTime.items = alertTime.items.filter(i => i.id !== item.id)}
                                    class="opacity-0 group-hover:opacity-100 transition-opacity inline-flex items-center px-2 py-1 border border-transparent text-xs font-medium rounded text-gray-700 bg-gray-100 hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500"
                                >
                                    Remove
                                </button>
                            </li>
                        {/each}
                    </ul>
                </div>
            {/each}
        </div>
    {:else}
        <div class="space-y-8">
            <h2 class="text-2xl font-bold text-gray-900 mb-6">Daily Checklist</h2>
            {#each alertTimes.value as alertTime}
                <div 
                    class="bg-white shadow rounded-lg p-6 space-y-4 transition-transform"
                    class:completion-animation={alertTime.showCompletionAnimation}
                >
                    <h3 class="text-lg font-medium text-gray-900">{alertTime.time}</h3>
                    <ul class="space-y-3">
                        {#each alertTime.items as item}
                            <li>
                                <label 
                                    class="flex items-center space-x-3 group cursor-pointer"
                                    class:last-item={isLastTimeLastItem(alertTime, item)}
                                >
                                    <input
                                        type="checkbox"
                                        checked={item.isCompleted}
                                        class="h-5 w-5 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded cursor-pointer"
                                        on:change={() => {
                                            toggleChecklistItem(alertTime.id, item.id);
                                            const currentAlertTime = alertTimes.value.find(at => at.id === alertTime.id);
                                            if (currentAlertTime?.items.every(i => i.isCompleted)) {
                                                playSuccess();
                                                setCompletionAnimation(alertTime.id, true);
                                                speak("Great job! You've completed all tasks for this time!");
                                                setTimeout(() => {
                                                    setCompletionAnimation(alertTime.id, false);
                                                }, 2000);
                                            }
                                        }}
                                    />
                                    <span class="text-gray-700 group-hover:text-gray-900 transition-colors">{item.name}</span>
                                </label>
                            </li>
                        {/each}
                    </ul>
                </div>
            {/each}
        </div>
    {/if}
</main>

<style lang="postcss">
    @reference "tailwindcss/theme";
    :global(html) {
      background-color: theme(--color-gray-100);
    }
    .completion-animation {
        animation: celebrate 2s ease-in-out;
    }

    @keyframes celebrate {
        0% { transform: scale(1); }
        25% { transform: scale(1.1); }
        50% { transform: scale(1); }
        75% { transform: scale(1.05); }
        100% { transform: scale(1); }
    }

    .last-item {
        color: var(--color-green-700);
        font-weight: bold;
    }
</style>
