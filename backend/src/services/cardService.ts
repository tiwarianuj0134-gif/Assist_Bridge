import { v4 as uuidv4 } from 'uuid';
import VirtualCard from '../models/VirtualCard';
import Transaction from '../models/Transaction';
import User from '../models/User';
import Loan from '../models/Loan';

/**
 * Card Service for virtual card management and transactions
 */
export class CardService {
  /**
   * Generate a random 16-digit card number (simplified Luhn algorithm)
   */
  private generateCardNumber(): string {
    // Start with BIN (Bank Identification Number) - using 4829 for demo
    let cardNumber = '4829';
    
    // Generate 11 random digits
    for (let i = 0; i < 11; i++) {
      cardNumber += Math.floor(Math.random() * 10);
    }
    
    // Calculate Luhn check digit
    const checkDigit = this.calculateLuhnCheckDigit(cardNumber);
    cardNumber += checkDigit;
    
    return cardNumber;
  }

  /**
   * Calculate Luhn check digit
   */
  private calculateLuhnCheckDigit(cardNumber: string): number {
    let sum = 0;
    let isEven = true;
    
    // Process digits from right to left
    for (let i = cardNumber.length - 1; i >= 0; i--) {
      let digit = parseInt(cardNumber[i]);
      
      if (isEven) {
        digit *= 2;
        if (digit > 9) {
          digit -= 9;
        }
      }
      
      sum += digit;
      isEven = !isEven;
    }
    
    return (10 - (sum % 10)) % 10;
  }

  /**
   * Generate CVV
   */
  private generateCVV(): string {
    return Math.floor(100 + Math.random() * 900).toString();
  }

  /**
   * Generate expiry date (3 years from now)
   */
  private generateExpiryDate(): string {
    const now = new Date();
    const expiryYear = now.getFullYear() + 3;
    const expiryMonth = (now.getMonth() + 1).toString().padStart(2, '0');
    return `${expiryMonth}/${expiryYear.toString().slice(-2)}`;
  }

  /**
   * Issue a virtual card for an approved loan
   */
  async issueCard(userId: string, loanId: string): Promise<any> {
    // Check if user already has a card for this loan
    const existingCard = await VirtualCard.findOne({ user_id: userId, loan_id: loanId });
    if (existingCard) {
      throw new Error('Card already issued for this loan');
    }

    // Get loan details
    const loan = await Loan.findOne({ id: loanId });
    if (!loan) {
      throw new Error('Loan not found');
    }

    if (loan.status !== 'ACTIVE') {
      throw new Error('Loan must be active before issuing card');
    }

    // Get user details
    const user = await User.findOne({ id: userId });
    if (!user) {
      throw new Error('User not found');
    }

    // Generate card details
    const cardNumber = this.generateCardNumber();
    const cvv = this.generateCVV();
    const expiryDate = this.generateExpiryDate();
    const cardHolderName = `${user.first_name} ${user.last_name}`.toUpperCase();

    // Create virtual card
    const card = new VirtualCard({
      id: uuidv4(),
      user_id: userId,
      loan_id: loanId,
      card_number: cardNumber,
      cvv: cvv,
      expiry_date: expiryDate,
      card_holder_name: cardHolderName,
      credit_limit: loan.amount,
      available_balance: loan.amount,
      status: 'active',
      issued_at: new Date()
    });

    await card.save();

    return {
      id: card.id,
      cardNumber: cardNumber,
      cvv: cvv,
      expiryDate: expiryDate,
      cardHolderName: cardHolderName,
      creditLimit: loan.amount,
      availableBalance: loan.amount,
      status: card.status
    };
  }

  /**
   * Get card details for a user
   */
  async getCard(userId: string): Promise<any> {
    const card = await VirtualCard.findOne({ user_id: userId, status: 'active' })
      .sort({ issued_at: -1 })
      .limit(1);

    if (!card) {
      return null;
    }

    return {
      id: card.id,
      cardNumber: card.card_number,
      cvv: card.cvv,
      expiryDate: card.expiry_date,
      cardHolderName: card.card_holder_name,
      creditLimit: card.credit_limit,
      availableBalance: card.available_balance,
      status: card.status,
      issuedAt: card.issued_at,
      lastUsedAt: card.last_used_at
    };
  }

