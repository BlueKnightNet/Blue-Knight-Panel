#!/bin/sh
set -eu
umask 077
: "${VPN_HOST:?VPN_HOST is required}"
case "$VPN_HOST" in *[!a-zA-Z0-9.-]*|-*) echo 'Invalid VPN_HOST' >&2; exit 1;; esac
test -c /dev/net/tun || { echo '/dev/net/tun is required' >&2; exit 1; }
export EASYRSA_PKI=/etc/openvpn/pki EASYRSA_BATCH=1 EASYRSA_ALGO=ec EASYRSA_CURVE=prime256v1
EASYRSA=/usr/share/easy-rsa/easyrsa
if [ ! -f "$EASYRSA_PKI/ca.crt" ]; then
  "$EASYRSA" init-pki
  EASYRSA_REQ_CN=BlueKnight-CA "$EASYRSA" build-ca nopass
fi
if [ ! -f "$EASYRSA_PKI/issued/server.crt" ]; then "$EASYRSA" build-server-full server nopass; fi
if [ ! -f "$EASYRSA_PKI/issued/client.crt" ]; then "$EASYRSA" build-client-full client nopass; fi
if [ ! -f /etc/openvpn/tls-crypt.key ]; then openvpn --genkey secret /etc/openvpn/tls-crypt.key; fi
cat > /etc/openvpn/server.conf <<'EOF'
port 1194
proto udp
dev tun0
topology subnet
server 10.8.0.0 255.255.255.0
ca /etc/openvpn/pki/ca.crt
cert /etc/openvpn/pki/issued/server.crt
key /etc/openvpn/pki/private/server.key
dh none
tls-crypt /etc/openvpn/tls-crypt.key
tls-version-min 1.2
data-ciphers AES-256-GCM:AES-128-GCM:CHACHA20-POLY1305
auth SHA256
remote-cert-tls client
push "redirect-gateway def1"
push "dhcp-option DNS 1.1.1.1"
push "block-ipv6"
keepalive 10 120
persist-key
persist-tun
user nobody
group nobody
verb 3
EOF
mkdir -p /clients
{
  printf 'client\ndev tun\nproto udp\nremote %s 1194\n' "$VPN_HOST"
  printf 'resolv-retry infinite\nnobind\npersist-key\npersist-tun\nremote-cert-tls server\nverify-x509-name server name\ntls-version-min 1.2\ndata-ciphers AES-256-GCM:AES-128-GCM:CHACHA20-POLY1305\nauth SHA256\nverb 3\n'
  printf '<ca>\n'; cat "$EASYRSA_PKI/ca.crt"; printf '</ca>\n<cert>\n'
  sed -n '/-----BEGIN CERTIFICATE-----/,/-----END CERTIFICATE-----/p' "$EASYRSA_PKI/issued/client.crt"
  printf '</cert>\n<key>\n'; cat "$EASYRSA_PKI/private/client.key"
  printf '</key>\n<tls-crypt>\n'; cat /etc/openvpn/tls-crypt.key; printf '</tls-crypt>\n'
} > /clients/client.ovpn.tmp
chown 1000:1000 /clients /clients/client.ovpn.tmp
chmod 700 /clients
chmod 600 /clients/client.ovpn.tmp
mv /clients/client.ovpn.tmp /clients/client.ovpn
iptables -t nat -C POSTROUTING -s 10.8.0.0/24 -o eth0 -j MASQUERADE 2>/dev/null || iptables -t nat -A POSTROUTING -s 10.8.0.0/24 -o eth0 -j MASQUERADE
iptables -C FORWARD -i tun0 -j ACCEPT 2>/dev/null || iptables -A FORWARD -i tun0 -j ACCEPT
iptables -C FORWARD -o tun0 -m conntrack --ctstate RELATED,ESTABLISHED -j ACCEPT 2>/dev/null || iptables -A FORWARD -o tun0 -m conntrack --ctstate RELATED,ESTABLISHED -j ACCEPT
exec openvpn --config /etc/openvpn/server.conf
