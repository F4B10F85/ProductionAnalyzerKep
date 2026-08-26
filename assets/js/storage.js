"use strict";

/*
|--------------------------------------------------------------------------
| Production Analyzer Kep
|--------------------------------------------------------------------------
| Persistenza dati.
| Electron: SQLite locale tramite preload / IPC.
| Live Server: IndexedDB di fallback per i test web.
|--------------------------------------------------------------------------
*/

const LOCAL_DB_NAME = "ProductionAnalyzerKep";
const LOCAL_DB_VERSION = 2;

const IMPORTS_COLLECTION = "imports";
const RECORDS_COLLECTION = "records";

let dbPromise = null;

const memoryCache = {
    imports: null,
    dateBounds: null,
    ranges: new Map(),
    odcl: new Map(),
    allRecords: null
};

const isElectron =
    typeof window !== "undefined" &&
    !!window.productionAPI;


/*
|--------------------------------------------------------------------------
| CACHE
|--------------------------------------------------------------------------
*/

function invalidateStorageCaches() {

    memoryCache.imports =
        null;

    memoryCache.dateBounds =
        null;

    memoryCache.ranges.clear();

    memoryCache.odcl.clear();

    memoryCache.allRecords =
        null;


    if (
        typeof invalidateAnalysisCache ===
        "function"
    ) {

        invalidateAnalysisCache();

    }

}


/*
|--------------------------------------------------------------------------
| INDEXEDDB
|--------------------------------------------------------------------------
*/

function openIndexedDB() {

    if (dbPromise) {

        return dbPromise;

    }


    dbPromise =
        new Promise(
            (
                resolve,
                reject
            ) => {

                const request =
                    indexedDB.open(
                        LOCAL_DB_NAME,
                        LOCAL_DB_VERSION
                    );


                request.onupgradeneeded =
                    event => {

                        const db =
                            request.result;


                        let importsStore;


                        if (
                            !db.objectStoreNames.contains(
                                IMPORTS_COLLECTION
                            )
                        ) {

                            importsStore =
                                db.createObjectStore(
                                    IMPORTS_COLLECTION,
                                    {
                                        keyPath:
                                            "importId"
                                    }
                                );

                        }
                        else {

                            importsStore =
                                event
                                    .target
                                    .transaction
                                    .objectStore(
                                        IMPORTS_COLLECTION
                                    );

                        }


                        if (
                            !importsStore.indexNames.contains(
                                "odcl"
                            )
                        ) {

                            importsStore.createIndex(
                                "odcl",
                                "odcl",
                                {
                                    unique:
                                        false
                                }
                            );

                        }


                        if (
                            !importsStore.indexNames.contains(
                                "importedAt"
                            )
                        ) {

                            importsStore.createIndex(
                                "importedAt",
                                "importedAt",
                                {
                                    unique:
                                        false
                                }
                            );

                        }


                        let recordsStore;


                        if (
                            !db.objectStoreNames.contains(
                                RECORDS_COLLECTION
                            )
                        ) {

                            recordsStore =
                                db.createObjectStore(
                                    RECORDS_COLLECTION,
                                    {
                                        keyPath:
                                            "id"
                                    }
                                );

                        }
                        else {

                            recordsStore =
                                event
                                    .target
                                    .transaction
                                    .objectStore(
                                        RECORDS_COLLECTION
                                    );

                        }


                        [
                            [
                                "dataConsegna",
                                "dataConsegna"
                            ],
                            [
                                "odcl",
                                "odcl"
                            ],
                            [
                                "importId",
                                "importId"
                            ]
                        ]
                        .forEach(
                            (
                                [
                                    name,
                                    keyPath
                                ]
                            ) => {

                                if (
                                    !recordsStore.indexNames.contains(
                                        name
                                    )
                                ) {

                                    recordsStore.createIndex(
                                        name,
                                        keyPath,
                                        {
                                            unique:
                                                false
                                        }
                                    );

                                }

                            }
                        );

                    };


                request.onsuccess =
                    () => {

                        resolve(
                            request.result
                        );

                    };


                request.onerror =
                    () => {

                        dbPromise =
                            null;

                        reject(
                            request.error ||
                            new Error(
                                "Impossibile aprire il database locale."
                            )
                        );

                    };

            }
        );


    return dbPromise;

}


