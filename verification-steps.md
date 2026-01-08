# Verification Steps for Angular Frontend API Call

## Overview
This document outlines the steps to verify that the Angular frontend can successfully call the GET `/api/notifications/preferences/by-user-id?userId=7` endpoint.

## Prerequisites
1. ✅ Angular development server is running on http://localhost:4200
2. ⚠️ Backend server should be running on http://localhost:8095
3. ⚠️ User should be logged in with a valid JWT token

## Test Methods

### Method 1: Using the Angular Application
1. **Navigate to the application**: Open http://localhost:4200 in your browser
2. **Log in**: Use valid credentials to get a JWT token
3. **Navigate to notification preferences**: Go to http://localhost:4200/notification-preferences
4. **Click the "Test API" button**: This will trigger the enhanced test method
5. **Check browser console**: Open Developer Tools (F12) and check the Console tab for detailed logs

### Method 2: Using Browser Console (Manual Testing)
1. **Open the Angular app**: Navigate to http://localhost:4200
2. **Open Developer Tools**: Press F12
3. **Load the test script**: Copy and paste the content of `api-test-script.js` into the console
4. **Run tests**: Execute `runAllTests()` in the console

### Method 3: Direct API Testing (Without Authentication)
1. **Open the test HTML file**: Open `test-api-call.html` in your browser
2. **Click "Test API Call"**: This will test the endpoint without authentication
3. **Check results**: View the response in the page

## Expected Results

### Successful Response Structure
```json
{
  "success": true,
  "data": {
    "id": 7,
    "notifications": true,
    "email": true,
    "push": true,
    "mealRemindersEnabled": true,
    "breakfastTime": "08:00",
    "lunchTime": "12:30",
    "dinnerTime": "19:00",
    "snackRemindersEnabled": false,
    "morningSnackTime": "10:00",
    "afternoonSnackTime": "16:00",
    "workoutRemindersEnabled": true,
    "defaultWorkoutTime": "18:00",
    "motivationalMessagesEnabled": true,
    "motivationalFrequency": 3,
    "activeDays": ["MONDAY", "TUESDAY", "WEDNESDAY", "THURSDAY", "FRIDAY"],
    "quietTimeEnabled": true,
    "quietTimeStart": "22:00",
    "quietTimeEnd": "07:00",
    "maxNotificationsPerDay": 10,
    "hydrationRemindersEnabled": true,
    "hydrationIntervalMinutes": 120,
    "weatherBasedSuggestionsEnabled": true,
    "timezoneAdaptationEnabled": true
  }
}
```

### Common Error Scenarios

#### 1. Backend Not Running (Network Error)
- **Status**: Network error
- **Message**: "fetch" error or "Network request failed"
- **Solution**: Start the backend server on http://localhost:8095

#### 2. Authentication Required (401 Unauthorized)
- **Status**: 401
- **Message**: "Unauthorized" or "JWT token required"
- **Solution**: Log in to get a valid JWT token

#### 3. User Not Found (404 Not Found)
- **Status**: 404
- **Message**: "User not found" or "Preferences not found"
- **Solution**: Ensure user with ID 7 exists in the database

#### 4. Server Error (500 Internal Server Error)
- **Status**: 500
- **Message**: Various server error messages
- **Solution**: Check backend logs for detailed error information

## Debugging Information

### JWT Token Inspection
The test methods will automatically:
1. Check if JWT token exists in localStorage
2. Decode and display token payload
3. Extract user ID from token
4. Validate token format

### API Request Details
The test will log:
1. Request URL
2. Request headers (including Authorization)
3. Response status
4. Response headers
5. Response body

### Response Validation
The test will verify:
1. Response structure matches expected format
2. All required fields are present
3. Field types are correct
4. Data values are reasonable

## Files Created for Testing
1. `test-api-call.html` - Simple HTML test page
2. `api-test-script.js` - Comprehensive JavaScript test suite
3. `verification-steps.md` - This documentation
4. Enhanced `testApiCall()` method in NotificationPreferencesComponent

## Next Steps
1. Run the tests using one of the methods above
2. Check the results and console logs
3. If errors occur, follow the troubleshooting guidance
4. Verify that the backend API is properly configured and running
5. Ensure the database contains test data for user ID 7

## Notes
- The notification preferences component has been enhanced with a "Test API" button
- The test methods provide detailed logging for debugging
- The API endpoint expects a valid JWT token for authentication
- The response should follow the ApiResponse<NotificationPreferences> format