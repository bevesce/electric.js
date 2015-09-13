var item = require('./item');
var TASK_KEY = 'todos-electric';
function restoreTasks() {
    var s = localStorage.getItem(TASK_KEY);
    if (s) {
        return JSON.parse(s).map(item.restore);
    }
    return [];
}
exports.restoreTasks = restoreTasks;
function saveTaskToStorage(tasks) {
    localStorage.setItem(TASK_KEY, JSON.stringify(tasks));
}
exports.saveTaskToStorage = saveTaskToStorage;
