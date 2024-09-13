<!-- App.svelte -->
<script>
  import { onMount } from "svelte";
  import { navigate, Route, Router } from "svelte-navigator";
  import { blur } from "svelte/transition";
  import Header from "./components/Header.svelte";
  import Loading from "./components/Loading.svelte";
  import PrivateRoute from "./components/PrivateRoute/index.svelte";
  import Cars from "./routes/Cars/index.svelte";
  import Login from "./routes/Login/index.svelte";
  import Map from "./routes/Map/index.svelte";
  import Runs from "./routes/Runs/index.svelte";
  import Users from "./routes/Users/index.svelte";
  import { token, user } from "./stores";

  let loading = true;

  async function getUser() {
    if (!localStorage.getItem("id")) {
      loading = false;
      navigate("/login", { replace: true });
      return;
    }
    loading = true;
    try {
      const response = await fetch(
        import.meta.env.VITE_API_URL +
          "/api/users/" +
          localStorage.getItem("id"),
        {
          method: "GET",
          headers: {
            Authorization: `Bearer ${localStorage.getItem("token")}`,
          },
        }
      );

      const data = await response.json();
      $user = data;
    } catch (error) {
      console.error("Error:", error);
    } finally {
      loading = false;
    }
  }

  $: token.subscribe((value) => {
    if (value) {
      getUser();
    }
  });

  onMount(() => {
    setTimeout(() => {
      if (localStorage.getItem("token")) {
        token.set(localStorage.getItem("token"));
      } else {
        getUser();
      }
    }, 1000);
  });
</script>

<div class="font-sans">
  {#if loading}
    <div transition:blur={{ amount: 10, duration: 1000 }}>
      <Loading />
    </div>
  {:else}
    <Router>
      <Header />
      <PrivateRoute path="/">
        <Map />
      </PrivateRoute>
      <PrivateRoute path="/users">
        <Users />
      </PrivateRoute>
      <PrivateRoute path="runs">
        <Runs />
      </PrivateRoute>
      <PrivateRoute path="cars">
        <Cars />
      </PrivateRoute>
      <Route path="login">
        <Login />
      </Route>
    </Router>
  {/if}
</div>
