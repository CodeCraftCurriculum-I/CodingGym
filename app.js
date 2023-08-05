
const TASK_COLLECTIONS = {
    "b1": "tasks/boolean1.json",
    "b2": "tasks/boolean2.json",
    "b3": "tasks/boolean3.json",
    "b4": "tasks/boolean4.json",
    "b5": "tasks/boolean5.json",
    "b6": "tasks/boolean6.json",
    "b7": "tasks/boolean7.json",
    "b8": "tasks/boolean8.json",
}


let progress = 0;
let taskSet = [];
const crc32Table = Array.from({ length: 256 }, (_, i) => {
    let crcCell = i;
    for (let j = 8; j > 0; --j) {
        if ((crcCell & 1) === 1)
            crcCell = (crcCell >>> 1) ^ 0xEDB88320;
        else
            crcCell = (crcCell >>> 1);
    }
    return crcCell >>> 0;
});
let _ = {};
let themeToggle = document.querySelector('#theme-toggle');
let infoCardButton = document.querySelector('#intro button');
let userIDinputt = document.querySelector('#userID');

function updateProgress(progress) {
    if (progress < 0) progress = 0;
    if (progress > 100) progress = 100;
    let progressBar = document.querySelector('.progress-bar span');
    progressBar.style.width = progress + '%';
}

function toggleTheme() {
    let currentTheme = document.body.getAttribute('data-theme');
    if (currentTheme === 'light') {
        document.body.setAttribute('data-theme', 'dark');
        themeToggle.textContent = 'Light';
    } else {
        document.body.setAttribute('data-theme', 'light');
        themeToggle.textContent = 'Dark';
    }
}

function setInfoCard(description) {
    let infoCard = document.querySelector('#intro p');
    infoCard.innerHTML = description;
}

function createTaskSet(tasks) {
    let take = tasks.length >= 10 ? Math.round(tasks.length * 0.5) : tasks.length;
    let taskSet = new Set();
    _["tk"] = `${take}|${tasks.length}}`;
    while (taskSet.size < take) {
        let index = Math.floor(Math.random() * tasks.length);
        taskSet.add(tasks[index]);
    }
    return Array.from(taskSet);
}

function displayCards(cardIds) {
    let cards = document.querySelectorAll('.card');
    cards.forEach(card => {
        if (cardIds.includes(card.id) || card.id === 'progress-card') {
            card.style.display = 'block';
        } else {
            card.style.display = 'none';
        }
    });
}

function crc32(object) {
    let jsonString = JSON.stringify(object);
    let crcValue = 0 ^ (-1);

    for (let i = 0; i < jsonString.length; i++) {
        crcValue = (crcValue >>> 8) ^ crc32Table[
            (crcValue ^ jsonString.charCodeAt(i)) & 0xFF
        ];
    }

    return (crcValue ^ (-1)) >>> 0;
}

async function loadTask(tasks) {
    let params = new URLSearchParams(window.location.search);
    let task = params.get('task');
    let url = tasks[task];
    let response = await fetch(url);
    if (response.ok) {
        let data = await response.json();
        _["t"] = task;
        _["crc"] = crc32(_);
        return data;
    } else {
        throw new Error('HTTP error ' + response.status);
    }
}

function showTask(task) {
    displayCards(["task"]);

    document.getElementById("answer").value = "";

    let description = document.querySelector('#task > p');
    description.innerHTML = task.description;
    _[`p${progress}`] = 0
    _[`t${progress}`] = Date.now();
    _["crc"] = crc32(_);
    let code = document.querySelector('#task > code');
    code.innerHTML = `(${task.variables}) => your code`

}

function validateUserID() {
    let warningMessage = document.getElementById('warning-message');
    let introCard = document.getElementById('intro');
    let valid = false;

    let emailPattern = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;

    if (userIDinputt.value.trim() === '' || !emailPattern.test(userIDinputt.value.trim())) {
        userIDinputt.style.borderColor = 'red';
        warningMessage.textContent = 'User ID cannot be blank';
        warningMessage.style.color = 'red';
        introCard.style.backgroundColor = '#ffe5e5';
    } else {
        userIDinputt.style.borderColor = '';
        warningMessage.textContent = '';
        introCard.style.backgroundColor = '';
        valid = true;
    }
    return valid;
}


themeToggle.addEventListener('click', toggleTheme);
infoCardButton.addEventListener('click', () => {
    if (validateUserID()) {
        showTask(taskSet[0])
    }
});

document.getElementById("answerbt").addEventListener('click', () => {
    let task = taskSet[progress];
    let answer = document.getElementById("answer").value;

    answer = answer.replace(/\s/g, '');

    task.solutions.forEach(solution => {
        if (answer === solution) {
            _[`p${progress}`]++;
            progress++;
            updateProgress(progress * 100 / taskSet.length);
            displayExplenation(task);
        } else {
            _[`p${progress}`]++;
        }
        _["crc"] = crc32(_);
    });
});

function displayExplenation(task) {
    displayCards(["explanation"]);
    let description = document.querySelector('#explanation > p');
    let code = document.querySelector('#explanation > code');
    description.innerHTML = task.info;
    code.innerHTML = task.solutions.join("<br>");
}

continuebt.addEventListener('click', () => {
    if (progress < taskSet.length) {
        showTask(taskSet[progress]);
    } else {
        _["c"] = new Date().toISOString();
        _["u"] = userIDinputt.value;
        _["e"] = Date.now();
        _["crc"] = crc32(_);
        document.querySelector('#complete > p').innerHTML = `You have completed the task set.<br> SUBMIT : ${btoa(JSON.stringify(_))}`;
        displayCards(["complete"]);
    }
});

updateProgress(0);
displayCards("intro");


loadTask(TASK_COLLECTIONS).then(data => {
    taskSet = createTaskSet(data.tasks);
    setInfoCard(data.description);
    updateProgress(data.progress);
}).catch(error => {
    console.log(error);
}).finally(() => {

});