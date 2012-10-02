/*jslint node:true, unparam:true */

'use strict';

var util = require('util'),
    readline = require('readline'),
    colors = require('colors'),
    IRC = require('irc-stream');

function padding(i) {
    return (i < 10 ? '0' + i : String(i));
}

function formatter(timestamp, from, me, to, text) {
    timestamp = timestamp || new Date();

    return util.format('[%s:%s %s] <%s> %s\n',
        padding(timestamp.getHours()).yellow,
        padding(timestamp.getMinutes()).yellow,
        to.yellow,
        from.green,
        text.search(me) !== -1 ? (text.red + '\u0007') : text);
}

function start(options) {
    var myServer = options.server || 'irc.freenode.org',
        myChannels = options.channels || ['#test-nanoirc'],
        myNick = options.nick || 'nick-nanoirc',
        rl,
        client,
        lastChannelUsed;

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

    client = new IRC()
        .set('nick', myNick)
        .set('address', myServer)
        // .use('logger')
        .connect(function () {

            myChannels.forEach(function (channel) {
                client.join(channel, function (ch) {
                    rl.on('line', function (line) {
                        var sep, chan, text;

                        line = line.trim();

                        if (line[0] === '#') {
                            sep = line.indexOf(' ');
                            chan = line.substr(0, sep);
                            text = line.substr(sep + 1);
                        } else {
                            if (lastChannelUsed) {
                                chan = lastChannelUsed;
                            } else {
                                chan = myChannels[0];
                            }
                            text = line;
                        }

                        if (ch.name === chan && text) {
                            ch.write(text);
                            util.print(formatter(null, myNick, myNick,
                                chan, text));
                            lastChannelUsed = chan;
                        }
                    });
                });
            });

            client.on('message#', function (from, to, text, msg) {
                var mess = formatter(msg.timestamp, from, myNick, to, text);

                if (rl.line.length > 0) {
                    util.print('\n' + mess + rl.line);
                } else {
                    util.print(mess);
                }
            });
        });
}
exports.start = start;
