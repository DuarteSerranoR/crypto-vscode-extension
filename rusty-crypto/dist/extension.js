/******/ (() => { // webpackBootstrap
/******/ 	var __webpack_modules__ = ([
/* 0 */
/***/ ((__unused_webpack_module, exports, __webpack_require__) => {

"use strict";

Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.deactivate = exports.activate = exports.crypto = void 0;
// The module 'vscode' contains the VS Code extensibility API
// Import the module and reference it with the alias vscode in your code below
const vscode_1 = __webpack_require__(1);
const open = __webpack_require__(2);
const crypto_1 = __webpack_require__(10);
const panel_1 = __webpack_require__(13);
exports.crypto = new crypto_1.Crypto();
// this method is called when your extension is activated
// your extension is activated the very first time the command is executed
function activate(context) {
    /*
    // Use the console to output diagnostic information (console.log) and errors (console.error)
    // This line of code will only be executed once when your extension is activated
    console.log('Congratulations, your extension "rusty-crypto" is now active!');

    // The command has been defined in the package.json file
    // Now provide the implementation of the command with registerCommand
    // The commandId parameter must match the command field in package.json
    let disposable = vscode.commands.registerCommand('rusty-crypto.helloWorld', () => {
        // The code you place here will be executed every time your command is executed
        // Display a message box to the user
        vscode.window.showInformationMessage('Hello World from rusty-crypto!');
    });

    context.subscriptions.push(disposable);
    */
    console.log("Extension active!");
    // https://code.visualstudio.com/docs/getstarted/userinterface
    // https://code.visualstudio.com/api/references/contribution-points
    let disposables = [
        // TODO - add side bar
        // Encryption commands
        vscode_1.commands.registerCommand('rusty-crypto.encrypt', async () => {
            const editor = vscode_1.window.activeTextEditor;
            let selectedText = editor?.document.getText(editor.selection);
            if (selectedText !== undefined && selectedText !== '') {
                let token = exports.crypto.encrypt(selectedText);
                vscode_1.window.showInformationMessage(token);
            }
            else {
                vscode_1.window.showErrorMessage("No selected text detected!!");
                selectedText = await vscode_1.window.showInputBox({
                    placeHolder: "Input the text to encrypt:"
                });
                if (selectedText) {
                    let token = exports.crypto.encrypt(selectedText);
                    vscode_1.window.showInformationMessage(token);
                }
            }
        }),
        vscode_1.commands.registerCommand('rusty-crypto.decrypt', async () => {
            const editor = vscode_1.window.activeTextEditor;
            let selectedText = editor?.document.getText(editor.selection);
            if (selectedText !== undefined && selectedText !== '') {
                let token = exports.crypto.decrypt(selectedText);
                vscode_1.window.showInformationMessage(token);
            }
            else {
                vscode_1.window.showErrorMessage("No selected text detected!!");
                selectedText = await vscode_1.window.showInputBox({
                    placeHolder: "Input the text to encrypt:"
                });
                if (selectedText) {
                    let token = exports.crypto.decrypt(selectedText);
                    vscode_1.window.showInformationMessage(token);
                }
            }
        }),
        // Test command
        vscode_1.commands.registerCommand('rusty-crypto.test', async () => {
            const response = await vscode_1.window.showInformationMessage('Working?', "yes", "no");
            if (response === "yes") {
                vscode_1.window.showInformationMessage("Nice!");
            }
            else {
                const redirect = await vscode_1.window.showInformationMessage("Tell me what is wrong at the git page -> 'https://github.com/DuarteSerranoR/crypto-vscode-extension';", "Check out", "Ignore");
                if (redirect === "Check out") {
                    await open('https://github.com/DuarteSerranoR/crypto-vscode-extension');
                }
            }
        }),
        // Panel
        vscode_1.commands.registerCommand("rusty-crypto.show_panel", () => {
            panel_1.RustyCryptoPanel.createOrShow(context.extensionUri);
        }),
        // Dev
        vscode_1.commands.registerCommand("rusty-crypto.refresh", async () => {
            panel_1.RustyCryptoPanel.kill();
            panel_1.RustyCryptoPanel.createOrShow(context.extensionUri);
            await vscode_1.commands.executeCommand("workbench.action.webview.openDeveloperTools");
        })
    ];
    disposables.forEach(disposable => {
        context.subscriptions.push(disposable);
    });
    if (vscode_1.window.registerWebviewPanelSerializer) {
        // Make sure we register a serializer in activation event
        vscode_1.window.registerWebviewPanelSerializer(panel_1.RustyCryptoPanel.viewType, {
            async deserializeWebviewPanel(webviewPanel, state) {
                console.log(`Got state: ${state}`);
                // Reset the webview options so we use latest uri for `localResourceRoots`.
                webviewPanel.webview.options = getWebviewOptions(context.extensionUri);
                //CatCodingPanel.revive(webviewPanel, context.extensionUri);
            }
        });
    }
}
exports.activate = activate;
function getWebviewOptions(extensionUri) {
    return {
        // Enable javascript in the webview
        enableScripts: true,
        // And restrict the webview to only loading content from our extension's `media` directory.
        localResourceRoots: [vscode_1.Uri.joinPath(extensionUri, 'media')]
    };
}
// this method is called when your extension is deactivated
function deactivate() { }
exports.deactivate = deactivate;


/***/ }),
/* 1 */
/***/ ((module) => {

"use strict";
module.exports = require("vscode");

/***/ }),
/* 2 */
/***/ ((module, __unused_webpack_exports, __webpack_require__) => {

const path = __webpack_require__(3);
const childProcess = __webpack_require__(4);
const {promises: fs, constants: fsConstants} = __webpack_require__(5);
const isWsl = __webpack_require__(6);
const isDocker = __webpack_require__(8);
const defineLazyProperty = __webpack_require__(9);

// Path to included `xdg-open`.
const localXdgOpenPath = path.join(__dirname, 'xdg-open');

const {platform, arch} = process;

/**
Get the mount point for fixed drives in WSL.

@inner
@returns {string} The mount point.
*/
const getWslDrivesMountPoint = (() => {
	// Default value for "root" param
	// according to https://docs.microsoft.com/en-us/windows/wsl/wsl-config
	const defaultMountPoint = '/mnt/';

	let mountPoint;

	return async function () {
		if (mountPoint) {
			// Return memoized mount point value
			return mountPoint;
		}

		const configFilePath = '/etc/wsl.conf';

		let isConfigFileExists = false;
		try {
			await fs.access(configFilePath, fsConstants.F_OK);
			isConfigFileExists = true;
		} catch {}

		if (!isConfigFileExists) {
			return defaultMountPoint;
		}

		const configContent = await fs.readFile(configFilePath, {encoding: 'utf8'});
		const configMountPoint = /(?<!#.*)root\s*=\s*(?<mountPoint>.*)/g.exec(configContent);

		if (!configMountPoint) {
			return defaultMountPoint;
		}

		mountPoint = configMountPoint.groups.mountPoint.trim();
		mountPoint = mountPoint.endsWith('/') ? mountPoint : `${mountPoint}/`;

		return mountPoint;
	};
})();

const pTryEach = async (array, mapper) => {
	let latestError;

	for (const item of array) {
		try {
			return await mapper(item); // eslint-disable-line no-await-in-loop
		} catch (error) {
			latestError = error;
		}
	}

	throw latestError;
};

const baseOpen = async options => {
	options = {
		wait: false,
		background: false,
		newInstance: false,
		allowNonzeroExitCode: false,
		...options
	};

	if (Array.isArray(options.app)) {
		return pTryEach(options.app, singleApp => baseOpen({
			...options,
			app: singleApp
		}));
	}

	let {name: app, arguments: appArguments = []} = options.app || {};
	appArguments = [...appArguments];

	if (Array.isArray(app)) {
		return pTryEach(app, appName => baseOpen({
			...options,
			app: {
				name: appName,
				arguments: appArguments
			}
		}));
	}

	let command;
	const cliArguments = [];
	const childProcessOptions = {};

	if (platform === 'darwin') {
		command = 'open';

		if (options.wait) {
			cliArguments.push('--wait-apps');
		}

		if (options.background) {
			cliArguments.push('--background');
		}

		if (options.newInstance) {
			cliArguments.push('--new');
		}

		if (app) {
			cliArguments.push('-a', app);
		}
	} else if (platform === 'win32' || (isWsl && !isDocker())) {
		const mountPoint = await getWslDrivesMountPoint();

		command = isWsl ?
			`${mountPoint}c/Windows/System32/WindowsPowerShell/v1.0/powershell.exe` :
			`${process.env.SYSTEMROOT}\\System32\\WindowsPowerShell\\v1.0\\powershell`;

		cliArguments.push(
			'-NoProfile',
			'-NonInteractive',
			'–ExecutionPolicy',
			'Bypass',
			'-EncodedCommand'
		);

		if (!isWsl) {
			childProcessOptions.windowsVerbatimArguments = true;
		}

		const encodedArguments = ['Start'];

		if (options.wait) {
			encodedArguments.push('-Wait');
		}

		if (app) {
			// Double quote with double quotes to ensure the inner quotes are passed through.
			// Inner quotes are delimited for PowerShell interpretation with backticks.
			encodedArguments.push(`"\`"${app}\`""`, '-ArgumentList');
			if (options.target) {
				appArguments.unshift(options.target);
			}
		} else if (options.target) {
			encodedArguments.push(`"${options.target}"`);
		}

		if (appArguments.length > 0) {
			appArguments = appArguments.map(arg => `"\`"${arg}\`""`);
			encodedArguments.push(appArguments.join(','));
		}

		// Using Base64-encoded command, accepted by PowerShell, to allow special characters.
		options.target = Buffer.from(encodedArguments.join(' '), 'utf16le').toString('base64');
	} else {
		if (app) {
			command = app;
		} else {
			// When bundled by Webpack, there's no actual package file path and no local `xdg-open`.
			const isBundled =  false || __dirname === '/';

			// Check if local `xdg-open` exists and is executable.
			let exeLocalXdgOpen = false;
			try {
				await fs.access(localXdgOpenPath, fsConstants.X_OK);
				exeLocalXdgOpen = true;
			} catch {}

			const useSystemXdgOpen = process.versions.electron ||
				platform === 'android' || isBundled || !exeLocalXdgOpen;
			command = useSystemXdgOpen ? 'xdg-open' : localXdgOpenPath;
		}

		if (appArguments.length > 0) {
			cliArguments.push(...appArguments);
		}

		if (!options.wait) {
			// `xdg-open` will block the process unless stdio is ignored
			// and it's detached from the parent even if it's unref'd.
			childProcessOptions.stdio = 'ignore';
			childProcessOptions.detached = true;
		}
	}

	if (options.target) {
		cliArguments.push(options.target);
	}

	if (platform === 'darwin' && appArguments.length > 0) {
		cliArguments.push('--args', ...appArguments);
	}

	const subprocess = childProcess.spawn(command, cliArguments, childProcessOptions);

	if (options.wait) {
		return new Promise((resolve, reject) => {
			subprocess.once('error', reject);

			subprocess.once('close', exitCode => {
				if (options.allowNonzeroExitCode && exitCode > 0) {
					reject(new Error(`Exited with code ${exitCode}`));
					return;
				}

				resolve(subprocess);
			});
		});
	}

	subprocess.unref();

	return subprocess;
};

const open = (target, options) => {
	if (typeof target !== 'string') {
		throw new TypeError('Expected a `target`');
	}

	return baseOpen({
		...options,
		target
	});
};

const openApp = (name, options) => {
	if (typeof name !== 'string') {
		throw new TypeError('Expected a `name`');
	}

	const {arguments: appArguments = []} = options || {};
	if (appArguments !== undefined && appArguments !== null && !Array.isArray(appArguments)) {
		throw new TypeError('Expected `appArguments` as Array type');
	}

	return baseOpen({
		...options,
		app: {
			name,
			arguments: appArguments
		}
	});
};

function detectArchBinary(binary) {
	if (typeof binary === 'string' || Array.isArray(binary)) {
		return binary;
	}

	const {[arch]: archBinary} = binary;

	if (!archBinary) {
		throw new Error(`${arch} is not supported`);
	}

	return archBinary;
}

function detectPlatformBinary({[platform]: platformBinary}, {wsl}) {
	if (wsl && isWsl) {
		return detectArchBinary(wsl);
	}

	if (!platformBinary) {
		throw new Error(`${platform} is not supported`);
	}

	return detectArchBinary(platformBinary);
}

const apps = {};

defineLazyProperty(apps, 'chrome', () => detectPlatformBinary({
	darwin: 'google chrome',
	win32: 'chrome',
	linux: ['google-chrome', 'google-chrome-stable', 'chromium']
}, {
	wsl: {
		ia32: '/mnt/c/Program Files (x86)/Google/Chrome/Application/chrome.exe',
		x64: ['/mnt/c/Program Files/Google/Chrome/Application/chrome.exe', '/mnt/c/Program Files (x86)/Google/Chrome/Application/chrome.exe']
	}
}));

defineLazyProperty(apps, 'firefox', () => detectPlatformBinary({
	darwin: 'firefox',
	win32: 'C:\\Program Files\\Mozilla Firefox\\firefox.exe',
	linux: 'firefox'
}, {
	wsl: '/mnt/c/Program Files/Mozilla Firefox/firefox.exe'
}));

defineLazyProperty(apps, 'edge', () => detectPlatformBinary({
	darwin: 'microsoft edge',
	win32: 'msedge',
	linux: ['microsoft-edge', 'microsoft-edge-dev']
}, {
	wsl: '/mnt/c/Program Files (x86)/Microsoft/Edge/Application/msedge.exe'
}));

open.apps = apps;
open.openApp = openApp;

module.exports = open;


/***/ }),
/* 3 */
/***/ ((module) => {

"use strict";
module.exports = require("path");

/***/ }),
/* 4 */
/***/ ((module) => {

"use strict";
module.exports = require("child_process");

/***/ }),
/* 5 */
/***/ ((module) => {

"use strict";
module.exports = require("fs");

/***/ }),
/* 6 */
/***/ ((module, __unused_webpack_exports, __webpack_require__) => {

"use strict";

const os = __webpack_require__(7);
const fs = __webpack_require__(5);
const isDocker = __webpack_require__(8);

const isWsl = () => {
	if (process.platform !== 'linux') {
		return false;
	}

	if (os.release().toLowerCase().includes('microsoft')) {
		if (isDocker()) {
			return false;
		}

		return true;
	}

	try {
		return fs.readFileSync('/proc/version', 'utf8').toLowerCase().includes('microsoft') ?
			!isDocker() : false;
	} catch (_) {
		return false;
	}
};

if (process.env.__IS_WSL_TEST__) {
	module.exports = isWsl;
} else {
	module.exports = isWsl();
}


/***/ }),
/* 7 */
/***/ ((module) => {

"use strict";
module.exports = require("os");

/***/ }),
/* 8 */
/***/ ((module, __unused_webpack_exports, __webpack_require__) => {

"use strict";

const fs = __webpack_require__(5);

let isDocker;

function hasDockerEnv() {
	try {
		fs.statSync('/.dockerenv');
		return true;
	} catch (_) {
		return false;
	}
}

function hasDockerCGroup() {
	try {
		return fs.readFileSync('/proc/self/cgroup', 'utf8').includes('docker');
	} catch (_) {
		return false;
	}
}

module.exports = () => {
	if (isDocker === undefined) {
		isDocker = hasDockerEnv() || hasDockerCGroup();
	}

	return isDocker;
};


/***/ }),
/* 9 */
/***/ ((module) => {

"use strict";

module.exports = (object, propertyName, fn) => {
	const define = value => Object.defineProperty(object, propertyName, {value, enumerable: true, writable: true});

	Object.defineProperty(object, propertyName, {
		configurable: true,
		enumerable: true,
		get() {
			const result = fn();
			define(result);
			return result;
		},
		set(value) {
			define(value);
		}
	});

	return object;
};


/***/ }),
/* 10 */
/***/ ((__unused_webpack_module, exports, __webpack_require__) => {

"use strict";

Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.Crypto = exports.CryptoTypes = void 0;
const cryptoTS = __webpack_require__(11);
//import {
//    AES
// } from 'crypto-ts'; // https://www.npmjs.com/package/crypto-ts
const vscode = __webpack_require__(1);
class Crypto {
    constructor() {
        this.tsCrypto = new TSCrypto();
        this.rustCrypto = new RustCrypto();
        this.activeLib = CryptoTypes.tsCrypto;
    }
    setKey(key) {
        this.tsCrypto.key = key;
        this.rustCrypto.key = key;
    }
    encrypt(message) {
        if (this.activeLib === CryptoTypes.tsCrypto) {
            return this.tsCrypto.encrypt(message);
        }
        else {
            return this.rustCrypto.encrypt(message);
        }
    }
    decrypt(message) {
        if (this.activeLib === CryptoTypes.tsCrypto) {
            return this.tsCrypto.decrypt(message);
        }
        else {
            return this.rustCrypto.decrypt(message);
        }
    }
}
exports.Crypto = Crypto;
var CryptoTypes;
(function (CryptoTypes) {
    CryptoTypes[CryptoTypes["tsCrypto"] = 0] = "tsCrypto";
    CryptoTypes[CryptoTypes["rustCrypto"] = 1] = "rustCrypto";
})(CryptoTypes = exports.CryptoTypes || (exports.CryptoTypes = {}));
class CryptoBase {
    constructor() {
        this.algorithm = "AES"; // TODO - create enum and append all types of algorithms, also, implement the algorithms in each corresponding method. WARNING - some only can be reproduced in rust!
    }
    get key() {
        return vscode.workspace.getConfiguration("cryptoSettings").get("key");
    }
    set key(key) {
        vscode.workspace.getConfiguration("cryptoSettings").update("key", key);
    }
}
class TSCrypto extends CryptoBase {
    encrypt(message) {
        let bytes = cryptoTS.AES.encrypt(message, this.key);
        return bytes.toString();
    }
    decrypt(message) {
        let cipherText = cryptoTS.AES.decrypt(message, this.key);
        return cipherText.toString();
    }
}
class RustCrypto extends CryptoBase {
    encrypt(message) {
        return ""; // TODO 
    }
    decrypt(message) {
        return ""; // TODO 
    }
}


/***/ }),
/* 11 */
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

"use strict";
__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   "AES": () => (/* binding */ AES$1),
/* harmony export */   "SHA256": () => (/* binding */ SHA256$1),
/* harmony export */   "algo": () => (/* binding */ algo),
/* harmony export */   "enc": () => (/* binding */ enc),
/* harmony export */   "lib": () => (/* binding */ lib),
/* harmony export */   "mode": () => (/* binding */ mode),
/* harmony export */   "pad": () => (/* binding */ pad),
/* harmony export */   "ɵa": () => (/* binding */ BlockCipher),
/* harmony export */   "ɵb": () => (/* binding */ Cipher),
/* harmony export */   "ɵc": () => (/* binding */ BufferedBlockAlgorithm),
/* harmony export */   "ɵe": () => (/* binding */ WordArray),
/* harmony export */   "ɵf": () => (/* binding */ CipherParams),
/* harmony export */   "ɵg": () => (/* binding */ Base),
/* harmony export */   "ɵi": () => (/* binding */ Hasher),
/* harmony export */   "ɵj": () => (/* binding */ SerializableCipher),
/* harmony export */   "ɵk": () => (/* binding */ PasswordBasedCipher),
/* harmony export */   "ɵl": () => (/* binding */ AES),
/* harmony export */   "ɵm": () => (/* binding */ SHA256),
/* harmony export */   "ɵn": () => (/* binding */ Utf8),
/* harmony export */   "ɵo": () => (/* binding */ Latin1),
/* harmony export */   "ɵp": () => (/* binding */ Hex),
/* harmony export */   "ɵq": () => (/* binding */ NoPadding),
/* harmony export */   "ɵr": () => (/* binding */ PKCS7),
/* harmony export */   "ɵs": () => (/* binding */ CBC),
/* harmony export */   "ɵt": () => (/* binding */ BlockCipherMode),
/* harmony export */   "ɵu": () => (/* binding */ ECB)
/* harmony export */ });
/* harmony import */ var tslib__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(12);
/**
 * @license crypto-ts
 * MIT license
 */



/**
 * @fileoverview added by tsickle
 * @suppress {checkTypes} checked by tsc
 */
var Hex = /** @class */ (function () {
    function Hex() {
    }
    /**
     * Converts a word array to a hex string.
     *
     * \@example
     *
     *     let hexString = Hex.stringify(wordArray);
     * @param {?} wordArray The word array.
     *
     * @return {?} The hex string.
     *
     */
    Hex.stringify = /**
     * Converts a word array to a hex string.
     *
     * \@example
     *
     *     let hexString = Hex.stringify(wordArray);
     * @param {?} wordArray The word array.
     *
     * @return {?} The hex string.
     *
     */
    function (wordArray) {
        // Convert
        var /** @type {?} */ hexChars = [];
        for (var /** @type {?} */ i = 0; i < wordArray.sigBytes; i++) {
            var /** @type {?} */ bite = (wordArray.words[i >>> 2] >>> (24 - (i % 4) * 8)) & 0xff;
            hexChars.push((bite >>> 4).toString(16));
            hexChars.push((bite & 0x0f).toString(16));
        }
        return hexChars.join('');
    };
    /**
     * Converts a hex string to a word array.
     *
     * \@example
     *
     *     let wordArray = Hex.parse(hexString);
     * @param {?} hexStr The hex string.
     *
     * @return {?} The word array.
     *
     */
    Hex.parse = /**
     * Converts a hex string to a word array.
     *
     * \@example
     *
     *     let wordArray = Hex.parse(hexString);
     * @param {?} hexStr The hex string.
     *
     * @return {?} The word array.
     *
     */
    function (hexStr) {
        // Shortcut
        var /** @type {?} */ hexStrLength = hexStr.length;
        // Convert
        var /** @type {?} */ words = [];
        for (var /** @type {?} */ i = 0; i < hexStrLength; i += 2) {
            words[i >>> 3] |= parseInt(hexStr.substr(i, 2), 16) << (24 - (i % 8) * 4);
        }
        return new WordArray(words, hexStrLength / 2);
    };
    return Hex;
}());

/**
 * @fileoverview added by tsickle
 * @suppress {checkTypes} checked by tsc
 */
var WordArray = /** @class */ (function () {
    /**
     * Initializes a newly created word array.
     *
     * @param words (Optional) An array of 32-bit words.
     * @param sigBytes (Optional) The number of significant bytes in the words.
     *
     * @example
     *
     *     let wordArray = new WordArray();
     *     let wordArray = new WordArray([0x00010203, 0x04050607]);
     *     let wordArray = new WordArray([0x00010203, 0x04050607], 6);
     */
    function WordArray(words, sigBytes) {
        this.words = words || [];
        if (sigBytes !== undefined) {
            this.sigBytes = sigBytes;
        }
        else {
            this.sigBytes = this.words.length * 4;
        }
    }
    /**
     * Creates a word array filled with random bytes.
     *
     * \@example
     *
     *     let wordArray = WordArray.random(16);
     * @param {?} nBytes The number of random bytes to generate.
     *
     * @return {?} The random word array.
     *
     */
    WordArray.random = /**
     * Creates a word array filled with random bytes.
     *
     * \@example
     *
     *     let wordArray = WordArray.random(16);
     * @param {?} nBytes The number of random bytes to generate.
     *
     * @return {?} The random word array.
     *
     */
    function (nBytes) {
        var /** @type {?} */ words = [];
        var /** @type {?} */ r = (function (m_w) {
            var /** @type {?} */ m_z = 0x3ade68b1;
            var /** @type {?} */ mask = 0xffffffff;
            return function () {
                m_z = (0x9069 * (m_z & 0xFFFF) + (m_z >> 0x10)) & mask;
                m_w = (0x4650 * (m_w & 0xFFFF) + (m_w >> 0x10)) & mask;
                var /** @type {?} */ result = ((m_z << 0x10) + m_w) & mask;
                result /= 0x100000000;
                result += 0.5;
                return result * (Math.random() > .5 ? 1 : -1);
            };
        });
        for (var /** @type {?} */ i = 0, /** @type {?} */ rcache = void 0; i < nBytes; i += 4) {
            var /** @type {?} */ _r = r((rcache || Math.random()) * 0x100000000);
            rcache = _r() * 0x3ade67b7;
            words.push((_r() * 0x100000000) | 0);
        }
        return new WordArray(words, nBytes);
    };
    /**
     * Converts this word array to a string.
     *
     * @param encoder (Optional) The encoding strategy to use. Default: CryptoJS.enc.Hex
     *
     * @return The stringified word array.
     *
     * @example
     *
     *     let string = wordArray + '';
     *     let string = wordArray.toString();
     *     let string = wordArray.toString(CryptoJS.enc.Utf8);
     */
    /**
     * Converts this word array to a string.
     *
     * \@example
     *
     *     let string = wordArray + '';
     *     let string = wordArray.toString();
     *     let string = wordArray.toString(CryptoJS.enc.Utf8);
     * @param {?=} encoder (Optional) The encoding strategy to use. Default: CryptoJS.enc.Hex
     *
     * @return {?} The stringified word array.
     *
     */
    WordArray.prototype.toString = /**
     * Converts this word array to a string.
     *
     * \@example
     *
     *     let string = wordArray + '';
     *     let string = wordArray.toString();
     *     let string = wordArray.toString(CryptoJS.enc.Utf8);
     * @param {?=} encoder (Optional) The encoding strategy to use. Default: CryptoJS.enc.Hex
     *
     * @return {?} The stringified word array.
     *
     */
    function (encoder) {
        return (encoder || Hex).stringify(this);
    };
    /**
     * Concatenates a word array to this word array.
     *
     * @param wordArray The word array to append.
     *
     * @return This word array.
     *
     * @example
     *
     *     wordArray1.concat(wordArray2);
     */
    /**
     * Concatenates a word array to this word array.
     *
     * \@example
     *
     *     wordArray1.concat(wordArray2);
     * @param {?} wordArray The word array to append.
     *
     * @return {?} This word array.
     *
     */
    WordArray.prototype.concat = /**
     * Concatenates a word array to this word array.
     *
     * \@example
     *
     *     wordArray1.concat(wordArray2);
     * @param {?} wordArray The word array to append.
     *
     * @return {?} This word array.
     *
     */
    function (wordArray) {
        // Clamp excess bits
        this.clamp();
        // Concat
        if (this.sigBytes % 4) {
            // Copy one byte at a time
            for (var /** @type {?} */ i = 0; i < wordArray.sigBytes; i++) {
                var /** @type {?} */ thatByte = (wordArray.words[i >>> 2] >>> (24 - (i % 4) * 8)) & 0xff;
                this.words[(this.sigBytes + i) >>> 2] |= thatByte << (24 - ((this.sigBytes + i) % 4) * 8);
            }
        }
        else {
            // Copy one word at a time
            for (var /** @type {?} */ i = 0; i < wordArray.sigBytes; i += 4) {
                this.words[(this.sigBytes + i) >>> 2] = wordArray.words[i >>> 2];
            }
        }
        this.sigBytes += wordArray.sigBytes;
        // Chainable
        return this;
    };
    /**
     * Removes insignificant bits.
     *
     * @example
     *
     *     wordArray.clamp();
     */
    /**
     * Removes insignificant bits.
     *
     * \@example
     *
     *     wordArray.clamp();
     * @return {?}
     */
    WordArray.prototype.clamp = /**
     * Removes insignificant bits.
     *
     * \@example
     *
     *     wordArray.clamp();
     * @return {?}
     */
    function () {
        // Clamp
        this.words[this.sigBytes >>> 2] &= 0xffffffff << (32 - (this.sigBytes % 4) * 8);
        this.words.length = Math.ceil(this.sigBytes / 4);
    };
    /**
     * Creates a copy of this word array.
     *
     * @return The clone.
     *
     * @example
     *
     *     let clone = wordArray.clone();
     */
    /**
     * Creates a copy of this word array.
     *
     * \@example
     *
     *     let clone = wordArray.clone();
     * @return {?} The clone.
     *
     */
    WordArray.prototype.clone = /**
     * Creates a copy of this word array.
     *
     * \@example
     *
     *     let clone = wordArray.clone();
     * @return {?} The clone.
     *
     */
    function () {
        return new WordArray(this.words.slice(0), this.sigBytes);
    };
    return WordArray;
}());

/**
 * @fileoverview added by tsickle
 * @suppress {checkTypes} checked by tsc
 */
var Latin1 = /** @class */ (function () {
    function Latin1() {
    }
    /**
     * Converts a word array to a Latin1 string.
     *
     * \@example
     *
     *     let latin1String = Latin1.stringify(wordArray);
     * @param {?} wordArray The word array.
     *
     * @return {?} The Latin1 string.
     *
     */
    Latin1.stringify = /**
     * Converts a word array to a Latin1 string.
     *
     * \@example
     *
     *     let latin1String = Latin1.stringify(wordArray);
     * @param {?} wordArray The word array.
     *
     * @return {?} The Latin1 string.
     *
     */
    function (wordArray) {
        // Convert
        var /** @type {?} */ latin1Chars = [];
        for (var /** @type {?} */ i = 0; i < wordArray.sigBytes; i++) {
            var /** @type {?} */ bite = (wordArray.words[i >>> 2] >>> (24 - (i % 4) * 8)) & 0xff;
            latin1Chars.push(String.fromCharCode(bite));
        }
        return latin1Chars.join('');
    };
    /**
     * Converts a Latin1 string to a word array.
     *
     * \@example
     *
     *     let wordArray = Latin1.parse(latin1String);
     * @param {?} latin1Str The Latin1 string.
     *
     * @return {?} The word array.
     *
     */
    Latin1.parse = /**
     * Converts a Latin1 string to a word array.
     *
     * \@example
     *
     *     let wordArray = Latin1.parse(latin1String);
     * @param {?} latin1Str The Latin1 string.
     *
     * @return {?} The word array.
     *
     */
    function (latin1Str) {
        // Shortcut
        var /** @type {?} */ latin1StrLength = latin1Str.length;
        // Convert
        var /** @type {?} */ words = [];
        for (var /** @type {?} */ i = 0; i < latin1StrLength; i++) {
            words[i >>> 2] |= (latin1Str.charCodeAt(i) & 0xff) << (24 - (i % 4) * 8);
        }
        return new WordArray(words, latin1StrLength);
    };
    return Latin1;
}());

/**
 * @fileoverview added by tsickle
 * @suppress {checkTypes} checked by tsc
 */
var Utf8 = /** @class */ (function () {
    function Utf8() {
    }
    /**
     * Converts a word array to a UTF-8 string.
     *
     * \@example
     *
     *     let utf8String = Utf8.stringify(wordArray);
     * @param {?} wordArray The word array.
     *
     * @return {?} The UTF-8 string.
     *
     */
    Utf8.stringify = /**
     * Converts a word array to a UTF-8 string.
     *
     * \@example
     *
     *     let utf8String = Utf8.stringify(wordArray);
     * @param {?} wordArray The word array.
     *
     * @return {?} The UTF-8 string.
     *
     */
    function (wordArray) {
        try {
            return decodeURIComponent(escape(Latin1.stringify(wordArray)));
        }
        catch (/** @type {?} */ e) {
            throw new Error('Malformed UTF-8 data');
        }
    };
    /**
     * Converts a UTF-8 string to a word array.
     *
     * \@example
     *
     *     let wordArray = Utf8.parse(utf8String);
     * @param {?} utf8Str The UTF-8 string.
     *
     * @return {?} The word array.
     *
     */
    Utf8.parse = /**
     * Converts a UTF-8 string to a word array.
     *
     * \@example
     *
     *     let wordArray = Utf8.parse(utf8String);
     * @param {?} utf8Str The UTF-8 string.
     *
     * @return {?} The word array.
     *
     */
    function (utf8Str) {
        return Latin1.parse(unescape(encodeURIComponent(utf8Str)));
    };
    return Utf8;
}());

/**
 * @fileoverview added by tsickle
 * @suppress {checkTypes} checked by tsc
 */
/**
 * @abstract
 */
var  /**
 * @abstract
 */
BufferedBlockAlgorithm = /** @class */ (function () {
    function BufferedBlockAlgorithm(cfg) {
        this._minBufferSize = 0;
        this.cfg = Object.assign({
            blockSize: 1
        }, cfg);
        // Initial values
        this._data = new WordArray();
        this._nDataBytes = 0;
    }
    /**
     * Resets this block algorithm's data buffer to its initial state.
     *
     * @example
     *
     *     bufferedBlockAlgorithm.reset();
     */
    /**
     * Resets this block algorithm's data buffer to its initial state.
     *
     * \@example
     *
     *     bufferedBlockAlgorithm.reset();
     * @return {?}
     */
    BufferedBlockAlgorithm.prototype.reset = /**
     * Resets this block algorithm's data buffer to its initial state.
     *
     * \@example
     *
     *     bufferedBlockAlgorithm.reset();
     * @return {?}
     */
    function () {
        // Initial values
        this._data = new WordArray();
        this._nDataBytes = 0;
    };
    /**
     * Adds new data to this block algorithm's buffer.
     *
     * @param data The data to append. Strings are converted to a WordArray using UTF-8.
     *
     * @example
     *
     *     bufferedBlockAlgorithm._append('data');
     *     bufferedBlockAlgorithm._append(wordArray);
     */
    /**
     * Adds new data to this block algorithm's buffer.
     *
     * \@example
     *
     *     bufferedBlockAlgorithm._append('data');
     *     bufferedBlockAlgorithm._append(wordArray);
     * @param {?} data The data to append. Strings are converted to a WordArray using UTF-8.
     *
     * @return {?}
     */
    BufferedBlockAlgorithm.prototype._append = /**
     * Adds new data to this block algorithm's buffer.
     *
     * \@example
     *
     *     bufferedBlockAlgorithm._append('data');
     *     bufferedBlockAlgorithm._append(wordArray);
     * @param {?} data The data to append. Strings are converted to a WordArray using UTF-8.
     *
     * @return {?}
     */
    function (data) {
        // Convert string to WordArray, else assume WordArray already
        if (typeof data === 'string') {
            data = Utf8.parse(data);
        }
        // Append
        this._data.concat(data);
        this._nDataBytes += data.sigBytes;
    };
    /**
     * Processes available data blocks.
     *
     * This method invokes _doProcessBlock(offset), which must be implemented by a concrete subtype.
     *
     * @param doFlush Whether all blocks and partial blocks should be processed.
     *
     * @return The processed data.
     *
     * @example
     *
     *     let processedData = bufferedBlockAlgorithm._process();
     *     let processedData = bufferedBlockAlgorithm._process(!!'flush');
     */
    /**
     * Processes available data blocks.
     *
     * This method invokes _doProcessBlock(offset), which must be implemented by a concrete subtype.
     *
     * \@example
     *
     *     let processedData = bufferedBlockAlgorithm._process();
     *     let processedData = bufferedBlockAlgorithm._process(!!'flush');
     * @param {?=} doFlush Whether all blocks and partial blocks should be processed.
     *
     * @return {?} The processed data.
     *
     */
    BufferedBlockAlgorithm.prototype._process = /**
     * Processes available data blocks.
     *
     * This method invokes _doProcessBlock(offset), which must be implemented by a concrete subtype.
     *
     * \@example
     *
     *     let processedData = bufferedBlockAlgorithm._process();
     *     let processedData = bufferedBlockAlgorithm._process(!!'flush');
     * @param {?=} doFlush Whether all blocks and partial blocks should be processed.
     *
     * @return {?} The processed data.
     *
     */
    function (doFlush) {
        if (!this.cfg.blockSize) {
            throw new Error('missing blockSize in config');
        }
        // Shortcuts
        var /** @type {?} */ blockSizeBytes = this.cfg.blockSize * 4;
        // Count blocks ready
        var /** @type {?} */ nBlocksReady = this._data.sigBytes / blockSizeBytes;
        if (doFlush) {
            // Round up to include partial blocks
            nBlocksReady = Math.ceil(nBlocksReady);
        }
        else {
            // Round down to include only full blocks,
            // less the number of blocks that must remain in the buffer
            nBlocksReady = Math.max((nBlocksReady | 0) - this._minBufferSize, 0);
        }
        // Count words ready
        var /** @type {?} */ nWordsReady = nBlocksReady * this.cfg.blockSize;
        // Count bytes ready
        var /** @type {?} */ nBytesReady = Math.min(nWordsReady * 4, this._data.sigBytes);
        // Process blocks
        var /** @type {?} */ processedWords;
        if (nWordsReady) {
            for (var /** @type {?} */ offset = 0; offset < nWordsReady; offset += this.cfg.blockSize) {
                // Perform concrete-algorithm logic
                this._doProcessBlock(this._data.words, offset);
            }
            // Remove processed words
            processedWords = this._data.words.splice(0, nWordsReady);
            this._data.sigBytes -= nBytesReady;
        }
        // Return processed words
        return new WordArray(processedWords, nBytesReady);
    };
    /**
     * Creates a copy of this object.
     *
     * @return The clone.
     *
     * @example
     *
     *     let clone = bufferedBlockAlgorithm.clone();
     */
    /**
     * Creates a copy of this object.
     *
     * \@example
     *
     *     let clone = bufferedBlockAlgorithm.clone();
     * @return {?} The clone.
     *
     */
    BufferedBlockAlgorithm.prototype.clone = /**
     * Creates a copy of this object.
     *
     * \@example
     *
     *     let clone = bufferedBlockAlgorithm.clone();
     * @return {?} The clone.
     *
     */
    function () {
        var /** @type {?} */ clone = this.constructor();
        for (var /** @type {?} */ attr in this) {
            if (this.hasOwnProperty(attr)) {
                clone[attr] = this[attr];
            }
        }
        clone._data = this._data.clone();
        return clone;
    };
    return BufferedBlockAlgorithm;
}());

/**
 * @fileoverview added by tsickle
 * @suppress {checkTypes} checked by tsc
 */
var Base = /** @class */ (function () {
    function Base() {
    }
    return Base;
}());

/**
 * @fileoverview added by tsickle
 * @suppress {checkTypes} checked by tsc
 */
var CipherParams = /** @class */ (function (_super) {
    (0,tslib__WEBPACK_IMPORTED_MODULE_0__.__extends)(CipherParams, _super);
    function CipherParams(cipherParams) {
        var _this = _super.call(this) || this;
        _this.ciphertext = cipherParams.ciphertext;
        _this.key = cipherParams.key;
        _this.iv = cipherParams.iv;
        _this.salt = cipherParams.salt;
        _this.algorithm = cipherParams.algorithm;
        _this.mode = cipherParams.mode;
        _this.padding = cipherParams.padding;
        _this.blockSize = cipherParams.blockSize;
        _this.formatter = cipherParams.formatter;
        return _this;
    }
    /**
     * @param {?} additionalParams
     * @return {?}
     */
    CipherParams.prototype.extend = /**
     * @param {?} additionalParams
     * @return {?}
     */
    function (additionalParams) {
        if (additionalParams.ciphertext !== undefined) {
            this.ciphertext = additionalParams.ciphertext;
        }
        if (additionalParams.key !== undefined) {
            this.key = additionalParams.key;
        }
        if (additionalParams.iv !== undefined) {
            this.iv = additionalParams.iv;
        }
        if (additionalParams.salt !== undefined) {
            this.salt = additionalParams.salt;
        }
        if (additionalParams.algorithm !== undefined) {
            this.algorithm = additionalParams.algorithm;
        }
        if (additionalParams.mode !== undefined) {
            this.mode = additionalParams.mode;
        }
        if (additionalParams.padding !== undefined) {
            this.padding = additionalParams.padding;
        }
        if (additionalParams.blockSize !== undefined) {
            this.blockSize = additionalParams.blockSize;
        }
        if (additionalParams.formatter !== undefined) {
            this.formatter = additionalParams.formatter;
        }
        return this;
    };
    /**
     * Converts this cipher params object to a string.
     *
     * @throws Error If neither the formatter nor the default formatter is set.
     *
     * \@example
     *
     *     let string = cipherParams + '';
     *     let string = cipherParams.toString();
     *     let string = cipherParams.toString(CryptoJS.format.OpenSSL);
     * @param {?=} formatter (Optional) The formatting strategy to use.
     *
     * @return {?} The stringified cipher params.
     *
     */
    CipherParams.prototype.toString = /**
     * Converts this cipher params object to a string.
     *
     * @throws Error If neither the formatter nor the default formatter is set.
     *
     * \@example
     *
     *     let string = cipherParams + '';
     *     let string = cipherParams.toString();
     *     let string = cipherParams.toString(CryptoJS.format.OpenSSL);
     * @param {?=} formatter (Optional) The formatting strategy to use.
     *
     * @return {?} The stringified cipher params.
     *
     */
    function (formatter) {
        if (formatter) {
            return formatter.stringify(this);
        }
        else if (this.formatter) {
            return this.formatter.stringify(this);
        }
        else {
            throw new Error('cipher needs a formatter to be able to convert the result into a string');
        }
    };
    return CipherParams;
}(Base));

/**
 * @fileoverview added by tsickle
 * @suppress {checkTypes} checked by tsc
 */
var Base64 = /** @class */ (function () {
    function Base64() {
    }
    /**
     * Converts a word array to a Base64 string.
     *
     * \@example
     *
     *     let base64String = Base64.stringify(wordArray);
     * @param {?} wordArray The word array.
     *
     * @return {?} The Base64 string.
     *
     */
    Base64.stringify = /**
     * Converts a word array to a Base64 string.
     *
     * \@example
     *
     *     let base64String = Base64.stringify(wordArray);
     * @param {?} wordArray The word array.
     *
     * @return {?} The Base64 string.
     *
     */
    function (wordArray) {
        // Clamp excess bits
        wordArray.clamp();
        // Convert
        var /** @type {?} */ base64Chars = [];
        for (var /** @type {?} */ i = 0; i < wordArray.sigBytes; i += 3) {
            var /** @type {?} */ byte1 = (wordArray.words[i >>> 2] >>> (24 - (i % 4) * 8)) & 0xff;
            var /** @type {?} */ byte2 = (wordArray.words[(i + 1) >>> 2] >>> (24 - ((i + 1) % 4) * 8)) & 0xff;
            var /** @type {?} */ byte3 = (wordArray.words[(i + 2) >>> 2] >>> (24 - ((i + 2) % 4) * 8)) & 0xff;
            var /** @type {?} */ triplet = (byte1 << 16) | (byte2 << 8) | byte3;
            for (var /** @type {?} */ j = 0; (j < 4) && (i + j * 0.75 < wordArray.sigBytes); j++) {
                base64Chars.push(this._map.charAt((triplet >>> (6 * (3 - j))) & 0x3f));
            }
        }
        // Add padding
        var /** @type {?} */ paddingChar = this._map.charAt(64);
        if (paddingChar) {
            while (base64Chars.length % 4) {
                base64Chars.push(paddingChar);
            }
        }
        return base64Chars.join('');
    };
    /**
     * Converts a Base64 string to a word array.
     *
     * \@example
     *
     *     let wordArray = Base64.parse(base64String);
     * @param {?} base64Str The Base64 string.
     *
     * @return {?} The word array.
     *
     */
    Base64.parse = /**
     * Converts a Base64 string to a word array.
     *
     * \@example
     *
     *     let wordArray = Base64.parse(base64String);
     * @param {?} base64Str The Base64 string.
     *
     * @return {?} The word array.
     *
     */
    function (base64Str) {
        // Shortcuts
        var /** @type {?} */ base64StrLength = base64Str.length;
        if (this._reverseMap === undefined) {
            this._reverseMap = [];
            for (var /** @type {?} */ j = 0; j < this._map.length; j++) {
                this._reverseMap[this._map.charCodeAt(j)] = j;
            }
        }
        // Ignore padding
        var /** @type {?} */ paddingChar = this._map.charAt(64);
        if (paddingChar) {
            var /** @type {?} */ paddingIndex = base64Str.indexOf(paddingChar);
            if (paddingIndex !== -1) {
                base64StrLength = paddingIndex;
            }
        }
        // Convert
        return this.parseLoop(base64Str, base64StrLength, this._reverseMap);
    };
    /**
     * @param {?} base64Str
     * @param {?} base64StrLength
     * @param {?} reverseMap
     * @return {?}
     */
    Base64.parseLoop = /**
     * @param {?} base64Str
     * @param {?} base64StrLength
     * @param {?} reverseMap
     * @return {?}
     */
    function (base64Str, base64StrLength, reverseMap) {
        var /** @type {?} */ words = [];
        var /** @type {?} */ nBytes = 0;
        for (var /** @type {?} */ i = 0; i < base64StrLength; i++) {
            if (i % 4) {
                var /** @type {?} */ bits1 = reverseMap[base64Str.charCodeAt(i - 1)] << ((i % 4) * 2);
                var /** @type {?} */ bits2 = reverseMap[base64Str.charCodeAt(i)] >>> (6 - (i % 4) * 2);
                words[nBytes >>> 2] |= (bits1 | bits2) << (24 - (nBytes % 4) * 8);
                nBytes++;
            }
        }
        return new WordArray(words, nBytes);
    };
    Base64._map = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/=';
    Base64._reverseMap = undefined;
    return Base64;
}());

/**
 * @fileoverview added by tsickle
 * @suppress {checkTypes} checked by tsc
 */
var OpenSSL = /** @class */ (function () {
    function OpenSSL() {
    }
    /**
     * Converts a cipher params object to an OpenSSL-compatible string.
     *
     * \@example
     *
     *     let openSSLString = OpenSSLFormatter.stringify(cipherParams);
     * @param {?} cipherParams The cipher params object.
     *
     * @return {?} The OpenSSL-compatible string.
     *
     */
    OpenSSL.stringify = /**
     * Converts a cipher params object to an OpenSSL-compatible string.
     *
     * \@example
     *
     *     let openSSLString = OpenSSLFormatter.stringify(cipherParams);
     * @param {?} cipherParams The cipher params object.
     *
     * @return {?} The OpenSSL-compatible string.
     *
     */
    function (cipherParams) {
        if (!cipherParams.ciphertext) {
            throw new Error('missing ciphertext in params');
        }
        // Shortcuts
        var /** @type {?} */ ciphertext = cipherParams.ciphertext;
        var /** @type {?} */ salt = cipherParams.salt;
        // Format
        var /** @type {?} */ wordArray;
        if (salt) {
            if (typeof salt === 'string') {
                throw new Error('salt is expected to be a WordArray');
            }
            wordArray = (new WordArray([0x53616c74, 0x65645f5f])).concat(salt).concat(ciphertext);
        }
        else {
            wordArray = ciphertext;
        }
        return wordArray.toString(Base64);
    };
    /**
     * Converts an OpenSSL-compatible string to a cipher params object.
     *
     * \@example
     *
     *     let cipherParams = OpenSSLFormatter.parse(openSSLString);
     * @param {?} openSSLStr The OpenSSL-compatible string.
     *
     * @return {?} The cipher params object.
     *
     */
    OpenSSL.parse = /**
     * Converts an OpenSSL-compatible string to a cipher params object.
     *
     * \@example
     *
     *     let cipherParams = OpenSSLFormatter.parse(openSSLString);
     * @param {?} openSSLStr The OpenSSL-compatible string.
     *
     * @return {?} The cipher params object.
     *
     */
    function (openSSLStr) {
        // Parse base64
        var /** @type {?} */ ciphertext = Base64.parse(openSSLStr);
        // Test for salt
        var /** @type {?} */ salt;
        if (ciphertext.words[0] === 0x53616c74 && ciphertext.words[1] === 0x65645f5f) {
            // Extract salt
            salt = new WordArray(ciphertext.words.slice(2, 4));
            // Remove salt from ciphertext
            ciphertext.words.splice(0, 4);
            ciphertext.sigBytes -= 16;
        }
        return new CipherParams({ ciphertext: ciphertext, salt: salt });
    };
    return OpenSSL;
}());

/**
 * @fileoverview added by tsickle
 * @suppress {checkTypes} checked by tsc
 */
var SerializableCipher = /** @class */ (function () {
    function SerializableCipher() {
    }
    /**
     * Encrypts a message.
     *
     * \@example
     *
     *     let ciphertextParams = SerializableCipher.encrypt(CryptoJS.algo.AES, message, key);
     *     let ciphertextParams = SerializableCipher.encrypt(CryptoJS.algo.AES, message, key, { iv: iv });
     *     let ciphertextParams = SerializableCipher.encrypt(CryptoJS.algo.AES, message, key, {
     *       iv: iv,
     *       format: CryptoJS.format.OpenSSL
     *     });
     * @param {?} cipher The cipher algorithm to use.
     * @param {?} message The message to encrypt.
     * @param {?} key The key.
     * @param {?=} cfg (Optional) The configuration options to use for this operation.
     *
     * @return {?} A cipher params object.
     *
     */
    SerializableCipher.encrypt = /**
     * Encrypts a message.
     *
     * \@example
     *
     *     let ciphertextParams = SerializableCipher.encrypt(CryptoJS.algo.AES, message, key);
     *     let ciphertextParams = SerializableCipher.encrypt(CryptoJS.algo.AES, message, key, { iv: iv });
     *     let ciphertextParams = SerializableCipher.encrypt(CryptoJS.algo.AES, message, key, {
     *       iv: iv,
     *       format: CryptoJS.format.OpenSSL
     *     });
     * @param {?} cipher The cipher algorithm to use.
     * @param {?} message The message to encrypt.
     * @param {?} key The key.
     * @param {?=} cfg (Optional) The configuration options to use for this operation.
     *
     * @return {?} A cipher params object.
     *
     */
    function (cipher, message, key, cfg) {
        // Apply config defaults
        var /** @type {?} */ config = Object.assign({}, this.cfg, cfg);
        // Encrypt
        var /** @type {?} */ encryptor = cipher.createEncryptor(key, config);
        var /** @type {?} */ ciphertext = encryptor.finalize(message);
        // Create and return serializable cipher params
        return new CipherParams({
            ciphertext: ciphertext,
            key: key,
            iv: encryptor.cfg.iv,
            algorithm: cipher,
            mode: (/** @type {?} */ (encryptor.cfg)).mode,
            padding: (/** @type {?} */ (encryptor.cfg)).padding,
            blockSize: encryptor.cfg.blockSize,
            formatter: config.format
        });
    };
    /**
     * Decrypts serialized ciphertext.
     *
     * \@example
     *
     *     let plaintext = SerializableCipher.decrypt(
     *         AESAlgorithm,
     *         formattedCiphertext,
     *         key, {
     *             iv: iv,
     *             format: CryptoJS.format.OpenSSL
     *         }
     *     );
     *
     *     let plaintext = SerializableCipher.decrypt(
     *         AESAlgorithm,
     *         ciphertextParams,
     *         key, {
     *             iv: iv,
     *             format: CryptoJS.format.OpenSSL
     *         }
     *     );
     * @param {?} cipher The cipher algorithm to use.
     * @param {?} ciphertext The ciphertext to decrypt.
     * @param {?} key The key.
     * @param {?=} optionalCfg
     * @return {?} The plaintext.
     *
     */
    SerializableCipher.decrypt = /**
     * Decrypts serialized ciphertext.
     *
     * \@example
     *
     *     let plaintext = SerializableCipher.decrypt(
     *         AESAlgorithm,
     *         formattedCiphertext,
     *         key, {
     *             iv: iv,
     *             format: CryptoJS.format.OpenSSL
     *         }
     *     );
     *
     *     let plaintext = SerializableCipher.decrypt(
     *         AESAlgorithm,
     *         ciphertextParams,
     *         key, {
     *             iv: iv,
     *             format: CryptoJS.format.OpenSSL
     *         }
     *     );
     * @param {?} cipher The cipher algorithm to use.
     * @param {?} ciphertext The ciphertext to decrypt.
     * @param {?} key The key.
     * @param {?=} optionalCfg
     * @return {?} The plaintext.
     *
     */
    function (cipher, ciphertext, key, optionalCfg) {
        // Apply config defaults
        var /** @type {?} */ cfg = Object.assign({}, this.cfg, optionalCfg);
        if (!cfg.format) {
            throw new Error('could not determine format');
        }
        // Convert string to CipherParams
        ciphertext = this._parse(ciphertext, cfg.format);
        if (!ciphertext.ciphertext) {
            throw new Error('could not determine ciphertext');
        }
        // Decrypt
        var /** @type {?} */ plaintext = cipher.createDecryptor(key, cfg).finalize(ciphertext.ciphertext);
        return plaintext;
    };
    /**
     * Converts serialized ciphertext to CipherParams,
     * else assumed CipherParams already and returns ciphertext unchanged.
     *
     * \@example
     *
     *     var ciphertextParams = CryptoJS.lib.SerializableCipher._parse(ciphertextStringOrParams, format);
     * @param {?} ciphertext The ciphertext.
     * @param {?} format The formatting strategy to use to parse serialized ciphertext.
     *
     * @return {?} The unserialized ciphertext.
     *
     */
    SerializableCipher._parse = /**
     * Converts serialized ciphertext to CipherParams,
     * else assumed CipherParams already and returns ciphertext unchanged.
     *
     * \@example
     *
     *     var ciphertextParams = CryptoJS.lib.SerializableCipher._parse(ciphertextStringOrParams, format);
     * @param {?} ciphertext The ciphertext.
     * @param {?} format The formatting strategy to use to parse serialized ciphertext.
     *
     * @return {?} The unserialized ciphertext.
     *
     */
    function (ciphertext, format) {
        if (typeof ciphertext === 'string') {
            return format.parse(ciphertext);
        }
        else {
            return ciphertext;
        }
    };
    SerializableCipher.cfg = {
        blockSize: 4,
        iv: new WordArray([]),
        format: OpenSSL
    };
    return SerializableCipher;
}());

/**
 * @fileoverview added by tsickle
 * @suppress {checkTypes} checked by tsc
 */
/**
 * @abstract
 */
var  /**
 * @abstract
 */
Hasher = /** @class */ (function (_super) {
    (0,tslib__WEBPACK_IMPORTED_MODULE_0__.__extends)(Hasher, _super);
    function Hasher(cfg) {
        var _this = 
        // Apply config defaults
        _super.call(this, Object.assign({
            blockSize: 512 / 32
        }, cfg)) || this;
        // Set initial values
        // Set initial values
        _this.reset();
        return _this;
    }
    /**
     * Creates a shortcut function to a hasher's object interface.
     *
     * \@example
     *
     *     let SHA256 = Hasher._createHelper(SHA256);
     * @param {?} hasher The hasher to create a helper for.
     *
     * @return {?} The shortcut function.
     *
     */
    Hasher._createHelper = /**
     * Creates a shortcut function to a hasher's object interface.
     *
     * \@example
     *
     *     let SHA256 = Hasher._createHelper(SHA256);
     * @param {?} hasher The hasher to create a helper for.
     *
     * @return {?} The shortcut function.
     *
     */
    function (hasher) {
        /**
         * @param {?} message
         * @param {?=} cfg
         * @return {?}
         */
        function helper(message, cfg) {
            var /** @type {?} */ hasherClass = hasher;
            var /** @type {?} */ hasherInstance = new hasherClass(cfg);
            return hasherInstance.finalize(message);
        }
        return helper;
    };
    /**
     * Updates this hasher with a message.
     *
     * @param messageUpdate The message to append.
     *
     * @return This hasher.
     *
     * @example
     *
     *     hasher.update('message');
     *     hasher.update(wordArray);
     */
    /**
     * Updates this hasher with a message.
     *
     * \@example
     *
     *     hasher.update('message');
     *     hasher.update(wordArray);
     * @param {?} messageUpdate The message to append.
     *
     * @return {?} This hasher.
     *
     */
    Hasher.prototype.update = /**
     * Updates this hasher with a message.
     *
     * \@example
     *
     *     hasher.update('message');
     *     hasher.update(wordArray);
     * @param {?} messageUpdate The message to append.
     *
     * @return {?} This hasher.
     *
     */
    function (messageUpdate) {
        // Append
        this._append(messageUpdate);
        // Update the hash
        this._process();
        // Chainable
        return this;
    };
    /**
     * Finalizes the hash computation.
     * Note that the finalize operation is effectively a destructive, read-once operation.
     *
     * \@example
     *
     *     let hash = hasher.finalize();
     *     let hash = hasher.finalize('message');
     *     let hash = hasher.finalize(wordArray);
     * @param {?} messageUpdate (Optional) A final message update.
     *
     * @return {?} The hash.
     *
     */
    Hasher.prototype.finalize = /**
     * Finalizes the hash computation.
     * Note that the finalize operation is effectively a destructive, read-once operation.
     *
     * \@example
     *
     *     let hash = hasher.finalize();
     *     let hash = hasher.finalize('message');
     *     let hash = hasher.finalize(wordArray);
     * @param {?} messageUpdate (Optional) A final message update.
     *
     * @return {?} The hash.
     *
     */
    function (messageUpdate) {
        // Final message update
        if (messageUpdate) {
            this._append(messageUpdate);
        }
        // Perform concrete-hasher logic
        var /** @type {?} */ hash = this._doFinalize();
        return hash;
    };
    return Hasher;
}(BufferedBlockAlgorithm));

/**
 * @fileoverview added by tsickle
 * @suppress {checkTypes} checked by tsc
 */
// Constants table
var /** @type {?} */ T = [];
// Compute constants
for (var /** @type {?} */ i = 0; i < 64; i++) {
    T[i] = (Math.abs(Math.sin(i + 1)) * 0x100000000) | 0;
}
var MD5 = /** @class */ (function (_super) {
    (0,tslib__WEBPACK_IMPORTED_MODULE_0__.__extends)(MD5, _super);
    function MD5() {
        return _super !== null && _super.apply(this, arguments) || this;
    }
    /**
     * @param {?} a
     * @param {?} b
     * @param {?} c
     * @param {?} d
     * @param {?} x
     * @param {?} s
     * @param {?} t
     * @return {?}
     */
    MD5.FF = /**
     * @param {?} a
     * @param {?} b
     * @param {?} c
     * @param {?} d
     * @param {?} x
     * @param {?} s
     * @param {?} t
     * @return {?}
     */
    function (a, b, c, d, x, s, t) {
        var /** @type {?} */ n = a + ((b & c) | (~b & d)) + x + t;
        return ((n << s) | (n >>> (32 - s))) + b;
    };
    /**
     * @param {?} a
     * @param {?} b
     * @param {?} c
     * @param {?} d
     * @param {?} x
     * @param {?} s
     * @param {?} t
     * @return {?}
     */
    MD5.GG = /**
     * @param {?} a
     * @param {?} b
     * @param {?} c
     * @param {?} d
     * @param {?} x
     * @param {?} s
     * @param {?} t
     * @return {?}
     */
    function (a, b, c, d, x, s, t) {
        var /** @type {?} */ n = a + ((b & d) | (c & ~d)) + x + t;
        return ((n << s) | (n >>> (32 - s))) + b;
    };
    /**
     * @param {?} a
     * @param {?} b
     * @param {?} c
     * @param {?} d
     * @param {?} x
     * @param {?} s
     * @param {?} t
     * @return {?}
     */
    MD5.HH = /**
     * @param {?} a
     * @param {?} b
     * @param {?} c
     * @param {?} d
     * @param {?} x
     * @param {?} s
     * @param {?} t
     * @return {?}
     */
    function (a, b, c, d, x, s, t) {
        var /** @type {?} */ n = a + (b ^ c ^ d) + x + t;
        return ((n << s) | (n >>> (32 - s))) + b;
    };
    /**
     * @param {?} a
     * @param {?} b
     * @param {?} c
     * @param {?} d
     * @param {?} x
     * @param {?} s
     * @param {?} t
     * @return {?}
     */
    MD5.II = /**
     * @param {?} a
     * @param {?} b
     * @param {?} c
     * @param {?} d
     * @param {?} x
     * @param {?} s
     * @param {?} t
     * @return {?}
     */
    function (a, b, c, d, x, s, t) {
        var /** @type {?} */ n = a + (c ^ (b | ~d)) + x + t;
        return ((n << s) | (n >>> (32 - s))) + b;
    };
    /**
     * @return {?}
     */
    MD5.prototype.reset = /**
     * @return {?}
     */
    function () {
        // reset core values
        _super.prototype.reset.call(this);
        this._hash = new WordArray([
            0x67452301, 0xefcdab89,
            0x98badcfe, 0x10325476
        ]);
    };
    /**
     * @param {?} M
     * @param {?} offset
     * @return {?}
     */
    MD5.prototype._doProcessBlock = /**
     * @param {?} M
     * @param {?} offset
     * @return {?}
     */
    function (M, offset) {
        // Swap endian
        for (var /** @type {?} */ i = 0; i < 16; i++) {
            // Shortcuts
            var /** @type {?} */ offset_i = offset + i;
            var /** @type {?} */ M_offset_i = M[offset_i];
            M[offset_i] = ((((M_offset_i << 8) | (M_offset_i >>> 24)) & 0x00ff00ff) |
                (((M_offset_i << 24) | (M_offset_i >>> 8)) & 0xff00ff00));
        }
        // Shortcuts
        var /** @type {?} */ H = this._hash.words;
        var /** @type {?} */ M_offset_0 = M[offset + 0];
        var /** @type {?} */ M_offset_1 = M[offset + 1];
        var /** @type {?} */ M_offset_2 = M[offset + 2];
        var /** @type {?} */ M_offset_3 = M[offset + 3];
        var /** @type {?} */ M_offset_4 = M[offset + 4];
        var /** @type {?} */ M_offset_5 = M[offset + 5];
        var /** @type {?} */ M_offset_6 = M[offset + 6];
        var /** @type {?} */ M_offset_7 = M[offset + 7];
        var /** @type {?} */ M_offset_8 = M[offset + 8];
        var /** @type {?} */ M_offset_9 = M[offset + 9];
        var /** @type {?} */ M_offset_10 = M[offset + 10];
        var /** @type {?} */ M_offset_11 = M[offset + 11];
        var /** @type {?} */ M_offset_12 = M[offset + 12];
        var /** @type {?} */ M_offset_13 = M[offset + 13];
        var /** @type {?} */ M_offset_14 = M[offset + 14];
        var /** @type {?} */ M_offset_15 = M[offset + 15];
        // Working variables
        var /** @type {?} */ a = H[0];
        var /** @type {?} */ b = H[1];
        var /** @type {?} */ c = H[2];
        var /** @type {?} */ d = H[3];
        // Computation
        a = MD5.FF(a, b, c, d, M_offset_0, 7, T[0]);
        d = MD5.FF(d, a, b, c, M_offset_1, 12, T[1]);
        c = MD5.FF(c, d, a, b, M_offset_2, 17, T[2]);
        b = MD5.FF(b, c, d, a, M_offset_3, 22, T[3]);
        a = MD5.FF(a, b, c, d, M_offset_4, 7, T[4]);
        d = MD5.FF(d, a, b, c, M_offset_5, 12, T[5]);
        c = MD5.FF(c, d, a, b, M_offset_6, 17, T[6]);
        b = MD5.FF(b, c, d, a, M_offset_7, 22, T[7]);
        a = MD5.FF(a, b, c, d, M_offset_8, 7, T[8]);
        d = MD5.FF(d, a, b, c, M_offset_9, 12, T[9]);
        c = MD5.FF(c, d, a, b, M_offset_10, 17, T[10]);
        b = MD5.FF(b, c, d, a, M_offset_11, 22, T[11]);
        a = MD5.FF(a, b, c, d, M_offset_12, 7, T[12]);
        d = MD5.FF(d, a, b, c, M_offset_13, 12, T[13]);
        c = MD5.FF(c, d, a, b, M_offset_14, 17, T[14]);
        b = MD5.FF(b, c, d, a, M_offset_15, 22, T[15]);
        a = MD5.GG(a, b, c, d, M_offset_1, 5, T[16]);
        d = MD5.GG(d, a, b, c, M_offset_6, 9, T[17]);
        c = MD5.GG(c, d, a, b, M_offset_11, 14, T[18]);
        b = MD5.GG(b, c, d, a, M_offset_0, 20, T[19]);
        a = MD5.GG(a, b, c, d, M_offset_5, 5, T[20]);
        d = MD5.GG(d, a, b, c, M_offset_10, 9, T[21]);
        c = MD5.GG(c, d, a, b, M_offset_15, 14, T[22]);
        b = MD5.GG(b, c, d, a, M_offset_4, 20, T[23]);
        a = MD5.GG(a, b, c, d, M_offset_9, 5, T[24]);
        d = MD5.GG(d, a, b, c, M_offset_14, 9, T[25]);
        c = MD5.GG(c, d, a, b, M_offset_3, 14, T[26]);
        b = MD5.GG(b, c, d, a, M_offset_8, 20, T[27]);
        a = MD5.GG(a, b, c, d, M_offset_13, 5, T[28]);
        d = MD5.GG(d, a, b, c, M_offset_2, 9, T[29]);
        c = MD5.GG(c, d, a, b, M_offset_7, 14, T[30]);
        b = MD5.GG(b, c, d, a, M_offset_12, 20, T[31]);
        a = MD5.HH(a, b, c, d, M_offset_5, 4, T[32]);
        d = MD5.HH(d, a, b, c, M_offset_8, 11, T[33]);
        c = MD5.HH(c, d, a, b, M_offset_11, 16, T[34]);
        b = MD5.HH(b, c, d, a, M_offset_14, 23, T[35]);
        a = MD5.HH(a, b, c, d, M_offset_1, 4, T[36]);
        d = MD5.HH(d, a, b, c, M_offset_4, 11, T[37]);
        c = MD5.HH(c, d, a, b, M_offset_7, 16, T[38]);
        b = MD5.HH(b, c, d, a, M_offset_10, 23, T[39]);
        a = MD5.HH(a, b, c, d, M_offset_13, 4, T[40]);
        d = MD5.HH(d, a, b, c, M_offset_0, 11, T[41]);
        c = MD5.HH(c, d, a, b, M_offset_3, 16, T[42]);
        b = MD5.HH(b, c, d, a, M_offset_6, 23, T[43]);
        a = MD5.HH(a, b, c, d, M_offset_9, 4, T[44]);
        d = MD5.HH(d, a, b, c, M_offset_12, 11, T[45]);
        c = MD5.HH(c, d, a, b, M_offset_15, 16, T[46]);
        b = MD5.HH(b, c, d, a, M_offset_2, 23, T[47]);
        a = MD5.II(a, b, c, d, M_offset_0, 6, T[48]);
        d = MD5.II(d, a, b, c, M_offset_7, 10, T[49]);
        c = MD5.II(c, d, a, b, M_offset_14, 15, T[50]);
        b = MD5.II(b, c, d, a, M_offset_5, 21, T[51]);
        a = MD5.II(a, b, c, d, M_offset_12, 6, T[52]);
        d = MD5.II(d, a, b, c, M_offset_3, 10, T[53]);
        c = MD5.II(c, d, a, b, M_offset_10, 15, T[54]);
        b = MD5.II(b, c, d, a, M_offset_1, 21, T[55]);
        a = MD5.II(a, b, c, d, M_offset_8, 6, T[56]);
        d = MD5.II(d, a, b, c, M_offset_15, 10, T[57]);
        c = MD5.II(c, d, a, b, M_offset_6, 15, T[58]);
        b = MD5.II(b, c, d, a, M_offset_13, 21, T[59]);
        a = MD5.II(a, b, c, d, M_offset_4, 6, T[60]);
        d = MD5.II(d, a, b, c, M_offset_11, 10, T[61]);
        c = MD5.II(c, d, a, b, M_offset_2, 15, T[62]);
        b = MD5.II(b, c, d, a, M_offset_9, 21, T[63]);
        // Intermediate hash value
        H[0] = (H[0] + a) | 0;
        H[1] = (H[1] + b) | 0;
        H[2] = (H[2] + c) | 0;
        H[3] = (H[3] + d) | 0;
    };
    /**
     * @return {?}
     */
    MD5.prototype._doFinalize = /**
     * @return {?}
     */
    function () {
        // Shortcuts
        var /** @type {?} */ data = this._data;
        var /** @type {?} */ dataWords = data.words;
        var /** @type {?} */ nBitsTotal = this._nDataBytes * 8;
        var /** @type {?} */ nBitsLeft = data.sigBytes * 8;
        // Add padding
        dataWords[nBitsLeft >>> 5] |= 0x80 << (24 - nBitsLeft % 32);
        var /** @type {?} */ nBitsTotalH = Math.floor(nBitsTotal / 0x100000000);
        var /** @type {?} */ nBitsTotalL = nBitsTotal;
        dataWords[(((nBitsLeft + 64) >>> 9) << 4) + 15] = ((((nBitsTotalH << 8) | (nBitsTotalH >>> 24)) & 0x00ff00ff) |
            (((nBitsTotalH << 24) | (nBitsTotalH >>> 8)) & 0xff00ff00));
        dataWords[(((nBitsLeft + 64) >>> 9) << 4) + 14] = ((((nBitsTotalL << 8) | (nBitsTotalL >>> 24)) & 0x00ff00ff) |
            (((nBitsTotalL << 24) | (nBitsTotalL >>> 8)) & 0xff00ff00));
        data.sigBytes = (dataWords.length + 1) * 4;
        // Hash final blocks
        this._process();
        // Shortcuts
        var /** @type {?} */ hash = this._hash;
        var /** @type {?} */ H = hash.words;
        // Swap endian
        for (var /** @type {?} */ i = 0; i < 4; i++) {
            // Shortcut
            var /** @type {?} */ H_i = H[i];
            H[i] = (((H_i << 8) | (H_i >>> 24)) & 0x00ff00ff) |
                (((H_i << 24) | (H_i >>> 8)) & 0xff00ff00);
        }
        // Return final computed hash
        return hash;
    };
    return MD5;
}(Hasher));

/**
 * @fileoverview added by tsickle
 * @suppress {checkTypes} checked by tsc
 */
var EvpKDF = /** @class */ (function () {
    /**
     * Initializes a newly created key derivation function.
     *
     * @param cfg (Optional) The configuration options to use for the derivation.
     *
     * @example
     *
     *     let kdf = EvpKDF.create();
     *     let kdf = EvpKDF.create({ keySize: 8 });
     *     let kdf = EvpKDF.create({ keySize: 8, iterations: 1000 });
     */
    function EvpKDF(cfg) {
        this.cfg = Object.assign({
            keySize: 128 / 32,
            hasher: MD5,
            iterations: 1
        }, cfg);
    }
    /**
     * Derives a key from a password.
     *
     * @param password The password.
     * @param salt A salt.
     *
     * @return The derived key.
     *
     * @example
     *
     *     let key = kdf.compute(password, salt);
     */
    /**
     * Derives a key from a password.
     *
     * \@example
     *
     *     let key = kdf.compute(password, salt);
     * @param {?} password The password.
     * @param {?} salt A salt.
     *
     * @return {?} The derived key.
     *
     */
    EvpKDF.prototype.compute = /**
     * Derives a key from a password.
     *
     * \@example
     *
     *     let key = kdf.compute(password, salt);
     * @param {?} password The password.
     * @param {?} salt A salt.
     *
     * @return {?} The derived key.
     *
     */
    function (password, salt) {
        // Init hasher
        var /** @type {?} */ hasher = new (/** @type {?} */ (this.cfg.hasher))();
        // Initial values
        var /** @type {?} */ derivedKey = new WordArray();
        // Generate key
        var /** @type {?} */ block;
        while (derivedKey.words.length < this.cfg.keySize) {
            if (block) {
                hasher.update(block);
            }
            block = hasher.update(password).finalize(salt);
            hasher.reset();
            // Iterations
            for (var /** @type {?} */ i = 1; i < this.cfg.iterations; i++) {
                block = hasher.finalize(block);
                hasher.reset();
            }
            derivedKey.concat(block);
        }
        derivedKey.sigBytes = this.cfg.keySize * 4;
        return derivedKey;
    };
    return EvpKDF;
}());

/**
 * @fileoverview added by tsickle
 * @suppress {checkTypes} checked by tsc
 */
var OpenSSLKdf = /** @class */ (function () {
    function OpenSSLKdf() {
    }
    /**
     * Derives a key and IV from a password.
     *
     * \@example
     *
     *     let derivedParams = OpenSSL.execute('Password', 256/32, 128/32);
     *     let derivedParams = OpenSSL.execute('Password', 256/32, 128/32, 'saltsalt');
     * @param {?} password The password to derive from.
     * @param {?} keySize The size in words of the key to generate.
     * @param {?} ivSize The size in words of the IV to generate.
     * @param {?=} salt (Optional) A 64-bit salt to use. If omitted, a salt will be generated randomly.
     *
     * @return {?} A cipher params object with the key, IV, and salt.
     *
     */
    OpenSSLKdf.execute = /**
     * Derives a key and IV from a password.
     *
     * \@example
     *
     *     let derivedParams = OpenSSL.execute('Password', 256/32, 128/32);
     *     let derivedParams = OpenSSL.execute('Password', 256/32, 128/32, 'saltsalt');
     * @param {?} password The password to derive from.
     * @param {?} keySize The size in words of the key to generate.
     * @param {?} ivSize The size in words of the IV to generate.
     * @param {?=} salt (Optional) A 64-bit salt to use. If omitted, a salt will be generated randomly.
     *
     * @return {?} A cipher params object with the key, IV, and salt.
     *
     */
    function (password, keySize, ivSize, salt) {
        // Generate random salt
        if (!salt) {
            salt = WordArray.random(64 / 8);
        }
        // Derive key and IV
        var /** @type {?} */ key = (new EvpKDF({ keySize: keySize + ivSize })).compute(password, salt);
        // Separate key and IV
        var /** @type {?} */ iv = new WordArray(key.words.slice(keySize), ivSize * 4);
        key.sigBytes = keySize * 4;
        // Return params
        return new CipherParams({ key: key, iv: iv, salt: salt });
    };
    return OpenSSLKdf;
}());

/**
 * @fileoverview added by tsickle
 * @suppress {checkTypes} checked by tsc
 */
var PasswordBasedCipher = /** @class */ (function () {
    function PasswordBasedCipher() {
    }
    /**
     * Encrypts a message using a password.
     *
     * \@example
     *
     *     var ciphertextParams = CryptoJS.lib.PasswordBasedCipher.encrypt(AES, message, 'password');
     *     var ciphertextParams = CryptoJS.lib.PasswordBasedCipher.encrypt(AES, message, 'password', { format: OpenSSL });
     * @param {?} cipher The cipher algorithm to use.
     * @param {?} message The message to encrypt.
     * @param {?} password The password.
     * @param {?=} cfg (Optional) The configuration options to use for this operation.
     *
     * @return {?} A cipher params object.
     *
     */
    PasswordBasedCipher.encrypt = /**
     * Encrypts a message using a password.
     *
     * \@example
     *
     *     var ciphertextParams = CryptoJS.lib.PasswordBasedCipher.encrypt(AES, message, 'password');
     *     var ciphertextParams = CryptoJS.lib.PasswordBasedCipher.encrypt(AES, message, 'password', { format: OpenSSL });
     * @param {?} cipher The cipher algorithm to use.
     * @param {?} message The message to encrypt.
     * @param {?} password The password.
     * @param {?=} cfg (Optional) The configuration options to use for this operation.
     *
     * @return {?} A cipher params object.
     *
     */
    function (cipher, message, password, cfg) {
        // Apply config defaults
        var /** @type {?} */ config = Object.assign({}, this.cfg, cfg);
        // Check if we have a kdf
        if (config.kdf === undefined) {
            throw new Error('missing kdf in config');
        }
        // Derive key and other params
        var /** @type {?} */ derivedParams = config.kdf.execute(password, cipher.keySize, cipher.ivSize);
        // Check if we have an IV
        if (derivedParams.iv !== undefined) {
            // Add IV to config
            config.iv = derivedParams.iv;
        }
        // Encrypt
        var /** @type {?} */ ciphertext = SerializableCipher.encrypt.call(this, cipher, message, derivedParams.key, config);
        // Mix in derived params
        return ciphertext.extend(derivedParams);
    };
    /**
     * Decrypts serialized ciphertext using a password.
     *
     * \@example
     *
     *     var plaintext = PasswordBasedCipher.decrypt(AES, formattedCiphertext, 'password', { format: OpenSSL });
     *     var plaintext = PasswordBasedCipher.decrypt(AES, ciphertextParams, 'password', { format: OpenSSL });
     * @param {?} cipher The cipher algorithm to use.
     * @param {?} ciphertext The ciphertext to decrypt.
     * @param {?} password The password.
     * @param {?=} cfg (Optional) The configuration options to use for this operation.
     *
     * @return {?} The plaintext.
     *
     */
    PasswordBasedCipher.decrypt = /**
     * Decrypts serialized ciphertext using a password.
     *
     * \@example
     *
     *     var plaintext = PasswordBasedCipher.decrypt(AES, formattedCiphertext, 'password', { format: OpenSSL });
     *     var plaintext = PasswordBasedCipher.decrypt(AES, ciphertextParams, 'password', { format: OpenSSL });
     * @param {?} cipher The cipher algorithm to use.
     * @param {?} ciphertext The ciphertext to decrypt.
     * @param {?} password The password.
     * @param {?=} cfg (Optional) The configuration options to use for this operation.
     *
     * @return {?} The plaintext.
     *
     */
    function (cipher, ciphertext, password, cfg) {
        // Apply config defaults
        var /** @type {?} */ config = Object.assign({}, this.cfg, cfg);
        // Check if we have a kdf
        if (config.format === undefined) {
            throw new Error('missing format in config');
        }
        // Convert string to CipherParams
        ciphertext = this._parse(ciphertext, config.format);
        // Check if we have a kdf
        if (config.kdf === undefined) {
            throw new Error('the key derivation function must be set');
        }
        // Derive key and other params
        var /** @type {?} */ derivedParams = config.kdf.execute(password, cipher.keySize, cipher.ivSize, ciphertext.salt);
        // Check if we have an IV
        if (derivedParams.iv !== undefined) {
            // Add IV to config
            config.iv = derivedParams.iv;
        }
        // Decrypt
        var /** @type {?} */ plaintext = SerializableCipher.decrypt.call(this, cipher, ciphertext, derivedParams.key, config);
        return plaintext;
    };
    /**
     * Converts serialized ciphertext to CipherParams,
     * else assumed CipherParams already and returns ciphertext unchanged.
     *
     * \@example
     *
     *     var ciphertextParams = CryptoJS.lib.SerializableCipher._parse(ciphertextStringOrParams, format);
     * @param {?} ciphertext The ciphertext.
     * @param {?} format The formatting strategy to use to parse serialized ciphertext.
     *
     * @return {?} The unserialized ciphertext.
     *
     */
    PasswordBasedCipher._parse = /**
     * Converts serialized ciphertext to CipherParams,
     * else assumed CipherParams already and returns ciphertext unchanged.
     *
     * \@example
     *
     *     var ciphertextParams = CryptoJS.lib.SerializableCipher._parse(ciphertextStringOrParams, format);
     * @param {?} ciphertext The ciphertext.
     * @param {?} format The formatting strategy to use to parse serialized ciphertext.
     *
     * @return {?} The unserialized ciphertext.
     *
     */
    function (ciphertext, format) {
        if (typeof ciphertext === 'string') {
            return format.parse(ciphertext);
        }
        else {
            return ciphertext;
        }
    };
    PasswordBasedCipher.cfg = {
        blockSize: 4,
        iv: new WordArray([]),
        format: OpenSSL,
        kdf: OpenSSLKdf
    };
    return PasswordBasedCipher;
}());

/**
 * @fileoverview added by tsickle
 * @suppress {checkTypes} checked by tsc
 */
/**
 * @abstract
 */
var Cipher = /** @class */ (function (_super) {
    (0,tslib__WEBPACK_IMPORTED_MODULE_0__.__extends)(Cipher, _super);
    function Cipher(xformMode, key, cfg) {
        var _this = 
        // Apply config defaults
        _super.call(this, Object.assign({
            blockSize: 1
        }, cfg)) || this;
        // Store transform mode and key
        // Store transform mode and key
        _this._xformMode = xformMode;
        _this._key = key;
        // Set initial values
        // Set initial values
        _this.reset();
        return _this;
    }
    /**
     * Creates this cipher in encryption mode.
     *
     * \@example
     *
     *     let cipher = AES.createEncryptor(keyWordArray, { iv: ivWordArray });
     * @param {?} key The key.
     * @param {?=} cfg (Optional) The configuration options to use for this operation.
     *
     * @return {?} A cipher instance.
     *
     */
    Cipher.createEncryptor = /**
     * Creates this cipher in encryption mode.
     *
     * \@example
     *
     *     let cipher = AES.createEncryptor(keyWordArray, { iv: ivWordArray });
     * @param {?} key The key.
     * @param {?=} cfg (Optional) The configuration options to use for this operation.
     *
     * @return {?} A cipher instance.
     *
     */
    function (key, cfg) {
        // workaround for typescript not being able to create a abstract creator function directly
        var /** @type {?} */ thisClass = this;
        return new thisClass(this._ENC_XFORM_MODE, key, cfg);
    };
    /**
     * Creates this cipher in decryption mode.
     *
     * \@example
     *
     *     let cipher = AES.createDecryptor(keyWordArray, { iv: ivWordArray });
     * @param {?} key The key.
     * @param {?=} cfg (Optional) The configuration options to use for this operation.
     *
     * @return {?} A cipher instance.
     *
     */
    Cipher.createDecryptor = /**
     * Creates this cipher in decryption mode.
     *
     * \@example
     *
     *     let cipher = AES.createDecryptor(keyWordArray, { iv: ivWordArray });
     * @param {?} key The key.
     * @param {?=} cfg (Optional) The configuration options to use for this operation.
     *
     * @return {?} A cipher instance.
     *
     */
    function (key, cfg) {
        // workaround for typescript not being able to create a abstract creator function directly
        var /** @type {?} */ thisClass = this;
        return new thisClass(this._DEC_XFORM_MODE, key, cfg);
    };
    /**
     * Creates shortcut functions to a cipher's object interface.
     *
     * \@example
     *
     *     let AES = Cipher._createHelper(AESAlgorithm);
     * @param {?} cipher The cipher to create a helper for.
     *
     * @return {?} An object with encrypt and decrypt shortcut functions.
     *
     */
    Cipher._createHelper = /**
     * Creates shortcut functions to a cipher's object interface.
     *
     * \@example
     *
     *     let AES = Cipher._createHelper(AESAlgorithm);
     * @param {?} cipher The cipher to create a helper for.
     *
     * @return {?} An object with encrypt and decrypt shortcut functions.
     *
     */
    function (cipher) {
        /**
         * @param {?} message
         * @param {?} key
         * @param {?=} cfg
         * @return {?}
         */
        function encrypt(message, key, cfg) {
            if (typeof key === 'string') {
                return PasswordBasedCipher.encrypt(cipher, message, key, cfg);
            }
            else {
                return SerializableCipher.encrypt(cipher, message, key, cfg);
            }
        }
        /**
         * @param {?} ciphertext
         * @param {?} key
         * @param {?=} cfg
         * @return {?}
         */
        function decrypt(ciphertext, key, cfg) {
            if (typeof key === 'string') {
                return PasswordBasedCipher.decrypt(cipher, ciphertext, key, cfg);
            }
            else {
                return SerializableCipher.decrypt(cipher, ciphertext, key, cfg);
            }
        }
        return {
            encrypt: encrypt,
            decrypt: decrypt
        };
    };
    /**
     * Adds data to be encrypted or decrypted.
     *
     * \@example
     *
     *     let encrypted = cipher.process('data');
     *     let encrypted = cipher.process(wordArray);
     * @param {?} dataUpdate The data to encrypt or decrypt.
     *
     * @return {?} The data after processing.
     *
     */
    Cipher.prototype.process = /**
     * Adds data to be encrypted or decrypted.
     *
     * \@example
     *
     *     let encrypted = cipher.process('data');
     *     let encrypted = cipher.process(wordArray);
     * @param {?} dataUpdate The data to encrypt or decrypt.
     *
     * @return {?} The data after processing.
     *
     */
    function (dataUpdate) {
        // Append
        this._append(dataUpdate);
        // Process available blocks
        return this._process();
    };
    /**
     * Finalizes the encryption or decryption process.
     * Note that the finalize operation is effectively a destructive, read-once operation.
     *
     * \@example
     *
     *     var encrypted = cipher.finalize();
     *     var encrypted = cipher.finalize('data');
     *     var encrypted = cipher.finalize(wordArray);
     * @param {?=} dataUpdate The final data to encrypt or decrypt.
     *
     * @return {?} The data after final processing.
     *
     */
    Cipher.prototype.finalize = /**
     * Finalizes the encryption or decryption process.
     * Note that the finalize operation is effectively a destructive, read-once operation.
     *
     * \@example
     *
     *     var encrypted = cipher.finalize();
     *     var encrypted = cipher.finalize('data');
     *     var encrypted = cipher.finalize(wordArray);
     * @param {?=} dataUpdate The final data to encrypt or decrypt.
     *
     * @return {?} The data after final processing.
     *
     */
    function (dataUpdate) {
        // Final data update
        if (dataUpdate) {
            this._append(dataUpdate);
        }
        // Perform concrete-cipher logic
        var /** @type {?} */ finalProcessedData = this._doFinalize();
        return finalProcessedData;
    };
    /**
     * A constant representing encryption mode.
     */
    Cipher._ENC_XFORM_MODE = 1;
    /**
     * A constant representing decryption mode.
     */
    Cipher._DEC_XFORM_MODE = 2;
    /**
     * This cipher's key size. Default: 4 (128 bits / 32 Bits)
     */
    Cipher.keySize = 4;
    /**
     * This cipher's IV size. Default: 4 (128 bits / 32 Bits)
     */
    Cipher.ivSize = 4;
    return Cipher;
}(BufferedBlockAlgorithm));

/**
 * @fileoverview added by tsickle
 * @suppress {checkTypes} checked by tsc
 */
/**
 * @abstract
 */
var /**
 * @abstract
 */
BlockCipherModeAlgorithm = /** @class */ (function () {
    function BlockCipherModeAlgorithm(cipher, iv) {
        this.init(cipher, iv);
    }
    /**
     * Initializes a newly created mode.
     *
     * \@example
     *
     *     var mode = CBC.Encryptor.create(cipher, iv.words);
     * @param {?} cipher A block cipher instance.
     * @param {?=} iv The IV words.
     *
     * @return {?}
     */
    BlockCipherModeAlgorithm.prototype.init = /**
     * Initializes a newly created mode.
     *
     * \@example
     *
     *     var mode = CBC.Encryptor.create(cipher, iv.words);
     * @param {?} cipher A block cipher instance.
     * @param {?=} iv The IV words.
     *
     * @return {?}
     */
    function (cipher, iv) {
        this._cipher = cipher;
        this._iv = iv;
    };
    return BlockCipherModeAlgorithm;
}());

/**
 * @fileoverview added by tsickle
 * @suppress {checkTypes} checked by tsc
 */
/**
 * @abstract
 */
var BlockCipherMode = /** @class */ (function () {
    function BlockCipherMode() {
    }
    /**
     * Creates this mode for encryption.
     *
     * \@example
     *
     *     var mode = CBC.createEncryptor(cipher, iv.words);
     * @param {?} cipher A block cipher instance.
     * @param {?} iv The IV words.
     *
     * @return {?}
     */
    BlockCipherMode.createEncryptor = /**
     * Creates this mode for encryption.
     *
     * \@example
     *
     *     var mode = CBC.createEncryptor(cipher, iv.words);
     * @param {?} cipher A block cipher instance.
     * @param {?} iv The IV words.
     *
     * @return {?}
     */
    function (cipher, iv) {
        // workaround for typescript not being able to create a abstract creator function directly
        var /** @type {?} */ encryptorClass = this.Encryptor;
        return new encryptorClass(cipher, iv);
    };
    /**
     * Creates this mode for decryption.
     *
     * \@example
     *
     *     var mode = CBC.createDecryptor(cipher, iv.words);
     * @param {?} cipher A block cipher instance.
     * @param {?} iv The IV words.
     *
     * @return {?}
     */
    BlockCipherMode.createDecryptor = /**
     * Creates this mode for decryption.
     *
     * \@example
     *
     *     var mode = CBC.createDecryptor(cipher, iv.words);
     * @param {?} cipher A block cipher instance.
     * @param {?} iv The IV words.
     *
     * @return {?}
     */
    function (cipher, iv) {
        // workaround for typescript not being able to create a abstract creator function directly
        var /** @type {?} */ decryptorClass = this.Decryptor;
        return new decryptorClass(cipher, iv);
    };
    BlockCipherMode.Encryptor = BlockCipherModeAlgorithm;
    BlockCipherMode.Decryptor = BlockCipherModeAlgorithm;
    return BlockCipherMode;
}());

/**
 * @fileoverview added by tsickle
 * @suppress {checkTypes} checked by tsc
 */
var CBCEncryptor = /** @class */ (function (_super) {
    (0,tslib__WEBPACK_IMPORTED_MODULE_0__.__extends)(CBCEncryptor, _super);
    function CBCEncryptor() {
        return _super !== null && _super.apply(this, arguments) || this;
    }
    /**
     * Processes the data block at offset.
     *
     * \@example
     *
     *     mode.processBlock(data.words, offset);
     * @param {?} words The data words to operate on.
     * @param {?} offset The offset where the block starts.
     *
     * @return {?}
     */
    CBCEncryptor.prototype.processBlock = /**
     * Processes the data block at offset.
     *
     * \@example
     *
     *     mode.processBlock(data.words, offset);
     * @param {?} words The data words to operate on.
     * @param {?} offset The offset where the block starts.
     *
     * @return {?}
     */
    function (words, offset) {
        // Check if we have a blockSize
        if (this._cipher.cfg.blockSize === undefined) {
            throw new Error('missing blockSize in cipher config');
        }
        // XOR and encrypt
        this.xorBlock(words, offset, this._cipher.cfg.blockSize);
        this._cipher.encryptBlock(words, offset);
        // Remember this block to use with next block
        this._prevBlock = words.slice(offset, offset + this._cipher.cfg.blockSize);
    };
    /**
     * @param {?} words
     * @param {?} offset
     * @param {?} blockSize
     * @return {?}
     */
    CBCEncryptor.prototype.xorBlock = /**
     * @param {?} words
     * @param {?} offset
     * @param {?} blockSize
     * @return {?}
     */
    function (words, offset, blockSize) {
        // Choose mixing block
        var /** @type {?} */ block;
        if (this._iv) {
            block = this._iv;
            // Remove IV for subsequent blocks
            this._iv = undefined;
        }
        else {
            block = this._prevBlock;
        }
        // block should never be undefined but we want to make typescript happy
        if (block !== undefined) {
            // XOR blocks
            for (var /** @type {?} */ i = 0; i < blockSize; i++) {
                words[offset + i] ^= block[i];
            }
        }
    };
    return CBCEncryptor;
}(BlockCipherModeAlgorithm));

/**
 * @fileoverview added by tsickle
 * @suppress {checkTypes} checked by tsc
 */
var CBCDecryptor = /** @class */ (function (_super) {
    (0,tslib__WEBPACK_IMPORTED_MODULE_0__.__extends)(CBCDecryptor, _super);
    function CBCDecryptor() {
        return _super !== null && _super.apply(this, arguments) || this;
    }
    /**
     * Processes the data block at offset.
     *
     * \@example
     *
     *     mode.processBlock(data.words, offset);
     * @param {?} words The data words to operate on.
     * @param {?} offset The offset where the block starts.
     *
     * @return {?}
     */
    CBCDecryptor.prototype.processBlock = /**
     * Processes the data block at offset.
     *
     * \@example
     *
     *     mode.processBlock(data.words, offset);
     * @param {?} words The data words to operate on.
     * @param {?} offset The offset where the block starts.
     *
     * @return {?}
     */
    function (words, offset) {
        // Check if we have a blockSize
        if (this._cipher.cfg.blockSize === undefined) {
            throw new Error('missing blockSize in cipher config');
        }
        // Remember this block to use with next block
        var /** @type {?} */ thisBlock = words.slice(offset, offset + this._cipher.cfg.blockSize);
        // Decrypt and XOR
        this._cipher.decryptBlock(words, offset);
        this.xorBlock(words, offset, this._cipher.cfg.blockSize);
        // This block becomes the previous block
        this._prevBlock = thisBlock;
    };
    /**
     * @param {?} words
     * @param {?} offset
     * @param {?} blockSize
     * @return {?}
     */
    CBCDecryptor.prototype.xorBlock = /**
     * @param {?} words
     * @param {?} offset
     * @param {?} blockSize
     * @return {?}
     */
    function (words, offset, blockSize) {
        // Choose mixing block
        var /** @type {?} */ block;
        if (this._iv) {
            block = this._iv;
            // Remove IV for subsequent blocks
            this._iv = undefined;
        }
        else {
            block = this._prevBlock;
        }
        // block should never be undefined but we want to make typescript happy
        if (block !== undefined) {
            // XOR blocks
            for (var /** @type {?} */ i = 0; i < blockSize; i++) {
                words[offset + i] ^= block[i];
            }
        }
    };
    return CBCDecryptor;
}(BlockCipherModeAlgorithm));

/**
 * @fileoverview added by tsickle
 * @suppress {checkTypes} checked by tsc
 */
/**
 * Cipher Block Chaining mode.
 * @abstract
 */
var CBC = /** @class */ (function (_super) {
    (0,tslib__WEBPACK_IMPORTED_MODULE_0__.__extends)(CBC, _super);
    function CBC() {
        return _super !== null && _super.apply(this, arguments) || this;
    }
    CBC.Encryptor = CBCEncryptor;
    CBC.Decryptor = CBCDecryptor;
    return CBC;
}(BlockCipherMode));

/**
 * @fileoverview added by tsickle
 * @suppress {checkTypes} checked by tsc
 */
var PKCS7 = /** @class */ (function () {
    function PKCS7() {
    }
    /**
     * Pads data using the algorithm defined in PKCS #5/7.
     *
     * \@example
     *
     *     PKCS7.pad(wordArray, 4);
     * @param {?} data The data to pad.
     * @param {?} blockSize The multiple that the data should be padded to.
     *
     * @return {?}
     */
    PKCS7.pad = /**
     * Pads data using the algorithm defined in PKCS #5/7.
     *
     * \@example
     *
     *     PKCS7.pad(wordArray, 4);
     * @param {?} data The data to pad.
     * @param {?} blockSize The multiple that the data should be padded to.
     *
     * @return {?}
     */
    function (data, blockSize) {
        // Shortcut
        var /** @type {?} */ blockSizeBytes = blockSize * 4;
        // Count padding bytes
        var /** @type {?} */ nPaddingBytes = blockSizeBytes - data.sigBytes % blockSizeBytes;
        // Create padding word
        var /** @type {?} */ paddingWord = (nPaddingBytes << 24) | (nPaddingBytes << 16) | (nPaddingBytes << 8) | nPaddingBytes;
        // Create padding
        var /** @type {?} */ paddingWords = [];
        for (var /** @type {?} */ i = 0; i < nPaddingBytes; i += 4) {
            paddingWords.push(paddingWord);
        }
        var /** @type {?} */ padding = new WordArray(paddingWords, nPaddingBytes);
        // Add padding
        data.concat(padding);
    };
    /**
     * Unpads data that had been padded using the algorithm defined in PKCS #5/7.
     *
     * \@example
     *
     *     PKCS7.unpad(wordArray);
     * @param {?} data The data to unpad.
     *
     * @return {?}
     */
    PKCS7.unpad = /**
     * Unpads data that had been padded using the algorithm defined in PKCS #5/7.
     *
     * \@example
     *
     *     PKCS7.unpad(wordArray);
     * @param {?} data The data to unpad.
     *
     * @return {?}
     */
    function (data) {
        // Get number of padding bytes from last byte
        var /** @type {?} */ nPaddingBytes = data.words[(data.sigBytes - 1) >>> 2] & 0xff;
        // Remove padding
        data.sigBytes -= nPaddingBytes;
    };
    return PKCS7;
}());

/**
 * @fileoverview added by tsickle
 * @suppress {checkTypes} checked by tsc
 */
/**
 * @abstract
 */
var  /**
 * @abstract
 */
BlockCipher = /** @class */ (function (_super) {
    (0,tslib__WEBPACK_IMPORTED_MODULE_0__.__extends)(BlockCipher, _super);
    function BlockCipher(xformMode, key, cfg) {
        return _super.call(this, xformMode, key, Object.assign({
            // default: 128 / 32
            blockSize: 4,
            mode: CBC,
            padding: PKCS7
        }, cfg)) || this;
    }
    /**
     * @return {?}
     */
    BlockCipher.prototype.reset = /**
     * @return {?}
     */
    function () {
        // Reset cipher
        _super.prototype.reset.call(this);
        // Check if we have a blockSize
        if (this.cfg.mode === undefined) {
            throw new Error('missing mode in config');
        }
        // Reset block mode
        var /** @type {?} */ modeCreator;
        if (this._xformMode === (/** @type {?} */ (this.constructor))._ENC_XFORM_MODE) {
            modeCreator = this.cfg.mode.createEncryptor;
        }
        else /* if (this._xformMode == this._DEC_XFORM_MODE) */ {
            modeCreator = this.cfg.mode.createDecryptor;
            // Keep at least one block in the buffer for unpadding
            this._minBufferSize = 1;
        }
        if (this._mode && this._mode.__creator === modeCreator) {
            this._mode.init(this, this.cfg.iv && this.cfg.iv.words);
        }
        else {
            this._mode = modeCreator.call(this.cfg.mode, this, this.cfg.iv && this.cfg.iv.words);
            this._mode.__creator = modeCreator;
        }
    };
    /**
     * @param {?} words
     * @param {?} offset
     * @return {?}
     */
    BlockCipher.prototype._doProcessBlock = /**
     * @param {?} words
     * @param {?} offset
     * @return {?}
     */
    function (words, offset) {
        this._mode.processBlock(words, offset);
    };
    /**
     * @return {?}
     */
    BlockCipher.prototype._doFinalize = /**
     * @return {?}
     */
    function () {
        // Check if we have a padding strategy
        if (this.cfg.padding === undefined) {
            throw new Error('missing padding in config');
        }
        // Finalize
        var /** @type {?} */ finalProcessedBlocks;
        if (this._xformMode === (/** @type {?} */ (this.constructor))._ENC_XFORM_MODE) {
            // Check if we have a blockSize
            if (this.cfg.blockSize === undefined) {
                throw new Error('missing blockSize in config');
            }
            // Pad data
            this.cfg.padding.pad(this._data, this.cfg.blockSize);
            // Process final blocks
            finalProcessedBlocks = this._process(!!'flush');
        }
        else /* if (this._xformMode == this._DEC_XFORM_MODE) */ {
            // Process final blocks
            finalProcessedBlocks = this._process(!!'flush');
            // Unpad data
            this.cfg.padding.unpad(finalProcessedBlocks);
        }
        return finalProcessedBlocks;
    };
    return BlockCipher;
}(Cipher));

/**
 * @fileoverview added by tsickle
 * @suppress {checkTypes} checked by tsc
 */
// Define lookup tables
var /** @type {?} */ SBOX = [];
var /** @type {?} */ INV_SBOX = [];
var /** @type {?} */ SUB_MIX_0 = [];
var /** @type {?} */ SUB_MIX_1 = [];
var /** @type {?} */ SUB_MIX_2 = [];
var /** @type {?} */ SUB_MIX_3 = [];
var /** @type {?} */ INV_SUB_MIX_0 = [];
var /** @type {?} */ INV_SUB_MIX_1 = [];
var /** @type {?} */ INV_SUB_MIX_2 = [];
var /** @type {?} */ INV_SUB_MIX_3 = [];
// Compute lookup tables
(function () {
    // Compute double table
    var /** @type {?} */ d = [];
    for (var /** @type {?} */ i = 0; i < 256; i++) {
        if (i < 128) {
            d[i] = i << 1;
        }
        else {
            d[i] = (i << 1) ^ 0x11b;
        }
    }
    // Walk GF(2^8)
    var /** @type {?} */ x = 0;
    var /** @type {?} */ xi = 0;
    for (var /** @type {?} */ i = 0; i < 256; i++) {
        // Compute sbox
        var /** @type {?} */ sx = xi ^ (xi << 1) ^ (xi << 2) ^ (xi << 3) ^ (xi << 4);
        sx = (sx >>> 8) ^ (sx & 0xff) ^ 0x63;
        SBOX[x] = sx;
        INV_SBOX[sx] = x;
        // Compute multiplication
        var /** @type {?} */ x2 = d[x];
        var /** @type {?} */ x4 = d[x2];
        var /** @type {?} */ x8 = d[x4];
        // Compute sub bytes, mix columns tables
        var /** @type {?} */ t = (d[sx] * 0x101) ^ (sx * 0x1010100);
        SUB_MIX_0[x] = (t << 24) | (t >>> 8);
        SUB_MIX_1[x] = (t << 16) | (t >>> 16);
        SUB_MIX_2[x] = (t << 8) | (t >>> 24);
        SUB_MIX_3[x] = t;
        // Compute inv sub bytes, inv mix columns tables
        t = (x8 * 0x1010101) ^ (x4 * 0x10001) ^ (x2 * 0x101) ^ (x * 0x1010100);
        INV_SUB_MIX_0[sx] = (t << 24) | (t >>> 8);
        INV_SUB_MIX_1[sx] = (t << 16) | (t >>> 16);
        INV_SUB_MIX_2[sx] = (t << 8) | (t >>> 24);
        INV_SUB_MIX_3[sx] = t;
        // Compute next counter
        if (!x) {
            x = xi = 1;
        }
        else {
            x = x2 ^ d[d[d[x8 ^ x2]]];
            xi ^= d[d[xi]];
        }
    }
}());
// Precomputed Rcon lookup
var /** @type {?} */ RCON = [0x00, 0x01, 0x02, 0x04, 0x08, 0x10, 0x20, 0x40, 0x80, 0x1b, 0x36];
var AES = /** @class */ (function (_super) {
    (0,tslib__WEBPACK_IMPORTED_MODULE_0__.__extends)(AES, _super);
    function AES(xformMode, key, cfg) {
        return _super.call(this, xformMode, key, cfg) || this;
    }
    /**
     * @return {?}
     */
    AES.prototype.reset = /**
     * @return {?}
     */
    function () {
        // reset core values
        _super.prototype.reset.call(this);
        // Skip reset of nRounds has been set before and key did not change
        if (this._nRounds && this._keyPriorReset === this._key) {
            return;
        }
        // Shortcuts
        var /** @type {?} */ key = this._keyPriorReset = this._key;
        var /** @type {?} */ keyWords = key.words;
        var /** @type {?} */ keySize = key.sigBytes / 4;
        // Compute number of rounds
        var /** @type {?} */ nRounds = this._nRounds = keySize + 6;
        // Compute number of key schedule rows
        var /** @type {?} */ ksRows = (nRounds + 1) * 4;
        // Compute key schedule
        var /** @type {?} */ keySchedule = this._keySchedule = [];
        for (var /** @type {?} */ ksRow = 0; ksRow < ksRows; ksRow++) {
            if (ksRow < keySize) {
                keySchedule[ksRow] = keyWords[ksRow];
            }
            else {
                var /** @type {?} */ t = keySchedule[ksRow - 1];
                if (!(ksRow % keySize)) {
                    // Rot word
                    t = (t << 8) | (t >>> 24);
                    // Sub word
                    t = (SBOX[t >>> 24] << 24) | (SBOX[(t >>> 16) & 0xff] << 16) | (SBOX[(t >>> 8) & 0xff] << 8) | SBOX[t & 0xff];
                    // Mix Rcon
                    t ^= RCON[(ksRow / keySize) | 0] << 24;
                }
                else if (keySize > 6 && ksRow % keySize === 4) {
                    // Sub word
                    t = (SBOX[t >>> 24] << 24) | (SBOX[(t >>> 16) & 0xff] << 16) | (SBOX[(t >>> 8) & 0xff] << 8) | SBOX[t & 0xff];
                }
                keySchedule[ksRow] = keySchedule[ksRow - keySize] ^ t;
            }
        }
        // Compute inv key schedule
        var /** @type {?} */ invKeySchedule = this._invKeySchedule = [];
        for (var /** @type {?} */ invKsRow = 0; invKsRow < ksRows; invKsRow++) {
            var /** @type {?} */ ksRow = ksRows - invKsRow;
            var /** @type {?} */ t = void 0;
            if (invKsRow % 4) {
                t = keySchedule[ksRow];
            }
            else {
                t = keySchedule[ksRow - 4];
            }
            if (invKsRow < 4 || ksRow <= 4) {
                invKeySchedule[invKsRow] = t;
            }
            else {
                invKeySchedule[invKsRow] = INV_SUB_MIX_0[SBOX[t >>> 24]] ^ INV_SUB_MIX_1[SBOX[(t >>> 16) & 0xff]] ^
                    INV_SUB_MIX_2[SBOX[(t >>> 8) & 0xff]] ^ INV_SUB_MIX_3[SBOX[t & 0xff]];
            }
        }
    };
    /**
     * @param {?} M
     * @param {?} offset
     * @return {?}
     */
    AES.prototype.encryptBlock = /**
     * @param {?} M
     * @param {?} offset
     * @return {?}
     */
    function (M, offset) {
        this._doCryptBlock(M, offset, this._keySchedule, SUB_MIX_0, SUB_MIX_1, SUB_MIX_2, SUB_MIX_3, SBOX);
    };
    /**
     * @param {?} M
     * @param {?} offset
     * @return {?}
     */
    AES.prototype.decryptBlock = /**
     * @param {?} M
     * @param {?} offset
     * @return {?}
     */
    function (M, offset) {
        // Swap 2nd and 4th rows
        var /** @type {?} */ t = M[offset + 1];
        M[offset + 1] = M[offset + 3];
        M[offset + 3] = t;
        this._doCryptBlock(M, offset, this._invKeySchedule, INV_SUB_MIX_0, INV_SUB_MIX_1, INV_SUB_MIX_2, INV_SUB_MIX_3, INV_SBOX);
        // Inv swap 2nd and 4th rows
        t = M[offset + 1];
        M[offset + 1] = M[offset + 3];
        M[offset + 3] = t;
    };
    /**
     * @param {?} M
     * @param {?} offset
     * @param {?} keySchedule
     * @param {?} sub_mix_0
     * @param {?} sub_mix_1
     * @param {?} sub_mix_2
     * @param {?} sub_mix_3
     * @param {?} sbox
     * @return {?}
     */
    AES.prototype._doCryptBlock = /**
     * @param {?} M
     * @param {?} offset
     * @param {?} keySchedule
     * @param {?} sub_mix_0
     * @param {?} sub_mix_1
     * @param {?} sub_mix_2
     * @param {?} sub_mix_3
     * @param {?} sbox
     * @return {?}
     */
    function (M, offset, keySchedule, sub_mix_0, sub_mix_1, sub_mix_2, sub_mix_3, sbox) {
        // Get input, add round key
        var /** @type {?} */ s0 = M[offset] ^ keySchedule[0];
        var /** @type {?} */ s1 = M[offset + 1] ^ keySchedule[1];
        var /** @type {?} */ s2 = M[offset + 2] ^ keySchedule[2];
        var /** @type {?} */ s3 = M[offset + 3] ^ keySchedule[3];
        // Key schedule row counter
        var /** @type {?} */ ksRow = 4;
        // Rounds
        for (var /** @type {?} */ round = 1; round < this._nRounds; round++) {
            // Shift rows, sub bytes, mix columns, add round key
            var /** @type {?} */ t0 = sub_mix_0[s0 >>> 24] ^ sub_mix_1[(s1 >>> 16) & 0xff] ^ sub_mix_2[(s2 >>> 8) & 0xff] ^ sub_mix_3[s3 & 0xff] ^
                keySchedule[ksRow++];
            var /** @type {?} */ t1 = sub_mix_0[s1 >>> 24] ^ sub_mix_1[(s2 >>> 16) & 0xff] ^ sub_mix_2[(s3 >>> 8) & 0xff] ^ sub_mix_3[s0 & 0xff] ^
                keySchedule[ksRow++];
            var /** @type {?} */ t2 = sub_mix_0[s2 >>> 24] ^ sub_mix_1[(s3 >>> 16) & 0xff] ^ sub_mix_2[(s0 >>> 8) & 0xff] ^ sub_mix_3[s1 & 0xff] ^
                keySchedule[ksRow++];
            var /** @type {?} */ t3 = sub_mix_0[s3 >>> 24] ^ sub_mix_1[(s0 >>> 16) & 0xff] ^ sub_mix_2[(s1 >>> 8) & 0xff] ^ sub_mix_3[s2 & 0xff] ^
                keySchedule[ksRow++];
            // Update state
            s0 = t0;
            s1 = t1;
            s2 = t2;
            s3 = t3;
        }
        // Shift rows, sub bytes, add round key
        var /** @type {?} */ t0g = ((sbox[s0 >>> 24] << 24) | (sbox[(s1 >>> 16) & 0xff] << 16) | (sbox[(s2 >>> 8) & 0xff] << 8) | sbox[s3 & 0xff]) ^
            keySchedule[ksRow++];
        var /** @type {?} */ t1g = ((sbox[s1 >>> 24] << 24) | (sbox[(s2 >>> 16) & 0xff] << 16) | (sbox[(s3 >>> 8) & 0xff] << 8) | sbox[s0 & 0xff]) ^
            keySchedule[ksRow++];
        var /** @type {?} */ t2g = ((sbox[s2 >>> 24] << 24) | (sbox[(s3 >>> 16) & 0xff] << 16) | (sbox[(s0 >>> 8) & 0xff] << 8) | sbox[s1 & 0xff]) ^
            keySchedule[ksRow++];
        var /** @type {?} */ t3g = ((sbox[s3 >>> 24] << 24) | (sbox[(s0 >>> 16) & 0xff] << 16) | (sbox[(s1 >>> 8) & 0xff] << 8) | sbox[s2 & 0xff]) ^
            keySchedule[ksRow++];
        // Set output
        M[offset] = t0g;
        M[offset + 1] = t1g;
        M[offset + 2] = t2g;
        M[offset + 3] = t3g;
    };
    AES.keySize = 8;
    return AES;
}(BlockCipher));

/**
 * @fileoverview added by tsickle
 * @suppress {checkTypes} checked by tsc
 */
// Initialization and round constants tables
var /** @type {?} */ H = [];
var /** @type {?} */ K = [];
// Reusable object
var /** @type {?} */ W = [];
var SHA256 = /** @class */ (function (_super) {
    (0,tslib__WEBPACK_IMPORTED_MODULE_0__.__extends)(SHA256, _super);
    function SHA256() {
        return _super !== null && _super.apply(this, arguments) || this;
    }
    /**
     * @return {?}
     */
    SHA256.prototype.reset = /**
     * @return {?}
     */
    function () {
        // reset core values
        _super.prototype.reset.call(this);
        this._hash = new WordArray(H.slice(0));
    };
    /**
     * @param {?} M
     * @param {?} offset
     * @return {?}
     */
    SHA256.prototype._doProcessBlock = /**
     * @param {?} M
     * @param {?} offset
     * @return {?}
     */
    function (M, offset) {
        // Shortcut
        var /** @type {?} */ Hl = this._hash.words;
        // Working variables
        var /** @type {?} */ a = Hl[0];
        var /** @type {?} */ b = Hl[1];
        var /** @type {?} */ c = Hl[2];
        var /** @type {?} */ d = Hl[3];
        var /** @type {?} */ e = Hl[4];
        var /** @type {?} */ f = Hl[5];
        var /** @type {?} */ g = Hl[6];
        var /** @type {?} */ h = Hl[7];
        // Computation
        for (var /** @type {?} */ i = 0; i < 64; i++) {
            if (i < 16) {
                W[i] = M[offset + i] | 0;
            }
            else {
                var /** @type {?} */ gamma0x = W[i - 15];
                var /** @type {?} */ gamma0 = ((gamma0x << 25) | (gamma0x >>> 7)) ^
                    ((gamma0x << 14) | (gamma0x >>> 18)) ^
                    (gamma0x >>> 3);
                var /** @type {?} */ gamma1x = W[i - 2];
                var /** @type {?} */ gamma1 = ((gamma1x << 15) | (gamma1x >>> 17)) ^
                    ((gamma1x << 13) | (gamma1x >>> 19)) ^
                    (gamma1x >>> 10);
                W[i] = gamma0 + W[i - 7] + gamma1 + W[i - 16];
            }
            var /** @type {?} */ ch = (e & f) ^ (~e & g);
            var /** @type {?} */ maj = (a & b) ^ (a & c) ^ (b & c);
            var /** @type {?} */ sigma0 = ((a << 30) | (a >>> 2)) ^ ((a << 19) | (a >>> 13)) ^ ((a << 10) | (a >>> 22));
            var /** @type {?} */ sigma1 = ((e << 26) | (e >>> 6)) ^ ((e << 21) | (e >>> 11)) ^ ((e << 7) | (e >>> 25));
            var /** @type {?} */ t1 = h + sigma1 + ch + K[i] + W[i];
            var /** @type {?} */ t2 = sigma0 + maj;
            h = g;
            g = f;
            f = e;
            e = (d + t1) | 0;
            d = c;
            c = b;
            b = a;
            a = (t1 + t2) | 0;
        }
        // Intermediate hash value
        Hl[0] = (Hl[0] + a) | 0;
        Hl[1] = (Hl[1] + b) | 0;
        Hl[2] = (Hl[2] + c) | 0;
        Hl[3] = (Hl[3] + d) | 0;
        Hl[4] = (Hl[4] + e) | 0;
        Hl[5] = (Hl[5] + f) | 0;
        Hl[6] = (Hl[6] + g) | 0;
        Hl[7] = (Hl[7] + h) | 0;
    };
    /**
     * @return {?}
     */
    SHA256.prototype._doFinalize = /**
     * @return {?}
     */
    function () {
        var /** @type {?} */ nBitsTotal = this._nDataBytes * 8;
        var /** @type {?} */ nBitsLeft = this._data.sigBytes * 8;
        // Add padding
        this._data.words[nBitsLeft >>> 5] |= 0x80 << (24 - nBitsLeft % 32);
        this._data.words[(((nBitsLeft + 64) >>> 9) << 4) + 14] = Math.floor(nBitsTotal / 0x100000000);
        this._data.words[(((nBitsLeft + 64) >>> 9) << 4) + 15] = nBitsTotal;
        this._data.sigBytes = this._data.words.length * 4;
        // Hash final blocks
        this._process();
        // Return final computed hash
        return this._hash;
    };
    return SHA256;
}(Hasher));

/**
 * @fileoverview added by tsickle
 * @suppress {checkTypes} checked by tsc
 */
var NoPadding = /** @class */ (function () {
    function NoPadding() {
    }
    /**
     * Doesn't pad the data provided.
     *
     * \@example
     *
     *     NoPadding.pad(wordArray, 4);
     * @param {?} data The data to pad.
     * @param {?} blockSize The multiple that the data should be padded to.
     *
     * @return {?}
     */
    NoPadding.pad = /**
     * Doesn't pad the data provided.
     *
     * \@example
     *
     *     NoPadding.pad(wordArray, 4);
     * @param {?} data The data to pad.
     * @param {?} blockSize The multiple that the data should be padded to.
     *
     * @return {?}
     */
    function (data, blockSize) {
    };
    /**
     * Doesn't unpad the data provided.
     *
     * \@example
     *
     *     NoPadding.unpad(wordArray);
     * @param {?} data The data to unpad.
     *
     * @return {?}
     */
    NoPadding.unpad = /**
     * Doesn't unpad the data provided.
     *
     * \@example
     *
     *     NoPadding.unpad(wordArray);
     * @param {?} data The data to unpad.
     *
     * @return {?}
     */
    function (data) {
    };
    return NoPadding;
}());

/**
 * @fileoverview added by tsickle
 * @suppress {checkTypes} checked by tsc
 */
var ECBEncryptor = /** @class */ (function (_super) {
    (0,tslib__WEBPACK_IMPORTED_MODULE_0__.__extends)(ECBEncryptor, _super);
    function ECBEncryptor() {
        return _super !== null && _super.apply(this, arguments) || this;
    }
    /**
     * Processes the data block at offset.
     *
     * \@example
     *
     *     mode.processBlock(data.words, offset);
     * @param {?} words The data words to operate on.
     * @param {?} offset The offset where the block starts.
     *
     * @return {?}
     */
    ECBEncryptor.prototype.processBlock = /**
     * Processes the data block at offset.
     *
     * \@example
     *
     *     mode.processBlock(data.words, offset);
     * @param {?} words The data words to operate on.
     * @param {?} offset The offset where the block starts.
     *
     * @return {?}
     */
    function (words, offset) {
        this._cipher.encryptBlock(words, offset);
    };
    return ECBEncryptor;
}(BlockCipherModeAlgorithm));

/**
 * @fileoverview added by tsickle
 * @suppress {checkTypes} checked by tsc
 */
var ECBDecryptor = /** @class */ (function (_super) {
    (0,tslib__WEBPACK_IMPORTED_MODULE_0__.__extends)(ECBDecryptor, _super);
    function ECBDecryptor() {
        return _super !== null && _super.apply(this, arguments) || this;
    }
    /**
     * Processes the data block at offset.
     *
     * \@example
     *
     *     mode.processBlock(data.words, offset);
     * @param {?} words The data words to operate on.
     * @param {?} offset The offset where the block starts.
     *
     * @return {?}
     */
    ECBDecryptor.prototype.processBlock = /**
     * Processes the data block at offset.
     *
     * \@example
     *
     *     mode.processBlock(data.words, offset);
     * @param {?} words The data words to operate on.
     * @param {?} offset The offset where the block starts.
     *
     * @return {?}
     */
    function (words, offset) {
        this._cipher.decryptBlock(words, offset);
    };
    return ECBDecryptor;
}(BlockCipherModeAlgorithm));

/**
 * @fileoverview added by tsickle
 * @suppress {checkTypes} checked by tsc
 */
/**
 * Cipher Block Chaining mode.
 * @abstract
 */
var ECB = /** @class */ (function (_super) {
    (0,tslib__WEBPACK_IMPORTED_MODULE_0__.__extends)(ECB, _super);
    function ECB() {
        return _super !== null && _super.apply(this, arguments) || this;
    }
    ECB.Encryptor = ECBEncryptor;
    ECB.Decryptor = ECBDecryptor;
    return ECB;
}(BlockCipherMode));

/**
 * @fileoverview added by tsickle
 * @suppress {checkTypes} checked by tsc
 */
var /** @type {?} */ lib = {
    BlockCipher: BlockCipher,
    WordArray: WordArray,
    CipherParams: CipherParams,
    Hasher: Hasher,
    SerializableCipher: SerializableCipher,
    PasswordBasedCipher: PasswordBasedCipher
};
var /** @type {?} */ algo = {
    AES: AES,
    SHA256: SHA256
};
var /** @type {?} */ enc = {
    Utf8: Utf8,
    Hex: Hex
};
var /** @type {?} */ pad = {
    NoPadding: NoPadding,
    PKCS7: PKCS7
};
var /** @type {?} */ mode = {
    CBC: CBC,
    ECB: ECB
};
// HELPERS /////////////////////////////////////////////////////////////////////////////////////////
var /** @type {?} */ AES$1 = lib.BlockCipher._createHelper(algo.AES);
var /** @type {?} */ SHA256$1 = lib.Hasher._createHelper(algo.SHA256);

/**
 * @fileoverview added by tsickle
 * @suppress {checkTypes} checked by tsc
 */

/**
 * @fileoverview added by tsickle
 * @suppress {checkTypes} checked by tsc
 */


//# sourceMappingURL=crypto-ts.js.map


/***/ }),
/* 12 */
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

"use strict";
__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   "__assign": () => (/* binding */ __assign),
/* harmony export */   "__asyncDelegator": () => (/* binding */ __asyncDelegator),
/* harmony export */   "__asyncGenerator": () => (/* binding */ __asyncGenerator),
/* harmony export */   "__asyncValues": () => (/* binding */ __asyncValues),
/* harmony export */   "__await": () => (/* binding */ __await),
/* harmony export */   "__awaiter": () => (/* binding */ __awaiter),
/* harmony export */   "__classPrivateFieldGet": () => (/* binding */ __classPrivateFieldGet),
/* harmony export */   "__classPrivateFieldSet": () => (/* binding */ __classPrivateFieldSet),
/* harmony export */   "__createBinding": () => (/* binding */ __createBinding),
/* harmony export */   "__decorate": () => (/* binding */ __decorate),
/* harmony export */   "__exportStar": () => (/* binding */ __exportStar),
/* harmony export */   "__extends": () => (/* binding */ __extends),
/* harmony export */   "__generator": () => (/* binding */ __generator),
/* harmony export */   "__importDefault": () => (/* binding */ __importDefault),
/* harmony export */   "__importStar": () => (/* binding */ __importStar),
/* harmony export */   "__makeTemplateObject": () => (/* binding */ __makeTemplateObject),
/* harmony export */   "__metadata": () => (/* binding */ __metadata),
/* harmony export */   "__param": () => (/* binding */ __param),
/* harmony export */   "__read": () => (/* binding */ __read),
/* harmony export */   "__rest": () => (/* binding */ __rest),
/* harmony export */   "__spread": () => (/* binding */ __spread),
/* harmony export */   "__spreadArrays": () => (/* binding */ __spreadArrays),
/* harmony export */   "__values": () => (/* binding */ __values)
/* harmony export */ });
/*! *****************************************************************************
Copyright (c) Microsoft Corporation.

Permission to use, copy, modify, and/or distribute this software for any
purpose with or without fee is hereby granted.

THE SOFTWARE IS PROVIDED "AS IS" AND THE AUTHOR DISCLAIMS ALL WARRANTIES WITH
REGARD TO THIS SOFTWARE INCLUDING ALL IMPLIED WARRANTIES OF MERCHANTABILITY
AND FITNESS. IN NO EVENT SHALL THE AUTHOR BE LIABLE FOR ANY SPECIAL, DIRECT,
INDIRECT, OR CONSEQUENTIAL DAMAGES OR ANY DAMAGES WHATSOEVER RESULTING FROM
LOSS OF USE, DATA OR PROFITS, WHETHER IN AN ACTION OF CONTRACT, NEGLIGENCE OR
OTHER TORTIOUS ACTION, ARISING OUT OF OR IN CONNECTION WITH THE USE OR
PERFORMANCE OF THIS SOFTWARE.
***************************************************************************** */
/* global Reflect, Promise */

