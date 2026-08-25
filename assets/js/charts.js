"use strict";

/*
|--------------------------------------------------------------------------
| Production Analyzer Kep
|--------------------------------------------------------------------------
| Grafici della pagina Analisi.
| Usa gli stessi dati di IndexedDB e gli stessi filtri Anno/Mese/ODCL.
|--------------------------------------------------------------------------
*/


let chartFamilyQuantity = null;

let chartFamilyValue = null;

let chartODCLValue = null;

let chartMonthlyValue = null;


const CHART_FAMILIES = [

    "END-FAST",

    "E-LIGHT",

    "SMART",

    "KEPPY",

    "CR 2.0 T",

    "CR 2.0 S/B",

    "NOVA",

    "POLO"

];


const CHART_FAMILY_LABELS = [

    "END",

    "E-LIGHT",

    "SMART",

    "KEPPY",

    "CR 2.0 T",

    "CR 2.0 S/B",

    "NOVA",

    "POLO"

];


/*
|--------------------------------------------------------------------------
| Inizializzazione
|--------------------------------------------------------------------------
*/

document.addEventListener(
    "DOMContentLoaded",
    initializeCharts
);


async function initializeCharts() {

    if (
        typeof Chart ===
        "undefined"
    ) {

        console.error(
            "Chart.js non è disponibile."
        );

        return;

    }


    const year =
        document.getElementById(
            "analysisYear"
        );


    const month =
        document.getElementById(
            "analysisMonth"
        );


    const odcl =
        document.getElementById(
            "analysisODCL"
        );


    if (
        !year ||
        !month ||
        !odcl
    ) {

        return;

    }


    year.addEventListener(
        "change",
        updateCharts
    );


    month.addEventListener(
        "change",
        updateCharts
    );


    odcl.addEventListener(
        "change",
        updateCharts
    );


    await updateCharts();

}


/*
|--------------------------------------------------------------------------
| Aggiornamento grafici
|--------------------------------------------------------------------------
*/

async function updateCharts() {

    try {

        const records =
            await getChartRecords();


        const year =
            document.getElementById(
                "analysisYear"
            )?.value || "";


        const month =
            document.getElementById(
                "analysisMonth"
            )?.value || "";


        const odcl =
            document.getElementById(
                "analysisODCL"
            )?.value || "";


        /*
         * Senza anno e mese
         * non mostriamo dati inventati.
         */

        if (
            !year ||
            !month
        ) {

            clearAllCharts();

            return;

        }


        /*
         * Filtro temporale.
         *
         * La data utilizzata è:
         *
         * record.dataConsegna
         *
         * e NON la data di importazione.
         */

        const periodRecords =
            records.filter(
                record =>
                    isInMonth(
                        record,
                        year,
                        month
                    )
            );


        /*
         * Se è stato selezionato un ODCL,
         * filtriamo ulteriormente.
         */

        const filteredRecords =
            odcl
                ? periodRecords.filter(
                    record =>
                        String(
                            record.odcl ?? ""
                        ) ===
                        String(odcl)
                )
                : periodRecords;


        renderFamilyCharts(
            filteredRecords
        );


        renderODCLChart(
            periodRecords,
            odcl
        );


        renderMonthlyChart(
            records,
            year
        );

    }
    catch (error) {

        console.error(
            "Errore aggiornamento grafici:",
            error
        );

    }

}


/*
|--------------------------------------------------------------------------
| Grafici per famiglia
|--------------------------------------------------------------------------
*/

