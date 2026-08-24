"use strict";

/*
|--------------------------------------------------------------------------
| Production Analyzer Kep
|--------------------------------------------------------------------------
| Gestione dell'interfaccia e del caricamento dei file.
|--------------------------------------------------------------------------
*/


/*
|--------------------------------------------------------------------------
| Elementi interfaccia
|--------------------------------------------------------------------------
*/

const dropZone =
    document.getElementById("dropZone");

const fileInput =
    document.getElementById("fileInput");

const selectFileButton =
    document.getElementById("selectFileButton");

const importDetailsSection =
    document.getElementById("importDetailsSection");

const selectedFileName =
    document.getElementById("selectedFileName");

const odclInput =
    document.getElementById("odclInput");

const importButton =
    document.getElementById("importButton");

const cancelImportButton =
    document.getElementById("cancelImportButton");

const statusSection =
    document.getElementById("statusSection");

const statusMessage =
    document.getElementById("statusMessage");

const previewSection =
    document.getElementById("previewSection");

const previewInfo =
    document.getElementById("previewInfo");

const previewHeader =
    document.getElementById("previewHeader");

const previewBody =
    document.getElementById("previewBody");

const refreshArchiveButton =
    document.getElementById("refreshArchiveButton");

const archiveBody =
    document.getElementById("archiveBody");

const odclDetailSection =
    document.getElementById(
        "odclDetailSection"
    );

const odclDetailTitle =
    document.getElementById(
        "odclDetailTitle"
    );

const odclDetailInfo =
    document.getElementById(
        "odclDetailInfo"
    );

const odclDetailBody =
    document.getElementById(
        "odclDetailBody"
    );

const closeODCLButton =
    document.getElementById(
        "closeODCLButton"
    );


/*
|--------------------------------------------------------------------------
| Stato temporaneo dell'importazione
|--------------------------------------------------------------------------
|
| Il file trascinato non viene ancora importato.
| Viene semplicemente mantenuto in memoria mentre
| l'utente inserisce l'ODCL.
|--------------------------------------------------------------------------
*/

let pendingFile = null;


/*
|--------------------------------------------------------------------------
| Selezione file
|--------------------------------------------------------------------------
*/

selectFileButton.addEventListener(
    "click",
    () => {

        fileInput.click();

    }
);


fileInput.addEventListener(
    "change",
    event => {

        const file =
            event.target.files[0];


        if (file) {

            prepareFileForImport(file);

        }

    }
);


/*
|--------------------------------------------------------------------------
| Drag & Drop
|--------------------------------------------------------------------------
*/

dropZone.addEventListener(
    "dragover",
    event => {

        event.preventDefault();

        dropZone.classList.add("drag-over");

    }
);


dropZone.addEventListener(
    "dragleave",
    () => {

        dropZone.classList.remove("drag-over");

    }
);


dropZone.addEventListener(
    "drop",
    event => {

        event.preventDefault();

        dropZone.classList.remove("drag-over");


        const file =
            event.dataTransfer.files[0];


        if (!file) {
            return;
        }


        prepareFileForImport(file);

    }
);


/*
|--------------------------------------------------------------------------
| Preparazione file
|--------------------------------------------------------------------------
|
| Il file viene accettato, ma NON viene ancora letto.
| Prima deve essere inserito l'ODCL.
|--------------------------------------------------------------------------
*/

function prepareFileForImport(file) {

    const extension =
        file.name
            .split(".")
            .pop()
            .toLowerCase();


    if (!["xlsx", "xls"].includes(extension)) {

        showStatus(
            `
                <strong>File non valido.</strong><br>
                Sono accettati solamente file Excel
                .XLSX o .XLS.
            `,
            "error"
        );

        return;
    }


    pendingFile = file;


    selectedFileName.textContent =
        file.name;


    importDetailsSection.classList.remove(
        "hidden"
    );


    statusSection.classList.add(
        "hidden"
    );


    previewSection.classList.add(
        "hidden"
    );


    odclInput.value = "";

    importButton.disabled = true;


    odclInput.focus();

}


/*
|--------------------------------------------------------------------------
| Controllo ODCL
|--------------------------------------------------------------------------
*/

odclInput.addEventListener(
    "input",
    () => {

        const odcl =
            odclInput.value.trim();


        importButton.disabled =
            odcl.length === 0;

    }
);


/*
|--------------------------------------------------------------------------
| Annullamento
|--------------------------------------------------------------------------
*/

cancelImportButton.addEventListener(
    "click",
    () => {

        resetImportForm();

    }
);


/*
|--------------------------------------------------------------------------
| Importazione effettiva
|--------------------------------------------------------------------------
*/

