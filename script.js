"use strict";

/* =========================================================
   SUPABASE CONFIGURATION
========================================================= */

const SUPABASE_URL =
    "https://hzqawunnchuryzgmgiwi.supabase.co";

/*
   KEEP YOUR EXISTING SUPABASE PUBLISHABLE KEY HERE.

   Do NOT use the service_role key in this file.
*/

const SUPABASE_KEY =
    "YOUR_EXISTING_SUPABASE_PUBLISHABLE_KEY";


const supabaseClient =
    window.supabase.createClient(
        SUPABASE_URL,
        SUPABASE_KEY
    );


/* =========================================================
   GLOBAL VARIABLES
========================================================= */

let members = [];
let filteredMembers = [];


/* =========================================================
   BASIC HELPER
========================================================= */

function getElement(id) {
    return document.getElementById(id);
}


/* =========================================================
   NAIRA FORMAT
========================================================= */

function formatNaira(amount) {

    return new Intl.NumberFormat(
        "en-NG",
        {
            style: "currency",
            currency: "NGN",
            minimumFractionDigits: 2
        }
    ).format(
        Number(amount || 0)
    );
}


/* =========================================================
   DATE FORMAT
========================================================= */

function formatDate(dateValue) {

    if (!dateValue) {
        return "";
    }

    const date = new Date(dateValue);

    if (Number.isNaN(date.getTime())) {
        return "";
    }

    return date.toLocaleDateString(
        "en-NG",
        {
            year: "numeric",
            month: "short",
            day: "numeric"
        }
    );
}


/* =========================================================
   ESCAPE HTML
========================================================= */

function escapeHTML(value) {

    return String(value ?? "")
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#039;");
}