<!-- components/Loading.svelte -->
<script>
  export let iconOnly = false;
  import logo from "../assets/logo.png";
</script>

{#if iconOnly}
  <div class="loader"></div>
{:else}
  <main
    class="fixed w-full min-h-screen flex items-center justify-center bg-gradient-to-tl from-green-700 to-green-800"
  >
    <div class="flex items-center justify-center gap-4 flex-col">
      <img src={logo} alt="logo" class="w-10 h-10 object-contain" />
      <div class="loader"></div>
    </div>
  </main>
{/if}

<style scoped>
  /* HTML: <div class="loader"></div> */
  .loader {
    height: 4px;
    width: 130px;
    @apply text-green-600;
    --c: no-repeat linear-gradient(#fff6 0 0);
    background: var(--c), var(--c), currentColor;
    background-size: 60% 100%;
    animation: l16 3s infinite;
  }
  @keyframes l16 {
    0% {
      background-position:
        -150% 0,
        -150% 0;
    }
    66% {
      background-position:
        250% 0,
        -150% 0;
    }
    100% {
      background-position:
        250% 0,
        250% 0;
    }
  }
</style>
