<script>
  // @ts-nocheck

  import { onDestroy, onMount } from "svelte";
  let googleMap;
  let search = "";
  let autocomplete_results = [];
  let timeoutId;

  async function handlePlaceSelected(place) {
    const res = await fetch(
      `https://lookup.search.hereapi.com/v1/lookup?id=${place.id}&apiKey=${import.meta.env.VITE_HERE_API_KEY}`
    );
    const data = await res.json();
    googleMap.setCenter({
      lat: data.position.lat,
      lng: data.position.lng,
    });
    googleMap.setZoom(17);
  }

  async function getAutocompleteResults() {
    console.log(search);
    const response = await fetch(
      `https://autocomplete.search.hereapi.com/v1/autocomplete?q=${search}&in=countryCode:ITA&apiKey=${import.meta.env.VITE_HERE_API_KEY}`
    );
    const data = await response.json();
    autocomplete_results = data.items || [];
  }

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

  let drivers = [];
  let socket;
  let driverMarkers = new Map(); // Map to store markers by driver ID
  let fullScreen = false;
  let reconnectAttempts = 0;
  let isConnected = false;
  const MAX_RECONNECT_ATTEMPTS = 300;
  const BASE_RECONNECT_TIMEOUT = 1000; // Start with 1 second and increase
  $: drivers && drivers.length && getMarkers();

  function createWebSocket() {
    socket = new WebSocket(import.meta.env.VITE_WS_URL + "/api/cars/ws");

    socket.onopen = () => {
      isConnected = true;
      reconnectAttempts = 0;
      console.log("WebSocket connection established");
    };

    socket.onmessage = (event) => {
      const data = JSON.parse(event.data);
      if (!data.documentKey || !data.updateDescription.updatedFields) return;
      const id = data.documentKey._id;
      const last_location = data.updateDescription.updatedFields.last_location;
      const status = data.updateDescription.updatedFields.status;
      if (last_location) {
        // Update the driver's last location based on the ID
        if (driverMarkers.has(id)) {
          const marker = driverMarkers.get(id);
          marker.position = {
            lat: last_location.latitude,
            lng: last_location.longitude,
          };
        }
      }
      if (status) {
        if (driverMarkers.has(id)) {
          const driver = drivers.find((x) => x._id === id);
          const marker = driverMarkers.get(id);
          const markerContent = document.createElement("div");
          markerContent.className = `marker-circle ${getMarkerClass(status)}`;
          markerContent.textContent = driver.name; // Set the marker ID
          markerContent.style.fontSize =
            driver.name.length > 4 ? "10px" : "12px";
          marker.content = markerContent;
        }
      }
    };

    socket.onclose = () => {
      console.log("WebSocket connection closed");
    };

    socket.onerror = (error) => {
      console.error("WebSocket error:", error);
      if (reconnectAttempts < MAX_RECONNECT_ATTEMPTS) {
        const reconnectTimeout =
          BASE_RECONNECT_TIMEOUT * 2 ** reconnectAttempts;
        reconnectAttempts += 1;
        setTimeout(() => {
          createWebSocket();
        }, reconnectTimeout);
      }
    };
  }

  onMount(createWebSocket);

  onDestroy(() => {
    if (socket) {
      socket.close();
    }
  });

  onMount(() => {
    // Initialize the Google Map (example coordinates)
    try {
      googleMap = new google.maps.Map(
        document.getElementById("google-map"),
        mapOptions
      );
    } catch (error) {
      console.error("Error initializing Google Map:", error);
    }

    // Fetch drivers from the API
    fetch(import.meta.env.VITE_API_URL + "/api/cars?limit=100", {
      method: "GET",
      headers: {
        Authorization: `Bearer ${localStorage.getItem("token")}`,
      },
    })
      .then((response) => response.json())
      .then((data) => {
        drivers = data.cars.sort((a, b) =>
          a.created_at.localeCompare(b.created_at)
        );
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
      markerContent.textContent = driver.name; // Set the marker ID
      markerContent.style.fontSize = driver.name.length > 4 ? "10px" : "12px";

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

        // Store the marker in the map
        driverMarkers.set(driver._id, marker);
      }
    });

    googleMap.setCenter({ lat: 44.425720718111904, lng: 8.850632846909305 });
    googleMap.setZoom(20);
  }

  // Function to determine marker class based on driver status
  function getMarkerClass(status) {
    switch (status) {
      case "free":
        return "bg-green-500 text-green-100 z-40";
      case "busy":
        return "bg-amber-500 text-amber-100 z-30";
      case "break":
        return "bg-red-500 text-red-100 z-20";
      case "garage":
        return "bg-gray-500 text-gray-100 z-10";
      default:
        return "";
    }
  }
</script>

<!-- HTML Layout -->
<div class="min-h-screen p-6">
  <div
    class="{fullScreen
      ? 'max-w-full'
      : 'container'} mx-auto py-6 transition-[max-width]"
  >
    <div class="flex items-center justify-between mb-4">
      <h1 class="mb-6 text-3xl font-bold">Mappa</h1>
      <button
        on:click={() => (fullScreen = !fullScreen)}
        class="px-4 py-3 font-bold text-white transition duration-200 rounded-lg bg-lime-600 hover:bg-lime-700"
      >
        Mostra schermo intero
      </button>
    </div>
    <!-- Search Bar -->
    <div class="relative mb-4">
      <input
        id="search-input"
        type="text"
        value={search}
        on:keyup={(e) => {
          search = e.target.value;
          clearTimeout(timeoutId);
          timeoutId = setTimeout(async () => {
            await getAutocompleteResults();
          }, 500);
        }}
        class="block w-full p-3 transition-all border border-gray-300 rounded-lg outline-none valid:border-lime-500 focus:ring-2 focus:ring-lime-600"
        placeholder="Cerca un luogo..."
      />
      {#if autocomplete_results.length > 0}
        <div
          class="absolute top-full left-0 z-50 w-full bg-white overflow-y-auto max-h-[10rem] rounded-lg shadow-md border border-gray-300"
        >
          {#each autocomplete_results as result}
            <button
              class="w-full p-2 text-left cursor-pointer hover:bg-gray-100"
              on:click={() => {
                handlePlaceSelected(result);
                autocomplete_results = [];
              }}
            >
              {result.title}
            </button>
          {/each}
        </div>
      {/if}
    </div>

    <!-- Google Map Container -->
    <div id="google-map" class="aspect-[16/7] rounded-lg shadow-md z-10"></div>
  </div>
</div>
