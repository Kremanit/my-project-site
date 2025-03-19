function connectToSession() {
    const sessionId = document.getElementById('session-id').value;
    if (sessionId) {
        const iframe = document.createElement('iframe');
        iframe.src = `https://sharepad.io/live/${sessionId}`;
        document.getElementById('iframe-container').innerHTML = '';
        document.getElementById('iframe-container').appendChild(iframe);
    } else {
        alert('Пожалуйста, введите ID сессии.');
    }
}

function checkPassword() {
    const password = document.getElementById('password-input').value;
    if (password === MAIN_PASSWORD) {
        document.getElementById('password-overlay').style.display = 'none';
        localStorage.setItem('mainAccess', 'true');
    } else {
        alert('Неверный пароль!');
    }
}

function logout() {
    localStorage.removeItem('mainAccess');
    localStorage.removeItem('uploadAccess');
    document.getElementById('password-overlay').style.display = 'flex';
    document.getElementById('upload-section').style.display = 'none';
    document.getElementById('unlock-upload-btn').style.display = 'block';
}

function checkUploadPassword() {
    const uploadPassword = document.getElementById('upload-password-input').value;
    if (uploadPassword === UPLOAD_PASSWORD) {
        document.getElementById('upload-password-overlay').style.display = 'none';
        document.getElementById('upload-section').style.display = 'flex';
        document.getElementById('unlock-upload-btn').style.display = 'none';
        localStorage.setItem('uploadAccess', 'true');
    } else {
        alert('Неверный пароль для загрузки!');
    }
}

function showUploadPasswordPrompt() {
    document.getElementById('upload-password-overlay').style.display = 'flex';
}

let codeMirrorEditor;
let currentPath = '/';
let currentFileName = null;

document.addEventListener('DOMContentLoaded', () => {
    console.log('DOM загружен');
    codeMirrorEditor = CodeMirror.fromTextArea(document.getElementById('code-editor'), {
        mode: 'python',
        theme: 'dracula',
        lineNumbers: true,
        lineWrapping: true
    });
    window.updateEditor = function() {};

    if (localStorage.getItem('mainAccess') === 'true') {
        document.getElementById('password-overlay').style.display = 'none';
    }

    if (localStorage.getItem('uploadAccess') === 'true') {
        document.getElementById('upload-section').style.display = 'flex';
        document.getElementById('unlock-upload-btn').style.display = 'none';
    }

    refreshServerContent();
});

async function refreshServerContent() {
    try {
        const response = await fetch(`/api/list-folders.php?path=${encodeURIComponent(currentPath)}`);
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        const data = await response.json();
        console.log('Server response:', data);
        if (data.error) {
            throw new Error(data.error);
        }

        const serverList = document.getElementById('server-list');
        serverList.innerHTML = '';

        data.folders.sort((a, b) => a.localeCompare(b));
        data.files.sort((a, b) => a.localeCompare(b));

        data.folders.forEach(folder => {
            const li = document.createElement('li');
            li.textContent = folder + '/';
            li.className = 'folder';
            li.onclick = () => openFolder(folder);
            serverList.appendChild(li);
        });

        data.files.forEach(file => {
            const li = document.createElement('li');
            li.textContent = file;
            const deleteIcon = document.createElement('span');
            deleteIcon.className = 'delete-icon';
            deleteIcon.textContent = '🗑️';
            deleteIcon.onclick = (e) => {
                e.stopPropagation();
                deleteFile(file);
            };
            li.appendChild(deleteIcon);
            li.onclick = () => loadFileContent(file);
            serverList.appendChild(li);
        });

        document.getElementById('back-button').style.display = currentPath === '/' ? 'none' : 'inline-block';
    } catch (e) {
        console.error('Error in refreshServerContent:', e);
        document.getElementById('server-list').innerHTML = '<li>Ошибка загрузки списка файлов: ' + e.message + '</li>';
    }
}

function openFolder(folder) {
    currentPath = currentPath + (currentPath === '/' ? '' : '/') + folder;
    refreshServerContent();
}

function goBack() {
    currentPath = currentPath.split('/').slice(0, -1).join('/') || '/';
    refreshServerContent();
}

async function deleteFile(fileName) {
    try {
        const response = await fetch('/api/delete-file.php', {
            method: 'POST',
            headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
            body: `file=${encodeURIComponent(currentPath + '/' + fileName)}`
        });
        const result = await response.json();
        if (result.success) {
            alert(`Файл ${fileName} удалён из SFTP!`);
            refreshServerContent();
        } else {
            alert(`Ошибка при удалении файла: ${result.error}`);
        }
    } catch (e) {
        alert('Ошибка при удалении файла: ' + e.message);
        console.error('Ошибка удаления файла:', e);
    }
}

