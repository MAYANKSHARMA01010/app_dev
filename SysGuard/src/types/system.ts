import { z } from 'zod';

// ---------------------------------------------------------------------------
// Hardware Info
// ---------------------------------------------------------------------------
export const HardwareInfoSchema = z.object({
  model: z.string().optional(),
  cpu: z.string().optional(),
  memoryBytes: z.number().optional(),
  memoryFormatted: z.string().optional(),
});
export type HardwareInfo = z.infer<typeof HardwareInfoSchema>;

// ---------------------------------------------------------------------------
// OS Info
// ---------------------------------------------------------------------------
export const OsInfoSchema = z.object({
  platform: z.string(),
  version: z.string().optional(),
  build: z.string().optional(),
  kernelVersion: z.string().optional(),
  architecture: z.string().optional(),
});
export type OsInfo = z.infer<typeof OsInfoSchema>;

// ---------------------------------------------------------------------------
// Installed Software
// ---------------------------------------------------------------------------
export const InstalledSoftwareSchema = z.object({
  displayName: z.string(),
  displayVersion: z.string().optional(),
  publisher: z.string().optional(),
  installDate: z.string().optional(),
  installLocation: z.string().optional(),
  vulnerabilitiesCount: z.number().default(0),
});
export type InstalledSoftware = z.infer<typeof InstalledSoftwareSchema>;

// ---------------------------------------------------------------------------
// Local Users & Groups
// ---------------------------------------------------------------------------
export const LocalUserSchema = z.object({
  name: z.string(),
  enabled: z.boolean(),
  lastLogon: z.string().nullable().optional(),
  passwordRequired: z.boolean().optional(),
});
export type LocalUser = z.infer<typeof LocalUserSchema>;

export const LocalGroupSchema = z.object({
  name: z.string(),
  description: z.string().optional(),
  members: z.array(z.string()).default([]),
});
export type LocalGroup = z.infer<typeof LocalGroupSchema>;

// ---------------------------------------------------------------------------
// Services & Processes & Startup
// ---------------------------------------------------------------------------
export const WindowsServiceSchema = z.object({
  name: z.string(),
  displayName: z.string().optional(),
  status: z.string(),
  startType: z.string().optional(),
});
export type WindowsService = z.infer<typeof WindowsServiceSchema>;

export const WindowsProcessSchema = z.object({
  id: z.number(),
  name: z.string(),
  cpu: z.number().optional(),
  workingSet: z.number().optional(),
  path: z.string().optional(),
});
export type WindowsProcess = z.infer<typeof WindowsProcessSchema>;

export const StartupItemSchema = z.object({
  name: z.string(),
  command: z.string(),
  location: z.string().optional(),
  user: z.string().optional(),
});
export type StartupItem = z.infer<typeof StartupItemSchema>;

// ---------------------------------------------------------------------------
// User Folder Items (Downloads, Documents, Desktop)
// ---------------------------------------------------------------------------
export const UserFolderItemSchema = z.object({
  folder: z.string(),
  name: z.string(),
  extension: z.string(),
  sizeBytes: z.number().optional(),
  isRiskyExtension: z.boolean().default(false),
});
export type UserFolderItem = z.infer<typeof UserFolderItemSchema>;

export const EnvironmentVariableSchema = z.object({
  name: z.string(),
  value: z.string(),
  scope: z.enum(['Machine', 'User', 'Process']),
});
export type EnvironmentVariable = z.infer<typeof EnvironmentVariableSchema>;

// ---------------------------------------------------------------------------
// System Info (top-level)
// ---------------------------------------------------------------------------
export const SystemInfoSchema = z.object({
  hostname: z.string(),
  os: OsInfoSchema,
  hardware: HardwareInfoSchema,
  uptimeSeconds: z.number().optional(),
  currentUser: z.string().optional(),
  isRoot: z.boolean(),
  installedSoftware: z.array(InstalledSoftwareSchema).optional(),
  localUsers: z.array(LocalUserSchema).optional(),
  localGroups: z.array(LocalGroupSchema).optional(),
  services: z.array(WindowsServiceSchema).optional(),
  processes: z.array(WindowsProcessSchema).optional(),
  startupItems: z.array(StartupItemSchema).optional(),
  userFolderItems: z.array(UserFolderItemSchema).optional(),
  environmentVariables: z.array(EnvironmentVariableSchema).optional(),
});
export type SystemInfo = z.infer<typeof SystemInfoSchema>;

