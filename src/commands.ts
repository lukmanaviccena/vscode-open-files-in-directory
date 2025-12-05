import * as vscode from 'vscode';
import { openAllFiles } from './commands/OpenAllFiles';
import { toggleFolderInConfig, isFolderDisabled } from './utils/FolderConfig';
const path = require('node:path');

export const createCommandName = (s: string) =>
    `vscode-open-files-in-directory.${s}`;

const getActiveEditorParentDirectory = () => {
    const uri = vscode.window.activeTextEditor?.document.uri;
    if (!uri) {
        return null;
    }
    const fsPath = path.dirname(uri.fsPath);
    return vscode.Uri.parse(fsPath);
};

const handleOpenFiles = async (uri: vscode.Uri, recursive: boolean) => {
    if (typeof uri === 'undefined') {
        const activeEditorDir = getActiveEditorParentDirectory();
        if (!activeEditorDir) {
            return vscode.window.showErrorMessage(
                'Open a file to open its sibling files',
            );
        }
        return openAllFiles(activeEditorDir, recursive);
    }

    return openAllFiles(uri, recursive);
};

export const openCurrentDirectoryFiles = async (uri: vscode.Uri) => {
    return handleOpenFiles(uri, false);
};

export const openCurrentDirectoryFilesRecursively = async (uri: vscode.Uri) => {
    return handleOpenFiles(uri, true);
};

const validateFolder = async (uri: vscode.Uri): Promise<boolean> => {
    if (!uri) {
        vscode.window.showErrorMessage(
            'Please select a folder to disable/enable',
        );
        return false;
    }

    // Check if it's a directory
    try {
        const stat = await vscode.workspace.fs.stat(uri);
        if (stat.type !== vscode.FileType.Directory) {
            vscode.window.showErrorMessage(
                'Please select a folder, not a file',
            );
            return false;
        }
    } catch (error) {
        vscode.window.showErrorMessage(
            'Unable to access the selected folder',
        );
        return false;
    }

    // Check if we have a workspace folder
    const workspaceFolder = vscode.workspace.getWorkspaceFolder(uri);
    if (!workspaceFolder) {
        vscode.window.showErrorMessage(
            'This folder is not part of any workspace',
        );
        return false;
    }

    return true;
};

export const disableFolder = async (uri: vscode.Uri) => {
    if (!(await validateFolder(uri))) {
        return;
    }

    const isCurrentlyDisabled = await isFolderDisabled(uri);
    if (isCurrentlyDisabled) {
        vscode.window.showInformationMessage('Folder is already disabled');
        return;
    }

    try {
        await toggleFolderInConfig(uri);
        const folderName = uri.fsPath.split(path.sep).pop() || 'folder';
        vscode.window.showInformationMessage(
            `Folder "${folderName}" is now disabled`,
        );
    } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';
        vscode.window.showErrorMessage(
            `Failed to disable folder: ${errorMessage}`,
        );
    }
};

export const enableFolder = async (uri: vscode.Uri) => {
    if (!(await validateFolder(uri))) {
        return;
    }

    const isCurrentlyDisabled = await isFolderDisabled(uri);
    if (!isCurrentlyDisabled) {
        vscode.window.showInformationMessage('Folder is already enabled');
        return;
    }

    try {
        await toggleFolderInConfig(uri);
        const folderName = uri.fsPath.split(path.sep).pop() || 'folder';
        vscode.window.showInformationMessage(
            `Folder "${folderName}" is now enabled`,
        );
    } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';
        vscode.window.showErrorMessage(
            `Failed to enable folder: ${errorMessage}`,
        );
    }
};

export const toggleFolderDisable = async (uri: vscode.Uri) => {
    if (!(await validateFolder(uri))) {
        return;
    }

    try {
        const isCurrentlyDisabled = await isFolderDisabled(uri);
        const isNowDisabled = await toggleFolderInConfig(uri);
        const folderName = uri.fsPath.split(path.sep).pop() || 'folder';
        const message = isNowDisabled
            ? `Folder "${folderName}" is now disabled`
            : `Folder "${folderName}" is now enabled`;
        vscode.window.showInformationMessage(message);
    } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';
        vscode.window.showErrorMessage(
            `Failed to toggle folder status: ${errorMessage}`,
        );
    }
};
