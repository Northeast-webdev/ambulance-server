<script>
  // @ts-nocheck
  import L from "leaflet";
  import "leaflet/dist/leaflet.css";
  import { onMount } from "svelte";
  import { fade } from "svelte/transition";
  import Popover from "./Popover.svelte";

  let map;

  let show_form = false;
  let showPopup = false;
  let showFinalPopup = false;
  let showMap = false;
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

  let cars = [];

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
  let selected_car = null;
  let selected_run = null;
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

  onMount(() => {
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

      // Create the popover content using the Svelte component
      marker.bindPopup(
        () => {
          const popoverContainer = document.createElement("div");
          new Popover({
            target: popoverContainer,
            props: {
              driver,
              onOpenPopup: () => openPopup(driver.id),
            },
          });
          return popoverContainer;
        },
        {
          closeButton: false,
          offset: [0, -8],
        }
      );

      marker.on("click", () => marker.openPopup());

      if (driver.status !== "Offline") animateMarker(marker);
    });
  });

  function openPopup(id) {
    driver_id = id;
    show_form = true;
  }
  // Function to get popover content as HTML
  function getPopoverContent(driver) {
    // Create an instance of the Popover component and return its HTML content
    const popover = new Popover({
      target: document.createElement("div"),
      props: {
        driver,
        onOpenPopup: (driver) => {
          console.log("Opening popup for driver:", driver);
          show_form = true;
          driver_id = driver.id;
        }, // Pass the function to open the popup
      },
    });

    return popover.$$.root.innerHTML;
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
      showPopup = false;
    } catch (error) {
      console.error("Error:", error);
    } finally {
      showPopup = false;
      showFinalPopup = true;
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

  onMount(() => {
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
      });
  });
</script>

<div class="min-h-screen p-6">
  <div class="container mx-auto py-6 px-3">
    <h1 class="text-3xl font-bold mb-6">Mappa</h1>
    <!-- Map Container -->
    <div id="map" class="aspect-[16/7] rounded-lg shadow-md z-10"></div>
  </div>
</div>

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
