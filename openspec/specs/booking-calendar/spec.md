# booking-calendar

## Purpose
La clienta elige el día en un calendario que solo deja tocar los días con horarios libres y muestra cuán ocupado está cada uno.

## Requirements

### Requirement: Días con horarios libres
`get_available_days(p_service_id, p_from, p_to)` SHALL devolver los días del rango (máximo 92 días) con al menos un horario libre y la cantidad de horarios, usando las mismas reglas que `get_available_slots`. Los días sin horarios no se devuelven. Un rango mayor falla con `RANGE_TOO_LARGE`; un rango invertido devuelve vacío.

### Requirement: Solo se eligen los días disponibles
El calendario SHALL mostrar un mes (semanas desde el lunes). Los días con horarios libres son botones; los demás (por ejemplo los domingos, días libres, completos o fuera de la ventana de reserva) se ven apagados y no se pueden tocar.

### Requirement: Referencias
Cada día disponible SHALL indicar cuántos horarios libres tiene (en su nombre accesible, con singular y plural) y un color: verde con 5 o más, ámbar con 1 a 4. Una leyenda explica "Varios horarios libres", "Pocos horarios libres" y "Sin disponibilidad".

### Requirement: Navegación acotada
El calendario SHALL empezar en el mes actual y permitir avanzar solo hasta el último mes de la ventana de reserva (`booking_max_horizon_days`); no se puede ir antes del mes actual. Si un mes no tiene días disponibles lo dice y sugiere el siguiente.

### Requirement: Errores
Si no se pueden cargar los días, se muestra "No pudimos cargar los días disponibles".
