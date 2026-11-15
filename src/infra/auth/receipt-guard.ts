import { NextRequest } from "next/server";
import { Order } from "../../domain/order";
import { isAuthenticatedAdmin } from "./guard";
import { CustomerSessionPayload, getAuthenticatedCustomer } from "./customer-session";
import { verifyReceiptSignature } from "./receipt-signature";

export interface ReceiptAuthResult {
  authorized: boolean;
  status: number;
  error?: string;
}

/**
 * BR-08, BR-10, BR-41: Guardián orientado a objetos con responsabilidad única (SRP)
 * para autorizar lectura (GET) y carga (POST) de comprobantes de transferencia.
 */
export class ReceiptAccessGuard {
  async authorizeRead(req: NextRequest, order: Order): Promise<ReceiptAuthResult> {
    const signedUrlResult = await this.checkSignedUrlAccess(req, order.id);
    if (signedUrlResult) {
      return signedUrlResult;
    }

    const adminResult = await this.checkAdminAccess(req);
    if (adminResult) {
      return adminResult;
    }

    const customerResult = await this.checkCustomerOwnerAccess(req, order);
    if (customerResult) {
      return customerResult;
    }

    return {
      authorized: false,
      status: 401,
      error: "Se requiere inicio de sesión o un enlace firmado válido para ver el comprobante.",
    };
  }

  async authorizeUpload(req: NextRequest, order: Order): Promise<ReceiptAuthResult> {
    const adminResult = await this.checkAdminAccess(req);
    if (adminResult) {
      return adminResult;
    }

    const customerResult = await this.checkCustomerOwnerAccess(req, order);
    if (customerResult) {
      return customerResult;
    }

    return {
      authorized: false,
      status: 401,
      error: "Para cargar el comprobante posteriormente debés iniciar sesión o crear una cuenta con tu email y contraseña.",
    };
  }

  private async checkSignedUrlAccess(
    req: NextRequest,
    orderId: number
  ): Promise<ReceiptAuthResult | null> {
    const token = req.nextUrl.searchParams.get("token");
    const expiresStr = req.nextUrl.searchParams.get("expires");
    if (!token || !expiresStr) {
      return null;
    }

    const expiresAt = parseInt(expiresStr, 10);
    if (Number.isNaN(expiresAt)) {
      return null;
    }

    const isValid = await verifyReceiptSignature(orderId, token, expiresAt);
    if (isValid) {
      return { authorized: true, status: 200 };
    }

    return {
      authorized: false,
      status: 403,
      error: "El enlace al comprobante es inválido o ha expirado.",
    };
  }

  private async checkAdminAccess(req: NextRequest): Promise<ReceiptAuthResult | null> {
    const isAdmin = await isAuthenticatedAdmin(req);
    return isAdmin ? { authorized: true, status: 200 } : null;
  }

  private async checkCustomerOwnerAccess(
    req: NextRequest,
    order: Order
  ): Promise<ReceiptAuthResult | null> {
    const customer = await getAuthenticatedCustomer(req);
    if (!customer) {
      return null;
    }

    if (this.isOrderOwnedByCustomer(customer, order)) {
      return { authorized: true, status: 200 };
    }

    return {
      authorized: false,
      status: 403,
      error: "No tenés permisos para acceder al comprobante de esta orden.",
    };
  }

  private isOrderOwnedByCustomer(customer: CustomerSessionPayload, order: Order): boolean {
    const isOwnerById = order.customerId != null && customer.customerId === order.customerId;
    const isOwnerByEmail =
      Boolean(customer.email && order.customerEmail) &&
      customer.email.trim().toLowerCase() === order.customerEmail!.trim().toLowerCase();

    return isOwnerById || isOwnerByEmail;
  }
}

const defaultReceiptAccessGuard = new ReceiptAccessGuard();

export async function authorizeReceiptAccess(
  req: NextRequest,
  order: Order
): Promise<ReceiptAuthResult> {
  return defaultReceiptAccessGuard.authorizeRead(req, order);
}

export async function authorizeReceiptUpload(
  req: NextRequest,
  order: Order
): Promise<ReceiptAuthResult> {
  return defaultReceiptAccessGuard.authorizeUpload(req, order);
}
