import * as vscode from 'vscode';
import * as path from 'path';

const FOLDER_CONFIG_FILE = 'folder.jsonc';
const VSCODE_FOLDER = '.vscode';

/**
 * Get the workspace folder for a given URI
 * @param uri - The URI to find workspace folder for
 * @returns The workspace folder or undefined
 */
function getWorkspaceFolder(uri: vscode.Uri): vscode.WorkspaceFolder | undefined {
    return vscode.workspace.getWorkspaceFolder(uri);
}

/**
 * Normalize folder path relative to workspace root
 * Uses forward slashes for cross-platform compatibility
 * @param uri - The folder URI
 * @param workspaceFolder - The workspace folder
 * @returns Normalized relative path
 */
export function normalizeFolderPath(
    uri: vscode.Uri,
    workspaceFolder: vscode.WorkspaceFolder
): string {
    const workspacePath = workspaceFolder.uri.fsPath;
    const folderPath = uri.fsPath;
    const relativePath = path.relative(workspacePath, folderPath);
    // Normalize to use forward slashes for cross-platform compatibility
    return relativePath.split(path.sep).join('/');
}

/**
 * Get the path to the folder.jsonc config file
 * @param workspaceFolder - The workspace folder
 * @returns URI to the folder.jsonc file
 */
function getConfigFilePath(workspaceFolder: vscode.WorkspaceFolder): vscode.Uri {
    return vscode.Uri.joinPath(workspaceFolder.uri, VSCODE_FOLDER, FOLDER_CONFIG_FILE);
}

/**
 * Strip comments from JSONC content
 * @param content - JSONC content string
 * @returns JSON content without comments
 */
function stripJsonComments(content: string): string {
    // Remove single-line comments (// ...)
    content = content.replace(/\/\/.*$/gm, '');
    
    // Remove multi-line comments (/* ... */)
    content = content.replace(/\/\*[\s\S]*?\*\//g, '');
    
    return content.trim();
}

/**
 * Read disabled folders from .vscode/folder.jsonc
 * @param workspaceFolder - The workspace folder
 * @returns Array of disabled folder paths
 */
export async function readDisabledFolders(
    workspaceFolder: vscode.WorkspaceFolder
): Promise<string[]> {
    const configUri = getConfigFilePath(workspaceFolder);
    
    try {
        const data = await vscode.workspace.fs.readFile(configUri);
        const content = Buffer.from(data).toString('utf-8');
        // Strip comments from JSONC before parsing
        const jsonContent = stripJsonComments(content);
        const folders = JSON.parse(jsonContent);
        
        // Validate that it's an array
        if (Array.isArray(folders)) {
            return folders;
        }
        
        // If not valid, return empty array
        return [];
    } catch (error) {
        // File doesn't exist or invalid JSON, return empty array
        return [];
    }
}

/**
 * Write disabled folders to .vscode/folder.jsonc
 * @param workspaceFolder - The workspace folder
 * @param folders - Array of disabled folder paths
 */
export async function writeDisabledFolders(
    workspaceFolder: vscode.WorkspaceFolder,
    folders: string[]
): Promise<void> {
    const configUri = getConfigFilePath(workspaceFolder);
    const vscodeFolderUri = vscode.Uri.joinPath(workspaceFolder.uri, VSCODE_FOLDER);
    
    // Ensure .vscode folder exists
    try {
        await vscode.workspace.fs.createDirectory(vscodeFolderUri);
    } catch (error) {
        // Folder might already exist, ignore error
    }
    
    // Write the config file with JSONC format (supports comments)
    const jsonContent = JSON.stringify(folders, null, 2);
    const content = `// List of disabled folders (relative to workspace root)
// Folders in this list will not be opened when using "Open all files in directory"
${jsonContent}
`;
    const data = Buffer.from(content, 'utf-8');
    await vscode.workspace.fs.writeFile(configUri, data);
}

/**
 * Check if a folder is disabled
 * @param uri - The folder URI to check
 * @returns true if folder is disabled, false otherwise
 */
export async function isFolderDisabled(uri: vscode.Uri): Promise<boolean> {
    const workspaceFolder = getWorkspaceFolder(uri);
    if (!workspaceFolder) {
        return false;
    }
    
    const normalizedPath = normalizeFolderPath(uri, workspaceFolder);
    const disabledFolders = await readDisabledFolders(workspaceFolder);
    
    return disabledFolders.includes(normalizedPath);
}

/**
 * Toggle folder disable/enable status
 * @param uri - The folder URI to toggle
 * @returns true if folder is now disabled, false if enabled
 */
export async function toggleFolderInConfig(uri: vscode.Uri): Promise<boolean> {
    const workspaceFolder = getWorkspaceFolder(uri);
    if (!workspaceFolder) {
        throw new Error('No workspace folder found');
    }
    
    const normalizedPath = normalizeFolderPath(uri, workspaceFolder);
    const disabledFolders = await readDisabledFolders(workspaceFolder);
    
    const index = disabledFolders.indexOf(normalizedPath);
    let isNowDisabled: boolean;
    
    if (index === -1) {
        // Folder not in list, add it (disable)
        disabledFolders.push(normalizedPath);
        isNowDisabled = true;
    } else {
        // Folder in list, remove it (enable)
        disabledFolders.splice(index, 1);
        isNowDisabled = false;
    }
    
    await writeDisabledFolders(workspaceFolder, disabledFolders);
    
    return isNowDisabled;
}

