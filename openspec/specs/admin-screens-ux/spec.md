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

### Requirement: Usuarios y roles compacto en el celular
En el celular, Usuarios y roles SHALL ocupar poco espacio: el título va solo (la explicación larga se muestra desde pantallas medianas), el botón "+ Agregar" va en la misma fila que el buscador, y los filtros por rol y por estado son filas de una sola línea con desplazamiento horizontal en lugar de varias filas. En pantallas medianas en adelante el botón dice "+ Agregar usuario" y los filtros se acomodan en varias líneas.

### Requirement: "Sin cuenta" en Usuarios y roles
Usuarios y roles SHALL tener un filtro "Sin cuenta" (con su cantidad) que lista a las personas cargadas por nombre que todavía no tienen cuenta: los **profesionales sin cuenta** (con el email guardado, si lo hay, y un enlace "Vincular cuenta" que abre Profesionales con el formulario de vincular ya abierto, `/admin/staff?vincular=<id>`) y los **clientes sin cuenta** (nombre, email y teléfono de turnos anteriores, solo para consulta). El buscador filtra también esa lista. Hoy solo se pueden vincular profesionales; los clientes sin cuenta no tienen vinculación. Si no se pueden cargar esas listas, la pantalla sigue funcionando con las cuentas.

### Requirement: Filtros de Usuarios y roles como desplegables
Los filtros de Usuarios y roles SHALL ser dos desplegables en una sola fila bajo el buscador, igual que en Turnos: **Rol** (Todos, Administradores, Staff, Clientes y Sin cuenta, cada uno con su cantidad) y **Estado** (Todos, Activos, Inactivos). Cada botón muestra lo elegido y se resalta solo cuando está filtrando. El desplegable de Estado se oculta en "Sin cuenta". Esto reemplaza lo dicho antes sobre filas de chips con desplazamiento horizontal.

### Requirement: Las personas sin cuenta son parte de la lista de Usuarios y roles
La lista de Usuarios y roles SHALL incluir, junto a las cuentas, a las personas **sin cuenta**: las **invitaciones pendientes** (con cualquier rol, administrador incluido, porque un rol solo existe con una cuenta o con una invitación), los **profesionales sin cuenta** y los **clientes sin cuenta** (cargados por nombre al reservar). "Todos" las incluye y su cantidad las suma; cada una aparece también en el rol que le corresponde (invitaciones por sus roles, profesionales sin cuenta en Staff, clientes sin cuenta en Clientes); "Sin cuenta" muestra solo a estas personas. Llevan la etiqueta "Sin cuenta" (las invitaciones, "Invitación pendiente"). Acciones: invitación → "Quitar"; profesional → "Vincular cuenta"; cliente → ninguna. Como no tienen estado, un filtro de Activos o Inactivos las deja afuera. El buscador las incluye. Esto reemplaza las secciones separadas de "Invitaciones pendientes" y de "Sin cuenta".

### Requirement: "Sin cuenta" se combina con el rol
"Sin cuenta" SHALL ser una opción del desplegable **Estado** (Todos, Activos, Inactivos, Sin cuenta), no del de **Rol**, para poder combinarla con el rol: por ejemplo Staff + Sin cuenta muestra solo los profesionales sin cuenta (y las invitaciones con rol Staff), Clientes + Sin cuenta a los clientes sin cuenta, Administradores + Sin cuenta a los administradores invitados. El desplegable de Rol queda con Todos, Administradores, Staff y Clientes, y la cantidad de "Sin cuenta" en Estado sigue al rol elegido. Esto reemplaza lo dicho antes sobre "Sin cuenta" dentro de Rol.

