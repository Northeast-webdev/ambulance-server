<script>
  // @ts-nocheck
  import moment from "moment";
  import { onMount } from "svelte";
  import { fade, fly } from "svelte/transition";
  import MdiPencil from "virtual:icons/mdi/pencil";
  import MdiTrashCan from "virtual:icons/mdi/trash-can";
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

  let newShift = {
    vehicle: "",
    date: new Date().toISOString().split("T")[0],
    shift_start: "08:00",
    shift_end: "20:00",
    crew: {
      driver: { user: "", start_time: "08:00", end_time: "20:00" },
      doctor: { user: "", start_time: "08:00", end_time: "20:00" },
      nurse: { user: "", start_time: "08:00", end_time: "20:00" },
    },
    notes: "",
    status: "scheduled",
  };

  onMount(() => {
    if ($user.role !== "administrator" && $user.role !== "operator") {
      return;
    }
    loading = true;
    getShifts(shiftType);
    loadCars();
    loadUsers();
    loading = false;
  });

  function newShiftToggle() {
    show_form = !show_form;
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
        newShift = {
          vehicle: "",
          date: new Date().toISOString().split("T")[0],
          shift_start: "08:00",
          shift_end: "20:00",
          crew: {
            driver: { user: "", start_time: "08:00", end_time: "20:00" },
            doctor: { user: "", start_time: "08:00", end_time: "20:00" },
            nurse: { user: "", start_time: "08:00", end_time: "20:00" },
          },
          notes: "",
          status: "scheduled",
        };
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
        newShift = {
          vehicle: "",
          date: new Date().toISOString().split("T")[0],
          shift_start: "08:00",
          shift_end: "20:00",
          crew: {
            driver: { user: "", start_time: "08:00", end_time: "20:00" },
            doctor: { user: "", start_time: "08:00", end_time: "20:00" },
            nurse: { user: "", start_time: "08:00", end_time: "20:00" },
          },
          notes: "",
          status: "scheduled",
        };
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
      cars = data;
    } catch (error) {
      console.error("Error:", error);
    }
  }

  async function loadUsers() {
    try {
      const response = await fetch(
        import.meta.env.VITE_API_URL + "/api/users?limit=50",
        {
          headers: {
            Authorization: `Bearer ${localStorage.getItem("token")}`,
          },
        }
      );
      const data = await response.json();
      users = data.users;
    } catch (error) {
      console.error("Error:", error);
    }
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
        <h1 class="text-3xl font-bold">
          Lista dei turni {shiftType === "scheduled"
            ? "pianificati"
            : shiftType === "in_progress"
              ? "in corso"
              : "completati"}
        </h1>
        <p class="text-gray-500">
          {shifts.length} turni totali
        </p>
      </div>
      <button
        on:click={newShiftToggle}
        class="bg-green-600 hover:bg-green-800 transition text-white font-bold py-2 px-6 rounded-lg flex items-center justify-center gap-2 shadow-md"
      >
        <span class="text-2xl">+</span>
        <span>Nuovo Turno</span>
      </button>
    </div>

    <!-- Table Container with Overflow for Responsiveness -->
    <div class="overflow-x-auto">
      <table
        class="min-w-full border-collapse shadow-lg rounded-lg overflow-hidden"
      >
        <thead class="bg-gradient-to-l from-gray-200 to-gray-300">
          <tr>
            <th class="py-3 px-4 text-left font-semibold text-gray-700 border-b"
              >Data</th
            >
            <th class="py-3 px-4 text-left font-semibold text-gray-700 border-b"
              >Veicolo</th
            >
            <th class="py-3 px-4 text-left font-semibold text-gray-700 border-b"
              >Autista</th
            >
            <th class="py-3 px-4 text-left font-semibold text-gray-700 border-b"
              >Medico</th
            >
            <th class="py-3 px-4 text-left font-semibold text-gray-700 border-b"
              >Infermiere</th
            >
            <th class="py-3 px-4 text-left font-semibold text-gray-700 border-b"
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
              <td class="py-3 px-4 border-r">{shift.vehicle?.name || "-"}</td>
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
{/if}

{#if show_form}
  <!-- Modal Background -->
  <div
    transition:fade={{ duration: 300 }}
    class="fixed inset-0 z-40 flex items-center justify-center overflow-y-auto p-8 bg-white"
  >
    <!-- Form Modal -->
    <div class="relative max-w-screen-lg w-full max-h-[80vh] bg-white z-50">
      <button
        class="absolute top-0 right-6 text-3xl text-gray-600 hover:text-gray-800"
        on:click={() => {
          show_form = false;
          newShift = {
            vehicle: "",
            date: new Date().toISOString().split("T")[0],
            shift_start: "08:00",
            shift_end: "20:00",
            crew: {
              driver: { user: "", start_time: "08:00", end_time: "20:00" },
              doctor: { user: "", start_time: "08:00", end_time: "20:00" },
              nurse: { user: "", start_time: "08:00", end_time: "20:00" },
            },
            notes: "",
            status: "scheduled",
          };
        }}
        aria-label="Close form"
      >
        ✕
      </button>
      <h2 class="text-3xl font-bold text-left mb-6">
        {action === "new" ? "Nuovo Turno" : "Modifica Turno"}
      </h2>
      <form on:submit|preventDefault={saveShift} class="space-y-6">
        <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
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
              for="driver"
              class="block text-sm font-medium text-gray-700 mb-1"
            >
              Autista <span class="text-red-500">*</span>
            </label>
            <select
              id="driver"
              bind:value={newShift.crew.driver.user}
              required
              class="block w-full border valid:border-lime-500 outline-none border-gray-300 rounded-lg p-3 focus:ring-2 focus:ring-lime-600 transition-all"
            >
              <option value="">Seleziona autista</option>
              {#each users.filter((u) => u.role === "driver") as user}
                <option value={user._id}
                  >{user.first_name} {user.last_name}</option
                >
              {/each}
            </select>
          </div>
          <div>
            <label
              for="doctor"
              class="block text-sm font-medium text-gray-700 mb-1"
            >
              Medico <span class="text-red-500">*</span>
            </label>
            <select
              id="doctor"
              bind:value={newShift.crew.doctor.user}
              required
              class="block w-full border valid:border-lime-500 outline-none border-gray-300 rounded-lg p-3 focus:ring-2 focus:ring-lime-600 transition-all"
            >
              <option value="">Seleziona medico</option>
              {#each users.filter((u) => u.role === "doctor") as user}
                <option value={user._id}
                  >{user.first_name} {user.last_name}</option
                >
              {/each}
            </select>
          </div>
          <div>
            <label
              for="nurse"
              class="block text-sm font-medium text-gray-700 mb-1"
            >
              Infermiere <span class="text-red-500">*</span>
            </label>
            <select
              id="nurse"
              bind:value={newShift.crew.nurse.user}
              required
              class="block w-full border valid:border-lime-500 outline-none border-gray-300 rounded-lg p-3 focus:ring-2 focus:ring-lime-600 transition-all"
            >
              <option value="">Seleziona infermiere</option>
              {#each users.filter((u) => u.role === "nurse") as user}
                <option value={user._id}
                  >{user.first_name} {user.last_name}</option
                >
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
          <div class="md:col-span-2">
            <label
              for="notes"
              class="block text-sm font-medium text-gray-700 mb-1"
            >
              Note
            </label>
            <textarea
              id="notes"
              bind:value={newShift.notes}
              class="block w-full border valid:border-lime-500 outline-none border-gray-300 rounded-lg p-3 focus:ring-2 focus:ring-lime-600 transition-all"
              rows="3"
            ></textarea>
          </div>
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
  </div>
{/if}

<style>
  table,
  th,
  td {
    transition: all 0.3s;
  }
</style>
