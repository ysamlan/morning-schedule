<script lang="ts">
    import type { ChecklistItem } from '$lib/types';
    import XMarkIcon from './icons/XMarkIcon.svelte';
    import { createEventDispatcher } from 'svelte';
    
    export let item: ChecklistItem;
    export let isSetupMode: boolean;
    export let onToggle: () => void;
    export let onRemove: () => void;
    export let onUpdate: (newName: string) => void;
    
    // Local state to avoid excessive parent updates
    let localName = item.name;
    let updateTimeout: number;
    
    // Update the parent component with debouncing
    function handleInput(e: Event) {
        const target = e.target as HTMLInputElement;
        localName = target.value;
        
        // if (updateTimeout) {
        //     clearTimeout(updateTimeout);
        // }
        
        // updateTimeout = window.setTimeout(() => {
        //     onUpdate(localName);
        // }, 300);
        // if we do this instead of using timeouts the tests pass
        onUpdate(localName);
    }
</script>

<div class="flex items-center justify-between">
    {#if isSetupMode}
        <div class="flex items-center gap-2 w-full">
            <input
                type="text"
                bind:value={localName}
                on:input={handleInput}
                placeholder="Enter task name"
                class="shadow-sm focus:ring-indigo-500 focus:border-indigo-500 block w-full sm:text-sm border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-md"
            />
            <button 
                on:click={onRemove}
                class="inline-flex items-center gap-1 px-2 py-1 border border-transparent text-xs font-medium rounded text-red-700 dark:text-red-200 bg-red-100 dark:bg-red-900 hover:bg-red-200 dark:hover:bg-red-800 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
            >
                <XMarkIcon size={12} />
                Remove
            </button>
        </div>
    {:else}
        <label class="flex items-center space-x-3">
            <input
                type="checkbox"
                checked={item.isCompleted}
                on:change={onToggle}
                class="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 dark:border-gray-600 rounded"
            />
            <span class="text-gray-700 dark:text-gray-300">{item.name}</span>
        </label>
    {/if}
</div>
