/**
 * Declutter ExtendScript - After Effects Integration
 * This file contains the ExtendScript functions that interface with After Effects
 */

// Global variables
var declutterVersion = "1.5.2";
var debugMode = false;

/**
 * Get project data including assets, folders, and compositions
 * @returns {string} JSON string of project data
 */
function getProjectData() {
    try {
        if (!app.project) {
            return JSON.stringify({ error: "No active project" });
        }

        var projectData = {
            name: app.project.file ? app.project.file.name : "Untitled Project",
            assets: [],
            folders: [],
            compositions: []
        };

        // Get all items in project
        for (var i = 1; i <= app.project.numItems; i++) {
            var item = app.project.item(i);
            
            if (item instanceof FolderItem) {
                projectData.folders.push(getFolderData(item));
            } else if (item instanceof FootageItem) {
                projectData.assets.push(getAssetData(item));
            } else if (item instanceof CompItem) {
                projectData.compositions.push(getCompositionData(item));
            }
        }

        return JSON.stringify(projectData);
    } catch (error) {
        return JSON.stringify({ error: error.toString() });
    }
}

/**
 * Get folder data
 * @param {FolderItem} folder - Folder item
 * @returns {object} Folder data
 */
function getFolderData(folder) {
    return {
        id: "folder_" + folder.id,
        name: folder.name,
        color: getLabelColorName(folder.label),
        parent: folder.parentFolder ? "folder_" + folder.parentFolder.id : null,
        children: [],
        created: null, // AE doesn't provide creation date
        numItems: folder.numItems
    };
}

/**
 * Get asset data
 * @param {FootageItem} asset - Asset item
 * @returns {object} Asset data
 */
function getAssetData(asset) {
    var assetData = {
        id: "asset_" + asset.id,
        name: asset.name,
        type: getAssetType(asset),
        size: 0, // AE doesn't provide file size directly
        folder: asset.parentFolder ? "folder_" + asset.parentFolder.id : null,
        tags: [], // Custom tags would need to be stored separately
        created: null,
        modified: null
    };

    // Add type-specific properties
    if (asset.mainSource && asset.mainSource.isStill === false) {
        // Video footage
        assetData.duration = asset.duration;
        assetData.width = asset.width;
        assetData.height = asset.height;
        assetData.frameRate = asset.frameRate;
        assetData.hasAudio = asset.hasAudio;
    } else if (asset.mainSource && asset.mainSource.isStill === true) {
        // Still image
        assetData.width = asset.width;
        assetData.height = asset.height;
    }

    return assetData;
}

/**
 * Get composition data
 * @param {CompItem} comp - Composition item
 * @returns {object} Composition data
 */
function getCompositionData(comp) {
    return {
        id: "comp_" + comp.id,
        name: comp.name,
        width: comp.width,
        height: comp.height,
        duration: comp.duration,
        frameRate: comp.frameRate,
        folder: comp.parentFolder ? "folder_" + comp.parentFolder.id : null
    };
}

/**
 * Get asset type based on footage item
 * @param {FootageItem} asset - Asset item
 * @returns {string} Asset type
 */
function getAssetType(asset) {
    if (!asset.mainSource) return "other";
    
    if (asset.mainSource instanceof SolidSource) {
        return "solid";
    } else if (asset.mainSource instanceof FileSource) {
        var file = asset.mainSource.file;
        if (!file) return "missing";
        
        var extension = file.name.split('.').pop().toLowerCase();
        
        // Video formats
        if (extension.match(/^(mov|mp4|avi|mkv|m4v|wmv|flv|webm)$/)) {
            return "footage";
        }
        // Audio formats
        else if (extension.match(/^(wav|mp3|aac|m4a|aiff|flac)$/)) {
            return "audio";
        }
        // Image formats
        else if (extension.match(/^(jpg|jpeg|png|tiff|tif|psd|ai|eps|pdf)$/)) {
            return "image";
        }
        // After Effects projects
        else if (extension.match(/^(aep|aet)$/)) {
            return "composition";
        }
        
        return "other";
    }
    
    return "other";
}

