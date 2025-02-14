<script lang="ts">
    import { appStore } from '$lib/store';
    import type { AlertTime } from '$lib/types';
    
    let newTime = '';
    let newItemName: { [key: string]: string } = {};

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
                <div>
                    <h3>{alertTime.time}</h3>
                    <ul>
                        {#each alertTime.items as item}
                            <li>
                                <label>
                                    <input
                                        type="checkbox"
                                        checked={item.isCompleted}
                                        on:change={() => appStore.toggleChecklistItem(alertTime.id, item.id)}
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
