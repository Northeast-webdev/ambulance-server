<script>
  import { onMount } from "svelte";
  import Chart from "./Chart.svelte";

  let users = [];
  let cars = [];

  onMount(async () => {
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
  });
</script>

<div class="container mx-auto py-6 px-3">
  <div class="flex justify-between items-center mb-6">
    <h1 class="text-3xl font-bold">Statistics</h1>
  </div>

  <!-- Chart Container -->
  <div class="flex justify-center items-center gap-14 mb-10">
    <div class="flex-1">
      <Chart userList={users} label="Trasporti al giorno" />
    </div>
    <div class="flex-1">
      <Chart
        backgroundColor="#52225866"
        borderColor="#522258"
        label="Trasporti al giorno (mezzi)"
        userList={cars}
        isCar
      />
    </div>
  </div>
  <div class="flex justify-center items-center gap-14">
    <div class="flex-1">
      <Chart
        backgroundColor="#34792866"
        borderColor="#347928"
        userList={users}
        isAverageLength
        label="Durata media del trasporto"
      />
    </div>
    <div class="flex-1">
      <Chart
        backgroundColor="#FCCD2A66"
        borderColor="#FCCD2A"
        userList={users}
        isAveragePickup
        label="Durata media del ritiro"
      />
    </div>
  </div>
</div>
