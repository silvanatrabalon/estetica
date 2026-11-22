# Guía de la persona administradora

Esta guía recorre, uno por uno, los ítems del menú de **Estética So Beauty** y explica qué hace cada pantalla y cómo usarla. Está pensada para quien administra el negocio.

> **Sobre las capturas:** donde dice `📷 Captura:` va una imagen de esa pantalla. Por ahora está solo el texto.

---

## 0. Antes de empezar

### Cómo entrar
1. Entrá al sitio y tocá **Reservar** (o el botón para ingresar).
2. Ingresá con tu cuenta de Google.
3. Si tu cuenta tiene más de un rol (por ejemplo administrador y profesional), te pide elegir con cuál querés trabajar. Elegí **Administrador**. Más tarde podés cambiar de rol desde el menú de tu usuario, arriba a la derecha, con **Cambiar modo** (ese menú también tiene **Perfil** y **Cerrar sesión**).

📷 Captura: pantalla "Elegí tu rol".

### Orden recomendado para dejar todo andando
1. **Negocio** → nombre, horarios, política de reservas.
2. **Servicios** → qué ofrecés, cuánto dura y cuánto cuesta.
3. **Profesionales** → quiénes atienden, qué servicios hacen y cuándo trabajan.
4. **Apariencia** → logo y página pública.
5. Después, el día a día: **Inicio**, **Turnos**, **Reservar turno**, y las herramientas de venta: **Cupones**, **Promos**, **Gift Card**.

---

## 1. Inicio

La pantalla de bienvenida del día. Muestra **la fecha de hoy** y la **agenda de hoy**.

- **Siguiente turno de hoy** (o **Ahora y siguientes**, si hay varios en curso): los turnos que están ocurriendo o los que vienen, con hora, cliente, servicio y profesional.
- **Total de turnos de hoy:** un acceso arriba a la derecha que te lleva a **Turnos** filtrado por **Hoy**.
- Tocá cualquier turno para abrir su **detalle** (ver la sección *Turnos*).

Es la pantalla para mirar al empezar el día. No hay nada que configurar acá.

📷 Captura: Inicio con turnos del día.

---

## 2. Negocio

Los datos generales y las reglas con las que funciona todo el sistema. Tiene cinco secciones, que se eligen con las pestañas de arriba: **General**, **Horarios**, **Cierres**, **Política** e **Historial**.

> Si cambiás algo y salís sin guardar, el sistema te avisa que hay **cambios sin guardar** para que no se pierdan.

📷 Captura: Negocio con las cinco pestañas.

### General
- **Nombre del negocio:** el que aparece en la barra superior y en los mensajes a clientes.
- **Zona horaria:** define a qué hora se muestran y se calculan los turnos. Elegí la de tu ciudad.
- **Dirección del local:** opcional. Aparece en el sitio web, en la sección **Contacto**, con un link que abre el mapa. Si la dejás vacía, no se muestra nada.

### Horarios
Los **horarios de atención del negocio**, día por día de la semana.
- Para cada día, marcá si está **abierto** o **cerrado** y poné la hora de apertura y de cierre.
- Elegí cómo trabaja el negocio:
  - **Jornada corrida:** un solo horario por día (por ejemplo, de 9 a 19).
  - **Dos turnos:** mañana y tarde, con una pausa en el medio.
- Estos horarios son el **límite máximo**: un profesional nunca puede atender fuera del horario del negocio.
- La página pública puede mostrar estos horarios (se activa en **Apariencia → Horarios**).

### Cierres
Para los días en que el negocio **no atiende o atiende distinto**: feriados, vacaciones, un arreglo, etc.
- Tocá **Agregar** y elegí la **fecha** y el **tipo de cierre**:
  - **Día completo:** ese día no se puede reservar.
  - **Medio día:** completá **Cierra desde** y **Reabre a las**; solo se bloquea esa franja.
- **Motivo (opcional):** una nota para vos.
- Los cierres próximos se muestran también en la página pública.
- Para quitar un cierre, usá **Eliminar** en su fila.

