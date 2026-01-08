# Implementation Plan: Activity Backend Integration Fix

## Overview

This implementation plan addresses the mismatch between Angular frontend and backend API for physical activities. The tasks focus on updating models, services, and components to align with the backend schema and eliminate SQL errors.

## Tasks

- [x] 1. Update activity data models
  - Update ActivitePhysique interface to match backend schema exactly
  - Remove obsolete fields (date, duree, type) and add required fields (dateActivite, caloriesBrulees, notes, utilisateur)
  - Add proper TypeScript typing for intensite field with union type
  - _Requirements: 1.1, 1.2, 1.3, 1.4, 1.5_

- [ ]* 1.1 Write property test for model field compliance
  - **Property 1: Model field compliance**
  - **Validates: Requirements 1.1, 1.2**

- [ ]* 1.2 Write property test for intensity validation
  - **Property 2: Intensity value restriction**
  - **Validates: Requirements 1.3, 4.3**

- [x] 2. Implement calorie calculation logic
  - Create calorie calculation function based on activity type, duration, and intensity
  - Add calorie rates mapping for different activities and intensity levels
  - Integrate calculation into activity creation flow
  - _Requirements: 3.2_

- [ ]* 2.1 Write property test for calorie calculation
  - **Property 7: Calorie calculation consistency**
  - **Validates: Requirements 3.2**

- [x] 3. Update ActiviteService for backend compatibility
  - Modify creerActivite method to send only backend-compatible fields
  - Add user ID extraction from JWT token and include in utilisateur field
  - Update request payload structure to match backend expectations
  - Ensure proper Content-Type headers are set
  - _Requirements: 2.1, 2.2, 2.3, 2.4_

- [ ]* 3.1 Write property test for request payload compliance
  - **Property 5: Request payload compliance**
  - **Validates: Requirements 2.1, 2.4, 3.3**

- [ ]* 3.2 Write unit test for API endpoint usage
  - Test that POST request is made to correct URL
  - **Validates: Requirements 2.2**

- [x] 4. Enhance error handling in ActiviteService
  - Implement comprehensive error handling for different HTTP status codes
  - Add specific error messages for 400, 401, 500, and network errors
  - Add detailed error logging for debugging purposes
  - _Requirements: 2.5, 5.1, 5.2, 5.3, 5.4, 5.5_

- [ ]* 4.1 Write property test for error response handling
  - **Property 9: Error response handling**
  - **Validates: Requirements 2.5, 3.5, 5.5**

- [ ]* 4.2 Write unit tests for specific error messages
  - Test 400, 401, 500, and network error message display
  - **Validates: Requirements 5.1, 5.2, 5.3, 5.4**

- [x] 5. Update SuiviComponent for proper data handling
  - Modify enregistrerActivite method to use correct field names
  - Integrate calorie calculation before sending request
  - Update form data collection to match backend schema
  - Add client-side validation for required fields
  - _Requirements: 3.1, 3.3, 4.1, 4.2, 4.4, 4.5_

- [ ]* 5.1 Write property test for input validation
  - **Property 8: Input validation compliance**
  - **Validates: Requirements 4.1, 4.2, 4.5**

- [ ]* 5.2 Write property test for date format validation
  - **Property 3: Date format compliance**
  - **Validates: Requirements 1.4, 4.4**

- [x] 6. Improve user feedback and UI updates
  - Update success message display after activity creation
  - Implement automatic data refresh after successful operations
  - Enhance error message display with user-friendly messages
  - _Requirements: 3.4, 3.5_

- [ ]* 6.1 Write property test for success flow completion
  - **Property 10: Success flow completion**
  - **Validates: Requirements 3.4**

- [x] 7. Checkpoint - Test basic functionality
  - Ensure all tests pass, ask the user if questions arise.

- [x] 8. Add comprehensive form validation
  - Implement validation for activity type (non-empty string)
  - Add validation for duration and calories (positive numbers)
  - Validate intensity against allowed values
  - Validate date format before submission
  - _Requirements: 4.1, 4.2, 4.3, 4.4, 4.5_

- [ ]* 8.1 Write property test for user object structure
  - **Property 4: User object structure**
  - **Validates: Requirements 1.5**

- [ ]* 8.2 Write property test for HTTP headers compliance
  - **Property 6: HTTP headers compliance**
  - **Validates: Requirements 2.3**

- [x] 9. Integration testing and validation
  - Test complete flow with valid activity data
  - Verify JWT token inclusion in requests
  - Test error scenarios with invalid data
  - Validate that activities are created, displayed, and can be deleted
  - _Requirements: 6.1, 6.2, 6.3, 6.4, 6.5_

- [ ]* 9.1 Write integration tests for complete CRUD flow
  - Test create, read, and delete operations
  - **Validates: Requirements 6.5**

- [ ]* 9.2 Write unit tests for authentication handling
  - Test JWT token inclusion in requests
  - **Validates: Requirements 6.4**

- [x] 10. Final checkpoint and documentation
  - Ensure all tests pass, ask the user if questions arise.
  - Verify that the exact backend payload format is used
  - Test with the recommended payload structure from the requirements

## Notes

- Tasks marked with `*` are optional and can be skipped for faster MVP
- Each task references specific requirements for traceability
- Checkpoints ensure incremental validation
- Property tests validate universal correctness properties
- Unit tests validate specific examples and edge cases
- The implementation focuses on exact backend compatibility to eliminate SQL errors