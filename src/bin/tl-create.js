#!/usr/bin/env node

var program = require('commander');
var util = require('util');
global.request = require('sync-request');
require("babel-polyfill");
global.XAdES = require('xadesjs');
global.cheerio = require("cheerio");
global.DOMParser = require('xmldom-alpha').DOMParser;
global.XMLSerializer = require('xmldom-alpha').XMLSerializer;
global.XmlCore = require('xml-core');
var pvutils = require("pvutils");
var asn1js = require("asn1js");
global.Pkijs = require('pkijs');
var WebCrypto = require("node-webcrypto-ossl");
webcrypto = new WebCrypto();
XAdES.Application.setEngine("OpenSSL", webcrypto);
Pkijs.setEngine("OpenSSL", webcrypto, new Pkijs.CryptoEngine({
    name: "OpenSSL",
    crypto: webcrypto,
    subtle: webcrypto.subtle
}));
var tl_create = require('../../built/tl-create.js');
var fs = require('fs');
var nodeCrypto = require('crypto');

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
    .option('-e, --eutl', 'EU Trust List Parse')
    .option('-m, --mozilla', 'Mozilla Trust List Parse')
    .option('-s, --microsoft', 'Microsoft Trust List Parse')
    .option('-a, --apple', 'Apple Trust List Parse')
    .option('-c, --cisco', 'Cisco Trust List Parse')
    .option('-C, --ciscotype [type]', 'Select Cisco Trusted Root Store (external/union/core)', 'external')
    .option('-f, --for [type]', 'Add the specified type for parse', 'ALL')
    .option('-o, --format [format]', 'Add the specified type for output format', 'pem')
    .option('-d, --disallowed', 'Fetch disallowed roots instead of trusted');


program.on('--help', function () {
    console.log('  Examples:');
    console.log('');
    console.log('    $ tl-create --mozilla --format pem roots.pem');
    console.log('    $ tl-create --mozilla --for "EMAIL_PROTECTION,CODE_SIGNING" --format pem roots.pem');
    console.log('    $ tl-create --eutl --format pem roots.pem');
    console.log('    $ tl-create --eutl --format js roots.js');
    console.log('    $ tl-create --microsoft --format pem roots.pem');
    console.log('    $ tl-create --microsoft --disallowed --format pem disallowedroots.pem');
    console.log('    $ tl-create --apple --format pem roots.pem');
    console.log('    $ tl-create --cisco --ciscotype core --format pem roots.pem');
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
    console.log('    IPSEC_PROTECTION');
    console.log('    TIME_STAMPING');
    console.log('    STEP_UP_APPROVED');
    console.log('    OCSP_SIGNING');
    console.log('    DOCUMENT_SIGNING');
    console.log('    EFS_CRYPTO');
    console.log('');
});

program.parse(process.argv);

function parseEUTLTrusted() {
    console.log("Trust Lists: EUTL");
    
    var eutl = new tl_create.EUTL();
    var tl = eutl.getTrusted();
    
    Promise.all(eutl.TrustServiceStatusLists.map(function (list) { return list.CheckSignature() }))
        .then(function (verify) {
            if (!verify)
                console.log("Warning!!!: EUTL signature is not valid");
            else
                console.log("Information: EUTL signature is valid");
        })
        .catch(function (e) {
            console.log("Error:", e.message);
        });
	
	return tl;
}

function parseEUTLDisallowed() {
    throw "EUTL does not support disallowed certificates.";
}

function parseMozillaTrusted() {
    console.log("Trust Lists: Mozilla");
    var moz = new tl_create.Mozilla();
    var tl = moz.getTrusted();
    return tl;
}

function parseMozillaDisallowed() {
    console.log("Trust Lists: Mozilla");
    var moz = new tl_create.Mozilla();
    var tl = moz.getDisallowed();
    return tl;
}

function parseMicrosoftTrusted() {
    console.log("Trust Lists: Microsoft");
    var ms = new tl_create.Microsoft();
    var tl = ms.getTrusted();
    return tl;
}

