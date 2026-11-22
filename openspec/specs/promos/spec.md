# promos

## Purpose
Promos bajan el precio de servicios elegidos durante un rango de fechas. Se aplican solas al reservar (sin código ni imagen) y el servicio se ve distinto en la reserva.

## Requirements

### Requirement: Administrar promos
Solo el admin SHALL poder crear, editar, activar/desactivar y eliminar promos desde `/admin/promos`, en una ventana emergente. Una promo tiene nombre (2–60), descripción opcional, descuento (porcentaje entero 1–100 o monto fijo), servicios elegidos (al menos uno), vigencia Desde/Hasta obligatoria (Desde ≤ Hasta), estado activo y la opción "Mostrar esta promo en el sitio web" (apagada por defecto).

#### Scenario: Faltan datos
- **WHEN** el admin guarda sin servicios, sin fechas o con un valor inválido
- **THEN** cada problema se muestra junto a su campo y no se guarda nada

#### Scenario: Eliminar
- **WHEN** el admin elimina una promo
- **THEN** se pide confirmación y los turnos ya reservados conservan su descuento

### Requirement: Precio automático
El servidor SHALL aplicar la mejor promo vigente hoy (zona horaria del negocio) al crear el turno, también cuando admin o staff reservan para otra persona, y guardar `promo_id` y el descuento en el turno.

#### Scenario: Promo vencida o desactivada
- **WHEN** la promo está inactiva, vencida o aún no empezó
- **THEN** no se aplica y el turno cobra el precio normal

### Requirement: No se suma con cupones
Un servicio con promo vigente SHALL rechazar cupones (`COUPON_NOT_WITH_PROMO`) y la reserva oculta la caja de cupón con un aviso.

### Requirement: Promo visible en la reserva
Las tarjetas de servicio en promo SHALL mostrar la insignia "PROMO", el precio original tachado y el precio con promo; el detalle muestra nombre, descripción y "Válida hasta"; la revisión muestra la línea de promo y el total. Si las promos no cargan, los servicios se muestran igual.

### Requirement: Promo visible en la página web
La sección Promociones de la landing SHALL listar solo las promos activas, vigentes, con `show_on_site` y con al menos un servicio activo, junto a los cupones públicos. Las promos no muestran código.

### Requirement: Links desde la web
`list_public_promos` SHALL devolver también `service_ids` para que la web lleve cada promo a su reserva.

