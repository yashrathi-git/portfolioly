# Implementation Plan - Simplified (Username Generation on Signup)

## Goal

Add automatic username generation when users sign up. Keep login flow unchanged.

- [ ] 1. Create username generation utility in backend

  - [ ] 1.1 Create username generation function in `backend/app/services/user_settings_service.py`
    - Add generate_username_from_email method
    - Extract email prefix, sanitize, add 4 random digits
    - Check uniqueness against user_settings collection
    - Retry up to 5 times if collision
    - Return unique username
    - _Requirements: 2.1, 2.2, 2.3, 2.4, 2.5, 2.6_
  - [ ]\* 1.2 Write unit tests for username generation
    - Test with various email formats
    - Test uniqueness validation
    - Test collision retry logic
    - Test sanitization
    - _Requirements: 2.1, 2.2, 2.3, 2.4, 2.5, 2.6_

- [ ] 2. Add signup webhook/listener to generate username

  - [ ] 2.1 Create Firebase Auth trigger or backend endpoint
    - Option A: Firebase Cloud Function on user creation
    - Option B: Backend endpoint called after frontend signup
    - Generate username using utility from task 1
    - Create user_settings document with username
    - Handle errors gracefully
    - _Requirements: 2.1, 2.2, 2.3, 2.4, 2.5, 2.6_
  - [ ] 2.2 Update frontend signup flow if using Option B
    - After successful Firebase signup, call backend endpoint
    - Pass user ID and email to backend
    - Backend generates and stores username
    - Continue with existing verification email flow
    - _Requirements: 2.1, 2.2, 2.3, 2.4, 2.5, 2.6, 8.1, 8.2_

- [ ] 3. Test username generation

  - [ ] 3.1 Test complete signup flow
    - Create new account via UI
    - Verify username is generated and stored in user_settings
    - Check username format (emailprefix + 4 digits)
    - Verify uniqueness across multiple signups
    - _Requirements: 2.1, 2.2, 2.3, 2.4, 2.5, 2.6_
  - [ ] 3.2 Test edge cases
    - Signup with same email prefix multiple times
    - Verify different random suffixes generated
    - Test with special characters in email
    - Test with very short/long email prefixes
    - _Requirements: 2.1, 2.2, 2.3, 2.4, 2.5, 2.6_

- [ ] 4. Optional: Backfill existing users
  - [ ] 4.1 Create migration script
    - Query all users without username in user_settings
    - Generate username for each user
    - Update user_settings documents
    - Log results and any failures
    - _Requirements: 2.1, 2.2, 2.3, 2.4, 2.5, 2.6_

## Notes

- **Login flow**: Keep completely unchanged (Firebase handles it)
- **Verification emails**: Keep unchanged (Firebase Client SDK handles it)
- **Rate limiting**: Use Firebase's built-in protection + consider reCAPTCHA
- **Focus**: Only add username generation on signup
- **Simplicity**: Minimal changes to existing code
