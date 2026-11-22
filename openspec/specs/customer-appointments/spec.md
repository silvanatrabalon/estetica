# customer-appointments

## Purpose
La clienta ve sus turnos en Inicio y en Mis turnos con el mismo estilo y la misma estructura que la profesional, pero solo con lo suyo.

## Requirements

### Requirement: Solo sus turnos
Inicio y Mis turnos de la clienta SHALL usar `list_my_customer_appointments`, que devuelve únicamente los turnos donde la persona logueada es la clienta, también cuando tiene otros roles. Un id de turno de otra persona en `/appointments/:id` muestra "No encontramos este turno." sin datos.

### Requirement: Inicio de la clienta
Inicio SHALL usar el mismo diseño que el de la profesional (tarjetas lila "Siguiente turno de hoy" / "Ahora y siguientes", con la fecha como subtítulo), mostrando el servicio y "con {profesional}" en vez del nombre de la clienta. A la derecha del título hay un botón **+ Reservar**. Sin turnos hoy, muestra el próximo turno que viene (pendiente o confirmado, de cualquier día) con link a su detalle; sin ninguno, invita a reservar. Abajo hay un link "Ver todos mis turnos". Ya no hay tarjetas de atajos ni el link "Ir al sitio web" (está en el menú).

#### Scenario: Hoy no hay turnos pero hay uno la semana próxima
- **WHEN** la clienta entra a Inicio
- **THEN** ve "Hoy no tenés turnos." y su próximo turno con servicio, fecha, hora y profesional

### Requirement: Mis turnos de la clienta
Mis turnos SHALL ser **exactamente igual a Turnos de la profesional**, solo con los turnos de la clienta: título, buscador (por servicio o profesional), filtro desplegable de período (Hoy, Esta semana, Este mes, Próximos, Historial y Todos; empieza en Próximos y acepta `?periodo=` y `?estado=`) y filtro de estado, y tarjetas coloreadas por estado con servicio, estado, "con {profesional}" y fecha y hora. No hay vistas de calendario ni botón **+ Reservar** (reservar está en el menú). Los períodos se calculan por la fecha de cada turno, igual que en la lista de la profesional (un turno cancelado de fecha futura aparece en Próximos con su color). Sin resultados dice "No hay turnos que coincidan con los filtros." o, con búsqueda, "No encontramos turnos para “…” con estos filtros."

### Requirement: Detalle en popup
Tocar una tarjeta o el turno de Inicio SHALL abrir `/appointments/:id` como popup sobre la lista (hoja inferior en celular, centrado desde sm), con estado, fecha y hora, servicio, profesional, duración, precio y número de reserva, y un link "Ver confirmación". Mientras el turno es pendiente o confirmado y todavía no pasó, ofrece **Reprogramar** (vuelve al popup) y **Cancelar** (pide confirmación; al cancelar, la lista de atrás se actualiza y un error se muestra dentro del popup). Se cierra con la X o Escape.
