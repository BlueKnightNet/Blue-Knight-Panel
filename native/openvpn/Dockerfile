FROM alpine:3.22
RUN apk add --no-cache openvpn easy-rsa iptables openssl iproute2
COPY entrypoint.sh /usr/local/bin/blueknight-openvpn
RUN chmod 755 /usr/local/bin/blueknight-openvpn
EXPOSE 1194/udp
ENTRYPOINT ["/usr/local/bin/blueknight-openvpn"]
