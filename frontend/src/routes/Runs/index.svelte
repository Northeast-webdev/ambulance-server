<script>
  // @ts-nocheck

  import { DateInput } from "date-picker-svelte";
  import L from "leaflet";
  import "leaflet/dist/leaflet.css";
  import { onDestroy, onMount } from "svelte";
  import { fade, fly } from "svelte/transition";
  import LoadingList from "../../components/LoadingList.svelte";
  import { user } from "../../stores";
  import { Link } from "svelte-navigator";

  let runs = [];
  let sortedRuns = [];
  let sortedBy = {
    key: null,
    direction: null,
  }; // {key: "asc" | "desc"}
  let showPopup = false;
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

  let loadingCoordinatore = {};
  let carReconnectAttempts = 0;
  let isCarConnected = false;

  let presetAddresses = [
    {
      label: "HO",
      full: "Sestri Levante Hospital, Via A. Terzi 37",
    },
    {
      label: "HM",
      full: "Ospedale Padre Antero Micone, Largo Nevio Rosso 2",
    },
    {
      label: "HSC",
      full: "Ospedale San Carlo, P.le Efisio Gianasso 4",
    },
    {
      label: "HCA",
      full: "Ospedale La Colletta, Via Giappone 5",
    },
    {
      label: "HGLR",
      full: "Ente Ospedaliero Galliera, Via Alessandro Volta 6",
    },
    {
      label: "HVS",
      full: "Ospedale Villa Scassi, Corso Onofrio Scassi 1",
    },
    {
      label: "HSM",
      full: "Ospedale San Martino, Largo Rosanna Benzi 10",
    },
    {
      label: "IST",
      full: "IST Sud, Largo Rosanna Benzi",
    },
    {
      label: "HGSL",
      full: "Ospedale Gaslini, Via Gerolamo Gaslini 5",
    },
  ];
  const MAX_RECONNECT_ATTEMPTS = 300;
  const BASE_RECONNECT_TIMEOUT = 1000; // Start with 1 second and increase

  $: showPopup &&
    setTimeout(() => {
      getMapInfo();
    }, 300);

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
      console.log(data.updateDescription);
      if (raw && status) {
        const run_pinged = JSON.parse(raw);
        if (run_pinged && run_pinged.run === id) {
          localStorage.removeItem("run_pinged");
        }
      }
      const found_run = runs.find((x) => x._id === id);
      runs = runs.map((run) => {
        if (run._id === id) {
          run.status = status || run.status;
          run.car =
            car === null
              ? null
              : run.car
                ? run.car
                : cars.find((c) => c._id === car);
        }
        return run;
      });
      sortedRuns = runs;
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

    carSocket.onmessage = async (event) => {
      const data = JSON.parse(event.data);
      let newUser = {};
      if (!data.documentKey || !data.updateDescription.updatedFields) return;
      const id = data.documentKey._id;
      const status = data.updateDescription.updatedFields.status;
      const u = data.updateDescription.updatedFields.user;
      if (u) {
        const response = await fetch(
          import.meta.env.VITE_API_URL + "/api/users/" + u,
          {
            method: "GET",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${localStorage.getItem("token")}`,
            },
          }
        );
        const data = await response.json();
        newUser = {
          first_name: data.first_name,
          last_name: data.last_name,
          _id: data._id,
        };
      }
      if (status) {
        freeCars = cars
          .map((car) => {
            if (car._id === id) {
              car.status = status || car.status;
              if (newUser._id) {
                car.user = newUser;
              }
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
    if (map || !document.getElementById("map")) return;
    try {
      // Initialize the Leaflet map
      map = L.map("map").setView([40.7128, -74.006], 13);

      // Add OpenStreetMap tiles
      L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png").addTo(
        map
      );

      if (selected_run.partenza && selected_run.arrivo) {
        const partenzaIcon = L.divIcon({
          className: "custom-marker", // Custom CSS class for styling
          html: `<div class="text-indigo-100 bg-indigo-500 marker-circle">A</div>`,
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
          html: `<div class="text-indigo-100 bg-indigo-500 marker-circle">B</div>`,
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
      });
      map.setView(
        [drivers[0].last_location.latitude, drivers[0].last_location.longitude],
        16
      );
    } catch (error) {
      console.error("Error:", error);
    }
  }

  function openMapPopup(id) {
    driver_id = id;
    map = null;
    showPopup = true;
  }

  let date = new Date();

  const cancelRun = async (run) => {
    const confirmation = prompt("Sei sicuro? Digita 'SI' per confermare");
    if (confirmation && confirmation.match(new RegExp("si", "gi"))) {
      console.log("cancelled run", run);
      try {
        const response = await fetch(
          import.meta.env.VITE_API_URL + "/api/runs/" + run._id,
          {
            method: "PUT",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${localStorage.getItem("token")}`,
            },
            body: JSON.stringify({
              status: "pending",
              car: "",
              run_cancelled: true,
            }),
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
          sortedRuns = runs;
        }
      } catch (error) {
        console.error("Error:", error);
      }
    }
  };

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
        `/api/runs?limit=1000&patient=${patient || ""}&meta_date=${date.toISOString().split("T")[0]}&status=${
          status || "ACTIVE"
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
        sortedRuns = runs;
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
        drivers = data.cars;
      })
      .catch((error) => {
        console.error("Error:", error);
      })
      .finally(() => {
        loading = false;
      });
  };

  const getRunsByDate = async (status = "ACTIVE") => {
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
        "/api/runs?limit=1000&meta_date=" +
        date.toISOString().split("T")[0] +
        (status !== "" ? "&status=" + status : ""),
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
        sortedRuns = runs;
      })
      .catch((error) => {
        console.error("Error:", error);
      })
      .finally(() => {
        loading = false;
      });
  };

  onMount(getRuns);

  async function updateRun(isProgrammed = false) {
    if (!selected_car) {
      return;
    }
    const query = {
      car: selected_car,
    };
    if (isProgrammed) {
      query.status = "ongoing";
      query.programmed = true;
    } else {
      query.programmed = false;
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
          body: JSON.stringify(query),
        }
      );
      const data = await response.json();
      if (data.run) {
        runs = runs.map((run) => {
          if (run._id === data.run._id) {
            return { ...data.run, visibleInfo: true };
          }
          return run;
        });
        sortedRuns = runs;
      }
    } catch (error) {
      console.error("Error:", error);
    } finally {
      showPopup = false;
      map = null;
      setTimeout(() => {
        if (!map) return;
        map.setView(
          [
            cars.find((x) => x._id === selected_car).last_location.latitude,
            cars.find((x) => x._id === selected_car).last_location.longitude,
          ],
          16
        );
      }, 500);
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
    if (run_pinged.count >= 3) {
      const response = await fetch(
        import.meta.env.VITE_API_URL + "/api/runs/" + run._id,
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${localStorage.getItem("token")}`,
          },
          body: JSON.stringify({ status: "refused" }),
        }
      );

      localStorage.setItem(
        "run_pinged",
        JSON.stringify({
          run: run._id,
          count: 0,
        })
      );
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
      sortedRuns = runs;
    } catch (error) {
      console.error("Error:", error);
    }
  }

  function openPopup(run) {
    showPopup = true;
    selected_run = run._id;
  }

  // Add this computed property to group and sort runs by patient
  $: groupedRuns = runs.reduce((acc, run) => {
    const patientId = run.patient._id;
    if (!acc[patientId]) {
      acc[patientId] = [];
    }
    acc[patientId].push(run);
    return acc;
  }, {});

  // Function to get A/R based on patient's runs
  function getARIndicator(run) {
    const patientRuns = groupedRuns[run.patient._id];
    const runIndex = patientRuns.findIndex((r) => r._id === run._id);
    return runIndex % 2 === 0 ? "A" : "R";
  }

  async function saveCoordinatore(run) {
    loadingCoordinatore[run._id] = true;
    const response = await fetch(
      import.meta.env.VITE_API_URL + "/api/runs/" + run._id,
      {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
        body: JSON.stringify({
          meta: {
            ...run.meta,
            coordinatore: run.meta.coordinatore,
          },
        }),
      }
    );
    const data = await response.json();
    loadingCoordinatore[run._id] = false;
    run.show_coordinatore = false;
  }
