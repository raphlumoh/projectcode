"use strict";

/* =========================================================
   SUPABASE CONFIGURATION
========================================================= */

const SUPABASE_URL =
    "https://hzqawunnchuryzgmgiwi.supabase.co";

const SUPABASE_KEY =
    "sb_publishable_IBjtMX_HXiG1drNw8MksRg_PtddAlBa";

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
    ).format(Number(amount || 0));
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


/* =========================================================
   SHOW LOGIN
========================================================= */

function showLogin() {

    const loginBox = getElement("adminLoginBox");
    const application = getElement("adminApplication");
    const loggedInUser = getElement("loggedInUser");

    if (loginBox) {
        loginBox.style.display = "flex";
    }

    if (application) {
        application.style.display = "none";
    }

    if (loggedInUser) {
        loggedInUser.textContent = "";
    }
}


/* =========================================================
   SHOW APPLICATION
========================================================= */

function showApplication(user) {

    const loginBox = getElement("adminLoginBox");
    const application = getElement("adminApplication");
    const loggedInUser = getElement("loggedInUser");

    if (loginBox) {
        loginBox.style.display = "none";
    }

    if (application) {
        application.style.display = "block";
    }

    if (loggedInUser && user) {

        loggedInUser.textContent =
            "Logged in as: " +
            (user.email || "Administrator");
    }
}


/* =========================================================
   CHECK ADMIN SESSION
========================================================= */

async function checkAdminSession() {

    try {

        const result =
            await supabaseClient.auth.getSession();

        const session = result.data?.session;

        if (session && session.user) {

            showApplication(session.user);

            await loadMembers();

        } else {

            showLogin();
        }

    } catch (error) {

        console.error(
            "Session check error:",
            error
        );

        showLogin();
    }
}


/* =========================================================
   ADMIN LOGIN
========================================================= */

const adminLoginButton =
    getElement("adminLoginButton");

if (adminLoginButton) {

    adminLoginButton.addEventListener(
        "click",
        async function () {

            const email =
                getElement("adminEmail")?.value
                    .trim();

            const password =
                getElement("adminPassword")?.value;

            const message =
                getElement("loginMessage");

            if (message) {
                message.textContent = "";
                message.className = "message";
            }

            if (!email || !password) {

                if (message) {

                    message.textContent =
                        "Please enter your email and password.";

                    message.className =
                        "message error";
                }

                return;
            }

            if (message) {

                message.textContent =
                    "Signing in...";

                message.className =
                    "message";
            }

            try {

                const result =
                    await supabaseClient.auth.signInWithPassword({
                        email: email,
                        password: password
                    });

                if (result.error) {
                    throw result.error;
                }

                showApplication(result.data.user);

                if (message) {

                    message.textContent =
                        "Login successful.";

                    message.className =
                        "message success";
                }

                await loadMembers();

            } catch (error) {

                console.error(
                    "Login error:",
                    error
                );

                if (message) {

                    message.textContent =
                        error.message ||
                        "Login failed. Please check your email and password.";

                    message.className =
                        "message error";
                }
            }
        }
    );
}


/* =========================================================
   LOGIN WITH ENTER KEY
========================================================= */

const adminPassword =
    getElement("adminPassword");

if (adminPassword) {

    adminPassword.addEventListener(
        "keydown",
        function (event) {

            if (event.key === "Enter") {

                event.preventDefault();

                if (adminLoginButton) {
                    adminLoginButton.click();
                }
            }
        }
    );
}


/* =========================================================
   FORGOT PASSWORD - OPEN MODAL
========================================================= */

const forgotPasswordButton =
    getElement("forgotPasswordButton");

