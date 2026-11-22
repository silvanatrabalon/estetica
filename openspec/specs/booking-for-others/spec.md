# booking-for-others

## Purpose
Admin y staff pueden reservar un turno a nombre de un cliente (con cuenta o sin cuenta) o para sí mismos. El turno es siempre del cliente, nunca de quien lo carga.

## Requirements

### Requirement: Admin y staff ven "Reservar"
Los roles admin y staff SHALL tener "Reservar turno" en el menú y poder abrir `/booking` y la confirmación. Las clientas siguen viendo "Mis turnos" (`/appointments`), que no es para admin ni staff.

### Requirement: Elegir para quién es
En el paso de revisión, solo admin y staff SHALL ver "¿Para quién es la reserva?" con tres opciones: "Para mí" (por defecto, el turno queda a su nombre), "Para un cliente" (desplegable con todas las cuentas con rol cliente, también las inactivas, y las personas sin cuenta ya cargadas antes) y "Otra persona" (nombre obligatorio, teléfono y email opcionales, sin cuenta). Las clientas nunca ven esta opción ni cargan la lista de clientes.

#### Scenario: Para un cliente
- **WHEN** se elige un cliente y se confirma
- **THEN** el turno queda con `customer_user_id` del cliente y `created_by_user_id` de quien lo cargó

#### Scenario: Otra persona sin cuenta
- **WHEN** se escribe un nombre y se confirma
- **THEN** el turno guarda `guest_name`, `guest_phone` y `guest_email`, sin `customer_user_id`

#### Scenario: Datos incompletos
- **WHEN** no se eligió cliente, o el nombre tiene menos de 2 letras, o el email no es válido
- **THEN** se muestra el motivo y no se reserva

### Requirement: Reglas en el servidor
`create_appointment` SHALL aceptar `p_customer_user_id` o los datos de la persona solo si quien llama es admin o staff (`BOOKING_NOT_ALLOWED` en otro caso), rechazar ambos a la vez o datos inválidos (`BOOKING_CUSTOMER_INVALID`, `BOOKING_GUEST_INVALID`) y mantener las reglas de horarios y profesional libre. `list_booking_clients` solo responde a admin y staff.

### Requirement: Cupones
El cupón SHALL poder usarse solo al reservar "Para mí"; no se ofrece para un cliente ni para otra persona, y el servidor rechaza un cupón en una reserva sin cuenta (`COUPON_NOT_FOR_GUEST`).

### Requirement: Se ve el nombre de la persona
Las listas, el detalle del turno, el Inicio, los mails y las estadísticas SHALL mostrar el nombre cargado cuando la persona no tiene cuenta. Las estadísticas agrupan a las personas sin cuenta por nombre.

### Requirement: Avisos
Al cliente con cuenta le llega el email de siempre; a la persona sin cuenta, solo si se cargó su email. El profesional siempre recibe el aviso. La pantalla de turno confirmado dice "Turno reservado para {nombre}" cuando quien lo mira no es el cliente.

### Requirement: El desplegable de clientes
`list_booking_clients` SHALL devolver todas las cuentas con rol cliente (las desactivadas con la marca "inactivo") y, sin repetir por nombre y email, las personas sin cuenta de turnos anteriores (con los datos más recientes), marcadas "sin cuenta". Elegir una persona sin cuenta cambia la opción a "Otra persona" con sus datos ya completos, editables.

### Requirement: Después de reservar
La pantalla de turno confirmado SHALL llevar a "Ver turnos" (`/admin/appointments`) para admin, "Ver turnos" (`/staff/appointments`) para staff y "Ver mis turnos" (`/appointments`) para clientes, porque "Mis turnos" es solo de clientes.
