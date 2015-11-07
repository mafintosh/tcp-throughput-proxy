# tcp-throughput-proxy

Proxy that allows you to monitor how much incoming trafic it is receiving.

```
npm install -g tcp-throughput-proxy
```

## Usage

``` sh
# start a proxy listening on port 10000 proxing to localhost:20000
tcp-throughput-proxy --from 10000 --to localhost:20000
```

Optionally if you only want to monitor throughput and not proxy anywhere

``` sh
# just monitor throughput
tcp-throughput-proxy --from 10000
```

Then to start monitoring throughput connect to the monitor server.
Per default the monitor is listening on the `from` port + 1.
To connect to it simply open a tcp connection to the monitor server

``` sh
# attach to the monitor server
nc localhost 10001
```

The monitor server should start printing out stats in the following format

```
0 open connetions
Receiving 0 b/s
```

If you open up another tpc connection to the proxy server and start writing
data you should see the receive speed go up. For example to write a bunch of random
data to it do

``` sh
# pipe a bunch of random data to the proxy
cat /dev/random | nc localhost 10000
```

## License

MIT
