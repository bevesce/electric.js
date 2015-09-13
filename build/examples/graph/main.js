// mouseXY
// var g = {"vertices":[{"id":0,"name":"| mouseXY >","receivers":[1],"emitters":[],"type":"emitter"},{"id":1,"name":"< map(pointToText) >","receivers":[2],"emitters":[0],"type":"transformator"},{"id":2,"name":"< htmlReceiver |","receivers":[],"emitters":[1],"type":"receiver"}],"edges":[{"source":0,"target":1},{"source":1,"target":2}]}
// todomvc
// var g = {"vertices":[{"id":0,"name":"< tasks >","receivers":[10,19,22,25,27],"emitters":[1,2,5,6,7,8,9],"type":"transformator"},{"id":1,"name":"| constant([object Object],[object Object],[object Object],[object Object],[object Object],[object Object]) >","receivers":[0],"emitters":[],"type":"emitter"},{"id":2,"name":"< not empty >","receivers":[0],"emitters":[3],"type":"transformator"},{"id":3,"name":"| text entered into new-task >","receivers":[2,4],"emitters":[],"type":"emitter"},{"id":4,"name":"< clearInput |","receivers":[],"emitters":[3],"type":"receiver"},{"id":5,"name":"| check >","receivers":[0],"emitters":[],"type":"emitter"},{"id":6,"name":"| checbox toggle >","receivers":[0],"emitters":[],"type":"emitter"},{"id":7,"name":"| retitle >","receivers":[0],"emitters":[],"type":"emitter"},{"id":8,"name":"| delete >","receivers":[0],"emitters":[],"type":"emitter"},{"id":9,"name":"| click on clear-button >","receivers":[0],"emitters":[],"type":"emitter"},{"id":10,"name":"< visible >","receivers":[13,17],"emitters":[0,11],"type":"transformator"},{"id":11,"name":"| window.location.hash >","receivers":[10,12],"emitters":[],"type":"emitter"},{"id":12,"name":"< activeFilterSelection |","receivers":[],"emitters":[11],"type":"receiver"},{"id":13,"name":"< changes >","receivers":[14],"emitters":[10],"type":"transformator"},{"id":14,"name":"< id of edited item >","receivers":[17],"emitters":[15,16,13],"type":"transformator"},{"id":15,"name":"| constant(undefined) >","receivers":[14],"emitters":[],"type":"emitter"},{"id":16,"name":"| editing start >","receivers":[14],"emitters":[],"type":"emitter"},{"id":17,"name":"< map(=>) >","receivers":[18],"emitters":[10,14],"type":"transformator"},{"id":18,"name":"< tasksRenderingReceiver |","receivers":[],"emitters":[17],"type":"receiver"},{"id":19,"name":"< count of all tasks >","receivers":[20,21],"emitters":[0],"type":"transformator"},{"id":20,"name":"< listHide |","receivers":[],"emitters":[19],"type":"receiver"},{"id":21,"name":"< map(=>) >","receivers":[24],"emitters":[19,22],"type":"transformator"},{"id":22,"name":"< count of completed tasks >","receivers":[21,23],"emitters":[0],"type":"transformator"},{"id":23,"name":"< clearCompletedButtonVisiblity |","receivers":[],"emitters":[22],"type":"receiver"},{"id":24,"name":"< toggleCheckboxChecked |","receivers":[],"emitters":[21],"type":"receiver"},{"id":25,"name":"< count of active tasks >","receivers":[26],"emitters":[0],"type":"transformator"},{"id":26,"name":"< itemsLeftCounter |","receivers":[],"emitters":[25],"type":"receiver"},{"id":27,"name":"< saveTaskToStorage |","receivers":[],"emitters":[0],"type":"receiver"}],"edges":[{"source":1,"target":0},{"source":2,"target":0},{"source":5,"target":0},{"source":6,"target":0},{"source":7,"target":0},{"source":8,"target":0},{"source":9,"target":0},{"source":3,"target":2},{"source":3,"target":4},{"source":0,"target":10},{"source":11,"target":10},{"source":11,"target":12},{"source":10,"target":13},{"source":15,"target":14},{"source":16,"target":14},{"source":13,"target":14},{"source":10,"target":17},{"source":14,"target":17},{"source":17,"target":18},{"source":0,"target":19},{"source":19,"target":20},{"source":19,"target":21},{"source":22,"target":21},{"source":0,"target":22},{"source":22,"target":23},{"source":21,"target":24},{"source":0,"target":25},{"source":25,"target":26},{"source":0,"target":27}]};
// todomvc rr

