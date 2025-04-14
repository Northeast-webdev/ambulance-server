<script>
  // @ts-nocheck
  import moment from "moment";
  import { onMount } from "svelte";
  import { fade, fly } from "svelte/transition";
  import MdiPencil from "virtual:icons/mdi/pencil";
  import MdiTrashCan from "virtual:icons/mdi/trash-can";
  import MdiCalendarMonth from "virtual:icons/mdi/calendar-month";
  import MdiFormatListBulleted from "virtual:icons/mdi/format-list-bulleted";
  import MdiChevronDown from "virtual:icons/mdi/chevron-down";
  import LoadingList from "../../components/LoadingList.svelte";
  import { user } from "../../stores";

  let loading = false;
  let shifts = [];
  let show_form = false;
  let action = "new";
  let shift_id = "";
  let shiftType = "scheduled";
  let cars = [];
  let users = [];
  let viewMode = "calendar"; // calendar or list
  let expandedDay = null; // Store the date of the expanded day
  let showDayDetail = false; // Controls visibility of day detail modal
  let selectedDayShifts = []; // Shifts for the selected day

  let newShift = {
    vehicle: "",
    date: new Date().toISOString().split("T")[0],
    shift_start: "08:00",
    shift_end: "20:00",
    crew: {
      driver: {
        user: "",
        start_time: "08:00",
        end_time: "20:00",
      },
      doctor: {
        user: "",
        start_time: "08:00",
        end_time: "20:00",
      },
      nurse: {
        user: "",
        start_time: "08:00",
        end_time: "20:00",
      },
    },
    notes: "",
    status: "scheduled",
  };

  onMount(async () => {
    if ($user.role !== "administrator" && $user.role !== "operator") {
      return;
    }

    loading = true;
    try {
      await Promise.all([getShifts(shiftType), loadCars(), loadUsers()]);
    } catch (error) {
      console.error("Error initializing data:", error);
    } finally {
      loading = false;
    }
  });

  function newShiftToggle() {
    // Reset the form for a new shift
    newShift = {
      vehicle: "",
      date: new Date().toISOString().split("T")[0],
      shift_start: "08:00",
      shift_end: "20:00",
      crew: {
        driver: {
          user: "",
          start_time: "08:00",
          end_time: "20:00",
        },
        doctor: {
          user: "",
          start_time: "08:00",
          end_time: "20:00",
        },
        nurse: {
          user: "",
          start_time: "08:00",
          end_time: "20:00",
        },
      },
      notes: "",
      status: "scheduled",
    };

    show_form = true;
    action = "new";
  }

  async function deleteShift(id) {
    const confirm = window.confirm(
      "Sei sicuro di voler eliminare questo turno?"
    );
    if (!confirm) {
      return;
    }
    try {
      const response = await fetch(
        import.meta.env.VITE_API_URL + "/api/shifts/" + id,
        {
          method: "DELETE",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${localStorage.getItem("token")}`,
          },
        }
      );
      const data = await response.json();
      if (data.error) {
        alert(data.error);
        return;
      }
      await getShifts(shiftType);
    } catch (error) {
      console.error("Error:", error);
    }
  }

  async function saveShift() {
    if (action === "new") {
      try {
        const response = await fetch(
          import.meta.env.VITE_API_URL + "/api/shifts",
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${localStorage.getItem("token")}`,
            },
            body: JSON.stringify(newShift),
          }
        );
        const data = await response.json();
        if (data.error) {
          alert(data.error);
          return;
        }
        await getShifts(shiftType);
        resetForm();
        show_form = false;
      } catch (error) {
        console.error("Error:", error);
      }
    } else {
      try {
        const response = await fetch(
          import.meta.env.VITE_API_URL + "/api/shifts/" + shift_id,
          {
            method: "PUT",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${localStorage.getItem("token")}`,
            },
            body: JSON.stringify(newShift),
          }
        );
        const data = await response.json();
        if (data.error) {
          alert(data.error);
          return;
        }
        await getShifts(shiftType);
        resetForm();
        show_form = false;
      } catch (error) {
        console.error("Error:", error);
      }
    }
  }

  async function getShifts(type) {
    shiftType = type;
    try {
      const response = await fetch(
        import.meta.env.VITE_API_URL + "/api/shifts?status=" + type,
        {
          method: "GET",
          headers: {
            Authorization: `Bearer ${localStorage.getItem("token")}`,
          },
        }
      );
      const data = await response.json();
      shifts = data || [];
    } catch (error) {
      console.error("Error:", error);
    }
  }

  async function loadCars() {
    try {
      const response = await fetch(import.meta.env.VITE_API_URL + "/api/cars", {
        headers: {
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
      });
      const data = await response.json();
      cars = data.cars;
    } catch (error) {
      console.error("Error:", error);
      cars = [];
    }
  }

  async function loadUsers() {
    try {
      const response = await fetch(
        import.meta.env.VITE_API_URL + "/api/users?limit=100",
        {
          headers: {
            Authorization: `Bearer ${localStorage.getItem("token")}`,
          },
        }
      );
      const data = await response.json();

      // Initialize users as an empty array if data.users is undefined
      if (!data || !data.users) {
        users = [];
        console.error("No users data received from API");
        return;
      }

      // Filter out administrators
      users = data.users.filter((u) => u.role !== "administrator");
    } catch (error) {
      console.error("Error loading users:", error);
      users = []; // Initialize as empty array on error
    }
  }

  function resetForm() {
    newShift = {
      vehicle: "",
      date: new Date().toISOString().split("T")[0],
      shift_start: "08:00",
      shift_end: "20:00",
      crew: {
        driver: {
          user: "",
          start_time: "08:00",
          end_time: "20:00",
        },
        doctor: {
          user: "",
          start_time: "08:00",
          end_time: "20:00",
        },
        nurse: {
          user: "",
          start_time: "08:00",
          end_time: "20:00",
        },
      },
      notes: "",
      status: "scheduled",
    };
  }

  // Function to toggle view mode
  function toggleViewMode() {
    viewMode = viewMode === "calendar" ? "list" : "calendar";
  }

  // Function to show day detail
  function showDayDetails(day, dayShifts) {
    expandedDay = day;
    selectedDayShifts = dayShifts;
    showDayDetail = true;
  }

  // Function to close day detail
  function closeDayDetail() {
    showDayDetail = false;
  }

  // Function to edit a shift
  function editShift(shift) {
    action = "edit";
    shift_id = shift._id;
    newShift = {
      vehicle: shift.vehicle?._id || "",
      date: shift.date.split("T")[0],
      shift_start: shift.shift_start,
      shift_end: shift.shift_end,
      crew: {
        driver: {
          user: shift.crew.driver?.user?._id || "",
          start_time: shift.crew.driver?.start_time || "08:00",
          end_time: shift.crew.driver?.end_time || "20:00",
        },
        doctor: {
          user: shift.crew.doctor?.user?._id || "",
          start_time: shift.crew.doctor?.start_time || "08:00",
          end_time: shift.crew.doctor?.end_time || "20:00",
        },
        nurse: {
          user: shift.crew.nurse?.user?._id || "",
          start_time: shift.crew.nurse?.start_time || "08:00",
          end_time: shift.crew.nurse?.end_time || "20:00",
        },
      },
      notes: shift.notes || "",
      status: shift.status,
    };
    show_form = true;
    if (showDayDetail) closeDayDetail();
  }
</script>

{#if loading}
  <LoadingList />
{:else if $user.role !== "administrator" && $user.role !== "operator"}
  <div class="flex justify-center items-center flex-col fixed inset-0 z-10">
    <h1 class="text-3xl font-bold">Accesso Negato</h1>
    <p class="text-gray-500">
      Non hai i permessi necessari per visualizzare questa pagina.
    </p>
  </div>
{:else}
  <!-- Submenu buttons -->
  <div class="mb-6 shadow-lg">
    <div class="container mx-auto p-4 flex gap-4">
      <button
        class="{shiftType === 'scheduled'
          ? 'bg-emerald-200 text-emerald-700'
          : 'bg-gray-100 text-gray-400'} transition font-bold py-2 px-6 rounded-lg"
        on:click={() => getShifts("scheduled")}
      >
        <span>Pianificati</span>
      </button>
      <button
        class="{shiftType === 'in_progress'
          ? 'bg-emerald-200 text-emerald-700'
          : 'bg-gray-100 text-gray-400'} transition font-bold py-2 px-6 rounded-lg"
        on:click={() => getShifts("in_progress")}
      >
        <span>In corso</span>
      </button>
      <button
        class="{shiftType === 'completed'
          ? 'bg-emerald-200 text-emerald-700'
          : 'bg-gray-100 text-gray-400'} transition font-bold py-2 px-6 rounded-lg"
        on:click={() => getShifts("completed")}
      >
        <span>Completati</span>
      </button>
    </div>
  </div>

  <div class="container mx-auto py-6 px-3">
    <div class="flex justify-between items-center mb-6">
      <div>
        <h1 class="text-3xl font-bold">Gestione Turni</h1>
        <p class="text-gray-500">
          {shifts.length} turni {shiftType === "scheduled"
            ? "pianificati"
            : shiftType === "in_progress"
              ? "in corso"
              : "completati"}
        </p>
      </div>
      <div class="flex gap-3">
        <button
          on:click={toggleViewMode}
          class="bg-gray-200 hover:bg-gray-300 transition text-gray-700 font-bold py-2 px-4 rounded-lg flex items-center justify-center gap-2 shadow-md"
        >
          {#if viewMode === "calendar"}
            <MdiFormatListBulleted class="w-5 h-5" />
            <span>Vista Lista</span>
          {:else}
            <MdiCalendarMonth class="w-5 h-5" />
            <span>Vista Calendario</span>
          {/if}
        </button>
        <button
          on:click={newShiftToggle}
          class="bg-green-600 hover:bg-green-800 transition text-white font-bold py-2 px-6 rounded-lg flex items-center justify-center gap-2 shadow-md"
        >
          <span class="text-2xl">+</span>
          <span>Nuovo Turno</span>
        </button>
      </div>
    </div>

    <!-- Calendar View for Shifts -->
    {#if viewMode === "calendar"}
      <div class="mb-10 bg-white rounded-lg shadow-md p-4">
        <h2 class="text-xl font-semibold mb-4">Vista Calendario</h2>
        <div class="grid grid-cols-7 gap-1 mb-2 text-center text-sm">
          <div class="font-bold">Lunedì</div>
          <div class="font-bold">Martedì</div>
          <div class="font-bold">Mercoledì</div>
          <div class="font-bold">Giovedì</div>
          <div class="font-bold">Venerdì</div>
          <div class="font-bold">Sabato</div>
          <div class="font-bold">Domenica</div>
        </div>

        {#if shifts.length > 0}
          <div class="grid grid-cols-7 gap-1 auto-rows-fr">
            {#each Array.from({ length: 28 }) as _, index}
              {@const currentDate = new Date()}
              {@const day = new Date(
                currentDate.getFullYear(),
                currentDate.getMonth(),
                currentDate.getDate() - currentDate.getDay() + 1 + index
              )}
              {@const dayShifts = shifts.filter(
                (s) => new Date(s.date).toDateString() === day.toDateString()
              )}
              <button
                type="button"
                class="border rounded min-h-[100px] p-2 text-left {day.toDateString() ===
                currentDate.toDateString()
                  ? 'bg-emerald-50 border-emerald-300'
                  : ''} hover:border-blue-400 transition-colors relative cursor-pointer"
                on:click={() => showDayDetails(day, dayShifts)}
                aria-label="Mostra turni del {day
                  .getDate()
                  .toString()
                  .padStart(2, '0')}/{(day.getMonth() + 1)
                  .toString()
                  .padStart(2, '0')}"
              >
                <div class="text-sm font-medium mb-1">
                  {day.getDate().toString().padStart(2, "0")}/{(
                    day.getMonth() + 1
                  )
                    .toString()
                    .padStart(2, "0")}
                </div>
                <div class="space-y-1">
                  {#if dayShifts.length > 0}
                    <!-- Show max 3 shifts -->
                    {#each dayShifts.slice(0, 3) as shift}
                      <div
                        class="text-xs p-1 w-full text-left rounded {shift.status ===
                        'scheduled'
                          ? 'bg-yellow-100 text-yellow-800'
                          : shift.status === 'in_progress'
                            ? 'bg-blue-100 text-blue-800'
                            : 'bg-green-100 text-green-800'}"
                      >
                        <span class="font-bold"
                          >{shift.shift_start}-{shift.shift_end}</span
                        ><br />
                        {shift.vehicle?.name || ""}
                      </div>
                    {/each}

                    <!-- Show "more" indicator if there are more than 3 shifts -->
                    {#if dayShifts.length > 3}
                      <div
                        class="w-full text-xs py-1 px-2 bg-gray-100 text-gray-700 rounded flex items-center justify-center"
                      >
                        <span>+{dayShifts.length - 3} altri</span>
                        <MdiChevronDown class="w-3 h-3 ml-1" />
                      </div>
                    {/if}
                  {:else}
                    <div class="text-xs text-gray-500 italic text-center py-2">
                      Nessun turno
                    </div>
                  {/if}
                </div>
              </button>
            {/each}
          </div>
        {:else}
          <div class="text-center py-8 text-gray-500">
            Nessun turno disponibile. Crea un nuovo turno per visualizzarlo nel
            calendario.
          </div>
        {/if}
      </div>
    {/if}

    <!-- List View for Shifts -->
    {#if viewMode === "list" && shifts.length > 0}
      <div class="bg-white rounded-lg shadow-md p-4">
        <h2 class="text-xl font-semibold mb-4">Lista Turni</h2>
        <!-- Table Container with Overflow for Responsiveness -->
        <div class="overflow-x-auto">
          <table class="min-w-full border-collapse rounded-lg overflow-hidden">
            <thead class="bg-gradient-to-l from-gray-200 to-gray-300">
              <tr>
                <th
                  class="py-3 px-4 text-left font-semibold text-gray-700 border-b"
                  >Data</th
                >
                <th
                  class="py-3 px-4 text-left font-semibold text-gray-700 border-b"
                  >Veicolo</th
                >
                <th
                  class="py-3 px-4 text-left font-semibold text-gray-700 border-b"
                  >Autista</th
                >
                <th
                  class="py-3 px-4 text-left font-semibold text-gray-700 border-b"
                  >Medico</th
                >
                <th
                  class="py-3 px-4 text-left font-semibold text-gray-700 border-b"
                  >Infermiere</th
                >
                <th
                  class="py-3 px-4 text-left font-semibold text-gray-700 border-b"
                  >Orario</th
                >
                <th
                  class="py-3 px-4 text-center font-semibold text-gray-700 border-b"
                  >Azioni</th
                >
              </tr>
            </thead>
            <tbody>
              {#each shifts as shift, index}
                <tr
                  transition:fly|local={{
                    x: 100,
                    duration: 300,
                    delay: index * 100,
                  }}
                  class="{index % 2 === 0
                    ? 'bg-white'
                    : 'bg-gray-100'} border-b border-l"
                >
                  <td class="py-3 px-4 border-r"
                    >{moment(shift.date).format("DD/MM/YYYY")}</td
                  >
                  <td class="py-3 px-4 border-r"
                    >{shift.vehicle?.name || "-"}</td
                  >
                  <td class="py-3 px-4 border-r">
                    {shift.crew.driver?.user?.first_name}
                    {shift.crew.driver?.user?.last_name}
                  </td>
                  <td class="py-3 px-4 border-r">
                    {shift.crew.doctor?.user?.first_name}
                    {shift.crew.doctor?.user?.last_name}
                  </td>
                  <td class="py-3 px-4 border-r">
                    {shift.crew.nurse?.user?.first_name}
                    {shift.crew.nurse?.user?.last_name}
                  </td>
                  <td class="py-3 px-4 border-r">
                    {shift.shift_start} - {shift.shift_end}
                  </td>
                  <td class="py-3 px-4 border-r flex justify-center gap-3">
                    <button
                      on:click={() => {
                        action = "edit";
                        shift_id = shift._id;
                        newShift = {
                          vehicle: shift.vehicle?._id || "",
                          date: shift.date.split("T")[0],
                          shift_start: shift.shift_start,
                          shift_end: shift.shift_end,
                          crew: {
                            driver: {
                              user: shift.crew.driver?.user?._id || "",
                              start_time:
                                shift.crew.driver?.start_time || "08:00",
                              end_time: shift.crew.driver?.end_time || "20:00",
                            },
                            doctor: {
                              user: shift.crew.doctor?.user?._id || "",
                              start_time:
                                shift.crew.doctor?.start_time || "08:00",
                              end_time: shift.crew.doctor?.end_time || "20:00",
                            },
                            nurse: {
                              user: shift.crew.nurse?.user?._id || "",
                              start_time:
                                shift.crew.nurse?.start_time || "08:00",
                              end_time: shift.crew.nurse?.end_time || "20:00",
                            },
                          },
                          notes: shift.notes || "",
                          status: shift.status,
                        };
                        show_form = true;
                      }}
                      class="border-amber-600 border hover:bg-amber-600 text-amber-600 hover:text-amber-100 font-bold py-2 px-4 rounded-lg transition duration-200"
                    >
                      <MdiPencil class="w-4 h-4 inline" />
                      <span>Modifica</span>
                    </button>
                    <button
                      on:click={() => deleteShift(shift._id)}
                      class="border-red-600 border hover:bg-red-600 text-red-600 hover:text-red-100 font-bold py-2 px-4 rounded-lg transition duration-200"
                    >
                      <MdiTrashCan class="w-4 h-4 inline" />
                      <span>Elimina</span>
                    </button>
                  </td>
                </tr>
              {/each}
            </tbody>
          </table>
        </div>
      </div>
    {:else if viewMode === "list" && shifts.length === 0}
      <div class="bg-white rounded-lg shadow-md p-8 text-center">
        <p class="text-gray-500">
          Nessun turno disponibile. Crea un nuovo turno per visualizzarlo nella
          lista.
        </p>
      </div>
    {/if}
  </div>
{/if}

{#if show_form}
  <!-- Modal Background -->
  <div
    transition:fade={{ duration: 300 }}
    class="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto p-8 bg-black bg-opacity-50"
    on:click|self={() => {
      show_form = false;
      resetForm();
    }}
    on:keydown={(e) => {
      if (e.key === "Escape") {
        show_form = false;
        resetForm();
      }
    }}
    role="dialog"
    aria-modal="true"
    aria-labelledby="modal-title"
  >
    <!-- Form Modal -->
    <div
      class="relative max-w-screen-lg w-full max-h-[90vh] bg-white z-50 rounded-lg shadow-xl overflow-y-auto p-6"
    >
      <button
        class="absolute top-4 right-6 text-3xl text-gray-600 hover:text-gray-800"
        on:click={() => {
          show_form = false;
          resetForm();
        }}
        aria-label="Close form"
      >
        ✕
      </button>
      <h2 id="modal-title" class="text-3xl font-bold text-left mb-6">
        {action === "new" ? "Nuovo Turno" : "Modifica Turno"}
      </h2>
      <form on:submit|preventDefault={saveShift} class="space-y-6">
        <!-- Date and Time Section -->
        <div class="p-4 bg-gray-50 rounded-lg mb-4">
          <h3 class="text-lg font-semibold mb-3 text-gray-700">
            Informazioni Turno
          </h3>
          <div class="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div>
              <label
                for="date"
                class="block text-sm font-medium text-gray-700 mb-1"
              >
                Data <span class="text-red-500">*</span>
              </label>
              <input
                type="date"
                id="date"
                bind:value={newShift.date}
                required
                class="block w-full border valid:border-lime-500 outline-none border-gray-300 rounded-lg p-3 focus:ring-2 focus:ring-lime-600 transition-all"
              />
            </div>
            <div>
              <label
                for="shift_start"
                class="block text-sm font-medium text-gray-700 mb-1"
              >
                Inizio Turno <span class="text-red-500">*</span>
              </label>
              <input
                type="time"
                id="shift_start"
                bind:value={newShift.shift_start}
                required
                class="block w-full border valid:border-lime-500 outline-none border-gray-300 rounded-lg p-3 focus:ring-2 focus:ring-lime-600 transition-all"
              />
            </div>
            <div>
              <label
                for="shift_end"
                class="block text-sm font-medium text-gray-700 mb-1"
              >
                Fine Turno <span class="text-red-500">*</span>
              </label>
              <input
                type="time"
                id="shift_end"
                bind:value={newShift.shift_end}
                required
                class="block w-full border valid:border-lime-500 outline-none border-gray-300 rounded-lg p-3 focus:ring-2 focus:ring-lime-600 transition-all"
              />
            </div>
            <div>
              <label
                for="vehicle"
                class="block text-sm font-medium text-gray-700 mb-1"
              >
                Veicolo <span class="text-red-500">*</span>
              </label>
              <select
                id="vehicle"
                bind:value={newShift.vehicle}
                required
                class="block w-full border valid:border-lime-500 outline-none border-gray-300 rounded-lg p-3 focus:ring-2 focus:ring-lime-600 transition-all"
              >
                <option value="">Seleziona veicolo</option>
                {#each cars as car}
                  <option value={car._id}>{car.name}</option>
                {/each}
              </select>
            </div>
            <div>
              <label
                for="status"
                class="block text-sm font-medium text-gray-700 mb-1"
              >
                Stato <span class="text-red-500">*</span>
              </label>
              <select
                id="status"
                bind:value={newShift.status}
                required
                class="block w-full border valid:border-lime-500 outline-none border-gray-300 rounded-lg p-3 focus:ring-2 focus:ring-lime-600 transition-all"
              >
                <option value="scheduled">Pianificato</option>
                <option value="in_progress">In corso</option>
                <option value="completed">Completato</option>
              </select>
            </div>
          </div>
        </div>

        <!-- Crew Section -->
        <div class="p-4 bg-gray-50 rounded-lg mb-4">
          <h3 class="text-lg font-semibold mb-3 text-gray-700">Equipaggio</h3>

          <!-- Driver -->
          <div class="mb-5 border-b pb-5">
            <h4 class="font-medium text-gray-800 mb-2">Autista</h4>
            <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div class="md:col-span-1">
                <label
                  for="driver"
                  class="block text-sm font-medium text-gray-700 mb-1"
                >
                  Seleziona Autista <span class="text-red-500">*</span>
                </label>
                <select
                  id="driver"
                  bind:value={newShift.crew.driver.user}
                  required
                  class="block w-full border valid:border-lime-500 outline-none border-gray-300 rounded-lg p-3 focus:ring-2 focus:ring-lime-600 transition-all"
                >
                  <option value="">Seleziona autista</option>
                  {#each users as user}
                    <option value={user._id}
                      >{user.first_name} {user.last_name}</option
                    >
                  {/each}
                </select>
              </div>
              <div>
                <label
                  for="driver_start"
                  class="block text-sm font-medium text-gray-700 mb-1"
                >
                  Inizio
                </label>
                <input
                  type="time"
                  id="driver_start"
                  bind:value={newShift.crew.driver.start_time}
                  class="block w-full border valid:border-lime-500 outline-none border-gray-300 rounded-lg p-3 focus:ring-2 focus:ring-lime-600 transition-all"
                />
              </div>
              <div>
                <label
                  for="driver_end"
                  class="block text-sm font-medium text-gray-700 mb-1"
                >
                  Fine
                </label>
                <input
                  type="time"
                  id="driver_end"
                  bind:value={newShift.crew.driver.end_time}
                  class="block w-full border valid:border-lime-500 outline-none border-gray-300 rounded-lg p-3 focus:ring-2 focus:ring-lime-600 transition-all"
                />
              </div>
            </div>
          </div>

          <!-- Doctor -->
          <div class="mb-5 border-b pb-5">
            <h4 class="font-medium text-gray-800 mb-2">Medico</h4>
            <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div class="md:col-span-1">
                <label
                  for="doctor"
                  class="block text-sm font-medium text-gray-700 mb-1"
                >
                  Seleziona Medico <span class="text-red-500">*</span>
                </label>
                <select
                  id="doctor"
                  bind:value={newShift.crew.doctor.user}
                  required
                  class="block w-full border valid:border-lime-500 outline-none border-gray-300 rounded-lg p-3 focus:ring-2 focus:ring-lime-600 transition-all"
                >
                  <option value="">Seleziona medico</option>
                  {#each users as user}
                    <option value={user._id}
                      >{user.first_name} {user.last_name}</option
                    >
                  {/each}
                </select>
              </div>
              <div>
                <label
                  for="doctor_start"
                  class="block text-sm font-medium text-gray-700 mb-1"
                >
                  Inizio
                </label>
                <input
                  type="time"
                  id="doctor_start"
                  bind:value={newShift.crew.doctor.start_time}
                  class="block w-full border valid:border-lime-500 outline-none border-gray-300 rounded-lg p-3 focus:ring-2 focus:ring-lime-600 transition-all"
                />
              </div>
              <div>
                <label
                  for="doctor_end"
                  class="block text-sm font-medium text-gray-700 mb-1"
                >
                  Fine
                </label>
                <input
                  type="time"
                  id="doctor_end"
                  bind:value={newShift.crew.doctor.end_time}
                  class="block w-full border valid:border-lime-500 outline-none border-gray-300 rounded-lg p-3 focus:ring-2 focus:ring-lime-600 transition-all"
                />
              </div>
            </div>
          </div>

          <!-- Nurse -->
          <div>
            <h4 class="font-medium text-gray-800 mb-2">Infermiere</h4>
            <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div class="md:col-span-1">
                <label
                  for="nurse"
                  class="block text-sm font-medium text-gray-700 mb-1"
                >
                  Seleziona Infermiere <span class="text-red-500">*</span>
                </label>
                <select
                  id="nurse"
                  bind:value={newShift.crew.nurse.user}
                  required
                  class="block w-full border valid:border-lime-500 outline-none border-gray-300 rounded-lg p-3 focus:ring-2 focus:ring-lime-600 transition-all"
                >
                  <option value="">Seleziona infermiere</option>
                  {#each users as user}
                    <option value={user._id}
                      >{user.first_name} {user.last_name}</option
                    >
                  {/each}
                </select>
              </div>
              <div>
                <label
                  for="nurse_start"
                  class="block text-sm font-medium text-gray-700 mb-1"
                >
                  Inizio
                </label>
                <input
                  type="time"
                  id="nurse_start"
                  bind:value={newShift.crew.nurse.start_time}
                  class="block w-full border valid:border-lime-500 outline-none border-gray-300 rounded-lg p-3 focus:ring-2 focus:ring-lime-600 transition-all"
                />
              </div>
              <div>
                <label
                  for="nurse_end"
                  class="block text-sm font-medium text-gray-700 mb-1"
                >
                  Fine
                </label>
                <input
                  type="time"
                  id="nurse_end"
                  bind:value={newShift.crew.nurse.end_time}
                  class="block w-full border valid:border-lime-500 outline-none border-gray-300 rounded-lg p-3 focus:ring-2 focus:ring-lime-600 transition-all"
                />
              </div>
            </div>
          </div>
        </div>

        <!-- Notes Section -->
        <div class="p-4 bg-gray-50 rounded-lg">
          <h3 class="text-lg font-semibold mb-3 text-gray-700">Note</h3>
          <div>
            <textarea
              id="notes"
              bind:value={newShift.notes}
              class="block w-full border valid:border-lime-500 outline-none border-gray-300 rounded-lg p-3 focus:ring-2 focus:ring-lime-600 transition-all"
              rows="3"
              placeholder="Inserisci note aggiuntive sul turno..."
            ></textarea>
          </div>
        </div>

        <div class="flex gap-4 justify-end mt-4">
          <button
            type="button"
            class="border border-gray-300 bg-white text-gray-700 hover:bg-gray-100 font-bold py-3 px-6 rounded-lg transition duration-200"
            on:click={() => {
              show_form = false;
              resetForm();
            }}
          >
            Annulla
          </button>
          <button
            type="submit"
            class="bg-lime-600 hover:bg-lime-700 text-white font-bold py-3 px-6 rounded-lg transition duration-200"
          >
            {action === "new" ? "Crea Turno" : "Aggiorna Turno"}
          </button>
        </div>
      </form>
    </div>
  </div>
{/if}

<!-- Day Detail Modal -->
{#if showDayDetail}
  <div
    transition:fade={{ duration: 300 }}
    class="fixed inset-0 z-40 flex items-center justify-center overflow-y-auto p-8 bg-black bg-opacity-50"
    on:click|self={closeDayDetail}
    on:keydown={(e) => {
      if (e.key === "Escape") {
        closeDayDetail();
      }
    }}
    role="dialog"
    aria-modal="true"
    aria-labelledby="day-detail-title"
  >
    <div
      class="relative w-full max-w-screen-lg bg-white rounded-lg shadow-xl overflow-y-auto p-6"
    >
      <button
        class="absolute top-4 right-6 text-3xl text-gray-600 hover:text-gray-800"
        on:click={closeDayDetail}
        aria-label="Close day detail"
      >
        ✕
      </button>
      <div class="flex justify-between items-center mb-4">
        <h2 id="day-detail-title" class="text-2xl font-bold">
          Turni del {moment(expandedDay).format("DD/MM/YYYY")}
        </h2>
      </div>

      {#if selectedDayShifts.length > 0}
        <div class="overflow-x-auto">
          <table class="min-w-full border-collapse rounded-lg overflow-hidden">
            <thead class="bg-gradient-to-l from-gray-200 to-gray-300">
              <tr>
                <th
                  class="py-2 px-3 text-left font-semibold text-gray-700 border-b"
                  >Orario</th
                >
                <th
                  class="py-2 px-3 text-left font-semibold text-gray-700 border-b"
                  >Veicolo</th
                >
                <th
                  class="py-2 px-3 text-left font-semibold text-gray-700 border-b"
                  >Equipaggio</th
                >
                <th
                  class="py-2 px-3 text-left font-semibold text-gray-700 border-b"
                  >Stato</th
                >
                <th
                  class="py-2 px-3 text-center font-semibold text-gray-700 border-b"
                  >Azioni</th
                >
              </tr>
            </thead>
            <tbody>
              {#each selectedDayShifts as shift, index}
                <tr
                  transition:fly|local={{
                    y: 20,
                    duration: 200,
                    delay: index * 50,
                  }}
                  class="{index % 2 === 0
                    ? 'bg-white'
                    : 'bg-gray-50'} border-b hover:bg-gray-100"
                >
                  <td class="py-2 px-3"
                    >{shift.shift_start} - {shift.shift_end}</td
                  >
                  <td class="py-2 px-3">{shift.vehicle?.name || "-"}</td>
                  <td class="py-2 px-3 text-sm">
                    <div>
                      {shift.crew.driver?.user?.first_name}
                      {shift.crew.driver?.user?.last_name}
                    </div>
                    <div>
                      {shift.crew.doctor?.user?.first_name}
                      {shift.crew.doctor?.user?.last_name}
                    </div>
                    <div>
                      {shift.crew.nurse?.user?.first_name}
                      {shift.crew.nurse?.user?.last_name}
                    </div>
                  </td>
                  <td class="py-2 px-3">
                    <span
                      class="inline-block px-2 py-1 text-sm rounded-full {shift.status ===
                      'scheduled'
                        ? 'bg-yellow-100 text-yellow-800'
                        : shift.status === 'in_progress'
                          ? 'bg-blue-100 text-blue-800'
                          : 'bg-green-100 text-green-800'}"
                    >
                      {shift.status === "scheduled"
                        ? "Pianificato"
                        : shift.status === "in_progress"
                          ? "In corso"
                          : "Completato"}
                    </span>
                  </td>
                  <td class="py-2 px-3 text-center">
                    <div class="flex justify-center gap-2">
                      <button
                        on:click={() => editShift(shift)}
                        class="border-amber-600 border hover:bg-amber-600 text-amber-600 hover:text-amber-100 font-bold py-2 px-4 text-sm rounded-lg transition duration-200"
                      >
                        <MdiPencil class="w-3 h-3 inline" />
                        <span>Modifica</span>
                      </button>
                      <button
                        on:click={() => {
                          deleteShift(shift._id);
                          // Remove the shift from the selectedDayShifts if successful
                          selectedDayShifts = selectedDayShifts.filter(
                            (s) => s._id !== shift._id
                          );
                          // Close the modal if no shifts are left
                          if (selectedDayShifts.length === 0) {
                            closeDayDetail();
                          }
                        }}
                        class="border-red-600 border hover:bg-red-600 text-red-600 hover:text-red-100 font-bold py-2 px-4 text-sm rounded-lg transition duration-200"
                      >
                        <MdiTrashCan class="w-3 h-3 inline" />
                        <span>Elimina</span>
                      </button>
                    </div>
                  </td>
                </tr>
              {/each}
            </tbody>
          </table>
        </div>
      {:else}
        <div
          class="py-12 flex flex-col items-center justify-center bg-gray-50 rounded-lg"
        >
          <p class="text-gray-500 mb-6">
            Nessun turno pianificato per questo giorno.
          </p>
          <button
            on:click={() => {
              // Set up a new shift for this day
              resetForm();
              newShift.date = new Date(
                expandedDay.setDate(expandedDay.getDate() + 1)
              )
                .toISOString()
                .split("T")[0];
              show_form = true;
              action = "new";
              closeDayDetail();
            }}
            class="bg-green-600 hover:bg-green-800 transition text-white font-bold py-2 px-4 rounded-lg flex items-center justify-center gap-2 shadow-md"
          >
            <span class="text-lg">+</span>
            <span>Pianifica Turno</span>
          </button>
        </div>
      {/if}
    </div>
  </div>
{/if}

<style>
  table,
  th,
  td {
    transition: all 0.3s;
  }
</style>
