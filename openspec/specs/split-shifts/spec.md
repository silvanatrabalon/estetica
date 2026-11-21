# split-shifts

## Purpose
El negocio elige cómo trabaja: jornada corrida o dos turnos (matutino y vespertino con un corte). La elección se refleja en horarios del negocio, en la disponibilidad de cada profesional y en sus días especiales.

## Requirements

### Requirement: Forma de trabajo del negocio
`organizations.split_shifts` SHALL indicar si el negocio trabaja en dos turnos (por defecto: jornada corrida). Se cambia desde Negocio > Horarios ("Jornada corrida" / "Dos turnos").

#### Scenario: Pasar a dos turnos
- **WHEN** la admin elige "Dos turnos"
- **THEN** cada día muestra "Turno matutino" y "Turno vespertino", cada uno opcional

#### Scenario: Volver a jornada corrida
- **WHEN** la admin elige "Jornada corrida"
- **THEN** pide confirmación y, al aceptar, cada día (horarios del negocio, de los profesionales y días especiales) pasa a un solo tramo: del primer inicio al último fin

### Requirement: Turnos por día
Un día SHALL tener hasta dos turnos. Puede tener solo el matutino, solo el vespertino o ambos; al menos uno si el día está abierto/trabaja. Cada turno exige inicio anterior al fin y el vespertino no puede empezar antes de que termine el matutino.

### Requirement: Días especiales con turnos
Un día especial de horario especial SHALL admitir los mismos turnos (solo matutino, solo vespertino o ambos).

### Requirement: Horarios libres
`get_available_slots` SHALL ofrecer turnos solo dentro de la intersección de una franja del profesional y una franja del negocio. El corte entre turnos no ofrece horarios.

### Requirement: Reserva respeta horarios
`create_appointment` SHALL asignar únicamente a un profesional que trabaje en ese horario (turno completo dentro de una de sus franjas) y rechazar con `BOOKING_NO_STAFF_AVAILABLE` si el negocio está cerrado a esa hora.

### Requirement: Límite por recurso compartido
El límite simultáneo del servicio SHALL ser opcional y vacío por defecto: la capacidad sale de las agendas de los profesionales. Se completa solo si hay un recurso compartido.
