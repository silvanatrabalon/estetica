## 1. Nueva migración SQL

- [x] 1.1 Crear `supabase/migrations/20260518000000_availability_priority_order.sql` con `CREATE OR REPLACE FUNCTION get_available_slots` copiando la función completa de `20260515320000_fix_get_available_slots_exc_alias.sql`
- [x] 1.2 En la nueva migración, mover el bloque `service_available_dates` (el `IF EXISTS` + `IF NOT EXISTS` que hace early-return) para que aparezca **antes** del `SELECT bh.opens_at, bh.closes_at FROM business_hours`
- [x] 1.3 Verificar que el resto de la función (staff_windows CTE, generate_series, filtros) quede sin cambios

## 2. Aplicar y verificar

- [x] 2.1 Ejecutar `npx supabase db push` y confirmar que la migración se aplica sin errores
- [x] 2.2 Ejecutar `npx supabase test db` y confirmar que los tests existentes de `availability_slot_generation.sql` siguen pasando

## 3. Actualizar spec

- [x] 3.1 Confirmar que el archivo `openspec/specs/availability-slot-generation/spec.md` será actualizado con el nuevo requisito de orden de evaluación al archivar este change

## 4. Fix: half_day business closure exceptions

- [x] 4.1 Crear `supabase/migrations/20260520200000_fix_get_available_slots_half_day_closures.sql` con `CREATE OR REPLACE FUNCTION get_available_slots` copiando la función completa post-reordenamiento
- [x] 4.2 Agregar Step 13 en el WHERE de la cláusula `return query`: NOT EXISTS filter que excluye slots que solapan una ventana `half_day` de `business_closure_exceptions` (verifica `closure_type = 'half_day'`, overlap entre `slot_start`/`slot_end` y `bce.starts_at`/`bce.ends_at` convertidos a UTC con el timezone de la org)
- [x] 4.3 Ejecutar `npx supabase db push` y verificar que la migración se aplica sin errores
