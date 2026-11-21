# admin-appointment-detail

## Purpose
Desde Turnos, la admin abre un turno y puede reprogramarlo, cancelarlo o editar servicio, profesional y nota interna.

## Requirements

### Requirement: Abrir el detalle desde la lista
Cada fila de `/admin/appointments` SHALL navegar a `/admin/appointments/:id` (click en la fila o en el nombre del cliente, accesible por teclado).

#### Scenario: Click en una fila
- **WHEN** la admin hace click en un turno
- **THEN** ve cliente, contacto, fecha/hora, servicio, profesional, precio, estado y nota

#### Scenario: Turno inexistente
- **WHEN** el id no existe
- **THEN** ve "No encontramos este turno." sin acciones

### Requirement: Acciones solo en turnos activos
Reprogramar, Editar y Cancelar SHALL mostrarse solo si el estado es pendiente o confirmado. En cancelado, completado o no asistió se explica que ya no se puede modificar.

### Requirement: Reprogramar
Reprogramar SHALL abrir `/appointments/:id/reschedule` y, al terminar, volver al detalle (`state.returnTo`).

### Requirement: Cancelar
Cancelar SHALL pedir confirmación destructiva; al confirmar usa `cancel_appointment` y recarga el detalle. Si falla, muestra el error y conserva el turno.

### Requirement: Editar servicio, profesional y nota
- Solo se puede cambiar servicio, profesional y nota (la fecha/hora va por Reprogramar).
- Los profesionales ofrecidos son los activos que realizan el servicio elegido; al cambiar de servicio se conserva el profesional solo si también lo realiza.
- La nota se recorta; vacía se guarda como nula; máximo 500 caracteres.
- `ends_at` se recalcula con la duración del servicio nuevo.
- Si el profesional ya tiene otro turno superpuesto, se rechaza con `APPOINTMENT_CONFLICT`.
- `admin_update_appointment`, `admin_get_appointment` y `admin_list_staff_for_service` son solo para admin.
- Editar no envía emails (el trigger solo avisa por alta, cancelación o cambio de `starts_at`).