// var g = {"vertices":[{"id":0,"name":"< request state >","receivers":[5,7],"emitters":[1,2,3],"type":"transformator"},{"id":1,"name":"| manual >","receivers":[0],"emitters":[],"type":"emitter"},{"id":2,"name":"| state change of POST: http://localhost:8081 >","receivers":[0],"emitters":[],"type":"emitter"},{"id":3,"name":"< skip(1) >","receivers":[0],"emitters":[4],"type":"transformator"},{"id":4,"name":"< changes >","receivers":[3],"emitters":[],"type":"transformator"},{"id":5,"name":"< changes >","receivers":[6],"emitters":[0],"type":"transformator"},{"id":6,"name":"< should sync tasks >","receivers":[],"emitters":[5],"type":"transformator"},{"id":7,"name":"< anonymous |","receivers":[],"emitters":[0],"type":"receiver"}],"edges":[{"source":1,"target":0},{"source":2,"target":0},{"source":3,"target":0},{"source":4,"target":3},{"source":0,"target":5},{"source":5,"target":6},{"source":0,"target":7}]}


// var g = {"vertices":[{"id":0,"name":"< tasks >","receivers":[7,10,17,26,28],"emitters":[1,2,5,6,14,15,16],"type":"transformator"},{"id":1,"name":"| constant() >","receivers":[0],"emitters":[],"type":"emitter"},{"id":2,"name":"< not empty >","receivers":[0],"emitters":[3],"type":"transformator"},{"id":3,"name":"| text entered into new-task >","receivers":[2,4],"emitters":[],"type":"emitter"},{"id":4,"name":"< clearInput |","receivers":[],"emitters":[3],"type":"receiver"},{"id":5,"name":"| check >","receivers":[0],"emitters":[],"type":"emitter"},{"id":6,"name":"< toggleTo >","receivers":[0],"emitters":[7,10,13],"type":"transformator"},{"id":7,"name":"< count of all tasks >","receivers":[6,8,9],"emitters":[0],"type":"transformator"},{"id":8,"name":"< listHide |","receivers":[],"emitters":[7],"type":"receiver"},{"id":9,"name":"< map(=>) >","receivers":[12],"emitters":[7,10],"type":"transformator"},{"id":10,"name":"< count of completed tasks >","receivers":[6,9,11],"emitters":[0],"type":"transformator"},{"id":11,"name":"< clearCompletedButtonVisiblity |","receivers":[],"emitters":[10],"type":"receiver"},{"id":12,"name":"< toggleCheckboxChecked |","receivers":[],"emitters":[9],"type":"receiver"},{"id":13,"name":"| checbox toggle >","receivers":[6],"emitters":[],"type":"emitter"},{"id":14,"name":"| retitle >","receivers":[0],"emitters":[],"type":"emitter"},{"id":15,"name":"| delete >","receivers":[0],"emitters":[],"type":"emitter"},{"id":16,"name":"| click on clear-button >","receivers":[0],"emitters":[],"type":"emitter"},{"id":17,"name":"< visible >","receivers":[20,24],"emitters":[0,18],"type":"transformator"},{"id":18,"name":"| window.location.hash >","receivers":[17,19],"emitters":[],"type":"emitter"},{"id":19,"name":"< activeFilterSelection |","receivers":[],"emitters":[18],"type":"receiver"},{"id":20,"name":"< changes >","receivers":[21],"emitters":[17],"type":"transformator"},{"id":21,"name":"< changeToWhen >","receivers":[24],"emitters":[22,23,20],"type":"transformator"},{"id":22,"name":"| constant(undefined) >","receivers":[21],"emitters":[],"type":"emitter"},{"id":23,"name":"| editing start >","receivers":[21],"emitters":[],"type":"emitter"},{"id":24,"name":"< map(=>) >","receivers":[25],"emitters":[17,21],"type":"transformator"},{"id":25,"name":"< tasksRenderingReceiver |","receivers":[],"emitters":[24],"type":"receiver"},{"id":26,"name":"< count of active tasks >","receivers":[27],"emitters":[0],"type":"transformator"},{"id":27,"name":"< itemsLeftCounter |","receivers":[],"emitters":[26],"type":"receiver"},{"id":28,"name":"< saveTaskToStorage |","receivers":[],"emitters":[0],"type":"receiver"}],"edges":[{"source":1,"target":0},{"source":2,"target":0},{"source":5,"target":0},{"source":6,"target":0},{"source":14,"target":0},{"source":15,"target":0},{"source":16,"target":0},{"source":3,"target":2},{"source":3,"target":4},{"source":7,"target":6},{"source":10,"target":6},{"source":13,"target":6},{"source":0,"target":7},{"source":7,"target":8},{"source":7,"target":9},{"source":10,"target":9},{"source":0,"target":10},{"source":10,"target":11},{"source":9,"target":12},{"source":0,"target":17},{"source":18,"target":17},{"source":18,"target":19},{"source":17,"target":20},{"source":22,"target":21},{"source":23,"target":21},{"source":20,"target":21},{"source":17,"target":24},{"source":21,"target":24},{"source":24,"target":25},{"source":0,"target":26},{"source":26,"target":27},{"source":0,"target":28}]}
// todomvc - changes
// var g = {"vertices":[{"id":0,"name":"< tasks changes >","receivers":[12,19],"emitters":[1,5,13,7,39,41],"type":"transformator"},{"id":1,"name":"< map(=>) >","receivers":[0],"emitters":[2],"type":"transformator"},{"id":2,"name":"< not empty >","receivers":[1],"emitters":[3],"type":"transformator"},{"id":3,"name":"| text entered into new-task >","receivers":[2,4],"emitters":[],"type":"emitter"},{"id":4,"name":"< clearInput |","receivers":[],"emitters":[3],"type":"receiver"},{"id":5,"name":"< map(=>) >","receivers":[0],"emitters":[6],"type":"transformator"},{"id":6,"name":"| check >","receivers":[5],"emitters":[],"type":"emitter"},{"id":7,"name":"< map(=>) >","receivers":[0],"emitters":[8,12],"type":"transformator"},{"id":8,"name":"< toggleTo >","receivers":[7],"emitters":[9,10,11,29,33],"type":"transformator"},{"id":9,"name":"placeholder: < transformTime(=>) >","receivers":[8],"emitters":[],"type":"emitter"},{"id":10,"name":"placeholder: < transformTime(=>) >","receivers":[8],"emitters":[],"type":"emitter"},{"id":11,"name":"| checbox toggle >","receivers":[8],"emitters":[],"type":"emitter"},{"id":12,"name":"< tasks >","receivers":[7,13,15,18,28,32,36,38],"emitters":[0],"type":"transformator"},{"id":13,"name":"< map(=>) >","receivers":[0],"emitters":[14,12],"type":"transformator"},{"id":14,"name":"| click on clear-button >","receivers":[13],"emitters":[],"type":"emitter"},{"id":15,"name":"< map(=>) >","receivers":[20],"emitters":[12,16],"type":"transformator"},{"id":16,"name":"< changes >","receivers":[15],"emitters":[17],"type":"transformator"},{"id":17,"name":"| window.location.hash >","receivers":[16,18,27],"emitters":[],"type":"emitter"},{"id":18,"name":"< map(=>) >","receivers":[20],"emitters":[19,17,12],"type":"transformator"},{"id":19,"name":"< transformTime(=>) >","receivers":[18],"emitters":[0],"type":"transformator"},{"id":20,"name":"< visible changes >","receivers":[21,23,22],"emitters":[18,15],"type":"transformator"},{"id":21,"name":"< visible tasks >","receivers":[22],"emitters":[20],"type":"transformator"},{"id":22,"name":"< map(=>) >","receivers":[26],"emitters":[21,23,20],"type":"transformator"},{"id":23,"name":"< id of edited task >","receivers":[22],"emitters":[24,25,20],"type":"transformator"},{"id":24,"name":"| constant(undefined) >","receivers":[23],"emitters":[],"type":"emitter"},{"id":25,"name":"| editing start >","receivers":[23],"emitters":[],"type":"emitter"},{"id":26,"name":"< renderChanges |","receivers":[],"emitters":[22],"type":"receiver"},{"id":27,"name":"< activeFilterSelection |","receivers":[],"emitters":[17],"type":"receiver"},{"id":28,"name":"< map(=>) >","receivers":[29,30,31],"emitters":[12],"type":"transformator"},{"id":29,"name":"< transformTime(=>) >","receivers":[8],"emitters":[28],"type":"transformator"},{"id":30,"name":"< listHide |","receivers":[],"emitters":[28],"type":"receiver"},{"id":31,"name":"< map(=>) >","receivers":[35],"emitters":[28,32],"type":"transformator"},{"id":32,"name":"< map(=>) >","receivers":[33,31,34],"emitters":[12],"type":"transformator"},{"id":33,"name":"< transformTime(=>) >","receivers":[8],"emitters":[32],"type":"transformator"},{"id":34,"name":"< clearCompletedButtonVisibility |","receivers":[],"emitters":[32],"type":"receiver"},{"id":35,"name":"< toggleCheckboxChecked |","receivers":[],"emitters":[31],"type":"receiver"},{"id":36,"name":"< map(=>) >","receivers":[37],"emitters":[12],"type":"transformator"},{"id":37,"name":"< tasksLeftCounter |","receivers":[],"emitters":[36],"type":"receiver"},{"id":38,"name":"< tasksReceiver |","receivers":[],"emitters":[12],"type":"receiver"},{"id":39,"name":"< map(=>) >","receivers":[0],"emitters":[40],"type":"transformator"},{"id":40,"name":"| retitle >","receivers":[39],"emitters":[],"type":"emitter"},{"id":41,"name":"< map(=>) >","receivers":[0],"emitters":[42],"type":"transformator"},{"id":42,"name":"| delete >","receivers":[41],"emitters":[],"type":"emitter"}],"edges":[{"source":1,"target":0},{"source":5,"target":0},{"source":13,"target":0},{"source":7,"target":0},{"source":39,"target":0},{"source":41,"target":0},{"source":2,"target":1},{"source":3,"target":2},{"source":3,"target":4},{"source":6,"target":5},{"source":8,"target":7},{"source":12,"target":7},{"source":9,"target":8},{"source":10,"target":8},{"source":11,"target":8},{"source":29,"target":8},{"source":33,"target":8},{"source":0,"target":12},{"source":14,"target":13},{"source":12,"target":13},{"source":12,"target":15},{"source":16,"target":15},{"source":17,"target":16},{"source":19,"target":18},{"source":17,"target":18},{"source":12,"target":18},{"source":0,"target":19},{"source":18,"target":20},{"source":15,"target":20},{"source":20,"target":21},{"source":21,"target":22},{"source":23,"target":22},{"source":20,"target":22},{"source":24,"target":23},{"source":25,"target":23},{"source":20,"target":23},{"source":22,"target":26},{"source":17,"target":27},{"source":12,"target":28},{"source":28,"target":29},{"source":28,"target":30},{"source":28,"target":31},{"source":32,"target":31},{"source":12,"target":32},{"source":32,"target":33},{"source":32,"target":34},{"source":31,"target":35},{"source":12,"target":36},{"source":36,"target":37},{"source":12,"target":38},{"source":40,"target":39},{"source":42,"target":41}]}
// spacedt

