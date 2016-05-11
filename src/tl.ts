namespace tl_create {

    export interface X509Certificate {
        raw: string;
        operator: string;
        trust: string[];
        source: string;
    }

    export declare type ExportX509CertificateJSON = X509Certificate[];

    export class TrustedList {

        protected m_certificates: X509Certificate[] = [];

        get Certificates(): X509Certificate[] {
            return this.m_certificates;
        }

        AddCertificate(cert: X509Certificate): void {
            this.m_certificates.push(cert);
        }

        toJSON(): ExportX509CertificateJSON {
            let res: ExportX509CertificateJSON = [];

            for (let cert of this.Certificates)
                res.push(cert);

            return res;
        }

        concat(tl: TrustedList): TrustedList {
            if (tl)
                this.m_certificates = this.Certificates.concat(tl.Certificates);
            return this;
        }

        toString(): string {
            let res: string[] = [];

            for (let cert of this.Certificates) {
                res.push("Operator: " + cert.operator);
                res.push("Source: " + cert.source);
                res.push("-----BEGIN CERTIFICATE-----");
                res.push(cert.raw);
                res.push("-----END CERTIFICATE-----");
            }

            return res.join("\n");
        }
    }

}