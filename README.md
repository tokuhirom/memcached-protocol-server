memcached protocol server framework
===================================

This is a memcached protocol server framework.

You can implement a server, supports memcached protocol.

So, it means you can write a KVS supports memcached protocol, very easy.

You can see a more concrete example in eg/memd.js.

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
