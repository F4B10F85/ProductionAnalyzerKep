"use strict";

const {
    app,
    BrowserWindow,
    ipcMain
} = require("electron");

const path =
    require("path");

const {
    DatabaseSync
} = require("node:sqlite");


let database = null;


function getDatabasePath() {

    return path.join(
        app.getPath("userData"),
        "ProductionAnalyzerKep.db"
    );

}


function getDatabase() {

    if (database) {

        return database;

    }


    database =
        new DatabaseSync(
            getDatabasePath()
        );


    database.exec(`

        PRAGMA journal_mode = WAL;

        PRAGMA synchronous = NORMAL;

        PRAGMA foreign_keys = ON;


        CREATE TABLE IF NOT EXISTS imports (

            importId TEXT PRIMARY KEY,

            odcl TEXT NOT NULL,

            fileName TEXT NOT NULL DEFAULT '',

            sheetName TEXT NOT NULL DEFAULT '',

            importedAt TEXT NOT NULL,

            rowCount INTEGER NOT NULL DEFAULT 0

        );


        CREATE TABLE IF NOT EXISTS records (

            id TEXT PRIMARY KEY,

            importId TEXT NOT NULL,

            odcl TEXT NOT NULL DEFAULT '',

            dataConsegna TEXT NOT NULL DEFAULT '',

            data TEXT NOT NULL,

            FOREIGN KEY (importId)

                REFERENCES imports(importId)

                ON DELETE CASCADE

        );


        CREATE INDEX IF NOT EXISTS
            idx_records_dataConsegna

        ON records(
            dataConsegna
        );


        CREATE INDEX IF NOT EXISTS
            idx_records_odcl

        ON records(
            odcl
        );


        CREATE INDEX IF NOT EXISTS
            idx_records_odcl_dataConsegna

        ON records(
            odcl,
            dataConsegna
        );


        CREATE INDEX IF NOT EXISTS
            idx_records_importId

        ON records(
            importId
        );


        CREATE INDEX IF NOT EXISTS
            idx_imports_importedAt

        ON imports(
            importedAt
        );


        CREATE INDEX IF NOT EXISTS
            idx_imports_odcl

        ON imports(
            odcl
        );

    `);


    return database;

}


function parseRecord(
    row
) {

    try {

        return JSON.parse(
            row.data
        );

    }
    catch (
        error
    ) {

        return {

            id:
                row.id,

            importId:
                row.importId,

            odcl:
                row.odcl,

            dataConsegna:
                row.dataConsegna

        };

    }

}


function saveImport(
    importData
) {

    if (
        !importData ||
        !importData.importId
    ) {

        throw new Error(
            "ID importazione non specificato."
        );

    }


    const db =
        getDatabase();


    const importId =
        String(
            importData.importId
        );


    const odcl =
        String(
            importData.odcl ??
            ""
        ).trim();


    const fileName =
        String(
            importData.fileName ??
            ""
        );


    const sheetName =
        String(
            importData.sheetName ??
            ""
        );


    const importedAt =
        String(
            importData.importedAt ??
            new Date().toISOString()
        );


    const rowCount =
        Number(
            importData.rowCount ||
            0
        );


    const records =
        Array.isArray(
            importData.records
        )
            ? importData.records
            : [];


    const transaction =
        db.transaction(
            data => {

                db.prepare(`

                    INSERT INTO imports (

                        importId,

                        odcl,

                        fileName,

                        sheetName,

                        importedAt,

                        rowCount

                    )

                    VALUES (
                        ?,
                        ?,
                        ?,
                        ?,
                        ?,
                        ?
                    )

                    ON CONFLICT(importId)

                    DO UPDATE SET

                        odcl =
                            excluded.odcl,

                        fileName =
                            excluded.fileName,

                        sheetName =
                            excluded.sheetName,

                        importedAt =
                            excluded.importedAt,

                        rowCount =
                            excluded.rowCount

                `)
                .run(

                    importId,

                    odcl,

                    fileName,

                    sheetName,

                    importedAt,

                    rowCount

                );


                db.prepare(`

                    DELETE FROM records

                    WHERE importId = ?

                `)
                .run(
                    importId
                );


                const insertRecord =
                    db.prepare(`

                        INSERT INTO records (

                            id,

                            importId,

                            odcl,

                            dataConsegna,

                            data

                        )

                        VALUES (
                            ?,
                            ?,
                            ?,
                            ?,
                            ?
                        )

                    `);


                for (
                    const record
                    of records
                ) {

                    const id =
                        String(
                            record?.id ??
                            `${importId}-${Math.random()
                                .toString(36)
                                .slice(2)}`
                        );


                    const recordOdcl =
                        String(
                            record?.odcl ??
                            odcl
                        ).trim();


                    const dataConsegna =
                        String(
                            record?.dataConsegna ??
                            ""
                        ).trim();


                    insertRecord.run(

                        id,

                        importId,

                        recordOdcl,

                        dataConsegna,

                        JSON.stringify(
                            record ??
                            {}
                        )

                    );

                }

            }
        );


    transaction(
        importData
    );


    return importId;

}