/**
 * Get label color name
 * @param {number} labelIndex - Label index
 * @returns {string} Color name
 */
function getLabelColorName(labelIndex) {
    var colors = ["none", "red", "yellow", "aqua", "pink", "lavender", "peach", "sea foam", "blue", "green", "purple", "orange", "brown", "fuchsia", "cyan", "sandstone", "dark green"];
    return colors[labelIndex] || "none";
}

/**
 * Get label color index from name
 * @param {string} colorName - Color name
 * @returns {number} Label index
 */
function getLabelColorIndex(colorName) {
    var colors = ["none", "red", "yellow", "aqua", "pink", "lavender", "peach", "sea foam", "blue", "green", "purple", "orange", "brown", "fuchsia", "cyan", "sandstone", "dark green"];
    var index = colors.indexOf(colorName.toLowerCase());
    return index >= 0 ? index : 0;
}

/**
 * Create a new folder
 * @param {string} name - Folder name
 * @param {string} color - Folder color
 * @param {string} parentId - Parent folder ID (optional)
 * @returns {string} JSON string of created folder
 */
function createFolder(name, color, parentId) {
    try {
        app.beginUndoGroup("Create Folder");
        
        var parentFolder = null;
        if (parentId) {
            var parentIdNum = parseInt(parentId.replace("folder_", ""));
            parentFolder = app.project.itemByID(parentIdNum);
            if (!(parentFolder instanceof FolderItem)) {
                parentFolder = null;
            }
        }
        
        var folder = app.project.items.addFolder(name);
        folder.parentFolder = parentFolder;
        folder.label = getLabelColorIndex(color);
        
        var folderData = getFolderData(folder);
        
        app.endUndoGroup();
        
        // Dispatch event to CEP panel
        var event = new CSXSEvent();
        event.type = "com.aescripts.declutter.folderCreated";
        event.data = JSON.stringify(folderData);
        event.dispatch();
        
        return JSON.stringify(folderData);
    } catch (error) {
        app.endUndoGroup();
        return JSON.stringify({ error: error.toString() });
    }
}

/**
 * Move assets to folder
 * @param {array} assetIds - Array of asset IDs
 * @param {string} folderId - Target folder ID
 * @returns {string} Success status
 */
function moveAssetsToFolder(assetIds, folderId) {
    try {
        app.beginUndoGroup("Move Assets to Folder");
        
        var targetFolder = null;
        if (folderId) {
            var folderIdNum = parseInt(folderId.replace("folder_", ""));
            targetFolder = app.project.itemByID(folderIdNum);
            if (!(targetFolder instanceof FolderItem)) {
                return JSON.stringify({ error: "Target folder not found" });
            }
        }
        
        for (var i = 0; i < assetIds.length; i++) {
            var assetIdNum = parseInt(assetIds[i].replace("asset_", ""));
            var asset = app.project.itemByID(assetIdNum);
            
            if (asset) {
                asset.parentFolder = targetFolder;
            }
        }
        
        app.endUndoGroup();
        
        return JSON.stringify({ success: true });
    } catch (error) {
        app.endUndoGroup();
        return JSON.stringify({ error: error.toString() });
    }
}

/**
 * Rename folder
 * @param {string} folderId - Folder ID
 * @param {string} newName - New folder name
 * @returns {string} Success status
 */
function renameFolder(folderId, newName) {
    try {
        app.beginUndoGroup("Rename Folder");
        
        var folderIdNum = parseInt(folderId.replace("folder_", ""));
        var folder = app.project.itemByID(folderIdNum);
        
        if (!(folder instanceof FolderItem)) {
            return JSON.stringify({ error: "Folder not found" });
        }
        
        folder.name = newName;
        
        app.endUndoGroup();
        
        return JSON.stringify({ success: true });
    } catch (error) {
        app.endUndoGroup();
        return JSON.stringify({ error: error.toString() });
    }
}

