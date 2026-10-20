
const express = require('express');
const cors = require('cors');

const app = express();
const PORT = 5000;

// ==================== НАСТРОЙКИ ====================

app.use(cors());
app.use(express.json());

// ==================== НАЧАЛЬНЫЕ ДАННЫЕ ====================

let courses = [
    {
        id: 'c1',
        code: 'CS101',
        title: 'Introduction to Computer Science',
        category: 'Computer Science',
        description: 'Основы компьютерных наук',
        credits: 5
    },
    {
        id: 'c2',
        code: 'CS302',
        title: 'Web Development',
        category: 'Computer Science',
        description: 'Разработка веб-приложений',
        credits: 4
    },
    {
        id: 'c3',
        code: 'MATH201',
        title: 'Mathematics',
        category: 'Mathematics',
        description: 'Высшая математика',
        credits: 3
    }
];

let students = [
    {
        id: 's1',
        firstName: 'Алина',
        lastName: 'Иванова',
        studentCard: 'ST001',
        groupId: 'ПИ-2-23'
    },
    {
        id: 's2',
        firstName: 'Бек',
        lastName: 'Осмонов',
        studentCard: 'ST002',
        groupId: 'ПИ-2-23'
    }
];

// ==================== ВСПОМОГАТЕЛЬНЫЕ ФУНКЦИИ ====================

function createId(prefix) {
    return `${prefix}${Date.now()}${Math.floor(Math.random() * 1000)}`;
}

function hasFields(object, fields) {
    return fields.every(field =>
        object[field] !== undefined &&
        object[field] !== null &&
        String(object[field]).trim() !== ''
    );
}

// ==================== МАРШРУТЫ КУРСОВ ====================

// GET: получить все курсы
// Поддерживает фильтры category и search
app.get('/api/v1/courses', (req, res) => {
    let result = [...courses];

    if (req.query.category) {
        result = result.filter(course =>
            course.category.toLowerCase() ===
            String(req.query.category).toLowerCase()
        );
    }

    if (req.query.search) {
        const search = String(req.query.search).toLowerCase();

        result = result.filter(course =>
            course.title.toLowerCase().includes(search) ||
            course.code.toLowerCase().includes(search) ||
            course.category.toLowerCase().includes(search)
        );
    }

    return res.status(200).json({
        success: true,
        count: result.length,
        data: result
    });
});

// GET: получить курс по ID
app.get('/api/v1/courses/:id', (req, res) => {
    const course = courses.find(
        item => item.id === req.params.id
    );

    if (!course) {
        return res.status(404).json({
            success: false,
            error: {
                code: 'COURSE_NOT_FOUND',
                message: 'Курс не найден'
            }
        });
    }

    return res.status(200).json({
        success: true,
        data: course
    });
});

// POST: создать курс
app.post('/api/v1/courses', (req, res) => {
    const { code, title, category, description, credits } = req.body;

    if (!hasFields(req.body, ['code', 'title', 'category'])) {
        return res.status(400).json({
            success: false,
            error: {
                code: 'VALIDATION_ERROR',
                message: 'Поля code, title и category обязательны'
            }
        });
    }

    const duplicate = courses.some(
        course => course.code.toLowerCase() ===
        String(code).trim().toLowerCase()
    );

    if (duplicate) {
        return res.status(400).json({
            success: false,
            error: {
                code: 'DUPLICATE_COURSE',
                message: 'Курс с таким кодом уже существует'
            }
        });
    }

    const newCourse = {
        id: createId('c'),
        code: String(code).trim(),
        title: String(title).trim(),
        category: String(category).trim(),
        description: description || '',
        credits: credits === undefined ? 0 : credits
    };

    courses.push(newCourse);

    return res.status(201).json({
        success: true,
        data: newCourse
    });
});

// PUT: обновить курс
app.put('/api/v1/courses/:id', (req, res) => {
    const index = courses.findIndex(
        course => course.id === req.params.id
    );

    if (index === -1) {
        return res.status(404).json({
            success: false,
            error: {
                code: 'COURSE_NOT_FOUND',
                message: 'Курс не найден'
            }
        });
    }

    const { code, title, category, description, credits } = req.body;

    if (!hasFields(req.body, ['code', 'title', 'category'])) {
        return res.status(400).json({
            success: false,
            error: {
                code: 'VALIDATION_ERROR',
                message: 'Поля code, title и category обязательны'
            }
        });
    }

    const duplicate = courses.some(
        (course, i) =>
            i !== index &&
            course.code.toLowerCase() ===
            String(code).trim().toLowerCase()
    );

    if (duplicate) {
        return res.status(400).json({
            success: false,
            error: {
                code: 'DUPLICATE_COURSE',
                message: 'Курс с таким кодом уже существует'
            }
        });
    }

    courses[index] = {
        ...courses[index],
        code: String(code).trim(),
        title: String(title).trim(),
        category: String(category).trim(),
        description: description || '',
        credits: credits === undefined ? 0 : credits
    };

    return res.status(200).json({
        success: true,
        data: courses[index]
    });
});

