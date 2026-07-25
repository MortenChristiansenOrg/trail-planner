import { describe, expect, test } from "vitest";
import {
  preferencesAreAnonymous,
  preferencesBelongToAccount,
} from "./preferenceOwnership";

describe("browser preference ownership", () => {
  test("allows anonymous preferences to be claimed by the first account", () => {
    expect(preferencesAreAnonymous(null)).toBe(true);
    expect(preferencesBelongToAccount(null, "account-a")).toBe(true);
  });

  test("prevents account-scoped preferences from crossing identities", () => {
    expect(preferencesAreAnonymous("account-a")).toBe(false);
    expect(preferencesBelongToAccount("account-a", "account-a")).toBe(true);
    expect(preferencesBelongToAccount("account-a", "account-b")).toBe(false);
  });
});
