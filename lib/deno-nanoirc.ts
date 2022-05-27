// https://github.com/jeromeludmann/deno-irc
// https://github.com/jozsefsallai/ask

import { Client } from "https://deno.land/x/irc/mod.ts";

const client = new Client({
  nick: "bot-deno1",
  // server: "irc.freenode.org",
  password: "!astronomy!",
  channels: ["#test"],
});

client.on("motd", (msg) => {
  console.log(msg.params.motd);
});

client.on("join", (msg) => {
  if (msg.params.channel === "#test") {
    client.privmsg("#test", "Hello world!");
  }

  setTimeout(() => {
    client.quit();
  }, 10000);
});

await client.connect("irc.freenode.org", 6697, true);
