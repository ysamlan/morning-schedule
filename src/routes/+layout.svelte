<script lang="ts">
	let { children } = $props();
  import "../app.css";
  import { SvelteToast } from '@zerodevx/svelte-toast';

  const toastOptions = {
    duration: 4000,
    pausable: true,
    dismissable: true,
    theme: {
      '--toastBackground': '#4F46E5', // indigo-600
      '--toastColor': 'white',
      '--toastBarBackground': '#E0E7FF' // indigo-100
    }
  };
</script>

<nav class="bg-white dark:bg-gray-800 shadow-sm border-b border-gray-200 dark:border-gray-700">
  <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
    <div class="flex justify-between h-16">
      <div class="flex">
        <div class="flex-shrink-0 flex items-center">
          <a href="/" class="text-xl font-bold text-indigo-600 dark:text-indigo-400">Morning Tasks</a>
        </div>
      </div>
    </div>
  </div>
</nav>

<main>
  {@render children()}
</main>

<SvelteToast options={toastOptions} />