### Requirement: Vincular cuenta desde Usuarios y roles, en una ventana
"Vincular cuenta" de un profesional sin cuenta SHALL abrir una ventana emergente en la misma pantalla de Usuarios y roles (no navegar a Profesionales), con un buscador (por nombre o email, sin importar acentos ni mayúsculas) y la lista de cuentas para elegir. Solo se ofrecen las cuentas que todavía no son de otro profesional. "Guardar" necesita una cuenta elegida; si falla, se muestra el error y la ventana sigue abierta. Al guardar bien se cierra, se actualiza la lista y se pregunta "¿Querés ir a Profesionales para configurar a …?" ("Ir a Profesionales" / "Ahora no"). Esto reemplaza el enlace a `/admin/staff?vincular=`.

### Requirement: Al vincular no se ofrecen cuentas que ya tienen un profesional
La ventana de vincular cuenta SHALL listar todas las cuentas, administradores incluidos, pero solo se pueden elegir las que no pertenecen a ningún profesional; las demás aparecen atenuadas con la etiqueta "Ya es profesional" (también las de profesionales que la lista de Profesionales oculta porque su cuenta ya no tiene el rol staff). Cada cuenta puede tener un solo profesional. La base lo informa con `admin_staff_linked_user_ids`. Si aun así el servidor rechaza la cuenta (la tomaron mientras tanto), se muestra el error, se actualiza la lista y se descarta la elección.

### Requirement: Agregar usuario en una ventana
"Agregar usuario" SHALL abrirse como una ventana emergente (modal) sobre Usuarios y roles, en celular y en desktop: en el celular sube desde abajo como una hoja y en pantallas más grandes aparece centrada, con el email ya enfocado. Se cierra con "Cancelar", con Escape o sola al guardar bien. Los errores (rol faltante, invitación repetida, email que ya tiene cuenta con su enlace "Ir a Editar roles de esa cuenta") se muestran dentro de la ventana, no detrás.

### Requirement: Filtro "Cuenta" en lugar de "Estado"
El segundo desplegable de Usuarios y roles SHALL llamarse **Cuenta** y tener Todas, Con cuenta y Sin cuenta (con su cantidad, que sigue al rol elegido). "Con cuenta" deja afuera a las invitaciones, los profesionales sin cuenta y los clientes sin cuenta; "Sin cuenta" muestra solo a esas personas. Ya no hay Activos ni Inactivos. Esto reemplaza lo dicho antes sobre el desplegable Estado.

### Requirement: La lista de cuentas al vincular es un desplegable con altura limitada
En la ventana de vincular cuenta, el buscador SHALL ser un desplegable (combobox): la lista se abre al enfocar, hacer clic, escribir o tocar la flecha; al elegir una cuenta se cierra y su nombre queda en el cuadro; se puede volver a abrir y la elección se conserva. La lista muestra unas tres filas y a partir de la cuarta se desplaza (no crece sin límite). Escape cierra primero el desplegable y, con otro Escape, la ventana.

### Requirement: Nuevo profesional (y vincular o cambiar nombre) en una ventana
En Profesionales, "Nuevo profesional", "Vincular cuenta" y "Cambiar nombre" SHALL abrirse como ventanas emergentes con el mismo estilo que las de Usuarios y roles: hoja desde abajo en el celular y tarjeta centrada en pantallas más grandes, con el primer campo enfocado, errores dentro de la ventana y Escape para cerrar. Donde se elige una cuenta (Con cuenta y Vincular) se usa el mismo desplegable con buscador que al vincular desde Usuarios y roles: lista de unas tres filas con desplazamiento, se cierra al elegir y muestra el nombre; las cuentas que ya tienen un profesional (incluidos los que la lista oculta) aparecen atenuadas con "Ya es profesional" y no se pueden elegir. El primer Escape cierra el desplegable y el siguiente la ventana. Reemplaza el formulario que se abría sobre la lista y el selector común.

### Requirement: Servicios asignados explica su función y usa un desplegable con estilo
La pantalla "Servicios asignados" de un profesional SHALL explicar que son los servicios que esa persona realiza y que los clientes solo pueden reservar con ella los que figuran ahí (la reserva y los horarios disponibles solo consideran los servicios asignados). El selector para agregar un servicio SHALL ser el desplegable con estilo de la app (no el selector nativo del navegador), con nombre, duración y precio por opción, y el primer servicio ya elegido.

