<script>
  import { onMount } from "svelte";
  import LoadingList from "../../components/LoadingList.svelte";

  let checklists = [];
  let loading = false;
  let meta_verifier = {
    Driver: "driver",
    Brand: "brand",
    Model: "model",
    Kilometers: "kilometers",
    "Plate Number": "plate_number",
    "Carbon Level": "carbon_level",
  };

  const getChecklists = async () => {
    loading = true;
    fetch(import.meta.env.VITE_API_URL + "/api/car-checklist", {
      method: "GET",
      headers: {
        Authorization: `Bearer ${localStorage.getItem("token")}`,
      },
    })
      .then((response) => response.json())
      .then((data) => {
        checklists = data.checklists;
      })
      .catch((error) => {
        console.error("Error:", error);
      })
      .finally(() => {
        loading = false;
      });
  };

  onMount(getChecklists);
</script>

{#if loading}
  <LoadingList />
{:else}
  <div class="container mx-auto py-6 px-3">
    <div class="flex justify-between items-center mb-6">
      <h1 class="text-3xl font-bold">Car Checklists</h1>
    </div>

    <!-- Table Container with Overflow for Responsiveness -->
    <div class="overflow-x-auto">
      <table
        class="min-w-full border-collapse shadow-lg rounded-lg overflow-hidden"
      >
        <thead class="bg-gradient-to-l from-gray-200 to-gray-300">
          <tr>
            {#each Object.keys(meta_verifier) as key}
              <th
                class="py-3 px-4 text-left font-semibold text-gray-700 border-b"
                >{key}</th
              >
            {/each}
          </tr>
        </thead>
        <tbody>
          {#each checklists as run}
            <tr class="bg-gray-50 border-b border-l">
              {#each Object.keys(meta_verifier) as key}
                <td class="py-3 px-4 border-r border-inherit"
                  >{run.checklist[meta_verifier[key]]}</td
                >
              {/each}
            </tr>
          {/each}
        </tbody>
      </table>
    </div>
  </div>
{/if}