var extendStatics = function(d, b) {
    extendStatics = Object.setPrototypeOf ||
        ({ __proto__: [] } instanceof Array && function (d, b) { d.__proto__ = b; }) ||
        function (d, b) { for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p]; };
    return extendStatics(d, b);
};

function __extends(d, b) {
    extendStatics(d, b);
    function __() { this.constructor = d; }
    d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
}

var __assign = function() {
    __assign = Object.assign || function __assign(t) {
        for (var s, i = 1, n = arguments.length; i < n; i++) {
            s = arguments[i];
            for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p)) t[p] = s[p];
        }
        return t;
    }
    return __assign.apply(this, arguments);
}

function __rest(s, e) {
    var t = {};
    for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p) && e.indexOf(p) < 0)
        t[p] = s[p];
    if (s != null && typeof Object.getOwnPropertySymbols === "function")
        for (var i = 0, p = Object.getOwnPropertySymbols(s); i < p.length; i++) {
            if (e.indexOf(p[i]) < 0 && Object.prototype.propertyIsEnumerable.call(s, p[i]))
                t[p[i]] = s[p[i]];
        }
    return t;
}

function __decorate(decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
}

function __param(paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
}

function __metadata(metadataKey, metadataValue) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(metadataKey, metadataValue);
}

