# admin-screens-ux

## Purpose
Las pantallas del admin se ven bien en el celular: sin contenedores ni títulos repetidos, con acciones a la vista.

## Requirements

### Requirement: Servicios con pestañas
La pantalla tiene un solo título y dos pestañas, "Servicios" y "Categorías". En Servicios, un selector filtra por "Todos" (incluye los servicios sin categoría), por categoría o por "Sin categoría", junto al botón "+ Agregar servicio"; si una categoría no tiene servicios lo dice.

### Requirement: Formulario de servicio compacto
El formulario muestra nombre, horas, minutos y precio en una grilla, descripción, categoría e imagen (al editar). El límite por recurso compartido queda en "Opciones avanzadas", que se abre solo si ya tiene valor o hay un error.

### Requirement: Crear categoría desde el servicio
El desplegable de categoría SHALL ofrecer "+ Crear categoría nueva". Al crearla queda elegida para ese servicio sin perder lo cargado; un nombre vacío o repetido muestra su error y no cierra el formulario.

### Requirement: Profesionales
Cada tarjeta muestra avatar, nombre, roles y estado; "Disponibilidad" y "Servicios" como botones; "Editar roles" y "Desactivar" como links. El botón "+ Agregar profesional" está siempre arriba, sin botón flotante. No hay "nombre para mostrar": el formulario solo pide elegir la cuenta ("Usuario vinculado") y el profesional usa el nombre de esa cuenta.

### Requirement: Asignar servicio
Una tarjeta con "Agregar un servicio" y el botón "Asignar", y los servicios asignados como filas con "Quitar", con flecha para volver a Profesionales y sin títulos repetidos.

### Requirement: Negocio
La pestaña General no repite el título "Datos del negocio". Los botones de guardar muestran solo "Guardar" (conservan su nombre accesible completo). La "Zona de peligro" es un bloque discreto y colapsable, con el botón a ancho completo en el celular.

### Requirement: Usuarios y roles
Un buscador, filtros por rol con la cantidad de cada uno (Todos, Administradores, Staff, Clientes) y filtros por estado (Todos, Activos, Inactivos), que se combinan. "Reintentar" aparece solo cuando falló la carga.

### Requirement: Textos al sitio público
Donde antes decía "Ver la página principal" o "Ver página pública" ahora dice "Ir al sitio web". El Inicio de clientes no muestra "Mi perfil" (está en el menú de la cuenta).

### Requirement: Turnos del admin
La lista de Turnos usa tarjetas con un color por estado, filtro de período (Hoy, Esta semana, Este mes, Próximos, Historial, Todos) y de estado (sin "Pendiente"), y por defecto muestra "Hoy". Las tarjetas del Inicio del admin llevan a Turnos con el filtro correspondiente.

### Requirement: Historial, Próximos y buscador de cliente en Turnos
"Próximos" SHALL listar los turnos desde ahora, el más cercano primero; "Historial" los anteriores a ahora, el más reciente primero. Un buscador "Buscar cliente" SHALL filtrar por nombre, email o teléfono del cliente (con cuenta o sin cuenta), sin importar mayúsculas ni acentos, esperando una pausa al escribir, y combinarse con período, estado y profesional. Un texto vacío equivale a no buscar, y si no hay resultados se dice qué se buscó.

### Requirement: Un turno completado sigue siendo editable
Que la hora de un turno ya haya pasado (estado "completado") NO SHALL impedir que admin y staff lo editen, lo cancelen o lo reprogramen. Solo "cancelado" no ofrece acciones. Los clientes siguen sin poder tocar un turno completado. Reprogramar un turno completado a una fecha futura lo deja confirmado.

### Requirement: Gift Card (admin)
El menú del admin SHALL tener "Gift Card" (`/admin/gift-cards`, solo admin), una pantalla para generar la imagen de una gift card para regalar. Se completa: **Para** (obligatorio), **De parte de** (opcional), **qué se regala** (un servicio activo, o un monto en pesos; obligatorio uno de los dos), **mensaje** corto (opcional), **válida hasta** (opcional) y el **estilo** (Rosa, Dorado, Lila). El diseño es apaisado (1600×1000, no formato historia), con papel claro, lazo, el logo y nombre del negocio, "GIFT CARD" grande, para quién, el servicio o monto, de parte de, el mensaje y la vigencia. Se ve una vista previa que se actualiza al escribir y se descarga como PNG con el nombre de quien la recibe. Los textos largos se recortan o parten sin pisarse; si el logo no carga, sale sin él; si el navegador no puede generar el PNG se avisa.

### Requirement: Menú lateral ocultable en desktop
En desktop (pantallas medianas en adelante) el menú lateral de los tres roles SHALL poder ocultarse y mostrarse con un botón de hamburguesa en la barra superior ("Ocultar menú lateral" / "Mostrar menú lateral"). Al ocultarlo el contenido ocupa todo el ancho. La elección se recuerda en el navegador; si este bloquea el almacenamiento, el menú vuelve a estar abierto al recargar. En el celular no cambia nada: el menú sigue abriéndose desde "Más".

### Requirement: "Ir al sitio" al final del menú
El menú lateral (desktop) y el menú del celular, de los tres roles, SHALL terminar con un único acceso "Ir al sitio →" que abre el sitio público (`/?sitio=1`). El marcador `?sitio` hace que admin y staff vean el sitio en lugar de ser redirigidos a su panel, y en ese caso se muestra un botón "← Volver al panel". Para clientes y visitantes el sitio se ve igual que siempre. Al usarlo en el celular se cierra el menú.
