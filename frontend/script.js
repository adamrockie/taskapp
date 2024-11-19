const apiUrl = 'http://localhost:3000';
let authToken = localStorage.getItem('token');

document.addEventListener('DOMContentLoaded', () => {
    if (!authToken) {
        window.location.href = 'login.html';
    } else {
        fetchTasks();
    }
});

document.getElementById('task-form').addEventListener('submit', async (e) => {
    e.preventDefault();
    const title = document.getElementById('title').value;
    const description = document.getElementById('description').value;
    const status = document.getElementById('status').value;

    await fetch(`${apiUrl}/tasks`, {
        method: 'POST',
        headers: { 
            'Content-Type': 'application/json',
            'Authorization': authToken 
        },
        body: JSON.stringify({ title, description, status })
    });
    fetchTasks();
});

async function fetchTasks(status = '') {
    const res = await fetch(`${apiUrl}/tasks`, {
        headers: { 'Authorization': authToken }
    });
    const tasks = await res.json();
    const filteredTasks = status ? tasks.filter(task => task.status === status) : tasks;
    document.getElementById('task-list').innerHTML = filteredTasks.map(task => `
        <li>
            ${task.title} - ${task.status}
            <button onclick="deleteTask(${task.id})">Delete</button>
        </li>
    `).join('');
}

async function deleteTask(id) {
    await fetch(`${apiUrl}/tasks/${id}`, {
        method: 'DELETE',
        headers: { 'Authorization': authToken }
    });
    fetchTasks();
}

function filterTasks(status) {
    fetchTasks(status);
}

function logout() {
    localStorage.removeItem('token');
    window.location.href = 'login.html';
}
