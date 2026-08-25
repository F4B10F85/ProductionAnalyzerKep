"use strict";

/*
|--------------------------------------------------------------------------
| Production Analyzer Kep
|--------------------------------------------------------------------------
| Analisi produzione.
|
| Le chiavi interne delle famiglie sono pulite.
| Le label visualizzate replicano il master Excel.
|--------------------------------------------------------------------------
*/


const ANALYSIS_FAMILIES = [

    {
        key: "END-FAST",
        label: ".END-FAST."
    },

    {
        key: "E-LIGHT",
        label: ".E-LIGHT."
    },

    {
        key: "SMART",
        label: ".SMART."
    },

    {
        key: "KEPPY",
        label: ".KEPPY."
    },

    {
        key: "CR 2.0 T",
        label: ".CR 2.0 T."
    },

    {
        key: "CR 2.0 S/B",
        label: ".CR 2.0 S/B."
    },

    {
        key: "NOVA",
        label: ".NOVA."
    },

    {
        key: "POLO",
        label: ".POLO."
    }

];


const QUANTITY_FAMILIES =
    ANALYSIS_FAMILIES.filter(
        family =>
            family.key !== "POLO"
    );


const MONTHS = [

    "Gennaio",
    "Febbraio",
    "Marzo",
    "Aprile",
    "Maggio",
    "Giugno",
    "Luglio",
    "Agosto",
    "Settembre",
    "Ottobre",
    "Novembre",
    "Dicembre"

];


let analysisRecords = [];


/*
|--------------------------------------------------------------------------
| Compatibilità con app.js
|--------------------------------------------------------------------------
|
| app.js attualmente richiama initializeAnalysis().
| Manteniamo quella funzione come ingresso pubblico.
|--------------------------------------------------------------------------
*/

async function initializeAnalysis() {

    await initializeAnalysisPage();

}


/*
|--------------------------------------------------------------------------
| Inizializzazione pagina
|--------------------------------------------------------------------------
*/

async function initializeAnalysisPage() {

    try {

        analysisRecords =
            await getAnalysisRecords();


        populateODCLSelect();

        populateYearSelect();

        populateMonthSelect();


        renderEmptyODCL();

        renderEmptyMonthly();

    }
    catch (error) {

        console.error(
            "Errore inizializzazione analisi:",
            error
        );


        showPageError(
            "Impossibile caricare i dati dell'archivio locale."
        );

    }

}


/*
|--------------------------------------------------------------------------
| Recupero record
|--------------------------------------------------------------------------
*/

async function getAnalysisRecords() {

    return await getAllRecords();

}


/*
|--------------------------------------------------------------------------
| ODCL
|--------------------------------------------------------------------------
*/

function populateODCLSelect() {

    const select =
        document.getElementById(
            "analysisODCL"
        );


    if (!select) {

        return;

    }


    select.innerHTML = `
        <option value="">
            Seleziona ODCL
        </option>
    `;


    const odcls =
        [
            ...new Set(
                analysisRecords
                    .map(
                        record =>
                            String(
                                record.odcl ?? ""
                            ).trim()
                    )
                    .filter(Boolean)
            )
        ]
        .sort(
            (a, b) =>
                a.localeCompare(
                    b,
                    "it",
                    {
                        numeric: true
                    }
                )
        );


    odcls.forEach(
        odcl => {

            const option =
                document.createElement(
                    "option"
                );


            option.value =
                odcl;


            option.textContent =
                odcl;


            select.appendChild(
                option
            );

        }
    );


    select.onchange =
        () => {

            renderODCLAnalysis(
                select.value
            );

        };

}


/*
|--------------------------------------------------------------------------
| Anni
|--------------------------------------------------------------------------
*/

