/* =====================================================
   IDOGWU FAMILY DATABASE
   APPLICATION JAVASCRIPT
====================================================== */


/* =====================================================
   SUPABASE CONFIGURATION
====================================================== */

const SUPABASE_URL =
    "https://hzqawunnchuryzgmgiwi.supabase.co";

const SUPABASE_KEY =
    "sb_publishable_IBjtMX_HXiG1drNw8MksRg_PtddAlBa";

const supabaseClient =
    window.supabase.createClient(
        SUPABASE_URL,
        SUPABASE_KEY
    );


/* =====================================================
   GLOBAL VARIABLES
====================================================== */

let currentUser = null;

let currentUserIsAdmin = false;

let allMembers = [];

let locationChart = null;


/* =====================================================
   DOM HELPER
====================================================== */

function getElement(id) {

    return document.getElementById(id);
}


/* =====================================================
   HTML ESCAPE
====================================================== */

function escapeHtml(value) {

    if (
        value === null ||
        value === undefined
    ) {
        return "";
    }

    return String(value)
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#039;");
}


/* =====================================================
   MESSAGE
====================================================== */

function showMessage(
    elementId,
    message,
    type = ""
) {

    const element =
        getElement(elementId);

    if (!element) {
        return;
    }

    element.textContent =
        message;

    element.className =
        "message";

    if (type) {
        element.classList.add(type);
    }
}


/* =====================================================
   CURRENCY
====================================================== */

function formatCurrency(amount) {

    const number =
        Number(amount) || 0;

    return new Intl.NumberFormat(
        "en-NG",
        {
            style: "currency",
            currency: "NGN"
        }
    ).format(number);
}


/* =====================================================
   CHECK ADMIN
====================================================== */

async function checkAdminRole(userId) {

    if (!userId) {
        return false;
    }

    const {
        data,
        error
    } = await supabaseClient
        .from("user_roles")
        .select("role")
        .eq("user_id", userId)
        .maybeSingle();


    if (error) {

        console.error(
            "Admin role check error:",
            error
        );

        return false;
    }


    return data?.role === "admin";
}


/* =====================================================
   APPLY PERMISSIONS
====================================================== */

function applyUserPermissions() {

    const registrationSection =
        getElement(
            "memberRegistrationSection"
        );

    const exportButton =
        getElement(
            "exportButton"
        );


    if (currentUserIsAdmin) {

        if (registrationSection) {
            registrationSection.style.display =
                "";
        }

        if (exportButton) {
            exportButton.style.display =
                "";
        }

    } else {

        if (registrationSection) {
            registrationSection.style.display =
                "none";
        }

        if (exportButton) {
            exportButton.style.display =
                "none";
        }
    }
}


/* =====================================================
   LOGIN
====================================================== */

async function loginUser() {

    const email =
        getElement(
            "adminEmail"
        )?.value.trim();


    const password =
        getElement(
            "adminPassword"
        )?.value;


    if (!email || !password) {

        showMessage(
            "loginMessage",
            "Please enter your email and password.",
            "error"
        );

        return;
    }


    showMessage(
        "loginMessage",
        "Signing in...",
        ""
    );


    const {
        data,
        error
    } = await supabaseClient.auth
        .signInWithPassword({
            email: email,
            password: password
        });


    if (error) {

        console.error(error);

        showMessage(
            "loginMessage",
            error.message,
            "error"
        );

        return;
    }


    if (!data.user) {

        showMessage(
            "loginMessage",
            "Login failed. Please try again.",
            "error"
        );

        return;
    }


    currentUser =
        data.user;


    currentUserIsAdmin =
        await checkAdminRole(
            currentUser.id
        );


    await showApplication();
}


/* =====================================================
   SHOW APPLICATION
====================================================== */

async function showApplication() {

    const loginBox =
        getElement(
            "adminLoginBox"
        );


    const application =
        getElement(
            "adminApplication"
        );


    if (loginBox) {
        loginBox.style.display =
            "none";
    }


    if (application) {
        application.style.display =
            "block";
    }


    const loggedInUser =
        getElement(
            "loggedInUser"
        );


    if (
        loggedInUser &&
        currentUser
    ) {

        loggedInUser.textContent =
            currentUser.email +
            (
                currentUserIsAdmin
                    ? " • Administrator"
                    : " • Member"
            );
    }


    applyUserPermissions();

    await loadMembers();
}


