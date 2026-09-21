import type { NetworkInfo, NetworkTopology } from '../types/network.js';

export function formulateNetworkTopology(hostname: string, network: NetworkInfo): NetworkTopology {
  const activeInterfaces = network.interfaces.filter((i) => i.status === 'active' && i.ipv4Addresses.length > 0);
  const subnets = new Set<string>();

  for (const iface of activeInterfaces) {
    for (const ip of iface.ipv4Addresses) {
      const parts = ip.split('.');
      if (parts.length === 4) {
        subnets.add(`${parts[0]}.${parts[1]}.${parts[2]}.0/24`);
      }
    }
  }

  const cleanHost = hostname.replace(/[^a-zA-Z0-9_-]/g, '_');
  const lines: string[] = [];

  lines.push('graph TD');
  lines.push('  %% Styles');
  lines.push('  classDef hostNode fill:#1e293b,stroke:#38bdf8,stroke-width:2px,color:#f8fafc;');
  lines.push('  classDef subnetNode fill:#0f172a,stroke:#818cf8,stroke-width:2px,color:#cbd5e1;');
  lines.push('  classDef neighborNode fill:#1e293b,stroke:#f59e0b,stroke-width:1px,color:#e2e8f0;');
  lines.push('  classDef shareNode fill:#1e293b,stroke:#10b981,stroke-width:1px,color:#86efac;');
  lines.push('  classDef portNode fill:#1e293b,stroke:#ec4899,stroke-width:1px,color:#f472b6;');

  // Host subgraph
  lines.push(`  subgraph ${cleanHost} ["🖥️ Target Host: ${hostname}"]`);
  lines.push('    direction TB');

  let ifaceIdx = 0;
  for (const iface of activeInterfaces) {
    ifaceIdx++;
    const ifaceId = `IF_${ifaceIdx}`;
    const ipStr = iface.ipv4Addresses.join(', ') || 'No IPv4';
    lines.push(`    ${ifaceId}["🌐 Interface: ${iface.name}<br/>IP: ${ipStr}"]:::hostNode`);
  }

  let shareIdx = 0;
  for (const share of network.smbShares.slice(0, 5)) {
    shareIdx++;
    const sId = `SH_${shareIdx}`;
    lines.push(`    ${sId}["📁 SMB: ${share.name}"]:::shareNode`);
    if (activeInterfaces[0]) {
      lines.push(`    IF_1 -.-> ${sId}`);
    }
  }

  let portIdx = 0;
  for (const port of network.listeningPorts.filter((p) => p.state === 'Listen').slice(0, 6)) {
    portIdx++;
    const pId = `LP_${portIdx}`;
    const proc = port.process ? ` (${port.process})` : '';
    lines.push(`    ${pId}["🔌 ${port.protocol} ${port.localPort}${proc}"]:::portNode`);
    if (activeInterfaces[0]) {
      lines.push(`    IF_1 -.-> ${pId}`);
    }
  }
  lines.push('  end');

  // Subnet and Neighbors
  let subnetIdx = 0;
  for (const subnet of subnets) {
    subnetIdx++;
    const snetId = `SNET_${subnetIdx}`;
    lines.push(`  subgraph ${snetId} ["🔗 VLAN / Subnet: ${subnet}"]`);
    lines.push('    direction LR');

    let nbrIdx = 0;
    const subnetPrefix = subnet.split('.').slice(0, 3).join('.');
    const subnetNeighbors = network.arpTable.filter((n) => n.ip.startsWith(subnetPrefix)).slice(0, 8);

    for (const nbr of subnetNeighbors) {
      nbrIdx++;
      const nId = `NBR_${subnetIdx}_${nbrIdx}`;
      lines.push(`    ${nId}["💻 Node: ${nbr.ip}<br/>MAC: ${nbr.mac}"]:::neighborNode`);
    }

    if (subnetNeighbors.length === 0) {
      lines.push(`    ${snetId}_EMPTY["No active neighbors cached"]:::neighborNode`);
    }
    lines.push('  end');

    if (activeInterfaces[0]) {
      lines.push(`  IF_1 === ${snetId}`);
    }
  }

  // LLDP Infrastructure if present
  if (network.lldpNeighbors.length > 0) {
    lines.push('  subgraph INFRA ["🏢 Infrastructure / Uplink Devices"]');
    let lldpIdx = 0;
    for (const lldp of network.lldpNeighbors) {
      lldpIdx++;
      lines.push(`    LLDP_${lldpIdx}["Switch Port: ${lldp.portId ?? 'Unknown'}"]:::neighborNode`);
      if (activeInterfaces[0]) {
        lines.push(`    IF_1 === LLDP_${lldpIdx}`);
      }
    }
    lines.push('  end');
  }

  return {
    localHost: hostname,
    mermaidDiagram: lines.join('\n'),
    activeSubnets: Array.from(subnets),
    neighborCount: network.arpTable.length,
    sharesCount: network.smbShares.length,
    listeningPortsCount: network.listeningPorts.length,
  };
}
