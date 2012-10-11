NANOIRC
=======

nanoirc is a very simple console IRC client based on [node-stream-irc](https://github.com/jslush/node-irc-stream) IRC library.

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

- Add auto completion for a user in a channel: at the moment it is loaded a list
  of users, but nick/join/part events are not handled.

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
        "nick": "imynick",
        "channels": [
            "#test-nanoirc-1",
            "#test-nanoirc-2"
        ]
    }

Then you can start the client:

    nanoirc


Notes
=====

However this app is not yet available in the npm registry. You should install it
manually, cloning the repository and adding the dependencies (node-stream-irc,
event-stream and colors).
