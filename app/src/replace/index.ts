import * as fs from 'fs';

const content = fs.readFileSync('test.html', 'utf8').toString();

const logoStart = content.indexOf('<svg xmlns="http://www.w3.org/2000/svg"');
console.log(logoStart);
const logoEnd = content.indexOf('</svg>') + 6;
console.log(logoEnd);

const toReplace = content.substring(logoStart, logoEnd);
console.log(toReplace);

console.log('-------------------');

const newContent = content.replace(toReplace, '*****');
console.log(newContent.substring(logoStart - 100, logoStart + 1000));