function populateYearSelect() {

    const select =
        document.getElementById(
            "analysisYear"
        );


    if (!select) {

        return;

    }


    select.innerHTML = `
        <option value="">
            Anno
        </option>
    `;


    const years =
        [
            ...new Set(
                analysisRecords
                    .map(
                        getRecordYear
                    )
                    .filter(Boolean)
            )
        ]
        .sort(
            (a, b) =>
                Number(b) -
                Number(a)
        );


    years.forEach(
        year => {

            const option =
                document.createElement(
                    "option"
                );


            option.value =
                year;


            option.textContent =
                year;


            select.appendChild(
                option
            );

        }
    );


    select.onchange =
        renderMonthlyAnalysis;

}


/*
|--------------------------------------------------------------------------
| Mesi
|--------------------------------------------------------------------------
*/

function populateMonthSelect() {

    const select =
        document.getElementById(
            "analysisMonth"
        );


    if (!select) {

        return;

    }


    select.innerHTML = `
        <option value="">
            Mese
        </option>
    `;


    MONTHS.forEach(
        (month, index) => {

            const option =
                document.createElement(
                    "option"
                );


            option.value =
                String(index + 1)
                    .padStart(
                        2,
                        "0"
                    );


            option.textContent =
                month;


            select.appendChild(
                option
            );

        }
    );


    select.onchange =
        renderMonthlyAnalysis;

}


/*
|--------------------------------------------------------------------------
| Analisi ODCL
|--------------------------------------------------------------------------
*/

function renderODCLAnalysis(
    odcl
) {

    if (!odcl) {

        renderEmptyODCL();

        return;

    }


    const records =
        analysisRecords.filter(
            record =>
                String(
                    record.odcl ?? ""
                ) ===
                String(odcl)
        );


    const totals =
        aggregateRecords(
            records
        );


    setText(
        "odclResultTitle",
        `RISULTATO ODCL ${odcl}`
    );


    setFamilyValue(
        "odcl-end-fast",
        totals.quantities[
            "END-FAST"
        ]
    );


    setFamilyValue(
        "odcl-e-light",
        totals.quantities[
            "E-LIGHT"
        ]
    );


    setFamilyValue(
        "odcl-smart",
        totals.quantities[
            "SMART"
        ]
    );


    setFamilyValue(
        "odcl-keppy",
        totals.quantities[
            "KEPPY"
        ]
    );


    setFamilyValue(
        "odcl-cr20t",
        totals.quantities[
            "CR 2.0 T"
        ]
    );


    setFamilyValue(
        "odcl-cr20sb",
        totals.quantities[
            "CR 2.0 S/B"
        ]
    );


    setFamilyValue(
        "odcl-nova",
        totals.quantities[
            "NOVA"
        ]
    );


    setFamilyValue(
        "odcl-polo",
        totals.quantities[
            "POLO"
        ]
    );


    setText(
        "odcl-total-quantity",
        formatNumber(
            totals.productionQuantity
        )
    );


    setText(
        "odcl-total-value",
        formatCurrency(
            totals.totalValue
        )
    );

}


/*
|--------------------------------------------------------------------------
| Analisi mensile
|--------------------------------------------------------------------------
*/

function renderMonthlyAnalysis() {

    const year =
        document.getElementById(
            "analysisYear"
        )?.value || "";


    const month =
        document.getElementById(
            "analysisMonth"
        )?.value || "";


    if (!year || !month) {

        renderEmptyMonthly();

        return;

    }


    const records =
        analysisRecords.filter(
            record =>
                isRecordInPeriod(
                    record,
                    year,
                    month
                )
        );


    const totals =
        aggregateRecords(
            records
        );


    setText(
        "monthlyFamilyTitle",
        `RIEPILOGO PER FAMIGLIA - ${getMonthName(month).toUpperCase()} ${year}`
    );


    /*
    |--------------------------------------------------------------------------
    | Righe per ODCL + righe totali
    |--------------------------------------------------------------------------
    */

    renderMonthlyFamilyTable(
        records,
        totals
    );


    /*
    |--------------------------------------------------------------------------
    | Riepilogo ODCL inferiore
    |--------------------------------------------------------------------------
    */

    renderMonthlyODCL(
        records,
        totals.totalValue,
        year,
        month
    );

}

