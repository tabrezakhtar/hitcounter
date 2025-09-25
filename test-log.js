async function testLogEndpoint() {
  const testData = {
    date: "2025-09-25",
    project: "test-website",
    userAgent: "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36"
  };

  try {
    console.log('Sending test data to /log endpoint...');
    console.log('Test data:', JSON.stringify(testData, null, 2));
    
    const response = await fetch('http://localhost:3000/log', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(testData)
    });

    const result = await response.json();
    
    console.log('\nResponse status:', response.status);
    console.log('Response data:', JSON.stringify(result, null, 2));
    
    if (response.ok) {
      console.log('\n✅ Test completed successfully');
      console.log('Check your MongoDB logs collection to verify the data was inserted');
    } else {
      console.log('Test failed with error response');
    }
    
  } catch (error) {
    console.error('Test failed with error:', error.message);
    console.log('Make sure your server is running on http://localhost:3000');
  }
}

// Run the test
testLogEndpoint();