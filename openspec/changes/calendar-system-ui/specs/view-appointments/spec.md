## MODIFIED Requirements

### Requirement: Customer can view their appointments at /appointments
The system SHALL provide an `AppointmentsPage` at `/appointments`, accessible only to users with the `customer` role (enforced by RoleGuard). The page MUST display two tabs — **Próximos** (upcoming: `pending`/`confirmed` with `starts_at > now()`) and **Historial** (past + `cancelled`/`completed`/`no_show`) — and support a Lista ↔ Calendario view toggle. All user-facing copy MUST be in Spanish. Each appointment card in the **Próximos** tab MUST display a "Reprogramar" CTA for appointments with status `pending` or `confirmed` that navigates to `/appointments/:id/reschedule`. Each appointment card in the **Próximos** tab MUST display a "Cancelar" button for appointments with status `pending` or `confirmed` that opens an inline confirmation dialog. In the Calendario view, the weekly calendar MUST use the organization's timezone to determine which calendar day each appointment belongs to (not the raw UTC date). In the Calendario view, the customer MAY drag `pending` or `confirmed` appointments to a different day to reschedule via the slot picker modal.

#### Scenario: Page loads customer appointments on mount
- **WHEN** a customer navigates to `/appointments`
- **THEN** the page calls `list_appointments()` and shows a loading state while fetching

#### Scenario: Próximos tab shows upcoming confirmed/pending appointments
- **WHEN** the customer is on the Próximos tab
- **THEN** only appointments with `status IN ('pending', 'confirmed')` and `starts_at > now()` are shown

#### Scenario: Historial tab shows past and terminal-status appointments
- **WHEN** the customer switches to the Historial tab
- **THEN** appointments that are past or have status `cancelled`, `completed`, or `no_show` are shown

#### Scenario: Empty state shown per tab in Spanish
- **WHEN** the active tab has no appointments
- **THEN** a Spanish empty-state message is displayed (e.g., "No tenés turnos próximos" for Próximos tab)

#### Scenario: Error state shown in Spanish
- **WHEN** the `list_appointments()` call fails
- **THEN** a Spanish error message is displayed (e.g., "Ocurrió un error al cargar tus turnos.")

#### Scenario: Loading state shown in Spanish
- **WHEN** appointments are being fetched
- **THEN** a loading indicator is shown with Spanish copy

#### Scenario: Calendar view places appointment on correct local day
- **WHEN** the customer switches to Calendario view and an appointment has `startsAt` near midnight UTC
- **THEN** the appointment appears on the correct local calendar day in the org timezone (not the UTC date)

#### Scenario: Customer can drag appointment in weekly calendar to reschedule
- **WHEN** a customer drags a `pending` or `confirmed` appointment to a different day in the weekly calendar
- **THEN** the slot picker modal opens for the new date