/* =====================================================
   LOGOUT
====================================================== */

async function logoutUser() {

    await supabaseClient.auth.signOut();


    currentUser = null;

    currentUserIsAdmin = false;

    allMembers = [];


    const loginBox =
        getElement(
            "adminLoginBox"
        );


    const application =
        getElement(
            "adminApplication"
        );


    if (application) {
        application.style.display =
            "none";
    }


    if (loginBox) {
        loginBox.style.display =
            "";
    }


    const email =
        getElement(
            "adminEmail"
        );


    const password =
        getElement(
            "adminPassword"
        );


    if (email) {
        email.value = "";
    }


    if (password) {
        password.value = "";
    }
}


/* =====================================================
   LOAD MEMBERS
====================================================== */

async function loadMembers() {

    if (!currentUser) {
        return;
    }


    const tableBody =
        getElement(
            "membersTableBody"
        );


    if (tableBody) {

        tableBody.innerHTML = `
            <tr>
                <td
                    colspan="9"
                    class="table-message"
                >
                    Loading family members...
                </td>
            </tr>
        `;
    }


    const {
        data,
        error
    } = await supabaseClient
        .from("idogwu_members")
        .select("*")
        .order(
            "created_at",
            {
                ascending: false
            }
        );


    if (error) {

        console.error(
            "Load members error:",
            error
        );


        if (tableBody) {

            tableBody.innerHTML = `
                <tr>
                    <td
                        colspan="9"
                        class="table-message"
                    >
                        Unable to load members:
                        ${escapeHtml(
                            error.message
                        )}
                    </td>
                </tr>
            `;
        }

        return;
    }


    allMembers =
        data || [];


    updateDashboard(
        allMembers
    );


    updateLocationStatistics(
        allMembers
    );


    renderMembers(
        allMembers
    );
}


/* =====================================================
   DASHBOARD
====================================================== */

function updateDashboard(
    members
) {

    const total =
        members.length;


    const paid =
        members.filter(
            member =>
                Number(
                    member.amount || 0
                ) > 0
        ).length;


    const unpaid =
        total - paid;


    const totalAmount =
        members.reduce(
            (
                sum,
                member
            ) =>
                sum +
                Number(
                    member.amount || 0
                ),
            0
        );


    const average =
        total > 0
            ? totalAmount / total
            : 0;


    const locations =
        new Set(
            members
                .map(
                    member =>
                        (
                            member.location ||
                            ""
                        )
                            .trim()
                            .toLowerCase()
                )
                .filter(Boolean)
        ).size;


    if (
        getElement(
            "totalMembers"
        )
    ) {

        getElement(
            "totalMembers"
        ).textContent =
            total;
    }


    if (
        getElement(
            "paidMembers"
        )
    ) {

        getElement(
            "paidMembers"
        ).textContent =
            paid;
    }


    if (
        getElement(
            "unpaidMembers"
        )
    ) {

        getElement(
            "unpaidMembers"
        ).textContent =
            unpaid;
    }


    if (
        getElement(
            "totalAmount"
        )
    ) {

        getElement(
            "totalAmount"
        ).textContent =
            formatCurrency(
                totalAmount
            );
    }


    if (
        getElement(
            "averageAmount"
        )
    ) {

        getElement(
            "averageAmount"
        ).textContent =
            formatCurrency(
                average
            );
    }


    if (
        getElement(
            "totalLocations"
        )
    ) {

        getElement(
            "totalLocations"
        ).textContent =
            locations;
    }
}


/* =====================================================
   FAMILY LOCATION STATISTICS
====================================================== */

