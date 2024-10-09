<script>
  // @ts-nocheck

  import { DateInput } from "date-picker-svelte";
  import L from "leaflet";
  import "leaflet/dist/leaflet.css";
  import { onDestroy, onMount } from "svelte";
  import { fade, fly } from "svelte/transition";
  import LoadingList from "../../components/LoadingList.svelte";

  let runs = [];
  let show_form = false;
  let showPopup = false;
  let showFinalPopup = false;
  let loading = false;
  let showMap = true;
  let cars = [];
  let freeCars = [];
  let selected_car = null;
  let selected_run = null;
  let map;
  let driver_id = "";
  let drivers = [];
  let socket;
  let currentTime = new Date();
  let currentTimeTimeout;
  $: showPopup &&
    setTimeout(() => {
      getMapInfo();
    }, 1000);
  $: showFinalPopup &&
    setTimeout(() => {
      getMapInfo();
    }, 1000);

  onMount(() => {
    const recursiveTimeout = () => {
      currentTime = new Date();
      setTimeout(recursiveTimeout, 1000);
    };
    currentTimeTimeout = setTimeout(recursiveTimeout, 1000);
  });

  onDestroy(() => {
    if (currentTimeTimeout) clearTimeout(currentTimeTimeout);
  });

  onMount(() => {
    socket = new WebSocket(import.meta.env.VITE_WS_URL + "/api/runs/admin");

    socket.onopen = () => {
      console.log("WebSocket connection established");
    };

    socket.onmessage = (event) => {
      const data = JSON.parse(event.data);
      if (
        !data.updateDescription ||
        !data.documentKey ||
        !data.updateDescription.updatedFields
      )
        return;
      const id = data.documentKey._id;
      const status = data.updateDescription.updatedFields.status;
      const car = data.updateDescription.updatedFields.car;
      const raw = localStorage.getItem("run_pinged");
      if (raw && status) {
        const run_pinged = JSON.parse(raw);
        if (run_pinged && run_pinged.run === id) {
          localStorage.removeItem("run_pinged");
        }
      }
      if (car || status) {
        runs = runs.map((run) => {
          if (run._id === id) {
            run.status = status || run.status;
            run.car = car
              ? cars.find((c) => c._id === car) || run.car
              : car === null
                ? null
                : run.car;
          }
          return run;
        });
      }
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

  function openMapPopup(id) {
    driver_id = id;
    showPopup = true;
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
  let date = new Date();

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
        freeCars = data.cars.filter((x) => x.status === "free");
      })
      .catch((error) => {
        console.error("Error:", error);
      })
      .finally(() => {
        loading = false;
      });

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
  };

  const getRunsByDate = async () => {
    loading = true;
    fetch(
      import.meta.env.VITE_API_URL + "/api/runs?date=" + date.toISOString(),
      {
        method: "GET",
        headers: {
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
      }
    )
      .then((response) => response.json())
      .then((data) => {
        runs = data.runs;
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
      if (data.run) {
        runs = runs.map((run) => {
          if (run._id === data.run._id) {
            return data.run;
          }
          return run;
        });
      }
      showPopup = false;
    } catch (error) {
      console.error("Error:", error);
    } finally {
      showPopup = false;
      showFinalPopup = true;
      await getRuns();
    }
  }

  async function pingDriver(run) {
    const exists_ping = localStorage.getItem("run_pinged");
    console.log(exists_ping);
    if (!exists_ping) {
      localStorage.setItem(
        "run_pinged",
        JSON.stringify({ run: run._id, count: 1 })
      );
    }
    const raw = localStorage.getItem("run_pinged");
    if (!raw) return;
    const run_pinged = JSON.parse(raw);
    if (run_pinged.count >= 5) {
      alert("Autista pingato troppe volte");
      return;
    }

    localStorage.setItem(
      "run_pinged",
      JSON.stringify({
        run: run._id,
        count: run._id === run_pinged.run ? parseInt(run_pinged.count) + 1 : 1,
      })
    );
    try {
      const response = await fetch(
        import.meta.env.VITE_API_URL + "/api/runs/" + run._id,
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${localStorage.getItem("token")}`,
          },
          body: JSON.stringify({ notification_sent: true, car: run.car._id }),
        }
      );
      const data = await response.json();
      runs = runs.map((r) => {
        if (r._id === data.run._id) {
          console.log("Driver pinged:", data);
          return {
            ...r,
            notification_sent: true,
            notification_time: new Date(),
            updated_at: data.run.updated_at,
          };
        }
        return r;
      });
    } catch (error) {
      console.error("Error:", error);
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
      runs = [...runs, data.run];
      show_form = false;
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
    <div class="flex justify-between items-center mb-4">
      <h1 class="text-3xl font-bold">Corse</h1>
      <button
        on:click={newRunToggle}
        class="bg-green-600 hover:bg-green-800 transition text-white font-bold py-2 px-6 rounded-lg flex items-center justify-center gap-2 shadow-md"
      >
        <span class="text-2xl">+</span>
        <span>Aggiungi Corsa</span>
      </button>
    </div>

    <div class="mb-8 flex items-center gap-4">
      <DateInput bind:value={date} format="dd/MM/yyyy" />
      <button
        on:click={getRunsByDate}
        class="bg-lime-600 hover:bg-lime-800 text-white font-bold py-2 px-4 rounded-lg transition duration-200"
      >
        Scegli data
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
              class="{run.status === 'refused'
                ? 'bg-red-200 border-red-300'
                : run.status === 'ongoing'
                  ? 'bg-amber-200 border-amber-300'
                  : run.status === 'picked_up'
                    ? 'bg-sky-200 border-sky-300'
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
                class={run.status === "refused"
                  ? "bg-red-200"
                  : run.status === "ongoing"
                    ? "bg-amber-200"
                    : run.status === "picked_up"
                      ? "bg-sky-200"
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
                        title="Annullata"
                        class="bg-red-400 w-4 h-4 rounded-full {run.status ===
                        'refused'
                          ? 'ring-4 ring-red-600'
                          : ''}"
                      ></div>
                      <div
                        title="In corso"
                        class="bg-yellow-500 w-4 h-4 rounded-full {run.status ===
                        'ongoing'
                          ? 'ring-4 ring-yellow-600'
                          : ''}"
                      ></div>
                      <div
                        title="Paziente preso"
                        class="bg-sky-500 w-4 h-4 rounded-full {run.status ===
                        'picked_up'
                          ? 'ring-4 ring-sky-600'
                          : ''}"
                      ></div>
                      <div
                        title="Paziente consegnato"
                        class="bg-green-500 w-4 h-4 rounded-full {run.status ===
                        'completed'
                          ? 'ring-4 ring-green-600'
                          : ''}"
                      ></div>
                    </div>
                    {#if run.status === "completed"}
                      <p class="text-gray-800 cursor-pointer py-2 px-6">
                        Corsa completata
                      </p>
                    {:else if run.car && run.status !== "refused"}
                      <p class="text-gray-800 cursor-pointer">
                        Mezzo assegnato: <span class="hover:underline"
                          >{run.car.name} - {run.car.user
                            ? `${run.car.user.first_name} ${
                                run.car.user.last_name
                              }`
                            : "Nessun driver"}</span
                        >
                      </p>
                    {:else if run.status !== "refused"}
                      <button
                        on:click={() => openPopup(run)}
                        class="bg-lime-500 hover:bg-lime-600 transition text-white font-bold py-2 px-6 rounded-lg"
                      >
                        Assegna corsa
                      </button>
                    {:else}
                      <button
                        on:click={() => openPopup(run)}
                        class="bg-lime-500 hover:bg-lime-600 transition text-white font-bold py-2 px-6 rounded-lg"
                      >
                        Riassegna corsa
                      </button>
                    {/if}
                    {#if run.status === "pending" && run.car}
                      <button
                        disabled={currentTime.getTime() <
                          new Date(run.updated_at).getTime() + 30000}
                        on:click={() =>
                          currentTime.getTime() <
                          new Date(run.updated_at).getTime() + 30000
                            ? null
                            : pingDriver(run)}
                        class="bg-lime-700 hover:bg-lime-800 disabled:bg-gray-600 transition text-white font-bold py-2 px-6 rounded-lg"
                      >
                        {currentTime.getTime() <
                        new Date(run.updated_at).getTime() + 30000
                          ? Math.floor(
                              (new Date(run.updated_at).getTime() +
                                30000 -
                                currentTime.getTime()) /
                                1000
                            )
                          : "Notifica autista"}
                      </button>
                    {/if}
                    <p>
                      {currentTime.getTime()}
                      {new Date(run.updated_at).getTime() + 30000}
                    </p>
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
    class="fixed inset-0 overflow-hidden z-40 flex items-center flex-col gap-10 justify-center p-4 bg-white transition-opacity duration-500"
  >
    <div class="flex max-w-screen-lg w-full mx-auto pt-32 relative">
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

      <button
        class="absolute text-3xl top-32 mt-2 right-6 text-gray-600 hover:text-gray-800"
        on:click={() => {
          show_form = false;
          showPopup ? (showPopup = false) : null;
          map = null;
          showFinalPopup ? (showFinalPopup = false) : null;
        }}
        aria-label="Close form"
      >
        ✕
      </button>
    </div>
    <div class="max-w-screen-lg w-full overflow-y-auto">
      {#if show_form}
        <!-- Form Modal -->
        <div class="z-50 transform transition-all duration-500">
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
                      placeholder="Cerca..."
                      class="autocomplete-input block w-full border valid:border-lime-500 outline-none border-gray-300 rounded-lg p-3 focus:ring-2 focus:ring-lime-600 transition-all"
                      value={new_run[meta_verifier[key]]}
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
              {#each freeCars as car}
                <tr
                  class="border-b cursor-pointer {selected_car === car._id
                    ? 'bg-lime-100'
                    : 'bg-gray-50'}"
                  on:click={() => {
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
                  <td class="py-3 px-4 border-r font-bold">
                    {#if car.status === "free"}
                      <span
                        class="text-green-900 bg-green-300 px-4 rounded-full inline-block text-sm py-1"
                        >Disponibile</span
                      >
                    {:else if car.status === "on_break"}
                      <span
                        class="text-yellow-900 bg-yellow-200 px-4 rounded-full inline-block text-sm py-1"
                        >Pausa</span
                      >
                    {:else if car.status === "garage"}
                      <span
                        class="text-gray-900 bg-gray-300 px-4 rounded-full inline-block text-sm py-1"
                        >Al deposito</span
                      >
                    {:else}
                      <span
                        class="text-red-900 bg-red-200 px-4 rounded-full inline-block text-sm py-1"
                        >Non disponibile</span
                      >
                    {/if}
                  </td>
                  <td class="py-3 px-4"
                    >{car.user
                      ? `${car.user.first_name} ${car.user.last_name}`
                      : "Nessun driver"}</td
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
        <div class="z-50 transform transition-all duration-500">
          <h2 class="text-3xl font-bold mb-6">
            Hai assegnato la corsa al mezzo
          </h2>
          <p class="text-gray-700 mb-6">
            Il guidatore riceverà una notifica per l'accettazione della corsa
          </p>
          <button
            class="bg-lime-700 hover:bg-lime-900 text-white font-bold py-2 px-6 rounded-lg mb-4"
            on:click={() => {
              show_form = true;
              showFinalPopup = false;
            }}
          >
            Crea un’altra corsa
          </button>
          <!-- Map Container -->
          <div
            id="map"
            class="aspect-[16/7] max-w-2xl rounded-lg shadow-md z-10 mb-8"
          ></div>

          <button
            class="bg-lime-700 hover:bg-lime-900 text-white font-bold py-2 px-6 rounded-lg ml-auto block"
            on:click={() => (showFinalPopup = false)}
            aria-label="Close form"
          >
            Torna alla gestione corse
          </button>
        </div>
      {/if}
    </div>
  </div>
{/if}