/*
|--------------------------------------------------------------------------
| Tabella riepilogo per famiglia
|--------------------------------------------------------------------------
|
| Mostra:
|
| 1. una riga per ogni ODCL del periodo;
| 2. una riga finale Quantità;
| 3. una riga finale Lavorazione (€).
|
| POLO:
| - NON entra nei TOTALI delle quantità;
| - entra normalmente nella Lavorazione.
|--------------------------------------------------------------------------
*/

function renderMonthlyFamilyTable(
    records,
    overallTotals
) {

    const body =
        document.getElementById(
            "monthlyFamilyBody"
        );


    if (!body) {

        return;

    }


    /*
    |--------------------------------------------------------------------------
    | Raggruppamento per ODCL
    |--------------------------------------------------------------------------
    */

    const grouped =
        new Map();


    records.forEach(
        record => {

            const odcl =
                String(
                    record.odcl ?? ""
                ).trim();


            if (!odcl) {

                return;

            }


            if (
                !grouped.has(
                    odcl
                )
            ) {

                grouped.set(
                    odcl,
                    []
                );

            }


            grouped
                .get(odcl)
                .push(record);

        }
    );


    const sortedODCL =
        [
            ...grouped.keys()
        ]
        .sort(
            (a, b) =>
                a.localeCompare(
                    b,
                    "it",
                    {
                        numeric: true
                    }
                )
        );


    body.innerHTML = "";


    /*
    |--------------------------------------------------------------------------
    | Una riga per ogni ODCL
    |--------------------------------------------------------------------------
    */

    sortedODCL.forEach(
        odcl => {

            const odclTotals =
                aggregateRecords(
                    grouped.get(
                        odcl
                    )
                );


            const row =
                document.createElement(
                    "tr"
                );


            row.innerHTML = `

                <td class="row-label">
                    ${escapeHtml(
                        odcl
                    )}
                </td>

                <td>
                    ${formatNumber(
                        odclTotals.quantities[
                            "END-FAST"
                        ]
                    )}
                </td>

                <td>
                    ${formatNumber(
                        odclTotals.quantities[
                            "E-LIGHT"
                        ]
                    )}
                </td>

                <td>
                    ${formatNumber(
                        odclTotals.quantities[
                            "SMART"
                        ]
                    )}
                </td>

                <td>
                    ${formatNumber(
                        odclTotals.quantities[
                            "KEPPY"
                        ]
                    )}
                </td>

                <td>
                    ${formatNumber(
                        odclTotals.quantities[
                            "CR 2.0 T"
                        ]
                    )}
                </td>

                <td>
                    ${formatNumber(
                        odclTotals.quantities[
                            "CR 2.0 S/B"
                        ]
                    )}
                </td>

                <td>
                    ${formatNumber(
                        odclTotals.quantities[
                            "NOVA"
                        ]
                    )}
                </td>

                <td>
                    ${formatNumber(
                        odclTotals.quantities[
                            "POLO"
                        ]
                    )}
                </td>

                <td class="total-cell">
                    ${formatNumber(
                        odclTotals.productionQuantity
                    )}
                </td>

            `;


            body.appendChild(
                row
            );

        }
    );


    /*
    |--------------------------------------------------------------------------
    | Riga Quantità
    |--------------------------------------------------------------------------
    */

    const quantityRow =
        document.createElement(
            "tr"
        );


    quantityRow.innerHTML = `

        <td class="row-label">
            Quantità
        </td>

        <td>
            ${formatNumber(
                overallTotals.quantities[
                    "END-FAST"
                ]
            )}
        </td>

        <td>
            ${formatNumber(
                overallTotals.quantities[
                    "E-LIGHT"
                ]
            )}
        </td>

        <td>
            ${formatNumber(
                overallTotals.quantities[
                    "SMART"
                ]
            )}
        </td>

        <td>
            ${formatNumber(
                overallTotals.quantities[
                    "KEPPY"
                ]
            )}
        </td>

        <td>
            ${formatNumber(
                overallTotals.quantities[
                    "CR 2.0 T"
                ]
            )}
        </td>

        <td>
            ${formatNumber(
                overallTotals.quantities[
                    "CR 2.0 S/B"
                ]
            )}
        </td>

        <td>
            ${formatNumber(
                overallTotals.quantities[
                    "NOVA"
                ]
            )}
        </td>

        <td>
            ${formatNumber(
                overallTotals.quantities[
                    "POLO"
                ]
            )}
        </td>

        <td class="total-cell">
            ${formatNumber(
                overallTotals.productionQuantity
            )}
        </td>

    `;


    body.appendChild(
        quantityRow
    );


    /*
    |--------------------------------------------------------------------------
    | Riga Lavorazione
    |--------------------------------------------------------------------------
    |
    | Qui POLO È inclusa nel totale economico.
    |--------------------------------------------------------------------------
    */

    const valueRow =
        document.createElement(
            "tr"
        );


    valueRow.innerHTML = `

        <td class="row-label">
            Lavorazione (€)
        </td>

        <td>
            ${formatCurrency(
                overallTotals.values[
                    "END-FAST"
                ]
            )}
        </td>

        <td>
            ${formatCurrency(
                overallTotals.values[
                    "E-LIGHT"
                ]
            )}
        </td>

        <td>
            ${formatCurrency(
                overallTotals.values[
                    "SMART"
                ]
            )}
        </td>

        <td>
            ${formatCurrency(
                overallTotals.values[
                    "KEPPY"
                ]
            )}
        </td>

        <td>
            ${formatCurrency(
                overallTotals.values[
                    "CR 2.0 T"
                ]
            )}
        </td>

        <td>
            ${formatCurrency(
                overallTotals.values[
                    "CR 2.0 S/B"
                ]
            )}
        </td>

        <td>
            ${formatCurrency(
                overallTotals.values[
                    "NOVA"
                ]
            )}
        </td>

        <td>
            ${formatCurrency(
                overallTotals.values[
                    "POLO"
                ]
            )}
        </td>

        <td class="total-cell">
            ${formatCurrency(
                overallTotals.totalValue
            )}
        </td>

    `;


    body.appendChild(
        valueRow
    );

}



