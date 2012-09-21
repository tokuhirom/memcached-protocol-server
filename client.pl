#!/usr/bin/env perl
use strict;
use warnings;
use utf8;
use 5.010000;
use autodie;
use Cache::Memcached::Fast;
use Data::Dumper;

my $memd = Cache::Memcached::Fast->new({
    servers => ['127.0.0.1:22422']
});
warn $memd->get("YO");
warn $memd->set("YO", 'HEY!');
warn $memd->get("YO");
warn $memd->delete("YO");
warn $memd->get("YO");
warn Dumper $memd->server_versions();

