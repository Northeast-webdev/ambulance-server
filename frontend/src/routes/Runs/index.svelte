<script>
  // @ts-nocheck

  import L from "leaflet";
  import "leaflet/dist/leaflet.css";
  import { onMount } from "svelte";
  import { fade, fly } from "svelte/transition";
  import LoadingList from "../../components/LoadingList.svelte";

  let runs = [];
  let show_form = false;
  let showPopup = false;
  let showFinalPopup = false;
  let loading = false;
  let showMap = false;
  let cars = [];
  let selected_car = null;
  let selected_run = null;
  let map;
  let driver_id = "";
  let drivers = [
    {
      name: "Allen Jack",
      lat: 40.7128,
      lng: -74.006,
      status: "Available",
      id: 1,
    },
    { name: "John Snow", lat: 40.7228, lng: -74.006, status: "Busy", id: 2 },
    {
      name: "Luca Brasi",
      lat: 40.7138,
      lng: -74.016,
      status: "Busy",
      id: 3,
    },
    { name: "Mario Rossi", lat: 40.7228, lng: -74.0, status: "Offline", id: 4 },
  ];

  $: showMap && getMapInfo();

  function getMapInfo() {
    if (map) return;
    // Initialize the Leaflet map
    map = L.map("map").setView([40.7128, -74.006], 13);

    // Add OpenStreetMap tiles
    L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png").addTo(
      map
    );

    // Add markers for drivers
    drivers.forEach((driver) => {
      // Create a custom DivIcon for each marker with the driver's ID
      const customIcon = L.divIcon({
        className: "custom-marker", // Custom CSS class for styling
        html: `<div class="marker-circle ${
          driver.status === "Available"
            ? "bg-green-500 text-green-100"
            : driver.status === "Busy"
              ? "bg-amber-500 text-amber-100"
              : "bg-red-500 text-red-100"
        }">${driver.id}</div>`, // Inner HTML to show the ID
        iconSize: [20, 20], // Size of the marker
      });

      const marker = L.marker([driver.lat, driver.lng], {
        icon: customIcon,
      }).addTo(map);

      marker.on("click", () => marker.openMapPopup());

      if (driver.status !== "Offline") animateMarker(marker);
    });
  }

  function openMapPopup(id) {
    driver_id = id;
    showPopup = true;
  }

  // Function to animate markers smoothly
  function animateMarker(marker) {
    setInterval(() => {
      const currentLatLng = marker.getLatLng();
      const newLatLng = [
        currentLatLng.lat + (Math.random() - 0.5) * 0.001,
        currentLatLng.lng + (Math.random() - 0.5) * 0.001,
      ];

      marker.setLatLng(newLatLng);
    }, 1000);
  }
  let meta_verifier = {
    "C/S/B": "csb",
    Ora: "ora",
    Paziente: "paziente",
    Servizio: "servizio",
    Tel: "tel",
    "Tipo di servizio": "tipo_di_servizio",
    Partenza: "partenza",
    Arrivo: "arrivo",
    "N. Richiesta": "n_richiesta",
    Ricevuta: "ricevuta",
    Viaggi: "viaggio",
    "Note particolari": "note_particolari",
  };
  let types = {
    Titolo: "text",
    Ora: "time",
    Paziente: "text",
    Servizio: "select",
    "Tipo di servizio": "text",
    "C/S/B": "select",
    Partenza: "time",
    Arrivo: "time",
    "N. Richiesta": "text",
    Ricevuta: "text",
    Viaggi: "text",
    Tel: "tel",
    "Note particolari": "textarea",
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

  const getRuns = async () => {
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
      });

    fetch(import.meta.env.VITE_API_URL + "/api/cars", {
      method: "GET",
      headers: {
        Authorization: `Bearer ${localStorage.getItem("token")}`,
      },
    })
      .then((response) => response.json())
      .then((data) => {
        cars = data.cars;
      })
      .catch((error) => {
        console.error("Error:", error);
      })
      .finally(() => {
        loading = false;
      });
  };

  onMount(getRuns);

  function newRunToggle() {
    show_form = true;
  }

  async function updateRun() {
    if (!selected_car) {
      return;
    }
    try {
      const response = await fetch(
        import.meta.env.VITE_API_URL + "/api/runs/" + selected_run,
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${localStorage.getItem("token")}`,
          },
          body: JSON.stringify({ car: selected_car }),
        }
      );
      const data = await response.json();
      runs = runs.map((run) => {
        if (run._id === data.run._id) {
          return data.run;
        }
        return run;
      });
      showPopup = false;
    } catch (error) {
      console.error("Error:", error);
    } finally {
      showPopup = false;
      showFinalPopup = true;
      await getRuns();
    }
  }

  async function newRun() {
    try {
      const response = await fetch(import.meta.env.VITE_API_URL + "/api/runs", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
        body: JSON.stringify({ meta: new_run, title: new_run.paziente }),
      });
      const data = await response.json();
      selected_run = data.run._id;
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
      };
    } catch (error) {
      console.error("Error:", error);
    }
  }
  function openPopup(run) {
    showPopup = true;
    selected_run = run._id;
  }
</script>

{#if loading}
  <LoadingList />
{:else}
  <div class="container mx-auto py-6 px-3">
    <div class="flex justify-between items-center mb-6">
      <h1 class="text-3xl font-bold">Corse</h1>
      <button
        on:click={newRunToggle}
        class="bg-green-600 hover:bg-green-800 transition text-white font-bold py-2 px-6 rounded-lg flex items-center justify-center gap-2 shadow-md"
      >
        <span class="text-2xl">+</span>
        <span>Aggiungi Corsa</span>
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
              {#if key !== "Titolo" && key !== "Note particolari"}
                <th
                  class="py-3 px-4 text-left font-semibold text-gray-700 border-b"
                  >{key}</th
                >
              {/if}
            {/each}
          </tr>
        </thead>
        <tbody>
          {#each runs as run}
            <tr
              class="{run.status === 'cancelled'
                ? 'bg-red-200 border-red-300'
                : run.status === 'ongoing'
                  ? 'bg-amber-200 border-amber-300'
                  : run.status === 'completed'
                    ? 'bg-green-200 border-green-300'
                    : 'bg-gray-50'} border-b border-l"
            >
              {#each Object.keys(meta_verifier) as key}
                {#if key !== "Titolo" && key !== "Paziente" && key !== "Note particolari"}
                  <td class="py-3 px-4 border-r border-inherit"
                    >{run.meta[meta_verifier[key]]}</td
                  >
                {:else if key === "Paziente"}
                  <td class="py-3 px-4 border-r border-inherit">
                    <button
                      class="text-blue-800 font-semibold underline"
                      on:click={() => {
                        run.visibleInfo = !run.visibleInfo;
                      }}
                    >
                      {run.meta[meta_verifier[key]]}
                    </button>
                  </td>
                {/if}
              {/each}
            </tr>
            <!-- Patient and run status, with showing the assigned car that are revealed on name click -->
            {#if run.visibleInfo}
              <tr
                transition:fly={{ x: 40, duration: 300 }}
                class={run.status === "cancelled"
                  ? "bg-red-200"
                  : run.status === "ongoing"
                    ? "bg-amber-200"
                    : run.status === "completed"
                      ? "bg-green-200"
                      : "bg-gray-100"}
              >
                <td
                  class="py-3 px-4"
                  colspan={Object.keys(meta_verifier).length - 1}
                >
                  <div class="flex items-center justify-evenly mx-10">
                    <div class="flex items-center gap-4">
                      <p class="text-gray-800">Status paziente</p>
                      <div
                        title="Cancelled"
                        class="bg-red-400 w-4 h-4 rounded-full {run.status ===
                        'cancelled'
                          ? 'ring-4 ring-red-600'
                          : ''}"
                      ></div>
                      <div
                        title="Ongoing"
                        class="bg-yellow-500 w-4 h-4 rounded-full {run.status ===
                        'ongoing'
                          ? 'ring-4 ring-yellow-600'
                          : ''}"
                      ></div>
                      <div
                        title="Completed"
                        class="bg-lime-500 w-4 h-4 rounded-full {run.status ===
                        'completed'
                          ? 'ring-4 ring-green-600'
                          : ''}"
                      ></div>
                    </div>

                    {#if run.car}
                      <p class="text-gray-800 cursor-pointer">
                        Mezzo assegnato: <span class="hover:underline"
                          >{run.car.meta.plate_number} - {run.car.user
                            .first_name}
                          {run.car.user.last_name}</span
                        >
                      </p>
                    {:else if run.status !== "cancelled"}
                      <button
                        on:click={() => openPopup(run)}
                        class="bg-lime-500 hover:bg-lime-600 transition text-white font-bold py-2 px-6 rounded-lg"
                      >
                        Assign Car
                      </button>
                    {:else}
                      <p class="text-gray-800 cursor-pointer py-2 px-6">
                        Cancelled
                      </p>
                    {/if}
                  </div>
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
{#if showPopup || show_form || showFinalPopup}
  <div
    transition:fade={{ duration: 300 }}
    class="fixed inset-0 z-40 flex items-center flex-col gap-10 justify-center overflow-y-auto p-4 mb-8 bg-white transition-opacity duration-500"
  >
    <div class="flex max-w-screen-lg w-full mx-auto py-8">
      <div class="flex items-center">
        <!-- Step 1 -->
        <div
          class="flex items-center pr-10 transition {show_form
            ? 'border-b-2 border-lime-600 '
            : 'border-b-2 border-gray-300 '}"
        >
          <div
            class="flex items-end gap-3 transition {show_form
              ? 'text-lime-600'
              : 'text-gray-300'} font-semibold"
          >
            <span class="text-4xl">1</span>
            <span class="pb-1 text-xl">Inserisci le informazioni</span>
          </div>
        </div>

        <!-- Step 2 -->
        <div
          class="flex items-center pr-10 transition {showPopup
            ? 'border-b-2 border-lime-600 '
            : 'border-b-2 border-gray-300 '}"
        >
          <div
            class="flex items-end gap-3 transition {showPopup
              ? 'text-lime-600'
              : 'text-gray-300'} font-semibold"
          >
            <span class="text-4xl">2</span>
            <span class="pb-1 text-xl">Assegna ed invia</span>
          </div>
        </div>

        <!-- Step 3 -->
        <div
          class="flex items-center pr-10 transition {showFinalPopup
            ? 'border-b-2 border-lime-600 '
            : 'border-b-2 border-gray-300 '}"
        >
          <div
            class="flex items-end gap-3 transition {showFinalPopup
              ? 'text-lime-600'
              : 'text-gray-300'} font-semibold"
          >
            <span class="text-4xl">3</span>
            <span class="pb-1 text-xl">Assegnazione completata</span>
          </div>
        </div>
      </div>
    </div>
    <div class="max-w-screen-lg w-full">
      {#if show_form}
        <!-- Form Modal -->
        <div class="z-50 transform transition-all duration-500">
          <button
            class="absolute text-3xl -top-[12vh] mt-2 right-6 text-gray-600 hover:text-gray-800"
            on:click={() => (show_form = false)}
            aria-label="Close form"
          >
            ✕
          </button>
          <h2 class="text-3xl font-bold mb-6">Nuova Corsa</h2>
          <form
            on:submit|preventDefault={() => {
              show_form = false;
              showPopup = true;
              newRun();
            }}
            class="space-y-6"
          >
            <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {#each Object.keys(meta_verifier) as key}
                <div
                  class={types[key] === "textarea"
                    ? "md:col-span-2 lg:col-span-4"
                    : ""}
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
                  {:else if types[key] === "textarea"}
                    <textarea
                      id="field-{key}"
                      class="block w-full border valid:border-lime-500 outline-none border-gray-300 rounded-lg p-3 focus:ring-2 focus:ring-lime-600 transition-all"
                      bind:value={new_run[meta_verifier[key]]}
                    ></textarea>
                  {:else}
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
      {#if showPopup}
        <!-- Form Modal -->
        <div class="max-h-[80vh] z-50 transform transition-all duration-500">
          <button
            class="absolute text-3xl -top-1/4 mt-2 right-6 text-gray-600 hover:text-gray-800"
            on:click={() => (showPopup = false)}
            aria-label="Close form"
          >
            ✕
          </button>
          <h2 class="text-3xl font-bold mb-6">Assegnazione a mezzo</h2>
          <p class="text-gray-700 mb-6">
            Vuoi assegnare già da ora la corsa ad un mezzo?
          </p>
          <div class="flex items-center gap-4 mb-12">
            <button
              on:click={updateRun}
              class="bg-lime-700 hover:bg-lime-900 text-white font-bold py-2 px-6 rounded-lg"
            >
              Assegna mezzo
            </button>
            <button
              class="bg-amber-700 hover:bg-amber-900 text-white font-bold py-2 px-6 rounded-lg"
              on:click={() => (showPopup = false)}
            >
              Salta per ora
            </button>
          </div>
          <h2 class="text-3xl font-bold mb-6">Lista veicoli</h2>
          <table
            class="min-w-full border-collapse shadow-lg rounded-lg overflow-hidden"
          >
            <thead class="bg-gradient-to-l from-gray-200 to-gray-300">
              <tr>
                <th
                  class="py-3 px-4 text-left font-semibold text-gray-700 border-b"
                ></th>
                <th
                  class="py-3 px-4 text-left font-semibold text-gray-700 border-b"
                  >Targa</th
                >
                <th
                  class="py-3 px-4 text-left font-semibold text-gray-700 border-b"
                  >Modello</th
                >
                <th
                  class="py-3 px-4 text-left font-semibold text-gray-700 border-b"
                  >Marca</th
                >
                <th
                  class="py-3 px-4 text-left font-semibold text-gray-700 border-b"
                  >Status</th
                >
                <th
                  class="py-3 px-4 text-left font-semibold text-gray-700 border-b"
                  >Driver</th
                >
              </tr>
            </thead>
            <tbody>
              {#each cars as car}
                <tr
                  class="border-b cursor-pointer {selected_car === car._id
                    ? 'bg-lime-100'
                    : 'bg-gray-50'}"
                  on:click={() =>
                    selected_car === car._id
                      ? (selected_car = null)
                      : (selected_car = car._id)}
                >
                  <td class="border-r text-center">
                    <input
                      type="radio"
                      class="bg-gray-200 checked:bg-lime-600 checked:border-transparent checked:text-white rounded-full appearance-none w-4 h-4 border pointer-events-none border-gray-300 checked:ring-2 checked:ring-lime-600 checked:ring-offset-2 checked:ring-offset-gray-200"
                      checked={selected_car === car._id}
                    />
                  </td>
                  <td class="py-3 px-4 border-r">{car.meta.plate_number}</td>
                  <td class="py-3 px-4 border-r">{car.meta.model}</td>
                  <td class="py-3 px-4 border-r">{car.meta.brand}</td>
                  <td class="py-3 px-4 border-r uppercase">{car.status}</td>
                  <td class="py-3 px-4"
                    >{`${car.user.first_name} ${car.user.last_name}`}</td
                  >
                </tr>
              {/each}
            </tbody>
          </table>

          <button
            on:click={() => (showMap = !showMap)}
            class="bg-lime-700 hover:bg-lime-900 text-white font-bold py-2 px-6 rounded-lg my-6"
          >
            {!showMap ? "Vedi" : "Nascondi"} mappa
          </button>
          <!-- Map Container -->
          <div class={showMap ? "" : "opacity-0"}>
            <div
              id="map"
              class="aspect-[16/7] rounded-lg shadow-md z-10 mb-8"
            ></div>
          </div>
        </div>
      {/if}
      {#if showFinalPopup}
        <div class="max-h-[80vh] z-50 transform transition-all duration-500">
          <button
            class="absolute text-3xl -top-1/4 mt-2 right-6 text-gray-600 hover:text-gray-800"
            on:click={() => (showFinalPopup = false)}
            aria-label="Close form"
          >
            ✕
          </button>
          <h2 class="text-3xl font-bold mb-6">
            Hai assegnato la corsa al mezzo
          </h2>
          <p class="text-gray-700 mb-6">
            Il guidatore riceverà una notifica per l'accettazione della corsa
          </p>
          <button
            class="bg-lime-700 hover:bg-lime-900 text-white font-bold py-2 px-6 rounded-lg"
            on:click={() => {
              show_form = true;
              showFinalPopup = false;
            }}
          >
            Crea un’altra corsa
          </button>
        </div>
      {/if}
    </div>
  </div>
{/if}