function __awaiter(thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
}

function __generator(thisArg, body) {
    var _ = { label: 0, sent: function() { if (t[0] & 1) throw t[1]; return t[1]; }, trys: [], ops: [] }, f, y, t, g;
    return g = { next: verb(0), "throw": verb(1), "return": verb(2) }, typeof Symbol === "function" && (g[Symbol.iterator] = function() { return this; }), g;
    function verb(n) { return function (v) { return step([n, v]); }; }
    function step(op) {
        if (f) throw new TypeError("Generator is already executing.");
        while (_) try {
            if (f = 1, y && (t = op[0] & 2 ? y["return"] : op[0] ? y["throw"] || ((t = y["return"]) && t.call(y), 0) : y.next) && !(t = t.call(y, op[1])).done) return t;
            if (y = 0, t) op = [op[0] & 2, t.value];
            switch (op[0]) {
                case 0: case 1: t = op; break;
                case 4: _.label++; return { value: op[1], done: false };
                case 5: _.label++; y = op[1]; op = [0]; continue;
                case 7: op = _.ops.pop(); _.trys.pop(); continue;
                default:
                    if (!(t = _.trys, t = t.length > 0 && t[t.length - 1]) && (op[0] === 6 || op[0] === 2)) { _ = 0; continue; }
                    if (op[0] === 3 && (!t || (op[1] > t[0] && op[1] < t[3]))) { _.label = op[1]; break; }
                    if (op[0] === 6 && _.label < t[1]) { _.label = t[1]; t = op; break; }
                    if (t && _.label < t[2]) { _.label = t[2]; _.ops.push(op); break; }
                    if (t[2]) _.ops.pop();
                    _.trys.pop(); continue;
            }
            op = body.call(thisArg, _);
        } catch (e) { op = [6, e]; y = 0; } finally { f = t = 0; }
        if (op[0] & 5) throw op[1]; return { value: op[0] ? op[1] : void 0, done: true };
    }
}

