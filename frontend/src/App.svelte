<!-- App.svelte -->
<script>
  // @ts-nocheck

  import { onMount } from "svelte";
  import { navigate, Route, Router } from "svelte-navigator";
  import { blur } from "svelte/transition";
  import Header from "./components/Header.svelte";
  import Loading from "./components/Loading.svelte";
  import PrivateRoute from "./components/PrivateRoute/index.svelte";
  import Cars from "./routes/Cars/index.svelte";
  import Login from "./routes/Login/index.svelte";
  import Map from "./routes/Map/index.svelte";
  import Patients from "./routes/Patients/index.svelte";
  import Runs from "./routes/Runs/index.svelte";
  import Stats from "./routes/Stats/index.svelte";
  import Users from "./routes/Users/index.svelte";
  import { supabase, user } from "./stores";

  let loading = true;

  async function getUser() {
    loading = true;
    try {
      console.log("getting user");
      const {
        data: { session },
      } = await supabase.auth.getSession();
      if (!session) return;
      const { data, error } = await supabase
        .from("users")
        .select()
        .eq("email", session.user.email);
      if (error) {
        console.log(error);
      }
      $user = data[0] ?? {};
      if ($user.role === "MECHANIC" || $user.role === "MANAGER") {
        navigate("/garage", { replace: true });
      }
      if ($user.role === "MAP") {
        navigate("/", { replace: true });
      }
    } catch (error) {
      console.error(error);
    } finally {
      loading = false;
    }
  }

  onMount(async () => {
    await getUser();
    const {
      data: { subscription: authListener },
    } = supabase.auth.onAuthStateChange(async (_, session) => {
      if (!session) return;
      const { data, error } = await supabase
        .from("users")
        .select()
        .eq("email", session.user.email);
      if (error) {
        console.log(error);
      }
      $user = data[0] ?? {};
    });

    return () => {
      authListener?.unsubscribe();
    };
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
      <PrivateRoute path="/users">
        <Users />
      </PrivateRoute>
      <PrivateRoute path="runs">
        <Runs />
      </PrivateRoute>
      <PrivateRoute path="garage">
        <Cars />
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