function renderFamilyCharts(
    records
) {

    const quantities =
        Object.fromEntries(
            CHART_FAMILIES.map(
                family => [
                    family,
                    0
                ]
            )
        );


    const values =
        Object.fromEntries(
            CHART_FAMILIES.map(
                family => [
                    family,
                    0
                ]
            )
        );


    records.forEach(
        record => {

            const classification =
                record.classificazione ||
                {};


            const working =
                record.valoreLavorazione ||
                {};


            CHART_FAMILIES.forEach(
                family => {

                    quantities[family] +=
                        Number(
                            classification[
                                family
                            ] || 0
                        );


                    values[family] +=
                        Number(
                            working[
                                family
                            ] || 0
                        );

                }
            );

        }
    );


    drawBarChart(

        "chartFamilyQuantity",

        chartFamilyQuantity,

        CHART_FAMILY_LABELS,

        CHART_FAMILIES.map(
            family =>
                quantities[family]
        ),

        "Pezzi",

        false,

        instance => {

            chartFamilyQuantity =
                instance;

        }

    );


    drawBarChart(

        "chartFamilyValue",

        chartFamilyValue,

        CHART_FAMILY_LABELS,

        CHART_FAMILIES.map(
            family =>
                values[family]
        ),

        "€",

        true,

        instance => {

            chartFamilyValue =
                instance;

        }

    );

}


/*
|--------------------------------------------------------------------------
| Grafico lavorazione per ODCL
|--------------------------------------------------------------------------
*/

function renderODCLChart(
    records,
    selectedODCL
) {

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
                    0
                );

            }


            const working =
                record.valoreLavorazione ||
                {};


            const total =
                CHART_FAMILIES.reduce(
                    (
                        sum,
                        family
                    ) =>
                        sum +
                        Number(
                            working[
                                family
                            ] || 0
                        ),
                    0
                );


            grouped.set(
                odcl,
                grouped.get(
                    odcl
                ) + total
            );

        }
    );


    /*
     * Se è selezionato un ODCL,
     * garantiamo che venga visualizzato
     * anche nel caso in cui il valore sia 0.
     */

    if (
        selectedODCL &&
        !grouped.has(
            String(selectedODCL)
        )
    ) {

        grouped.set(
            String(selectedODCL),
            0
        );

    }


    const odcls =
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


    drawBarChart(

        "chartODCLValue",

        chartODCLValue,

        odcls,

        odcls.map(
            odcl =>
                grouped.get(
                    odcl
                )
        ),

        "€",

        true,

        instance => {

            chartODCLValue =
                instance;

        }

    );

}


/*
|--------------------------------------------------------------------------
| Grafico andamento mensile
|--------------------------------------------------------------------------
*/

function renderMonthlyChart(
    records,
    selectedYear
) {

    const months = [

        "Gen",

        "Feb",

        "Mar",

        "Apr",

        "Mag",

        "Giu",

        "Lug",

        "Ago",

        "Set",

        "Ott",

        "Nov",

        "Dic"

    ];


    const values =
        Array(
            12
        ).fill(
            0
        );


    records.forEach(
        record => {

            if (
                !record.dataConsegna
            ) {

                return;

            }


            const match =
                String(
                    record.dataConsegna
                )
                .match(
                    /^(\d{4})-(\d{2})-\d{2}$/
                );


            if (!match) {

                return;

            }


            const year =
                match[1];


            const monthIndex =
                Number(
                    match[2]
                ) - 1;


            if (
                selectedYear &&
                year !==
                    String(
                        selectedYear
                    )
            ) {

                return;

            }


            const working =
                record.valoreLavorazione ||
                {};


            values[
                monthIndex
            ] +=
                CHART_FAMILIES.reduce(
                    (
                        sum,
                        family
                    ) =>
                        sum +
                        Number(
                            working[
                                family
                            ] || 0
                        ),
                    0
                );

        }
    );


    const canvas =
        document.getElementById(
            "chartMonthlyValue"
        );


    if (!canvas) {

        return;

    }


    destroyChart(
        chartMonthlyValue
    );


    chartMonthlyValue =
        new Chart(
            canvas.getContext("2d"),
            {

                type:
                    "line",

                data: {

                    labels:
                        months,

                    datasets: [

                        {

                            label:
                                "Valore lavorazione",

                            data:
                                values,

                            borderWidth:
                                3,

                            tension:
                                0.25,

                            pointRadius:
                                4,

                            pointHoverRadius:
                                6

                        }

                    ]

                },


                options:
                    baseChartOptions(
                        {
                            currency: true
                        }
                    )

            }
        );

}


