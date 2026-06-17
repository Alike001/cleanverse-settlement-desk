export const mockSupported = {
  code: "0000",
  message: "ok",
  data: {
    chain: "base",
    tokens: [
      {
        origin_token: { symbol: "usdc", address: "0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913", decimals: 6 },
        atoken: { symbol: "ausdc", address: "0xac0893567d43c3e7e6e35a72803df05416c1f20d", decimals: 6 },
        accesscore_address: "0x7d7466fc1c1bb50f27fa3e5cb2f4100432789d2f",
        apass_address: "0x6f7d8c2f29b8f7b3a4c1a913f91e07d4e8a61234"
      },
      {
        origin_token: { symbol: "usdt", address: "0xfde4C96c8593536E31F229EA8f37b2ADa2699bb2", decimals: 6 },
        atoken: { symbol: "ausdt", address: "0xbc0893567d43c3e7e6e35a72803df05416c1f20d", decimals: 6 },
        accesscore_address: "0x7d7466fc1c1bb50f27fa3e5cb2f4100432789d2f",
        apass_address: "0x6f7d8c2f29b8f7b3a4c1a913f91e07d4e8a61234"
      }
    ]
  }
};

export function mockApass(address) {
  return {
    code: "0000",
    message: "success",
    data: {
      cvRecordId: address.endsWith("0000") ? "" : "CV-1027",
      subTier: 1,
      status: address.toLowerCase().endsWith("dead") ? 2 : 1,
      tier: "26",
      expirationTime: 1863690034,
      subGroup: "zz",
      currentKycHash: "3557683c1e62fb7dc8ef438e81cb4ffdf4c6077f8616ce759ac2fff850ba31d9",
      group: "aa"
    }
  };
}

export function mockVerify(chain, atoken, address) {
  const lower = address.toLowerCase();
  if (lower.endsWith("0000")) {
    return {
      code: "0000",
      message: "ok",
      data: {
        chain, atoken, address,
        code: 2,
        message: "User does not have A-Pass. Onboarding required.",
        magickLink: "https://register.cleanverse.com/apass/demo"
      }
    };
  }
  if (lower.endsWith("dead")) {
    return {
      code: "0000",
      message: "ok",
      data: {
        chain, atoken, address,
        code: 3,
        message: "A-Pass exists but cannot transfer A-Token (expired or frozen).",
        magickLink: ""
      }
    };
  }
  return {
    code: "0000",
    message: "ok",
    data: {
      chain, atoken, address,
      code: 4,
      message: "apass verify success",
      magickLink: ""
    }
  };
}

export function mockDeposit(chain, address) {
  return {
    code: "0000",
    message: "ok",
    data: {
      address,
      chain,
      depositUSDCWallet: "0x4c31d35cc6634c0532925a3b844bc9e7595f0aa10",
      depositUSDTWallet: "0x4c31d35cc6634c0532925a3b844bc9e7595f0aa10"
    }
  };
}

export const mockWhitelist = {
  code: "0000",
  message: "ok",
  data: {
    chain: "base",
    token_whitelist: [
      {
        origin_symbol: "usdc",
        atoken_symbol: "ausdc",
        atoken_address: "0xac0893567d43c3e7e6e35a72803df05416c1f20d",
        whitelist: [
          { service_name: "Zero Hash", entity_name: "Zero Hash LLC", category: "Payments" },
          { service_name: "Circle", entity_name: "Circle Internet Financial", category: "Issuer" }
        ]
      }
    ]
  }
};

export function mockFaucet(chain, symbol, depositAddress, amount) {
  return {
    code: "0000",
    message: "ok",
    data: {
      chain,
      symbol,
      deposit_address: depositAddress,
      amount,
      tx_hash: "0x" + Array.from({ length: 64 }, () => Math.floor(Math.random() * 16).toString(16)).join("")
    }
  };
}
