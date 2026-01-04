# Implementation Plan: Messaging Interface Fix

## Overview

This implementation plan addresses the critical UX issue where users cannot start conversations when they have zero existing conversations. We'll add conversation creation functionality, contact selection, and enhanced empty states.

## Tasks

- [ ] 1. Create Contact Selection Infrastructure
  - Create ContactDTO interface and related models
  - Implement contact discovery service methods
  - Set up mock contact data for demo mode
  - _Requirements: 2.1, 2.2, 6.2_

- [ ] 2. Build Contact Selection Modal Component
  - [ ] 2.1 Create ContactSelectionModal component structure
    - Design modal layout with search and contact list
    - Implement contact search functionality with debouncing
    - Add contact item display with role badges and online status
    - _Requirements: 1.2, 1.5, 2.1_

  - [ ]* 2.2 Write property test for contact search
    - **Property 5: Contact search functionality**
    - **Validates: Requirements 1.5**

  - [ ] 2.3 Implement contact selection and conversation creation
    - Handle contact selection and modal closing
    - Integrate with EnhancedMessagingService for conversation creation
    - Add error handling for failed conversation creation
    - _Requirements: 1.3, 1.4_

  - [ ]* 2.4 Write unit tests for modal functionality
    - Test modal open/close behavior
    - Test contact filtering and search
    - Test error handling scenarios
    - _Requirements: 1.2, 1.5_

- [ ] 3. Enhance Empty State Interface
  - [ ] 3.1 Update empty conversations display
    - Add prominent "Nouvelle conversation" button
    - Enhance instructions with clear call-to-action
    - Improve visual design and user guidance
    - _Requirements: 3.1, 3.2, 3.3_

  - [ ]* 3.2 Write property test for empty state guidance
    - **Property 4: Empty state guidance**
    - **Validates: Requirements 3.1, 3.2**

  - [ ] 3.3 Implement new conversation button functionality
    - Connect button to contact selection modal
    - Add loading states and user feedback
    - Handle demo mode vs. live mode differences
    - _Requirements: 1.1, 3.4_

- [ ] 4. Extend EnhancedMessagingService
  - [ ] 4.1 Add contact discovery methods
    - Implement loadAvailableContacts() method
    - Add contact search functionality
    - Integrate with friends and coach APIs
    - _Requirements: 2.1, 5.1, 5.2_

  - [ ] 4.2 Implement conversation creation
    - Add createConversation() method with proper error handling
    - Handle optimistic UI updates
    - Implement WebSocket integration for real-time creation
    - _Requirements: 1.3, 1.4, 4.3_

  - [ ]* 4.3 Write property test for conversation creation
    - **Property 3: Conversation creation consistency**
    - **Validates: Requirements 1.3, 1.4**

- [ ] 5. Update MessagingContainer Component
  - [ ] 5.1 Integrate contact selection modal
    - Add modal state management
    - Implement contact loading and caching
    - Connect modal events to conversation creation
    - _Requirements: 1.1, 1.2, 1.3_

  - [ ]* 5.2 Write property test for new conversation button
    - **Property 1: New conversation button visibility**
    - **Validates: Requirements 1.1**

  - [ ] 5.3 Enhance conversation creation flow
    - Implement immediate conversation opening after creation
    - Add message input focus and user guidance
    - Handle keyboard shortcuts and accessibility
    - _Requirements: 4.1, 4.2, 4.4_

- [ ] 6. Add Social Integration Features
  - [ ] 6.1 Integrate with friend system
    - Show friends as priority contacts
    - Add "Message" buttons to friend profiles
    - Sync conversation creation with social features
    - _Requirements: 5.1, 5.3, 5.4_

  - [ ] 6.2 Implement coach contact prioritization
    - Show assigned coaches prominently
    - Add coach-specific contact categories
    - Handle coach availability status
    - _Requirements: 5.2_

  - [ ]* 6.3 Write property test for integration consistency
    - **Property 6: Integration consistency**
    - **Validates: Requirements 5.5**

- [ ] 7. Enhance Mock Data and Demo Mode
  - [ ] 7.1 Create comprehensive mock contact data
    - Add realistic coach and client profiles
    - Include online/offline status simulation
    - Add friend relationship indicators
    - _Requirements: 6.1, 6.2_

  - [ ] 7.2 Implement demo conversation creation
    - Simulate realistic conversation creation flow
    - Add auto-responses from mock contacts
    - Provide clear demo mode indicators
    - _Requirements: 6.3, 6.4, 6.5_

- [ ]* 7.3 Write property test for contact completeness
  - **Property 2: Contact selection completeness**
  - **Validates: Requirements 2.1, 2.4**

- [ ] 8. Checkpoint - Ensure all tests pass
  - Ensure all tests pass, ask the user if questions arise.

- [ ] 9. Add Advanced Features and Polish
  - [ ] 9.1 Implement contact search optimization
    - Add debounced search with loading indicators
    - Implement contact caching and pagination
    - Add keyboard navigation for contact list
    - _Requirements: 1.5, 2.1_

  - [ ] 9.2 Enhance accessibility and mobile support
    - Add proper ARIA labels and focus management
    - Implement responsive design for mobile devices
    - Add keyboard shortcuts and screen reader support
    - _Requirements: 4.4_

  - [ ]* 9.3 Write integration tests
    - Test end-to-end conversation creation flow
    - Test cross-component communication
    - Test real-time updates and synchronization
    - _Requirements: All_

- [ ] 10. Final checkpoint - Ensure all tests pass
  - Ensure all tests pass, ask the user if questions arise.

## Notes

- Tasks marked with `*` are optional and can be skipped for faster MVP
- Each task references specific requirements for traceability
- Checkpoints ensure incremental validation
- Property tests validate universal correctness properties
- Unit tests validate specific examples and edge cases