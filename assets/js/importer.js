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