<script lang="ts">
const { signInInput } = $props();
</script>

{#if signInInput}
  <h2 class="text-xl font-bold mb-4">Sign-in Data</h2>
  <div class="bg-white p-4 rounded-lg shadow-md">
    {#each Object.entries(signInInput) as [key, value]}
      <div class="flex justify-between py-1 border-b last:border-b-0">
        <span class="font-semibold text-gray-700">{key}:</span>
        <span class="text-gray-600">{value}</span>
      </div>
    {/each}
  </div>
{:else}
  <p>No sign-in data available.</p>
{/if}

<style>
</style>
