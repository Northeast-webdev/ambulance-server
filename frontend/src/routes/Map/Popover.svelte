<script>
  export let driver;
  export let onOpenPopup; // Function to open the popup
</script>

<div class="text-sm text-gray-800 min-w-44 min-h-16">
  <p class="font-semibold m-0">Driver: {driver.name}</p>
  <p class="font-bold m-0">
    Status: <span
      class="{driver.status === 'Available'
        ? 'bg-green-500 text-green-100 p-2 rounded-full'
        : driver.status === 'Busy'
          ? 'bg-yellow-500 text-yellow-100 p-2 rounded-full'
          : 'bg-red-500 text-red-100 p-2 rounded-full'} text-sm"
      >{driver.status === "Available"
        ? "Disponibile"
        : driver.status === "Busy"
          ? "Pausa"
          : "Non disponibile"}</span
    >
  </p>
  {#if driver.status === "Available"}
    <!-- Button to open the new popup -->
    <button
      class="bg-lime-700 hover:bg-lime-900 text-white font-bold py-2 px-6 rounded-lg w-full mt-4"
      on:click={onOpenPopup}
    >
      Nuova corsa
    </button>
  {/if}
</div>