function getAllImports() {

    const db =
        getDatabase();


    return db.prepare(`

        SELECT

            importId,

            odcl,

            fileName,

            sheetName,

            importedAt,

            rowCount

        FROM imports

        ORDER BY
            importedAt DESC

    `).all();

}


function getAnalysisDateBounds() {

    const db =
        getDatabase();


    const row =
        db.prepare(`

            SELECT

                MIN(
                    dataConsegna
                ) AS minDate,

                MAX(
                    dataConsegna
                ) AS maxDate

            FROM records

            WHERE
                dataConsegna != ''

        `).get();


    const minDate =
        row?.minDate ||
        null;


    const maxDate =
        row?.maxDate ||
        null;


    return {

        minDate,

        maxDate,

        minYear:
            minDate
                ? String(
                    minDate
                ).slice(
                    0,
                    4
                )
                : null,

        maxYear:
            maxDate
                ? String(
                    maxDate
                ).slice(
                    0,
                    4
                )
                : null

    };

}


function getRecordsByDateRange(
    startDate,
    endDate
) {

    if (
        !startDate ||
        !endDate
    ) {

        return [];

    }


    const db =
        getDatabase();


    const rows =
        db.prepare(`

            SELECT
                data

            FROM records

            WHERE
                dataConsegna >= ?

                AND
                dataConsegna < ?

            ORDER BY
                dataConsegna ASC

        `).all(

            String(
                startDate
            ),

            String(
                endDate
            )

        );


    return rows.map(
        parseRecord
    );

}


function getRecordsByODCL(
    odcl
) {

    const normalized =
        String(
            odcl ??
            ""
        ).trim();


    if (!normalized) {

        return [];

    }


    const db =
        getDatabase();


    const rows =
        db.prepare(`

            SELECT
                data

            FROM records

            WHERE
                odcl = ?

            ORDER BY
                dataConsegna ASC

        `).all(
            normalized
        );


    return rows.map(
        parseRecord
    );

}


function getAllRecords() {

    const db =
        getDatabase();


    const rows =
        db.prepare(`

            SELECT
                data

            FROM records

            ORDER BY
                dataConsegna ASC

        `).all();


    return rows.map(
        parseRecord
    );

}


function deleteImport(
    importId
) {

    const normalized =
        String(
            importId ??
            ""
        ).trim();


    if (!normalized) {

        throw new Error(
            "ID importazione non specificato."
        );

    }


    const db =
        getDatabase();


    db.prepare(`

        DELETE FROM imports

        WHERE
            importId = ?

    `)
    .run(
        normalized
    );


    return true;

}


function registerDatabaseHandlers() {

    ipcMain.handle(
        "db:saveImport",
        (
            event,
            importData
        ) =>
            saveImport(
                importData
            )
    );


    ipcMain.handle(
        "db:getAllImports",
        () =>
            getAllImports()
    );


    ipcMain.handle(
        "db:getAnalysisDateBounds",
        () =>
            getAnalysisDateBounds()
    );


    ipcMain.handle(
        "db:getRecordsByDateRange",
        (
            event,
            startDate,
            endDate
        ) =>
            getRecordsByDateRange(
                startDate,
                endDate
            )
    );


    ipcMain.handle(
        "db:getRecordsByODCL",
        (
            event,
            odcl
        ) =>
            getRecordsByODCL(
                odcl
            )
    );


    ipcMain.handle(
        "db:getAllRecords",
        () =>
            getAllRecords()
    );


    ipcMain.handle(
        "db:deleteImport",
        (
            event,
            importId
        ) =>
            deleteImport(
                importId
            )
    );


    ipcMain.handle(
        "db:getDatabasePath",
        () =>
            getDatabasePath()
    );

}


function createWindow() {

    const mainWindow =
        new BrowserWindow({

            width:
                1440,

            height:
                900,

            minWidth:
                1100,

            minHeight:
                700,

            title:
                "Production Analyzer Kep",

            icon:
                path.join(
                    __dirname,
                    "ingranaggi2.ico"
                ),

            backgroundColor:
                "#f4f6f9",

            autoHideMenuBar:
                true,

            webPreferences: {

                preload:
                    path.join(
                        __dirname,
                        "preload.cjs"
                    ),

                contextIsolation:
                    true,

                nodeIntegration:
                    false

            }

        });


    mainWindow.loadFile(
        path.join(
            __dirname,
            "index.html"
        )
    );

}


app.whenReady().then(
    () => {

        registerDatabaseHandlers();

        getDatabase();

        createWindow();


        app.on(
            "activate",
            () => {

                if (
                    BrowserWindow
                        .getAllWindows()
                        .length === 0
                ) {

                    createWindow();

                }

            }
        );

    }
);


app.on(
    "window-all-closed",
    () => {

        if (
            database
        ) {

            database.close();

            database =
                null;

        }


        if (
            process.platform !==
            "darwin"
        ) {

            app.quit();

        }

    }
);