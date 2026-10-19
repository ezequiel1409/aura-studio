export type ClaimType = "REVOCATION" | "EXCHANGE";
export type ClaimStatus = "PENDING" | "APPROVED_RESTOCKED" | "REJECTED_CONDITION" | "RESOLVED";

export interface OrderClaim {
  id: string;
  orderId: number;
  orderCode: number;
  type: ClaimType;
  claimCode: string;
  customerName: string;
  customerDni: string;
  customerEmail: string;
  customerPhone: string;
  reason?: string | null;
  conditionAccepted: boolean;
  status: ClaimStatus;
  rejectionReason?: string | null;
  adminNotes?: string | null;
  createdAt: number;
  resolvedAt?: number | null;
}

export interface CreateOrderClaimInput {
  orderCode: number;
  customerDni: string;
  contactValue: string; // email o teléfono para verificar pertenencia
  customerName?: string;
  type?: ClaimType;
  reason?: string;
  conditionAccepted: boolean;
}

export interface InspectClaimInput {
  decision: "APPROVE_RESTOCK" | "REJECT_CONDITION";
  rejectionReason?: string;
  adminNotes?: string;
}