function parseMicrosoftDisallowed() {
    console.log("Trust Lists: Microsoft");
    var ms = new tl_create.Microsoft();
    var tl = ms.getDisallowed();
    return tl;
}

function parseAppleTrusted() {
    console.log("Trust Lists: Apple");
    var apple = new tl_create.Apple();
    var tl = apple.getTrusted();
    return tl;
}

function parseAppleDisallowed() {
    console.log("Trust Lists: Apple");
    var apple = new tl_create.Apple();
    var tl = apple.getDisallowed();
    return tl;
}

function parseCiscoTrusted(ciscotype) {
    console.log("Trust Lists: Cisco - " + ciscotype);
    var cisco = new tl_create.Cisco(ciscotype);
    var tl = cisco.getTrusted();
    cisco.verifyP7()
        .then(function (verify) {
            if (!verify)
                console.log("Warning!!!: Cisco PKCS#7 signature verification failed");
            else
                console.log("Information: Cisco PKCS#7 signature verification successful");
        })
        .catch(function (e) {
            console.log("Error:", e);
        });
    return tl;
}

function parseCiscoDisallowed() {
    throw "Cisco does not support disallowed certificates.";
}

function jsonToPKIJS(json) {
    var _pkijs = [];
    for (var i in json) {
        var raw = json[i].raw;
        if (raw)
            _pkijs.push(raw);
    }
    return _pkijs;
}

// prepare --for
var filter = program.for.split(",");

function trustFilter(item, index) {
    if (item.source === "EUTL")
        return true;
    if (item.trust.indexOf("ANY") !== -1)
        return true;
    for (var i in filter) {
        var f = filter[i];
        if (item.trust.indexOf(f) !== -1)
            return true;
    }
    return false;
}

if (!program.args.length)
{
	if(program.format !== "files")
	{
		program.help();
		return;
	}
}

console.log('Parsing started: ' + getDateTime());
var outputfile = program.args[0];

var eutlTL, mozTL, msTL, appleTL, ciscoTL;

if (program.eutl) {
    try {
        if(!program.disallowed)
            eutlTL = parseEUTLTrusted();
        else
            eutlTL = parseEUTLDisallowed();
    } catch (e) {
        if(e.stack)
            console.log(e.toString(), e.stack);
        else
            console.log(e.toString());
    }

}
if (program.mozilla) {
    try {
        if(!program.disallowed)
            mozTL = parseMozillaTrusted();
        else
            mozTL = parseMozillaDisallowed();
    } catch (e) {
        console.log(e.toString());
    }
}
if (program.microsoft) {
    try {
        if(!program.disallowed)
            msTL = parseMicrosoftTrusted();
        else
            msTL = parseMicrosoftDisallowed();
    } catch (e) {
        console.log(e.toString());
    }
}
if (program.apple) {
    try {
        if(!program.disallowed)
            appleTL = parseAppleTrusted();
        else
            appleTL = parseAppleDisallowed();
    } catch (e) {
        console.log(e.toString());
    }
}
if (program.cisco) {
    try {
        if(!program.disallowed)
            ciscoTL = parseCiscoTrusted(program.ciscotype);
        else
            ciscoTL = parseCiscoDisallowed();
    } catch (e) {
        console.log(e.toString());
    }
}

var tl = null;
if (mozTL)
    tl = mozTL.concat(tl);
if (eutlTL)
    tl = eutlTL.concat(tl);
if (msTL)
    tl = msTL.concat(tl);
if (appleTL)
    tl = appleTL.concat(tl);
if (ciscoTL)
    tl = ciscoTL.concat(tl);

if (tl === null) {
    console.log("Cannot fetch any Trust Lists.");
    process.exit(1);
}

// Filter data
if (filter.indexOf("ALL") === -1) {
    console.log("Filter:");
    console.log("    Incoming data: " + tl.Certificates.length + " certificates");
    tl.filter(trustFilter);
    console.log("    Filtered data: " + tl.Certificates.length + " certificates");
}

