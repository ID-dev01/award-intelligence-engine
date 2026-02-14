// src/lib/cardStrategy.ts

export interface CreditCardProduct {
  name: string;
  bank: string;
  signup_bonus: number;
  annual_fee: number;
  min_spend: number;
  transfer_partners: string[];
}

export const AVAILABLE_CARDS: CreditCardProduct[] = [
  {
    name: "Chase Sapphire Preferred",
    bank: "Chase",
    signup_bonus: 60000,
    annual_fee: 95,
    min_spend: 4000,
    transfer_partners: ["Aeroplan", "United MileagePlus"]
  },
  {
    name: "Amex Business Gold",
    bank: "Amex",
    signup_bonus: 125000,
    annual_fee: 375,
    min_spend: 10000,
    transfer_partners: ["Aeroplan", "Avianca LifeMiles"]
  }
];

export function evaluateNewCardStrategy(shortfall: number, targetProgram: string, cpp: number) {
  // Find cards that transfer to the program where the user has a shortfall
  const options = AVAILABLE_CARDS.filter(card => 
    card.transfer_partners.includes(targetProgram)
  );

  return options.map(card => {
    // Net Value = (Bonus Points * Redemption CPP) - Annual Fee
    const bonusValue = (card.signup_bonus * (cpp / 100));
    const netGain = bonusValue - card.annual_fee;
    
    return {
      ...card,
      net_gain: Math.round(netGain),
      is_viable: card.signup_bonus >= shortfall,
      recommendation: `Opening this card covers ${Math.min(100, Math.round((card.signup_bonus / shortfall) * 100))}% of your gap.`
    };
  }).sort((a, b) => b.net_gain - a.net_gain);
}