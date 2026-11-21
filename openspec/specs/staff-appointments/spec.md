# staff-appointments

## Purpose
La profesional ve y gestiona sus propios turnos: agenda, calendario, detalle e Inicio con resumen.

## Requirements

### Requirement: Solo los turnos propios
Las vistas de staff (Agenda, calendario e Inicio) SHALL usar `list_my_staff_appointments`, que devuelve únicamente los turnos donde la persona logueada es la profesional, también cuando es administradora y entró con el rol staff.

### Requirement: Detalle del turno para staff
Tocar un turno en la agenda (lista o calendario, semanal o mensual) o en Inicio SHALL abrir `/staff/appointments/:id`, no la confirmación de la clienta. `staff_get_appointment` devuelve el detalle (cliente, email, teléfono, nota, servicio, profesional, precio) solo si el turno es de esa profesional o si es admin; si no, "No encontramos este turno".

#### Scenario: Acciones
- **WHEN** el turno está pendiente o confirmado
- **THEN** la profesional puede reprogramar (y vuelve al detalle) y cancelar con confirmación, pero no editar servicio ni profesional (eso es del admin)

#### Scenario: Turno no modificable
- **WHEN** el turno está cancelado, completado o sin asistencia
- **THEN** no hay acciones y se explica que ya no se puede modificar

### Requirement: Inicio de staff
El Inicio con el rol staff SHALL mostrar el próximo turno, la lista de hoy y cuatro contadores (hoy, esta semana de lunes a domingo, este mes y cancelados del mes, en la zona horaria del negocio, sin contar cancelados salvo en su propio contador). Cada turno lleva a su detalle y cada contador a la Agenda. Incluye el link "Ir al sitio web".

### Requirement: Reservar desde Inicio de staff
Si la persona también es cliente, el Inicio de staff SHALL ofrecer "Reservar turno", que cambia al rol cliente y abre la reserva a su nombre. Si no es cliente, muestra "Para crear tus propias reservas a tu nombre, pedile a tu administrador que te haga cliente."