importButton.addEventListener(
    "click",
    async () => {

        if (!pendingFile) {

            showStatus(
                "Nessun file selezionato.",
                "error"
            );

            return;
        }


        const odcl =
            odclInput.value.trim();


        if (!odcl) {

            showStatus(
                "Il numero ODCL è obbligatorio.",
                "error"
            );

            odclInput.focus();

            return;
        }


        importButton.disabled = true;


        try {

            showStatus(
                `
                    Lettura del file
                    <strong>${escapeHtml(pendingFile.name)}</strong>...
                `,
                "success"
            );


            const result =
                await readExcelFile(
                    pendingFile,
                    odcl
                );

            await saveImport(result);

            await loadArchive();


            showStatus(
                `
                    <strong>Importazione completata.</strong><br>
                    ${escapeHtml(result.fileName)}<br>
                    ODCL:
                    <strong>${escapeHtml(result.odcl)}</strong><br>
                    Foglio:
                    ${escapeHtml(result.sheetName)}<br>
                    Importazione:
                    <strong>${escapeHtml(result.importId)}</strong><br>
                    Righe importate:
                    <strong>${result.rowCount}</strong><br>
                    <br>
                    <strong>Dati salvati nell'archivio locale.</strong>
                `,
                "success"
            );


            showPreview(
                result.records
            );


            /*
             * Manteniamo temporaneamente
             * l'importazione disponibile in memoria.
             */

            window.currentImport =
                result;


            resetImportForm(
                false
            );

        }
        catch (error) {

            console.error(error);


            showStatus(
                `
                    <strong>Errore:</strong>
                    ${escapeHtml(error.message)}
                `,
                "error"
            );


            importButton.disabled = false;

        }

    }
);


/*
|--------------------------------------------------------------------------
| Anteprima
|--------------------------------------------------------------------------
*/

function showPreview(records) {

    previewSection.classList.remove(
        "hidden"
    );


    previewInfo.textContent =
        `Prime ${Math.min(records.length, 10)} righe su ${records.length} totali.`;


    const columns = [

        {
            key: "odcl",
            label: "ODCL"
        },

        {
            key: "dataConsegna",
            label: "Data consegna"
        },

        {
            key: "quantita",
            label: "Quantità"
        },

        {
            key: "codice",
            label: "Codice"
        },

        {
            key: "descrizione",
            label: "Descrizione"
        },

        {
            key: "descrizioneEstesa",
            label: "Descrizione estesa"
        }

    ];


    previewHeader.innerHTML = "";


    columns.forEach(
        column => {

            const th =
                document.createElement("th");


            th.textContent =
                column.label;


            previewHeader.appendChild(th);

        }
    );


    previewBody.innerHTML = "";


    const previewRecords =
        records.slice(0, 10);


    previewRecords.forEach(
        record => {

            const tr =
                document.createElement("tr");


            columns.forEach(
                column => {

                    const td =
                        document.createElement("td");


                    td.textContent =
                        record[column.key] ?? "";


                    tr.appendChild(td);

                }
            );


            previewBody.appendChild(tr);

        }
    );
}


/*
|--------------------------------------------------------------------------
| Reset form
|--------------------------------------------------------------------------
*/

function resetImportForm(
    hideSection = true
) {

    pendingFile = null;

    fileInput.value = "";

    odclInput.value = "";

    selectedFileName.textContent = "-";

    importButton.disabled = true;


    if (hideSection) {

        importDetailsSection.classList.add(
            "hidden"
        );

    }

}


/*
|--------------------------------------------------------------------------
| Stato interfaccia
|--------------------------------------------------------------------------
*/

function showStatus(message, type) {

    statusSection.classList.remove(
        "hidden"
    );


    statusMessage.className =
        `status-box status-${type}`;


    statusMessage.innerHTML =
        message;
}

/*
|--------------------------------------------------------------------------
| Archivio ODCL
|--------------------------------------------------------------------------
*/