function updateLocationStatistics(
    members
) {

    const statisticsBody =
        getElement(
            "locationStatisticsBody"
        );


    const chartCanvas =
        getElement(
            "locationChart"
        );


    if (
        !statisticsBody ||
        !chartCanvas
    ) {
        return;
    }


    /* ---------------------------------------------
       COUNT LOCATIONS
    --------------------------------------------- */

    const locationCounts = {};


    members.forEach(
        member => {

            let location =
                (
                    member.location ||
                    ""
                ).trim();


            if (!location) {
                location =
                    "Not Specified";
            }


            if (
                !locationCounts[
                    location
                ]
            ) {

                locationCounts[
                    location
                ] = 0;
            }


            locationCounts[
                location
            ]++;
        }
    );


    let locations =
        Object.keys(
            locationCounts
        );


    /* ---------------------------------------------
       CLEAR TABLE
    --------------------------------------------- */

    statisticsBody.innerHTML =
        "";


    if (!members.length) {

        statisticsBody.innerHTML = `
            <tr>
                <td
                    colspan="4"
                    class="table-message"
                >
                    No location data available.
                </td>
            </tr>
        `;


        if (locationChart) {

            locationChart.destroy();

            locationChart = null;
        }


        return;
    }


    /* ---------------------------------------------
       SORT
    --------------------------------------------- */

    locations.sort(
        (
            a,
            b
        ) =>
            locationCounts[b] -
            locationCounts[a]
    );


    /* ---------------------------------------------
       LOCATION TABLE
    --------------------------------------------- */

    locations.forEach(
        (
            location,
            index
        ) => {

            const count =
                locationCounts[
                    location
                ];


            const percentage =
                (
                    count /
                    members.length *
                    100
                ).toFixed(1);


            const row =
                document.createElement(
                    "tr"
                );


            row.innerHTML = `

                <td>
                    ${index + 1}
                </td>

                <td>
                    ${escapeHtml(
                        location
                    )}
                </td>

                <td>
                    ${count}
                </td>

                <td>
                    ${percentage}%
                </td>

            `;


            statisticsBody.appendChild(
                row
            );
        }
    );


    /* ---------------------------------------------
       CHART
    --------------------------------------------- */

    if (locationChart) {

        locationChart.destroy();

        locationChart = null;
    }


    locationChart =
        new Chart(
            chartCanvas,
            {

                type: "bar",

                data: {

                    labels:
                        locations,

                    datasets: [

                        {

                            label:
                                "Family Members",

                            data:
                                locations.map(
                                    location =>
                                        locationCounts[
                                            location
                                        ]
                                ),

                            borderWidth: 1

                        }

                    ]

                },


                options: {

                    responsive: true,

                    maintainAspectRatio:
                        false,


                    plugins: {

                        legend: {

                            display: false

                        },


                        tooltip: {

                            callbacks: {

                                label:
                                    function(
                                        context
                                    ) {

                                        const count =
                                            context.raw;


                                        const percentage =
                                            (
                                                count /
                                                members.length *
                                                100
                                            ).toFixed(1);


                                        return (
                                            count +
                                            " member(s) — " +
                                            percentage +
                                            "%"
                                        );
                                    }
                            }
                        }
                    },


                    scales: {

                        y: {

                            beginAtZero:
                                true,

                            ticks: {

                                precision:
                                    0

                            },

                            title: {

                                display:
                                    true,

                                text:
                                    "Number of Members"

                            }

                        },


                        x: {

                            title: {

                                display:
                                    true,

                                text:
                                    "Location"

                            }

                        }

                    }

                }

            }
        );
}


/* =====================================================
   RENDER MEMBERS
====================================================== */

function renderMembers(
    members
) {

    const tableBody =
        getElement(
            "membersTableBody"
        );


    if (!tableBody) {
        return;
    }


    if (!members.length) {

        tableBody.innerHTML = `
            <tr>
                <td
                    colspan="9"
                    class="table-message"
                >
                    No registered family members found.
                </td>
            </tr>
        `;

        return;
    }


    tableBody.innerHTML =
        "";


    members.forEach(
        (
            member,
            index
        ) => {

            const row =
                document.createElement(
                    "tr"
                );


            const createdDate =
                member.created_at
                    ? new Date(
                        member.created_at
                    ).toLocaleDateString(
                        "en-NG"
                    )
                    : "";


            const actions =
                currentUserIsAdmin

                    ? `
                        <div class="action-buttons">

                            <button
                                class="btn btn-primary"
                                type="button"
                                onclick="editMember('${member.id}')"
                            >
                                Edit
                            </button>

                            <button
                                class="btn btn-danger"
                                type="button"
                                onclick="deleteMember('${member.id}')"
                            >
                                Delete
                            </button>

                        </div>
                    `

                    : `
                        <span>
                            View Only
                        </span>
                    `;


            row.innerHTML = `

                <td>
                    ${index + 1}
                </td>

                <td>
                    ${escapeHtml(
                        member.full_name
                    )}
                </td>

                <td>
                    ${escapeHtml(
                        member.phone
                    )}
                </td>

                <td>
                    ${escapeHtml(
                        member.email
                    )}
                </td>

                <td>
                    ${escapeHtml(
                        member.location
                    )}
                </td>

                <td>
                    ${formatCurrency(
                        member.amount
                    )}
                </td>

                <td>
                    ${escapeHtml(
                        member.purpose
                    )}
                </td>

                <td>
                    ${createdDate}
                </td>

                <td>
                    ${actions}
                </td>

            `;


            tableBody.appendChild(
                row
            );
        }
    );
}