function __createBinding(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}

function __exportStar(m, exports) {
    for (var p in m) if (p !== "default" && !exports.hasOwnProperty(p)) exports[p] = m[p];
}

function __values(o) {
    var s = typeof Symbol === "function" && Symbol.iterator, m = s && o[s], i = 0;
    if (m) return m.call(o);
    if (o && typeof o.length === "number") return {
        next: function () {
            if (o && i >= o.length) o = void 0;
            return { value: o && o[i++], done: !o };
        }
    };
    throw new TypeError(s ? "Object is not iterable." : "Symbol.iterator is not defined.");
}

function __read(o, n) {
    var m = typeof Symbol === "function" && o[Symbol.iterator];
    if (!m) return o;
    var i = m.call(o), r, ar = [], e;
    try {
        while ((n === void 0 || n-- > 0) && !(r = i.next()).done) ar.push(r.value);
    }
    catch (error) { e = { error: error }; }
    finally {
        try {
            if (r && !r.done && (m = i["return"])) m.call(i);
        }
        finally { if (e) throw e.error; }
    }
    return ar;
}

function __spread() {
    for (var ar = [], i = 0; i < arguments.length; i++)
        ar = ar.concat(__read(arguments[i]));
    return ar;
}

function __spreadArrays() {
    for (var s = 0, i = 0, il = arguments.length; i < il; i++) s += arguments[i].length;
    for (var r = Array(s), k = 0, i = 0; i < il; i++)
        for (var a = arguments[i], j = 0, jl = a.length; j < jl; j++, k++)
            r[k] = a[j];
    return r;
};

