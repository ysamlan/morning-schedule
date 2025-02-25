<script lang="ts">
    import { onMount, onDestroy } from 'svelte';
    
    let time = new Date();
    let interval: ReturnType<typeof setInterval>;
    
    onMount(() => {
        interval = setInterval(() => {
            time = new Date();
        }, 1000);
    });
    
    onDestroy(() => {
        if (interval) clearInterval(interval);
    });
    
    function formatTime(date: Date): string {
        return date.toLocaleTimeString('en-US', { 
            hour: 'numeric',
            minute: '2-digit',
            hour12: true 
        });
    }
</script>

<div class="sticky top-0 z-10 bg-white/80 backdrop-blur-sm dark:bg-gray-800/80 py-3 px-4 border-b border-gray-200 dark:border-gray-700">
    <div class="text-center">
        <time class="text-3xl font-light tracking-wide text-gray-800 dark:text-gray-200">
            {formatTime(time)}
        </time>
    </div>
</div>
