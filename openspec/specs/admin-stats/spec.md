# admin-stats

## Purpose
La admin ve cuántos servicios hizo cada profesional, el ingreso bruto por mes y los clientes más fieles, con gráficos.

## Requirements

### Requirement: Qué cuenta
Las estadísticas SHALL contar solo turnos ya realizados: confirmados o completados cuya hora de inicio ya pasó. Los cancelados y los próximos no suman.

### Requirement: Ingreso bruto
El ingreso SHALL sumar el precio cobrado (con descuentos de cupón). Los turnos anteriores a que se guardara el precio usan el precio actual del servicio.

### Requirement: Período
La pantalla SHALL permitir ver "Este mes", "3 meses", "Este año" y "Todo". El gráfico de ingresos por mes muestra siempre los últimos 12 meses.

### Requirement: Contenido
La pantalla SHALL mostrar servicios, ingresos brutos y clientes del período; ingresos por mes; servicios por profesional; y los 10 clientes con más visitas.

### Requirement: Solo admin
`admin_get_stats` SHALL rechazar a quien no sea administrador.
