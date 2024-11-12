<script>
  // frontend/src/routes/Patients/index.svelte
  // @ts-nocheck
  import { onMount } from "svelte";
  import { fade } from "svelte/transition";
  import LoadingList from "../../components/LoadingList.svelte";

  let patients = [];
  let loading = false;
  let show_form = false;
  let query = "";
  let action = "add";
  let selected_run = null;
  let meta_verifier = {
    Nome: "nome",
    Cognome: "cognome",
    "C/S/B": "csb",
    Servizio: "servizio",
    Tel: "tel",
    "N. Richiesta": "n_richiesta",
    Ricevuta: "ricevuta",
    Viaggi: "viaggio",
    "Note particolari": "note_particolari",
  };
  let types = {
    Titolo: "text",
    Ora: "time",
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
    Nome: "text",
    Cognome: "text",
  };

  let new_run = {
    csb: "",
    nome: "",
    cognome: "",
    servizio: "",
    tel: "",
    n_richiesta: "",
    ricevuta: "",
    viaggio: "1",
    note_particolari: "",
  };

  let edit_run = {
    csb: "",
    nome: "",
    cognome: "",
    servizio: "",
    tel: "",
    n_richiesta: "",
    ricevuta: "",
    ora: "",
    date: new Date().toISOString().split("T")[0],
    partenza: "",
    arrivo: "",
    viaggio: "1",
    note_particolari: "",
  };
  let options = {
    servizio: [
      { value: "Ordinario", text: "Ordinario" },
      { value: "Ospedaliero", text: "Ospedaliero" },
      { value: "Dialisi", text: "Dialisi" },
      { value: "Oblazione", text: "Oblazione" },
      { value: "Servizio navetta comune", text: "Servizio navetta comune" },
    ],
    csb: [
      { value: "c", text: "C" },
      { value: "s", text: "S" },
      { value: "b", text: "B" },
    ],
  };
  let additionalRuns = [
    {
      ora: "",
      partenza: "",
      arrivo: "",
      date: "",
    },
    {
      ora: "",
      partenza: "",
      arrivo: "",
      date: "",
    },
  ];
  let additionalRunsMeta = {
    Data: "date",
    Ora: "ora",
    Partenza: "partenza",
    Arrivo: "arrivo",
  };
  let presetAddresses = [
    {
      label: "HO",
      full: "Sestri Levante Hospital, Via A. Terzi 37, Sestri Levante",
      geometry: {
        latitude: 44.2752759,
        longitude: 9.4059067,
      },
    },
  ];
  async function newRun() {
    if (action === "add") {
      try {
        const { geometry, end_geometry, nome, cognome, ...newR } = new_run;
        await fetch(import.meta.env.VITE_API_URL + "/api/runs", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${localStorage.getItem("token")}`,
          },
          body: JSON.stringify({
            additionalRuns: additionalRuns.map((run) => ({
              ...run,
              meta: {
                ...newR,
                partenza: run.partenza,
                arrivo: run.arrivo,
                ora: run.ora,
                date: run.date,
              },
            })),
            name: nome,
            surname: cognome,
          }),
        });
        show_form = false;
        getPatients();
        new_run = {
          csb: "",
          nome: "",
          cognome: "",
          servizio: "",
          tel: "",
          n_richiesta: "",
          ricevuta: "",
          viaggio: "1",
          note_particolari: "",
        };
      } catch (error) {
        console.error("Error:", error);
      }
    } else {
      try {
        const { geometry, end_geometry, nome, cognome, ...newR } = edit_run;
        await fetch(
          import.meta.env.VITE_API_URL + "/api/runs/" + selected_run,
          {
            method: "PUT",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${localStorage.getItem("token")}`,
            },
            body: JSON.stringify({ meta: newR, geometry }),
          },
        );
        show_form = false;
        getPatients();
        edit_run = {
          csb: "",
          nome: "",
          cognome: "",
          servizio: "",
          tel: "",
          n_richiesta: "",
          ricevuta: "",
          ora: "",
          date: new Date().toISOString().split("T")[0],
          partenza: "",
          arrivo: "",
          viaggio: "1",
          note_particolari: "",
        };
      } catch (error) {
        console.error("Error:", error);
      }
    }
  }
  function extractFullAddress(data) {
    let streetNumber = "";
    let route = "";
    let subpremise = "";
    let locality = "";
    let formattedName = "";
    console.log(data.address_components);
    // Check if the place is a hospital
    if (data.types.includes("hospital")) {
      formattedName = `${data.name}`;
    }

    data.address_components.forEach((component) => {
      if (component.types.includes("street_number")) {
        streetNumber = component.long_name;
      }
      if (component.types.includes("route")) {
        route = component.long_name;
      }
      if (component.types.includes("subpremise")) {
        subpremise = component.long_name;
      }
      if (component.types.includes("locality")) {
        locality = component.long_name;
      }
    });

    // Combine the extracted parts into the desired format
    let address = `${route} ${streetNumber || route ? streetNumber + ", " : ""}`;
    if (subpremise) {
      address += `/${subpremise}`;
    }
    address += `${locality}`;

    // Prepend the hospital name if it exists
    if (formattedName) {
      address = `${formattedName}, ${address}`;
    }

    return address.trim();
  }
  $: (() => {
    if (show_form && action !== "edit") {
      additionalRuns = Array.from({ length: new_run.viaggio * 2 }).map(
        (x, i) =>
          additionalRuns[i] || {
            ora: "",
            partenza: "",
            arrivo: "",
            date: "",
          },
      );
      setTimeout(() => {
        for (let i = 0; i < new_run.viaggio * 2; i++) {
          const partenzaInput = document.getElementById(`field-Partenza-${i}`);
          const arrivoInput = document.getElementById(`field-Arrivo-${i}`);
          const partenzaAutocomplete = new google.maps.places.Autocomplete(
            partenzaInput,
          );
          const arrivoAutocomplete = new google.maps.places.Autocomplete(
            arrivoInput,
          );

          partenzaAutocomplete.addListener("place_changed", () => {
            const place = partenzaAutocomplete.getPlace();
            if (!place.geometry || !place.geometry.location) {
              console.error("No geometry available for the selected place");
              return;
            }
            const str = extractFullAddress(place);
            additionalRuns[i].partenza = str;
            additionalRuns[i].geometry = {
              latitude: place.geometry.location.lat(),
              longitude: place.geometry.location.lng(),
            };
            console.log(
              "Selected place:",
              str,
              place.geometry.location.lat(),
              place.geometry.location.lng(),
            );
          });
          arrivoAutocomplete.addListener("place_changed", () => {
            const place = arrivoAutocomplete.getPlace();
            if (!place.geometry || !place.geometry.location) {
              console.error("No geometry available for the selected place");
              return;
            }
            const str = extractFullAddress(place);
            additionalRuns[i].arrivo = str;
            additionalRuns[i].end_geometry = {
              latitude: place.geometry.location.lat(),
              longitude: place.geometry.location.lng(),
            };
            console.log(
              "Selected place:",
              str,
              place.geometry.location.lat(),
              place.geometry.location.lng(),
            );
          });
        }
      }, 1000);
    }
  })();
  const getPatients = async () => {
    loading = true;
    fetch(import.meta.env.VITE_API_URL + "/api/patient?surname=" + query, {
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

  function newRunToggle(a) {
    show_form = true;
    action = a;
    if (a === "edit") {
      setTimeout(() => {
        const partenzaInput = document.getElementById("field-Partenza");
        const arrivoInput = document.getElementById("field-Arrivo");
        const partenzaAutocomplete = new google.maps.places.Autocomplete(
          partenzaInput,
        );
        const arrivoAutocomplete = new google.maps.places.Autocomplete(
          arrivoInput,
        );

        partenzaAutocomplete.addListener("place_changed", () => {
          const place = partenzaAutocomplete.getPlace();
          if (!place.geometry || !place.geometry.location) {
            console.error("No geometry available for the selected place");
            return;
          }
          const str = extractFullAddress(place);
          edit_run.partenza = str;
          edit_run.geometry = {
            latitude: place.geometry.location.lat(),
            longitude: place.geometry.location.lng(),
          };
          console.log(
            "Selected place:",
            str,
            place.geometry.location.lat(),
            place.geometry.location.lng(),
          );
        });
        arrivoAutocomplete.addListener("place_changed", () => {
          const place = arrivoAutocomplete.getPlace();
          if (!place.geometry || !place.geometry.location) {
            console.error("No geometry available for the selected place");
            return;
          }
          const str = extractFullAddress(place);
          edit_run.arrivo = str;
          edit_run.end_geometry = {
            latitude: place.geometry.location.lat(),
            longitude: place.geometry.location.lng(),
          };
          console.log(
            "Selected place:",
            str,
            place.geometry.location.lat(),
            place.geometry.location.lng(),
          );
        });
      }, 1000);
    }
  }

  onMount(getPatients);
</script>

{#if loading}
  <LoadingList />
{:else}
  <div class="container mx-auto py-6 px-3">
    <div class="flex justify-between items-center mb-6">
      <h1 class="text-3xl font-bold">Prenotazioni</h1>

      <button
        on:click={() => newRunToggle("add")}
        class="bg-green-600 hover:bg-green-800 transition text-white font-bold py-2 px-6 rounded-lg flex items-center justify-center gap-2 shadow-md"
      >
        <span class="text-2xl">+</span>
        <span>Nuova Prenotazione</span>
      </button>
    </div>

    <div class="mb-8 flex items-center gap-4">
      <input
        bind:value={query}
        class="border border-gray-400 rounded-lg p-3 focus:ring-2 focus:ring-lime-600 outline-none transition-all"
        type="text"
        placeholder="Cerca cognome..."
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
              Cognome Nome
            </th>
            <th class="py-3 px-6 text-left uppercase font-semibold text-sm">
              C/S/B
            </th>
            <th class="py-3 px-6 text-left uppercase font-semibold text-sm">
              Tipo di servizio
            </th>
            <th class="py-3 px-6 text-left uppercase font-semibold text-sm">
              Tel
            </th>
            <th class="py-3 px-6 text-left uppercase font-semibold text-sm">
              N. Richiesta
            </th>
            <th class="py-3 px-6 text-left uppercase font-semibold text-sm">
              Ricevuta
            </th>
            <th class="py-3 px-6 text-left uppercase font-semibold text-sm">
              N. viaggi A/R
            </th>
            <th class="py-3 px-6 text-left uppercase font-semibold text-sm">
              N. trasporti eseguiti
            </th>
          </tr>
        </thead>
        <tbody>
          {#each patients as patient}
            <tr class="border-b border-gray-200">
              <td class="py-3 px-6 text-left whitespace-nowrap">
                <div class="flex items-center">
                  <button
                    class="font-bold underline text-green-700"
                    on:click={() =>
                      (patient.visibleInfo = !patient.visibleInfo)}
                    >{(patient.surname || "") + " " + patient.name}</button
                  >
                </div>
              </td>
              <td class="py-3 px-6 text-left whitespace-nowrap">
                <div class="flex items-center">
                  <span class="font-medium uppercase"
                    >{patient.runs[0]?.meta?.csb || "-"}</span
                  >
                </div>
              </td>
              <td class="py-3 px-6 text-left whitespace-nowrap">
                <div class="flex items-center">
                  <span class="font-medium"
                    >{patient.runs[0]?.meta?.servizio || "-"}</span
                  >
                </div>
              </td>
              <td class="py-3 px-6 text-left whitespace-nowrap">
                <div class="flex items-center">
                  <span class="font-medium"
                    >{patient.runs[0]?.meta?.tel || "-"}</span
                  >
                </div>
              </td>
              <td class="py-3 px-6 text-left whitespace-nowrap">
                <div class="flex items-center">
                  <span class="font-medium"
                    >{patient.runs[0]?.meta?.n_richiesta || "-"}</span
                  >
                </div>
              </td>
              <td class="py-3 px-6 text-left whitespace-nowrap">
                <div class="flex items-center">
                  <span class="font-medium"
                    >{patient.runs[0]?.meta?.ricevuta || "-"}</span
                  >
                </div>
              </td>
              <td class="py-3 px-6 text-left whitespace-nowrap">
                <div class="flex items-center gap-2">
                  <span class="font-bold"
                    >{Math.floor(patient.runs.length / 2)}</span
                  >
                </div>
              </td>
              <td class="py-3 px-6 text-left whitespace-nowrap">
                <div class="flex items-center gap-2">
                  <span class="font-bold"
                    >{patient.runs.filter((run) => run.status === "completed")
                      .length}</span
                  >
                </div>
              </td>
            </tr>
            {#if patient.visibleInfo}
              <tr
                transition:fade={{ duration: 300 }}
                class="border-b border-gray-200 bg-green-100"
              >
                <td class="py-3 px-6" colspan="8">
                  <table class="border-collapse w-full">
                    <thead class="bg-green-300">
                      <tr>
                        <th
                          class="text-left uppercase font-semibold text-sm py-2 px-4"
                          >N</th
                        >
                        <th
                          class="text-left uppercase font-semibold text-sm py-2 px-4"
                          >A/R</th
                        >
                        <th
                          class="text-left uppercase font-semibold text-sm py-2 px-4"
                          >Data</th
                        >
                        <th
                          class="text-left uppercase font-semibold text-sm py-2 px-4"
                          >Ora</th
                        >
                        <th
                          class="text-left uppercase font-semibold text-sm py-2 px-4"
                          >Partenza</th
                        >
                        <th
                          class="text-left uppercase font-semibold text-sm py-2 px-4"
                          >Arrivo</th
                        >
                        <th
                          class="text-left uppercase font-semibold text-sm py-2 px-4"
                          >Status trasporto</th
                        >
                        <th
                          class="text-left uppercase font-semibold text-sm py-2 px-4"
                          >Azioni</th
                        >
                      </tr>
                    </thead>
                    <tbody>
                      {#each patient.runs as run, index}
                        <tr
                          class="border border-green-300 {(index + 1) % 2
                            ? ''
                            : 'border-b-2 border-b-green-500'}"
                        >
                          {#if (index + 1) % 2}
                            <td
                              rowspan="2"
                              class="py-2 px-4 h-5 bg-green-100 text-center border border-green-300"
                              >{(index + 1 * 2) / 2}</td
                            >
                          {/if}
                          <td class="py-2 px-4"
                            >{(index + 1) % 2 ? "A" : "R"}</td
                          >
                          <td class="py-2 px-4 border-l border-green-300"
                            >{run.meta.ora
                              ? new Date(run.meta.date).toLocaleDateString(
                                  "it-IT",
                                )
                              : "Da assegnare"}</td
                          >
                          <td class="py-2 px-4 border-l border-green-300"
                            >{run.meta.ora}</td
                          >
                          <td class="py-2 px-4 border-l border-green-300"
                            >{run.meta.partenza}</td
                          >
                          <td class="py-2 px-4 border-l border-green-300"
                            >{run.meta.arrivo}</td
                          >
                          <td class="py-2 px-4 border-l border-green-300"
                            >{run.status === "refused"
                              ? "Annullata"
                              : run.status === "ongoing"
                                ? "In corso"
                                : run.status === "picked_up"
                                  ? "Paziente preso"
                                  : run.status === "completed"
                                    ? "Paziente consegnato"
                                    : "In attesa"}</td
                          >
                          <td class="py-2 px-4 border-l border-green-300">
                            {#if run.status === "pending" || run.status === "refused"}
                              <button
                                on:click={() => {
                                  selected_run = run._id;
                                  edit_run = {
                                    csb: run.meta.csb,
                                    ora: run.meta.ora,
                                    nome: patient.name,
                                    cognome: patient.surname,
                                    servizio: run.meta.servizio,
                                    tel: run.meta.tel,
                                    partenza: run.meta.partenza,
                                    arrivo: run.meta.arrivo,
                                    n_richiesta: run.meta.n_richiesta,
                                    ricevuta: run.meta.ricevuta,
                                    viaggio: "1",
                                    date: run.meta.date,
                                    note_particolari: run.meta.note_particolari,
                                  };
                                  newRunToggle("edit");
                                }}
                                class="border-amber-600 border hover:bg-amber-600 text-amber-600 hover:text-amber-100 font-bold py-1 px-4 rounded-lg transition duration-200"
                              >
                                <span>Modifica</span>
                              </button>
                            {/if}
                          </td>
                        </tr>
                      {/each}
                    </tbody>
                  </table>
                </td>
              </tr>
            {/if}
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
    class="fixed inset-0 z-40 flex overflow-y-scroll items-center flex-col gap-10 top-20 p-4 pt-8 bg-white transition-opacity duration-500"
  >
    <div class="container px-3 w-full max-h-[800px] pb-8">
      {#if show_form}
        <!-- Form Modal -->
        <div class="z-50 transform transition-all duration-500">
          <h2 class="text-3xl font-bold mb-8">
            {action === "add" ? "Nuova prenotazione" : "Modifica trasporti"}
          </h2>
          <form
            on:submit|preventDefault={() => {
              show_form = false;
              newRun();
            }}
            class="space-y-6"
          >
            <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {#if action !== "edit"}
                {#each Object.keys(meta_verifier) as key}
                  {#if key === "Data"}
                    <div></div>
                  {/if}
                  <div class="relative">
                    {#if types[key] !== "textarea"}
                      <label
                        for="field-{key}"
                        class="block text-sm font-medium text-gray-700 mb-1"
                      >
                        {key}
                        <span
                          class="text-red-500 {key === 'Arrivo' ||
                          key === 'Partenza' ||
                          key === 'Ora' ||
                          key === 'N. Richiesta' ||
                          key === 'Ricevuta'
                            ? 'hidden'
                            : ''}">*</span
                        >
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
                        max="50"
                        step="1"
                        disabled={action === "add"
                          ? false
                          : key === "Viaggi"
                            ? true
                            : false}
                        autocomplete="off"
                        required
                        id="field-{key}"
                        class="block w-full border valid:border-lime-500 outline-none border-gray-300 rounded-lg p-3 focus:ring-2 focus:ring-lime-600 transition-all"
                        value={new_run[meta_verifier[key]]}
                        on:input={(e) => {
                          if (action === "edit" && key === "Viaggi") return;
                          new_run[meta_verifier[key]] = e.target.value;
                        }}
                      />
                    {:else if types[key] !== "textarea"}
                      <input
                        type={types[key]}
                        required={types[key] !== "time" &&
                          key !== "N. Richiesta" &&
                          key !== "Ricevuta"}
                        disabled={action === "add"
                          ? false
                          : key === "Nome" ||
                              key === "Cognome" ||
                              key === "Viaggi"
                            ? true
                            : false}
                        id="field-{key}"
                        class="block w-full border valid:border-lime-500 outline-none border-gray-300 rounded-lg p-3 focus:ring-2 focus:ring-lime-600 transition-all"
                        value={new_run[meta_verifier[key]]}
                        on:input={(e) =>
                          (new_run[meta_verifier[key]] = e.target.value)}
                      />
                    {/if}
                  </div>
                {/each}
                {#each Array.from({ length: new_run.viaggio * 2 }) as _, i}
                  <div
                    class="md:col-span-2 lg:col-span-4 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 relative"
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
                            >{(i + 1) % 2 ? "A" : "R"}</span
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
                          {#if (i + 1) % 2 && (key === "Partenza" || key === "Arrivo")}
                            <div class="mt-2 flex gap-2">
                              {#each presetAddresses as address}
                                <button
                                  type="button"
                                  on:click={() => {
                                    additionalRuns[i][key.toLowerCase()] =
                                      address.full;
                                    if (key === "Partenza") {
                                      additionalRuns[i].geometry =
                                        address.geometry;
                                    } else {
                                      additionalRuns[i].end_geometry =
                                        address.geometry;
                                    }
                                  }}
                                  class="bg-gray-200 hover:bg-gray-400 rounded-md px-2 py-1"
                                >
                                  {address.label}
                                </button>
                              {/each}
                            </div>
                          {/if}
                        {/if}
                      </div>
                    {/each}
                    {#if i % 2}
                      <button
                        type="button"
                        on:click={() => {
                          additionalRuns[i].partenza =
                            additionalRuns[i - 1].arrivo;
                          additionalRuns[i].arrivo =
                            additionalRuns[i - 1].partenza;
                          additionalRuns[i].geometry =
                            additionalRuns[i - 1].end_geometry;
                          additionalRuns[i].end_geometry =
                            additionalRuns[i - 1].geometry;
                          console.log(additionalRuns[i]);
                          console.log(additionalRuns[i - 1]);
                        }}
                        class="absolute -top-5 p-2 bg-gray-200 rounded-md flex items-center justify-center -right-11 lock"
                      >
                        <svg
                          xmlns="http://www.w3.org/2000/svg"
                          width="24"
                          height="24"
                          fill="currentColor"
                          class="bi bi-link-45deg"
                          viewBox="0 0 16 16"
                        >
                          <path
                            d="M4.715 6.542 3.343 7.914a3 3 0 1 0 4.243 4.243l1.828-1.829A3 3 0 0 0 8.586 5.5L8 6.086a1 1 0 0 0-.154.199 2 2 0 0 1 .861 3.337L6.88 11.45a2 2 0 1 1-2.83-2.83l.793-.792a4 4 0 0 1-.128-1.287z"
                          />
                          <path
                            d="M6.586 4.672A3 3 0 0 0 7.414 9.5l.775-.776a2 2 0 0 1-.896-3.346L9.12 3.55a2 2 0 1 1 2.83 2.83l-.793.792c.112.42.155.855.128 1.287l1.372-1.372a3 3 0 1 0-4.243-4.243z"
                          />
                        </svg></button
                      >
                    {/if}
                  </div>
                  {#if i % 2}
                    <div
                      class="border-t border-gray-300 pt-2 mt-4 md:col-span-2 lg:col-span-4"
                    ></div>
                  {/if}
                {/each}
              {:else}
                {#each Object.keys(meta_verifier) as key}
                  {#if key === "Data"}
                    <div></div>
                  {/if}
                  <div class="relative">
                    {#if types[key] !== "textarea"}
                      <label
                        for="field-{key}"
                        class="block text-sm font-medium text-gray-700 mb-1"
                      >
                        {key}
                        <span
                          class="text-red-500 {key === 'Arrivo' ||
                          key === 'Partenza' ||
                          key === 'Ora' ||
                          key === 'N. Richiesta' ||
                          key === 'Ricevuta'
                            ? 'hidden'
                            : ''}">*</span
                        >
                      </label>
                    {/if}
                    {#if types[key] === "select"}
                      <select
                        required
                        id="field-{key}"
                        class="block w-full border valid:border-lime-500 outline-none border-gray-300 rounded-lg p-3 focus:ring-2 focus:ring-lime-600 bg-white transition-all"
                        bind:value={edit_run[meta_verifier[key]]}
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
                        id="field-{key}-autocomplete"
                        placeholder="Cerca..."
                        class="autocomplete-input block w-full border valid:border-lime-500 outline-none border-gray-300 rounded-lg p-3 focus:ring-2 focus:ring-lime-600 transition-all"
                        value={edit_run[meta_verifier[key]]}
                        on:input={(e) =>
                          (edit_run[meta_verifier[key]] = e.target.value)}
                      />
                    {:else if types[key] === "number"}
                      <input
                        type={types[key]}
                        min="1"
                        max="50"
                        step="1"
                        disabled={action === "add"
                          ? false
                          : key === "Viaggi"
                            ? true
                            : false}
                        autocomplete="off"
                        required
                        id="field-{key}"
                        class="block w-full border valid:border-lime-500 outline-none border-gray-300 rounded-lg p-3 focus:ring-2 focus:ring-lime-600 transition-all"
                        value={edit_run[meta_verifier[key]]}
                        on:input={(e) => {
                          if (action === "edit" && key === "Viaggi") return;
                          edit_run[meta_verifier[key]] = e.target.value;
                        }}
                      />
                    {:else if types[key] !== "textarea"}
                      <input
                        type={types[key]}
                        required={types[key] !== "time" &&
                          key !== "N. Richiesta" &&
                          key !== "Ricevuta"}
                        disabled={action === "add"
                          ? false
                          : key === "Nome" ||
                              key === "Cognome" ||
                              key === "Viaggi"
                            ? true
                            : false}
                        id="field-{key}"
                        class="block w-full border valid:border-lime-500 outline-none border-gray-300 rounded-lg p-3 focus:ring-2 focus:ring-lime-600 transition-all"
                        value={edit_run[meta_verifier[key]]}
                        on:input={(e) =>
                          (edit_run[meta_verifier[key]] = e.target.value)}
                      />
                    {/if}
                  </div>
                {/each}
                <div
                  class="md:col-span-2 lg:col-span-4 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6"
                >
                  {#each Object.keys(additionalRunsMeta) as key}
                    <div
                      class={types[key] === "textarea"
                        ? "md:col-span-2 lg:col-span-4"
                        : "relative"}
                    >
                      <label
                        for="field-{key}"
                        class="block text-sm font-medium text-gray-700 mb-1"
                      >
                        {key}
                        <span
                          class="text-red-500 {types[key] === 'textarea'
                            ? 'hidden'
                            : ''}">*</span
                        >
                      </label>
                      <input
                        type={types[key]}
                        placeholder={key === "Partenza" || key === "Arrivo"
                          ? "Cerca..."
                          : ""}
                        id="field-{key}"
                        class="block w-full border valid:border-lime-500 outline-none border-gray-300 rounded-lg p-3 focus:ring-2 focus:ring-lime-600 transition-all"
                        value={edit_run[additionalRunsMeta[key]]}
                        on:input={(e) => {
                          console.log(edit_run);
                          edit_run[additionalRunsMeta[key]] = e.target.value;
                        }}
                      />
                    </div>
                  {/each}
                </div>
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
                  bind:value={edit_run["note_particolari"]}
                ></textarea>
              </div>
            </div>
            <div class="flex gap-4 justify-between mt-4">
              <button
                class="bg-amber-600 hover:bg-amber-700 text-white font-bold py-3 px-6 rounded-lg transition duration-200"
                type="button"
                on:click={() => {
                  show_form = false;
                  new_run = {
                    csb: "",
                    nome: "",
                    cognome: "",
                    servizio: "",
                    tel: "",
                    n_richiesta: "",
                    ricevuta: "",
                    viaggio: "1",
                    note_particolari: "",
                  };
                  edit_run = {
                    csb: "",
                    nome: "",
                    cognome: "",
                    servizio: "",
                    tel: "",
                    n_richiesta: "",
                    ricevuta: "",
                    ora: "",
                    date: new Date().toISOString().split("T")[0],
                    partenza: "",
                    arrivo: "",
                    viaggio: "1",
                    note_particolari: "",
                  };
                }}
                aria-label="Close form"
              >
                Annulla
              </button>
              <button
                aria-label="Submit form"
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

<style>
  .lock::before {
    content: "";
    height: 2rem;
    width: 1px;
    background: gray;
    display: block;
    position: absolute;
    top: -3rem;
    left: 1.25rem;
  }

  .lock::after {
    content: "";
    height: 2rem;
    width: 1px;
    background: gray;
    display: block;
    position: absolute;
    bottom: -3rem;
    left: 1.25rem;
  }
</style>
