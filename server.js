/*jshint node: true */
"use strict";
var net = require('net');
var events =  require('events');

var TextParser = {
    get: function (buffer, self, csock) {
        var get = buffer.match(/^get ([^\r\n]+)\r\n/);
        if (get) {
            return [buffer.slice(get[0].length), 'GET', [get[1].split(' ')]];
        }
        return [buffer];
    },
    set: function (buffer, self, csock) {
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
                return [buffer.slice(cmd[0].length + bytes + 2), cmd[1].toUpperCase(), [key, flags, exptime, data, !!cmd[6]]];
            }
        }
        return [buffer];
    },
    'delete': function (buffer, self, csock) {
        var del = buffer.match(/^delete ([^ \r\n]+)( noreply)?\r\n/);
        if (del) {
            return [buffer.slice(del[0].length), 'DELETE', [del[1], !!del[2]]];
        }
        return [buffer];
    },
    'stats': function (buffer, self, csock) {
        var stats = buffer.match(/^stats(?: ([^\r\n]+))\r\n/);
        if (stats) {
            return [buffer.slice(stats[0].length), 'STATS', [stats[1]]];
        }
        return [buffer];
    },
    'quit': function (buffer, self, csock) {
        var quit = buffer.match(/^quit\r\n/);
        if (quit) {
            return [buffer.slice(quit[0].length), 'QUIT', []];
        }
        return [buffer];
    },
    verbosity: function (buffer, self, csock) {
        var m = buffer.match(/^verbosity ([0-9]+)( noreply)?\r\n/);
        if (m) {
            return [buffer.slice(m[0].length), 'VERBOSITY', [parseInt(m[1], 10), !!m[2]]];
        }
        return [buffer];
    },
    flush_all: function (buffer, self, csock) {
        var m = buffer.match(/^flush_all(?: ([0-9]+))( noreply)?\r\n/);
        if (m) {
            var delay = parseInt(m[1], 10);
            return [buffer.slice(m[0].length), 'FLUSH_ALL', [delay, !!m[2]]];
        }
        return [buffer];
    },
    incr: function (buffer, self, csock) {
        var m = buffer.match(/^(incr|decr) ([^ \r\n]+) ([0-9]+)( noreply)?\r\n/);
        if (m) {
            var key = m[2];
            var value = parseInt(m[3], 10);
            return [buffer.slice(m[0].length), m[1].toUpperCase(), [key, value, !!m[4]]];
        }
        return [buffer];
    },
    touch: function (buffer, self, csock) {
        var m = buffer.match(/^touch ([^ \r\n]+) ([0-9]+)( noreply)?\r\n/);
        if (m) {
            var key = m[1];
            var exptime = parseInt(m[2], 10);
            return [buffer.slice(m[0].length), 'TOUCH', [key, exptime, !!m[3]]];
        }
        return [buffer];
    },
    version: function (buffer, self, csock) {
        var version = buffer.match(/^version\r\n/);
        if (version) {
            return [buffer.slice(version[0].length), 'VERSION', []];
        }
        return [buffer];
    }
};
['add', 'replace', 'append', 'prepend'].forEach(function (e) {
    TextParser[e] = TextParser.set;
});
TextParser.decr = TextParser.incr;

