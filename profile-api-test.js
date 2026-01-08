// Test script to debug profile API issues
// Run this in the browser console when the Angular app is loaded

console.log('🧪 Profile API Test Script Loaded');

// Function to test the profile API
async function testProfileAPI() {
    console.log('🔍 Testing PUT /api/profile');
    
    const token = localStorage.getItem('jwt');
    console.log('🔐 JWT Token found:', token ? 'Yes' : 'No');
    
    if (!token) {
        console.error('❌ No JWT token found. Please login first.');
        return;
    }
    
    // Test payload - exactly what Angular sends
    const testPayload = {
        age: 25,
        sexe: 'HOMME',
        taille: 175,
        poids: 70,
        objectif: 'MAINTIEN',
        niveauActivite: 'MODERE'
    };
    
    console.log('📤 Test payload:', JSON.stringify(testPayload, null, 2));
    
    try {
        const response = await fetch('http://localhost:8095/api/profile', {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify(testPayload)
        });
        
        console.log('📊 Response status:', response.status);
        console.log('📊 Response statusText:', response.statusText);
        console.log('📊 Response headers:', Object.fromEntries(response.headers.entries()));
        
        // Try to get response body
        const responseText = await response.text();
        console.log('📊 Response body (raw):', responseText);
        
        if (responseText) {
            try {
                const responseJson = JSON.parse(responseText);
                console.log('📊 Response body (JSON):', responseJson);
            } catch (e) {
                console.log('📊 Response is not JSON');
            }
        }
        
        if (response.ok) {
            console.log('✅ Profile saved successfully!');
        } else {
            console.error('❌ Profile save failed');
            console.log('💡 Check the response body above for error details');
        }
        
    } catch (error) {
        console.error('❌ Network error:', error);
    }
}

// Test with different objectif values
async function testAllObjectifs() {
    const objectifs = ['PERTE_POIDS', 'PRISE_MASSE', 'MAINTIEN', 'REMISE_EN_FORME'];
    const token = localStorage.getItem('jwt');
    
    if (!token) {
        console.error('❌ No JWT token found');
        return;
    }
    
    for (const objectif of objectifs) {
        console.log(`\n🧪 Testing objectif: ${objectif}`);
        
        const payload = {
            age: 25,
            sexe: 'HOMME',
            taille: 175,
            poids: 70,
            objectif: objectif,
            niveauActivite: 'MODERE'
        };
        
        try {
            const response = await fetch('http://localhost:8095/api/profile', {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify(payload)
            });
            
            console.log(`📊 ${objectif}: Status ${response.status}`);
            
            if (!response.ok) {
                const errorText = await response.text();
                console.log(`❌ ${objectif}: Error - ${errorText}`);
            }
        } catch (error) {
            console.log(`❌ ${objectif}: Network error - ${error.message}`);
        }
        
        await new Promise(r => setTimeout(r, 200));
    }
}

// Test GET profile first
async function testGetProfile() {
    console.log('🔍 Testing GET /api/profile');
    
    const token = localStorage.getItem('jwt');
    if (!token) {
        console.error('❌ No JWT token found');
        return;
    }
    
    try {
        const response = await fetch('http://localhost:8095/api/profile', {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            }
        });
        
        console.log('📊 GET Response status:', response.status);
        
        if (response.ok) {
            const data = await response.json();
            console.log('✅ Current profile:', data);
            return data;
        } else {
            const errorText = await response.text();
            console.log('❌ GET Error:', errorText);
        }
    } catch (error) {
        console.error('❌ Network error:', error);
    }
}

// Check what fields the backend expects
async function analyzeBackendExpectations() {
    console.log('🔍 Analyzing backend expectations...');
    
    const token = localStorage.getItem('jwt');
    if (!token) {
        console.error('❌ No JWT token found');
        return;
    }
    
    // Test with minimal payload
    const minimalPayloads = [
        { age: 25 },
        { age: 25, sexe: 'HOMME' },
        { age: 25, sexe: 'HOMME', taille: 175 },
        { age: 25, sexe: 'HOMME', taille: 175, poids: 70 },
        { age: 25, sexe: 'HOMME', taille: 175, poids: 70, objectif: 'MAINTIEN' },
        { age: 25, sexe: 'HOMME', taille: 175, poids: 70, objectif: 'MAINTIEN', niveauActivite: 'MODERE' }
    ];
    
    for (let i = 0; i < minimalPayloads.length; i++) {
        const payload = minimalPayloads[i];
        console.log(`\n🧪 Test ${i + 1}: ${Object.keys(payload).join(', ')}`);
        
        try {
            const response = await fetch('http://localhost:8095/api/profile', {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify(payload)
            });
            
            const responseText = await response.text();
            console.log(`📊 Status: ${response.status}, Body: ${responseText || '(empty)'}`);
            
        } catch (error) {
            console.log(`❌ Error: ${error.message}`);
        }
        
        await new Promise(r => setTimeout(r, 200));
    }
}

// Export functions
window.testProfileAPI = testProfileAPI;
window.testAllObjectifs = testAllObjectifs;
window.testGetProfile = testGetProfile;
window.analyzeBackendExpectations = analyzeBackendExpectations;

console.log('✅ Profile test functions loaded:');
console.log('  - testProfileAPI() - Test basic profile save');
console.log('  - testAllObjectifs() - Test all objectif values');
console.log('  - testGetProfile() - Get current profile');
console.log('  - analyzeBackendExpectations() - Find required fields');
