/*
**  node-prince -- Node API for executing PrinceXML via prince(1) CLI
**  Copyright (c) 2014-2024 Dr. Ralf S. Engelschall <rse@engelschall.com>
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
/* global require: false */
/* global console: false */
/* eslint no-console: 0 */

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
var axios         = require("axios");
var which         = require("which");
var chalk         = require("chalk");
var tar           = require("tar");
var streamzip     = require("node-stream-zip");
var rimraf        = require("rimraf");
var mkdirp        = require("mkdirp");

/*  determine path and version of prince(1)  */
var princeInfo = function () {
    return new promise(function (resolve, reject) {
        which("prince").then(function (filename) {
            child_process.execFile(filename, [ "--version" ], function (error, stdout, stderr) {
                if (error !== null) {
                    reject("prince(1) failed on \"--version\": " + error);
                    return;
                }
                var m = stdout.match(/^Prince\s+(\d+(?:\.\d+)?)/);
                if (!(m !== null && typeof m[1] !== "undefined")) {
                    reject("prince(1) returned unexpected output on \"--version\":\n" + stdout + stderr);
                    return;
                }
                resolve({ command: filename, version: m[1] });
            });
        }).catch(function (error) {
            reject("prince(1) not found in PATH: " + error);
            return;
        })
    });
};

/*  return download URL for latest PrinceXML distribution  */
var princeDownloadURL = function () {
    return new promise(function (resolve /*, reject */) {
        var id = process.arch + "-" + process.platform;
        if (id.match(/^ia32-win32$/))
            resolve("https://www.princexml.com/download/prince-15.4-win32-setup.exe");
        else if (id.match(/^x64-win32$/))
            resolve("https://www.princexml.com/download/prince-15.4-win64-setup.exe");
        else if (id.match(/^(?:x64|arm64)-darwin/))
            resolve("https://www.princexml.com/download/prince-16-macos.zip");
        else {
            child_process.exec("sh \"" + __dirname + "/shtool\" platform -t binary", function (error, stdout /*, stderr */) {
                if (error) {
                    console.log(chalk.red("ERROR: failed to determine platform details on platform \"" + id + "\": " + error));
                    process.exit(1);
                }
                var platform = stdout.toString().replace(/^(\S+).*\n?$/, "$1");
                if (id.match(/^x64-linux/)) {
                    if (platform.match(/^amd64-ubuntu2[01](?:\.\d+)*$/))
                        resolve("https://www.princexml.com/download/prince-16-ubuntu20.04-amd64.tar.gz");
                    else if (platform.match(/^amd64-ubuntu2[23](?:\.\d+)*$/))
                        resolve("https://www.princexml.com/download/prince-16-ubuntu22.04-amd64.tar.gz");
                    else if (platform.match(/^amd64-ubuntu24(?:\.\d+)*$/))
                        resolve("https://www.princexml.com/download/prince-16-ubuntu24.04-amd64.tar.gz");
                    else if (platform.match(/^amd64-debian12(?:\.\d+)*$/))
                        resolve("https://www.princexml.com/download/prince-16-debian12-amd64.tar.gz");
                    else if (platform.match(/^amd64-debian11(?:\.\d+)*$/))
                        resolve("https://www.princexml.com/download/prince-16-debian11-amd64.tar.gz");
                    else if (platform.match(/^amd64-almalinux9(?:\.\d+)*$/))
                        resolve("https://www.princexml.com/download/prince-16-almalinux9-x86_64.tar.gz");
                    else if (platform.match(/^amd64-almalinux8(?:\.\d+)*$/))
                        resolve("https://www.princexml.com/download/prince-16-almalinux8-x86_64.tar.gz");
                    else if (platform.match(/^amd64-alpine3\.21(?:\.\d+)*$/))
                        resolve("https://www.princexml.com/download/prince-16-alpine3.21-x86_64.tar.gz");
                    else if (platform.match(/^amd64-alpine3\.20(?:\.\d+)*$/))
                        resolve("https://www.princexml.com/download/prince-16-alpine3.20-x86_64.tar.gz");
                    else if (platform.match(/^amd64-alpine3\.19(?:\.\d+)*$/))
                        resolve("https://www.princexml.com/download/prince-16-alpine3.19-x86_64.tar.gz");
                    else if (platform.match(/^amd64-alpine3\.18(?:\.\d+)*$/))
                        resolve("https://www.princexml.com/download/prince-16-alpine3.18-x86_64.tar.gz");
                    else if (platform.match(/^amd64-opensuse15\.6(?:\.\d+)*$/))
                        resolve("https://www.princexml.com/download/prince-16-opensuse15.6-x86_64.tar.gz");
                    else if (id.match(/^x64-/))
                        resolve("https://www.princexml.com/download/prince-16-linux-generic-x86_64.tar.gz");
                }
                else if (id.match(/^arm64-linux/)) {
                    if (platform.match(/^arm64-ubuntu24(?:\.\d+)*$/))
                        resolve("https://www.princexml.com/download/prince-16-ubuntu24.04-arm64.tar.gz");
                    else if (platform.match(/^arm64-ubuntu2[23](?:\.\d+)*$/))
                        resolve("https://www.princexml.com/download/prince-16-ubuntu22.04-arm64.tar.gz");
                    else if (platform.match(/^arm64-debian12(?:\.\d+)*$/))
                        resolve("https://www.princexml.com/download/prince-16-debian12-arm64.tar.gz");
                    else if (platform.match(/^arm64-debian11(?:\.\d+)*$/))
                        resolve("https://www.princexml.com/download/prince-16-debian11-arm64.tar.gz");
                    else if (platform.match(/^aarch64-alpine[23](?:\.\d+)*$/))
                        resolve("https://www.princexml.com/download/prince-16-linux-generic-aarch64-musl.tar.gz");
                    else
                        resolve("https://www.princexml.com/download/prince-16-linux-generic-aarch64.tar.gz");
                }
                else if (platform.match(/^amd64-freebsd13(?:\.\d+)*/))
                    resolve("https://www.princexml.com/download/prince-16-freebsd13.0-amd64.tar.gz");
                else if (platform.match(/^amd64-freebsd14(?:\.\d+)*/))
                    resolve("https://www.princexml.com/download/prince-16-freebsd14.0-amd64.tar.gz");
                else {
                    console.log(chalk.red("ERROR: PrinceXML not available for platform \"" + platform + "\" (\"" + id + "\")"));
                    process.exit(1);
                }
            });
        }
    });
};

