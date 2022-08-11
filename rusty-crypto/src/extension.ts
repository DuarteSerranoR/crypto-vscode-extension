// The module 'vscode' contains the VS Code extensibility API
// Import the module and reference it with the alias vscode in your code below
import {
	commands,
	window,
	Disposable,
	ExtensionContext,
	WebviewPanel,
	WebviewOptions,
	Uri
  } from "vscode";

  
import * as open from "open";


import { Crypto } from "./crypto";
import { RustyCryptoPanel } from "./panel";




export var crypto = new Crypto();

// this method is called when your extension is activated
// your extension is activated the very first time the command is executed
export function activate(context: ExtensionContext) {

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
	let disposables: Disposable[] = [

		// TODO - add side bar

		// Encryption commands
		commands.registerCommand('rusty-crypto.encrypt', async () => {

			const editor = window.activeTextEditor;
			let selectedText = editor?.document.getText(editor.selection);

			if (selectedText !== undefined && selectedText !== '') {

				let token: string = crypto.encrypt(selectedText);
				window.showInformationMessage(token);

			} else {

				window.showErrorMessage("No selected text detected!!");

				selectedText = await window.showInputBox({
					placeHolder: "Input the text to encrypt:"
				});

				if (selectedText) {

					let token: string = crypto.encrypt(selectedText);
					window.showInformationMessage(token);

				}
				
			}

		}),

		commands.registerCommand('rusty-crypto.decrypt', async () => {

			const editor = window.activeTextEditor;
			let selectedText = editor?.document.getText(editor.selection);

			if (selectedText !== undefined && selectedText !== '') {

				let token: string = crypto.decrypt(selectedText);
				window.showInformationMessage(token);

			} else {

				window.showErrorMessage("No selected text detected!!");

				selectedText = await window.showInputBox({
					placeHolder: "Input the text to encrypt:"
				});

				if (selectedText) {

					let token: string = crypto.decrypt(selectedText);
					window.showInformationMessage(token);

				}
			}

		}),

		// Test command
		commands.registerCommand('rusty-crypto.test', async () => {
			const response = await window.showInformationMessage('Working?', "yes", "no");

			if (response === "yes") {
				window.showInformationMessage("Nice!");
			} else {
				const redirect = await window.showInformationMessage("Tell me what is wrong at the git page -> 'https://github.com/DuarteSerranoR/crypto-vscode-extension';", "Check out", "Ignore");

				if (redirect === "Check out") {
					await open('https://github.com/DuarteSerranoR/crypto-vscode-extension');
				}
			}
		}),

		// Panel
		commands.registerCommand("rusty-crypto.show_panel", () => {
			RustyCryptoPanel.createOrShow(context.extensionUri);
		}),

		// Dev
		commands.registerCommand("rusty-crypto.refresh", async () => {
			RustyCryptoPanel.kill();
			RustyCryptoPanel.createOrShow(context.extensionUri);
			await commands.executeCommand("workbench.action.webview.openDeveloperTools");
		})

	];

	disposables.forEach(disposable => {
		context.subscriptions.push(disposable);
	});

	if (window.registerWebviewPanelSerializer) {
		// Make sure we register a serializer in activation event
		window.registerWebviewPanelSerializer(RustyCryptoPanel.viewType, {
			async deserializeWebviewPanel(webviewPanel: WebviewPanel, state: any) {
				console.log(`Got state: ${state}`);
				// Reset the webview options so we use latest uri for `localResourceRoots`.
				webviewPanel.webview.options = getWebviewOptions(context.extensionUri);
				//CatCodingPanel.revive(webviewPanel, context.extensionUri);
			}
		});
	}
}

function getWebviewOptions(extensionUri: Uri): WebviewOptions {
	return {
		// Enable javascript in the webview
		enableScripts: true,

		// And restrict the webview to only loading content from our extension's `media` directory.
		localResourceRoots: [Uri.joinPath(extensionUri, 'media')]
	};
}

// this method is called when your extension is deactivated
export function deactivate() { }
