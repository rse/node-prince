
Node-Prince
===========

[Node](http://nodejs.org/) API for executing the XML/HTML to PDF renderer
[PrinceXML](http://www.princexml.com/) via `prince` CLI.

<p/>
<img src="https://nodei.co/npm/prince.png?downloads=true&stars=true" alt=""/>

<p/>
<img src="https://david-dm.org/rse/node-prince.png" alt=""/>

Abstract
--------

This is a [Node](http://nodejs.org/) API for executing the
XML/HTML to PDF renderer [PrinceXML](http://www.princexml.com/) CLI `prince` from within
JavaScript. The essential point of this Node extension is not primarily
to just abstract away the asynchronous CLI execution. Instead there
are two other major points: First, this Node extension provides a
fixed dependency, as other Node extensions which require PrinceXML can
just depend (via their NPM `package.json` file) onto this extension.
Second, as this Node extension can &mdash; across platforms &mdash;
automatically download, locally unpack and use a PrinceXML distribution,
there is no need for any previously available global PrinceXML
installation. Just depend on this Node extension and PrinceXML is
available!

Installation
------------

Use the Node Package Manager (NPM) to install this module
locally (default) or globally (with option `-g`):

    $ npm install [-g] prince

ATTENTION: In case you are behind a corporate firewall, you usually
have to configure your corporate proxy before installing this module.
For this, either configure the proxy inside NPM (e.g. `npm config set proxy http://proxy.example.com:3128`)
or alternatively set the environment variable `http_proxy` (e.g. `export http_proxy=http://proxy.example.com:3128`).

NOTICE: PrinceXML provides just distribution-specific and dynamically
linked Linux binaries. The Node-Prince installation procedure tries to
detect your particular distribution on `npm install [-g] prince` and
downloads the corresponding binary. But because of the dynamic linking
of PrinceXML binaries, it still can be that you first have to install
some distribution-specific system dependencies. For instance, under
Debian 8.0 you first have to install the necessary system packages with
`apt-get install nodejs nodejs-legacy npm libgif4 curl`.

Usage
-----

```js
const Prince = require("prince")
const util   = require("util")

Prince()
    .inputs("test.html")
    .output("test.pdf")
    .execute()
    .then(function () {
        console.log("OK: done")
    }, function (error) {
        console.log("ERROR: ", util.inspect(error))
    })
```

API
---

- `Prince([options]): Prince`: constructor for the API. Call this once
  for every XML/HTML to PDF conversion process.
  This returns the Prince API for further method chaining.

- `Prince#binary(binary): Prince`: set the path to the prince(1) binary.
  By default it is `prince` (in case PrinceXML was found globally
  installed at the Node API installation time) or the path to the
  `prince` binary of the locally installed PrinceXML distribution (in
  case PrinceXML was not found globally installed at the Node API
  installation time).
  This returns the Prince API for further method chaining.

- `Prince#prefix(prefix): Prince`: set the path to the PrinceXML
  installation. This by default is either empty
  (in case PrinceXML was found globally
  installed at the Node API installation time) or the path to the
  locally installed PrinceXML distribution (in case PrinceXML was not
  found globally installed at the Node API installation time).
  This returns the Prince API for further method chaining.

- `Prince#license(filename): Prince`: set the path to the PrinceXML
  license file. This by default uses the path `license/license.dat`
  under the PrinceXML installation.
  This returns the Prince API for further method chaining.

- `Prince#timeout(timeout): Prince`: set the execution timeout in milliseconds.
  The by default it is `10000` (10s).
  This returns the Prince API for further method chaining.

- `Prince#maxbuffer(maxbuffer): Prince`: set the execution maximum stdout/stderr buffer size in bytes.
  The by default it is `10485760` (10MB).
  This returns the Prince API for further method chaining.

- `Prince#cwd(dirname): Prince`: set the current working directory for execution.
  The by default it is `.` (current working directory).
  This returns the Prince API for further method chaining.

- `Prince#inputs(filename): Prince`: set one (in case `filename` is a string)
   or multiple (in case `filename` is an array of strings) input XML/HTML files.
  This returns the Prince API for further method chaining.

- `Prince#output(filename): Prince`: set the output PDF file.
  This returns the Prince API for further method chaining.
  This is optional if the PrinceXML option `raster-output` is given.

- `Prince#option(name, value[, forced]): Prince`: set a PrinceXML option
  name `name` to a value `value`. The API knows the officially supported
  options of PrinceXML 9.0 and by default rejects unknown options.
  But arbitrary options can be passed by setting `forced` to `true`
  in case a different PrinceXML version should be used. This returns
  the Prince API for further method chaining.

- `Prince#execute(): Promise`: asynchronously execute the conversion
  process. This returns a promise. On success it resolves to
  an object with `stdout` and `stderr` fields. On error, it
  resolves to an object with `error`, ` stdout` and `stderr` fields.

See Also
--------

Companion Grunt task [grunt-princess](https://github.com/rse/grunt-princess)

License
-------

Copyright &copy; 2014-2026 Dr. Ralf S. Engelschall (http://engelschall.com/)

Permission is hereby granted, free of charge, to any person obtaining
a copy of this software and associated documentation files (the
"Software"), to deal in the Software without restriction, including
without limitation the rights to use, copy, modify, merge, publish,
distribute, sublicense, and/or sell copies of the Software, and to
permit persons to whom the Software is furnished to do so, subject to
the following conditions:

The above copyright notice and this permission notice shall be included
in all copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND,
EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF
MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT.
IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY
CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT,
TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE
SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.

