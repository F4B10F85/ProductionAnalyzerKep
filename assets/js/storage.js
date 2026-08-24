"use strict";

/*
|--------------------------------------------------------------------------
| Production Analyzer Kep
|--------------------------------------------------------------------------
| Persistenza locale dei dati tramite IndexedDB.
|--------------------------------------------------------------------------
*/

const DATABASE_NAME = "ProductionAnalyzerKep";
const DATABASE_VERSION = 1;

const IMPORTS_STORE = "imports";
const RECORDS_STORE = "records";


/*
|--------------------------------------------------------------------------
| Apertura database
|--------------------------------------------------------------------------
*/

function openDatabase() {

    return new Promise((resolve, reject) => {

        const request =
            indexedDB.open(
                DATABASE_NAME,
                DATABASE_VERSION
            );


        request.onupgradeneeded = event => {

            const database =
                event.target.result;


            /*
             * Tabella importazioni
             */

            if (
                !database.objectStoreNames.contains(
                    IMPORTS_STORE
                )
            ) {

                database.createObjectStore(
                    IMPORTS_STORE,
                    {
                        keyPath: "importId"
                    }
                );

            }


            /*
             * Tabella record
             */

            if (
                !database.objectStoreNames.contains(
                    RECORDS_STORE
                )
            ) {

                const recordsStore =
                    database.createObjectStore(
                        RECORDS_STORE,
                        {
                            keyPath: "id"
                        }
                    );


                recordsStore.createIndex(
                    "importId",
                    "importId",
                    {
                        unique: false
                    }
                );


                recordsStore.createIndex(
                    "odcl",
                    "odcl",
                    {
                        unique: false
                    }
                );


                recordsStore.createIndex(
                    "codice",
                    "codice",
                    {
                        unique: false
                    }
                );

            }

        };


        request.onsuccess = event => {

            resolve(
                event.target.result
            );

        };


        request.onerror = event => {

            reject(
                event.target.error
            );

        };

    });

}


/*
|--------------------------------------------------------------------------
| Salvataggio importazione
|--------------------------------------------------------------------------
*/

async function saveImport(importData) {

    if (!importData) {

        throw new Error(
            "Nessuna importazione da salvare."
        );

    }


    const database =
        await openDatabase();


    return new Promise(
        (resolve, reject) => {

            const transaction =
                database.transaction(
                    [
                        IMPORTS_STORE,
                        RECORDS_STORE
                    ],
                    "readwrite"
                );


            const importsStore =
                transaction.objectStore(
                    IMPORTS_STORE
                );


            const recordsStore =
                transaction.objectStore(
                    RECORDS_STORE
                );


            /*
             * Salviamo i dati generali
             * dell'importazione.
             */

            importsStore.put({

                importId:
                    importData.importId,

                odcl:
                    importData.odcl,

                fileName:
                    importData.fileName,

                sheetName:
                    importData.sheetName,

                importedAt:
                    importData.importedAt,

                rowCount:
                    importData.rowCount

            });


            /*
             * Salviamo tutte le righe.
             *
             * IMPORTANTE:
             * ogni record contiene già:
             *
             * - dati originali
             * - classificazione
             * - valore lavorazione
             *
             */

            importData.records.forEach(
                record => {

                    recordsStore.put(
                        record
                    );

                }
            );


            transaction.oncomplete = () => {

                database.close();

                resolve(
                    importData.importId
                );

            };


            transaction.onerror = event => {

                database.close();

                reject(
                    event.target.error
                );

            };

        }
    );
}


/*
|--------------------------------------------------------------------------
| Recupero importazioni
|--------------------------------------------------------------------------
*/

async function getAllImports() {

    const database =
        await openDatabase();


    return new Promise(
        (resolve, reject) => {

            const transaction =
                database.transaction(
                    IMPORTS_STORE,
                    "readonly"
                );


            const store =
                transaction.objectStore(
                    IMPORTS_STORE
                );


            const request =
                store.getAll();


            request.onsuccess = () => {

                database.close();

                resolve(
                    request.result
                );

            };


            request.onerror = event => {

                database.close();

                reject(
                    event.target.error
                );

            };

        }
    );
}


/*
|--------------------------------------------------------------------------
| Recupero singola importazione
|--------------------------------------------------------------------------
*/

async function getImportById(importId) {

    if (!importId) {

        throw new Error(
            "ID importazione non specificato."
        );

    }


    const database =
        await openDatabase();


    return new Promise(
        (resolve, reject) => {

            const transaction =
                database.transaction(
                    IMPORTS_STORE,
                    "readonly"
                );


            const store =
                transaction.objectStore(
                    IMPORTS_STORE
                );


            const request =
                store.get(importId);


            request.onsuccess = () => {

                database.close();

                resolve(
                    request.result || null
                );

            };


            request.onerror = event => {

                database.close();

                reject(
                    event.target.error
                );

            };

        }
    );
}


