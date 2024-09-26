<script>
  // @ts-nocheck
  import { onMount } from "svelte";
  import { fade } from "svelte/transition";
  import vanImage from "../../assets/van.png";
  import LoadingList from "../../components/LoadingList.svelte";
  let cars = [];
  let drivers = [];
  let show_form = false;
  let action = "new";
  let car_id = "";
  let loading = false;
  let meta_verifier = {
    Nome: "name",
    Driver: "driver",
    Marca: "brand",
    Modello: "model",
    Chilometri: "kilometers",
    Targa: "plate_number",
    Status: "status",
    "Livello carburante": "carbon_level",
  };
  let new_car = {
    driver: "",
    brand: "",
    model: "",
    kilometers: "",
    plate_number: "",
    carbon_level: "",
    status: "",
    name: "",
  };
  let selectedCar = null;

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
    const confirm = window.confirm(
      "Sei sicuro di voler eliminare questo mezzo?"
    );
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
        const { driver, status, name, ...meta } = new_car;
        const response = await fetch(
          import.meta.env.VITE_API_URL + "/api/cars",
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${localStorage.getItem("token")}`,
            },
            body: JSON.stringify({ meta, user: driver, status, name }),
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
        const { driver, name, status, ...meta } = new_car;
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
              name,
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
        <h1 class="text-3xl font-bold">Mezzi</h1>
        <p class="text-gray-500">
          {cars.filter((x) => x.status === "free").length} disponibile {cars.length >
          1
            ? "mezzi"
            : "mezzo"}
        </p>
      </div>
      <button
        on:click={newCarToggle}
        class="bg-green-600 hover:bg-green-800 transition text-white font-bold py-2 px-6 rounded-lg flex items-center justify-center gap-2 shadow-md"
      >
        <span class="text-2xl">+</span>
        <span>Aggiungi mezzo</span>
      </button>
    </div>

    <!-- Table Container with Overflow for Responsiveness -->
    <div class="overflow-x-auto">
      <div
        class="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-6 p-3"
      >
        {#each cars as car}
          <button
            type="button"
            class="shadow-lg rounded-lg overflow-hidden {car === selectedCar
              ? 'bg-emerald-100'
              : 'bg-white'}"
            on:click={() => (selectedCar = car)}
            aria-label="Select car"
          >
            <div class="p-4">
              <h3 class="text-lg font-bold text-gray-800 text-center">
                {car.name}
              </h3>
              <img
                src={vanImage}
                alt={car.meta.brand}
                class="w-full h-36 object-contain"
              />
              <p class="text-gray-700 text-xl font-bold mb-2">
                {car.user
                  ? `${car.user.first_name} ${car.user.last_name}`
                  : "Nessun driver"}
              </p>
              <p class="text-gray-700">
                <strong>Status:</strong>
                {#if car.status === "free"}
                  <span
                    class="text-green-900 bg-green-300 px-4 rounded-full inline-block text-sm py-1"
                    >Disponibile</span
                  >
                {:else if car.status === "on_break"}
                  <span
                    class="text-yellow-900 bg-yellow-200 px-4rounded-full inline-block text-sm py-1"
                    >Pausa</span
                  >
                {:else}
                  <span
                    class="text-red-900 bg-red-200 px-4 rounded-full inline-block text-sm py-1"
                    >Non disponibile</span
                  >
                {/if}
              </p>
            </div>
          </button>
        {/each}
      </div>
      {#if selectedCar}
        <div class="mt-6 p-4 bg-white shadow-lg rounded-lg">
          <h2 class="text-2xl font-bold mb-4">Stato mezzo</h2>
          <p><strong>Targa:</strong> {selectedCar.meta.plate_number}</p>
          <p><strong>Marca:</strong> {selectedCar.meta.brand}</p>
          <p><strong>Modello:</strong> {selectedCar.meta.model}</p>
          <p><strong>Chilometri:</strong> {selectedCar.meta.kilometers}</p>
          <p>
            <strong>Livello carburante:</strong>
            {selectedCar.meta.carbon_level}
          </p>
          <p>
            <strong>Driver:</strong>
            {selectedCar.user
              ? `${selectedCar.user.first_name} ${selectedCar.user.last_name}`
              : "Nessun driver"}
          </p>
          <p>
            <strong>Status:</strong>
            {#if selectedCar.status === "free"}
              <span
                class="text-green-900 bg-green-300 px-4 rounded-full inline-block text-sm py-1"
                >Disponibile</span
              >
            {:else if selectedCar.status === "on_break"}
              <span
                class="text-yellow-900 bg-yellow-200 px-4rounded-full inline-block text-sm py-1"
                >Pausa</span
              >
            {:else}
              <span
                class="text-red-900 bg-red-200 px-4 rounded-full inline-block text-sm py-1"
                >Non disponibile</span
              >
            {/if}
          </p>
          <button
            on:click={() => (selectedCar = null)}
            class="mt-4 bg-lime-600 hover:bg-lime-800 text-white font-bold py-2 px-4 rounded-lg w-full max-w-52 transition duration-200"
          >
            Chiudi
          </button>
        </div>
      {/if}
    </div>
  </div>
{/if}

{#if show_form}
  <!-- Modal Background -->
  <div
    transition:fade={{ duration: 300 }}
    class="fixed inset-0 z-40 flex items-center justify-center bg-white"
  >
    <!-- Form Modal -->
    <div
      class="relative max-w-screen-lg w-full max-h-[80vh] overflow-y-auto z-50"
    >
      <button
        class="absolute top-4 right-4 text-3xl text-gray-600 hover:text-gray-800"
        on:click={newCarToggle}
        aria-label="Close form"
      >
        ✕
      </button>
      <h2 class="text-3xl font-bold text-center mb-6">
        {action === "new" ? "Aggiungi mezzo" : "Modifica mezzo"}
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
                  class="block w-full border bg-white valid:border-green-500 outline-none border-gray-300 rounded-lg p-3 focus:ring-2 focus:ring-green-600 transition-all"
                  bind:value={new_car[meta_verifier[key]]}
                >
                  <option value="">Seleziona</option>
                  {#each drivers as driver}
                    <option value={driver._id}
                      >{driver.first_name} {driver.last_name}</option
                    >
                  {/each}
                </select>
              </div>
            {:else if key === "Status"}
              <div>
                <label
                  for="field-{key}"
                  class="block text-sm font-medium text-gray-700 mb-1"
                >
                  {key} <span class="text-red-500">*</span>
                </label>
                <select
                  required
                  id="field-{key}"
                  class="block w-full border bg-white valid:border-green-500 outline-none border-gray-300 rounded-lg p-3 focus:ring-2 focus:ring-green-600 transition-all"
                  bind:value={new_car[meta_verifier[key]]}
                >
                  <option value="">Seleziona</option>
                  <option value="free">Disponibile</option>
                  <option value="on_break">Pausa</option>
                  <option value="busy">Non disponibile</option>
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
