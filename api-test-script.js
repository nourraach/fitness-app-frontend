// Test script to verify Angular frontend can call the notification preferences API
// Run this in the browser console when the Angular app is loaded

console.log('🧪 Starting API Test for Notification Preferences');

// Function to test the API call
async function testNotificationPreferencesAPI() {
    console.log('🔍 Testing GET /api/notifications/preferences/by-user-id?userId=7');
    
    try {
        // First, let's check if we have a JWT token
        const token = localStorage.getItem('jwt');
        console.log('🔐 JWT Token found:', token ? 'Yes' : 'No');
        
        if (token) {
            console.log('🔍 Token preview:', token.substring(0, 50) + '...');
            
            // Try to decode the token to see the user ID
            try {
                const payload = JSON.parse(atob(token.split('.')[1]));
                console.log('🔍 Token payload:', payload);
                console.log('🔍 User ID in token:', payload.userId || payload.id || payload.sub);
            } catch (e) {
                console.error('❌ Error decoding token:', e);
            }
        }
        
        // Test the API call
        const headers = {
            'Content-Type': 'application/json'
        };
        
        if (token) {
            headers['Authorization'] = `Bearer ${token}`;
        }
        
        console.log('📡 Making API request...');
        const response = await fetch('http://localhost:8095/api/notifications/preferences/by-user-id?userId=7', {
            method: 'GET',
            headers: headers
        });
        
        console.log('📊 Response status:', response.status);
        console.log('📊 Response headers:', Object.fromEntries(response.headers.entries()));
        
        if (response.ok) {
            const data = await response.json();
            console.log('✅ API call successful!');
            console.log('📦 Response data:', data);
            
            // Validate the response structure
            if (data.success && data.data) {
                console.log('✅ Response structure is valid');
                console.log('📋 Notification preferences:', data.data);
                
                // Check if all expected fields are present
                const expectedFields = [
                    'notifications', 'email', 'push', 'mealRemindersEnabled',
                    'breakfastTime', 'lunchTime', 'dinnerTime', 'workoutRemindersEnabled',
                    'defaultWorkoutTime', 'motivationalMessagesEnabled', 'activeDays'
                ];
                
                const missingFields = expectedFields.filter(field => !(field in data.data));
                if (missingFields.length === 0) {
                    console.log('✅ All expected fields are present');
                } else {
                    console.log('⚠️ Missing fields:', missingFields);
                }
                
                return { success: true, data: data.data };
            } else {
                console.log('⚠️ Unexpected response structure:', data);
                return { success: false, error: 'Unexpected response structure' };
            }
        } else {
            const errorText = await response.text();
            console.error('❌ API call failed');
            console.error('📊 Status:', response.status);
            console.error('📊 Error:', errorText);
            
            // Common error interpretations
            if (response.status === 401) {
                console.error('🔐 Authentication error - JWT token may be invalid or expired');
            } else if (response.status === 404) {
                console.error('🔍 Endpoint not found - check if backend is running');
            } else if (response.status === 500) {
                console.error('💥 Server error - check backend logs');
            }
            
            return { success: false, error: errorText, status: response.status };
        }
        
    } catch (error) {
        console.error('❌ Network error:', error);
        
        if (error.name === 'TypeError' && error.message.includes('fetch')) {
            console.error('🌐 Network error - check if backend server is running on http://localhost:8095');
        }
        
        return { success: false, error: error.message };
    }
}

// Function to test with different user IDs
async function testWithDifferentUserIds() {
    const userIds = [1, 2, 3, 7, 10];
    
    for (const userId of userIds) {
        console.log(`\n🧪 Testing with userId=${userId}`);
        
        try {
            const token = localStorage.getItem('jwt');
            const headers = {
                'Content-Type': 'application/json'
            };
            
            if (token) {
                headers['Authorization'] = `Bearer ${token}`;
            }
            
            const response = await fetch(`http://localhost:8095/api/notifications/preferences/by-user-id?userId=${userId}`, {
                method: 'GET',
                headers: headers
            });
            
            console.log(`📊 userId=${userId} - Status: ${response.status}`);
            
            if (response.ok) {
                const data = await response.json();
                console.log(`✅ userId=${userId} - Success:`, data.success);
            } else {
                const errorText = await response.text();
                console.log(`❌ userId=${userId} - Error:`, errorText);
            }
        } catch (error) {
            console.log(`❌ userId=${userId} - Network error:`, error.message);
        }
        
        // Small delay between requests
        await new Promise(resolve => setTimeout(resolve, 100));
    }
}

// Function to check backend connectivity
async function checkBackendConnectivity() {
    console.log('🔍 Checking backend connectivity...');
    
    try {
        const response = await fetch('http://localhost:8095/actuator/health', {
            method: 'GET'
        });
        
        if (response.ok) {
            const data = await response.json();
            console.log('✅ Backend is reachable');
            console.log('📊 Health status:', data);
        } else {
            console.log('⚠️ Backend responded but not healthy:', response.status);
        }
    } catch (error) {
        console.error('❌ Backend not reachable:', error.message);
        console.log('💡 Make sure the backend server is running on http://localhost:8095');
    }
}

// Main test function
async function runAllTests() {
    console.log('🚀 Running comprehensive API tests...\n');
    
    // 1. Check backend connectivity
    await checkBackendConnectivity();
    
    console.log('\n' + '='.repeat(50));
    
    // 2. Test the main API call
    const result = await testNotificationPreferencesAPI();
    
    console.log('\n' + '='.repeat(50));
    
    // 3. Test with different user IDs (if main test was successful)
    if (result.success) {
        console.log('\n🧪 Testing with different user IDs...');
        await testWithDifferentUserIds();
    }
    
    console.log('\n' + '='.repeat(50));
    console.log('🏁 Test completed!');
    
    return result;
}

// Export functions for manual testing
window.testNotificationPreferencesAPI = testNotificationPreferencesAPI;
window.testWithDifferentUserIds = testWithDifferentUserIds;
window.checkBackendConnectivity = checkBackendConnectivity;
window.runAllTests = runAllTests;

console.log('✅ Test functions loaded. Available commands:');
console.log('  - testNotificationPreferencesAPI()');
console.log('  - testWithDifferentUserIds()');
console.log('  - checkBackendConnectivity()');
console.log('  - runAllTests()');
console.log('\n💡 Run runAllTests() to execute all tests');