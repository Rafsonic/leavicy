import { describe, it, expect, vi, beforeEach } from "vitest";

// --- Mocks -----------------------------------------------------------------

// Cookie store backed by a Map so we can assert get/set/delete behaviour.
const cookieStore = {
  store: new Map<string, string>(),
  get: vi.fn((name: string) =>
    cookieStore.store.has(name)
      ? { value: cookieStore.store.get(name) }
      : undefined,
  ),
  set: vi.fn((name: string, value: string) => {
    cookieStore.store.set(name, value);
  }),
  delete: vi.fn((name: string) => {
    cookieStore.store.delete(name);
  }),
};
vi.mock("next/headers", () => ({
  cookies: vi.fn(async () => cookieStore),
}));

// Chainable Supabase query-builder stub: every chain method returns the
// builder, and the builder (and `.single()`) resolves to a preset result.
type Result = Record<string, unknown>;
const makeBuilder = (result: Result) => {
  const builder: Record<string, unknown> = {};
  for (const m of ["select", "eq", "order", "insert", "update", "delete"]) {
    builder[m] = vi.fn(() => builder);
  }
  builder.single = vi.fn(() => builder);
  builder.then = (resolve: (v: Result) => unknown, reject?: (e: unknown) => unknown) =>
    Promise.resolve(result).then(resolve, reject);
  return builder;
};
const from = vi.fn();
const supabase = { from };
vi.mock("../../server", () => ({
  createClient: vi.fn(async () => supabase),
}));

const getCurrentUser = vi.fn();
vi.mock("../../dal", () => ({
  getCurrentUser: () => getCurrentUser(),
}));

const generateRegistrationOptions = vi.fn();
const verifyRegistrationResponse = vi.fn();
const generateAuthenticationOptions = vi.fn();
const verifyAuthenticationResponse = vi.fn();
vi.mock("@simplewebauthn/server", () => ({
  generateRegistrationOptions: () => generateRegistrationOptions(),
  verifyRegistrationResponse: (args: unknown) => verifyRegistrationResponse(args),
  generateAuthenticationOptions: () => generateAuthenticationOptions(),
  verifyAuthenticationResponse: (args: unknown) =>
    verifyAuthenticationResponse(args),
}));
vi.mock("@simplewebauthn/server/helpers", () => ({
  isoBase64URL: {
    fromBuffer: vi.fn(() => "pk-base64url"),
    toBuffer: vi.fn(() => new Uint8Array([1, 2, 3])),
  },
  isoUint8Array: {
    fromUTF8String: vi.fn((s: string) => new TextEncoder().encode(s)),
  },
}));

import {
  getRegistrationOptions,
  verifyRegistration,
  getAuthenticationOptions,
  verifyAuthentication,
  lockApp,
  listPasskeys,
  removePasskey,
} from "../webauthn";
import {
  WEBAUTHN_CHALLENGE_COOKIE,
  APP_UNLOCKED_COOKIE,
  HAS_PASSKEY_COOKIE,
} from "../../webauthn.shared";

const USER = { id: "user-1", email: "nina@acme.test" };

beforeEach(() => {
  vi.clearAllMocks();
  cookieStore.store.clear();
  getCurrentUser.mockResolvedValue(USER);
  from.mockReturnValue(makeBuilder({ data: [] }));
});

describe("getRegistrationOptions", () => {
  it("throws when unauthenticated", async () => {
    getCurrentUser.mockResolvedValue(null);
    await expect(getRegistrationOptions()).rejects.toThrow("Not authenticated");
  });

  it("returns options and stores the challenge", async () => {
    from.mockReturnValueOnce(
      makeBuilder({ data: [{ id: "c1", transports: ["internal"] }] }),
    );
    generateRegistrationOptions.mockResolvedValue({ challenge: "reg-chal" });

    const options = await getRegistrationOptions();

    expect(options.challenge).toBe("reg-chal");
    expect(cookieStore.set).toHaveBeenCalledWith(
      WEBAUTHN_CHALLENGE_COOKIE,
      "reg-chal",
      expect.objectContaining({ httpOnly: true }),
    );
  });
});

