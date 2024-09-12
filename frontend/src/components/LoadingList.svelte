<script>
  // You can add any necessary logic here
</script>

<div class="container mx-auto p-6 animate-pulse">
  <!-- Header Skeleton -->
  <div class="flex justify-between items-center mb-6">
    <div class="h-8 w-32 bg-gray-300 rounded-md"></div>
    <div class="h-12 w-36 bg-gray-300 rounded-lg"></div>
  </div>

  <!-- Table Skeleton -->
  <div class="overflow-x-auto">
    <div class="min-w-full border-collapse shadow-lg rounded-lg overflow-hidden">
      <!-- Table Header Skeleton -->
      <div class="flex bg-gradient-to-l from-gray-200 to-gray-300 p-2">
        {#each Array(5) as _, i}
          <div class="h-8 w-24 bg-gray-300 rounded-md mr-4"></div>
        {/each}
      </div>

      <!-- Table Body Skeleton -->
      <div>
        {#each Array(6) as _, rowIndex}
          <div class="flex {rowIndex % 2 === 0 ? 'bg-white' : 'bg-gray-100'} p-2">
            {#each Array(5) as _, colIndex}
              <div class="h-6 w-1/5 bg-gray-200 rounded-md mr-4"></div>
            {/each}
          </div>
        {/each}
      </div>
    </div>
  </div>
</div>