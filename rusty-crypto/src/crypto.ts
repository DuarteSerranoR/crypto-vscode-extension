var CryptoTS = require("crypto-ts");
//import { 
//    AES
// } from 'crypto-ts'; // https://www.npmjs.com/package/crypto-ts


export class Crypto {


    public activeLib: CryptoTypes;

    public constructor() {
        this.tsCrypto = new TSCrypto();
        this.rustCrypto = new RustCrypto();

        this.activeLib =  CryptoTypes.tsCrypto;
    }

    public setKey(key: string) {
        this.tsCrypto.key = key;
        this.rustCrypto.key = key;
    }

    public encrypt(message: string): string {
        if (this.activeLib === CryptoTypes.tsCrypto) {
            return this.tsCrypto.encrypt(message);
        } else {
            return this.rustCrypto.encrypt(message);
        }
    }

    public decrypt(message: string): string {
        if (this.activeLib === CryptoTypes.tsCrypto) {
            return this.tsCrypto.decrypt(message);
        } else {
            return this.rustCrypto.decrypt(message);
        }
    }



    private tsCrypto: TSCrypto;
    private rustCrypto: RustCrypto;

}


export enum CryptoTypes {
    tsCrypto = 0,
    rustCrypto = 1
}





class CryptoBase {
    public algorithm: string = "AES"; // TODO - create enum and append all types of algorithms, also, implement the algorithms in each corresponding method. WARNING - some only can be reproduced in rust!
    public key: string = "temp key"; // TODO 
}


class TSCrypto extends CryptoBase { // https://github.com/hmoog/crypto-ts

    public encrypt(message: string): string {
        let bytes = CryptoTS.AES.encrypt(message, this.key);
        return bytes.toString();
    }

    public decrypt(message: string) {
        let cipherText = CryptoTS.AES.decrypt(message, this.key);
        return cipherText.toString();
    }
}

class RustCrypto extends CryptoBase {

    public encrypt(message: string) {
        return ""; // TODO 
    }

    public decrypt(message: string) {
        return ""; // TODO 
    }
}