// ---------------------------------------------------------------------------
// Advanced Security Control Schemas
// ---------------------------------------------------------------------------
export const AmsiProviderSchema = z.object({
  name: z.string(),
  guid: z.string(),
  dllPath: z.string().optional(),
  fileVersion: z.string().optional(),
  productVersion: z.string().optional(),
  companyName: z.string().optional(),
});
export type AmsiProvider = z.infer<typeof AmsiProviderSchema>;

export const DotNetVersionSchema = z.object({
  frameworkVersions: z.array(z.string()).default([]),
  coreRuntimes: z.array(z.string()).default([]),
});
export type DotNetVersion = z.infer<typeof DotNetVersionSchema>;

export const CertificateInfoSchema = z.object({
  subject: z.string(),
  issuer: z.string(),
  thumbprint: z.string(),
  notAfter: z.string(),
  isExpired: z.boolean(),
  store: z.string(),
});
export type CertificateInfo = z.infer<typeof CertificateInfoSchema>;

export const AuditPolicySchema = z.object({
  category: z.string(),
  subCategory: z.string(),
  setting: z.string(),
});
export type AuditPolicy = z.infer<typeof AuditPolicySchema>;

export const ClassicAuditRegistrySchema = z.object({
  auditBaseDirectories: z.number().optional(),
  auditBaseObjects: z.number().optional(),
  sceNoApplyLegacyAuditPolicy: z.number().optional(),
  crashOnAuditFail: z.number().optional(),
});
export type ClassicAuditRegistry = z.infer<typeof ClassicAuditRegistrySchema>;

export const GroupPolicySettingSchema = z.object({
  scope: z.enum(['Machine', 'User']),
  keyPath: z.string(),
  valueName: z.string(),
  valueData: z.string(),
  valueType: z.string().optional(),
});
export type GroupPolicySetting = z.infer<typeof GroupPolicySettingSchema>;

export const PathSecuritySchema = z.object({
  path: z.string(),
  isWritableByUsers: z.boolean().default(false),
  sddl: z.string().optional(),
});
export type PathSecurity = z.infer<typeof PathSecuritySchema>;

export const DefenderExclusionSchema = z.object({
  exclusionPaths: z.array(z.string()).default([]),
  exclusionProcesses: z.array(z.string()).default([]),
  exclusionExtensions: z.array(z.string()).default([]),
  hasExclusions: z.boolean().default(false),
});
export type DefenderExclusion = z.infer<typeof DefenderExclusionSchema>;

export const AntivirusProductSchema = z.object({
  displayName: z.string(),
  instanceGuid: z.string().optional(),
  pathToSignedProductExe: z.string().optional(),
  productState: z.number().optional(),
  enabled: z.boolean().optional(),
});
export type AntivirusProduct = z.infer<typeof AntivirusProductSchema>;

export const NtlmSettingsSchema = z.object({
  lmCompatibilityLevel: z.number().optional(),
  levelDescription: z.string().optional(),
  isVulnerableNtlmv1: z.boolean().default(false),
});
export type NtlmSettings = z.infer<typeof NtlmSettingsSchema>;

export const RdpAdvancedSchema = z.object({
  enabled: z.boolean().optional(),
  nlaRequired: z.boolean().optional(),
  portNumber: z.number().optional(),
  savedConnections: z.array(z.string()).default([]),
  incomingSessions: z.array(z.string()).default([]),
});
export type RdpAdvanced = z.infer<typeof RdpAdvancedSchema>;

export const SysmonSchema = z.object({
  installed: z.boolean().default(false),
  serviceRunning: z.boolean().default(false),
  driverRunning: z.boolean().default(false),
  configurationSchema: z.string().optional(),
  hashingAlgorithm: z.string().optional(),
  options: z.string().optional(),
  checkRevocation: z.boolean().optional(),
  parameters: z.record(z.string(), z.string()).optional(),
});
export type Sysmon = z.infer<typeof SysmonSchema>;