if (forgotPasswordButton) {

    forgotPasswordButton.addEventListener(
        "click",
        function () {

            const box =
                getElement("forgotPasswordBox");

            const recoveryEmail =
                getElement("recoveryEmail");

            const recoveryMessage =
                getElement("recoveryMessage");

            if (box) {
                box.style.display = "flex";
            }

            if (recoveryEmail) {

                const adminEmail =
                    getElement("adminEmail")?.value.trim();

                if (adminEmail) {
                    recoveryEmail.value = adminEmail;
                }

                recoveryEmail.focus();
            }

            if (recoveryMessage) {
                recoveryMessage.textContent = "";
                recoveryMessage.className = "message";
            }
        }
    );
}


/* =========================================================
   CLOSE FORGOT PASSWORD
========================================================= */

const closeForgotPassword =
    getElement("closeForgotPassword");

if (closeForgotPassword) {

    closeForgotPassword.addEventListener(
        "click",
        function () {

            const box =
                getElement("forgotPasswordBox");

            if (box) {
                box.style.display = "none";
            }
        }
    );
}


/* =========================================================
   SEND PASSWORD RECOVERY EMAIL
========================================================= */

const sendRecoveryButton =
    getElement("sendRecoveryButton");

if (sendRecoveryButton) {

    sendRecoveryButton.addEventListener(
        "click",
        async function () {

            const email =
                getElement("recoveryEmail")?.value.trim();

            const message =
                getElement("recoveryMessage");

            if (message) {
                message.textContent = "";
                message.className = "message";
            }

            if (!email) {

                if (message) {

                    message.textContent =
                        "Please enter your administrator email.";

                    message.className =
                        "message error";
                }

                return;
            }

            const emailPattern =
                /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

            if (!emailPattern.test(email)) {

                if (message) {

                    message.textContent =
                        "Please enter a valid email address.";

                    message.className =
                        "message error";
                }

                return;
            }

            if (message) {

                message.textContent =
                    "Sending recovery email...";

                message.className =
                    "message";
            }

            try {

                const redirectTo =
                    window.location.origin +
                    window.location.pathname;

                const result =
                    await supabaseClient.auth
                        .resetPasswordForEmail(
                            email,
                            {
                                redirectTo: redirectTo
                            }
                        );

                if (result.error) {
                    throw result.error;
                }

                if (message) {

                    message.textContent =
                        "Password reset instructions have been sent to your email.";

                    message.className =
                        "message success";
                }

            } catch (error) {

                console.error(
                    "Password recovery error:",
                    error
                );

                if (message) {

                    message.textContent =
                        error.message ||
                        "Unable to send password recovery email.";

                    message.className =
                        "message error";
                }
            }
        }
    );
}


/* =========================================================
   SUPABASE AUTH STATE
========================================================= */

supabaseClient.auth.onAuthStateChange(
    function (event, session) {

        console.log(
            "Auth event:",
            event
        );

        if (event === "PASSWORD_RECOVERY") {

            const resetBox =
                getElement("passwordResetBox");

            const resetMessage =
                getElement("resetMessage");

            if (resetBox) {
                resetBox.style.display = "flex";
            }

            if (resetMessage) {
                resetMessage.textContent = "";
            }
        }

        if (
            event === "SIGNED_IN" &&
            session &&
            session.user
        ) {

            showApplication(
                session.user
            );
        }

        if (event === "SIGNED_OUT") {

            members = [];
            filteredMembers = [];

            showLogin();

            const tableBody =
                getElement("membersTableBody");

            if (tableBody) {
                tableBody.innerHTML = "";
            }
        }
    }
);


/* =========================================================
   SAVE NEW PASSWORD
========================================================= */

const saveNewPassword =
    getElement("saveNewPassword");