/*
|--------------------------------------------------------------------------
| Riepilogo mensile per ODCL
|--------------------------------------------------------------------------
*/

function renderMonthlyODCL(
    records,
    monthlyTotalValue,
    year,
    month
) {

    const body =
        document.getElementById(
            "monthlyODCLBody"
        );


    if (!body) {

        return;

    }


    const grouped =
        new Map();


    records.forEach(
        record => {

            const odcl =
                String(
                    record.odcl ?? ""
                ).trim();


            if (!odcl) {

                return;

            }


            if (
                !grouped.has(
                    odcl
                )
            ) {

                grouped.set(
                    odcl,
                    []
                );

            }


            grouped
                .get(odcl)
                .push(record);

        }
    );


    const sortedODCL =
        [
            ...grouped.keys()
        ]
        .sort(
            (a, b) =>
                a.localeCompare(
                    b,
                    "it",
                    {
                        numeric: true
                    }
                )
        );


    body.innerHTML = "";


    if (!sortedODCL.length) {

        body.innerHTML = `
            <tr>

                <td
                    colspan="4"
                    class="empty-row"
                >
                    Nessun dato disponibile
                    per il periodo selezionato.
                </td>

            </tr>
        `;

        return;

    }


    let grandQuantity = 0;

    let grandValue = 0;


    sortedODCL.forEach(
        odcl => {

            const totals =
                aggregateRecords(
                    grouped.get(
                        odcl
                    )
                );


            const percentage =
                monthlyTotalValue > 0
                    ? (
                        totals.totalValue /
                        monthlyTotalValue
                    ) * 100
                    : 0;


            grandQuantity +=
                totals.productionQuantity;


            grandValue +=
                totals.totalValue;


            const row =
                document.createElement(
                    "tr"
                );


            row.innerHTML = `

                <td>
                    ${escapeHtml(
                        odcl
                    )}
                </td>

                <td>
                    ${formatNumber(
                        totals.productionQuantity
                    )}
                </td>

                <td>
                    ${formatCurrency(
                        totals.totalValue
                    )}
                </td>

                <td>
                    ${formatPercentage(
                        percentage
                    )}
                </td>

            `;


            body.appendChild(
                row
            );

        }
    );


    const totalRow =
        document.createElement(
            "tr"
        );


    totalRow.className =
        "total-row";


    totalRow.innerHTML = `

        <td>
            TOTALE
        </td>

        <td>
            ${formatNumber(
                grandQuantity
            )}
        </td>

        <td>
            ${formatCurrency(
                grandValue
            )}
        </td>

        <td>
            ${formatPercentage(
                monthlyTotalValue > 0
                    ? 100
                    : 0
            )}
        </td>

    `;


    body.appendChild(
        totalRow
    );


    setText(
        "monthlyODCLTitle",
        `RIEPILOGO PER ODCL - ${getMonthName(month).toUpperCase()} ${year} (escluso POLO per quantità)`
    );

}


