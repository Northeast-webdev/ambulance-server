<script>
  import { useLocation, useNavigate } from "svelte-navigator";

  const navigate = useNavigate();
  const location = useLocation();
  const token = localStorage.getItem("token");
  $: if (!token) {
    navigate("/login", {
      state: { from: $location.pathname },
      replace: true,
    });
  }
</script>

{#if token}
  <slot />
{/if}