/*  download data from URL  */
var downloadData = function (url) {
    return new promise(function (resolve, reject) {
        var progress_bar = null;
        var options = {
            method: "GET",
            url: url,
            encoding: null,
            headers: {
                "User-Agent": "node-prince (prince-npm.js:install)"
            },
            responseType: "arraybuffer",
            onDownloadProgress: function(progressEvent) {
                if (!progress_bar) {
                    progress_bar = new progress(
                    "-- download: [:bar] :percent (ETA: :etas)", {
                        complete:   "#",
                        incomplete: "=",
                        width:      40,
                        total:      progressEvent.total
                    });
                }
                progress_bar.tick(progressEvent.loaded);
            }
        };
        (new promise(function (resolve /*, reject  */) {
            if (typeof process.env.http_proxy === "string" && process.env.http_proxy !== "") {
                options.proxy = process.env.http_proxy;
                console.log("-- using proxy ($http_proxy): " + options.proxy);
                resolve();
            }
            else {
                child_process.exec("npm config get proxy", function (error, stdout /*, stderr */) {
                    if (error === null) {
                        stdout = stdout.toString().replace(/\r?\n$/, "");
                        if (stdout.match(/^https?:\/\/.+/)) {
                            options.proxy = stdout;
                            console.log("-- using proxy (npm config get proxy): " + options.proxy);
                        }
                    }
                    resolve();
                });
            }
        })).then(function () {
            console.log("-- download: " + url);
            axios(options).then(function (response) {
                if (response.status === 200) {
                    console.log("-- download: " + response.data.length + " bytes received.");
                    resolve(response.data);
                }
            }).catch(function (error) {
                reject("download failed: " + error);
            });
        });
    });
};

