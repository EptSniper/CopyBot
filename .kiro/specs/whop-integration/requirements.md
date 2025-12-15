# Requirements Document

## Introduction

This feature integrates Whop payment verification into the CopyBot platform. Hosts (signal providers) can sell access through their Whop store, and subscribers can activate their accounts by entering their Whop license key. The system verifies the purchase with Whop's API and automatically creates/activates the subscriber account.

## Glossary

- **Host**: A signal provider who sells trading signals to subscribers
- **Subscriber**: A customer who pays to receive trading signals
- **Whop**: A payment platform for selling digital products/memberships
- **License Key**: A unique key provided by Whop after purchase
- **CopyBot**: The trade signal distribution system

## Requirements

### Requirement 1

**User Story:** As a host, I want to connect my Whop store to CopyBot, so that my customers can automatically activate their accounts after purchasing.

#### Acceptance Criteria

1. WHEN a host enters their Whop API credentials THEN the system SHALL store them securely and validate the connection
2. WHEN a host saves their Whop product ID THEN the system SHALL associate it with their CopyBot host account
3. WHEN Whop credentials are invalid THEN the system SHALL display a clear error message

### Requirement 2

**User Story:** As a subscriber, I want to enter my Whop license key to activate my account, so that I can start receiving trade signals.

#### Acceptance Criteria

1. WHEN a subscriber enters a valid Whop license key THEN the system SHALL verify it with Whop's API
2. WHEN the license key is valid and active THEN the system SHALL create a subscriber account and provide an API key
3. WHEN the license key is invalid or expired THEN the system SHALL display an appropriate error message
4. WHEN a license key has already been used THEN the system SHALL prevent duplicate activations

### Requirement 3

**User Story:** As a host, I want to see which subscribers activated via Whop, so that I can track my sales.

#### Acceptance Criteria

1. WHEN viewing subscribers THEN the system SHALL indicate which ones activated via Whop
2. WHEN a Whop subscription is cancelled THEN the system SHALL mark the subscriber as inactive

### Requirement 4

**User Story:** As a subscriber, I want a simple activation page, so that I can quickly get my API key after purchasing.

#### Acceptance Criteria

1. WHEN visiting the activation page THEN the system SHALL display a form to enter the license key
2. WHEN activation succeeds THEN the system SHALL display the subscriber API key and setup instructions
3. WHEN activation fails THEN the system SHALL provide clear next steps (contact host, check key, etc.)
