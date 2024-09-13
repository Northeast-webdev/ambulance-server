<script>
  import { onMount } from "svelte";
  import { fade } from "svelte/transition";
  import LoadingList from "../../components/LoadingList.svelte";

  let runs = [];
  let show_form = false;
  let loading = false;
  let meta_verifier = {
    Title: "title",
    Ora: "ora",
    Paziente: "paziente",
    Servizio: "servizio",
    "Tipo di servizio": "tipo_di_servizio",
    "C/S/B": "csb",
    Partenza: "partenza",
    Arrivo: "arrivo",
    "N. Richiesta": "n_richiesta",
    Ricevuta: "ricevuta",
    Viaggi: "viaggio",
    Tel: "tel",
  };
  let new_run = {
    csb: "",
    ora: "",
    paziente: "",
    servizio: "",
    tel: "",
    tipo_di_servizio: "",
    partenza: "",
    arrivo: "",
    n_richiesta: "",
    ricevuta: "",
    viaggio: "",
    title: "",
  };
  onMount(async () => {
    loading = true;
    fetch(import.meta.env.VITE_API_URL + "/api/runs", {
      method: "GET",
      headers: {
        Authorization: `Bearer ${localStorage.getItem("token")}`,
      },
    })
      .then((response) => response.json())
      .then((data) => {
        runs = data.runs;
      })
      .catch((error) => {
        console.error("Error:", error);
      })
      .finally(() => {
        loading = false;
      });
  });

  function newRunToggle() {
    show_form = !show_form;
  }

  async function newRun() {
    try {
      const { title, ...meta } = new_run;
      const response = await fetch(import.meta.env.VITE_API_URL + "/api/runs", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
        body: JSON.stringify({ meta, title }),
      });
      const data = await response.json();
      runs = [...runs, data.run];
      show_form = false;
      new_run = {
        csb: "",
        ora: "",
        paziente: "",
        servizio: "",
        tel: "",
        tipo_di_servizio: "",
        partenza: "",
        arrivo: "",
        n_richiesta: "",
        ricevuta: "",
        viaggio: "",
        title: "",
      };
    } catch (error) {
      console.error("Error:", error);
    }
  }
</script>

{#if loading}
  <LoadingList />
{:else}
  <div class="container mx-auto py-6 px-3">
    <div class="flex justify-between items-center mb-6">
      <h1 class="text-3xl font-bold">Runs</h1>
      <button
        on:click={newRunToggle}
        class="bg-green-600 hover:bg-green-800 transition text-white font-bold py-2 px-6 rounded-lg flex items-center justify-center gap-2 shadow-md"
      >
        <span class="text-2xl">+</span>
        <span>New Run</span>
      </button>
    </div>

    <!-- Table Container with Overflow for Responsiveness -->
    <div class="overflow-x-auto">
      <table
        class="min-w-full border-collapse shadow-lg rounded-lg overflow-hidden"
      >
        <thead class="bg-gradient-to-l from-gray-200 to-gray-300">
          <tr>
            {#each Object.keys(meta_verifier) as key}
              {#if key !== "Title"}
                <th
                  class="py-3 px-4 text-left font-semibold text-gray-700 border-b"
                  >{key}</th
                >
              {/if}
            {/each}
          </tr>
        </thead>
        <tbody>
          {#each runs as run, index}
            <tr
              class="{index % 2 === 0
                ? 'bg-white'
                : 'bg-gray-100'} border-b border-l"
            >
              {#each Object.keys(meta_verifier) as key}
                {#if key !== "Title"}
                  <td class="py-3 px-4 border-r"
                    >{run.meta[meta_verifier[key]]}</td
                  >
                {/if}
              {/each}
            </tr>
          {/each}
        </tbody>
      </table>
    </div>
  </div>
{/if}

{#if show_form}
  <!-- Modal Background -->
  <div
    transition:fade={{ duration: 300 }}
    class="fixed inset-0 z-40 flex items-center justify-center bg-white bg-opacity-80 backdrop-blur-sm transition-opacity duration-500"
  >
    <!-- Form Modal -->
    <div
      class="relative max-w-screen-lg w-full max-h-[80vh] overflow-y-auto bg-white p-8 rounded-xl border-2 shadow-xl z-50 transform transition-all duration-500"
    >
      <button
        class="absolute text-3xl top-4 right-4 text-gray-600 hover:text-gray-800"
        on:click={newRunToggle}
        aria-label="Close form"
      >
        ✕
      </button>
      <h2 class="text-3xl font-bold text-center mb-6">Add a New Run</h2>
      <form on:submit|preventDefault={newRun} class="space-y-6">
        <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
          {#each Object.keys(meta_verifier) as key}
            <div>
              <label
                for="field-{key}"
                class="block text-sm font-medium text-gray-700 mb-1"
              >
                {key} <span class="text-red-500">*</span>
              </label>
              <input
                type="text"
                required
                id="field-{key}"
                class="block w-full border valid:border-green-500 outline-none border-gray-300 rounded-lg p-3 focus:ring-2 focus:ring-green-600 transition-all"
                bind:value={new_run[meta_verifier[key]]}
              />
            </div>
          {/each}
        </div>
        <div class="flex gap-4 mt-4">
          <button
            type="submit"
            class="bg-green-600 hover:bg-green-700 text-white font-bold py-3 px-4 rounded-lg flex-1 transition duration-200"
          >
            Submit
          </button>
          <button
            type="reset"
            class="bg-yellow-400 hover:bg-yellow-500 text-black font-bold py-3 px-4 rounded-lg flex-1 transition duration-200"
          >
            Reset
          </button>
        </div>
      </form>
    </div>
  </div>
{/if}
