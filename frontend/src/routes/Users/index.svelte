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
  import { user as storeUser, supabase, user } from "../../stores";
  let show_password = false;
  $: type = show_password ? "text" : "password";
  let loading = false;
  let users = [];
  let cars = [];
  let show_form = false;
  let action = "new";
  let user_id = "";
  let userType = "ADMIN";
  let meta_verifier = {
    Mezzo: "car",
    Email: "email",
    Username: "username",
    Password: "password",
    Nome: "first_name",
    Cognome: "last_name",
    Telefono: "phone",
  };
  let new_user = {
    username: "",
    password: "",
    email: "",
    first_name: "",
    last_name: "",
    phone: "",
    car_id: null,
  };
  const addNewLabels = {
    ADMIN: "amministratore",
    DRIVER: "autista",
    OPERATOR: "coordinatore",
    MAP: "mappatore",
    MANAGER: "direzione",
    MECHANIC: "meccanico",
  };
  const availableLabels = {
    ADMIN: "amministratori",
    DRIVER: "autisti",
    OPERATOR: "coordinatori",
    MAP: "mappatore",
    MANAGER: "direzione",
    MECHANIC: "meccanico",
  };

  onMount(() => {
    if ($user.role !== "ADMIN") {
      return;
    }
    loading = true;
    getUsers(userType);
    getCars();
    loading = false;
  });

  async function getCars() {
    const { data, error } = await supabase.from("cars").select();
    cars = data;
  }

  function newUserToggle() {
    show_form = !show_form;
    action = "new";
  }

  async function deleteCar(id) {
    const confirm = window.confirm(
      "Sei sicuro di voler eliminare questo utente?"
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
      await getUsers(userType);
    } catch (error) {
      console.error("Error:", error);
    }
  }

  async function newUser() {
    const { password, ...usr } = new_user;
    if (action === "new") {
      try {
        const { data, error: signUpErr } = await supabase.auth.signUp({
          email: usr.email,
          password: password,
        });
        if (signUpErr) {
          console.log(signUpErr);
          return;
        }
        const { error } = await supabase
          .from("users")
          .insert({ ...usr, role: userType });
        if (error) {
          console.log(error);
          return;
        }
        await getUsers(userType);
        new_user = {
          username: "",
          password: "",
          email: "",
          first_name: "",
          last_name: "",
          phone: "",
          car_id: null,
        };
        show_form = false;
      } catch (error) {
        console.error("Error:", error);
      }
    } else {
      try {
        const { error } = await supabase
          .from("users")
          .update({ ...new_user })
          .eq("id", user_id);
        if (error) {
          console.log(error);
          return;
        }
        await getUsers(userType);
        new_user = {
          username: "",
          password: "",
          email: "",
          first_name: "",
          last_name: "",
          phone: "",
          car_id: null,
        };
        show_form = false;
      } catch (error) {
        console.error("Error:", error);
      }
    }
  }

  async function getUsers(type) {
    userType = type;
    const { data, error } = await supabase
      .from("users")
      .select()
      .eq("role", type);
    users = data;
  }
</script>

