import * as vscode from 'vscode';
import * as fs from 'fs';
import * as path from 'path';

function getSubfolders(workspacePath: string): string[] {
    return fs.readdirSync(workspacePath)
        .map(name => path.join(workspacePath, name))
        .filter(p => fs.existsSync(p) && fs.statSync(p).isDirectory());
}

function getExtensionsJson(projectPath: string): { recommendations: string[], unwantedRecommendations: string[] } {
    const configPath = path.join(projectPath, '.vscode', 'extensions.json');
    if (!fs.existsSync(configPath)) {
        vscode.window.showWarningMessage(`No .vscode/extensions.json found in ${projectPath}`);
        return { recommendations: [], unwantedRecommendations: [] };
    }

    try {
        const raw = fs.readFileSync(configPath, 'utf-8');
        const json = JSON.parse(raw);
        return {
            recommendations: json.recommendations || [],
            unwantedRecommendations: json.unwantedRecommendations || []
        };
    } catch (err) {
        vscode.window.showErrorMessage(`Failed to parse .vscode/extensions.json: ${err.message}`);
        return { recommendations: [], unwantedRecommendations: [] };
    }
}

function analyzeExtensions(recommended: string[]): { toEnable: string[], toDisable: string[] } {
    const allExtensions = vscode.extensions.all.map(ext => ext.id);
    const toEnable = recommended.filter(id => allExtensions.includes(id));
    const toDisable = allExtensions.filter(id => !recommended.includes(id));
    return { toEnable, toDisable };
}

function showExtensionRecommendations(toEnable: string[], toDisable: string[]) {
    const enableList = toEnable.map(e => `✅ ${e}`).join('\n');
    const disableList = toDisable.map(e => `🚫 ${e}`).join('\n');
    const message = `Recommended Extensions:\n\nEnable/Install:\n${enableList}\n\nDisable:\n${disableList}`;
    
    vscode.window.showInformationMessage(message, 'Open Extensions Panel').then(selection => {
        if (selection === 'Open Extensions Panel') {
            vscode.commands.executeCommand('workbench.view.extensions');
        }
    });
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
            const { recommendations } = getExtensionsJson(selected);
            const { toEnable, toDisable } = analyzeExtensions(recommendations);
            showExtensionRecommendations(toEnable, toDisable);
        }
    });

    context.subscriptions.push(disposable);
}

export function deactivate() {}
