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
