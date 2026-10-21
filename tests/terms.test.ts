import { describe, expect, it } from "vitest";
import React from "react";
import { renderToString } from "react-dom/server";
import {
  TermsContentRenderer,
  parseInlineTokens,
} from "../src/components/legal/TermsContentRenderer";
import { DEFAULT_SUGGESTED_TERMS } from "../src/services/settings.service";

describe("Renderizador de Términos y Condiciones Legales con Hipervínculos", () => {
  it("parseInlineTokens detecta hipervínculos internos en formato Markdown", () => {
    const text = "Consulta las [Promociones Bancarias](/promociones) vigentes.";
    const nodes = parseInlineTokens(text);
    const html = renderToString(React.createElement("div", null, ...nodes));

    expect(html).toContain('href="/promociones"');
    expect(html).toContain("Promociones Bancarias");
  });

  it("parseInlineTokens detecta hipervínculos externos agregando target _blank y rel noopener", () => {
    const text = "Más info en el [Sitio AFIP](https://serviciosweb.afip.gob.ar) oficial.";
    const nodes = parseInlineTokens(text);
    const html = renderToString(React.createElement("div", null, ...nodes));

    expect(html).toContain('href="https://serviciosweb.afip.gob.ar"');
    expect(html).toContain('target="_blank"');
    expect(html).toContain('rel="noopener noreferrer"');
    expect(html).toContain("Sitio AFIP");
  });

  it("parseInlineTokens formatea negritas con etiquetas semánticas strong", () => {
    const text = "El plazo máximo de retiro es de **48 horas** corridas.";
    const nodes = parseInlineTokens(text);
    const html = renderToString(React.createElement("div", null, ...nodes));

    expect(html).toContain('<strong class="font-semibold text-stone-900">48 horas</strong>');
  });

  it("parseInlineTokens convierte URLs planas automáticamente en enlaces", () => {
    const text = "Web de soporte: https://aurastudio.com/ayuda para coordinar.";
    const nodes = parseInlineTokens(text);
    const html = renderToString(React.createElement("div", null, ...nodes));

    expect(html).toContain('href="https://aurastudio.com/ayuda"');
  });

  it("TermsContentRenderer renderiza correctamente los términos sugeridos por defecto con enlaces a promociones bancarias y arrepentimiento", () => {
    const html = renderToString(
      React.createElement(TermsContentRenderer, {
        content: DEFAULT_SUGGESTED_TERMS,
        brandName: "Aura Studio",
      })
    );

    // Enlace a Promociones Bancarias
    expect(html).toContain('href="/promociones"');
    expect(html).toContain("Promociones Bancarias");

    // Enlace al Botón de Arrepentimiento
    expect(html).toContain('href="/arrepentimiento"');
    expect(html).toContain("Botón de Arrepentimiento");

    // Enlace al Catálogo
    expect(html).toContain('href="/catalogo"');

    // Títulos de Cláusulas estructuradas
    expect(html).toContain("1. Condiciones Generales y Disponibilidad");
    expect(html).toContain("5. Promociones Bancarias y Descuentos");
  });

  it("TermsContentRenderer maneja contenido vacío o null sin romper", () => {
    const emptyHtml = renderToString(
      React.createElement(TermsContentRenderer, {
        content: "",
      })
    );
    expect(emptyHtml).toBe("");
  });
});

