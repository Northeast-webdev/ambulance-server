<!-- App.svelte -->
<script>
  import { onMount } from "svelte";
  import { navigate, Route, Router } from "svelte-navigator";
  import { blur } from "svelte/transition";
  import Header from "./components/Header.svelte";
  import Loading from "./components/Loading.svelte";
  import PrivateRoute from "./components/PrivateRoute/index.svelte";
  import CarChecklists from "./routes/CarChecklists/index.svelte";
  import Cars from "./routes/Cars/index.svelte";
  import Login from "./routes/Login/index.svelte";
  import Map from "./routes/Map/index.svelte";
  import MaterialChecklists from "./routes/MaterialChecklists/index.svelte";
  import Patients from "./routes/Patients/index.svelte";
  import Prenotazione from "./routes/Prenotazione/index.svelte";
  import Runs from "./routes/Runs/index.svelte";
  import Stats from "./routes/Stats/index.svelte";
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
      if (data.error) {
        localStorage.removeItem("token");
        localStorage.removeItem("id");
        token.set(null);
        user.set({});
        navigate("/login", { replace: true });
        return;
      }
      if (data.role === "meccanico" || data.role === "direzione") {
        navigate("/garage", { replace: true });
      }
      if (data.role === "mappatore") {
        navigate("/", { replace: true });
      }
      $user = data;
    } catch (error) {
      console.error(error);
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
      <PrivateRoute path="/pazienti">
        <Patients />
      </PrivateRoute>
      <PrivateRoute path="/prenotazione">
        <Prenotazione />
      </PrivateRoute>
      <PrivateRoute path="/users">
        <Users />
      </PrivateRoute>
      <PrivateRoute path="runs">
        <Runs />
      </PrivateRoute>
      <PrivateRoute path="garage">
        <Cars />
      </PrivateRoute>
      <PrivateRoute path="car-checklists">
        <CarChecklists />
      </PrivateRoute>
      <PrivateRoute path="material-checklists">
        <MaterialChecklists />
      </PrivateRoute>
      <PrivateRoute path="/stats">
        <Stats />
      </PrivateRoute>
      <Route path="login">
        <Login />
      </Route>
    </Router>
  {/if}
</div>
