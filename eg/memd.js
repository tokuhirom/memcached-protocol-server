/**
 * This is an example server to implement memcached like on-memory KVS
 * with MemcachedProtocolServer.
 */

var Server = require('../index.js').Server;

var server = new Server();
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
server.storage = {};
server.listen(22422);
