import User from '../models/User';
import Asset from '../models/Asset';
import LockedAsset from '../models/LockedAsset';
import Loan from '../models/Loan';
import BankAccount from '../models/BankAccount';
import TrustScore from '../models/TrustScore';

export const mongoDatabase = {
  // Users
  findUserByEmail: async (email: string) => {
    return await User.findOne({ email });
  },
  
  findUserById: async (id: string) => {
    return await User.findOne({ id });
  },
  
  getAllUsers: async () => {
    return await User.find({});
  },
  
  createUser: async (user: any) => {
    const newUser = new User(user);
    return await newUser.save();
  },
  
  updateUser: async (id: string, updates: any) => {
    return await User.findOneAndUpdate(
      { id },
      { ...updates, updated_at: new Date() },
      { new: true }
    );
  },

  // Bank Accounts
  findBankAccountByUserId: async (userId: string) => {
    return await BankAccount.findOne({ user_id: userId, is_primary: true });
  },
  
  createBankAccount: async (account: any) => {
    const newAccount = new BankAccount(account);
    return await newAccount.save();
  },
  
  updateBankAccount: async (userId: string, updates: any) => {
    return await BankAccount.findOneAndUpdate(
      { user_id: userId },
      updates,
      { new: true }
    );
  },

  // Assets
  findAssetsByUserId: async (userId: string) => {
    return await Asset.find({ user_id: userId });
  },
  
  findAssetById: async (id: string) => {
    return await Asset.findOne({ id });
  },
  
  createAsset: async (asset: any) => {
    const newAsset = new Asset(asset);
    return await newAsset.save();
  },
  
  updateAsset: async (id: string, updates: any) => {
    return await Asset.findOneAndUpdate(
      { id },
      { ...updates, updated_at: new Date() },
      { new: true }
    );
  },

  // Locked Assets
  findLockedAssetsByUserId: async (userId: string) => {
    return await LockedAsset.find({ user_id: userId });
  },
  
  findLockedAssetByAssetId: async (assetId: string) => {
    return await LockedAsset.findOne({ asset_id: assetId });
  },
  
  createLockedAsset: async (lockedAsset: any) => {
    const newLockedAsset = new LockedAsset(lockedAsset);
    return await newLockedAsset.save();
  },
  
  deleteLockedAsset: async (assetId: string) => {
    return await LockedAsset.deleteOne({ asset_id: assetId });
  },
  
  updateLockedAsset: async (id: string, updates: any) => {
    return await LockedAsset.findOneAndUpdate(
      { id },
      updates,
      { new: true }
    );
  },

  // Trust Scores
  findLatestTrustScore: async (userId: string) => {
    return await TrustScore.findOne({ user_id: userId }).sort({ calculated_at: -1 });
  },
  
  createTrustScore: async (trustScore: any) => {
    const newTrustScore = new TrustScore(trustScore);
    return await newTrustScore.save();
  },

  // Loans
  findLoansByBorrowerId: async (borrowerId: string) => {
    return await Loan.find({ borrower_id: borrowerId });
  },
  
  findLoanById: async (id: string) => {
    return await Loan.findOne({ id });
  },
  
  getAllLoans: async () => {
    return await Loan.find({});
  },
  
  createLoan: async (loan: any) => {
    const newLoan = new Loan(loan);
    return await newLoan.save();
  },
  
  updateLoan: async (id: string, updates: any) => {
    return await Loan.findOneAndUpdate(
      { id },
      { ...updates, updated_at: new Date() },
      { new: true }
    );
  },

  // Sessions (keeping in-memory for now, can add Redis later)
  createSession: async (session: any) => {
    // For now, we'll keep sessions in memory or use JWT only
    return session;
  },
  
  findSessionByRefreshToken: async (refreshToken: string) => {
    // For now, return null (JWT-only auth)
    return null;
  }
};
