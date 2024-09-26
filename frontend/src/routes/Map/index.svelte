<script>
  // @ts-nocheck

  import { onDestroy, onMount } from "svelte";
  import { fade } from "svelte/transition";
  let googleMap;
  let autocomplete;

  const mapOptions = {
    zoom: 15,
    center: { lat: 45.5469, lng: 11.5476 }, // Initial position (Vicenza in this case)
    mapTypeControl: false, // Disable map/satellite switcher
    streetViewControl: false, // Disable Pegman/Street View
    fullscreenControl: false, // Disable fullscreen button
    zoomControl: true, // Enable zooming
    gestureHandling: "greedy", // Allow zooming by scrolling or pinch gesture
    draggable: true, // Allow panning
    scaleControl: false, // Disable scale control
    clickableIcons: false, // Disable POI icons
    mapId: "d537a79eb09b53ce",
  };
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
    Partenza: "autocomplete",
    Arrivo: "autocomplete",
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
  let drivers = [];
  let map;
  let socket;
  let driverMarkers = new Map(); // Map to store markers by driver ID

  $: drivers && drivers.length && getMarkers();

  $: showMap && getMapInfo();

  onMount(() => {
    socket = new WebSocket(import.meta.env.VITE_WS_URL + "/api/cars/ws");

    socket.onopen = () => {
      console.log("WebSocket connection established");
    };

    socket.onmessage = (event) => {
      const data = JSON.parse(event.data);
      const id = data.documentKey._id;
      const last_location = data.updateDescription.updatedFields.last_location;
      if (!last_location || !id) return;
      console.log(driverMarkers);
      // Update the driver's last location based on the ID
      if (driverMarkers.has(id)) {
        const marker = driverMarkers.get(id);
        marker.position = {
          lat: last_location.latitude,
          lng: last_location.longitude,
        };
      }
      console.log(data);
    };

    socket.onclose = () => {
      console.log("WebSocket connection closed");
    };

    socket.onerror = (error) => {
      console.error("WebSocket error:", error);
    };
  });

  onDestroy(() => {
    if (socket) {
      socket.close();
    }
  });

  function getMapInfo() {
    if (map) return;
    // Initialize the Leaflet map
    map = L.map("map").setView([40.7128, -74.006], 13);

    // Add OpenStreetMap tiles
    L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png").addTo(
      map
    );

    if (new_run.partenza && new_run.arrivo) {
      const partenzaIcon = L.divIcon({
        className: "custom-marker", // Custom CSS class for styling
        html: `<div class="marker-circle bg-indigo-500 text-indigo-100">A</div>`,
        iconSize: [20, 20], // Size of the marker
      });

      const partenzaMarker = L.marker(
        [new_run.geometry.latitude, new_run.geometry.longitude],
        {
          icon: partenzaIcon,
        }
      ).addTo(map);

      const arrivoIcon = L.divIcon({
        className: "custom-marker", // Custom CSS class for styling
        html: `<div class="marker-circle bg-indigo-500 text-indigo-100">B</div>`,
        iconSize: [20, 20], // Size of the marker
      });

      const arrivoMarker = L.marker(
        [new_run.end_geometry.latitude, new_run.end_geometry.longitude],
        {
          icon: arrivoIcon,
        }
      ).addTo(map);
    }

    // Add markers for drivers
    drivers.forEach((driver, i) => {
      // Create a custom DivIcon for each marker with the driver's ID
      const customIcon = L.divIcon({
        className: "custom-marker", // Custom CSS class for styling
        html: `<div class="marker-circle ${
          driver.status === "free"
            ? "bg-green-500 text-green-100"
            : driver.status === "busy"
              ? "bg-amber-500 text-amber-100"
              : "bg-red-500 text-red-100"
        }">${i + 1}</div>`, // Inner HTML to show the ID
        iconSize: [20, 20], // Size of the marker
      });

      const marker = L.marker(
        [driver.last_location.latitude, driver.last_location.longitude],
        {
          icon: customIcon,
        }
      ).addTo(map);

      map.setView(
        [driver.last_location.latitude, driver.last_location.longitude],
        13
      );
    });
  }

  onMount(() => {
    // Initialize the Google Map (example coordinates)
    googleMap = new google.maps.Map(
      document.getElementById("google-map"),
      mapOptions
    );

    // Create the autocomplete search box
    const input = document.getElementById("search-input");
    autocomplete = new google.maps.places.Autocomplete(input);
    autocomplete.bindTo("bounds", googleMap);

    // Handle the selection of a place from autocomplete
    autocomplete.addListener("place_changed", () => {
      const place = autocomplete.getPlace();
      if (!place.geometry || !place.geometry.location) {
        console.error("No geometry available for the selected place");
        return;
      }
      console.log(
        "Selected place:",
        place.formatted_address,
        place.geometry.location.lat(),
        place.geometry.location.lng()
      );
      // Zoom and center the map to the selected place
      googleMap.setCenter(place.geometry.location);
      googleMap.setZoom(17);
    });

    // Fetch drivers from the API
    fetch(import.meta.env.VITE_API_URL + "/api/cars", {
      method: "GET",
      headers: {
        Authorization: `Bearer ${localStorage.getItem("token")}`,
      },
    })
      .then((response) => response.json())
      .then((data) => {
        drivers = data.cars;
      })
      .catch((error) => {
        console.error("Error:", error);
      });
  });

  function getMarkers() {
    // Add markers for drivers
    drivers.forEach((driver, i) => {
      const markerContent = document.createElement("div");
      markerContent.className = `marker-circle ${getMarkerClass(driver.status)}`;
      markerContent.textContent = i + 1; // Set the marker ID

      if (driverMarkers.has(driver._id)) {
        // If marker already exists, just update its position
        const existingMarker = driverMarkers.get(driver._id);
        existingMarker.location = {
          lat: driver.last_location.latitude,
          lng: driver.last_location.longitude,
        };
      } else {
        // Create a new marker if it doesn't exist
        const marker = new google.maps.marker.AdvancedMarkerElement({
          position: {
            lat: driver.last_location.latitude,
            lng: driver.last_location.longitude,
          },
          map: googleMap,
          content: markerContent,
        });

        // Add marker click listener
        marker.addListener("click", () => {
          openPopup(driver._id);
        });

        // Store the marker in the map
        driverMarkers.set(driver._id, marker);
      }
    });

    // Optionally, recenter map to first driver
    if (drivers.length) {
      googleMap.setCenter({
        lat: drivers[0].last_location.latitude,
        lng: drivers[0].last_location.longitude,
      });
    }
  }

  // Function to determine marker class based on driver status
  function getMarkerClass(status) {
    switch (status) {
      case "free":
        return "bg-green-500 text-green-100";
      case "busy":
        return "bg-amber-500 text-amber-100";
      case "break":
        return "bg-red-500 text-red-100";
      default:
        return "";
    }
  }

  function openPopup(id) {
    driver_id = id;
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
    }, 2000);
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
      drivers = [...drivers].map((driver) => {
        if (driver._id === driver_id) {
          driver.status = "busy";
        }
        return driver;
      });
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
      const { geometry, end_geometry, ...newR } = new_run;
      const response = await fetch(import.meta.env.VITE_API_URL + "/api/runs", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
        body: JSON.stringify({
          meta: newR,
          status: "pending",
          geometry: geometry,
        }),
      });
      const data = await response.json();
      selected_run = data.run._id;
      show_form = false;
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

