// Test script to verify API response
const http = require('http');

function testAPI(interval) {
  return new Promise((resolve, reject) => {
    http.get(`http://localhost:3000/api/coins/BTC?interval=${interval}`, (res) => {
      let data = '';
      res.on('data', (chunk) => { data += chunk; });
      res.on('end', () => {
        try {
          const json = JSON.parse(data);
          console.log(`\n=== Interval: ${interval} ===`);
          console.log(`Latest Date in DB: ${json.latestDate}`);
          console.log(`Total Data Points: ${json.totalPoints}`);
          if (json.data && json.data.length > 0) {
            console.log(`First Date: ${json.data[0].date}`);
            console.log(`Last Date: ${json.data[json.data.length - 1].date}`);
          }
          resolve();
        } catch (e) {
          reject(e);
        }
      });
    }).on('error', reject);
  });
}

async function runTests() {
  console.log('Testing BTC API endpoints...\n');
  await testAPI('week');
  await testAPI('month');
  await testAPI('year');
  await testAPI('5years');
  await testAPI('max');
  console.log('\n✅ All tests completed!');
}

runTests();
