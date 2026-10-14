"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { ShoppingBag } from "lucide-react";
import { useCartStore } from "../../stores/cart.store";

export function CartHeaderButton() {
  const { getTotalItemsCount } = useCartStore();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const count = mounted ? getTotalItemsCount() : 0;

  return (
    <Link
      href="/carrito"
      prefetch={true}
      aria-label={`Bolsa de compras con ${count} producto${count === 1 ? "" : "s"}`}
      className="relative flex min-h-[40px] min-w-[40px] items-center justify-center rounded-full border border-[#d8d2c7] bg-white/90 p-2 text-stone-700 shadow-2xs transition-all hover:border-stone-900 hover:text-stone-900 focus-visible:outline-2 focus-visible:outline-stone-900"
    >
      <ShoppingBag className="h-4 w-4" aria-hidden="true" />
      {count > 0 && (
        <span
          className="absolute -top-1 -right-1 flex h-5 w-5 items-center justify-center rounded-full bg-stone-900 text-[10px] font-bold text-white shadow-xs animate-in zoom-in-75 duration-150"
          aria-hidden="true"
        >
          {count > 99 ? "99+" : count}
        </span>
      )}
    </Link>
  );
}