/**
 * Delete folder
 * @param {string} folderId - Folder ID
 * @param {boolean} moveAssetsToParent - Whether to move assets to parent
 * @returns {string} Success status
 */
function deleteFolder(folderId, moveAssetsToParent) {
    try {
        app.beginUndoGroup("Delete Folder");
        
        var folderIdNum = parseInt(folderId.replace("folder_", ""));
        var folder = app.project.itemByID(folderIdNum);
        
        if (!(folder instanceof FolderItem)) {
            return JSON.stringify({ error: "Folder not found" });
        }
        
        if (moveAssetsToParent) {
            var parentFolder = folder.parentFolder;
            
            // Move all items to parent folder
            for (var i = folder.numItems; i >= 1; i--) {
                var item = folder.item(i);
                item.parentFolder = parentFolder;
            }
        }
        
        folder.remove();
        
        app.endUndoGroup();
        
        return JSON.stringify({ success: true });
    } catch (error) {
        app.endUndoGroup();
        return JSON.stringify({ error: error.toString() });
    }
}

/**
 * Set folder color
 * @param {string} folderId - Folder ID
 * @param {string} color - Color name
 * @returns {string} Success status
 */
function setFolderColor(folderId, color) {
    try {
        app.beginUndoGroup("Set Folder Color");
        
        var folderIdNum = parseInt(folderId.replace("folder_", ""));
        var folder = app.project.itemByID(folderIdNum);
        
        if (!(folder instanceof FolderItem)) {
            return JSON.stringify({ error: "Folder not found" });
        }
        
        folder.label = getLabelColorIndex(color);
        
        app.endUndoGroup();
        
        return JSON.stringify({ success: true });
    } catch (error) {
        app.endUndoGroup();
        return JSON.stringify({ error: error.toString() });
    }
}

/**
 * Get project statistics
 * @returns {string} JSON string of project stats
 */
function getProjectStats() {
    try {
        if (!app.project) {
            return JSON.stringify({ error: "No active project" });
        }

        var stats = {
            totalItems: app.project.numItems,
            folders: 0,
            footage: 0,
            compositions: 0,
            solids: 0,
            other: 0,
            unorganized: 0
        };

        for (var i = 1; i <= app.project.numItems; i++) {
            var item = app.project.item(i);
            
            if (item instanceof FolderItem) {
                stats.folders++;
            } else if (item instanceof CompItem) {
                stats.compositions++;
            } else if (item instanceof FootageItem) {
                if (item.mainSource instanceof SolidSource) {
                    stats.solids++;
                } else {
                    stats.footage++;
                }
                
                // Check if unorganized (in root)
                if (!item.parentFolder) {
                    stats.unorganized++;
                }
            } else {
                stats.other++;
            }
        }

        return JSON.stringify(stats);
    } catch (error) {
        return JSON.stringify({ error: error.toString() });
    }
}

/**
 * Save project
 * @returns {string} Success status
 */
function saveProject() {
    try {
        if (app.project.file) {
            app.project.save();
            return JSON.stringify({ success: true, message: "Project saved" });
        } else {
            return JSON.stringify({ error: "Project has no file path" });
        }
    } catch (error) {
        return JSON.stringify({ error: error.toString() });
    }
}

/**
 * Enable debug mode
 * @param {boolean} enabled - Whether debug is enabled
 */
function setDebugMode(enabled) {
    debugMode = enabled;
}

/**
 * Log debug message
 * @param {string} message - Debug message
 */
function debugLog(message) {
    if (debugMode) {
        $.writeln("[Declutter Debug] " + message);
    }
}

/**
 * Get Declutter version
 * @returns {string} Version string
 */
function getVersion() {
    return declutterVersion;
}

// Initialize
debugLog("Declutter ExtendScript loaded, version " + declutterVersion);