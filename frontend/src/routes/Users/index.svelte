<script>
    import { onMount } from "svelte";
    import { Link } from "svelte-navigator";
    
    let users = []
    onMount(async () => {
			fetch('http://0.0.0.0:8080/users', {
					method: 'GET',
					headers: {
						Authorization: `Bearer ${localStorage.getItem("token")}`,
					},
			})
			.then(response => response.json())
			.then(data => {
				users = data.users
				})
			.catch(error => {
				console.error('Error:', error)
			})
    });
</script>

<main>
  <div class="container font-mono mx-auto">
    <div class="flex justify-between items-center">
        <h1 class="text-2xl font-bold mt-10 mb-5">Users</h1>
        <button class="bg-green-600 hover:bg-green-800 transition text-white font-bold py-1 px-4 rounded flex items-center justify-center gap-4">
        <span class="text-3xl">+</span>
        <Link to="#">New User</Link>
        </button>
    </div>
  <table class="w-full border-collapse">
    <thead>
      <tr>
        <th class="py-2 px-4 bg-gray-100 border text-left">Username</th>
        <th class="py-2 px-4 bg-gray-100 border text-left">Name</th>
        <th class="py-2 px-4 bg-gray-100 border text-left">Surname</th>
        <th class="py-2 px-4 bg-gray-100 border text-left">Email</th>
        <th class="py-2 px-4 bg-gray-100 border text-left">Role</th>
        <th class="py-2 px-4 bg-gray-100 border text-left">Car</th>
        <th class="py-2 px-4 bg-gray-100 border text-left">Status</th>
      </tr>
    </thead>
    {#each users as user}
      <tr>
        <td class="py-2 px-4 border">{user.username}</td>
        <td class="py-2 px-4 border">{user.first_name}</td>
        <td class="py-2 px-4 border">{user.last_name}</td>
        <td class="py-2 px-4 border">{user.email}</td>
        <td class="py-2 px-4 border uppercase">{user.role}</td>
        <td class="py-2 px-4 border">
          {#if user.car_id}
            <Link to={`/cars/${user.car_id}`}>See Car</Link>
          {:else}
            No car
          {/if}
        </td>
        <td class="py-2 px-4 border">
          {#if user.driver_status === "free"}
            <span class="text-green-900 bg-green-400 px-4 py-1 rounded-full inline-block">Free</span>
          {:else}
            <span class="text-red-900 bg-red-400 px-4 py-1 rounded-full inline-block">Busy</span>
          {/if}
        </td>
      </tr>
    {/each}
  </table>
  </div>
</main>