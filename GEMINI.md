# Reglas y Principios de Desarrollo Mandatorios (Aura Studio)

A partir de ahora, **toda nueva función, componente, refactorización o modificación de código** DEBE ser analizada y contrastada de forma estricta contra estos 8 principios obligatorios:

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

---

## Protocolo de Análisis Mandatorio para Cada Cambio

Antes de emitir o modificar código, verifica siempre este checklist:
- [ ] **Check de dependencias existentes:** ¿Ya existe una librería o utilidad instalada en el proyecto que resuelva esto?
- [ ] **Limpieza de obsolescencia:** ¿Reemplaza código previo? Si es así, se elimina lo anterior sin fallbacks ni compatibilidad hacia atrás.
- [ ] **Simplicidad y modularidad:** ¿Es la implementación más simple posible? ¿Respeta la separación de capas sin abstracciones preventivas?
- [ ] **Extremo a extremo:** ¿Mantiene el flujo funcional sin romper lo que ya opera?
- [ ] **Patrón maduro y decisión a largo plazo:** ¿Sigue soluciones validadas en la industria y sostenibles a largo plazo?

