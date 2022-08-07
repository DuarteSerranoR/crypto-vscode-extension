// The module 'vscode' contains the VS Code extensibility API
// Import the module and reference it with the alias vscode in your code below
import {
	commands,
	window,
	Disposable,
	ExtensionContext
  } from "vscode";

import open = require('open');
import { RustyCryptoPanel } from "./panel";
import { Crypto } from "./crypto";

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

	const encryptor: Crypto = new Crypto();

	console.log("Extension active!");

	// https://code.visualstudio.com/docs/getstarted/userinterface
	// https://code.visualstudio.com/api/references/contribution-points
	let disposables: Disposable[] = [

		// TODO - add side bar
		// DONE - add commands from f1 prompt

		// Encryption commands
		commands.registerCommand('rusty-crypto.encrypt', async () => {

			const editor = window.activeTextEditor;
			let selectedText = editor?.document.getText(editor.selection);

			if (selectedText !== undefined && selectedText !== '') {

				let token: string = encryptor.encrypt(selectedText);
				window.showInformationMessage(token);

			} else {

				window.showErrorMessage("No selected text detected!!");

				selectedText = await window.showInputBox({
					placeHolder: "Input the text to encrypt:"
				});

				if (selectedText) {

					let token: string = encryptor.encrypt(selectedText);
					window.showInformationMessage(token);

				}
				
			}

		}),

		commands.registerCommand('rusty-crypto.decrypt', async () => {

			const editor = window.activeTextEditor;
			let selectedText = editor?.document.getText(editor.selection);

			if (selectedText !== undefined && selectedText !== '') {

				let token: string = encryptor.decrypt(selectedText);
				window.showInformationMessage(token);

			} else {

				window.showErrorMessage("No selected text detected!!");

				selectedText = await window.showInputBox({
					placeHolder: "Input the text to encrypt:"
				});

				if (selectedText) {

					let token: string = encryptor.decrypt(selectedText);
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
		})

	];

	disposables.forEach(disposable => {
		context.subscriptions.push(disposable);
	});
}

// this method is called when your extension is deactivated
export function deactivate() { }
