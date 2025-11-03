<script>
  // @ts-nocheck
  import { DateInput } from "date-picker-svelte";
  import { onDestroy, onMount } from "svelte";
  import { navigate } from "svelte-navigator";
  import { fade } from "svelte/transition";
  // van images
  import van from "../../assets/van.webp";
  import vanBack from "../../assets/van/back.png";
  import vanFront from "../../assets/van/front.png";
  import vanLeft from "../../assets/van/left.png";
  import vanRight from "../../assets/van/right.png";

  import LoadingList from "../../components/LoadingList.svelte";
  import { user } from "../../stores";

  let selectedSide = "front"; // Default to 'front'
  const COLORS = ["#FBBF24", "#3B82F6", "#22C55E", "#ADD8E6", "#FFC0CB"];
  const VAN_IMAGES = {
    front: vanFront,
    back: vanBack,
    left: vanLeft,
    right: vanRight,
  };

  const VAN_TRANSLATIONS = {
    front: "Fronte",
    back: "Retro",
    left: "Sinistra",
    right: "Destra",
  };

  let cars = [];
  let drivers = [];
  let show_form = false;
  let action = "new";
  let car_id = "";
  let old_car_id = "";
  let loading = false;
  let meta_verifier = {
    Immagine: "image",
    Nome: "name",
    Marca: "brand",
    Modello: "model",
    Chilometri: "kilometers",
    Targa: "plate_number",
  };
  let checklist_verifier = {
    Marca: "brand",
    Modello: "model",
    Chilometri: "kilometers",
    Targa: "plate_number",
    "Livello carburante": "carbon_level",
  };
  let new_car = {
    brand: "",
    model: "",
    kilometers: "",
    plate_number: "",
    name: "",
    image: "",
  };
  let loadingCar = false;
  let material_checklists = [];
  let car_checklists = [];
  let selectedCar = null;
  let car_check_date = new Date();
  let material_date = new Date();
  let pointsLoading = false;
  let socket;
  let reconnectAttempts = 0;
  let isConnected = false;
  const MAX_RECONNECT_ATTEMPTS = 300;
  const BASE_RECONNECT_TIMEOUT = 1000; // Start with 1 second and increase
  let loadingInventory = false;
  let inventory = [];
  let groupedInventory = {};
  let lowInventoryItems = [];

  // Helper function to get part names based on color index
  const getPartName = (index) => {
    switch (index) {
      case 0:
        return "Strisciata"; // Yellow
      case 1:
        return "Ammaccatura"; // Blue
      case 2:
        return "Pezzo mancante"; // Green
      case 3:
        return "Rottura"; // Light Blue
      case 4:
        return "Altro"; // Pink
      default:
        return "";
    }
  };

  const handleSearchCarChecklists = async () => {
    try {
      const response = await fetch(
        import.meta.env.VITE_API_URL +
          "/api/car-checklist?date=" +
          car_check_date.toISOString().split("T")[0] +
          "&car=" +
          selectedCar._id,
        {
          method: "GET",
          headers: {
            Authorization: `Bearer ${localStorage.getItem("token")}`,
          },
        }
      );
      const req = await response.json();
      console.log("data: ", req);
      car_checklists = req.data;
    } catch (error) {
      console.error("Error:", error);
    }
  };

  const handleSearchMaterialChecklists = async () => {
    try {
      const response = await fetch(
        import.meta.env.VITE_API_URL +
          "/api/material-checklist?date=" +
          material_date.toISOString().split("T")[0] +
          "&car=" +
          selectedCar._id,
        {
          method: "GET",
          headers: {
            Authorization: `Bearer ${localStorage.getItem("token")}`,
          },
        }
      );
      const data = await response.json();
      console.log("data: ", data);
      material_checklists = data.checklists;
    } catch (error) {
      console.error("Error:", error);
    }
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
        if (selectedCar) {
          selectedCar = cars.find((x) => x._id === selectedCar._id);
        }
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
    old_car_id = "";
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

  async function disableCar(id) {
    const confirm = window.confirm(
      "Sei sicuro di voler rimuovere questo mezzo?"
    );
    if (!confirm) {
      return;
    }
    try {
      const response = await fetch(
        import.meta.env.VITE_API_URL + "/api/cars/" + id,
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${localStorage.getItem("token")}`,
          },
          body: JSON.stringify({
            status: "scrapped",
          }),
        }
      );
      const data = await response.json();
      console.log("data: ", data);

      await getCars();
    } catch (error) {
      console.error("Error:", error);
    }
  }
  async function newCar() {
    if (action === "new") {
      try {
        const { name, image, ...meta } = new_car;
        const response = await fetch(
          import.meta.env.VITE_API_URL + "/api/cars",
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${localStorage.getItem("token")}`,
            },
            body: JSON.stringify({ meta, name, image, old_car_id }),
          }
        );
        const data = await response.json();
        console.log("data: ", data);
        if (data.error) {
          alert(data.error);
          return;
        }
        new_car = {
          brand: "",
          model: "",
          kilometers: "",
          plate_number: "",
          name: "",
          image: "",
        };
        await getCars();
        show_form = false;
      } catch (error) {
        console.error("Error:", error);
      }
    } else {
      try {
        const { name, image, ...meta } = new_car;
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
              name,
              image,
            }),
          }
        );
        const data = await response.json();
        console.log("data: ", data);
        if (data.error) {
          alert(data.error);
          return;
        }
        new_car = {
          brand: "",
          model: "",
          kilometers: "",
          plate_number: "",
          name: "",
          image: "",
        };
        await getCars();
        show_form = false;
      } catch (error) {
        console.error("Error:", error);
      }
    }
  }

  async function handleSelectCar(car) {
    selectedCar = car;
    loadingCar = true;
    await Promise.all([
      fetch(
        import.meta.env.VITE_API_URL + "/api/cars/" + car._id + "/checklists",
        {
          method: "GET",
          headers: {
            Authorization: `Bearer ${localStorage.getItem("token")}`,
          },
        }
      )
        .then((response) => response.json())
        .then((data) => {
          material_checklists = data.material_checklists;
          car_checklists = data.car_checklists;
          console.log("data: ", data);
        })
        .catch((error) => {
          console.error("Error:", error);
        }),
      loadCarInventory(car._id),
    ]);
    loadingCar = false;
    setTimeout(() => {
      document
        .getElementById("selected-car")
        .scrollIntoView({ behavior: "smooth" });
    }, 100);
  }

  // Toggle point color when clicked
  const togglePointColor = (side, index) => {
    const confirmRemoval = window.confirm(
      "Sei sicuro di voler rimuovere questo punto?"
    );
    if (confirmRemoval)
      selectedCar.damages[side] = [
        ...selectedCar.damages[side].slice(0, index),
        ...selectedCar.damages[side].slice(index + 1),
      ];
  };

  const handlePoints = async () => {
    if (!selectedCar.damages) return;
    try {
      pointsLoading = true;
      const response = await fetch(
        import.meta.env.VITE_API_URL + "/api/cars/" + selectedCar._id,
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${localStorage.getItem("token")}`,
          },
          body: JSON.stringify({
            damages: selectedCar.damages,
          }),
        }
      );
      const data = await response.json();
      console.log("data: ", data);
      if (data.error) {
        alert(data.error);
        return;
      } else {
        alert("Punti aggiornati con successo!");
      }
    } catch (error) {
      console.error("Error:", error);
    } finally {
      pointsLoading = false;
    }
  };

  const gallery = Object.values(
    import.meta.glob("@assets/mezzo/*.{png,jpg,jpeg,PNG,JPEG}", {
      eager: true,
      query: "?url",
      import: "default",
    })
  );

  function createWebSocket() {
    socket = new WebSocket(import.meta.env.VITE_WS_URL + "/api/cars/ws");

    socket.onopen = () => {
      isConnected = true;
      reconnectAttempts = 0;
      console.log("WebSocket connection established");
    };

    socket.onmessage = async (event) => {
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
        cars = cars.map((car) => {
          if (car._id === id) {
            car.status = status || car.status;
            if (!u) {
              car.user = null;
            }
            if (newUser._id) {
              car.user = newUser;
            }
          }
          return car;
        });
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

  function handleImageChange(event) {
    const file = event.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        new_car.image = e.target.result;
      };
      reader.readAsDataURL(file);
    }
  }

  async function loadCarInventory(carId) {
    loadingInventory = true;
    try {
      const response = await fetch(
        `${import.meta.env.VITE_API_URL}/api/inventory/cars/${carId}`,
        {
          headers: {
            Authorization: `Bearer ${localStorage.getItem("token")}`,
          },
        }
      );
      const req = await response.json();
      console.log("data: ", req);
      inventory = req.data.map((item) => ({
        ...item,
        editing: false,
      }));
      console.log("inventory: ", inventory);

      // Group items by category
      groupedInventory = inventory.reduce((acc, item) => {
        const category = item.item.category || "Altro";
        if (!acc[category]) {
          acc[category] = [];
        }
        acc[category].push(item);
        return acc;
      }, {});
      // Find low inventory items (only for material items)
      lowInventoryItems = inventory.filter(
        (inv) =>
          inv.item.type !== "car" && inv.quantity < inv.item.minimum_quantity
      );
    } catch (error) {
      console.error("Error loading inventory:", error);
    } finally {
      loadingInventory = false;
    }
  }

  async function updateItemQuantity(item, change) {
    if (!selectedCar) return;

    const newQuantity = item.quantity + change;
    if (newQuantity < 0) return;

    try {
      const response = await fetch(
        `${import.meta.env.VITE_API_URL}/api/inventory/cars/${selectedCar._id}`,
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${localStorage.getItem("token")}`,
          },
          body: JSON.stringify({
            items: [
              {
                itemId: item.item._id,
                quantity: newQuantity,
              },
            ],
          }),
        }
      );
      const data = await response.json();
      inventory = data.map((item) => ({
        ...item,
        editing: false,
      }));
      groupedInventory = data.reduce((acc, item) => {
        const category = item.item.category || "Altro";
        if (!acc[category]) {
          acc[category] = [];
        }
        acc[category].push(item);
        return acc;
      }, {});
      lowInventoryItems = inventory.filter(
        (inv) =>
          inv.item.type !== "car" && inv.quantity < inv.item.minimum_quantity
      );
    } catch (error) {
      console.error("Error updating inventory:", error);
    }
  }
