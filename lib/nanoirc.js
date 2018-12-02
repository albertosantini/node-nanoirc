"use strict";

require("colors");

const util = require("util");
const readline = require("readline");
const irc = require("irc-upd");

process.on("uncaughtException", err => {
    console.log(err.message);
    console.log("(^C again to quit)");
});

const defaults = {
    server: "irc.freenode.org",
    nick: "nick-nanoirc",
    password: "nomoresecrets",
    channels: {
        "irc.freenode.org": [
            "#test-nanoirc"
        ]
    },
    showJoinMessages: true,
    showPartMessages: true,
    colors: {
        timestamp: "yellow",
        channel: "yellow",
        user: "green",
        mentions: "red"
    }
};

function start({ options = defaults, server = "irc.freenode.org" } = {}) {
    let myNick = options.nick;

    const myServer = server || options.server;
    const myPassword = options.password;
    const myChannels = options.channels[myServer];
    const myColors = options.colors;
    const showJoinMessages = options.showJoinMessages;
    const showPartMessages = options.showPartMessages;

    const completionsPerChannel = {};

    const client = new irc.Client(myServer, myNick, {
        password: myPassword,
        channels: myChannels
    });

    const rl = readline.createInterface({
        input: process.stdin,
        output: process.stdout,
        completer
    });

    let lastChannelUsed = myChannels[0].toLowerCase();

    myChannels.forEach(ch => {
        const channel = ch.toLowerCase();

        completionsPerChannel[channel] = [];
        myChannels.forEach(chan => {
            completionsPerChannel[channel].push(chan);
        });
    });

    function formatter(from, me, to, text = "", timestamp = new Date()) {
        return util.format("[%s:%s %s] <%s> %s\n",
            timestamp.getHours().toString().padStart(2, "0")[myColors.timestamp],
            timestamp.getMinutes().toString().padStart(2, "0")[myColors.timestamp],
            to ? to[myColors.channel] : myServer,
            from ? from[myColors.user] : myServer,
            text.search(me) !== -1 ? `${text[myColors.mentions]}\u0007` : text);
    }

    function completer(line) {
        const suggestions = completionsPerChannel[lastChannelUsed];

        let hits = [];

        if (line) {
            hits = suggestions.filter(c => c.indexOf(line) === 0);
        }

        return [hits.length ? hits : myChannels, line];
    }

    rl.on("close", () => {
        throw new Error("Have a nice day!");
    });

    rl.on("line", rawLine => {
        let sep, chan, text;

        const line = rawLine.trim();
        const isCommand = line[0] === "/";
        const isCommandJoin = isCommand && line.slice(1, 5) === "join";
        const isCommandPart = isCommand && line.slice(1, 5) === "part";
        const isChannel = line[0] === "#";

        if (isCommandJoin) {
            sep = line.indexOf(" ");
            chan = line.slice(sep + 1);
            client.join(chan);
            completionsPerChannel[chan] = [];
            completionsPerChannel[chan].push(chan);
            rl.setPrompt(`${chan}> `);
        } else if (isCommandPart) {
            if (myChannels.length > 1) {
                sep = line.indexOf(" ");
                chan = line.slice(sep + 1);
                client.part(chan);
                delete myChannels[chan];
                rl.setPrompt(`${myChannels[0].toLowerCase()}> `);
            }
        } else if (isChannel) {
            sep = line.indexOf(" ");
            chan = line.slice(0, sep);
            text = line.slice(sep + 1);
        } else {
            chan = lastChannelUsed;
            text = line;
        }

        myChannels.forEach(channel => {
            if (channel === chan && text) {
                client.say(channel, text);
                process.stdout.write(formatter(myNick, myNick, chan, text));
                lastChannelUsed = chan;
                rl.setPrompt(`${lastChannelUsed}> `);
            }
        });

        rl.prompt(true);
    });

    rl.setPrompt(`${lastChannelUsed}> `);

    function printMessage({ from = null, me = null, to = null, text = "", timestamp = new Date() } = {}) {
        const message = formatter(from, me, to, text, timestamp);

        readline.cursorTo(process.stdout, 0);
        process.stdout.write(message);
        rl.prompt(true);
    }

    function removeNickFromChannel(nick, channel) {
        const index = completionsPerChannel[channel].indexOf(nick);

        completionsPerChannel[channel].splice(index, 1);
    }

    console.log(`Connecting to ${myServer[myColors.channel]}...`);

    client.addListener("error", message => {
        console.log("error: ", message);
    });

    client.addListener("registered", message => {
        myNick = message.args[0];
        console.log(`Connected as ${myNick[myColors.user]}`);
    });

    client.addListener("join", (ch, nick) => {
        const channel = ch.toLowerCase();

        if (nick === myNick) {
            printMessage({ to: nick, text: `Joined ${channel[myColors.channel]}` });
        } else {
            if (showJoinMessages) {
                const message = util.format("%s joined %s\n", nick[myColors.user], channel[myColors.channel]);

                printMessage({ to: channel[myColors.channel], text: message });
            }

            if (Object.prototype.hasOwnProperty.call(completionsPerChannel, channel)) {
                completionsPerChannel[channel].push(nick);
            } else {
                completionsPerChannel[channel] = [];
                completionsPerChannel[channel].push(nick);
            }
        }
    });

    client.addListener("motd", motd => {
        console.log(motd.grey);
    });

    client.addListener("message#", (nick, to, text) => {
        printMessage({ from: nick, me: myNick, to, text });
    });

    client.addListener("ctcp", (from, to, text) => {
        const message = text.split(" ")[1];

        printMessage({ from, me: myNick, to, text: message });
    });

    client.addListener("names", (ch, names) => {
        Object.keys(names).forEach(name => {
            const channel = ch.toLowerCase();

            if (name !== myNick) {
                if (Object.prototype.hasOwnProperty.call(completionsPerChannel, channel)) {
                    completionsPerChannel[channel].push(name);
                } else {
                    completionsPerChannel[channel] = [];
                    completionsPerChannel[channel].push(name);
                }
            }
        });
    });

    client.addListener("nick", (oldnick, newnick, channels) => {
        channels.forEach(ch => {
            const channel = ch.toLowerCase();

            completionsPerChannel[channel].push(newnick);
            removeNickFromChannel(oldnick, channel);
        });
    });

    client.addListener("part", (channel, nick, reason) => {
        if (showPartMessages) {
            const message = util.format("%s left %s%s\n", nick[myColors.user], channel[myColors.channel], reason ? `(${reason.grey})` : "");

            printMessage({ to: channel[myColors.channel], text: message });
        }

        removeNickFromChannel(nick, channel.toLowerCase());
    });

    client.addListener("quit", (nick, reason, channels) => {
        if (showPartMessages) {
            const message = util.format("%s quit %s\n", nick[myColors.user], reason ? `(${reason.grey})` : "");

            printMessage({ text: message });
        }

        channels.forEach(channel => {
            removeNickFromChannel(nick, channel.toLowerCase());
        });
    });
}

exports.start = start;
