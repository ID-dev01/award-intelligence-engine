// src/lib/engine.ts

/**
 * Data Interfaces for the Engine
 */
export interface Card {
  name: string;
  points: number;
}

export interface AwardOption {
  airline: string;
  program: 'Aeroplan' | 'United MileagePlus' | 'Avianca LifeMiles';
  miles_required: number;
  tax_usd: number;
  cash_equivalent_usd: number;
}

export interface TransferResult {
  bank: string;
  transfer_amount: number;
  remaining_balance: number;
}

export interface OptimizationResult {
  is_possible: boolean;
  shortfall: number;
  total_miles: number;
  cpp: number;
  transfers: TransferResult[];
  verdict: string;
}

/**
 * AwardEngine Class
 * Handles weighted point allocation and redemption valuation.
 */
export class AwardEngine {
  // Mapping of Loyalty Programs to their Credit Card Transfer Partners (1:1 Ratio)
  private readonly PARTNER_MAP: Record<string, string[]> = {
    'Aeroplan': ['Amex Gold', 'Chase UR', 'Capital One Venture X', 'Bilt'],
    'Avianca LifeMiles': ['Amex Gold', 'Capital One Venture X', 'Bilt'],
    'United MileagePlus': ['Chase UR', 'Bilt'],
  };

  /**
   * Weighted Rarity Score
   * 1 = Highest Rarity (Preserve these points longest)
   * 4 = Lowest Rarity (Use these points first)
   */
  private readonly ECOSYSTEM_WEIGHTS: Record<string, number> = {
    'Bilt': 1,                  // Hardest to earn (Rent/Spend only)
    'Chase UR': 2,              // High value, strictly regulated by 5/24 rule
    'Amex Gold': 3,             // High earn rate via 4x categories
    'Capital One Venture X': 4,  // Easiest "catch-all" 2x miles currency
  };

  /**
   * Main Logic: Calculate the optimal way to fund a flight
   */
  public optimize(portfolio: Card[], award: AwardOption): OptimizationResult {
    let needed = award.miles_required;
    const transfers: TransferResult[] = [];
    
    // 1. Identify which cards in the user's portfolio can transfer to the target program
    const validCards = portfolio.filter(card => 
      this.PARTNER_MAP[award.program]?.includes(card.name)
    );

    // 2. Sort by Weight (Descending): 
    // We prioritize using higher-weighted cards (e.g., Capital One) 
    // before touching lower-weighted cards (e.g., Bilt).
    const sortedCards = [...validCards].sort((a, b) => 
      (this.ECOSYSTEM_WEIGHTS[b.name] || 0) - (this.ECOSYSTEM_WEIGHTS[a.name] || 0)
    );

    // 3. Allocate Points from the sorted cards
    for (const card of sortedCards) {
      if (needed <= 0) break;
      
      const contribution = Math.min(card.points, needed);
      if (contribution > 0) {
        transfers.push({
          bank: card.name,
          transfer_amount: contribution,
          remaining_balance: card.points - contribution
        });
        needed -= contribution;
      }
    }

    // 4. Calculate Economics (Cents Per Point)
    // Formula: (Cash Cost - Taxes) / Miles Required * 100
    const cpp = ((award.cash_equivalent_usd - award.tax_usd) / award.miles_required) * 100;
    
    return {
      is_possible: needed <= 0,
      shortfall: needed,
      total_miles: award.miles_required,
      cpp: parseFloat(cpp.toFixed(2)),
      transfers,
      verdict: this.getVerdict(cpp, award.miles_required),
    };
  }

  /**
   * Business logic for recommending action based on CPP
   */
  private getVerdict(cpp: number, miles: number): string {
    if (cpp < 1.5) return "POOR VALUE: Consider paying cash instead.";
    if (cpp > 3.5) return "UNBELIEVABLE DEAL: Book immediately before space vanishes.";
    if (cpp > 2.0) return "GREAT VALUE: This is a solid redemption.";
    return "AVERAGE VALUE: Monitor for a potential price drop.";
  }
}