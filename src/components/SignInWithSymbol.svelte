<script lang="ts">
import { FirebaseError } from "firebase/app";
import { signInWithCustomToken } from "firebase/auth";
import { httpsCallable } from "firebase/functions";
import { auth, fns } from "../lib/firebase";

import { PrivateKey } from "symbol-sdk";
import { SymbolFacade, Network } from "symbol-sdk/symbol";
import SignInData from "./SignInData.svelte";

interface SignInInput {
  domain?: string;
  address?: string;
  statement?: string;
  uri?: string;
  version?: string;
  chainId?: string;
  nonce?: string;
  issuedAt?: string;
  expirationTime?: string;
  notBefore?: string;
  requestId?: string;
  resources?: string[];
}

interface SignInOutput {
  publicKeyHex: string;
  signedMessage: string;
  signatureHex: string;
}

const facade = new SymbolFacade(Network.TESTNET);

let address$ = $state("");
let privateKeyString$ = $state("");
let signInInput$ = $state<SignInInput | null>(null);
let token$ = $state("");
let error$ = $state("");

async function claimInputData() {
  error$ = "";
  try {
    const callCreateSignInData = httpsCallable<{ address: string }, { signInInput: SignInInput }>(fns, "createSignInData");
    const { data } = await callCreateSignInData({
      address: address$,
    });
    signInInput$ = data.signInInput;
    console.debug(signInInput$);
  } catch (e) {
    if (e instanceof FirebaseError) {
      error$ = e.message;
    } else if (e instanceof Error) {
      error$ = e.message;
    } else {
      error$ = "An unknown error occurred.";
    }
    console.error(e);
  }
}

async function signIn() {
  error$ = "";
  try {
    // const currentDomain = window.location.hostname;
    const currentDomain = "service.example.com";

    if (signInInput$ == null) {
      throw new Error(`No SignInInput: unexpected.`);
    }

    // ドメイン検証
    if (signInInput$.domain !== currentDomain) {
      throw new Error(`Domain mismatch: expected ${currentDomain}, got ${signInInput$.domain}`);
    }

    // 有効期限チェック（クライアント側）
    if (signInInput$.expirationTime && new Date(signInInput$.expirationTime) < new Date()) {
      throw new Error("Challenge has expired");
    }

    // 発行時刻チェック（クライアント側）
    if (signInInput$.issuedAt && new Date(signInInput$.issuedAt) > new Date()) {
      throw new Error("Challenge issued in the future");
    }

    const signedMessage = JSON.stringify({
      ...signInInput$,
    });

    const keyPair = new facade.static.KeyPair(new PrivateKey(privateKeyString$));
    const signature = keyPair.sign(new TextEncoder().encode(signedMessage));

    const signInOutput: SignInOutput = {
      publicKeyHex: keyPair.publicKey.toString(),
      signatureHex: signature.toString(),
      signedMessage,
    };
    console.debug(signInOutput);

    const callClaimToken = httpsCallable<
      {
        signInInput: SignInInput;
        signInOutput: SignInOutput;
      },
      {
        result: boolean;
        token?: string;
        error?: string;
      }
    >(fns, "claimToken");
    const { data } = await callClaimToken({
      signInInput: signInInput$,
      signInOutput,
    });

    if (data.error) {
      throw new Error(data.error);
    }

    token$ = data.token || "";
    console.debug({ token: token$ });

    const result = await signInWithCustomToken(auth, token$);
    console.debug(result);
  } catch (e) {
    if (e instanceof FirebaseError) {
      error$ = e.message;
    } else if (e instanceof Error) {
      error$ = e.message;
    } else {
      error$ = "An unknown error occurred.";
    }
    console.error(e);
  }
}
</script>

<div class="mt-4 pt-4 border-t border-gray-200">
  {#if signInInput$ === null}
    <div class="mb-2">
      <label for="address" class="block text-sm font-medium text-gray-700 mb-1">Address</label>
      <input
        type="text"
        id="address"
        placeholder="Enter your Symbol address"
        bind:value={address$}
        class="w-full p-3 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition duration-150 ease-in-out"
        autoComplete="username"
        minLength={39}
        maxLength={45}
      />
    </div>
    <button
      onclick={claimInputData}
      class="w-full py-2 px-3 bg-blue-600 text-white font-semibold rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition duration-150 ease-in-out"
    >
      Continue with Symbol
    </button>
  {:else}
    <SignInData signInInput={signInInput$} />

    <div class="mb-2">
      <label for="privateKey" class="block text-sm font-medium text-gray-700 mb-1">Private Key</label>
      <input
        type="password"
        id="privateKey"
        placeholder="Enter your private key"
        bind:value={privateKeyString$}
        class="w-full p-3 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition duration-150 ease-in-out"
        autoComplete="current-password"
        maxLength={64}
      />
    </div>
    <button
      onclick={signIn}
      class="w-full py-2 px-3 bg-green-600 text-white font-semibold rounded-md hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2 transition duration-150 ease-in-out"
    >
      Approve
    </button>
    <button
      onclick={() => (signInInput$ = null)}
      class="w-full mt-2 py-2 px-3 bg-gray-200 text-gray-700 font-semibold rounded-md hover:bg-gray-300 focus:outline-none focus:ring-2 focus:ring-gray-400 focus:ring-offset-2 transition duration-150 ease-in-out"
    >
      Back
    </button>
  {/if}

  {#if error$}
    <p class="text-red-600 bg-red-100 border border-red-400 rounded-md p-3 mt-4 flex items-center justify-center text-sm font-medium">
      <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 mr-2" viewBox="0 0 20 20" fill="currentColor">
        <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clip-rule="evenodd" />
      </svg>
      {error$}
    </p>
  {/if}
</div>
