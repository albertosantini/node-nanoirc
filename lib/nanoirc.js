"use strict";

require("colors");

const util = require("util"),
    readline = require("readline"),
    irc = require("irc");

// default colors used when user does not define their own
const defaultColors = {
    timestamp: "yellow",
    channel: "yellow",
    user: "green",
    mentions: "red"
};

process.on("uncaughtException", err => {
    console.log(err);
    console.log("(^C again to quit)");
});

function start(options, server) {
    let myNick = options.nick || "nick-nanoirc";

    const myServer = server ? server : options.server || "irc.freenode.org",
        myChannels = options.channels[myServer] || ["#test-nanoirc"],

        myPassword = options.password || "",
        myColors = options.colors || defaultColors,
        showJoinMessages = options.showJoinMessages,
        showPartMessages = options.showPartMessages,
        completionsPerChannel = {},
        client = new irc.Client(myServer, myNick, {
            password: myPassword,
            channels: myChannels
        }),
        rl = readline.createInterface({
            input: process.stdin,
            output: process.stdout,
            completer
        });

    let lastChannelUsed = myChannels[0].toLowerCase();

    myChannels.forEach(channel => {
        channel = channel.toLowerCase();
        completionsPerChannel[channel] = [];
        myChannels.forEach(chan => {
            completionsPerChannel[channel].push(chan);
        });
    });

    function padding(x) {
        return (`0${x}`).slice(-2);
    }

    function formatter(from, me, to, text, timestamp) {
        timestamp = timestamp || new Date();

        return util.format("[%s:%s %s] <%s> %s\n",
            padding(timestamp.getHours())[myColors.timestamp],
            padding(timestamp.getMinutes())[myColors.timestamp],
            to[myColors.channel],
            from[myColors.user],
            text.search(me) !== -1 ? (`${text[myColors.mentions]}\u0007`) : text
        );
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
        throw "Have a nice day!";
    });

    rl.on("line", line => {
        let sep, chan, text;

        line = line.trim();

        if (line[0] === "/" && line.substr(1, 4) === "join") {
            sep = line.indexOf(" ");
            chan = line.substr(sep + 1);
            client.join(chan);
            completionsPerChannel[chan] = [];
            completionsPerChannel[chan].push(chan);
            rl.setPrompt(`${chan}> `);
        } else if (line[0] === "/" && line.substr(1, 4) === "part") {
            if (myChannels.length > 1) {
                sep = line.indexOf(" ");
                chan = line.substr(sep + 1);
                client.part(chan);
                delete myChannels[chan];
                rl.setPrompt(`${myChannels[0].toLowerCase()}> `);
            }
        } else if (line[0] === "#") {
            sep = line.indexOf(" ");
            chan = line.substr(0, sep);
            text = line.substr(sep + 1);
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

    function writeLine(message) {
        if (rl.line && rl.line.length > 0) {
            process.stdout.write(`\n${message}${rl.line}`);
            rl.prompt(true);
        } else {
            process.stdout.write(message);
        }
    }

    function printMessage(from, me, to, text, timestamp) {
        const mess = formatter(from, myNick, to, text, timestamp);

        writeLine(mess);
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

    client.addListener("join", (channel, nick) => {
        channel = channel.toLowerCase();
        if (nick === myNick) {
            console.log(`Joined ${channel[myColors.channel]}`);
        } else {
            if (showJoinMessages) {
                const message = util.format(
                    "%s joined %s\n",
                    nick[myColors.user],
                    channel[myColors.channel]
                );

                writeLine(message);
            }

            if (completionsPerChannel.hasOwnProperty(channel)) {
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
        printMessage(nick, myNick, to, text);
    });

    client.addListener("ctcp", (from, to, text) => {
        const message = text.split(" ")[1];

        printMessage(from, myNick, to, message);
    });

    client.addListener("names", (channel, names) => {
        Object.keys(names).forEach(name => {
            channel = channel.toLowerCase();
            if (name !== myNick) {
                if (completionsPerChannel.hasOwnProperty(channel)) {
                    completionsPerChannel[channel].push(name);
                } else {
                    completionsPerChannel[channel] = [];
                    completionsPerChannel[channel].push(name);
                }
            }
        });
    });

    client.addListener("nick", (oldnick, newnick, channels) => {
        channels.forEach(channel => {
            channel = channel.toLowerCase();
            completionsPerChannel[channel].push(newnick);
            removeNickFromChannel(oldnick, channel);
        });
    });

    client.addListener("part", (channel, nick, reason) => {
        if (showPartMessages) {
            const message = util.format(
                "%s left %s%s\n",
                nick[myColors.user],
                channel[myColors.channel],
                reason ? `(${reason.grey})` : ""
            );

            writeLine(message);
        }

        removeNickFromChannel(nick, channel.toLowerCase());
    });

    client.addListener("quit", (nick, reason, channels) => {
        if (showPartMessages) {
            const message = util.format(
                "%s quit %s\n",
                nick[myColors.user],
                reason ? `(${reason.grey})` : ""
            );

            writeLine(message);
        }

        channels.forEach(channel => {
            removeNickFromChannel(nick, channel.toLowerCase());
        });
    });
}

exports.start = start;
