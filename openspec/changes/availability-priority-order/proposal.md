## Why

La función `get_available_slots` evalúa las condiciones de disponibilidad en un orden que no refleja la prioridad de negocio correcta: actualmente los Horarios de Negocio actúan como gate antes de verificar la disponibilidad del servicio (fechas restringidas) y de generar las ventanas del staff. El orden correcto —servicio primero, luego staff, luego horarios de negocio— no está explícitamente especificado ni garantizado, lo que hace el código más difícil de razonar y puede producir resultados incorrectos cuando los checks son reordenados o extendidos en el futuro.

## What Changes

- En `get_available_slots`, mover el check de `service_available_dates` para que ocurra **antes** del lookup de `business_hours`.
- El lookup de `business_hours` permanece como gate duro: si el negocio está cerrado ese día, la función retorna vacío, sin importar si el staff tiene horas configuradas.
- El orden canónico queda documentado en el spec de `availability-slot-generation` como requisito explícito.

## Capabilities

### New Capabilities

_(ninguna — no se introduce ninguna capacidad nueva)_

### Modified Capabilities

- `availability-slot-generation`: se agrega un requisito de orden de evaluación: disponibilidad del servicio → disponibilidad del staff → horarios de negocio. Se reordena el check de `service_available_dates` respecto del check de `business_hours` en la función SQL.

## Impact

- **`supabase/migrations/`**: nueva migración que re-crea `get_available_slots` con el orden correcto.
- **`openspec/specs/availability-slot-generation/spec.md`**: se agrega el requisito de orden de evaluación.
- Sin cambios en frontend, TypeScript, hooks ni APIs.
- Sin cambios de schema.
