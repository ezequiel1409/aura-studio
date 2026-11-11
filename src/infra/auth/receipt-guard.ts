import { NextRequest } from "next/server";
import { Order } from "../../domain/order";
import { isAuthenticatedAdmin } from "./guard";
import { getAuthenticatedCustomer } from "./customer-session";
import { verifyReceiptSignature } from "./receipt-signature";

export interface ReceiptAuthResult {
  authorized: boolean;
  status: number;
  error?: string;
}

/**
 * BR-08, BR-10, BR-41: Autoriza el acceso al comprobante de transferencia bancaria.
 * Reglas de seguridad:
 * 1. Enlace firmado válido (HMAC-SHA256 con fecha de expiración vigente, utilizado en emails).
 * 2. Administradora con sesión activa (acceso a cualquier comprobante desde el panel).
 * 3. Clienta autenticada propietaria de la orden (por customerId o email verificado).
 */
export async function authorizeReceiptAccess(
  req: NextRequest,
  order: Order
): Promise<ReceiptAuthResult> {
  // 1. Verificar firma en URL (query params token & expires)
  const token = req.nextUrl.searchParams.get("token");
  const expiresStr = req.nextUrl.searchParams.get("expires");

  if (token && expiresStr) {
    const expiresAt = parseInt(expiresStr, 10);
    if (!Number.isNaN(expiresAt)) {
      const isValid = await verifyReceiptSignature(order.id, token, expiresAt);
      if (isValid) {
        return { authorized: true, status: 200 };
      }
      return {
        authorized: false,
        status: 403,
        error: "El enlace al comprobante es inválido o ha expirado.",
      };
    }
  }

  // 2. Verificar sesión de administradora
  const isAdmin = await isAuthenticatedAdmin(req);
  if (isAdmin) {
    return { authorized: true, status: 200 };
  }

  // 3. Verificar sesión de clienta propietaria de la orden
  const customer = await getAuthenticatedCustomer(req);
  if (customer) {
    const isOwnerById = order.customerId != null && customer.customerId === order.customerId;
    const isOwnerByEmail =
      Boolean(customer.email && order.customerEmail) &&
      customer.email.trim().toLowerCase() === order.customerEmail!.trim().toLowerCase();

    if (isOwnerById || isOwnerByEmail) {
      return { authorized: true, status: 200 };
    }

    return {
      authorized: false,
      status: 403,
      error: "No tenés permisos para acceder al comprobante de esta orden.",
    };
  }

  // 4. Sin credenciales ni firma
  return {
    authorized: false,
    status: 401,
    error: "Se requiere inicio de sesión o un enlace firmado válido para ver el comprobante.",
  };
}
