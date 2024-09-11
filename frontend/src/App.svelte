<!-- App.svelte -->
<script>
	import { onMount } from "svelte";
	import { Route, Router } from "svelte-navigator";
	import { blur } from "svelte/transition";
	import Header from "./components/Header.svelte";
	import Loading from "./components/Loading.svelte";
	import Login from "./routes/Login/index.svelte";
	import PrivateRoute from "./routes/PrivateRoute/index.svelte";
	import Runs from "./routes/Runs/index.svelte";
	import Users from "./routes/Users/index.svelte";
	import { token, user } from "./stores";

	let loading = true;

	async function getUser() {
		loading = true;
		try {
			const response = await fetch("http://0.0.0.0:8080/users/" + localStorage.getItem("id"), {
				method: "GET",
				headers: {
					Authorization: `Bearer ${localStorage.getItem("token")}`,
				},
			});
			const data = await response.json();
			$user = data;
		} catch (error) {
			console.error("Error:", error);
		} finally {
			loading = false;
		}
	}

  	$: token.subscribe((value) => {
		if (value) {
			getUser();
		}
	});

	onMount(() => {
		setTimeout(() => {
			if (localStorage.getItem("token")) {
				token.set(localStorage.getItem("token"));
			}
		}, 1000);
	});
</script>
<main>
{#if loading}
	<div transition:blur={{ amount: 10, duration: 1000 }}>
		<Loading />
	</div>
{:else}
	<Router>
<Header />
		<PrivateRoute path="/users">
			<Users />
		</PrivateRoute>
		<PrivateRoute path="runs">
			<Runs />
		</PrivateRoute>
		<Route path="login">
      		<Login />
    	</Route>
</Router>
{/if}
</main>