/*
|--------------------------------------------------------------------------
| SALVATAGGIO INDEXEDDB
|--------------------------------------------------------------------------
*/

async function saveImportIndexedDB(
    importData
) {

    const db =
        await openIndexedDB();


    const importRecord = {

        importId:
            String(
                importData.importId
            ),

        odcl:
            String(
                importData.odcl ??
                ""
            ),

        fileName:
            String(
                importData.fileName ??
                ""
            ),

        sheetName:
            String(
                importData.sheetName ??
                ""
            ),

        importedAt:
            String(
                importData.importedAt ??
                new Date().toISOString()
            ),

        rowCount:
            Number(
                importData.rowCount ||
                0
            )

    };


    await new Promise(
        (
            resolve,
            reject
        ) => {

            const transaction =
                db.transaction(
                    [
                        IMPORTS_COLLECTION,
                        RECORDS_COLLECTION
                    ],
                    "readwrite"
                );


            transaction
                .objectStore(
                    IMPORTS_COLLECTION
                )
                .put(
                    importRecord
                );


            for (
                const record
                of (
                    importData.records ||
                    []
                )
            ) {

                transaction
                    .objectStore(
                        RECORDS_COLLECTION
                    )
                    .put(
                        record
                    );

            }


            transaction.oncomplete =
                resolve;


            transaction.onerror =
                () =>
                    reject(
                        transaction.error
                    );


            transaction.onabort =
                () =>
                    reject(
                        transaction.error
                    );

        }
    );


    return importRecord.importId;

}


/*
|--------------------------------------------------------------------------
| LETTURA IMPORTAZIONI INDEXEDDB
|--------------------------------------------------------------------------
*/

async function getAllImportsIndexedDB() {

    const db =
        await openIndexedDB();


    const imports =
        await new Promise(
            (
                resolve,
                reject
            ) => {

                const transaction =
                    db.transaction(
                        IMPORTS_COLLECTION,
                        "readonly"
                    );


                const request =
                    transaction
                        .objectStore(
                            IMPORTS_COLLECTION
                        )
                        .getAll();


                request.onsuccess =
                    () =>
                        resolve(
                            request.result ||
                            []
                        );


                request.onerror =
                    () =>
                        reject(
                            request.error
                        );

            }
        );


    imports.sort(
        (
            a,
            b
        ) =>
            String(
                b.importedAt ||
                ""
            )
            .localeCompare(
                String(
                    a.importedAt ||
                    ""
                )
            )
    );


    return imports;

}


/*
|--------------------------------------------------------------------------
| ESTREMI DATE INDEXEDDB
|--------------------------------------------------------------------------
*/

