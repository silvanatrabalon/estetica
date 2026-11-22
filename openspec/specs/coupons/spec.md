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

### Requirement: Cupón público o privado, y copiar el código
En el formulario del cupón, "Mostrar en el sitio web" SHALL reemplazarse por la pregunta "¿Quién puede ver este cupón?" con dos opciones explicadas: **Público** (aparece en el sitio web, lo ve cualquiera) y **Privado** (no se muestra en ningún lado, solo lo usa quien reciba el código). Un cupón nuevo empieza como privado. Cada cupón de la lista SHALL indicar siempre "Público · en el sitio web" o "Privado · solo con el código", y mostrar un icono de copiar junto al código, que lo copia al portapapeles y confirma cambiando a un tilde; si el navegador no lo permite, muestra el código para copiarlo a mano.

### Requirement: Vigencia obligatoria
El formulario del cupón SHALL agrupar las fechas bajo el título "Vigencia" con "Desde" y "Hasta", ambas obligatorias (sin la marca "opcional"). No se guarda sin las dos, y se indica cuál falta; "Hasta" no puede ser anterior a "Desde". Los cupones viejos sin fechas siguen funcionando, pero al editarlos hay que completarlas.

### Requirement: Imagen del cupón para compartir
Cada cupón SHALL tener un icono "Descargar imagen" que abre una ventana con vista previa y un selector de tema (Base, Navidad, Año nuevo, Black Friday, Cyber Monday, Día de la madre, Día de la mujer). La imagen tiene formato vertical de historia de Instagram (1080×1920, 9:16) se genera en el navegador como SVG, con el logo del negocio arriba, el descuento, el código, a qué aplica, la vigencia y el nombre del negocio; se descarga solo como imagen PNG, con un nombre que incluye el código y el tema. Si el logo no se puede cargar la imagen sale sin él; si el navegador no puede generar el PNG se avisa.
