import admin from "firebase-admin";
import { setGlobalOptions } from "firebase-functions";
import { type CallableRequest, onCall } from "firebase-functions/https";
import { getFirestore } from "firebase-admin/firestore";
import * as logger from "firebase-functions/logger";

setGlobalOptions({
  region: "asia-northeast1",
  maxInstances: 3,
});

if (admin.apps.length < 1) {
  admin.initializeApp();
}

import { PublicKey, Signature } from "symbol-sdk";
import { SymbolFacade, Network } from "symbol-sdk/symbol";
import { randomBytes, createHash } from "crypto";

export interface SignInInput {
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

export interface SignInOutput {
  publicKey: PublicKey;
  signedMessage: string;
  signature: Signature;
}

const db = getFirestore();
const signInInputCollection = db.collection("/signInInputs");

const facade = new SymbolFacade(Network.TESTNET);

export const createSignInData = onCall(async (req: CallableRequest) => {
  const address: string | null = req.data?.address || null;
  if (!address) return { signInInput: null };

  const nonce = randomBytes(4).toString("hex");
  const issuedAt = new Date().toISOString();
  const expirationTime = new Date(Date.now() + 5 * 60 * 1000).toISOString();

  const signInInput: SignInInput = {
    domain: "service.example.com",
    address,
    statement:
      "Sign or Approve only means you have proved this account is owned by you. This request will not trigger any blockchain transaction or cost any fee.",
    uri: "https://service.example.com",
    version: "1",
    chainId: "symbol:testnet",
    nonce,
    issuedAt,
    expirationTime,
    resources: [],
  };

  await signInInputCollection.doc(nonce).create({
    value: createHash("sha256").update(JSON.stringify(signInInput)).digest("hex"),
  });

  return { signInInput };
});

export const claimToken = onCall(async (req: CallableRequest) => {
  const { signInInput, signInOutput } = req.data;

  const { publicKeyHex, signatureHex, signedMessage } = signInOutput;
  const publicKey = new PublicKey(publicKeyHex);
  const signature = new Signature(signatureHex);

  // 1. 送信したinputの内容一致確認
  const nonceDoc = await signInInputCollection.doc(signInInput.nonce).get();
  const { value: nonce } = nonceDoc.data()!;
  if (createHash("sha256").update(signedMessage).digest("hex") !== nonce) {
    return { result: false, error: "Input data mismatched" };
  }

  // 2. タイムスタンプ検証
  const now = new Date();

  // 発行時刻チェック
  if (signInInput.issuedAt) {
    const issuedAt = new Date(signInInput.issuedAt);
    const maxAge = 5 * 60 * 1000; // 5分

    if (issuedAt > now) {
      return { result: false, error: "Challenge issued in the future" };
    }

    if (now.getTime() - issuedAt.getTime() > maxAge) {
      return { result: false, error: "Challenge too old" };
    }
  }

  // 有効期限チェック
  if (signInInput.expirationTime) {
    const expirationTime = new Date(signInInput.expirationTime);
    if (now > expirationTime) {
      return { result: false, error: "Challenge expired" };
    }
  }

  // 3. ドメイン検証（サーバー側でも確認）
  if (signInInput.domain !== "service.example.com") {
    return { result: false, error: "Invalid domain" };
  }

  // 4. アドレス一致チェック
  const address = facade.createPublicAccount(publicKey).address;
  if (signInInput.address !== address.toString()) {
    return { result: false, error: "Address mismatch" };
  }

  // 5. 署名検証
  const result1 = new facade.static.Verifier(publicKey).verify(new TextEncoder().encode(signedMessage), signature);

  // 6. メッセージ内容検証
  const result2 = signInOutput.signedMessage === JSON.stringify(signInInput);

  const result = result1 && result2;

  if (!result) {
    return { result, error: "Signature verification failed" };
  }

  const uid = address.toString();
  const additionalClaims = {};

  try {
    const token = await admin.auth().createCustomToken(uid, additionalClaims);
    return { result, token };
  } catch (error: any) {
    logger.error(error.message);
    return { result, error: "Signature verification failed" };
  }
});
