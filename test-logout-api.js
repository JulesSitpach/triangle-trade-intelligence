// Quick test script - run with: node test-logout-api.js

const testLogout = async () => {
  try {
    const response = await fetch('http://localhost:3000/api/auth/logout', {
      method: 'POST',
      headers: {
        'Cookie': 'triangle_session=YOUR_SESSION_COOKIE_HERE'
      }
    });
    
    const data = await response.json();
    console.log('Logout API Response:', data);
    console.log('Set-Cookie header:', response.headers.get('set-cookie'));
  } catch (error) {
    console.error('Error:', error.message);
  }
};

testLogout();
