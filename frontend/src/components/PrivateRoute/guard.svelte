<script>
  import { useLocation, useNavigate } from "svelte-navigator";
  import { user } from "../../stores";

  const navigate = useNavigate();
  const location = useLocation();
  $: if (!$user.role) {
    navigate("/login", {
      state: { from: $location.pathname },
      replace: true,
    });
  }
</script>

{#if $user.role}
  <slot />
{/if}
