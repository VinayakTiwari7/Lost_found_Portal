const http = require('http');

function request(path, method, data, token) {
  return new Promise((resolve, reject) => {
    const options = {
      hostname: 'localhost',
      port: 5000,
      path,
      method,
      headers: {
        'Content-Type': 'application/json',
      }
    };
    if (data) options.headers['Content-Length'] = Buffer.byteLength(data);
    if (token) options.headers['Authorization'] = 'Bearer ' + token;
    
    const req = http.request(options, (res) => {
      let body = '';
      res.on('data', chunk => body += chunk);
      res.on('end', () => resolve({ status: res.statusCode, body }));
    });
    req.on('error', reject);
    if (data) req.write(data);
    req.end();
  });
}

async function test() {
  try {
    const ts = Date.now();
    
    // Register & Login User 1 (Poster)
    await request('/api/auth/register', 'POST', JSON.stringify({ name: 'Owner', email: `owner_${ts}@test.com`, password: 'pw' }));
    const l1 = await request('/api/auth/login', 'POST', JSON.stringify({ email: `owner_${ts}@test.com`, password: 'pw' }));
    const t1 = JSON.parse(l1.body).token;
    
    // Create Item
    await request('/api/items/add', 'POST', JSON.stringify({ title: `Lost Bag ${ts}`, description: 'desc', location: 'loc', type: 'lost', image: 'url' }), t1);
    
    // Fetch items to get the item ID
    const itemsRes = await request('/api/items', 'GET');
    const items = JSON.parse(itemsRes.body);
    const item = items.find(i => i.title === `Lost Bag ${ts}`);
    console.log("Found newly created item:", item._id);
    
    // Register & Login User 2 (Finder)
    await request('/api/auth/register', 'POST', JSON.stringify({ name: 'Helper', email: `helper_${ts}@test.com`, password: 'pw' }));
    const l2 = await request('/api/auth/login', 'POST', JSON.stringify({ email: `helper_${ts}@test.com`, password: 'pw' }));
    const t2 = JSON.parse(l2.body).token;
    
    // Claim Item
    const claimRes = await request(`/api/claims/${item._id}`, 'POST', JSON.stringify({ message: 'I found your bag' }), t2);
    console.log("Claim Response:", claimRes.status, claimRes.body);
    const claimId = JSON.parse(claimRes.body).claim._id;

    // Accept Claim (Owner)
    const acceptRes = await request(`/api/claims/${claimId}/status`, 'PATCH', JSON.stringify({ status: 'accepted' }), t1);
    console.log("Accept Response:", acceptRes.status, acceptRes.body);

    // Fetch items again to verify status and type
    const finalItemsRes = await request('/api/items', 'GET');
    const finalItem = JSON.parse(finalItemsRes.body).find(i => i._id === item._id);
    console.log("Final Item State:", finalItem.type, finalItem.status, finalItem.helper ? finalItem.helper.name : "no helper");

  } catch(e) {
    console.error(e);
  }
}

test();
