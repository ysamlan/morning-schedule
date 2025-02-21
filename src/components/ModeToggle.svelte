<script lang="ts">
    export let isSetupMode: boolean;
</script>

<button 
    on:click={() => isSetupMode = !isSetupMode}
    class="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
>
    Switch to {isSetupMode ? 'Daily Checklist' : 'Setup'} Mode
</button>
