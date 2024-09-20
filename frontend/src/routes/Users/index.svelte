<script>
  // @ts-nocheck
  import moment from "moment";
  import { onMount } from "svelte";
  import { fade, fly } from "svelte/transition";
  import MdiEye from "virtual:icons/mdi/eye";
  import MdiEyeOff from "virtual:icons/mdi/eye-off";
  import MdiPencil from "virtual:icons/mdi/pencil";
  import MdiTrashCan from "virtual:icons/mdi/trash-can";
  import LoadingList from "../../components/LoadingList.svelte";
  import { user as storeUser } from "../../stores";
  let show_password = false;
  $: type = show_password ? "text" : "password";
  let loading = false;
  let users = [];
  let cars = [];
  let show_form = false;
  let action = "new";
  let user_id = "";
  let userType = "driver";
  let meta_verifier = {
    Mezzo: "car",
    Email: "email",
    Username: "username",
    Password: "password",
    Nome: "first_name",
    Cognome: "last_name",
    "Data di nascita": "dob",
    Telefono: "phone",
  };
  let new_user = {
    username: "",
    password: "",
    email: "",
    first_name: "",
    last_name: "",
    dob: "",
    phone: "",
    car: "",
  };

  onMount(() => {
    loading = true;
    getDrivers();
    getCars();
    loading = false;
  });

  async function getCars() {
    fetch(import.meta.env.VITE_API_URL + "/api/cars", {
      method: "GET",
      headers: {
        Authorization: `Bearer ${localStorage.getItem("token")}`,
      },
    })
      .then((response) => response.json())
      .then((data) => {
        cars = data.cars;
        console.log("cars: ", cars);
      })
      .catch((error) => {
        console.error("Error:", error);
      });
  }

  function newUserToggle() {
    show_form = !show_form;
    action = "new";
  }

  async function deleteCar(id) {
    const confirm = window.confirm(
      "Are you sure you want to delete this user?"
    );
    if (!confirm) {
      return;
    }
    try {
      const response = await fetch(
        import.meta.env.VITE_API_URL + "/api/users/" + id,
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
      if (userType === "driver") {
        await getDrivers();
      } else {
        await getOperators();
      }
    } catch (error) {
      console.error("Error:", error);
    }
  }

  async function newUser() {
    if (action === "new") {
      try {
        const response = await fetch(
          import.meta.env.VITE_API_URL + "/api/register",
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${localStorage.getItem("token")}`,
            },
            body: JSON.stringify({ ...new_user, role: userType }),
          }
        );
        const data = await response.json();
        console.log("data: ", data);
        if (data.error) {
          alert(data.error);
          return;
        }
        if (userType === "driver") {
          await getDrivers();
        } else {
          await getOperators();
        }
        new_user = {
          username: "",
          password: "",
          email: "",
          first_name: "",
          last_name: "",
          dob: "",
          phone: "",
          car: "",
        };
        show_form = false;
      } catch (error) {
        console.error("Error:", error);
      }
    } else {
      try {
        const response = await fetch(
          import.meta.env.VITE_API_URL + "/api/users/" + user_id,
          {
            method: "PUT",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${localStorage.getItem("token")}`,
            },
            body: JSON.stringify({ ...new_user }),
          }
        );
        const data = await response.json();
        if (data.error) {
          alert(data.error);
          return;
        }
        if (userType === "driver") {
          await getDrivers();
        } else {
          await getOperators();
        }
        new_user = {
          username: "",
          password: "",
          email: "",
          first_name: "",
          last_name: "",
          dob: "",
          phone: "",
          car: "",
        };
        show_form = false;
      } catch (error) {
        console.error("Error:", error);
      }
    }
  }

  async function getDrivers() {
    userType = "driver";
    fetch(import.meta.env.VITE_API_URL + "/api/users?type=driver", {
      method: "GET",
      headers: {
        Authorization: `Bearer ${localStorage.getItem("token")}`,
      },
    })
      .then((response) => response.json())
      .then((data) => {
        users = data.users;
        console.log("users: ", users);
      })
      .catch((error) => {
        console.error("Error:", error);
      });
  }

  async function getOperators() {
    userType = "operator";
    fetch(import.meta.env.VITE_API_URL + "/api/users?type=operator", {
      method: "GET",
      headers: {
        Authorization: `Bearer ${localStorage.getItem("token")}`,
      },
    })
      .then((response) => response.json())
      .then((data) => {
        users = data.users;
        console.log("users: ", users);
      })
      .catch((error) => {
        console.error("Error:", error);
      });
  }
</script>

