<script>
  // frontend/src/routes/Patients/index.svelte
  // @ts-nocheck
  import { onMount } from "svelte";
  import { useLocation } from "svelte-navigator";
  import { fade } from "svelte/transition";
  import LoadingList from "../../components/LoadingList.svelte";

  let patients = [];
  let loading = false;
  let show_form = false;
  let query = "";
  let action = "add";
  let selected_run = null;
  let additionalRunsAutoComplete = {
    partenza: [],
    arrivo: [],
  };
  let timeoutId = null;
  let meta_verifier = {
    Cognome: "cognome",
    Nome: "nome",
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

  let show_patient_form = false;
  let selected_patient = null;
  let edit_patient = {
    name: "",
    surname: "",
    phone: "",
    address: "",
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
      full: "Sestri Levante Hospital, Via A. Terzi 37",
      geometry: {
        latitude: 44.2752759,
        longitude: 9.4059067,
      },
    },
    {
      label: "HM",
      full: "Ospedale Padre Antero Micone, Largo Nevio Rosso 2",
      geometry: {
        latitude: 44.4342780756152,
        longitude: 8.852516972194888,
      },
    },
    {
      label: "HSC",
      full: "Ospedale San Carlo, P.le Efisio Gianasso 4",
      geometry: {
        latitude: 44.430456893499596,
        longitude: 8.745671368621633,
      },
    },
    {
      label: "HCA",
      full: "Ospedale La Colletta, Via Giappone 5",
      geometry: {
        latitude: 44.402075390300574,
        longitude: 8.664021154303311,
      },
    },
    {
      label: "HGLR",
      full: "Ente Ospedaliero Galliera, Via Alessandro Volta 6",
      geometry: {
        latitude: 44.399228910422444,
        longitude: 8.942351654934132,
      },
    },
    {
      label: "HVS",
      full: "Ospedale Villa Scassi, Corso Onofrio Scassi 1",
      geometry: {
        latitude: 44.412787716957645,
        longitude: 8.897384154651395,
      },
    },
    {
      label: "HSM",
      full: "Ospedale San Martino, Largo Rosanna Benzi 10",
      geometry: {
        latitude: 44.407634118406165,
        longitude: 8.970082554934438,
      },
    },
    {
      label: "IST",
      full: "IST Sud, Largo Rosanna Benzi",
      geometry: {
        latitude: 44.411757902118396,
        longitude: 8.971474472130424,
      },
    },
    {
      label: "HGSL",
      full: "Ospedale Gaslini, Via Gerolamo Gaslini 5",
      geometry: {
        latitude: 44.39356829733542,
        longitude: 8.988731810753956,
      },
    },
  ];
  let location = useLocation();
  async function newRun() {
    try {
      const { geometry, end_geometry, nome, cognome, ...newR } = edit_run;
      await fetch(import.meta.env.VITE_API_URL + "/api/runs/" + selected_run, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
        body: JSON.stringify({ meta: newR, geometry }),
      });
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

  const getPatients = async () => {
    const urlParams = new URLSearchParams(window.location.search);
    const name = urlParams.get("name") || "";
    const surname = urlParams.get("surname") || "";
    console.log(name, surname, query);

    loading = true;

    fetch(
      import.meta.env.VITE_API_URL +
        "/api/patient?limit=50&surname=" +
        (surname || query) +
        (name ? "&name=" + name : ""),
      {
        method: "GET",
        headers: {
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
      }
    )
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
  }
  onMount(getPatients);

  async function savePatient() {
    await fetch(
      import.meta.env.VITE_API_URL + "/api/patient/" + selected_patient,
      {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
        body: JSON.stringify(edit_patient),
      }
    );
    show_patient_form = false;
    getPatients();
  }

  async function handlePlaceSelected(place, key, isAdditional = false) {
    const res = await fetch(
      `https://lookup.search.hereapi.com/v1/lookup?id=${place.id}&apiKey=${import.meta.env.VITE_HERE_API_KEY}`
    );
    const data = await res.json();
    console.log(data);
    if (isAdditional && key === "Partenza") {
      const old_partenza = edit_run.partenza;
      if (old_partenza.includes("/")) {
        edit_run.partenza =
          data.address.label.split(",").slice(0, -2).join(",") +
          "/" +
          old_partenza.split("/")[1].trim() +
          ", " +
          data.address.city;
      } else {
        edit_run.partenza =
          data.address.label.split(",").slice(0, -2).join(",") +
          ", " +
          data.address.city;
      }
      edit_run.geometry = {
        latitude: data.position.lat,
        longitude: data.position.lng,
      };
    } else if (isAdditional && key === "Arrivo") {
      const old_arrivo = edit_run.arrivo;
      if (old_arrivo.includes("/")) {
        edit_run.arrivo =
          data.address.label.split(",").slice(0, -2).join(",") +
          "/" +
          old_arrivo.split("/")[1].trim() +
          ", " +
          data.address.city;
      } else {
        edit_run.arrivo =
          data.address.label.split(",").slice(0, -2).join(",") +
          ", " +
          data.address.city;
      }
      edit_run.geometry = {
        latitude: data.position.lat,
        longitude: data.position.lng,
      };
    }
  }

  async function getAutocompleteResults(key) {
    clearTimeout(timeoutId);
    timeoutId = setTimeout(async () => {
      const string = edit_run[key.toLowerCase()].split("/")[0].trim();
      const response = await fetch(
        `https://autocomplete.search.hereapi.com/v1/autocomplete?q=${encodeURIComponent(
          string
        )}&in=countryCode:ITA&apiKey=${import.meta.env.VITE_HERE_API_KEY}`
      );
      const data = await response.json();
      additionalRunsAutoComplete[key.toLowerCase()] = data.items || [];
    }, 500);
  }
</script>

{#if loading}
  <LoadingList />
{:else}
  <div class="container px-3 py-6 mx-auto">
    <div class="flex items-center justify-between mb-6">
      <h1 class="text-3xl font-bold">Prenotazioni</h1>
    </div>

    <div class="flex items-center gap-4 mb-8">
      <input
        bind:value={query}
        class="p-3 transition-all border border-gray-400 rounded-lg outline-none focus:ring-2 focus:ring-lime-600"
        type="text"
        placeholder="Cerca cognome..."
      />
      <button
        on:click={getPatients}
        class="px-4 py-3 font-bold text-white transition duration-200 rounded-lg bg-lime-600 hover:bg-lime-800"
      >
        Cerca
      </button>
    </div>
    <!-- Table Container with Overflow for Responsiveness -->
    <div class="overflow-x-auto">
      <table
        class="min-w-full overflow-hidden border-collapse rounded-lg shadow-lg"
      >
        <thead class="bg-gradient-to-l from-gray-200 to-gray-300">
          <tr>
            <th class="px-6 py-3 text-sm font-semibold text-left uppercase">
              Cognome Nome
            </th>
            <th class="px-6 py-3 text-sm font-semibold text-left uppercase">
              C/S/B
            </th>
            <th class="px-6 py-3 text-sm font-semibold text-left uppercase">
              Tipo di servizio
            </th>
            <th class="px-6 py-3 text-sm font-semibold text-left uppercase">
              Tel
            </th>
            <th class="px-6 py-3 text-sm font-semibold text-left uppercase">
              N. Richiesta
            </th>
            <th class="px-6 py-3 text-sm font-semibold text-left uppercase">
              Ricevuta
            </th>
            <th class="px-6 py-3 text-sm font-semibold text-left uppercase">
              N. viaggi A/R
            </th>
            <th class="px-6 py-3 text-sm font-semibold text-left uppercase">
              N. trasporti eseguiti
            </th>
            <th class="px-6 py-3 text-sm font-semibold text-left uppercase">
              Azioni
            </th>
          </tr>
        </thead>
        <tbody>
          {#each patients as patient}
            <tr class="border-b border-gray-200">
              <td class="px-6 py-3 text-left whitespace-nowrap">
                <div class="flex items-center">
                  <button
                    class="font-bold text-green-700 underline"
                    on:click={() =>
                      (patient.visibleInfo = !patient.visibleInfo)}
                    >{(patient.surname || "") + " " + patient.name}</button
                  >
                </div>
              </td>
              <td class="px-6 py-3 text-left whitespace-nowrap">
                <div class="flex items-center">
                  <span class="font-medium uppercase"
                    >{patient.runs[0]?.meta?.csb || "-"}</span
                  >
                </div>
              </td>
              <td class="px-6 py-3 text-left whitespace-nowrap">
                <div class="flex items-center">
                  <span class="font-medium"
                    >{patient.runs[0]?.meta?.servizio || "-"}</span
                  >
                </div>
              </td>
              <td class="px-6 py-3 text-left whitespace-nowrap">
                <div class="flex items-center">
                  <span class="font-medium"
                    >{patient.phone || patient.runs[0]?.meta?.tel || "-"}</span
                  >
                </div>
              </td>
              <td class="px-6 py-3 text-left whitespace-nowrap">
                <div class="flex items-center">
                  <span class="font-medium"
                    >{patient.runs[0]?.meta?.n_richiesta || "-"}</span
                  >
                </div>
              </td>
              <td class="px-6 py-3 text-left whitespace-nowrap">
                <div class="flex items-center">
                  <span class="font-medium"
                    >{patient.runs[0]?.meta?.ricevuta || "-"}</span
                  >
                </div>
              </td>
              <td class="px-6 py-3 text-left whitespace-nowrap">
                <div class="flex items-center gap-2">
                  <span class="font-bold"
                    >{Math.floor(patient.runs.length / 2)}</span
                  >
                </div>
              </td>
              <td class="px-6 py-3 text-left whitespace-nowrap">
                <div class="flex items-center gap-2">
                  <span class="font-bold"
                    >{patient.runs.filter((run) => run.status === "completed")
                      .length}</span
                  >
                </div>
              </td>
              <td class="px-6 py-3 text-left whitespace-nowrap">
                <div class="flex items-center gap-2">
                  <button
                    class="px-4 py-2 font-bold bg-indigo-600 rounded-lg text-indigo-50 hover:bg-indigo-800"
                    on:click={() => {
                      selected_patient = patient._id;
                      edit_patient = {
                        name: patient.name,
                        surname: patient.surname,
                        phone: patient.phone,
                        address: patient.address,
                      };
                      show_patient_form = true;
                    }}
                  >
                    Modifica
                  </button>
                </div>
              </td>
            </tr>
            {#if patient.visibleInfo}
              <tr
                transition:fade={{ duration: 300 }}
                class="bg-green-100 border-b border-gray-200"
              >
                <td class="px-6 py-3" colspan="9">
                  <table class="w-full border-collapse">
                    <thead class="bg-green-300">
                      <tr>
                        <th
                          class="px-4 py-2 text-sm font-semibold text-left uppercase"
                          >N</th
                        >
                        <th
                          class="px-4 py-2 text-sm font-semibold text-left uppercase"
                          >A/R</th
                        >
                        <th
                          class="px-4 py-2 text-sm font-semibold text-left uppercase"
                          >Data</th
                        >
                        <th
                          class="px-4 py-2 text-sm font-semibold text-left uppercase"
                          >Ora</th
                        >
                        <th
                          class="px-4 py-2 text-sm font-semibold text-left uppercase"
                          >Partenza</th
                        >
                        <th
                          class="px-4 py-2 text-sm font-semibold text-left uppercase"
                          >Arrivo</th
                        >
                        <th
                          class="px-4 py-2 text-sm font-semibold text-left uppercase"
                          >Status trasporto</th
                        >
                        <th
                          class="px-4 py-2 text-sm font-semibold text-left uppercase"
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
                              class="h-5 px-4 py-2 text-center bg-green-100 border border-green-300"
                              >{(index + 1 * 2) / 2}</td
                            >
                          {/if}
                          <td class="px-4 py-2"
                            >{(index + 1) % 2 ? "A" : "R"}</td
                          >
                          <td class="px-4 py-2 border-l border-green-300"
                            >{run.meta.ora
                              ? new Date(run.meta.date).toLocaleDateString(
                                  "it-IT"
                                )
                              : "Da assegnare"}</td
                          >
                          <td class="px-4 py-2 border-l border-green-300"
                            >{run.meta.ora}</td
                          >
                          <td class="px-4 py-2 border-l border-green-300"
                            >{run.meta.partenza}</td
                          >
                          <td class="px-4 py-2 border-l border-green-300"
                            >{run.meta.arrivo}</td
                          >
                          <td class="px-4 py-2 border-l border-green-300"
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
                          <td class="px-4 py-2 border-l border-green-300">
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
                                class="px-4 py-1 font-bold transition duration-200 border rounded-lg border-amber-600 hover:bg-amber-600 text-amber-600 hover:text-amber-100"
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
    class="fixed inset-0 z-40 flex flex-col items-center gap-10 p-4 pt-8 overflow-y-scroll transition-opacity duration-500 bg-white top-20"
  >
    <div class="container px-3 w-full max-h-[800px] pb-8">
      {#if show_form}
        <!-- Form Modal -->
        <div class="z-50 transition-all duration-500 transform">
          <h2 class="mb-8 text-3xl font-bold">
            {action === "add" ? "Nuova prenotazione" : "Modifica trasporti"}
          </h2>
          <form
            on:submit|preventDefault={() => {
              show_form = false;
              newRun();
            }}
            class="space-y-6"
          >
            <div class="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-4">
              {#each Object.keys(meta_verifier) as key}
                {#if key === "Data"}
                  <div></div>
                {/if}
                <div class="relative">
                  {#if types[key] !== "textarea"}
                    <label
                      for="field-{key}"
                      class="block mb-1 text-sm font-medium text-gray-700"
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
                      class="block w-full p-3 transition-all bg-white border border-gray-300 rounded-lg outline-none valid:border-lime-500 focus:ring-2 focus:ring-lime-600"
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
                      class="block w-full p-3 transition-all border border-gray-300 rounded-lg outline-none autocomplete-input valid:border-lime-500 focus:ring-2 focus:ring-lime-600"
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
                      class="block w-full p-3 transition-all border border-gray-300 rounded-lg outline-none valid:border-lime-500 focus:ring-2 focus:ring-lime-600"
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
                      class="block w-full p-3 transition-all border border-gray-300 rounded-lg outline-none valid:border-lime-500 focus:ring-2 focus:ring-lime-600"
                      value={edit_run[meta_verifier[key]]}
                      on:input={(e) =>
                        (edit_run[meta_verifier[key]] = e.target.value)}
                    />
                  {/if}
                </div>
              {/each}
              <div
                class="grid grid-cols-1 gap-6 md:col-span-2 lg:col-span-4 md:grid-cols-2 lg:grid-cols-4"
              >
                {#each Object.keys(additionalRunsMeta) as key}
                  <div
                    class={types[key] === "textarea"
                      ? "md:col-span-2 lg:col-span-4"
                      : "relative"}
                  >
                    <label
                      for="field-{key}"
                      class="block mb-1 text-sm font-medium text-gray-700"
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
                      class="block w-full p-3 transition-all border border-gray-300 rounded-lg outline-none valid:border-lime-500 focus:ring-2 focus:ring-lime-600"
                      value={edit_run[additionalRunsMeta[key]]}
                      on:blur={() => {
                        if (key === "Partenza" || key === "Arrivo") {
                          setTimeout(() => {
                            additionalRunsAutoComplete[key.toLowerCase()] = [];
                          }, 500);
                        }
                      }}
                      on:keyup={(e) => {
                        edit_run[additionalRunsMeta[key]] = e.target.value;
                        if (key === "Partenza" || key === "Arrivo") {
                          getAutocompleteResults(key);
                        }
                      }}
                    />
                    {#if key === "Arrivo" && additionalRunsAutoComplete.arrivo.length > 0}
                      <div
                        class="absolute top-20 left-0 z-50 w-full bg-white overflow-y-auto max-h-[10rem] rounded-lg shadow-md border border-gray-300"
                      >
                        {#each additionalRunsAutoComplete.arrivo as result}
                          <button
                            class="w-full p-2 text-left cursor-pointer hover:bg-green-100"
                            on:click={() => {
                              handlePlaceSelected(result, key, true);
                              additionalRunsAutoComplete.arrivo = [];
                            }}
                          >
                            <span class="inline-block w-2 h-2"></span>
                            <span class="font-medium text-black"
                              >{result.title}</span
                            >
                          </button>
                        {/each}
                      </div>
                    {/if}
                    {#if key === "Partenza" && additionalRunsAutoComplete.partenza.length > 0}
                      <div
                        class="absolute top-20 left-0 z-50 w-full bg-white overflow-y-auto max-h-[10rem] rounded-lg shadow-md border border-gray-300"
                      >
                        {#each additionalRunsAutoComplete.partenza as result}
                          <button
                            class="w-full p-2 text-left cursor-pointer hover:bg-green-100"
                            on:click={() => {
                              handlePlaceSelected(result, key, true);
                              additionalRunsAutoComplete.partenza = [];
                            }}
                          >
                            <span class="inline-block w-2 h-2"></span>
                            <span class="font-medium text-black"
                              >{result.title}</span
                            >
                          </button>
                        {/each}
                      </div>
                    {/if}
                    {#if key === "Partenza" || key === "Arrivo"}
                      <div class="flex flex-wrap gap-2 mt-2">
                        {#each presetAddresses as address}
                          <button
                            type="button"
                            on:click={() => {
                              edit_run[additionalRunsMeta[key]] = address.full;
                              if (key === "Partenza") {
                                edit_run.geometry = address.geometry;
                              } else {
                                edit_run.end_geometry = address.end_geometry;
                              }
                            }}
                            class="px-2 py-1 bg-gray-200 rounded-md hover:bg-gray-400"
                          >
                            {address.label}
                          </button>
                        {/each}
                      </div>
                    {/if}
                  </div>
                {/each}
              </div>
              <div class="md:col-span-2 lg:col-span-4">
                <label
                  for="field-note_particolari"
                  class="block mb-1 text-sm font-medium text-gray-700"
                >
                  Note particolari
                </label>
                <textarea
                  id="field-note_particolari"
                  class="block w-full p-3 transition-all border border-gray-300 rounded-lg outline-none valid:border-lime-500 focus:ring-2 focus:ring-lime-600"
                  bind:value={edit_run["note_particolari"]}
                ></textarea>
              </div>
            </div>
            <div class="flex justify-between gap-4 mt-4">
              <button
                class="px-6 py-3 font-bold text-white transition duration-200 rounded-lg bg-amber-600 hover:bg-amber-700"
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
                class="px-4 py-3 font-bold text-white transition duration-200 rounded-lg bg-lime-600 hover:bg-lime-700"
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

{#if show_patient_form}
  <div
    class="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50"
  >
    <div class="p-6 bg-white rounded-lg">
      <div class="flex items-center justify-between mb-8">
        <h2 class="text-2xl font-bold">Modifica paziente</h2>
        <button
          class="px-4 py-2 font-bold text-white transition duration-200 bg-red-600 rounded-lg hover:bg-red-700"
          on:click={() => (show_patient_form = false)}
        >
          Chiudi
        </button>
      </div>
      <form
        class="grid grid-cols-2 gap-4"
        on:submit|preventDefault={() => savePatient()}
      >
        <div class="relative">
          <label
            for="field-name"
            class="block mb-1 text-sm font-medium text-gray-700"
            >Nome <span class="text-red-500">*</span></label
          >
          <input
            type="text"
            bind:value={edit_patient.name}
            disabled
            placeholder="Nome"
            class="block w-full p-3 transition-all border border-gray-300 rounded-lg outline-none valid:border-lime-500 focus:ring-2 focus:ring-lime-600 disabled:bg-gray-200"
          />
        </div>
        <div class="relative">
          <label
            for="field-surname"
            class="block mb-1 text-sm font-medium text-gray-700"
            >Cognome <span class="text-red-500">*</span></label
          >
          <input
            type="text"
            bind:value={edit_patient.surname}
            disabled
            placeholder="Cognome"
            class="block w-full p-3 transition-all border border-gray-300 rounded-lg outline-none valid:border-lime-500 focus:ring-2 focus:ring-lime-600 disabled:bg-gray-200"
          />
        </div>
        <div class="relative">
          <label
            for="field-phone"
            class="block mb-1 text-sm font-medium text-gray-700"
            >Telefono <span class="text-red-500">*</span></label
          >
          <input
            type="tel"
            bind:value={edit_patient.phone}
            placeholder="Telefono"
            class="block w-full p-3 transition-all border border-gray-300 rounded-lg outline-none valid:border-lime-500 focus:ring-2 focus:ring-lime-600 disabled:bg-gray-200"
          />
        </div>
        <div class="relative">
          <label
            for="field-address"
            class="block mb-1 text-sm font-medium text-gray-700"
            >Indirizzo <span class="text-red-500">*</span></label
          >
          <input
            type="text"
            bind:value={edit_patient.address}
            placeholder="Indirizzo"
            class="block w-full p-3 transition-all border border-gray-300 rounded-lg outline-none valid:border-lime-500 focus:ring-2 focus:ring-lime-600 disabled:bg-gray-200"
          />
        </div>
        <div class="flex justify-between col-span-2 gap-4">
          <button
            class="w-full px-6 py-3 font-bold text-white transition duration-200 rounded-lg bg-lime-600 hover:bg-lime-700"
            type="submit"
          >
            Salva
          </button>
        </div>
      </form>
    </div>
  </div>
{/if}
