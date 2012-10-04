/*jslint node:true, unparam:true */

'use strict';

var util = require('util'),
    readline = require('readline'),
    colors = require('colors'),
    IRC = require('irc-stream');

function start(options) {
    var myServer = options.server || 'irc.freenode.org',
        myChannels = options.channels || ['#test-nanoirc'],
        myNick = options.nick || 'nick-nanoirc',
        rl,
        client,
        lastChannelUsed = myChannels[0];

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
        var hits = myChannels.filter(function (c) {
            return c.indexOf(line) === 0;
        });

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

    client = new IRC()
        .set('nick', myNick)
        .set('address', myServer)
        // .use('logger')
        .connect(function () {
            myNick = this.nick;
            console.log('Connected with ' + myNick+ ' nick.');

            myChannels.forEach(function (channel) {
                client.join(channel, function (ch) {
                    console.log("Joined to " + ch.name + " channel.");
                });
            });

            rl.setPrompt(lastChannelUsed + '> ');

            client.on('message#', function (from, to, text, msg) {
                var mess = formatter(from, myNick, to, text, msg.timestamp);


                if (rl.line.length > 0) {
                    util.print('\n' + mess + rl.line);
                    rl.prompt(true);
                } else {
                    util.print(mess);
                }
            });
        });
}
exports.start = start;
