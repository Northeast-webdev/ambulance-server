<!-- routes/Login/index.svelte -->
<script>
  import { useLocation, useNavigate } from "svelte-navigator";
  import { token } from "../../stores";

  let username = "";
  let password = "";
  const navigate = useNavigate();
  const location = useLocation();
  let t = ""
  async function login() {
    try {
        const response = await fetch(import.meta.env.VITE_API_URL + "/api/login", {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify({ username, password }),
        });
        const {token, id} = await response.json();
        t = token;
        localStorage.setItem("token", token);
        localStorage.setItem("id", id);
    } catch (error) {
        console.error("Error:", error);
    }
  }
  $: if (t) {
    token.set(t);
    const from = ($location.state && $location.state.from) || "/";
    navigate(from, { replace: true });
  }

</script>

<div class="min-h-screen flex items-center justify-center bg-gradient-to-br from-green-500 to-green-900 p-6">
  <div class="bg-white rounded-xl shadow-lg p-8 w-full max-w-md">
    <h1 class="text-2xl font-bold text-center text-gray-800 mb-6">Login</h1>
    <form on:submit|preventDefault={login} class="space-y-6">
      <div>
        <label for="username" class="block text-sm font-medium text-gray-600">Username</label>
        <input
          type="text"
          id="username"
          bind:value={username}
          required
          class="mt-1 w-full px-4 py-2 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-green-400 focus:border-transparent"
        />
      </div>
      <div>
        <label for="password" class="block text-sm font-medium text-gray-600">Password</label>
        <input
          type="password"
          id="password"
          bind:value={password}
          required
          class="mt-1 w-full px-4 py-2 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-green-400 focus:border-transparent"
        />
      </div>
      <button
        type="submit"
        class="w-full py-3 bg-green-500 hover:bg-green-600 text-white font-semibold rounded-lg shadow-md transition duration-200"
      >
        Login
      </button>
    </form>
  </div>
</div>
