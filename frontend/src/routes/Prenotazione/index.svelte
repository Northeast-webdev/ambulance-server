<script>
  // frontend/src/routes/Patients/index.svelte
  // @ts-nocheck
  import { onMount } from "svelte";
  import { Link, navigate, useLocation } from "svelte-navigator";
  import { fade } from "svelte/transition";
  import LoadingList from "../../components/LoadingList.svelte";

  let patients = [];
  let loading = false;
  let show_form = true;
  let query = "";
  let action = "add";
  let selected_run = null;
  let patients_autocomplete = [];
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

  async function getPatientsAutoComplete(e) {
    const surname = e.target.value.trim();
    if (surname.length === 0) return;
    fetch(
      import.meta.env.VITE_API_URL +
        "/api/patient?limit=10&sortBySurname=true&surname=" +
        surname,
      {
        method: "GET",
        headers: {
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
      }
    )
      .then((response) => response.json())
      .then((data) => {
        patients_autocomplete = data.patients.sort((a, b) =>
          a.surname.toLowerCase().localeCompare(b.surname.toLowerCase())
        );
      })
      .catch((error) => {
        console.error("Error:", error);
      })
      .finally(() => {
        loading = false;
      });
  }

  const debounce = (callback, wait = 300) => {
    let timeout;

    return (...args) => {
      clearTimeout(timeout);
      timeout = setTimeout(() => callback(...args), wait);
    };
  };

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
          }
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
    navigate("/pazienti");
  }

  function extractFullAddress(data, input) {
    let streetNumber = "";
    let route = "";
    let subpremise = "";
    let locality = "";
    let formattedName = "";

    // Check if the place is a hospital
    if (data.types.includes("hospital")) {
      formattedName = `${data.name}`;
    }

    console.log(data);

    data.address_components.forEach((component) => {
      if (component.types.includes("street_number")) {
        const address = input.value; // input[text] value
        streetNumber = component.long_name;

        // Regex Match associated
        if (streetNumber) {
          const regex = RegExp(`[^\\s,]*(${streetNumber})[^\\s,]*`);
          const foundStreetNumber = regex.exec(address);
          streetNumber = foundStreetNumber[0];
        }
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

    // Construct the address string
    let address = `${route}`;
    if (streetNumber) {
      address += ` ${streetNumber}`;
    }
    if (locality) {
      address += `, ${locality}`;
    }

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
          }
      );
      setTimeout(() => {
        for (let i = 0; i < new_run.viaggio * 2; i++) {
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
            const str = extractFullAddress(place, partenzaInput);
            additionalRuns[i].partenza = str;
            additionalRuns[i].geometry = {
              latitude: place.geometry.location.lat(),
              longitude: place.geometry.location.lng(),
            };
            console.log(
              "Selected place:",
              str,
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
            const str = extractFullAddress(place, arrivoInput);
            additionalRuns[i].arrivo = str;
            additionalRuns[i].end_geometry = {
              latitude: place.geometry.location.lat(),
              longitude: place.geometry.location.lng(),
            };
            console.log(
              "Selected place:",
              str,
              place.geometry.location.lat(),
              place.geometry.location.lng()
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
          const str = extractFullAddress(place, partenzaInput);
          edit_run.partenza = str;
          edit_run.geometry = {
            latitude: place.geometry.location.lat(),
            longitude: place.geometry.location.lng(),
          };
          console.log(
            "Selected place:",
            str,
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
          const str = extractFullAddress(place, arrivoInput);
          edit_run.arrivo = str;
          edit_run.end_geometry = {
            latitude: place.geometry.location.lat(),
            longitude: place.geometry.location.lng(),
          };
          console.log(
            "Selected place:",
            str,
            place.geometry.location.lat(),
            place.geometry.location.lng()
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
  <div class="container px-3 py-6 mx-auto">
    <div class="flex items-center justify-between mb-6">
      <h1 class="text-3xl font-bold">Prenotazioni</h1>

      <button
        on:click={() => newRunToggle("add")}
        class="flex items-center justify-center gap-2 px-6 py-2 font-bold text-white transition bg-green-600 rounded-lg shadow-md hover:bg-green-800"
      >
        <span class="text-2xl">+</span>
        <span>Nuova Prenotazione</span>
      </button>
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
                    >{patient.runs[0]?.meta?.tel || "-"}</span
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
            </tr>
            {#if patient.visibleInfo}
              <tr
                transition:fade={{ duration: 300 }}
                class="bg-green-100 border-b border-gray-200"
              >
                <td class="px-6 py-3" colspan="8">
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
              {#if action !== "edit"}
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
                        class="block w-full p-3 transition-all border border-gray-300 rounded-lg outline-none autocomplete-input valid:border-lime-500 focus:ring-2 focus:ring-lime-600"
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
                        class="block w-full p-3 transition-all border border-gray-300 rounded-lg outline-none valid:border-lime-500 focus:ring-2 focus:ring-lime-600"
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
                        class="block w-full p-3 transition-all border border-gray-300 rounded-lg outline-none valid:border-lime-500 focus:ring-2 focus:ring-lime-600"
                        value={new_run[meta_verifier[key]]}
                        on:blur={() => {
                          setTimeout(() => {
                            patients_autocomplete = [];
                          }, 500);
                        }}
                        on:input={(e) => {
                          if (key === "Cognome") {
                            debounce(getPatientsAutoComplete(e), 500);
                          }
                          new_run[meta_verifier[key]] = e.target.value;
                        }}
                      />
                      {#if key === "Cognome" && patients_autocomplete.length > 0}
                        <div
                          class="absolute left-0 z-50 w-full gap-2 mt-2 space-y-2 bg-white border border-gray-300 border-t-0 shadow-lg top-[4.25rem] p-2 max-h-60 overflow-y-scroll"
                        >
                          {#each patients_autocomplete as patient}
                            <button
                              type="button"
                              on:click={() => {
                                new_run[meta_verifier[key]] = patient.surname;
                                new_run[meta_verifier["Nome"]] = patient.name;
                                patients_autocomplete = [];
                              }}
                              class="block w-full p-2 text-left rounded-md hover:bg-green-100"
                            >
                              <span class="font-bold">{patient.surname}</span>
                              {patient.name}
                            </button>
                          {/each}
                        </div>
                      {/if}
                    {/if}
                  </div>
                {/each}
                {#each Array.from({ length: new_run.viaggio * 2 }) as _, i}
                  <div
                    class="relative grid grid-cols-1 gap-6 md:col-span-2 lg:col-span-4 md:grid-cols-2 lg:grid-cols-4"
                  >
                    {#each Object.keys(additionalRunsMeta) as key}
                      <div
                        class={types[key] === "textarea"
                          ? "md:col-span-2 lg:col-span-4"
                          : "relative"}
                      >
                        {#if key === "Data"}
                          <span
                            class="absolute z-10 block text-gray-500 -left-6 top-9"
                            >{(i + 1) % 2 ? "A" : "R"}</span
                          >
                        {/if}
                        <label
                          for="field-{key}-{i}"
                          class="block mb-1 text-sm font-medium text-gray-700"
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
                            class="block w-full p-3 transition-all border border-gray-300 rounded-lg outline-none valid:border-lime-500 focus:ring-2 focus:ring-lime-600"
                            value={additionalRuns[i][additionalRunsMeta[key]]}
                            on:input={(e) =>
                              (additionalRuns[i] = {
                                ...additionalRuns[i],
                                [additionalRunsMeta[key]]: e.target.value,
                              })}
                          />
                          {#if (i + 1) % 2 && (key === "Partenza" || key === "Arrivo")}
                            <div class="flex flex-wrap gap-2 mt-2">
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
                                  class="px-2 py-1 bg-gray-200 rounded-md hover:bg-gray-400"
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
                        class="absolute flex items-center justify-center p-2 bg-gray-200 rounded-md -top-10 -right-11 lock"
                      >
                        <svg
                          xmlns="http://www.w3.org/2000/svg"
                          width="20"
                          height="20"
                          fill="currentColor"
                          class="transform rotate-90 bi bi-arrow-left-right"
                          viewBox="0 0 16 16"
                        >
                          <path
                            fill-rule="evenodd"
                            d="M1 11.5a.5.5 0 0 0 .5.5h11.793l-3.147 3.146a.5.5 0 0 0 .708.708l4-4a.5.5 0 0 0 0-.708l-4-4a.5.5 0 0 0-.708.708L13.293 11H1.5a.5.5 0 0 0-.5.5m14-7a.5.5 0 0 1-.5.5H2.707l3.147 3.146a.5.5 0 1 1-.708.708l-4-4a.5.5 0 0 1 0-.708l4-4a.5.5 0 1 1 .708.708L2.707 4H14.5a.5.5 0 0 1 .5.5"
                          />
                        </svg></button
                      >
                    {/if}
                  </div>
                  {#if i % 2}
                    <div
                      class="pt-2 mt-4 border-t border-gray-300 md:col-span-2 lg:col-span-4"
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
                        on:input={(e) => {
                          console.log(edit_run);
                          edit_run[additionalRunsMeta[key]] = e.target.value;
                        }}
                      />

                      {#if key === "Partenza" || key === "Arrivo"}
                        <div class="flex flex-wrap gap-2 mt-2">
                          {#each presetAddresses as address}
                            <button
                              type="button"
                              on:click={() => {
                                edit_run[additionalRunsMeta[key]] =
                                  address.full;
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
              {/if}
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
                  bind:value={new_run["note_particolari"]}
                ></textarea>
              </div>
            </div>
            <div class="flex justify-between gap-4 mt-4">
              <Link
                to="/pazienti"
                class="px-6 py-3 font-bold text-white transition duration-200 rounded-lg bg-amber-600 hover:bg-amber-700"
                type="button"
              >
                Annulla
              </Link>
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