// var g = {"vertices":[{"id":0,"name":"< ship acceleration >","receivers":[15],"emitters":[1,2,3,4,5,6,7,8],"type":"transformator"},{"id":1,"name":"| constant([object Object]) >","receivers":[0],"emitters":[],"type":"emitter"},{"id":2,"name":"| key -a- down >","receivers":[0],"emitters":[],"type":"emitter"},{"id":3,"name":"| key -d- down >","receivers":[0],"emitters":[],"type":"emitter"},{"id":4,"name":"| key -w- down >","receivers":[0],"emitters":[],"type":"emitter"},{"id":5,"name":"| key -s- down >","receivers":[0],"emitters":[],"type":"emitter"},{"id":6,"name":"| key -w- up >","receivers":[0],"emitters":[],"type":"emitter"},{"id":7,"name":"| key -s- up >","receivers":[0],"emitters":[],"type":"emitter"},{"id":8,"name":"< merge >","receivers":[0,11],"emitters":[9,10],"type":"transformator"},{"id":9,"name":"| key -a- up >","receivers":[8],"emitters":[],"type":"emitter"},{"id":10,"name":"| key -d- up >","receivers":[8],"emitters":[],"type":"emitter"},{"id":11,"name":"< transformTime(=>) >","receivers":[12],"emitters":[8],"type":"transformator"},{"id":12,"name":"< ship velocity >","receivers":[16,20,27],"emitters":[13,11],"type":"transformator"},{"id":13,"name":"< integral >","receivers":[12],"emitters":[14],"type":"transformator"},{"id":14,"name":"< internal integral accumulator >","receivers":[13],"emitters":[15],"type":"transformator"},{"id":15,"name":"< calculus timer >","receivers":[14],"emitters":[0],"type":"transformator"},{"id":16,"name":"< calculus timer >","receivers":[18],"emitters":[17,12],"type":"transformator"},{"id":17,"name":"| time(fps: 60) >","receivers":[16],"emitters":[],"type":"emitter"},{"id":18,"name":"< internal integral accumulator >","receivers":[19],"emitters":[16],"type":"transformator"},{"id":19,"name":"< ship position >","receivers":[20],"emitters":[18],"type":"transformator"},{"id":20,"name":"< map(=>) >","receivers":[22],"emitters":[21,19,12],"type":"transformator"},{"id":21,"name":"| key -space- up >","receivers":[20],"emitters":[],"type":"emitter"},{"id":22,"name":"< bullets >","receivers":[26],"emitters":[23,20,24,25],"type":"transformator"},{"id":23,"name":"| constant() >","receivers":[22],"emitters":[],"type":"emitter"},{"id":24,"name":"< bullet-mother colission >","receivers":[22],"emitters":[],"type":"transformator"},{"id":25,"name":"< bullet collisions >","receivers":[22],"emitters":[],"type":"transformator"},{"id":26,"name":"< map(=>) >","receivers":[],"emitters":[22],"type":"transformator"},{"id":27,"name":"< speedometer |","receivers":[],"emitters":[12],"type":"receiver"}],"edges":[{"source":1,"target":0},{"source":2,"target":0},{"source":3,"target":0},{"source":4,"target":0},{"source":5,"target":0},{"source":6,"target":0},{"source":7,"target":0},{"source":8,"target":0},{"source":9,"target":8},{"source":10,"target":8},{"source":8,"target":11},{"source":13,"target":12},{"source":11,"target":12},{"source":14,"target":13},{"source":15,"target":14},{"source":0,"target":15},{"source":17,"target":16},{"source":12,"target":16},{"source":16,"target":18},{"source":18,"target":19},{"source":21,"target":20},{"source":19,"target":20},{"source":12,"target":20},{"source":23,"target":22},{"source":20,"target":22},{"source":24,"target":22},{"source":25,"target":22},{"source":22,"target":26},{"source":12,"target":27}]}



