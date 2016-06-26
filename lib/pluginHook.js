var Patcher = require('./utils/Patcher');
var cordovaBrowserSync = require('cordova-browsersync-primitives');
var fs = require("fs"),
    path = require("path"),
    url = require("url");


function parseOptions(opts) {
    var result = {};
    opts = opts || [];
    opts.forEach(function(opt) {
        var parts = opt.split(/=/);
        result[parts[0].replace(/^-+/, '')] = parts[1] || true;
    });
    return result;
}

module.exports = function(context) {
    var options = parseOptions(context.opts.options.argv);

    if (typeof options['live-reload'] === 'undefined') {
        return;
    }

    // TODO - Add back ignored option
    // TODO - Enable live reload servers

    var platforms = ['android', 'ios'];
    var patcher = new Patcher(context.opts.projectRoot, platforms);

    var bs = cordovaBrowserSync.startBrowserSync(context.opts.projectRoot, platforms, function(defaults) {
        defaults.files.push({
            match: ['www/**/*.*'],
            fn: function(event, file) {
                if (event === 'change') {
                    context.cordova.raw.prepare().then(function() {
                        patcher.addCSP();
                        bs.reload();
                    });
                }
            }
        });
        
        var folder = path.resolve(__dirname, "../");
        var defaultFile = "index.html"

        defaults.server.baseDir = './';
        defaults.server.middleware = function(req, res, next) {
            var fileName = url.parse(req.url);
            fileName = fileName.href.split(fileName.search).join("");
            var fileExists = fs.existsSync(folder + fileName);
            if (!fileExists && fileName.indexOf("browser-sync-client") < 0) {
                req.url = "/" + defaultFile;
            }
            return next();
        }

        return defaults;
    }, function(err, browserSyncValue) {
        patcher.patch({
            servers: browserSyncValue.servers
        });
    });
}
