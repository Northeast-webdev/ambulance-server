<script>
  // @ts-nocheck
  import moment from "moment";
  import { onMount } from "svelte";
  import { fade } from "svelte/transition";
  import MdiPencil from "virtual:icons/mdi/pencil";
  import MdiTrashCan from "virtual:icons/mdi/trash-can";
  import LoadingList from "../../components/LoadingList.svelte";
  let cars = [];
  let drivers = [];
  let show_form = false;
  let action = "new";
  let car_id = "";
  let loading = false;
  let meta_verifier = {
    Driver: "driver",
    Brand: "brand",
    Model: "model",
    Kilometers: "kilometers",
    "Plate Number": "plate_number",
    "Carbon Level": "carbon_level",
    Status: "status",
  };
  let new_car = {
    driver: "",
    brand: "",
    model: "",
    kilometers: "",
    plate_number: "",
    carbon_level: "",
    status: "",
  };

  const getCars = async () => {
    loading = true;
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
      })
      .finally(() => {
        loading = false;
      });

    fetch(import.meta.env.VITE_API_URL + "/api/users", {
      method: "GET",
      headers: {
        Authorization: `Bearer ${localStorage.getItem("token")}`,
      },
    })
      .then((response) => response.json())
      .then((data) => {
        drivers = data.users.filter((x) => x.role === "driver");
      })
      .catch((error) => {
        console.error("Error:", error);
      });
  };
  onMount(getCars);

  function newCarToggle() {
    show_form = !show_form;
    action = "new";
  }

  async function deleteCar(id) {
    const confirm = window.confirm("Are you sure you want to delete this car?");
    if (!confirm) {
      return;
    }
    try {
      const response = await fetch(
        import.meta.env.VITE_API_URL + "/api/cars/" + id,
        {
          method: "DELETE",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${localStorage.getItem("token")}`,
          },
        }
      );
      const data = await response.json();
      console.log("data: ", data);
      if (data.error) {
        alert(data.error);
        return;
      }
      await getCars();
    } catch (error) {
      console.error("Error:", error);
    }
  }

  async function newCar() {
    if (action === "new") {
      try {
        const { driver, status, ...meta } = new_car;
        const response = await fetch(
          import.meta.env.VITE_API_URL + "/api/cars",
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${localStorage.getItem("token")}`,
            },
            body: JSON.stringify({ meta, user: driver, status }),
          }
        );
        const data = await response.json();
        console.log("data: ", data);
        if (data.error) {
          alert(data.error);
          return;
        }
        await getCars();
        show_form = false;
      } catch (error) {
        console.error("Error:", error);
      }
    } else {
      try {
        const { driver, status, ...meta } = new_car;
        const response = await fetch(
          import.meta.env.VITE_API_URL + "/api/cars/" + car_id,
          {
            method: "PUT",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${localStorage.getItem("token")}`,
            },
            body: JSON.stringify({
              meta,
              user: driver === "" ? null : driver,
              status,
            }),
          }
        );
        const data = await response.json();
        console.log("data: ", data);
        if (data.error) {
          alert(data.error);
          return;
        }
        await getCars();
        show_form = false;
      } catch (error) {
        console.error("Error:", error);
      }
    }
  }
</script>

{#if loading}
  <LoadingList />
{:else}
  <div class="container mx-auto py-6 px-3">
    <div class="flex justify-between items-center mb-6">
      <div>
        <h1 class="text-3xl font-bold">Cars</h1>
        <p class="text-gray-500">
          {cars.filter((x) => x.status === "free").length} available cars
        </p>
      </div>
      <button
        on:click={newCarToggle}
        class="bg-green-600 hover:bg-green-800 transition text-white font-bold py-2 px-6 rounded-lg flex items-center justify-center gap-2 shadow-md"
      >
        <span class="text-2xl">+</span>
        <span>New Car</span>
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
              <th
                class="py-3 px-4 text-left font-semibold text-gray-700 border-b"
                >{key}</th
              >
            {/each}
            <th class="py-3 px-4 text-left font-semibold text-gray-700 border-b"
              >Created At</th
            >
            <th
              class="py-3 px-4 text-center font-semibold text-gray-700 border-b"
              >Actions</th
            >
          </tr>
        </thead>
        <tbody>
          {#each cars as car, index}
            <tr
              class="{index % 2 === 0
                ? 'bg-white'
                : 'bg-gray-100'} border-b border-l"
            >
              <td class="py-3 px-4 border-r"
                >{car.user
                  ? `${car.user.first_name} ${car.user.last_name}`
                  : ""}</td
              >
              <td class="py-3 px-4 border-r">{car.meta.brand}</td>
              <td class="py-3 px-4 border-r">{car.meta.model}</td>
              <td class="py-3 px-4 border-r">{car.meta.kilometers}</td>
              <td class="py-3 px-4 border-r">{car.meta.plate_number}</td>
              <td class="py-3 px-4 border-r">{car.meta.carbon_level}</td>
              <td class="py-3 px-4 border-r">
                {#if car.status === "free"}
                  <span
                    class="text-green-900 bg-green-300 px-4 py-1 rounded-full inline-block"
                    >Free</span
                  >
                {:else if car.status === "on_break"}
                  <span
                    class="text-yellow-900 bg-yellow-200 px-4 py-1 rounded-full inline-block"
                    >On break</span
                  >
                {:else}
                  <span
                    class="text-red-900 bg-red-200 px-4 py-1 rounded-full inline-block"
                    >Busy</span
                  >
                {/if}
              </td>
              <td class="py-3 px-4 border-r"
                >{moment(car.created_at).format("DD/MM/YYYY HH:MM")}</td
              >
              <td class="py-3 px-4 border-r flex justify-center gap-3">
                <button
                  on:click={() => {
                    action = "edit";
                    car_id = car._id;
                    new_car = {
                      driver: car.user ? car.user._id : "",
                      brand: car.meta.brand,
                      model: car.meta.model,
                      kilometers: car.meta.kilometers,
                      plate_number: car.meta.plate_number,
                      carbon_level: car.meta.carbon_level,
                      status: car.status,
                    };
                    show_form = true;
                  }}
                  class="border-amber-600 border hover:bg-amber-600 text-amber-600 hover:text-amber-100 font-bold py-2 px-4 rounded-lg transition duration-200"
                >
                  <MdiPencil class="w-4 h-4 inline" />
                  <span>Edit</span>
                </button>
                <button
                  on:click={deleteCar(car._id)}
                  class="border-red-600 border hover:bg-red-600 text-red-600 hover:text-red-100 font-bold py-2 px-4 rounded-lg transition duration-200"
                >
                  <MdiTrashCan class="w-4 h-4 inline" />
                  <span>Delete</span>
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
    class="fixed inset-0 z-40 flex items-center justify-center bg-white bg-opacity-80 backdrop-blur-sm transition-opacity duration-500"
  >
    <!-- Form Modal -->
    <div
      class="relative max-w-screen-lg w-full max-h-[80vh] overflow-y-auto bg-white p-8 rounded-xl shadow-xl border-2 z-50 transform transition-all duration-500"
    >
      <button
        class="absolute top-4 right-4 text-3xl text-gray-600 hover:text-gray-800"
        on:click={newCarToggle}
        aria-label="Close form"
      >
        ✕
      </button>
      <h2 class="text-3xl font-bold text-center mb-6">
        {action === "new" ? "Add a new Car" : "Edit a Car"}
      </h2>
      <form on:submit|preventDefault={newCar} class="space-y-6">
        <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
          {#each Object.keys(meta_verifier) as key}
            {#if key === "Driver"}
              <div>
                <label
                  for="field-{key}"
                  class="block text-sm font-medium text-gray-700 mb-1"
                >
                  {key} <span class="text-red-500">*</span>
                </label>
                <select
                  id="field-{key}"
                  class="block w-full border valid:border-green-500 outline-none border-gray-300 rounded-lg p-3 focus:ring-2 focus:ring-green-600 transition-all"
                  bind:value={new_car[meta_verifier[key]]}
                >
                  <option value="">Select a driver</option>
                  {#each drivers as driver}
                    <option value={driver._id}
                      >{driver.first_name} {driver.last_name}</option
                    >
                  {/each}
                </select>
              </div>
            {:else if key === "Status"}
              <div class="col-span-2">
                <label
                  for="field-{key}"
                  class="block text-sm font-medium text-gray-700 mb-1"
                >
                  {key} <span class="text-red-500">*</span>
                </label>
                <select
                  required
                  id="field-{key}"
                  class="block w-full border valid:border-green-500 outline-none border-gray-300 rounded-lg p-3 focus:ring-2 focus:ring-green-600 transition-all"
                  bind:value={new_car[meta_verifier[key]]}
                >
                  <option value="">Select a status</option>
                  <option value="free">Free</option>
                  <option value="busy">Busy</option>
                  <option value="on_break">On break</option>
                </select>
              </div>
            {:else}
              <div>
                <label
                  for="field-{key}"
                  class="block text-sm font-medium text-gray-700 mb-1"
                >
                  {key} <span class="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  id="field-{key}"
                  class="block w-full border valid:border-green-500 outline-none border-gray-300 rounded-lg p-3 focus:ring-2 focus:ring-green-600 transition-all"
                  bind:value={new_car[meta_verifier[key]]}
                />
              </div>
            {/if}
          {/each}
        </div>
        <div class="flex gap-4 mt-4">
          <button
            type="submit"
            class="bg-green-600 hover:bg-green-700 text-white font-bold py-3 px-4 rounded-lg flex-1 transition duration-200"
          >
            Submit
          </button>
          <button
            type="reset"
            class="bg-yellow-400 hover:bg-yellow-500 text-black font-bold py-3 px-4 rounded-lg flex-1 transition duration-200"
          >
            Reset
          </button>
        </div>
      </form>
    </div>
  </div>
{/if}
