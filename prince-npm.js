/*
**  node-prince -- Node API for executing PrinceXML via prince(1) CLI
**  Copyright (c) 2014 Ralf S. Engelschall <rse@engelschall.com>
**
**  Permission is hereby granted, free of charge, to any person obtaining
**  a copy of this software and associated documentation files (the
**  "Software"), to deal in the Software without restriction, including
**  without limitation the rights to use, copy, modify, merge, publish,
**  distribute, sublicense, and/or sell copies of the Software, and to
**  permit persons to whom the Software is furnished to do so, subject to
**  the following conditions:
**
**  The above copyright notice and this permission notice shall be included
**  in all copies or substantial portions of the Software.
**
**  THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND,
**  EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF
**  MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT.
**  IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY
**  CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT,
**  TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE
**  SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.
*/

/* global process: false */
/* global __dirname: false */

/*
 *  prince-npm.js: NPM install-time integration
 */

/*  core requirements  */
var child_process = require("child_process");
var fs            = require("fs");
var path          = require("path");
var zlib          = require("zlib");

/*  extra requirements  */
var progress      = require("progress");
var promise       = require("promise");
var request       = require("request");
var which         = require("which");
var chalk         = require("chalk");
var tar           = require("tar");
var rimraf        = require("rimraf");

/*  determine path and version of prince(1)  */
var princeInfo = function () {
    return new promise(function (resolve, reject) {
        which("prince", function (error, filename) {
            if (error) {
                reject("prince(1) not found in PATH: " + error);
                return;
            }
            child_process.execFile(filename, [ "--version" ], function (error, stdout, stderr) {
                if (error) {
                    reject("prince(1) failed on \"--version\": " + error);
                    return;
                }
                var m = stdout.match(/^Prince\s+(\d+\.\d+)/);
                if (!(m !== null && typeof m[1] !== "undefined")) {
                    reject("prince(1) returned unexpected output on \"--version\":\n" + stdout + stderr);
                    return;
                }
                resolve({ command: filename, version: m[1] });
            });
        });
    });
};

/*  return download URL for latest PrinceXML distribution  */
var princeDownloadURL = function () {
    var vendor = {
        version: "9.0r4",
        download: {
            "ia32-win32":   "http://www.princexml.com/download/prince-@V@-setup.exe",
            "x64-win32":    "http://www.princexml.com/download/prince-@V@-setup.exe",
            "ia32-freebsd": "http://www.princexml.com/download/prince-@V@-freebsd82-static.tar.gz",
            "x64-freebsd":  "http://www.princexml.com/download/prince-@V@-freebsd82-static.tar.gz",
            "ia32-linux":   "http://www.princexml.com/download/prince-@V@-linux-static.tar.gz",
            "x64-linux":    "http://www.princexml.com/download/prince-@V@-linux-amd64-static.tar.gz",
            "ia32-sunos":   "http://www.princexml.com/download/prince-@V@-sol10x86-opencsw.tar.gz",
            "x64-sunos":    "http://www.princexml.com/download/prince-@V@-sol10x86-opencsw.tar.gz",
            "ia32-darwin":  "http://www.princexml.com/download/prince-@V@-macosx.tar.gz",
            "x64-darwin":   "http://www.princexml.com/download/prince-@V@-macosx.tar.gz"
        }
    };
    var id = process.arch + "-" + process.platform;
    if (typeof vendor.download[id] === "undefined") {
        console.log("ERROR: PrinceXML not available for platform \"" + id + "\"");
        process.exit(1);
    }
    return vendor.download[id].replace(/@V@/g, vendor.version);
};

/*  download data from URL  */
var downloadData = function (url) {
    return new promise(function (resolve, reject) {
        console.log("-- download: " + url);
        var options = {
            method: "GET",
            url: url,
            encoding: null,
            headers: {
                "User-Agent": "node-prince (prince-npm.js:install)"
            }
        };
        if (typeof process.env.http_proxy === "string" && process.env.http_proxy !== "")
            options.proxy = process.env.http_proxy;
        var req = request(options, function (error, response, body) {
            if (!error && response.statusCode === 200) {
                console.log("-- download: " + body.length + " bytes received.");
                resolve(body);
            }
            else
                reject("download failed: " + error);
        });
        var progress_bar = null;
        req.on("response", function (response) {
            var len = parseInt(response.headers["content-length"], 10);
            progress_bar = new progress(
                "-- download: " +
                "[" + chalk.blue(":bar") + "] " +
                chalk.blue(":percent") +
                " (ETA: " + chalk.blue(":eta") + "s)", {
                complete:   "#",
                incomplete: "=",
                width:      40,
                total:      len
            });
        });
        req.on("data", function (data) {
            if (progress_bar !== null)
                progress_bar.tick(data.length);
        });
    });
};

/*  extract a tarball (*.tar.gz)  */
var extractTarball = function (tarball, destdir, stripdirs) {
    return new promise(function (resolve, reject) {
        fs.createReadStream(tarball)
            .pipe(zlib.createGunzip())
            .pipe(tar.Extract({ path: destdir, strip: stripdirs }))
            .on("error", function (error) { reject(error); })
            .on("end", function () { resolve(); });
    });
};

/*  main procedure  */
if (process.argv.length !== 3) {
    console.log("ERROR: invalid number of arguments");
    process.exit(1);
}
var destdir;
if (process.argv[2] === "install") {
    /*  installation procedure  */
    console.log("++ checking for globally installed PrinceXML");
    princeInfo().then(function (prince) {
        console.log("-- found prince(1) command: " + chalk.blue(prince.command));
        console.log("-- found prince(1) version: " + chalk.blue(prince.version));
    }, function (/* error */) {
        console.log("++ downloading PrinceXML distribution");
        var url = princeDownloadURL();
        downloadData(url).then(function (data) {
            console.log("++ locally unpacking PrinceXML distribution");
            destdir = path.join(__dirname, "prince");
            var destfile;
            if (process.platform === "win32") {
                destfile = path.join(__dirname, "prince.exe");
                fs.writeFileSync(destfile, data, { encoding: null });
                var args = [ "/s", "/a", "/vTARGETDIR=\"" + path.resolve(destdir) + "\" /qn" ];
                child_process.execFile(destfile, args, function (error /*, stdout, stderr */) {
                    if (error) {
                        console.log(chalk.red("** ERROR: failed to extract: " + error));
                    }
                    else {
                        fs.unlinkSync(destfile);
                        console.log("-- OK: local PrinceXML installation now available");
                    }
                });
            }
            else {
                destfile = path.join(__dirname, "prince.tgz");
                fs.writeFileSync(destfile, data, { encoding: null });
                extractTarball(destfile, destdir, 1).then(function () {
                    fs.unlinkSync(destfile);
                    console.log("-- OK: local PrinceXML installation now available");
                }, function (error) {
                    console.log(chalk.red("** ERROR: failed to extract: " + error));
                });
            }
        }, function (error) {
            console.log(chalk.red("** ERROR: failed to download: " + error));
        });
    });
}
else if (process.argv[2] === "uninstall") {
    /*  uninstallation procedure  */
    destdir = path.join(__dirname, "prince");
    if (fs.existsSync(destdir)) {
        console.log("++ deleting locally unpacked PrinceXML distribution");
        rimraf(destdir, function (error) {
            if (error !== null)
                console.log("** ERROR: " + error);
            else
                console.log("-- OK: done");
        });
    }
}
else {
    console.log("ERROR: invalid argument");
    process.exit(1);
}

