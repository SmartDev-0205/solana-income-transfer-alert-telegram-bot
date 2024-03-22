import {
  closeAccount,
  createInitializeMintInstruction,
  createInitializeMintCloseAuthorityInstruction,
  getMintLen,
  ExtensionType,
  TOKEN_2022_PROGRAM_ID,
} from "@solana/spl-token";
import {
  clusterApiUrl,
  sendAndConfirmTransaction,
  Connection,
  Keypair,
  SystemProgram,
  Transaction,
  LAMPORTS_PER_SOL,
} from "@solana/web3.js";

(async () => {
  let secretKey = Uint8Array.from([94,170,49,253,158,38,54,57,5,86,201,170,143,209,237,81,42,97,122,246,16,25,180,54,28,23,86,32,59,11,64,164,236,101,65,164,55,91,143,120,14,191,27,93,78,154,252,175,124,204,240,175,222,106,109,155,79,206,239,241,111,245,11,120]); 
  let payer  = Keypair.fromSecretKey(secretKey);

  const mintKeypair = Keypair.generate();
  const mint = mintKeypair.publicKey;
  console.log("mint address", mintKeypair);
  const mintAuthority = Keypair.generate();
  const freezeAuthority = Keypair.generate();
  const closeAuthority = Keypair.generate();

  const connection = new Connection(clusterApiUrl("devnet"), "confirmed");

//   const airdropSignature = await connection.requestAirdrop(
//     payer.publicKey,
//     2 * LAMPORTS_PER_SOL
//   );
//   await connection.confirmTransaction({
//     signature: airdropSignature,
//     ...(await connection.getLatestBlockhash()),
//   });

  const extensions = [ExtensionType.MintCloseAuthority];
  const mintLen = getMintLen(extensions);
  const lamports = await connection.getMinimumBalanceForRentExemption(mintLen);

  const transaction = new Transaction().add(
    SystemProgram.createAccount({
      fromPubkey: payer.publicKey,
      newAccountPubkey: mint,
      space: mintLen,
      lamports,
      programId: TOKEN_2022_PROGRAM_ID,
    }),
    createInitializeMintCloseAuthorityInstruction(
      mint,
      closeAuthority.publicKey,
      TOKEN_2022_PROGRAM_ID
    ),
    createInitializeMintInstruction(
      mint,
      9,
      mintAuthority.publicKey,
      freezeAuthority.publicKey,
      TOKEN_2022_PROGRAM_ID
    )
  );
  await sendAndConfirmTransaction(
    connection,
    transaction,
    [payer, mintKeypair],
    undefined
  );
})();
