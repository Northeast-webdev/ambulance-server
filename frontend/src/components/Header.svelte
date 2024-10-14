<!-- components/Header/index.svelte -->
<script>
  // @ts-nocheck

  import { Link, useLocation, useNavigate } from "svelte-navigator";
  import logo from "../assets/logo.png";
  import { token, user } from "../stores";

  const navigate = useNavigate();
  const location = useLocation();
  const links = [
    { name: "Pazienti", path: "/pazienti" },
    { name: "Utenti", path: "/users" },
    { name: "Mappa", path: "/" },
    { name: "Corse", path: "/runs" },
    { name: "Garage", path: "/garage" },
    { name: "Mezzi Checklist", path: "/car-checklists" },
    { name: "Materiali Checklist", path: "/material-checklists" },
  ];
  function handleLogout() {
    token.set(null);
    localStorage.removeItem("token");
    localStorage.removeItem("id");
    navigate("/login", { replace: true });
  }
</script>

{#if $token}
  <header
    class="bg-gradient-to-l from-green-600 to-green-900 shadow-lg shadow-gray-300 relative z-50"
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
      {#if $user.role === "administrator" || $user.role === "operator"}
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

      {#if $user.role === "mappatore"}
        <nav class="flex-1 mx-6 space-x-6">
          <Link
            to="/"
            class="px-4 py-2 text-center rounded-xl text-green-700 bg-white text-lg font-medium transition duration-200"
          >
            Mappa
          </Link>
        </nav>
      {/if}

      {#if $user.role === "meccanico" || $user.role === "direzione"}
        <nav class="flex-1 mx-6 space-x-6">
          <Link
            to="/garage"
            class="px-4 py-2 text-center rounded-xl text-green-700 bg-white text-lg font-medium transition duration-200"
          >
            Garage
          </Link>
        </nav>
      {/if}

      <!-- User Information -->
      <div
        class="text-gray-50 {$user.role === 'administrator' ||
        $user.role === 'operator'
          ? 'text-right'
          : 'text-right flex-1'} mx-6"
      >
        <h3 class="font-semibold">
          {`${$user.first_name} ${$user.last_name}`}
        </h3>
        <p class="text-sm uppercase tracking-widest">
          {$user.role === "administrator" ? "amministratore" : $user.role}
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
