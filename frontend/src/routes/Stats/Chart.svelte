<script>
  import { Chart, registerables } from "chart.js";
  import { DateInput } from "date-picker-svelte";
  import { onMount } from "svelte";

  let chartCanvas;
  let date = new Date();
  let runs = [];
  let runData = {}; // Object to store counts by date
  let chartLabels = [];
  let chartCounts = [];
  let chartInstance; // To store chart instance
  let selected_user;
  export let label = "Trasporti";
  export let borderColor = "#60A5FA";
  export let backgroundColor = "#60A5FA33";
  export let userList = [];
  export let isCar = false;
  export let isAveragePickup = false;
  export let isAverageLength = false;
  // Register the components required for the chart
  Chart.register(...registerables);

  // Helper function to format time in MM:SS format
  function formatTime(seconds) {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = Math.floor(seconds % 60);
    return `${String(minutes).padStart(2, "0")}:${String(remainingSeconds).padStart(2, "0")}`;
  }

  // Process data for average pickup times
  function processAveragePickup() {
    runData = {}; // Reset runData

    runs.forEach((run) => {
      let runDate = new Date(run.meta.date).toLocaleDateString("it-IT");
      let ongoingTime = new Date(run.checkpoints.ongoing).getTime(); // Convert to Unix timestamp
      let pickedUpTime = new Date(run.checkpoints.picked_up).getTime(); // Convert to Unix timestamp

      if (!isNaN(ongoingTime) && !isNaN(pickedUpTime)) {
        let pickupDuration = (pickedUpTime - ongoingTime) / 1000; // Difference in seconds

        if (!runData[runDate]) {
          runData[runDate] = { total: 0, count: 0 }; // Initialize
        }

        runData[runDate].total += pickupDuration;
        runData[runDate].count += 1;
      }
    });

    // Calculate average pickup time and populate labels and times
    chartLabels = Object.keys(runData);
    chartCounts = chartLabels.map((label) => {
      let { total, count } = runData[label];
      let avgTimeInSeconds = total / count; // Calculate average in seconds
      return formatTime(avgTimeInSeconds); // Format time to MM:SS
    });
  }

  function processAverageLength() {
    runData = {}; // Reset runData

    runs.forEach((run) => {
      let runDate = new Date(run.meta.date).toLocaleDateString("it-IT");
      let ongoingTime = new Date(run.checkpoints.ongoing).getTime(); // Convert to Unix timestamp
      let pickedUpTime = new Date(run.checkpoints.completed).getTime(); // Convert to Unix timestamp

      if (!isNaN(ongoingTime) && !isNaN(pickedUpTime)) {
        let pickupDuration = (pickedUpTime - ongoingTime) / 1000; // Difference in seconds

        if (!runData[runDate]) {
          runData[runDate] = { total: 0, count: 0 }; // Initialize
        }

        runData[runDate].total += pickupDuration;
        runData[runDate].count += 1;
      }
    });

    // Calculate average pickup time and populate labels and times
    chartLabels = Object.keys(runData);
    chartCounts = chartLabels.map((label) => {
      let { total, count } = runData[label];
      let avgTimeInSeconds = total / count; // Calculate average in seconds
      return formatTime(avgTimeInSeconds); // Format time to MM:SS
    });
  }

  // Prepare data
  function processData() {
    runData = {};
    runs.forEach((run) => {
      let runDate = new Date(run.meta.date).toLocaleDateString("it-IT");
      runData[runDate] = (runData[runDate] || 0) + 1; // Count occurrences of each date
    });

    // Extract labels and counts
    chartLabels = Object.keys(runData);
    chartCounts = Object.values(runData);
  }
  const drawData = () => {
    if (chartCanvas) {
      if (chartInstance) {
        chartInstance.destroy(); // Clean up any previous chart instance
      }

      chartInstance = new Chart(chartCanvas, {
        type: "line",
        data: {
          labels: chartLabels,
          datasets: [
            {
              label: label,
              data: chartCounts,
              borderColor: borderColor,
              backgroundColor: backgroundColor,
              fill: true,
            },
          ],
        },
        options: {
          responsive: true,
          scales: {
            y: {
              beginAtZero: true,
              ticks: {
                callback: function (value) {
                  // Convert raw values back to MM:SS for y-axis labels
                  return isAverageLength || isAveragePickup
                    ? formatTime(value)
                    : value;
                },
              },
            },
          },
        },
      });
    }
  };
  const getRuns = async () => {
    // get query params and set initial variables to url params
    const urlParams = new URLSearchParams(window.location.search);
    const dateParam = urlParams.get("date");
    if (dateParam) {
      date = new Date(dateParam);
    }
    fetch(
      import.meta.env.VITE_API_URL +
        `/api/runs?updated_date=${dateParam || ""}&status=completed`,
      {
        method: "GET",
        headers: {
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
      }
    )
      .then((response) => response.json())
      .then((data) => {
        runs = data.runs;
      })
      .catch((error) => {
        console.error("Error:", error);
      })
      .finally(() => {
        if (isAveragePickup) {
          processAveragePickup();
        } else if (isAverageLength) {
          processAverageLength();
        } else {
          processData();
        }
        drawData();
      });
  };
  const getRunsByDate = async () => {
    fetch(
      import.meta.env.VITE_API_URL +
        `/api/runs?date=${date.toISOString().split("T")[0] || ""}&status=completed&user=${selected_user || ""}&car=${isCar ? selected_user : ""}`,
      {
        method: "GET",
        headers: {
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
      }
    )
      .then((response) => response.json())
      .then((data) => {
        runs = data.runs;
      })
      .catch((error) => {
        console.error("Error:", error);
      })
      .finally(() => {
        if (isAveragePickup) {
          processAveragePickup();
        } else if (isAverageLength) {
          processAverageLength();
        } else {
          processData();
        }
        drawData();
      });
  };
  onMount(async () => {
    await getRuns();
  });
</script>

<div>
  <div class="mt-8 mb-4 flex items-center justify-between gap-4 mx-8">
    <div class="flex items-center gap-4">
      <DateInput bind:value={date} format="dd/MM/yyyy" class="stats" />
      <select
        class="font-bold text-green-700 border-green-700 border rounded-lg py-1 px-4 bg-white w-32"
        bind:value={selected_user}
      >
        <option value="">Tutti</option>
        {#each userList as user}
          <option value={user._id}
            >{isCar
              ? user.name
              : user.first_name + " " + user.last_name}</option
          >
        {/each}
      </select>
    </div>
    <button
      on:click={getRunsByDate}
      class="bg-lime-600 hover:bg-lime-800 text-white font-bold py-1 px-4 rounded-lg transition duration-200"
    >
      Scegli
    </button>
  </div>
  <canvas bind:this={chartCanvas}></canvas>
</div>
