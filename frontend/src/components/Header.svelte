<!-- components/Header/index.svelte -->
<script>
  // @ts-nocheck

  import { Link, useNavigate } from "svelte-navigator";
  import logo from "../assets/logo.png";
  import { token, user } from "../stores";

  const navigate = useNavigate();
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
        <nav class="flex-1 mx-6 space-x-6">
          {#each links as link}
            <Link
              to={link.path}
              class="text-gray-100 hover:text-gray-50 text-lg font-medium transition duration-200"
            >
              {link.name}
            </Link>
          {/each}
        </nav>
      {/if}

      <!-- User Information -->
      <div
        class="text-gray-50 {$user.role === 'administrator' ||
        $user.role === 'operator'
          ? 'text-right'
          : 'text-center'} mx-6"
      >
        <h3 class="font-semibold">
          {`${$user.first_name} ${$user.last_name}`}
        </h3>
        <p class="text-sm uppercase tracking-widest">{$user.role}</p>
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