/*
|--------------------------------------------------------------------------
| Aggregazione
|--------------------------------------------------------------------------
*/

function aggregateRecords(
    records
) {

    const quantities = {};

    const values = {};


    ANALYSIS_FAMILIES.forEach(
        family => {

            quantities[
                family.key
            ] = 0;


            values[
                family.key
            ] = 0;

        }
    );


    records.forEach(
        record => {

            const classification =
                record.classificazione ||
                {};


            const workingValues =
                record.valoreLavorazione ||
                {};


            ANALYSIS_FAMILIES.forEach(
                family => {

                    quantities[
                        family.key
                    ] +=
                        getNumericFamilyValue(
                            classification,
                            family.key
                        );


                    values[
                        family.key
                    ] +=
                        getNumericFamilyValue(
                            workingValues,
                            family.key
                        );

                }
            );

        }
    );


    const productionQuantity =
        QUANTITY_FAMILIES.reduce(
            (
                total,
                family
            ) =>
                total +
                quantities[
                    family.key
                ],
            0
        );


    const totalValue =
        ANALYSIS_FAMILIES.reduce(
            (
                total,
                family
            ) =>
                total +
                values[
                    family.key
                ],
            0
        );


    return {

        quantities,

        values,

        productionQuantity,

        totalValue

    };

}


/*
|--------------------------------------------------------------------------
| Recupero famiglia
|--------------------------------------------------------------------------
*/

function getNumericFamilyValue(
    source,
    familyKey
) {

    if (
        !source ||
        typeof source !== "object"
    ) {

        return 0;

    }


    const direct =
        source[
            familyKey
        ];


    if (
        direct !== undefined &&
        direct !== null &&
        !Number.isNaN(
            Number(direct)
        )
    ) {

        return Number(
            direct
        );

    }


    const target =
        normalizeKey(
            familyKey
        );


    const matchingKey =
        Object.keys(
            source
        )
        .find(
            key =>
                normalizeKey(
                    key
                ) === target
        );


    if (!matchingKey) {

        return 0;

    }


    const value =
        Number(
            source[
                matchingKey
            ]
        );


    return Number.isNaN(
        value
    )
        ? 0
        : value;

}


/*
|--------------------------------------------------------------------------
| Normalizzazione chiave
|--------------------------------------------------------------------------
*/

function normalizeKey(
    value
) {

    return String(
        value
    )
    .toUpperCase()
    .replace(
        /[.\s/_-]+/g,
        ""
    );

}


/*
|--------------------------------------------------------------------------
| Data
|--------------------------------------------------------------------------
*/

function isRecordInPeriod(
    record,
    year,
    month
) {

    const date =
        String(
            record?.dataConsegna ?? ""
        ).trim();


    if (!date) {

        return false;

    }


    const match =
        date.match(
            /^(\d{4})-(\d{2})-(\d{2})/
        );


    if (!match) {

        return false;

    }


    return (

        match[1] ===
        String(year)

        &&

        match[2] ===
        String(
            month
        ).padStart(
            2,
            "0"
        )

    );

}