if (saveNewPassword) {

    saveNewPassword.addEventListener(
        "click",
        async function () {

            const newPassword =
                getElement("newAdminPassword")?.value;

            const confirmPassword =
                getElement("confirmAdminPassword")?.value;

            const message =
                getElement("resetMessage");

            if (message) {
                message.textContent = "";
                message.className = "message";
            }

            if (!newPassword || !confirmPassword) {

                if (message) {

                    message.textContent =
                        "Please enter and confirm your new password.";

                    message.className =
                        "message error";
                }

                return;
            }

            if (newPassword.length < 6) {

                if (message) {

                    message.textContent =
                        "Password must be at least 6 characters.";

                    message.className =
                        "message error";
                }

                return;
            }

            if (newPassword !== confirmPassword) {

                if (message) {

                    message.textContent =
                        "Passwords do not match.";

                    message.className =
                        "message error";
                }

                return;
            }

            try {

                const result =
                    await supabaseClient.auth.updateUser({
                        password: newPassword
                    });

                if (result.error) {
                    throw result.error;
                }

                if (message) {

                    message.textContent =
                        "Password changed successfully.";

                    message.className =
                        "message success";
                }

                if (getElement("newAdminPassword")) {
                    getElement("newAdminPassword").value = "";
                }

                if (getElement("confirmAdminPassword")) {
                    getElement("confirmAdminPassword").value = "";
                }

                setTimeout(
                    async function () {

                        const resetBox =
                            getElement("passwordResetBox");

                        if (resetBox) {
                            resetBox.style.display = "none";
                        }

                        await supabaseClient.auth.signOut();

                        showLogin();

                    },
                    1800
                );

            } catch (error) {

                console.error(
                    "Password update error:",
                    error
                );

                if (message) {

                    message.textContent =
                        error.message ||
                        "Unable to change password.";

                    message.className =
                        "message error";
                }
            }
        }
    );
}


/* =========================================================
   LOGOUT
========================================================= */

const logoutButton =
    getElement("logoutButton");

if (logoutButton) {

    logoutButton.addEventListener(
        "click",
        async function () {

            try {

                const result =
                    await supabaseClient.auth.signOut();

                if (result.error) {
                    throw result.error;
                }

                members = [];
                filteredMembers = [];

                const tableBody =
                    getElement("membersTableBody");

                if (tableBody) {
                    tableBody.innerHTML = "";
                }

                const loginEmail =
                    getElement("adminEmail");

                const loginPassword =
                    getElement("adminPassword");

                if (loginEmail) {
                    loginEmail.value = "";
                }

                if (loginPassword) {
                    loginPassword.value = "";
                }

                showLogin();

            } catch (error) {

                console.error(
                    "Logout error:",
                    error
                );

                alert(
                    error.message ||
                    "Unable to log out."
                );
            }
        }
    );
}


/* =========================================================
   LOAD MEMBERS
========================================================= */

async function loadMembers() {

    try {

        const result =
            await supabaseClient
                .from("idogwu_members")
                .select("*")
                .order(
                    "created_at",
                    {
                        ascending: false
                    }
                );

        if (result.error) {
            throw result.error;
        }

        members =
            result.data || [];

        filteredMembers =
            [...members];

        displayMembers(
            filteredMembers
        );

        updateDashboard();

    } catch (error) {

        console.error(
            "Load members error:",
            error
        );

        const tableBody =
            getElement("membersTableBody");

        if (tableBody) {

            tableBody.innerHTML = `
                <tr>
                    <td colspan="9" style="text-align:center;">
                        Unable to load family members.
                    </td>
                </tr>
            `;
        }
    }
}


/* =========================================================
   DISPLAY MEMBERS
========================================================= */

