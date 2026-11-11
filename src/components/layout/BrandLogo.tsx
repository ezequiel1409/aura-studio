interface BrandLogoProps {
  src: string;
  alt: string;
  /** Clases de tamaño (alto y ancho iguales), ej: "h-12 w-12" */
  className?: string;
}

/**
 * Logo de marca en formato circular. Único punto de renderizado del logo en la
 * tienda pública y el backoffice, para que el recorte y el borde sean idénticos.
 */
export function BrandLogo({ src, alt, className = "h-12 w-12" }: BrandLogoProps) {
  return (
    /* eslint-disable-next-line @next/next/no-img-element */
    <img
      src={src}
      alt={alt}
      className={`${className} shrink-0 rounded-full object-cover ring-1 ring-black/10 shadow-sm`}
    />
  );
}