### Política
Las reglas de reserva para tus clientes:
- **Anticipación mínima para reservar:** cuánto antes del turno tiene que reservar la persona. Con 2 horas, no se puede reservar un turno que empieza en 1 hora.
- **Cuántos días hacia adelante se puede reservar:** hasta qué fecha, contando desde hoy (entre 1 y 365 días).
- **Notificaciones por email:** el sistema manda emails solo, en tres momentos:
  - cuando se **crea** un turno (confirmación),
  - cuando se **cancela**,
  - cuando se **reprograma** (cambia de día u hora).

  No se manda email cuando cambiás el servicio o el profesional desde **Editar**, ni cuando un turno pasa a completado.

  **Quién recibe cada email.** Por cada una de esas interacciones sale un email a cada uno de estos (nadie ve las direcciones de los otros):
  1. **El cliente** (si tiene email).
  2. **El profesional del turno** (el email de su cuenta, o el que cargaste al invitarlo si todavía no tiene cuenta).
  3. **Los administradores que elijas**, en el email de su cuenta. En Negocio → Política → Notificaciones hay una lista con **todos los administradores** y una casilla para cada uno: tildás a quién le llegan las copias. Quien está tildado recibe el aviso de **todos** los turnos, aunque el profesional sea otra persona. Por defecto están todos tildados, y podés dejar a nadie.

  Si dos de esas direcciones son la **misma persona**, recibe **un solo email**: por ejemplo, si vos sos también la profesional de ese turno, o si cargás un turno a tu propio nombre.
- **Enviar notificaciones por email:** el interruptor general. Destildado, **no sale ningún email** (ni al cliente, ni al profesional, ni a vos), pero los turnos se siguen creando normalmente. Dejalo destildado mientras hacés pruebas para no mandar emails reales a clientes.
- **Límite diario:** el envío usa un servicio gratuito con un tope de **300 emails por día**. Como cada interacción usa un email por cada destinatario (cliente, profesional y administradores elegidos), con un solo administrador alcanza para unas **100 reservas, cancelaciones o reprogramaciones por día**; con más administradores, menos. Si se supera el tope, los emails que sobran no salen ese día (se retoma al día siguiente), pero los turnos **no se ven afectados**: se crean igual, solo falta el aviso.

### Historial
Una zona delicada. Permite **eliminar todo el historial de reservas**.
- Pide **dos confirmaciones** porque **no se puede deshacer**.
- Usalo solo, por ejemplo, para limpiar datos de prueba antes de empezar a usar el sistema de verdad.

---

## 3. Usuarios y roles

Quién tiene cuenta en el sistema y qué puede hacer cada persona.

📷 Captura: lista de usuarios con los filtros.

### Los roles
- **Administrador:** acceso a todo lo de esta guía.
- **Staff (profesional):** ve y gestiona sus propios turnos y su horario.
- **Cliente:** reserva turnos y ve los suyos.

Una misma persona puede tener **varios roles** a la vez.

### La lista
- **Buscar por nombre o email:** escribí y la lista se filtra.
- **Filtros desplegables:** por **rol** (Todos, Administradores, Staff, Clientes) y por **cuenta** (Todas, Con cuenta, Sin cuenta).
- **Sin cuenta:** personas cargadas por vos (por ejemplo, un profesional que todavía no tiene cuenta de Google). Ver *Vincular cuenta*.

### Agregar usuario
1. Tocá **+ Agregar usuario**.
2. Escribí el **email** de la persona (cuenta de Google) y elegí sus roles.
3. Guardá. Cuando esa persona ingrese por primera vez con ese email, ya tendrá los roles asignados.

Si el email **ya tiene cuenta**, el sistema te lo dice y te lleva a **Editar roles** de esa cuenta.

### Editar roles
En la fila de cada persona, tocá **Editar roles**. En el popup marcás o desmarcás los roles y guardás. Ahí también podés cambiar el **nombre** y el **teléfono** de la persona. Si dejás el nombre vacío, se usa el de su email (lo que va antes de la @). Si agregás el rol de **staff**, la persona pasa a poder figurar como profesional (ver *Profesionales*).

