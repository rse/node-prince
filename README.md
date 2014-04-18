
node-prince
===========

Node API for executing PrinceXML via prince(1) CLI

<p/>
<img src="https://nodei.co/npm/node-prince.png?downloads=true&stars=true" alt=""/>

<p/>
<img src="https://david-dm.org/rse/node-prince.png" alt=""/>

Abstract
--------

This is a [Node.js](http://nodejs.org/) API for integrating the
PrinceXML CLI prince(1) into JavaScript.

Installation
------------

Use the Node Package Manager (NPM) to install this module
locally (default) or globally (with option `-g`):

    $ npm install [-g] node-prince

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

- `Prince#timeout(timeout): Prince`: set the execution timeout in milliseconds.
  The by default it is `10000` (10s).
  This returns the Prince API for further method chaining.

- `Prince#inputs(filename): Prince`: set one (in case `filename` is a string)
   or multiple (in case `filename` is an array of strings) input XML/HTML files.
  This returns the Prince API for further method chaining.

- `Prince#output(filename): Prince`: set the output PDF file.
  This returns the Prince API for further method chaining.

- `Prince#option(name, value[, forced]): Prince`: set a PrinceXML option
  name `name` to a value `value`. The API knows the officially supported
  options of PrinceXML 9.0 and by default rejects unknown options.
  But arbitrary options can be passed by setting `forced` to `true`
  in case a different PrinceXML version should be used. This returns
  the Prince API for further method chaining.

- `Prince#execute(): Promise`: asynchronously execute the conversion
  process. This returns a promise.

License
-------

Copyright (c) 2014 Ralf S. Engelschall (http://engelschall.com/)

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

