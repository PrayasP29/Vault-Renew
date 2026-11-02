import test from "node:test";
import assert from "node:assert/strict";
import {
  hashRefreshToken,
  isLegacyRawToken,
  refreshTokenMatchesHash,
} from "../src/utils/tokenHash.js";

test("refresh tokens are stored as deterministic SHA-256 hashes", () => {
  const raw = "eyJhbGciOiJIUzI1NiJ9.payload.signature";
  const hash = hashRefreshToken(raw);
  assert.equal(hash.length, 64);
  assert.match(hash, /^[a-f0-9]{64}$/);
  assert.equal(hashRefreshToken(raw), hash);
  assert.notEqual(hashRefreshToken(`${raw}x`), hash);
});

test("legacy plaintext JWT values are recognized", () => {
  assert.equal(isLegacyRawToken("eyJhbGciOiJIUzI1NiJ9.a.b"), true);
  assert.equal(isLegacyRawToken("a.b.c"), true);
  assert.equal(isLegacyRawToken(hashRefreshToken("anything")), false);
  assert.equal(isLegacyRawToken(undefined), false);
});

test("stored hash comparison accepts only the matching raw token", () => {
  const raw = "refresh-token-value";
  const stored = hashRefreshToken(raw);
  assert.equal(refreshTokenMatchesHash(stored, raw), true);
  assert.equal(refreshTokenMatchesHash(stored, "different"), false);
  assert.equal(refreshTokenMatchesHash("not-a-hash", raw), false);
});
