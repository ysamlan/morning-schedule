<script lang="ts">
    import { localStore } from '$lib/localStore.svelte';
    import type { AlertTime, ChecklistItem } from '$lib/types';
    import { onMount, onDestroy } from 'svelte';
    import { playAlert, playSuccess, speak, cancelSpeech } from '$lib/audio';
    import { differenceInMinutes } from 'date-fns';

    let alertTimes = localStore('alertTimes', [] as AlertTime[]);
    let isSetupMode = localStore('isSetupMode', true);
    let lastAnnouncedTime = localStore('lastAnnouncedTime', '');
    
    let newTime = '';
    let newItemName: { [key: string]: string } = {};
    let checkInterval: number;

    function handleAddTime() {
        if (newTime) {
            alertTimes.value.push({ id: crypto.randomUUID(), time: newTime, items: [] });
            newTime = '';
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
     * Returns true if it's time to reset for the day (30 minutes after the last alert time)
     */
    function isTimeToReset(): boolean {
        if (!alertTimes.value.length) return false;
        const lastTime = alertTimes.value[alertTimes.value.length - 1].time;
        const now = new Date();
        const [hours, minutes] = lastTime.split(':').map(Number);
        const lastTimeDate = new Date().setHours(hours, minutes, 0, 0);
        return differenceInMinutes(now, lastTimeDate) === 30;
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

        alertTimes.value.forEach(alertTime => {
            if (isTimeMatch(alertTime) && lastAnnouncedTime.value !== alertTime.time) {
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

    // TODO only reset if we haven't already for the day (this matters once we start tracking daily stats)
    $: if (!isSetupMode.value && isTimeToReset()) {
        alertTimes.value.map(at => at.items.map(item => item.isCompleted = false));
        lastAnnouncedTime.value= '';
    }


	function setCompletionAnimation(alertTimeId: string, show: boolean) {
		alertTimes.value = alertTimes.value.map(at => 
			at.id === alertTimeId ? { ...at, showCompletionAnimation: show } : at
		);
	}
</script>

<main>
    <button on:click={() => isSetupMode.value = !isSetupMode.value}>
        Switch to {isSetupMode.value ? 'Daily Checklist' : 'Setup'} Mode
    </button>

    {#if isSetupMode.value}
        <div>
            <h2>Setup Mode</h2>
            <div>
                <input
                    type="time"
                    bind:value={newTime}
                    placeholder="Add new alert time"
                />
                <button on:click={handleAddTime}>Add Time</button>
            </div>

            {#each alertTimes.value as alertTime}
                <div>
                    <h3>{alertTime.time}</h3>
                    <button on:click={() => 
                            alertTimes.value = alertTimes.value.filter(at => at.id !== alertTime.id)
                        }>
                        Remove Time
                    </button>
                    
                    <div>
                        <input
                            type="text"
                            bind:value={newItemName[alertTime.id]}
                            placeholder="Add new checklist item"
                        />
                        <button on:click={() => handleAddItem(alertTime.id)}>
                            Add Item
                        </button>
                    </div>

                    <ul>
                        {#each alertTime.items as item}
                            <li>
                                {item.name}
                                <button on:click={() => 
                                    alertTime.items = alertTime.items.filter(i => i.id !== item.id)
                                }>
                                    Remove
                                </button>
                            </li>
                        {/each}
                    </ul>
                </div>
            {/each}
        </div>
    {:else}
        <div>
            <h2>Daily Checklist</h2>
            {#each alertTimes.value as alertTime}
                <div class:completion-animation={alertTime.showCompletionAnimation}>
                    <h3>{alertTime.time}</h3>
                    <ul>
                        {#each alertTime.items as item}
                            <li>
                                <label class:last-item={isLastTimeLastItem(alertTime, item)}>
                                    <input
                                        type="checkbox"
                                        checked={item.isCompleted}
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
                                    {item.name}
                                </label>
                            </li>
                        {/each}
                    </ul>
                </div>
            {/each}
        </div>
    {/if}
</main>

<style>
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
        color: darkgreen;
        font-weight: bold;
    }
</style>