### Requirement: La disponibilidad explica que define los turnos que ve el cliente
Las pantallas de disponibilidad, la del administrador para cada profesional ("Disponibilidad") y la del propio profesional ("Mi disponibilidad"), SHALL explicar arriba que lo que se configura ahí define los turnos que el cliente ve para reservar: solo se puede reservar en los días y horarios que figuran, y los días libres y especiales quitan o cambian esos turnos. La explicación no se muestra mientras carga ni si el profesional no existe.

### Requirement: Campos de fecha y hora, y desplegables con el mismo estilo en toda la app
Todos los campos de fecha, hora, fecha y hora y mes SHALL usar la clase compartida `dt-field`: misma altura, borde, radio y fuente que el resto de los campos, anillo de foco con el color de la app, estado deshabilitado y de error, valor alineado a la izquierda también en iOS, e icono del calendario atenuado que se resalta al pasar el mouse. Los pop-ups del calendario y del reloj los dibuja el navegador y no se pueden estilizar. Todos los desplegables de la app SHALL usar el desplegable con estilo (`Select`, con sus opciones como hijos `<option>`), no el selector nativo del navegador; la lista abierta se ve igual en todas las pantallas.

### Requirement: Disponibilidad: el horario semanal solo se guarda con "Guardar horario"
En la disponibilidad (la del administrador para cada profesional y "Mi disponibilidad"), el horario semanal SHALL guardarse únicamente con "Guardar horario", nunca solo. Mientras el borrador difiere de lo guardado se muestra un aviso ("Tenés cambios sin guardar. Apretá “Guardar horario” antes de salir de esta sección: no se guardan solos."); deshacer el cambio lo quita. Cambiar a "Días libres y especiales" o volver a Profesionales con cambios sin guardar pregunta antes ("Volver y guardar" / "Salir sin guardar", que descarta); sin cambios no pregunta. Al cerrar o recargar la página con cambios sin guardar, el navegador pregunta. Quitar un día libre o agregarlo sigue aplicándose al instante, y los interruptores de permisos también.

### Requirement: Nuevo servicio y Editar servicio en una ventana
En Servicios, "Agregar servicio" y "Editar" de cada servicio SHALL abrir el formulario en una ventana emergente (hoja desde abajo en el celular, tarjeta centrada en pantallas más grandes), con el mismo contenido de antes (nombre, duración, precio, categoría, descripción, imagen al editar y opciones avanzadas). La lista y el botón de agregar quedan en la pantalla detrás. Se cierra con "Cancelar", con Escape (no mientras guarda o sube una imagen) o sola al guardar bien; si falla, el error se muestra dentro de la ventana y queda abierta. Abrir "Agregar" después de editar no arrastra los datos anteriores.

### Requirement: Servicios como tarjetas en desktop, y el menú se oculta al hacer clic afuera
La lista de Servicios SHALL verse igual en el celular y en desktop: tarjetas (nombre, categoría, estado, duración, precio y las acciones Editar, Desactivar/Reactivar y Disponibilidad), sin tabla en desktop. Además, en desktop, un clic fuera del menú lateral SHALL ocultarlo (se vuelve a mostrar con la hamburguesa de la barra superior); no cuentan los clics dentro del menú, en la propia hamburguesa ni dentro de una ventana emergente, y en el celular no cambia nada.

### Requirement: Categorías en ventana y botones con iconos de línea
En Servicios > Categorías, "Nueva categoría" y el lápiz de cada categoría SHALL abrir una misma ventana emergente (título "Nueva categoría" o "Editar categoría", con el nombre; hoja desde abajo en el celular, tarjeta centrada en pantallas más grandes). Se cierra con "Cancelar", con Escape (no mientras guarda) o sola al guardar bien; si falla, el error se muestra dentro y queda abierta. Las píldoras de las categorías usan iconos de línea con el estilo de la app (lápiz y cruz dibujados, no emoji ni símbolos de texto), con el nombre accesible "Editar …" y "Eliminar …".

