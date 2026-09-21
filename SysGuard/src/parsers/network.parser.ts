import type {
  NetworkInfo,
  ListeningPort,
  EstablishedConnection,
  ArpEntry,
  NetworkInterface,
  SmbShare,
  DnsInfo,
} from '../types/network.js';
import type { NetworkRaw } from '../collectors/network.js';

export function parseNetwork(raw: NetworkRaw): NetworkInfo {
  const listeningPorts: ListeningPort[] = [];
  const establishedConnections: EstablishedConnection[] = [];
  const arpTable: ArpEntry[] = [];
  const interfaces: NetworkInterface[] = [];
  const smbShares: SmbShare[] = [];

  // 1. Parse lsof TCP listening ports
  const seenPorts = new Set<string>();
  const lsofLines = (raw.lsofPorts ?? '').split('\n');
  for (const line of lsofLines) {
    if (line.startsWith('COMMAND') || !line.trim()) continue;
    const parts = line.trim().split(/\s+/);
    if (parts.length >= 9) {
      const processName = parts[0] ?? 'unknown';
      const pid = parseInt(parts[1] ?? '0', 10);
      const user = parts[2];
      const namePart = parts[8] ?? '';
      const colonIdx = namePart.lastIndexOf(':');
      if (colonIdx !== -1) {
        const address = namePart.slice(0, colonIdx) === '*' ? '0.0.0.0' : namePart.slice(0, colonIdx);
        const port = parseInt(namePart.slice(colonIdx + 1), 10);
        const key = `TCP:${address}:${port}`;
        if (!isNaN(port) && !seenPorts.has(key)) {
          seenPorts.add(key);
          listeningPorts.push({
            protocol: 'TCP',
            localAddress: address,
            localPort: port,
            state: 'Listen',
            pid,
            process: processName,
            user,
          });
        }
      }
    }
  }

  // 2. Parse lsof UDP endpoints
  const lsofUdpLines = (raw.lsofUdp ?? '').split('\n');
  for (const line of lsofUdpLines) {
    if (line.startsWith('COMMAND') || !line.trim()) continue;
    const parts = line.trim().split(/\s+/);
    if (parts.length >= 8) {
      const processName = parts[0] ?? 'unknown';
      const pid = parseInt(parts[1] ?? '0', 10);
      const user = parts[2];
      const namePart = parts[7] ?? parts[8] ?? '';
      const colonIdx = namePart.lastIndexOf(':');
      if (colonIdx !== -1) {
        const address = namePart.slice(0, colonIdx) === '*' ? '0.0.0.0' : namePart.slice(0, colonIdx);
        const port = parseInt(namePart.slice(colonIdx + 1), 10);
        const key = `UDP:${address}:${port}`;
        if (!isNaN(port) && !seenPorts.has(key)) {
          seenPorts.add(key);
          listeningPorts.push({
            protocol: 'UDP',
            localAddress: address,
            localPort: port,
            state: 'Listen',
            pid,
            process: processName,
            user,
          });
        }
      }
    }
  }

  // 3. Parse lsof established connections
  const lsofEstLines = (raw.lsofEstablished ?? '').split('\n');
  for (const line of lsofEstLines) {
    if (line.startsWith('COMMAND') || !line.trim()) continue;
    const parts = line.trim().split(/\s+/);
    if (parts.length >= 9) {
      const processName = parts[0] ?? 'unknown';
      const pid = parseInt(parts[1] ?? '0', 10);
      const user = parts[2];
      const arrowPart = parts[8] ?? '';
      if (arrowPart.includes('->')) {
        const [local, remote] = arrowPart.split('->');
        const [lAddr, lPortStr] = (local ?? '').split(':');
        const [rAddr, rPortStr] = (remote ?? '').split(':');
        const lPort = parseInt(lPortStr ?? '0', 10);
        const rPort = parseInt(rPortStr ?? '0', 10);

        if (lAddr && rAddr && !isNaN(lPort) && !isNaN(rPort)) {
          establishedConnections.push({
            protocol: 'TCP',
            localAddress: lAddr,
            localPort: lPort,
            remoteAddress: rAddr,
            remotePort: rPort,
            state: 'Established',
            pid,
            process: processName,
            user,
          });
        }
      }
    }
  }

  // 4. Parse ifconfig
  const ifBlocks = (raw.ifconfig ?? '').split(/(?=^[a-z0-9]+\s*:\s*flags)/im);
  for (const block of ifBlocks) {
    const firstLine = block.trim().split('\n')[0] ?? '';
    const nameMatch = firstLine.match(/^([a-z0-9]+):/i);
    if (!nameMatch || !nameMatch[1]) continue;

    const name = nameMatch[1];
    const isUp = firstLine.toLowerCase().includes('up');
    const isLoopback = firstLine.toLowerCase().includes('loopback');
    const status = isUp ? 'active' : 'inactive';

    const ipv4: string[] = [];
    const ipv6: string[] = [];
    let mac = '';

    for (const line of block.split('\n')) {
      const trimmed = line.trim();
      if (trimmed.startsWith('inet ')) {
        const ip = trimmed.split(/\s+/)[1];
        if (ip) ipv4.push(ip);
      } else if (trimmed.startsWith('inet6 ')) {
        const ip6 = trimmed.split(/\s+/)[1]?.replace(/%.+$/, '');
        if (ip6) ipv6.push(ip6);
      } else if (trimmed.startsWith('ether ')) {
        mac = trimmed.split(/\s+/)[1] ?? '';
      }
    }

    if (!isLoopback) {
      interfaces.push({
        name,
        displayName: `Network Interface (${name})`,
        macAddress: mac || '00:00:00:00:00:00',
        status,
        ipv4Addresses: ipv4,
        ipv6Addresses: ipv6,
      });
    }
  }

  // 5. Parse arp -an
  const arpLines = (raw.arpTable ?? '').split('\n');
  for (const line of arpLines) {
    const match = line.match(/\(([\d.]+)\)\s+at\s+([0-9a-fA-F:]+)\s+on\s+([a-z0-9]+)/i);
    if (match && match[1] && match[2] && match[3]) {
      const ip = match[1];
      const mac = match[2];
      const iface = match[3];
      if (mac.toLowerCase() !== '(incomplete)' && mac.toLowerCase() !== 'ff:ff:ff:ff:ff:ff') {
        arpTable.push({
          ip,
          mac,
          interface: iface,
          ipAddress: ip,
          macAddress: mac,
          interfaceName: iface,
        } as any);
      }
    }
  }

  // 6. Parse SMB / sharing shares
  if (raw.shares) {
    for (const line of raw.shares.split('\n')) {
      const trimmed = line.trim();
      if (trimmed && !trimmed.startsWith('name') && !trimmed.includes('----')) {
        const parts = trimmed.split(/\s{2,}/);
        if (parts[0]) {
          smbShares.push({
            name: parts[0],
            path: parts[1] ?? '/SharedItems',
            description: 'macOS File Sharing',
          });
        }
      }
    }
  }

  // 7. Parse DNS
  const dnsServers: string[] = [];
  let searchDomains: string[] = [];
  if (raw.dnsConfig) {
    for (const line of raw.dnsConfig.split('\n')) {
      const matchIp = line.match(/nameserver\[\d+\]\s*:\s*([\d.]+)/);
      if (matchIp && matchIp[1] && !dnsServers.includes(matchIp[1])) {
        dnsServers.push(matchIp[1]);
      }
      const matchDom = line.match(/domain\[\d+\]\s*:\s*(\S+)/);
      if (matchDom && matchDom[1]) {
        searchDomains.push(matchDom[1]);
      }
    }
  }

  const dns: DnsInfo = {
    nameservers: dnsServers,
    searchDomains: [...new Set(searchDomains)],
  };

  return {
    interfaces,
    listeningPorts,
    establishedConnections,
    arpTable,
    dns,
    dnsCacheEntries: [],
    smbShares,
    networkProfiles: [],
    rpcEndpoints: [],
    lldpNeighbors: [],
  };
}
