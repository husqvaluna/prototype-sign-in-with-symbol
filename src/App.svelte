<script lang="ts">
import { onAuthStateChanged, signOut } from "firebase/auth";
import { auth } from "./lib/firebase";
import SignInWithSymbol from "./components/SignInWithSymbol.svelte";
import ItemList from "./components/ItemList.svelte";

let uid$: string | null;
onAuthStateChanged(auth, (user) => {
  console.debug("onAuthStateChanged: %s", user?.uid);
  uid$ = user ? user.uid : null;
});
</script>

<main class="flex items-center justify-center min-h-screen bg-gray-50">
  <div class="bg-white p-8 rounded-2xl shadow-xl w-full max-w-sm">
    {#if uid$}
      <h1 class="text-2xl font-bold text-center mb-6">TODO</h1>
      <ItemList userId={uid$} />
      <button onclick={() => signOut(auth)} class="w-full mt-4 py-2 px-4 bg-red-600 text-white rounded-md hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2 transition duration-150 ease-in-out">Logout</button>
    {:else}
      <h1 class="text-2xl font-bold text-center mb-6">Sign In</h1>
      <SignInWithSymbol />
    {/if}
  </div>
</main>

<style></style>
