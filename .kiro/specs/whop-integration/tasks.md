# Implementation Plan

- [ ] 1. Database migration for Whop integration
  - Add `whop_api_key`, `whop_product_id`, `slug` columns to hosts table
  - Add `whop_license_key`, `whop_membership_id`, `activated_via` columns to subscribers table
  - Add unique constraint on `slug` and `whop_license_key`
  - _Requirements: 1.1, 1.2, 3.1_

- [ ] 2. Create Whop API client
  - [ ] 2.1 Implement Whop API helper functions
    - Create `backend/pg/lib/whop.js` with functions to verify license keys
    - Handle API authentication and error responses
    - _Requirements: 2.1_

- [ ] 3. Host Whop settings endpoint
  - [ ] 3.1 Add `PATCH /host/whop-settings` route
    - Validate and save Whop API key and product ID
    - Generate unique slug for host if not exists
    - _Requirements: 1.1, 1.2, 1.3_

- [ ] 4. License activation endpoint
  - [ ] 4.1 Add `POST /activate/:slug` public route
    - Look up host by slug
    - Verify license key with Whop API
    - Check for duplicate activation
    - Create subscriber account
    - Return API key and instructions
    - _Requirements: 2.1, 2.2, 2.3, 2.4_

- [ ]* 4.2 Write property test for duplicate key rejection
  - **Property 3: Duplicate license keys are rejected**
  - **Validates: Requirements 2.4**

- [ ] 5. Whop webhook handler
  - [ ] 5.1 Add `POST /whop/webhook` route
    - Verify webhook signature
    - Handle `membership.went_invalid` and `membership.cancelled` events
    - Deactivate corresponding subscriber
    - _Requirements: 3.2_

- [ ] 6. Update Settings page UI
  - [ ] 6.1 Add Whop integration section to Settings page
    - Form for Whop API key and product ID
    - Display host's activation URL
    - _Requirements: 1.1, 1.2_

- [ ] 7. Create Activate page
  - [ ] 7.1 Create `/activate/:slug` page component
    - Form to enter license key and name
    - Display success with API key and instructions
    - Display errors with helpful messages
    - _Requirements: 4.1, 4.2, 4.3_

- [ ] 8. Update Subscribers list
  - [ ] 8.1 Show activation source in subscribers table
    - Add "Source" column showing "Whop" or "Manual" or "Invite"
    - _Requirements: 3.1_

- [ ] 9. Checkpoint - Ensure all tests pass
  - Ensure all tests pass, ask the user if questions arise.