async function loadFileContent(fileName) {
    try {
        const response = await fetch(`/api/get-file.php?file=${encodeURIComponent(currentPath + '/' + fileName)}`);
        const result = await response.json();
        if (result.content) {
            codeMirrorEditor.setValue(result.content || '');
            if (fileName.endsWith('.py')) {
                codeMirrorEditor.setOption('mode', 'python');
            } else if (fileName.endsWith('.js')) {
                codeMirrorEditor.setOption('mode', 'javascript');
            } else {
                codeMirrorEditor.setOption('mode', null);
            }
            codeMirrorEditor.refresh();
            currentFileName = fileName;
        } else {
            alert(`Ошибка при загрузке файла: ${result.error}`);
        }
    } catch (e) {
        console.error('Ошибка при загрузке файла из SFTP:', e);
        alert('Ошибка при загрузке файла: ' + e.message);
    }
}

async function saveFile() {
    if (!currentFileName) {
        alert('Выберите файл для сохранения.');
        return;
    }
    const content = codeMirrorEditor.getValue();
    if (!content) {
        alert('Поле редактора пустое. Введите код перед сохранением.');
        return;
    }
    try {
        const response = await fetch('/api/save-file.php', {
            method: 'POST',
            headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
            body: `file=${encodeURIComponent(currentPath + '/' + currentFileName)}&content=${encodeURIComponent(content)}`
        });
        const result = await response.json();
        if (result.success) {
            alert('Файл сохранён!');
        } else {
            alert(`Ошибка при сохранении файла: ${result.error}`);
        }
    } catch (e) {
        alert('Ошибка сохранения файла: ' + e.message);
        console.error('Ошибка сохранения файла:', e);
    }
}

function clearEditor() {
    codeMirrorEditor.setValue('');
    currentFileName = null;
}

function toggleCreateFileInput() {
    const input = document.getElementById('new-file-name');
    const createBtn = document.getElementById('create-file-btn');
    if (input.style.display === 'none') {
        input.style.display = 'block';
        createBtn.style.display = 'inline-block';
    } else {
        input.style.display = 'none';
        createBtn.style.display = 'none';
    }
}

async function createNewFile() {
    const fileName = document.getElementById('new-file-name').value.trim();
    if (!fileName) {
        alert('Введите имя файла.');
        return;
    }
    if (!fileName.endsWith('.py') && !fileName.endsWith('.js') && !fileName.endsWith('.txt')) {
        alert('Имя файла должно заканчиваться на .py, .js или .txt.');
        return;
    }

    try {
        const response = await fetch('/api/create-file.php', {
            method: 'POST',
            headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
            body: `path=${encodeURIComponent(currentPath)}&filename=${encodeURIComponent(fileName)}`
        });
        const result = await response.json();
        if (result.success) {
            alert(`Файл ${fileName} создан!`);
            refreshServerContent();
        } else {
            alert(`Ошибка при создании файла: ${result.error}`);
        }
    } catch (e) {
        alert('Ошибка при создании файла: ' + e.message);
        console.error('Ошибка создания файла:', e);
    }
    toggleCreateFileInput();
    document.getElementById('new-file-name').value = '';
}

function toggleCreateFolderInput() {
    const input = document.getElementById('new-folder-name');
    const createBtn = document.getElementById('create-folder-btn');
    if (input.style.display === 'none') {
        input.style.display = 'block';
        createBtn.style.display = 'inline-block';
    } else {
        input.style.display = 'none';
        createBtn.style.display = 'none';
    }
}

async function createNewFolder() {
    const folderName = document.getElementById('new-folder-name').value.trim();
    if (!folderName) {
        alert('Введите имя папки.');
        return;
    }

    try {
        const response = await fetch('/api/create-folder.php', {
            method: 'POST',
            headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
            body: `path=${encodeURIComponent(currentPath)}&foldername=${encodeURIComponent(folderName)}`
        });
        const result = await response.json();
        if (result.success) {
            alert(`Папка ${folderName} создана!`);
            refreshServerContent();
        } else {
            alert(`Ошибка при создании папки: ${result.error}`);
        }
    } catch (e) {
        alert('Ошибка при создании папки: ' + e.message);
        console.error('Ошибка создания папки:', e);
    }
    toggleCreateFolderInput();
    document.getElementById('new-folder-name').value = '';
}

async function uploadFiles() {
    const fileInput = document.getElementById('file-upload');
    const files = fileInput.files;
    if (files.length === 0) {
        alert('Выберите файлы для загрузки.');
        return;
    }

    for (const file of files) {
        if (!file.name.endsWith('.py') && !file.name.endsWith('.js') && !file.name.endsWith('.txt')) {
            alert(`Недопустимый тип файла ${file.name}. Разрешены только .py, .js, .txt.`);
            continue;
        }

        const formData = new FormData();
        formData.append('file', file);
        formData.append('path', currentPath);

        try {
            const response = await fetch('/api/upload.php', {
                method: 'POST',
                body: formData
            });
            const result = await response.json();
            if (result.success) {
                console.log(`Файл ${file.name} загружен на SFTP-сервер`);
            } else {
                alert(`Ошибка при загрузке файла ${file.name}: ${result.error}`);
            }
        } catch (e) {
            alert(`Ошибка при загрузке файла ${file.name}: ${e.message}`);
            console.error('Ошибка загрузки:', e);
        }
    }
    fileInput.value = '';
    refreshServerContent();
}