/*  extract a zipfile (*.zip)  */
var extractZipfile = function (zipfile, stripdir, destdir) {
    return new promise(function (resolve, reject) {
        var zip = new streamzip({ file: zipfile });
        zip.on("ready", function () {
            zip.extract(stripdir, destdir, function (error) {
                zip.close();
                if (error) {
                    reject(error);
                } else {
                    setTimeout(function () { resolve(); }, 500);
                }
            });
        });
    });
};

/*  extract a tarball (*.tar.gz)  */
var extractTarball = function (tarball, destdir, stripdirs) {
    return new promise(function (resolve, reject) {
        fs.createReadStream(tarball)
            .pipe(zlib.createGunzip())
            .pipe(tar.extract({ cwd: destdir, strip: stripdirs }))
            .on("error", function (error) { reject(error); })
            .on("close", function () { /* global setTimeout: true */ setTimeout(function () { resolve(); }, 500); });
    });
};

/*  main procedure  */
if (process.argv.length !== 3) {
    console.log(chalk.red("ERROR: invalid number of arguments"));
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
        princeDownloadURL().then(function (url) {
            downloadData(url).then(function (data) {
                console.log("++ locally unpacking PrinceXML distribution");
                destdir = path.join(__dirname, "prince");
                var destfile;
                if (process.platform === "win32") {
                    destfile = path.join(__dirname, "prince.exe");
                    fs.writeFileSync(destfile, data, { encoding: null });
                    var args = [ "/s", "/a", "/vTARGETDIR=\"" + path.resolve(destdir) + "\" /qn" ];
                    child_process.execFile(destfile, args, function (error, stdout, stderr) {
                        if (error !== null) {
                            console.log(chalk.red("** ERROR: failed to extract: " + error));
                            stdout = stdout.toString();
                            stderr = stderr.toString();
                            if (stdout !== "")
                                console.log("** STDOUT: " + stdout);
                            if (stderr !== "")
                                console.log("** STDERR: " + stderr);
                        }
                        else {
                            fs.unlinkSync(destfile);
                            console.log("-- OK: local PrinceXML installation now available");
                        }
                    });
                }
                else if (process.platform === "darwin") {
                    destfile = path.join(__dirname, "prince.zip");
                    fs.writeFileSync(destfile, data, { encoding: null });
                    mkdirp.sync(destdir);
                    extractZipfile(destfile, "prince-16-macos", destdir).then(function () {
                        fs.chmodSync(path.join(destdir, "lib/prince/bin/prince"), fs.constants.S_IRWXU
                            | fs.constants.S_IRGRP | fs.constants.S_IXGRP | fs.constants.S_IROTH | fs.constants.S_IXOTH);
                        fs.unlinkSync(destfile);
                        console.log("-- OK: local PrinceXML installation now available");
                    }, function (error) {
                        console.log(chalk.red("** ERROR: failed to extract: " + error));
                    });
                }
                else {
                    destfile = path.join(__dirname, "prince.tgz");
                    fs.writeFileSync(destfile, data, { encoding: null });
                    mkdirp.sync(destdir);
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
    });
}
else if (process.argv[2] === "uninstall") {
    /*  uninstallation procedure  */
    destdir = path.join(__dirname, "prince");
    if (fs.existsSync(destdir)) {
        console.log("++ deleting locally unpacked PrinceXML distribution");
        rimraf(destdir).then(function () {
            console.log("-- OK: done");
        }).catch(function (error) {
            console.log(chalk.red("** ERROR: " + error));
        });
    }
}
else {
    console.log(chalk.red("ERROR: invalid argument"));
    process.exit(1);
}
