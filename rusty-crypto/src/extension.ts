// The module 'vscode' contains the VS Code extensibility API
// Import the module and reference it with the alias vscode in your code below
import {
	commands,
	window,
	Disposable,
	ExtensionContext
  } from "vscode";

  
import * as open from "open";


import { Crypto } from "./crypto";
import { RustyCryptoPanel } from "./panel";
import { SidebarProvider } from "./sidebar-provider";



var crypto = new Crypto();


var key: string;
export function setKey(_key: string) {
	key = _key;
}


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


	// Side Bar
  	const sidebarProvider = new SidebarProvider(context.extensionUri);

	console.log("Extension active!");

	// https://code.visualstudio.com/docs/getstarted/userinterface
	// https://code.visualstudio.com/api/references/contribution-points

	// https://microsoft.github.io/vscode-codicons/dist/codicon.html
	// https://github.com/microsoft/vscode-codicons

	// https://github.com/microsoft/vscode-extension-samples/tree/main/webview-view-sample

	// https://github.com/RustCrypto/AEADs

	let disposables: Disposable[] = [

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

			//if (!editor) {
			//	window.showInformationMessage("No active text editor!");
			//	return;
			//}

			//let selectedText: string | undefined = editor.document.getText(editor.selection);

			let selectedText: string | undefined = editor?.document.getText(editor.selection);

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



		// NOTE - everytime it comes here, the state at the "key" object needs to be current with the value you want to update, so, 
		//		  first update the key value and then run this to push it to all crypto objects!
		commands.registerCommand('rusty-crypto.pushKey', async () => {

			crypto.setKey(key);

			sidebarProvider._view?.webview.postMessage({
				command: "setKey",
				value: key
			});

			RustyCryptoPanel.currentPanel?._panel.webview.postMessage({
				command: "setKey",
				value: key
			});

			window.showInformationMessage(key);

		}),

		// TODO - config not updating on main page
		// TODO - get key on both panel and webview, to update crypto object everytime it gets disposed and recreated!!
		// TODO - snippet?

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

		// Side Bar
		window.registerWebviewViewProvider("rusty-crypto-sidebar", sidebarProvider),

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
}

// this method is called when your extension is deactivated
export function deactivate() { }
