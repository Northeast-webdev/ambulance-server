<script>
    import { onMount } from "svelte";
    import { Link } from "svelte-navigator";
    
    let runs = []

    let meta_verifier = {
      "C/S/B": "csb",
      "Ora": "ora",
      "Paziente": "paziente",
      "Servizio": "servizio",
      "Tel": "tel",
      "Tipo di servizio": "tipo_di_servizio",
      "Partenza": "partenza",
      "Arrivo": "arrivo",
      "N. Richiesta": "n_richiesta",
      "Ricevuta": "ricevuta",
      "Viaggio": "viaggio",
    };
    onMount(async () => {
			fetch('http://0.0.0.0:8080/runs', {
					method: 'GET',
					headers: {
						Authorization: `Bearer ${localStorage.getItem("token")}`,
					},
			})
			.then(response => response.json())
			.then(data => {
				runs = data.runs
				})
			.catch(error => {
				console.error('Error:', error)
			})
    });
</script>

<main>
  <div class="container font-mono mx-auto">
    <div class="flex justify-between items-center">
        <h1 class="text-2xl font-bold mt-10 mb-5">Runs</h1>
        <button class="bg-green-600 hover:bg-green-800 text-white font-bold py-1 px-4 rounded flex items-center justify-center gap-4">
            <span class="text-3xl">+</span>
            <Link to="#">New Run</Link>
        </button>
    </div>
  <table class="w-full border-collapse">
    <thead>
      <tr>
        <th class="py-2 px-4 bg-gray-100 border text-left">ID</th>
        <th class="py-2 px-4 bg-gray-100 border text-left">Title</th>
        <th class="py-2 px-4 bg-gray-100 border text-left">Car</th>
        <th class="py-2 px-4 bg-gray-100 border text-left">Status</th>
        <th class="py-2 px-4 bg-gray-100 border text-left">Date</th>
        {#each Object.keys(meta_verifier) as key}
          <th class="py-2 px-4 bg-gray-100 border text-left">{key}</th>
        {/each}
      </tr>
    </thead>
    {#each runs as run}
      <tr>
        <td class="py-2 px-4 border">{run._id}</td>
        <td class="py-2 px-4 border">{run.title}</td>
        <td class="py-2 px-4 border">
          {#if run.car}
            <Link to={`/cars/${run.car._id}`}>See Car</Link>
          {:else}
            No car
          {/if}
        </td>
        <td class="py-2 px-4 border">
          {#if run.status === "done"}
            <span class="text-green-900 bg-green-400 px-4 py-1 rounded-full inline-block">Done</span>
          {:else if run.status === "in_progress"}
            <span class="text-orange-900 bg-orange-400 px-4 py-1 rounded-full inline-block">Ongoing</span>
          {:else}
            <span class="text-red-900 bg-red-400 px-4 py-1 rounded-full inline-block">Aborted</span>
          {/if}
        </td>
        <td class="py-2 px-4 border">{run.created_at}</td>
      </tr>
    {/each}
  </table>
  </div>
</main>