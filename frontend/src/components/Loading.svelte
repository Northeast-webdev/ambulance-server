<!-- components/Loading.svelte -->
<main>
  <div class="loader"></div>
</main>

<style scoped>
/* HTML: <div class="loader"></div> */
.loader {
  display: inline-flex;
  gap: 5px;
}
.loader:before,
.loader:after {
  content: "";
  width: 30px;
  aspect-ratio: 1;
  box-shadow: 0 0 0 5px inset #222;
  animation: l4 1.5s infinite;
}
.loader:after {
  --s: -1;
  animation-delay: 0.75s
}
@keyframes l4 {
  0%     {transform:scaleX(var(--s,1)) translate(0) rotate(0)}
  16.67% {transform:scaleX(var(--s,1)) translate(-50%) rotate(0)}
  33.33% {transform:scaleX(var(--s,1)) translate(-50%) rotate(90deg)}
  50%,
  100%   {transform:scaleX(var(--s,1)) translate(0) rotate(90deg)}
}
main {
    display: flex;
    justify-content: center;
    align-items: center;
    height: 100vh;
    background-color: #fff;
    position: fixed;
    width: 100%;
    inset: 0;
    z-index: 1000;
}
  </style>