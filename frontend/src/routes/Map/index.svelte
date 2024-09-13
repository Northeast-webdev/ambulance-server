<script>
  // @ts-nocheck
  import L from "leaflet";
  import "leaflet/dist/leaflet.css";
  import { onMount } from "svelte";
  import Popover from "./Popover.svelte";

  let map;
  let showPopup = false;
  let driver_id = "";
  let drivers = [
    {
      name: "Allen Jack",
      lat: 40.7128,
      lng: -74.006,
      status: "Available",
      id: 1,
    },
    { name: "John Snow", lat: 40.7228, lng: -74.006, status: "On Trip", id: 2 },
    {
      name: "Luca Brasi",
      lat: 40.7138,
      lng: -74.016,
      status: "On Trip",
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
            : driver.status === "On Trip"
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
    showPopup = true;
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
          showPopup = true;
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
</script>

<div class="min-h-screen p-6">
  <div class="container mx-auto py-6 px-3">
    <h1 class="text-3xl font-bold mb-6">Tracking Map</h1>
    <!-- Map Container -->
    <div id="map" class="aspect-[16/7] rounded-lg shadow-md z-10"></div>
  </div>
  <!-- Popup/Modal for additional information -->
  {#if showPopup}
    <div
      class="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50 z-50"
    >
      <div class="bg-white rounded-lg p-8 shadow-lg w-full max-w-sm">
        <h2 class="text-lg font-semibold text-green-800 mb-4">Assign a run</h2>
        <p class="text-gray-700 mb-6">This is a placeholder for the form.</p>
        <button
          on:click={() => (showPopup = false)}
          class="px-4 py-2 text-white bg-green-500 hover:bg-green-600 rounded w-full"
        >
          Close
        </button>
      </div>
    </div>
  {/if}
</div>
