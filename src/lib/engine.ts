// src/lib/engine.ts

export interface Card {
  id?: any;       // Add this line to fix the "id does not exist" error
  name: string;
  points: number;
}

// ... rest of your engine.ts code (AwardOption, TransferResult, etc.)

export interface AwardOption {
  airline: string;
  program: 'Aeroplan' | 'Flying Blue' | 'British Airways' | 'United' | 'Bilt';
  miles_required: number;
  tax_usd: number;
  cash_equivalent_usd: number;
}

export interface TransferResult {
  transfers: {
    from: string;   // Fixed: UI expects 'from'
    amount: number; // Fixed: UI expects 'amount'
  }[];
  total_miles_secured: number;
}

export class AwardEngine {
  optimize(portfolio: Card[], target: AwardOption): TransferResult {
    let needed = target.miles_required;
    const transfers: { from: string; amount: number }[] = [];
    let totalSecured = 0;

    // Simple optimization: Use cards in order until flight is covered
    for (const card of portfolio) {
      if (needed <= 0) break;

      const contribution = Math.min(card.points, needed);
      if (contribution > 0) {
        transfers.push({
          from: card.name,
          amount: contribution
        });
        needed -= contribution;
        totalSecured += contribution;
      }
    }

    return {
      transfers,
      total_miles_secured: totalSecured
    };
  }
}