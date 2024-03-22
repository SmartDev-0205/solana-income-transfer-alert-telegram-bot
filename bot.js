import { Connection, PublicKey, clusterApiUrl } from "@solana/web3.js";
import { Bot } from "grammy";
import { emojiParser } from "@grammyjs/emoji";
const TG_TOKEN = "";
const CHAT_ID = "@Kingofmemesreal";
let lastBlock = 255788581;
const bot = new Bot(TG_TOKEN);

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

bot.use(emojiParser());
async function sendMessage(message, option = {}) {
  console.log("--------------- Telegram chat message ------------------");
  try {
    await bot.api.sendMessage(CHAT_ID, message, {
      ...option,
      parse_mode: "HTML",
      disable_web_page_preview: false,
    });
  } catch (e) {
    console.log(e);
    return undefined;
  }
}

function shortenAddress(fullAddress, length = 4) {
  if (fullAddress.length <= length * 2) {
    return fullAddress; // Return the original address if it's too short to be shortened
  }
  return `${fullAddress.substring(0, length)}...${fullAddress.substring(
    fullAddress.length - length
  )}`;
}

async function trackIncomeTransactions(walletAddress, maxSlot) {
  let newSlot = maxSlot;
  console.log("Running track function------------------");
  const connection = new Connection(
    "https://api.mainnet-beta.solana.com",
    "confirmed"
  );
  const publicKey = new PublicKey(walletAddress);
  const signatures = await connection.getConfirmedSignaturesForAddress2(
    publicKey,
    {
      limit: 5,
    }
  );
  // Fetch the recent transactions for the wallet
  try {
    for (let i = 0; i < signatures.length; i++) {
      let signatureInfo = signatures[i];
      const transaction = await connection.getParsedTransaction(
        signatureInfo.signature,
        { maxSupportedTransactionVersion: 0 }
      );
      if (signatureInfo.slot <= maxSlot) {
        await sleep(5000);
        break;
      }
      if (newSlot < signatureInfo.slot) newSlot = signatureInfo.slot;
      let transactionIncome = false;
      let amount = 0;
      let senderAddress = "";

      // Check each transaction to see if it's an income transaction
      for (let instruction of transaction.transaction.message.instructions) {
        if (
          instruction.parsed &&
          instruction.parsed.type === "transfer" &&
          instruction.parsed.info.destination === walletAddress
        ) {
          transactionIncome = true;
          amount = instruction.parsed.info.lamports;
          senderAddress = instruction.parsed.info.source;
          break; // Assuming only one income transfer per transaction for simplicity
        }
      }

      if (transactionIncome) {
        console.log("senderAddress:", senderAddress);
        console.log(`Income Transaction Found: ${signatureInfo.signature}`);
        console.log(`Slot: ${signatureInfo.slot}`);
        console.log(`Amount: ${amount / 1e9} lamports`);
        const balance = await connection.getBalance(publicKey);
        let message = "🔥 $KPEPE Buy Bot🔥\n\n";
        message += `💰 Amount:  ${amount / 1e9} Sol\n\n`;
        message += `🏆 Buyer : <a href="https://solscan.io/account/${senderAddress}"> ${shortenAddress(
          senderAddress
        )}</a>\n\n`;
        message += `🏆 Receiver : <a href="https://solscan.io/account/${walletAddress}"> ${shortenAddress(
          walletAddress
        )}</a>\n\n`;

        message += `💰 Total Raised:  ${balance / 1e9} Sol\n\n`;

        message += `✈️ Tx : <a href="https://solscan.io/tx//${
          signatureInfo.signature
        }"> ${shortenAddress(signatureInfo.signature, 10)}</a>\n\n`;

        message += `Buy now 💰 Send $SOL to : <a href="https://solscan.io/account/${walletAddress}"> ${shortenAddress(
          walletAddress,
          4
        )}</a>\n\n`;

        sendMessage(message);
      }

      await sleep(5000);
    }
  } catch (error) {
    console.log(error);
  }

  lastBlock = newSlot;
  console.log("new slot", newSlot);
}
setInterval(() => {
  trackIncomeTransactions(
    "BWck2JedKAi6fE99dvEFvgBU1RN9UukBuVo2fBjkUbra",
    lastBlock
  );
}, 60000);
