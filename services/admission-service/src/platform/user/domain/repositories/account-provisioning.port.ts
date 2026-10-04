export interface ProvisionAccountInput {
  identifier: string
  passwordHash: string
  roleCode?: string
}

export interface ProvisionedAccount {
  id: string
}

export interface AccountLookupResult {
  identifierTaken: boolean
}

export interface AccountSummary {
  id: string
  identifier: string
  lastLoginAt: Date | null
}

export abstract class IAccountProvisioningPort {
  abstract provision(input: ProvisionAccountInput): Promise<ProvisionedAccount>
  abstract deprovision(userId: string): Promise<void>
  abstract lookup(identifier: string): Promise<AccountLookupResult>
  abstract findSummary(userId: string): Promise<AccountSummary | null>
}