describe("verifyRegistration", () => {
  it("throws when unauthenticated", async () => {
    getCurrentUser.mockResolvedValue(null);
    await expect(verifyRegistration({} as never)).rejects.toThrow(
      "Not authenticated",
    );
  });

  it("throws when the challenge cookie is missing", async () => {
    await expect(verifyRegistration({} as never)).rejects.toThrow(
      "Challenge expired",
    );
  });

  it("returns verified:false when the response fails verification", async () => {
    cookieStore.store.set(WEBAUTHN_CHALLENGE_COOKIE, "reg-chal");
    verifyRegistrationResponse.mockResolvedValue({ verified: false });

    const result = await verifyRegistration({} as never);

    expect(result.verified).toBe(false);
    expect(cookieStore.delete).toHaveBeenCalledWith(WEBAUTHN_CHALLENGE_COOKIE);
  });

  it("persists the credential and unlocks on success", async () => {
    cookieStore.store.set(WEBAUTHN_CHALLENGE_COOKIE, "reg-chal");
    verifyRegistrationResponse.mockResolvedValue({
      verified: true,
      registrationInfo: {
        credential: {
          id: "cred-1",
          publicKey: new Uint8Array([9]),
          counter: 0,
          transports: ["internal"],
        },
        credentialDeviceType: "multiDevice",
        credentialBackedUp: true,
      },
    });
    const insert = makeBuilder({ error: null });
    from.mockReturnValueOnce(insert);

    const result = await verifyRegistration({} as never, "  My iPhone  ");

    expect(result.verified).toBe(true);
    expect(insert.insert).toHaveBeenCalledWith(
      expect.objectContaining({
        id: "cred-1",
        user_id: USER.id,
        public_key: "pk-base64url",
        nickname: "My iPhone",
      }),
    );
    expect(cookieStore.set).toHaveBeenCalledWith(
      HAS_PASSKEY_COOKIE,
      "1",
      expect.objectContaining({ httpOnly: true }),
    );
    expect(cookieStore.set).toHaveBeenCalledWith(
      APP_UNLOCKED_COOKIE,
      "1",
      expect.objectContaining({ httpOnly: true }),
    );
  });

  it("throws when the insert fails", async () => {
    cookieStore.store.set(WEBAUTHN_CHALLENGE_COOKIE, "reg-chal");
    verifyRegistrationResponse.mockResolvedValue({
      verified: true,
      registrationInfo: {
        credential: {
          id: "cred-1",
          publicKey: new Uint8Array([9]),
          counter: 0,
          transports: [],
        },
        credentialDeviceType: "singleDevice",
        credentialBackedUp: false,
      },
    });
    from.mockReturnValueOnce(makeBuilder({ error: { message: "duplicate" } }));

    await expect(verifyRegistration({} as never)).rejects.toThrow("duplicate");
  });
});

describe("getAuthenticationOptions", () => {
  it("throws when unauthenticated", async () => {
    getCurrentUser.mockResolvedValue(null);
    await expect(getAuthenticationOptions()).rejects.toThrow(
      "Not authenticated",
    );
  });

  it("returns options and stores the challenge", async () => {
    from.mockReturnValueOnce(
      makeBuilder({ data: [{ id: "c1", transports: null }] }),
    );
    generateAuthenticationOptions.mockResolvedValue({ challenge: "auth-chal" });

    const options = await getAuthenticationOptions();

    expect(options.challenge).toBe("auth-chal");
    expect(cookieStore.set).toHaveBeenCalledWith(
      WEBAUTHN_CHALLENGE_COOKIE,
      "auth-chal",
      expect.objectContaining({ httpOnly: true }),
    );
  });
});

