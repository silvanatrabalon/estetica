## 1. Capacity default

- [x] 1.1 Set the create-form default for `maxConcurrentBookings` to `'1'` in `AdminServicesPage`
- [x] 1.2 Keep edit mode loading the stored value (empty when `null`)
- [x] 1.3 Test: create form shows `1`; untouched save sends `1`
- [x] 1.4 Test: cleared field sends `null` (edge case)
- [x] 1.5 Test: editing keeps stored capacity, including `null` (edge case)
- [x] 1.6 Update the existing create-service test to expect `1`
