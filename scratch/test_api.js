const axios = require('axios');

async function test() {
    try {
        const res = await axios.get('http://localhost:5000/api/events');
        console.log('Success:', res.data);
    } catch (err) {
        console.error('Error:', err.response ? err.response.data : err.message);
    }
}

test();