function displayMembers(list) {

    const tableBody =
        getElement("membersTableBody");

    if (!tableBody) {
        return;
    }

    if (!list || list.length === 0) {

        tableBody.innerHTML = `
            <tr>
                <td colspan="9" style="text-align:center;">
                    No family members found.
                </td>
            </tr>
        `;

        return;
    }

    tableBody.innerHTML =
        list.map(
            function (member, index) {

                const memberId =
                    JSON.stringify(member.id);

                return `
                    <tr>

                        <td>
                            ${index + 1}
                        </td>

                        <td>
                            ${escapeHTML(member.full_name)}
                        </td>

                        <td>
                            ${escapeHTML(member.phone)}
                        </td>

                        <td>
                            ${escapeHTML(member.email)}
                        </td>

                        <td>
                            ${escapeHTML(member.location)}
                        </td>

                        <td>
                            ${formatNaira(member.amount)}
                        </td>

                        <td>
                            ${escapeHTML(member.purpose)}
                        </td>

                        <td>
                            ${formatDate(member.created_at)}
                        </td>

                        <td>

                            <button
                                type="button"
                                class="btn btn-warning action-btn"
                                onclick='editMember(${memberId})'>
                                Edit
                            </button>

                            <button
                                type="button"
                                class="btn btn-danger action-btn"
                                onclick='deleteMember(${memberId})'>
                                Delete
                            </button>

                        </td>

                    </tr>
                `;
            }
        )
        .join("");
}


/* =========================================================
   UPDATE DASHBOARD
========================================================= */

function updateDashboard() {

    const total =
        members.length;

    const paid =
        members.filter(
            function (member) {
                return Number(
                    member.amount || 0
                ) > 0;
            }
        ).length;

    const unpaid =
        total - paid;

    const totalAmount =
        members.reduce(
            function (sum, member) {

                return sum +
                    Number(
                        member.amount || 0
                    );

            },
            0
        );

    const averageAmount =
        paid > 0
            ? totalAmount / paid
            : 0;

    const locations =
        new Set(
            members
                .map(
                    function (member) {
                        return String(
                            member.location || ""
                        )
                            .trim()
                            .toLowerCase();
                    }
                )
                .filter(Boolean)
        ).size;

    if (getElement("totalMembers")) {

        getElement("totalMembers")
            .textContent = total;
    }

    if (getElement("paidMembers")) {

        getElement("paidMembers")
            .textContent = paid;
    }

    if (getElement("unpaidMembers")) {

        getElement("unpaidMembers")
            .textContent = unpaid;
    }

    if (getElement("totalAmount")) {

        getElement("totalAmount")
            .textContent =
            formatNaira(totalAmount);
    }

    if (getElement("averageAmount")) {

        getElement("averageAmount")
            .textContent =
            formatNaira(averageAmount);
    }

    if (getElement("totalLocations")) {

        getElement("totalLocations")
            .textContent = locations;
    }
}


/* =========================================================
   REGISTER / UPDATE MEMBER
========================================================= */

const saveMemberButton =
    getElement("saveMemberButton");

if (saveMemberButton) {

    saveMemberButton.addEventListener(
        "click",
        registerMember
    );
}


async function registerMember() {

    const memberId =
        getElement("memberId")?.value.trim();

    const fullName =
        getElement("fullName")?.value.trim();

    const phone =
        getElement("phone")?.value.trim();

    const email =
        getElement("email")?.value.trim();

    const location =
        getElement("location")?.value.trim();

    const amountValue =
        getElement("amount")?.value.trim();

    const purpose =
        getElement("purpose")?.value.trim();

    const message =
        getElement("memberMessage");

    if (message) {
        message.textContent = "";
        message.className = "message";
    }

    /* ---------- VALIDATION ---------- */

    if (!fullName) {

        showMemberMessage(
            "Please enter the full name.",
            "error"
        );

        return;
    }

    if (!phone) {

        showMemberMessage(
            "Please enter the phone number.",
            "error"
        );

        return;
    }

    if (phone.length < 7) {

        showMemberMessage(
            "Please enter a valid phone number.",
            "error"
        );

        return;
    }

    if (!location) {

        showMemberMessage(
            "Please enter the location.",
            "error"
        );

        return;
    }

    if (email) {

        const emailPattern =
            /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

        if (!emailPattern.test(email)) {

            showMemberMessage(
                "Please enter a valid email address.",
                "error"
            );

            return;
        }
    }

    const amount =
        Number(amountValue || 0);

    if (
        amountValue !== "" &&
        (!Number.isFinite(amount) || amount < 0)
    ) {

        showMemberMessage(
            "Please enter a valid contribution amount.",
            "error"
        );

        return;
    }

    const memberData = {

        full_name: fullName,

        phone: phone,

        email: email || null,

        location: location,

        amount: amount,

        purpose: purpose || null
    };

    try {

        saveMemberButton.disabled = true;

        saveMemberButton.textContent =
            memberId
                ? "Updating..."
                : "Saving...";

        if (memberId) {

            const result =
                await supabaseClient
                    .from("idogwu_members")
                    .update(memberData)
                    .eq("id", memberId);

            if (result.error) {
                throw result.error;
            }

            showMemberMessage(
                "Family member updated successfully.",
                "success"
            );

        } else {

            const result =
                await supabaseClient
                    .from("idogwu_members")
                    .insert([
                        memberData
                    ]);

            if (result.error) {
                throw result.error;
            }

            showMemberMessage(
                "Family member registered successfully.",
                "success"
            );
        }

        clearMemberForm();

        await loadMembers();

    } catch (error) {

        console.error(
            "Save member error:",
            error
        );

        showMemberMessage(
            error.message ||
            "Unable to save family member.",
            "error"
        );

    } finally {

        saveMemberButton.disabled = false;

        saveMemberButton.textContent =
            getElement("memberId")?.value
                ? "Update Member"
                : "Save Member";
    }
}


