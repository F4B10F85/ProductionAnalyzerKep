"use strict";

const { contextBridge, ipcRenderer } = require("electron");

contextBridge.exposeInMainWorld("productionAPI", {
    saveImport: importData => ipcRenderer.invoke("db:saveImport", importData),
    getAllImports: () => ipcRenderer.invoke("db:getAllImports"),
    getAnalysisDateBounds: () => ipcRenderer.invoke("db:getAnalysisDateBounds"),
    getRecordsByDateRange: (startDate, endDate) =>
        ipcRenderer.invoke("db:getRecordsByDateRange", startDate, endDate),
    getRecordsByODCL: odcl => ipcRenderer.invoke("db:getRecordsByODCL", odcl),
    getAllRecords: () => ipcRenderer.invoke("db:getAllRecords"),
    deleteImport: importId => ipcRenderer.invoke("db:deleteImport", importId),
    getDatabasePath: () => ipcRenderer.invoke("db:getDatabasePath")
});
