const axios = require('axios');

async function testOrder() {
    try {
        console.log('--- TESTING CREATE ORDER ---');
        const res = await axios.post('http://localhost:5000/api/booking/create-order', {
            eventId: '69fae595e7078eccb7ade214',
            quantity: 1,
            userName: 'Test User',
            userEmail: 'test@example.com',
            userPhone: '1234567890'
        });

        console.log('Server Response:', JSON.stringify(res.data, null, 2));
    } catch (err) {
        console.error('Error:', err.message);
    }
}
testOrder();