### Requirement: Las acciones de cada fila o tarjeta se ven igual en toda la app
Las acciones de texto de las tarjetas y filas (Editar, Editar roles, Vincular cuenta, Cambiar nombre, Disponibilidad, Desactivar, Reactivar, Activar, Quitar, Eliminar) SHALL usar el mismo componente (`ActionButton` dentro de `ActionRow`): mismo tamaño y grosor, y tres tonos: **principal** (color de la app) para ir a algo o cambiarlo, **neutro** (gris) para cambiar un estado, y **peligro** (rojo) para quitar o eliminar. El orden es principal, estado y, al final, destructivo. Se aplica en Usuarios y roles, Profesionales, Servicios, Cupones, los cierres de Negocio, los servicios asignados, la disponibilidad de un servicio y los días libres.

### Requirement: La disponibilidad de un servicio se edita en una ventana
"Disponibilidad" de cada servicio, en la lista de Servicios, SHALL abrir una ventana emergente sobre la lista (hoja desde abajo en el celular, tarjeta centrada en pantallas más grandes) con el nombre del servicio, en lugar de llevar a otra pantalla. Dentro: elegir fecha única, rango de fechas o siempre disponible, y la lista de fechas configuradas con "Eliminar". Cuando no hay fechas, el aviso "Disponible cualquier día" explica que se cargan fechas si el servicio solo se ofrece algunos días y da el ejemplo "jornadas de depilación". Se cierra con ×, con Escape (no mientras trabaja). La dirección `/admin/services/:serviceId/availability` sigue funcionando y abre la lista con la ventana abierta; al cerrarla vuelve a `/admin/services`.

### Requirement: Servicios en la barra inferior del administrador (celular)
La barra de accesos rápidos del celular, para el administrador, SHALL tener Inicio, Turnos y Servicios (`/admin/services`, con un icono de etiqueta) y luego "Más". Servicios queda marcado también en la ventana de disponibilidad de un servicio (`/admin/services/:id/availability`). La barra de clientes y la de staff no cambian.

### Requirement: Reservar (igual para todos los roles): pasos en un menú y filtros compactos
La pantalla de reservar SHALL mostrar siempre arriba un menú de pasos (Servicio, Fecha, Horario, Confirmar) con círculos numerados unidos por una línea: el paso actual resaltado, los hechos con un tilde, y los que faltan apagados. Tocar un paso ya hecho vuelve a él y descarta lo elegido después (Servicio: vuelve a la lista y limpia el servicio; Fecha: vuelve al calendario conservando el servicio); los pasos que faltan no se pueden tocar. Desde el paso 2 hay además la flecha de volver. NO SHALL mostrar un título (el nombre del negocio ya está en la barra superior) ni el texto "Elegí el servicio que querés reservar."; los textos de título y subtítulo configurables de la reserva ya no se usan en esta pantalla. El filtro de categorías, en el celular, es un solo botón con desplegable ("Todas las categorías" más las categorías que tienen servicios); desde las pantallas medianas en adelante siguen los chips.

### Requirement: Reservar usa los colores del resto de la app
En el flujo de reservar (servicio, fecha, horario, confirmar, reprogramar), los botones principales ("Seleccionar este servicio", "Siguiente", "Confirmar reserva", confirmar la reprogramación), las selecciones (tarjeta de servicio, día del calendario, horario, "Para quién") y los anillos de foco SHALL usar el color de la app (violeta, con su variante más oscura al pasar el mouse), no verde. El verde queda solo para avisos de éxito (por ejemplo el cupón aplicado) y para los colores de disponibilidad y de estado. El menú de pasos usa el violeta para el paso actual y para los pasos hechos.
