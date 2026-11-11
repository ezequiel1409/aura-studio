<!-- BEGIN:nextjs-agent-rules -->

## This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->

# Reglas y Principios de Desarrollo Mandatorios (Motor / Plantilla Neutra)

A partir de ahora, **toda nueva función, componente, refactorización o modificación de código** DEBE ser analizada y contrastada de forma estricta contra estos 10 principios obligatorios:

1. **No mantener compatibilidad hacia atrás.**
   - Lo obsoleto, bórralo directamente.
   - No añadas capas de compatibilidad, no escribas migraciones ni dejes fallbacks.

2. **Elige la implementación más simple que satisfaga la necesidad actual.**
   - Nada de abstracciones preventivas ni capas de configuración innecesarias (YAGNI / KISS).

3. **Divide el sistema en capas largas.**
   - Primero haz funcionar una versión mínima de extremo a extremo, luego añade cosas encima.
   - Nunca desmanteles algo que ya funciona por complejidad incompleta.

4. **Mantén los componentes modulares, con separación de responsabilidades.**
   - Estricta separación entre Dominio puro, Casos de uso / Servicios, Infraestructura y UI / Presentación.

5. **Prioriza bibliotecas maduras y mantenidas por alguien.**
   - Sin razón explícita y justificada, no las reescribas tú mismo.

6. **Primero revisa qué pueden hacer las dependencias ya existentes en el proyecto.**
   - Hazlo antes de añadir paquetes nuevos o escribir código tú mismo.
   - No asumas de entrada que no hay nada en las bibliotecas ya instaladas.

7. **Toma decisiones de arquitectura a largo plazo.**
   - No aceptes soluciones temporales del tipo *"primero así, luego cambiamos"*.

8. **Mira primero cómo resuelven el mismo problema los productos maduros.**
   - Usa patrones ya validados; no inventes soluciones desde cero.

9. **Neutralidad absoluta de plantilla (Cero Hardcoding de Comercio / White-Label).**
   - Este repositorio es un motor base neutro que será forkeado por un orquestador para distintos comercios clientes.
   - Queda estrictamente prohibido codificar a fuego nombres de marca, slugs, dominios, teléfonos, correos o credenciales de un comercio específico en el código fuente.
   - Toda identidad debe resolverse dinámicamente vía variables de entorno (`env`), base de datos (`settings`/`commerce`) o configuración inyectada por el orquestador.

10. **Dependencias y tooling gobernados por el proyecto superior (Orquestador).**
    - El orquestador es la única fuente de verdad para las dependencias clave, versiones de paquetes y stack tecnológico.
    - No agregar paquetes ad-hoc o redundantes que diverjan del estándar definido por el orquestador.

---

## Protocolo de Análisis Mandatorio para Cada Cambio

Antes de emitir o modificar código, verifica siempre este checklist:
- [ ] **Check de dependencias existentes y orquestador:** ¿Ya existe una librería en el proyecto o está alineada con el orquestador superior?
- [ ] **Neutralidad / White-Label:** ¿El código evita cualquier nombre o dato hardcodeado de un comercio específico?
- [ ] **Limpieza de obsolescencia:** ¿Reemplaza código previo? Si es así, se elimina lo anterior sin fallbacks ni compatibilidad hacia atrás.
- [ ] **Simplicidad y modularidad:** ¿Es la implementación más simple posible? ¿Respeta la separación de capas sin abstracciones preventivas?
- [ ] **Extremo a extremo:** ¿Mantiene el flujo funcional sin romper lo que ya opera?
- [ ] **Patrón maduro y decisión a largo plazo:** ¿Sigue soluciones validadas en la industria y sostenibles a largo plazo?
