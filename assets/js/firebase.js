"use strict";

/*
|--------------------------------------------------------------------------
| Production Analyzer Kep
|--------------------------------------------------------------------------
| Connessione Firebase / Firestore
|--------------------------------------------------------------------------
*/

const firebaseConfig = {

    apiKey:
        "AIzaSyCWAuCZCJmF6SACuW7o-3RO9U4wWUa4XTo",

    authDomain:
        "productionanalyzerkep.firebaseapp.com",

    projectId:
        "productionanalyzerkep",

    storageBucket:
        "productionanalyzerkep.firebasestorage.app",

    messagingSenderId:
        "883513678332",

    appId:
        "1:883513678332:web:d8e88e29ce399c68e9ba79",

    measurementId:
        "G-TJ3J8KE43Y"

};


/*
|--------------------------------------------------------------------------
| Firebase
|--------------------------------------------------------------------------
*/

const firebaseApp =
    firebase.initializeApp(
        firebaseConfig
    );


/*
|--------------------------------------------------------------------------
| Firestore
|--------------------------------------------------------------------------
*/

const firestore =
    firebase.firestore();


/*
|--------------------------------------------------------------------------
| Esportazione globale
|--------------------------------------------------------------------------
|
| Manteniamo una piccola API globale per non dover trasformare
| tutto il progetto in moduli ES contemporaneamente.
|--------------------------------------------------------------------------
*/

window.KepFirebase = {

    app:
        firebaseApp,

    db:
        firestore,

    firebase:
        firebase

};