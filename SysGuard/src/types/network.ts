import { z } from 'zod';

// ---------------------------------------------------------------------------
// Network Interface
// ---------------------------------------------------------------------------
export const NetworkInterfaceSchema = z.object({
  name: z.string(),
  displayName: z.string().optional(),
  hardwarePort: z.string().optional(),
  macAddress: z.string().optional(),
  ipv4Addresses: z.array(z.string()).default([]),
  ipv6Addresses: z.array(z.string()).default([]),
  status: z.enum(['active', 'inactive', 'unknown']).default('unknown'),
  physicalMediaType: z.string().optional(),
  linkSpeed: z.string().optional(),
  mediaConnectionState: z.string().optional(),
});
export type NetworkInterface = z.infer<typeof NetworkInterfaceSchema>;

// ---------------------------------------------------------------------------
// Listening Port
// ---------------------------------------------------------------------------
export const ListeningPortSchema = z.object({
  pid: z.number().optional(),
  process: z.string().optional(),
  service: z.string().optional(),
  user: z.string().optional(),
  protocol: z.enum(['TCP', 'UDP']),
  localAddress: z.string(),
  localPort: z.number(),
  state: z.string().optional(),
});
export type ListeningPort = z.infer<typeof ListeningPortSchema>;

// ---------------------------------------------------------------------------
// Established Connection
// ---------------------------------------------------------------------------
export const EstablishedConnectionSchema = z.object({
  pid: z.number().optional(),
  process: z.string().optional(),
  service: z.string().optional(),
  user: z.string().optional(),
  protocol: z.string().optional(),
  localAddress: z.string(),
  localPort: z.number(),
  remoteAddress: z.string(),
  remotePort: z.number(),
  state: z.string().optional(),
});
export type EstablishedConnection = z.infer<typeof EstablishedConnectionSchema>;

// ---------------------------------------------------------------------------
// ARP Entry
// ---------------------------------------------------------------------------
export const ArpEntrySchema = z.object({
  ip: z.string(),
  mac: z.string(),
  interface: z.string().optional(),
});
export type ArpEntry = z.infer<typeof ArpEntrySchema>;

// ---------------------------------------------------------------------------
// DNS Info
// ---------------------------------------------------------------------------
export const DnsInfoSchema = z.object({
  nameservers: z.array(z.string()).default([]),
  searchDomains: z.array(z.string()).default([]),
});
export type DnsInfo = z.infer<typeof DnsInfoSchema>;

// ---------------------------------------------------------------------------
// DNS Cache Entry (Windows)
// ---------------------------------------------------------------------------
export const DnsCacheEntrySchema = z.object({
  entry: z.string(),
  recordName: z.string(),
  recordType: z.number().optional(),
  timeToLive: z.number().optional(),
});
export type DnsCacheEntry = z.infer<typeof DnsCacheEntrySchema>;

// ---------------------------------------------------------------------------
// SMB Share (Windows)
// ---------------------------------------------------------------------------
export const SmbShareSchema = z.object({
  name: z.string(),
  path: z.string().optional(),
  description: z.string().optional(),
});
export type SmbShare = z.infer<typeof SmbShareSchema>;

// ---------------------------------------------------------------------------
// Network Connection Profile (Windows)
// ---------------------------------------------------------------------------
export const NetworkProfileSchema = z.object({
  name: z.string(),
  category: z.string().optional(),  // DomainAuthenticated | Private | Public
  interfaceAlias: z.string().optional(),
});
export type NetworkProfile = z.infer<typeof NetworkProfileSchema>;

// ---------------------------------------------------------------------------
// RPC Endpoint (Windows)
// ---------------------------------------------------------------------------
export const RpcEndpointSchema = z.object({
  interfaceUuid: z.string().optional(),
  protocol: z.string().optional(),
  endpoint: z.string(),
  annotation: z.string().optional(),
});
export type RpcEndpoint = z.infer<typeof RpcEndpointSchema>;

// ---------------------------------------------------------------------------
// LLDP / CDP Infrastructure Neighbor (Windows)
// ---------------------------------------------------------------------------
export const LldpNeighborSchema = z.object({
  chassisId: z.string().optional(),
  systemName: z.string().optional(),
  portId: z.string().optional(),
  portDescription: z.string().optional(),
});
export type LldpNeighbor = z.infer<typeof LldpNeighborSchema>;

// ---------------------------------------------------------------------------
// Network Topology Representation
// ---------------------------------------------------------------------------
export const NetworkTopologySchema = z.object({
  localHost: z.string(),
  mermaidDiagram: z.string(),
  activeSubnets: z.array(z.string()).default([]),
  neighborCount: z.number().default(0),
  sharesCount: z.number().default(0),
  listeningPortsCount: z.number().default(0),
});
export type NetworkTopology = z.infer<typeof NetworkTopologySchema>;

// ---------------------------------------------------------------------------
// Network Info (top-level)
// ---------------------------------------------------------------------------
export const NetworkInfoSchema = z.object({
  interfaces: z.array(NetworkInterfaceSchema).default([]),
  listeningPorts: z.array(ListeningPortSchema).default([]),
  establishedConnections: z.array(EstablishedConnectionSchema).default([]),
  arpTable: z.array(ArpEntrySchema).default([]),
  dns: DnsInfoSchema.optional(),
  dnsCacheEntries: z.array(DnsCacheEntrySchema).default([]),
  smbShares: z.array(SmbShareSchema).default([]),
  networkProfiles: z.array(NetworkProfileSchema).default([]),
  rpcEndpoints: z.array(RpcEndpointSchema).default([]),
  lldpNeighbors: z.array(LldpNeighborSchema).default([]),
  topology: NetworkTopologySchema.optional(),
});
export type NetworkInfo = z.infer<typeof NetworkInfoSchema>;
