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
        const response = await fetch("http://0.0.0.0:8080/login", {
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

<main>
  <h1>Login</h1>
  <form on:submit|preventDefault={login}>
    <label for="username">Username</label>
    <input type="text" id="username" bind:value={username} required />
    <label for="password">Password</label>
    <input type="password" id="password" bind:value={password} required />
    <button type="submit">Login</button>
  </form>
</main>