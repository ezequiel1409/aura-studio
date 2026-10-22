import {
  Building2,
  Banknote,
  CreditCard,
  MessageCircle,
  QrCode,
  Wallet,
} from "lucide-react";
import { PaymentMethod } from "../../domain/payment/types";

interface PaymentProcessorIconProps {
  method: PaymentMethod | string;
  className?: string;
}

export function PaymentProcessorIcon({
  method,
  className = "h-4 w-4",
}: PaymentProcessorIconProps) {
  switch (method) {
    case "MERCADOPAGO":
      return (
        <svg
          className={`${className} shrink-0`}
          viewBox="0 0 24 24"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          aria-hidden="true"
        >
          <rect width="24" height="24" rx="6" fill="#009EE3" />
          <path
            d="M6 13.5C6.8 12.2 8.4 11.2 10.5 11.2C13 11.2 14.8 12.8 15.2 14.5M8 10C8.8 8.8 10.3 8 12 8C14.5 8 16.5 9.8 17 12"
            stroke="white"
            strokeWidth="1.8"
            strokeLinecap="round"
          />
          <circle cx="12" cy="5.8" r="1.3" fill="white" />
        </svg>
      );
    case "TRANSFER":
      return <Building2 className={`${className} text-[#926a3c] shrink-0`} aria-hidden="true" />;
    case "CASH":
      return <Banknote className={`${className} text-emerald-600 shrink-0`} aria-hidden="true" />;
    case "WHATSAPP":
      return <MessageCircle className={`${className} text-[#25D366] shrink-0`} aria-hidden="true" />;
    case "PAYWAY":
      return <CreditCard className={`${className} text-indigo-600 shrink-0`} aria-hidden="true" />;
    case "GETNET":
      return <CreditCard className={`${className} text-rose-600 shrink-0`} aria-hidden="true" />;
    case "MODO":
      return <QrCode className={`${className} text-teal-600 shrink-0`} aria-hidden="true" />;
    case "GOOGLEPAY":
      return <Wallet className={`${className} text-amber-500 shrink-0`} aria-hidden="true" />;
    default:
      return <CreditCard className={`${className} text-stone-600 shrink-0`} aria-hidden="true" />;
  }
}
