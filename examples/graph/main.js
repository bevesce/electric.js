// var g = {"vertices":[{"id":0,"name":"< flattenMany =  >","receivers":[28,31,33,47,60],"emitters":[1],"type":"transformator"},{"id":1,"name":"< map(=>) =  >","receivers":[0],"emitters":[2],"type":"transformator"},{"id":2,"name":"< changeToWhen =  >","receivers":[1],"emitters":[3,31,49,4],"type":"transformator"},{"id":3,"name":"| constant() =  >","receivers":[2],"emitters":[],"type":"emitter"},{"id":4,"name":"< map(=>) = notHappened >","receivers":[2],"emitters":[5,10,6],"type":"transformator"},{"id":5,"name":"| | key space on up |> = notHappened >","receivers":[4],"emitters":[],"type":"emitter"},{"id":6,"name":"< integral = [object Object] >","receivers":[4,28,55,57,60],"emitters":[7],"type":"transformator"},{"id":7,"name":"< accumulate(=>) = [object Object] >","receivers":[6],"emitters":[8],"type":"transformator"},{"id":8,"name":"<  timedValue = [object Object] >","receivers":[7],"emitters":[9,10],"type":"transformator"},{"id":9,"name":"| time(fps: 60) = 1441632615062 >","receivers":[8],"emitters":[],"type":"emitter"},{"id":10,"name":"< changeToWhen = [object Object] >","receivers":[8,4,27],"emitters":[20,22,11],"type":"transformator"},{"id":11,"name":"< integral = [object Object] >","receivers":[10],"emitters":[12],"type":"transformator"},{"id":12,"name":"< accumulate(=>) = [object Object] >","receivers":[11],"emitters":[13],"type":"transformator"},{"id":13,"name":"<  timedValue = [object Object] >","receivers":[12],"emitters":[14,15],"type":"transformator"},{"id":14,"name":"| time(fps: 60) = 1441632615062 >","receivers":[13],"emitters":[],"type":"emitter"},{"id":15,"name":"< changeToWhen = [object Object] >","receivers":[13],"emitters":[16,17,18,19,21,23,24,25,26],"type":"transformator"},{"id":16,"name":"| constant([object Object]) = [object Object] >","receivers":[15],"emitters":[],"type":"emitter"},{"id":17,"name":"| | key a on down |> = notHappened >","receivers":[15],"emitters":[],"type":"emitter"},{"id":18,"name":"| | key d on down |> = notHappened >","receivers":[15],"emitters":[],"type":"emitter"},{"id":19,"name":"| | key d on up |> = notHappened >","receivers":[15,20],"emitters":[],"type":"emitter"},{"id":20,"name":"< transformTime(=>) = notHappened >","receivers":[10],"emitters":[19],"type":"transformator"},{"id":21,"name":"| | key a on up |> = notHappened >","receivers":[15,22],"emitters":[],"type":"emitter"},{"id":22,"name":"< transformTime(=>) = notHappened >","receivers":[10],"emitters":[21],"type":"transformator"},{"id":23,"name":"| | key s on down |> = notHappened >","receivers":[15],"emitters":[],"type":"emitter"},{"id":24,"name":"| | key w on down |> = notHappened >","receivers":[15],"emitters":[],"type":"emitter"},{"id":25,"name":"| | key w on up |> = notHappened >","receivers":[15],"emitters":[],"type":"emitter"},{"id":26,"name":"| | key s on up |> = notHappened >","receivers":[15],"emitters":[],"type":"emitter"},{"id":27,"name":"< anonymous |","receivers":[],"emitters":[10],"type":"receiver"},{"id":28,"name":"< map(=>) = [object Object] >","receivers":[29],"emitters":[0,6],"type":"transformator"},{"id":29,"name":"< whenThen = notHappened >","receivers":[53,30],"emitters":[28],"type":"transformator"},{"id":30,"name":"< merge = notHappened >","receivers":[61,63],"emitters":[31,48,54,56,32,29],"type":"transformator"},{"id":31,"name":"< whenThen = notHappened >","receivers":[30,2],"emitters":[0],"type":"transformator"},{"id":32,"name":"< whenThen = notHappened >","receivers":[49,50,36,30],"emitters":[33],"type":"transformator"},{"id":33,"name":"< map(=>) = [object Object] >","receivers":[32],"emitters":[0,34],"type":"transformator"},{"id":34,"name":"< flattenMany =  >","receivers":[57,60,33],"emitters":[35],"type":"transformator"},{"id":35,"name":"< map(=>) =  >","receivers":[34],"emitters":[36],"type":"transformator"},{"id":36,"name":"< changeToWhen =  >","receivers":[35],"emitters":[37,38,32],"type":"transformator"},{"id":37,"name":"| constant() =  >","receivers":[36],"emitters":[],"type":"emitter"},{"id":38,"name":"< map(=>) = notHappened >","receivers":[36],"emitters":[39,40],"type":"transformator"},{"id":39,"name":"| interval(interval: 2000ms) = notHappened >","receivers":[38],"emitters":[],"type":"emitter"},{"id":40,"name":"< integral = [object Object] >","receivers":[38,47,55,60],"emitters":[41],"type":"transformator"},{"id":41,"name":"< accumulate(=>) = [object Object] >","receivers":[40],"emitters":[42],"type":"transformator"},{"id":42,"name":"<  timedValue = [object Object] >","receivers":[41],"emitters":[43,44],"type":"transformator"},{"id":43,"name":"| time(fps: 60) = 1441632615063 >","receivers":[42],"emitters":[],"type":"emitter"},{"id":44,"name":"< changeToWhen = [object Object] >","receivers":[42],"emitters":[45,46],"type":"transformator"},{"id":45,"name":"| constant([object Object]) = [object Object] >","receivers":[44],"emitters":[],"type":"emitter"},{"id":46,"name":"| interval(interval: 2000ms) = notHappened >","receivers":[44],"emitters":[],"type":"emitter"},{"id":47,"name":"< map(=>) = [object Object] >","receivers":[48],"emitters":[0,40],"type":"transformator"},{"id":48,"name":"< whenThen = notHappened >","receivers":[30,49,50],"emitters":[47],"type":"transformator"},{"id":49,"name":"< merge = notHappened >","receivers":[2],"emitters":[48,32],"type":"transformator"},{"id":50,"name":"< changeToWhen >","receivers":[52],"emitters":[51,32,48],"type":"transformator"},{"id":51,"name":"| constant(0) >","receivers":[50],"emitters":[],"type":"emitter"},{"id":52,"name":"< changeToWhen >","receivers":[68],"emitters":[50,53],"type":"transformator"},{"id":53,"name":"< merge = notHappened >","receivers":[52,58],"emitters":[54,56,29],"type":"transformator"},{"id":54,"name":"< whenThen = notHappened >","receivers":[30,53],"emitters":[55],"type":"transformator"},{"id":55,"name":"< map(=>) = [object Object] >","receivers":[54],"emitters":[6,40],"type":"transformator"},{"id":56,"name":"< whenThen = notHappened >","receivers":[30,53],"emitters":[57],"type":"transformator"},{"id":57,"name":"< map(=>) = [object Object] >","receivers":[56],"emitters":[6,34],"type":"transformator"},{"id":58,"name":"< transformTime(=>) = notHappened >","receivers":[59,65],"emitters":[53],"type":"transformator"},{"id":59,"name":"< changeToWhen = [object Object] >","receivers":[64],"emitters":[60,58],"type":"transformator"},{"id":60,"name":"< map(=>) = [object Object] >","receivers":[59],"emitters":[6,0,40,34,61],"type":"transformator"},{"id":61,"name":"< changeToWhen =  >","receivers":[60],"emitters":[62,30,63],"type":"transformator"},{"id":62,"name":"| constant() =  >","receivers":[61],"emitters":[],"type":"emitter"},{"id":63,"name":"< transformTime(=>) = notHappened >","receivers":[61],"emitters":[30],"type":"transformator"},{"id":64,"name":"< anonymous |","receivers":[],"emitters":[59],"type":"receiver"},{"id":65,"name":"< changeToWhen = notHappened >","receivers":[67],"emitters":[66,58],"type":"transformator"},{"id":66,"name":"| constant(notHappened) = notHappened >","receivers":[65],"emitters":[],"type":"emitter"},{"id":67,"name":"< anonymous |","receivers":[],"emitters":[65],"type":"receiver"},{"id":68,"name":"< htmlReceiver |","receivers":[],"emitters":[52],"type":"receiver"}],"edges":[{"source":1,"target":0},{"source":2,"target":1},{"source":3,"target":2},{"source":31,"target":2},{"source":49,"target":2},{"source":4,"target":2},{"source":5,"target":4},{"source":10,"target":4},{"source":6,"target":4},{"source":7,"target":6},{"source":8,"target":7},{"source":9,"target":8},{"source":10,"target":8},{"source":20,"target":10},{"source":22,"target":10},{"source":11,"target":10},{"source":12,"target":11},{"source":13,"target":12},{"source":14,"target":13},{"source":15,"target":13},{"source":16,"target":15},{"source":17,"target":15},{"source":18,"target":15},{"source":19,"target":15},{"source":21,"target":15},{"source":23,"target":15},{"source":24,"target":15},{"source":25,"target":15},{"source":26,"target":15},{"source":19,"target":20},{"source":21,"target":22},{"source":10,"target":27},{"source":0,"target":28},{"source":6,"target":28},{"source":28,"target":29},{"source":31,"target":30},{"source":48,"target":30},{"source":54,"target":30},{"source":56,"target":30},{"source":32,"target":30},{"source":29,"target":30},{"source":0,"target":31},{"source":33,"target":32},{"source":0,"target":33},{"source":34,"target":33},{"source":35,"target":34},{"source":36,"target":35},{"source":37,"target":36},{"source":38,"target":36},{"source":32,"target":36},{"source":39,"target":38},{"source":40,"target":38},{"source":41,"target":40},{"source":42,"target":41},{"source":43,"target":42},{"source":44,"target":42},{"source":45,"target":44},{"source":46,"target":44},{"source":0,"target":47},{"source":40,"target":47},{"source":47,"target":48},{"source":48,"target":49},{"source":32,"target":49},{"source":51,"target":50},{"source":32,"target":50},{"source":48,"target":50},{"source":50,"target":52},{"source":53,"target":52},{"source":54,"target":53},{"source":56,"target":53},{"source":29,"target":53},{"source":55,"target":54},{"source":6,"target":55},{"source":40,"target":55},{"source":57,"target":56},{"source":6,"target":57},{"source":34,"target":57},{"source":53,"target":58},{"source":60,"target":59},{"source":58,"target":59},{"source":6,"target":60},{"source":0,"target":60},{"source":40,"target":60},{"source":34,"target":60},{"source":61,"target":60},{"source":62,"target":61},{"source":30,"target":61},{"source":63,"target":61},{"source":30,"target":63},{"source":59,"target":64},{"source":66,"target":65},{"source":58,"target":65},{"source":65,"target":67},{"source":52,"target":68}]}
// var g = {"vertices":[{"id":0,"name":"< flattenMany =  >","receivers":[3,5,8,11,14],"emitters":[1],"type":"transformator"},{"id":1,"name":"< map(=>) =  >","receivers":[0],"emitters":[2],"type":"transformator"},{"id":2,"name":"< changeToWhen =  >","receivers":[1],"emitters":[3],"type":"transformator"},{"id":3,"name":"< whenThen = notHappened >","receivers":[4,2],"emitters":[0],"type":"transformator"},{"id":4,"name":"< merge = notHappened >","receivers":[],"emitters":[3],"type":"transformator"},{"id":5,"name":"< map(=>) = [object Object] >","receivers":[7],"emitters":[0,6],"type":"transformator"},{"id":6,"name":"< integral = [object Object] >","receivers":[5,14],"emitters":[],"type":"transformator"},{"id":7,"name":"< whenThen = notHappened >","receivers":[],"emitters":[5],"type":"transformator"},{"id":8,"name":"< map(=>) = [object Object] >","receivers":[10],"emitters":[0,9],"type":"transformator"},{"id":9,"name":"< flattenMany =  >","receivers":[8,14],"emitters":[],"type":"transformator"},{"id":10,"name":"< whenThen = notHappened >","receivers":[],"emitters":[8],"type":"transformator"},{"id":11,"name":"< map(=>) = [object Object] >","receivers":[13],"emitters":[0,12],"type":"transformator"},{"id":12,"name":"< integral = [object Object] >","receivers":[11,14],"emitters":[],"type":"transformator"},{"id":13,"name":"< whenThen = notHappened >","receivers":[],"emitters":[11],"type":"transformator"},{"id":14,"name":"< map(=>) = [object Object] >","receivers":[16],"emitters":[6,0,12,9,15],"type":"transformator"},{"id":15,"name":"< changeToWhen =  >","receivers":[14],"emitters":[],"type":"transformator"},{"id":16,"name":"< changeToWhen = [object Object] >","receivers":[],"emitters":[14],"type":"transformator"}],"edges":[{"source":1,"target":0},{"source":2,"target":1},{"source":3,"target":2},{"source":0,"target":3},{"source":3,"target":4},{"source":0,"target":5},{"source":6,"target":5},{"source":5,"target":7},{"source":0,"target":8},{"source":9,"target":8},{"source":8,"target":10},{"source":0,"target":11},{"source":12,"target":11},{"source":11,"target":13},{"source":6,"target":14},{"source":0,"target":14},{"source":12,"target":14},{"source":9,"target":14},{"source":15,"target":14},{"source":14,"target":16}]}
// var g = {"vertices":[{"id":0,"name":"| | key w on down |> = notHappened >","receivers":[1],"emitters":[],"type":"emitter"},{"id":1,"name":"< changeToWhen = [object Object] >","receivers":[13],"emitters":[2,3,4,5,8,10,0,11,12],"type":"transformator"},{"id":2,"name":"| constant([object Object]) = [object Object] >","receivers":[1],"emitters":[],"type":"emitter"},{"id":3,"name":"| | key a on down |> = notHappened >","receivers":[1],"emitters":[],"type":"emitter"},{"id":4,"name":"| | key d on down |> = notHappened >","receivers":[1],"emitters":[],"type":"emitter"},{"id":5,"name":"| | key d on up |> = notHappened >","receivers":[1,6],"emitters":[],"type":"emitter"},{"id":6,"name":"< transformTime(=>) = notHappened >","receivers":[7],"emitters":[5],"type":"transformator"},{"id":7,"name":"< changeToWhen = [object Object] >","receivers":[],"emitters":[6,9],"type":"transformator"},{"id":8,"name":"| | key a on up |> = notHappened >","receivers":[1,9],"emitters":[],"type":"emitter"},{"id":9,"name":"< transformTime(=>) = notHappened >","receivers":[7],"emitters":[8],"type":"transformator"},{"id":10,"name":"| | key s on down |> = notHappened >","receivers":[1],"emitters":[],"type":"emitter"},{"id":11,"name":"| | key w on up |> = notHappened >","receivers":[1],"emitters":[],"type":"emitter"},{"id":12,"name":"| | key s on up |> = notHappened >","receivers":[1],"emitters":[],"type":"emitter"},{"id":13,"name":"<  timedValue = [object Object] >","receivers":[15],"emitters":[14,1],"type":"transformator"},{"id":14,"name":"| time(fps: 60) = 1441632882896 >","receivers":[13],"emitters":[],"type":"emitter"},{"id":15,"name":"< accumulate(=>) = [object Object] >","receivers":[16],"emitters":[13],"type":"transformator"},{"id":16,"name":"< integral = [object Object] >","receivers":[],"emitters":[15],"type":"transformator"}],"edges":[{"source":2,"target":1},{"source":3,"target":1},{"source":4,"target":1},{"source":5,"target":1},{"source":8,"target":1},{"source":10,"target":1},{"source":0,"target":1},{"source":11,"target":1},{"source":12,"target":1},{"source":5,"target":6},{"source":6,"target":7},{"source":9,"target":7},{"source":8,"target":9},{"source":14,"target":13},{"source":1,"target":13},{"source":13,"target":15},{"source":15,"target":16}]}
// var g = {"vertices":[{"id":0,"name":"| key \"w\" down = notHappened >","receivers":[1],"emitters":[],"type":"emitter"},{"id":1,"name":"< ship acceleration = [object Object] >","receivers":[13],"emitters":[2,3,4,5,8,10,0,11,12],"type":"transformator"},{"id":2,"name":"| constant([object Object]) = [object Object] >","receivers":[1],"emitters":[],"type":"emitter"},{"id":3,"name":"| key \"a\" down = notHappened >","receivers":[1],"emitters":[],"type":"emitter"},{"id":4,"name":"| key \"d\" down = notHappened >","receivers":[1],"emitters":[],"type":"emitter"},{"id":5,"name":"| key \"d\" up = notHappened >","receivers":[1,6],"emitters":[],"type":"emitter"},{"id":6,"name":"< transformTime(=>) = notHappened >","receivers":[7],"emitters":[5],"type":"transformator"},{"id":7,"name":"< ship velocity = [object Object] >","receivers":[],"emitters":[6,9],"type":"transformator"},{"id":8,"name":"| key \"a\" up = notHappened >","receivers":[1,9],"emitters":[],"type":"emitter"},{"id":9,"name":"< transformTime(=>) = notHappened >","receivers":[7],"emitters":[8],"type":"transformator"},{"id":10,"name":"| key \"s\" down = notHappened >","receivers":[1],"emitters":[],"type":"emitter"},{"id":11,"name":"| key \"w\" up = notHappened >","receivers":[1],"emitters":[],"type":"emitter"},{"id":12,"name":"| key \"s\" up = notHappened >","receivers":[1],"emitters":[],"type":"emitter"},{"id":13,"name":"<  timedValue = [object Object] >","receivers":[15],"emitters":[14,1],"type":"transformator"},{"id":14,"name":"| time(fps: 60) = 1441633122387 >","receivers":[13],"emitters":[],"type":"emitter"},{"id":15,"name":"< accumulate(=>) = [object Object] >","receivers":[16],"emitters":[13],"type":"transformator"},{"id":16,"name":"< integral = [object Object] >","receivers":[],"emitters":[15],"type":"transformator"}],"edges":[{"source":2,"target":1},{"source":3,"target":1},{"source":4,"target":1},{"source":5,"target":1},{"source":8,"target":1},{"source":10,"target":1},{"source":0,"target":1},{"source":11,"target":1},{"source":12,"target":1},{"source":5,"target":6},{"source":6,"target":7},{"source":9,"target":7},{"source":8,"target":9},{"source":14,"target":13},{"source":1,"target":13},{"source":13,"target":15},{"source":15,"target":16}]}
var g = {"vertices":[{"id":0,"name":"| key \"w\" down >","receivers":[1],"emitters":[],"type":"emitter"},{"id":1,"name":"< ship acceleration >","receivers":[17],"emitters":[2,3,4,5,13,14,0,15,16],"type":"transformator"},{"id":2,"name":"| constant([object Object]) >","receivers":[1],"emitters":[],"type":"emitter"},{"id":3,"name":"| key \"a\" down >","receivers":[1],"emitters":[],"type":"emitter"},{"id":4,"name":"| key \"d\" down >","receivers":[1],"emitters":[],"type":"emitter"},{"id":5,"name":"| key \"d\" up >","receivers":[1,6],"emitters":[],"type":"emitter"},{"id":6,"name":"< transformTime(=>) >","receivers":[7],"emitters":[5],"type":"transformator"},{"id":7,"name":"< ship velocity >","receivers":[10,11,12],"emitters":[8,6,9],"type":"transformator"},{"id":8,"name":"< integral >","receivers":[7],"emitters":[19],"type":"transformator"},{"id":9,"name":"< transformTime(=>) >","receivers":[7],"emitters":[13],"type":"transformator"},{"id":10,"name":"<  timedValue >","receivers":[],"emitters":[7],"type":"transformator"},{"id":11,"name":"< map(=>) >","receivers":[],"emitters":[7],"type":"transformator"},{"id":12,"name":"< velocityDashboardView |","receivers":[],"emitters":[7],"type":"receiver"},{"id":13,"name":"| key \"a\" up >","receivers":[1,9],"emitters":[],"type":"emitter"},{"id":14,"name":"| key \"s\" down >","receivers":[1],"emitters":[],"type":"emitter"},{"id":15,"name":"| key \"w\" up >","receivers":[1],"emitters":[],"type":"emitter"},{"id":16,"name":"| key \"s\" up >","receivers":[1],"emitters":[],"type":"emitter"},{"id":17,"name":"<  timedValue >","receivers":[19],"emitters":[18,1],"type":"transformator"},{"id":18,"name":"| time(fps: 60) >","receivers":[17],"emitters":[],"type":"emitter"},{"id":19,"name":"< accumulate(=>) >","receivers":[8],"emitters":[17],"type":"transformator"}],"edges":[{"source":2,"target":1},{"source":3,"target":1},{"source":4,"target":1},{"source":5,"target":1},{"source":13,"target":1},{"source":14,"target":1},{"source":0,"target":1},{"source":15,"target":1},{"source":16,"target":1},{"source":5,"target":6},{"source":8,"target":7},{"source":6,"target":7},{"source":9,"target":7},{"source":19,"target":8},{"source":13,"target":9},{"source":7,"target":10},{"source":7,"target":11},{"source":7,"target":12},{"source":18,"target":17},{"source":1,"target":17},{"source":17,"target":19}]}
// var g >","receivers":[1],"emitters":[],"type":"emitter"},{"id":1,"name":"< ship acceleration >","receivers":[10],"emitters":[2,3,4,5,13,34,0,35,36],"type":"transformator"},{"id":2,"name":"| constant([object Object]) >","receivers":[1],"emitters":[],"type":"emitter"},{"id":3,"name":"| key \"a\" down = notHappened >","receivers":[1],"emitters":[],"type":"emitter"},{"id":4,"name":"| key \"d\" down = notHappened >","receivers":[1],"emitters":[],"type":"emitter"},{"id":5,"name":"| key \"d\" up = notHappened >","receivers":[1,6],"emitters":[],"type":"emitter"},{"id":6,"name":"< transformTime(=>) = notHappened >","receivers":[7],"emitters":[5],"type":"transformator"},{"id":7,"name":"< ship velocity = [object Object] >","receivers":[14,18,33],"emitters":[8,6,12],"type":"transformator"},{"id":8,"name":"< integral = [object Object] >","receivers":[7],"emitters":[9],"type":"transformator"},{"id":9,"name":"< accumulate(=>) = [object Object] >","receivers":[8],"emitters":[10],"type":"transformator"},{"id":10,"name":"<  timedValue = [object Object] >","receivers":[9],"emitters":[11,1],"type":"transformator"},{"id":11,"name":"| time(fps: 60) = 1441633422615 >","receivers":[10],"emitters":[],"type":"emitter"},{"id":12,"name":"< transformTime(=>) = notHappened >","receivers":[7],"emitters":[13],"type":"transformator"},{"id":13,"name":"| key \"a\" up = notHappened >","receivers":[1,12],"emitters":[],"type":"emitter"},{"id":14,"name":"<  timedValue = [object Object] >","receivers":[16],"emitters":[15,7],"type":"transformator"},{"id":15,"name":"| time(fps: 60) = 1441633422616 >","receivers":[14],"emitters":[],"type":"emitter"},{"id":16,"name":"< accumulate(=>) = [object Object] >","receivers":[17],"emitters":[14],"type":"transformator"},{"id":17,"name":"< ship position = [object Object] >","receivers":[18,21,24,27,30],"emitters":[16],"type":"transformator"},{"id":18,"name":"< map(=>) = notHappened >","receivers":[20],"emitters":[19,17,7],"type":"transformator"},{"id":19,"name":"| key \"space\" up = notHappened >","receivers":[18],"emitters":[],"type":"emitter"},{"id":20,"name":"< changeToWhen =  >","receivers":[],"emitters":[18],"type":"transformator"},{"id":21,"name":"< map(=>) = [object Object] >","receivers":[23],"emitters":[22,17],"type":"transformator"},{"id":22,"name":"< flattenMany =  >","receivers":[21,30],"emitters":[],"type":"transformator"},{"id":23,"name":"< whenThen = notHappened >","receivers":[],"emitters":[21],"type":"transformator"},{"id":24,"name":"< map(=>) = [object Object] >","receivers":[26],"emitters":[17,25],"type":"transformator"},{"id":25,"name":"< flattenMany =  >","receivers":[24,30],"emitters":[],"type":"transformator"},{"id":26,"name":"< whenThen = notHappened >","receivers":[],"emitters":[24],"type":"transformator"},{"id":27,"name":"< map(=>) = [object Object] >","receivers":[29],"emitters":[17,28],"type":"transformator"},{"id":28,"name":"< integral = [object Object] >","receivers":[27,30],"emitters":[],"type":"transformator"},{"id":29,"name":"< whenThen = notHappened >","receivers":[],"emitters":[27],"type":"transformator"},{"id":30,"name":"< map(=>) = [object Object] >","receivers":[32],"emitters":[17,22,28,25,31],"type":"transformator"},{"id":31,"name":"< changeToWhen =  >","receivers":[30],"emitters":[],"type":"transformator"},{"id":32,"name":"< changeToWhen = [object Object] >","receivers":[],"emitters":[30],"type":"transformator"},{"id":33,"name":"< anonymous |","receivers":[],"emitters":[7],"type":"receiver"},{"id":34,"name":"| key \"s\" down = notHappened >","receivers":[1],"emitters":[],"type":"emitter"},{"id":35,"name":"| key \"w\" up = notHappened >","receivers":[1],"emitters":[],"type":"emitter"},{"id":36,"name":"| key \"s\" up = notHappened >","receivers":[1],"emitters":[],"type":"emitter"}],"edges":[{"source":2,"target":1},{"source":3,"target":1},{"source":4,"target":1},{"source":5,"target":1},{"source":13,"target":1},{"source":34,"target":1},{"source":0,"target":1},{"source":35,"target":1},{"source":36,"target":1},{"source":5,"target":6},{"source":8,"target":7},{"source":6,"target":7},{"source":12,"target":7},{"source":9,"target":8},{"source":10,"target":9},{"source":11,"target":10},{"source":1,"target":10},{"source":13,"target":12},{"source":15,"target":14},{"source":7,"target":14},{"source":14,"target":16},{"source":16,"target":17},{"source":19,"target":18},{"source":17,"target":18},{"source":7,"target":18},{"source":18,"target":20},{"source":22,"target":21},{"source":17,"target":21},{"source":21,"target":23},{"source":17,"target":24},{"source":25,"target":24},{"source":24,"target":26},{"source":17,"target":27},{"source":28,"target":27},{"source":27,"target":29},{"source":17,"target":30},{"source":22,"target":30},{"source":28,"target":30},{"source":25,"target":30},{"source":31,"target":30},{"source":30,"target":32},{"source":7,"target":33}]}
var nodes = g.vertices;
var links = g.edges;

var width = window.innerWidth * 5;
var height = window.innerHeight * 5;

var force = d3.layout.force()
    .nodes(d3.values(nodes))
    .links(links)
    .size([width, height])
    .linkDistance(200)
    .charge(-500)
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

var circle = svg.append("g").selectAll("circle")
    .data(force.nodes())
    .enter().append("circle")
    .attr("class", function(d) { return d.type })
    .attr("r", 10)
    .call(force.drag);

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
