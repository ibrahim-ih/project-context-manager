import * as vscode from 'vscode';
import * as fs from 'fs';
import * as path from 'path';

/**
 * Returns all subdirectories within a given folder.
 * @param workspacePath The root path to search in.
 * @returns Array of absolute paths to subdirectories.
 */
export function getSubfolders(workspacePath: string): string[] {
    try {
        return fs.readdirSync(workspacePath)
            .map((name: string): string => path.join(workspacePath, name))
            .filter((p: string): boolean => fs.existsSync(p) && fs.statSync(p).isDirectory());
    } catch (error) {
        vscode.window.showErrorMessage(`Failed to read directory ${workspacePath}: ${error}`);
        return [];
    }
}

/**
 * Parses the `.vscode/extensions.json` file for recommendations.
 * @param projectPath The root path of the selected project.
 * @returns An object containing recommended and unwanted extensions.
 */
function getExtensionsJson(projectPath: string): {
    recommendations: string[];
    unwantedRecommendations: string[];
} {
    const configPath: string = path.join(projectPath, '.vscode', 'extensions.json');
    if (!fs.existsSync(configPath)) {
        vscode.window.showWarningMessage(`No .vscode/extensions.json found in ${projectPath}`);
        return { recommendations: [], unwantedRecommendations: [] };
    }

    try {
        const raw: string = fs.readFileSync(configPath, 'utf-8');
        const json = JSON.parse(raw) as {
            recommendations?: string[];
            unwantedRecommendations?: string[];
        };
        return {
            recommendations: json.recommendations ?? [],
            unwantedRecommendations: json.unwantedRecommendations ?? []
        };
    } catch (err: unknown) {
        const errorMessage = err instanceof Error ? err.message : String(err);
        vscode.window.showErrorMessage(`Failed to parse .vscode/extensions.json: ${errorMessage}`);
        return { recommendations: [], unwantedRecommendations: [] };
    }
}

/**
 * Determines which extensions should be enabled or disabled.
 * @param recommended List of extension IDs to recommend.
 * @returns Lists of extensions to enable and disable.
 */
export function analyzeExtensions(recommended: string[]): {
    toEnable: string[];
    toDisable: string[];
} {
    const allExtensions: string[] = vscode.extensions.all.map((ext: vscode.Extension<any>) => ext.id);
    const toEnable: string[] = recommended.filter((id: string) => allExtensions.includes(id));
    const toDisable: string[] = allExtensions.filter((id: string) => !recommended.includes(id));
    return { toEnable, toDisable };
}

/**
 * Displays a message with lists of extensions to enable and disable.
 * @param toEnable List of extension IDs to enable.
 * @param toDisable List of extension IDs to disable.
 */
export async function showExtensionRecommendations(toEnable: string[], toDisable: string[]): Promise<void> {
    const enableList: string = toEnable.map((e: string) => `✅ ${e}`).join('\n');
    const disableList: string = toDisable.map((e: string) => `🚫 ${e}`).join('\n');
    const message: string = `Recommended Extensions:\n\nEnable/Install:\n${enableList}\n\nDisable:\n${disableList}`;

    const selection = await vscode.window.showInformationMessage(message, 'Open Extensions Panel');
    if (selection === 'Open Extensions Panel') {
        await vscode.commands.executeCommand('workbench.view.extensions');
    }
}

/**
 * Called when the extension is activated.
 */
export function activate(context: vscode.ExtensionContext): void {
    const disposable: vscode.Disposable = vscode.commands.registerCommand('projectContextManager.selectProject', async () => {
        const workspaceFolders: readonly vscode.WorkspaceFolder[] | undefined = vscode.workspace.workspaceFolders;

        if (!workspaceFolders || workspaceFolders.length === 0) {
            vscode.window.showErrorMessage('No workspace folder is open.');
            return;
        }

        const firstWorkspaceFolder = workspaceFolders[0];
        if (!firstWorkspaceFolder) {
            vscode.window.showErrorMessage('No workspace folder is available.');
            return;
        }

        const rootPath: string = firstWorkspaceFolder.uri.fsPath;
        const subfolders: string[] = getSubfolders(rootPath);

        if (subfolders.length === 0) {
            vscode.window.showInformationMessage('No subfolders found in the workspace.');
            return;
        }

        const selected: string | undefined = await vscode.window.showQuickPick(subfolders, {
            placeHolder: 'Select a project folder'
        });

        if (selected) {
            const { recommendations } = getExtensionsJson(selected);
            const { toEnable, toDisable } = analyzeExtensions(recommendations);
            await showExtensionRecommendations(toEnable, toDisable);
        }
    });

    context.subscriptions.push(disposable);
}

/**
 * Called when the extension is deactivated.
 */
export function deactivate(): void {}
