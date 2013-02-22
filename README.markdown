NANOIRC
=======

nanoirc is a _very simple_ console IRC client based on [node-irc](https://github.com/martynsmith/node-irc) IRC library.

As reference on stream programming I recommend [the stream handbook](https://github.com/substack/stream-handbook).

All the messages of the channels joined are displayed in the console. The user
can choice the channel pressing tab: the list of the channels is displayed. Then
the user can add the message and press enter to send it. The user may send
another message to that channel without prefixing it again with the name of the
channel: the message is sent to the last channel used.

The messages are displayed with time, channel and user info. If a message
contains the nick of the user, it is displayed in red.


Todo
====

- Manage the syndicated urls in the channel: maybe opening automatically the
  link.


Installation
============

To install with [npm](http://github.com/isaacs/npm):

    npm install -g nanoirc

Tested with node 0.8.x.


Configuration
=============

nanoirc reads a file in the HOME directory: .nanoirc.json.

The configuration file contains the server, the channels and the nickname info.

For instance,

    {
        "server": "irc.freenode.org",
        "nick": "mynick",
        "password": "mypassword",
        "channels": [
            "#test-nanoirc-1",
            "#test-nanoirc-2"
        ]
    }

Then you can start the client:

    nanoirc