switch ((program.format || "pem").toLowerCase()) {
    case "js":
        console.log("Output format: JS");
        fs.writeFileSync(outputfile, JSON.stringify(tl));
        break;
    case "pkijs":
        console.log("Output format: PKIJS");
        var _pkijs = jsonToPKIJS(tl.toJSON());
        fs.writeFileSync(outputfile, JSON.stringify(_pkijs));
        break;
    case "pem":
        console.log("Output format: PEM");
        fs.writeFileSync(outputfile, tl.toString());
        break;
    case "files":
        {
            var crypto = Pkijs.getCrypto();
            if(typeof crypto === "undefined")
            {
                console.log("Unable to initialize cryptographic engine");
                break;
            }
            
            var filesJSON = {};
            
            function storeFiles(directory, trustList)
            {
                var targetDir = "./roots/" + directory;
                
                filesJSON[directory] = [];

                var PKICertificate = Pkijs.Certificate;
                
                var files = [];
                var noIdFiles = [];

                for(var i = 0; i < trustList.Certificates.length; i++)
                {
	                var fileRaw = pvutils.stringToArrayBuffer(pvutils.fromBase64(trustList.Certificates[i].raw));
	
	                var asn1 = asn1js.fromBER(fileRaw);
	                if(asn1.offset === (-1))
		                continue;
	
	                var certificate;
	
	                try
	                {
		                certificate = new PKICertificate({ schema: asn1.result });
	                }
	                catch(ex)
	                {
		                continue;
	                }
	
	                //certificate.subject.valueBeforeDecode
                    var nameID = nodeCrypto.createHash("SHA1").update(Buffer.from(certificate.subject.valueBeforeDecode)).digest().toString("hex").toUpperCase();
                    
	                if("extensions" in certificate)
	                {
		                for(var j = 0; j < certificate.extensions.length; j++)
		                {
			                if(certificate.extensions[j].extnID === "2.5.29.14") // SubjectKeyIdentifier
			                {
				                files.push({
					                name: pvutils.bufferToHexCodes(certificate.extensions[j].parsedValue.valueBlock.valueHex),
					                nameID: nameID,
					                content: fileRaw.slice(0)
				                });
				
				                break;
			                }
			                
			                noIdFiles.push({
                                publicKey: certificate.subjectPublicKeyInfo.subjectPublicKey.valueBlock.valueHex.slice(0),
				                nameID: nameID,
				                content: fileRaw.slice(0)
                            });
		                }
	                }
                }
                
                if((files.length) || (noIdFiles.length))
                {
	                if(!fs.existsSync(targetDir))
		                fs.mkdirSync(targetDir);
                }
                
                if(files.length)
                {
	                for(var k = 0; k < files.length; k++)
	                {
                        try {
                            fs.writeFileSync(targetDir + "/" + files[k].name, Buffer.from(files[k].content));
                        
                            filesJSON[directory].push({
                                k: files[k].name,
                                n: files[k].nameID
                            });
                        } catch (err) {
                            if (err.code === 'ENAMETOOLONG') {
                                console.log(err.message);
                            } else {
                                throw err;
                            }
                        }
	                }
                }
                
                if(noIdFiles.length)
                {
                    for(var m = 0; m < noIdFiles.length; m++)
	                {
	                	var keyID = nodeCrypto.createHash("SHA1").update(Buffer.from(noIdFiles[m].publicKey)).digest().toString("hex").toUpperCase();
		
		                filesJSON[directory].push({
			                k: keyID,
                            n: noIdFiles[m].nameID
		                });
		
		                fs.writeFileSync(targetDir + "/" + keyID, Buffer.from(noIdFiles[m].content));
	                }
                }
                
                fs.writeFileSync("./roots/index.json", Buffer.from(JSON.stringify(filesJSON)));
	        }
	
	        if(!fs.existsSync("./roots"))
	            fs.mkdirSync("./roots");
            
            if(mozTL)
                storeFiles("mozilla", mozTL);

            if(eutlTL)
	            storeFiles("eutl", eutlTL);

            if(msTL)
	            storeFiles("microsoft", msTL);

            if(appleTL)
	            storeFiles("apple", appleTL);

            if(ciscoTL)
	            storeFiles("cisco", ciscoTL);
        }
        break;
    default:
        console.log("Invalid output format");
        break;
}
