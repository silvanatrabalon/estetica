## ADDED Requirements

### Requirement: Business Notification Email Configuration
The system MUST allow admins to configure an optional notification email address for the business, which is used as the destination for admin copies of transactional appointment emails.

#### Scenario: Admin saves a valid notification email
- **WHEN** an authenticated admin submits a valid email address in the notification email field
- **THEN** the system persists the value in `organizations.notification_email` via `admin_update_business_settings` and returns it in subsequent `get_business_settings` calls

#### Scenario: Admin clears the notification email
- **WHEN** an authenticated admin submits an empty value for the notification email field
- **THEN** the system sets `organizations.notification_email` to null and no admin copy is sent for future notification events

#### Scenario: Admin submits an invalid email format
- **WHEN** an authenticated admin submits a value that is not a valid email format
- **THEN** the system rejects the update with a Spanish validation message and preserves the previously stored value

#### Scenario: Notification email field is absent on existing organizations
- **WHEN** `get_business_settings` is called for an organization that existed before this migration
- **THEN** the RPC returns `notification_email: null` without error, and the form field renders empty
