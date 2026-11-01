

const API_BASE_URL = "http://localhost:5000/api/v1";

const courseForm = document.getElementById("courseForm");
const courseCode = document.getElementById("courseCode");
const courseTitle = document.getElementById("courseTitle");
const courseCategory = document.getElementById("courseCategory");
const courseCredits = document.getElementById("courseCredits");
const courseDescription = document.getElementById("courseDescription");

const coursesTbody = document.getElementById("coursesTbody");
const formAlert = document.getElementById("formAlert");
const loadingSpinner = document.getElementById("loadingSpinner");
const btnSubmit = document.getElementById("btnSubmit");
const btnRefresh = document.getElementById("btnRefresh");
const searchInput = document.getElementById("searchInput");

let courses = [];

function showSpinner(show) {
    loadingSpinner.classList.toggle("hidden", !show);
    btnRefresh.disabled = show;
}

function showAlert(message, type = "success") {
    formAlert.textContent = message;
    formAlert.className = `alert alert-${type}`;
}

function escapeHtml(value) {
    return String(value ?? "").replace(/[&<>"']/g, char => ({
        "&": "&amp;",
        "<": "&lt;",
        ">": "&gt;",
        '"': "&quot;",
        "'": "&#39;"
    })[char]);
}

async function requestCourses(url, options = {}) {
    const response = await fetch(url, options);

    // DELETE возвращает статус 204 без тела ответа.
    if (response.status === 204) {
        return null;
    }

    const result = await response.json().catch(() => null);

    if (!response.ok) {
        const message =
            result?.error?.message ||
            result?.message ||
            `${response.status} ${response.statusText}`;

        throw new Error(message);
    }

    return result;
}

async function fetchAndRenderCourses() {
    showSpinner(true);

    try {
        const result = await requestCourses(`${API_BASE_URL}/courses`);

        if (!result || !Array.isArray(result.data)) {
            throw new Error("Сервер вернул данные в неожиданном формате.");
        }

        courses = result.data;
        renderCoursesTable();
    } catch (error) {
        showAlert(
            `Не удалось загрузить курсы: ${error.message}. Проверь, запущен ли сервер.`,
            "error"
        );
    } finally {
        showSpinner(false);
    }
}

function renderCoursesTable() {
    const query = searchInput.value.trim().toLowerCase();

    const filteredCourses = courses.filter(course => {
        const searchableText = [
            course.code,
            course.title,
            course.category
        ].join(" ").toLowerCase();

        return searchableText.includes(query);
    });

    coursesTbody.innerHTML = "";

    if (filteredCourses.length === 0) {
        coursesTbody.innerHTML = `
            <tr>
                <td colspan="5" class="empty-message">
                    Курсы не найдены
                </td>
            </tr>
        `;
        return;
    }

    filteredCourses.forEach(course => {
        const tr = document.createElement("tr");

        const id = course.id;
        const code = escapeHtml(course.code);
        const title = escapeHtml(course.title);
        const category = escapeHtml(course.category);
        const credits = escapeHtml(course.credits);

        tr.innerHTML = `
            <td><strong>${code}</strong></td>
            <td>${title}</td>
            <td>${category}</td>
            <td>${credits} ECTS</td>
            <td>
                <button
                    class="btn delete-btn"
                    type="button"
                    ${id == null ? "disabled" : ""}
                >
                    Удалить
                </button>
            </td>
        `;

        const deleteButton = tr.querySelector(".delete-btn");

        deleteButton.addEventListener("click", () => {
            if (id == null) {
                showAlert("У курса отсутствует идентификатор.", "error");
                return;
            }

            deleteCourse(id);
        });

        coursesTbody.appendChild(tr);
    });
}

courseForm.addEventListener("submit", async event => {
    event.preventDefault();

    const code = courseCode.value.trim().toUpperCase();
    const title = courseTitle.value.trim();
    const category = courseCategory.value;
    const credits = Number(courseCredits.value);
    const description = courseDescription.value.trim();

    if (!/^[A-ZА-ЯЁ]{2,3}\d{3}$/.test(code)) {
        showAlert(
            "Код должен содержать 2–3 буквы и 3 цифры, например CS101.",
            "error"
        );
        return;
    }

    if (!title || !category) {
        showAlert("Заполни название и выбери категорию курса.", "error");
        return;
    }

    if (
        !Number.isInteger(credits) ||
        credits < 1 ||
        credits > 15
    ) {
        showAlert("Количество кредитов должно быть от 1 до 15.", "error");
        return;
    }

    btnSubmit.disabled = true;

    try {
        await requestCourses(`${API_BASE_URL}/courses`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify({
                code,
                title,
                category,
                description,
                credits
            })
        });

        courseForm.reset();
        courseCredits.value = 5;

        await fetchAndRenderCourses();
        showAlert("Курс успешно добавлен!", "success");
    } catch (error) {
        showAlert(`Не удалось добавить курс: ${error.message}`, "error");
    } finally {
        btnSubmit.disabled = false;
    }
});

async function deleteCourse(courseId) {
    if (!confirm("Ты действительно хочешь удалить этот курс?")) {
        return;
    }

    try {
        await requestCourses(
            `${API_BASE_URL}/courses/${encodeURIComponent(courseId)}`,
            { method: "DELETE" }
        );

        courses = courses.filter(
            course => String(course.id) !== String(courseId)
        );

        renderCoursesTable();
        showAlert("Курс успешно удалён!", "success");
    } catch (error) {
        showAlert(`Не удалось удалить курс: ${error.message}`, "error");
    }
}

btnRefresh.addEventListener("click", fetchAndRenderCourses);
searchInput.addEventListener("input", renderCoursesTable);

fetchAndRenderCourses();