export const FirewallRuleSchema = z.object({
  name: z.string(),
  displayName: z.string().optional(),
  enabled: z.boolean(),
  direction: z.string(),
  action: z.string(),
  localPort: z.string().optional(),
  remotePort: z.string().optional(),
  protocol: z.string().optional(),
  isOverlyPermissive: z.boolean().default(false),
});
export type FirewallRule = z.infer<typeof FirewallRuleSchema>;

export const PsHistoryMatchSchema = z.object({
  lineNumber: z.number(),
  pattern: z.string(),
  sanitizedSnippet: z.string().optional(),
});
export type PsHistoryMatch = z.infer<typeof PsHistoryMatchSchema>;

export const PsHistorySchema = z.object({
  historyPath: z.string().optional(),
  matchCount: z.number(),
  matches: z.array(PsHistoryMatchSchema).default([]),
});
export type PsHistory = z.infer<typeof PsHistorySchema>;

// ---------------------------------------------------------------------------
// Security Controls (Top-Level)
// ---------------------------------------------------------------------------
export const SecurityInfoSchema = z.object({
  windowsFirewall: z.array(z.object({
    profile: z.string(),          // Domain | Private | Public
    enabled: z.boolean().optional(),
    defaultInbound: z.string().optional(),
    defaultOutbound: z.string().optional(),
  })).optional(),
  firewallRules: z.array(FirewallRuleSchema).optional(),
  defender: z.object({
    antivirusEnabled: z.boolean().optional(),
    antispywareEnabled: z.boolean().optional(),
    realtimeProtectionEnabled: z.boolean().optional(),
    amServiceEnabled: z.boolean().optional(),
    signatureLastUpdated: z.string().optional(),
    unavailable: z.boolean().optional(),
  }).optional(),
  defenderExclusions: DefenderExclusionSchema.optional(),
  antivirusProducts: z.array(AntivirusProductSchema).optional(),
  secureBoot: z.object({
    enabled: z.boolean().optional(),
    unsupported: z.boolean().optional(),
    rawStatus: z.string().optional(),
  }).optional(),
  uac: z.object({
    enabled: z.boolean().optional(),
    consentPromptBehavior: z.number().optional(),
    rawValues: z.record(z.string(), z.number()).optional(),
  }).optional(),
  rdp: z.object({
    enabled: z.boolean().optional(),
    rawValue: z.number().optional(),
  }).optional(),
  rdpAdvanced: RdpAdvancedSchema.optional(),
  windowsUpdates: z.object({
    hotfixes: z.array(z.object({
      hotfixId: z.string(),
      description: z.string().optional(),
      installedOn: z.string().optional(),
      installedBy: z.string().optional(),
    })).default([]),
    comUpdates: z.array(z.object({
      title: z.string(),
      date: z.string().optional(),
      description: z.string().optional(),
      operation: z.string().optional(),
      resultCode: z.string().optional(),
    })).default([]),
    count: z.number(),
    lastInstalledDate: z.string().optional(),
  }).optional(),
  psHistory: PsHistorySchema.optional(),
  amsiProviders: z.array(AmsiProviderSchema).optional(),
  dotNetVersions: DotNetVersionSchema.optional(),
  certificates: z.array(CertificateInfoSchema).optional(),
  auditPolicies: z.array(AuditPolicySchema).optional(),
  classicAuditRegistry: ClassicAuditRegistrySchema.optional(),
  pathSecurity: z.array(PathSecuritySchema).optional(),
  ntlmSettings: NtlmSettingsSchema.optional(),
  sysmon: SysmonSchema.optional(),
  groupPolicies: z.array(GroupPolicySettingSchema).optional(),
  macSecurity: z.object({
    sip: z.object({ enabled: z.boolean(), raw: z.string().optional() }).optional(),
    fileVault: z.object({ enabled: z.boolean(), raw: z.string().optional() }).optional(),
    gatekeeper: z.object({ enabled: z.boolean(), raw: z.string().optional() }).optional(),
    firewall: z.object({ enabled: z.boolean(), stealthMode: z.boolean().optional(), raw: z.string().optional() }).optional(),
    adminUsers: z.array(z.string()).optional(),
    remoteLogin: z.object({ enabled: z.boolean().optional() }).optional(),
    autoUpdate: z.object({ enabled: z.boolean().optional() }).optional(),
  }).optional(),
});
export type SecurityInfo = z.infer<typeof SecurityInfoSchema>;
