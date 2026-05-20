const LENS_API_URL = "https://api.lens.xyz/graphql";

const ACCOUNT_QUERY = `
  query AccountAuthorityAccount($accountRequest: AccountRequest!) {
    account(request: $accountRequest) {
      address
      owner
    }
  }
`;

const ACCOUNTS_AVAILABLE_QUERY = `
  query AccountAuthorityAvailable(
    $accountRequest: AccountRequest!
    $availableRequest: AccountsAvailableRequest!
  ) {
    account(request: $accountRequest) {
      address
      owner
    }
    accountsAvailable(request: $availableRequest) {
      items {
        __typename
        ... on AccountManaged {
          account {
            address
          }
          permissions {
            canExecuteTransactions
            canTransferTokens
            canTransferNative
            canSetMetadataUri
          }
        }
        ... on AccountOwned {
          account {
            address
          }
        }
      }
      pageInfo {
        next
      }
    }
  }
`;

type LensManagerPermissions = {
  canExecuteTransactions: boolean;
  canTransferTokens: boolean;
  canTransferNative: boolean;
  canSetMetadataUri: boolean;
};

type JsonRecord = Record<string, unknown>;

function isRecord(value: unknown): value is JsonRecord {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function normalizeAddress(value: string | null | undefined) {
  return typeof value === "string" && /^0x[a-fA-F0-9]{40}$/.test(value)
    ? value.toLowerCase()
    : null;
}

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: {
      "content-type": "application/json",
      "cache-control": "no-store",
    },
  });
}

function parsePermissions(value: unknown): LensManagerPermissions | null {
  if (!isRecord(value)) return null;
  return {
    canExecuteTransactions: value.canExecuteTransactions === true,
    canTransferTokens: value.canTransferTokens === true,
    canTransferNative: value.canTransferNative === true,
    canSetMetadataUri: value.canSetMetadataUri === true,
  };
}

async function lensQuery(query: string, variables: Record<string, unknown>) {
  const response = await fetch(LENS_API_URL, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ query, variables }),
    cache: "no-store",
  });

  const payload = (await response.json().catch(() => null)) as unknown;
  if (!response.ok) {
    throw new Error("Lens authority lookup failed.");
  }
  if (!isRecord(payload)) {
    throw new Error("Lens authority lookup returned an invalid response.");
  }
  if (Array.isArray(payload.errors) && payload.errors.length > 0) {
    throw new Error("Lens authority lookup returned GraphQL errors.");
  }

  return isRecord(payload.data) ? payload.data : {};
}

function getAccountOwner(data: JsonRecord) {
  const accountData = isRecord(data.account) ? data.account : null;
  return normalizeAddress(typeof accountData?.owner === "string" ? accountData.owner : null);
}

function findAccountPermissions(data: JsonRecord, account: string) {
  const available = isRecord(data.accountsAvailable) ? data.accountsAvailable : {};
  const items = Array.isArray(available.items) ? available.items : [];
  for (const item of items) {
    if (!isRecord(item) || item.__typename !== "AccountManaged") continue;
    const managedAccount = isRecord(item.account) ? item.account : null;
    const managedAddress = normalizeAddress(
      typeof managedAccount?.address === "string" ? managedAccount.address : null,
    );
    if (managedAddress === account) {
      return parsePermissions(item.permissions);
    }
  }

  return null;
}

function getNextCursor(data: JsonRecord) {
  const available = isRecord(data.accountsAvailable) ? data.accountsAvailable : {};
  const pageInfo = isRecord(available.pageInfo) ? available.pageInfo : {};
  return typeof pageInfo.next === "string" && pageInfo.next ? pageInfo.next : null;
}

export async function GET(request: Request) {
  const url = new URL(request.url);
  const account = normalizeAddress(url.searchParams.get("account"));
  const manager = normalizeAddress(url.searchParams.get("manager"));

  if (!account) {
    return json({ error: "A valid Lens account address is required." }, 400);
  }

  try {
    let ownerAddress: string | null = null;
    let managerPermissions: LensManagerPermissions | null = null;

    if (!manager) {
      const data = await lensQuery(ACCOUNT_QUERY, {
        accountRequest: { address: account },
      });
      ownerAddress = getAccountOwner(data);
    } else {
      let cursor: string | null = null;
      for (let page = 0; page < 5; page += 1) {
        const data = await lensQuery(ACCOUNTS_AVAILABLE_QUERY, {
          accountRequest: { address: account },
          availableRequest: {
            managedBy: manager,
            includeOwned: true,
            hiddenFilter: "ALL",
            pageSize: "FIFTY",
            ...(cursor ? { cursor } : {}),
          },
        });

        ownerAddress ??= getAccountOwner(data);
        managerPermissions = findAccountPermissions(data, account);
        if (managerPermissions) break;

        cursor = getNextCursor(data);
        if (!cursor) break;
      }
    }

    return json({
      accountAddress: account,
      ownerAddress,
      managerAddress: manager,
      managerPermissions,
    });
  } catch {
    return json({ error: "Lens authority lookup failed." }, 502);
  }
}
