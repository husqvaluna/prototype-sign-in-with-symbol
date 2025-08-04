<script lang="ts">
import { FirebaseError } from "firebase/app";
import { signInWithPopup } from "firebase/auth";
import { auth, provider } from "../lib/firebase";

async function signInWithGoogle() {
  try {
    const result = await signInWithPopup(auth, provider);
    console.debug(result);
  } catch (error) {
    if (error instanceof FirebaseError) {
      console.log(error);
    }
  }
}
</script>

<button
  onclick={signInWithGoogle}
  class="w-full bg-blue-600 text-white py-1.5 px-3 rounded-md flex items-center justify-center space-x-2 mb-4 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-opacity-50"
>
  <img src="/google-icon.svg" alt="Google Icon" class="h-5 w-5" />
  <span>Sign in with Google</span>
</button>