function __await(v) {
    return this instanceof __await ? (this.v = v, this) : new __await(v);
}

function __asyncGenerator(thisArg, _arguments, generator) {
    if (!Symbol.asyncIterator) throw new TypeError("Symbol.asyncIterator is not defined.");
    var g = generator.apply(thisArg, _arguments || []), i, q = [];
    return i = {}, verb("next"), verb("throw"), verb("return"), i[Symbol.asyncIterator] = function () { return this; }, i;
    function verb(n) { if (g[n]) i[n] = function (v) { return new Promise(function (a, b) { q.push([n, v, a, b]) > 1 || resume(n, v); }); }; }
    function resume(n, v) { try { step(g[n](v)); } catch (e) { settle(q[0][3], e); } }
    function step(r) { r.value instanceof __await ? Promise.resolve(r.value.v).then(fulfill, reject) : settle(q[0][2], r); }
    function fulfill(value) { resume("next", value); }
    function reject(value) { resume("throw", value); }
    function settle(f, v) { if (f(v), q.shift(), q.length) resume(q[0][0], q[0][1]); }
}

function __asyncDelegator(o) {
    var i, p;
    return i = {}, verb("next"), verb("throw", function (e) { throw e; }), verb("return"), i[Symbol.iterator] = function () { return this; }, i;
    function verb(n, f) { i[n] = o[n] ? function (v) { return (p = !p) ? { value: __await(o[n](v)), done: n === "return" } : f ? f(v) : v; } : f; }
}

