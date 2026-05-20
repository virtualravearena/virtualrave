function normalizeAddress(value) {
  return typeof value === "string" && /^0x[a-fA-F0-9]{40}$/.test(value)
    ? value.toLowerCase()
    : null;
}

export function sameAddress(a, b) {
  const left = normalizeAddress(a);
  const right = normalizeAddress(b);
  return Boolean(left && right && left === right);
}

export function canManagerPayFromLensProfile(permissions) {
  return Boolean(
    permissions?.canExecuteTransactions &&
      permissions?.canTransferTokens &&
      permissions?.canTransferNative,
  );
}

export function getLensProfilePaymentReadiness({
  profileAddress,
  ownerAddress,
  connectedAddress,
  managerPermissions,
  balanceWei,
  requiredWei,
  needsReauth = false,
  isAuthorityLoading = false,
}) {
  if (!normalizeAddress(profileAddress)) {
    return {
      status: "login",
      canPay: false,
      authority: "none",
      hasEnoughBalance: false,
    };
  }

  if (needsReauth) {
    return {
      status: "reauth",
      canPay: false,
      authority: "none",
      hasEnoughBalance: false,
    };
  }

  if (!normalizeAddress(connectedAddress)) {
    return {
      status: "connect",
      canPay: false,
      authority: "none",
      hasEnoughBalance: false,
    };
  }

  if (isAuthorityLoading) {
    return {
      status: "checking-authority",
      canPay: false,
      authority: "none",
      hasEnoughBalance: false,
    };
  }

  const isOwner = sameAddress(connectedAddress, ownerAddress);
  const managerCanPay = canManagerPayFromLensProfile(managerPermissions);
  const authority = isOwner ? "owner" : managerCanPay ? "manager" : "none";

  if (authority === "none") {
    return {
      status: managerPermissions ? "payment-disabled" : "not-authorized",
      canPay: false,
      authority,
      hasEnoughBalance: false,
    };
  }

  if (typeof balanceWei !== "bigint" || typeof requiredWei !== "bigint") {
    return {
      status: "checking-balance",
      canPay: false,
      authority,
      hasEnoughBalance: false,
    };
  }

  const hasEnoughBalance = balanceWei >= requiredWei;
  if (!hasEnoughBalance) {
    return {
      status: "insufficient-balance",
      canPay: false,
      authority,
      hasEnoughBalance,
    };
  }

  return {
    status: authority === "owner" ? "owner-ready" : "manager-ready",
    canPay: true,
    authority,
    hasEnoughBalance,
  };
}
