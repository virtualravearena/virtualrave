export type LensManagerPermissions = {
  canExecuteTransactions?: boolean;
  canTransferTokens?: boolean;
  canTransferNative?: boolean;
};

export type LensProfilePaymentAuthority = "none" | "owner" | "manager";

export type LensProfilePaymentStatus =
  | "login"
  | "reauth"
  | "connect"
  | "checking-authority"
  | "payment-disabled"
  | "not-authorized"
  | "checking-balance"
  | "insufficient-balance"
  | "owner-ready"
  | "manager-ready";

export type LensProfilePaymentReadiness = {
  status: LensProfilePaymentStatus;
  canPay: boolean;
  authority: LensProfilePaymentAuthority;
  hasEnoughBalance: boolean;
};

export function sameAddress(a: unknown, b: unknown): boolean;

export function canManagerPayFromLensProfile(
  permissions: LensManagerPermissions | null | undefined,
): boolean;

export function getLensProfilePaymentReadiness(input: {
  profileAddress?: unknown;
  ownerAddress?: unknown;
  connectedAddress?: unknown;
  managerPermissions?: LensManagerPermissions | null;
  balanceWei?: unknown;
  requiredWei?: unknown;
  needsReauth?: boolean;
  isAuthorityLoading?: boolean;
}): LensProfilePaymentReadiness;