function __asyncValues(o) {
    if (!Symbol.asyncIterator) throw new TypeError("Symbol.asyncIterator is not defined.");
    var m = o[Symbol.asyncIterator], i;
    return m ? m.call(o) : (o = typeof __values === "function" ? __values(o) : o[Symbol.iterator](), i = {}, verb("next"), verb("throw"), verb("return"), i[Symbol.asyncIterator] = function () { return this; }, i);
    function verb(n) { i[n] = o[n] && function (v) { return new Promise(function (resolve, reject) { v = o[n](v), settle(resolve, reject, v.done, v.value); }); }; }
    function settle(resolve, reject, d, v) { Promise.resolve(v).then(function(v) { resolve({ value: v, done: d }); }, reject); }
}

function __makeTemplateObject(cooked, raw) {
    if (Object.defineProperty) { Object.defineProperty(cooked, "raw", { value: raw }); } else { cooked.raw = raw; }
    return cooked;
};

function __importStar(mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (Object.hasOwnProperty.call(mod, k)) result[k] = mod[k];
    result.default = mod;
    return result;
}

function __importDefault(mod) {
    return (mod && mod.__esModule) ? mod : { default: mod };
}

function __classPrivateFieldGet(receiver, privateMap) {
    if (!privateMap.has(receiver)) {
        throw new TypeError("attempted to get private field on non-instance");
    }
    return privateMap.get(receiver);
}