### Vincular cuenta
Cuando un profesional se cargó **sin cuenta**, aparece en esta lista con **Vincular cuenta**. Elegís la cuenta correspondiente de un desplegable y queda asociada. Las cuentas que ya pertenecen a otro profesional aparecen **deshabilitadas**, para evitar duplicados.

### Eliminar
En la fila de cada persona, junto a **Editar roles**, está **Eliminar**. Pide confirmación y, al aceptar, **borra la cuenta y su acceso para siempre**, cancela sus turnos próximos y deja sus turnos pasados sin el nombre del cliente. No aparece en tu propia fila, para que no te quedes sin acceso.

> Para quitar permisos sin borrar a nadie, sacale los roles desde **Editar roles**. No hay botón de "desactivar" para usuarios.

---

## 4. Profesionales

Las personas que atienden. Acá se define **quién hace qué y cuándo trabaja**.

📷 Captura: lista de profesionales con sus acciones.

### La lista
Cada profesional se muestra como una tarjeta con su nombre y estas acciones:
- **Disponibilidad:** sus días y horarios de trabajo.
- **Servicios:** qué servicios realiza.
- **Vincular cuenta:** asociar su cuenta de Google (si todavía no tiene).
- **Cambiar nombre:** corregir cómo se muestra su nombre.
- **Desactivar / Reactivar:** un profesional desactivado no recibe reservas nuevas, pero **no se pierde** su historial.

### Nuevo profesional
Tocá **+ Nuevo profesional**. En el popup elegís el tipo:
- **Con cuenta:** elegís una cuenta existente de un desplegable.
- **Sin cuenta:** solo escribís el nombre (ej.: *María González*). Sirve si todavía no usa el sistema; más adelante le vinculás su cuenta.

### Servicios asignados
Una pantalla para elegir **qué servicios realiza** este profesional, con un desplegable para agregar servicios y la lista de los que ya tiene.
- **Un cliente solo puede reservar un servicio con los profesionales que lo hacen.** Si nadie tiene asignado un servicio, ese servicio no tiene horarios disponibles.

### Disponibilidad
Define **cuándo atiende** el profesional. Tiene dos pestañas.

> **Importante:** esto define los turnos que ve el cliente. Los clientes solo pueden reservar con este profesional en los días y horarios que figuran acá. Si un día o una franja no está, no aparece para reservar.

**Horario semanal**
- Para cada día de la semana: **trabaja o no** y la franja (o las dos franjas, si el negocio trabaja en dos turnos).
- Tiene que estar **dentro del horario del negocio**.
- Se guarda con **Guardar horario**. Si salís sin guardar, el sistema avisa.
- **Puede editar su horario:** si lo desmarcás, el profesional ve su horario pero solo vos podés cambiarlo.

**Permitir o no que el profesional configure su disponibilidad**

Arriba de cada pestaña hay un interruptor. Vos decidís cuánto puede tocar el profesional por su cuenta (desde su rol de staff, en **Mi horario**):

| Interruptor | Si está tildado | Si lo destildás |
|---|---|---|
| **Puede editar su horario** (pestaña Horario semanal) | El profesional cambia su propio horario semanal. | Ve su horario, pero no lo puede modificar: le aparece el aviso "Tu administrador define tus horarios". Solo vos lo cambiás. |
| **Puede cargar sus días libres** (pestaña Días libres y especiales) | El profesional agrega y quita sus propios días libres y horarios especiales. | Ve sus días, pero no puede agregar ni quitar ninguno: le aparece "Tu administrador carga tus días libres". |

Los dos interruptores son independientes: podés dejarle cambiar los días libres pero no el horario semanal, o al revés. Vos, como administrador, siempre podés editar todo.

**Días libres y especiales**
- Muestra la lista de días con excepciones (vacaciones, un día de estudio, un horario reducido).
- Tocá **+ Agregar** y completá, en el popup:
  - **Fecha**.
  - **Tipo:** **Día libre** (no atiende ese día) u **Horario especial** (atiende, pero en otro horario).
  - **Horario:** para el horario especial.
  - **Motivo (opcional)**.
- Para sacar uno, usá **Eliminar** en su fila.
- **Puede cargar sus días libres:** si lo desmarcás, el profesional no puede agregar ni quitar días.

