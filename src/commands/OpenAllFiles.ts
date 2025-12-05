import {
    OpenTextDocumentFulfilled,
    OpenTextDocumentRejected,
    ReadDirectoryFulfilled,
    ReadDirectoryRejected,
    Settings,
} from '../types';
import * as vscode from 'vscode';
import { extensionName } from '../const';
import { shouldProcessFile, checkFolderDisabled } from '../utils/FileFilter';

// Remove static config, we'll get it dynamically

export async function openAllFiles(
    uri: vscode.Uri,
    recursive: boolean = false,
    depth = 0,
    fileCount = 0,
) {
    // Check if this folder is disabled
    const isDisabled = await checkFolderDisabled(uri);
    if (isDisabled) {
        console.log(`Skipping disabled folder: ${uri.fsPath}`);
        return;
    }

    // Get fresh config every time
    const config = vscode.workspace
        .getConfiguration()
        .get(extensionName) as Settings;
    
    if (depth > config.maxRecursiveDepth) {
        // vscode.window.showErrorMessage(`config.maxRecursiveDepth`);
        console.log(
            `Reached recursion limit depth: ${depth} maxRecursiveDepth: ${config.maxRecursiveDepth}`,
            // TODO: add hint to edit the setting to recurse deeper
        );
        return;
    }

    if (fileCount > config.maxFiles) {
        // vscode.window.showErrorMessage(`config.maxFiles`);
        console.log(`Reached maxFiles limit: ${depth}`);
        // TODO: add hint to edit the setting to recurse deeper
        return;
    }

    const onReadDirectoryFulfilled = createOnReadDirectoryFulfilled(
        uri,
        recursive,
        depth,
        fileCount,
    );

    await vscode.workspace.fs
        .readDirectory(uri)
        .then(onReadDirectoryFulfilled, onReadDirectoryRejected);
}

const createOnReadDirectoryFulfilled = (
    uri: vscode.Uri,
    recursive: boolean = false,
    depth = 0,
    fileCount = 0,
): ReadDirectoryFulfilled => {
    return async (files) => {
        // Get fresh config every time
        const config = vscode.workspace
            .getConfiguration()
            .get(extensionName) as Settings;
            
        for (let [fileName, fileType] of files) {
            const filePath = vscode.Uri.joinPath(uri, fileName);

            // Check if file/directory should be processed (not excluded)
            if (!shouldProcessFile(fileName, fileType, config.excludeFolders, config.excludeExtensions)) {
                console.log(`Excluding ${fileType === vscode.FileType.Directory ? 'directory' : 'file'}: ${fileName}`);
                continue;
            }

            if (fileType === vscode.FileType.Directory && recursive) {
                // Check if subfolder is disabled before recursive call
                const isDisabled = await checkFolderDisabled(filePath);
                if (!isDisabled) {
                    openAllFiles(filePath, true, depth + 1, fileCount);
                } else {
                    console.log(`Skipping disabled folder: ${filePath.fsPath}`);
                }
                // avoid vscode.openTextDocument on directory
                continue;
            }

            const onOpenTextDocumentFulfilled: OpenTextDocumentFulfilled = (
                doc,
            ) => {
                fileCount++;
                vscode.window.showTextDocument(doc, { preview: false });
            };

            const onOpenTextDocumentRejected: OpenTextDocumentRejected = (
                error,
            ) => {
                if (error instanceof Error) {
                    // binary files can't be opened in the editor and error
                    console.log(
                        `Can't open [${fileName}]. Error: ${error?.message}`,
                    );
                }
            };

            vscode.workspace
                .openTextDocument(filePath)
                .then(onOpenTextDocumentFulfilled, onOpenTextDocumentRejected);
        }
    };
};

const onReadDirectoryRejected: ReadDirectoryRejected = (reason: any) => {
    if (reason instanceof Error) {
        vscode.window.showErrorMessage(
            `Can't read Directory. Error: ${reason.message}`,
        );
    } else {
        vscode.window.showErrorMessage(`Unknown Error: ${reason}`);
    }
};
