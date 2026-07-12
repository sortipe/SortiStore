const https = require('node:https');

const options = {
    hostname: 'ekqguywfuqykisjtzaxz.supabase.co',
    path: '/rest/v1/products',
    headers: {
        'apikey': 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImVrcWd1eXdmdXF5a2lzanR6YXh6Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODM4MTU3MjYsImV4cCI6MjA5OTM5MTcyNn0.kNCLZgWfBt2Jm65yeSPQOuq0nZWxKwtupro6gRtP5oc',
        'Authorization': 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImVrcWd1eXdmdXF5a2lzanR6YXh6Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODM4MTU3MjYsImV4cCI6MjA5OTM5MTcyNn0.kNCLZgWfBt2Jm65yeSPQOuq0nZWxKwtupro6gRtP5oc'
    }
};

https.get(options, (res) => {
    console.log(`Status Code: ${res.statusCode}`);
    console.log('Headers:', res.headers);
    res.resume(); // Consume payload
}).on('error', (err) => {
    console.error('Error:', err.message);
});