  /**
   * Process a transaction
   */
  async processTransaction(userId: string, data: {
    amount: number;
    merchant: string;
    category?: string;
    location?: string;
    currency?: string;
  }): Promise<any> {
    // Get active card
    const card = await VirtualCard.findOne({ user_id: userId, status: 'active' })
      .sort({ issued_at: -1 })
      .limit(1);

    if (!card) {
      throw new Error('No active card found');
    }

    // Check if sufficient balance
    if (card.available_balance < data.amount) {
      // Create declined transaction
      const transaction = new Transaction({
        id: uuidv4(),
        card_id: card.id,
        user_id: userId,
        merchant: data.merchant,
        amount: data.amount,
        currency: data.currency || 'INR',
        amount_inr: data.amount,
        category: data.category || 'Other',
        location: data.location || 'Online',
        status: 'declined',
        decline_reason: 'Insufficient balance',
        created_at: new Date()
      });

      await transaction.save();

      return {
        success: false,
        status: 'declined',
        reason: 'Insufficient balance',
        transaction: {
          id: transaction.id,
          merchant: transaction.merchant,
          amount: transaction.amount,
          status: transaction.status
        }
      };
    }

    // Deduct amount from available balance
    card.available_balance -= data.amount;
    card.last_used_at = new Date();
    await card.save();

    // Create successful transaction
    const transaction = new Transaction({
      id: uuidv4(),
      card_id: card.id,
      user_id: userId,
      merchant: data.merchant,
      amount: data.amount,
      currency: data.currency || 'INR',
      amount_inr: data.amount,
      category: data.category || 'Other',
      location: data.location || 'Online',
      status: 'success',
      created_at: new Date()
    });

    await transaction.save();

    return {
      success: true,
      status: 'success',
      transaction: {
        id: transaction.id,
        merchant: transaction.merchant,
        amount: transaction.amount,
        amountInr: transaction.amount_inr,
        category: transaction.category,
        location: transaction.location,
        status: transaction.status,
        time: 'Just now',
        createdAt: transaction.created_at
      },
      card: {
        availableBalance: card.available_balance,
        creditLimit: card.credit_limit
      }
    };
  }

  /**
   * Get transaction history
   */
  async getTransactions(userId: string, limit: number = 10): Promise<any[]> {
    const transactions = await Transaction.find({ user_id: userId })
      .sort({ created_at: -1 })
      .limit(limit);

    return transactions.map(tx => ({
      id: tx.id,
      merchant: tx.merchant,
      amount: tx.amount,
      amountInr: tx.amount_inr,
      currency: tx.currency,
      category: tx.category,
      location: tx.location,
      status: tx.status,
      declineReason: tx.decline_reason,
      createdAt: tx.created_at,
      time: this.getTimeAgo(tx.created_at)
    }));
  }

  /**
   * Get time ago string
   */
  private getTimeAgo(date: Date): string {
    const seconds = Math.floor((new Date().getTime() - date.getTime()) / 1000);
    
    if (seconds < 60) return 'Just now';
    if (seconds < 3600) return `${Math.floor(seconds / 60)} min ago`;
    if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`;
    return `${Math.floor(seconds / 86400)}d ago`;
  }

  /**
   * Freeze/Unfreeze card
   */
  async toggleCardStatus(userId: string, freeze: boolean): Promise<any> {
    const card = await VirtualCard.findOne({ user_id: userId, status: { $ne: 'cancelled' } })
      .sort({ issued_at: -1 })
      .limit(1);

    if (!card) {
      throw new Error('No card found');
    }

    card.status = freeze ? 'frozen' : 'active';
    await card.save();

    return {
      status: card.status,
      message: freeze ? 'Card frozen successfully' : 'Card activated successfully'
    };
  }
}

export default new CardService();