/* =====================================================
   SEARCH
====================================================== */

function searchMembers() {

    const searchInput =
        getElement(
            "searchInput"
        );


    if (!searchInput) {
        return;
    }


    const search =
        searchInput.value
            .trim()
            .toLowerCase();


    if (!search) {

        renderMembers(
            allMembers
        );

        return;
    }


    const filtered =
        allMembers.filter(
            member => {

                const values = [

                    member.full_name,

                    member.phone,

                    member.email,

                    member.location,

                    member.purpose

                ];


                return values.some(
                    value =>
                        String(
                            value || ""
                        )
                            .toLowerCase()
                            .includes(
                                search
                            )
                );
            }
        );


    renderMembers(
        filtered
    );
}


/* =====================================================
   CLEAR FORM
====================================================== */

function clearMemberForm() {

    const fields = [

        "memberId",

        "fullName",

        "phone",

        "email",

        "location",

        "amount",

        "purpose"

    ];


    fields.forEach(
        id => {

            const element =
                getElement(id);


            if (element) {
                element.value =
                    "";
            }
        }
    );


    const title =
        getElement(
            "formTitle"
        );


    if (title) {

        title.textContent =
            "Register Family Member";
    }


    showMessage(
        "memberMessage",
        "",
        ""
    );
}


/* =====================================================
   SAVE MEMBER
====================================================== */

async function saveMember() {

    if (!currentUserIsAdmin) {

        showMessage(
            "memberMessage",
            "Only administrators can add or edit members.",
            "error"
        );

        return;
    }


    const memberId =
        getElement(
            "memberId"
        )?.value.trim();


    const fullName =
        getElement(
            "fullName"
        )?.value.trim();


    const phone =
        getElement(
            "phone"
        )?.value.trim();


    const email =
        getElement(
            "email"
        )?.value.trim();


    const location =
        getElement(
            "location"
        )?.value.trim();


    const amount =
        getElement(
            "amount"
        )?.value;


    const purpose =
        getElement(
            "purpose"
        )?.value.trim();


    if (
        !fullName ||
        !phone ||
        !location
    ) {

        showMessage(
            "memberMessage",
            "Please complete Full Name, Phone Number and Location.",
            "error"
        );

        return;
    }


    const memberData = {

        full_name:
            fullName,

        phone:
            phone,

        email:
            email || null,

        location:
            location,

        amount:
            Number(
                amount || 0
            ),

        purpose:
            purpose || null

    };


    showMessage(
        "memberMessage",
        "Saving member...",
        ""
    );


    let result;


    if (memberId) {

        result =
            await supabaseClient
                .from(
                    "idogwu_members"
                )
                .update(
                    memberData
                )
                .eq(
                    "id",
                    memberId
                );

    } else {

        result =
            await supabaseClient
                .from(
                    "idogwu_members"
                )
                .insert(
                    memberData
                );
    }


    if (result.error) {

        console.error(
            "Save member error:",
            result.error
        );


        showMessage(
            "memberMessage",
            result.error.message,
            "error"
        );

        return;
    }


    showMessage(
        "memberMessage",

        memberId
            ? "Member information updated successfully."
            : "Family member registered successfully.",

        "success"
    );


    clearMemberForm();


    await loadMembers();
}


/* =====================================================
   EDIT MEMBER
====================================================== */

