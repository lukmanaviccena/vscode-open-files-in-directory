import * as vscode from 'vscode';
import * as commands from './commands';


export function activate(context: vscode.ExtensionContext) {
    const subscriptions = [];

    subscriptions.push(
        vscode.commands.registerCommand(
            commands.createCommandName('currentDirFiles'),
            commands.openCurrentDirectoryFiles,
        ),
    );

    subscriptions.push(
        vscode.commands.registerCommand(
            commands.createCommandName('currentDirFilesRecursively'),
            commands.openCurrentDirectoryFilesRecursively,
        ),
    );

    // Add config change watcher
    subscriptions.push(
        vscode.workspace.onDidChangeConfiguration(e => {
            if (e.affectsConfiguration('vscode-open-files-in-directory.excludeFolders') ||
                e.affectsConfiguration('vscode-open-files-in-directory.excludeExtensions')) {
                vscode.window.showInformationMessage(
                    'Exclude configuration updated. Changes will take effect on next use.',
                    'OK'
                );
            }
        })
    );

    context.subscriptions.push(...subscriptions);
}

export function deactivate() {}
