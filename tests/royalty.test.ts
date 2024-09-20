import { describe, it, expect } from 'vitest';

// Mock Clarity values and functions
const mockClarityValue = (type) => (value) => ({ type, value });

const uint = mockClarityValue('uint');
const principal = mockClarityValue('principal');

// Mock data variables and maps
let lastTokenId = 0;
const tokens = new Map();
const creatorBalances = new Map();
let marketplaceCommission = 250; // 2.5%

const tokenRoyalties = new Map();

// Mock contract functions

const setRoyalty = (tokenId, royaltyPercentage, txSender) => {
  if (!tokenRoyalties.has(tokenId)) {
    tokenRoyalties.set(tokenId, { creator: txSender, royaltyPercentage });
    return { ok: true };
  }
  return { err: 101 }; // Not the token creator
};

const distributeRoyaltyAndCommission = (tokenId, salePrice) => {
  if (!tokenRoyalties.has(tokenId)) {
    return { err: 103 }; // Token not found
  }
  const { creator, royaltyPercentage } = tokenRoyalties.get(tokenId);
  const royaltyAmount = (salePrice * royaltyPercentage) / 10000;
  const commissionAmount = (salePrice * marketplaceCommission) / 10000;
  const sellerAmount = salePrice - royaltyAmount - commissionAmount;
  
  creatorBalances.set(creator, (creatorBalances.get(creator) || 0) + royaltyAmount);
  return { ok: sellerAmount };
};

const withdrawCreatorBalance = (txSender) => {
  const balance = creatorBalances.get(txSender) || 0;
  if (balance <= 0) {
    return { err: 103 }; // No balance to withdraw
  }
  creatorBalances.set(txSender, 0);
  return { ok: balance };
};

// Tests
describe('Royalty Smart Contract Tests', () => {
  it('should set a royalty for a token', () => {
    const result = setRoyalty(1, 1000, 'creator-1'); // 10%
    expect(result).toEqual({ ok: true });
    expect(tokenRoyalties.get(1)).toEqual({ creator: 'creator-1', royaltyPercentage: 1000 });
  });
  
  it('should distribute royalty and commission', () => {
    const result = distributeRoyaltyAndCommission(1, 10000); // Sale price of 10000
    expect(result).toEqual({ ok: 8750 }); // Seller amount after royalties and commission
    expect(creatorBalances.get('creator-1')).toEqual(1000); // Creator receives 1000
  });
  
  it('should withdraw creator balance successfully', () => {
    const result = withdrawCreatorBalance('creator-1');
    expect(result).toEqual({ ok: 1000 }); // Should withdraw the full balance
    expect(creatorBalances.get('creator-1')).toEqual(0); // Balance should be reset to 0
  });
  
  it('should not allow withdrawal with no balance', () => {
    const result = withdrawCreatorBalance('creator-1');
    expect(result).toEqual({ err: 103 }); // Error: No balance to withdraw
  });
  
  it('should return correct royalty info for a token', () => {
    const royaltyInfo = tokenRoyalties.get(1);
    expect(royaltyInfo).toEqual({ creator: 'creator-1', royaltyPercentage: 1000 });
  });
});
