<script lang="ts">
  let count = 0;
  function inc() { count += 1 }
</script>

<h1>你好，SvelteKit！</h1>
<p>计数器：{count}</p>
<button on:click={inc} class="btn">+1</button>

<style>
  .btn { padding: 8px 12px; background:#2563eb; color:#fff; border-radius:6px; }
</style>