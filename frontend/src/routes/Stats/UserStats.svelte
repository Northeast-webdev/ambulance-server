<script>
  import { DateInput } from "date-picker-svelte";
  import moment from "moment";
  import { onMount } from "svelte";
  import { useParams } from "svelte-navigator";
  import MdiAmbulance from "virtual:icons/mdi/ambulance";
  const params = useParams();
  let runs = [];
  let user = {};
  let cars = [];
  let cars_used = [];
  let run_car_count = [];
  let services = [
    { value: "Ordinario", text: "Ordinario" },
    { value: "Ospedaliero", text: "Ospedaliero" },
    { value: "Dialisi", text: "Dialisi" },
    { value: "Oblazione", text: "Oblazione" },
    { value: "Servizio navetta comune", text: "Servizio navetta comune" },
  ];
  let start_date = new Date(new Date().setDate(new Date().getDate() - 30));
  let end_date = new Date();

  let loading = false;
  const getRunsForUser = async () => {
    loading = true;
    fetch(
      import.meta.env.VITE_API_URL +
        `/api/runs?start_date=${start_date.toISOString().split("T")[0] || ""}&end_date=${end_date.toISOString().split("T")[0] || ""}&status=completed&user=${$params.id}`,
      {
        method: "GET",
        headers: {
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
      }
    )
      .then((response) => response.json())
      .then((data) => {
        runs = data.runs.sort(
          (a, b) =>
            new Date(a.updated_at).getTime() - new Date(b.updated_at).getTime()
        );
        cars_used = data.runs
          .map((run) => run.car)
          .concat(
            (user.alarms || []).map((alarm) =>
              cars.find((car) => car._id === alarm.car)
            )
          )
          .filter((car) => car !== null)
          .filter(
            (car, index, self) =>
              index === self.findIndex((t) => t._id === car._id)
          );
        run_car_count = cars_used.map((car) => {
          return {
            name: car.name,
            _id: car._id,
            count: runs
              .filter((run) => run.car !== null)
              .filter((run) => run.car?._id === car._id).length,
          };
        });
      })
      .catch((error) => {
        console.error("Error:", error);
      })
      .finally(() => {
        loading = false;
      });
  };

  const getUser = async () => {
    fetch(import.meta.env.VITE_API_URL + `/api/users/${$params.id}`, {
      method: "GET",
      headers: {
        Authorization: `Bearer ${localStorage.getItem("token")}`,
      },
    })
      .then((response) => response.json())
      .then((data) => {
        data.alarms = data.alarms.filter(
          (alarm) =>
            new Date(alarm.created_at) > start_date &&
            new Date(alarm.created_at) < end_date
        );
        user = data;
        console.log(data);
      })
      .catch((error) => {
        console.error("Error:", error);
      });

    fetch(import.meta.env.VITE_API_URL + `/api/cars`, {
      method: "GET",
      headers: {
        Authorization: `Bearer ${localStorage.getItem("token")}`,
      },
    })
      .then((response) => response.json())
      .then((data) => {
        cars = data.cars;
      });
  };

  const getRunsByDate = async () => {
    await getUser();
    setTimeout(() => {
      getRunsForUser();
    }, 1000);
  };
  onMount(getRunsByDate);
</script>

<div class="my-10 shadow-lg">
  <div class="container px-3 py-6 mx-auto">
    <div class="mb-10">
      <div class="flex items-center justify-center gap-3">
        <p class="text-lg font-bold text-black">Periodo dal</p>
        <DateInput
          bind:value={start_date}
          format="dd/MM/yyyy"
          class="stats"
          dynamicPositioning
        />
        <p class="text-lg font-bold text-black">Al</p>
        <DateInput
          bind:value={end_date}
          format="dd/MM/yyyy"
          class="stats"
          dynamicPositioning
        />

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
    </div>
    <div class="flex items-center justify-center gap-10">
      <div
        class="flex items-center justify-center p-10 text-gray-500 bg-gray-200 border-2 border-gray-300 rounded-full shadow-lg w-72 h-72"
      >
        <svg
          fill="currentColor"
          version="1.1"
          id="Layer_1"
          xmlns="http://www.w3.org/2000/svg"
          xmlns:xlink="http://www.w3.org/1999/xlink"
          viewBox="0 0 512 512"
          xml:space="preserve"
        >
          <g>
            <g>
              <circle cx="256" cy="114.526" r="114.526" />
            </g>
          </g>
          <g>
            <g>
              <path
                d="M256,256c-111.619,0-202.105,90.487-202.105,202.105c0,29.765,24.13,53.895,53.895,53.895h296.421    c29.765,0,53.895-24.13,53.895-53.895C458.105,346.487,367.619,256,256,256z"
              />
            </g>
          </g>
        </svg>
      </div>
      <div class="card">
        <h2 class="text-xl font-bold">
          {user.first_name}
          {user.last_name}
        </h2>
        <p class="text-sm font-semibold text-gray-700">
          {user.email}
        </p>
        <p class="text-sm font-semibold text-gray-700">
          {user.phone}
        </p>
        <p
          class="inline-block px-2 py-1 mt-4 text-base font-bold text-gray-900 bg-sky-300"
        >
          Mezzi utilizzati:
        </p>
        <div class="flex gap-4 mt-2">
          {#each cars_used as car}
            <div class="flex items-center gap-1">
              <MdiAmbulance class="w-6 h-6 text-gray-800" />
              <p class="font-bold text-gray-800">
                {car.name}
              </p>
            </div>
          {/each}
        </div>
        <p
          class="inline-block px-2 py-1 mt-6 text-base font-bold text-gray-900 bg-sky-300"
        >
          Totale trasporti effettuati
        </p>
        <div class="mt-2 space-y-2">
          {#each run_car_count as car}
            <div
              class="flex items-center justify-between w-full gap-1 max-w-48"
            >
              <p class="flex-1 font-bold text-gray-800">
                {car.name}
              </p>
              <MdiAmbulance class="w-6 h-6 text-gray-800" />
              <p class="flex-1 font-bold text-right text-gray-800">
                {car.count}
              </p>
            </div>
          {/each}
        </div>
      </div>
    </div>

    <h1 class="text-lg font-bold text-center my-14">
      Statistiche <br />
      Periodo dal {start_date.toLocaleDateString("it-IT")} al
      {end_date.toLocaleDateString("it-IT")}
    </h1>

    <h2 class="mb-8 text-lg font-bold">STATISTICHE TRASPORTI C/S/B</h2>
    <!-- Table Container with Overflow for Responsiveness -->
    <div class="grid w-full grid-cols-3 gap-4">
      {#each run_car_count as car}
        <table
          class="flex-1 overflow-hidden border-collapse rounded-lg shadow-lg"
        >
          <thead class="bg-sky-300">
            <tr>
              <th
                class="px-4 py-3 font-semibold text-left border-b"
                colspan="3"
              >
                <div class="flex items-center justify-center gap-2">
                  <MdiAmbulance class="w-6 h-6 text-gray-800" />
                  {car.name}
                </div>
              </th>
            </tr>
          </thead>
          <tbody>
            <tr class="text-center border-b">
              <td class="px-4 py-3 font-bold border-r">C</td>
              <td class="px-4 py-3 font-bold border-r">S</td>
              <td class="px-4 py-3 font-bold border-r">B</td>
            </tr>
            <tr class="text-center border-b">
              <td class="px-4 py-3 border-r">
                {runs
                  .filter((run) => run.meta.csb === "c")
                  .filter((run) => run.car?.name === car.name).length}
              </td>
              <td class="px-4 py-3 border-r">
                {runs
                  .filter((run) => run.meta.csb === "s")
                  .filter((run) => run.car?.name === car.name).length}
              </td>
              <td class="px-4 py-3 border-r">
                {runs
                  .filter((run) => run.meta.csb === "b")
                  .filter((run) => run.car?.name === car.name).length}
              </td>
            </tr>
          </tbody>
        </table>
      {/each}
    </div>
    <div class="my-20" />
    <h2 class="mb-8 text-lg font-bold">STATISTICHE TIPO DI SERVIZIO</h2>
    <!-- Table Container with Overflow for Responsiveness -->
    <div class="grid w-full grid-cols-2 gap-4">
      {#each run_car_count as car}
        <table
          class="flex-1 overflow-hidden border-collapse rounded-lg shadow-lg"
        >
          <thead class="bg-sky-300">
            <tr>
              <th
                class="px-4 py-3 font-semibold text-left border-b"
                colspan={services.length}
              >
                <div class="flex items-center justify-center gap-2">
                  <MdiAmbulance class="w-6 h-6 text-gray-800" />
                  {car.name}
                </div>
              </th>
            </tr>
          </thead>
          <tbody>
            <tr class="text-center border-b">
              {#each services as service}
                <td class="px-4 py-3 font-bold border-r">
                  {service.text}
                </td>
              {/each}
            </tr>
            <tr class="text-center border-b">
              {#each services as service}
                <td class="px-4 py-3 border-r">
                  {runs
                    .filter((run) => run.meta.servizio === service.value)
                    .filter((run) => run.car?.name === car.name).length}
                </td>
              {/each}
            </tr>
          </tbody>
        </table>
      {/each}
    </div>
    <div class="my-20" />
    <h2 class="mb-8 text-lg font-bold">WARNINGS RICEVUTI CHECKLIST MEZZO</h2>
    <!-- Table Container with Overflow for Responsiveness -->
    <div class="grid w-full grid-cols-2 gap-4">
      {#each run_car_count as car}
        <table
          class="flex-1 overflow-hidden border-collapse rounded-lg shadow-lg"
        >
          <thead class="bg-sky-300">
            <tr>
              <th
                class="px-4 py-3 font-semibold text-left border-b"
                colspan={2}
              >
                <div class="flex items-center justify-center gap-2">
                  <MdiAmbulance class="w-6 h-6 text-gray-800" />
                  {car.name}
                </div>
              </th>
            </tr>
          </thead>
          <tbody>
            <tr class="text-center border-b">
              <td class="px-4 py-3 font-bold border-r">Data</td>
              <td class="px-4 py-3 font-bold border-r">Ora</td>
            </tr>
            {#if user.alarms}
              {#each user.alarms.filter((alarm) => alarm.car === car._id && !alarm.car_checklist_done) as alarm}
                <tr class="text-center border-b">
                  <td class="px-4 py-3 border-r">
                    {moment(alarm.created_at).format("DD/MM/YYYY")}
                  </td>
                  <td class="px-4 py-3 border-r">
                    {moment(alarm.created_at).format("HH:mm")}
                  </td>
                </tr>
              {/each}
            {/if}
          </tbody>
        </table>
      {/each}
    </div>

    <div class="my-20" />
    <h2 class="mb-8 text-lg font-bold">
      WARNINGS RICEVUTI CHECKLIST MATERIALI
    </h2>
    <!-- Table Container with Overflow for Responsiveness -->
    <div class="grid w-full grid-cols-2 gap-4">
      {#each run_car_count as car}
        <table
          class="flex-1 overflow-hidden border-collapse rounded-lg shadow-lg"
        >
          <thead class="bg-sky-300">
            <tr>
              <th
                class="px-4 py-3 font-semibold text-left border-b"
                colspan={2}
              >
                <div class="flex items-center justify-center gap-2">
                  <MdiAmbulance class="w-6 h-6 text-gray-800" />
                  {car.name}
                </div>
              </th>
            </tr>
          </thead>
          <tbody>
            <tr class="text-center border-b">
              <td class="px-4 py-3 font-bold border-r">Data</td>
              <td class="px-4 py-3 font-bold border-r">Ora</td>
            </tr>
            {#if user.alarms}
              {#each user.alarms.filter((alarm) => alarm.car === car._id && !alarm.material_checklist_done) as alarm}
                <tr class="text-center border-b">
                  <td class="px-4 py-3 border-r">
                    {moment(alarm.created_at).format("DD/MM/YYYY")}
                  </td>
                  <td class="px-4 py-3 border-r">
                    {moment(alarm.created_at).format("HH:mm")}
                  </td>
                </tr>
              {/each}
            {/if}
          </tbody>
        </table>
      {/each}
    </div>
  </div>
</div>
