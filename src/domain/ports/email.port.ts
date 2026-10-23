import { EmailCustomizationConfig } from "../email/customization";

export interface SendEmailOptions {
  to: string;
  subject: string;
  html: string;
  text?: string;
  resetLink?: string;
  fromName?: string;
  from?: string;
}

export interface SendEmailResult {
  success: boolean;
  messageId?: string;
  error?: string;
  devLink?: string;
}

export interface OrderEmailItem {
  productTitle: string;
  productCode: number;
  colorName: string;
  size: string;
  quantity: number;
  unitPriceCents: number;
  photoUrl?: string | null;
}

export interface OrderEmailData {
  orderId: number;
  orderCode: number;
  formattedCode: string;
  customerName: string;
  customerEmail: string;
  customerPhone?: string | null;
  deliveryMethod: "PICKUP" | "HOME_DELIVERY" | "MOTORCYCLE";
  deliveryAddress?: string | null;
  deliveryNotes?: string | null;
  items: OrderEmailItem[];
  subtotalCents: number;
  shippingCents: number;
  discountCents: number;
  totalCents: number;
  currency: string;
  paymentMethod: string;
  paymentStatus: string;
  bankDetails?: {
    bankName?: string | null;
    accountHolder?: string | null;
    cbu?: string | null;
    alias?: string | null;
    cuit?: string | null;
  } | null;
  showroomAddress?: string | null;
  brandName?: string;
  receiptUrl?: string;
  supportWhatsapp?: string;
  emailCustomization?: EmailCustomizationConfig;
}

export interface IEmailService {
  sendEmail(options: SendEmailOptions): Promise<SendEmailResult>;
  sendPasswordResetEmail(
    to: string,
    resetLink: string,
    userName?: string,
    brandName?: string
  ): Promise<SendEmailResult>;
  sendOrderCreatedEmail?(toOrData: string | OrderEmailData, maybeData?: OrderEmailData): Promise<SendEmailResult>;
  sendOrderPaidEmail?(toOrData: string | OrderEmailData, maybeData?: OrderEmailData): Promise<SendEmailResult>;
  sendOrderShippedEmail?(toOrData: string | OrderEmailData, maybeData?: OrderEmailData): Promise<SendEmailResult>;
  sendOrderDeliveredEmail?(toOrData: string | OrderEmailData, maybeData?: OrderEmailData): Promise<SendEmailResult>;
  sendOrderCancelledEmail?(toOrData: string | OrderEmailData, maybeData?: OrderEmailData): Promise<SendEmailResult>;
  sendAdminNewOrderAlertEmail?(toOrData: string | OrderEmailData, maybeData?: OrderEmailData): Promise<SendEmailResult>;
}
