"use strict";

/*
|--------------------------------------------------------------------------
| Production Analyzer Kep
|--------------------------------------------------------------------------
| Importazione e normalizzazione dei file Excel.
|--------------------------------------------------------------------------
| Il record viene classificato automaticamente prima del salvataggio.
|--------------------------------------------------------------------------
*/


const REQUIRED_COLUMNS = [
    "Data consegna",
    "Quantità",
    "Codice",
    "Descrizione",
    "Descrizione estesa"
];


/*
|--------------------------------------------------------------------------
| Generazione ID importazione
|--------------------------------------------------------------------------
*/

function generateImportId() {

    const now =
        new Date();


    const date =
        now.toISOString()
            .slice(0, 10)
            .replaceAll("-", "");


    const time =
        now.toTimeString()
            .slice(0, 8)
            .replaceAll(":", "");


    const random =
        Math.random()
            .toString(36)
            .substring(2, 6)
            .toUpperCase();


    return `IMPORT-${date}-${time}-${random}`;
}


/*
|--------------------------------------------------------------------------
| Lettura Excel
|--------------------------------------------------------------------------
|
| L'ODCL viene passato dall'interfaccia.
|--------------------------------------------------------------------------
*/

async function readExcelFile(
    file,
    odcl
) {

    if (!file) {

        throw new Error(
            "Nessun file selezionato."
        );

    }


    if (!odcl) {

        throw new Error(
            "Il numero ODCL è obbligatorio."
        );

    }


    const extension =
        file.name
            .split(".")
            .pop()
            .toLowerCase();


    if (!["xlsx", "xls"].includes(extension)) {

        throw new Error(
            "Il file selezionato non è un file Excel valido."
        );

    }


    const arrayBuffer =
        await file.arrayBuffer();


    const workbook =
        XLSX.read(
            arrayBuffer,
            {
                type: "array",
                cellDates: true
            }
        );


    if (!workbook.SheetNames.length) {

        throw new Error(
            "Il file Excel non contiene alcun foglio."
        );

    }


    const firstSheetName =
        workbook.SheetNames[0];


    const worksheet =
        workbook.Sheets[firstSheetName];


    const rows =
        XLSX.utils.sheet_to_json(
            worksheet,
            {
                defval: null,
                raw: true
            }
        );


    if (!rows.length) {

        throw new Error(
            "Il foglio Excel non contiene dati."
        );

    }


    validateColumns(rows);


    const importId =
        generateImportId();


    const records =
        normalizeRows(
            rows,
            {
                importId,
                odcl,
                fileName: file.name,
                sheetName: firstSheetName
            }
        );


    return {

        importId,

        odcl,

        fileName:
            file.name,

        sheetName:
            firstSheetName,

        importedAt:
            new Date().toISOString(),

        rowCount:
            records.length,

        records

    };
}


/*
|--------------------------------------------------------------------------
| Validazione colonne
|--------------------------------------------------------------------------
*/

function validateColumns(rows) {

    const availableColumns =
        Object.keys(rows[0]);


    const missingColumns =
        REQUIRED_COLUMNS.filter(
            column =>
                !availableColumns.includes(column)
        );


    if (missingColumns.length > 0) {

        throw new Error(
            "Il file non contiene le colonne previste: " +
            missingColumns.join(", ")
        );

    }
}


/*
|--------------------------------------------------------------------------
| Normalizzazione + classificazione righe
|--------------------------------------------------------------------------
*/

