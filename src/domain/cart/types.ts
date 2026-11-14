export interface CartItem {
  key: string; // Identificador compuesto: `${code}_${colorName}_${size}`
  productId: number;
  code: number;
  formattedCode: string;
  title: string | null;
  colorName: string;
  hexCode?: string | null;
  size: string;
  quantity: number;
  maxStock: number;
  unitPriceCents: number | null;
  currency: string;
  photoUrl?: string | null;
}

export interface CartServerItemSnapshot {
  remainingStock: number;
  unitPriceCents?: number | null;
  title?: string | null;
}

export interface CartPriceChangeNotice {
  key: string;
  code: number;
  formattedCode: string;
  title: string | null;
  previousPriceCents: number | null;
  currentPriceCents: number;
}
