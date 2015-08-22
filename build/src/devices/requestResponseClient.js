var electric = require('../electric');
function makeRequest(method, url, data, callback) {
    // console.log('MAking request:', data, '<');
    var request = new XMLHttpRequest();
    request.onreadystatechange = function () {
        if (request.readyState === 4) {
            callback(request);
        }
    };
    request.open(method, url, true);
    request.send(data);
}
;
function extractResponse(request, decode) {
    return new Response(decode(request.responseText), request.status, request.statusText);
}
var Response = (function () {
    function Response(data, statusCode, statusDescription) {
        this.data = data;
        this.statusCode = statusCode;
        this.statusDescription = statusDescription;
        this.status = statusShortDescription(statusCode);
    }
    return Response;
})();
exports.Response = Response;
function basicResponseEqual(response, otherResponse) {
    return response.data === otherResponse.data &&
        response.statusCode == otherResponse.statusCode;
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
        return 'waiting';
    }
    // 2xx success
    return 'success';
}
function _requestResponse(method, url, encode, decode, ondata, responseEqual) {
    if (responseEqual === void 0) { responseEqual = basicResponseEqual; }
    return electric.device.create('request response client', function (input, output) {
        var newData = input('data');
        var emitter = electric.emitter.manual(new Response(null, -1, 'No request was yet made and response was not yet provided'));
        emitter.setEquals(responseEqual);
        var stateEmitter = electric.emitter.manual('none');
        function receiverMakingRequest(data) {
            if (data === undefined) {
                return;
            }
            if (ondata) {
                ondata(emitter, stateEmitter, data);
            }
            else {
                stateEmitter.emit('waiting');
            }
            makeRequest(method, url, encode(data), function (r) {
                var response = extractResponse(r, decode);
                emitter.emit(response);
                stateEmitter.emit(response.status);
            });
        }
        ;
        newData.plugReceiver(receiverMakingRequest);
        output('responses', emitter);
        output('state', stateEmitter);
    });
}
var stringIdentity = function (s) { return s; };
function requestResponse(method, url) {
    return _requestResponse(method, url, stringIdentity, stringIdentity);
}
exports.requestResponse = requestResponse;
function JSONRequestResponse(method, url) {
    return _requestResponse(method, url, JSON.stringify, JSON.parse);
}
exports.JSONRequestResponse = JSONRequestResponse;
function emitOptimistically(optimistic) {
    return function (emitter, stateEmitter, data) {
        var optimisticResponse = new Response(optimistic(data), 200, 'optimistic success, maybe correction will come later, maybe not');
        optimisticResponse.status = 'success?';
        emitter.emit(optimisticResponse);
        stateEmitter.emit('success');
    };
}
function OptimisticRequestResponse(method, url, optimistic) {
    return _requestResponse(method, url, stringIdentity, stringIdentity, emitOptimistically(optimistic));
}
exports.OptimisticRequestResponse = OptimisticRequestResponse;
function OptimisticJSONRequestResponse(method, url, optimistic, responseEqual) {
    return _requestResponse(method, url, JSON.stringify, JSON.parse, emitOptimistically(optimistic), responseEqual);
}
exports.OptimisticJSONRequestResponse = OptimisticJSONRequestResponse;
