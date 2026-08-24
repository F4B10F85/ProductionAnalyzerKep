"use strict";

const {
    app,
    BrowserWindow
} = require("electron");

const path =
    require("path");


function createWindow() {

    const mainWindow =
        new BrowserWindow({

            width: 1440,

            height: 900,

            minWidth: 1100,

            minHeight: 700,

            title:
                "Production Analyzer Kep",

            backgroundColor:
                "#f4f6f9",

            autoHideMenuBar:
                true,

            webPreferences: {

                contextIsolation:
                    true,

                nodeIntegration:
                    false

            }

        });


    mainWindow.loadFile(
        path.join(
            __dirname,
            "index.html"
        )
    );

}


app.whenReady().then(
    () => {

        createWindow();


        app.on(
            "activate",
            () => {

                if (
                    BrowserWindow
                        .getAllWindows()
                        .length === 0
                ) {

                    createWindow();

                }

            }
        );

    }
);


app.on(
    "window-all-closed",
    () => {

        if (
            process.platform !==
            "darwin"
        ) {

            app.quit();

        }

    }
);