describe("verifyAuthentication", () => {
  it("throws when unauthenticated", async () => {
    getCurrentUser.mockResolvedValue(null);
    await expect(verifyAuthentication({ id: "x" } as never)).rejects.toThrow(
      "Not authenticated",
    );
  });

  it("throws when the challenge cookie is missing", async () => {
    await expect(verifyAuthentication({ id: "x" } as never)).rejects.toThrow(
      "Challenge expired",
    );
  });

  it("throws when the credential is unknown", async () => {
    cookieStore.store.set(WEBAUTHN_CHALLENGE_COOKIE, "auth-chal");
    from.mockReturnValueOnce(makeBuilder({ data: null }));

    await expect(
      verifyAuthentication({ id: "missing" } as never),
    ).rejects.toThrow("not recognised");
  });

  it("returns verified:false when the assertion fails", async () => {
    cookieStore.store.set(WEBAUTHN_CHALLENGE_COOKIE, "auth-chal");
    from.mockReturnValueOnce(
      makeBuilder({
        data: {
          id: "cred-1",
          public_key: "pk",
          counter: 1,
          transports: ["internal"],
        },
      }),
    );
    verifyAuthenticationResponse.mockResolvedValue({ verified: false });

    const result = await verifyAuthentication({ id: "cred-1" } as never);
    expect(result.verified).toBe(false);
  });

  it("updates the counter and marks unlocked on success", async () => {
    cookieStore.store.set(WEBAUTHN_CHALLENGE_COOKIE, "auth-chal");
    from.mockReturnValueOnce(
      makeBuilder({
        data: {
          id: "cred-1",
          public_key: "pk",
          counter: 1,
          transports: null,
        },
      }),
    );
    const update = makeBuilder({});
    from.mockReturnValueOnce(update);
    verifyAuthenticationResponse.mockResolvedValue({
      verified: true,
      authenticationInfo: { newCounter: 7 },
    });

    const result = await verifyAuthentication({ id: "cred-1" } as never);

    expect(result.verified).toBe(true);
    expect(update.update).toHaveBeenCalledWith(
      expect.objectContaining({ counter: 7 }),
    );
    expect(cookieStore.set).toHaveBeenCalledWith(
      APP_UNLOCKED_COOKIE,
      "1",
      expect.objectContaining({ httpOnly: true }),
    );
  });
});

describe("lockApp", () => {
  it("clears the unlocked cookie", async () => {
    await lockApp();
    expect(cookieStore.delete).toHaveBeenCalledWith(APP_UNLOCKED_COOKIE);
  });
});

describe("listPasskeys", () => {
  it("returns an empty list when unauthenticated", async () => {
    getCurrentUser.mockResolvedValue(null);
    expect(await listPasskeys()).toEqual([]);
  });

  it("returns the user's passkeys", async () => {
    const rows = [{ id: "c1", nickname: "iPhone" }];
    from.mockReturnValueOnce(makeBuilder({ data: rows }));
    expect(await listPasskeys()).toBe(rows);
  });

  it("returns an empty list when the query yields no data", async () => {
    from.mockReturnValueOnce(makeBuilder({ data: null }));
    expect(await listPasskeys()).toEqual([]);
  });
});

describe("removePasskey", () => {
  it("throws when unauthenticated", async () => {
    getCurrentUser.mockResolvedValue(null);
    await expect(removePasskey("c1")).rejects.toThrow("Not authenticated");
  });

  it("disables the gate when the last passkey is removed", async () => {
    from.mockReturnValueOnce(makeBuilder({})); // delete
    from.mockReturnValueOnce(makeBuilder({ count: 0 })); // count

    await removePasskey("c1");

    expect(cookieStore.delete).toHaveBeenCalledWith(HAS_PASSKEY_COOKIE);
    expect(cookieStore.delete).toHaveBeenCalledWith(APP_UNLOCKED_COOKIE);
  });

  it("keeps the gate when other passkeys remain", async () => {
    from.mockReturnValueOnce(makeBuilder({})); // delete
    from.mockReturnValueOnce(makeBuilder({ count: 2 })); // count

    await removePasskey("c1");

    expect(cookieStore.delete).not.toHaveBeenCalledWith(HAS_PASSKEY_COOKIE);
  });
});
