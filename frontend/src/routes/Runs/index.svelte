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
  let carSocket;
  let currentTime = new Date();
  let currentTimeTimeout;
  let additionalRuns = [];
  let additionalRunsMeta = {
    Data: "date",
    Ora: "ora",
    Partenza: "partenza",
    Arrivo: "arrivo",
  };
  let meta_verifier = {
    Ora: "ora",
    Data: "date",
    Paziente: "paziente",
    "C/S/B": "csb",
    Servizio: "servizio",
    Tel: "tel",
    "N. Richiesta": "n_richiesta",
    Ricevuta: "ricevuta",
    Viaggi: "viaggio",
    Partenza: "partenza",
    Arrivo: "arrivo",
    "Note particolari": "note_particolari",
  };

  let carReconnectAttempts = 0;
  let isCarConnected = false;
  const MAX_RECONNECT_ATTEMPTS = 300;
  const BASE_RECONNECT_TIMEOUT = 1000; // Start with 1 second and increase

  $: showPopup &&
    setTimeout(() => {
      getMapInfo();
    }, 1000);

  $: showFinalPopup &&
    setTimeout(() => {
      getMapInfo();
    }, 1000);

  $: (() => {
    if (!runs.length) return;
    const readyToGo = runs.filter((x) => x.readyToGo).map((x) => x._id);
    localStorage.setItem("ready_runs", JSON.stringify(readyToGo));
  })();

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
        const found_run = runs.find((x) => x._id === id);
        console.log(found_run);
        if (found_run.car) {
          freeCars = cars
            .map((c) => {
              if (c._id === found_run.car._id) {
                c.status = status === "completed" ? "free" : "busy";
              }
              return c;
            })
            .filter((x) => x.status === "free");
        }
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

  function createWebSocket() {
    carSocket = new WebSocket(import.meta.env.VITE_WS_URL + "/api/cars/ws");

    carSocket.onopen = () => {
      isCarConnected = true;
      carReconnectAttempts = 0;
      console.log("WebSocket connection established");
    };

    carSocket.onmessage = (event) => {
      const data = JSON.parse(event.data);
      if (!data.documentKey || !data.updateDescription.updatedFields) return;
      const id = data.documentKey._id;
      const status = data.updateDescription.updatedFields.status;

      if (status) {
        freeCars = cars
          .map((car) => {
            if (car._id === id) {
              car.status = status || car.status;
            }
            return car;
          })
          .filter((x) => x.status === "free");
      }
    };

    carSocket.onclose = () => {
      console.log("WebSocket connection closed");
    };

    carSocket.onerror = (error) => {
      console.error("WebSocket error:", error);
      if (carReconnectAttempts < MAX_RECONNECT_ATTEMPTS) {
        const reconnectTimeout =
          BASE_RECONNECT_TIMEOUT * 2 ** carReconnectAttempts;
        carReconnectAttempts += 1;
        setTimeout(() => {
          createWebSocket();
        }, reconnectTimeout);
      }
    };
  }

  onMount(createWebSocket);

  onDestroy(() => {
    if (carSocket) {
      carSocket.close();
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

    if (selected_run.partenza && selected_run.arrivo) {
      const partenzaIcon = L.divIcon({
        className: "custom-marker", // Custom CSS class for styling
        html: `<div class="marker-circle bg-indigo-500 text-indigo-100">A</div>`,
        iconSize: [20, 20], // Size of the marker
      });

      const partenzaMarker = L.marker(
        [selected_run.geometry.latitude, selected_run.geometry.longitude],
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
        [
          selected_run.end_geometry.latitude,
          selected_run.end_geometry.longitude,
        ],
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

  let date = new Date();

  const getRuns = async () => {
    // get query params and set initial variables to url params
    const urlParams = new URLSearchParams(window.location.search);
    const dateParam = urlParams.get("date");
    const patient = urlParams.get("patient");
    const status = urlParams.get("status");
    loading = true;
    if (dateParam) {
      date = new Date(dateParam);
    }
    fetch(
      import.meta.env.VITE_API_URL +
        `/api/runs?patient=${patient || ""}&meta_date=${date.toISOString().split("T")[0]}&status=${
          status || ""
        }`,
      {
        method: "GET",
        headers: {
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
      }
    )
      .then((response) => response.json())
      .then((data) => {
        const readyString = localStorage.getItem("ready_runs");
        if (readyString) {
          const js = JSON.parse(readyString);
          runs = data.runs.map((x) => {
            return {
              ...x,
              readyToGo: js.includes(x._id) ? true : false,
            };
          });
        } else runs = data.runs;
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
    if (date.toLocaleDateString() !== new Date().toLocaleDateString()) {
      window.history.replaceState(
        {},
        "",
        window.location.pathname + `?date=${date.toISOString().split("T")[0]}`
      );
    } else {
      window.history.replaceState({}, "", window.location.pathname);
    }
    fetch(
      import.meta.env.VITE_API_URL +
        "/api/runs?meta_date=" +
        date.toISOString().split("T")[0],
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
      map = null;
    } catch (error) {
      console.error("Error:", error);
    } finally {
      showPopup = false;
      map = null;
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
      <h1 class="text-3xl font-bold">Gestione Trasporti</h1>
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
              {#if key === "Ora"}
                <span></span>
              {:else if key === "Data"}
                <th
                  class="py-3 px-4 text-left w-48 font-semibold text-gray-700 border-b"
                  >{key} / Ora</th
                >
              {:else if key !== "Titolo" && key !== "Note particolari"}
                <th
                  class="py-3 px-4 text-left font-semibold text-gray-700 border-b"
                  >{key}</th
                >
              {/if}
            {/each}
            <th class="py-3 px-4 text-left font-semibold text-gray-700 border-b"
              >Pronto</th
            >
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
                      : run.readyToGo
                        ? 'bg-violet-200 border-violet-300'
                        : 'bg-gray-50'} border-b border-l"
            >
              {#each Object.keys(meta_verifier) as key}
                {#if key === "Ora"}
                  <span></span>
                {:else if key !== "Titolo" && key !== "Paziente" && key !== "Note particolari" && key !== "Data"}
                  <td
                    class="py-3 px-4 border-r border-inherit {key ===
                      'Partenza' || key === 'Arrivo'
                      ? 'w-56'
                      : key === 'C/S/B'
                        ? 'uppercase'
                        : ''}">{run.meta[meta_verifier[key]]}</td
                  >
                {:else if key === "Data"}
                  <td class="py-3 px-4 border-r border-inherit"
                    >{new Date(run.meta[meta_verifier[key]]).toLocaleDateString(
                      "it-IT"
                    ) ?? run.created_at}<br />{run.meta.ora || "-"}</td
                  >
                {:else if key === "Paziente"}
                  <td class="py-3 px-4 border-r border-inherit">
                    <button
                      class="text-blue-800 font-semibold underline"
                      on:click={() => {
                        run.visibleInfo = !run.visibleInfo;
                      }}
                    >
                      {run.meta[meta_verifier[key]] ||
                        run.patient.name ||
                        "Nessun paziente"}
                    </button>
                  </td>
                {/if}
              {/each}
              <td class="py-3 px-4 border-r border-inherit text-center">
                <input
                  type="checkbox"
                  class="w-6 h-6 inline-block cursor-pointer accent-purple-600"
                  checked={run.readyToGo}
                  on:click={() => {
                    run.readyToGo = !run.readyToGo;
                  }}
                />
              </td>
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
          class="flex items-center pr-10 transition border-b-2 border-gray-300"
        >
          <div
            class="flex items-end gap-3 transition text-gray-300 font-semibold"
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
            Torna alla gestione trasporti
          </button>
        </div>
      {/if}
    </div>
  </div>
{/if}
