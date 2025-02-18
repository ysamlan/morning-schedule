<script lang="ts">
    import { appStore } from '$lib/store';
    import type { AlertTime, ChecklistItem } from '$lib/types';
    import { onMount, onDestroy } from 'svelte';
    import { playAlert, playSuccess, speak, cancelSpeech } from '$lib/audio';
    
    let newTime = '';
    let newItemName: { [key: string]: string } = {};
    let checkInterval: number;

    function handleAddTime() {
        if (newTime) {
            appStore.addAlertTime(newTime);
            newTime = '';
        }
    }

    function handleAddItem(alertTimeId: string) {
        if (newItemName[alertTimeId]) {
            appStore.addChecklistItem(alertTimeId, newItemName[alertTimeId]);
            newItemName[alertTimeId] = '';
        }
    }

    function checkLastAlertTime(): boolean {
        if (!$appStore.alertTimes.length) return false;
        const lastTime = $appStore.alertTimes[$appStore.alertTimes.length - 1].time;
        const now = new Date();
        const [hours, minutes] = lastTime.split(':').map(Number);
        const lastTimeDate = new Date();
        lastTimeDate.setHours(hours, minutes, 0, 0);
        return now > lastTimeDate;
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
        if ($appStore.isSetupMode) return;

        $appStore.alertTimes.forEach(alertTime => {
            if (isTimeMatch(alertTime) && $appStore.lastAnnouncedTime !== alertTime.time) {
                appStore.setLastAnnouncedTime(alertTime.time);
                announceItems(alertTime);
            }
        });
    }

    function isLastTimeLastItem(alertTime: AlertTime, item: ChecklistItem): boolean {
        const lastTime = $appStore.alertTimes[$appStore.alertTimes.length - 1];
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

    $: if (!$appStore.isSetupMode && checkLastAlertTime()) {
        appStore.resetChecklist();
    }
</script>

<main>
    <button on:click={() => appStore.toggleMode()}>
        Switch to {$appStore.isSetupMode ? 'Daily Checklist' : 'Setup'} Mode
    </button>

    {#if $appStore.isSetupMode}
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

            {#each $appStore.alertTimes as alertTime}
                <div>
                    <h3>{alertTime.time}</h3>
                    <button on:click={() => appStore.removeAlertTime(alertTime.id)}>
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
                                <button on:click={() => appStore.removeChecklistItem(alertTime.id, item.id)}>
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
            {#each $appStore.alertTimes as alertTime}
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
                                            appStore.toggleChecklistItem(alertTime.id, item.id);
                                            const currentAlertTime = $appStore.alertTimes.find(at => at.id === alertTime.id);
                                            if (currentAlertTime?.items.every(i => i.isCompleted)) {
                                                playSuccess();
                                                appStore.setCompletionAnimation(alertTime.id, true);
                                                speak("Great job! You've completed all tasks for this time!");
                                                setTimeout(() => {
                                                    appStore.setCompletionAnimation(alertTime.id, false);
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