var g = {"vertices":[{"id":0,"name":"< space state >","receivers":[68],"emitters":[58,1],"type":"transformator"},{"id":1,"name":"< objects positions >","receivers":[0],"emitters":[40,35,65,28,2],"type":"transformator"},{"id":2,"name":"< ship position >","receivers":[23,30,55,57,1],"emitters":[3],"type":"transformator"},{"id":3,"name":"< internal integral accumulator >","receivers":[2],"emitters":[4],"type":"transformator"},{"id":4,"name":"< calculus timer >","receivers":[3],"emitters":[5,6],"type":"transformator"},{"id":5,"name":"| time(fps: 60) >","receivers":[4],"emitters":[],"type":"emitter"},{"id":6,"name":"< ship velocity >","receivers":[4,23,67],"emitters":[22,7],"type":"transformator"},{"id":7,"name":"< integral >","receivers":[6],"emitters":[8],"type":"transformator"},{"id":8,"name":"< internal integral accumulator >","receivers":[7],"emitters":[9],"type":"transformator"},{"id":9,"name":"< calculus timer >","receivers":[8],"emitters":[10,11],"type":"transformator"},{"id":10,"name":"| time(fps: 60) >","receivers":[9],"emitters":[],"type":"emitter"},{"id":11,"name":"< ship acceleration >","receivers":[9],"emitters":[12,13,14,15,16,17,18,19],"type":"transformator"},{"id":12,"name":"| constant([object Object]) >","receivers":[11],"emitters":[],"type":"emitter"},{"id":13,"name":"| key -a- down >","receivers":[11],"emitters":[],"type":"emitter"},{"id":14,"name":"| key -d- down >","receivers":[11],"emitters":[],"type":"emitter"},{"id":15,"name":"| key -w- down >","receivers":[11],"emitters":[],"type":"emitter"},{"id":16,"name":"| key -s- down >","receivers":[11],"emitters":[],"type":"emitter"},{"id":17,"name":"| key -w- up >","receivers":[11],"emitters":[],"type":"emitter"},{"id":18,"name":"| key -s- up >","receivers":[11],"emitters":[],"type":"emitter"},{"id":19,"name":"< merge >","receivers":[11,22],"emitters":[20,21],"type":"transformator"},{"id":20,"name":"| key -a- up >","receivers":[19],"emitters":[],"type":"emitter"},{"id":21,"name":"| key -d- up >","receivers":[19],"emitters":[],"type":"emitter"},{"id":22,"name":"< transformTime(=>) >","receivers":[6],"emitters":[19],"type":"transformator"},{"id":23,"name":"< shot >","receivers":[25],"emitters":[24,2,6],"type":"transformator"},{"id":24,"name":"| key -space- up >","receivers":[23],"emitters":[],"type":"emitter"},{"id":25,"name":"< bullets >","receivers":[29],"emitters":[26,23,49,27],"type":"transformator"},{"id":26,"name":"| constant() >","receivers":[25],"emitters":[],"type":"emitter"},{"id":27,"name":"< bullet-bullet collisions >","receivers":[32,25],"emitters":[28],"type":"transformator"},{"id":28,"name":"< bullets positions >","receivers":[27,30,34,47,1],"emitters":[29],"type":"transformator"},{"id":29,"name":"< map(=>) >","receivers":[28],"emitters":[25],"type":"transformator"},{"id":30,"name":"< map(=>) >","receivers":[31],"emitters":[28,2],"type":"transformator"},{"id":31,"name":"< bullet-ship collisions >","receivers":[53,32],"emitters":[30],"type":"transformator"},{"id":32,"name":"< all collisions >","receivers":[64,65],"emitters":[27,48,54,56,33,31],"type":"transformator"},{"id":33,"name":"< bullet-asteroid collisions >","receivers":[49,50,37,32],"emitters":[34],"type":"transformator"},{"id":34,"name":"< map(=>) >","receivers":[33],"emitters":[28,35],"type":"transformator"},{"id":35,"name":"< asteroids positions >","receivers":[57,34,1],"emitters":[36],"type":"transformator"},{"id":36,"name":"< map(=>) >","receivers":[35],"emitters":[37],"type":"transformator"},{"id":37,"name":"< asteroids >","receivers":[36],"emitters":[38,39,33],"type":"transformator"},{"id":38,"name":"| constant() >","receivers":[37],"emitters":[],"type":"emitter"},{"id":39,"name":"< map(=>) >","receivers":[37],"emitters":[40,63],"type":"transformator"},{"id":40,"name":"< asteroid mother position >","receivers":[39,47,55,1],"emitters":[41],"type":"transformator"},{"id":41,"name":"< internal integral accumulator >","receivers":[40],"emitters":[42],"type":"transformator"},{"id":42,"name":"< calculus timer >","receivers":[41],"emitters":[43,44],"type":"transformator"},{"id":43,"name":"| time(fps: 60) >","receivers":[42],"emitters":[],"type":"emitter"},{"id":44,"name":"< asteroid mother velocity >","receivers":[42],"emitters":[45,46],"type":"transformator"},{"id":45,"name":"| constant([object Object]) >","receivers":[44],"emitters":[],"type":"emitter"},{"id":46,"name":"| intervalOfRandom(-1-1, interval: 2000ms) >","receivers":[44],"emitters":[],"type":"emitter"},{"id":47,"name":"< map(=>) >","receivers":[48],"emitters":[28,40],"type":"transformator"},{"id":48,"name":"< bullet-mother collisions >","receivers":[32,49,50],"emitters":[47],"type":"transformator"},{"id":49,"name":"< bullet collisions >","receivers":[25],"emitters":[48,33],"type":"transformator"},{"id":50,"name":"< changeToWhen >","receivers":[52],"emitters":[51,33,48],"type":"transformator"},{"id":51,"name":"| constant(0) >","receivers":[50],"emitters":[],"type":"emitter"},{"id":52,"name":"< score >","receivers":[62],"emitters":[50,53],"type":"transformator"},{"id":53,"name":"< game ending collisions >","receivers":[52,58],"emitters":[54,56,31],"type":"transformator"},{"id":54,"name":"< ship-mother collisions >","receivers":[32,53],"emitters":[55],"type":"transformator"},{"id":55,"name":"< map(=>) >","receivers":[54],"emitters":[2,40],"type":"transformator"},{"id":56,"name":"< ship-asteroi collisions >","receivers":[32,53],"emitters":[57],"type":"transformator"},{"id":57,"name":"< map(=>) >","receivers":[56],"emitters":[2,35],"type":"transformator"},{"id":58,"name":"< game over >","receivers":[0,59],"emitters":[53],"type":"transformator"},{"id":59,"name":"< changeToWhen >","receivers":[61],"emitters":[60,58],"type":"transformator"},{"id":60,"name":"| constant(NotHappend) >","receivers":[59],"emitters":[],"type":"emitter"},{"id":61,"name":"< anonymous |","receivers":[],"emitters":[59],"type":"receiver"},{"id":62,"name":"< htmlReceiver |","receivers":[],"emitters":[52],"type":"receiver"},{"id":63,"name":"| intervalOfRandom(-3.141592653589793-3.141592653589793, interval: 2000ms) >","receivers":[39],"emitters":[],"type":"emitter"},{"id":64,"name":"< transformTime(=>) >","receivers":[65],"emitters":[32],"type":"transformator"},{"id":65,"name":"< visible collisions >","receivers":[1],"emitters":[66,32,64],"type":"transformator"},{"id":66,"name":"| constant() >","receivers":[65],"emitters":[],"type":"emitter"},{"id":67,"name":"< speedometer |","receivers":[],"emitters":[6],"type":"receiver"},{"id":68,"name":"< renderOnCanvas |","receivers":[],"emitters":[0],"type":"receiver"}],"edges":[{"source":58,"target":0},{"source":1,"target":0},{"source":40,"target":1},{"source":35,"target":1},{"source":65,"target":1},{"source":28,"target":1},{"source":2,"target":1},{"source":3,"target":2},{"source":4,"target":3},{"source":5,"target":4},{"source":6,"target":4},{"source":22,"target":6},{"source":7,"target":6},{"source":8,"target":7},{"source":9,"target":8},{"source":10,"target":9},{"source":11,"target":9},{"source":12,"target":11},{"source":13,"target":11},{"source":14,"target":11},{"source":15,"target":11},{"source":16,"target":11},{"source":17,"target":11},{"source":18,"target":11},{"source":19,"target":11},{"source":20,"target":19},{"source":21,"target":19},{"source":19,"target":22},{"source":24,"target":23},{"source":2,"target":23},{"source":6,"target":23},{"source":26,"target":25},{"source":23,"target":25},{"source":49,"target":25},{"source":27,"target":25},{"source":28,"target":27},{"source":29,"target":28},{"source":25,"target":29},{"source":28,"target":30},{"source":2,"target":30},{"source":30,"target":31},{"source":27,"target":32},{"source":48,"target":32},{"source":54,"target":32},{"source":56,"target":32},{"source":33,"target":32},{"source":31,"target":32},{"source":34,"target":33},{"source":28,"target":34},{"source":35,"target":34},{"source":36,"target":35},{"source":37,"target":36},{"source":38,"target":37},{"source":39,"target":37},{"source":33,"target":37},{"source":40,"target":39},{"source":63,"target":39},{"source":41,"target":40},{"source":42,"target":41},{"source":43,"target":42},{"source":44,"target":42},{"source":45,"target":44},{"source":46,"target":44},{"source":28,"target":47},{"source":40,"target":47},{"source":47,"target":48},{"source":48,"target":49},{"source":33,"target":49},{"source":51,"target":50},{"source":33,"target":50},{"source":48,"target":50},{"source":50,"target":52},{"source":53,"target":52},{"source":54,"target":53},{"source":56,"target":53},{"source":31,"target":53},{"source":55,"target":54},{"source":2,"target":55},{"source":40,"target":55},{"source":57,"target":56},{"source":2,"target":57},{"source":35,"target":57},{"source":53,"target":58},{"source":60,"target":59},{"source":58,"target":59},{"source":59,"target":61},{"source":52,"target":62},{"source":32,"target":64},{"source":66,"target":65},{"source":32,"target":65},{"source":64,"target":65},{"source":6,"target":67},{"source":0,"target":68}]}





