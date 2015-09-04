var electric = require('../electric');
var fp = require('../fp');
var Response = (function () {
    function Response(data, statusCode, statusDescription, decode) {
        this.statusCode = statusCode;
        this.statusDescription = statusDescription;
        this.status = statusShortDescription(statusCode);
        if (decode && this.status === 'success') {
            this.data = decode(data);
        }
    }
    return Response;
})();
exports.Response = Response;
var emptyResponse = new Response(null, -1, 'No request was yet made and response was not yet provided');
function requestDevice(method, url, input, encode, decode) {
    if (encode === void 0) { encode = fp.identity; }
    if (decode === void 0) { decode = fp.identity; }
    var state = electric.emitter.manual('none');
    state.name = 'state of ' + method + ': ' + url;
    var stateChange = electric.emitter.manualEvent();
    stateChange.name = 'state change of ' + method + ': ' + url;
    var responseEmitter = electric.emitter.manual(emptyResponse);
    responseEmitter.name = 'response on ' + method + ': ' + url;
    input.plugReceiver(function emitStateChangesAndResponses(data) {
        if (!data.happend) {
            return;
        }
        stateChange.impulse('waiting');
        state.emit('waiting');
        request(method, url, function (response) {
            electric.scheduler.scheduleTimeout(function () { return stateChange.impulse(response.status); }, 500);
            state.emit(response.status);
            responseEmitter.emit(response);
        }, {
            data: data.value,
            encode: encode,
            decode: decode
        });
    });
    return {
        state: state,
        stateChange: stateChange,
        response: responseEmitter
    };
}
exports.requestDevice = requestDevice;
function JSONRequestDevice(method, url, input) {
    return requestDevice(method, url, input, JSON.stringify, JSON.parse);
}
exports.JSONRequestDevice = JSONRequestDevice;
function request(method, url, callback, args) {
    args.encode = args.encode || fp.identity;
    args.decode = args.decode || fp.identity;
    var req = new XMLHttpRequest();
    req.onreadystatechange = function () {
        if (req.readyState !== 4) {
            return;
        }
        callback(extractResponse(req, args.decode));
    };
    req.open(method, url, true);
    if (args.data !== undefined) {
        req.send(args.encode(args.data));
    }
    else {
        req.send();
    }
}
exports.request = request;
function extractResponse(request, decode) {
    return new Response(request.responseText, request.status, request.statusText, decode);
}
function statusShortDescription(statusCode) {
    // 5xx server error
    // 4xx client error
    if (statusCode >= 400) {
        return 'error';
    }
    else if (statusCode >= 300) {
        return 'redirection';
    }
    else if (statusCode == -1) {
        return 'none';
    }
    else if (statusCode == 0) {
        return 'error';
    }
    // 2xx success
    return 'success';
}
