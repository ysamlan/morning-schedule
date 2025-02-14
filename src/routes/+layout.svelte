<script lang="ts">
	let { children } = $props();
  import "../app.css";
</script>

<nav>
	<a href="/">Home</a>
</nav>

{@render children()}