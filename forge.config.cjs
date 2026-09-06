"use strict";

const path = require("path");

module.exports = {

    packagerConfig: {

        name:
            "ProductionAnalyzerKep",

        executableName:
            "ProductionAnalyzerKep",

        appBundleId:
            "com.fabiofilippini.productionanalykerkep",

        icon:
            path.join(
                __dirname,
                "ingranaggi2"
            ),

        asar:
            true

    },


    makers: [

        {
            name:
                "@electron-forge/maker-squirrel",

            config: {

                name:
                    "ProductionAnalyzerKep"

            }

        },


        {
            name:
                "@electron-forge/maker-zip",

            platforms: [
                "win32"
            ]

        }

    ]

};