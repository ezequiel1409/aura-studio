export interface SendEmailOptions {
  to: string;
  subject: string;
  html: string;
  text?: string;
  resetLink?: string;
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
}

export interface IEmailService {
  sendEmail(options: SendEmailOptions): Promise<SendEmailResult>;
  sendPasswordResetEmail(to: string, resetLink: string, userName?: string): Promise<SendEmailResult>;
  sendOrderCreatedEmail?(to: string, data: OrderEmailData): Promise<SendEmailResult>;
  sendOrderPaidEmail?(to: string, data: OrderEmailData): Promise<SendEmailResult>;
  sendOrderShippedEmail?(to: string, data: OrderEmailData): Promise<SendEmailResult>;
  sendOrderCancelledEmail?(to: string, data: OrderEmailData): Promise<SendEmailResult>;
  sendAdminNewOrderAlertEmail?(to: string, data: OrderEmailData): Promise<SendEmailResult>;
}
