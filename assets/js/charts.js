"use strict";


let chartFamilyQuantity =
    null;

let chartFamilyValue =
    null;

let chartODCLValue =
    null;

let chartMonthlyValue =
    null;


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


let chartsInitialized =
    false;


/*
|--------------------------------------------------------------------------
| INIZIALIZZAZIONE
|--------------------------------------------------------------------------
*/

document.addEventListener(
    "DOMContentLoaded",
    initializeCharts
);


async function initializeCharts() {

    if (
        chartsInitialized
    ) {

        return;

    }


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


    chartsInitialized =
        true;


    await updateCharts();

}


/*
|--------------------------------------------------------------------------
| AGGIORNAMENTO GRAFICI
|--------------------------------------------------------------------------
*/

async function updateCharts() {

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


    if (
        !year ||
        !month
    ) {

        clearCharts();

        return;

    }


    try {

        const {
            start,
            end
        } =
            getChartMonthRange(
                year,
                month
            );


        const periodRecords =
            await getRecordsByDateRange(
                start,
                end
            );


        const filteredRecords =
            odcl
                ? periodRecords.filter(
                    record =>
                        String(
                            record.odcl ??
                            ""
                        ) ===
                        String(
                            odcl
                        )
                )
                : periodRecords;


        renderFamilyCharts(
            filteredRecords
        );


        renderODCLChart(
            periodRecords,
            odcl
        );


        const yearRecords =
            await getRecordsByDateRange(
                `${year}-01-01`,
                `${Number(year) + 1}-01-01`
            );


        renderMonthlyChart(
            yearRecords,
            year
        );

    }
    catch (
        error
    ) {

        console.error(
            "Errore caricamento grafici:",
            error
        );

    }

}


/*
|--------------------------------------------------------------------------
| AGGIORNAMENTO DA ANALISI
|--------------------------------------------------------------------------
*/

function updateChartsFromAnalysisData(
    records,
    year,
    month
) {

    renderFamilyCharts(
        records
    );


    renderODCLChart(
        records,
        ""
    );


    const numericYear =
        Number(
            year
        );


    const numericMonth =
        Number(
            month
        );


    if (
        Number.isFinite(
            numericYear
        ) &&
        Number.isFinite(
            numericMonth
        )
    ) {

        void getRecordsByDateRange(
            `${numericYear}-01-01`,
            `${numericYear + 1}-01-01`
        )
        .then(
            recordsForYear =>
                renderMonthlyChart(
                    recordsForYear,
                    String(year)
                )
        )
        .catch(
            error =>
                console.error(
                    "Errore caricamento grafico annuale:",
                    error
                )
        );

    }

}


/*
|--------------------------------------------------------------------------
| PULIZIA GRAFICI
|--------------------------------------------------------------------------
*/

function clearCharts() {

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
| GRAFICI FAMIGLIE
|--------------------------------------------------------------------------
*/

function renderFamilyCharts(
    records
) {

    const quantities =
        Object.fromEntries(
            CHART_FAMILIES.map(
                family =>
                    [
                        family,
                        0
                    ]
            )
        );


    const values =
        Object.fromEntries(
            CHART_FAMILIES.map(
                family =>
                    [
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

                    quantities[
                        family
                    ] +=
                        Number(
                            classification[
                                family
                            ] ||
                            0
                        );


                    values[
                        family
                    ] +=
                        Number(
                            working[
                                family
                            ] ||
                            0
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
                quantities[
                    family
                ]
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
                values[
                    family
                ]
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
| GRAFICO ODCL
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
                    record.odcl ??
                    ""
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


            const value =
                CHART_FAMILIES.reduce(
                    (
                        sum,
                        family
                    ) =>
                        sum +
                        Number(
                            working[
                                family
                            ] ||
                            0
                        ),
                    0
                );


            grouped.set(
                odcl,
                grouped.get(
                    odcl
                ) + value
            );

        }
    );


    const labels =
        [
            ...grouped.keys()
        ]
        .sort(
            (
                a,
                b
            ) =>
                a.localeCompare(
                    b,
                    "it",
                    {
                        numeric:
                            true
                    }
                )
        );


    const data =
        labels.map(
            odcl =>
                grouped.get(
                    odcl
                )
        );


    drawBarChart(
        "chartODCLValue",
        chartODCLValue,
        labels,
        data,
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
| GRAFICO MENSILE
|--------------------------------------------------------------------------
*/

function renderMonthlyChart(
    records,
    year
) {

    const values =
        Array(
            12
        ).fill(
            0
        );


    records.forEach(
        record => {

            const date =
                String(
                    record.dataConsegna ??
                    ""
                ).trim();


            const match =
                date.match(
                    /^(\d{4})-(\d{2})-\d{2}$/
                );


            if (
                !match ||
                match[1] !==
                String(year)
            ) {

                return;

            }


            const monthIndex =
                Number(
                    match[2]
                ) - 1;


            if (
                monthIndex < 0 ||
                monthIndex > 11
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
                            ] ||
                            0
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
            canvas.getContext(
                "2d"
            ),
            {

                type:
                    "line",

                data: {

                    labels: [

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

                    ],

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
                    baseChartOptions({
                        currency:
                            true
                    })

            }
        );

}


/*
|--------------------------------------------------------------------------
| BAR CHART
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
            canvas.getContext(
                "2d"
            ),
            {

                type:
                    "bar",

                data: {

                    labels,

                    datasets: [

                        {

                            label:
                                datasetLabel,

                            data,

                            borderWidth:
                                0,

                            borderRadius:
                                5

                        }

                    ]

                },

                options:
                    baseChartOptions({
                        currency
                    })

            }
        );


    assign(
        chart
    );

}


/*
|--------------------------------------------------------------------------
| OPZIONI BASE
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
| DISTRUZIONE GRAFICO
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
| RANGE MENSILE
|--------------------------------------------------------------------------
*/

function getChartMonthRange(
    year,
    month
) {

    const numericYear =
        Number(
            year
        );


    const numericMonth =
        Number(
            month
        );


    const start =
        `${numericYear}-${String(
            numericMonth
        ).padStart(
            2,
            "0"
        )}-01`;


    const nextYear =
        numericMonth === 12
            ? numericYear + 1
            : numericYear;


    const nextMonth =
        numericMonth === 12
            ? 1
            : numericMonth + 1;


    const end =
        `${nextYear}-${String(
            nextMonth
        ).padStart(
            2,
            "0"
        )}-01`;


    return {

        start,

        end

    };

}


/*
|--------------------------------------------------------------------------
| FORMATTAZIONE NUMERI
|--------------------------------------------------------------------------
*/

function formatNumber(
    value
) {

    return Number(
        value ||
        0
    )
    .toLocaleString(
        "it-IT",
        {

            useGrouping:
                true,

            maximumFractionDigits:
                2

        }
    );

}


/*
|--------------------------------------------------------------------------
| FORMATTAZIONE VALUTA
|--------------------------------------------------------------------------
*/

function formatCurrency(
    value
) {

    return Number(
        value ||
        0
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


/*
|--------------------------------------------------------------------------
| FORMATTAZIONE VALUTA ABBREVIATA
|--------------------------------------------------------------------------
*/

function formatCurrencyShort(
    value
) {

    const number =
        Number(
            value ||
            0
        );


    if (
        Math.abs(
            number
        ) >=
        1000
    ) {

        return (

            (
                number /
                1000
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