/*
|--------------------------------------------------------------------------
| Grafico a barre
|--------------------------------------------------------------------------
*/

function drawBarChart(

    canvasId,

    currentChart,

    labels,

    data,

    datasetLabel,

    currency,

    assign

) {

    const canvas =
        document.getElementById(
            canvasId
        );


    if (!canvas) {

        return;

    }


    destroyChart(
        currentChart
    );


    const chart =
        new Chart(
            canvas.getContext("2d"),
            {

                type:
                    "bar",

                data: {

                    labels:
                        labels,

                    datasets: [

                        {

                            label:
                                datasetLabel,

                            data:
                                data,

                            borderWidth:
                                0,

                            borderRadius:
                                5

                        }

                    ]

                },


                options:
                    baseChartOptions(
                        {
                            currency
                        }
                    )

            }
        );


    assign(
        chart
    );

}


/*
|--------------------------------------------------------------------------
| Opzioni comuni
|--------------------------------------------------------------------------
*/

function baseChartOptions({
    currency = false
} = {}) {

    return {

        responsive:
            true,

        maintainAspectRatio:
            false,


        plugins: {

            legend: {

                display:
                    false

            },


            tooltip: {

                callbacks: {

                    label(
                        context
                    ) {

                        const value =
                            Number(
                                context.raw ||
                                0
                            );


                        return currency

                            ? formatCurrency(
                                value
                            )

                            : formatNumber(
                                value
                            );

                    }

                }

            }

        },


        scales: {

            x: {

                grid: {

                    display:
                        false

                }

            },


            y: {

                beginAtZero:
                    true,


                ticks: {

                    callback(
                        value
                    ) {

                        return currency

                            ? formatCurrencyShort(
                                value
                            )

                            : formatNumber(
                                value
                            );

                    }

                }

            }

        }

    };

}


/*
|--------------------------------------------------------------------------
| Eliminazione grafici
|--------------------------------------------------------------------------
*/

function clearAllCharts() {

    destroyChart(
        chartFamilyQuantity
    );

    destroyChart(
        chartFamilyValue
    );

    destroyChart(
        chartODCLValue
    );

    destroyChart(
        chartMonthlyValue
    );


    chartFamilyQuantity =
        null;


    chartFamilyValue =
        null;


    chartODCLValue =
        null;


    chartMonthlyValue =
        null;

}


/*
|--------------------------------------------------------------------------
| Destroy
|--------------------------------------------------------------------------
*/

function destroyChart(
    chart
) {

    if (chart) {

        chart.destroy();

    }

}


/*
|--------------------------------------------------------------------------
| Lettura record
|--------------------------------------------------------------------------
*/

async function getChartRecords() {

    return await getAllRecords();

}


/*
|--------------------------------------------------------------------------
| Controllo mese
|--------------------------------------------------------------------------
*/

function isInMonth(
    record,
    year,
    month
) {

    const date =
        String(
            record.dataConsegna ?? ""
        ).trim();


    const match =
        date.match(
            /^(\d{4})-(\d{2})-\d{2}$/
        );


    if (!match) {

        return false;

    }


    return (

        match[1] ===
            String(
                year
            )

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


/*
|--------------------------------------------------------------------------
| Formattazione
|--------------------------------------------------------------------------
*/

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
            style:
                "currency",

            currency:
                "EUR",

            minimumFractionDigits:
                2,

            maximumFractionDigits:
                2

        }
    );

}


function formatCurrencyShort(
    value
) {

    const number =
        Number(
            value || 0
        );


    if (
        Math.abs(
            number
        ) >= 1000
    ) {

        return (

            (
                number / 1000
            )
            .toLocaleString(
                "it-IT",
                {
                    maximumFractionDigits:
                        1
                }
            )

            +

            "k €"

        );

    }


    return (

        number.toLocaleString(
            "it-IT",
            {
                maximumFractionDigits:
                    0
            }
        )

        +

        " €"

    );

}