{#if loading}
  <LoadingList />
{:else if $user.role !== "ADMIN"}
  <div class="flex justify-center items-center flex-col fixed inset-0 z-10">
    <h1 class="text-3xl font-bold">Accesso Negato</h1>
    <p class="text-gray-500">
      Non hai i permessi necessari per visualizzare questa pagina.
    </p>
  </div>
{:else}
  <!-- Submenu buttons -->
  <div class=" mb-6 shadow-lg">
    <div class="container mx-auto p-4 flex gap-4">
      <button
        class="{userType === 'ADMIN'
          ? 'bg-emerald-200  text-emerald-700'
          : 'bg-gray-100 text-gray-400'} transition font-bold py-2 px-6 rounded-lg"
        on:click={() => getUsers("ADMIN")}
      >
        <span>Amministratore</span>
      </button>
      <button
        class="{userType === 'DRIVER'
          ? 'bg-emerald-200 text-emerald-700'
          : 'bg-gray-100 text-gray-400'} transition font-bold py-2 px-6 rounded-lg"
        on:click={() => getUsers("DRIVER")}
      >
        <span>Autisti</span>
      </button>
      <button
        class="{userType === 'OPERATOR'
          ? 'bg-emerald-200  text-emerald-700'
          : 'bg-gray-100 text-gray-400'} transition font-bold py-2 px-6 rounded-lg"
        on:click={() => getUsers("OPERATOR")}
      >
        <span>Coordinatore</span>
      </button>
      <button
        class="{userType === 'MAP'
          ? 'bg-emerald-200  text-emerald-700'
          : 'bg-gray-100 text-gray-400'} transition font-bold py-2 px-6 rounded-lg"
        on:click={() => getUsers("MAP")}
      >
        <span>Mappatore</span>
      </button>
      <button
        class="{userType === 'MECHANIC'
          ? 'bg-emerald-200  text-emerald-700'
          : 'bg-gray-100 text-gray-400'} transition font-bold py-2 px-6 rounded-lg"
        on:click={() => getUsers("MECHANIC")}
      >
        <span>Meccanico</span>
      </button>
      <button
        class="{userType === 'MANAGER'
          ? 'bg-emerald-200  text-emerald-700'
          : 'bg-gray-100 text-gray-400'} transition font-bold py-2 px-6 rounded-lg"
        on:click={() => getUsers("MANAGER")}
      >
        <span>Direzione</span>
      </button>
    </div>
  </div>
  <div class="container mx-auto py-6 px-3">
    <div class="flex justify-between items-center mb-6">
      <div>
        <h1 class="text-3xl font-bold">
          Lista {userType === "DRIVER" || userType === "ADMIN"
            ? "degli"
            : "dei"}
          {availableLabels[userType]}
        </h1>
        <p class="text-gray-500">
          {users.filter((x) => x.online).length}
          {availableLabels[userType]}
          disponibili
        </p>
      </div>
      <button
        on:click={newUserToggle}
        class="bg-green-600 hover:bg-green-800 transition text-white font-bold py-2 px-6 rounded-lg flex items-center justify-center gap-2 shadow-md"
      >
        <span class="text-2xl">+</span>
        <span
          >Aggiungi {userType === "DRIVER"
            ? "autista"
            : userType === "ADMIN"
              ? "amministratore"
              : addNewLabels[userType]}</span
        >
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
            ></th>
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
              <td class="py-3 border-r">
                <div
                  class="w-4 h-4 rounded-full mx-auto {user.online
                    ? 'bg-green-400'
                    : 'bg-red-400'}"
                ></div>
              </td>
              <td class="py-3 px-4 border-r">{user.first_name}</td>
              <td class="py-3 px-4 border-r">{user.last_name}</td>
              <td class="py-3 px-4 border-r">{user.email}</td>
              {#if userType === "driver"}
                <td class="py-3 px-4 border-r">
                  {#if user.car}
                    <span class="font-bold"> {user.car.name}</span>
                  {:else}
                    <span class="text-gray-500">-</span>
                  {/if}
                </td>
                <td class="py-3 px-4 border-r">
                  {#if user.driver_status === "free"}
                    <span
                      class="text-green-900 bg-green-300 px-4 py-1 rounded-full inline-block"
                      >Disponibile</span
                    >
                  {:else}
                    <span
                      class="text-red-900 bg-red-200 px-4 py-1 rounded-full inline-block"
                      >Non disponibile</span
                    >
                  {/if}
                </td>
              {/if}
              <td class="py-3 px-4 border-r"
                >{moment(user.created_at).format("DD/MM/YYYY HH:MM")}</td
              >
              <td class="py-3 px-4 border-r flex justify-center gap-3">
                {#if user.id !== $storeUser.id}
                  <button
                    on:click={() => {
                      console.log("user: ", user);
                      action = "edit";
                      user_id = user.id;
                      new_user = {
                        username: user.username,
                        password: "",
                        email: user.email,
                        first_name: user.first_name,
                        last_name: user.last_name,
                        phone: user.phone,
                        car_id: user.car_id || "",
                      };
                      show_form = true;
                    }}
                    class="border-amber-600 border hover:bg-amber-600 text-amber-600 hover:text-amber-100 font-bold py-2 px-4 rounded-lg transition duration-200"
                  >
                    <MdiPencil class="w-4 h-4 inline" />
                    <span>Modifica</span>
                  </button>
                  <button
                    on:click={deleteCar(user.id)}
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
            phone: "",
            car_id: null,
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
                    <option value={car.id}>{car.name}</option>
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
