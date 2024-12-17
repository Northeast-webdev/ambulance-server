<script>
  import { Chart, registerables } from "chart.js";
  import { DateInput } from "date-picker-svelte";
  import { onMount } from "svelte";

  let chartCanvas;
  let start_date = new Date(new Date().setDate(new Date().getDate() - 7));
  let end_date = new Date();
  let runs = [];
  let chartInstance; // To store chart instance
  let loading = false;
  export let label = "Giornaliera";
  let data = [];
  // Register the components required for the chart
  Chart.register(...registerables);

  // Sample data - you can replace this with your actual data

  let labels = data.map((item) => item.date);
  let cRuns = data.map((item) => item.C);
  let sRuns = data.map((item) => item.S);
  let bRuns = data.map((item) => item.B);

  function getDayName(dateString) {
    const date = new Date(labels[dateString]);
    const weekday = date.toLocaleDateString("it-IT", { weekday: "long" });
    const capitalizedWeekday =
      weekday.charAt(0).toUpperCase() + weekday.slice(1);
    return date.toLocaleDateString("it-IT") + "\n" + capitalizedWeekday;
  }

  const drawData = () => {
    if (chartCanvas) {
      if (chartInstance) {
        chartInstance.destroy(); // Clean up any previous chart instance
      }

      chartInstance = new Chart(chartCanvas, {
        type: "line",
        data: {
          labels: labels,
          datasets: [
            {
              label: "C",
              data: cRuns,
              borderColor: "rgba(255, 99, 132, 1)",
              borderWidth: 2,
              fill: false,
            },
            {
              label: "S",
              data: sRuns,
              borderColor: "rgba(54, 162, 235, 1)",
              borderWidth: 2,
              fill: false,
            },
            {
              label: "B",
              data: bRuns,
              borderColor: "rgba(75, 192, 192, 1)",
              borderWidth: 2,
              fill: false,
            },
          ],
        },
        options: {
          scales: {
            x: {
              ticks: {
                callback: function (value) {
                  return getDayName(value).split("\n"); // Return array for multiline
                },
              },
            },
            y: {
              beginAtZero: true,
            },
          },
        },
      });
    }
  };

  // Function to process data and organize it by csb type
  const processData = () => {
    const runsByDate = {};
    labels = [];
    cRuns = [];
    sRuns = [];
    bRuns = [];
    runs.forEach((run) => {
      let date = new Date(run.updated_at).toDateString();
      const csbType = run.meta.csb.toUpperCase(); // Uppercase to handle case insensitivity

      if (!runsByDate[date]) {
        runsByDate[date] = { C: 0, S: 0, B: 0, total: 0 };
      }

      runsByDate[date][csbType]++;
      runsByDate[date].total++;
    });

    for (let date in runsByDate) {
      labels.push(date);
      cRuns.push(runsByDate[date].C);
      sRuns.push(runsByDate[date].S);
      bRuns.push(runsByDate[date].B);
    }

    drawData();
  };

  const getRuns = async () => {
    loading = true;
    setTimeout(() => {
      fetch(
        import.meta.env.VITE_API_URL +
          `/api/runs?start_date=${start_date.toISOString().split("T")[0] || ""}&end_date=${end_date.toISOString().split("T")[0] || ""}&status=completed`,
        {
          method: "GET",
          headers: {
            Authorization: `Bearer ${localStorage.getItem("token")}`,
          },
        },
      )
        .then((response) => response.json())
        .then((data) => {
          runs = data.runs.sort(
            (a, b) =>
              new Date(a.updated_at).getTime() -
              new Date(b.updated_at).getTime(),
          );
        })
        .catch((error) => {
          console.error("Error:", error);
        })
        .finally(() => {
          console.log(runs);
          setTimeout(() => {
            processData();
          }, 100);
          loading = false;
        });
    }, 500);
  };
  const getRunsByDate = async () => {
    loading = true;
    fetch(
      import.meta.env.VITE_API_URL +
        `/api/runs?start_date=${start_date.toISOString().split("T")[0] || ""}&end_date=${end_date.toISOString().split("T")[0] || ""}&status=completed`,
      {
        method: "GET",
        headers: {
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
      },
    )
      .then((response) => response.json())
      .then((data) => {
        runs = data.runs.sort(
          (a, b) =>
            new Date(a.updated_at).getTime() - new Date(b.updated_at).getTime(),
        );
      })
      .catch((error) => {
        console.error("Error:", error);
      })
      .finally(() => {
        processData();
        loading = false;
      });
  };
  onMount(getRuns);
</script>

<div class="flex gap-[2.5%] items-start">
  <div class="flex-1 sticky top-28">
    <h2 class="text-xl text-gray-800 text-center font-bold">{label}</h2>
    <div class="mt-8 mb-4 flex items-center justify-between gap-4 mx-8">
      <div class="flex items-center gap-3">
        <p class="text-black font-bold">Dal</p>
        <DateInput
          bind:value={start_date}
          format="dd/MM/yyyy"
          class="stats"
          dynamicPositioning
        />
        <p class="text-black font-bold">Al</p>
        <DateInput
          bind:value={end_date}
          format="dd/MM/yyyy"
          class="stats"
          dynamicPositioning
        />
      </div>
      <button
        disabled={loading}
        on:click={getRunsByDate}
        class="{loading
          ? 'bg-gray-400'
          : 'bg-lime-600 hover:bg-lime-800'} text-white w-20 font-bold py-1 px-4 rounded-lg transition duration-200"
      >
        {loading ? "..." : "Cerca"}
      </button>
    </div>
    {#if loading}
      <p
        class="text-lg font-bold text-center h-80 flex justify-center items-center"
      >
        <span>Loading...</span>
      </p>
    {/if}
    <canvas class={loading ? "opacity-0" : ""} bind:this={chartCanvas}></canvas>
  </div>

  <div class="flex-1">
    <ul class="mt-8 space-y-4 px-8">
      <li class="bg-gray-100 p-4 rounded-lg shadow-sm">
        <p class="font-semibold">
          Periodo dal {start_date.toLocaleDateString("it-IT")} al {end_date.toLocaleDateString(
            "it-IT",
          )}
        </p>
        <p>C: {cRuns.reduce((total, num) => total + num, 0)}</p>
        <p>S: {sRuns.reduce((total, num) => total + num, 0)}</p>
        <p>B: {bRuns.reduce((total, num) => total + num, 0)}</p>
      </li>
    </ul>
    {#if !labels.length}
      <p class="text-center text-gray-500 mt-4">Nessun dato disponibile</p>
    {/if}
  </div>
</div>
