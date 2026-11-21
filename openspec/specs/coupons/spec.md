# coupons

## Purpose
La admin crea cupones de descuento (monto fijo o porcentaje) que los clientes cargan por código al reservar.

## Requirements

### Requirement: Cupón
Un cupón SHALL tener código único (3 a 30 caracteres: letras, números, guion o guion bajo, en mayúsculas), tipo (`percent` 1-100 o `fixed` en pesos), categoría opcional, fechas de inicio y fin opcionales, estado activo y opción de mostrarlo en el sitio web.

#### Scenario: Código repetido
- **WHEN** la admin guarda un código que ya existe
- **THEN** se rechaza con "Ya existe un cupón con ese código."

### Requirement: Un uso por cliente
Cada cliente SHALL poder usar un cupón una sola vez. Un turno cancelado libera el cupón.

### Requirement: Validación al reservar
Al aplicar un código, el sistema SHALL rechazar con un mensaje en español: código inexistente, cupón inactivo, todavía no vigente, vencido, de otra categoría o ya usado. Los días de inicio y fin son inclusivos.

### Requirement: Precio cobrado
`create_appointment` SHALL aceptar un código opcional, volver a validarlo en el servidor y guardar en el turno el precio cobrado (`price_cents`), el original y el descuento. El descuento fijo nunca supera el precio y el total nunca es negativo.

### Requirement: Mostrar en el sitio
Los cupones marcados para el sitio, activos y vigentes SHALL aparecer en una sección "Promociones" de la página pública, que no se muestra si no hay ninguno.

### Requirement: Eliminar
Un cupón ya usado SHALL desactivarse en lugar de eliminarse, para conservar el historial.
