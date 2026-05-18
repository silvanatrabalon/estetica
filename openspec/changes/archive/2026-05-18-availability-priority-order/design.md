## Context

La función `get_available_slots` (definida actualmente en la migración `20260515320000_fix_get_available_slots_exc_alias.sql`) evalúa la disponibilidad de turnos para un servicio y una fecha dados. 

**Orden actual de evaluación en la función:**

1. Verificar que el servicio esté activo + obtener config de la org  
2. Gate: fecha dentro del horizonte de reservas  
3. Gate: `business_closure_exceptions` (cierre excepcional del negocio)  
4. Gate: `business_hours` — si el negocio está cerrado ese día, retorna vacío ← **demasiado temprano**  
5. Gate: `service_available_dates` — fechas habilitadas para el servicio ← **debería ser antes de biz hours**  
6. Generación de ventanas de staff (`staff_schedules` + `staff_schedule_exceptions`)  
7. `generate_series` intersectando ventanas de staff con business hours  
8. Filtros: overflow, min-notice, conflictos de citas, capacidad máxima

**Problema concreto:** `service_available_dates` se evalúa en el paso 5, después de que `business_hours` ya actuó como gate en el paso 4. Si el negocio está abierto ese día pero el servicio no tiene esa fecha habilitada, el resultado final es correcto; pero el orden de evaluación no refleja la prioridad de negocio ("el servicio filtra primero") y resulta confuso al leer el código.

## Goals / Non-Goals

**Goals:**
- Reordenar los checks para que el gate de `service_available_dates` ocurra antes del gate de `business_hours`
- Documentar el orden canónico en el spec: servicio → staff → horarios de negocio
- Mantener `business_hours` como gate duro: negocio cerrado = sin turnos, siempre

**Non-Goals:**
- Cambiar el comportamiento observable de la función (los resultados deben ser idénticos en todos los escenarios ya cubiertos por tests)
- Permitir que las horas personalizadas de staff anulen un día cerrado del negocio
- Introducir nuevas tablas, columnas o APIs

## Decisions

### Decisión 1: Reorden mínimo — solo mueve `service_available_dates` antes del lookup de `business_hours`

**Opción A (elegida):** Mover el bloque `IF EXISTS (SELECT 1 FROM service_available_dates ...)` para que aparezca antes del `SELECT bh.opens_at, bh.closes_at FROM business_hours`.

**Opción B descartada:** Mover también el lookup de `business_hours` para que ocurra después de la generación de ventanas de staff. Aunque sería más fiel al orden "staff antes de biz hours", añade complejidad al SQL (la variable `v_biz_opens/closes` se usa en el `generate_series`) y no cambia ningún resultado observable.

**Rationale:** La opción A logra el objetivo de negocio con el mínimo cambio posible. El riesgo de regresión es prácticamente nulo porque el cambio solo afecta el cortocircuito temprano: si el servicio no tiene la fecha habilitada, ahora se retorna antes de consultar `business_hours`, lo que es más eficiente además de semánticamente correcto.

### Decisión 2: Implementar como nueva migración `CREATE OR REPLACE`

**Opción A (elegida):** Crear `supabase/migrations/20260518XXXXXX_availability_priority_order.sql` que hace `CREATE OR REPLACE FUNCTION`.

**Opción B descartada:** Editar la migración anterior `20260515320000_...`. Las migraciones aplicadas no se deben editar porque Supabase trackea el hash.

**Rationale:** Patrón ya establecido en este repositorio (las migraciones de fix siempre son `CREATE OR REPLACE`).

## Risks / Trade-offs

- **[Riesgo: regresión en SQL]** Un error en el re-paste de la función podría romper la generación de turnos. → Mitigación: copiar la función completa de la migración anterior y modificar solo el bloque reordenado; ejecutar los tests SQL existentes (`supabase/tests/availability_slot_generation.sql`).

- **[Trade-off: orden semántico vs. eficiencia]** `business_hours` todavía se evalúa antes de generar ventanas de staff (paso 5 → 6 en el nuevo orden), lo que es ligeramente más eficiente (evita el CTE de staff si el negocio está cerrado). El trade-off es aceptable porque el spec define business_hours como gate duro de todos modos.

## Migration Plan

1. Crear nueva migración con timestamp del día.  
2. Copiar la función completa de `20260515320000_fix_get_available_slots_exc_alias.sql`.  
3. Mover el bloque `service_available_dates` para que preceda al `SELECT ... FROM business_hours`.  
4. Ejecutar `npx supabase db push` contra la instancia local.  
5. Ejecutar los tests SQL: `npx supabase test db`.  
6. Actualizar el spec `availability-slot-generation`.  

**Rollback:** La migración anterior ya tiene `CREATE OR REPLACE`; revertir es otra `CREATE OR REPLACE` con el orden original.
