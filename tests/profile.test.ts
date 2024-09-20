import { describe, it, expect } from 'vitest';

// Mock Clarity values and functions
const mockClarityValue = (type) => (value) => ({ type, value });

const stringAscii = mockClarityValue('string-ascii');
const stringUtf8 = mockClarityValue('string-utf8');
const principal = mockClarityValue('principal');

// Mock data variables and maps
const userProfiles = new Map();

// Mock contract functions

const createProfile = (username, bio, txSender) => {
  if (userProfiles.has(txSender)) {
    return { err: 100 }; // Profile already exists
  }
  userProfiles.set(txSender, {
    username,
    bio,
    ownedNfts: [],
    createdNfts: [],
    saleHistory: [],
    purchaseHistory: []
  });
  return { ok: true };
};

const updateProfile = (username, bio, txSender) => {
  if (!userProfiles.has(txSender)) {
    return { err: 101 }; // Profile not found
  }
  const existingProfile = userProfiles.get(txSender);
  userProfiles.set(txSender, {
    ...existingProfile,
    username,
    bio
  });
  return { ok: true };
};

const addOwnedNft = (tokenId, txSender) => {
  if (!userProfiles.has(txSender)) {
    return { err: 101 }; // Profile not found
  }
  const profile = userProfiles.get(txSender);
  profile.ownedNfts.push(tokenId);
  return { ok: true };
};

const getProfile = (user) => {
  return userProfiles.get(user) || null;
};

// Tests
describe('User Profiles Smart Contract Tests', () => {
  it('should create a new profile', () => {
    const result = createProfile(stringAscii("testuser"), stringUtf8("This is a test bio."), 'creator-1');
    expect(result).toEqual({ ok: true });
    const profile = getProfile('creator-1');
    expect(profile).toEqual({
      username: stringAscii("testuser"),
      bio: stringUtf8("This is a test bio."),
      ownedNfts: [],
      createdNfts: [],
      saleHistory: [],
      purchaseHistory: []
    });
  });
  
  it('should not create a profile if it already exists', () => {
    const result = createProfile(stringAscii("testuser"), stringUtf8("This is a test bio."), 'creator-1');
    expect(result).toEqual({ err: 100 }); // Profile already exists
  });
  
  it('should update an existing profile', () => {
    const result = updateProfile(stringAscii("updateduser"), stringUtf8("Updated bio."), 'creator-1');
    expect(result).toEqual({ ok: true });
    const profile = getProfile('creator-1');
    expect(profile.username).toEqual(stringAscii("updateduser"));
    expect(profile.bio).toEqual(stringUtf8("Updated bio."));
  });
  
  it('should not update a profile if it does not exist', () => {
    const result = updateProfile(stringAscii("anotheruser"), stringUtf8("Another bio."), 'creator-2');
    expect(result).toEqual({ err: 101 }); // Profile not found
  });
  
  it('should add an owned NFT to the profile', () => {
    const result = addOwnedNft(1, 'creator-1');
    expect(result).toEqual({ ok: true });
    const profile = getProfile('creator-1');
    expect(profile.ownedNfts).toContain(1);
  });
  
  it('should not allow adding an NFT to a non-existent profile', () => {
    const result = addOwnedNft(2, 'creator-2');
    expect(result).toEqual({ err: 101 }); // Profile not found
  });
});