<!-- HTML Layout -->
<div class="min-h-screen p-6">
  <div class="container mx-auto py-6 px-3">
    <h1 class="text-3xl font-bold mb-6">Mappa</h1>

    <!-- Search Bar -->
    <div class="mb-4">
      <input
        id="search-input"
        type="text"
        class="block w-full border valid:border-lime-500 outline-none border-gray-300 rounded-lg p-3 focus:ring-2 focus:ring-lime-600 transition-all"
        placeholder="Cerca un luogo..."
      />
    </div>

    <!-- Google Map Container -->
    <div id="google-map" class="aspect-[16/7] rounded-lg shadow-md z-10"></div>
  </div>
</div>

<!-- Popup/Modal for additional information -->
{#if showPopup || show_form || showFinalPopup}
  <div
    transition:fade={{ duration: 300 }}
    class="fixed overflow-hidden inset-0 z-40 flex items-center flex-col gap-10 justify-center p-4 mb-8 bg-white transition-opacity duration-500"
  >
    <div class="flex max-w-screen-lg w-full mx-auto pt-32">
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
    <div class="max-w-screen-lg w-full overflow-y-auto px-2">
      {#if show_form}
        <!-- Form Modal -->
        <div class="z-50 transform transition-all duration-500">
          <button
            class="absolute text-3xl top-0 mt-2 right-6 text-gray-600 hover:text-gray-800"
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
                  {:else if types[key] === "autocomplete"}
                    <input
                      type={types[key]}
                      required
                      id="field-{key}-autocomplete"
                      class="autocomplete-input block w-full border valid:border-lime-500 outline-none border-gray-300 rounded-lg p-3 focus:ring-2 focus:ring-lime-600 transition-all"
                      value={new_run[meta_verifier[key]]}
                      placeholder="Cerca..."
                      on:input={(e) =>
                        (new_run[meta_verifier[key]] = e.target.value)}
                    />
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
        <div class="z-50 transform transition-all duration-500">
          <button
            class="absolute text-3xl top-0 mt-2 right-6 text-gray-600 hover:text-gray-800"
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
                  >Nome</th
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
                  on:click={() => {
                    if (car.status === "busy") return;
                    selected_car === car._id
                      ? (selected_car = null)
                      : (selected_car = car._id);
                  }}
                >
                  <td class="border-r text-center">
                    <input
                      type="radio"
                      class="bg-gray-200 checked:bg-lime-600 checked:border-transparent checked:text-white rounded-full appearance-none w-4 h-4 border pointer-events-none border-gray-300 checked:ring-2 checked:ring-lime-600 checked:ring-offset-2 checked:ring-offset-gray-200"
                      checked={selected_car === car._id}
                    />
                  </td>
                  <td class="py-3 px-4 border-r">{car.name}</td>
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
            class="absolute text-3xl top-0 mt-2 right-6 text-gray-600 hover:text-gray-800"
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
