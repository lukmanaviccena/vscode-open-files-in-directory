import * as vscode from 'vscode';
import * as path from 'path';

/**
 * Check if a directory should be excluded based on configuration
 * @param dirName - Name of the directory
 * @param excludeFolders - Array of folder names to exclude
 * @returns true if directory should be excluded, false otherwise
 */
export function shouldExcludeDirectory(
    dirName: string, 
    excludeFolders: string[]
): boolean {
    return excludeFolders.includes(dirName);
}

/**
 * Check if a file extension should be excluded
 * @param fileName - Name of the file
 * @param excludeExtensions - Array of file extensions to exclude
 * @returns true if file extension should be excluded, false otherwise
 */
export function shouldExcludeExtension(
    fileName: string,
    excludeExtensions: string[]
): boolean {
    const ext = path.extname(fileName).toLowerCase();
    return excludeExtensions.some(excludedExt => ext === excludedExt.toLowerCase());
}

/**
 * Check if a file should be processed (not excluded)
 * @param fileName - Name of the file
 * @param fileType - Type of the file (file or directory)
 * @param excludeFolders - Array of folder names to exclude
 * @param excludeExtensions - Array of file extensions to exclude
 * @returns true if file should be processed, false if should be excluded
 */
export function shouldProcessFile(
    fileName: string,
    fileType: vscode.FileType,
    excludeFolders: string[],
    excludeExtensions: string[]
): boolean {
    // If it's a directory, check if it should be excluded
    if (fileType === vscode.FileType.Directory) {
        return !shouldExcludeDirectory(fileName, excludeFolders);
    }
    
    // For files, check if extension should be excluded
    return !shouldExcludeExtension(fileName, excludeExtensions);
}