> **Cómo se combina todo:** un horario está disponible para reservar solo si el **negocio está abierto**, el **profesional trabaja** ese día y hora, no hay un **cierre** ni un **día libre**, y **no tiene ya otro turno**.

---

## 5. Servicios

Lo que ofrecés. Tiene dos pestañas: **Servicios** y **Categorías**.

📷 Captura: lista de servicios (tarjetas en celular, grilla en escritorio).

### Servicios
Cada servicio se muestra con su foto, nombre, duración y precio.

**Crear o editar un servicio** (**+ Nuevo servicio** o **Editar**), en un popup:
- **Nombre.**
- **Categoría:** para ordenarlos en la reserva (opcional).
- **Duración:** en horas y minutos.
- **Precio.**
- **Imagen:** la foto que se muestra en la reserva y en la página pública.
- **Descripción:** el texto que ve el cliente al tocar el servicio.
- **Reservas simultáneas:** normalmente se **deja vacío**: cada profesional atiende un cliente a la vez y la capacidad sale de sus agendas. Completalo solo si hay algo compartido que limita, como una única cabina o un solo aparato (ej.: *camilla solar*).

**Acciones de cada servicio:**
- **Editar.**
- **Disponibilidad:** abre un popup para limitar **en qué fechas** se ofrece (por ejemplo, *jornadas de depilación* solo ciertos días). Si no cargás fechas, el servicio se ofrece siempre.
- **Desactivar / Reactivar:** un servicio desactivado no aparece para reservar y no pierde su historial. (Los servicios no se borran: se desactivan.)

> **Duración y horarios:** los horarios que se ofrecen siguen la duración del servicio. Por ejemplo, un servicio de 60 minutos se ofrece a las 10:00, 11:00, 12:00; uno de 45 minutos se redondea a una grilla de 60 minutos; uno de 90, cada 90. Así los horarios nunca se pisan.

### Categorías
Agrupan los servicios (ej.: *Manos, Pies, Faciales, Masajes*).
- **+ Nueva categoría** abre un popup para el nombre.
- Cada categoría tiene un ícono para **editar** y otro para **eliminar**.
- Se usan como filtros en la reserva y para los **cupones** que aplican a una sola categoría.

---

## 6. Reservar turno

Sirve para **cargar un turno por teléfono o en persona**, igual que lo haría un cliente, pero **para otra persona**.

📷 Captura: pantalla de reserva con el menú de pasos.

### Los 4 pasos
La barra de arriba muestra **1 Servicio → 2 Fecha → 3 Horario → 4 Confirmar**. Podés tocar un paso ya hecho para volver y cambiarlo.

1. **Servicio:** elegí de la lista. Podés filtrar por **categoría** y por **Promos** (los servicios con descuento). Los servicios en promo se ven con una insignia **PROMO**, el precio original tachado y el precio con descuento. Al tocar un servicio se abre su detalle; **Seleccionar este servicio** sigue al paso 2.
2. **Fecha:** un calendario. Los días **verdes** tienen varios horarios libres, los **durazno** tienen pocos, y los grises no tienen disponibilidad.
3. **Horario:** los horarios libres del día. Elegí uno y **Siguiente**.
4. **Confirmar:** revisá servicio, fecha y hora, duración y precio, y **Confirmar reserva**.

**Cómo se asigna el profesional.** Vos no elegís con quién: el sistema asigna el turno **al primer profesional que, en ese horario, hace ese servicio, trabaja y está libre**. Si hay varios libres a la vez, gana **el que se cargó primero en Profesionales** (el más antiguo). No es un sorteo ni se reparte parejo entre todos. Un horario figura como disponible si **al menos uno** está libre; si ninguno lo está, no aparece.

Después podés **cambiar el profesional** del turno: **Turnos** → abrir el turno → **Editar** (ver la sección *Turnos*).

### Para quién es la reserva
En el último paso elegís:
- **Para mí:** el turno queda a nombre de tu usuario.
- **Para un cliente:** elegís a un cliente que ya existe.
- **Otra persona:** escribís su **nombre** (y, si querés, teléfono y email) para quien no tiene cuenta.

