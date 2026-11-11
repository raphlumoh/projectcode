
// ==========================================
// EMPLOYEE DATABASE MANAGEMENT SYSTEM
// ==========================================

// ==========================================
// 1. INITIAL EMPLOYEE RECORDS
// ==========================================

let employees = [
    {
        id: 1,
        firstName: "Raphael",
        lastName: "Ogaba",
        imageUrl: "",
        email: "raphael@gmail.com",
        contactNumber: "08012345678",
        salary: 150000,
        address: "Abuja, Nigeria",
        dob: "1990-05-15"
    },
    {
        id: 2,
        firstName: "John",
        lastName: "Okafor",
        imageUrl: "",
        email: "john@gmail.com",
        contactNumber: "08098765432",
        salary: 200000,
        address: "Lagos, Nigeria",
        dob: "1988-08-20"
    }
];


// ==========================================
// 2. MAIN APPLICATION
// ==========================================

(function () {

    // ======================================
    // 3. SAVE EMPLOYEES TO LOCAL STORAGE
    // ======================================

    function saveEmployees() {
        localStorage.setItem(
            "employees",
            JSON.stringify(employees)
        );
    }


    // ======================================
    // 4. LOAD SAVED EMPLOYEE RECORDS
    // ======================================

    const savedEmployees = localStorage.getItem("employees");

    if (savedEmployees) {

        try {
            employees = JSON.parse(savedEmployees);

            // Ensure saved data is an array
            if (!Array.isArray(employees)) {
                throw new Error("Invalid employee data.");
            }

        } catch (error) {

            console.error("Error reading saved employees:", error);

            localStorage.removeItem("employees");

            // Restore original employee records
            saveEmployees();
        }

    } else {

        // Save initial records on first visit
        saveEmployees();

    }


    // ======================================
    // 5. SELECT HTML ELEMENTS
    // ======================================

    const employeeList = document.querySelector(
        ".employees__names--list"
    );

    const employeeInfo = document.querySelector(
        ".employees__single--info"
    );

    const createEmployee = document.querySelector(
        ".createEmployee"
    );

    const addEmployeeModal = document.querySelector(
        ".addEmployee"
    );

    const addEmployeeForm = document.querySelector(
        ".addEmployee_create"
    );

    const dobInput = document.querySelector(
        ".addEmployee_create--dob"
    );

    const closeModal = document.querySelector(
        ".closeModal"
    );

    const employeeSearch = document.querySelector(
    "#employeeSearch"
    );

// EMPLOYEE PHOTO PREVIEW
const employeePhoto = document.getElementById("employeePhoto");
const photoPreview = document.getElementById("photoPreview");

if (employeePhoto && photoPreview) {

    employeePhoto.addEventListener("change", function () {

        const file = this.files[0];

        if (file) {

            photoPreview.src = URL.createObjectURL(file);

            photoPreview.style.display = "block";

        }

    });

}
    // Check that required HTML elements exist
    if (
        !employeeList ||
        !employeeInfo ||
        !createEmployee ||
        !addEmployeeModal ||
        !addEmployeeForm ||
        !dobInput ||
        !closeModal
    ) {
        console.error(
            "One or more required HTML elements were not found."
        );

        return;
    }


    // ======================================
    // 6. SELECTED EMPLOYEE
    // ======================================

    let selectedEmployeeId = employees.length
        ? employees[0].id
        : null;


    // ======================================
    // 7. CALCULATE EMPLOYEE AGE
    // ======================================

    function calculateAge(dob) {

        if (!dob) return 0;

        const birthDate = new Date(dob + "T00:00:00");

        if (isNaN(birthDate.getTime())) return 0;

        const today = new Date();

        let age =
            today.getFullYear() - birthDate.getFullYear();

        const monthDifference =
            today.getMonth() - birthDate.getMonth();

        if (
            monthDifference < 0 ||
            (
                monthDifference === 0 &&
                today.getDate() < birthDate.getDate()
            )
        ) {
            age--;
        }

        return age;
    }


    // ======================================
    // 8. SET DATE OF BIRTH LIMIT
    // MINIMUM AGE: 18 YEARS
    // ======================================

    const today = new Date();

    const maxDate = new Date(
        today.getFullYear() - 18,
        today.getMonth(),
        today.getDate()
    );

    dobInput.max = [
        maxDate.getFullYear(),
        String(maxDate.getMonth() + 1).padStart(2, "0"),
        String(maxDate.getDate()).padStart(2, "0")
    ].join("-");


    // ======================================
    // 9. OPEN ADD EMPLOYEE FORM
    // ======================================

    createEmployee.addEventListener("click", () => {

        addEmployeeModal.style.display = "flex";

    });


    // ======================================
    // 10. CLOSE ADD EMPLOYEE FORM
    // ======================================

    closeModal.addEventListener("click", () => {

        addEmployeeModal.style.display = "none";

    });


    // Close when clicking outside the form

    addEmployeeModal.addEventListener("click", (e) => {

        if (e.target === addEmployeeModal) {

            addEmployeeModal.style.display = "none";

        }

    });


    // ======================================
    // 11. ADD NEW EMPLOYEE
    // ======================================

    addEmployeeForm.addEventListener("submit", async (e) => {

        e.preventDefault();

        // Collect form information
        const formData = new FormData(addEmployeeForm);

        const empData = Object.fromEntries(
            formData.entries()
        );


        // Calculate employee age
        empData.age = calculateAge(empData.dob);


        // Validate minimum age
        if (empData.age < 18) {

            alert("Employee must be at least 18 years old.");

            return;

        }


        // Generate unique employee ID
        empData.id = Math.max(
            1000,
            ...employees.map(emp => Number(emp.id) || 0)
        ) + 1;


        // Convert salary to number
        empData.salary = Number(empData.salary);


        // Default employee image
      
// SAVE EMPLOYEE PHOTOGRAPH

const photoFile = employeePhoto.files[0];

if (photoFile) {

    // Check image format
    if (!photoFile.type.startsWith("image/")) {
        alert("Please select a valid image.");
        return;
    }

    // Limit photograph size to 1MB
    if (photoFile.size > 1024 * 1024) {
        alert("Photograph must not exceed 1MB.");
        return;
    }

    // Convert photograph to Base64
    empData.imageUrl = await new Promise((resolve, reject) => {

        const reader = new FileReader();

        reader.onload = () => resolve(reader.result);

        reader.onerror = () => reject(reader.error);

        reader.readAsDataURL(photoFile);

    });

} else {

    // Use default photograph
    empData.imageUrl = "gfg.png";

}

        // Add employee to array
        employees.push(empData);


        // Select the newly added employee
        selectedEmployeeId = empData.id;


        // Save employee information
        saveEmployees();


        // Update employee display
        renderEmployees();

        renderSingleEmployee();


        // Reset form
        addEmployeeForm.reset();


        // Close registration form
        addEmployeeModal.style.display = "none";


        alert("Employee registered successfully!");

    });


    // ======================================
    // 12. DISPLAY ALL EMPLOYEES
    // ======================================

   
function renderEmployees(searchText = "") {

    employeeList.innerHTML = "";

    // Search by first name or last name
    const filteredEmployees = employees.filter(emp => {

        const fullName =
            `${emp.firstName} ${emp.lastName}`.toLowerCase();

        return fullName.includes(searchText.trim().toLowerCase());

    });

    // Check if employee database is empty
    if (employees.length === 0) {

        employeeList.textContent = "No employees available.";

        employeeInfo.innerHTML = `
            <p class="emptyMessage">
                No employee selected.
            </p>
        `;

        return;
    }

    // Check if search has no matching result
    if (filteredEmployees.length === 0) {

        employeeList.textContent = "No matching employee found.";

        return;
    }

    // Display matching employees
    filteredEmployees.forEach((emp) => {

        const employee = document.createElement("span");

        employee.classList.add("employees__names--item");

        employee.dataset.id = emp.id;

        if (String(selectedEmployeeId) === String(emp.id)) {
            employee.classList.add("selected");
        }

        const name = document.createElement("span");

        name.textContent =
            `${emp.firstName} ${emp.lastName}`;

        const deleteButton = document.createElement("i");

        deleteButton.classList.add("employeeDelete");

        deleteButton.textContent = "✖";

        deleteButton.title = "Delete employee";

        employee.append(name, deleteButton);

        employeeList.append(employee);

    });

}

        // ======================================
        // SEARCH EMPLOYEES
        // ======================================

        employeeSearch.addEventListener("input", () => {

            renderEmployees(employeeSearch.value);

        });


    // ======================================
    // 13. SELECT AND DELETE EMPLOYEES
    // ======================================

    employeeList.addEventListener("click", (e) => {

        const employee = e.target.closest(
            ".employees__names--item"
        );

        if (!employee) return;

        const employeeId = Number(employee.dataset.id);


        // DELETE EMPLOYEE
        if (e.target.closest(".employeeDelete")) {

            const confirmDelete = confirm(
                "Are you sure you want to delete this employee?"
            );

            if (!confirmDelete) return;


            // Remove employee from array
            employees = employees.filter(
                emp => Number(emp.id) !== employeeId
            );


            // If deleted employee was selected
            if (employeeId === Number(selectedEmployeeId)) {

                selectedEmployeeId = employees.length
                    ? employees[0].id
                    : null;

            }


            // Save changes
            saveEmployees();


            // Refresh display
            renderEmployees();

            renderSingleEmployee();

            return;

        }


        // SELECT EMPLOYEE
        selectedEmployeeId = employeeId;

        renderEmployees();

        renderSingleEmployee();

    });


    // ======================================
    // 14. DISPLAY SINGLE EMPLOYEE DETAILS
    // ======================================

    function renderSingleEmployee() {

        employeeInfo.innerHTML = "";


        // Check if no employee is selected
        const selectedEmployee = employees.find(
            emp => Number(emp.id) === Number(selectedEmployeeId)
        );


        if (!selectedEmployee) {

            employeeInfo.innerHTML = `
                <p class="emptyMessage">
                    No employee selected.
                </p>
            `;

            return;

        }


        // Employee image
        const image = document.createElement("img");

        image.src = selectedEmployee.imageUrl || "gfg.png";

        image.alt = "Employee photograph";

        image.onerror = function () {

            this.onerror = null;

            this.src = "gfg.png";

        };


        // Employee heading
        const heading = document.createElement("span");

        heading.classList.add(
            "employees__single--heading"
        );

        heading.textContent =
            `${selectedEmployee.firstName} ${selectedEmployee.lastName}`;


        // Calculate age for display
        const employeeAge = calculateAge(selectedEmployee.dob);


        // Employee information
        const details = [

            `Employee ID: ${selectedEmployee.id}`,

            `Age: ${employeeAge} years`,

            `Email: ${selectedEmployee.email || "Not provided"}`,

            `Mobile: ${selectedEmployee.contactNumber || "Not provided"}`,

            `Address: ${selectedEmployee.address || "Not provided"}`,

            `Date of Birth: ${formatDate(selectedEmployee.dob)}`,

            `Monthly Salary: ₦${Number(selectedEmployee.salary || 0).toLocaleString("en-NG")}`

        ];


        // Display employee information
        employeeInfo.append(image, heading);


        details.forEach((detail) => {

            const span = document.createElement("span");

            span.classList.add("employeeDetail");

            span.textContent = detail;

            employeeInfo.append(span);

        });

    }


    // ======================================
    // 15. FORMAT DATE
    // ======================================

    function formatDate(date) {

        if (!date) return "Not provided";

        const dob = new Date(date + "T00:00:00");

        if (isNaN(dob.getTime())) return "Invalid date";

        return dob.toLocaleDateString("en-GB", {

            day: "2-digit",

            month: "long",

            year: "numeric"

        });

    }


    // ======================================
    // 16. INITIAL DISPLAY
    // ======================================

    renderEmployees();

    renderSingleEmployee();


})();
