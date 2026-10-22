"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  Package,
  MapPin,
  User,
  LogOut,
  ShoppingBag,
  ExternalLink,
  Plus,
  Trash2,
  CheckCircle2,
  Clock,
  ShieldCheck,
  AlertCircle,
  Loader2,
  X,
  Phone,
  Mail,
  Calendar,
  LayoutDashboard,
  Heart,
  SlidersHorizontal,
  FileText,
  Upload,
  Building2,
  Copy,
  Truck,
  Check,
  Eye,
  EyeOff,
  Sparkles,
  ArrowRight,
  Sun,
  Moon,
  Laptop,
} from "lucide-react";
import { SafeCustomer, CustomerAddress } from "../../domain/customer/types";
import { Order, OrderStatus } from "../../domain/order/types";
import { Product } from "../../domain/product/types";
import { formatOrderCode } from "../../domain/order/rules";
import { formatProductCode } from "../../domain/product/rules";
import { formatPrice } from "../../lib/format/currency";
import { useCartStore } from "../../stores/cart.store";

interface CustomerPortalClientProps {
  customer: SafeCustomer;
  initialOrders: Order[];
  initialAddresses: CustomerAddress[];
  allProducts?: Product[];
  whatsappNumber?: string;
  brandName?: string;
}

type TabType = "overview" | "orders" | "saved" | "addresses" | "profile" | "preferences";