function getRecordYear(
    record
) {

    const date =
        String(
            record?.dataConsegna ?? ""
        ).trim();


    const match =
        date.match(
            /^(\d{4})-(\d{2})-(\d{2})/
        );


    return match
        ? match[1]
        : null;

}


/*
|--------------------------------------------------------------------------
| Stati vuoti
|--------------------------------------------------------------------------
*/

function renderEmptyODCL() {

    setText(
        "odclResultTitle",
        "SELEZIONA UN ODCL"
    );


    [
        "odcl-end-fast",
        "odcl-e-light",
        "odcl-smart",
        "odcl-keppy",
        "odcl-cr20t",
        "odcl-cr20sb",
        "odcl-nova",
        "odcl-polo"
    ]
    .forEach(
        id =>
            setText(
                id,
                "0"
            )
    );


    setText(
        "odcl-total-quantity",
        "0"
    );


    setText(
        "odcl-total-value",
        formatCurrency(
            0
        )
    );

}


function renderEmptyMonthly() {

    setText(
        "monthlyFamilyTitle",
        "RIEPILOGO PER FAMIGLIA"
    );


    ANALYSIS_FAMILIES.forEach(
        family => {

            setText(
                `monthly-q-${makeId(
                    family.key
                )}`,
                "0"
            );


            setText(
                `monthly-v-${makeId(
                    family.key
                )}`,
                formatCurrency(
                    0
                )
            );

        }
    );


    setText(
        "monthly-q-total",
        "0"
    );


    setText(
        "monthly-v-total",
        formatCurrency(
            0
        )
    );


    const body =
        document.getElementById(
            "monthlyFamilyBody"
        );


    if (body) {

        body.innerHTML = `

            <tr>

                <td
                    colspan="10"
                    class="empty-row"
                >
                    Seleziona anno e mese.
                </td>

            </tr>

        `;

    }


    setText(
        "monthlyODCLTitle",
        "RIEPILOGO PER ODCL"
    );

}


/*
|--------------------------------------------------------------------------
| Utility
|--------------------------------------------------------------------------
*/

function makeId(
    value
) {

    return String(
        value
    )
    .replace(
        /[^a-zA-Z0-9]+/g,
        "-"
    )
    .replace(
        /^-|-$/g,
        ""
    );

}


function setText(
    id,
    value
) {

    const element =
        document.getElementById(
            id
        );


    if (element) {

        element.textContent =
            value;

    }

}


function setFamilyValue(
    id,
    value
) {

    setText(
        id,
        formatNumber(
            value
        )
    );

}


function formatNumber(
    value
) {

    return Number(
        value || 0
    )
    .toLocaleString(
        "it-IT",
        {
            maximumFractionDigits: 2
        }
    );

}


function formatCurrency(
    value
) {

    return Number(
        value || 0
    )
    .toLocaleString(
        "it-IT",
        {
            style: "currency",
            currency: "EUR",
            minimumFractionDigits: 2,
            maximumFractionDigits: 2
        }
    );

}


function formatPercentage(
    value
) {

    return Number(
        value || 0
    )
    .toLocaleString(
        "it-IT",
        {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2
        }
    ) + " %";

}


function getMonthName(
    month
) {

    return MONTHS[
        Number(
            month
        ) - 1
    ] || "";

}


function escapeHtml(
    value
) {

    return String(
        value
    )
    .replaceAll(
        "&",
        "&amp;"
    )
    .replaceAll(
        "<",
        "&lt;"
    )
    .replaceAll(
        ">",
        "&gt;"
    )
    .replaceAll(
        '"',
        "&quot;"
    )
    .replaceAll(
        "'",
        "&#039;"
    );

}


function showPageError(
    message
) {

    const workspace =
        document.querySelector(
            ".workspace"
        );


    if (!workspace) {

        return;

    }


    const error =
        document.createElement(
            "div"
        );


    error.className =
        "page-error";


    error.textContent =
        message;


    workspace.prepend(
        error
    );

}