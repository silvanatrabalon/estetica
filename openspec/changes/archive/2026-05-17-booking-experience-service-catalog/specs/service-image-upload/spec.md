## ADDED Requirements

### Requirement: Admin Service Image Upload
The system SHALL allow admins to upload a service image via file picker in the service create/edit form. The image SHALL be stored in the `media` Supabase Storage bucket under the path `services/{serviceId}.{ext}`. The resulting public URL SHALL be saved in `services.image_url`. The free-text `image_url` input is removed.

#### Scenario: Admin uploads an image for a new service (edit after create)
- **WHEN** an admin creates a service and then opens it to edit
- **THEN** a file input labeled (e.g., "Subir imagen") is displayed; selecting a file uploads it to Storage and populates `image_url` with the public URL

#### Scenario: Admin uploads an image for an existing service
- **WHEN** an admin opens an existing service for editing and selects an image file
- **THEN** the file is uploaded to `services/{serviceId}.{ext}` (overwriting any existing object) and `image_url` is updated

#### Scenario: Admin replaces an existing service image
- **WHEN** an admin uploads a new image to a service that already has one
- **THEN** the previous Storage object is overwritten and `image_url` is updated to the new public URL

#### Scenario: Admin removes a service image
- **WHEN** an admin clicks the "Eliminar imagen" action on a service that has an image
- **THEN** the Storage object at `services/{serviceId}.{ext}` is deleted and `image_url` is set to null

#### Scenario: Upload shows a thumbnail preview
- **WHEN** an admin selects an image file or a service already has an image
- **THEN** a thumbnail preview of the current image is shown in the form

#### Scenario: Upload progress is visible
- **WHEN** an admin selects an image file and upload is in progress
- **THEN** the upload button or area shows a loading indicator; the form cannot be submitted while uploading

#### Scenario: Upload error shows Spanish error message
- **WHEN** an image upload to Supabase Storage fails
- **THEN** the system displays a Spanish error message and the previous `image_url` value is preserved

#### Scenario: Non-admin cannot upload service images
- **WHEN** a non-admin authenticated user attempts to call `uploadMediaFile()` targeting the `services/` path
- **THEN** Supabase Storage RLS rejects the request with an authorization error
