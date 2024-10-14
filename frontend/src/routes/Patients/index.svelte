<script>
  // frontend/src/routes/Patients/index.svelte
  // @ts-nocheck
  import { onMount } from "svelte";
  import { Link } from "svelte-navigator";
  import { fade } from "svelte/transition";
  import LoadingList from "../../components/LoadingList.svelte";

  let patients = [];
  let loading = false;
  let show_form = false;
  let query = "";
  let meta_verifier = {
    Paziente: "paziente",
    "C/S/B": "csb",
    Servizio: "servizio",
    Tel: "tel",
    "N. Richiesta": "n_richiesta",
    Ricevuta: "ricevuta",
    Viaggi: "viaggio",
    Data: "date",
    Ora: "ora",
    Partenza: "partenza",
    Arrivo: "arrivo",
    "Note particolari": "note_particolari",
  };
  let types = {
    Titolo: "text",
    Ora: "time",
    Paziente: "text",
    Servizio: "select",
    "C/S/B": "select",
    Partenza: "autocomplete",
    Arrivo: "autocomplete",
    "N. Richiesta": "text",
    Ricevuta: "text",
    Viaggi: "number",
    Tel: "tel",
    "Note particolari": "textarea",
    Data: "date",
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
    viaggio: "1",
    date: new Date().toISOString().split("T")[0],
  };

  let options = {
    servizio: [
      { value: "a", text: "A" },
      { value: "b", text: "B" },
      { value: "c", text: "C" },
      { value: "d", text: "D" },
    ],
    csb: [
      { value: "c", text: "C" },
      { value: "s", text: "S" },
      { value: "b", text: "B" },
    ],
  };
  let additionalRuns = [];
  let additionalRunsMeta = {
    Data: "date",
    Ora: "ora",
    Partenza: "partenza",
    Arrivo: "arrivo",
  };

  async function newRun() {
    try {
      const { geometry, end_geometry, paziente, ...newR } = new_run;
      await fetch(import.meta.env.VITE_API_URL + "/api/runs", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
        body: JSON.stringify({
          meta: newR,
          status: "pending",
          additionalRuns: additionalRuns.map((run) => ({
            ...run,
            meta: {
              ...newR,
              partenza: run.partenza,
              arrivo: run.arrivo,
              ora: run.ora,
              data: run.data,
            },
          })),
          patient: paziente,
          geometry: geometry,
          end_geometry: end_geometry,
        }),
      });
      show_form = false;
      getPatients();
    } catch (error) {
      console.error("Error:", error);
    }
  }

  $: (() => {
    if (new_run.viaggio > 1)
      additionalRuns = Array.from({ length: new_run.viaggio - 1 }).map(
        (x, i) =>
          additionalRuns[i] || {
            ora: "",
            partenza: "",
            arrivo: "",
            date: new Date().toISOString().split("T")[0],
          }
      );
    setTimeout(() => {
      for (let i = 0; i < new_run.viaggio - 1; i++) {
        const partenzaInput = document.getElementById(`field-Partenza-${i}`);
        const arrivoInput = document.getElementById(`field-Arrivo-${i}`);
        const partenzaAutocomplete = new google.maps.places.Autocomplete(
          partenzaInput
        );
        const arrivoAutocomplete = new google.maps.places.Autocomplete(
          arrivoInput
        );

        partenzaAutocomplete.addListener("place_changed", () => {
          const place = partenzaAutocomplete.getPlace();
          if (!place.geometry || !place.geometry.location) {
            console.error("No geometry available for the selected place");
            return;
          }
          additionalRuns[i].partenza = place.formatted_address;
          additionalRuns[i].geometry = {
            latitude: place.geometry.location.lat(),
            longitude: place.geometry.location.lng(),
          };
          console.log(
            "Selected place:",
            place.formatted_address,
            place.geometry.location.lat(),
            place.geometry.location.lng()
          );
        });
        arrivoAutocomplete.addListener("place_changed", () => {
          const place = arrivoAutocomplete.getPlace();
          if (!place.geometry || !place.geometry.location) {
            console.error("No geometry available for the selected place");
            return;
          }
          additionalRuns[i].arrivo = place.formatted_address;
          additionalRuns[i].end_geometry = {
            latitude: place.geometry.location.lat(),
            longitude: place.geometry.location.lng(),
          };
          console.log(
            "Selected place:",
            place.formatted_address,
            place.geometry.location.lat(),
            place.geometry.location.lng()
          );
        });
      }
    }, 1000);
  })();
  const getPatients = async () => {
    loading = true;
    fetch(import.meta.env.VITE_API_URL + "/api/patient?q=" + query, {
      method: "GET",
      headers: {
        Authorization: `Bearer ${localStorage.getItem("token")}`,
      },
    })
      .then((response) => response.json())
      .then((data) => {
        patients = data.patients;
      })
      .catch((error) => {
        console.error("Error:", error);
      })
      .finally(() => {
        loading = false;
      });
  };

  function newRunToggle() {
    show_form = true;
    setTimeout(() => {
      const partenzaInput = document.getElementById(
        "field-Partenza-autocomplete"
      );
      const arrivoInput = document.getElementById("field-Arrivo-autocomplete");
      const partenzaAutocomplete = new google.maps.places.Autocomplete(
        partenzaInput
      );
      const arrivoAutocomplete = new google.maps.places.Autocomplete(
        arrivoInput
      );

      partenzaAutocomplete.addListener("place_changed", () => {
        const place = partenzaAutocomplete.getPlace();
        if (!place.geometry || !place.geometry.location) {
          console.error("No geometry available for the selected place");
          return;
        }
        new_run.partenza = place.formatted_address;
        new_run.geometry = {
          latitude: place.geometry.location.lat(),
          longitude: place.geometry.location.lng(),
        };
        console.log(
          "Selected place:",
          place.formatted_address,
          place.geometry.location.lat(),
          place.geometry.location.lng()
        );
      });
      arrivoAutocomplete.addListener("place_changed", () => {
        const place = arrivoAutocomplete.getPlace();
        if (!place.geometry || !place.geometry.location) {
          console.error("No geometry available for the selected place");
          return;
        }
        new_run.arrivo = place.formatted_address;
        new_run.end_geometry = {
          latitude: place.geometry.location.lat(),
          longitude: place.geometry.location.lng(),
        };
        console.log(
          "Selected place:",
          place.formatted_address,
          place.geometry.location.lat(),
          place.geometry.location.lng()
        );
      });
    }, 1000);
  }

  onMount(getPatients);
