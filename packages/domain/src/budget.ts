export type CurrencyCode = "DKK" | "EUR" | "NOK" | "SEK" | "GBP";

export type Money = {
  amount: number;
  currency: CurrencyCode;
};

export type BudgetItem = {
  id: string;
  label: string;
  cost: Money;
  category: "transport" | "lodging" | "food" | "fees" | "custom";
};
