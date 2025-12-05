import * as vscode from 'vscode';
import { isFolderDisabled } from './FolderConfig';

/**
 * Menu provider for dynamic context menu items
 * This allows us to show "Disable" or "Enable" based on folder status
 */
export class FolderMenuProvider implements vscode.Disposable {
    private disposable: vscode.Disposable;

    constructor() {
        // Register menu provider for explorer context menu
        this.disposable = vscode.commands.registerCommand(
            'vscode-open-files-in-directory._updateMenu',
            async (uri: vscode.Uri) => {
                // This command is used to update menu visibility
                // The actual menu items are controlled by when clauses
                return;
            }
        );
    }

    dispose() {
        this.disposable.dispose();
    }
}

