import * as vscode from 'vscode';
import * as fs from 'fs';
import * as path from 'path';

function getSubfolders(workspacePath: string): string[] {
    return fs.readdirSync(workspacePath)
        .map(name => path.join(workspacePath, name))
        .filter(p => fs.existsSync(p) && fs.statSync(p).isDirectory());
}

export function activate(context: vscode.ExtensionContext) {
    let disposable = vscode.commands.registerCommand('projectContextManager.selectProject', async () => {
        const workspaceFolders = vscode.workspace.workspaceFolders;
        if (!workspaceFolders || workspaceFolders.length === 0) {
            vscode.window.showErrorMessage('No workspace folder is open.');
            return;
        }

        const rootPath = workspaceFolders[0].uri.fsPath;
        const subfolders = getSubfolders(rootPath);

        const selected = await vscode.window.showQuickPick(subfolders, {
            placeHolder: 'Select a project folder'
        });

        if (selected) {
            vscode.window.showInformationMessage(`Selected project: ${selected}`);
            // You can now act based on the selected folder
        }
    });

    context.subscriptions.push(disposable);
}

export function deactivate() {}