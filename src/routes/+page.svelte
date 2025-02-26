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
        });
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
</main>

<style lang="postcss">
    @reference "tailwindcss/theme";
    :global(html) {
        background-color: theme(colors.gray.50);
    }
</style>
