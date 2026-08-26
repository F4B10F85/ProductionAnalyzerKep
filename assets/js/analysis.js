"use strict";


let monthlyODCLExpanded = false;
let monthlyFamilyExpanded = false;

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
            Seleziona OdCL
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


    /*
    |--------------------------------------------------------------------------
    | Titolo RIEPILOGO PER FAMIGLIA
    |--------------------------------------------------------------------------
    | Aggiorniamo solo lo <span>, senza distruggere il pulsante + / −.
    |--------------------------------------------------------------------------
    */

    const familyTitle =
        document.getElementById(
            "monthlyFamilyTitle"
        );


    if (familyTitle) {

        const label =
            familyTitle.querySelector(
                "span"
            );


        if (label) {

            label.textContent =
                `RIEPILOGO PER FAMIGLIA - ${getMonthName(month).toUpperCase()} ${year}`;

        }

    }


    /*
    |--------------------------------------------------------------------------
    | Tabella RIEPILOGO PER FAMIGLIA
    |--------------------------------------------------------------------------
    */

    renderMonthlyFamilyTable(
        records,
        totals
    );


    /*
    |--------------------------------------------------------------------------
    | Riepilogo ODCL
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
    | Righe singoli ODCL
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


            row.className =
                "monthly-family-detail-row";


            row.innerHTML = `

                <td class="row-label">
                    ${escapeHtml(
                        odcl
                    )}
                </td>

                <td>
                    ${Number(
                        odclTotals.quantities[
                            "END-FAST"
                        ] || 0
                    ).toLocaleString(
                        "it-IT",
                        {
                            useGrouping: true,
                            minimumFractionDigits: 0,
                            maximumFractionDigits: 0
                        }
                    )}
                </td>

                <td>
                    ${Number(
                        odclTotals.quantities[
                            "E-LIGHT"
                        ] || 0
                    ).toLocaleString(
                        "it-IT",
                        {
                            useGrouping: true,
                            minimumFractionDigits: 0,
                            maximumFractionDigits: 0
                        }
                    )}
                </td>

                <td>
                    ${Number(
                        odclTotals.quantities[
                            "SMART"
                        ] || 0
                    ).toLocaleString(
                        "it-IT",
                        {
                            useGrouping: true,
                            minimumFractionDigits: 0,
                            maximumFractionDigits: 0
                        }
                    )}
                </td>

                <td>
                    ${Number(
                        odclTotals.quantities[
                            "KEPPY"
                        ] || 0
                    ).toLocaleString(
                        "it-IT",
                        {
                            useGrouping: true,
                            minimumFractionDigits: 0,
                            maximumFractionDigits: 0
                        }
                    )}
                </td>

                <td>
                    ${Number(
                        odclTotals.quantities[
                            "CR 2.0 T"
                        ] || 0
                    ).toLocaleString(
                        "it-IT",
                        {
                            useGrouping: true,
                            minimumFractionDigits: 0,
                            maximumFractionDigits: 0
                        }
                    )}
                </td>

                <td>
                    ${Number(
                        odclTotals.quantities[
                            "CR 2.0 S/B"
                        ] || 0
                    ).toLocaleString(
                        "it-IT",
                        {
                            useGrouping: true,
                            minimumFractionDigits: 0,
                            maximumFractionDigits: 0
                        }
                    )}
                </td>

                <td>
                    ${Number(
                        odclTotals.quantities[
                            "NOVA"
                        ] || 0
                    ).toLocaleString(
                        "it-IT",
                        {
                            useGrouping: true,
                            minimumFractionDigits: 0,
                            maximumFractionDigits: 0
                        }
                    )}
                </td>

                <td>
                    ${Number(
                        odclTotals.quantities[
                            "POLO"
                        ] || 0
                    ).toLocaleString(
                        "it-IT",
                        {
                            useGrouping: true,
                            minimumFractionDigits: 0,
                            maximumFractionDigits: 0
                        }
                    )}
                </td>

                <td class="total-cell">
                    ${Number(
                        odclTotals.productionQuantity || 0
                    ).toLocaleString(
                        "it-IT",
                        {
                            useGrouping: true,
                            minimumFractionDigits: 0,
                            maximumFractionDigits: 0
                        }
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


    quantityRow.className =
        "monthly-family-total-row";


    quantityRow.innerHTML = `

        <td class="row-label">
            Quantità
        </td>

        <td>
            ${Number(
                overallTotals.quantities[
                    "END-FAST"
                ] || 0
            ).toLocaleString(
                "it-IT",
                {
                    useGrouping: true,
                    minimumFractionDigits: 0,
                    maximumFractionDigits: 0
                }
            )}
        </td>

        <td>
            ${Number(
                overallTotals.quantities[
                    "E-LIGHT"
                ] || 0
            ).toLocaleString(
                "it-IT",
                {
                    useGrouping: true,
                    minimumFractionDigits: 0,
                    maximumFractionDigits: 0
                }
            )}
        </td>

        <td>
            ${Number(
                overallTotals.quantities[
                    "SMART"
                ] || 0
            ).toLocaleString(
                "it-IT",
                {
                    useGrouping: true,
                    minimumFractionDigits: 0,
                    maximumFractionDigits: 0
                }
            )}
        </td>

        <td>
            ${Number(
                overallTotals.quantities[
                    "KEPPY"
                ] || 0
            ).toLocaleString(
                "it-IT",
                {
                    useGrouping: true,
                    minimumFractionDigits: 0,
                    maximumFractionDigits: 0
                }
            )}
        </td>

        <td>
            ${Number(
                overallTotals.quantities[
                    "CR 2.0 T"
                ] || 0
            ).toLocaleString(
                "it-IT",
                {
                    useGrouping: true,
                    minimumFractionDigits: 0,
                    maximumFractionDigits: 0
                }
            )}
        </td>

        <td>
            ${Number(
                overallTotals.quantities[
                    "CR 2.0 S/B"
                ] || 0
            ).toLocaleString(
                "it-IT",
                {
                    useGrouping: true,
                    minimumFractionDigits: 0,
                    maximumFractionDigits: 0
                }
            )}
        </td>

        <td>
            ${Number(
                overallTotals.quantities[
                    "NOVA"
                ] || 0
            ).toLocaleString(
                "it-IT",
                {
                    useGrouping: true,
                    minimumFractionDigits: 0,
                    maximumFractionDigits: 0
                }
            )}
        </td>

        <td>
            ${Number(
                overallTotals.quantities[
                    "POLO"
                ] || 0
            ).toLocaleString(
                "it-IT",
                {
                    useGrouping: true,
                    minimumFractionDigits: 0,
                    maximumFractionDigits: 0
                }
            )}
        </td>

        <td class="total-cell">
            ${Number(
                overallTotals.productionQuantity || 0
            ).toLocaleString(
                "it-IT",
                {
                    useGrouping: true,
                    minimumFractionDigits: 0,
                    maximumFractionDigits: 0
                }
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
    */

    const valueRow =
        document.createElement(
            "tr"
        );


    valueRow.className =
        "monthly-family-total-row";


    valueRow.innerHTML = `

        <td class="row-label">
            Lavorazione (€)
        </td>

        <td>
            ${Number(
                overallTotals.values[
                    "END-FAST"
                ] || 0
            ).toLocaleString(
                "it-IT",
                {
                    useGrouping: true,
                    minimumFractionDigits: 2,
                    maximumFractionDigits: 2
                }
            )} €
        </td>

        <td>
            ${Number(
                overallTotals.values[
                    "E-LIGHT"
                ] || 0
            ).toLocaleString(
                "it-IT",
                {
                    useGrouping: true,
                    minimumFractionDigits: 2,
                    maximumFractionDigits: 2
                }
            )} €
        </td>

        <td>
            ${Number(
                overallTotals.values[
                    "SMART"
                ] || 0
            ).toLocaleString(
                "it-IT",
                {
                    useGrouping: true,
                    minimumFractionDigits: 2,
                    maximumFractionDigits: 2
                }
            )} €
        </td>

        <td>
            ${Number(
                overallTotals.values[
                    "KEPPY"
                ] || 0
            ).toLocaleString(
                "it-IT",
                {
                    useGrouping: true,
                    minimumFractionDigits: 2,
                    maximumFractionDigits: 2
                }
            )} €
        </td>

        <td>
            ${Number(
                overallTotals.values[
                    "CR 2.0 T"
                ] || 0
            ).toLocaleString(
                "it-IT",
                {
                    useGrouping: true,
                    minimumFractionDigits: 2,
                    maximumFractionDigits: 2
                }
            )} €
        </td>

        <td>
            ${Number(
                overallTotals.values[
                    "CR 2.0 S/B"
                ] || 0
            ).toLocaleString(
                "it-IT",
                {
                    useGrouping: true,
                    minimumFractionDigits: 2,
                    maximumFractionDigits: 2
                }
            )} €
        </td>

        <td>
            ${Number(
                overallTotals.values[
                    "NOVA"
                ] || 0
            ).toLocaleString(
                "it-IT",
                {
                    useGrouping: true,
                    minimumFractionDigits: 2,
                    maximumFractionDigits: 2
                }
            )} €
        </td>

        <td>
            ${Number(
                overallTotals.values[
                    "POLO"
                ] || 0
            ).toLocaleString(
                "it-IT",
                {
                    useGrouping: true,
                    minimumFractionDigits: 2,
                    maximumFractionDigits: 2
                }
            )} €
        </td>

        <td class="total-cell">
            ${Number(
                overallTotals.totalValue || 0
            ).toLocaleString(
                "it-IT",
                {
                    useGrouping: true,
                    minimumFractionDigits: 2,
                    maximumFractionDigits: 2
                }
            )} €
        </td>

    `;


    body.appendChild(
        valueRow
    );


    /*
    |--------------------------------------------------------------------------
    | Stato iniziale: righe compresse
    |--------------------------------------------------------------------------
    */

    monthlyFamilyExpanded =
        false;


    const detailRows =
        body.querySelectorAll(
            ".monthly-family-detail-row"
        );


    detailRows.forEach(
        row => {

            row.classList.add(
                "hidden"
            );

        }
    );


    const toggle =
        document.getElementById(
            "monthlyFamilyToggle"
        );


    if (toggle) {

        toggle.textContent =
            "+";

        toggle.setAttribute(
            "aria-expanded",
            "false"
        );

    }

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


            row.className =
                "monthly-odcl-detail-row";


            row.innerHTML = `

                <td>
                    ${escapeHtml(
                        odcl
                    )}
                </td>

                <td>
                    ${Number(
                        totals.productionQuantity || 0
                    ).toLocaleString(
                        "it-IT",
                        {
                            useGrouping: true,
                            minimumFractionDigits: 0,
                            maximumFractionDigits: 0
                        }
                    )}
                </td>

                <td>
                    ${Number(
                        totals.totalValue || 0
                    ).toLocaleString(
                        "it-IT",
                        {
                            useGrouping: true,
                            minimumFractionDigits: 2,
                            maximumFractionDigits: 2
                        }
                    )} €
                </td>

                <td>
                    ${Number(
                        percentage || 0
                    ).toLocaleString(
                        "it-IT",
                        {
                            minimumFractionDigits: 2,
                            maximumFractionDigits: 2
                        }
                    )} %
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
            ${Number(
                grandQuantity || 0
            ).toLocaleString(
                "it-IT",
                {
                    useGrouping: true,
                    minimumFractionDigits: 0,
                    maximumFractionDigits: 0
                }
            )}
        </td>

        <td>
            ${Number(
                grandValue || 0
            ).toLocaleString(
                "it-IT",
                {
                    useGrouping: true,
                    minimumFractionDigits: 2,
                    maximumFractionDigits: 2
                }
            )} €
        </td>

        <td>
            ${Number(
                monthlyTotalValue > 0
                    ? 100
                    : 0
            ).toLocaleString(
                "it-IT",
                {
                    minimumFractionDigits: 2,
                    maximumFractionDigits: 2
                }
            )} %
        </td>

    `;


    body.appendChild(
        totalRow
    );


    const title =
        document.getElementById(
            "monthlyODCLTitle"
        );


    if (title) {

        const label =
            title.querySelector(
                "span"
            );


        if (label) {

            label.textContent =
                `RIEPILOGO PER ODCL - ${getMonthName(month).toUpperCase()} ${year}`;

        }

    }

}

