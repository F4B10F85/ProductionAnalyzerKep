"use strict";


let statisticsRecords = [];
let statisticsFamilyPieChart = null;


const STATISTICS_FAMILIES = [
    "END-FAST",
    "E-LIGHT",
    "SMART",
    "KEPPY",
    "CR 2.0 T",
    "CR 2.0 S/B",
    "NOVA"
];


const STATISTICS_MONTHS = [
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


async function initializeStatistics() {

    try {

        statisticsRecords =
            await getAllRecords();


        populateStatisticsYearSelect();

        populateStatisticsMonthSelect();

        renderStatistics();

    }
    catch (
        error
    ) {

        console.error(
            "Errore inizializzazione statistiche:",
            error
        );

    }

}


/*
|--------------------------------------------------------------------------
| ANNI
|--------------------------------------------------------------------------
*/

function populateStatisticsYearSelect() {

    const select =
        document.getElementById(
            "statisticsYear"
        );


    if (!select) {

        return;

    }


    const currentValue =
        select.value;


    select.innerHTML = `
        <option value="">
            Anno
        </option>
    `;


    const years =
        [
            ...new Set(
                statisticsRecords
                    .map(
                        record =>
                            getRecordYear(
                                record
                            )
                    )
                    .filter(Boolean)
            )
        ]
        .sort(
            (
                a,
                b
            ) =>
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


    if (
        years.includes(
            currentValue
        )
    ) {

        select.value =
            currentValue;

    }


    select.onchange =
        renderStatistics;

}


/*
|--------------------------------------------------------------------------
| MESI
|--------------------------------------------------------------------------
*/

function populateStatisticsMonthSelect() {

    const select =
        document.getElementById(
            "statisticsMonth"
        );


    if (!select) {

        return;

    }


    select.innerHTML = `
        <option value="">
            Tutto l'anno
        </option>
    `;


    STATISTICS_MONTHS.forEach(
        (
            month,
            index
        ) => {

            const option =
                document.createElement(
                    "option"
                );


            option.value =
                String(
                    index + 1
                )
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
        renderStatistics;

}


/*
|--------------------------------------------------------------------------
| RENDER
|--------------------------------------------------------------------------
*/

function renderStatistics() {

    const year =
        document.getElementById(
            "statisticsYear"
        )?.value || "";


    const month =
        document.getElementById(
            "statisticsMonth"
        )?.value || "";


    let records =
        statisticsRecords;


    if (year) {

        records =
            records.filter(
                record =>
                    getRecordYear(
                        record
                    ) ===
                    String(year)
            );

    }


    if (month) {

        records =
            records.filter(
                record =>
                    isRecordInPeriod(
                        record,
                        year,
                        month
                    )
            );

    }


    const totals =
        aggregateStatisticsRecords(
            records
        );


    updateStatisticsCards(
        totals,
        year,
        month
    );

    renderStatisticsFamilyTable(
        year
    );

    renderStatisticsFamilyPieChart(
        year
    );

    renderProductionExtremes(
        year
    );

}

function renderStatisticsFamilyTable(
    year
) {

    const body =
        document.getElementById(
            "statisticsFamilyBody"
        );


    if (!body) {

        return;

    }


    const numericYear =
        Number(
            year
        );


    body.innerHTML = "";


    if (
        !Number.isFinite(
            numericYear
        )
    ) {

        const row =
            document.createElement(
                "tr"
            );


        row.innerHTML = `
            <td
                colspan="4"
                class="empty-row"
            >
                Seleziona un anno.
            </td>
        `;


        body.appendChild(
            row
        );


        return;

    }


    const annualRecords =
        statisticsRecords.filter(
            record =>
                getRecordYear(
                    record
                ) ===
                String(
                    numericYear
                )
        );


    const quantities =
        Object.fromEntries(
            STATISTICS_FAMILIES.map(
                family => [
                    family,
                    0
                ]
            )
        );


    annualRecords.forEach(
        record => {

            const classification =
                record.classificazione ||
                {};


            STATISTICS_FAMILIES.forEach(
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

                }
            );

        }
    );


    const total =
        Object.values(
            quantities
        )
        .reduce(
            (
                sum,
                value
            ) =>
                sum +
                value,
            0
        );


    STATISTICS_FAMILIES.forEach(
        family => {

            const quantity =
                quantities[
                    family
                ];


            const percentage =
                total > 0
                    ? (
                        quantity /
                        total
                    ) *
                      100
                    : 0;


            const monthlyAverage =
                quantity /
                12;


            const row =
                document.createElement(
                    "tr"
                );


            row.innerHTML = `

                <td>
                    ${family}
                </td>

                <td>
                    ${formatStatisticNumber(
                        quantity
                    )}
                </td>

                <td>
                    ${percentage.toLocaleString(
                        "it-IT",
                        {
                            minimumFractionDigits:
                                1,

                            maximumFractionDigits:
                                1
                        }
                    )}%
                </td>

                <td>
                    ${formatStatisticNumber(
                        monthlyAverage
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
    | TOTALE
    |--------------------------------------------------------------------------
    */

    const totalRow =
        document.createElement(
            "tr"
        );


    totalRow.className =
        "statistics-total-row";


    totalRow.innerHTML = `

        <td>
            TOTALE
        </td>

        <td>
            ${formatStatisticNumber(
                total
            )}
        </td>

        <td>
            ${total > 0
                ? "100,0%"
                : "0,0%"
            }
        </td>

        <td>
            ${formatStatisticNumber(
                total /
                12
            )}
        </td>

    `;


    body.appendChild(
        totalRow
    );

}


/*
|--------------------------------------------------------------------------
| AGGREGAZIONE
|--------------------------------------------------------------------------
*/

function aggregateStatisticsRecords(
    records
) {

    const quantities =
        Object.fromEntries(
            STATISTICS_FAMILIES.map(
                family => [
                    family,
                    0
                ]
            )
        );


    const values =
        Object.fromEntries(
            STATISTICS_FAMILIES.map(
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


            STATISTICS_FAMILIES.forEach(
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


    const totalQuantity =
        Object.values(
            quantities
        )
        .reduce(
            (
                sum,
                value
            ) =>
                sum +
                value,
            0
        );


    const totalValue =
        Object.values(
            values
        )
        .reduce(
            (
                sum,
                value
            ) =>
                sum +
                value,
            0
        );


    return {

        quantities,

        values,

        totalQuantity,

        totalValue

    };

}


/*
|--------------------------------------------------------------------------
| KPI
|--------------------------------------------------------------------------
*/

function updateStatisticsCards(
    totals,
    year,
    month
) {

    const {

        totalQuantity,

        totalValue

    } =
        totals;


    const selectedYear =
        Number(
            year
        );


    let annualRecords = [];


    if (
        Number.isFinite(
            selectedYear
        )
    ) {

        annualRecords =
            statisticsRecords.filter(
                record =>
                    getRecordYear(
                        record
                    ) ===
                    String(
                        selectedYear
                    )
            );

    }
    else {

        annualRecords =
            statisticsRecords;

    }


    const annualTotals =
        aggregateStatisticsRecords(
            annualRecords
        );


    const annualMonths =
        getActiveMonths(
            annualRecords
        );


    const averageQuantity =
        annualMonths.length
            ? annualTotals.totalQuantity /
              annualMonths.length
            : 0;


    const averageValue =
        annualMonths.length
            ? annualTotals.totalValue /
              annualMonths.length
            : 0;


    const averagePerHelmet =
        totalQuantity > 0
            ? totalValue /
              totalQuantity
            : 0;


    /*
    |--------------------------------------------------------------------------
    | TESTI PERIODO
    |--------------------------------------------------------------------------
    */

    const periodLabel =
        month
            ? STATISTICS_MONTHS[
                Number(month) - 1
            ] +
            " " +
            year
            : year
                ? String(year)
                : "tutto lo storico";


    setStatisticText(
        "statCaschiPeriodo",
        formatStatisticNumber(
            totalQuantity
        )
    );


    setStatisticText(
        "statCaschiPeriodoNote",
        periodLabel
    );


    setStatisticText(
        "statMediaCaschi",
        formatStatisticNumber(
            averageQuantity
        )
    );


    setStatisticText(
        "statLavorazionePeriodo",
        formatStatisticCurrency(
            totalValue
        )
    );


    setStatisticText(
        "statLavorazionePeriodoNote",
        periodLabel
    );


    setStatisticText(
        "statMediaLavorazione",
        formatStatisticCurrency(
            averageValue
        )
    );


    setStatisticText(
        "statMediaPerCasco",
        formatStatisticCurrency(
            averagePerHelmet
        )
    );


    /*
    |--------------------------------------------------------------------------
    | FAMIGLIA PRINCIPALE
    |--------------------------------------------------------------------------
    */

    const mainFamily =
        STATISTICS_FAMILIES
            .map(
                family => ({
                    family,

                    quantity:
                        totals.quantities[
                            family
                        ]
                })
            )
            .sort(
                (
                    a,
                    b
                ) =>
                    b.quantity -
                    a.quantity
            )[0];


    if (
        mainFamily &&
        mainFamily.quantity >
        0
    ) {

        setStatisticText(
            "statFamigliaPrincipale",
            mainFamily.family
        );


        setStatisticText(
            "statFamigliaPrincipaleNote",
            `${formatStatisticNumber(
                mainFamily.quantity
            )} caschi`
        );

    }
    else {

        setStatisticText(
            "statFamigliaPrincipale",
            "-"
        );


        setStatisticText(
            "statFamigliaPrincipaleNote",
            "nessun dato"
        );

    }


    /*
    |--------------------------------------------------------------------------
    | SINTESI
    |--------------------------------------------------------------------------
    */

    setStatisticText(
        "statProduzioneSummary",
        `${formatStatisticNumber(
            totalQuantity
        )} caschi`
    );


    setStatisticText(
        "statLavorazioneSummary",
        formatStatisticCurrency(
            totalValue
        )
    );


    setStatisticText(
        "statValoreMedioSummary",
        formatStatisticCurrency(
            averagePerHelmet
        )
    );

}


/*
|--------------------------------------------------------------------------
| MASSIMO / MINIMO MENSILE
|--------------------------------------------------------------------------
*/

function renderProductionExtremes(
    year
) {

    const selectedYear =
        Number(
            year
        );


    if (
        !Number.isFinite(
            selectedYear
        )
    ) {

        setStatisticText(
            "statPiccoProduzione",
            "-"
        );


        setStatisticText(
            "statPiccoProduzioneNote",
            "seleziona un anno"
        );


        setStatisticText(
            "statMinProduzione",
            "-"
        );


        setStatisticText(
            "statMinProduzioneNote",
            "seleziona un anno"
        );


        return;

    }


    const monthlyTotals =
        Array(
            12
        ).fill(
            0
        );


    statisticsRecords
        .filter(
            record =>
                getRecordYear(
                    record
                ) ===
                String(
                    selectedYear
                )
        )
        .forEach(
            record => {

                const date =
                    String(
                        record.dataConsegna ||
                        ""
                    );


                const match =
                    date.match(
                        /^\d{4}-(\d{2})-\d{2}$/
                    );


                if (!match) {

                    return;

                }


                const index =
                    Number(
                        match[1]
                    ) - 1;


                if (
                    index < 0 ||
                    index > 11
                ) {

                    return;

                }


                const classification =
                    record.classificazione ||
                    {};


                monthlyTotals[
                    index
                ] +=
                    STATISTICS_FAMILIES.reduce(
                        (
                            sum,
                            family
                        ) =>
                            sum +
                            Number(
                                classification[
                                    family
                                ] ||
                                0
                            ),
                        0
                    );

            }
        );


    const active =
        monthlyTotals
            .map(
                (
                    value,
                    index
                ) => ({
                    value,
                    index
                })
            )
            .filter(
                item =>
                    item.value >
                    0
            );


    if (!active.length) {

        setStatisticText(
            "statPiccoProduzione",
            "-"
        );


        setStatisticText(
            "statPiccoProduzioneNote",
            "nessun dato"
        );


        setStatisticText(
            "statMinProduzione",
            "-"
        );


        setStatisticText(
            "statMinProduzioneNote",
            "nessun dato"
        );


        return;

    }


    const max =
        active.reduce(
            (
                best,
                item
            ) =>
                item.value >
                best.value
                    ? item
                    : best
        );


    const min =
        active.reduce(
            (
                best,
                item
            ) =>
                item.value <
                best.value
                    ? item
                    : best
        );


    setStatisticText(
        "statPiccoProduzione",
        formatStatisticNumber(
            max.value
        )
    );


    setStatisticText(
        "statPiccoProduzioneNote",
        STATISTICS_MONTHS[
            max.index
        ]
    );


    setStatisticText(
        "statMinProduzione",
        formatStatisticNumber(
            min.value
        )
    );


    setStatisticText(
        "statMinProduzioneNote",
        STATISTICS_MONTHS[
            min.index
        ]
    );

}


/*
|--------------------------------------------------------------------------
| MESI CON DATI
|--------------------------------------------------------------------------
*/

function getActiveMonths(
    records
) {

    const months =
        new Set();


    records.forEach(
        record => {

            const date =
                String(
                    record.dataConsegna ||
                    ""
                );


            const match =
                date.match(
                    /^\d{4}-(\d{2})-\d{2}$/
                );


            if (match) {

                months.add(
                    match[1]
                );

            }

        }
    );


    return [
        ...months
    ];

}


/*
|--------------------------------------------------------------------------
| HELPERS
|--------------------------------------------------------------------------
*/

function setStatisticText(
    elementId,
    value
) {

    const element =
        document.getElementById(
            elementId
        );


    if (element) {

        element.textContent =
            value;

    }

}


function formatStatisticNumber(
    value
) {

    return Number(
        value || 0
    )
    .toLocaleString(
        "it-IT",
        {
            maximumFractionDigits:
                1
        }
    );

}


function formatStatisticCurrency(
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

function renderStatisticsFamilyPieChart(
    year
) {

    const canvas =
        document.getElementById(
            "statisticsFamilyPieChart"
        );


    if (!canvas) {

        return;

    }


    const numericYear =
        Number(
            year
        );


    if (
        !Number.isFinite(
            numericYear
        )
    ) {

        if (
            statisticsFamilyPieChart
        ) {

            statisticsFamilyPieChart.destroy();

            statisticsFamilyPieChart =
                null;

        }

        return;

    }


    const annualRecords =
        statisticsRecords.filter(
            record =>
                getRecordYear(
                    record
                ) ===
                String(
                    numericYear
                )
        );


    const quantities =
        Object.fromEntries(
            STATISTICS_FAMILIES.map(
                family => [
                    family,
                    0
                ]
            )
        );


    annualRecords.forEach(
        record => {

            const classification =
                record.classificazione ||
                {};


            STATISTICS_FAMILIES.forEach(
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

                }
            );

        }
    );


    const labels =
        STATISTICS_FAMILIES;


    const data =
        labels.map(
            family =>
                quantities[
                    family
                ]
        );


    const total =
        data.reduce(
            (
                sum,
                value
            ) =>
                sum +
                value,
            0
        );


    if (
        statisticsFamilyPieChart
    ) {

        statisticsFamilyPieChart.destroy();

    }


    statisticsFamilyPieChart =
        new Chart(
            canvas.getContext(
                "2d"
            ),
            {

                type:
                    "doughnut",


                data: {

                    labels,

                    datasets: [

                        {

                            data,

                            backgroundColor: [

                                "#2878c8",

                                "#65ced7",

                                "#0eb340",

                                "#99cd5e",

                                "#f2b134",

                                "#e67e22",

                                "#9b59b6"

                            ],

                            borderColor:
                                "#000000",

                            borderWidth:
                                1

                        }

                    ]

                },


                options: {

                    responsive:
                        true,

                    maintainAspectRatio:
                        false,

                    cutout:
                        "58%",


                    plugins: {

                        legend: {

                            position:
                                "right",

                            labels: {

                                generateLabels(
                                    chart
                                ) {

                                    const dataset =
                                        chart.data.datasets[0];


                                    return chart.data.labels.map(
                                        (
                                            label,
                                            index
                                        ) => {

                                            const value =
                                                Number(
                                                    dataset.data[
                                                        index
                                                    ] ||
                                                    0
                                                );


                                            const percentage =
                                                total > 0
                                                    ? (
                                                        value /
                                                        total
                                                    ) *
                                                      100
                                                    : 0;


                                            return {

                                                text:
                                                    `${label} ${percentage.toLocaleString(
                                                        "it-IT",
                                                        {
                                                            minimumFractionDigits:
                                                                1,

                                                            maximumFractionDigits:
                                                                1
                                                        }
                                                    )}%`,

                                                fillStyle:
                                                    dataset.backgroundColor[
                                                        index
                                                    ],

                                                strokeStyle:
                                                    dataset.borderColor,

                                                lineWidth:
                                                    dataset.borderWidth,

                                                hidden:
                                                    !chart.getDataVisibility(
                                                        index
                                                    ),

                                                index

                                            };

                                        }
                                    );

                                }

                            }

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


                                    const percentage =
                                        total > 0
                                            ? (
                                                value /
                                                total
                                            ) *
                                              100
                                            : 0;


                                    return (
                                        context.label +
                                        ": " +
                                        formatStatisticNumber(
                                            value
                                        ) +
                                        " caschi (" +
                                        percentage.toLocaleString(
                                            "it-IT",
                                            {
                                                minimumFractionDigits:
                                                    1,

                                                maximumFractionDigits:
                                                    1
                                            }
                                        ) +
                                        "%)"
                                    );

                                }

                            }

                        }

                    }

                }

            }
        );

}