async function editMember(
    memberId
) {

    if (!currentUserIsAdmin) {

        alert(
            "Only administrators can edit members."
        );

        return;
    }


    const member =
        allMembers.find(
            item =>
                String(
                    item.id
                ) ===
                String(
                    memberId
                )
        );


    if (!member) {

        alert(
            "Member information could not be found."
        );

        return;
    }


    getElement(
        "memberId"
    ).value =
        member.id || "";


    getElement(
        "fullName"
    ).value =
        member.full_name || "";


    getElement(
        "phone"
    ).value =
        member.phone || "";


    getElement(
        "email"
    ).value =
        member.email || "";


    getElement(
        "location"
    ).value =
        member.location || "";


    getElement(
        "amount"
    ).value =
        member.amount || "";


    getElement(
        "purpose"
    ).value =
        member.purpose || "";


    getElement(
        "formTitle"
    ).textContent =
        "Edit Family Member";


    window.scrollTo({
        top: 0,
        behavior: "smooth"
    });
}


/* =====================================================
   DELETE MEMBER
====================================================== */

async function deleteMember(
    memberId
) {

    if (!currentUserIsAdmin) {

        alert(
            "Only administrators can delete members."
        );

        return;
    }


    const confirmed =
        window.confirm(
            "Are you sure you want to delete this family member?"
        );


    if (!confirmed) {
        return;
    }


    const {
        error
    } =
        await supabaseClient
            .from(
                "idogwu_members"
            )
            .delete()
            .eq(
                "id",
                memberId
            );


    if (error) {

        console.error(
            "Delete member error:",
            error
        );


        alert(
            "Unable to delete member: " +
            error.message
        );

        return;
    }


    alert(
        "Family member deleted successfully."
    );


    await loadMembers();
}


/* =====================================================
   EXPORT CSV
====================================================== */

function exportMembersCSV() {

    if (!currentUserIsAdmin) {

        alert(
            "Only administrators can export member data."
        );

        return;
    }


    if (!allMembers.length) {

        alert(
            "There are no members to export."
        );

        return;
    }


    const headers = [

        "S/N",

        "Full Name",

        "Phone",

        "Email",

        "Location",

        "Amount",

        "Purpose",

        "Date"

    ];


    const rows =
        allMembers.map(
            (
                member,
                index
            ) => [

                index + 1,

                member.full_name || "",

                member.phone || "",

                member.email || "",

                member.location || "",

                member.amount || 0,

                member.purpose || "",

                member.created_at
                    ? new Date(
                        member.created_at
                    ).toLocaleDateString(
                        "en-NG"
                    )
                    : ""

            ]
        );


    const csvRows = [

        headers,

        ...rows

    ];


    const csv =
        csvRows
            .map(
                row =>
                    row
                        .map(
                            value =>
                                `"${String(
                                    value
                                ).replace(
                                    /"/g,
                                    '""'
                                )}"`
                        )
                        .join(",")
            )
            .join("\n");


    const blob =
        new Blob(
            [csv],
            {
                type:
                    "text/csv;charset=utf-8;"
            }
        );


    const url =
        URL.createObjectURL(
            blob
        );


    const link =
        document.createElement(
            "a"
        );


    link.href =
        url;


    link.download =
        "idogwu_family_members.csv";


    document.body.appendChild(
        link
    );


    link.click();


    document.body.removeChild(
        link
    );


    URL.revokeObjectURL(
        url
    );
}


/* =====================================================
   FORGOT PASSWORD
====================================================== */

function openForgotPassword() {

    const modal =
        getElement(
            "forgotPasswordBox"
        );


    if (modal) {

        modal.style.display =
            "flex";
    }
}


function closeForgotPassword() {

    const modal =
        getElement(
            "forgotPasswordBox"
        );


    if (modal) {

        modal.style.display =
            "none";
    }


    showMessage(
        "recoveryMessage",
        "",
        ""
    );
}


/* =====================================================
   PASSWORD RECOVERY
====================================================== */

async function sendPasswordRecovery() {

    const email =
        getElement(
            "recoveryEmail"
        )
            ?.value
            .trim();


    if (!email) {

        showMessage(
            "recoveryMessage",
            "Please enter your email address.",
            "error"
        );

        return;
    }


    showMessage(
        "recoveryMessage",
        "Sending recovery email...",
        ""
    );


    const redirectTo =
        window.location.origin +
        window.location.pathname;


    const {
        error
    } =
        await supabaseClient
            .auth
            .resetPasswordForEmail(
                email,
                {
                    redirectTo:
                        redirectTo
                }
            );


    if (error) {

        console.error(
            "Password recovery error:",
            error
        );


        showMessage(
            "recoveryMessage",
            error.message,
            "error"
        );

        return;
    }


    showMessage(
        "recoveryMessage",
        "Password recovery email sent. Please check your email.",
        "success"
    );
}


