import fs from 'fs';
import path from 'path';

const DB_PATH = path.join(__dirname, '../../data.json');

interface Database {
  users: any[];
  bankAccounts: any[];
  assets: any[];
  lockedAssets: any[];
  trustScores: any[];
  loans: any[];
  virtualCards: any[];
  sessions: any[];
}

let db: Database = {
  users: [],
  bankAccounts: [],
  assets: [],
  lockedAssets: [],
  trustScores: [],
  loans: [],
  virtualCards: [],
  sessions: []
};

// Load database from file
export function loadDatabase() {
  try {
    if (fs.existsSync(DB_PATH)) {
      const data = fs.readFileSync(DB_PATH, 'utf-8');
      db = JSON.parse(data);
      console.log('✅ Database loaded successfully');
    } else {
      saveDatabase();
      console.log('✅ New database created');
    }
  } catch (error) {
    console.error('Error loading database:', error);
  }
}

// Save database to file
export function saveDatabase() {
  try {
    fs.writeFileSync(DB_PATH, JSON.stringify(db, null, 2));
  } catch (error) {
    console.error('Error saving database:', error);
  }
}

// Database operations
export const database = {
  // Users
  findUserByEmail: (email: string) => {
    return db.users.find(u => u.email === email);
  },
  
  findUserById: (id: string) => {
    return db.users.find(u => u.id === id);
  },
  
  createUser: (user: any) => {
    db.users.push(user);
    saveDatabase();
    return user;
  },
  
  updateUser: (id: string, updates: any) => {
    const index = db.users.findIndex(u => u.id === id);
    if (index !== -1) {
      db.users[index] = { ...db.users[index], ...updates, updated_at: new Date().toISOString() };
      saveDatabase();
      return db.users[index];
    }
    return null;
  },

  // Bank Accounts
  findBankAccountByUserId: (userId: string) => {
    return db.bankAccounts.find(b => b.user_id === userId && b.is_primary);
  },
  
  createBankAccount: (account: any) => {
    db.bankAccounts.push(account);
    saveDatabase();
    return account;
  },
  
  updateBankAccount: (userId: string, updates: any) => {
    const index = db.bankAccounts.findIndex(b => b.user_id === userId);
    if (index !== -1) {
      db.bankAccounts[index] = { ...db.bankAccounts[index], ...updates };
      saveDatabase();
      return db.bankAccounts[index];
    }
    return null;
  },

  // Assets
  findAssetsByUserId: (userId: string) => {
    return db.assets.filter(a => a.user_id === userId);
  },
  
  findAssetById: (id: string) => {
    return db.assets.find(a => a.id === id);
  },
  
  createAsset: (asset: any) => {
    db.assets.push(asset);
    saveDatabase();
    return asset;
  },
  
  updateAsset: (id: string, updates: any) => {
    const index = db.assets.findIndex(a => a.id === id);
    if (index !== -1) {
      db.assets[index] = { ...db.assets[index], ...updates };
      saveDatabase();
      return db.assets[index];
    }
    return null;
  },

  // Locked Assets
  findLockedAssetsByUserId: (userId: string) => {
    return db.lockedAssets.filter(la => la.user_id === userId);
  },
  
  findLockedAssetByAssetId: (assetId: string) => {
    return db.lockedAssets.find(la => la.asset_id === assetId);
  },
  
  createLockedAsset: (lockedAsset: any) => {
    db.lockedAssets.push(lockedAsset);
    saveDatabase();
    return lockedAsset;
  },
  
  deleteLockedAsset: (assetId: string) => {
    db.lockedAssets = db.lockedAssets.filter(la => la.asset_id !== assetId);
    saveDatabase();
  },

  // Trust Scores
  findLatestTrustScore: (userId: string) => {
    const scores = db.trustScores.filter(ts => ts.user_id === userId);
    return scores.sort((a, b) => new Date(b.calculated_at).getTime() - new Date(a.calculated_at).getTime())[0];
  },
  
  createTrustScore: (trustScore: any) => {
    db.trustScores.push(trustScore);
    saveDatabase();
    return trustScore;
  },

  // Loans
  findLoansByBorrowerId: (borrowerId: string) => {
    return db.loans.filter(l => l.borrower_id === borrowerId);
  },
  
  findLoanById: (id: string) => {
    return db.loans.find(l => l.id === id);
  },
  
  getAllLoans: () => {
    return db.loans;
  },
  
  createLoan: (loan: any) => {
    db.loans.push(loan);
    saveDatabase();
    return loan;
  },
  
  updateLoan: (id: string, updates: any) => {
    const index = db.loans.findIndex(l => l.id === id);
    if (index !== -1) {
      db.loans[index] = { ...db.loans[index], ...updates, updated_at: new Date().toISOString() };
      saveDatabase();
      return db.loans[index];
    }
    return null;
  },
  
  updateLockedAsset: (id: string, updates: any) => {
    const index = db.lockedAssets.findIndex(la => la.id === id);
    if (index !== -1) {
      db.lockedAssets[index] = { ...db.lockedAssets[index], ...updates };
      saveDatabase();
      return db.lockedAssets[index];
    }
    return null;
  },

  // Sessions
  createSession: (session: any) => {
    db.sessions.push(session);
    saveDatabase();
    return session;
  },
  
  findSessionByRefreshToken: (refreshToken: string) => {
    return db.sessions.find(s => s.refresh_token === refreshToken);
  }
};

// Initialize database
export function initDatabase() {
  loadDatabase();
}
