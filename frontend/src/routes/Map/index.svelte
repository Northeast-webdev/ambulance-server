<script>
  // @ts-nocheck

  import { onDestroy, onMount } from "svelte";
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
  let drivers = [];
  let map;
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

  function getMapInfo() {
    if (map) return;
    // Initialize the Leaflet map
    map = L.map("map").setView([40.7128, -74.006], 13);

    // Add OpenStreetMap tiles
    L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png").addTo(
      map
    );

    // Add markers for drivers
    drivers.forEach((driver, i) => {
      // Create a custom DivIcon for each marker with the driver's ID
      const customIcon = L.divIcon({
        className: "custom-marker", // Custom CSS class for styling
        html: `<div style="font-size: ${driver.name.length > 4 ? "10px" : "12px"}" class="marker-circle ${
          driver.status === "free"
            ? "bg-green-500 text-green-100 z-30"
            : driver.status === "busy"
              ? "bg-amber-500 text-amber-100 z-20"
              : driver.status === "garage"
                ? "bg-gray-500 text-gray-100 z-20"
                : "bg-red-500 text-red-100 z-10"
        }">${driver.name}</div>`, // Inner HTML to show the ID
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

      // Zoom and center the map to the selected place
      googleMap.setCenter(place.geometry.location);
      googleMap.setZoom(17);
    });

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
    <div class="flex mb-4 justify-between items-center">
      <h1 class="text-3xl font-bold mb-6">Mappa</h1>
      <button
        on:click={() => (fullScreen = !fullScreen)}
        class="bg-lime-600 hover:bg-lime-700 text-white font-bold py-3 px-4 rounded-lg transition duration-200"
      >
      Mostra schermo intero
      </button>
    </div>
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
