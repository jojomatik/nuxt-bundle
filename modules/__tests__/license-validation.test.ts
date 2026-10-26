import assert from "node:assert/strict";
import { test } from "node:test";
import { validateDependencyLicense } from "../license-validation.ts";

test("applies a package license override before validation", () => {
  assert.deepEqual(
    validateDependencyLicense(
      { name: "socket.io-client" },
      { "socket.io-client": "MIT" },
      ["MIT"],
    ),
    { license: "MIT", isAllowed: true },
  );
});

test("rejects missing license metadata without an override", () => {
  assert.deepEqual(
    validateDependencyLicense({ name: "unlicensed-package" }, {}, ["MIT"]),
    { license: undefined, isAllowed: false },
  );
});

test("still rejects an overridden license outside the allow-list", () => {
  assert.deepEqual(
    validateDependencyLicense(
      { name: "socket.io-client" },
      { "socket.io-client": "MIT" },
      ["Apache-2.0"],
    ),
    { license: "MIT", isAllowed: false },
  );
});
