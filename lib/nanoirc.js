/*jshint node:true */

'use strict';

require('colors');

var util = require('util'),
    readline = require('readline'),
    irc = require('irc');

function start(options) {
    var myServer = options.server || 'irc.freenode.org',
        myChannels = options.channels || ['#test-nanoirc'],
        myNick = options.nick || 'nick-nanoirc',
        myPassword = options.password || "",
        rl,
        client,
        lastChannelUsed = myChannels[0].toLowerCase(),
        completionsPerChannel = {};

    myChannels.forEach(function (channel) {
        channel = channel.toLowerCase();
        completionsPerChannel[channel] = [];
        myChannels.forEach(function (chan) {
            completionsPerChannel[channel].push(chan);
        });
    });

    function padding(i) {
        return (i < 10 ? '0' + i : String(i));
    }

    function formatter(from, me, to, text, timestamp) {
        timestamp = timestamp || new Date();

        return util.format('[%s:%s %s] <%s> %s\n',
            padding(timestamp.getHours()).yellow,
            padding(timestamp.getMinutes()).yellow,
            to.yellow,
            from.green,
            text.search(me) !== -1 ? (text.red + '\u0007') : text);
    }

    function completer(line) {
        var suggestions = completionsPerChannel[lastChannelUsed],
            hits = [];

        if (line) {
            hits = suggestions.filter(function (c) {
                return c.indexOf(line) === 0;
            });
        }

        return [hits.length ? hits : myChannels, line];
    }

    rl = readline.createInterface({
        input: process.stdin,
        output: process.stdout,
        completer: completer
    });

    rl.on('close', function () {
        console.log('Have a nice day!');
        process.exit(0);
    });

    rl.on('line', function (line) {
        var sep, chan, text;

        line = line.trim();

        if (line[0] === '#') {
            sep = line.indexOf(' ');
            chan = line.substr(0, sep);
            text = line.substr(sep + 1);
        } else {
            chan = lastChannelUsed;
            text = line;
        }

        myChannels.forEach(function (channel) {
            if (channel === chan && text) {
                client.say(channel, text);
                util.print(formatter(myNick, myNick, chan, text));
                lastChannelUsed = chan;
                rl.setPrompt(lastChannelUsed + '> ');
            }
        });

        rl.prompt(true);
    });

    rl.setPrompt(lastChannelUsed + '> ');

    function printMessage(from, me, to, text, timestamp) {
        var mess = formatter(from, myNick, to, text, timestamp);

        if (rl.line.length > 0) {
            util.print('\n' + mess + rl.line);
            rl.prompt(true);
        } else {
            util.print(mess);
        }
    }

    function removeNickFromChannel(nick, channel) {
        var index = completionsPerChannel[channel].indexOf(nick);
        completionsPerChannel[channel].splice(index, 1);
    }

    client = new irc.Client(myServer, myNick, {
        password: myPassword,
        channels: myChannels
    });

    client.addListener('error', function (message) {
        console.log('error: ', message);
    });

    client.addListener('registered', function (message) {
        myNick = message.args[0];
        console.log('Connected with ' + myNick + ' nick.');
    });

    client.addListener('join', function (channel, nick) {
        channel = channel.toLowerCase();
        if (nick === myNick) {
            console.log("Joined to " + channel + " channel.");
        } else {
            completionsPerChannel[channel].push(nick);
        }
    });

    client.addListener('message#', function (nick, to, text) {
        printMessage(nick, myNick, to, text);
    });

    client.addListener('ctcp', function (from, to, text) {
        var message = text.split(' ')[1];

        printMessage(from, myNick, to, message);
    });

    client.addListener('names', function (channel, names) {
        Object.keys(names).forEach(function (name) {
            if (name !== myNick) {
                completionsPerChannel[channel.toLowerCase()].push(name);
            }
        });
    });

    client.addListener('nick', function (oldnick, newnick, channels) {
        channels.forEach(function (channel) {
            channel = channel.toLowerCase();
            completionsPerChannel[channel].push(newnick);
            removeNickFromChannel(oldnick, channel);
        });
    });

    client.addListener('part', function (channel, nick) {
        removeNickFromChannel(nick, channel);
    });

    client.addListener('quit', function (nick, reason, channels) {
        channels.forEach(function (channel) {
            removeNickFromChannel(nick, channel.toLowerCase());
        });
    });
}
exports.start = start;
