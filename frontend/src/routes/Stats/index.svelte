<script>
  import { onMount } from "svelte";
  import Chart from "./Chart.svelte";
  import ChartRuns from "./ChartRuns.svelte";
  import ChartRunsServizio from "./ChartRunsServizio.svelte";
  import moment from "moment";
  import { fly } from "svelte/transition";
  import { navigate } from "svelte-navigator";

  let users = [];
  let cars = [];
  let runs = [];
  let type = "users";

  let userStats = [];
  const getUserStats = async () => {
    console.log(type);
    type = "userStats";
    fetch(import.meta.env.VITE_API_URL + "/api/users?limit=50&type=driver", {
      method: "GET",
      headers: {
        Authorization: `Bearer ${localStorage.getItem("token")}`,
      },
    })
      .then((response) => response.json())
      .then((data) => {
        userStats = data.users;
      })
      .catch((error) => {
        console.error("Error:", error);
      });
  };
  const getData = async (/** @type {string} */ t) => {
    type = t || type;
    if (type === "users") {
      fetch(import.meta.env.VITE_API_URL + "/api/users?limit=50&type=driver", {
        method: "GET",
        headers: {
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
      })
        .then((response) => response.json())
        .then((data) => {
          users = data.users;
        })
        .catch((error) => {
          console.error("Error:", error);
        });
    }
    if (type === "cars") {
      fetch(import.meta.env.VITE_API_URL + "/api/cars?limit=50", {
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
        });
    }
    if (type === "runs") {
      fetch(import.meta.env.VITE_API_URL + "/api/runs?limit=50", {
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
    }
  };

  onMount(getData);
</script>

<div class="mb-6 shadow-lg">
  <div class="container flex gap-4 p-4 mx-auto">
    <button
      class="{type === 'users'
        ? 'bg-emerald-200  text-emerald-700'
        : 'bg-gray-100 text-gray-400'} transition font-bold py-2 px-6 rounded-lg"
      on:click={() => getData("users")}
    >
      <span>Utenti</span>
    </button>
    <button
      class="{type === 'cars'
        ? 'bg-emerald-200  text-emerald-700'
        : 'bg-gray-100 text-gray-400'} transition font-bold py-2 px-6 rounded-lg"
      on:click={() => getData("cars")}
    >
      <span>Mezzi</span>
    </button>
    <button
      class="{type === 'runs'
        ? 'bg-emerald-200  text-emerald-700'
        : 'bg-gray-100 text-gray-400'} transition font-bold py-2 px-6 rounded-lg"
      on:click={() => getData("runs")}
    >
      <span>Trasporti</span>
    </button>
    <button
      class="{type === 'userStats'
        ? 'bg-emerald-200  text-emerald-700'
        : 'bg-gray-100 text-gray-400'} transition font-bold py-2 px-6 rounded-lg"
      on:click={() => getUserStats()}
    >
      <span>Performance autisti</span>
    </button>
  </div>
</div>
<div class="container px-3 py-6 mx-auto">
  <div class="flex items-center justify-between mb-6">
    <h1 class="text-3xl font-bold">Statistiche</h1>
  </div>

  <!-- Chart Container -->
  {#if type === "users"}
    <div class="">
      <div class="w-full">
        <Chart userList={users} label="Numero di trasporti" />
      </div>
      <div class="w-full mt-10">
        <Chart
          backgroundColor="#34792866"
          borderColor="#347928"
          userList={users}
          isAverageLength
          label="Durata media del trasporto"
        />
      </div>
      <div class="w-full mt-10">
        <Chart
          backgroundColor="#FCCD2A66"
          borderColor="#FCCD2A"
          userList={users}
          isAveragePickup
          label="Durata media del ritiro"
        />
      </div>
    </div>
  {/if}
  {#if type === "runs"}
    <div class="w-full mt-5">
      <ChartRuns label="C/S/B" />
    </div>
    <div class="w-full mt-10">
      <ChartRunsServizio label="Servizio" />
    </div>
  {/if}
  {#if type === "cars"}
    <div class="">
      <div class="w-full">
        <Chart isCar userList={cars} label="Numero di trasporti" />
      </div>
      <div class="w-full mt-10">
        <Chart
          backgroundColor="#34792866"
          borderColor="#347928"
          isCar
          userList={cars}
          isAverageLength
          label="Durata media del trasporto"
        />
      </div>
      <div class="w-full mt-10">
        <Chart
          backgroundColor="#FCCD2A66"
          borderColor="#FCCD2A"
          isCar
          userList={cars}
          isAveragePickup
          label="Durata media del ritiro"
        />
      </div>
    </div>
  {/if}
  {#if type === "userStats"}
    <!-- Table Container with Overflow for Responsiveness -->
    <div class="overflow-x-auto">
      <table
        class="min-w-full overflow-hidden border-collapse rounded-lg shadow-lg"
      >
        <thead class="bg-gradient-to-l from-gray-200 to-gray-300">
          <tr>
            <th class="px-4 py-3 font-semibold text-left text-gray-700 border-b"
              >Nome</th
            >
            <th class="px-4 py-3 font-semibold text-left text-gray-700 border-b"
              >Cognome</th
            >
            <th class="px-4 py-3 font-semibold text-left text-gray-700 border-b"
              >Email</th
            >
            <th
              transition:fly={{
                x: 100,
                duration: 300,
              }}
              class="px-4 py-3 font-semibold text-left text-gray-700 border-b"
              >Mezzo</th
            >
            <th class="px-4 py-3 font-semibold text-left text-gray-700 border-b"
              >Data di Creazione</th
            >
            <th
              class="px-4 py-3 font-semibold text-center text-gray-700 border-b"
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
              <td class="px-4 py-3 border-r">{user.first_name}</td>
              <td class="px-4 py-3 border-r">{user.last_name}</td>
              <td class="px-4 py-3 border-r">{user.email}</td>
              {#if user.car}
                <td class="px-4 py-3 border-r">
                  <span class="font-bold"> {user.car.name}</span>
                </td>
              {:else}
                <td class="px-4 py-3 border-r">
                  <span class="text-gray-500">-</span>
                </td>
              {/if}
              <td class="px-4 py-3 border-r"
                >{moment(user.created_at).format("DD/MM/YYYY HH:MM")}</td
              >
              <td class="px-4 py-3 border-r">
                <button
                  on:click={() => {
                    navigate(`/stats/user/${user._id}`);
                  }}
                  class="px-6 py-2 font-bold rounded-lg bg-emerald-200 text-emerald-700"
                  >Visualizza</button
                >
                <button
                  class="px-6 py-2 font-bold rounded-lg bg-sky-200 text-sky-700"
                  >Scarica PDF</button
                >
              </td>
            </tr>
          {/each}
        </tbody>
      </table>
    </div>
  {/if}
</div>
