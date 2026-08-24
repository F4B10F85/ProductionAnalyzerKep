"use strict";

module.exports = {

    packagerConfig: {

        name:
            "ProductionAnalyzerKep",

        executableName:
            "ProductionAnalyzerKep",

        appBundleId:
            "com.fabiofilippini.productionanalykerkep",

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