async function getAnalysisDateBoundsIndexedDB() {

    const db =
        await openIndexedDB();


    return await new Promise(
        (
            resolve,
            reject
        ) => {

            const transaction =
                db.transaction(
                    RECORDS_COLLECTION,
                    "readonly"
                );


            const index =
                transaction
                    .objectStore(
                        RECORDS_COLLECTION
                    )
                    .index(
                        "dataConsegna"
                    );


            let minDate =
                null;

            let maxDate =
                null;


            let pending =
                2;


            const done =
                () => {

                    pending -= 1;


                    if (
                        pending !== 0
                    ) {

                        return;

                    }


                    resolve({

                        minDate,

                        maxDate,

                        minYear:
                            minDate
                                ? minDate.slice(
                                    0,
                                    4
                                )
                                : null,

                        maxYear:
                            maxDate
                                ? maxDate.slice(
                                    0,
                                    4
                                )
                                : null

                    });

                };


            const first =
                index.openCursor();


            first.onsuccess =
                event => {

                    const cursor =
                        event.target.result;


                    minDate =
                        cursor
                            ? String(
                                cursor.value
                                    ?.dataConsegna ??
                                ""
                            ).trim()
                            : null;


                    done();

                };


            first.onerror =
                () =>
                    reject(
                        first.error
                    );


            const last =
                index.openCursor(
                    null,
                    "prev"
                );


            last.onsuccess =
                event => {

                    const cursor =
                        event.target.result;


                    maxDate =
                        cursor
                            ? String(
                                cursor.value
                                    ?.dataConsegna ??
                                ""
                            ).trim()
                            : null;


                    done();

                };


            last.onerror =
                () =>
                    reject(
                        last.error
                    );

        }
    );

}


/*
|--------------------------------------------------------------------------
| RECORD PER PERIODO INDEXEDDB
|--------------------------------------------------------------------------
*/

async function getRecordsByDateRangeIndexedDB(
    startDate,
    endDate
) {

    const db =
        await openIndexedDB();


    return await new Promise(
        (
            resolve,
            reject
        ) => {

            const transaction =
                db.transaction(
                    RECORDS_COLLECTION,
                    "readonly"
                );


            const index =
                transaction
                    .objectStore(
                        RECORDS_COLLECTION
                    )
                    .index(
                        "dataConsegna"
                    );


            const request =
                index.getAll(
                    IDBKeyRange.bound(
                        startDate,
                        endDate,
                        false,
                        true
                    )
                );


            request.onsuccess =
                () =>
                    resolve(
                        request.result ||
                        []
                    );


            request.onerror =
                () =>
                    reject(
                        request.error
                    );

        }
    );

}


/*
|--------------------------------------------------------------------------
| RECORD PER ODCL INDEXEDDB
|--------------------------------------------------------------------------
*/

async function getRecordsByODCLIndexedDB(
    odcl
) {

    const db =
        await openIndexedDB();


    return await new Promise(
        (
            resolve,
            reject
        ) => {

            const transaction =
                db.transaction(
                    RECORDS_COLLECTION,
                    "readonly"
                );


            const index =
                transaction
                    .objectStore(
                        RECORDS_COLLECTION
                    )
                    .index(
                        "odcl"
                    );


            const request =
                index.getAll(
                    String(
                        odcl
                    ).trim()
                );


            request.onsuccess =
                () =>
                    resolve(
                        request.result ||
                        []
                    );


            request.onerror =
                () =>
                    reject(
                        request.error
                    );

        }
    );

}


/*
|--------------------------------------------------------------------------
| TUTTI I RECORD INDEXEDDB
|--------------------------------------------------------------------------
*/

async function getAllRecordsIndexedDB() {

    const db =
        await openIndexedDB();


    return await new Promise(
        (
            resolve,
            reject
        ) => {

            const request =
                db
                    .transaction(
                        RECORDS_COLLECTION,
                        "readonly"
                    )
                    .objectStore(
                        RECORDS_COLLECTION
                    )
                    .getAll();


            request.onsuccess =
                () =>
                    resolve(
                        request.result ||
                        []
                    );


            request.onerror =
                () =>
                    reject(
                        request.error
                    );

        }
    );

}


/*
|--------------------------------------------------------------------------
| ELIMINAZIONE INDEXEDDB
|--------------------------------------------------------------------------
*/

