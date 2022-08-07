import {
        window,
        WebviewPanel,
        Uri,
        Disposable,
        ViewColumn,
        Webview
    } from "vscode";
import { readFileSync } from 'fs';

// Taken from oficial example:
// https://github.com/microsoft/vscode-extension-samples/tree/main/webview-view-sample
// https://github.com/microsoft/vscode-extension-samples/blob/main/webview-view-sample/src/extension.ts

export class RustyCryptoPanel {
    public static currentPanel: RustyCryptoPanel | undefined;

    public static readonly viewType = "rusty-crypto";

    private readonly _panel: WebviewPanel;
    private readonly _extensionUri: Uri;
    private _disposables: Disposable[] = [];

    public static createOrShow(extensionUri: Uri) {
        const column = window.activeTextEditor
            ? window.activeTextEditor.viewColumn
            : undefined;

        // If panel exists, show it.
        if (RustyCryptoPanel.currentPanel) {
            RustyCryptoPanel.currentPanel._panel.reveal(column);
            RustyCryptoPanel.currentPanel._update();
            return;
        }

        // Otherwise, create the panel as new.
        const panel = window.createWebviewPanel(
            RustyCryptoPanel.viewType,
            "rusty-crypto",
            column || ViewColumn.One,
            {
                // Enable javascript in webview
                enableScripts: true,

                // And restrict the webview to only loading content from our extension's `media` directory.
                localResourceRoots: [
                    Uri.joinPath(extensionUri, "media"),
                    Uri.joinPath(extensionUri, "out/compiled")
                ]
            }
        );

        RustyCryptoPanel.currentPanel = new RustyCryptoPanel(panel, extensionUri);
    }

    public static kill() {
        RustyCryptoPanel.currentPanel?.dispose();
        RustyCryptoPanel.currentPanel = undefined;
    }

    public static revive(panel: WebviewPanel, extensionUri: Uri) {
        RustyCryptoPanel.currentPanel = new RustyCryptoPanel(panel, extensionUri);
    }

    private constructor(panel: WebviewPanel, extensionUri: Uri) {
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

    public dispose() {
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

    private async _update() {
        const webview = this._panel.webview;

        this._panel.webview.html = this._getHtmlForWebview(webview);
        webview.onDidReceiveMessage(async (data) => {
            switch (data.type) {
                case "onInfo": {
                    if (!data.value) {
                        return;
                    }
                    window.showInformationMessage(data.value);
                    break;
                }
                case "onError": {
                    if (!data.value) {
                        return;
                    }
                    window.showErrorMessage(data.value);
                    break;
                }
            }
        });
    }

    private _getHtmlForWebview(webview: Webview): string {
        // And the uri we use to load this script in the webview
        const scriptUri = webview.asWebviewUri(
            Uri.joinPath(this._extensionUri, "out", "compiled/swiper.js")
        );

        // Local path to css styles
        const styleResetPath = Uri.joinPath(
            this._extensionUri,
            "media",
            "reset.css"
        );
        const stylePathVSPath = Uri.joinPath(
            this._extensionUri,
            "media",
            "vscode.css"
        );
        const stylePathMainPath = Uri.joinPath(
            this._extensionUri,
            "media",
            "main.css"
        );
        const htmlPathPanelPath = Uri.joinPath(
            this._extensionUri,
            "media",
            "panel.html"
        );

        // Uri to load styles into webview
        const stylesResetUri = webview.asWebviewUri(styleResetPath);
        const stylesVSUri = webview.asWebviewUri(stylePathVSPath);
        const stylesMainUri = webview.asWebviewUri(stylePathMainPath);
        const htmlPanelUri = webview.asWebviewUri(htmlPathPanelPath);

        const htmlPanelBody = readFileSync(htmlPanelUri.fsPath);

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
			<body>
                ${htmlPanelBody}
            </body>
			</html>`;
    }
}

function getNonce() {
    let text = '';
    const possible = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    for (let i = 0; i < 32; i++) {
        text += possible.charAt(Math.floor(Math.random() * possible.length));
    }
    return text;
}