async function loadArchive() {

    try {

        const imports =
            await getAllImports();


        archiveBody.innerHTML = "";


        if (imports.length === 0) {

            archiveBody.innerHTML = `
                <tr>
                    <td colspan="6">
                        Nessuna importazione presente.
                    </td>
                </tr>
            `;

            return;
        }


        /*
         * Mostriamo le importazioni più recenti
         * per prime.
         */

        imports.sort(
            (a, b) =>
                new Date(b.importedAt) -
                new Date(a.importedAt)
        );


        imports.forEach(
            importData => {

                const tr =
                    document.createElement("tr");


                tr.innerHTML = `

                    <td>
                        <strong>
                            ${escapeHtml(importData.odcl)}
                        </strong>
                    </td>

                    <td>
                        ${formatDateTime(
                            importData.importedAt
                        )}
                    </td>

                    <td>
                        ${escapeHtml(
                            importData.fileName
                        )}
                    </td>

                    <td>
                        ${escapeHtml(
                            importData.sheetName
                        )}
                    </td>

                    <td>
                        ${importData.rowCount}
                    </td>

                    <td>

                        <button
                            type="button"
                            class="button-secondary archive-open-button"
                            data-odcl="${escapeHtml(importData.odcl)}"
                        >
                            Apri
                        </button>

                        <button
                            type="button"
                            class="button-secondary archive-delete-button"
                        >
                            Elimina
                        </button>

                    </td>

                `;


                archiveBody.appendChild(tr);


                /*
                 * Pulsante Apri
                 */

                const openButton =
                    tr.querySelector(
                        ".archive-open-button"
                    );


                openButton.addEventListener(
                    "click",
                    () => {

                        openODCL(
                            importData.odcl
                        );

                    }
                );


                /*
                 * Pulsante Elimina
                 */

                const deleteButton =
                    tr.querySelector(
                        ".archive-delete-button"
                    );


                deleteButton.addEventListener(
                    "click",
                    async () => {

                        const confirmed =
                            confirm(
                                `Vuoi eliminare l'importazione ODCL ${importData.odcl}?\n\n` +
                                `File: ${importData.fileName}\n` +
                                `Righe: ${importData.rowCount}\n\n` +
                                `Verranno eliminate anche tutte le righe associate.`
                            );


                        if (!confirmed) {

                            return;

                        }


                        try {

                            deleteButton.disabled =
                                true;


                            deleteButton.textContent =
                                "Eliminazione...";


                            await deleteImport(
                                importData.importId
                            );


                            await loadArchive();


                        }
                        catch (error) {

                            console.error(
                                "Errore eliminazione importazione:",
                                error
                            );


                            alert(
                                "Errore durante l'eliminazione dell'importazione."
                            );


                            deleteButton.disabled =
                                false;


                            deleteButton.textContent =
                                "Elimina";

                        }

                    }
                );

            }
        );

    }
    catch (error) {

        console.error(
            "Errore caricamento archivio:",
            error
        );


        archiveBody.innerHTML = `
            <tr>
                <td colspan="6">
                    Errore nel caricamento dell'archivio.
                </td>
            </tr>
        `;

    }

}


/*
|--------------------------------------------------------------------------
| Formattazione data/ora
|--------------------------------------------------------------------------
*/

function formatDateTime(value) {

    const date =
        new Date(value);


    if (Number.isNaN(date.getTime())) {

        return "-";

    }


    return date.toLocaleString(
        "it-IT",
        {
            dateStyle: "short",
            timeStyle: "short"
        }
    );
}

/*
|--------------------------------------------------------------------------
| Sicurezza HTML
|--------------------------------------------------------------------------
*/

function escapeHtml(value) {

    return String(value)
        .replaceAll("&", "&amp;")
        .replaceAll("<", "&lt;")
        .replaceAll(">", "&gt;")
        .replaceAll('"', "&quot;")
        .replaceAll("'", "&#039;");
}

/*
|--------------------------------------------------------------------------
| Avvio archivio
|--------------------------------------------------------------------------
*/

refreshArchiveButton.addEventListener(
    "click",
    loadArchive
);


loadArchive();

/*
|--------------------------------------------------------------------------
| Apertura dettaglio ODCL
|--------------------------------------------------------------------------
*/

async function openODCL(odcl) {

    try {

        const records =
            await getRecordsByODCL(
                odcl
            );


        odclDetailSection.classList.remove(
            "hidden"
        );


        odclDetailTitle.textContent =
            `ODCL ${odcl}`;


        odclDetailInfo.textContent =
            `${records.length} righe presenti nell'ordine`;


        odclDetailBody.innerHTML = "";


        records.forEach(
            record => {

                const tr =
                    document.createElement("tr");


                tr.innerHTML = `

                    <td>
                        ${escapeHtml(
                            record.dataConsegna ?? ""
                        )}
                    </td>

                    <td>
                        ${record.quantita ?? ""}
                    </td>

                    <td>
                        ${escapeHtml(
                            record.codice ?? ""
                        )}
                    </td>

                    <td>
                        ${escapeHtml(
                            record.descrizione ?? ""
                        )}
                    </td>

                    <td>
                        ${escapeHtml(
                            record.descrizioneEstesa ?? ""
                        )}
                    </td>

                `;


                odclDetailBody.appendChild(tr);

            }
        );


        odclDetailSection.scrollIntoView({
            behavior: "smooth",
            block: "start"
        });

    }
    catch (error) {

        console.error(
            "Errore apertura ODCL:",
            error
        );


        showStatus(
            `
                <strong>Errore.</strong><br>
                Impossibile caricare
                l'ODCL ${escapeHtml(odcl)}.
            `,
            "error"
        );

    }

}


/*
|--------------------------------------------------------------------------
| Chiusura dettaglio ODCL
|--------------------------------------------------------------------------
*/

closeODCLButton.addEventListener(
    "click",
    () => {

        odclDetailSection.classList.add(
            "hidden"
        );

    }
);