function MemcachedProtocolServer(cb) {
    var self = this;
    this.handlers = {};
    this.setHandlers(MemcachedProtocolServer.defaultHandlers);
    this.server = net.createServer(function (sock) {
        var csock = new MemcachedProtocolServerSocket(sock);
        sock.setEncoding('utf-8');
        var buffer = '';
        sock.on('data', function (d) {
            buffer += d;

            var m = buffer.match(/^([a-z_]+)/);
            if (m) {
                if (TextParser[m[0]]) {
                    var ret = TextParser[m[0]](buffer, self, csock);
                    if (ret.length > 1) {
                        ret[2].unshift(csock);
                        self.handlers[ret[1]].apply(self, ret[2]);
                    }
                    buffer = ret[0];
                } else {
                    console.log("Unknown: " + m[0]);
                    csock.sendServerError("Unknown command");
                }
            }
            // note: we need to limit a buffer size?
        });
        sock.on('error', function (e) {
            self.emit('error', e);
        });
        sock.on('end', function () {
            self.emit('end');
        });
    });
}
MemcachedProtocolServer.prototype = new events.EventEmitter();
MemcachedProtocolServer.prototype.listen = function (port, host) {
    this.server.listen(port, host);
};
MemcachedProtocolServer.prototype.setHandlers  = function (map) {
    var self = this;
    Object.keys(map).forEach(function (type) {
        self.handlers[type] = map[type];
    });
};
MemcachedProtocolServer.defaultHandlers = {
    SET: function (sock, key, flags, exptime, data, noreply) {
        if (!noreply) {
            sock.sendServerError("Not implemented.");
        }
    },
    APPEND: function (sock, key, flags, exptime, data, noreply) {
        if (!noreply) {
            sock.sendServerError("Not implemented.");
        }
    },
    REPLACE: function (sock, key, flags, exptime, data, noreply) {
        if (!noreply) {
            sock.sendServerError("Not implemented.");
        }
    },
    PREPEND: function (sock, key, flags, exptime, data, noreply) {
        if (!noreply) {
            sock.sendServerError("Not implemented.");
        }
    },
    GET: function (sock, keys) {
        sock.sendServerError("Not implemented.");
    },
    DELETE: function (sock, key, noreply) {
        if (!noreply) {
            sock.sendServerError("Not implemented.");
        }
    },
    GETS: function (sock, keys) {
        sock.sendServerError("Not implemented.");
    },
    STATS: function (sock, args) {
        sock.sendServerError("Not implemented.");
    },
    QUIT: function (sock) {
        sock.close();
    },
    VERSION: function (sock) {
        sock.sendServerError("Not implemented.");
    },
    INCR: function (sock, key, value, noreply) {
        if (!noreply) {
            sock.sendServerError("Not implemented.");
        }
    },
    DECR: function (sock, key, value, noreply) {
        if (!noreply) {
            sock.sendServerError("Not implemented.");
        }
    },
    VERBOSITY: function (sock, verbosity, noreply) {
        if (!noreply) {
            sock.sendOK();
        }
    },
    FLUSH_ALL: function (sock, delay, noreply) {
        if (!noreply) {
            sock.sendOK();
        }
    },
    TOUCH: function (sock, key, exptime, noreply) {
        if (!noreply) {
            sock.sendServerError("Not implemented.");
        }
    }
};

function MemcachedProtocolServerSocket(sock) {
    this.sock = sock;
}
MemcachedProtocolServerSocket.prototype = {
    close: function () {
        this.sock.close();
    },
    sendStat: function (name, value) {
        this.sock.write("STAT " + name + " " + value + "\r\n");
    },
    sendTouch: function () {
        this.sock.write("TOUCHED\r\n");
    },
    sendError: function () {
        this.sock.write("ERROR\r\n");
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
    sendOK: function () {
        this.sock.write("OK\r\n");
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

module.exports = {
    Socket: MemcachedProtocolServerSocket,
    Server: MemcachedProtocolServer,
    TextParser: TextParser
};

var server = new MemcachedProtocolServer();
server.on('error', function (e) {
    console.log("Socket error!!: " + e);
});
server.on('end', function () {
    console.log("END!!");
});
server.setHandlers({
    GET: function (sock, keys) {
        var self = this;
        keys.forEach(function (key) {
            if (self.storage[key]) {
                var entry = self.storage[key];
                sock.sendValue(key, entry[0], entry[1]);
            }
        });
        sock.sendEnd();
    },
    SET: function (sock, key, flags, exptime, data, noreply) {
        var self = this;
        self.storage[key] = [flags, data];
        if (!noreply) {
            sock.sendStored();
        }
    },
    DELETE: function (sock, key, noreply) {
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
    },
    DECR: function (sock, key, value, noreply) {
        if (this.storage[key]) {
            var v = parseInt(this.storage[key][1], 10);
            this.storage[key][1] = '' + (v - value);
            if (!noreply) {
                sock.write(''+(v-value)+"\r\n");
            }
        } else {
            if (!noreply) {
                sock.sendNotFound();
            }
        }
    },
    INCR: function (sock, key, value, noreply) {
        if (this.storage[key]) {
            var v = parseInt(this.storage[key][1], 10);
            this.storage[key][1] = '' + (v + value);
            if (!noreply) {
                sock.write(''+(v+value)+"\r\n");
            }
        } else {
            if (!noreply) {
                sock.sendNotFound();
            }
        }
    },
    VERSION: function (sock) {
        sock.sendVersion("4649");
    },
    FLUSH_ALL: function (sock, delay, noreply) {
        this.storage = {};
        if (!noreply) {
            sock.sendOK();
        }
    }
});
server.listen(22422);