Se avisa por email a la persona (si cargaste su email).

### Precios, promos y cupones
- Si el servicio tiene una **promo vigente**, el descuento se aplica **solo** y se ve en el detalle y en el total.
- Los **cupones** se cargan en la caja **¿Tenés un cupón?** (solo cuando la reserva es para vos). **No se suman a una promo**: si el servicio ya tiene promo, la reserva te lo avisa.

---

## 7. Turnos

La lista de **todas las reservas**, para buscar, revisar y modificar.

📷 Captura: lista de turnos con filtros.

### Filtros
- **Período:** Hoy, Esta semana, Este mes, Próximos, Historial y Todos.
- **Estado:** Todos los estados, Confirmado, Cancelado o Completado.
- **Profesional:** ver solo los turnos de una persona.
- **Buscar cliente:** por nombre, email o teléfono; la lista se filtra mientras escribís.

Cada tarjeta muestra al cliente, el estado (con un color), el servicio, el profesional y la fecha y hora. La lista se divide en páginas.

### Detalle del turno
Tocá un turno y se abre su **detalle** en un popup:
- **Cliente, estado, fecha y hora, servicio, profesional, duración, precio.** Y email, teléfono y nota si los hay.
- **Reprogramar:** te lleva a elegir otro día y horario para ese mismo turno.
- **Editar:** cambiar el **servicio** o el **profesional** (no la fecha: para eso es Reprogramar). Es la forma de **reasignar** un turno a otro profesional distinto del que eligió el sistema; en el desplegable aparecen solo los profesionales que hacen ese servicio.
- **Cancelar:** pide confirmación y le avisa por email al cliente y al profesional. Un turno cancelado libera el horario.
- Un turno **completado** (que ya pasó) **también se puede editar**, reprogramar o cancelar.

Cuando cerrás el popup después de un cambio, la **lista se actualiza** sola para reflejarlo.

---

## 8. Estadísticas

Cuánto trabajaste y cuánto ingresó, en el período que elijas.

📷 Captura: Estadísticas con las tres tarjetas y los gráficos.

- **Desde / Hasta:** elegí el rango de fechas. Empieza en el **mes actual**. Si dejás una fecha vacía, no se limita de ese lado (con las dos vacías ves **todo**).
- Solo cuentan los **turnos que ya se realizaron** (confirmados o completados). Los cancelados y los próximos no suman.

Qué muestra:
- **Servicios, Ingresos brutos y Clientes** del período, en tres tarjetas.
- **Ingresos por mes:** un gráfico con los **últimos 12 meses**, sin importar el rango elegido.
- **Servicios por profesional:** cuántos servicios hizo cada una y cuánto ingresó.
- **Clientes más fieles:** los clientes con más visitas y cuánto gastaron.

---

## 9. Cupones

Descuentos que el cliente **carga con un código** al reservar.

📷 Captura: lista de cupones.

### Cada cupón
- **Código:** lo que escribe el cliente (3 a 30 caracteres: letras, números, guion). Se guarda en mayúsculas y **no se puede repetir**.
- **Tipo de descuento:** **Porcentaje** (de 1 a 100) o **Monto fijo** (en pesos). El descuento nunca supera el precio.
- **Descripción (opcional):** se muestra en el sitio si el cupón es público.
- **Aplica a:** **todos los servicios** o una **categoría**.
- **Vigencia:** fecha **Desde** y **Hasta** (las dos son obligatorias; ambos días cuentan).
- **¿Quién puede ver este cupón?**
  - **Público:** aparece en la sección **Promociones** de la página web.
  - **Privado:** no se muestra en ningún lado; solo lo usa quien reciba el código de tu parte.
- **Cupón activo:** para apagarlo sin borrarlo.

### Reglas
- **Cada cliente puede usar un cupón una sola vez.** Si cancela el turno, el cupón se libera.
- El sistema rechaza, con un mensaje claro: código inexistente, inactivo, todavía no vigente, vencido, de otra categoría o ya usado.
- **No se suma con una promo.**

