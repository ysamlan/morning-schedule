<script lang="ts">
    export let newTime: string;
    export let onAddTime: () => void;
</script>

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
            on:click={onAddTime}
            class="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
        >
            Add Time
        </button>
    </div>
</div>
