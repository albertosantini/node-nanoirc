/*jslint node:true */

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
        .input('floodprotection', {interval: 2000, maxFlood: 3})
        .use('exception-handler')
        .use('message-stream')
        .connect(function () {

            function formatMessage(from, to, text) {
                var now = new Date(),
                    hour = now.getHours(),
                    minute = now.getMinutes(),
                    channel = to,
                    nick = from,
                    mess;

                hour = hour < 10 ? '0' + hour : hour;
                minute = minute < 10 ? '0' + minute : minute;

                mess = ('[' + hour + ':' + minute + ' ' + channel + '] ').yellow
                    + ('<' + nick + '> ').green
                    + (text.search(myNick) !== -1 ?
                            (text.red + '\u0007') : text);

                return mess;
            }

            myChannels.forEach(function (channel) {
                client.join(channel, function (ch) {
                    rl.on('line', function (line) {
                        var sep, chan, text, mess;

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
                            mess = formatMessage(myNick, chan, text);
                            util.print(mess + '\n');
                            lastChannelUsed = chan;
                        }
                    });
                });
            });

            client.on('message#', function (from, to, text) {
                var mess = formatMessage(from, to, text);

                if (rl.line.length > 0) {
                    util.print('\n' + mess + '\n' + rl.line);
                } else {
                    util.print(mess + '\n');
                }
            });
        });
}
exports.start = start;
