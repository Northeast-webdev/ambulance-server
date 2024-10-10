<script>
  // frontend/src/routes/Patients/index.svelte
  import { onMount } from "svelte";
  import LoadingList from "../../components/LoadingList.svelte";

  let patients = [];
  let loading = false;

  const getPatients = async () => {
    loading = true;
    fetch(import.meta.env.VITE_API_URL + "/api/patient", {
      method: "GET",
      headers: {
        Authorization: `Bearer ${localStorage.getItem("token")}`,
      },
    })
      .then((response) => response.json())
      .then((data) => {
        patients = data.patients;
        console.log(patients);
      })
      .catch((error) => {
        console.error("Error:", error);
      })
      .finally(() => {
        loading = false;
      });
  };

  onMount(getPatients);
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
            <th class="py-3 px-6 text-left uppercase font-semibold text-sm">
              Nome
            </th>
            <th class="py-3 px-6 text-left uppercase font-semibold text-sm">
              Numero di Corsi
            </th>
            <th class="py-3 px-6 text-left uppercase font-semibold text-sm">
              Corse completate
            </th>
          </tr>
        </thead>
        <tbody>
          {#each patients as patient}
            <tr class="border-b border-gray-200">
              <td class="py-3 px-6 text-left whitespace-nowrap">
                <div class="flex items-center">
                  <span class="font-medium">{patient.name}</span>
                </div>
              </td>
              <td class="py-3 px-6 text-left whitespace-nowrap">
                <div class="flex items-center">
                  <span class="font-medium">{patient.runs.length}</span>
                </div>
              </td>
              <td class="py-3 px-6 text-left whitespace-nowrap">
                <div class="flex items-center">
                  <span class="font-medium"
                    >{patient.runs.filter((run) => run.status === "completed")
                      .length}</span
                  >
                </div>
              </td>
            </tr>
          {/each}
        </tbody>
      </table>
    </div>
  </div>
{/if}