/*
|--------------------------------------------------------------------------
| Recupero record
|--------------------------------------------------------------------------
*/

async function getAllRecords() {

    const database =
        await openDatabase();


    return new Promise(
        (resolve, reject) => {

            const transaction =
                database.transaction(
                    RECORDS_STORE,
                    "readonly"
                );


            const store =
                transaction.objectStore(
                    RECORDS_STORE
                );


            const request =
                store.getAll();


            request.onsuccess = () => {

                database.close();

                resolve(
                    request.result
                );

            };


            request.onerror = event => {

                database.close();

                reject(
                    event.target.error
                );

            };

        }
    );
}


/*
|--------------------------------------------------------------------------
| Recupero record per importazione
|--------------------------------------------------------------------------
*/

async function getRecordsByImportId(importId) {

    if (!importId) {

        throw new Error(
            "ID importazione non specificato."
        );

    }


    const database =
        await openDatabase();


    return new Promise(
        (resolve, reject) => {

            const transaction =
                database.transaction(
                    RECORDS_STORE,
                    "readonly"
                );


            const store =
                transaction.objectStore(
                    RECORDS_STORE
                );


            const index =
                store.index("importId");


            const request =
                index.getAll(importId);


            request.onsuccess = () => {

                database.close();

                resolve(
                    request.result
                );

            };


            request.onerror = event => {

                database.close();

                reject(
                    event.target.error
                );

            };

        }
    );
}


/*
|--------------------------------------------------------------------------
| Recupero record per ODCL
|--------------------------------------------------------------------------
*/

async function getRecordsByODCL(odcl) {

    if (!odcl) {

        throw new Error(
            "Numero ODCL non specificato."
        );

    }


    const database =
        await openDatabase();


    return new Promise(
        (resolve, reject) => {

            const transaction =
                database.transaction(
                    RECORDS_STORE,
                    "readonly"
                );


            const store =
                transaction.objectStore(
                    RECORDS_STORE
                );


            const index =
                store.index("odcl");


            const request =
                index.getAll(odcl);


            request.onsuccess = () => {

                database.close();

                resolve(
                    request.result
                );

            };


            request.onerror = event => {

                database.close();

                reject(
                    event.target.error
                );

            };

        }
    );
}


/*
|--------------------------------------------------------------------------
| Recupero importazione completa
|--------------------------------------------------------------------------
|
| Restituisce:
|
| {
|     importazione: {...},
|     records: [...]
| }
|
|--------------------------------------------------------------------------
*/

async function getCompleteImport(importId) {

    const importData =
        await getImportById(
            importId
        );


    if (!importData) {

        return null;

    }


    const records =
        await getRecordsByImportId(
            importId
        );


    return {

        importazione:
            importData,

        records

    };

}

/*
|--------------------------------------------------------------------------
| Eliminazione importazione
|--------------------------------------------------------------------------
|
| Elimina:
|
| - dati generali dell'importazione
| - tutte le righe associate
|
|--------------------------------------------------------------------------
*/

async function deleteImport(importId) {

    if (!importId) {

        throw new Error(
            "ID importazione non specificato."
        );

    }


    const database =
        await openDatabase();


    return new Promise(
        (resolve, reject) => {

            const transaction =
                database.transaction(
                    [
                        IMPORTS_STORE,
                        RECORDS_STORE
                    ],
                    "readwrite"
                );


            const importsStore =
                transaction.objectStore(
                    IMPORTS_STORE
                );


            const recordsStore =
                transaction.objectStore(
                    RECORDS_STORE
                );


            /*
             * Eliminiamo tutte le righe
             * appartenenti all'importazione.
             */

            const recordsIndex =
                recordsStore.index(
                    "importId"
                );


            const request =
                recordsIndex.openCursor(
                    IDBKeyRange.only(
                        importId
                    )
                );


            request.onsuccess = event => {

                const cursor =
                    event.target.result;


                if (cursor) {

                    cursor.delete();

                    cursor.continue();

                    return;

                }


                /*
                 * Una volta eliminate
                 * tutte le righe,
                 * eliminiamo l'importazione.
                 */

                importsStore.delete(
                    importId
                );

            };


            request.onerror = event => {

                reject(
                    event.target.error
                );

            };


            transaction.oncomplete = () => {

                database.close();

                resolve(
                    true
                );

            };


            transaction.onerror = event => {

                database.close();

                reject(
                    event.target.error
                );

            };

        }
    );
}