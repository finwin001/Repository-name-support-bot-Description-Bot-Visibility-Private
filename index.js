const { Client, GatewayIntentBits, ChannelType } = require("discord.js");
const { google } = require("googleapis");
require("dotenv").config();

const client = new Client({
intents: [GatewayIntentBits.Guilds]
});

const DISCORD_TOKEN = process.env.DISCORD_TOKEN;
const FORUM_CHANNEL_ID = process.env.FORUM_CHANNEL_ID;
const SPREADSHEET_ID = process.env.SPREADSHEET_ID;

const auth = new google.auth.GoogleAuth({
keyFile: "/etc/secrets/credentials.json",
scopes: ["https://www.googleapis.com/auth/spreadsheets.readonly"]
});

let processedRows = 1;

async function getRows() {
const sheets = google.sheets({
version: "v4",
auth
});

const response = await sheets.spreadsheets.values.get({
spreadsheetId: SPREADSHEET_ID,
range: "フォームの回答 1"
});

return response.data.values || [];
}

async function createForumPost(category, name, content) {
const channel = await client.channels.fetch(FORUM_CHANNEL_ID);

if (!channel || channel.type !== ChannelType.GuildForum) {
console.log("フォーラムチャンネルが見つかりません");
return;
}

await channel.threads.create({
name: `${category} - ${name}`,
message: {
content: content
}
});

console.log(`作成: ${category} - ${name}`);
}

async function checkSheet() {
try {
const rows = await getRows();

```
if (rows.length <= processedRows) return;

for (let i = processedRows; i < rows.length; i++) {
  const row = rows[i];

  const category = row[1] || "不明";

  const name =
    row[2] ||
    row[5] ||
    row[7] ||
    row[11] ||
    row[14] ||
    row[16] ||
    row[18] ||
    "不明";

  let content = `📩 新しい問い合わせ\n\n`;
  content += `👤 名前: ${name}\n`;
  content += `📂 種類: ${category}\n\n`;

  if (category.includes("荒らし")) {
    content += `🚨 荒らし報告\n`;
    content += `対象: ${row[3] || "なし"}\n`;
    content += `詳細: ${row[4] || "なし"}`;
  }

  else if (category.includes("規約違反")) {
    content += `⚠ 規約違反報告\n`;
    content += `対象: ${row[8] || "なし"}\n`;
    content += `違反内容: ${row[9] || "なし"}\n`;
    content += `詳細: ${row[10] || "なし"}`;
  }

  else if (category.includes("ロールバック")) {
    content += `📦 ロールバック申請\n`;
    content += `詳細: ${row[15] || "なし"}`;
  }

  else if (category.includes("バグ")) {
    content += `🐛 バグ報告\n`;
    content += `内容: ${row[6] || "なし"}`;
  }

  else {
    content += `📝 内容: ${row[17] || "なし"}`;
  }

  await createForumPost(category, name, content);
}

processedRows = rows.length;
```

} catch (err) {
console.error(err);
}
}

client.once("ready", () => {
console.log(`${client.user.tag} 起動完了`);

checkSheet();

setInterval(() => {
checkSheet();
}, 30000);
});

client.login(DISCORD_TOKEN);
