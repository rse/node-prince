/*
**  node-prince -- Node API for executing PrinceXML via prince(1) CLI
**  Copyright (c) 2014-2021 Dr. Ralf S. Engelschall <rse@engelschall.com>
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
var request       = require("request");
var which         = require("which");
var chalk         = require("chalk");
var tar           = require("tar");
var streamzip     = require("node-stream-zip");
var rimraf        = require("rimraf");
var mkdirp        = require("mkdirp");

/*  determine path and version of prince(1)  */
var princeInfo = function () {
    return new promise(function (resolve, reject) {
        which("prince", function (error, filename) {
            if (error) {
                reject("prince(1) not found in PATH: " + error);
                return;
            }
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
        });
    });
};

/*  return download URL for latest PrinceXML distribution  */
var princeDownloadURL = function () {
    return new promise(function (resolve /*, reject */) {
        var id = process.arch + "-" + process.platform;
        if (id.match(/^ia32-win32$/))
            resolve("https://www.princexml.com/download/prince-14.2-win32-setup.exe");
        else if (id.match(/^x64-win32$/))
            resolve("https://www.princexml.com/download/prince-14.2-win64-setup.exe");
        else if (id.match(/^(?:ia32|x64)-darwin/))
            resolve("https://www.princexml.com/download/prince-14.2-macos.zip");
        else {
            child_process.exec("sh \"" + __dirname + "/shtool\" platform -t binary", function (error, stdout /*, stderr */) {
                if (error) {
                    console.log(chalk.red("ERROR: failed to determine platform details on platform \"" + id + "\": " + error));
                    process.exit(1);
                }
                var platform = stdout.toString().replace(/^(\S+).*\n?$/, "$1");
                if (id.match(/^(?:ia32|x64)-linux/)) {
                    if (platform.match(/^ix86-ubuntu1[45](?:\.\d+)*$/))
                        resolve("https://www.princexml.com/download/prince-14.2-ubuntu14.04-i386.tar.gz");
                    else if (platform.match(/^amd64-ubuntu1[45](?:\.\d+)*$/))
                        resolve("https://www.princexml.com/download/prince-14.2-ubuntu14.04-amd64.tar.gz");
                    else if (platform.match(/^ix86-ubuntu1[67](?:\.\d+)*$/))
                        resolve("https://www.princexml.com/download/prince-14.2-ubuntu16.04-i386.tar.gz");
                    else if (platform.match(/^amd64-ubuntu1[67](?:\.\d+)*$/))
                        resolve("https://www.princexml.com/download/prince-14.2-ubuntu16.04-amd64.tar.gz");
                    else if (platform.match(/^ix86-ubuntu1[89](?:\.\d+)*$/))
                        resolve("https://www.princexml.com/download/prince-14.2-ubuntu18.04-i386.tar.gz");
                    else if (platform.match(/^amd64-ubuntu1[89](?:\.\d+)*$/))
                        resolve("https://www.princexml.com/download/prince-14.2-ubuntu18.04-amd64.tar.gz");
                    else if (platform.match(/^amd64-ubuntu2[01](?:\.\d+)*$/))
                        resolve("https://www.princexml.com/download/prince-14.2-ubuntu20.04-amd64.tar.gz");
                    else if (platform.match(/^amd64-debian10(?:\.\d+)*$/))
                        resolve("https://www.princexml.com/download/prince-14.2-debian10-amd64.tar.gz");
                    else if (platform.match(/^amd64-debian9(?:\.\d+)*$/))
                        resolve("https://www.princexml.com/download/prince-14.2-debian9-amd64.tar.gz");
                    else if (platform.match(/^amd64-debian8(?:\.\d+)*$/))
                        resolve("https://www.princexml.com/download/prince-14.2-debian8-amd64.tar.gz");
                    else if (platform.match(/^amd64-centos8(?:\.\d+)*$/))
                        resolve("https://www.princexml.com/download/prince-14.2-centos8-x86_64.tar.gz");
                    else if (platform.match(/^amd64-centos7(?:\.\d+)*$/))
                        resolve("https://www.princexml.com/download/prince-14.2-centos7-x86_64.tar.gz");
                    else if (platform.match(/^amd64-centos6(?:\.\d+)*$/))
                        resolve("https://www.princexml.com/download/prince-14.2-centos6-x86_64.tar.gz");
                    else if (platform.match(/^amd64-alpine3\.13(?:\.\d+)*$/))
                        resolve("https://www.princexml.com/download/prince-14.2-alpine3.13-x86_64.tar.gz");
                    else if (platform.match(/^amd64-alpine3\.12(?:\.\d+)*$/))
                        resolve("https://www.princexml.com/download/prince-14.2-alpine3.12-x86_64.tar.gz");
                    else if (platform.match(/^amd64-alpine3\.11(?:\.\d+)*$/))
                        resolve("https://www.princexml.com/download/prince-14.2-alpine3.11-x86_64.tar.gz");
                    else if (platform.match(/^amd64-alpine3\.10(?:\.\d+)*$/))
                        resolve("https://www.princexml.com/download/prince-14.2-alpine3.10-x86_64.tar.gz");
                    else if (platform.match(/^amd64-opensuse15.2(?:\.\d+)*$/))
                        resolve("https://www.princexml.com/download/prince-14.2-opensuse15.2-x86_64.tar.gz");
                    else if (platform.match(/^amd64-opensuse42.3(?:\.\d+)*$/))
                        resolve("https://www.princexml.com/download/prince-14.2-opensuse42.3-x86_64.tar.gz");
                    else if (id.match(/^ia32-/))
                        resolve("https://www.princexml.com/download/prince-14.2-linux-generic-i686.tar.gz");
                    else if (id.match(/^x64-/))
                        resolve("https://www.princexml.com/download/prince-14.2-linux-generic-x86_64.tar.gz");
                }
                else if (id.match(/^x64-freebsd12(?:\.\d+)*/))
                    resolve("https://www.princexml.com/download/prince-14.2-freebsd12.0-amd64.tar.gz");
                else if (id.match(/^x64-freebsd13(?:\.\d+)*/))
                    resolve("https://www.princexml.com/download/prince-14.2-freebsd13.0-amd64.tar.gz");
                else {
                    console.log(chalk.red("ERROR: PrinceXML not available for platform \"" + platform + "\""));
                    process.exit(1);
                }
            });
        }
    });
};