</script>

{#if loading}
  <LoadingList />
{:else}
  <div class="container mx-auto py-6 px-3">
    <div class="flex justify-between items-center mb-6">
      <h1 class="text-3xl font-bold">Pazienti</h1>

      <button
        on:click={newRunToggle}
        class="bg-green-600 hover:bg-green-800 transition text-white font-bold py-2 px-6 rounded-lg flex items-center justify-center gap-2 shadow-md"
      >
        <span class="text-2xl">+</span>
        <span>Aggiungi Paziente</span>
      </button>
    </div>

    <div class="mb-8 flex items-center gap-4">
      <input
        bind:value={query}
        class="border border-gray-400 rounded-lg p-3 focus:ring-2 focus:ring-lime-600 outline-none transition-all"
        type="text"
        placeholder="Cerca paziente..."
      />
      <button
        on:click={getPatients}
        class="bg-lime-600 hover:bg-lime-800 text-white font-bold py-3 px-4 rounded-lg transition duration-200"
      >
        Cerca
      </button>
    </div>
    <!-- Table Container with Overflow for Responsiveness -->
    <div class="overflow-x-auto">
      <table
        class="min-w-full border-collapse shadow-lg rounded-lg overflow-hidden"
      >
        <thead class="bg-gradient-to-l from-gray-200 to-gray-300">
          <tr>
            <th class="py-3 px-6 text-left uppercase font-semibold text-sm">
              Nome paziente
            </th>
            <th class="py-3 px-6 text-left uppercase font-semibold text-sm">
              Tutti i trasporti
            </th>
            <th class="py-3 px-6 text-left uppercase font-semibold text-sm">
              Trasporti completate
            </th>
            <th class="py-3 px-6 text-left uppercase font-semibold text-sm">
              Trasporti in sospeso
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
                <div class="flex items-center gap-2">
                  <span class="font-bold">{patient.runs.length}</span>
                  {#if patient.runs.length > 0}
                    <span class="font-medium">-</span>
                    <Link
                      to={`/runs?patient=${patient._id}`}
                      class="text-blue-500 font-bold hover:text-blue-700"
                    >
                      Dettagli
                    </Link>
                  {/if}
                </div>
              </td>
              <td class="py-3 px-6 text-left whitespace-nowrap">
                <div class="flex items-center gap-2">
                  <span class="font-bold"
                    >{patient.runs.filter((run) => run.status === "completed")
                      .length}</span
                  >
                  {#if patient.runs.filter((run) => run.status === "completed").length > 0}
                    <span class="font-medium">-</span>
                    <Link
                      to={`/runs?patient=${patient._id}&status=completed`}
                      class="text-blue-500 font-bold hover:text-blue-700"
                    >
                      Dettagli
                    </Link>
                  {/if}
                </div>
              </td>
              <td class="py-3 px-6 text-left whitespace-nowrap">
                <div class="flex items-center gap-2">
                  <span class="font-bold"
                    >{patient.runs.filter((run) => run.status === "pending")
                      .length}</span
                  >
                  {#if patient.runs.filter((run) => run.status === "pending").length > 0}
                    <span class="font-medium">-</span>
                    <Link
                      to={`/runs?patient=${patient._id}&status=pending`}
                      class="text-blue-500 font-bold hover:text-blue-700"
                    >
                      Dettagli
                    </Link>
                  {/if}
                </div>
              </td>
            </tr>
          {/each}
        </tbody>
      </table>
    </div>
  </div>
{/if}

<!-- Popup/Modal for additional information -->
{#if show_form}
  <div
    transition:fade={{ duration: 300 }}
    class="fixed inset-0 overflow-hidden z-40 flex items-center flex-col gap-10 justify-center p-4 bg-white transition-opacity duration-500"
  >
    <div class="flex max-w-screen-lg w-full mx-auto pt-32 relative">
      <button
        class="absolute text-3xl top-32 mt-2 right-6 text-gray-600 hover:text-gray-800"
        on:click={() => (show_form = false)}
        aria-label="Close form"
      >
        ✕
      </button>
    </div>
    <div class="max-w-screen-xl px-20 w-full overflow-y-auto max-h-[600px]">
      {#if show_form}
        <!-- Form Modal -->
        <div class="z-50 transform transition-all duration-500">
          <h2 class="text-3xl font-bold mb-6">Aggiungi paziente</h2>
          <form
            on:submit|preventDefault={() => {
              show_form = false;
              newRun();
            }}
            class="space-y-6"
          >
            <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {#each Object.keys(meta_verifier) as key}
                {#if key === "Data"}
                  <div></div>
                {/if}
                <div class="relative">
                  {#if key === "Data"}
                    <span
                      class="absolute block -left-6 top-9 z-10 text-gray-500"
                      >1</span
                    >
                  {/if}
                  {#if types[key] !== "textarea"}
                    <label
                      for="field-{key}"
                      class="block text-sm font-medium text-gray-700 mb-1"
                    >
                      {key}
                      <span class="text-red-500">*</span>
                    </label>
                  {/if}
                  {#if types[key] === "select"}
                    <select
                      required
                      id="field-{key}"
                      class="block w-full border valid:border-lime-500 outline-none border-gray-300 rounded-lg p-3 focus:ring-2 focus:ring-lime-600 bg-white transition-all"
                      bind:value={new_run[meta_verifier[key]]}
                    >
                      <option value="" disabled>Seleziona</option>
                      {#each options[meta_verifier[key]] as option}
                        <option value={option.value}>{option.text}</option>
                      {/each}
                      <!-- Add your options here -->
                    </select>
                  {:else if types[key] === "autocomplete"}
                    <input
                      type={types[key]}
                      required
                      id="field-{key}-autocomplete"
                      placeholder="Cerca..."
                      class="autocomplete-input block w-full border valid:border-lime-500 outline-none border-gray-300 rounded-lg p-3 focus:ring-2 focus:ring-lime-600 transition-all"
                      value={new_run[meta_verifier[key]]}
                      on:input={(e) =>
                        (new_run[meta_verifier[key]] = e.target.value)}
                    />
                  {:else if types[key] === "number"}
                    <input
                      type={types[key]}
                      min="1"
                      max="10"
                      step="1"
                      autocomplete="off"
                      required
                      id="field-{key}"
                      class="block w-full border valid:border-lime-500 outline-none border-gray-300 rounded-lg p-3 focus:ring-2 focus:ring-lime-600 transition-all"
                      value={new_run[meta_verifier[key]]}
                      on:input={(e) =>
                        (new_run[meta_verifier[key]] = e.target.value)}
                    />
                  {:else if types[key] !== "textarea"}
                    <input
                      type={types[key]}
                      required
                      id="field-{key}"
                      class="block w-full border valid:border-lime-500 outline-none border-gray-300 rounded-lg p-3 focus:ring-2 focus:ring-lime-600 transition-all"
                      value={new_run[meta_verifier[key]]}
                      on:input={(e) =>
                        (new_run[meta_verifier[key]] = e.target.value)}
                    />
                  {/if}
                </div>
              {/each}
              <div
                class="border-t border-gray-300 pt-6 md:col-span-2 lg:col-span-4"
              ></div>
              {#if new_run.viaggio > 1}
                {#each Array.from({ length: new_run.viaggio - 1 }) as _, i}
                  <div
                    class="md:col-span-2 lg:col-span-4 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6"
                  >
                    {#each Object.keys(additionalRunsMeta) as key}
                      <div
                        class={types[key] === "textarea"
                          ? "md:col-span-2 lg:col-span-4"
                          : "relative"}
                      >
                        {#if key === "Data"}
                          <span
                            class="absolute block -left-6 top-9 z-10 text-gray-500"
                            >{i + 2}</span
                          >
                        {/if}
                        <label
                          for="field-{key}-{i}"
                          class="block text-sm font-medium text-gray-700 mb-1"
                        >
                          {key}
                          <span
                            class="text-red-500 {types[key] === 'textarea'
                              ? 'hidden'
                              : ''}">*</span
                          >
                        </label>
                        {#if additionalRuns[i]}
                          <input
                            type={types[key]}
                            required
                            placeholder={key === "Partenza" || key === "Arrivo"
                              ? "Cerca..."
                              : ""}
                            id="field-{key}-{i}"
                            class="block w-full border valid:border-lime-500 outline-none border-gray-300 rounded-lg p-3 focus:ring-2 focus:ring-lime-600 transition-all"
                            value={additionalRuns[i][additionalRunsMeta[key]]}
                            on:input={(e) =>
                              (additionalRuns[i] = {
                                ...additionalRuns[i],
                                [additionalRunsMeta[key]]: e.target.value,
                              })}
                          />
                        {/if}
                      </div>
                    {/each}
                  </div>
                {/each}
              {/if}
              <div class="md:col-span-2 lg:col-span-4">
                <label
                  for="field-note_particolari"
                  class="block text-sm font-medium text-gray-700 mb-1"
                >
                  Note particolari
                </label>
                <textarea
                  id="field-note_particolari"
                  class="block w-full border valid:border-lime-500 outline-none border-gray-300 rounded-lg p-3 focus:ring-2 focus:ring-lime-600 transition-all"
                  bind:value={new_run["note_particolari"]}
                ></textarea>
              </div>
            </div>
            <div class="flex gap-4 justify-end mt-4">
              <button
                type="submit"
                class="bg-lime-600 hover:bg-lime-700 text-white font-bold py-3 px-4 rounded-lg transition duration-200"
              >
                Conferma dettagli
              </button>
            </div>
          </form>
        </div>
      {/if}
    </div>
  </div>
{/if}