/* =========================================================
   MEMBER MESSAGE
========================================================= */

function showMemberMessage(
    message,
    type
) {

    const element =
        getElement("memberMessage");

    if (!element) {
        return;
    }

    element.textContent = message;

    element.className =
        "message " +
        (type || "");
}


/* =========================================================
   EDIT MEMBER
========================================================= */

window.editMember =
    function (memberId) {

        const member =
            members.find(
                function (item) {
                    return String(item.id) ===
                        String(memberId);
                }
            );

        if (!member) {

            alert(
                "Family member could not be found."
            );

            return;
        }

        getElement("memberId").value =
            member.id;

        getElement("fullName").value =
            member.full_name || "";

        getElement("phone").value =
            member.phone || "";

        getElement("email").value =
            member.email || "";

        getElement("location").value =
            member.location || "";

        getElement("amount").value =
            member.amount || "";

        getElement("purpose").value =
            member.purpose || "";

        if (getElement("formTitle")) {

            getElement("formTitle")
                .textContent =
                "Edit Family Member";
        }

        if (getElement("saveMemberButton")) {

            getElement("saveMemberButton")
                .textContent =
                "Update Member";
        }

        showMemberMessage(
            "You are editing this family member.",
            ""
        );

        window.scrollTo({
            top: 0,
            behavior: "smooth"
        });
    };


/* =========================================================
   DELETE MEMBER
========================================================= */

window.deleteMember =
    async function (memberId) {

        const member =
            members.find(
                function (item) {
                    return String(item.id) ===
                        String(memberId);
                }
            );

        if (!member) {

            alert(
                "Family member could not be found."
            );

            return;
        }

        const confirmed =
            window.confirm(
                "Are you sure you want to delete " +
                (member.full_name || "this member") +
                "?"
            );

        if (!confirmed) {
            return;
        }

        try {

            const result =
                await supabaseClient
                    .from("idogwu_members")
                    .delete()
                    .eq("id", memberId);

            if (result.error) {
                throw result.error;
            }

            await loadMembers();

            alert(
                "Family member deleted successfully."
            );

        } catch (error) {

            console.error(
                "Delete member error:",
                error
            );

            alert(
                error.message ||
                "Unable to delete family member."
            );
        }
    };


/* =========================================================
   CLEAR MEMBER FORM
========================================================= */

const clearFormButton =
    getElement("clearFormButton");

if (clearFormButton) {

    clearFormButton.addEventListener(
        "click",
        clearMemberForm
    );
}


