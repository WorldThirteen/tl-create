#!/usr/bin/env node

var program = require('commander');
var util = require('util');
var request = require('sync-request');
global.xadesjs = require('xadesjs');
global.DOMParser = require('xmldom').DOMParser;
global.XMLSerializer = require('xmldom').XMLSerializer;
var tl_create = require('../../built/tl-create.js');
var fs = require('fs');
var prefix = "tsl:";//user by eutil 
var euUrl = "http://ec.europa.eu/information_society/newsroom/cf/dae/document.cfm?doc_id=1789";
var mozillaUrl = "http://mxr.mozilla.org/mozilla/source/security/nss/lib/ckfw/builtins/certdata.txt?raw=1";
var isFirstOutput = true;
var totalRootCount = 0;
var parsedRootCount = 0;
var errorParsedRootCount = 0;
var totalRootsSkip = 0;

/*
 * Utility functions 
 * 
 */
function getDateTime() {

    var date = new Date();

    var hour = date.getHours();
    hour = (hour < 10 ? "0" : "") + hour;

    var min = date.getMinutes();
    min = (min < 10 ? "0" : "") + min;

    var sec = date.getSeconds();
    sec = (sec < 10 ? "0" : "") + sec;

    var year = date.getFullYear();

    var month = date.getMonth() + 1;
    month = (month < 10 ? "0" : "") + month;

    var day = date.getDate();
    day = (day < 10 ? "0" : "") + day;

    return year + ":" + month + ":" + day + ":" + hour + ":" + min + ":" + sec;

}

program
    .version('1.1.0')
    .option('-e, --eutil', 'EU Trust List Parse')
    .option('-m, --mozilla', 'Mozilla Trust List Parse')
    .option('-f, --for [type]', 'Add the specified type for parse', 'ALL')
    .option('-o, --format [format]', 'Add the specified type for output format', 'pem');


program.on('--help', function () {
    console.log('  Examples:');
    console.log('');
    console.log('    $ tl-create --mozilla --format pem roots.pem');
    console.log('    $ tl-create --mozilla --for "EMAIL_PROTECTION,CODE_SIGNING" --format pem roots.pem');
    console.log('    $ tl-create --eutil --format pem roots.pem');
    console.log('    $ tl-create --eutil --format js roots.js');
    console.log('');
});

program.on('--help', function () {
    console.log('  Types:');
    console.log('');
    console.log('    DIGITAL_SIGNATURE');
    console.log('    NON_REPUDIATION');
    console.log('    KEY_ENCIPHERMENT');
    console.log('    DATA_ENCIPHERMENT');
    console.log('    KEY_AGREEMENT');
    console.log('    KEY_CERT_SIGN');
    console.log('    CRL_SIGN');
    console.log('    SERVER_AUTH');
    console.log('    CLIENT_AUTH');
    console.log('    CODE_SIGNING');
    console.log('    EMAIL_PROTECTION');
    console.log('    IPSEC_END_SYSTEM');
    console.log('    IPSEC_TUNNEL');
    console.log('    IPSEC_USER');
    console.log('    TIME_STAMPING');
    console.log('    STEP_UP_APPROVED');
    console.log('');
});

program.parse(process.argv);

function getRemoteTL(url) {
    console.log("TL data: Downloading from " + url);
    var res = request('GET', url, { 'timeout': 10000, 'retry': true, 'headers': { 'user-agent': 'nodejs' } });
    var data = res.body.toString('utf-8');
    console.log("TL data: Ok");
    return data;
}

function parseEUTL() {
    console.log("Trust Lists: EUTIL");
    var data = getRemoteTL(euUrl);
    var eutl = new tl_create.EUTL();
    var tl = eutl.parse(data);
    return tl;
}

function parseMozilla() {
    console.log("Trust Lists: Mozilla");
    var data = getRemoteTL(mozillaUrl);
    var moz = new tl_create.Mozilla();
    var tl = moz.parse(data);
    return tl;
}

if (!program.args.length) program.help();

else if (program.args[0]) {

    console.log('Parsing started: ' + getDateTime());
    var writableStream = fs.createWriteStream(program.args[0]);

    var eutlTL, mozTL;

    if (program.eutil) {
        try {
            eutlTL = parseEUTL();
        } catch (e) {
            console.log(e.toString());
        }

    }
    if (program.mozilla) {
        try {
            mozTL = parseMozilla();
        } catch (e) {
            console.log(e.toString());
        }
    }

    var tl = null;
    if (mozTL && eutlTL)
        tl = mozTL.concat(eutlTL);
    else
        tl = mozTL ? mozTL : eutlTL;

    if (program.format == 'js')
        writableStream.write(JSON.stringify(tl));
    else
        writableStream.write(tl.toString());

    writableStream.end();
}