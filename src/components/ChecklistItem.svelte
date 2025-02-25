<script lang="ts">
    import type { ChecklistItem } from '$lib/types';
    import XMarkIcon from './icons/XMarkIcon.svelte';
    
    export let item: ChecklistItem;
    export let isSetupMode: boolean;
    export let onToggle: () => void;
    export let onRemove: () => void;
</script>

<div class="flex items-center justify-between">
    {#if isSetupMode}
        <div class="flex items-center gap-2">
            <span class="text-gray-700 dark:text-gray-300">{item.name}</span>
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
