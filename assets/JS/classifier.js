"use strict";

/*
|--------------------------------------------------------------------------
| Production Analyzer Kep
| Motore di classificazione degli articoli
|--------------------------------------------------------------------------
|
| Le regole sono state ricavate dalle formule presenti
| nel foglio ODCL del file MASTER.xlsx.
|
| IMPORTANTE:
| CRJ appartiene a CR 2.0 T e restituisce la QUANTITÀ.
| Il valore "12" presente nella formula Excel originale
| è considerato un refuso e NON viene replicato.
|
|--------------------------------------------------------------------------
*/


/*
|--------------------------------------------------------------------------
| TARIFFE DI LAVORAZIONE
|--------------------------------------------------------------------------
*/

const TARIFFE_LAVORAZIONE = {

    "END-FAST": 6,

    "E-LIGHT": 7,

    "SMART": 6.5,

    "KEPPY": 3.5,

    "CR 2.0 T": 8.3,

    "CR 2.0 S/B": 7,

    "NOVA": 6.5,

    "POLO": 0.7

};


/*
|--------------------------------------------------------------------------
| Utility
|--------------------------------------------------------------------------
*/

/**
 * Converte un valore in stringa,
 * evitando problemi con null / undefined.
 */

function normalizeText(value) {

    return String(value ?? "")
        .trim()
        .toUpperCase();

}


/**
 * Converte la quantità in numero.
 */

function normalizeQuantity(value) {

    const number =
        Number(
            String(value ?? "")
                .replace(",", ".")
                .trim()
        );

    return Number.isFinite(number)
        ? number
        : 0;

}

function formatCurrency(value) {

    const number = Number(value) || 0;

    return new Intl.NumberFormat(
        "it-IT",
        {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2
        }
    ).format(number) + " €";

}

/*
|--------------------------------------------------------------------------
| CLASSIFICAZIONE
|--------------------------------------------------------------------------
*/

function classifyRecord(record) {

    const codice =
        normalizeText(record.codice);

    const descrizione =
        normalizeText(record.descrizione);

    const descrizioneEstesa =
        normalizeText(record.descrizioneEstesa);

    const quantita =
        normalizeQuantity(record.quantita);


    /*
    |--------------------------------------------------------------------------
    | END-FAST
    |--------------------------------------------------------------------------
    |
    | CRABS nel CODICE
    | AND
    | ENDUR nella DESCRIZIONE
    |
    */

    const isEndFast =
        codice.includes("CRABS") &&
        descrizione.includes("ENDUR");


    /*
    |--------------------------------------------------------------------------
    | E-LIGHT
    |--------------------------------------------------------------------------
    |
    | ELIGHT nella DESCRIZIONE
    | OR
    | CARB nella DESCRIZIONE
    |
    */

    const isELight =
        descrizione.includes("ELIGHT") ||
        descrizione.includes("CARB");


    /*
    |--------------------------------------------------------------------------
    | SMART
    |--------------------------------------------------------------------------
    |
    | .SMART. nel CODICE
    |
    */

    const isSmart =
        codice.includes(".SMART.");


    /*
    |--------------------------------------------------------------------------
    | KEPPY
    |--------------------------------------------------------------------------
    |
    | KP nel CODICE
    |
    */

    const isKeppy =
        codice.includes("KP");


    /*
    |--------------------------------------------------------------------------
    | CR 2.0 T
    |--------------------------------------------------------------------------
    |
    | CRT
    | CRP
    | CRL
    | CRV
    | CRJ
    |
    | IMPORTANTE:
    | CRJ restituisce QUANTITÀ, esattamente come gli altri.
    |
    */

    const isCR20T =
        codice.includes("CRT") ||
        codice.includes("CRP") ||
        codice.includes("CRL") ||
        codice.includes("CRV") ||
        codice.includes("CRJ");


    /*
    |--------------------------------------------------------------------------
    | CR 2.0 S/B
    |--------------------------------------------------------------------------
    |
    | CRB2
    | OR
    | CRS2
    |
    */

    const isCR20SB =
        codice.includes("CRB2") ||
        codice.includes("CRS2");


    /*
    |--------------------------------------------------------------------------
    | NOVA
    |--------------------------------------------------------------------------
    |
    | NOVA nel CODICE
    |
    */

    const isNova =
        codice.includes("NOVA");


    /*
    |--------------------------------------------------------------------------
    | POLO
    |--------------------------------------------------------------------------
    |
    | Condizione 1:
    |
    | CARB nel CODICE
    | AND
    | POLO nella DESCRIZIONE
    | oppure DESCRIZIONE ESTESA
    |
    |
    | Condizione 2:
    |
    | CRABS nel CODICE
    | AND
    | POLO nella DESCRIZIONE
    | oppure DESCRIZIONE ESTESA
    |
    |
    | Condizione 3:
    |
    | CODICE termina con ".PO"
    | AND
    | CARB oppure CRABS nel CODICE
    |
    */

    const poloInDescrizione =
        descrizione.includes("POLO") ||
        descrizioneEstesa.includes("POLO");


    const poloCondizione1 =
        codice.includes("CARB") &&
        poloInDescrizione;


    const poloCondizione2 =
        codice.includes("CRABS") &&
        poloInDescrizione;


    const poloCondizione3 =
        codice.endsWith(".PO") &&
        (
            codice.includes("CARB") ||
            codice.includes("CRABS")
        );


    const isPolo =
        poloCondizione1 ||
        poloCondizione2 ||
        poloCondizione3;


    /*
    |--------------------------------------------------------------------------
    | RISULTATO QUANTITATIVO
    |--------------------------------------------------------------------------
    */

    const classificazione = {

        "END-FAST":
            isEndFast
                ? quantita
                : 0,

        "E-LIGHT":
            isELight
                ? quantita
                : 0,

        "SMART":
            isSmart
                ? quantita
                : 0,

        "KEPPY":
            isKeppy
                ? quantita
                : 0,

        "CR 2.0 T":
            isCR20T
                ? quantita
                : 0,

        "CR 2.0 S/B":
            isCR20SB
                ? quantita
                : 0,

        "NOVA":
            isNova
                ? quantita
                : 0,

        "POLO":
            isPolo
                ? quantita
                : 0

    };


    /*
    |--------------------------------------------------------------------------
    | VALORE LAVORAZIONE
    |--------------------------------------------------------------------------
    */

    const valoreLavorazione = {};


    Object.entries(
        classificazione
    ).forEach(
        ([famiglia, quantitaClassificata]) => {

            valoreLavorazione[famiglia] =
                quantitaClassificata *
                TARIFFE_LAVORAZIONE[famiglia];

        }
    );


    /*
    |--------------------------------------------------------------------------
    | RITORNO
    |--------------------------------------------------------------------------
    */

    return {

        ...record,

        classificazione,

        valoreLavorazione

    };

}