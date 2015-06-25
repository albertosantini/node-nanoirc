NANOIRC
=======

[![Build Status](https://travis-ci.org/albertosantini/node-nanoirc.png)](https://travis-ci.org/albertosantini/node-nanoirc)
[![NPM version](https://badge.fury.io/js/nanoirc.png)](http://badge.fury.io/js/nanoirc)
[![NGN Dependencies](https://david-dm.org/albertosantini/node-nanoirc.png)](https://david-dm.org/albertosantini/node-nanoirc)

nanoirc is a _very simple_ console IRC client based on [node-irc](https://github.com/martynsmith/node-irc) IRC library.

All the messages of the channels joined are displayed in the console. The user
can choice the channel pressing tab: the list of the channels is displayed. Then
the user can add the message and press enter to send it. The user may send
another message to that channel without prefixing it again with the name of the
channel: the message is sent to the last channel used.

The messages are displayed with time, channel and user info. If a message
contains the nick of the user, it is displayed in red.

Installation
============

To install with [npm](http://github.com/isaacs/npm):

    npm install -g nanoirc

Tested with Node.js 0.12.x and io.js 1.8.x.


Configuration
=============

nanoirc reads a file in the HOME directory: `.nanoirc.json`.

The configuration file contains the server, the channels, the nickname info and the colors to use for messages.

For instance,

    {
        "server": "irc.freenode.org",
        "nick": "mynick",
        "password": "mypassword",
        "channels": [
            "#test-nanoirc-1",
            "#test-nanoirc-2"
        ],
        "colors": {
            "timestamp": "yellow",
            "channel": "yellow",
            "user": "green"
        }
    }

Then you can start the client:

    nanoirc