/*  download data from URL  */
var downloadData = function (url) {
    return new promise(function (resolve, reject) {
        var options = {
            method: "GET",
            url: url,
            encoding: null,
            headers: {
                "User-Agent": "node-prince (prince-npm.js:install)"
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
                    "-- download: [:bar] :percent (ETA: :etas)", {
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
                    extractZipfile(destfile, "prince-14.2-macos", destdir).then(function () {
                        console.log("++ making local prince binary executable");
                        const binaryfile = path.join(destdir, "lib/prince/bin/prince");
                        const chmod755 = fs.constants.S_IRWXU | fs.constants.S_IRGRP | fs.constants.S_IXGRP | fs.constants.S_IROTH | fs.constants.S_IXOTH;
                        fs.chmodSync(binaryfile, chmod755);
                        const newmode = fs.statSync(binaryfile).mode;
                        if ((newmode & chmod755) === chmod755) {
                        console.log("-- OK: local PrinceXML installation now available");
                        } else {
                            console.log(chalk.red("** ERROR: failed to make local prince binary executable"));
                        }
                        fs.unlinkSync(destfile);
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
        rimraf(destdir, function (error) {
            if (error !== null)
                console.log(chalk.red("** ERROR: " + error));
            else
                console.log("-- OK: done");
        });
    }
}
else {
    console.log(chalk.red("ERROR: invalid argument"));
    process.exit(1);
}

