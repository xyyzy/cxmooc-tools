import { SystemConfig } from "../config";

const fs = require("fs");;
const ChromeExtension = require('crx');

let version = dealVersion(SystemConfig.version)
// build manifest
let manifest = fs.readFileSync('./build/cxmooc-tools/manifest.json');
let str = manifest.toString().replace(/"version": "(.*?)"/, '"version": "' + version + '.0"');
fs.writeFileSync('./build/cxmooc-tools/manifest.json', str);
// build chrome
const crx = new ChromeExtension({
    privateKey: fs.readFileSync('./build/cxmooc-tools.pem')
});

crx.load(['./build/cxmooc-tools/manifest.json',
    './build/cxmooc-tools/img/*',
    './build/cxmooc-tools/src/*'
]).then((crx: { pack: () => any; }) => crx.pack()).then((crxBuffer: any) => {
    fs.writeFileSync('./build/cxmooc-tools.crx', crxBuffer);
}).catch((err: any) => {
    console.error(err);
});

// build tampermonkey
let tampermonkey_cx = fs.readFileSync('./src/tampermonkey/cxmooc.js');
let tampermonkey_cx_str = tampermonkey_cx.toString().replace(/@version\s+.*/, '@version ' + SystemConfig.hotVersion);
tampermonkey_cx_str += fs.readFileSync('./build/tampermonkey-cxmooc.js');
fs.writeFileSync('./build/cxmooc.js', tampermonkey_cx_str);

let tampermonkey_zhs = fs.readFileSync('./src/tampermonkey/zhihuishu.js');
let tampermonkey_zhs_str = tampermonkey_zhs.toString().replace(/@version\s+.*/, '@version ' + SystemConfig.hotVersion);
tampermonkey_zhs_str += fs.readFileSync('./build/tampermonkey-zhihuishu.js');
fs.writeFileSync('./build/zhihuishu.js', tampermonkey_zhs_str);

let tampermonkey_163 = fs.readFileSync('./src/tampermonkey/course163.js');
let tampermonkey_163_str = tampermonkey_163.toString().replace(/@version\s+.*/, '@version ' + SystemConfig.hotVersion);
tampermonkey_163_str += fs.readFileSync('./build/tampermonkey-course163.js');
fs.writeFileSync('./build/course163.js', tampermonkey_163_str);

function dealVersion(version: any) {
    let reg = /\d/g;
    let arr: RegExpExecArray, ret = '';
    while (arr = reg.exec(version)) {
        ret += arr[0] + '.';
    }
    return ret.substr(0, ret.length - 1);
}