import { describe, it, expect } from 'vitest';

// Mock Clarity values and functions
const mockClarityValue = (type: string, value: any) => ({ type, value });

const uint = (value: number) => mockClarityValue('uint', value);
const bool = (value: boolean) => mockClarityValue('bool', value);
const principal = (value: string) => mockClarityValue('principal', value);

// Mock data variables and maps
let lastTokenId = 0;
const tokens = new Map<number, { owner: string, metadata: string }>();

// Mock contract constants
const contractOwner = 'ST1PQHQKV0RJXZFY1DGX8MNSNYVE3VGZJSRTPGZGM'; // Assume this as contract owner
const errOwnerOnly = { err: 100 };
const errNotTokenOwner = { err: 101 };
const errTokenNotFound = { err: 102 };

// Mock contract functions

// Mint a new token
const mintToken = (metadata: string, txSender: string) => {
  if (txSender !== contractOwner) {
    return errOwnerOnly;
  }
  const tokenId = ++lastTokenId;
  tokens.set(tokenId, { owner: txSender, metadata });
  return { ok: uint(tokenId) };
};

// Transfer a token
const transferToken = (tokenId: number, recipient: string, txSender: string) => {
  const tokenData = tokens.get(tokenId);
  if (!tokenData) {
    return errTokenNotFound;
  }
  if (tokenData.owner !== txSender) {
    return errNotTokenOwner;
  }
  tokens.set(tokenId, { owner: recipient, metadata: tokenData.metadata });
  return { ok: true };
};

// Get the owner of a token
const getOwner = (tokenId: number) => {
  const tokenData = tokens.get(tokenId);
  return tokenData ? { ok: principal(tokenData.owner) } : errTokenNotFound;
};

// Burn a token
const burnToken = (tokenId: number, txSender: string) => {
  const tokenData = tokens.get(tokenId);
  if (!tokenData) {
    return errTokenNotFound;
  }
  if (tokenData.owner !== txSender) {
    return errNotTokenOwner;
  }
  tokens.delete(tokenId);
  return { ok: true };
};

// Get token metadata
const getTokenMetadata = (tokenId: number) => {
  const tokenData = tokens.get(tokenId);
  return tokenData ? { ok: tokenData.metadata } : errTokenNotFound;
};

// Get last token ID
const getLastTokenId = () => {
  return { ok: uint(lastTokenId) };
};

// Tests
describe('NFT Smart Contract Tests', () => {
  it('should mint a new token successfully', () => {
    const result = mintToken('First token', contractOwner);
    expect(result).toEqual({ ok: uint(1) });
  });
  
  it('should not mint a token by non-owner', () => {
    const result = mintToken('Non-owner token', 'ST1PQHQKV0RJXZFY1DGX8MNSNYVE3VOTHER');
    expect(result).toEqual(errOwnerOnly);
  });
  
  it('should transfer token to a new owner', () => {
    const result = transferToken(1, 'ST1OTHERADDR1234567890', contractOwner);
    expect(result).toEqual({ ok: true });
    const newOwner = getOwner(1);
    expect(newOwner).toEqual({ ok: principal('ST1OTHERADDR1234567890') });
  });
  
  it('should not transfer token by non-owner', () => {
    const result = transferToken(1, 'ST1NEWOWNER1234567890', 'ST1WRONGOWNER1234567890');
    expect(result).toEqual(errNotTokenOwner);
  });
  
  it('should burn the token successfully', () => {
    const result = burnToken(1, 'ST1OTHERADDR1234567890');
    expect(result).toEqual({ ok: true });
    const ownerAfterBurn = getOwner(1);
    expect(ownerAfterBurn).toEqual(errTokenNotFound);
  });
  
  it('should not burn token by non-owner', () => {
    mintToken('Second token', contractOwner); // Mint another token
    const result = burnToken(2, 'ST1OTHERADDR1234567890'); // Try to burn by wrong owner
    expect(result).toEqual(errNotTokenOwner);
  });
  
  it('should get the last token ID', () => {
    const result = getLastTokenId();
    expect(result).toEqual({ ok: uint(2) });
  });
  
  it('should return correct metadata for a token', () => {
    const metadata = getTokenMetadata(2);
    expect(metadata).toEqual({ ok: 'Second token' });
  });
});
