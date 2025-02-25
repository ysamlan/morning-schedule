<script lang="ts">
    import type { AlertTime } from '$lib/types';
    import ChecklistItem from './ChecklistItem.svelte';
    
    export let alertTime: AlertTime;
    export let isSetupMode: boolean;
    export let editingTimeId: string;
    export let newTime: string;
    export let newItemName: { [key: string]: string };
    export let onEditTime: (id: string) => void;
    export let onRemoveTime: (id: string) => void;
    export let onAddItem: (id: string) => void;
    export let onToggleItem: (timeId: string, itemId: string) => void;
    export let onRemoveItem: (timeId: string, itemId: string) => void;
    export let onManualAlert: (alertTime: AlertTime) => void;
</script>

<div class="bg-white dark:bg-gray-800 shadow rounded-lg p-6 space-y-4">
    <div class="flex items-center justify-between">
        {#if editingTimeId === alertTime.id}
            <div class="flex gap-2">
                <input
                    type="time"
                    bind:value={newTime}
                    class="shadow-sm focus:ring-indigo-500 focus:border-indigo-500 block w-48 sm:text-sm border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-md"
                />
                <button 
                    on:click={() => onEditTime(alertTime.id)}
                    class="inline-flex items-center px-3 py-1.5 border border-transparent text-xs font-medium rounded-md text-indigo-700 dark:text-indigo-200 bg-indigo-100 dark:bg-indigo-900 hover:bg-indigo-200 dark:hover:bg-indigo-800 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                >
                    Save
                </button>
            </div>
        {:else}
            <div class="flex gap-2 items-center">
                <h3 class="text-lg font-medium text-gray-900 dark:text-white">{alertTime.time}</h3>
                {#if isSetupMode}
                    <button 
                        on:click={() => onEditTime(alertTime.id)}
                        class="inline-flex items-center px-3 py-1.5 border border-transparent text-xs font-medium rounded-md text-indigo-700 dark:text-indigo-200 bg-indigo-100 dark:bg-indigo-900 hover:bg-indigo-200 dark:hover:bg-indigo-800 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                    >
                        Edit
                    </button>
                {:else}
                    <button 
                        on:click={() => onManualAlert(alertTime)}
                        class="inline-flex items-center px-3 py-1.5 border border-transparent text-xs font-medium rounded-md text-indigo-700 dark:text-indigo-200 bg-indigo-100 dark:bg-indigo-900 hover:bg-indigo-200 dark:hover:bg-indigo-800 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                    >
                        Run Alert
                    </button>
                {/if}
            </div>
        {/if}
        
        {#if isSetupMode}
            <button 
                on:click={() => onRemoveTime(alertTime.id)}
                class="inline-flex items-center px-3 py-1.5 border border-transparent text-xs font-medium rounded-md text-red-700 dark:text-red-200 bg-red-100 dark:bg-red-900 hover:bg-red-200 dark:hover:bg-red-800 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
            >
                Remove Time
            </button>
        {/if}
    </div>
    
    {#if isSetupMode}
        <div class="flex gap-4 items-center">
            <input
                type="text"
                bind:value={newItemName[alertTime.id]}
                placeholder="Add new checklist item"
                class="shadow-sm focus:ring-indigo-500 focus:border-indigo-500 block w-full sm:text-sm border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-md"
            />
            <button 
                on:click={() => onAddItem(alertTime.id)}
                class="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 dark:bg-indigo-800 dark:hover:bg-indigo-900 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
            >
                Add Item
            </button>
        </div>
    {/if}
    
    <div class="space-y-2">
        {#each alertTime.items as item}
            <ChecklistItem
                {item}
                {isSetupMode}
                onToggle={() => onToggleItem(alertTime.id, item.id)}
                onRemove={() => onRemoveItem(alertTime.id, item.id)}
            />
        {/each}
    </div>
</div>
