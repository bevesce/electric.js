function counter(tasks) {
    var tasksCounter = tasks.map(function (ts) { return ts.length; });
    var tasksWord = tasksCounter.map(function (c) { return c === 1 ? 'item' : 'items'; });
    return {
        count: tasksCounter,
        word: tasksWord
    };
}
module.exports = counter;