</script>

{#if loading}
  <LoadingList />
{:else}
  <div class="container px-3 py-6 mx-auto">
    <div class="flex items-center justify-between mb-4">
      <h1 class="text-3xl font-bold">Gestione Giornaliera</h1>
    </div>

    <div class="flex items-center gap-4 mb-4">
      <DateInput bind:value={date} format="dd/MM/yyyy" />
      <button
        on:click={() => getRunsByDate()}
        class="px-4 py-2 font-bold text-white transition duration-200 rounded-lg bg-lime-600 hover:bg-lime-800"
      >
        Scegli data
      </button>
    </div>
    <div class="flex items-center gap-4 mb-4">
      <button
        on:click={() => {
          getRunsByDate();
        }}
        type="button"
        class="px-4 py-2 text-sm font-bold text-black transition duration-200 bg-gray-300 border border-gray-500"
      >
        Giornaliera in corso
      </button>
      <button
        on:click={() => {
          getRunsByDate("completed");
        }}
        type="button"
        class="px-4 py-2 text-sm font-bold text-black transition duration-200 bg-gray-300 border border-gray-500"
      >
        Giornaliera completata
      </button>
    </div>
    <!-- Table Container with Overflow for Responsiveness -->
    <div class="overflow-x-auto">
      <table class="min-w-full overflow-hidden border-collapse shadow-lg">
        <thead class="text-sm bg-gradient-to-l from-gray-200 to-gray-300">
          <tr>
            {#if $user.role === "administrator" || $user.role === "operator"}
              <th
                class="px-4 py-3 font-semibold text-left text-gray-700 border border-gray-400"
                >Coordinatore</th
              >
            {/if}
            <th
              class="px-4 py-3 font-semibold text-left text-gray-700 border border-gray-400"
              >Pronto</th
            >
            <th
              class="p-3 font-semibold text-center text-gray-700 border border-gray-400"
              >A/R</th
            >
            {#each Object.keys(meta_verifier) as key}
              {#if key === "Ora"}
                <span></span>
              {:else if key === "Data"}
                <th
                  class="w-48 px-4 py-3 font-semibold text-left text-gray-700 border border-gray-400"
                  >{key} / Ora</th
                >
              {:else if key !== "Titolo" && key !== "Note particolari"}
                <th
                  class={"px-4 py-3 font-semibold text-left text-gray-700 border border-gray-400 min-w-24 " +
                    (key === "Paziente" ||
                    key === "Arrivo" ||
                    key === "Partenza" ||
                    key === "Servizio"
                      ? "cursor-pointer bg-slate-300 border-gray-500"
                      : "")}
                  on:click={() => {
                    if (
                      key === "Paziente" ||
                      key === "Arrivo" ||
                      key === "Partenza" ||
                      key === "Servizio"
                    ) {
                      sortedBy.key = key;
                      sortedBy.direction =
                        sortedBy.direction === "asc" ? "desc" : "asc";
                      sortedRuns = [...runs].sort((a, b) => {
                        if (key === "Paziente") {
                          return sortedBy.direction === "asc"
                            ? a.patient.name.localeCompare(b.patient.name)
                            : b.patient.name.localeCompare(a.patient.name);
                        } else {
                          return sortedBy.direction === "asc"
                            ? a.meta[meta_verifier[sortedBy.key]].localeCompare(
                                b.meta[meta_verifier[sortedBy.key]]
                              )
                            : b.meta[meta_verifier[sortedBy.key]].localeCompare(
                                a.meta[meta_verifier[sortedBy.key]]
                              );
                        }
                      });
                    }
                  }}
                >
                  <span
                    class="flex items-center justify-between gap-2 select-none"
                  >
                    {key}
                    <span class="text-sm">
                      {sortedBy.key === key
                        ? sortedBy.direction === "asc"
                          ? "▲"
                          : "▼"
                        : ""}
                    </span>
                  </span>
                </th>
              {/if}
            {/each}
            <th
              class="px-4 py-3 font-semibold text-left text-gray-700 border border-gray-400"
              >Note particolari</th
            >
          </tr>
        </thead>
        <tbody class="text-sm">
          {#each sortedRuns as run, index}
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
              {#if $user.role === "administrator" || $user.role === "operator"}
                <td
                  class="border-r border-inherit text-center font-bold {run.show_coordinatore
                    ? 'min-w-[200px]'
                    : 'min-w-[100px]'}"
                >
                  {#if !run.show_coordinatore}
                    <p class="text-sm font-normal">
                      {run.meta.coordinatore || "-"}
                    </p>
                    <button
                      class="px-2 py-1 mt-1 text-sm font-bold text-white transition duration-200 bg-slate-600 hover:bg-slate-700"
                      on:click={() => {
                        run.show_coordinatore = true;
                      }}
                    >
                      Modifica
                    </button>
                  {:else}
                    <textarea
                      class="block w-full h-full p-2 text-sm font-normal border-2 border-gray-300"
                      bind:value={run.meta.coordinatore}
                    ></textarea>
                    <button
                      class="w-full p-1 text-sm font-bold text-white transition duration-200 bg-lime-600 disabled:bg-gray-600"
                      on:click={() => saveCoordinatore(run)}
                      disabled={loadingCoordinatore[run._id]}
                    >
                      {loadingCoordinatore[run._id] ? "Salvando..." : "Salva"}
                    </button>
                  {/if}
                </td>
              {/if}
              <td class="px-4 py-3 text-center border-r border-inherit">
                {#if run.status === "pending"}
                  <input
                    type="checkbox"
                    class="inline-block w-6 h-6 cursor-pointer accent-purple-600"
                    checked={run.readyToGo}
                    on:click={() => {
                      run.readyToGo = !run.readyToGo;
                    }}
                  />
                {/if}
              </td>
              <td
                class="p-3 font-bold text-center border-r border-inherit min-w-14"
              >
                {getARIndicator(run)}
              </td>
              {#each Object.keys(meta_verifier) as key}
                {#if key === "Ora"}
                  <span></span>
                {:else if key !== "Titolo" && key !== "Paziente" && key !== "Note particolari" && key !== "Data"}
                  <td
                    class="py-3 px-4 border-r border-inherit break-words {key ===
                      'Partenza' || key === 'Arrivo'
                      ? 'w-56'
                      : key === 'C/S/B'
                        ? 'uppercase'
                        : 'max-w-40'}"
                    >{key === "Partenza" || key === "Arrivo"
                      ? presetAddresses.find(
                          (address) =>
                            address.full === run.meta[meta_verifier[key]]
                        )?.label || run.meta[meta_verifier[key]]
                      : run.meta[meta_verifier[key]]}</td
                  >
                {:else if key === "Data"}
                  <td class="px-4 py-3 border-r border-inherit"
                    >{new Date(run.meta[meta_verifier[key]]).toLocaleDateString(
                      "it-IT"
                    ) ?? run.created_at}<br />{run.meta.ora || "-"}</td
                  >
                {:else if key === "Paziente"}
                  <td class="px-4 py-3 border-r border-inherit">
                    <div class="flex flex-col gap-2">
                      <button
                        class="block mx-auto font-semibold text-blue-700 underline"
                        on:click={() => {
                          run.visibleInfo = !run.visibleInfo;
                        }}
                      >
                        {run.patient.name + " " + (run.patient.surname || "") ||
                          "Nessun paziente"}
                      </button>

                      <Link
                        class="block px-2 py-1 mx-auto text-xs font-bold text-center text-white transition duration-200 bg-stone-600 hover:bg-stone-700"
                        to={`/pazienti?name=${run.patient.name}&surname=${run.patient.surname}`}
                      >
                        Vedi dettagli
                      </Link>
                    </div>
                  </td>
                {/if}
              {/each}
              <td class="px-4 py-3 border-r border-inherit"
                >{run.meta.note_particolari}</td
              >
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
                  class="px-4 py-3"
                  colspan={Object.keys(meta_verifier).length + 3}
                >
                  <div
                    class="flex items-center justify-between mx-auto max-w-[80%]"
                  >
                    <div class="flex items-center gap-4">
                      <p class="text-gray-800">Status paziente</p>
                      <div
                        class="flex items-center gap-2 text-sm"
                        title="Annullata"
                      >
                        <div
                          class="bg-red-400 w-4 h-4 rounded-full {run.status ===
                          'refused'
                            ? 'ring-4 ring-red-600'
                            : ''}"
                        ></div>
                        Annullata
                      </div>
                      <div
                        title="In corso"
                        class="flex items-center gap-2 text-sm"
                      >
                        <div
                          class="bg-yellow-500 w-4 h-4 rounded-full {run.status ===
                          'ongoing'
                            ? 'ring-4 ring-yellow-600'
                            : ''}"
                        ></div>
                        In corso
                      </div>
                      <div
                        title="Paziente preso"
                        class="flex items-center gap-2 text-sm"
                      >
                        <div
                          class="bg-sky-500 w-4 h-4 rounded-full {run.status ===
                          'picked_up'
                            ? 'ring-4 ring-sky-600'
                            : ''}"
                        ></div>
                        Paziente preso
                      </div>
                      <div
                        title="Paziente consegnato"
                        class="flex items-center gap-2 text-sm"
                      >
                        <div
                          class="bg-green-500 w-4 h-4 rounded-full {run.status ===
                          'completed'
                            ? 'ring-4 ring-green-600'
                            : ''}"
                        ></div>
                        Paziente consegnato
                      </div>
                    </div>
                    {#if run.status === "completed"}
                      <p class="px-6 py-2 text-gray-800 cursor-pointer">
                        Corsa completata
                      </p>
                    {:else if run.car}
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
                        class="px-6 py-2 font-bold text-white transition rounded-lg bg-lime-500 hover:bg-lime-600"
                      >
                        Assegna corsa
                      </button>
                    {:else}
                      <button
                        on:click={openPopup(run)}
                        class="px-6 py-2 font-bold text-white transition rounded-lg bg-lime-700 hover:bg-lime-800 disabled:bg-gray-600"
                        >Riassegna corsa
                      </button>
                    {/if}
                    <!--
                    {:else}
                      <button
                        disabled={currentTime.getTime() <
                          new Date(run.updated_at).getTime() + 60000}
                        on:click={() =>
                          currentTime.getTime() <
                          new Date(run.updated_at).getTime() + 60000
                            ? null
                            : openPopup(run)}
                        class="px-6 py-2 font-bold text-white transition rounded-lg bg-lime-700 hover:bg-lime-800 disabled:bg-gray-600"
                      >
                        {currentTime.getTime() <
                        new Date(run.updated_at).getTime() + 60000
                          ? Math.floor(
                              (new Date(run.updated_at).getTime() +
                                60000 -
                                currentTime.getTime()) /
                                1000,
                            )
                          : "Riassegna corsa"}
                      </button>
                    {/if}
                    {#if run.status === "pending" && run.car}
                      <button
                        disabled={currentTime.getTime() <
                          new Date(run.updated_at).getTime() + 60000}
                        on:click={() =>
                          currentTime.getTime() <
                          new Date(run.updated_at).getTime() + 60000
                            ? null
                            : pingDriver(run)}
                        class="px-6 py-2 font-bold text-white transition rounded-lg bg-lime-700 hover:bg-lime-800 disabled:bg-gray-600"
                      >
                        { currentTime.getTime() <
                        new Date(run.updated_at).getTime() + 60000
                          ? Math.floor(
                              (new Date(run.updated_at).getTime() +
                                60000 -
                                currentTime.getTime()) /
                                1000,
                            )
                          : "Notifica autista"}
                      </button>
                    {/if}
                    !-->
                    {#if run.status === "pending" && run.car}
                      <button
                        on:click={() => pingDriver(run)}
                        class="px-6 py-2 font-bold text-white transition rounded-lg bg-lime-700 hover:bg-lime-800 disabled:bg-gray-600"
                        >Notifica autista
                      </button>
                    {/if}

                    {#if run.status !== "completed" && run.status !== "picked_up" && run.car}
                      <button
                        on:click={() => cancelRun(run)}
                        class="px-6 py-2 font-bold text-white transition bg-red-500 rounded-lg hover:bg-red-600"
                      >
                        Annulla corsa
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
{#if showPopup}
  <div
    transition:fade={{ duration: 300 }}
    class="fixed inset-0 z-40 flex flex-col items-center gap-10 p-4 pt-10 overflow-hidden transition-opacity duration-500 bg-white top-20"
  >
    <div class="container w-full overflow-y-auto">
      {#if showPopup}
        <!-- Form Modal -->
        <div class="z-50 transition-all duration-500 transform">
          <div class="flex items-center justify-between">
            <h2 class="mb-6 text-3xl font-bold">Assegnazione a mezzo</h2>
          </div>
          <h2 class="mb-6 text-2xl font-bold">Lista veicoli</h2>
          <div class="flex gap-10">
            <div class="flex-grow-0">
              <table
                class="min-w-full overflow-hidden border-collapse rounded-lg shadow-lg"
              >
                <thead class="bg-gradient-to-l from-gray-200 to-gray-300">
                  <tr>
                    <th
                      class="px-4 py-2 font-semibold text-left text-gray-700 border-b"
                    ></th>
                    <th
                      class="px-4 py-2 font-semibold text-left text-gray-700 border-b"
                      >Nome</th
                    >
                    <th
                      class="px-4 py-2 font-semibold text-left text-gray-700 border-b"
                      >Modello</th
                    >
                    <th
                      class="px-4 py-2 font-semibold text-left text-gray-700 border-b"
                      >Marca</th
                    >
                    <th
                      class="px-4 py-2 font-semibold text-left text-gray-700 border-b"
                      >Status</th
                    >
                    <th
                      class="px-4 py-2 font-semibold text-left text-gray-700 border-b"
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
                        if (!map) return;
                        map.setView(
                          [
                            car.last_location.latitude,
                            car.last_location.longitude,
                          ],
                          16
                        );
                        selected_car === car._id
                          ? (selected_car = null)
                          : (selected_car = car._id);
                      }}
                    >
                      <td class="text-center border-r">
                        <input
                          type="radio"
                          class="w-4 h-4 bg-gray-200 border border-gray-300 rounded-full appearance-none pointer-events-none checked:bg-lime-600 checked:border-transparent checked:text-white checked:ring-2 checked:ring-lime-600 checked:ring-offset-2 checked:ring-offset-gray-200"
                          checked={selected_car === car._id}
                        />
                      </td>
                      <td class="px-4 py-2 border-r">{car.name}</td>
                      <td class="px-4 py-2 border-r">{car.meta.model}</td>
                      <td class="px-4 py-2 border-r">{car.meta.brand}</td>
                      <td class="px-4 py-2 font-bold border-r">
                        {#if car.status === "free"}
                          <span
                            class="inline-block px-4 py-1 text-sm text-green-900 bg-green-300 rounded-full"
                            >Disponibile</span
                          >
                        {:else if car.status === "on_break"}
                          <span
                            class="inline-block px-4 py-1 text-sm text-yellow-900 bg-yellow-200 rounded-full"
                            >Pausa</span
                          >
                        {:else if car.status === "garage"}
                          <span
                            class="inline-block px-4 py-1 text-sm text-gray-900 bg-gray-300 rounded-full"
                            >Al deposito</span
                          >
                        {:else}
                          <span
                            class="inline-block px-4 py-1 text-sm text-red-900 bg-red-200 rounded-full"
                            >Non disponibile</span
                          >
                        {/if}
                      </td>
                      <td class="px-4 py-2"
                        >{car.user
                          ? `${car.user.first_name} ${car.user.last_name}`
                          : "Nessun driver"}</td
                      >
                    </tr>
                  {/each}
                </tbody>
              </table>
              <p class="my-6 text-gray-700">
                Vuoi assegnare già da ora la corsa ad un mezzo?
              </p>
              <div class="flex items-center gap-4 mb-6">
                <button
                  on:click={() => updateRun(false)}
                  class="px-6 py-2 font-bold text-white rounded-lg bg-lime-700 hover:bg-lime-900"
                >
                  Assegna mezzo
                </button>
                <button
                  on:click={() => updateRun(true)}
                  class="px-6 py-2 font-bold text-white bg-purple-700 rounded-lg hover:bg-purple-900"
                >
                  Assegna giornaliera
                </button>

                <button
                  on:click={() => (showPopup = false)}
                  class="px-6 py-2 font-bold text-white bg-red-700 rounded-lg hover:bg-red-900"
                >
                  <span class="text-white">Salta per ora</span>
                </button>
              </div>
            </div>
            <!-- Map Container -->
            <div class="{showMap ? '' : 'opacity-0'} flex-1">
              <div
                id="map"
                class="aspect-[16/9] rounded-lg shadow-md z-10 mb-8"
              ></div>
            </div>
          </div>
        </div>
      {/if}
    </div>
  </div>
{/if}