function __classPrivateFieldSet(receiver, privateMap, value) {
    if (!privateMap.has(receiver)) {
        throw new TypeError("attempted to set private field on non-instance");
    }
    privateMap.set(receiver, value);
    return value;
}


/***/ }),
/* 13 */
/***/ ((__unused_webpack_module, exports, __webpack_require__) => {

"use strict";

Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.RustyCryptoPanel = void 0;
const vscode_1 = __webpack_require__(1);
// Taken from oficial example:
// https://github.com/microsoft/vscode-extension-samples/tree/main/webview-view-sample
// https://github.com/microsoft/vscode-extension-samples/blob/main/webview-view-sample/src/extension.ts
class RustyCryptoPanel {
    constructor(panel, extensionUri) {
        this._disposables = [];
        this._panel = panel;
        this._extensionUri = extensionUri;
        // Set the webview's initial html content
        this._update();
        // Listen for when the panel is disposed
        // This happens when the user closes the panel or when the panel is closed programatically
        this._panel.onDidDispose(() => this.dispose(), null, this._disposables);
        /*
        // Handle messages from the webview
        this._panel.webview.onDidReceiveMessage(
            (message) => {
                switch (message.command) {
                    case "alert":
                        window.showErrorMessage(message.text);
                        return;
                }
            },
            null,
            this._disposables
        );
        */
    }
    static createOrShow(extensionUri) {
        const column = vscode_1.window.activeTextEditor
            ? vscode_1.window.activeTextEditor.viewColumn
            : undefined;
        // If panel exists, show it.
        if (RustyCryptoPanel.currentPanel) {
            RustyCryptoPanel.currentPanel._panel.reveal(column);
            RustyCryptoPanel.currentPanel._update();
            return;
        }
        // Otherwise, create the panel as new.
        const panel = vscode_1.window.createWebviewPanel(RustyCryptoPanel.viewType, "rusty-crypto", column || vscode_1.ViewColumn.One, {
            // Enable javascript in webview
            enableScripts: true,
            // And restrict the webview to only loading content from our extension's `media` directory.
            localResourceRoots: [
                vscode_1.Uri.joinPath(extensionUri, "media"),
                vscode_1.Uri.joinPath(extensionUri, "dist/compiled")
            ]
        });
        RustyCryptoPanel.currentPanel = new RustyCryptoPanel(panel, extensionUri);
    }
    static kill() {
        RustyCryptoPanel.currentPanel?.dispose();
        RustyCryptoPanel.currentPanel = undefined;
    }
    static revive(panel, extensionUri) {
        RustyCryptoPanel.currentPanel = new RustyCryptoPanel(panel, extensionUri);
    }
    dispose() {
        RustyCryptoPanel.currentPanel = undefined;
        // Clean up our resources
        this._panel.dispose();
        while (this._disposables.length) {
            const x = this._disposables.pop();
            if (x) {
                x.dispose();
            }
        }
    }
    async _update() {
        const webview = this._panel.webview;
        this._panel.webview.html = this._getHtmlForWebview(webview);
        webview.onDidReceiveMessage(async (data) => {
            switch (data.type) {
                case "onInfo": {
                    if (!data.value) {
                        return;
                    }
                    vscode_1.window.showInformationMessage(data.value);
                    break;
                }
                case "onError": {
                    if (!data.value) {
                        return;
                    }
                    vscode_1.window.showErrorMessage(data.value);
                    break;
                }
            }
        });
    }
    _getHtmlForWebview(webview) {
        // And the uri we use to load this script in the webview
        // Local path to css styles
        const styleResetPath = vscode_1.Uri.joinPath(this._extensionUri, "media", "reset.css");
        const stylePathVSPath = vscode_1.Uri.joinPath(this._extensionUri, "media", "vscode.css");
        const stylePathMainPath = vscode_1.Uri.joinPath(this._extensionUri, "media", "main.css");
        const scriptMainPath = vscode_1.Uri.joinPath(this._extensionUri, "dist/compiled", "App.js");
        // Uri to load styles into webview
        const stylesResetUri = webview.asWebviewUri(styleResetPath);
        const stylesVSUri = webview.asWebviewUri(stylePathVSPath);
        const stylesMainUri = webview.asWebviewUri(stylePathMainPath);
        const scriptMainUri = webview.asWebviewUri(scriptMainPath);
        // Use a nonce to only allow specific scripts to be run
        const nonce = getNonce();
        return `<!DOCTYPE html>
			<html lang="en">
			<head>
				<meta charset="UTF-8">
				<!--
					Use a content security policy to only allow loading images from https or from our extension directory,
					and only allow scripts that have a specific nonce.
				-->
				<meta http-equiv="Content-Security-Policy" content="default-src 'none'; style-src ${webview.cspSource}; script-src 'nonce-${nonce}';">
				<meta name="viewport" content="width=device-width, initial-scale=1.0">
				<link href="${stylesResetUri}" rel="stylesheet">
				<link href="${stylesVSUri}" rel="stylesheet">
				<link href="${stylesMainUri}" rel="stylesheet">
				
				<title>Rusty-Crypto</title>
			</head>
			<body />
            <script src="${scriptMainUri}" nonce="${nonce}"/>
			</html>`;
    }
}
exports.RustyCryptoPanel = RustyCryptoPanel;
RustyCryptoPanel.viewType = "rusty-crypto";
function getNonce() {
    let text = '';
    const possible = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    for (let i = 0; i < 32; i++) {
        text += possible.charAt(Math.floor(Math.random() * possible.length));
    }
    return text;
}


/***/ })
/******/ 	]);
/************************************************************************/
/******/ 	// The module cache
/******/ 	var __webpack_module_cache__ = {};
/******/ 	
/******/ 	// The require function
/******/ 	function __webpack_require__(moduleId) {
/******/ 		// Check if module is in cache
/******/ 		var cachedModule = __webpack_module_cache__[moduleId];
/******/ 		if (cachedModule !== undefined) {
/******/ 			return cachedModule.exports;
/******/ 		}
/******/ 		// Create a new module (and put it into the cache)
/******/ 		var module = __webpack_module_cache__[moduleId] = {
/******/ 			// no module.id needed
/******/ 			// no module.loaded needed
/******/ 			exports: {}
/******/ 		};
/******/ 	
/******/ 		// Execute the module function
/******/ 		__webpack_modules__[moduleId](module, module.exports, __webpack_require__);
/******/ 	
/******/ 		// Return the exports of the module
/******/ 		return module.exports;
/******/ 	}
/******/ 	
/************************************************************************/
/******/ 	/* webpack/runtime/define property getters */
/******/ 	(() => {
/******/ 		// define getter functions for harmony exports
/******/ 		__webpack_require__.d = (exports, definition) => {
/******/ 			for(var key in definition) {
/******/ 				if(__webpack_require__.o(definition, key) && !__webpack_require__.o(exports, key)) {
/******/ 					Object.defineProperty(exports, key, { enumerable: true, get: definition[key] });
/******/ 				}
/******/ 			}
/******/ 		};
/******/ 	})();
/******/ 	
/******/ 	/* webpack/runtime/hasOwnProperty shorthand */
/******/ 	(() => {
/******/ 		__webpack_require__.o = (obj, prop) => (Object.prototype.hasOwnProperty.call(obj, prop))
/******/ 	})();
/******/ 	
/******/ 	/* webpack/runtime/make namespace object */
/******/ 	(() => {
/******/ 		// define __esModule on exports
/******/ 		__webpack_require__.r = (exports) => {
/******/ 			if(typeof Symbol !== 'undefined' && Symbol.toStringTag) {
/******/ 				Object.defineProperty(exports, Symbol.toStringTag, { value: 'Module' });
/******/ 			}
/******/ 			Object.defineProperty(exports, '__esModule', { value: true });
/******/ 		};
/******/ 	})();
/******/ 	
/************************************************************************/
/******/ 	
/******/ 	// startup
/******/ 	// Load entry module and return exports
/******/ 	// This entry module is referenced by other modules so it can't be inlined
/******/ 	var __webpack_exports__ = __webpack_require__(0);
/******/ 	module.exports = __webpack_exports__;
/******/ 	
/******/ })()
;
//# sourceMappingURL=extension.js.map