// var vs = [

// ];
// vs.sort(compareNumbers)
// console.log(vs);

// for (var i = 0; i < vs.length; i++) {
//     var v = vs[i];
//     g = removeVertex(v, g);
// }

// // g = addId(g);



var nodes = g.vertices;
var links = g.edges;

var width = window.innerWidth * 5;
var height = window.innerHeight * 5;

var force = d3.layout.force()
    .nodes(d3.values(nodes))
    .links(links)
    .size([width, height])
    .linkDistance(10)
    .charge(-1500)
    .on("tick", tick)
    .start();

var svg = d3.select("body").append("svg")
    .attr("width", width)
    .attr("height", height);

// Per-type markers, as they don't inherit styles.
svg.append("defs").selectAll("marker")
    .data(["arrow"])
    .enter().append("marker")
    .attr("id", function(d) { return d; })
    .attr("viewBox", "0 -10 20 20")
    .attr("refX", 30)
    .attr("refY", -1.5)
    .attr("markerWidth", 12)
    .attr("markerHeight", 12)
    .attr("orient", "auto")
    .attr("fill", "silver")
    .append("path")
    .attr("d", "M0,-10L20,0L0,10");

var path = svg.append("g").selectAll("path")
    .data(force.links())
    .enter().append("path")
    .attr("class", function(d) { return "link " + d.type; })
    .attr("marker-end", function(d) { return "url(#" + 'arrow' + ")"; });