function normalizeRows(
    rows,
    importInfo
) {

    return rows.map(
        (row, index) => {


            /*
            |--------------------------------------------------------------------------
            | Costruzione record base
            |--------------------------------------------------------------------------
            */

            const record = {

                id:
                    `${importInfo.importId}-ROW-${String(index + 1).padStart(4, "0")}`,

                importId:
                    importInfo.importId,

                odcl:
                    importInfo.odcl,

                dataConsegna:
                    normalizeDate(
                        row["Data consegna"]
                    ),

                quantita:
                    normalizeQuantity(
                        row["Quantità"]
                    ),

                codice:
                    normalizeText(
                        row["Codice"]
                    ),

                descrizione:
                    normalizeText(
                        row["Descrizione"]
                    ),

                descrizioneEstesa:
                    normalizeText(
                        row["Descrizione estesa"]
                    ),

                origine: {

                    fileName:
                        importInfo.fileName,

                    sheetName:
                        importInfo.sheetName

                }

            };


            /*
            |--------------------------------------------------------------------------
            | CLASSIFICAZIONE
            |--------------------------------------------------------------------------
            |
            | Il record viene passato al motore di classificazione
            | dopo la normalizzazione dei dati Excel.
            |
            */

            const classifiedRecord =
                classifyRecord(
                    record
                );


            /*
            |--------------------------------------------------------------------------
            | Ritorno record completo
            |--------------------------------------------------------------------------
            */

            return classifiedRecord;

        }
    );
}


/*
|--------------------------------------------------------------------------
| Normalizzazione testo
|--------------------------------------------------------------------------
*/

function normalizeText(value) {

    if (
        value === null ||
        value === undefined
    ) {

        return "";

    }


    return String(value).trim();
}


/*
|--------------------------------------------------------------------------
| Normalizzazione quantità
|--------------------------------------------------------------------------
*/

function normalizeQuantity(value) {

    if (
        value === null ||
        value === undefined ||
        value === ""
    ) {

        return 0;

    }


    const number =
        Number(value);


    if (Number.isNaN(number)) {

        throw new Error(
            `Quantità non valida: "${value}".`
        );

    }


    return number;
}


/*
|--------------------------------------------------------------------------
| Normalizzazione data
|--------------------------------------------------------------------------
*/

function normalizeDate(value) {

    if (
        value === null ||
        value === undefined ||
        value === ""
    ) {

        return null;

    }


    if (value instanceof Date) {

        return formatDateISO(value);

    }


    if (typeof value === "number") {

        const date =
            XLSX.SSF.parse_date_code(
                value
            );


        if (!date) {

            return null;

        }


        return [

            String(date.y)
                .padStart(4, "0"),

            String(date.m)
                .padStart(2, "0"),

            String(date.d)
                .padStart(2, "0")

        ].join("-");

    }


    const parsed =
        new Date(value);


    if (!Number.isNaN(parsed.getTime())) {

        return formatDateISO(
            parsed
        );

    }


    return String(value).trim();
}


/*
|--------------------------------------------------------------------------
| Formattazione data
|--------------------------------------------------------------------------
*/

function formatDateISO(date) {

    return [

        date.getFullYear(),

        String(
            date.getMonth() + 1
        ).padStart(2, "0"),

        String(
            date.getDate()
        ).padStart(2, "0")

    ].join("-");

}

/*
|--------------------------------------------------------------------------
| IMPORTAZIONE MASSIVA
|--------------------------------------------------------------------------
*/

function extractOdclFromFileName(
    fileName
) {

    const baseName =
        String(
            fileName
        )
        .replace(
            /\.[^/.]+$/,
            ""
        )
        .trim();


    if (
        !/^\d+$/.test(
            baseName
        )
    ) {

        throw new Error(
            `Il nome del file "${fileName}" non contiene un numero ODCL valido.`
        );

    }


    return baseName;

}


async function importMultipleExcelFiles(
    files
) {

    if (
        !files ||
        !files.length
    ) {

        throw new Error(
            "Nessun file selezionato."
        );

    }


    const statusElement =
        document.getElementById(
            "massImportStatus"
        );


    if (statusElement) {

        statusElement.classList.remove(
            "hidden"
        );

    }


    const fileList =
        Array.from(
            files
        );


    let importedCount = 0;

    let errorCount = 0;

    const errors = [];


    updateMassImportStatus(
        statusElement,
        0,
        fileList.length,
        null
    );


    for (
        let index = 0;
        index < fileList.length;
        index++
    ) {

        const file =
            fileList[index];


        try {

            const odcl =
                extractOdclFromFileName(
                    file.name
                );


            updateMassImportStatus(
                statusElement,
                index,
                fileList.length,
                file.name
            );


            const importData =
                await readExcelFile(
                    file,
                    odcl
                );


            await saveImport(
                importData
            );


            importedCount++;


        }
        catch (error) {

            console.error(
                `Errore importazione ${file.name}:`,
                error
            );


            errorCount++;


            errors.push({

                fileName:
                    file.name,

                message:
                    error?.message ||
                    "Errore sconosciuto."

            });

        }


        updateMassImportStatus(
            statusElement,
            index + 1,
            fileList.length,
            null
        );

    }


    showMassImportSummary(
        statusElement,
        fileList.length,
        importedCount,
        errorCount,
        errors
    );


    if (
        typeof loadArchive ===
        "function"
    ) {

        await loadArchive();

    }


    if (
        typeof initializeAnalysis ===
        "function"
    ) {

        await initializeAnalysis();

    }


    if (
        typeof updateCharts ===
        "function"
    ) {

        await updateCharts();

    }

}


