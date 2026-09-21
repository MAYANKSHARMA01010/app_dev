import { runCommand } from '../core/command-runner.js';
import { ok, failed } from '../types/collector.js';
import type { CollectorResult } from '../types/collector.js';

export interface NetworkRaw {
  lsofPorts: string;
  lsofEstablished: string;
  lsofUdp: string;
  ifconfig: string;
  arpTable: string;
  dnsConfig: string;
  shares: string;
}

export async function collectNetworkRaw(): Promise<CollectorResult<NetworkRaw>> {
  try {
    const [
      lsofRes,
      lsofEstRes,
      lsofUdpRes,
      ifconfigRes,
      arpRes,
      dnsRes,
      sharesRes,
    ] = await Promise.all([
      runCommand('lsof', ['-nP', '-iTCP', '-sTCP:LISTEN']),
      runCommand('lsof', ['-nP', '-iTCP', '-sTCP:ESTABLISHED']),
      runCommand('lsof', ['-nP', '-iUDP']),
      runCommand('ifconfig', []),
      runCommand('arp', ['-an']),
      runCommand('scutil', ['--dns']),
      runCommand('sharing', ['-l']),
    ]);

    const data: NetworkRaw = {
      lsofPorts: lsofRes.data ?? '',
      lsofEstablished: lsofEstRes.data ?? '',
      lsofUdp: lsofUdpRes.data ?? '',
      ifconfig: ifconfigRes.data ?? '',
      arpTable: arpRes.data ?? '',
      dnsConfig: dnsRes.data ?? '',
      shares: sharesRes.data ?? '',
    };
    return ok(data);
  } catch (err) {
    return failed(err as Error);
  }
}
