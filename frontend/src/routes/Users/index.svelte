<script>
  // @ts-nocheck
  import moment from "moment";
  import { onMount } from "svelte";
  import { Link } from "svelte-navigator";
  import { fade } from "svelte/transition";
  import MdiEye from 'virtual:icons/mdi/eye';
  import MdiEyeOff from 'virtual:icons/mdi/eye-off';
  import MdiPencil from 'virtual:icons/mdi/pencil';
  import MdiTrashCan from 'virtual:icons/mdi/trash-can';
  import LoadingList from "../../components/LoadingList.svelte";
  import { user as storeUser } from "../../stores";
    let show_password = false
    $: type = show_password ? 'text' : 'password'
    let loading = false
    let users = []
    let show_form = false
    let action = "new"
    let user_id = ""
    let meta_verifier = {
    "Role": "role",
    "Email": "email",
    "Username": "username",
    "Password": "password",
    "First Name": "first_name",
    "Last Name": "last_name",
    "Date of Birth": "dob",
    "Phone": "phone",
    };
    let new_user = {username : "", password : "", email : "", first_name : "", last_name : "", dob : "", phone : "", role: "driver"}

    const getUsers = async () => {
      loading = true;
			fetch(import.meta.env.VITE_API_URL + '/api/users', {
					method: 'GET',
					headers: {
						Authorization: `Bearer ${localStorage.getItem("token")}`,
					},
			})
			.then(response => response.json())
			.then(data => {
				users = data.users
        console.log("users: ", users)
				})
			.catch(error => {
				console.error('Error:', error)
			})
      .finally(() => {
        loading = false;
      });
    }
    onMount(getUsers);

    function newUserToggle() {
        show_form = !show_form
        action = "new"
    }

    async function deleteCar(id) {
      const confirm = window.confirm("Are you sure you want to delete this user?")
      if(!confirm){
        return
      }
      try {
            const response = await fetch(import.meta.env.VITE_API_URL + "/api/users/" + id, {
                method: "DELETE",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${localStorage.getItem("token")}`,
                }
            });
            const data = await response.json();
            console.log("data: ", data)
            if(data.error){
              alert(data.error)
              return
            }
            await getUsers()
        } catch (error) {
            console.error("Error:", error);
        }
    }

    async function newUser() {
        if (action === "new") {
          try {
            const response = await fetch(import.meta.env.VITE_API_URL + "/api/register", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${localStorage.getItem("token")}`,
                },
                body: JSON.stringify({...new_user}),
            });
            const data = await response.json();
            console.log("data: ", data)
            if(data.error){
              alert(data.error)
              return
            }
            await getUsers()
            new_user = {username : "", password : "", email : "", first_name : "", last_name : "", dob : "", phone : "", role: "driver"}
            show_form = false
          } catch (error) {
              console.error("Error:", error);
          }
        } else {
          try {
            const response = await fetch(import.meta.env.VITE_API_URL + "/api/users/" + user_id, {
                method: "PUT",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${localStorage.getItem("token")}`,
                },
                body: JSON.stringify({...new_user}),
            });
            const data = await response.json();
            if(data.error){
              alert(data.error)
              return
            }
            await getUsers()
            new_user = {username : "", password : "", email : "", first_name : "", last_name : "", dob : "", phone : "", role: "driver"}
            show_form = false
          } catch (error) {
              console.error("Error:", error);
          }
        }
    }
</script>


{#if loading}
  <LoadingList />
{:else}
<div class="container mx-auto p-6">
  <div class="flex justify-between items-center mb-6">
    <div>
      <h1 class="text-3xl font-bold">Users</h1>
      <p class="text-gray-500">{users.filter(x => x.driver_status === "free").length} available users</p>
    </div>
    <button
      on:click={newUserToggle}
      class="bg-green-600 hover:bg-green-800 transition text-white font-bold py-2 px-6 rounded-lg flex items-center justify-center gap-2 shadow-md"
    >
      <span class="text-2xl">+</span>
      <span>New User</span>
    </button>
  </div>

  <!-- Table Container with Overflow for Responsiveness -->
  <div class="overflow-x-auto">
    <table class="min-w-full border-collapse shadow-lg rounded-lg overflow-hidden">
      <thead class="bg-gradient-to-l from-gray-200 to-gray-300">
        <tr>
          <th class="py-3 px-4 text-left font-semibold text-gray-700 border-b">Username</th>
          <th class="py-3 px-4 text-left font-semibold text-gray-700 border-b">Name</th>
          <th class="py-3 px-4 text-left font-semibold text-gray-700 border-b">Surname</th>
          <th class="py-3 px-4 text-left font-semibold text-gray-700 border-b">Email</th>
          <th class="py-3 px-4 text-left font-semibold text-gray-700 border-b">Role</th>
          <th class="py-3 px-4 text-left font-semibold text-gray-700 border-b">Car</th>
          <th class="py-3 px-4 text-left font-semibold text-gray-700 border-b">Status</th>
          <th class="py-3 px-4 text-left font-semibold text-gray-700 border-b">Created At</th>
          <th class="py-3 px-4 text-center font-semibold text-gray-700 border-b">Actions</th>
        </tr>
      </thead>
      <tbody>
        {#each users as user, index}
          <tr class="{index % 2 === 0 ? 'bg-white' : 'bg-gray-100'} border-b">
            <td class="py-3 px-4 border-r">{user.username}</td>
            <td class="py-3 px-4 border-r">{user.first_name}</td>
            <td class="py-3 px-4 border-r">{user.last_name}</td>
            <td class="py-3 px-4 border-r">{user.email}</td>
            <td class="py-3 px-4 border-r uppercase">{user.role}</td>
            <td class="py-3 px-4 border-r">
              {#if user.car}
                <Link to={`/cars/${user.car._id}`} class="text-blue-600 hover:underline">See Car</Link>
              {:else}
                <span class="text-gray-500">-</span>
              {/if}
            </td>
            <td class="py-3 px-4 border-r">
              {#if user.driver_status === "free"}
                <span class="text-green-900 bg-green-300 px-4 py-1 rounded-full inline-block">Free</span>
              {:else}
                <span class="text-red-900 bg-red-200 px-4 py-1 rounded-full inline-block">Busy</span>
              {/if}
            </td>
            <td class="py-3 px-4 border-r">{moment(user.created_at).format("DD/MM/YYYY HH:MM")}</td>
            <td class="py-3 px-4 border-r flex justify-center gap-3">
              {#if user._id !== $storeUser._id}
                <button
                on:click={() => {
                  console.log("user: ", user)
                  action = "edit"
                  user_id = user._id
                  new_user = {
                    username : user.username,
                    password : user.password,
                    email : user.email,
                    first_name : user.first_name,
                    last_name : user.last_name,
                    dob : user.dob,
                    phone : user.phone,
                    role: user.role
                  }
                  show_form = true
                }}
                class="border-amber-600 border hover:bg-amber-600 text-amber-600 hover:text-amber-100 font-bold py-2 px-4 rounded-lg transition duration-200"
              >
              <MdiPencil class="w-4 h-4 inline" />
              <span>Edit</span>
              </button>
              <button
                on:click={deleteCar(user._id)}
                class="border-red-600 border hover:bg-red-600 text-red-600 hover:text-red-100 font-bold py-2 px-4 rounded-lg transition duration-200"
              >
              <MdiTrashCan class="w-4 h-4 inline" />
              <span>Delete</span>
              </button>
              {:else}
              <div class="text-gray-500 py-4 px-4"></div>
              {/if}
            </td>
          </tr>
        {/each}
      </tbody>
    </table>
  </div>
</div>
{/if}

{#if show_form}
  <!-- Modal Background -->
  <div transition:fade={{duration: 300}} class="fixed inset-0 z-40 flex items-center justify-center bg-white bg-opacity-80 backdrop-blur-sm">
    <!-- Form Modal -->
    <div class="relative max-w-screen-lg w-full max-h-[80vh] overflow-y-auto bg-white p-8 rounded-xl shadow-xl border-2 z-50 transform transition-all duration-500">
      <button
        class="absolute top-4 right-4 text-3xl text-gray-600 hover:text-gray-800"
        on:click={newUserToggle}
        aria-label="Close form"
      >
        ✕
      </button>
      <h2 class="text-3xl font-bold text-center mb-6">Add a New User</h2>
      <form on:submit|preventDefault={newUser} class="space-y-6">
        <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
          {#each Object.keys(meta_verifier) as key}
            <div>
              {#if key === "Role"}
                <label for="field-{key}" class="block text-sm font-medium text-gray-700 mb-1">
                  {key} <span class="text-red-500">*</span>
                </label>
                <select
                  id="field-{key}"
                  class="block w-full border outline-none border-gray-300 rounded-lg p-3 focus:ring-2 focus:ring-green-600 transition-all"
                  bind:value={new_user[meta_verifier[key]]}
                >
                  <option value="driver">Driver</option>
                  <option value="operator">Operator</option>
                </select>
              {:else}
                <label for="field-{key}" class="block text-sm font-medium text-gray-700 mb-1">
                  {key} <span class="text-red-500">*</span>
                </label>
                {#if meta_verifier[key] === "email"}
                  <input
                    type="email"
                    id="field-{key}"
                    required
                    class="block w-full border valid:border-green-500 outline-none border-gray-300 rounded-lg p-3 focus:ring-2 focus:ring-green-600 transition-all"
                    bind:value={new_user[meta_verifier[key]]}
                  />
                {:else if meta_verifier[key] === "phone"}
                  <input
                    type="tel"
                    id="field-{key}"
                    required
                    class="block w-full border valid:border-green-500 outline-none border-gray-300 rounded-lg p-3 focus:ring-2 focus:ring-green-600 transition-all"
                    bind:value={new_user[meta_verifier[key]]}
                  />
                {:else if meta_verifier[key] === "dob"}
                  <input
                    type="date"
                    id="field-{key}"
                    required
                    class="block w-full border valid:border-green-500 outline-none border-gray-300 rounded-lg p-3 focus:ring-2 focus:ring-green-600 transition-all"
                    bind:value={new_user[meta_verifier[key]]}
                  />
                {:else if meta_verifier[key] === "password" && type === "password"}
                  <div class="relative">
                    <input
                      type="password"
                      id="field-{key}"
                      disabled={action === "edit"}
                      required
                      class="block w-full disabled:bg-gray-200 border valid:border-green-500 outline-none border-gray-300 rounded-lg p-3 focus:ring-2 focus:ring-green-600 transition-all"
                      bind:value={new_user[meta_verifier[key]]}
                    />
                    <div class="flex items-center gap-2 mt-2 absolute right-2 top-0">
                      <input
                        type="checkbox"
                        id="show_password"
                        class="form-checkbox hidden"
                        bind:checked={show_password}
                      />
                      <label for="show_password" title="Hide password" class="text-sm cursor-pointer text-slate-700 bg-slate-200 p-2 rounded-lg">
                          <MdiEye class="w-5 h-5" />
                      </label>
                    </div>
                  </div>
                {:else if meta_verifier[key] === "password" && type === "text"}
                  <div class="relative">
                    <input
                      type="text"
                      id="field-{key}"
                      disabled={action === "edit"}
                      required
                      class="block w-full disabled:bg-gray-200 border valid:border-green-500 outline-none border-gray-300 rounded-lg p-3 focus:ring-2 focus:ring-green-600 transition-all"
                      bind:value={new_user[meta_verifier[key]]}
                    />
                    <div class="flex items-center gap-2 mt-2 absolute right-2 top-0">
                      <input
                        type="checkbox"
                        id="show_password"
                        class="form-checkbox hidden text-green-600"
                        bind:checked={show_password}
                      />
                      <label for="show_password" title="Show password" class="text-sm cursor-pointer text-slate-700 bg-slate-200 p-2 rounded-lg">
                          <MdiEyeOff class="w-5 h-5" />
                      </label>
                    </div>
                  </div>
                {:else}
                  <input
                    type="text"
                    id="field-{key}"
                    required
                    class="block w-full border valid:border-green-500 outline-none border-gray-300 rounded-lg p-3 focus:ring-2 focus:ring-green-600 transition-all"
                    bind:value={new_user[meta_verifier[key]]}
                  />
                {/if}
                
              {/if}
            </div>
          {/each}
        </div>
        <div class="flex gap-4 mt-4">
          <button
            type="submit"
            class="bg-green-600 hover:bg-green-700 text-white font-bold py-3 px-4 rounded-lg flex-1 transition duration-200"
          >
            Submit
          </button>
          <button
            type="reset"
            class="bg-yellow-400 hover:bg-yellow-500 text-black font-bold py-3 px-4 rounded-lg flex-1 transition duration-200"
          >
            Reset
          </button>
        </div>
      </form>
    </div>
  </div>
{/if}
