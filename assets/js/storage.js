"use strict";

/*
|--------------------------------------------------------------------------
| Production Analyzer Kep
|--------------------------------------------------------------------------
| Persistenza centrale tramite Firebase Cloud Firestore.
|--------------------------------------------------------------------------
*/


const IMPORTS_COLLECTION =
    "imports";


const RECORDS_COLLECTION =
    "records";


/*
|--------------------------------------------------------------------------
| Controllo connessione
|--------------------------------------------------------------------------
*/

function getFirestore() {

    if (
        !window.KepFirebase ||
        !window.KepFirebase.db
    ) {

        throw new Error(
            "Firebase / Firestore non è stato inizializzato."
        );

    }


    return window.KepFirebase.db;

}


/*
|--------------------------------------------------------------------------
| Salvataggio importazione
|--------------------------------------------------------------------------
*/

async function saveImport(
    importData
) {

    if (!importData) {

        throw new Error(
            "Nessuna importazione da salvare."
        );

    }


    const db =
        getFirestore();


    /*
     * Documento importazione
     */

    await db
        .collection(
            IMPORTS_COLLECTION
        )
        .doc(
            importData.importId
        )
        .set({

            importId:
                importData.importId,

            odcl:
                String(
                    importData.odcl
                ),

            fileName:
                importData.fileName,

            sheetName:
                importData.sheetName,

            importedAt:
                firebase.firestore.Timestamp.fromDate(
                    new Date(
                        importData.importedAt
                    )
                ),

            rowCount:
                Number(
                    importData.rowCount
                )

        });


    /*
     * Documenti delle righe
     */

    /*
     * Firestore consente massimo 500 operazioni
     * in una singola batch.
     *
     * Usiamo blocchi da 450 per stare tranquilli.
     */

    const batchSize =
        450;


    for (
        let start = 0;
        start < importData.records.length;
        start += batchSize
    ) {

        const batch =
            db.batch();


        const recordsChunk =
            importData.records.slice(
                start,
                start + batchSize
            );


        recordsChunk.forEach(
            record => {

                const recordRef =
                    db
                        .collection(
                            RECORDS_COLLECTION
                        )
                        .doc(
                            record.id
                        );


                batch.set(
                    recordRef,
                    record
                );

            }
        );


        await batch.commit();

    }


    return (
        importData.importId
    );

}


/*
|--------------------------------------------------------------------------
| Recupero importazioni
|--------------------------------------------------------------------------
*/

async function getAllImports() {

    const db =
        getFirestore();


    const snapshot =
        await db
            .collection(
                IMPORTS_COLLECTION
            )
            .get();


    return snapshot.docs.map(
        document => {

            const data =
                document.data();


            return {

                ...data,

                importedAt:
                    convertFirestoreDate(
                        data.importedAt
                    )

            };

        }
    );

}


/*
|--------------------------------------------------------------------------
| Recupero tutti i record
|--------------------------------------------------------------------------
*/

async function getAllRecords() {

    const db =
        getFirestore();


    const snapshot =
        await db
            .collection(
                RECORDS_COLLECTION
            )
            .get();


    return snapshot.docs.map(
        document =>
            document.data()
    );

}


/*
|--------------------------------------------------------------------------
| Recupero record per ODCL
|--------------------------------------------------------------------------
*/

async function getRecordsByODCL(
    odcl
) {

    if (!odcl) {

        throw new Error(
            "Numero ODCL non specificato."
        );

    }


    const db =
        getFirestore();


    const snapshot =
        await db
            .collection(
                RECORDS_COLLECTION
            )
            .where(
                "odcl",
                "==",
                String(
                    odcl
                )
            )
            .get();


    return snapshot.docs.map(
        document =>
            document.data()
    );

}


/*
|--------------------------------------------------------------------------
| Eliminazione importazione
|--------------------------------------------------------------------------
*/

async function deleteImport(
    importId
) {

    if (!importId) {

        throw new Error(
            "ID importazione non specificato."
        );

    }


    const db =
        getFirestore();


    /*
     * Recuperiamo le righe associate.
     */

    const recordsSnapshot =
        await db
            .collection(
                RECORDS_COLLECTION
            )
            .where(
                "importId",
                "==",
                importId
            )
            .get();


    /*
     * Eliminiamo in blocchi.
     */

    const batchSize =
        450;


    for (
        let start = 0;
        start < recordsSnapshot.docs.length;
        start += batchSize
    ) {

        const batch =
            db.batch();


        const docs =
            recordsSnapshot.docs.slice(
                start,
                start + batchSize
            );


        docs.forEach(
            document => {

                batch.delete(
                    document.ref
                );

            }
        );


        await batch.commit();

    }


    /*
     * Infine eliminiamo l'importazione.
     */

    await db
        .collection(
            IMPORTS_COLLECTION
        )
        .doc(
            importId
        )
        .delete();


    return true;

}


/*
|--------------------------------------------------------------------------
| Conversione timestamp
|--------------------------------------------------------------------------
*/

function convertFirestoreDate(
    value
) {

    if (
        !value
    ) {

        return null;

    }


    if (
        typeof value.toDate ===
        "function"
    ) {

        return value
            .toDate()
            .toISOString();

    }


    return value;

}