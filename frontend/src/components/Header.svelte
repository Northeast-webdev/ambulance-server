<!-- components/Header/index.svelte -->
<script>
// @ts-nocheck

  import { Link, useNavigate } from "svelte-navigator";
  import { token, user } from "../stores";

  const navigate = useNavigate();
  const links = [
    { name: "Users", path: "/users" },
    { name: "Runs", path: "/runs" },
    { name: "Cars", path: "/cars" },
  ];
  function handleLogout() {
    token.set(null);
    localStorage.removeItem("token");
    localStorage.removeItem("id");
    navigate("/login", { replace: true });
  }
</script>

{#if $token}
<main>
  <header class="flex justify-between items-center p-4 bg-gray-900 font-mono">
    <h3 class="font-bold text-gray-50">Ciao, {$user.username}</h3>
    <div class="link-cont">
      {#each links as link}
        <Link to={link.path} class=" hover:underline hover:animate-pulse text-gray-100 hover:text-gray-50">{link.name}</Link>
      {/each}
    </div>
    <button class="hover:animate-pulse text-emerald-50  border px-4" on:click={handleLogout}>Log Out</button>
  </header>
</main>
{/if}

<style>
 .link-cont{
  @apply flex gap-10;
 }
</style>