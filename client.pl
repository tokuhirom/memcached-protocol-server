#!/usr/bin/env perl
use strict;
use warnings;
use utf8;
use 5.010000;
use autodie;
use Cache::Memcached::Fast;
use Cache::Memcached;
use Data::Dumper;
use Test::More;

my $memd = Cache::Memcached::Fast->new({
    servers => ['127.0.0.1:22422']
});
$memd->flush_all();
is($memd->get("YO"), undef);
is($memd->set("YO", 'HEY'), 1);
is($memd->get("YO"), 'HEY', 'get');
is($memd->delete("YO"), 1);
is($memd->get("YO"), undef);
if ($memd->can('server_versions')) {
    warn Dumper $memd->server_versions();
}
$memd->set("P", 'QQQ');
is($memd->get("P"), 'QQQ', 'get');
$memd->flush_all();
is($memd->get("P"), undef);
$memd->set("M", 1);
is($memd->incr("M", 5), 6);
is($memd->get("M"), 6);
is($memd->decr("M", 2), 4);
is($memd->get("M"), 4);
if ($memd->can('touch')) {
    ok($memd->touch("M", 59));
}


done_testing;