### Acciones
- **Copiar código:** el ícono de copiar junto al código.
- **Descargar imagen:** genera una imagen del cupón para compartir en redes (historias de Instagram, etc.), con distintos **estilos** (Base, Navidad, Año nuevo, Black Friday, Cyber Monday, Día de la madre, Día de la mujer) y el logo SB del negocio, que se pinta del color que mejor se lee en cada estilo.
- **Editar.**
- **Desactivar / Activar.**
- **Eliminar:** un cupón que ya se usó conviene **desactivarlo** para no perder el historial.

---

## 10. Promos

Descuentos **automáticos** sobre servicios elegidos, durante unos días. A diferencia del cupón, **el cliente no tiene que hacer nada**: el precio baja solo.

📷 Captura: lista de promos.

### Cada promo
- **Nombre** (2 a 60 caracteres) y **Descripción** (opcional).
- **Valor:** el porcentaje o el monto, y el **tipo** (**Porcentaje** o **Monto fijo**).
- **Servicios en promo:** un desplegable donde se tildan **uno o más servicios**.
- **Vigencia:** **Desde** y **Hasta**, obligatorias.
- **Mostrar en la web:** si está tildado, la promo aparece en la sección **Promociones** de la página pública. En la pantalla de reservar **siempre** se ve, esté o no tildado.
- **Promo activa:** para apagarla sin borrarla.

### Cómo se ve para el cliente
- En la reserva y en la página web, el servicio aparece **marcado como PROMO**, con el precio anterior tachado y el nuevo precio.
- El turno se cobra con el descuento, **también cuando lo cargás vos** para otra persona.
- Si un servicio está en **dos promos**, se aplica la de **mayor descuento**.
- **No se suma con cupones.**
- Desde la página web, un clic en una promo lleva **directo a reservar** con ella.

### Estado y acciones
Cada promo muestra su estado: **Vigente**, **Próxima**, **Vencida** o **Inactiva**, y cuántas veces se usó.
- **Editar**, **Desactivar / Activar** y **Eliminar**. Al eliminar, los turnos que ya la usaron **conservan su descuento**.

---

## 11. Gift Card

Para armar una **tarjeta de regalo** como imagen y mandarla.

📷 Captura: formulario con la vista previa.

1. Completá **Para quién** (nombre de quien recibe) y **De parte de** (quien regala).
2. **Qué se regala:** un **servicio** (elegís uno de la lista) o un **monto** en pesos.
3. **Mensaje:** una dedicatoria corta.
4. **Válida hasta:** una fecha de vencimiento.
5. **Estilo:** **Rosa**, **Dorado** o **Lila**.
6. Mirás la **vista previa** y tocás **Descargar imagen**.

Lleva el logo SB del negocio en el color del estilo elegido. Se descarga como una imagen que podés mandar por WhatsApp o imprimir. La gift card **no se guarda en el sistema**: es solo la imagen.

---

## 12. Apariencia

Todo lo que ven tus clientes: tu **logo** y tu **página pública**. Es una sola pantalla con **bloques**. Cada uno muestra lo que está guardado y tiene un botón **Editar** que abre un popup; cada popup **guarda solo su parte**.

📷 Captura: Apariencia con todos los bloques.

### Logo
- Se muestra en la **barra superior** de la aplicación.
- **Editar:** podés **subir un archivo** (JPG, PNG, WEBP, GIF o **SVG**, hasta 2 MB) o **pegar la dirección (URL)** de una imagen. **Quitar logo** lo borra.
- **Consejo:** usá una imagen con **fondo transparente** (PNG o SVG). Si tiene fondo blanco, en la barra superior se ve un recuadro blanco.

### Sección principal
La primera parte de la página pública: un **título** y un **subtítulo** grandes. Si los dejás vacíos, se usan textos predeterminados.

**Truco del título:** una palabra va en **cursiva y en tu color principal**. Marcala entre asteriscos, por ejemplo `Donde la *belleza* se vuelve arte`. Si no ponés asteriscos, la cursiva se aplica a la última palabra.

### Sobre nosotros
Un texto libre para contar la historia de tu espacio.

