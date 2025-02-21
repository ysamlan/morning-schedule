<script lang="ts">
    import { localStore } from '$lib/localStore.svelte';

    function handleClearData() {
        if (confirm('Are you sure you want to clear all data? This cannot be undone.')) {
            localStore.clearData();
            // Reload the page to reset all the stores
            window.location.reload();
        }
    }
</script>

<button 
    on:click={handleClearData}
    class="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-red-700 bg-red-100 hover:bg-red-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
>
    Clear All Data
</button>
