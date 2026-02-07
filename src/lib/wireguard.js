import nacl from "tweetnacl";

// WireGuard uses Curve25519 keys.
// tweetnacl.box.keyPair() gives X25519 keys (works for WG style base64 keys).

function toB64(u8) {
  return btoa(String.fromCharCode(...u8));
}

export function generateWgKeypair() {
  const kp = nacl.box.keyPair();
  return {
    privateKey: toB64(kp.secretKey),
    publicKey: toB64(kp.publicKey),
  };
}

export function buildWgConfig({
  clientPrivateKey,
  clientAddress, // e.g. "10.8.0.10/32"
  dns, // e.g. "1.1.1.1"
  serverPublicKey,
  endpoint, // e.g. "vpn.example.com:51820"
  allowedIps, // e.g. "0.0.0.0/0, ::/0"
  persistentKeepalive = 25,
}) {
  return `[Interface]
PrivateKey = ${clientPrivateKey}
Address = ${clientAddress}
DNS = ${dns}

[Peer]
PublicKey = ${serverPublicKey}
Endpoint = ${endpoint}
AllowedIPs = ${allowedIps}
PersistentKeepalive = ${persistentKeepalive}
`;
}

export function downloadTextFile(filename, text) {
  const blob = new Blob([text], { type: "text/plain" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}
