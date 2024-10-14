<script>
  import { onMount } from "svelte";
  import LoadingList from "../../components/LoadingList.svelte";

  let checklists = [];
  let loading = false;
  let meta_verifier = {
    Marca: "brand",
    Modello: "model",
    Chilometri: "kilometers",
    Targa: "plate_number",
    "Livello carburante": "carbon_level",
  };

  const getChecklists = async () => {
    loading = true;
    fetch(import.meta.env.VITE_API_URL + "/api/material-checklist", {
      method: "GET",
      headers: {
        Authorization: `Bearer ${localStorage.getItem("token")}`,
      },
    })
      .then((response) => response.json())
      .then((data) => {
        checklists = data.checklists;
        console.log(checklists);
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
      <h1 class="text-3xl font-bold">Materiali Checklist</h1>
    </div>

    <!-- Table Container with Overflow for Responsiveness -->
    <div class="overflow-x-auto">
      <table
        class="min-w-full border-collapse shadow-lg rounded-lg overflow-hidden"
      >
        <thead class="bg-gradient-to-l from-gray-200 to-gray-300">
          <tr>
            <th class="py-3 px-4 text-left font-semibold text-gray-700 border-b"
              >Autista</th
            >
            {#each Object.keys(meta_verifier) as key}
              <th
                class="py-3 px-4 text-left font-semibold text-gray-700 border-b"
                >{key}</th
              >
            {/each}
            <th class="py-3 px-4 text-left font-semibold text-gray-700 border-b"
              >PDF Link</th
            >
          </tr>
        </thead>
        <tbody>
          {#each checklists as run}
            <tr class="bg-gray-50 border-b border-l">
              <td class="py-3 px-4 border-r border-inherit"
                >{run.user.first_name} {run.user.last_name}</td
              >
              {#each Object.keys(meta_verifier) as key}
                <td class="py-3 px-4 border-r border-inherit"
                  >{run.car.meta[meta_verifier[key]] || "-"}</td
                >
              {/each}
              <td class="py-3 px-4 border-r border-inherit">
                <a
                  href={import.meta.env.VITE_API_URL +
                    "/api/checklist/" +
                    run._id +
                    "/pdf"}
                  target="_blank"
                  class="bg-blue-500 flex gap-4 items-center justify-center hover:bg-blue-700 text-white font-bold py-2 px-4 rounded"
                  ><span> 📥 </span> <span>Scarica PDF</span>
                </a>
              </td></tr
            >
          {/each}
        </tbody>
      </table>
    </div>
  </div>
{/if}
