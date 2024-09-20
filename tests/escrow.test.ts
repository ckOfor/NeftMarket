import { describe, it, expect } from 'vitest';

// Mock Clarity values and functions
const mockClarityValue = (type) => (value) => ({ type, value });
const principal = mockClarityValue('principal');
const uint = (value) => ({ type: 'uint', value });

const contractOwner = principal("contract-owner");
const buyer = principal("buyer");
const seller = principal("seller");
const saleId = uint(1);
const amount = uint(1000);

// Mock data store for escrow balances
const escrowBalances = new Map();

// Mock contract functions
const depositEscrow = (saleId, seller, amount, txSender) => {
  const escrowEntry = { buyer: txSender, seller, amount };
  if (!escrowBalances.has(saleId.value)) {
    // Simulate STX transfer success
    escrowBalances.set(saleId.value, escrowEntry);
    return { ok: true };
  }
  return { err: 103 }; // Already exists
};

const releaseToSeller = (saleId, txSender) => {
  const escrowInfo = escrowBalances.get(saleId.value);
  if (!escrowInfo) {
    return { err: 101 }; // Not in escrow
  }
  if (txSender !== contractOwner && txSender !== escrowInfo.buyer) {
    return { err: 102 }; // Unauthorized
  }
  // Simulate transfer to seller
  escrowBalances.delete(saleId.value);
  return { ok: true };
};

const refundBuyer = (saleId, txSender) => {
  const escrowInfo = escrowBalances.get(saleId.value);
  if (!escrowInfo) {
    return { err: 101 }; // Not in escrow
  }
  if (txSender !== contractOwner && txSender !== escrowInfo.seller) {
    return { err: 102 }; // Unauthorized
  }
  // Simulate refund to buyer
  escrowBalances.delete(saleId.value);
  return { ok: true };
};

const getEscrowInfo = (saleId) => {
  return escrowBalances.get(saleId.value) || null;
};

const isInEscrow = (saleId) => {
  return escrowBalances.has(saleId.value);
};

// Tests
describe('Escrow Smart Contract Tests', () => {
  it('should deposit funds into escrow', () => {
    const result = depositEscrow(saleId, seller, amount, buyer);
    expect(result).toEqual({ ok: true });
    expect(escrowBalances.get(saleId.value)).toEqual({
      buyer,
      seller,
      amount,
    });
  });
  
  it('should not allow duplicate deposits', () => {
    const result = depositEscrow(saleId, seller, amount, buyer);
    expect(result).toEqual({ err: 103 }); // Already exists
  });
  
  it('should release funds to seller', () => {
    const result = releaseToSeller(saleId, contractOwner);
    expect(result).toEqual({ ok: true });
    expect(escrowBalances.get(saleId.value)).toBeUndefined();
  });
  
  it('should not release funds if not in escrow', () => {
    const result = releaseToSeller(saleId, contractOwner);
    expect(result).toEqual({ err: 101 }); // Not in escrow
  });
  
  it('should refund buyer', () => {
    depositEscrow(saleId, seller, amount, buyer); // Re-deposit to test refund
    const result = refundBuyer(saleId, seller);
    expect(result).toEqual({ ok: true });
    expect(escrowBalances.get(saleId.value)).toBeUndefined();
  });
  
  it('should not refund buyer if not authorized', () => {
    depositEscrow(saleId, seller, amount, buyer); // Re-deposit to test refund
    const result = refundBuyer(saleId, buyer);
    expect(result).toEqual({ err: 102 }); // Unauthorized
  });
  
  it('should get escrow info', () => {
    depositEscrow(saleId, seller, amount, buyer); // Re-deposit to test retrieval
    const result = getEscrowInfo(saleId);
    expect(result).toEqual({
      buyer,
      seller,
      amount,
    });
  });
  
  it('should check if funds are in escrow', () => {
    const result = isInEscrow(saleId);
    expect(result).toBe(true);
  });
  
  it('should indicate funds are not in escrow after release', () => {
    releaseToSeller(saleId, contractOwner);
    const result = isInEscrow(saleId);
    expect(result).toBe(false);
  });
});