function updateMassImportStatus(
    element,
    completed,
    total,
    currentFile
) {

    if (!element) {

        return;

    }


    const percentage =
        total > 0
            ? Math.round(
                (
                    completed /
                    total
                ) *
                100
            )
            : 0;


    element.innerHTML = `

        <div>
            <strong>
                IMPORTAZIONE STORICA
            </strong>
        </div>

        <div>
            File elaborati:
            ${completed}
            /
            ${total}
        </div>

        <div>
            ${percentage}%
        </div>

        ${
            currentFile
                ? `
                    <div>
                        In elaborazione:
                        <strong>
                            ${currentFile}
                        </strong>
                    </div>
                `
                : ""
        }

    `;

}


function showMassImportSummary(
    element,
    total,
    imported,
    errorsCount,
    errors
) {

    if (!element) {

        return;

    }


    let html = `

        <div>
            <strong>
                IMPORTAZIONE COMPLETATA
            </strong>
        </div>

        <div>
            File selezionati:
            ${total}
        </div>

        <div>
            Importati:
            ${imported}
        </div>

        <div>
            Errori:
            ${errorsCount}
        </div>

    `;


    if (
        errors.length
    ) {

        html += `

            <div>
                <strong>
                    DETTAGLIO ERRORI
                </strong>
            </div>

            <ul>

                ${
                    errors.map(
                        error => `
                            <li>
                                <strong>
                                    ${error.fileName}
                                </strong>
                                :
                                ${error.message}
                            </li>
                        `
                    ).join("")
                }

            </ul>

        `;

    }


    element.innerHTML =
        html;

}

/*
|--------------------------------------------------------------------------
| UI IMPORTAZIONE MASSIVA
|--------------------------------------------------------------------------
*/

document.addEventListener(
    "DOMContentLoaded",
    () => {

        const massImportButton =
            document.getElementById(
                "massImportButton"
            );


        const massFileInput =
            document.getElementById(
                "massFileInput"
            );


        if (
            massImportButton &&
            massFileInput
        ) {

            massImportButton.addEventListener(
                "click",
                () => {

                    massFileInput.click();

                }
            );


            massFileInput.addEventListener(
                "change",
                async event => {

                    const files =
                        event.target.files;


                    if (
                        !files ||
                        !files.length
                    ) {

                        return;

                    }


                    massImportButton.disabled =
                        true;

                    massImportButton.textContent =
                        "IMPORTAZIONE...";


                    try {

                        await importMultipleExcelFiles(
                            files
                        );

                    }
                    catch (error) {

                        console.error(
                            "Errore importazione massiva:",
                            error
                        );


                        const statusElement =
                            document.getElementById(
                                "massImportStatus"
                            );


                        if (statusElement) {

                            statusElement.classList.remove(
                                "hidden"
                            );


                            statusElement.innerHTML = `

                                <div>
                                    <strong>
                                        Importazione massiva fallita
                                    </strong>
                                </div>

                                <div>
                                    ${
                                        error?.message ||
                                        "Errore sconosciuto."
                                    }
                                </div>

                            `;

                        }

                    }
                    finally {

                        massImportButton.disabled =
                            false;

                        massImportButton.textContent =
                            "Importazione massiva";

                        massFileInput.value =
                            "";

                    }

                }
            );

        }

    }
);
