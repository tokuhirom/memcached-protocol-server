memcached protocol server framework
===================================

This is a memcached protocol server framework.

You can implement a server, supports memcached protocol.

So, it means you can write a KVS supports memcached protocol, very easy.

SYNOPSIS
--------

    /**
     * This is an example server to implement memcached like on-memory KVS
     * with MemcachedProtocolServer.
     */

    var Server = require('../index.js').Server;

    var port = process.argv[2] || 22422;

    var server = new Server();
    server.on('error', function (e) {
        console.log("# Socket error!!: " + e);
    });
    server.on('end', function () {
        console.log("# END!!");
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
    server.listen(port);

Classes
-------

### require('memcached-protocol-server').Server

#### var new Server();

Create a new instance of server.

#### server.listen(port[, host])

Listen the port.

#### server.setHandlers(handlermap)

Set a command handler in Object. For more details, please see a eg/memd.js and library source code itself.

### require('memcached-protocol-server').Socket

This is a client connection socket object. You don't need create this object. MemcachedProtocolServer passes this type of object to your handler.

This object provides a lot of methods to say memcached protocol. But you need to study only two methods simply, It's 'close' and 'write'. Another methods are wrapper of 'write'.

#### sock.close()

Close a client socket.

#### sock.write()

Write a data to socket.

#### sock.sendStat(name, value)

Send a stat line.

#### sock.sendTouch()

Synonym of

        sock.write("TOUCHED\r\n");

#### sock.sendError:()

        sock.write("ERROR\r\n");

#### sock.sendEnd()

        sock.write("END\r\n");

#### sock.sendStored()

        sock.write("STORED\r\n");

#### sock.sendDeleted()

        sock.write("DELETED\r\n");

#### sock.sendNotStored()

        sock.write("NOT_STORED\r\n");

#### sock.sendExists()

        sock.write("EXISTS\r\n");

#### sock.sendOK()

        sock.write("OK\r\n");

#### sock.sendNotFound()

        sock.write("NOT_FOUND\r\n");

#### sock.sendServerError(error)

        sock.write("SERVER_ERROR " + error + "\r\n");

#### sock.sendClientError(error)

        sock.write("CLIENT_ERROR " + error + "\r\n");

#### sock.sendValue(key, flags, data\_block[, cas_unique])

It sends following command for 'get' command.

    // VALUE <key> <flags> <bytes> [<cas unique>]\r\n
    // <data block>\r\n

#### sock.sendVersion(version)

        sock.write("VERSION " + version + "\r\n");

SEE ALSO
--------

https://github.com/memcached/memcached/blob/master/doc/protocol.txt
