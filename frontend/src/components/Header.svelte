<!-- components/Header/index.svelte -->
<script>
  // @ts-nocheck

  import { Link, useLocation, useNavigate } from "svelte-navigator";
  import logo from "../assets/logo.png";
  import { supabase, user } from "../stores";

  const navigate = useNavigate();
  const location = useLocation();
  const links = [
    { name: "Mappa", path: "/" },
    { name: "Pazienti", path: "/pazienti" },
    { name: "Utenti", path: "/users" },
    { name: "Trasporti", path: "/runs" },
    { name: "Deposito", path: "/garage" },
    { name: "Statistiche", path: "/stats" },
  ];
  async function handleLogout() {
    const { error } = await supabase.auth.signOut();
    if (error) {
      console.log("Error logging out:", error.message);
      return;
    }
    user.set({});
    navigate("/login", { replace: true });
  }
</script>

{#if $user.role}
  <header
    class="bg-gradient-to-l from-green-600 to-green-900 shadow-lg shadow-gray-300 sticky top-0 z-50"
  >
    <div class="container py-4 px-3 mx-auto flex justify-between items-center">
      <!-- Logo -->
      <div class="flex items-center">
        <img
          src={logo}
          alt="logo"
          class="w-14 h-14 object-contain rounded-full bg-white p-1"
        />
      </div>

      <!-- Navigation Links -->
      {#if $user.role === "ADMIN" || $user.role === "OPERATOR"}
        <nav class="flex-1 mx-6 space-x-2">
          {#each links as link}
            <Link
              to={link.path}
              class="text-gray-100 pl-4 pr-3 py-2 text-center rounded-xl {link.path ===
              $location.pathname
                ? 'text-green-700 bg-white'
                : 'hover:text-gray-50'} text-lg font-medium transition duration-200"
            >
              {link.name}
            </Link>
          {/each}
        </nav>
      {/if}

      {#if $user.role === "MAP"}
        <nav class="flex-1 mx-6 space-x-6">
          <Link
            to="/"
            class="px-4 py-2 text-center rounded-xl text-green-700 bg-white text-lg font-medium transition duration-200"
          >
            Mappa
          </Link>
        </nav>
      {/if}

      {#if $user.role === "MECHANIC" || $user.role === "MANAGER"}
        <nav class="flex-1 mx-6 space-x-6">
          <Link
            to="/garage"
            class="px-4 py-2 text-center rounded-xl text-green-700 bg-white text-lg font-medium transition duration-200"
          >
            Deposito
          </Link>
        </nav>
      {/if}

      <!-- User Information -->
      <div
        class="text-gray-50 {$user.role === 'ADMIN' || $user.role === 'OPERATOR'
          ? 'text-right'
          : 'text-right flex-1'} mx-6"
      >
        <h3 class="font-semibold">
          {`${$user.first_name} ${$user.last_name}`}
        </h3>
        <p class="text-sm uppercase tracking-widest">
          {$user.role === "ADMIN"
            ? "amministratore"
            : $user.role === "OPERATOR"
              ? "coordinatore"
              : $user.role}
        </p>
      </div>

      <!-- Logout Button -->
      <button
        class="bg-green-800 hover:bg-green-900 text-white font-medium py-2 px-4 rounded-lg transition duration-200"
        on:click={handleLogout}
      >
        Log Out
      </button>
    </div>
  </header>
{/if}