export function CustomerPortalClient({
  customer: initialCustomer,
  initialOrders,
  initialAddresses,
  allProducts = [],
  whatsappNumber = "+5491100000000",
  brandName = "Aura Studio",
}: CustomerPortalClientProps) {
  const router = useRouter();
  const [customer, setCustomer] = useState<SafeCustomer>(initialCustomer);
  const [activeTab, setActiveTab] = useState<TabType>("overview");
  const [orders, setOrders] = useState<Order[]>(initialOrders);
  const [uploadingReceiptOrderId, setUploadingReceiptOrderId] = useState<number | null>(null);
  const [receiptUploadError, setReceiptUploadError] = useState<Record<number, string | null>>({});
  const [receiptUploadSuccess, setReceiptUploadSuccess] = useState<Record<number, boolean>>({});
  const [selectedPdfFiles, setSelectedPdfFiles] = useState<Record<number, File>>({});
  const [copiedPortalField, setCopiedPortalField] = useState<string | null>(null);
  const [addresses, setAddresses] = useState<CustomerAddress[]>(initialAddresses);

  // Carrito store
  const { addItem, openCart } = useCartStore();

  // Piezas guardadas (Favoritos) desde localStorage
  const [savedIds, setSavedIds] = useState<number[]>([]);
  const [savedProducts, setSavedProducts] = useState<Product[]>([]);

  useEffect(() => {
    const loadSaved = () => {
      try {
        const stored = localStorage.getItem("aura_saved_pieces");
        if (stored) {
          const ids: number[] = JSON.parse(stored);
          if (Array.isArray(ids)) {
            setSavedIds(ids);
            const matched = allProducts.filter((p) => ids.includes(p.id));
            setSavedProducts(matched);
          }
        } else {
          setSavedIds([]);
          setSavedProducts([]);
        }
      } catch {
        setSavedIds([]);
        setSavedProducts([]);
      }
    };

    loadSaved();
    const handleUpdate = () => loadSaved();
    window.addEventListener("aura_saved_updated", handleUpdate);
    window.addEventListener("storage", handleUpdate);
    return () => {
      window.removeEventListener("aura_saved_updated", handleUpdate);
      window.removeEventListener("storage", handleUpdate);
    };
  }, [allProducts]);

  const handleRemoveSaved = (productId: number) => {
    try {
      const updated = savedIds.filter((id) => id !== productId);
      setSavedIds(updated);
      setSavedProducts((prev) => prev.filter((p) => p.id !== productId));
      localStorage.setItem("aura_saved_pieces", JSON.stringify(updated));
      window.dispatchEvent(new CustomEvent("aura_saved_updated", { detail: { savedIds: updated } }));
    } catch {}
  };

  const handleAddSavedToCart = (product: Product) => {
    const firstColor = product.colors?.[0];
    const firstSize = firstColor?.sizes?.[0];
    const photoUrl = product.photos?.[0]?.keyThumb || product.photos?.[0]?.keyFull || null;

    addItem({
      productId: product.id,
      code: product.code,
      formattedCode: formatProductCode(product.code),
      title: product.title,
      colorName: firstColor?.name || "Único",
      hexCode: firstColor?.hexCode || null,
      size: firstSize?.size || product.size || "U",
      maxStock: firstSize?.stock ?? 1,
      unitPriceCents: product.priceCents,
      currency: product.currency,
      photoUrl,
    });
    openCart();
  };

  // Estados de modal y acciones de dirección
  const [isAddingAddress, setIsAddingAddress] = useState(false);
  const [addressLoading, setAddressLoading] = useState(false);
  const [addressError, setAddressError] = useState<string | null>(null);

  // Formulario nueva dirección
  const [label, setLabel] = useState("Casa");
  const [addressLine, setAddressLine] = useState("");
  const [city, setCity] = useState("");
  const [postalCode, setPostalCode] = useState("");
  const [recipientName, setRecipientName] = useState(customer.name || "");
  const [recipientPhone, setRecipientPhone] = useState(customer.phone || "");
  const [notes, setNotes] = useState("");
  const [isDefault, setIsDefault] = useState(addresses.length === 0);

  // Formulario de edición de perfil
  const [profileName, setProfileName] = useState(customer.name || "");
  const [profilePhone, setProfilePhone] = useState(customer.phone || "");
  const [profileDni, setProfileDni] = useState(customer.dni || "");
  const [profileLoading, setProfileLoading] = useState(false);
  const [profileSuccess, setProfileSuccess] = useState<string | null>(null);
  const [profileError, setProfileError] = useState<string | null>(null);

  // Formulario de cambio de contraseña
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [passwordLoading, setPasswordLoading] = useState(false);
  const [passwordSuccess, setPasswordSuccess] = useState<string | null>(null);
  const [passwordError, setPasswordError] = useState<string | null>(null);

  // Preferencias
  const [prefTheme, setPrefTheme] = useState<"light" | "dark" | "system">("light");
  const [prefChannel, setPrefChannel] = useState<"whatsapp" | "email">("whatsapp");
  const [prefTopSize, setPrefTopSize] = useState<string>("M");
  const [prefShoeSize, setPrefShoeSize] = useState<string>("38");
  const [prefDrops, setPrefDrops] = useState<boolean>(true);
  const [prefSuccess, setPrefSuccess] = useState<string | null>(null);

  // Cargar preferencias iniciales de localStorage
  useEffect(() => {
    try {
      const storedTheme = localStorage.getItem("aura_client_theme");
      if (storedTheme === "light" || storedTheme === "dark" || storedTheme === "system") {
        setPrefTheme(storedTheme);
      }
      const storedChannel = localStorage.getItem("aura_pref_channel");
      if (storedChannel === "whatsapp" || storedChannel === "email") {
        setPrefChannel(storedChannel);
      }
      const storedSizes = localStorage.getItem("aura_pref_sizes");
      if (storedSizes) {
        const parsed = JSON.parse(storedSizes);
        if (parsed.top) setPrefTopSize(parsed.top);
        if (parsed.shoe) setPrefShoeSize(parsed.shoe);
      }
      const storedDrops = localStorage.getItem("aura_pref_drops");
      if (storedDrops !== null) {
        setPrefDrops(storedDrops === "true");
      }
    } catch {}
  }, []);

  const handleSavePreferences = (e: React.FormEvent) => {
    e.preventDefault();
    try {
      localStorage.setItem("aura_client_theme", prefTheme);
      localStorage.setItem("aura_pref_channel", prefChannel);
      localStorage.setItem(
        "aura_pref_sizes",
        JSON.stringify({ top: prefTopSize, shoe: prefShoeSize })
      );
      localStorage.setItem("aura_pref_drops", String(prefDrops));

      // Aplicar data-theme o clase
      if (prefTheme === "dark") {
        document.documentElement.classList.add("dark");
      } else {
        document.documentElement.classList.remove("dark");
      }

      setPrefSuccess("Tus preferencias se guardaron correctamente.");
      setTimeout(() => setPrefSuccess(null), 3500);
    } catch {}
  };

  // Logout
  const [loggingOut, setLoggingOut] = useState(false);

  const handleLogout = async () => {
    setLoggingOut(true);
    try {
      await fetch("/api/auth/logout", { method: "POST" });
      router.push("/");
      router.refresh();
    } catch {
      router.push("/");
    }
  };

  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setProfileError(null);
    setProfileSuccess(null);

    const dniDigits = profileDni.replace(/\D/g, "");
    if (profileDni.trim() && dniDigits.length < 6) {
      setProfileError("Ingresá un número de DNI válido (mínimo 6 dígitos).");
      return;
    }

    setProfileLoading(true);

    try {
      const res = await fetch("/api/customer/profile", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: profileName,
          phone: profilePhone,
          dni: dniDigits || null,
        }),
      });

      const data = await res.json();
      if (!res.ok || !data.ok) {
        throw new Error(data.error || "No se pudo actualizar tu perfil.");
      }

      setCustomer(data.customer);
      setProfileSuccess("Datos personales actualizados correctamente.");
      setTimeout(() => setProfileSuccess(null), 3500);
    } catch (err) {
      setProfileError(err instanceof Error ? err.message : "Error al actualizar perfil.");
    } finally {
      setProfileLoading(false);
    }
  };

  const handleUpdatePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setPasswordError(null);
    setPasswordSuccess(null);

    if (newPassword.length < 8) {
      setPasswordError("La nueva contraseña debe tener al menos 8 caracteres.");
      return;
    }

    if (newPassword !== confirmPassword) {
      setPasswordError("Las contraseñas no coinciden.");
      return;
    }

    setPasswordLoading(true);

    try {
      const res = await fetch("/api/customer/profile", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          currentPassword,
          newPassword,
        }),
      });

      const data = await res.json();
      if (!res.ok || !data.ok) {
        throw new Error(data.error || "No se pudo actualizar la contraseña.");
      }

      setPasswordSuccess("¡Contraseña actualizada exitosamente!");
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
      setTimeout(() => setPasswordSuccess(null), 3500);
    } catch (err) {
      setPasswordError(err instanceof Error ? err.message : "Error al actualizar contraseña.");
    } finally {
      setPasswordLoading(false);
    }
  };

  const handleCreateAddress = async (e: React.FormEvent) => {
    e.preventDefault();
    setAddressError(null);
    setAddressLoading(true);

    try {
      const res = await fetch("/api/customer/addresses", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          label,
          address: addressLine,
          city: city || null,
          postalCode: postalCode || null,
          recipientName: recipientName || null,
          recipientPhone: recipientPhone || null,
          notes: notes || null,
          isDefault,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "No se pudo guardar la dirección.");
      }

      if (isDefault) {
        setAddresses((prev) => [
          ...prev.map((a) => ({ ...a, isDefault: false })),
          data.address,
        ]);
      } else {
        setAddresses((prev) => [...prev, data.address]);
      }

      setIsAddingAddress(false);
      setAddressLine("");
      setCity("");
      setPostalCode("");
      setNotes("");
    } catch (err) {
      setAddressError(err instanceof Error ? err.message : "Error al guardar dirección.");
    } finally {
      setAddressLoading(false);
    }
  };

  const handleSetDefaultAddress = async (id: number) => {
    try {
      const res = await fetch(`/api/customer/addresses/${id}`, {
        method: "PATCH",
      });
      if (res.ok) {
        setAddresses((prev) =>
          prev.map((a) => ({
            ...a,
            isDefault: a.id === id,
          }))
        );
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleDeleteAddress = async (id: number) => {
    if (!confirm("¿Deseas eliminar esta dirección guardada?")) return;

    try {
      const res = await fetch(`/api/customer/addresses/${id}`, {
        method: "DELETE",
      });
      if (res.ok) {
        setAddresses((prev) => prev.filter((a) => a.id !== id));
      }
    } catch (err) {
      console.error(err);
    }
  };


  const handleCopyPortal = async (text: string, fieldId: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedPortalField(fieldId);
      setTimeout(() => setCopiedPortalField(null), 2000);
    } catch {}
  };

  const handleUploadReceiptFromPortal = async (orderId: number, orderCode: number) => {
    const file = selectedPdfFiles[orderId];
    if (!file) return;

    setUploadingReceiptOrderId(orderId);
    setReceiptUploadError((prev) => ({ ...prev, [orderId]: null }));

    try {
      const reader = new FileReader();
      const base64Promise = new Promise<string>((resolve, reject) => {
        reader.onload = () => resolve(reader.result as string);
        reader.onerror = () => reject(new Error("Error al leer el archivo PDF"));
      });
      reader.readAsDataURL(file);
      const base64 = await base64Promise;

      const res = await fetch(`/api/orders/${orderCode}/receipt`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ receiptBase64: base64 }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Error al subir el comprobante");
      }

      setReceiptUploadSuccess((prev) => ({ ...prev, [orderId]: true }));
      setOrders((prev) =>
        prev.map((o) =>
          o.id === orderId
            ? {
                ...o,
                transferReceiptUrl: data.order?.transferReceiptUrl || base64,
                transferReceiptUploadedAt: data.order?.transferReceiptUploadedAt || Math.floor(Date.now() / 1000),
              }
            : o
        )
      );
    } catch (err) {
      setReceiptUploadError((prev) => ({
        ...prev,
        [orderId]: err instanceof Error ? err.message : "Error al subir el comprobante",
      }));
    } finally {
      setUploadingReceiptOrderId(null);
    }
  };

  const getStatusBadge = (status: OrderStatus) => {
    switch (status) {
      case "PENDING":
        return {
          label: "Pendiente de coordinación",
          classes: "bg-amber-50 text-amber-800 border-amber-200",
        };
      case "CONFIRMED":
        return {
          label: "Confirmado",
          classes: "bg-sky-50 text-sky-800 border-sky-200",
        };
      case "PAID":
        return {
          label: "Abonado y listo",
          classes: "bg-emerald-50 text-emerald-800 border-emerald-200",
        };
      case "CANCELLED":
        return {
          label: "Cancelado",
          classes: "bg-stone-100 text-stone-600 border-stone-200",
        };
      default:
        return {
          label: status,
          classes: "bg-stone-50 text-stone-700 border-stone-200",
        };
    }
  };

  const getDeliveryLabel = (method: string) => {
    switch (method) {
      case "HOME_DELIVERY":
        return "Envío a domicilio (3 a 5 días hábiles)";
      case "MOTORCYCLE":
        return "Motomensajería privada (En el día)";
      case "PICKUP":
        return "Retiro en Showroom (Inmediato sin costo)";
      default:
        return method;
    }
  };

  const cleanWhatsapp = whatsappNumber.replace(/\D/g, "");
  const latestOrder = orders.length > 0 ? orders[0] : null;

  // Cálculo de progreso para línea de tiempo del último pedido (4 pasos)
  const getTimelineProgress = (status: OrderStatus) => {
    switch (status) {
      case "PENDING":
        return 1;
      case "CONFIRMED":
        return 2;
      case "PAID":
        return 3;
      case "CANCELLED":
        return 0;
      default:
        return 1;
    }
  };

  return (
    <div className="mx-auto max-w-5xl px-4 py-8 sm:px-6 sm:py-12">
      {/* Tarjeta de Saludo y Perfil */}
      <div className="rounded-3xl border border-[#e7e2da] bg-white p-6 sm:p-8 shadow-xs mb-8 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <span className="text-[11px] tracking-[0.25em] font-semibold uppercase text-stone-500">
            Mi Espacio Personal
          </span>
          <h1 className="mt-1 font-serif text-2xl sm:text-3xl font-light text-stone-900">
            Hola, {customer.name}
          </h1>
          <p className="mt-1 text-xs sm:text-sm text-stone-600">
            {customer.email} {customer.dni ? `• DNI ${customer.dni}` : ""} {customer.phone ? `• ${customer.phone}` : ""}
          </p>
        </div>

        <button
          type="button"
          onClick={handleLogout}
          disabled={loggingOut}
          className="inline-flex min-h-[40px] items-center gap-2 rounded-xl border border-stone-200 bg-stone-50 px-4 py-2 text-xs font-semibold text-stone-700 hover:bg-stone-100 transition-colors focus-visible:outline-2 focus-visible:outline-stone-900 cursor-pointer"
        >
          {loggingOut ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <LogOut className="h-4 w-4" />
          )}
          <span>Cerrar sesión</span>
        </button>
      </div>

      {/* Navegación por Pestañas */}
      <div className="flex border-b border-[#e7e2da] mb-8 gap-2 overflow-x-auto pb-px">
        <button
          type="button"
          onClick={() => setActiveTab("overview")}
          className={`flex items-center gap-2 border-b-2 px-3 sm:px-4 py-3 text-xs sm:text-sm transition-colors whitespace-nowrap cursor-pointer ${
            activeTab === "overview"
              ? "border-stone-900 text-stone-900 font-semibold"
              : "border-transparent text-stone-500 hover:text-stone-900"
          }`}
        >
          <LayoutDashboard className="h-4 w-4" />
          <span>Resumen</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab("orders")}
          className={`flex items-center gap-2 border-b-2 px-3 sm:px-4 py-3 text-xs sm:text-sm transition-colors whitespace-nowrap cursor-pointer ${
            activeTab === "orders"
              ? "border-stone-900 text-stone-900 font-semibold"
              : "border-transparent text-stone-500 hover:text-stone-900"
          }`}
        >
          <Package className="h-4 w-4" />
          <span>Mis Pedidos</span>
          <span className="rounded-full bg-stone-100 px-2 py-0.5 text-[11px] text-stone-700 font-medium">
            {orders.length}
          </span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab("saved")}
          className={`flex items-center gap-2 border-b-2 px-3 sm:px-4 py-3 text-xs sm:text-sm transition-colors whitespace-nowrap cursor-pointer ${
            activeTab === "saved"
              ? "border-stone-900 text-stone-900 font-semibold"
              : "border-transparent text-stone-500 hover:text-stone-900"
          }`}
        >
          <Heart className="h-4 w-4" />
          <span>Guardados</span>
          <span className="rounded-full bg-stone-100 px-2 py-0.5 text-[11px] text-stone-700 font-medium">
            {savedIds.length}
          </span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab("addresses")}
          className={`flex items-center gap-2 border-b-2 px-3 sm:px-4 py-3 text-xs sm:text-sm transition-colors whitespace-nowrap cursor-pointer ${
            activeTab === "addresses"
              ? "border-stone-900 text-stone-900 font-semibold"
              : "border-transparent text-stone-500 hover:text-stone-900"
          }`}
        >
          <MapPin className="h-4 w-4" />
          <span>Mis Direcciones</span>
          <span className="rounded-full bg-stone-100 px-2 py-0.5 text-[11px] text-stone-700 font-medium">
            {addresses.length}
          </span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab("profile")}
          className={`flex items-center gap-2 border-b-2 px-3 sm:px-4 py-3 text-xs sm:text-sm transition-colors whitespace-nowrap cursor-pointer ${
            activeTab === "profile"
              ? "border-stone-900 text-stone-900 font-semibold"
              : "border-transparent text-stone-500 hover:text-stone-900"
          }`}
        >
          <User className="h-4 w-4" />
          <span>Mis Datos</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab("preferences")}
          className={`flex items-center gap-2 border-b-2 px-3 sm:px-4 py-3 text-xs sm:text-sm transition-colors whitespace-nowrap cursor-pointer ${
            activeTab === "preferences"
              ? "border-stone-900 text-stone-900 font-semibold"
              : "border-transparent text-stone-500 hover:text-stone-900"
          }`}
        >
          <SlidersHorizontal className="h-4 w-4" />
          <span>Preferencias</span>
        </button>
      </div>

      {/* Pestaña 1: Resumen General */}
      {activeTab === "overview" && (
        <div className="space-y-8 animate-in fade-in-50">
          {/* Accesos rápidos */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <button
              type="button"
              onClick={() => setActiveTab("orders")}
              className="text-left rounded-2xl border border-[#e7e2da] bg-white p-5 hover:border-stone-400 hover:shadow-xs transition-all cursor-pointer group"
            >
              <div className="flex items-center justify-between">
                <span className="p-2 rounded-xl bg-stone-50 text-stone-700 group-hover:bg-stone-900 group-hover:text-white transition-colors">
                  <Package className="h-5 w-5" />
                </span>
                <span className="font-serif text-2xl font-light text-stone-900">
                  {orders.length}
                </span>
              </div>
              <h3 className="mt-3 text-xs sm:text-sm font-semibold text-stone-900">
                Mis Pedidos
              </h3>
              <p className="mt-0.5 text-[11px] text-stone-500">
                Historial y estado de entrega
              </p>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab("saved")}
              className="text-left rounded-2xl border border-[#e7e2da] bg-white p-5 hover:border-stone-400 hover:shadow-xs transition-all cursor-pointer group"
            >
              <div className="flex items-center justify-between">
                <span className="p-2 rounded-xl bg-rose-50 text-rose-600 group-hover:bg-rose-600 group-hover:text-white transition-colors">
                  <Heart className="h-5 w-5" />
                </span>
                <span className="font-serif text-2xl font-light text-stone-900">
                  {savedIds.length}
                </span>
              </div>
              <h3 className="mt-3 text-xs sm:text-sm font-semibold text-stone-900">
                Piezas Guardadas
              </h3>
              <p className="mt-0.5 text-[11px] text-stone-500">
                Tus favoritas reservables
              </p>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab("addresses")}
              className="text-left rounded-2xl border border-[#e7e2da] bg-white p-5 hover:border-stone-400 hover:shadow-xs transition-all cursor-pointer group"
            >
              <div className="flex items-center justify-between">
                <span className="p-2 rounded-xl bg-sky-50 text-sky-700 group-hover:bg-sky-700 group-hover:text-white transition-colors">
                  <MapPin className="h-5 w-5" />
                </span>
                <span className="font-serif text-2xl font-light text-stone-900">
                  {addresses.length}
                </span>
              </div>
              <h3 className="mt-3 text-xs sm:text-sm font-semibold text-stone-900">
                Direcciones
              </h3>
              <p className="mt-0.5 text-[11px] text-stone-500">
                Puntos de entrega guardados
              </p>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab("preferences")}
              className="text-left rounded-2xl border border-[#e7e2da] bg-white p-5 hover:border-stone-400 hover:shadow-xs transition-all cursor-pointer group"
            >
              <div className="flex items-center justify-between">
                <span className="p-2 rounded-xl bg-amber-50 text-amber-700 group-hover:bg-amber-700 group-hover:text-white transition-colors">
                  <SlidersHorizontal className="h-5 w-5" />
                </span>
                <Sparkles className="h-4 w-4 text-amber-500" />
              </div>
              <h3 className="mt-3 text-xs sm:text-sm font-semibold text-stone-900">
                Preferencias
              </h3>
              <p className="mt-0.5 text-[11px] text-stone-500">
                Tema, talles y alertas de drop
              </p>
            </button>
          </div>

          {/* Último pedido con línea de tiempo */}
          {latestOrder ? (
            <div className="rounded-3xl border border-[#e7e2da] bg-white p-6 sm:p-8 shadow-xs">
              <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[#f0eae1] pb-4">
                <div>
                  <span className="text-[10px] uppercase tracking-wider text-stone-500 block font-semibold">
                    Último pedido registrado
                  </span>
                  <div className="flex items-center gap-2 mt-0.5">
                    <span className="font-mono text-base sm:text-lg font-bold text-stone-900">
                      {formatOrderCode(latestOrder.code)}
                    </span>
                    <span className="text-xs text-stone-500">
                      • {new Date(latestOrder.createdAt * 1000).toLocaleDateString("es-AR", {
                        day: "2-digit",
                        month: "long",
                        year: "numeric",
                      })}
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <span
                    className={`inline-flex items-center rounded-full border px-3 py-1 text-xs font-semibold ${
                      getStatusBadge(latestOrder.status).classes
                    }`}
                  >
                    {getStatusBadge(latestOrder.status).label}
                  </span>
                  <a
                    href={`https://wa.me/${cleanWhatsapp}?text=${encodeURIComponent(
                      `Hola ${brandName}, quería consultar sobre mi pedido ${formatOrderCode(latestOrder.code)}.`
                    )}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex min-h-[38px] items-center gap-1.5 rounded-xl border border-stone-200 bg-stone-50 px-3.5 py-1.5 text-xs font-semibold text-stone-800 hover:bg-stone-100 transition-colors"
                  >
                    <span>Consultar</span>
                    <ExternalLink className="h-3.5 w-3.5 text-stone-500" />
                  </a>
                </div>
              </div>

              {/* Línea de tiempo visual de 4 etapas */}
              <div className="my-8">
                <h4 className="text-xs font-semibold text-stone-700 uppercase tracking-wider mb-6">
                  Seguimiento del pedido
                </h4>
                {(() => {
                  const progress = getTimelineProgress(latestOrder.status);
                  const steps = [
                    {
                      num: 1,
                      label: "Reservado",
                      desc: "Pedido recibido en el showroom",
                    },
                    {
                      num: 2,
                      label: "Confirmado",
                      desc: "Pago verificado y pieza apartada",
                    },
                    {
                      num: 3,
                      label: latestOrder.deliveryMethod === "PICKUP" ? "Listo para retiro" : "En camino",
                      desc:
                        latestOrder.deliveryMethod === "PICKUP"
                          ? "Disponible en showroom"
                          : "En motomensajería o correo",
                    },
                    {
                      num: 4,
                      label: "Entregado",
                      desc: "En manos de su nuevo dueño",
                    },
                  ];

                  return (
                    <div className="relative">
                      {/* Barra conectora */}
                      <div className="absolute left-4 top-4 bottom-4 w-0.5 bg-stone-200 sm:left-0 sm:top-4 sm:bottom-auto sm:h-0.5 sm:w-full sm:bg-[#e7e2da] z-0" />
                      <div
                        className="absolute left-4 top-4 w-0.5 bg-stone-900 transition-all sm:left-0 sm:top-4 sm:h-0.5 sm:bg-stone-900 z-0"
                        style={{
                          width: `${((progress - 1) / (steps.length - 1)) * 100}%`,
                        }}
                      />

                      <div className="grid grid-cols-1 sm:grid-cols-4 gap-6 sm:gap-2 relative z-10">
                        {steps.map((st) => {
                          const isDone = st.num <= progress;
                          const isCurrent = st.num === progress;

                          return (
                            <div key={st.num} className="flex sm:flex-col items-start sm:items-center gap-3 sm:text-center pl-2 sm:pl-0">
                              <div
                                className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full border-2 font-mono text-xs font-bold transition-all ${
                                  isDone
                                    ? "border-stone-900 bg-stone-900 text-white shadow-xs"
                                    : "border-stone-300 bg-white text-stone-400"
                                } ${isCurrent ? "ring-4 ring-stone-900/10 scale-110" : ""}`}
                              >
                                {isDone ? (
                                  <Check className="h-4 w-4 stroke-[3]" />
                                ) : (
                                  <span>{st.num}</span>
                                )}
                              </div>
                              <div>
                                <p
                                  className={`text-xs font-semibold ${
                                    isDone ? "text-stone-900" : "text-stone-400"
                                  }`}
                                >
                                  {st.label}
                                </p>
                                <p className="text-[11px] text-stone-500 mt-0.5 max-w-[150px] mx-auto">
                                  {st.desc}
                                </p>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  );
                })()}
              </div>

              {/* Ítems del pedido */}
              <div className="border-t border-[#f0eae1] pt-4">
                <h4 className="text-xs font-semibold text-stone-700 uppercase tracking-wider mb-3">
                  Piezas incluidas
                </h4>
                <div className="divide-y divide-stone-100">
                  {latestOrder.items?.map((item) => (
                    <div key={item.id} className="py-2.5 flex items-center justify-between gap-4">
                      <div className="flex items-center gap-3">
                        {item.photoUrl ? (
                          /* eslint-disable-next-line @next/next/no-img-element */
                          <img
                            src={item.photoUrl}
                            alt={item.productTitle}
                            className="h-12 w-12 rounded-xl object-cover border border-[#e7e2da]"
                          />
                        ) : (
                          <div className="h-12 w-12 rounded-xl bg-stone-100 flex items-center justify-center text-stone-400">
                            <ShoppingBag className="h-5 w-5" />
                          </div>
                        )}
                        <div>
                          <p className="text-xs sm:text-sm font-medium text-stone-900">
                            {item.productTitle}
                          </p>
                          <p className="text-[11px] text-stone-500">
                            {item.colorName} • Talle {item.size} • {item.quantity} {item.quantity === 1 ? "unidad" : "unidades"}
                          </p>
                        </div>
                      </div>
                      <span className="font-serif text-xs sm:text-sm font-semibold text-stone-900">
                        {formatPrice(item.unitPriceCents * item.quantity)}
                      </span>
                    </div>
                  ))}
                </div>

                <div className="mt-4 pt-3 border-t border-stone-100 flex items-center justify-between text-xs text-stone-600">
                  <div>
                    <span className="font-semibold text-stone-800">Método:</span>{" "}
                    {getDeliveryLabel(latestOrder.deliveryMethod)}
                  </div>
                  <div className="text-right">
                    <span className="text-[11px] text-stone-500 block uppercase">Total</span>
                    <span className="font-serif text-lg font-bold text-stone-900">
                      {formatPrice(latestOrder.totalCents)}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <div className="rounded-3xl border border-dashed border-[#d8d2c7] bg-white/60 p-10 text-center">
              <ShoppingBag className="mx-auto h-12 w-12 text-stone-300" />
              <h3 className="mt-3 font-serif text-xl font-light text-stone-900">
                Aún no realizaste ningún pedido
              </h3>
              <p className="mx-auto mt-1 max-w-sm text-xs sm:text-sm text-stone-500">
                Cuando reserves tu primera pieza única, verás aquí su línea de tiempo y estado en tiempo real.
              </p>
              <Link
                href="/"
                className="mt-5 inline-flex min-h-[44px] items-center gap-2 rounded-xl bg-stone-900 px-6 py-2.5 text-xs font-semibold uppercase tracking-wider text-white hover:bg-stone-800 transition-colors shadow-xs"
              >
                Explorar Colección
              </Link>
            </div>
          )}
        </div>
      )}

      {/* Pestaña 2: Mis Pedidos */}
      {activeTab === "orders" && (
        <div className="space-y-6 animate-in fade-in-50">
          {orders.length === 0 ? (
            <div className="rounded-3xl border border-dashed border-[#d8d2c7] bg-white/60 p-12 text-center">
              <ShoppingBag className="mx-auto h-12 w-12 text-stone-300" />
              <h2 className="mt-4 font-serif text-xl font-light text-stone-900">
                Aún no realizaste ningún pedido
              </h2>
              <p className="mx-auto mt-2 max-w-sm text-xs sm:text-sm text-stone-500">
                Tus pedidos aparecerán aquí para que puedas seguir su estado y contactarnos fácilmente.
              </p>
              <Link
                href="/"
                className="mt-6 inline-flex min-h-[44px] items-center gap-2 rounded-xl bg-stone-900 px-6 py-2.5 text-xs font-semibold uppercase tracking-wider text-white hover:bg-stone-800 transition-colors shadow-xs"
              >
                Explorar Colección
              </Link>
            </div>
          ) : (
            orders.map((order) => {
              const status = getStatusBadge(order.status);
              const formattedDate = new Date(order.createdAt * 1000).toLocaleDateString("es-AR", {
                day: "2-digit",
                month: "short",
                year: "numeric",
              });
              const waUrl = `https://wa.me/${cleanWhatsapp}?text=${encodeURIComponent(
                `Hola ${brandName}, quería consultar sobre mi pedido ${formatOrderCode(order.code)}.`
              )}`;

              return (
                <div
                  key={order.id}
                  className="rounded-3xl border border-[#e7e2da] bg-white p-5 sm:p-7 shadow-xs transition-shadow hover:shadow-sm"
                >
                  <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[#f0eae1] pb-4">
                    <div className="flex items-center gap-3">
                      <span className="font-mono text-sm sm:text-base font-bold text-stone-900">
                        {formatOrderCode(order.code)}
                      </span>
                      <span className="text-xs text-stone-500">• {formattedDate}</span>
                    </div>

                    <div className="flex items-center gap-2">
                      <span
                        className={`inline-flex items-center rounded-full border px-3 py-1 text-xs font-medium ${status.classes}`}
                      >
                        {status.label}
                      </span>
                    </div>
                  </div>

                  
                  {/* Bloque Transferencia Bancaria y Comprobante PDF (BR-41 / BR-47) */}
                  {order.paymentMethod === "TRANSFER" && order.status === "PENDING" && (() => {
                    const nowSec = Math.floor(Date.now() / 1000);
                    const hoursRemaining = Math.max(0, 24 - Math.floor((nowSec - order.createdAt) / 3600));
                    const isExpired = nowSec - order.createdAt > 24 * 3600;
                    const hasReceipt = Boolean(order.transferReceiptUrl || receiptUploadSuccess[order.id]);

                    return (
                      <div className="my-4 rounded-2xl border border-amber-200/90 bg-amber-50/40 p-4 text-xs space-y-3">
                        <div className="flex flex-wrap items-center justify-between gap-2 border-b border-amber-200/60 pb-2.5">
                          <div className="flex items-center gap-2">
                            <Clock className="h-4 w-4 text-amber-700 shrink-0" />
                            <span className="font-semibold text-amber-950">
                              Pago por Transferencia Bancaria
                            </span>
                          </div>
                          {isExpired ? (
                            <span className="text-[10px] font-bold text-rose-700 bg-rose-50 px-2.5 py-0.5 rounded-full border border-rose-200">
                              Plazo de 24 hs vencido
                            </span>
                          ) : (
                            <span className="text-[10px] font-bold text-amber-800 bg-amber-100/70 px-2.5 py-0.5 rounded-full border border-amber-300">
                              {hoursRemaining} {hoursRemaining === 1 ? "hora restante" : "horas restantes"} de reserva
                            </span>
                          )}
                        </div>

                        <p className="text-[11px] text-amber-800 leading-relaxed">
                          {isExpired
                            ? "El plazo de 24 horas para acreditar la transferencia ha expirado. La orden será cancelada y las prendas volverán al inventario disponible."
                            : "Tenés hasta 24 horas desde la compra para realizar la transferencia y adjuntar tu comprobante. Pasado ese tiempo, la orden se cancela automáticamente y las prendas vuelven al stock."}
                        </p>

                        {hasReceipt ? (
                          <div className="rounded-xl border border-emerald-200 bg-emerald-50/80 p-3 flex flex-wrap items-center justify-between gap-2">
                            <div className="flex items-center gap-2 text-emerald-900 font-medium">
                              <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0" />
                              <span>Comprobante PDF adjuntado (en revisión por el showroom).</span>
                            </div>
                            <div className="flex items-center gap-2">
                              <a
                                href={`/api/orders/${order.code}/receipt`}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="inline-flex items-center gap-1.5 rounded-lg bg-emerald-700 text-white px-3 py-1.5 text-xs font-semibold hover:bg-emerald-800 transition-colors"
                              >
                                <FileText className="h-3.5 w-3.5" />
                                <span>Ver PDF</span>
                                <ExternalLink className="h-3 w-3" />
                              </a>
                            </div>
                          </div>
                        ) : !isExpired ? (
                          <div className="rounded-xl border border-stone-200 bg-white p-3.5 space-y-3">
                            <div>
                              <span className="font-semibold text-stone-900 block text-xs">
                                Adjuntar Comprobante de Transferencia (Solo PDF · Máx 10 MB)
                              </span>
                              <span className="text-[11px] text-stone-500 block mt-0.5">
                                Subí el archivo PDF emitido por tu banco o billetera virtual.
                              </span>
                            </div>

                            <div className="flex flex-wrap items-center gap-2">
                              <input
                                type="file"
                                id={`portal-receipt-${order.id}`}
                                accept="application/pdf,.pdf"
                                disabled={uploadingReceiptOrderId === order.id}
                                onChange={(e) => {
                                  const file = e.target.files?.[0];
                                  if (!file) return;
                                  if (file.type !== "application/pdf" && !file.name.toLowerCase().endsWith(".pdf")) {
                                    setReceiptUploadError((prev) => ({ ...prev, [order.id]: "Solo se admiten comprobantes en formato PDF." }));
                                    e.target.value = "";
                                    return;
                                  }
                                  if (file.size > 10 * 1024 * 1024) {
                                    setReceiptUploadError((prev) => ({ ...prev, [order.id]: "El archivo supera el tamaño máximo permitido de 10 MB." }));
                                    e.target.value = "";
                                    return;
                                  }
                                  setSelectedPdfFiles((prev) => ({ ...prev, [order.id]: file }));
                                }}
                                className="hidden"
                              />
                              <label
                                htmlFor={`portal-receipt-${order.id}`}
                                className="inline-flex items-center gap-1.5 rounded-xl border border-stone-300 bg-stone-50 px-3.5 py-2 text-xs font-semibold text-stone-700 hover:bg-stone-100 cursor-pointer shadow-2xs"
                              >
                                <Upload className="h-3.5 w-3.5 text-stone-500" />
                                <span>{selectedPdfFiles[order.id] ? "Cambiar archivo PDF" : "Seleccionar archivo PDF"}</span>
                              </label>

                              {selectedPdfFiles[order.id] && (
                                <button
                                  type="button"
                                  disabled={uploadingReceiptOrderId === order.id}
                                  onClick={() => handleUploadReceiptFromPortal(order.id, order.code)}
                                  className="inline-flex items-center gap-1.5 rounded-xl bg-stone-900 px-4 py-2 text-xs font-semibold text-white hover:bg-stone-800 cursor-pointer disabled:opacity-50"
                                >
                                  {uploadingReceiptOrderId === order.id ? (
                                    <>
                                      <Loader2 className="h-3.5 w-3.5 animate-spin" />
                                      <span>Subiendo...</span>
                                    </>
                                  ) : (
                                    <>
                                      <Upload className="h-3.5 w-3.5" />
                                      <span>Subir Comprobante</span>
                                    </>
                                  )}
                                </button>
                              )}
                            </div>

                            {selectedPdfFiles[order.id] && (
                              <p className="text-[11px] text-stone-500">
                                Archivo: <span className="font-medium text-stone-800">{selectedPdfFiles[order.id].name}</span> ({(selectedPdfFiles[order.id].size / (1024 * 1024)).toFixed(1)} MB)
                              </p>
                            )}

                            {receiptUploadError[order.id] && (
                              <p className="text-[11px] font-medium text-rose-600 flex items-center gap-1">
                                <AlertCircle className="h-3 w-3 shrink-0" />
                                {receiptUploadError[order.id]}
                              </p>
                            )}
                          </div>
                        ) : null}
                      </div>
                    );
                  })()}

                  {/* Ítems del Pedido */}
                  <div className="divide-y divide-stone-100 my-4">
                    {order.items?.map((item) => (
                      <div key={item.id} className="py-3 flex items-center justify-between gap-4">
                        <div className="flex items-center gap-3">
                          {item.photoUrl ? (
                            /* eslint-disable-next-line @next/next/no-img-element */
                            <img
                              src={item.photoUrl}
                              alt={item.productTitle}
                              className="h-12 w-12 rounded-xl object-cover border border-[#e7e2da]"
                            />
                          ) : (
                            <div className="h-12 w-12 rounded-xl bg-stone-100 flex items-center justify-center text-stone-400">
                              <ShoppingBag className="h-5 w-5" />
                            </div>
                          )}
                          <div>
                            <p className="text-xs sm:text-sm font-medium text-stone-900">
                              {item.productTitle}
                            </p>
                            <p className="text-[11px] text-stone-500">
                              {item.colorName} • Talle {item.size} • Cant: {item.quantity}
                            </p>
                          </div>
                        </div>
                        <span className="font-serif text-xs sm:text-sm font-medium text-stone-900">
                          {formatPrice(item.unitPriceCents * item.quantity)}
                        </span>
                      </div>
                    ))}
                  </div>

                  {/* Pie de Pedido y Contacto */}
                  <div className="pt-4 border-t border-[#f0eae1] flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div className="text-xs text-stone-600">
                      <p>
                        <span className="font-semibold text-stone-800">Método de entrega:</span>{" "}
                        {getDeliveryLabel(order.deliveryMethod)}
                      </p>
                      {order.deliveryAddress && (
                        <p className="mt-0.5 truncate max-w-md">
                          <span className="font-semibold text-stone-800">Destino:</span>{" "}
                          {order.deliveryAddress}
                        </p>
                      )}
                    </div>

                    <div className="flex items-center justify-between sm:justify-end gap-4">
                      <div className="text-right">
                        <span className="text-[10px] uppercase tracking-wider text-stone-500 block">
                          Total abonado
                        </span>
                        <span className="font-serif text-lg sm:text-xl font-medium text-stone-900">
                          {formatPrice(order.totalCents)}
                        </span>
                      </div>

                      <a
                        href={waUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex min-h-[40px] items-center gap-1.5 rounded-xl border border-stone-200 bg-stone-50 px-3.5 py-2 text-xs font-semibold text-stone-800 hover:bg-stone-100 transition-colors"
                      >
                        <span>Consultar</span>
                        <ExternalLink className="h-3.5 w-3.5 text-stone-500" />
                      </a>
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>
      )}

      {/* Pestaña 3: Piezas Guardadas (Favoritos) */}
      {activeTab === "saved" && (
        <div className="space-y-6 animate-in fade-in-50">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="font-serif text-xl font-medium text-stone-900">
                Tus Piezas Guardadas
              </h2>
              <p className="text-xs text-stone-600 mt-0.5">
                Seguí la disponibilidad de tus prendas favoritas antes de que sean reservadas.
              </p>
            </div>
          </div>

          {savedProducts.length === 0 ? (
            <div className="rounded-3xl border border-dashed border-[#d8d2c7] bg-white/60 p-12 text-center">
              <Heart className="mx-auto h-12 w-12 text-stone-300" />
              <h3 className="mt-4 font-serif text-xl font-light text-stone-900">
                No tenés piezas guardadas todavía
              </h3>
              <p className="mx-auto mt-2 max-w-sm text-xs sm:text-sm text-stone-500">
                Tocá el ícono del corazón en cualquier prenda del catálogo para guardarla aquí y no perderla de vista.
              </p>
              <Link
                href="/"
                className="mt-6 inline-flex min-h-[44px] items-center gap-2 rounded-xl bg-stone-900 px-6 py-2.5 text-xs font-semibold uppercase tracking-wider text-white hover:bg-stone-800 transition-colors shadow-xs"
              >
                Explorar Catálogo
              </Link>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-5">
              {savedProducts.map((p) => {
                const photo = p.photos?.[0]?.keyThumb || p.photos?.[0]?.keyFull || null;
                const isAvailable = p.status === "AVAILABLE";

                return (
                  <div
                    key={p.id}
                    className="group rounded-2xl border border-[#e7e2da] bg-white p-3.5 shadow-xs transition-all hover:border-stone-400 hover:shadow-sm flex flex-col justify-between"
                  >
                    <div>
                      <div className="relative aspect-[4/5] w-full overflow-hidden rounded-xl bg-[#f0eae1] mb-3">
                        {photo ? (
                          /* eslint-disable-next-line @next/next/no-img-element */
                          <img
                            src={photo}
                            alt={p.title || `Pieza ${formatProductCode(p.code)}`}
                            className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
                          />
                        ) : (
                          <div className="flex h-full items-center justify-center text-stone-300">
                            <ShoppingBag className="h-10 w-10 stroke-[1.5]" />
                          </div>
                        )}

                        {/* Badge de disponibilidad */}
                        <div className="absolute left-2.5 top-2.5 z-10">
                          {isAvailable ? (
                            <span className="rounded-full bg-emerald-600 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wider text-white shadow-xs">
                              Disponible
                            </span>
                          ) : (
                            <span className="rounded-full bg-stone-800/90 backdrop-blur-xs px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wider text-white shadow-xs">
                              En archivo
                            </span>
                          )}
                        </div>

                        {/* Botón de quitar de favoritos */}
                        <button
                          type="button"
                          onClick={() => handleRemoveSaved(p.id)}
                          aria-label={`Quitar ${p.title} de guardados`}
                          title="Quitar de guardados"
                          className="absolute right-2.5 top-2.5 z-10 flex h-8 w-8 items-center justify-center rounded-full bg-white/90 text-stone-500 shadow-xs hover:bg-white hover:text-rose-600 transition-colors cursor-pointer"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>

                      <div className="space-y-1">
                        <div className="flex items-center justify-between text-xs text-stone-500">
                          <span className="font-mono font-bold text-stone-700">
                            {formatProductCode(p.code)}
                          </span>
                          <span>Talle {p.size || "Único"}</span>
                        </div>
                        <h3 className="font-serif text-base font-normal text-stone-900 line-clamp-1">
                          {p.title || `Pieza ${formatProductCode(p.code)}`}
                        </h3>
                        <p className="font-serif text-sm font-semibold text-stone-900">
                          {formatPrice(p.priceCents)}
                        </p>
                      </div>
                    </div>

                    <div className="mt-4 pt-3 border-t border-stone-100 flex items-center gap-2">
                      <Link
                        href={`/p/${p.code}`}
                        className="flex-1 inline-flex min-h-[38px] items-center justify-center rounded-xl border border-stone-200 bg-white px-3 py-1.5 text-xs font-semibold text-stone-800 hover:bg-stone-50 transition-colors"
                      >
                        Ver pieza
                      </Link>
                      {isAvailable && (
                        <button
                          type="button"
                          onClick={() => handleAddSavedToCart(p)}
                          className="flex-1 inline-flex min-h-[38px] items-center justify-center rounded-xl bg-stone-900 px-3 py-1.5 text-xs font-semibold text-white hover:bg-stone-800 transition-colors shadow-xs cursor-pointer"
                        >
                          A la bolsa
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* Pestaña 4: Mis Direcciones */}
      {activeTab === "addresses" && (
        <div className="space-y-6 animate-in fade-in-50">
          <div className="flex items-center justify-between">
            <p className="text-xs sm:text-sm text-stone-600">
              Guardá tus direcciones de entrega para agilizar tus compras en el checkout.
            </p>
            <button
              type="button"
              onClick={() => setIsAddingAddress(!isAddingAddress)}
              className="inline-flex min-h-[40px] items-center gap-2 rounded-xl bg-stone-900 px-4 py-2 text-xs font-semibold text-white hover:bg-stone-800 transition-colors shadow-xs cursor-pointer"
            >
              <Plus className="h-4 w-4" />
              <span>Nueva Dirección</span>
            </button>
          </div>

          {/* Formulario desplegable para agregar dirección */}
          {isAddingAddress && (
            <div className="rounded-3xl border border-[#d8d2c7] bg-white p-6 shadow-xs animate-in fade-in-50">
              <div className="flex items-center justify-between border-b border-[#f0eae1] pb-3 mb-4">
                <h3 className="font-serif text-lg font-medium text-stone-900">
                  Agregar Nueva Dirección
                </h3>
                <button
                  type="button"
                  onClick={() => setIsAddingAddress(false)}
                  className="rounded-full p-1 text-stone-400 hover:text-stone-700 cursor-pointer"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>

              {addressError && (
                <div className="mb-4 flex items-center gap-2 rounded-xl bg-rose-50 p-3 text-xs text-rose-800 border border-rose-200">
                  <AlertCircle className="h-4 w-4 shrink-0 text-rose-600" />
                  <span>{addressError}</span>
                </div>
              )}

              <form onSubmit={handleCreateAddress} className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-stone-700 mb-1">
                      Etiqueta / Nombre
                    </label>
                    <input
                      type="text"
                      required
                      value={label}
                      onChange={(e) => setLabel(e.target.value)}
                      placeholder="Ej: Casa, Trabajo, Showroom"
                      className="w-full rounded-xl border border-[#d8d2c7] p-2.5 text-base sm:text-xs text-stone-900 focus:outline-none focus:ring-1 focus:ring-stone-900"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-stone-700 mb-1">
                      Calle, Número y Piso / Depto
                    </label>
                    <input
                      type="text"
                      required
                      value={addressLine}
                      onChange={(e) => setAddressLine(e.target.value)}
                      placeholder="Ej: Av. Santa Fe 1234, 4° B"
                      className="w-full rounded-xl border border-[#d8d2c7] p-2.5 text-base sm:text-xs text-stone-900 focus:outline-none focus:ring-1 focus:ring-stone-900"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-stone-700 mb-1">
                      Ciudad / Localidad
                    </label>
                    <input
                      type="text"
                      value={city}
                      onChange={(e) => setCity(e.target.value)}
                      placeholder="Ej: Palermo, CABA"
                      className="w-full rounded-xl border border-[#d8d2c7] p-2.5 text-base sm:text-xs text-stone-900 focus:outline-none focus:ring-1 focus:ring-stone-900"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-stone-700 mb-1">
                      Código Postal
                    </label>
                    <input
                      type="text"
                      value={postalCode}
                      onChange={(e) => setPostalCode(e.target.value)}
                      placeholder="Ej: C1425"
                      className="w-full rounded-xl border border-[#d8d2c7] p-2.5 text-base sm:text-xs text-stone-900 focus:outline-none focus:ring-1 focus:ring-stone-900"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-stone-700 mb-1">
                      Nombre del Destinatario
                    </label>
                    <input
                      type="text"
                      value={recipientName}
                      onChange={(e) => setRecipientName(e.target.value)}
                      placeholder="Nombre de quien recibe"
                      className="w-full rounded-xl border border-[#d8d2c7] p-2.5 text-base sm:text-xs text-stone-900 focus:outline-none focus:ring-1 focus:ring-stone-900"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-stone-700 mb-1">
                      Teléfono de Contacto
                    </label>
                    <input
                      type="tel"
                      value={recipientPhone}
                      onChange={(e) => setRecipientPhone(e.target.value)}
                      placeholder="Teléfono para el repartidor"
                      className="w-full rounded-xl border border-[#d8d2c7] p-2.5 text-base sm:text-xs text-stone-900 focus:outline-none focus:ring-1 focus:ring-stone-900"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-stone-700 mb-1">
                    Indicaciones de Entrega (opcional)
                  </label>
                  <input
                    type="text"
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    placeholder="Ej: Timbre no funciona, dejar en recepción..."
                    className="w-full rounded-xl border border-[#d8d2c7] p-2.5 text-base sm:text-xs text-stone-900 focus:outline-none focus:ring-1 focus:ring-stone-900"
                  />
                </div>

                <div className="flex items-center gap-2 pt-2">
                  <input
                    id="is-default-checkbox"
                    type="checkbox"
                    checked={isDefault}
                    onChange={(e) => setIsDefault(e.target.checked)}
                    className="h-4 w-4 rounded border-stone-300 text-stone-900 focus:ring-stone-900"
                  />
                  <label
                    htmlFor="is-default-checkbox"
                    className="text-xs text-stone-700 cursor-pointer font-medium"
                  >
                    Establecer como dirección predeterminada
                  </label>
                </div>

                <div className="flex justify-end gap-3 pt-3 border-t border-[#f0eae1]">
                  <button
                    type="button"
                    onClick={() => setIsAddingAddress(false)}
                    className="rounded-xl border border-stone-200 px-4 py-2 text-xs font-semibold text-stone-700 hover:bg-stone-50 cursor-pointer"
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    disabled={addressLoading}
                    className="rounded-xl bg-stone-900 px-5 py-2 text-xs font-semibold text-white hover:bg-stone-800 disabled:opacity-50 cursor-pointer"
                  >
                    {addressLoading ? "Guardando..." : "Guardar Dirección"}
                  </button>
                </div>
              </form>
            </div>
          )}

          {/* Grilla de Direcciones */}
          {addresses.length === 0 && !isAddingAddress ? (
            <div className="rounded-3xl border border-dashed border-[#d8d2c7] bg-white/60 p-12 text-center">
              <MapPin className="mx-auto h-12 w-12 text-stone-300" />
              <h2 className="mt-4 font-serif text-xl font-light text-stone-900">
                No tenés direcciones registradas
              </h2>
              <p className="mx-auto mt-2 max-w-sm text-xs sm:text-sm text-stone-500">
                Agregá tu dirección para no tener que escribirla cada vez que realizás un pedido.
              </p>
              <button
                type="button"
                onClick={() => setIsAddingAddress(true)}
                className="mt-6 inline-flex min-h-[44px] items-center gap-2 rounded-xl bg-stone-900 px-6 py-2.5 text-xs font-semibold uppercase tracking-wider text-white hover:bg-stone-800 transition-colors cursor-pointer"
              >
                <Plus className="h-4 w-4" />
                <span>Agregar Dirección</span>
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {addresses.map((addr) => (
                <div
                  key={addr.id}
                  className={`rounded-2xl border p-5 bg-white transition-all ${
                    addr.isDefault
                      ? "border-stone-900 ring-1 ring-stone-900 shadow-xs"
                      : "border-[#e7e2da] hover:border-stone-400"
                  }`}
                >
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-semibold text-xs sm:text-sm text-stone-900">
                      {addr.label}
                    </span>
                    {addr.isDefault && (
                      <span className="inline-flex items-center gap-1 rounded-full bg-stone-900 px-2.5 py-0.5 text-[10px] font-semibold text-white">
                        <CheckCircle2 className="h-3 w-3" />
                        <span>Predeterminada</span>
                      </span>
                    )}
                  </div>

                  <p className="text-xs sm:text-sm text-stone-800 font-medium">
                    {addr.address}
                  </p>
                  {(addr.city || addr.postalCode) && (
                    <p className="text-xs text-stone-500">
                      {[addr.city, addr.postalCode].filter(Boolean).join(", ")}
                    </p>
                  )}
                  {addr.recipientName && (
                    <p className="text-xs text-stone-600 mt-2">
                      Recibe: <span className="font-medium text-stone-800">{addr.recipientName}</span>{" "}
                      {addr.recipientPhone ? `(${addr.recipientPhone})` : ""}
                    </p>
                  )}
                  {addr.notes && (
                    <p className="text-[11px] text-stone-500 italic mt-1">
                      &quot;{addr.notes}&quot;
                    </p>
                  )}

                  <div className="mt-4 pt-3 border-t border-[#f0eae1] flex items-center justify-between text-xs">
                    {!addr.isDefault ? (
                      <button
                        type="button"
                        onClick={() => handleSetDefaultAddress(addr.id)}
                        className="text-stone-600 hover:text-stone-900 underline underline-offset-2 cursor-pointer font-medium"
                      >
                        Establecer como principal
                      </button>
                    ) : (
                      <span />
                    )}

                    <button
                      type="button"
                      onClick={() => handleDeleteAddress(addr.id)}
                      className="inline-flex items-center gap-1 text-rose-600 hover:text-rose-800 p-1 cursor-pointer font-medium"
                      title="Eliminar dirección"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                      <span>Eliminar</span>
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Pestaña 5: Mis Datos */}
      {activeTab === "profile" && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 animate-in fade-in-50">
          {/* Bloque: Información Personal */}
          <div className="rounded-3xl border border-[#e7e2da] bg-white p-6 sm:p-8 shadow-xs">
            <h2 className="font-serif text-xl font-medium text-stone-900 mb-4">
              Datos Personales
            </h2>
            <p className="text-xs text-stone-600 mb-6">
              Actualizá tu información de contacto para pedidos y comunicaciones.
            </p>

            {profileSuccess && (
              <div className="mb-4 flex items-center gap-2 rounded-xl bg-emerald-50 p-3 text-xs text-emerald-800 border border-emerald-200">
                <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-600" />
                <span>{profileSuccess}</span>
              </div>
            )}

            {profileError && (
              <div className="mb-4 flex items-center gap-2 rounded-xl bg-rose-50 p-3 text-xs text-rose-800 border border-rose-200">
                <AlertCircle className="h-4 w-4 shrink-0 text-rose-600" />
                <span>{profileError}</span>
              </div>
            )}

            <form onSubmit={handleUpdateProfile} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-stone-700 uppercase tracking-wider mb-1.5">
                  Nombre Completo
                </label>
                <div className="relative">
                  <input
                    type="text"
                    required
                    value={profileName}
                    onChange={(e) => setProfileName(e.target.value)}
                    className="w-full rounded-xl border border-[#d8d2c7] bg-white py-2.5 pl-10 pr-3 text-base sm:text-xs text-stone-900 focus:outline-none focus:ring-1 focus:ring-stone-900"
                  />
                  <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-stone-400" />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-stone-700 uppercase tracking-wider mb-1.5">
                  Correo Electrónico
                </label>
                <div className="relative">
                  <input
                    type="email"
                    disabled
                    value={customer.email}
                    className="w-full rounded-xl border border-stone-200 bg-stone-50 py-2.5 pl-10 pr-3 text-base sm:text-xs text-stone-500 cursor-not-allowed"
                  />
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-stone-400" />
                </div>
                <p className="mt-1 text-[11px] text-stone-400">
                  El correo es tu identificador único de cuenta y no se puede modificar directamente.
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-stone-700 uppercase tracking-wider mb-1.5">
                    DNI / Documento *
                  </label>
                  <div className="relative">
                    <input
                      type="text"
                      inputMode="numeric"
                      required
                      value={profileDni}
                      onChange={(e) => setProfileDni(e.target.value)}
                      placeholder="Ej: 40123456"
                      className="w-full rounded-xl border border-[#d8d2c7] bg-white py-2.5 pl-10 pr-3 text-base sm:text-xs text-stone-900 focus:outline-none focus:ring-1 focus:ring-stone-900"
                    />
                    <ShieldCheck className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-stone-400" />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-stone-700 uppercase tracking-wider mb-1.5">
                    Teléfono / WhatsApp
                  </label>
                  <div className="relative">
                    <input
                      type="tel"
                      value={profilePhone}
                      onChange={(e) => setProfilePhone(e.target.value)}
                      placeholder="11 2345-6789"
                      className="w-full rounded-xl border border-[#d8d2c7] bg-white py-2.5 pl-10 pr-3 text-base sm:text-xs text-stone-900 focus:outline-none focus:ring-1 focus:ring-stone-900"
                    />
                    <Phone className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-stone-400" />
                  </div>
                </div>
              </div>
              <p className="text-[11px] text-stone-500">
                Tu DNI y WhatsApp se autocompletan al reservar prendas y son necesarios para retiros o envíos.
              </p>

              <div className="pt-2">
                <button
                  type="submit"
                  disabled={profileLoading}
                  className="w-full inline-flex min-h-[44px] items-center justify-center gap-2 rounded-xl bg-stone-900 px-6 py-2.5 text-xs font-semibold uppercase tracking-wider text-white hover:bg-stone-800 disabled:opacity-50 transition-colors shadow-xs cursor-pointer"
                >
                  {profileLoading ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" />
                      <span>Guardando...</span>
                    </>
                  ) : (
                    <span>Guardar mis datos</span>
                  )}
                </button>
              </div>
            </form>
          </div>

          {/* Bloque: Seguridad y Contraseña */}
          <div className="rounded-3xl border border-[#e7e2da] bg-white p-6 sm:p-8 shadow-xs">
            <h2 className="font-serif text-xl font-medium text-stone-900 mb-4">
              Seguridad y Contraseña
            </h2>
            <p className="text-xs text-stone-600 mb-6">
              Cambiá tu contraseña para proteger el acceso a tus pedidos y direcciones.
            </p>

            {passwordSuccess && (
              <div className="mb-4 flex items-center gap-2 rounded-xl bg-emerald-50 p-3 text-xs text-emerald-800 border border-emerald-200">
                <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-600" />
                <span>{passwordSuccess}</span>
              </div>
            )}

            {passwordError && (
              <div className="mb-4 flex items-center gap-2 rounded-xl bg-rose-50 p-3 text-xs text-rose-800 border border-rose-200">
                <AlertCircle className="h-4 w-4 shrink-0 text-rose-600" />
                <span>{passwordError}</span>
              </div>
            )}

            <form onSubmit={handleUpdatePassword} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-stone-700 uppercase tracking-wider mb-1.5">
                  Contraseña Actual
                </label>
                <div className="relative">
                  <input
                    type={showCurrentPassword ? "text" : "password"}
                    required
                    value={currentPassword}
                    onChange={(e) => setCurrentPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full rounded-xl border border-[#d8d2c7] bg-white py-2.5 pl-3 pr-10 text-base sm:text-xs text-stone-900 focus:outline-none focus:ring-1 focus:ring-stone-900"
                  />
                  <button
                    type="button"
                    onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-stone-400 hover:text-stone-700 cursor-pointer p-1"
                  >
                    {showCurrentPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-stone-700 uppercase tracking-wider mb-1.5">
                  Nueva Contraseña
                </label>
                <div className="relative">
                  <input
                    type={showNewPassword ? "text" : "password"}
                    required
                    minLength={8}
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    placeholder="Mínimo 8 caracteres"
                    className="w-full rounded-xl border border-[#d8d2c7] bg-white py-2.5 pl-3 pr-10 text-base sm:text-xs text-stone-900 focus:outline-none focus:ring-1 focus:ring-stone-900"
                  />
                  <button
                    type="button"
                    onClick={() => setShowNewPassword(!showNewPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-stone-400 hover:text-stone-700 cursor-pointer p-1"
                  >
                    {showNewPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-stone-700 uppercase tracking-wider mb-1.5">
                  Confirmar Nueva Contraseña
                </label>
                <input
                  type="password"
                  required
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Repetí la nueva contraseña"
                  className="w-full rounded-xl border border-[#d8d2c7] bg-white py-2.5 px-3 text-base sm:text-xs text-stone-900 focus:outline-none focus:ring-1 focus:ring-stone-900"
                />
              </div>

              <div className="pt-2">
                <button
                  type="submit"
                  disabled={passwordLoading}
                  className="w-full inline-flex min-h-[44px] items-center justify-center gap-2 rounded-xl border border-stone-300 bg-white px-6 py-2.5 text-xs font-semibold uppercase tracking-wider text-stone-800 hover:bg-stone-50 disabled:opacity-50 transition-colors shadow-xs cursor-pointer"
                >
                  {passwordLoading ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" />
                      <span>Actualizando...</span>
                    </>
                  ) : (
                    <span>Actualizar contraseña</span>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Pestaña 6: Preferencias */}
      {activeTab === "preferences" && (
        <div className="rounded-3xl border border-[#e7e2da] bg-white p-6 sm:p-8 shadow-xs max-w-2xl animate-in fade-in-50">
          <h2 className="font-serif text-xl font-medium text-stone-900 mb-2">
            Preferencias de Compra y Experiencia
          </h2>
          <p className="text-xs text-stone-600 mb-6">
            Personalizá cómo ves la tienda, tus talles de referencia y cómo nos comunicamos con vos.
          </p>

          {prefSuccess && (
            <div className="mb-6 flex items-center gap-2 rounded-xl bg-emerald-50 p-3.5 text-xs text-emerald-800 border border-emerald-200">
              <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-600" />
              <span>{prefSuccess}</span>
            </div>
          )}

          <form onSubmit={handleSavePreferences} className="space-y-6">
            {/* Tema de apariencia */}
            <div>
              <label className="block text-xs font-semibold text-stone-800 uppercase tracking-wider mb-2">
                Tema de apariencia
              </label>
              <div className="grid grid-cols-3 gap-3">
                <button
                  type="button"
                  onClick={() => setPrefTheme("light")}
                  className={`flex flex-col items-center gap-2 rounded-xl border p-3 text-xs font-medium transition-all cursor-pointer ${
                    prefTheme === "light"
                      ? "border-stone-900 bg-stone-50 ring-1 ring-stone-900 text-stone-900 font-semibold"
                      : "border-stone-200 hover:border-stone-400 text-stone-600"
                  }`}
                >
                  <Sun className="h-5 w-5 text-amber-600" />
                  <span>Claro Editorial</span>
                </button>

                <button
                  type="button"
                  onClick={() => setPrefTheme("dark")}
                  className={`flex flex-col items-center gap-2 rounded-xl border p-3 text-xs font-medium transition-all cursor-pointer ${
                    prefTheme === "dark"
                      ? "border-stone-900 bg-stone-50 ring-1 ring-stone-900 text-stone-900 font-semibold"
                      : "border-stone-200 hover:border-stone-400 text-stone-600"
                  }`}
                >
                  <Moon className="h-5 w-5 text-stone-800" />
                  <span>Noche Exclusiva</span>
                </button>

                <button
                  type="button"
                  onClick={() => setPrefTheme("system")}
                  className={`flex flex-col items-center gap-2 rounded-xl border p-3 text-xs font-medium transition-all cursor-pointer ${
                    prefTheme === "system"
                      ? "border-stone-900 bg-stone-50 ring-1 ring-stone-900 text-stone-900 font-semibold"
                      : "border-stone-200 hover:border-stone-400 text-stone-600"
                  }`}
                >
                  <Laptop className="h-5 w-5 text-stone-500" />
                  <span>Del sistema</span>
                </button>
              </div>
            </div>

            {/* Canal de comunicación predilecto */}
            <div>
              <label className="block text-xs font-semibold text-stone-800 uppercase tracking-wider mb-2">
                Canal de atención preferido
              </label>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <label className="flex items-center gap-3 p-3 rounded-xl border border-stone-200 hover:border-stone-400 cursor-pointer transition-colors">
                  <input
                    type="radio"
                    name="contact-channel"
                    checked={prefChannel === "whatsapp"}
                    onChange={() => setPrefChannel("whatsapp")}
                    className="h-4 w-4 text-stone-900 focus:ring-stone-900"
                  />
                  <div>
                    <span className="text-xs font-semibold text-stone-900 block">
                      WhatsApp (Recomendado)
                    </span>
                    <span className="text-[11px] text-stone-500">
                      Coordinación directa, ágil y reserva en showroom.
                    </span>
                  </div>
                </label>

                <label className="flex items-center gap-3 p-3 rounded-xl border border-stone-200 hover:border-stone-400 cursor-pointer transition-colors">
                  <input
                    type="radio"
                    name="contact-channel"
                    checked={prefChannel === "email"}
                    onChange={() => setPrefChannel("email")}
                    className="h-4 w-4 text-stone-900 focus:ring-stone-900"
                  />
                  <div>
                    <span className="text-xs font-semibold text-stone-900 block">
                      Correo Electrónico
                    </span>
                    <span className="text-[11px] text-stone-500">
                      Notificaciones formales de estado y recibos.
                    </span>
                  </div>
                </label>
              </div>
            </div>

            {/* Talles habituales */}
            <div>
              <label className="block text-xs font-semibold text-stone-800 uppercase tracking-wider mb-2">
                Talles de referencia
              </label>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs text-stone-600 mb-1">
                    Prenda superior (Vestidos, Blazers, Tops)
                  </label>
                  <select
                    value={prefTopSize}
                    onChange={(e) => setPrefTopSize(e.target.value)}
                    className="w-full rounded-xl border border-[#d8d2c7] bg-white p-2.5 text-xs text-stone-900 focus:outline-none focus:ring-1 focus:ring-stone-900"
                  >
                    <option value="XS">XS (Extra Small)</option>
                    <option value="S">S (Small)</option>
                    <option value="M">M (Medium)</option>
                    <option value="L">L (Large)</option>
                    <option value="XL">XL (Extra Large)</option>
                    <option value="Oversize">Oversize / Único</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs text-stone-600 mb-1">
                    Calzado o Talle Inferior
                  </label>
                  <select
                    value={prefShoeSize}
                    onChange={(e) => setPrefShoeSize(e.target.value)}
                    className="w-full rounded-xl border border-[#d8d2c7] bg-white p-2.5 text-xs text-stone-900 focus:outline-none focus:ring-1 focus:ring-stone-900"
                  >
                    {["35", "36", "37", "38", "39", "40", "41", "42"].map((s) => (
                      <option key={s} value={s}>
                        {s}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            </div>

            {/* Notificaciones de Drop */}
            <div className="p-4 rounded-2xl bg-stone-50 border border-stone-200 flex items-start gap-3">
              <input
                id="pref-drops-checkbox"
                type="checkbox"
                checked={prefDrops}
                onChange={(e) => setPrefDrops(e.target.checked)}
                className="h-4 w-4 mt-0.5 rounded border-stone-300 text-stone-900 focus:ring-stone-900"
              />
              <label htmlFor="pref-drops-checkbox" className="text-xs cursor-pointer">
                <span className="font-semibold text-stone-900 block">
                  Avisos prioritarios de nuevos ingresos
                </span>
                <span className="text-stone-500 text-[11px] block mt-0.5">
                  Recibí avisos anticipados antes de que las piezas únicas se publiquen en redes sociales.
                </span>
              </label>
            </div>

            <div className="pt-2">
              <button
                type="submit"
                className="inline-flex min-h-[44px] items-center gap-2 rounded-xl bg-stone-900 px-6 py-2.5 text-xs font-semibold uppercase tracking-wider text-white hover:bg-stone-800 transition-colors shadow-xs cursor-pointer"
              >
                <span>Guardar Preferencias</span>
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
