<script>
  import { onMount } from "svelte";
  import Chart from "./Chart.svelte";
  import ChartRuns from "./ChartRuns.svelte";

  let users = [];
  let cars = [];
  let runs = [];
  let type = "users";

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

<div class=" mb-6 shadow-lg">
  <div class="container mx-auto p-4 flex gap-4">
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
  </div>
</div>
<div class="container mx-auto py-6 px-3">
  <div class="flex justify-between items-center mb-6">
    <h1 class="text-3xl font-bold">Statistiche</h1>
  </div>

  <!-- Chart Container -->
  {#if type === "users"}
    <div class="">
      <div class="w-full">
        <Chart userList={users} label="Trasporti al giorno" />
      </div>
      <div class="w-full mt-5">
        <Chart
          backgroundColor="#34792866"
          borderColor="#347928"
          userList={users}
          isAverageLength
          label="Durata media del trasporto"
        />
      </div>
      <div class="w-full mt-5">
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
  {/if}
  {#if type === "cars"}
    <div class="">
      <div class="w-full">
        <Chart isCar userList={cars} label="Trasporti al giorno" />
      </div>
      <div class="w-full mt-5">
        <Chart
          backgroundColor="#34792866"
          borderColor="#347928"
          isCar
          userList={cars}
          isAverageLength
          label="Durata media del trasporto"
        />
      </div>
      <div class="w-full mt-5">
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
</div>