function clearMemberForm() {

    if (getElement("memberId")) {
        getElement("memberId").value = "";
    }

    if (getElement("fullName")) {
        getElement("fullName").value = "";
    }

    if (getElement("phone")) {
        getElement("phone").value = "";
    }

    if (getElement("email")) {
        getElement("email").value = "";
    }

    if (getElement("location")) {
        getElement("location").value = "";
    }

    if (getElement("amount")) {
        getElement("amount").value = "";
    }

    if (getElement("purpose")) {
        getElement("purpose").value = "";
    }

    if (getElement("formTitle")) {

        getElement("formTitle")
            .textContent =
            "Register Family Member";
    }

    if (getElement("saveMemberButton")) {

        getElement("saveMemberButton")
            .textContent =
            "Save Member";

        getElement("saveMemberButton")
            .disabled = false;
    }

    if (getElement("memberMessage")) {

        getElement("memberMessage")
            .textContent = "";

        getElement("memberMessage")
            .className = "message";
    }
}


/* =========================================================
   SEARCH MEMBERS
========================================================= */

const searchInput =
    getElement("searchInput");

if (searchInput) {

    searchInput.addEventListener(
        "input",
        function () {

            const search =
                searchInput.value
                    .trim()
                    .toLowerCase();

            if (!search) {

                filteredMembers =
                    [...members];

            } else {

                filteredMembers =
                    members.filter(
                        function (member) {

                            const text =
                                [
                                    member.full_name,
                                    member.phone,
                                    member.email,
                                    member.location,
                                    member.purpose
                                ]
                                    .filter(Boolean)
                                    .join(" ")
                                    .toLowerCase();

                            return text.includes(
                                search
                            );
                        }
                    );
            }

            displayMembers(
                filteredMembers
            );
        }
    );
}


/* =========================================================
   REFRESH MEMBERS
========================================================= */

const refreshButton =
    getElement("refreshButton");

if (refreshButton) {

    refreshButton.addEventListener(
        "click",
        async function () {

            refreshButton.disabled = true;

            try {

                await loadMembers();

            } finally {

                refreshButton.disabled = false;
            }
        }
    );
}


/* =========================================================
   EXPORT CSV
========================================================= */

const exportButton =
    getElement("exportButton");

if (exportButton) {

    exportButton.addEventListener(
        "click",
        exportCSV
    );
}


function exportCSV() {

    if (!filteredMembers.length) {

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
        "Created At"
    ];

    const rows =
        filteredMembers.map(
            function (member, index) {

                return [

                    index + 1,

                    member.full_name || "",

                    member.phone || "",

                    member.email || "",

                    member.location || "",

                    Number(
                        member.amount || 0
                    ).toFixed(2),

                    member.purpose || "",

                    formatDate(
                        member.created_at
                    )
                ];
            }
        );

    const csvRows = [
        headers,
        ...rows
    ];

    const csv =
        csvRows
            .map(
                function (row) {

                    return row
                        .map(
                            function (value) {

                                return '"' +
                                    String(value)
                                        .replace(
                                            /"/g,
                                            '""'
                                        ) +
                                    '"';
                            }
                        )
                        .join(",");
                }
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
        URL.createObjectURL(blob);

    const link =
        document.createElement("a");

    link.href = url;

    link.download =
        "idogwu_family_members.csv";

    document.body.appendChild(link);

    link.click();

    document.body.removeChild(link);

    URL.revokeObjectURL(url);
}


/* =========================================================
   MODAL OUTSIDE CLICK
========================================================= */

window.addEventListener(
    "click",
    function (event) {

        const forgotBox =
            getElement("forgotPasswordBox");

        if (
            forgotBox &&
            event.target === forgotBox
        ) {

            forgotBox.style.display =
                "none";
        }

        const resetBox =
            getElement("passwordResetBox");

        if (
            resetBox &&
            event.target === resetBox
        ) {

            resetBox.style.display =
                "none";
        }
    }
);


/* =========================================================
   START APPLICATION
========================================================= */

checkAdminSession();
