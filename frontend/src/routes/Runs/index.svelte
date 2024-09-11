<script>
    import { onMount } from "svelte";
    import { blur } from "svelte/transition";
    
    let runs = []
    let show_form = false
    let meta_verifier = {
    "Title": "title",
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
    let new_run = {
      "csb": "",
      "ora": "",
      "paziente": "",
      "servizio": "",
      "tel": "",
      "tipo_di_servizio": "",
      "partenza": "",
      "arrivo": "",
      "n_richiesta": "",
      "ricevuta": "",
      "viaggio": "",
      "title": "",
    }
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

    function newRunToggle() {
        show_form = !show_form
    }

    async function newRun() {
        try {
            const {title, ...meta} = new_run
            const response = await fetch("http://0.0.0.0:8080/runs", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${localStorage.getItem("token")}`,
                },
                body: JSON.stringify({meta, title }),
            });
            const data = await response.json();
            runs = [...runs, data.run]
            show_form = false
            new_run = {
                "csb": "",
                "ora": "",
                "paziente": "",
                "servizio": "",
                "tel": "",
                "tipo_di_servizio": "",
                "partenza": "",
                "arrivo": "",
                "n_richiesta": "",
                "ricevuta": "",
                "viaggio": "",
                "title": "",
            }
        } catch (error) {
            console.error("Error:", error);
        }
    }
</script>

<main>
  <div class="container font-mono mx-auto">
    <div class="flex justify-between items-center">
        <h1 class="text-2xl font-bold mt-10 mb-5">Runs</h1>
        <button on:click={newRunToggle} class="bg-green-600 hover:bg-green-800 transition text-white font-bold py-1 px-4 rounded flex items-center justify-center gap-4">
            <span class="text-3xl">+</span>
            <span>New Run</span>
        </button>
    </div>
  <div class="overflow-x-scroll">
		<table class="w-full border-collapse">
    <thead>
      <tr>
        {#each Object.keys(meta_verifier) as key}
          <th class="py-2 px-4 bg-gray-100 border text-left">{key}</th>
        {/each}
      </tr>
    </thead>
    {#each runs as run}
      <tr>
        {#each Object.keys(meta_verifier) as key}
				{#if key === "Title"}
					<td class="py-2 px-4 border"><a href="/runs/{run._id}">{run.title}</a></td>
				{:else}
          <td class="py-2 px-4 border">{run.meta[meta_verifier[key]]}</td>
				{/if}
        {/each}
      </tr>
    {/each}
  </table>
	</div>
  </div>
  {#if show_form}
    <div class="fixed inset-0" transition:blur={{amount: 10, duration: 600}}>
        <!-- svelte-ignore a11y-click-events-have-key-events -->
        <!-- svelte-ignore a11y-no-static-element-interactions -->
        <div class="fixed inset-0 bg-slate-900 bg-opacity-30 cursor-pointer z-10" on:click={newRunToggle} />
            <form on:submit|preventDefault={newRun} class="max-w-screen-lg max-h-[800px] overflow-y-scroll font-mono mx-auto bg-slate-50 p-10 z-20 relative rounded-xl top-16">
                <h2 class="text-3xl text-center font-bold mb-4">New Run</h2>
                <div class="flex flex-col gap-4">
                    {#each Object.keys(meta_verifier) as key}
                        <label class="flex flex-col gap-1">
                            <span>{key}</span>
                            <input type="text" class="border outline-none  border-gray-300 rounded p-2 focus:ring ring-offset-2 ring-offset-green-800 transition focus:ring-green-800 focus:ring-opacity-20" bind:value={new_run[meta_verifier[key]]} />
                        </label>
                    {/each}
                    <button type="submit" class="bg-green-700 transition-colors hover:bg-green-800 text-white font-bold py-3 px-4 rounded">Submit</button>
                </div>
            </form>
    </div>
  {/if}
</main>