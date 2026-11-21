# appointment-price-snapshot

## Purpose
Cada turno conserva el precio con el que se reservó, para que cambiar el precio de un servicio no reescriba el historial ni los ingresos.

## Requirements

### Requirement: El precio se guarda en el turno
Todo turno SHALL tener `price_cents` (precio cobrado, no nulo), `original_price_cents` y `discount_cents`. `create_appointment` los completa; un disparador completa `price_cents` con el precio del servicio si se inserta un turno sin precio.

### Requirement: Los turnos existentes se congelaron
Al introducir esta regla, los turnos sin precio recibieron el precio del servicio de ese día. El precio histórico real no se había guardado, por lo que no se puede recuperar.

### Requirement: Los números leen el precio guardado
El precio mostrado en los detalles del turno, los ingresos del Inicio del admin, las estadísticas por rango y las Estadísticas SHALL usar el precio guardado en el turno, nunca el precio actual del servicio.

#### Scenario: Cambio de precio
- **WHEN** el admin cambia el precio de un servicio
- **THEN** los ingresos de los turnos ya reservados no cambian y los turnos nuevos usan el precio nuevo
