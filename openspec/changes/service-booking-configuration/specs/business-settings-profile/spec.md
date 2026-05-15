## ADDED Requirements

### Requirement: Global Booking Policy Configuration In Business Settings
The system MUST expose a "Configuración de reservas" section in the Business Settings admin page where admins can configure the global booking policy: minimum advance notice and maximum booking horizon.

#### Scenario: Admin opens Business Settings and sees booking policy section
- **WHEN** an authenticated admin navigates to the Business Settings page
- **THEN** the system renders a "Configuración de reservas" section with the current values of booking_min_notice_minutes and booking_max_horizon_days

#### Scenario: Admin saves valid booking policy
- **WHEN** an authenticated admin submits valid values for minimum notice (0–10080 minutes) and maximum horizon (1–365 days)
- **THEN** the system persists both values on the organization record and shows a Spanish success message

#### Scenario: Min notice value out of range is rejected
- **WHEN** an admin submits booking_min_notice_minutes below 0 or above 10080
- **THEN** the system rejects the submission and shows a Spanish validation message

#### Scenario: Horizon value out of range is rejected
- **WHEN** an admin submits booking_max_horizon_days below 1 or above 365
- **THEN** the system rejects the submission and shows a Spanish validation message

#### Scenario: Default booking policy is loaded after migration
- **WHEN** the organization record is loaded in Business Settings after the booking configuration migration
- **THEN** booking_min_notice_minutes is 60 and booking_max_horizon_days is 60 unless previously changed
