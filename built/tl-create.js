var __extends = (this && this.__extends) || function (d, b) {
    for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p];
    function __() { this.constructor = d; }
    d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
};
var tl_create;
(function (tl_create) {
    var MozillaAttributes = {
        CKA_CLASS: "CKA_CLASS",
        CKA_TOKEN: "CKA_TOKEN",
        CKA_PRIVATE: "CKA_PRIVATE",
        CKA_MODIFIABLE: "CKA_MODIFIABLE",
        CKA_LABEL: "CKA_LABEL",
        CKA_CERTIFICATE_TYPE: "CKA_CERTIFICATE_TYPE",
        CKA_SUBJECT: "CKA_SUBJECT",
        CKA_ID: "CKA_ID",
        CKA_ISSUER: "CKA_ISSUER",
        CKA_SERIAL_NUMBER: "CKA_SERIAL_NUMBER",
        CKA_EXPIRES: "CKA_EXPIRES",
        CKA_VALUE: "CKA_VALUE",
        CKA_NSS_EMAIL: "CKA_NSS_EMAIL",
        CKA_CERT_SHA1_HASH: "CKA_CERT_SHA1_HASH",
        CKA_CERT_MD5_HASH: "CKA_CERT_MD5_HASH",
        CKA_TRUST_DIGITAL_SIGNATURE: "CKA_TRUST_DIGITAL_SIGNATURE",
        CKA_TRUST_NON_REPUDIATION: "CKA_TRUST_NON_REPUDIATION",
        CKA_TRUST_KEY_ENCIPHERMENT: "CKA_TRUST_KEY_ENCIPHERMENT",
        CKA_TRUST_DATA_ENCIPHERMENT: "CKA_TRUST_DATA_ENCIPHERMENT",
        CKA_TRUST_KEY_AGREEMENT: "CKA_TRUST_KEY_AGREEMENT",
        CKA_TRUST_KEY_CERT_SIGN: "CKA_TRUST_KEY_CERT_SIGN",
        CKA_TRUST_CRL_SIGN: "CKA_TRUST_CRL_SIGN",
        CKA_TRUST_SERVER_AUTH: "CKA_TRUST_SERVER_AUTH",
        CKA_TRUST_CLIENT_AUTH: "CKA_TRUST_CLIENT_AUTH",
        CKA_TRUST_CODE_SIGNING: "CKA_TRUST_CODE_SIGNING",
        CKA_TRUST_EMAIL_PROTECTION: "CKA_TRUST_EMAIL_PROTECTION",
        CKA_TRUST_IPSEC_END_SYSTEM: "CKA_TRUST_IPSEC_END_SYSTEM",
        CKA_TRUST_IPSEC_TUNNEL: "CKA_TRUST_IPSEC_TUNNEL",
        CKA_TRUST_IPSEC_USER: "CKA_TRUST_IPSEC_USER",
        CKA_TRUST_TIME_STAMPING: "CKA_TRUST_TIME_STAMPING",
        CKA_TRUST_STEP_UP_APPROVED: "CKA_TRUST_STEP_UP_APPROVED"
    };
    var MozillaTypes = {
        CK_BBOOL: "CK_BBOOL",
        UTF8: "UTF8",
        CK_OBJECT_CLASS: "CK_OBJECT_CLASS",
        CK_CERTIFICATE_TYPE: "CK_CERTIFICATE_TYPE",
        MULTILINE_OCTAL: "MULTILINE_OCTAL",
        CK_TRUST: "CK_TRUST"
    };
    var Mozilla = (function () {
        function Mozilla(codeFilter) {
            if (codeFilter === void 0) { codeFilter = ["CKA_TRUST_ALL"]; }
            this.attributes = [];
            this.certTxt = null;
            this.curIndex = 0;
            for (var i in codeFilter) {
                codeFilter[i] = "CKA_TRUST_" + codeFilter[i];
            }
            this.codeFilterList = codeFilter;
        }
        Mozilla.prototype.parse = function (data) {
            // console.log("parsing started "+ this.codeFilterList);
            var tl = new tl_create.TrustedList();
            this.certText = data.replace(/\r\n/g, "\n").split("\n");
            this.findObjectDefinitionsSegment();
            this.findTrustSegment();
            this.findBeginDataSegment();
            this.findClassSegment();
            var certs = [];
            var ncc_trust = [];
            while (this.curIndex < this.certText.length) {
                var item = this.parseListItem();
                switch (item[MozillaAttributes.CKA_CLASS]) {
                    case "CKO_CERTIFICATE":
                        certs.push(item);
                        break;
                    case "CKO_NSS_TRUST":
                        ncc_trust.push(item);
                        break;
                }
                this.findClassSegment();
            }
            var c = 0;
            for (var _i = 0, certs_1 = certs; _i < certs_1.length; _i++) {
                var cert = certs_1[_i];
                // console.log(++c, cert[MozillaAttributes.CKA_LABEL]);
                var tl_cert = {
                    raw: cert[MozillaAttributes.CKA_VALUE],
                    trust: [],
                    operator: cert[MozillaAttributes.CKA_LABEL],
                    source: "Mozilla"
                };
                var ncc = this.findNcc(cert, ncc_trust);
                // add trust from ncc
                for (var i in ncc) {
                    var m = /^CKA_TRUST_(\w+)/.exec(i);
                    if (m && m[1] !== "STEP_UP_APPROVED")
                        tl_cert.trust.push(m[1]);
                }
                // console.log(tl_cert);
                tl.AddCertificate(tl_cert);
            }
            return tl;
        };
        Mozilla.prototype.findNcc = function (cert, nccs) {
            for (var _i = 0, nccs_1 = nccs; _i < nccs_1.length; _i++) {
                var ncc = nccs_1[_i];
                if (cert[MozillaAttributes.CKA_ISSUER] === ncc[MozillaAttributes.CKA_ISSUER]
                    && cert[MozillaAttributes.CKA_SERIAL_NUMBER] === ncc[MozillaAttributes.CKA_SERIAL_NUMBER])
                    return ncc;
            }
        };
        Mozilla.prototype.findObjectDefinitionsSegment = function () {
            this.findSegment("Certificates");
        };
        Mozilla.prototype.findTrustSegment = function () {
            this.findSegment("Trust");
        };
        Mozilla.prototype.findBeginDataSegment = function () {
            this.findSegment("BEGINDATA");
        };
        Mozilla.prototype.findClassSegment = function () {
            this.findSegment(MozillaAttributes.CKA_CLASS);
        };
        Mozilla.prototype.findSegment = function (name) {
            while (this.curIndex < this.certText.length) {
                var patt = new RegExp("(" + name + ")");
                var res = this.certText[this.curIndex].match(patt);
                if (res) {
                    return;
                }
                this.curIndex++;
            }
        };
        Mozilla.prototype.getValue = function (type, value) {
            if (value === void 0) { value = []; }
            var _value = value.join(" ");
            switch (type) {
                case MozillaTypes.CK_BBOOL:
                    return (_value === "CK_TRUE") ? true : false;
                case MozillaTypes.CK_CERTIFICATE_TYPE:
                case MozillaTypes.CK_OBJECT_CLASS:
                case MozillaTypes.CK_TRUST:
                    return _value;
                case MozillaTypes.MULTILINE_OCTAL:
                    var row = null;
                    var res = [];
                    while (row = this.certText[++this.curIndex]) {
                        if (row.match(/END/)) {
                            break;
                        }
                        var vals = row.split(/\\/g);
                        vals.shift();
                        for (var _i = 0, vals_1 = vals; _i < vals_1.length; _i++) {
                            var item = vals_1[_i];
                            res.push(parseInt(item, 8));
                        }
                    }
                    return xadesjs.Convert.ToBase64String(xadesjs.Convert.FromBufferString(new Uint8Array(res)));
                case MozillaTypes.UTF8:
                    // remove " from begin and end of UTF8 string
                    var utf8 = _value.slice(1, _value.length - 1).replace(/\%/g, "%25").replace(/\\x/g, "%");
                    return decodeURIComponent(utf8);
                default:
                    throw new Error("Unknown Mozilla type in use '" + type + "'");
            }
        };
        Mozilla.prototype.getAttribute = function (row) {
            var attr = null;
            if (!row || row.match(/^#/))
                return null;
            var vals = row.split(" ");
            if (vals[0] in MozillaAttributes) {
                attr = {
                    name: vals[0],
                    type: vals[1],
                    value: this.getValue(vals[1], vals.slice(2))
                };
            }
            else
                throw new Error("Can not parse row " + this.curIndex + ": " + row);
            return attr;
        };
        Mozilla.prototype.parseListItem = function () {
            var cert = {};
            var attr = null;
            while (attr = this.getAttribute(this.certText[this.curIndex])) {
                cert[attr.name] = attr.value;
                this.curIndex++;
            }
            return cert;
        };
        return Mozilla;
    }());
    tl_create.Mozilla = Mozilla;
})(tl_create || (tl_create = {}));
var tl_create;
(function (tl_create) {
    var EUTL = (function () {
        function EUTL() {
            this.TrustServiceStatusList = null;
        }
        EUTL.prototype.parse = function (data) {
            var eutl = new tl_create.TrustServiceStatusList();
            var xml = new DOMParser().parseFromString(data, "application/xml");
            eutl.LoadXml(xml);
            this.TrustServiceStatusList = eutl;
            var tl = new tl_create.TrustedList();
            for (var _i = 0, _a = eutl.SchemaInformation.Pointers; _i < _a.length; _i++) {
                var pointer = _a[_i];
                for (var _b = 0, _c = pointer.X509Certificates; _b < _c.length; _b++) {
                    var cert = _c[_b];
                    tl.AddCertificate({
                        raw: cert,
                        trust: pointer.AdditionalInformation.SchemeTypeCommunityRules,
                        operator: pointer.AdditionalInformation.SchemeOperatorName.GetItem("en"),
                        source: "EUTL"
                    });
                }
            }
            return tl;
        };
        return EUTL;
    }());
    tl_create.EUTL = EUTL;
    tl_create.XmlNodeType = xadesjs.XmlNodeType;
    var XmlObject = (function (_super) {
        __extends(XmlObject, _super);
        function XmlObject() {
            _super.apply(this, arguments);
        }
        XmlObject.prototype.GetAttribute = function (node, name, defaultValue) {
            if (defaultValue === void 0) { defaultValue = null; }
            return node.hasAttribute(name) ? node.getAttribute(name) : defaultValue;
        };
        XmlObject.prototype.NextElementPos = function (nl, pos, name, ns, required) {
            while (pos < nl.length) {
                if (nl[pos].nodeType === tl_create.XmlNodeType.Element) {
                    if (nl[pos].localName !== name || nl[pos].namespaceURI !== ns) {
                        if (required)
                            throw new Error("Malformed element '" + name + "'");
                        else
                            return -2;
                    }
                    else
                        return pos;
                }
                else
                    pos++;
            }
            if (required)
                throw new Error("Malformed element '" + name + "'");
            return -1;
        };
        return XmlObject;
    }(xadesjs.XmlObject));
    var XmlTrustServiceStatusList = {
        ElementNames: {
            TrustServiceStatusList: "TrustServiceStatusList",
            SchemeInformation: "SchemeInformation",
            TSLVersionIdentifier: "TSLVersionIdentifier",
            TSLSequenceNumber: "TSLSequenceNumber",
            TSLType: "TSLType",
            SchemeOperatorName: "SchemeOperatorName",
            Name: "Name",
            SchemeOperatorAddress: "SchemeOperatorAddress",
            PostalAddresses: "PostalAddresses",
            PostalAddress: "PostalAddress",
            StreetAddress: "StreetAddress",
            Locality: "Locality",
            PostalCode: "PostalCode",
            CountryName: "CountryName",
            ElectronicAddress: "ElectronicAddress",
            URI: "URI",
            SchemeName: "SchemeName",
            SchemeInformationURI: "SchemeInformationURI",
            StatusDeterminationApproach: "StatusDeterminationApproach",
            SchemeTypeCommunityRules: "SchemeTypeCommunityRules",
            SchemeTerritory: "SchemeTerritory",
            PolicyOrLegalNotice: "PolicyOrLegalNotice",
            TSLLegalNotice: "TSLLegalNotice",
            HistoricalInformationPeriod: "HistoricalInformationPeriod",
            PointersToOtherTSL: "PointersToOtherTSL",
            OtherTSLPointer: "OtherTSLPointer",
            ServiceDigitalIdentities: "ServiceDigitalIdentities",
            ServiceDigitalIdentity: "ServiceDigitalIdentity",
            DigitalId: "DigitalId",
            X509Certificate: "X509Certificate",
            TSLLocation: "TSLLocation",
            AdditionalInformation: "AdditionalInformation",
            OtherInformation: "OtherInformation",
            ListIssueDateTime: "ListIssueDateTime",
            NextUpdate: "NextUpdate",
            dateTime: "dateTime",
            DistributionPoints: "DistributionPoints",
        },
        AttributeNames: {
            Id: "Id",
            TSLTag: "TSLTag"
        },
        NamespaceURI: "http://uri.etsi.org/02231/v2#"
    };
    var TrustServiceStatusList = (function (_super) {
        __extends(TrustServiceStatusList, _super);
        function TrustServiceStatusList() {
            _super.apply(this, arguments);
            this.Id = null;
            this.TSLTag = null;
            this.SchemaInformation = null;
        }
        TrustServiceStatusList.prototype.LoadXml = function (value) {
            if (value == null)
                throw new Error("Parameter 'value' is required");
            if (value.constructor.name === "Document" || value instanceof Document)
                value = value.documentElement;
            if ((value.localName === XmlTrustServiceStatusList.ElementNames.TrustServiceStatusList) && (value.namespaceURI === XmlTrustServiceStatusList.NamespaceURI)) {
                // Id
                this.Id = this.GetAttribute(value, XmlTrustServiceStatusList.AttributeNames.Id);
                // TSLTag
                this.TSLTag = this.GetAttribute(value, XmlTrustServiceStatusList.AttributeNames.TSLTag);
                this.SchemaInformation = new SchemeInformation();
                var i = this.NextElementPos(value.childNodes, 0, XmlTrustServiceStatusList.ElementNames.SchemeInformation, XmlTrustServiceStatusList.NamespaceURI, true);
                this.SchemaInformation.LoadXml(value.childNodes[i]);
                this.m_element = value;
            }
            else
                throw new Error("Wrong XML element");
        };
        TrustServiceStatusList.prototype.CheckSignature = function () {
            var xmlSignature = this.m_element.getElementsByTagNameNS(xadesjs.XmlSignature.NamespaceURI, "Signature");
            // TODO: change this.m_element.ownerDocument -> this.m_element after xadesjs fix;
            var sxml = new xadesjs.SignedXml(this.m_element.ownerDocument);
            sxml.LoadXml(xmlSignature[0]);
            return sxml.CheckSignature();
        };
        return TrustServiceStatusList;
    }(XmlObject));
    tl_create.TrustServiceStatusList = TrustServiceStatusList;
    var SchemeInformation = (function (_super) {
        __extends(SchemeInformation, _super);
        function SchemeInformation() {
            _super.apply(this, arguments);
            this.Pointers = [];
        }
        SchemeInformation.prototype.LoadXml = function (value) {
            if (value == null)
                throw new Error("Parameter 'value' is required");
            if ((value.localName === XmlTrustServiceStatusList.ElementNames.SchemeInformation) && (value.namespaceURI === XmlTrustServiceStatusList.NamespaceURI)) {
                // TSLVersionIdentifier
                var i = this.NextElementPos(value.childNodes, 0, XmlTrustServiceStatusList.ElementNames.TSLVersionIdentifier, XmlTrustServiceStatusList.NamespaceURI, true);
                this.Version = +value.childNodes[i].textContent;
                // TSLSequenceNumber
                i = this.NextElementPos(value.childNodes, ++i, XmlTrustServiceStatusList.ElementNames.TSLSequenceNumber, XmlTrustServiceStatusList.NamespaceURI, true);
                this.SequenceNumber = +value.childNodes[i].textContent;
                // TSLType
                i = this.NextElementPos(value.childNodes, ++i, XmlTrustServiceStatusList.ElementNames.TSLType, XmlTrustServiceStatusList.NamespaceURI, true);
                this.Type = value.childNodes[i].textContent;
                // SchemeOperatorName
                i = this.NextElementPos(value.childNodes, ++i, XmlTrustServiceStatusList.ElementNames.SchemeOperatorName, XmlTrustServiceStatusList.NamespaceURI, true);
                // SchemeOperatorAddress
                i = this.NextElementPos(value.childNodes, ++i, XmlTrustServiceStatusList.ElementNames.SchemeOperatorAddress, XmlTrustServiceStatusList.NamespaceURI, true);
                // SchemeName
                i = this.NextElementPos(value.childNodes, ++i, XmlTrustServiceStatusList.ElementNames.SchemeName, XmlTrustServiceStatusList.NamespaceURI, true);
                // SchemeInformationURI
                i = this.NextElementPos(value.childNodes, ++i, XmlTrustServiceStatusList.ElementNames.SchemeInformationURI, XmlTrustServiceStatusList.NamespaceURI, true);
                // StatusDeterminationApproach
                i = this.NextElementPos(value.childNodes, ++i, XmlTrustServiceStatusList.ElementNames.StatusDeterminationApproach, XmlTrustServiceStatusList.NamespaceURI, true);
                this.StatusDeterminationApproach = value.childNodes[i].textContent;
                // SchemeTypeCommunityRules
                i = this.NextElementPos(value.childNodes, ++i, XmlTrustServiceStatusList.ElementNames.SchemeTypeCommunityRules, XmlTrustServiceStatusList.NamespaceURI, true);
                // SchemeTerritory
                i = this.NextElementPos(value.childNodes, ++i, XmlTrustServiceStatusList.ElementNames.SchemeTerritory, XmlTrustServiceStatusList.NamespaceURI, true);
                this.StatusDeterminationApproach = value.childNodes[i].textContent;
                // PolicyOrLegalNotice
                i = this.NextElementPos(value.childNodes, ++i, XmlTrustServiceStatusList.ElementNames.PolicyOrLegalNotice, XmlTrustServiceStatusList.NamespaceURI, true);
                // HistoricalInformationPeriod
                i = this.NextElementPos(value.childNodes, ++i, XmlTrustServiceStatusList.ElementNames.HistoricalInformationPeriod, XmlTrustServiceStatusList.NamespaceURI, true);
                this.HistoricalInformationPeriod = +value.childNodes[i].textContent;
                // PointersToOtherTSL
                i = this.NextElementPos(value.childNodes, ++i, XmlTrustServiceStatusList.ElementNames.PointersToOtherTSL, XmlTrustServiceStatusList.NamespaceURI, true);
                var pointers = value.childNodes[i].childNodes;
                for (var j = 0; j < pointers.length; j++) {
                    // OtherTSLPointer
                    var node = pointers[j];
                    if (node.nodeType !== tl_create.XmlNodeType.Element)
                        continue;
                    var pointer = new Pointer();
                    pointer.LoadXml(node);
                    this.Pointers.push(pointer);
                }
            }
            else
                throw new Error("Wrong XML element");
        };
        return SchemeInformation;
    }(XmlObject));
    var Pointer = (function (_super) {
        __extends(Pointer, _super);
        function Pointer() {
            _super.apply(this, arguments);
            this.Location = null;
            this.X509Certificates = [];
            this.AdditionalInformation = null;
        }
        Pointer.prototype.LoadXml = function (value) {
            if (value == null)
                throw new Error("Parameter 'value' is required");
            if ((value.localName === XmlTrustServiceStatusList.ElementNames.OtherTSLPointer) && (value.namespaceURI === XmlTrustServiceStatusList.NamespaceURI)) {
                // ServiceDigitalIdentities
                var i = this.NextElementPos(value.childNodes, 0, XmlTrustServiceStatusList.ElementNames.ServiceDigitalIdentities, XmlTrustServiceStatusList.NamespaceURI, true);
                var serviceDigitalIdentities = value.childNodes[i].childNodes;
                for (var j = 0; j < serviceDigitalIdentities.length; j++) {
                    if (serviceDigitalIdentities[j].nodeType !== tl_create.XmlNodeType.Element)
                        continue;
                    // X509Certificate
                    var elsX509 = serviceDigitalIdentities[j].getElementsByTagNameNS(XmlTrustServiceStatusList.NamespaceURI, XmlTrustServiceStatusList.ElementNames.X509Certificate);
                    for (var k = 0; k < elsX509.length; k++)
                        this.X509Certificates.push(elsX509[k].textContent);
                }
                // TSLLocation
                i = this.NextElementPos(value.childNodes, ++i, XmlTrustServiceStatusList.ElementNames.TSLLocation, XmlTrustServiceStatusList.NamespaceURI, true);
                this.Location = value.childNodes[i].textContent;
                // AdditionalInformation
                i = this.NextElementPos(value.childNodes, ++i, XmlTrustServiceStatusList.ElementNames.AdditionalInformation, XmlTrustServiceStatusList.NamespaceURI, true);
                this.AdditionalInformation = new AdditionalInformation();
                this.AdditionalInformation.LoadXml(value.childNodes[i]);
            }
            else
                throw new Error("Wrong XML element");
        };
        return Pointer;
    }(XmlObject));
    var AdditionalInformation = (function (_super) {
        __extends(AdditionalInformation, _super);
        function AdditionalInformation() {
            _super.apply(this, arguments);
            this.TSLType = null;
            this.SchemeTerritory = null;
            this.SchemeOperatorName = new SchemeOperatorName();
            this.SchemeTypeCommunityRules = [];
        }
        AdditionalInformation.prototype.LoadXml = function (value) {
            if (value == null)
                throw new Error("Parameter 'value' is required");
            if ((value.localName === XmlTrustServiceStatusList.ElementNames.AdditionalInformation) && (value.namespaceURI === XmlTrustServiceStatusList.NamespaceURI)) {
                // Search for OtherInformation
                var OtherInformationList = value.getElementsByTagNameNS(XmlTrustServiceStatusList.NamespaceURI, XmlTrustServiceStatusList.ElementNames.OtherInformation);
                for (var i = 0; i < OtherInformationList.length; i++) {
                    // get first element
                    var node = this.GetFirstElement(OtherInformationList[i].childNodes);
                    if (node) {
                        switch (node.localName) {
                            case XmlTrustServiceStatusList.ElementNames.SchemeTerritory:
                                this.SchemeTerritory = node.textContent;
                                break;
                            case XmlTrustServiceStatusList.ElementNames.TSLType:
                                this.TSLType = node.textContent;
                                break;
                            case XmlTrustServiceStatusList.ElementNames.SchemeOperatorName:
                                this.SchemeOperatorName.LoadXml(node);
                                break;
                            case XmlTrustServiceStatusList.ElementNames.SchemeTypeCommunityRules:
                                var elements = node.getElementsByTagNameNS(XmlTrustServiceStatusList.NamespaceURI, XmlTrustServiceStatusList.ElementNames.URI);
                                for (var j = 0; j < elements.length; j++) {
                                    this.SchemeTypeCommunityRules.push(elements[j].textContent);
                                }
                                break;
                        }
                    }
                }
            }
            else
                throw new Error("Wrong XML element");
        };
        AdditionalInformation.prototype.GetFirstElement = function (nl) {
            for (var i = 0; i < nl.length; i++) {
                var node = nl[i];
                if (node.nodeType !== tl_create.XmlNodeType.Element)
                    continue;
                return node;
            }
            return null;
        };
        return AdditionalInformation;
    }(XmlObject));
    var MultiLangType = (function (_super) {
        __extends(MultiLangType, _super);
        function MultiLangType() {
            _super.apply(this, arguments);
            this.m_elements = [];
        }
        MultiLangType.prototype.GetItem = function (lang) {
            for (var _i = 0, _a = this.m_elements; _i < _a.length; _i++) {
                var item = _a[_i];
                if (item.lang = lang)
                    return item.item;
            }
            return null;
        };
        MultiLangType.prototype.GetLang = function (el) {
            var lang = this.GetAttribute(el, "xml:lang");
            return lang || null;
        };
        MultiLangType.prototype.AddItem = function (el, lang) {
            this.m_elements.push({ item: el, lang: lang });
        };
        return MultiLangType;
    }(XmlObject));
    var SchemeOperatorName = (function (_super) {
        __extends(SchemeOperatorName, _super);
        function SchemeOperatorName() {
            _super.apply(this, arguments);
        }
        SchemeOperatorName.prototype.LoadXml = function (value) {
            if (value == null)
                throw new Error("Parameter 'value' is required");
            if ((value.localName === XmlTrustServiceStatusList.ElementNames.SchemeOperatorName) && (value.namespaceURI === XmlTrustServiceStatusList.NamespaceURI)) {
                // Search for OtherInformation
                var elements = value.getElementsByTagNameNS(XmlTrustServiceStatusList.NamespaceURI, XmlTrustServiceStatusList.ElementNames.Name);
                for (var i = 0; i < elements.length; i++) {
                    var element = elements[i];
                    var lang = this.GetLang(element);
                    if (!lang)
                        throw new Error("SchemeOperatorName:Name has no xml:lang attribute");
                    this.AddItem(element.textContent, lang);
                }
            }
            else
                throw new Error("Wrong XML element");
        };
        return SchemeOperatorName;
    }(MultiLangType));
})(tl_create || (tl_create = {}));
var tl_create;
(function (tl_create) {
    var TrustedList = (function () {
        function TrustedList() {
            this.m_certificates = [];
        }
        Object.defineProperty(TrustedList.prototype, "Certificates", {
            get: function () {
                return this.m_certificates;
            },
            enumerable: true,
            configurable: true
        });
        TrustedList.prototype.AddCertificate = function (cert) {
            this.m_certificates.push(cert);
        };
        TrustedList.prototype.toJSON = function () {
            var res = [];
            for (var _i = 0, _a = this.Certificates; _i < _a.length; _i++) {
                var cert = _a[_i];
                res.push(cert);
            }
            return res;
        };
        TrustedList.prototype.concat = function (tl) {
            if (tl)
                this.m_certificates = this.Certificates.concat(tl.Certificates);
            return this;
        };
        TrustedList.prototype.filter = function (callbackfn, thisArg) {
            this.m_certificates = this.Certificates.filter(callbackfn);
            return this;
        };
        TrustedList.prototype.toString = function () {
            var res = [];
            for (var _i = 0, _a = this.Certificates; _i < _a.length; _i++) {
                var cert = _a[_i];
                res.push("Operator: " + cert.operator);
                res.push("Source: " + cert.source);
                res.push("-----BEGIN CERTIFICATE-----");
                res.push(cert.raw);
                res.push("-----END CERTIFICATE-----");
            }
            return res.join("\n");
        };
        return TrustedList;
    }());
    tl_create.TrustedList = TrustedList;
})(tl_create || (tl_create = {}));
if (typeof module !== "undefined")
    module.exports = tl_create;