import fs from 'fs';

const muscles = JSON.parse(fs.readFileSync('src/data/muscles.json', 'utf8'));

console.log('Total muscles:', muscles.length);
muscles.forEach((m, i) => {
  console.log(`=== [${i+1}] ${m.id} ===`);
  console.log('Name:', m.name);
  console.log('View:', m.view);
  console.log('Origin:', m.originText);
  console.log('Insertion:', m.insertionText);
  console.log('Function:', m.functionText);
  console.log('Joints:', JSON.stringify(m.jointCategories));
  console.log('');
});
