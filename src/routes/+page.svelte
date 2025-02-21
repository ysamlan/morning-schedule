<script lang="ts">
    import { localStore } from '$lib/localStore.svelte';
    import type { AlertTime, ChecklistItem } from '$lib/types';
    import { onMount, onDestroy } from 'svelte';
    import { playAlert, playSuccess, speak, cancelSpeech } from '$lib/audio';
    import ModeToggle from '../components/ModeToggle.svelte';
    import TimeSetup from '../components/TimeSetup.svelte';
    import AlertTimeBlock from '../components/AlertTimeBlock.svelte';
    import ClearDataButton from '../components/ClearDataButton.svelte';

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

    function handleRemoveItem(alertTimeId: string, itemId: string) {
        alertTimes.value = alertTimes.value.map(at => 
            at.id === alertTimeId 
                ? { ...at, items: at.items.filter(item => item.id !== itemId) }
                : at
        );
    }

    function toggleChecklistItem(alertTimeId: string, itemId: string) {
        alertTimes.value = alertTimes.value.map(at => 
            at.id === alertTimeId ? { ...at, items: at.items.map(item => 
                item.id === itemId ? { ...item, isCompleted: !item.isCompleted } : item
            )} : at
        );
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

    onMount(() => {
        checkInterval = window.setInterval(checkTimes, 1000);
    });

    onDestroy(() => {
        if (checkInterval) clearInterval(checkInterval);
        cancelSpeech();
    });
</script>

<main class="min-h-screen bg-gray-50">
    <div class="flex justify-end mb-6">
        <ModeToggle bind:isSetupMode={isSetupMode.value} />
    </div>

    <div class="space-y-8">
        {#if isSetupMode.value}
            <TimeSetup bind:newTime onAddTime={handleAddTime} />
        {:else}
            <h2 class="text-2xl font-bold text-gray-900 mb-6">Daily Checklist</h2>
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
                onToggleItem={toggleChecklistItem}
                onRemoveItem={handleRemoveItem}
            />
        {/each}

        {#if isSetupMode.value}
            <div class="flex justify-center mt-12">
                <ClearDataButton />
            </div>
        {/if}
    </div>
</main>

<style lang="postcss">
    @reference "tailwindcss/theme";
    :global(html) {
        background-color: theme(colors.gray.50);
    }
</style>
