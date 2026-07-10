const https = require('https');

const ids = [
  '1628186178713-75b5b244766f',
  '1599839619722-39751411ea63',
  '1592841200221-a6898f307baa',
  '1581092580497-e0d23cbdf1dc',
  '1464226184884-fa280b87c399',
  '1574943320219-553eb213f72d',
  '1586771107445-d3ca888129ff',
  '1416879598555-0c7f1a1c97a5',
  '1625246333195-78d9c38ad449',
  '1589923188900-85dae5243404',
  '1615811361523-6bd03d7748e7',
  '1530836369250-ef71a3f5e422'
];

async function checkUrl(id) {
  return new Promise((resolve) => {
    const url = `https://images.unsplash.com/photo-${id}?q=80&w=600`;
    https.request(url, { method: 'HEAD' }, (res) => {
      resolve(res.statusCode === 200 ? url : null);
    }).on('error', () => resolve(null)).end();
  });
}

async function run() {
  const valid = [];
  for (const id of ids) {
    const url = await checkUrl(id);
    if (url) valid.push(url);
  }
  console.log(valid.join('\n'));
}

run();