var drag = force.drag()
    .on("dragend", dragended);

function dragended(d) {
    d.fixed = true;
}



var circle = svg.append("g").selectAll("circle")
    .data(force.nodes())
    .enter().append("circle")
    .attr("class", function(d) { return d.type })
    .attr("r", 10)
    .call(drag);


var text = svg.append("g").selectAll("text")
    .data(force.nodes())
    .enter().append("text")
    .attr("x", 8)
    .attr("y", ".31em")
    .text(function(d) { return d.name; });

function tick() {
    path.attr("d", linkArc);
    circle.attr("transform", transform);
    text.attr("transform", transform);
}

function linkArc(d) {
  var dx = d.target.x - d.source.x,
      dy = d.target.y - d.source.y,
      dr = 0 // Math.sqrt(dx * dx + dy * dy);
  return "M" + d.source.x + "," + d.source.y + "A" + dr + "," + dr + " 0 0,1 " + d.target.x + "," + d.target.y;
}

function transform(d) {
    return "translate(" + d.x + "," + d.y + ")";
}


function compareNumbers(a, b) {
  return b - a;
}


function addId(g) {
    var ng = {};
    ng.vertices = g.vertices.map(function(v) { return {
        id: v.id,
        name: v.id + ' : ' + v.name,
        receivers: v.receivers,
        emitters: v.emitters,
        type: v.type
    }})
    ng.edges = g.edges;
    return ng;
}


function removeVertex(id, g) {
    var ng = {};
    ng.vertices = g.vertices
        .filter(function(v) {
            return v.id !== id
        })
        .map(function(v) { return {
            id: v.id < id ? v.id : v.id - 1,
            name: v.name,
            receivers: v.receivers.filter(function (r) { return r !== id }),
            emitters: v.emitters.filter(function (r) { return r !== id }),
            type: v.type
        }});
    ng.edges = g.edges
        .filter(function(e) {
            return e.source !== id && e.target !== id
        })
        .map(function(e) {
            var s = e.source;
            var t = e.target;
            if (e.source > id) {
                s--;
            }
            if (e.target > id) {
                t--;
            }
            return { source: s, target: t }
        });
    return ng;
}