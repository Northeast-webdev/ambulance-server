<script>
  export let driver;
  export let onOpenPopup; // Function to open the popup
</script>

<div class="text-sm text-gray-800 min-w-40 min-h-16">
  <p class="font-semibold m-0">Driver: {driver.name}</p>
  <p class="font-bold m-0">
    Status: <span
      class={driver.status === "Available"
        ? "bg-green-500 text-green-100 p-2 rounded-full"
        : driver.status === "Busy"
          ? "bg-amber-500 text-amber-100 p-2 rounded-full"
          : "bg-red-500 text-red-100 p-2 rounded-full"}>{driver.status}</span
    >
  </p>
  {#if driver.status === "Available"}
    <!-- Button to open the new popup -->
    <button
      on:click={onOpenPopup}
      class="mt-2 px-3 py-1 text-white bg-green-500 hover:bg-green-600 rounded shadow"
    >
      Open Popup
    </button>
  {/if}
</div>
