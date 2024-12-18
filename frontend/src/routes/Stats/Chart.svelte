<script>
  import { Chart, registerables } from "chart.js";
  import { DateInput } from "date-picker-svelte";
  import { onMount } from "svelte";

  let chartCanvas;
  let start_date = new Date(new Date().setDate(new Date().getDate() - 7));
  let end_date = new Date();
  let runs = [];
  let runData = {}; // Object to store counts by date
  let chartLabels = [];
  let chartCounts = [];
  let chartInstance; // To store chart instance
  let selected_user;
  let loading = false;
  export let label = "Trasporti";
  export let borderColor = "#60A5FA";
  export let backgroundColor = "#60A5FA66";
  export let userList = [];
  export let isCar = false;
  export let isAveragePickup = false;
  export let isAverageLength = false;
  // Register the components required for the chart
  Chart.register(...registerables);

  // Helper function to format time in MM:SS or HH:MM:SS format
  function formatTime(s) {
    const seconds = Number(typeof s === "string" ? s.replace(",", "") : s);
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const remainingSeconds = Math.floor(seconds % 60);

    if (hours > 0) {
      return `${String(hours).padStart(2, "0")}:${String(minutes).padStart(2, "0")}:${String(remainingSeconds).padStart(2, "0")}`;
    } else {
      return `${String(minutes).padStart(2, "0")}:${String(remainingSeconds).padStart(2, "0")}`;
    }
  }

  function getDayName(dateString) {
    const date = new Date(chartLabels[dateString]);
    const weekday = date.toLocaleDateString("it-IT", { weekday: "long" });
    const capitalizedWeekday =
      weekday.charAt(0).toUpperCase() + weekday.slice(1);
    return date.toLocaleDateString("it-IT") + "\n" + capitalizedWeekday;
  }

  // Process data for average pickup times
  function processAveragePickup() {
    runData = {}; // Reset runData

    runs.forEach((run) => {
      let runDate = new Date(run.updated_at).toDateString();
      let ongoingTime = new Date(run.checkpoints.ongoing).getTime(); // Convert to Unix timestamp
      let pickedUpTime = new Date(run.checkpoints.picked_up).getTime(); // Convert to Unix timestamp
      let completedTime = new Date(run.checkpoints.completed).getTime(); // Convert to Unix timestamp
      if (!isNaN(ongoingTime) && !isNaN(pickedUpTime)) {
        let pickupDuration = Math.round((completedTime - pickedUpTime) / 1000); // Difference in seconds

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
      let avgTimeInSeconds = Math.round(total / count); // Calculate average in seconds
      return avgTimeInSeconds; // Format time to MM:SS
    });
  }

  function processAverageLength() {
    runData = {}; // Reset runData

    runs.forEach((run) => {
      let runDate = new Date(run.updated_at).toDateString();
      let ongoingTime = new Date(run.checkpoints.ongoing).getTime(); // Convert to Unix timestamp
      let pickedUpTime = new Date(run.checkpoints.picked_up).getTime(); // Convert to Unix timestamp
      let completedTime = new Date(run.checkpoints.completed).getTime(); // Convert to Unix timestamp
      if (!isNaN(ongoingTime) && !isNaN(pickedUpTime)) {
        let pickupDuration = run.programmed
          ? Math.round((completedTime - pickedUpTime) / 1000)
          : Math.round((completedTime - ongoingTime) / 1000); // Difference in seconds
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
      let avgTimeInSeconds = Math.round(total / count); // Calculate average in seconds
      return avgTimeInSeconds; // Format time to MM:SS
    });
  }

  // Prepare data
  function processData() {
    runData = {};
    runs.forEach((run) => {
      let runDate = new Date(run.updated_at).toDateString();
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
              pointBorderWidth: 4,
              borderWidth: 2,
              pointBackgroundColor: borderColor,
              fill: true,
            },
          ],
        },
        options: {
          responsive: true,
          plugins: {
            legend: {
              display: false,
            },
            tooltip: {
              callbacks: {
                label: (item) => {
                  return isAverageLength || isAveragePickup
                    ? ` ${label}: ${formatTime(item.formattedValue)}`
                    : ` ${label}: ${item.formattedValue}`;
                },
              },
            },
          },
          scales: {
            y: {
              beginAtZero: true,
              ticks: {
                callback: (value) => {
                  // Convert raw values back to MM:SS for y-axis labels
                  return isAverageLength || isAveragePickup
                    ? formatTime(value)
                    : value;
                },
              },
            },
            x: {
              ticks: {
                callback: function (value) {
                  return getDayName(value).split("\n"); // Return array for multiline
                },
              },
            },
          },
        },
      });
    }
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
          if (isAveragePickup) {
            processAveragePickup();
          } else if (isAverageLength) {
            processAverageLength();
          } else {
            processData();
          }
          setTimeout(() => {
            drawData();
          }, 100);
          loading = false;
        });
    }, 500);
  };
  const getRunsByDate = async () => {
    loading = true;
    fetch(
      import.meta.env.VITE_API_URL +
        `/api/runs?start_date=${start_date.toISOString().split("T")[0] || ""}&end_date=${end_date.toISOString().split("T")[0] || ""}&status=completed${!isCar ? "&user=" + selected_user : ""}${isCar ? "&car=" + selected_user : ""}`,
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
        if (isAveragePickup) {
          processAveragePickup();
        } else if (isAverageLength) {
          processAverageLength();
        } else {
          processData();
        }
        drawData();

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
      <div class="ml-auto flex gap-4 items-center">
        <p class="text-black font-bold">
          {!isCar ? "Autista" : "Mezzo"}
        </p>
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
        {#if isAveragePickup || isAverageLength}
          <p>
            {label}: {formatTime(
              chartCounts.reduce((total, num) => total + num, 0),
            )}
          </p>
        {:else}
          <p>
            {!isAverageLength && !isAveragePickup
              ? "Trasporti nel periodo selezionato"
              : label}: {chartCounts.reduce((total, num) => total + num, 0)}
          </p>
        {/if}
      </li>
    </ul>
    {#if !chartLabels.length}
      <p class="text-center text-gray-500 mt-4">Nessun dato disponibile</p>
    {/if}
  </div>
</div>
