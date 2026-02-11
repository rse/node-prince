/*
**  node-prince -- Node API for executing PrinceXML via prince(1) CLI
**  Copyright (c) 2014-2026 Dr. Ralf S. Engelschall <rse@engelschall.com>
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

/*
 *  prince-api.d.ts: TypeScript declarations for Node run-time API
 */

declare module "prince" {
    /*  constructor options  */
    interface PrinceOptions {
        binary?:  string
        prefix?:  string
        inputs?:  string | string[]
        cookies?: string | string[]
        output?:  string
    }

    /*  execution result  */
    interface PrinceExecuteResult {
        stdout: Buffer
        stderr: Buffer
    }

    /*  execution error  */
    interface PrinceExecuteError {
        error:  Error | string
        stdout: Buffer | string
        stderr: Buffer | string
    }

    /*  configuration  */
    interface PrinceConfig {
        binary:    string
        prefix:    string
        license:   string
        timeout:   number
        maxbuffer: number
        cwd:       string
        option:    Record<string, string | boolean>
        inputs:    string[]
        cookies:   string[]
        output:    string
    }

    /*  API class  */
    class Prince {
        /*  configuration object  */
        config: PrinceConfig

        /*  class constructor  */
        constructor(options?: PrinceOptions)

        /*  set path to CLI binary  */
        binary(binary: string): this

        /*  set path to installation tree  */
        prefix(prefix: string): this

        /*  set path to license file  */
        license(filename: string): this

        /*  set timeout for CLI execution  */
        timeout(timeout: number): this

        /*  set maximum stdout/stderr buffer for CLI execution  */
        maxbuffer(maxbuffer: number): this

        /*  set current working directory for CLI execution  */
        cwd(cwd: string): this

        /*  set input file(s)  */
        inputs(inputs: string | string[]): this

        /*  set cookie(s)  */
        cookies(cookies: string | string[]): this

        /*  set output file  */
        output(output: string): this

        /*  set CLI options  */
        option(name: string, value?: string | boolean, forced?: boolean): this

        /*  execute the CLI binary  */
        execute(): Promise<PrinceExecuteResult>
    }

    export = Prince
}

