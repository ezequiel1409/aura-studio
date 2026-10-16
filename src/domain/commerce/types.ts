export interface Commerce {
  id: number;
  slug: string;
  name: string;
  whatsappNumber?: string | null;
  address?: string | null;
  adminUserId?: number | null;
  isActive: boolean;
  createdAt: number;
  updatedAt: number;
}

export interface CreateCommerceInput {
  slug: string;
  name: string;
  whatsappNumber?: string | null;
  address?: string | null;
  adminUserId?: number | null;
  isActive?: boolean;
}

