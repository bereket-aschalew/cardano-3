import * as fs from "node:fs";
import {
  BlockfrostProvider,
  MeshTxBuilder,
  MeshWallet,
  serializePlutusScript,
  UTxO,
} from "@meshsdk/core";
import { applyParamsToScript } from "@meshsdk/core-csl";
import blueprint from "./plutus.json";

const blockchainProvider = new BlockfrostProvider(
  process.env.BLOCKFROST_PROJECT_ID!
);

// Wallet for signing transactions
const wallet = new MeshWallet({
  networkId: 0, // Preview testnet
  fetcher: blockchainProvider,
  submitter: blockchainProvider,
  key: {
    type: "root",
    bech32: fs.readFileSync("me.sk").toString(),
  },
});

// Get validator script and address
function getScript() {
  const scriptCbor = applyParamsToScript(
    blueprint.validators[0].compiledCode,
    []
  );
  const scriptAddr = serializePlutusScript(
    { code: scriptCbor, version: "V3" },
    undefined,
    0 // Preview testnet
  ).address;
  return { scriptCbor, scriptAddr };
}

// Get transaction builder
function getTxBuilder() {
  return new MeshTxBuilder({
    fetcher: blockchainProvider,
    submitter: blockchainProvider,
  });
}

// Lock 2 tADA
async function lock() {
  const { scriptAddr } = getScript();
  const txBuilder = getTxBuilder();
  const walletAddress = wallet.getUsedAddresses()[0];
  const owner = wallet.getPaymentCredential().hash;

  const tx = await txBuilder
    .txOut(scriptAddr, [{ unit: "lovelace", quantity: "2000000" }])
    .txOutDatumValue({
      owner: `keyHash-${owner}`,
    })
    .changeAddress(walletAddress)
    .selectUtxosFrom(await wallet.getUtxos())
    .complete();

  const signedTx = await wallet.signTx(tx);
  const txHash = await wallet.submitTx(signedTx);
  console.log(`2 tADA locked into the contract\n\tTx ID: ${txHash}`);
}

lock().catch(console.error);