{#if loading}
  <LoadingList />
{:else}
  <!-- Submenu buttons -->
  <div class=" mb-6 shadow-lg">
    <div class="container mx-auto p-4 flex gap-4">
      <button
        class="{userType === 'driver'
          ? 'bg-emerald-200 text-emerald-700'
          : 'bg-gray-100 text-gray-400'} transition font-bold py-2 px-6 rounded-lg"
        on:click={getDrivers}
      >
        <span>Driver</span>
      </button>
      <button
        class="{userType === 'operator'
          ? 'bg-emerald-200  text-emerald-700'
          : 'bg-gray-100 text-gray-400'} transition font-bold py-2 px-6 rounded-lg"
        on:click={getOperators}
      >
        <span>Operator</span>
      </button>
    </div>
  </div>
  <div class="container mx-auto py-6 px-3">
    <div class="flex justify-between items-center mb-6">
      <div>
        <h1 class="text-3xl font-bold">Lista dei {userType}</h1>
        <p class="text-gray-500">
          {users.filter((x) => x.driver_status === "free").length} disponibile {userType}
        </p>
      </div>
      <button
        on:click={newUserToggle}
        class="bg-green-600 hover:bg-green-800 transition text-white font-bold py-2 px-6 rounded-lg flex items-center justify-center gap-2 shadow-md"
      >
        <span class="text-2xl">+</span>
        <span>Aggiungi {userType}</span>
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
              >Username</th
            >
            <th class="py-3 px-4 text-left font-semibold text-gray-700 border-b"
              >Nome</th
            >
            <th class="py-3 px-4 text-left font-semibold text-gray-700 border-b"
              >Cognome</th
            >
            <th class="py-3 px-4 text-left font-semibold text-gray-700 border-b"
              >Email</th
            >
            {#if userType === "driver"}
              <th
                transition:fly={{
                  x: 100,
                  duration: 300,
                }}
                class="py-3 px-4 text-left font-semibold text-gray-700 border-b"
                >Mezzo</th
              >
              <th
                transition:fly={{
                  x: 100,
                  duration: 300,
                }}
                class="py-3 px-4 text-left font-semibold text-gray-700 border-b"
                >Status</th
              >
            {/if}
            <th class="py-3 px-4 text-left font-semibold text-gray-700 border-b"
              >Data di Creazione</th
            >
            <th
              class="py-3 px-4 text-center font-semibold text-gray-700 border-b"
              >Azioni</th
            >
          </tr>
        </thead>
        <tbody>
          {#each users as user, index}
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
              <td class="py-3 px-4 border-r">{user.username}</td>
              <td class="py-3 px-4 border-r">{user.first_name}</td>
              <td class="py-3 px-4 border-r">{user.last_name}</td>
              <td class="py-3 px-4 border-r">{user.email}</td>
              {#if userType === "driver"}
                <td class="py-3 px-4 border-r">
                  {#if user.car}
                    <span class="font-bold"> {user.car.meta.plate_number}</span>
                  {:else}
                    <span class="text-gray-500">-</span>
                  {/if}
                </td>
                <td class="py-3 px-4 border-r">
                  {#if user.driver_status === "free"}
                    <span
                      class="text-green-900 bg-green-300 px-4 py-1 rounded-full inline-block"
                      >Free</span
                    >
                  {:else}
                    <span
                      class="text-red-900 bg-red-200 px-4 py-1 rounded-full inline-block"
                      >Busy</span
                    >
                  {/if}
                </td>
              {/if}
              <td class="py-3 px-4 border-r"
                >{moment(user.created_at).format("DD/MM/YYYY HH:MM")}</td
              >
              <td class="py-3 px-4 border-r flex justify-center gap-3">
                {#if user._id !== $storeUser._id}
                  <button
                    on:click={() => {
                      console.log("user: ", user);
                      action = "edit";
                      user_id = user._id;
                      new_user = {
                        username: user.username,
                        password: user.password,
                        email: user.email,
                        first_name: user.first_name,
                        last_name: user.last_name,
                        dob: user.dob.split("T")[0],
                        phone: user.phone,
                        car: user.car ? user.car._id : "",
                      };
                      show_form = true;
                    }}
                    class="border-amber-600 border hover:bg-amber-600 text-amber-600 hover:text-amber-100 font-bold py-2 px-4 rounded-lg transition duration-200"
                  >
                    <MdiPencil class="w-4 h-4 inline" />
                    <span>Modifica</span>
                  </button>
                  <button
                    on:click={deleteCar(user._id)}
                    class="border-red-600 border hover:bg-red-600 text-red-600 hover:text-red-100 font-bold py-2 px-4 rounded-lg transition duration-200"
                  >
                    <MdiTrashCan class="w-4 h-4 inline" />
                    <span>Elimina</span>
                  </button>
                {:else}
                  <div class="text-gray-500 py-4 px-4"></div>
                {/if}
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
          new_user = {
            username: "",
            password: "",
            email: "",
            first_name: "",
            last_name: "",
            dob: "",
            phone: "",
            car: "",
          };
        }}
        aria-label="Close form"
      >
        ✕
      </button>
      <h2 class="text-3xl font-bold text-left mb-6">
        {action === "new" ? "Aggiungi " + userType : "Modifica " + userType}
      </h2>
      <form on:submit|preventDefault={newUser} class="space-y-6">
        <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
          {#each Object.keys(meta_verifier) as key}
            <div
              class={key === "Mezzo" && userType !== "driver" ? "hidden" : ""}
            >
              {#if key === "Mezzo" && userType === "driver"}
                <label
                  for="field-{key}"
                  class="block text-sm font-medium text-gray-700 mb-1"
                >
                  {key} <span class="text-red-500">*</span>
                </label>
                <select
                  id="field-{key}"
                  class="block w-full border outline-none border-gray-300 rounded-lg p-3 focus:ring-2 focus:ring-lime-600 transition-all"
                  bind:value={new_user[meta_verifier[key]]}
                >
                  <option value="">Seleziona</option>
                  {#each cars as car}
                    <option value={car._id}
                      >{car.meta.brand}
                      {car.meta.model}
                      {car.meta.plate_number}</option
                    >
                  {/each}
                </select>
              {:else if key !== "Mezzo"}
                <label
                  for="field-{key}"
                  class="block text-sm font-medium text-gray-700 mb-1"
                >
                  {key} <span class="text-red-500">*</span>
                </label>
                {#if meta_verifier[key] === "email"}
                  <input
                    type="email"
                    id="field-{key}"
                    required
                    class="block w-full border valid:border-lime-500 outline-none border-gray-300 rounded-lg p-3 focus:ring-2 focus:ring-lime-600 transition-all"
                    bind:value={new_user[meta_verifier[key]]}
                  />
                {:else if meta_verifier[key] === "phone"}
                  <input
                    type="tel"
                    id="field-{key}"
                    required
                    class="block w-full border valid:border-lime-500 outline-none border-gray-300 rounded-lg p-3 focus:ring-2 focus:ring-lime-600 transition-all"
                    bind:value={new_user[meta_verifier[key]]}
                  />
                {:else if meta_verifier[key] === "dob"}
                  <input
                    type="date"
                    id="field-{key}"
                    required
                    class="block w-full border valid:border-lime-500 outline-none border-gray-300 rounded-lg p-3 focus:ring-2 focus:ring-lime-600 transition-all"
                    bind:value={new_user[meta_verifier[key]]}
                  />
                {:else if meta_verifier[key] === "password" && type === "password"}
                  <div class="relative">
                    <input
                      type="password"
                      id="field-{key}"
                      disabled={action === "edit"}
                      required
                      class="block w-full disabled:bg-gray-200 border valid:border-lime-500 outline-none border-gray-300 rounded-lg p-3 focus:ring-2 focus:ring-lime-600 transition-all"
                      bind:value={new_user[meta_verifier[key]]}
                    />
                    <div
                      class="flex items-center gap-2 mt-2 absolute right-2 top-0"
                    >
                      <input
                        type="checkbox"
                        id="show_password"
                        class="form-checkbox hidden"
                        bind:checked={show_password}
                      />
                      <label
                        for="show_password"
                        title="Hide password"
                        class="text-sm cursor-pointer text-slate-700 bg-slate-200 p-2 rounded-lg"
                      >
                        <MdiEye class="w-5 h-5" />
                      </label>
                    </div>
                  </div>
                {:else if meta_verifier[key] === "password" && type === "text"}
                  <div class="relative">
                    <input
                      type="text"
                      id="field-{key}"
                      disabled={action === "edit"}
                      required
                      class="block w-full disabled:bg-gray-200 border valid:border-lime-500 outline-none border-gray-300 rounded-lg p-3 focus:ring-2 focus:ring-lime-600 transition-all"
                      bind:value={new_user[meta_verifier[key]]}
                    />
                    <div
                      class="flex items-center gap-2 mt-2 absolute right-2 top-0"
                    >
                      <input
                        type="checkbox"
                        id="show_password"
                        class="form-checkbox hidden text-lime-600"
                        bind:checked={show_password}
                      />
                      <label
                        for="show_password"
                        title="Show password"
                        class="text-sm cursor-pointer text-slate-700 bg-slate-200 p-2 rounded-lg"
                      >
                        <MdiEyeOff class="w-5 h-5" />
                      </label>
                    </div>
                  </div>
                {:else}
                  <input
                    type="text"
                    id="field-{key}"
                    required
                    class="block w-full border valid:border-lime-500 outline-none border-gray-300 rounded-lg p-3 focus:ring-2 focus:ring-lime-600 transition-all"
                    bind:value={new_user[meta_verifier[key]]}
                  />
                {/if}
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
  </div>
{/if}

<style>
  input:disabled {
    cursor: not-allowed;
  }
  table,
  th,
  td {
    transition: all 0.3s;
  }
</style>
