/*jshint node: true */
"use strict";
var net = require('net');
var events =  require('events');
var util = require('util');
var inherits = require('inherits');

function MemcachedProtocolServer(cb) {
    var self = this;
    this.server = net.createServer(function (sock) {
        var csock = new MemcachedProtocolServerSocket(sock);
        sock.setEncoding('utf-8');
        var buffer = '';
        sock.on('data', function (d) {
            buffer += d;

            var get = buffer.match(/^get ([^\r\n]+)\r\n/);
            if (get) {
                self.GET(csock, get[1].split(' '));
                buffer = buffer.slice(get[0].length);
                return;
            }

            // <command name> <key> <flags> <exptime> <bytes> [noreply]\r\n
            // - <command name> is "set", "add", "replace", "append" or "prepend"
            var cmd = buffer.match(/^(set|add|replace|append|prepend) ([^ \r\n]+) ([0-9]+) ([0-9]+) ([0-9]+)( noreply)?\r\n/);
            if (cmd) {
                var key = cmd[2];
                var flags = parseInt(cmd[3], 10);
                var exptime = parseInt(cmd[4], 10);
                var bytes = parseInt(cmd[5], 10);
                if (buffer.length - cmd[0].length >= bytes + 2) {
                    var data = buffer.slice(cmd[0].length, cmd[0].length+bytes);
                    self[cmd[1].toUpperCase()](csock, key, flags, exptime, data, !!cmd[6]);
                    buffer = buffer.slice(cmd[0].length + bytes + 2);
                    return;
                } else {
                    return;
                }
            }

            var del = buffer.match(/^delete ([^ \r\n]+)( noreply)?\r\n/);
            if (del) {
                self.DELETE(csock, del[1], !!del[2]);
                buffer = buffer.slice(del[0].length);
                return;
            }

            var stats = buffer.match(/^stats(?: ([^\r\n]+))\r\n/);
            if (stats) {
                self.STATS(csock, stats[1]);
                buffer = buffer.slice(stats[0].length);
                return;
            }

            var quit = buffer.match(/^quit\r\n/);
            if (quit) {
                self.QUIT(csock);
                buffer = buffer.slice(quit[0].length);
                return;
            }

            var version = buffer.match(/^version\r\n/);
            if (version) {
                self.VERSION(csock);
                buffer = buffer.slice(version[0].length);
                return;
            }
        });
        sock.on('end', function () {
            console.log("END");
        });
    });
}
MemcachedProtocolServer.prototype.listen = function (port, host) {
    this.server.listen(port, host);
};
MemcachedProtocolServer.prototype.SET = function (sock, key, flags, exptime, data, noreply) {
    sock.sendServerError("Not implemented.");
};
MemcachedProtocolServer.prototype.APPEND = function (sock, key, flags, exptime, data, noreply) {
    sock.sendServerError("Not implemented.");
};
MemcachedProtocolServer.prototype.REPLACE = function (sock, key, flags, exptime, data, noreply) {
    sock.sendServerError("Not implemented.");
};
MemcachedProtocolServer.prototype.PREPEND = function (sock, key, flags, exptime, data, noreply) {
    sock.sendServerError("Not implemented.");
};
MemcachedProtocolServer.prototype.GET = function (sock, keys) {
    sock.sendServerError("Not implemented.");
};
MemcachedProtocolServer.prototype.DELETE = function (sock, key, noreply) {
    sock.sendServerError("Not implemented.");
};
MemcachedProtocolServer.prototype.GETS = function (sock, keys) {
    sock.sendServerError("Not implemented.");
};
MemcachedProtocolServer.prototype.STATS = function (sock, args) {
    sock.sendServerError("Not implemented.");
};
MemcachedProtocolServer.prototype.QUIT = function (sock) {
    sock.close();
};
MemcachedProtocolServer.prototype.VERSION = function (sock) {
    sock.sendServerError("Not implemented.");
};

function MemcachedProtocolServerSocket(sock) {
    this.sock = sock;
}
MemcachedProtocolServerSocket.prototype = {
    close: function () {
        this.sock.close();
    },
    sendEnd: function () {
        this.sock.write("END\r\n");
    },
    sendStored: function () {
        this.sock.write("STORED\r\n");
    },
    sendDeleted: function () {
        this.sock.write("DELETED\r\n");
    },
    sendNotStored: function () {
        this.sock.write("NOT_STORED\r\n");
    },
    sendExists: function () {
        this.sock.write("EXISTS\r\n");
    },
    sendNotFound: function () {
        this.sock.write("NOT_FOUND\r\n");
    },
    sendServerError: function (error) {
        // "SERVER_ERROR <error>\r\n"
        this.write("SERVER_ERROR " + error + "\r\n");
    },
    sendClientError: function (error) {
        this.write("CLIENT_ERROR " + error + "\r\n");
    },
    sendValue: function (key, flags, data_block, cas_unique) {
        // VALUE <key> <flags> <bytes> [<cas unique>]\r\n
        // <data block>\r\n
        var buf = "VALUE " + key + " " + flags + " " + data_block.length;
        if (typeof cas_unique !== 'undefined') {
            buf += cas_unique;
        }
        buf += "\r\n" + data_block + "\r\n";
        this.write(buf);
    },
    sendVersion: function (version) {
        this.write("VERSION " + version + "\r\n");
    },
    write: function (data) {
        this.sock.write(data);
    }
};

function MyServer() {
    MemcachedProtocolServer.apply(this);
    this.storage = {};
}
MyServer.prototype.GET = function (sock, keys) {
    var self = this;
    keys.forEach(function (key) {
        if (self.storage[key]) {
            var entry = self.storage[key];
            sock.sendValue(key, entry[0], entry[1]);
        }
    });
    sock.sendEnd();
};
MyServer.prototype.SET = function (sock, key, flags, exptime, data, noreply) {
    var self = this;
    self.storage[key] = [flags, data];
    console.log("SET!");
    if (!noreply) {
        sock.sendStored();
        sock.sendEnd();
    }
};
MyServer.prototype.DELETE = function (sock, key, noreply) {
    if (this.storage[key]) {
        delete this.storage[key];
        if (!noreply) {
            sock.sendDeleted();
        }
    } else {
        if (!noreply) {
            sock.sendNotFound();
        }
    }
};
MyServer.prototype.VERSION = function (sock) {
    sock.sendVersion("4649");
};
inherits(MyServer, MemcachedProtocolServer);

var server = new MyServer();
server.listen(22422);