// DELETE: удалить курс
app.delete('/api/v1/courses/:id', (req, res) => {
    const index = courses.findIndex(
        course => course.id === req.params.id
    );

    if (index === -1) {
        return res.status(404).json({
            success: false,
            error: {
                code: 'COURSE_NOT_FOUND',
                message: 'Курс не найден'
            }
        });
    }

    courses.splice(index, 1);

    return res.status(204).send();
});

// ==================== МАРШРУТЫ СТУДЕНТОВ ====================

// GET: получить всех студентов
// Поддерживает фильтр groupId
app.get('/api/v1/students', (req, res) => {
    let result = [...students];

    if (req.query.groupId) {
        result = result.filter(student =>
            student.groupId.toLowerCase() ===
            String(req.query.groupId).toLowerCase()
        );
    }

    return res.status(200).json({
        success: true,
        count: result.length,
        data: result
    });
});

// GET: получить студента по ID
app.get('/api/v1/students/:id', (req, res) => {
    const student = students.find(
        item => item.id === req.params.id
    );

    if (!student) {
        return res.status(404).json({
            success: false,
            error: {
                code: 'STUDENT_NOT_FOUND',
                message: 'Студент не найден'
            }
        });
    }

    return res.status(200).json({
        success: true,
        data: student
    });
});

// POST: создать студента
app.post('/api/v1/students', (req, res) => {
    const { firstName, lastName, studentCard, groupId } = req.body;

    if (!hasFields(req.body, [
        'firstName',
        'lastName',
        'studentCard',
        'groupId'
    ])) {
        return res.status(400).json({
            success: false,
            error: {
                code: 'VALIDATION_ERROR',
                message: 'Все поля обязательны: firstName, lastName, studentCard, groupId'
            }
        });
    }

    const duplicate = students.some(
        student => student.studentCard.toLowerCase() ===
        String(studentCard).trim().toLowerCase()
    );

    if (duplicate) {
        return res.status(400).json({
            success: false,
            error: {
                code: 'DUPLICATE_STUDENT_CARD',
                message: 'Студент с таким номером билета уже существует'
            }
        });
    }

    const newStudent = {
        id: createId('s'),
        firstName: String(firstName).trim(),
        lastName: String(lastName).trim(),
        studentCard: String(studentCard).trim(),
        groupId: String(groupId).trim()
    };

    students.push(newStudent);

    return res.status(201).json({
        success: true,
        data: newStudent
    });
});

// PUT: обновить студента
app.put('/api/v1/students/:id', (req, res) => {
    const index = students.findIndex(
        student => student.id === req.params.id
    );

    if (index === -1) {
        return res.status(404).json({
            success: false,
            error: {
                code: 'STUDENT_NOT_FOUND',
                message: 'Студент не найден'
            }
        });
    }

    const { firstName, lastName, studentCard, groupId } = req.body;

    if (!hasFields(req.body, [
        'firstName',
        'lastName',
        'studentCard',
        'groupId'
    ])) {
        return res.status(400).json({
            success: false,
            error: {
                code: 'VALIDATION_ERROR',
                message: 'Все поля обязательны: firstName, lastName, studentCard, groupId'
            }
        });
    }

    const duplicate = students.some(
        (student, i) =>
            i !== index &&
            student.studentCard.toLowerCase() ===
            String(studentCard).trim().toLowerCase()
    );

    if (duplicate) {
        return res.status(400).json({
            success: false,
            error: {
                code: 'DUPLICATE_STUDENT_CARD',
                message: 'Студент с таким номером билета уже существует'
            }
        });
    }

    students[index] = {
        ...students[index],
        firstName: String(firstName).trim(),
        lastName: String(lastName).trim(),
        studentCard: String(studentCard).trim(),
        groupId: String(groupId).trim()
    };

    return res.status(200).json({
        success: true,
        data: students[index]
    });
});

 // DELETE: удалить студента
app.delete('/api/v1/students/:id', (req, res) => {
      console.log('DELETE route called:', req.params.id);

    const index = students.findIndex(
        student => student.id === req.params.id
    );

    if (index === -1) {
        return res.status(404).json({
            success: false,
            error: {
                code: 'STUDENT_NOT_FOUND',
                message: 'Студент не найден'
            }
        });
    }

    students.splice(index, 1);

    return res.status(204).send();
});
// ==================== ОБРАБОТКА НЕИЗВЕСТНЫХ МАРШРУТОВ ====================

app.use((req, res) => {
    return res.status(404).json({
        success: false,
        error: {
            code: 'NOT_FOUND',
            message: `Маршрут ${req.method} ${req.originalUrl} не найден`
        }
    });
});

// ==================== ЗАПУСК СЕРВЕРА ====================

app.listen(PORT, () => {
    console.log(`UIS API запущен на http://localhost:${PORT}`);
});