document.addEventListener(
    "DOMContentLoaded",
    () => {

        const button =
            document.getElementById(
                "monthlyODCLToggle"
            );


        if (!button) {

            return;

        }


        button.addEventListener(
            "click",
            toggleMonthlyODCLRows
        );

    }
);

document.addEventListener(
    "DOMContentLoaded",
    () => {

        const button =
            document.getElementById(
                "monthlyFamilyToggle"
            );


        if (!button) {

            return;

        }


        button.addEventListener(
            "click",
            toggleMonthlyFamilyRows
        );

    }
);


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
        "SELEZIONA UN OdCL"
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

    /*
    |--------------------------------------------------------------------------
    | Titolo RIEPILOGO PER FAMIGLIA
    |--------------------------------------------------------------------------
    */

    const familyTitle =
        document.getElementById(
            "monthlyFamilyTitle"
        );


    if (familyTitle) {

        const label =
            familyTitle.querySelector(
                "span"
            );


        if (label) {

            label.textContent =
                "RIEPILOGO PER FAMIGLIA";

        }

    }


    /*
    |--------------------------------------------------------------------------
    | Azzeramento valori famiglia
    |--------------------------------------------------------------------------
    */

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


    /*
    |--------------------------------------------------------------------------
    | Corpo tabella famiglia
    |--------------------------------------------------------------------------
    */

    const familyBody =
        document.getElementById(
            "monthlyFamilyBody"
        );


    if (familyBody) {

        familyBody.innerHTML = `

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


    /*
    |--------------------------------------------------------------------------
    | Titolo RIEPILOGO ODCL
    |--------------------------------------------------------------------------
    */

    const odclTitle =
        document.getElementById(
            "monthlyODCLTitle"
        );


    if (odclTitle) {

        const label =
            odclTitle.querySelector(
                "span"
            );


        if (label) {

            label.textContent =
                "RIEPILOGO PER ODCL";

        }

    }


    /*
    |--------------------------------------------------------------------------
    | Reset pulsante RIEPILOGO FAMIGLIA
    |--------------------------------------------------------------------------
    */

    const familyToggle =
        document.getElementById(
            "monthlyFamilyToggle"
        );


    if (familyToggle) {

        monthlyFamilyExpanded =
            false;


        familyToggle.textContent =
            "+";


        familyToggle.setAttribute(
            "aria-expanded",
            "false"
        );

    }


    /*
    |--------------------------------------------------------------------------
    | Reset pulsante RIEPILOGO ODCL
    |--------------------------------------------------------------------------
    */

    const odclToggle =
        document.getElementById(
            "monthlyODCLToggle"
        );


    if (odclToggle) {

        monthlyODCLExpanded =
            false;


        odclToggle.textContent =
            "+";


        odclToggle.setAttribute(
            "aria-expanded",
            "false"
        );

    }

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

    const number =
        Number(
            value || 0
        );


    return number
        .toLocaleString(
            "it-IT",
            {
                useGrouping: true,
                minimumFractionDigits: 0,
                maximumFractionDigits: 0
            }
        );

}


function formatCurrency(
    value
) {

    const number =
        Number(
            value || 0
        );


    return number
        .toLocaleString(
            "it-IT",
            {
                useGrouping: true,
                minimumFractionDigits: 2,
                maximumFractionDigits: 2
            }
        )
        + " €";

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

function toggleMonthlyODCLRows() {

    const rows =
        document.querySelectorAll(
            ".monthly-odcl-detail-row"
        );


    const button =
        document.getElementById(
            "monthlyODCLToggle"
        );


    monthlyODCLExpanded =
        !monthlyODCLExpanded;


    rows.forEach(
        row => {

            row.classList.toggle(
                "hidden",
                !monthlyODCLExpanded
            );

        }
    );


    if (button) {

        button.textContent =
            monthlyODCLExpanded
                ? "−"
                : "+";


        button.setAttribute(
            "aria-expanded",
            String(
                monthlyODCLExpanded
            )
        );

    }

}


function toggleMonthlyFamilyRows() {

    const rows =
        document.querySelectorAll(
            ".monthly-family-detail-row"
        );


    const button =
        document.getElementById(
            "monthlyFamilyToggle"
        );


    monthlyFamilyExpanded =
        !monthlyFamilyExpanded;


    rows.forEach(
        row => {

            row.classList.toggle(
                "hidden",
                !monthlyFamilyExpanded
            );

        }
    );


    if (button) {

        button.textContent =
            monthlyFamilyExpanded
                ? "−"
                : "+";


        button.setAttribute(
            "aria-expanded",
            String(
                monthlyFamilyExpanded
            )
        );

    }

}