/* =====================================================
   PASSWORD RESET
====================================================== */

function openPasswordReset() {

    const modal =
        getElement(
            "passwordResetBox"
        );


    if (modal) {

        modal.style.display =
            "flex";
    }
}


async function saveNewPassword() {

    const password =
        getElement(
            "newAdminPassword"
        )
            ?.value;


    const confirmPassword =
        getElement(
            "confirmAdminPassword"
        )
            ?.value;


    if (
        !password ||
        !confirmPassword
    ) {

        showMessage(
            "resetMessage",
            "Please enter and confirm your new password.",
            "error"
        );

        return;
    }


    if (
        password !==
        confirmPassword
    ) {

        showMessage(
            "resetMessage",
            "The passwords do not match.",
            "error"
        );

        return;
    }


    if (
        password.length < 6
    ) {

        showMessage(
            "resetMessage",
            "Password should contain at least 6 characters.",
            "error"
        );

        return;
    }


    showMessage(
        "resetMessage",
        "Saving new password...",
        ""
    );


    const {
        error
    } =
        await supabaseClient
            .auth
            .updateUser({
                password:
                    password
            });


    if (error) {

        console.error(
            "Password update error:",
            error
        );


        showMessage(
            "resetMessage",
            error.message,
            "error"
        );

        return;
    }


    showMessage(
        "resetMessage",
        "Password updated successfully. You can now login with your new password.",
        "success"
    );


    getElement(
        "newAdminPassword"
    ).value = "";


    getElement(
        "confirmAdminPassword"
    ).value = "";
}


/* =====================================================
   AUTH STATE
====================================================== */

async function handleAuthState() {

    const {
        data
    } =
        await supabaseClient
            .auth
            .getSession();


    if (
        data?.session?.user
    ) {

        currentUser =
            data.session.user;


        currentUserIsAdmin =
            await checkAdminRole(
                currentUser.id
            );


        await showApplication();

    } else {

        const loginBox =
            getElement(
                "adminLoginBox"
            );


        const application =
            getElement(
                "adminApplication"
            );


        if (loginBox) {

            loginBox.style.display =
                "";
        }


        if (application) {

            application.style.display =
                "none";
        }
    }
}


/* =====================================================
   AUTH LISTENER
====================================================== */

supabaseClient.auth.onAuthStateChange(
    async (
        event,
        session
    ) => {

        if (
            event ===
            "PASSWORD_RECOVERY"
        ) {

            openPasswordReset();

            return;
        }


        if (
            session?.user
        ) {

            currentUser =
                session.user;


            currentUserIsAdmin =
                await checkAdminRole(
                    currentUser.id
                );


            await showApplication();
        }
    }
);


/* =====================================================
   EVENT LISTENERS
====================================================== */

document.addEventListener(
    "DOMContentLoaded",
    () => {


        /* LOGIN */

        getElement(
            "adminLoginButton"
        )?.addEventListener(
            "click",
            loginUser
        );


        /* LOGOUT */

        getElement(
            "logoutButton"
        )?.addEventListener(
            "click",
            logoutUser
        );


        /* FORGOT PASSWORD */

        getElement(
            "forgotPasswordButton"
        )?.addEventListener(
            "click",
            openForgotPassword
        );


        getElement(
            "closeForgotPassword"
        )?.addEventListener(
            "click",
            closeForgotPassword
        );


        getElement(
            "sendRecoveryButton"
        )?.addEventListener(
            "click",
            sendPasswordRecovery
        );


        /* PASSWORD RESET */

        getElement(
            "saveNewPassword"
        )?.addEventListener(
            "click",
            saveNewPassword
        );


        /* MEMBER */

        getElement(
            "saveMemberButton"
        )?.addEventListener(
            "click",
            saveMember
        );


        getElement(
            "clearFormButton"
        )?.addEventListener(
            "click",
            clearMemberForm
        );


        /* SEARCH */

        getElement(
            "searchInput"
        )?.addEventListener(
            "input",
            searchMembers
        );


        /* REFRESH */

        getElement(
            "refreshButton"
        )?.addEventListener(
            "click",
            loadMembers
        );


        /* EXPORT */

        getElement(
            "exportButton"
        )?.addEventListener(
            "click",
            exportMembersCSV
        );


        /* START APPLICATION */

        handleAuthState();

    }
);