async function deleteImportIndexedDB(
    importId
) {

    const db =
        await openIndexedDB();


    await new Promise(
        (
            resolve,
            reject
        ) => {

            const transaction =
                db.transaction(
                    [
                        IMPORTS_COLLECTION,
                        RECORDS_COLLECTION
                    ],
                    "readwrite"
                );


            const recordsStore =
                transaction.objectStore(
                    RECORDS_COLLECTION
                );


            const cursorRequest =
                recordsStore
                    .index(
                        "importId"
                    )
                    .openCursor(
                        String(
                            importId
                        )
                    );


            cursorRequest.onsuccess =
                event => {

                    const cursor =
                        event.target.result;


                    if (!cursor) {

                        transaction
                            .objectStore(
                                IMPORTS_COLLECTION
                            )
                            .delete(
                                String(
                                    importId
                                )
                            );

                        return;

                    }


                    cursor.delete();

                    cursor.continue();

                };


            cursorRequest.onerror =
                () =>
                    reject(
                        cursorRequest.error
                    );


            transaction.oncomplete =
                resolve;


            transaction.onerror =
                () =>
                    reject(
                        transaction.error
                    );

        }
    );

}


/*
|--------------------------------------------------------------------------
| API PUBBLICA
|--------------------------------------------------------------------------
*/

async function saveImport(
    importData
) {

    const result =
        isElectron
            ? await window.productionAPI.saveImport(
                importData
            )
            : await saveImportIndexedDB(
                importData
            );


    invalidateStorageCaches();


    return result;

}


async function getAllImports() {

    if (
        memoryCache.imports
    ) {

        return memoryCache.imports;

    }


    const result =
        isElectron
            ? await window.productionAPI.getAllImports()
            : await getAllImportsIndexedDB();


    memoryCache.imports =
        result;


    return result;

}


async function getAnalysisDateBounds() {

    if (
        memoryCache.dateBounds
    ) {

        return memoryCache.dateBounds;

    }


    const result =
        isElectron
            ? await window.productionAPI.getAnalysisDateBounds()
            : await getAnalysisDateBoundsIndexedDB();


    memoryCache.dateBounds =
        result;


    return result;

}


async function getRecordsByDateRange(
    startDate,
    endDate
) {

    if (
        !startDate ||
        !endDate
    ) {

        return [];

    }


    const cacheKey =
        `${startDate}|${endDate}`;


    if (
        memoryCache.ranges.has(
            cacheKey
        )
    ) {

        return memoryCache.ranges.get(
            cacheKey
        );

    }


    const result =
        isElectron
            ? await window.productionAPI.getRecordsByDateRange(
                startDate,
                endDate
            )
            : await getRecordsByDateRangeIndexedDB(
                startDate,
                endDate
            );


    memoryCache.ranges.set(
        cacheKey,
        result
    );


    return result;

}


async function getRecordsByODCL(
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


    if (
        memoryCache.odcl.has(
            normalized
        )
    ) {

        return memoryCache.odcl.get(
            normalized
        );

    }


    const result =
        isElectron
            ? await window.productionAPI.getRecordsByODCL(
                normalized
            )
            : await getRecordsByODCLIndexedDB(
                normalized
            );


    memoryCache.odcl.set(
        normalized,
        result
    );


    return result;

}


async function getAllRecords() {

    if (
        memoryCache.allRecords
    ) {

        return memoryCache.allRecords;

    }


    const result =
        isElectron
            ? await window.productionAPI.getAllRecords()
            : await getAllRecordsIndexedDB();


    memoryCache.allRecords =
        result;


    return result;

}


async function deleteImport(
    importId
) {

    const result =
        isElectron
            ? await window.productionAPI.deleteImport(
                importId
            )
            : await deleteImportIndexedDB(
                importId
            );


    invalidateStorageCaches();


    return result;

}


function getLocalDatabasePath() {

    if (!isElectron) {

        return null;

    }


    return window.productionAPI.getDatabasePath();

}


function convertFirestoreDate(
    value
) {

    if (!value) {

        return null;

    }


    if (
        value instanceof Date
    ) {

        return value.toISOString();

    }


    if (
        typeof value.toDate ===
        "function"
    ) {

        return value
            .toDate()
            .toISOString();

    }


    return String(
        value
    );

}