### Diseño
- **Color principal** (portada y botones) y **color secundario** (fondo de tarjetas y detalles). Se eligen con el selector de color o escribiendo el código.
- **Tipografía:** la letra del **texto de la página** (párrafos, menú, botones), con una vista previa. Los **títulos grandes** (el de la portada, Nuestros servicios, Promociones, etc.) siempre usan una letra con serifa elegante (Cormorant Garamond), que no cambia con esta opción.

### Horarios
Tildá si querés **mostrar los horarios de atención** en la página pública (toma los de **Negocio → Horarios**).

### Carrusel de imágenes
Las fotos que rotan en la portada de la página pública.
- **+ Agregar imagen** sube una foto (hasta 10 MB).
- **Arrastrá** para cambiar el orden.
- **Eliminar** quita una foto (pide confirmación).
- Los cambios del carrusel se aplican **al momento**; este popup solo tiene **Listo**.

### Redes sociales
Los enlaces del **pie** de la página pública: Instagram, WhatsApp, Facebook, TikTok, YouTube, X y sitio web.
- Para cada una completás el enlace (o el número, en WhatsApp, con código de país) y tildás **Mostrar**.
- Solo se muestran las redes **tildadas y con enlace**.

---

## 13. La página pública (lo que ve tu cliente)

Es la página que **ve cualquier persona que entre al sitio, aunque no tenga cuenta**: no hace falta ingresar para mirarla. Solo al reservar se pide iniciar sesión. Se abre con **Ir al sitio →** (último ítem del menú) y se vuelve con **← Volver al panel**. De arriba a abajo:
1. **Portada** con tu título, el subtítulo y el carrusel de fotos, y un botón para reservar.
2. **Nuestros servicios:** una fila que **se mueve sola** en círculo. Tocá un servicio y vas **directo a reservarlo** (si no tenés sesión iniciada, primero te pide ingresar y después te devuelve a esa reserva). Los servicios en promo se ven marcados.
3. **Promociones:** tus **promos** (las marcadas "Mostrar en la web") y tus **cupones públicos**. Tocar una lleva directo a reservar con ella.
4. **Sobre nosotros.**
5. **Horarios** (si lo activaste).
6. **Próximos cierres.**
7. **Contacto:** la **dirección del local** (con un link al mapa, si la cargaste en Negocio → General) y las redes.

---

## Preguntas frecuentes

**No aparecen horarios para un servicio. ¿Qué reviso?**
Que haya **al menos un profesional con ese servicio asignado**, que ese profesional **trabaje ese día** (Disponibilidad), que el **negocio esté abierto** (Horarios), que no haya un **cierre** o un **día libre**, que el servicio no esté limitado a otras **fechas**, y que se cumpla la **anticipación mínima** (Política).

**¿Cuál es la diferencia entre una promo y un cupón?**
La **promo** se aplica sola sobre servicios elegidos. El **cupón** lo escribe el cliente con un código. **No se suman**: si un servicio tiene promo, el cupón no se puede usar en ese servicio.

**Cargué un turno por teléfono. ¿Cómo lo hago?**
**Reservar turno** → elegís servicio, fecha y horario → en el último paso, **Para un cliente** u **Otra persona**.

**¿Con qué profesional queda un turno nuevo?**
Con el primer profesional libre que hace ese servicio (el que se cargó primero). Si querés otro, abrí el turno en **Turnos** y usá **Editar**.

**No me llegan los emails de los turnos.**
Revisá, en **Negocio → Política**, que **Enviar notificaciones por email** esté tildado y que tu casilla esté tildada en la lista de administradores (los avisos te llegan al email de tu cuenta). Y recordá el tope de 300 emails por día.

**Un cliente quiere cambiar su turno.**
**Turnos** → buscá al cliente → abrí el turno → **Reprogramar**.

**Quiero dar de baja a un profesional.**
En **Profesionales**, usá **Desactivar**. Su historial queda. Si querés quitarle el acceso al sistema, sacale los roles en **Usuarios y roles**.

**Probé el sistema y quiero empezar de cero.**
**Negocio → Historial → Eliminar historial** borra todos los turnos. Hacelo solo una vez, antes de empezar de verdad: no se puede deshacer.
