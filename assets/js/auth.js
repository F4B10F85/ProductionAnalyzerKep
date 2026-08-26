"use strict";

/*
|--------------------------------------------------------------------------
| Production Analyzer Kep
|--------------------------------------------------------------------------
| Autenticazione Firebase
|--------------------------------------------------------------------------
*/


document.addEventListener(
    "DOMContentLoaded",
    initializeAuth
);


function initializeAuth() {

    const loginScreen =
        document.getElementById(
            "loginScreen"
        );


    const appShell =
        document.querySelector(
            ".app-shell"
        );


    const loginForm =
        document.getElementById(
            "loginForm"
        );


    const loginButton =
        document.getElementById(
            "loginButton"
        );


    const loginError =
        document.getElementById(
            "loginError"
        );


    if (
        !loginScreen ||
        !appShell ||
        !loginForm
    ) {

        return;

    }


    /*
     * Stato iniziale:
     * mostra login, nasconde app.
     */

    loginScreen.classList.remove(
        "hidden"
    );


    appShell.classList.add(
        "hidden"
    );


    /*
     * Submit login
     */

    loginForm.addEventListener(
        "submit",
        async event => {

            event.preventDefault();


            const email =
                document
                    .getElementById(
                        "loginEmail"
                    )
                    .value
                    .trim();


            const password =
                document
                    .getElementById(
                        "loginPassword"
                    )
                    .value;


            hideLoginError();


            loginButton.disabled =
                true;


            loginButton.textContent =
                "ACCESSO...";


            try {

                await KepFirebase.auth
                    .signInWithEmailAndPassword(
                        email,
                        password
                    );

            }
            catch (error) {

                console.error(
                    "Errore autenticazione:",
                    error
                );


                showLoginError(
                    getAuthErrorMessage(
                        error
                    )
                );


                loginButton.disabled =
                    false;


                loginButton.textContent =
                    "ACCEDI";

            }

        }
    );


    /*
     * Stato autenticazione
     */

    KepFirebase.auth.onAuthStateChanged(
        async user => {

            if (user) {

                loginScreen.classList.add(
                    "hidden"
                );


                appShell.classList.remove(
                    "hidden"
                );


                loginButton.disabled =
                    false;


                loginButton.textContent =
                    "ACCEDI";


                /*
                |--------------------------------------------------------------------------
                | Archivio
                |--------------------------------------------------------------------------
                */

                if (
                    typeof loadArchive ===
                    "function"
                ) {

                    await loadArchive();

                }


                /*
                |--------------------------------------------------------------------------
                | Analisi
                |--------------------------------------------------------------------------
                */

                if (
                    typeof initializeAnalysis ===
                    "function"
                ) {

                    await initializeAnalysis();

                }


                /*
                |--------------------------------------------------------------------------
                | Grafici
                |--------------------------------------------------------------------------
                */

                if (
                    typeof initializeCharts ===
                    "function"
                ) {

                    await initializeCharts();

                }


                return;

            }


            loginScreen.classList.remove(
                "hidden"
            );


            appShell.classList.add(
                "hidden"
            );

        }
    );

    /*
     * Logout
     */
    
    const logoutButton =
        document.getElementById(
            "logoutButton"
        );
    
    
    if (logoutButton) {
    
        logoutButton.addEventListener(
            "click",
            async () => {
    
                try {
    
                    logoutButton.disabled =
                        true;
    
                    logoutButton.textContent =
                        "USCITA...";
    
                    await KepFirebase.auth
                        .signOut();
    
                }
                catch (error) {
    
                    console.error(
                        "Errore logout:",
                        error
                    );
    
                    logoutButton.disabled =
                        false;
    
                    logoutButton.textContent =
                        "ESCI";
    
                }
    
            }
        );
    
    }

}


function showLoginError(
    message
) {

    const element =
        document.getElementById(
            "loginError"
        );


    if (!element) {

        return;

    }


    element.textContent =
        message;


    element.classList.remove(
        "hidden"
    );

}


function hideLoginError() {

    const element =
        document.getElementById(
            "loginError"
        );


    if (!element) {

        return;

    }


    element.textContent =
        "";


    element.classList.add(
        "hidden"
    );

}


function getAuthErrorMessage(
    error
) {

    switch (
        error?.code
    ) {

        case "auth/invalid-email":

            return "Indirizzo email non valido.";


        case "auth/invalid-credential":

            return "Email o password non corretti.";


        case "auth/user-disabled":

            return "Questo account è stato disabilitato.";


        case "auth/too-many-requests":

            return "Troppi tentativi. Riprova più tardi.";


        default:

            return "Accesso non riuscito. Controlla le credenziali.";

    }

}