</script>

{#if loading}
  <LoadingList />
{:else}
  <div class="container mx-auto py-6 px-3">
    <div class="flex justify-between items-center mb-6">
      <div>
        <h1 class="text-3xl font-bold">Deposito</h1>
        <p class="text-gray-500">
          {cars.filter((x) => x.status === "free").length}
          {cars.length > 1 ? "mezzi" : "mezzo"} disponibili
        </p>
      </div>
      {#if $user.role !== "meccanico" && $user.role !== "direzione"}
        <button
          on:click={newCarToggle}
          class="bg-green-600 hover:bg-green-800 transition text-white font-bold py-2 px-6 rounded-lg flex items-center justify-center gap-2 shadow-md"
        >
          <span class="text-2xl">+</span>
          <span>Aggiungi mezzo</span>
        </button>
      {/if}
    </div>

    <!-- Table Container with Overflow for Responsiveness -->
    <div class="overflow-x-auto">
      <div
        class="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-6 p-3"
      >
        {#each cars.filter((x) => x.status !== "scrapped") as car}
          <button
            type="button"
            class="shadow-lg rounded-lg overflow-hidden {car === selectedCar
              ? 'bg-emerald-100'
              : 'bg-white'}"
            on:click={() => handleSelectCar(car)}
            aria-label="Select car"
          >
            <div class="p-4">
              <h3 class="text-lg font-bold text-gray-800 text-center">
                {car.name}
              </h3>
              <img
                src={car.image
                  ? car.image
                  : gallery.find((x) => x.includes(car.name)) || van}
                alt={car.meta.brand}
                class="w-full {gallery.find((x) => x.includes(car.name))
                  ? 'h-28 object-center object-cover'
                  : 'h-24 object-contain'} my-4"
              />
              <p class="text-gray-700 text-xl font-bold mb-2">
                {car.user
                  ? `${car.user.first_name} ${car.user.last_name}`
                  : "Nessun autista"}
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
                    class="text-yellow-900 bg-yellow-300 px-4 rounded-full inline-block text-sm py-1"
                    >Pausa</span
                  >
                {:else if car.status === "scrapped"}
                  <span
                    class="text-indigo-900 bg-indigo-300 px-4 rounded-full inline-block text-sm py-1"
                    >Rimosso</span
                  >
                {:else if car.status === "garage"}
                  <span
                    class="text-gray-900 bg-gray-300 px-4 rounded-full inline-block text-sm py-1"
                    >Al deposito</span
                  >
                {:else}
                  <span
                    class="text-red-900 bg-red-300 px-4 rounded-full inline-block text-sm py-1"
                    >Non disponibile</span
                  >
                {/if}
              </p>
            </div>
          </button>
        {/each}
      </div>

      {#if cars.filter((x) => x.status === "scrapped").length > 0}
        <!-- Scrapped Car List -->
        <div class="overflow-x-auto mt-10">
          <h2 class="text-2xl font-bold mb-4">Mezzi rimossi</h2>
          <div
            class="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-6 p-3"
          >
            {#each cars.filter((x) => x.status === "scrapped") as car}
              <button
                type="button"
                class="shadow-lg rounded-lg overflow-hidden {car === selectedCar
                  ? 'bg-emerald-100'
                  : 'bg-white'}"
                on:click={() => handleSelectCar(car)}
                aria-label="Select car"
              >
                <div class="p-4">
                  <h3 class="text-lg font-bold text-gray-800 text-center">
                    {car.name}
                  </h3>
                  <img
                    src={car.image
                      ? car.image
                      : gallery.find((x) => x.includes(car.name)) || van}
                    alt={car.meta.brand}
                    class="w-full {gallery.find((x) => x.includes(car.name))
                      ? 'h-28 object-center object-cover'
                      : 'h-24 object-contain'} my-4"
                  />
                  <p class="text-gray-700 text-xl font-bold mb-2">
                    {car.user
                      ? `${car.user.first_name} ${car.user.last_name}`
                      : "Nessun autista"}
                  </p>
                  <p class="text-gray-700">
                    <strong>Status:</strong>
                    <span
                      class="text-indigo-900 bg-indigo-300 px-4 rounded-full inline-block text-sm py-1"
                      >Rimosso</span
                    >
                  </p>
                </div>
              </button>
            {/each}
          </div>
        </div>
      {/if}
      <div
        id="selected-car"
        class="{loadingCar ? 'h-screen' : ''} mx-auto px-4"
      >
        {#if selectedCar}
          <div class="flex mb-8 pt-14 justify-between">
            <div class="bg-white">
              <h2 class="text-2xl font-bold mb-4">
                Stato mezzo {selectedCar.name}
              </h2>
              <p><strong>Targa:</strong> {selectedCar.meta.plate_number}</p>
              <p><strong>Marca:</strong> {selectedCar.meta.brand}</p>
              <p><strong>Modello:</strong> {selectedCar.meta.model}</p>
              <p><strong>Chilometri:</strong> {selectedCar.meta.kilometers}</p>
              <p>
                <strong>Livello carburante:</strong>
                {selectedCar.meta.carbon_level || "0"}%
              </p>
              <p>
                <strong>Driver:</strong>
                {selectedCar.user
                  ? `${selectedCar.user.first_name} ${selectedCar.user.last_name}`
                  : "Nessun autista"}
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
                    class="text-yellow-900 bg-yellow-200 px-4 rounded-full inline-block text-sm py-1"
                    >Pausa</span
                  >
                {:else if selectedCar.status === "scrapped"}
                  <span
                    class="text-indigo-900 bg-indigo-300 px-4 rounded-full inline-block text-sm py-1"
                    >Rimosso</span
                  >
                {:else if selectedCar.status === "garage"}
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
              </p>

              {#if selectedCar.status !== "scrapped"}
                {#if $user.role !== "direzione"}
                  <button
                    on:click={() => {
                      action = "edit";
                      car_id = selectedCar._id;
                      new_car = {
                        name: selectedCar.name,
                        brand: selectedCar.meta.brand,
                        model: selectedCar.meta.model,
                        kilometers: selectedCar.meta.kilometers,
                        plate_number: selectedCar.meta.plate_number,
                        image: selectedCar.image,
                      };
                      show_form = true;
                    }}
                    class="mt-4 block bg-lime-600 hover:bg-lime-800 text-white font-bold py-2 px-4 rounded-lg w-full max-w-52 transition duration-200"
                  >
                    Modifica
                  </button>
                {/if}
                <button
                  on:click={() => {
                    action = "new";
                    old_car_id = selectedCar._id;
                    show_form = true;
                  }}
                  class="mt-2 block bg-purple-600 hover:bg-purple-800 text-white font-bold py-2 px-4 rounded-lg w-full max-w-52 transition duration-200"
                >
                  Sostituisci
                </button>
                <button
                  on:click={() => disableCar(selectedCar._id)}
                  class="mt-2 block bg-red-600 hover:bg-red-800 text-white font-bold py-2 px-4 rounded-lg w-full max-w-52 transition duration-200"
                >
                  Rimuovi
                </button>
              {/if}
              <button
                on:click={() => (selectedCar = null)}
                class="mt-2 block bg-sky-600 hover:bg-sky-800 text-white font-bold py-2 px-4 rounded-lg w-full max-w-52 transition duration-200"
              >
                Chiudi
              </button>
            </div>

            <!-- Car Damage Points Display -->
            {#if $user.role === "administrator" || $user.role === "meccanico"}
              <div class="van-diagram-container">
                <!-- Car Image with Points -->
                <div class="relative mx-auto w-[375px]">
                  <img
                    src={VAN_IMAGES[selectedSide]}
                    alt="Van Side"
                    class="van-image"
                  />
                  {#each selectedCar.damages[selectedSide] as { x, y, colorIndex }, index}
                    <button
                      class="point"
                      style="left: {x}px; top: {y}px; background-color: {COLORS[
                        colorIndex
                      ]}"
                      on:click={() => togglePointColor(selectedSide, index)}
                    />
                  {/each}

                  <button
                    disabled={pointsLoading}
                    on:click={handlePoints}
                    class="{pointsLoading
                      ? 'bg-gray-600'
                      : 'bg-lime-600 hover:bg-lime-800'} w-full text-white font-bold py-2 px-4 rounded-lg transition duration-200"
                  >
                    Salva punto
                  </button>
                </div>

                <!-- Buttons to Switch Van Sides -->
                <div class="button-container">
                  {#each Object.keys(VAN_TRANSLATIONS) as side}
                    <button
                      class="side-button"
                      class:selected={selectedSide === side}
                      on:click={() => (selectedSide = side)}
                    >
                      {VAN_TRANSLATIONS[side]}
                    </button>
                  {/each}
                </div>

                <div class="flex flex-wrap items-start gap-2 flex-col">
                  {#each COLORS as color, index}
                    <div class="flex items-center my-1">
                      <div
                        class="w-5 h-5 rounded-sm mr-1"
                        style="background-color: {color};"
                      ></div>
                      <span class="text-sm">{getPartName(index)}</span>
                    </div>
                  {/each}
                </div>
              </div>
            {/if}
          </div>

          {#if $user.role !== "direzione"}
            <h2 class="text-2xl font-bold mb-4">
              Checklist mezzo {selectedCar.name}
            </h2>
            <div class="mb-4 flex items-center gap-4">
              <DateInput bind:value={car_check_date} format="dd/MM/yyyy" />
              <button
                on:click={handleSearchCarChecklists}
                class="bg-lime-600 hover:bg-lime-800 text-white font-bold py-2 px-4 rounded-lg transition duration-200"
              >
                Scegli data
              </button>
            </div>
            <table class="border-collapse overflow-hidden w-full">
              <thead class="bg-gradient-to-l from-gray-200 to-gray-300">
                <tr>
                  <th
                    class="py-3 px-4 text-left font-semibold text-gray-700 border-b"
                    >Autista</th
                  >
                  {#each Object.keys(checklist_verifier) as key}
                    <th
                      class="py-3 px-4 text-left font-semibold text-gray-700 border-b"
                      >{key}</th
                    >
                  {/each}
                  <th
                    class="py-3 px-4 text-left font-semibold text-gray-700 border-b"
                    >PDF Link</th
                  >
                  <th
                    class="py-3 px-4 text-left font-semibold text-gray-700 border-b"
                    >Data</th
                  >
                </tr>
              </thead>
              <tbody>
                {#each car_checklists as run}
                  <tr class="bg-gray-50 border-b border-l">
                    <td class="py-3 px-4 border-r border-inherit"
                      >{run.user.first_name} {run.user.last_name}</td
                    >
                    {#each Object.keys(checklist_verifier) as key}
                      <td class="py-3 px-4 border-r border-inherit"
                        >{selectedCar.meta[checklist_verifier[key]]}</td
                      >
                    {/each}
                    <td class="py-3 px-4 border-r border-inherit">
                      <a
                        href={import.meta.env.VITE_API_URL +
                          "/api/checklist/" +
                          run._id +
                          "/pdf"}
                        target="_blank"
                        class="bg-blue-500 flex gap-4 items-center justify-center hover:bg-blue-700 text-white font-bold py-2 px-4 rounded"
                        ><span> 📥 </span> <span>Scarica PDF</span>
                      </a>
                    </td>
                    <td class="py-3 px-4 border-r border-inherit">
                      {new Date(run.created_at).toLocaleDateString("it-IT")}
                    </td>
                  </tr>
                {/each}
              </tbody>
            </table>

            <button
              class="mt-4 block bg-lime-600 hover:bg-lime-800 text-white font-bold py-2 px-4 rounded-lg w-full max-w-52 transition duration-200"
              on:click={() => navigate("/car-checklists")}
            >
              Vedi tutte le checklist
            </button>
          {/if}
          {#if $user.role !== "meccanico"}
            <h2 class="text-2xl font-bold mb-4 mt-8">
              Checklist Materiale infermieristico mezzo {selectedCar.name}
            </h2>
            <div class="mb-4 flex items-center gap-4">
              <DateInput bind:value={material_date} format="dd/MM/yyyy" />
              <button
                on:click={handleSearchMaterialChecklists}
                class="bg-lime-600 hover:bg-lime-800 text-white font-bold py-2 px-4 rounded-lg transition duration-200"
              >
                Scegli data
              </button>
            </div>
            <table class="border-collapse overflow-hidden w-full">
              <thead class="bg-gradient-to-l from-gray-200 to-gray-300">
                <tr>
                  <th
                    class="py-3 px-4 text-left font-semibold text-gray-700 border-b"
                    >Autista</th
                  >
                  {#each Object.keys(checklist_verifier) as key}
                    <th
                      class="py-3 px-4 text-left font-semibold text-gray-700 border-b"
                      >{key}</th
                    >
                  {/each}
                  <th
                    class="py-3 px-4 text-left font-semibold text-gray-700 border-b"
                    >PDF Link</th
                  >
                  <th
                    class="py-3 px-4 text-left font-semibold text-gray-700 border-b"
                    >Data</th
                  >
                </tr>
              </thead>
              <tbody>
                {#each material_checklists as run}
                  <tr class="bg-gray-50 border-b border-l">
                    <td class="py-3 px-4 border-r border-inherit"
                      >{run.user.first_name} {run.user.last_name}</td
                    >
                    {#each Object.keys(checklist_verifier) as key}
                      <td class="py-3 px-4 border-r border-inherit"
                        >{selectedCar.meta[checklist_verifier[key]]}</td
                      >
                    {/each}
                    <td class="py-3 px-4 border-r border-inherit">
                      <a
                        href={import.meta.env.VITE_API_URL +
                          "/api/checklist/" +
                          run._id +
                          "/pdf"}
                        target="_blank"
                        class="bg-blue-500 flex gap-4 items-center justify-center hover:bg-blue-700 text-white font-bold py-2 px-4 rounded"
                        ><span> 📥 </span> <span>Scarica PDF</span>
                      </a>
                    </td>
                    <td class="py-3 px-4 border-r border-inherit">
                      {new Date(run.created_at).toLocaleDateString("it-IT")}
                    </td>
                  </tr>
                {/each}
              </tbody>
            </table>
            <button
              class="mt-4 block bg-lime-600 hover:bg-lime-800 text-white font-bold py-2 px-4 rounded-lg w-full max-w-52 transition duration-200"
              on:click={() => navigate("/material-checklists")}
            >
              Vedi tutte le checklist
            </button>
          {/if}

          <!-- Inventory Management Section -->
          <div class="mt-8">
            <h2 class="text-2xl font-bold mb-4">Inventario</h2>
            {#if loadingInventory}
              <LoadingList />
            {:else}
              <div>
                {#each Object.entries(groupedInventory).filter(([category]) => category === "VEICOLO") as [category, items]}
                  <div class="inventory-card inventory-card-wide mb-4">
                    <h4 class="inventory-title">{category}</h4>
                    <div class="inventory-items">
                      {#each items as item}
                        <div class="inventory-item border-l-4 border-blue-500">
                          <div class="inventory-item-name">
                            <p class="font-medium text-sm">{item.item.name}</p>
                            {#if item.item.subcategory && item.item.subcategory !== "Generale"}
                              <p class="text-xs text-gray-500">
                                {item.item.subcategory}
                              </p>
                            {/if}
                          </div>
                          <div class="inventory-item-controls">
                            {#if item.item.type === "car"}
                              <label
                                class="flex items-center gap-2 cursor-pointer"
                              >
                                <input
                                  type="checkbox"
                                  checked={item.quantity === 1}
                                  on:change={() =>
                                    updateItemQuantity(
                                      item,
                                      item.quantity === 1 ? -1 : 1
                                    )}
                                  class="w-5 h-5 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                                />
                                <span
                                  class="text-sm font-medium {item.quantity ===
                                  1
                                    ? 'text-blue-600'
                                    : 'text-red-600'}"
                                >
                                  {item.quantity === 1
                                    ? "Funzionante"
                                    : "Non funzionante"}
                                </span>
                              </label>
                            {:else if item.editing}
                              <div class="flex items-center gap-2">
                                <input
                                  type="number"
                                  bind:value={item.quantity}
                                  min="0"
                                  class="w-20 p-2 border rounded focus:ring-2 focus:ring-green-500 focus:border-green-500"
                                />
                                <button
                                  on:click={() => {
                                    updateItemQuantity(item, 0);
                                    item.editing = false;
                                  }}
                                  class="bg-green-100 hover:bg-green-200 text-green-800 py-2 px-4 rounded"
                                >
                                  Salva
                                </button>
                              </div>
                            {:else}
                              <div class="flex items-center gap-2">
                                <div class="text-xs">
                                  <p>
                                    Quantità: <span
                                      class="font-bold text-green-600"
                                      >{item.quantity}</span
                                    >
                                    <br />
                                    Minimo:
                                    <span class="font-bold text-green-600"
                                      >{item.item.minimum_quantity}</span
                                    >
                                  </p>
                                </div>
                                <button
                                  on:click={() => (item.editing = true)}
                                  class="bg-gray-100 hover:bg-gray-200 text-gray-800 p-2 rounded text-sm"
                                >
                                  Modifica
                                </button>
                              </div>
                            {/if}
                          </div>
                        </div>
                      {/each}
                    </div>
                  </div>
                {/each}

                <div class="inventory-container">
                  {#each Object.entries(groupedInventory).filter(([category]) => category !== "VEICOLO") as [category, items]}
                    <div class="inventory-card">
                      <h4 class="inventory-title">{category}</h4>
                      <div class="inventory-items">
                        {#each items as item}
                          <div
                            class="inventory-item border-l-4 border-green-500"
                          >
                            <div class="inventory-item-name">
                              <p class="font-medium text-sm">
                                {item.item.name}
                              </p>
                              {#if item.item.subcategory && item.item.subcategory !== "Generale"}
                                <p class="text-xs text-gray-500">
                                  {item.item.subcategory}
                                </p>
                              {/if}
                            </div>
                            <div class="inventory-item-controls">
                              {#if item.editing}
                                <div class="flex items-center gap-2">
                                  <input
                                    type="number"
                                    bind:value={item.quantity}
                                    min="0"
                                    class="w-20 p-2 border rounded focus:ring-2 focus:ring-green-500 focus:border-green-500"
                                  />
                                  <button
                                    on:click={() => {
                                      updateItemQuantity(item, 0);
                                      item.editing = false;
                                    }}
                                    class="bg-green-100 hover:bg-green-200 text-green-800 py-2 px-4 rounded"
                                  >
                                    Salva
                                  </button>
                                </div>
                              {:else}
                                <div class="flex items-center gap-2">
                                  <div class="text-xs">
                                    <p>
                                      Quantità: <span
                                        class="font-bold text-green-600"
                                        >{item.quantity}</span
                                      >
                                      <br />
                                      Minimo:
                                      <span class="font-bold text-green-600"
                                        >{item.item.minimum_quantity}</span
                                      >
                                    </p>
                                  </div>
                                  <button
                                    on:click={() => (item.editing = true)}
                                    class="bg-gray-100 hover:bg-gray-200 text-gray-800 p-2 rounded text-sm"
                                  >
                                    Modifica
                                  </button>
                                </div>
                              {/if}
                            </div>
                          </div>
                        {/each}
                      </div>
                    </div>
                  {/each}
                </div>
              </div>
              {#if lowInventoryItems.length > 0}
                <div
                  class="mt-6 p-4 bg-yellow-50 border border-yellow-200 rounded-lg"
                >
                  <h4 class="text-lg font-bold text-yellow-800 mb-2">
                    Articoli sotto scorta minima:
                  </h4>
                  <ul class="list-disc list-inside space-y-1">
                    {#each lowInventoryItems as item}
                      <li class="text-yellow-700">
                        {item.item.name} ({item.quantity}/{item.item
                          .minimum_quantity})
                      </li>
                    {/each}
                  </ul>
                </div>
              {/if}
            {/if}
          </div>
        {/if}
      </div>
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
        {action === "new"
          ? old_car_id
            ? "Sostituisci mezzo " +
              cars.find((car) => car._id === old_car_id).name
            : "Aggiungi mezzo"
          : "Modifica mezzo"}
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
            {:else if key === "Immagine"}
              <div>
                <label
                  for="field-{key}"
                  class="block text-sm font-medium text-gray-700 mb-1"
                >
                  {key} <span class="text-red-500">*</span>
                </label>
                <input
                  type="file"
                  accept="image/*"
                  id="field-{key}"
                  class="block w-full border valid:border-green-500 outline-none border-gray-300 rounded-lg p-3 focus:ring-2 focus:ring-green-600 transition-all"
                  on:change={(e) => {
                    const file = e.target.files[0];
                    if (file) {
                      const img = new Image();
                      img.onload = function () {
                        const ratio = img.width / img.height;
                        if (Math.abs(ratio - 600 / 400) > 0.01) {
                          alert(
                            "L'immagine deve avere un rapporto di aspetto di 3:2 (come 600x400 pixel)"
                          );
                          e.target.value = "";
                        } else {
                          handleImageChange(e);
                        }
                      };
                      img.src = URL.createObjectURL(file);
                    }
                  }}
                />
                <small class="text-gray-500 mt-1 block">
                  L'immagine deve avere un rapporto di aspetto di 3:2 (come
                  600x400 pixel)
                </small>
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

<style>
  .van-diagram-container {
    display: flex;
    gap: 1rem;
    align-items: center;
  }
  .van-image {
    width: 100%;
    height: 100%;
    aspect-ratio: 1;
    object-fit: contain;
  }
  .point {
    position: absolute;
    width: 1.5rem;
    height: 1.5rem;
    border-radius: 50%;
    border: 2px solid black;
    cursor: pointer;
    opacity: 0.8;
  }
  .button-container {
    display: flex;
    flex-direction: column;
    justify-content: center;
    gap: 10px;
    margin-top: 10px;
  }
  .side-button {
    padding: 1rem;
    background-color: #22c55e;
    border-radius: 5px;
    color: white;
    font-weight: bold;
    cursor: pointer;
  }
  .side-button.selected {
    background-color: #3b82f6;
  }

  /* New masonry layout */
  .inventory-container {
    column-count: 3;
    column-gap: 1rem;
  }

  @media (max-width: 992px) {
    .inventory-container {
      column-count: 2;
    }
  }

  @media (max-width: 600px) {
    .inventory-container {
      column-count: 1;
    }
  }

  .inventory-card {
    background-color: #f9fafb;
    border-radius: 0.5rem;
    padding: 1rem;
    margin-bottom: 1rem;
    break-inside: avoid;
    display: inline-block;
    width: 100%;
  }

  .inventory-card-wide {
    width: 100%;
    display: block;
  }

  .inventory-title {
    font-weight: 600;
    margin-bottom: 0.5rem;
    padding-bottom: 0.5rem;
  }

  .inventory-items {
    display: flex;
    flex-direction: column;
    gap: 0.5rem;
  }

  .inventory-item {
    display: flex;
    justify-content: space-between;
    align-items: center;
    background-color: white;
    padding: 0.75rem;
    border-radius: 0.375rem;
  }

  .inventory-item-name {
    flex: 1;
  }

  .inventory-item-controls {
    display: flex;
    gap: 0.5rem;
    align-items: center;
    flex-shrink: 0;
  }
</style>
