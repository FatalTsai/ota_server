exports.print_call_stack = function() {
    var stack = new Error().stack;
    winston.error(stack);
}

clone_message = function(msg) {
    var rs = {};
    for (var key in msg) {
        rs[key] = msg[key];
    }
    return rs;
}

exports.concat_json = function(first, second) {
    var rs = {};
    for (var key in first) {
        rs[key] = first[key];
    }
    for (var key in second) {
        rs[key] = second[key];
    }
    return rs;
}

exports.request_failed = function(msg) {
    var err = clone_message(Config.response_code.fail);
    err.message = msg;
    return err;
}

exports.request_success = function(msg) {
    var success = clone_message(Config.response_code.success);
    success.data = msg;
    return success;
}

String.prototype.format = function() {
  var res = this;
  for (var k in arguments) {
    res = res.replace(new RegExp("\\{" + k + "\\}", 'g'), arguments[k]);
  }
  return res;
}

exports.clone_message = clone_message;
