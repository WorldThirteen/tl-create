# tl-create
Node command line tool to create a X.509 trust list from various trust stores

There are various organizations that produce lists of certificates that they believe should be trusted for one thing or another. The most used is the Mozilla [list](http://mxr.mozilla.org/mozilla/source/security/nss/lib/ckfw/builtins/certdata.txt?raw=1) but there are more, such as the Eurpean Union "Trust Service Providers" [list](https://ec.europa.eu/digital-agenda/en/eu-trusted-lists-certification-service-providers).

Each of these lists have their own formats, this tool parses the lists provided by these other organizations and extracts the certificates that meet the specified criteria (for "email" as an example) and produces a PEM certificate bag containing these certificates.

For example to extract the roots that are trusted for email, code and web from both the EU Trust List and the Mozilla list the command would look like this:

```
node tl-create --eutil -mozilla -for "email, code, web" roots.pem
```

This would produce a file that looked something like this:
```
 Country: UK
 Operator: European Commission
 Source: EUTL
 -----BEGIN CERTIFICATE-----
 ...
 ...
 -----END CERTIFICATE-----
 Operator: DigiCert, Inc
 For: email, www, code
 Source: Mozilla
 -----BEGIN CERTIFICATE-----
 ...
 ...
 -----END CERTIFICATE-----
```

## Bug Reporting
Please report bugs either as pull requests or as issues in the issue tracker. tl-create has a full disclosure vulnerability policy. Please do NOT attempt to report any security vulnerability in this code privately to anybody.

## TODO
* Add the Microsoft Root Program

## Related
- [CommanderJS](https://github.com/tj/commander.js)
