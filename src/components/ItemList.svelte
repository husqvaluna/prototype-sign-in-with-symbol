<script lang="ts">
import { db } from "../lib/firebase";
import { doc, collection, onSnapshot, query, addDoc, deleteDoc, orderBy, serverTimestamp, Timestamp } from "firebase/firestore";

interface Item {
  id: string;
  content: string;
  createdAt: Timestamp;
}

const { userId } = $props();

const itemCollection = collection(db, `users/${userId}/todos`);

let content$ = $state("");
let items$ = $state<Item[]>([]);

function addItem() {
  const docRef = addDoc(itemCollection, {
    content: content$,
    createdAt: serverTimestamp(),
  });
  content$ = "";
  return docRef;
}

function rmItem(id: string) {
  const docRef = doc(db, itemCollection.path, id);
  return deleteDoc(docRef);
}

onSnapshot(query(itemCollection, orderBy("createdAt", "desc")), (snapshot) => {
  items$ = snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data({ serverTimestamps: "estimate" }) }) as Item);
});
</script>

<form onsubmit={e => { e.preventDefault(); addItem(); }} class="flex items-center space-x-2 mb-4">
  <input
    type="text"
    bind:value={content$}
    placeholder="Add a new item..."
    class="flex-grow p-3 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 transition duration-150 ease-in-out"
  />
  <button
    type="submit"
    aria-label="Add item"
    class="bg-blue-600 text-white p-3 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition duration-150 ease-in-out flex items-center justify-center"
  ></button>
</form>
<ul class="space-y-2">
  {#each items$ as item (item.id)}
  <li class="bg-white p-3 rounded-lg shadow-md flex items-center justify-between">
    <span class="text-gray-800">{item.content}</span>
    <div class="flex items-center space-x-3">
      <span class="text-gray-500 text-sm">{new Date(item.createdAt.toDate()).toLocaleString('ja-JP', { year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit' }).replace(/\//g, '/')}</span>
      <button
        onclick={() => rmItem(item.id)}
        aria-label="Delete item"
        class="text-red-500 hover:text-red-700 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2 rounded-md text-xs transition duration-150 ease-in-out"
      >Del</button>
    </div>
  </li>
  {/each}
</ul>


<style>
</style>
