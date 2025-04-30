import { MeshWallet } from "@meshsdk/core";
import * as fs from "node:fs";

// Generate a new wallet for Preview testnet (networkId: 0)
const wallet = new MeshWallet({
  networkId: 0,
  key: {
    type: "mnemonic",
    mnemonic: MeshWallet.generateMnemonic(),
  },
});

// Save address and signing key
const address = wallet.getUsedAddresses()[0];
const signingKey = wallet.getSigningKey();

fs.writeFileSync("me.addr", address);
fs.writeFileSync("me.sk", signingKey);
console.log(`Wallet address: ${address}`);
