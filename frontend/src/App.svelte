<script>

  let users = []
  // fetch a list of users from the server
  fetch('http://localhost:8080/users', {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json'
    }
  })
    .then(response => response.json())
    .then(data => {
      users = data.users
    })
    .catch(error => {
      console.error('Error:', error)
    })
  
</script>

<main>
  <h1>Users</h1>
  <div class="grid-container">
    {#each users as user}
      <div>
        <h2>{user.username}</h2>
        <p>{user.role}</p>
      </div>
    {/each}
  </div>
</main>

<style>
  .grid-container {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
    gap: 1rem;
  }
  div {
    padding: 1rem;
    border: 1px solid #ccc;
    border-radius: 5px;
  }
</style>
