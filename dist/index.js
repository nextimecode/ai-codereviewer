require("./sourcemap-register.js");
/******/ (() => {
  // webpackBootstrap
  /******/ var __webpack_modules__ = {
    /***/ 5634: /***/ function (
      __unused_webpack_module,
      exports,
      __nccwpck_require__,
    ) {
      "use strict";

      var __createBinding =
        (this && this.__createBinding) ||
        (Object.create
          ? function (o, m, k, k2) {
              if (k2 === undefined) k2 = k;
              var desc = Object.getOwnPropertyDescriptor(m, k);
              if (
                !desc ||
                ("get" in desc
                  ? !m.__esModule
                  : desc.writable || desc.configurable)
              ) {
                desc = {
                  enumerable: true,
                  get: function () {
                    return m[k];
                  },
                };
              }
              Object.defineProperty(o, k2, desc);
            }
          : function (o, m, k, k2) {
              if (k2 === undefined) k2 = k;
              o[k2] = m[k];
            });
      var __setModuleDefault =
        (this && this.__setModuleDefault) ||
        (Object.create
          ? function (o, v) {
              Object.defineProperty(o, "default", {
                enumerable: true,
                value: v,
              });
            }
          : function (o, v) {
              o["default"] = v;
            });
      var __importStar =
        (this && this.__importStar) ||
        function (mod) {
          if (mod && mod.__esModule) return mod;
          var result = {};
          if (mod != null)
            for (var k in mod)
              if (
                k !== "default" &&
                Object.prototype.hasOwnProperty.call(mod, k)
              )
                __createBinding(result, mod, k);
          __setModuleDefault(result, mod);
          return result;
        };
      var __awaiter =
        (this && this.__awaiter) ||
        function (thisArg, _arguments, P, generator) {
          function adopt(value) {
            return value instanceof P
              ? value
              : new P(function (resolve) {
                  resolve(value);
                });
          }
          return new (P || (P = Promise))(function (resolve, reject) {
            function fulfilled(value) {
              try {
                step(generator.next(value));
              } catch (e) {
                reject(e);
              }
            }
            function rejected(value) {
              try {
                step(generator["throw"](value));
              } catch (e) {
                reject(e);
              }
            }
            function step(result) {
              result.done
                ? resolve(result.value)
                : adopt(result.value).then(fulfilled, rejected);
            }
            step(
              (generator = generator.apply(thisArg, _arguments || [])).next(),
            );
          });
        };
      var __importDefault =
        (this && this.__importDefault) ||
        function (mod) {
          return mod && mod.__esModule ? mod : { default: mod };
        };
      Object.defineProperty(exports, "__esModule", { value: true });
      const fs_1 = __nccwpck_require__(7147);
      const core = __importStar(__nccwpck_require__(7733));
      const openai_1 = __nccwpck_require__(4096);
      const rest_1 = __nccwpck_require__(3652);
      const parse_diff_1 = __importDefault(__nccwpck_require__(2347));
      const minimatch_1 = __importDefault(__nccwpck_require__(9581));
      const GITHUB_TOKEN = core.getInput("GITHUB_TOKEN");
      const OPENAI_API_KEY = core.getInput("OPENAI_API_KEY");
      const octokit = new rest_1.Octokit({ auth: GITHUB_TOKEN });
      const configuration = new openai_1.Configuration({
        apiKey: OPENAI_API_KEY,
      });
      const openai = new openai_1.OpenAIApi(configuration);
      function getPRDetails() {
        var _a, _b;
        return __awaiter(this, void 0, void 0, function* () {
          const { repository, number } = JSON.parse(
            (0, fs_1.readFileSync)(process.env.GITHUB_EVENT_PATH || "", "utf8"),
          );
          const prResponse = yield octokit.pulls.get({
            owner: repository.owner.login,
            repo: repository.name,
            pull_number: number,
          });
          return {
            owner: repository.owner.login,
            repo: repository.name,
            pull_number: number,
            title:
              (_a = prResponse.data.title) !== null && _a !== void 0 ? _a : "",
            description:
              (_b = prResponse.data.body) !== null && _b !== void 0 ? _b : "",
          };
        });
      }
      function getDiff(owner, repo, pull_number) {
        return __awaiter(this, void 0, void 0, function* () {
          const response = yield octokit.pulls.get({
            owner,
            repo,
            pull_number,
            mediaType: { format: "diff" },
          });
          // @ts-expect-error - response.data is a string
          return response.data;
        });
      }
      function analyzeCode(parsedDiff, prDetails) {
        return __awaiter(this, void 0, void 0, function* () {
          const comments = [];
          for (const file of parsedDiff) {
            if (file.to === "/dev/null") continue; // Ignore deleted files
            for (const chunk of file.chunks) {
              const prompt = createPrompt(file, chunk, prDetails);
              const aiResponse = yield getAIResponse(prompt);
              if (aiResponse) {
                const newComments = createComment(file, chunk, aiResponse);
                if (newComments) {
                  comments.push(...newComments);
                }
              }
            }
          }
          return comments;
        });
      }
      function getBaseAndHeadShas(owner, repo, pull_number) {
        return __awaiter(this, void 0, void 0, function* () {
          const prResponse = yield octokit.pulls.get({
            owner,
            repo,
            pull_number,
          });
          return {
            baseSha: prResponse.data.base.sha,
            headSha: prResponse.data.head.sha,
          };
        });
      }
      function createPrompt(file, chunk, prDetails) {
        return `Your task is to review pull requests. Instructions:
- Provide the response in following JSON format:  [{"lineNumber":  <line_number>, "reviewComment": "<review comment>"}]
- Do not give positive comments or compliments.
- Provide comments and suggestions ONLY if there is something to improve, otherwise return an empty array.
- Write the comment in GitHub Markdown format.
- Use the given description only for the overall context and only comment the code.
- IMPORTANT: NEVER suggest adding comments to the code.

Review the following code diff in the file "${
          file.to
        }" and take the pull request title and description into account when writing the response.
  
Pull request title: ${prDetails.title}
Pull request description:

---
${prDetails.description}
---

Git diff to review:

\`\`\`diff
${chunk.content}
${chunk.changes
  // @ts-expect-error - ln and ln2 exists where needed
  .map((c) => `${c.ln ? c.ln : c.ln2} ${c.content}`)
  .join("\n")}
\`\`\`
`;
      }
      function getAIResponse(prompt) {
        var _a, _b;
        return __awaiter(this, void 0, void 0, function* () {
          const queryConfig = {
            model: "gpt-4",
            temperature: 0.2,
            max_tokens: 700,
            top_p: 1,
            frequency_penalty: 0,
            presence_penalty: 0,
          };
          try {
            const response = yield openai.createChatCompletion(
              Object.assign(Object.assign({}, queryConfig), {
                messages: [
                  {
                    role: "system",
                    content: prompt,
                  },
                ],
              }),
            );
            const res =
              ((_b =
                (_a = response.data.choices[0].message) === null ||
                _a === void 0
                  ? void 0
                  : _a.content) === null || _b === void 0
                ? void 0
                : _b.trim()) || "[]";
            return JSON.parse(res);
          } catch (error) {
            console.error("Error:", error);
            return null;
          }
        });
      }
      function createComment(file, chunk, aiResponses) {
        return aiResponses.flatMap((aiResponse) => {
          if (!file.to) {
            return [];
          }
          return {
            body: aiResponse.reviewComment,
            path: file.to,
            line: Number(aiResponse.lineNumber),
          };
        });
      }
      function createReviewComment(owner, repo, pull_number, comments) {
        return __awaiter(this, void 0, void 0, function* () {
          yield octokit.pulls.createReview({
            owner,
            repo,
            pull_number,
            comments,
            event: "COMMENT",
          });
        });
      }
      function main() {
        var _a;
        return __awaiter(this, void 0, void 0, function* () {
          const prDetails = yield getPRDetails();
          let diff;
          const eventData = JSON.parse(
            (0, fs_1.readFileSync)(
              (_a = process.env.GITHUB_EVENT_PATH) !== null && _a !== void 0
                ? _a
                : "",
              "utf8",
            ),
          );
          if (eventData.action === "opened") {
            diff = yield getDiff(
              prDetails.owner,
              prDetails.repo,
              prDetails.pull_number,
            );
          } else if (eventData.action === "synchronize") {
            const newBaseSha = eventData.before;
            const newHeadSha = eventData.after;
            const response = yield octokit.repos.compareCommits({
              headers: {
                accept: "application/vnd.github.v3.diff",
              },
              owner: prDetails.owner,
              repo: prDetails.repo,
              base: newBaseSha,
              head: newHeadSha,
            });
            diff = String(response.data);
          } else {
            console.log("Unsupported event:", process.env.GITHUB_EVENT_NAME);
            return;
          }
          if (!diff) {
            console.log("No diff found");
            return;
          }
          const parsedDiff = (0, parse_diff_1.default)(diff);
          const excludePatterns = core
            .getInput("exclude")
            .split(",")
            .map((s) => s.trim());
          const filteredDiff = parsedDiff.filter((file) => {
            return !excludePatterns.some((pattern) => {
              var _a;
              return minimatch_1.default.minimatch(
                (_a = file.to) !== null && _a !== void 0 ? _a : "",
                pattern,
              );
            });
          });
          const comments = yield analyzeCode(filteredDiff, prDetails);
          if (comments.length > 0) {
            yield createReviewComment(
              prDetails.owner,
              prDetails.repo,
              prDetails.pull_number,
              comments,
            );
          }
        });
      }
      main().catch((error) => {
        console.error("Error:", error);
        process.exit(1);
      });

      /***/
    },

    /***/ 9483: /***/ function (
      __unused_webpack_module,
      exports,
      __nccwpck_require__,
    ) {
      "use strict";

      var __createBinding =
        (this && this.__createBinding) ||
        (Object.create
          ? function (o, m, k, k2) {
              if (k2 === undefined) k2 = k;
              Object.defineProperty(o, k2, {
                enumerable: true,
                get: function () {
                  return m[k];
                },
              });
            }
          : function (o, m, k, k2) {
              if (k2 === undefined) k2 = k;
              o[k2] = m[k];
            });
      var __setModuleDefault =
        (this && this.__setModuleDefault) ||
        (Object.create
          ? function (o, v) {
              Object.defineProperty(o, "default", {
                enumerable: true,
                value: v,
              });
            }
          : function (o, v) {
              o["default"] = v;
            });
      var __importStar =
        (this && this.__importStar) ||
        function (mod) {
          if (mod && mod.__esModule) return mod;
          var result = {};
          if (mod != null)
            for (var k in mod)
              if (k !== "default" && Object.hasOwnProperty.call(mod, k))
                __createBinding(result, mod, k);
          __setModuleDefault(result, mod);
          return result;
        };
      Object.defineProperty(exports, "__esModule", { value: true });
      exports.issue = exports.issueCommand = void 0;
      const os = __importStar(__nccwpck_require__(2037));
      const utils_1 = __nccwpck_require__(2994);
      /**
       * Commands
       *
       * Command Format:
       *   ::name key=value,key=value::message
       *
       * Examples:
       *   ::warning::This is the message
       *   ::set-env name=MY_VAR::some value
       */
      function issueCommand(command, properties, message) {
        const cmd = new Command(command, properties, message);
        process.stdout.write(cmd.toString() + os.EOL);
      }
      exports.issueCommand = issueCommand;
      function issue(name, message = "") {
        issueCommand(name, {}, message);
      }
      exports.issue = issue;
      const CMD_STRING = "::";
      class Command {
        constructor(command, properties, message) {
          if (!command) {
            command = "missing.command";
          }
          this.command = command;
          this.properties = properties;
          this.message = message;
        }
        toString() {
          let cmdStr = CMD_STRING + this.command;
          if (this.properties && Object.keys(this.properties).length > 0) {
            cmdStr += " ";
            let first = true;
            for (const key in this.properties) {
              if (this.properties.hasOwnProperty(key)) {
                const val = this.properties[key];
                if (val) {
                  if (first) {
                    first = false;
                  } else {
                    cmdStr += ",";
                  }
                  cmdStr += `${key}=${escapeProperty(val)}`;
                }
              }
            }
          }
          cmdStr += `${CMD_STRING}${escapeData(this.message)}`;
          return cmdStr;
        }
      }
      function escapeData(s) {
        return utils_1
          .toCommandValue(s)
          .replace(/%/g, "%25")
          .replace(/\r/g, "%0D")
          .replace(/\n/g, "%0A");
      }
      function escapeProperty(s) {
        return utils_1
          .toCommandValue(s)
          .replace(/%/g, "%25")
          .replace(/\r/g, "%0D")
          .replace(/\n/g, "%0A")
          .replace(/:/g, "%3A")
          .replace(/,/g, "%2C");
      }
      //# sourceMappingURL=command.js.map

      /***/
    },

    /***/ 7733: /***/ function (
      __unused_webpack_module,
      exports,
      __nccwpck_require__,
    ) {
      "use strict";

      var __createBinding =
        (this && this.__createBinding) ||
        (Object.create
          ? function (o, m, k, k2) {
              if (k2 === undefined) k2 = k;
              Object.defineProperty(o, k2, {
                enumerable: true,
                get: function () {
                  return m[k];
                },
              });
            }
          : function (o, m, k, k2) {
              if (k2 === undefined) k2 = k;
              o[k2] = m[k];
            });
      var __setModuleDefault =
        (this && this.__setModuleDefault) ||
        (Object.create
          ? function (o, v) {
              Object.defineProperty(o, "default", {
                enumerable: true,
                value: v,
              });
            }
          : function (o, v) {
              o["default"] = v;
            });
      var __importStar =
        (this && this.__importStar) ||
        function (mod) {
          if (mod && mod.__esModule) return mod;
          var result = {};
          if (mod != null)
            for (var k in mod)
              if (k !== "default" && Object.hasOwnProperty.call(mod, k))
                __createBinding(result, mod, k);
          __setModuleDefault(result, mod);
          return result;
        };
      var __awaiter =
        (this && this.__awaiter) ||
        function (thisArg, _arguments, P, generator) {
          function adopt(value) {
            return value instanceof P
              ? value
              : new P(function (resolve) {
                  resolve(value);
                });
          }
          return new (P || (P = Promise))(function (resolve, reject) {
            function fulfilled(value) {
              try {
                step(generator.next(value));
              } catch (e) {
                reject(e);
              }
            }
            function rejected(value) {
              try {
                step(generator["throw"](value));
              } catch (e) {
                reject(e);
              }
            }
            function step(result) {
              result.done
                ? resolve(result.value)
                : adopt(result.value).then(fulfilled, rejected);
            }
            step(
              (generator = generator.apply(thisArg, _arguments || [])).next(),
            );
          });
        };
      Object.defineProperty(exports, "__esModule", { value: true });
      exports.getIDToken =
        exports.getState =
        exports.saveState =
        exports.group =
        exports.endGroup =
        exports.startGroup =
        exports.info =
        exports.notice =
        exports.warning =
        exports.error =
        exports.debug =
        exports.isDebug =
        exports.setFailed =
        exports.setCommandEcho =
        exports.setOutput =
        exports.getBooleanInput =
        exports.getMultilineInput =
        exports.getInput =
        exports.addPath =
        exports.setSecret =
        exports.exportVariable =
        exports.ExitCode =
          void 0;
      const command_1 = __nccwpck_require__(9483);
      const file_command_1 = __nccwpck_require__(8541);
      const utils_1 = __nccwpck_require__(2994);
      const os = __importStar(__nccwpck_require__(2037));
      const path = __importStar(__nccwpck_require__(1017));
      const oidc_utils_1 = __nccwpck_require__(2422);
      /**
       * The code to exit an action
       */
      var ExitCode;
      (function (ExitCode) {
        /**
         * A code indicating that the action was successful
         */
        ExitCode[(ExitCode["Success"] = 0)] = "Success";
        /**
         * A code indicating that the action was a failure
         */
        ExitCode[(ExitCode["Failure"] = 1)] = "Failure";
      })((ExitCode = exports.ExitCode || (exports.ExitCode = {})));
      //-----------------------------------------------------------------------
      // Variables
      //-----------------------------------------------------------------------
      /**
       * Sets env variable for this action and future actions in the job
       * @param name the name of the variable to set
       * @param val the value of the variable. Non-string values will be converted to a string via JSON.stringify
       */
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      function exportVariable(name, val) {
        const convertedVal = utils_1.toCommandValue(val);
        process.env[name] = convertedVal;
        const filePath = process.env["GITHUB_ENV"] || "";
        if (filePath) {
          return file_command_1.issueFileCommand(
            "ENV",
            file_command_1.prepareKeyValueMessage(name, val),
          );
        }
        command_1.issueCommand("set-env", { name }, convertedVal);
      }
      exports.exportVariable = exportVariable;
      /**
       * Registers a secret which will get masked from logs
       * @param secret value of the secret
       */
      function setSecret(secret) {
        command_1.issueCommand("add-mask", {}, secret);
      }
      exports.setSecret = setSecret;
      /**
       * Prepends inputPath to the PATH (for this action and future actions)
       * @param inputPath
       */
      function addPath(inputPath) {
        const filePath = process.env["GITHUB_PATH"] || "";
        if (filePath) {
          file_command_1.issueFileCommand("PATH", inputPath);
        } else {
          command_1.issueCommand("add-path", {}, inputPath);
        }
        process.env[
          "PATH"
        ] = `${inputPath}${path.delimiter}${process.env["PATH"]}`;
      }
      exports.addPath = addPath;
      /**
       * Gets the value of an input.
       * Unless trimWhitespace is set to false in InputOptions, the value is also trimmed.
       * Returns an empty string if the value is not defined.
       *
       * @param     name     name of the input to get
       * @param     options  optional. See InputOptions.
       * @returns   string
       */
      function getInput(name, options) {
        const val =
          process.env[`INPUT_${name.replace(/ /g, "_").toUpperCase()}`] || "";
        if (options && options.required && !val) {
          throw new Error(`Input required and not supplied: ${name}`);
        }
        if (options && options.trimWhitespace === false) {
          return val;
        }
        return val.trim();
      }
      exports.getInput = getInput;
      /**
       * Gets the values of an multiline input.  Each value is also trimmed.
       *
       * @param     name     name of the input to get
       * @param     options  optional. See InputOptions.
       * @returns   string[]
       *
       */
      function getMultilineInput(name, options) {
        const inputs = getInput(name, options)
          .split("\n")
          .filter((x) => x !== "");
        if (options && options.trimWhitespace === false) {
          return inputs;
        }
        return inputs.map((input) => input.trim());
      }
      exports.getMultilineInput = getMultilineInput;
      /**
       * Gets the input value of the boolean type in the YAML 1.2 "core schema" specification.
       * Support boolean input list: `true | True | TRUE | false | False | FALSE` .
       * The return value is also in boolean type.
       * ref: https://yaml.org/spec/1.2/spec.html#id2804923
       *
       * @param     name     name of the input to get
       * @param     options  optional. See InputOptions.
       * @returns   boolean
       */
      function getBooleanInput(name, options) {
        const trueValue = ["true", "True", "TRUE"];
        const falseValue = ["false", "False", "FALSE"];
        const val = getInput(name, options);
        if (trueValue.includes(val)) return true;
        if (falseValue.includes(val)) return false;
        throw new TypeError(
          `Input does not meet YAML 1.2 "Core Schema" specification: ${name}\n` +
            `Support boolean input list: \`true | True | TRUE | false | False | FALSE\``,
        );
      }
      exports.getBooleanInput = getBooleanInput;
      /**
       * Sets the value of an output.
       *
       * @param     name     name of the output to set
       * @param     value    value to store. Non-string values will be converted to a string via JSON.stringify
       */
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      function setOutput(name, value) {
        const filePath = process.env["GITHUB_OUTPUT"] || "";
        if (filePath) {
          return file_command_1.issueFileCommand(
            "OUTPUT",
            file_command_1.prepareKeyValueMessage(name, value),
          );
        }
        process.stdout.write(os.EOL);
        command_1.issueCommand(
          "set-output",
          { name },
          utils_1.toCommandValue(value),
        );
      }
      exports.setOutput = setOutput;
      /**
       * Enables or disables the echoing of commands into stdout for the rest of the step.
       * Echoing is disabled by default if ACTIONS_STEP_DEBUG is not set.
       *
       */
      function setCommandEcho(enabled) {
        command_1.issue("echo", enabled ? "on" : "off");
      }
      exports.setCommandEcho = setCommandEcho;
      //-----------------------------------------------------------------------
      // Results
      //-----------------------------------------------------------------------
      /**
       * Sets the action status to failed.
       * When the action exits it will be with an exit code of 1
       * @param message add error issue message
       */
      function setFailed(message) {
        process.exitCode = ExitCode.Failure;
        error(message);
      }
      exports.setFailed = setFailed;
      //-----------------------------------------------------------------------
      // Logging Commands
      //-----------------------------------------------------------------------
      /**
       * Gets whether Actions Step Debug is on or not
       */
      function isDebug() {
        return process.env["RUNNER_DEBUG"] === "1";
      }
      exports.isDebug = isDebug;
      /**
       * Writes debug message to user log
       * @param message debug message
       */
      function debug(message) {
        command_1.issueCommand("debug", {}, message);
      }
      exports.debug = debug;
      /**
       * Adds an error issue
       * @param message error issue message. Errors will be converted to string via toString()
       * @param properties optional properties to add to the annotation.
       */
      function error(message, properties = {}) {
        command_1.issueCommand(
          "error",
          utils_1.toCommandProperties(properties),
          message instanceof Error ? message.toString() : message,
        );
      }
      exports.error = error;
      /**
       * Adds a warning issue
       * @param message warning issue message. Errors will be converted to string via toString()
       * @param properties optional properties to add to the annotation.
       */
      function warning(message, properties = {}) {
        command_1.issueCommand(
          "warning",
          utils_1.toCommandProperties(properties),
          message instanceof Error ? message.toString() : message,
        );
      }
      exports.warning = warning;
      /**
       * Adds a notice issue
       * @param message notice issue message. Errors will be converted to string via toString()
       * @param properties optional properties to add to the annotation.
       */
      function notice(message, properties = {}) {
        command_1.issueCommand(
          "notice",
          utils_1.toCommandProperties(properties),
          message instanceof Error ? message.toString() : message,
        );
      }
      exports.notice = notice;
      /**
       * Writes info to log with console.log.
       * @param message info message
       */
      function info(message) {
        process.stdout.write(message + os.EOL);
      }
      exports.info = info;
      /**
       * Begin an output group.
       *
       * Output until the next `groupEnd` will be foldable in this group
       *
       * @param name The name of the output group
       */
      function startGroup(name) {
        command_1.issue("group", name);
      }
      exports.startGroup = startGroup;
      /**
       * End an output group.
       */
      function endGroup() {
        command_1.issue("endgroup");
      }
      exports.endGroup = endGroup;
      /**
       * Wrap an asynchronous function call in a group.
       *
       * Returns the same type as the function itself.
       *
       * @param name The name of the group
       * @param fn The function to wrap in the group
       */
      function group(name, fn) {
        return __awaiter(this, void 0, void 0, function* () {
          startGroup(name);
          let result;
          try {
            result = yield fn();
          } finally {
            endGroup();
          }
          return result;
        });
      }
      exports.group = group;
      //-----------------------------------------------------------------------
      // Wrapper action state
      //-----------------------------------------------------------------------
      /**
       * Saves state for current action, the state can only be retrieved by this action's post job execution.
       *
       * @param     name     name of the state to store
       * @param     value    value to store. Non-string values will be converted to a string via JSON.stringify
       */
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      function saveState(name, value) {
        const filePath = process.env["GITHUB_STATE"] || "";
        if (filePath) {
          return file_command_1.issueFileCommand(
            "STATE",
            file_command_1.prepareKeyValueMessage(name, value),
          );
        }
        command_1.issueCommand(
          "save-state",
          { name },
          utils_1.toCommandValue(value),
        );
      }
      exports.saveState = saveState;
      /**
       * Gets the value of an state set by this action's main execution.
       *
       * @param     name     name of the state to get
       * @returns   string
       */
      function getState(name) {
        return process.env[`STATE_${name}`] || "";
      }
      exports.getState = getState;
      function getIDToken(aud) {
        return __awaiter(this, void 0, void 0, function* () {
          return yield oidc_utils_1.OidcClient.getIDToken(aud);
        });
      }
      exports.getIDToken = getIDToken;
      /**
       * Summary exports
       */
      var summary_1 = __nccwpck_require__(513);
      Object.defineProperty(exports, "summary", {
        enumerable: true,
        get: function () {
          return summary_1.summary;
        },
      });
      /**
       * @deprecated use core.summary
       */
      var summary_2 = __nccwpck_require__(513);
      Object.defineProperty(exports, "markdownSummary", {
        enumerable: true,
        get: function () {
          return summary_2.markdownSummary;
        },
      });
      /**
       * Path exports
       */
      var path_utils_1 = __nccwpck_require__(3084);
      Object.defineProperty(exports, "toPosixPath", {
        enumerable: true,
        get: function () {
          return path_utils_1.toPosixPath;
        },
      });
      Object.defineProperty(exports, "toWin32Path", {
        enumerable: true,
        get: function () {
          return path_utils_1.toWin32Path;
        },
      });
      Object.defineProperty(exports, "toPlatformPath", {
        enumerable: true,
        get: function () {
          return path_utils_1.toPlatformPath;
        },
      });
      //# sourceMappingURL=core.js.map

      /***/
    },

    /***/ 8541: /***/ function (
      __unused_webpack_module,
      exports,
      __nccwpck_require__,
    ) {
      "use strict";

      // For internal use, subject to change.
      var __createBinding =
        (this && this.__createBinding) ||
        (Object.create
          ? function (o, m, k, k2) {
              if (k2 === undefined) k2 = k;
              Object.defineProperty(o, k2, {
                enumerable: true,
                get: function () {
                  return m[k];
                },
              });
            }
          : function (o, m, k, k2) {
              if (k2 === undefined) k2 = k;
              o[k2] = m[k];
            });
      var __setModuleDefault =
        (this && this.__setModuleDefault) ||
        (Object.create
          ? function (o, v) {
              Object.defineProperty(o, "default", {
                enumerable: true,
                value: v,
              });
            }
          : function (o, v) {
              o["default"] = v;
            });
      var __importStar =
        (this && this.__importStar) ||
        function (mod) {
          if (mod && mod.__esModule) return mod;
          var result = {};
          if (mod != null)
            for (var k in mod)
              if (k !== "default" && Object.hasOwnProperty.call(mod, k))
                __createBinding(result, mod, k);
          __setModuleDefault(result, mod);
          return result;
        };
      Object.defineProperty(exports, "__esModule", { value: true });
      exports.prepareKeyValueMessage = exports.issueFileCommand = void 0;
      // We use any as a valid input type
      /* eslint-disable @typescript-eslint/no-explicit-any */
      const fs = __importStar(__nccwpck_require__(7147));
      const os = __importStar(__nccwpck_require__(2037));
      const uuid_1 = __nccwpck_require__(2033);
      const utils_1 = __nccwpck_require__(2994);
      function issueFileCommand(command, message) {
        const filePath = process.env[`GITHUB_${command}`];
        if (!filePath) {
          throw new Error(
            `Unable to find environment variable for file command ${command}`,
          );
        }
        if (!fs.existsSync(filePath)) {
          throw new Error(`Missing file at path: ${filePath}`);
        }
        fs.appendFileSync(
          filePath,
          `${utils_1.toCommandValue(message)}${os.EOL}`,
          {
            encoding: "utf8",
          },
        );
      }
      exports.issueFileCommand = issueFileCommand;
      function prepareKeyValueMessage(key, value) {
        const delimiter = `ghadelimiter_${uuid_1.v4()}`;
        const convertedValue = utils_1.toCommandValue(value);
        // These should realistically never happen, but just in case someone finds a
        // way to exploit uuid generation let's not allow keys or values that contain
        // the delimiter.
        if (key.includes(delimiter)) {
          throw new Error(
            `Unexpected input: name should not contain the delimiter "${delimiter}"`,
          );
        }
        if (convertedValue.includes(delimiter)) {
          throw new Error(
            `Unexpected input: value should not contain the delimiter "${delimiter}"`,
          );
        }
        return `${key}<<${delimiter}${os.EOL}${convertedValue}${os.EOL}${delimiter}`;
      }
      exports.prepareKeyValueMessage = prepareKeyValueMessage;
      //# sourceMappingURL=file-command.js.map

      /***/
    },

    /***/ 2422: /***/ function (
      __unused_webpack_module,
      exports,
      __nccwpck_require__,
    ) {
      "use strict";

      var __awaiter =
        (this && this.__awaiter) ||
        function (thisArg, _arguments, P, generator) {
          function adopt(value) {
            return value instanceof P
              ? value
              : new P(function (resolve) {
                  resolve(value);
                });
          }
          return new (P || (P = Promise))(function (resolve, reject) {
            function fulfilled(value) {
              try {
                step(generator.next(value));
              } catch (e) {
                reject(e);
              }
            }
            function rejected(value) {
              try {
                step(generator["throw"](value));
              } catch (e) {
                reject(e);
              }
            }
            function step(result) {
              result.done
                ? resolve(result.value)
                : adopt(result.value).then(fulfilled, rejected);
            }
            step(
              (generator = generator.apply(thisArg, _arguments || [])).next(),
            );
          });
        };
      Object.defineProperty(exports, "__esModule", { value: true });
      exports.OidcClient = void 0;
      const http_client_1 = __nccwpck_require__(7794);
      const auth_1 = __nccwpck_require__(4610);
      const core_1 = __nccwpck_require__(7733);
      class OidcClient {
        static createHttpClient(allowRetry = true, maxRetry = 10) {
          const requestOptions = {
            allowRetries: allowRetry,
            maxRetries: maxRetry,
          };
          return new http_client_1.HttpClient(
            "actions/oidc-client",
            [new auth_1.BearerCredentialHandler(OidcClient.getRequestToken())],
            requestOptions,
          );
        }
        static getRequestToken() {
          const token = process.env["ACTIONS_ID_TOKEN_REQUEST_TOKEN"];
          if (!token) {
            throw new Error(
              "Unable to get ACTIONS_ID_TOKEN_REQUEST_TOKEN env variable",
            );
          }
          return token;
        }
        static getIDTokenUrl() {
          const runtimeUrl = process.env["ACTIONS_ID_TOKEN_REQUEST_URL"];
          if (!runtimeUrl) {
            throw new Error(
              "Unable to get ACTIONS_ID_TOKEN_REQUEST_URL env variable",
            );
          }
          return runtimeUrl;
        }
        static getCall(id_token_url) {
          var _a;
          return __awaiter(this, void 0, void 0, function* () {
            const httpclient = OidcClient.createHttpClient();
            const res = yield httpclient
              .getJson(id_token_url)
              .catch((error) => {
                throw new Error(`Failed to get ID Token. \n 
        Error Code : ${error.statusCode}\n 
        Error Message: ${error.result.message}`);
              });
            const id_token =
              (_a = res.result) === null || _a === void 0 ? void 0 : _a.value;
            if (!id_token) {
              throw new Error("Response json body do not have ID Token field");
            }
            return id_token;
          });
        }
        static getIDToken(audience) {
          return __awaiter(this, void 0, void 0, function* () {
            try {
              // New ID Token is requested from action service
              let id_token_url = OidcClient.getIDTokenUrl();
              if (audience) {
                const encodedAudience = encodeURIComponent(audience);
                id_token_url = `${id_token_url}&audience=${encodedAudience}`;
              }
              core_1.debug(`ID token url is ${id_token_url}`);
              const id_token = yield OidcClient.getCall(id_token_url);
              core_1.setSecret(id_token);
              return id_token;
            } catch (error) {
              throw new Error(`Error message: ${error.message}`);
            }
          });
        }
      }
      exports.OidcClient = OidcClient;
      //# sourceMappingURL=oidc-utils.js.map

      /***/
    },

    /***/ 3084: /***/ function (
      __unused_webpack_module,
      exports,
      __nccwpck_require__,
    ) {
      "use strict";

      var __createBinding =
        (this && this.__createBinding) ||
        (Object.create
          ? function (o, m, k, k2) {
              if (k2 === undefined) k2 = k;
              Object.defineProperty(o, k2, {
                enumerable: true,
                get: function () {
                  return m[k];
                },
              });
            }
          : function (o, m, k, k2) {
              if (k2 === undefined) k2 = k;
              o[k2] = m[k];
            });
      var __setModuleDefault =
        (this && this.__setModuleDefault) ||
        (Object.create
          ? function (o, v) {
              Object.defineProperty(o, "default", {
                enumerable: true,
                value: v,
              });
            }
          : function (o, v) {
              o["default"] = v;
            });
      var __importStar =
        (this && this.__importStar) ||
        function (mod) {
          if (mod && mod.__esModule) return mod;
          var result = {};
          if (mod != null)
            for (var k in mod)
              if (k !== "default" && Object.hasOwnProperty.call(mod, k))
                __createBinding(result, mod, k);
          __setModuleDefault(result, mod);
          return result;
        };
      Object.defineProperty(exports, "__esModule", { value: true });
      exports.toPlatformPath =
        exports.toWin32Path =
        exports.toPosixPath =
          void 0;
      const path = __importStar(__nccwpck_require__(1017));
      /**
       * toPosixPath converts the given path to the posix form. On Windows, \\ will be
       * replaced with /.
       *
       * @param pth. Path to transform.
       * @return string Posix path.
       */
      function toPosixPath(pth) {
        return pth.replace(/[\\]/g, "/");
      }
      exports.toPosixPath = toPosixPath;
      /**
       * toWin32Path converts the given path to the win32 form. On Linux, / will be
       * replaced with \\.
       *
       * @param pth. Path to transform.
       * @return string Win32 path.
       */
      function toWin32Path(pth) {
        return pth.replace(/[/]/g, "\\");
      }
      exports.toWin32Path = toWin32Path;
      /**
       * toPlatformPath converts the given path to a platform-specific path. It does
       * this by replacing instances of / and \ with the platform-specific path
       * separator.
       *
       * @param pth The path to platformize.
       * @return string The platform-specific path.
       */
      function toPlatformPath(pth) {
        return pth.replace(/[/\\]/g, path.sep);
      }
      exports.toPlatformPath = toPlatformPath;
      //# sourceMappingURL=path-utils.js.map

      /***/
    },

    /***/ 513: /***/ function (
      __unused_webpack_module,
      exports,
      __nccwpck_require__,
    ) {
      "use strict";

      var __awaiter =
        (this && this.__awaiter) ||
        function (thisArg, _arguments, P, generator) {
          function adopt(value) {
            return value instanceof P
              ? value
              : new P(function (resolve) {
                  resolve(value);
                });
          }
          return new (P || (P = Promise))(function (resolve, reject) {
            function fulfilled(value) {
              try {
                step(generator.next(value));
              } catch (e) {
                reject(e);
              }
            }
            function rejected(value) {
              try {
                step(generator["throw"](value));
              } catch (e) {
                reject(e);
              }
            }
            function step(result) {
              result.done
                ? resolve(result.value)
                : adopt(result.value).then(fulfilled, rejected);
            }
            step(
              (generator = generator.apply(thisArg, _arguments || [])).next(),
            );
          });
        };
      Object.defineProperty(exports, "__esModule", { value: true });
      exports.summary =
        exports.markdownSummary =
        exports.SUMMARY_DOCS_URL =
        exports.SUMMARY_ENV_VAR =
          void 0;
      const os_1 = __nccwpck_require__(2037);
      const fs_1 = __nccwpck_require__(7147);
      const { access, appendFile, writeFile } = fs_1.promises;
      exports.SUMMARY_ENV_VAR = "GITHUB_STEP_SUMMARY";
      exports.SUMMARY_DOCS_URL =
        "https://docs.github.com/actions/using-workflows/workflow-commands-for-github-actions#adding-a-job-summary";
      class Summary {
        constructor() {
          this._buffer = "";
        }
        /**
         * Finds the summary file path from the environment, rejects if env var is not found or file does not exist
         * Also checks r/w permissions.
         *
         * @returns step summary file path
         */
        filePath() {
          return __awaiter(this, void 0, void 0, function* () {
            if (this._filePath) {
              return this._filePath;
            }
            const pathFromEnv = process.env[exports.SUMMARY_ENV_VAR];
            if (!pathFromEnv) {
              throw new Error(
                `Unable to find environment variable for $${exports.SUMMARY_ENV_VAR}. Check if your runtime environment supports job summaries.`,
              );
            }
            try {
              yield access(
                pathFromEnv,
                fs_1.constants.R_OK | fs_1.constants.W_OK,
              );
            } catch (_a) {
              throw new Error(
                `Unable to access summary file: '${pathFromEnv}'. Check if the file has correct read/write permissions.`,
              );
            }
            this._filePath = pathFromEnv;
            return this._filePath;
          });
        }
        /**
         * Wraps content in an HTML tag, adding any HTML attributes
         *
         * @param {string} tag HTML tag to wrap
         * @param {string | null} content content within the tag
         * @param {[attribute: string]: string} attrs key-value list of HTML attributes to add
         *
         * @returns {string} content wrapped in HTML element
         */
        wrap(tag, content, attrs = {}) {
          const htmlAttrs = Object.entries(attrs)
            .map(([key, value]) => ` ${key}="${value}"`)
            .join("");
          if (!content) {
            return `<${tag}${htmlAttrs}>`;
          }
          return `<${tag}${htmlAttrs}>${content}</${tag}>`;
        }
        /**
         * Writes text in the buffer to the summary buffer file and empties buffer. Will append by default.
         *
         * @param {SummaryWriteOptions} [options] (optional) options for write operation
         *
         * @returns {Promise<Summary>} summary instance
         */
        write(options) {
          return __awaiter(this, void 0, void 0, function* () {
            const overwrite = !!(options === null || options === void 0
              ? void 0
              : options.overwrite);
            const filePath = yield this.filePath();
            const writeFunc = overwrite ? writeFile : appendFile;
            yield writeFunc(filePath, this._buffer, { encoding: "utf8" });
            return this.emptyBuffer();
          });
        }
        /**
         * Clears the summary buffer and wipes the summary file
         *
         * @returns {Summary} summary instance
         */
        clear() {
          return __awaiter(this, void 0, void 0, function* () {
            return this.emptyBuffer().write({ overwrite: true });
          });
        }
        /**
         * Returns the current summary buffer as a string
         *
         * @returns {string} string of summary buffer
         */
        stringify() {
          return this._buffer;
        }
        /**
         * If the summary buffer is empty
         *
         * @returns {boolen} true if the buffer is empty
         */
        isEmptyBuffer() {
          return this._buffer.length === 0;
        }
        /**
         * Resets the summary buffer without writing to summary file
         *
         * @returns {Summary} summary instance
         */
        emptyBuffer() {
          this._buffer = "";
          return this;
        }
        /**
         * Adds raw text to the summary buffer
         *
         * @param {string} text content to add
         * @param {boolean} [addEOL=false] (optional) append an EOL to the raw text (default: false)
         *
         * @returns {Summary} summary instance
         */
        addRaw(text, addEOL = false) {
          this._buffer += text;
          return addEOL ? this.addEOL() : this;
        }
        /**
         * Adds the operating system-specific end-of-line marker to the buffer
         *
         * @returns {Summary} summary instance
         */
        addEOL() {
          return this.addRaw(os_1.EOL);
        }
        /**
         * Adds an HTML codeblock to the summary buffer
         *
         * @param {string} code content to render within fenced code block
         * @param {string} lang (optional) language to syntax highlight code
         *
         * @returns {Summary} summary instance
         */
        addCodeBlock(code, lang) {
          const attrs = Object.assign({}, lang && { lang });
          const element = this.wrap("pre", this.wrap("code", code), attrs);
          return this.addRaw(element).addEOL();
        }
        /**
         * Adds an HTML list to the summary buffer
         *
         * @param {string[]} items list of items to render
         * @param {boolean} [ordered=false] (optional) if the rendered list should be ordered or not (default: false)
         *
         * @returns {Summary} summary instance
         */
        addList(items, ordered = false) {
          const tag = ordered ? "ol" : "ul";
          const listItems = items.map((item) => this.wrap("li", item)).join("");
          const element = this.wrap(tag, listItems);
          return this.addRaw(element).addEOL();
        }
        /**
         * Adds an HTML table to the summary buffer
         *
         * @param {SummaryTableCell[]} rows table rows
         *
         * @returns {Summary} summary instance
         */
        addTable(rows) {
          const tableBody = rows
            .map((row) => {
              const cells = row
                .map((cell) => {
                  if (typeof cell === "string") {
                    return this.wrap("td", cell);
                  }
                  const { header, data, colspan, rowspan } = cell;
                  const tag = header ? "th" : "td";
                  const attrs = Object.assign(
                    Object.assign({}, colspan && { colspan }),
                    rowspan && { rowspan },
                  );
                  return this.wrap(tag, data, attrs);
                })
                .join("");
              return this.wrap("tr", cells);
            })
            .join("");
          const element = this.wrap("table", tableBody);
          return this.addRaw(element).addEOL();
        }
        /**
         * Adds a collapsable HTML details element to the summary buffer
         *
         * @param {string} label text for the closed state
         * @param {string} content collapsable content
         *
         * @returns {Summary} summary instance
         */
        addDetails(label, content) {
          const element = this.wrap(
            "details",
            this.wrap("summary", label) + content,
          );
          return this.addRaw(element).addEOL();
        }
        /**
         * Adds an HTML image tag to the summary buffer
         *
         * @param {string} src path to the image you to embed
         * @param {string} alt text description of the image
         * @param {SummaryImageOptions} options (optional) addition image attributes
         *
         * @returns {Summary} summary instance
         */
        addImage(src, alt, options) {
          const { width, height } = options || {};
          const attrs = Object.assign(
            Object.assign({}, width && { width }),
            height && { height },
          );
          const element = this.wrap(
            "img",
            null,
            Object.assign({ src, alt }, attrs),
          );
          return this.addRaw(element).addEOL();
        }
        /**
         * Adds an HTML section heading element
         *
         * @param {string} text heading text
         * @param {number | string} [level=1] (optional) the heading level, default: 1
         *
         * @returns {Summary} summary instance
         */
        addHeading(text, level) {
          const tag = `h${level}`;
          const allowedTag = ["h1", "h2", "h3", "h4", "h5", "h6"].includes(tag)
            ? tag
            : "h1";
          const element = this.wrap(allowedTag, text);
          return this.addRaw(element).addEOL();
        }
        /**
         * Adds an HTML thematic break (<hr>) to the summary buffer
         *
         * @returns {Summary} summary instance
         */
        addSeparator() {
          const element = this.wrap("hr", null);
          return this.addRaw(element).addEOL();
        }
        /**
         * Adds an HTML line break (<br>) to the summary buffer
         *
         * @returns {Summary} summary instance
         */
        addBreak() {
          const element = this.wrap("br", null);
          return this.addRaw(element).addEOL();
        }
        /**
         * Adds an HTML blockquote to the summary buffer
         *
         * @param {string} text quote text
         * @param {string} cite (optional) citation url
         *
         * @returns {Summary} summary instance
         */
        addQuote(text, cite) {
          const attrs = Object.assign({}, cite && { cite });
          const element = this.wrap("blockquote", text, attrs);
          return this.addRaw(element).addEOL();
        }
        /**
         * Adds an HTML anchor tag to the summary buffer
         *
         * @param {string} text link text/content
         * @param {string} href hyperlink
         *
         * @returns {Summary} summary instance
         */
        addLink(text, href) {
          const element = this.wrap("a", text, { href });
          return this.addRaw(element).addEOL();
        }
      }
      const _summary = new Summary();
      /**
       * @deprecated use `core.summary`
       */
      exports.markdownSummary = _summary;
      exports.summary = _summary;
      //# sourceMappingURL=summary.js.map

      /***/
    },

    /***/ 2994: /***/ (__unused_webpack_module, exports) => {
      "use strict";

      // We use any as a valid input type
      /* eslint-disable @typescript-eslint/no-explicit-any */
      Object.defineProperty(exports, "__esModule", { value: true });
      exports.toCommandProperties = exports.toCommandValue = void 0;
      /**
       * Sanitizes an input into a string so it can be passed into issueCommand safely
       * @param input input to sanitize into a string
       */
      function toCommandValue(input) {
        if (input === null || input === undefined) {
          return "";
        } else if (typeof input === "string" || input instanceof String) {
          return input;
        }
        return JSON.stringify(input);
      }
      exports.toCommandValue = toCommandValue;
      /**
       *
       * @param annotationProperties
       * @returns The command properties to send with the actual annotation command
       * See IssueCommandProperties: https://github.com/actions/runner/blob/main/src/Runner.Worker/ActionCommandManager.cs#L646
       */
      function toCommandProperties(annotationProperties) {
        if (!Object.keys(annotationProperties).length) {
          return {};
        }
        return {
          title: annotationProperties.title,
          file: annotationProperties.file,
          line: annotationProperties.startLine,
          endLine: annotationProperties.endLine,
          col: annotationProperties.startColumn,
          endColumn: annotationProperties.endColumn,
        };
      }
      exports.toCommandProperties = toCommandProperties;
      //# sourceMappingURL=utils.js.map

      /***/
    },

    /***/ 4610: /***/ function (__unused_webpack_module, exports) {
      "use strict";

      var __awaiter =
        (this && this.__awaiter) ||
        function (thisArg, _arguments, P, generator) {
          function adopt(value) {
            return value instanceof P
              ? value
              : new P(function (resolve) {
                  resolve(value);
                });
          }
          return new (P || (P = Promise))(function (resolve, reject) {
            function fulfilled(value) {
              try {
                step(generator.next(value));
              } catch (e) {
                reject(e);
              }
            }
            function rejected(value) {
              try {
                step(generator["throw"](value));
              } catch (e) {
                reject(e);
              }
            }
            function step(result) {
              result.done
                ? resolve(result.value)
                : adopt(result.value).then(fulfilled, rejected);
            }
            step(
              (generator = generator.apply(thisArg, _arguments || [])).next(),
            );
          });
        };
      Object.defineProperty(exports, "__esModule", { value: true });
      exports.PersonalAccessTokenCredentialHandler =
        exports.BearerCredentialHandler =
        exports.BasicCredentialHandler =
          void 0;
      class BasicCredentialHandler {
        constructor(username, password) {
          this.username = username;
          this.password = password;
        }
        prepareRequest(options) {
          if (!options.headers) {
            throw Error("The request has no headers");
          }
          options.headers["Authorization"] = `Basic ${Buffer.from(
            `${this.username}:${this.password}`,
          ).toString("base64")}`;
        }
        // This handler cannot handle 401
        canHandleAuthentication() {
          return false;
        }
        handleAuthentication() {
          return __awaiter(this, void 0, void 0, function* () {
            throw new Error("not implemented");
          });
        }
      }
      exports.BasicCredentialHandler = BasicCredentialHandler;
      class BearerCredentialHandler {
        constructor(token) {
          this.token = token;
        }
        // currently implements pre-authorization
        // TODO: support preAuth = false where it hooks on 401
        prepareRequest(options) {
          if (!options.headers) {
            throw Error("The request has no headers");
          }
          options.headers["Authorization"] = `Bearer ${this.token}`;
        }
        // This handler cannot handle 401
        canHandleAuthentication() {
          return false;
        }
        handleAuthentication() {
          return __awaiter(this, void 0, void 0, function* () {
            throw new Error("not implemented");
          });
        }
      }
      exports.BearerCredentialHandler = BearerCredentialHandler;
      class PersonalAccessTokenCredentialHandler {
        constructor(token) {
          this.token = token;
        }
        // currently implements pre-authorization
        // TODO: support preAuth = false where it hooks on 401
        prepareRequest(options) {
          if (!options.headers) {
            throw Error("The request has no headers");
          }
          options.headers["Authorization"] = `Basic ${Buffer.from(
            `PAT:${this.token}`,
          ).toString("base64")}`;
        }
        // This handler cannot handle 401
        canHandleAuthentication() {
          return false;
        }
        handleAuthentication() {
          return __awaiter(this, void 0, void 0, function* () {
            throw new Error("not implemented");
          });
        }
      }
      exports.PersonalAccessTokenCredentialHandler =
        PersonalAccessTokenCredentialHandler;
      //# sourceMappingURL=auth.js.map

      /***/
    },

    /***/ 7794: /***/ function (
      __unused_webpack_module,
      exports,
      __nccwpck_require__,
    ) {
      "use strict";

      /* eslint-disable @typescript-eslint/no-explicit-any */
      var __createBinding =
        (this && this.__createBinding) ||
        (Object.create
          ? function (o, m, k, k2) {
              if (k2 === undefined) k2 = k;
              Object.defineProperty(o, k2, {
                enumerable: true,
                get: function () {
                  return m[k];
                },
              });
            }
          : function (o, m, k, k2) {
              if (k2 === undefined) k2 = k;
              o[k2] = m[k];
            });
      var __setModuleDefault =
        (this && this.__setModuleDefault) ||
        (Object.create
          ? function (o, v) {
              Object.defineProperty(o, "default", {
                enumerable: true,
                value: v,
              });
            }
          : function (o, v) {
              o["default"] = v;
            });
      var __importStar =
        (this && this.__importStar) ||
        function (mod) {
          if (mod && mod.__esModule) return mod;
          var result = {};
          if (mod != null)
            for (var k in mod)
              if (k !== "default" && Object.hasOwnProperty.call(mod, k))
                __createBinding(result, mod, k);
          __setModuleDefault(result, mod);
          return result;
        };
      var __awaiter =
        (this && this.__awaiter) ||
        function (thisArg, _arguments, P, generator) {
          function adopt(value) {
            return value instanceof P
              ? value
              : new P(function (resolve) {
                  resolve(value);
                });
          }
          return new (P || (P = Promise))(function (resolve, reject) {
            function fulfilled(value) {
              try {
                step(generator.next(value));
              } catch (e) {
                reject(e);
              }
            }
            function rejected(value) {
              try {
                step(generator["throw"](value));
              } catch (e) {
                reject(e);
              }
            }
            function step(result) {
              result.done
                ? resolve(result.value)
                : adopt(result.value).then(fulfilled, rejected);
            }
            step(
              (generator = generator.apply(thisArg, _arguments || [])).next(),
            );
          });
        };
      Object.defineProperty(exports, "__esModule", { value: true });
      exports.HttpClient =
        exports.isHttps =
        exports.HttpClientResponse =
        exports.HttpClientError =
        exports.getProxyUrl =
        exports.MediaTypes =
        exports.Headers =
        exports.HttpCodes =
          void 0;
      const http = __importStar(__nccwpck_require__(3685));
      const https = __importStar(__nccwpck_require__(5687));
      const pm = __importStar(__nccwpck_require__(1116));
      const tunnel = __importStar(__nccwpck_require__(4249));
      var HttpCodes;
      (function (HttpCodes) {
        HttpCodes[(HttpCodes["OK"] = 200)] = "OK";
        HttpCodes[(HttpCodes["MultipleChoices"] = 300)] = "MultipleChoices";
        HttpCodes[(HttpCodes["MovedPermanently"] = 301)] = "MovedPermanently";
        HttpCodes[(HttpCodes["ResourceMoved"] = 302)] = "ResourceMoved";
        HttpCodes[(HttpCodes["SeeOther"] = 303)] = "SeeOther";
        HttpCodes[(HttpCodes["NotModified"] = 304)] = "NotModified";
        HttpCodes[(HttpCodes["UseProxy"] = 305)] = "UseProxy";
        HttpCodes[(HttpCodes["SwitchProxy"] = 306)] = "SwitchProxy";
        HttpCodes[(HttpCodes["TemporaryRedirect"] = 307)] = "TemporaryRedirect";
        HttpCodes[(HttpCodes["PermanentRedirect"] = 308)] = "PermanentRedirect";
        HttpCodes[(HttpCodes["BadRequest"] = 400)] = "BadRequest";
        HttpCodes[(HttpCodes["Unauthorized"] = 401)] = "Unauthorized";
        HttpCodes[(HttpCodes["PaymentRequired"] = 402)] = "PaymentRequired";
        HttpCodes[(HttpCodes["Forbidden"] = 403)] = "Forbidden";
        HttpCodes[(HttpCodes["NotFound"] = 404)] = "NotFound";
        HttpCodes[(HttpCodes["MethodNotAllowed"] = 405)] = "MethodNotAllowed";
        HttpCodes[(HttpCodes["NotAcceptable"] = 406)] = "NotAcceptable";
        HttpCodes[(HttpCodes["ProxyAuthenticationRequired"] = 407)] =
          "ProxyAuthenticationRequired";
        HttpCodes[(HttpCodes["RequestTimeout"] = 408)] = "RequestTimeout";
        HttpCodes[(HttpCodes["Conflict"] = 409)] = "Conflict";
        HttpCodes[(HttpCodes["Gone"] = 410)] = "Gone";
        HttpCodes[(HttpCodes["TooManyRequests"] = 429)] = "TooManyRequests";
        HttpCodes[(HttpCodes["InternalServerError"] = 500)] =
          "InternalServerError";
        HttpCodes[(HttpCodes["NotImplemented"] = 501)] = "NotImplemented";
        HttpCodes[(HttpCodes["BadGateway"] = 502)] = "BadGateway";
        HttpCodes[(HttpCodes["ServiceUnavailable"] = 503)] =
          "ServiceUnavailable";
        HttpCodes[(HttpCodes["GatewayTimeout"] = 504)] = "GatewayTimeout";
      })((HttpCodes = exports.HttpCodes || (exports.HttpCodes = {})));
      var Headers;
      (function (Headers) {
        Headers["Accept"] = "accept";
        Headers["ContentType"] = "content-type";
      })((Headers = exports.Headers || (exports.Headers = {})));
      var MediaTypes;
      (function (MediaTypes) {
        MediaTypes["ApplicationJson"] = "application/json";
      })((MediaTypes = exports.MediaTypes || (exports.MediaTypes = {})));
      /**
       * Returns the proxy URL, depending upon the supplied url and proxy environment variables.
       * @param serverUrl  The server URL where the request will be sent. For example, https://api.github.com
       */
      function getProxyUrl(serverUrl) {
        const proxyUrl = pm.getProxyUrl(new URL(serverUrl));
        return proxyUrl ? proxyUrl.href : "";
      }
      exports.getProxyUrl = getProxyUrl;
      const HttpRedirectCodes = [
        HttpCodes.MovedPermanently,
        HttpCodes.ResourceMoved,
        HttpCodes.SeeOther,
        HttpCodes.TemporaryRedirect,
        HttpCodes.PermanentRedirect,
      ];
      const HttpResponseRetryCodes = [
        HttpCodes.BadGateway,
        HttpCodes.ServiceUnavailable,
        HttpCodes.GatewayTimeout,
      ];
      const RetryableHttpVerbs = ["OPTIONS", "GET", "DELETE", "HEAD"];
      const ExponentialBackoffCeiling = 10;
      const ExponentialBackoffTimeSlice = 5;
      class HttpClientError extends Error {
        constructor(message, statusCode) {
          super(message);
          this.name = "HttpClientError";
          this.statusCode = statusCode;
          Object.setPrototypeOf(this, HttpClientError.prototype);
        }
      }
      exports.HttpClientError = HttpClientError;
      class HttpClientResponse {
        constructor(message) {
          this.message = message;
        }
        readBody() {
          return __awaiter(this, void 0, void 0, function* () {
            return new Promise((resolve) =>
              __awaiter(this, void 0, void 0, function* () {
                let output = Buffer.alloc(0);
                this.message.on("data", (chunk) => {
                  output = Buffer.concat([output, chunk]);
                });
                this.message.on("end", () => {
                  resolve(output.toString());
                });
              }),
            );
          });
        }
      }
      exports.HttpClientResponse = HttpClientResponse;
      function isHttps(requestUrl) {
        const parsedUrl = new URL(requestUrl);
        return parsedUrl.protocol === "https:";
      }
      exports.isHttps = isHttps;
      class HttpClient {
        constructor(userAgent, handlers, requestOptions) {
          this._ignoreSslError = false;
          this._allowRedirects = true;
          this._allowRedirectDowngrade = false;
          this._maxRedirects = 50;
          this._allowRetries = false;
          this._maxRetries = 1;
          this._keepAlive = false;
          this._disposed = false;
          this.userAgent = userAgent;
          this.handlers = handlers || [];
          this.requestOptions = requestOptions;
          if (requestOptions) {
            if (requestOptions.ignoreSslError != null) {
              this._ignoreSslError = requestOptions.ignoreSslError;
            }
            this._socketTimeout = requestOptions.socketTimeout;
            if (requestOptions.allowRedirects != null) {
              this._allowRedirects = requestOptions.allowRedirects;
            }
            if (requestOptions.allowRedirectDowngrade != null) {
              this._allowRedirectDowngrade =
                requestOptions.allowRedirectDowngrade;
            }
            if (requestOptions.maxRedirects != null) {
              this._maxRedirects = Math.max(requestOptions.maxRedirects, 0);
            }
            if (requestOptions.keepAlive != null) {
              this._keepAlive = requestOptions.keepAlive;
            }
            if (requestOptions.allowRetries != null) {
              this._allowRetries = requestOptions.allowRetries;
            }
            if (requestOptions.maxRetries != null) {
              this._maxRetries = requestOptions.maxRetries;
            }
          }
        }
        options(requestUrl, additionalHeaders) {
          return __awaiter(this, void 0, void 0, function* () {
            return this.request(
              "OPTIONS",
              requestUrl,
              null,
              additionalHeaders || {},
            );
          });
        }
        get(requestUrl, additionalHeaders) {
          return __awaiter(this, void 0, void 0, function* () {
            return this.request(
              "GET",
              requestUrl,
              null,
              additionalHeaders || {},
            );
          });
        }
        del(requestUrl, additionalHeaders) {
          return __awaiter(this, void 0, void 0, function* () {
            return this.request(
              "DELETE",
              requestUrl,
              null,
              additionalHeaders || {},
            );
          });
        }
        post(requestUrl, data, additionalHeaders) {
          return __awaiter(this, void 0, void 0, function* () {
            return this.request(
              "POST",
              requestUrl,
              data,
              additionalHeaders || {},
            );
          });
        }
        patch(requestUrl, data, additionalHeaders) {
          return __awaiter(this, void 0, void 0, function* () {
            return this.request(
              "PATCH",
              requestUrl,
              data,
              additionalHeaders || {},
            );
          });
        }
        put(requestUrl, data, additionalHeaders) {
          return __awaiter(this, void 0, void 0, function* () {
            return this.request(
              "PUT",
              requestUrl,
              data,
              additionalHeaders || {},
            );
          });
        }
        head(requestUrl, additionalHeaders) {
          return __awaiter(this, void 0, void 0, function* () {
            return this.request(
              "HEAD",
              requestUrl,
              null,
              additionalHeaders || {},
            );
          });
        }
        sendStream(verb, requestUrl, stream, additionalHeaders) {
          return __awaiter(this, void 0, void 0, function* () {
            return this.request(verb, requestUrl, stream, additionalHeaders);
          });
        }
        /**
         * Gets a typed object from an endpoint
         * Be aware that not found returns a null.  Other errors (4xx, 5xx) reject the promise
         */
        getJson(requestUrl, additionalHeaders = {}) {
          return __awaiter(this, void 0, void 0, function* () {
            additionalHeaders[Headers.Accept] =
              this._getExistingOrDefaultHeader(
                additionalHeaders,
                Headers.Accept,
                MediaTypes.ApplicationJson,
              );
            const res = yield this.get(requestUrl, additionalHeaders);
            return this._processResponse(res, this.requestOptions);
          });
        }
        postJson(requestUrl, obj, additionalHeaders = {}) {
          return __awaiter(this, void 0, void 0, function* () {
            const data = JSON.stringify(obj, null, 2);
            additionalHeaders[Headers.Accept] =
              this._getExistingOrDefaultHeader(
                additionalHeaders,
                Headers.Accept,
                MediaTypes.ApplicationJson,
              );
            additionalHeaders[Headers.ContentType] =
              this._getExistingOrDefaultHeader(
                additionalHeaders,
                Headers.ContentType,
                MediaTypes.ApplicationJson,
              );
            const res = yield this.post(requestUrl, data, additionalHeaders);
            return this._processResponse(res, this.requestOptions);
          });
        }
        putJson(requestUrl, obj, additionalHeaders = {}) {
          return __awaiter(this, void 0, void 0, function* () {
            const data = JSON.stringify(obj, null, 2);
            additionalHeaders[Headers.Accept] =
              this._getExistingOrDefaultHeader(
                additionalHeaders,
                Headers.Accept,
                MediaTypes.ApplicationJson,
              );
            additionalHeaders[Headers.ContentType] =
              this._getExistingOrDefaultHeader(
                additionalHeaders,
                Headers.ContentType,
                MediaTypes.ApplicationJson,
              );
            const res = yield this.put(requestUrl, data, additionalHeaders);
            return this._processResponse(res, this.requestOptions);
          });
        }
        patchJson(requestUrl, obj, additionalHeaders = {}) {
          return __awaiter(this, void 0, void 0, function* () {
            const data = JSON.stringify(obj, null, 2);
            additionalHeaders[Headers.Accept] =
              this._getExistingOrDefaultHeader(
                additionalHeaders,
                Headers.Accept,
                MediaTypes.ApplicationJson,
              );
            additionalHeaders[Headers.ContentType] =
              this._getExistingOrDefaultHeader(
                additionalHeaders,
                Headers.ContentType,
                MediaTypes.ApplicationJson,
              );
            const res = yield this.patch(requestUrl, data, additionalHeaders);
            return this._processResponse(res, this.requestOptions);
          });
        }
        /**
         * Makes a raw http request.
         * All other methods such as get, post, patch, and request ultimately call this.
         * Prefer get, del, post and patch
         */
        request(verb, requestUrl, data, headers) {
          return __awaiter(this, void 0, void 0, function* () {
            if (this._disposed) {
              throw new Error("Client has already been disposed.");
            }
            const parsedUrl = new URL(requestUrl);
            let info = this._prepareRequest(verb, parsedUrl, headers);
            // Only perform retries on reads since writes may not be idempotent.
            const maxTries =
              this._allowRetries && RetryableHttpVerbs.includes(verb)
                ? this._maxRetries + 1
                : 1;
            let numTries = 0;
            let response;
            do {
              response = yield this.requestRaw(info, data);
              // Check if it's an authentication challenge
              if (
                response &&
                response.message &&
                response.message.statusCode === HttpCodes.Unauthorized
              ) {
                let authenticationHandler;
                for (const handler of this.handlers) {
                  if (handler.canHandleAuthentication(response)) {
                    authenticationHandler = handler;
                    break;
                  }
                }
                if (authenticationHandler) {
                  return authenticationHandler.handleAuthentication(
                    this,
                    info,
                    data,
                  );
                } else {
                  // We have received an unauthorized response but have no handlers to handle it.
                  // Let the response return to the caller.
                  return response;
                }
              }
              let redirectsRemaining = this._maxRedirects;
              while (
                response.message.statusCode &&
                HttpRedirectCodes.includes(response.message.statusCode) &&
                this._allowRedirects &&
                redirectsRemaining > 0
              ) {
                const redirectUrl = response.message.headers["location"];
                if (!redirectUrl) {
                  // if there's no location to redirect to, we won't
                  break;
                }
                const parsedRedirectUrl = new URL(redirectUrl);
                if (
                  parsedUrl.protocol === "https:" &&
                  parsedUrl.protocol !== parsedRedirectUrl.protocol &&
                  !this._allowRedirectDowngrade
                ) {
                  throw new Error(
                    "Redirect from HTTPS to HTTP protocol. This downgrade is not allowed for security reasons. If you want to allow this behavior, set the allowRedirectDowngrade option to true.",
                  );
                }
                // we need to finish reading the response before reassigning response
                // which will leak the open socket.
                yield response.readBody();
                // strip authorization header if redirected to a different hostname
                if (parsedRedirectUrl.hostname !== parsedUrl.hostname) {
                  for (const header in headers) {
                    // header names are case insensitive
                    if (header.toLowerCase() === "authorization") {
                      delete headers[header];
                    }
                  }
                }
                // let's make the request with the new redirectUrl
                info = this._prepareRequest(verb, parsedRedirectUrl, headers);
                response = yield this.requestRaw(info, data);
                redirectsRemaining--;
              }
              if (
                !response.message.statusCode ||
                !HttpResponseRetryCodes.includes(response.message.statusCode)
              ) {
                // If not a retry code, return immediately instead of retrying
                return response;
              }
              numTries += 1;
              if (numTries < maxTries) {
                yield response.readBody();
                yield this._performExponentialBackoff(numTries);
              }
            } while (numTries < maxTries);
            return response;
          });
        }
        /**
         * Needs to be called if keepAlive is set to true in request options.
         */
        dispose() {
          if (this._agent) {
            this._agent.destroy();
          }
          this._disposed = true;
        }
        /**
         * Raw request.
         * @param info
         * @param data
         */
        requestRaw(info, data) {
          return __awaiter(this, void 0, void 0, function* () {
            return new Promise((resolve, reject) => {
              function callbackForResult(err, res) {
                if (err) {
                  reject(err);
                } else if (!res) {
                  // If `err` is not passed, then `res` must be passed.
                  reject(new Error("Unknown error"));
                } else {
                  resolve(res);
                }
              }
              this.requestRawWithCallback(info, data, callbackForResult);
            });
          });
        }
        /**
         * Raw request with callback.
         * @param info
         * @param data
         * @param onResult
         */
        requestRawWithCallback(info, data, onResult) {
          if (typeof data === "string") {
            if (!info.options.headers) {
              info.options.headers = {};
            }
            info.options.headers["Content-Length"] = Buffer.byteLength(
              data,
              "utf8",
            );
          }
          let callbackCalled = false;
          function handleResult(err, res) {
            if (!callbackCalled) {
              callbackCalled = true;
              onResult(err, res);
            }
          }
          const req = info.httpModule.request(info.options, (msg) => {
            const res = new HttpClientResponse(msg);
            handleResult(undefined, res);
          });
          let socket;
          req.on("socket", (sock) => {
            socket = sock;
          });
          // If we ever get disconnected, we want the socket to timeout eventually
          req.setTimeout(this._socketTimeout || 3 * 60000, () => {
            if (socket) {
              socket.end();
            }
            handleResult(new Error(`Request timeout: ${info.options.path}`));
          });
          req.on("error", function (err) {
            // err has statusCode property
            // res should have headers
            handleResult(err);
          });
          if (data && typeof data === "string") {
            req.write(data, "utf8");
          }
          if (data && typeof data !== "string") {
            data.on("close", function () {
              req.end();
            });
            data.pipe(req);
          } else {
            req.end();
          }
        }
        /**
         * Gets an http agent. This function is useful when you need an http agent that handles
         * routing through a proxy server - depending upon the url and proxy environment variables.
         * @param serverUrl  The server URL where the request will be sent. For example, https://api.github.com
         */
        getAgent(serverUrl) {
          const parsedUrl = new URL(serverUrl);
          return this._getAgent(parsedUrl);
        }
        _prepareRequest(method, requestUrl, headers) {
          const info = {};
          info.parsedUrl = requestUrl;
          const usingSsl = info.parsedUrl.protocol === "https:";
          info.httpModule = usingSsl ? https : http;
          const defaultPort = usingSsl ? 443 : 80;
          info.options = {};
          info.options.host = info.parsedUrl.hostname;
          info.options.port = info.parsedUrl.port
            ? parseInt(info.parsedUrl.port)
            : defaultPort;
          info.options.path =
            (info.parsedUrl.pathname || "") + (info.parsedUrl.search || "");
          info.options.method = method;
          info.options.headers = this._mergeHeaders(headers);
          if (this.userAgent != null) {
            info.options.headers["user-agent"] = this.userAgent;
          }
          info.options.agent = this._getAgent(info.parsedUrl);
          // gives handlers an opportunity to participate
          if (this.handlers) {
            for (const handler of this.handlers) {
              handler.prepareRequest(info.options);
            }
          }
          return info;
        }
        _mergeHeaders(headers) {
          if (this.requestOptions && this.requestOptions.headers) {
            return Object.assign(
              {},
              lowercaseKeys(this.requestOptions.headers),
              lowercaseKeys(headers || {}),
            );
          }
          return lowercaseKeys(headers || {});
        }
        _getExistingOrDefaultHeader(additionalHeaders, header, _default) {
          let clientHeader;
          if (this.requestOptions && this.requestOptions.headers) {
            clientHeader = lowercaseKeys(this.requestOptions.headers)[header];
          }
          return additionalHeaders[header] || clientHeader || _default;
        }
        _getAgent(parsedUrl) {
          let agent;
          const proxyUrl = pm.getProxyUrl(parsedUrl);
          const useProxy = proxyUrl && proxyUrl.hostname;
          if (this._keepAlive && useProxy) {
            agent = this._proxyAgent;
          }
          if (this._keepAlive && !useProxy) {
            agent = this._agent;
          }
          // if agent is already assigned use that agent.
          if (agent) {
            return agent;
          }
          const usingSsl = parsedUrl.protocol === "https:";
          let maxSockets = 100;
          if (this.requestOptions) {
            maxSockets =
              this.requestOptions.maxSockets || http.globalAgent.maxSockets;
          }
          // This is `useProxy` again, but we need to check `proxyURl` directly for TypeScripts's flow analysis.
          if (proxyUrl && proxyUrl.hostname) {
            const agentOptions = {
              maxSockets,
              keepAlive: this._keepAlive,
              proxy: Object.assign(
                Object.assign(
                  {},
                  (proxyUrl.username || proxyUrl.password) && {
                    proxyAuth: `${proxyUrl.username}:${proxyUrl.password}`,
                  },
                ),
                { host: proxyUrl.hostname, port: proxyUrl.port },
              ),
            };
            let tunnelAgent;
            const overHttps = proxyUrl.protocol === "https:";
            if (usingSsl) {
              tunnelAgent = overHttps
                ? tunnel.httpsOverHttps
                : tunnel.httpsOverHttp;
            } else {
              tunnelAgent = overHttps
                ? tunnel.httpOverHttps
                : tunnel.httpOverHttp;
            }
            agent = tunnelAgent(agentOptions);
            this._proxyAgent = agent;
          }
          // if reusing agent across request and tunneling agent isn't assigned create a new agent
          if (this._keepAlive && !agent) {
            const options = { keepAlive: this._keepAlive, maxSockets };
            agent = usingSsl
              ? new https.Agent(options)
              : new http.Agent(options);
            this._agent = agent;
          }
          // if not using private agent and tunnel agent isn't setup then use global agent
          if (!agent) {
            agent = usingSsl ? https.globalAgent : http.globalAgent;
          }
          if (usingSsl && this._ignoreSslError) {
            // we don't want to set NODE_TLS_REJECT_UNAUTHORIZED=0 since that will affect request for entire process
            // http.RequestOptions doesn't expose a way to modify RequestOptions.agent.options
            // we have to cast it to any and change it directly
            agent.options = Object.assign(agent.options || {}, {
              rejectUnauthorized: false,
            });
          }
          return agent;
        }
        _performExponentialBackoff(retryNumber) {
          return __awaiter(this, void 0, void 0, function* () {
            retryNumber = Math.min(ExponentialBackoffCeiling, retryNumber);
            const ms = ExponentialBackoffTimeSlice * Math.pow(2, retryNumber);
            return new Promise((resolve) => setTimeout(() => resolve(), ms));
          });
        }
        _processResponse(res, options) {
          return __awaiter(this, void 0, void 0, function* () {
            return new Promise((resolve, reject) =>
              __awaiter(this, void 0, void 0, function* () {
                const statusCode = res.message.statusCode || 0;
                const response = {
                  statusCode,
                  result: null,
                  headers: {},
                };
                // not found leads to null obj returned
                if (statusCode === HttpCodes.NotFound) {
                  resolve(response);
                }
                // get the result from the body
                function dateTimeDeserializer(key, value) {
                  if (typeof value === "string") {
                    const a = new Date(value);
                    if (!isNaN(a.valueOf())) {
                      return a;
                    }
                  }
                  return value;
                }
                let obj;
                let contents;
                try {
                  contents = yield res.readBody();
                  if (contents && contents.length > 0) {
                    if (options && options.deserializeDates) {
                      obj = JSON.parse(contents, dateTimeDeserializer);
                    } else {
                      obj = JSON.parse(contents);
                    }
                    response.result = obj;
                  }
                  response.headers = res.message.headers;
                } catch (err) {
                  // Invalid resource (contents not json);  leaving result obj null
                }
                // note that 3xx redirects are handled by the http layer.
                if (statusCode > 299) {
                  let msg;
                  // if exception/error in body, attempt to get better error
                  if (obj && obj.message) {
                    msg = obj.message;
                  } else if (contents && contents.length > 0) {
                    // it may be the case that the exception is in the body message as string
                    msg = contents;
                  } else {
                    msg = `Failed request: (${statusCode})`;
                  }
                  const err = new HttpClientError(msg, statusCode);
                  err.result = response.result;
                  reject(err);
                } else {
                  resolve(response);
                }
              }),
            );
          });
        }
      }
      exports.HttpClient = HttpClient;
      const lowercaseKeys = (obj) =>
        Object.keys(obj).reduce(
          (c, k) => ((c[k.toLowerCase()] = obj[k]), c),
          {},
        );
      //# sourceMappingURL=index.js.map

      /***/
    },

    /***/ 1116: /***/ (__unused_webpack_module, exports) => {
      "use strict";

      Object.defineProperty(exports, "__esModule", { value: true });
      exports.checkBypass = exports.getProxyUrl = void 0;
      function getProxyUrl(reqUrl) {
        const usingSsl = reqUrl.protocol === "https:";
        if (checkBypass(reqUrl)) {
          return undefined;
        }
        const proxyVar = (() => {
          if (usingSsl) {
            return process.env["https_proxy"] || process.env["HTTPS_PROXY"];
          } else {
            return process.env["http_proxy"] || process.env["HTTP_PROXY"];
          }
        })();
        if (proxyVar) {
          return new URL(proxyVar);
        } else {
          return undefined;
        }
      }
      exports.getProxyUrl = getProxyUrl;
      function checkBypass(reqUrl) {
        if (!reqUrl.hostname) {
          return false;
        }
        const reqHost = reqUrl.hostname;
        if (isLoopbackAddress(reqHost)) {
          return true;
        }
        const noProxy =
          process.env["no_proxy"] || process.env["NO_PROXY"] || "";
        if (!noProxy) {
          return false;
        }
        // Determine the request port
        let reqPort;
        if (reqUrl.port) {
          reqPort = Number(reqUrl.port);
        } else if (reqUrl.protocol === "http:") {
          reqPort = 80;
        } else if (reqUrl.protocol === "https:") {
          reqPort = 443;
        }
        // Format the request hostname and hostname with port
        const upperReqHosts = [reqUrl.hostname.toUpperCase()];
        if (typeof reqPort === "number") {
          upperReqHosts.push(`${upperReqHosts[0]}:${reqPort}`);
        }
        // Compare request host against noproxy
        for (const upperNoProxyItem of noProxy
          .split(",")
          .map((x) => x.trim().toUpperCase())
          .filter((x) => x)) {
          if (
            upperNoProxyItem === "*" ||
            upperReqHosts.some(
              (x) =>
                x === upperNoProxyItem ||
                x.endsWith(`.${upperNoProxyItem}`) ||
                (upperNoProxyItem.startsWith(".") &&
                  x.endsWith(`${upperNoProxyItem}`)),
            )
          ) {
            return true;
          }
        }
        return false;
      }
      exports.checkBypass = checkBypass;
      function isLoopbackAddress(host) {
        const hostLower = host.toLowerCase();
        return (
          hostLower === "localhost" ||
          hostLower.startsWith("127.") ||
          hostLower.startsWith("[::1]") ||
          hostLower.startsWith("[0:0:0:0:0:0:0:1]")
        );
      }
      //# sourceMappingURL=proxy.js.map

      /***/
    },

    /***/ 1642: /***/ (module) => {
      "use strict";

      var __defProp = Object.defineProperty;
      var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
      var __getOwnPropNames = Object.getOwnPropertyNames;
      var __hasOwnProp = Object.prototype.hasOwnProperty;
      var __export = (target, all) => {
        for (var name in all)
          __defProp(target, name, { get: all[name], enumerable: true });
      };
      var __copyProps = (to, from, except, desc) => {
        if ((from && typeof from === "object") || typeof from === "function") {
          for (let key of __getOwnPropNames(from))
            if (!__hasOwnProp.call(to, key) && key !== except)
              __defProp(to, key, {
                get: () => from[key],
                enumerable:
                  !(desc = __getOwnPropDesc(from, key)) || desc.enumerable,
              });
        }
        return to;
      };
      var __toCommonJS = (mod) =>
        __copyProps(__defProp({}, "__esModule", { value: true }), mod);

      // pkg/dist-src/index.js
      var dist_src_exports = {};
      __export(dist_src_exports, {
        createTokenAuth: () => createTokenAuth,
      });
      module.exports = __toCommonJS(dist_src_exports);

      // pkg/dist-src/auth.js
      var REGEX_IS_INSTALLATION_LEGACY = /^v1\./;
      var REGEX_IS_INSTALLATION = /^ghs_/;
      var REGEX_IS_USER_TO_SERVER = /^ghu_/;
      async function auth(token) {
        const isApp = token.split(/\./).length === 3;
        const isInstallation =
          REGEX_IS_INSTALLATION_LEGACY.test(token) ||
          REGEX_IS_INSTALLATION.test(token);
        const isUserToServer = REGEX_IS_USER_TO_SERVER.test(token);
        const tokenType = isApp
          ? "app"
          : isInstallation
          ? "installation"
          : isUserToServer
          ? "user-to-server"
          : "oauth";
        return {
          type: "token",
          token,
          tokenType,
        };
      }

      // pkg/dist-src/with-authorization-prefix.js
      function withAuthorizationPrefix(token) {
        if (token.split(/\./).length === 3) {
          return `bearer ${token}`;
        }
        return `token ${token}`;
      }

      // pkg/dist-src/hook.js
      async function hook(token, request, route, parameters) {
        const endpoint = request.endpoint.merge(route, parameters);
        endpoint.headers.authorization = withAuthorizationPrefix(token);
        return request(endpoint);
      }

      // pkg/dist-src/index.js
      var createTokenAuth = function createTokenAuth2(token) {
        if (!token) {
          throw new Error(
            "[@octokit/auth-token] No token passed to createTokenAuth",
          );
        }
        if (typeof token !== "string") {
          throw new Error(
            "[@octokit/auth-token] Token passed to createTokenAuth is not a string",
          );
        }
        token = token.replace(/^(token|bearer) +/i, "");
        return Object.assign(auth.bind(null, token), {
          hook: hook.bind(null, token),
        });
      };
      // Annotate the CommonJS export names for ESM import in node:
      0 && 0;

      /***/
    },

    /***/ 8989: /***/ (
      module,
      __unused_webpack_exports,
      __nccwpck_require__,
    ) => {
      "use strict";

      var __defProp = Object.defineProperty;
      var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
      var __getOwnPropNames = Object.getOwnPropertyNames;
      var __hasOwnProp = Object.prototype.hasOwnProperty;
      var __export = (target, all) => {
        for (var name in all)
          __defProp(target, name, { get: all[name], enumerable: true });
      };
      var __copyProps = (to, from, except, desc) => {
        if ((from && typeof from === "object") || typeof from === "function") {
          for (let key of __getOwnPropNames(from))
            if (!__hasOwnProp.call(to, key) && key !== except)
              __defProp(to, key, {
                get: () => from[key],
                enumerable:
                  !(desc = __getOwnPropDesc(from, key)) || desc.enumerable,
              });
        }
        return to;
      };
      var __toCommonJS = (mod) =>
        __copyProps(__defProp({}, "__esModule", { value: true }), mod);

      // pkg/dist-src/index.js
      var dist_src_exports = {};
      __export(dist_src_exports, {
        Octokit: () => Octokit,
      });
      module.exports = __toCommonJS(dist_src_exports);
      var import_universal_user_agent = __nccwpck_require__(4930);
      var import_before_after_hook = __nccwpck_require__(4910);
      var import_request = __nccwpck_require__(7979);
      var import_graphql = __nccwpck_require__(4528);
      var import_auth_token = __nccwpck_require__(1642);

      // pkg/dist-src/version.js
      var VERSION = "5.0.0";

      // pkg/dist-src/index.js
      var Octokit = class {
        static {
          this.VERSION = VERSION;
        }
        static defaults(defaults) {
          const OctokitWithDefaults = class extends this {
            constructor(...args) {
              const options = args[0] || {};
              if (typeof defaults === "function") {
                super(defaults(options));
                return;
              }
              super(
                Object.assign(
                  {},
                  defaults,
                  options,
                  options.userAgent && defaults.userAgent
                    ? {
                        userAgent: `${options.userAgent} ${defaults.userAgent}`,
                      }
                    : null,
                ),
              );
            }
          };
          return OctokitWithDefaults;
        }
        static {
          this.plugins = [];
        }
        /**
         * Attach a plugin (or many) to your Octokit instance.
         *
         * @example
         * const API = Octokit.plugin(plugin1, plugin2, plugin3, ...)
         */
        static plugin(...newPlugins) {
          const currentPlugins = this.plugins;
          const NewOctokit = class extends this {
            static {
              this.plugins = currentPlugins.concat(
                newPlugins.filter((plugin) => !currentPlugins.includes(plugin)),
              );
            }
          };
          return NewOctokit;
        }
        constructor(options = {}) {
          const hook = new import_before_after_hook.Collection();
          const requestDefaults = {
            baseUrl: import_request.request.endpoint.DEFAULTS.baseUrl,
            headers: {},
            request: Object.assign({}, options.request, {
              // @ts-ignore internal usage only, no need to type
              hook: hook.bind(null, "request"),
            }),
            mediaType: {
              previews: [],
              format: "",
            },
          };
          requestDefaults.headers["user-agent"] = [
            options.userAgent,
            `octokit-core.js/${VERSION} ${(0,
            import_universal_user_agent.getUserAgent)()}`,
          ]
            .filter(Boolean)
            .join(" ");
          if (options.baseUrl) {
            requestDefaults.baseUrl = options.baseUrl;
          }
          if (options.previews) {
            requestDefaults.mediaType.previews = options.previews;
          }
          if (options.timeZone) {
            requestDefaults.headers["time-zone"] = options.timeZone;
          }
          this.request = import_request.request.defaults(requestDefaults);
          this.graphql = (0, import_graphql.withCustomRequest)(
            this.request,
          ).defaults(requestDefaults);
          this.log = Object.assign(
            {
              debug: () => {},
              info: () => {},
              warn: console.warn.bind(console),
              error: console.error.bind(console),
            },
            options.log,
          );
          this.hook = hook;
          if (!options.authStrategy) {
            if (!options.auth) {
              this.auth = async () => ({
                type: "unauthenticated",
              });
            } else {
              const auth = (0, import_auth_token.createTokenAuth)(options.auth);
              hook.wrap("request", auth.hook);
              this.auth = auth;
            }
          } else {
            const { authStrategy, ...otherOptions } = options;
            const auth = authStrategy(
              Object.assign(
                {
                  request: this.request,
                  log: this.log,
                  // we pass the current octokit instance as well as its constructor options
                  // to allow for authentication strategies that return a new octokit instance
                  // that shares the same internal state as the current one. The original
                  // requirement for this was the "event-octokit" authentication strategy
                  // of https://github.com/probot/octokit-auth-probot.
                  octokit: this,
                  octokitOptions: otherOptions,
                },
                options.auth,
              ),
            );
            hook.wrap("request", auth.hook);
            this.auth = auth;
          }
          const classConstructor = this.constructor;
          classConstructor.plugins.forEach((plugin) => {
            Object.assign(this, plugin(this, options));
          });
        }
      };
      // Annotate the CommonJS export names for ESM import in node:
      0 && 0;

      /***/
    },

    /***/ 679: /***/ (
      module,
      __unused_webpack_exports,
      __nccwpck_require__,
    ) => {
      "use strict";

      var __defProp = Object.defineProperty;
      var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
      var __getOwnPropNames = Object.getOwnPropertyNames;
      var __hasOwnProp = Object.prototype.hasOwnProperty;
      var __export = (target, all) => {
        for (var name in all)
          __defProp(target, name, { get: all[name], enumerable: true });
      };
      var __copyProps = (to, from, except, desc) => {
        if ((from && typeof from === "object") || typeof from === "function") {
          for (let key of __getOwnPropNames(from))
            if (!__hasOwnProp.call(to, key) && key !== except)
              __defProp(to, key, {
                get: () => from[key],
                enumerable:
                  !(desc = __getOwnPropDesc(from, key)) || desc.enumerable,
              });
        }
        return to;
      };
      var __toCommonJS = (mod) =>
        __copyProps(__defProp({}, "__esModule", { value: true }), mod);

      // pkg/dist-src/index.js
      var dist_src_exports = {};
      __export(dist_src_exports, {
        endpoint: () => endpoint,
      });
      module.exports = __toCommonJS(dist_src_exports);

      // pkg/dist-src/defaults.js
      var import_universal_user_agent = __nccwpck_require__(4930);

      // pkg/dist-src/version.js
      var VERSION = "9.0.0";

      // pkg/dist-src/defaults.js
      var userAgent = `octokit-endpoint.js/${VERSION} ${(0,
      import_universal_user_agent.getUserAgent)()}`;
      var DEFAULTS = {
        method: "GET",
        baseUrl: "https://api.github.com",
        headers: {
          accept: "application/vnd.github.v3+json",
          "user-agent": userAgent,
        },
        mediaType: {
          format: "",
        },
      };

      // pkg/dist-src/util/lowercase-keys.js
      function lowercaseKeys(object) {
        if (!object) {
          return {};
        }
        return Object.keys(object).reduce((newObj, key) => {
          newObj[key.toLowerCase()] = object[key];
          return newObj;
        }, {});
      }

      // pkg/dist-src/util/merge-deep.js
      var import_is_plain_object = __nccwpck_require__(366);
      function mergeDeep(defaults, options) {
        const result = Object.assign({}, defaults);
        Object.keys(options).forEach((key) => {
          if ((0, import_is_plain_object.isPlainObject)(options[key])) {
            if (!(key in defaults))
              Object.assign(result, { [key]: options[key] });
            else result[key] = mergeDeep(defaults[key], options[key]);
          } else {
            Object.assign(result, { [key]: options[key] });
          }
        });
        return result;
      }

      // pkg/dist-src/util/remove-undefined-properties.js
      function removeUndefinedProperties(obj) {
        for (const key in obj) {
          if (obj[key] === void 0) {
            delete obj[key];
          }
        }
        return obj;
      }

      // pkg/dist-src/merge.js
      function merge(defaults, route, options) {
        if (typeof route === "string") {
          let [method, url] = route.split(" ");
          options = Object.assign(
            url ? { method, url } : { url: method },
            options,
          );
        } else {
          options = Object.assign({}, route);
        }
        options.headers = lowercaseKeys(options.headers);
        removeUndefinedProperties(options);
        removeUndefinedProperties(options.headers);
        const mergedOptions = mergeDeep(defaults || {}, options);
        if (options.url === "/graphql") {
          if (defaults && defaults.mediaType.previews?.length) {
            mergedOptions.mediaType.previews = defaults.mediaType.previews
              .filter(
                (preview) =>
                  !mergedOptions.mediaType.previews.includes(preview),
              )
              .concat(mergedOptions.mediaType.previews);
          }
          mergedOptions.mediaType.previews = (
            mergedOptions.mediaType.previews || []
          ).map((preview) => preview.replace(/-preview/, ""));
        }
        return mergedOptions;
      }

      // pkg/dist-src/util/add-query-parameters.js
      function addQueryParameters(url, parameters) {
        const separator = /\?/.test(url) ? "&" : "?";
        const names = Object.keys(parameters);
        if (names.length === 0) {
          return url;
        }
        return (
          url +
          separator +
          names
            .map((name) => {
              if (name === "q") {
                return (
                  "q=" +
                  parameters.q.split("+").map(encodeURIComponent).join("+")
                );
              }
              return `${name}=${encodeURIComponent(parameters[name])}`;
            })
            .join("&")
        );
      }

      // pkg/dist-src/util/extract-url-variable-names.js
      var urlVariableRegex = /\{[^}]+\}/g;
      function removeNonChars(variableName) {
        return variableName.replace(/^\W+|\W+$/g, "").split(/,/);
      }
      function extractUrlVariableNames(url) {
        const matches = url.match(urlVariableRegex);
        if (!matches) {
          return [];
        }
        return matches.map(removeNonChars).reduce((a, b) => a.concat(b), []);
      }

      // pkg/dist-src/util/omit.js
      function omit(object, keysToOmit) {
        return Object.keys(object)
          .filter((option) => !keysToOmit.includes(option))
          .reduce((obj, key) => {
            obj[key] = object[key];
            return obj;
          }, {});
      }

      // pkg/dist-src/util/url-template.js
      function encodeReserved(str) {
        return str
          .split(/(%[0-9A-Fa-f]{2})/g)
          .map(function (part) {
            if (!/%[0-9A-Fa-f]/.test(part)) {
              part = encodeURI(part).replace(/%5B/g, "[").replace(/%5D/g, "]");
            }
            return part;
          })
          .join("");
      }
      function encodeUnreserved(str) {
        return encodeURIComponent(str).replace(/[!'()*]/g, function (c) {
          return "%" + c.charCodeAt(0).toString(16).toUpperCase();
        });
      }
      function encodeValue(operator, value, key) {
        value =
          operator === "+" || operator === "#"
            ? encodeReserved(value)
            : encodeUnreserved(value);
        if (key) {
          return encodeUnreserved(key) + "=" + value;
        } else {
          return value;
        }
      }
      function isDefined(value) {
        return value !== void 0 && value !== null;
      }
      function isKeyOperator(operator) {
        return operator === ";" || operator === "&" || operator === "?";
      }
      function getValues(context, operator, key, modifier) {
        var value = context[key],
          result = [];
        if (isDefined(value) && value !== "") {
          if (
            typeof value === "string" ||
            typeof value === "number" ||
            typeof value === "boolean"
          ) {
            value = value.toString();
            if (modifier && modifier !== "*") {
              value = value.substring(0, parseInt(modifier, 10));
            }
            result.push(
              encodeValue(operator, value, isKeyOperator(operator) ? key : ""),
            );
          } else {
            if (modifier === "*") {
              if (Array.isArray(value)) {
                value.filter(isDefined).forEach(function (value2) {
                  result.push(
                    encodeValue(
                      operator,
                      value2,
                      isKeyOperator(operator) ? key : "",
                    ),
                  );
                });
              } else {
                Object.keys(value).forEach(function (k) {
                  if (isDefined(value[k])) {
                    result.push(encodeValue(operator, value[k], k));
                  }
                });
              }
            } else {
              const tmp = [];
              if (Array.isArray(value)) {
                value.filter(isDefined).forEach(function (value2) {
                  tmp.push(encodeValue(operator, value2));
                });
              } else {
                Object.keys(value).forEach(function (k) {
                  if (isDefined(value[k])) {
                    tmp.push(encodeUnreserved(k));
                    tmp.push(encodeValue(operator, value[k].toString()));
                  }
                });
              }
              if (isKeyOperator(operator)) {
                result.push(encodeUnreserved(key) + "=" + tmp.join(","));
              } else if (tmp.length !== 0) {
                result.push(tmp.join(","));
              }
            }
          }
        } else {
          if (operator === ";") {
            if (isDefined(value)) {
              result.push(encodeUnreserved(key));
            }
          } else if (value === "" && (operator === "&" || operator === "?")) {
            result.push(encodeUnreserved(key) + "=");
          } else if (value === "") {
            result.push("");
          }
        }
        return result;
      }
      function parseUrl(template) {
        return {
          expand: expand.bind(null, template),
        };
      }
      function expand(template, context) {
        var operators = ["+", "#", ".", "/", ";", "?", "&"];
        return template.replace(
          /\{([^\{\}]+)\}|([^\{\}]+)/g,
          function (_, expression, literal) {
            if (expression) {
              let operator = "";
              const values = [];
              if (operators.indexOf(expression.charAt(0)) !== -1) {
                operator = expression.charAt(0);
                expression = expression.substr(1);
              }
              expression.split(/,/g).forEach(function (variable) {
                var tmp = /([^:\*]*)(?::(\d+)|(\*))?/.exec(variable);
                values.push(
                  getValues(context, operator, tmp[1], tmp[2] || tmp[3]),
                );
              });
              if (operator && operator !== "+") {
                var separator = ",";
                if (operator === "?") {
                  separator = "&";
                } else if (operator !== "#") {
                  separator = operator;
                }
                return (
                  (values.length !== 0 ? operator : "") + values.join(separator)
                );
              } else {
                return values.join(",");
              }
            } else {
              return encodeReserved(literal);
            }
          },
        );
      }

      // pkg/dist-src/parse.js
      function parse(options) {
        let method = options.method.toUpperCase();
        let url = (options.url || "/").replace(/:([a-z]\w+)/g, "{$1}");
        let headers = Object.assign({}, options.headers);
        let body;
        let parameters = omit(options, [
          "method",
          "baseUrl",
          "url",
          "headers",
          "request",
          "mediaType",
        ]);
        const urlVariableNames = extractUrlVariableNames(url);
        url = parseUrl(url).expand(parameters);
        if (!/^http/.test(url)) {
          url = options.baseUrl + url;
        }
        const omittedParameters = Object.keys(options)
          .filter((option) => urlVariableNames.includes(option))
          .concat("baseUrl");
        const remainingParameters = omit(parameters, omittedParameters);
        const isBinaryRequest = /application\/octet-stream/i.test(
          headers.accept,
        );
        if (!isBinaryRequest) {
          if (options.mediaType.format) {
            headers.accept = headers.accept
              .split(/,/)
              .map((format) =>
                format.replace(
                  /application\/vnd(\.\w+)(\.v3)?(\.\w+)?(\+json)?$/,
                  `application/vnd$1$2.${options.mediaType.format}`,
                ),
              )
              .join(",");
          }
          if (url.endsWith("/graphql")) {
            if (options.mediaType.previews?.length) {
              const previewsFromAcceptHeader =
                headers.accept.match(/[\w-]+(?=-preview)/g) || [];
              headers.accept = previewsFromAcceptHeader
                .concat(options.mediaType.previews)
                .map((preview) => {
                  const format = options.mediaType.format
                    ? `.${options.mediaType.format}`
                    : "+json";
                  return `application/vnd.github.${preview}-preview${format}`;
                })
                .join(",");
            }
          }
        }
        if (["GET", "HEAD"].includes(method)) {
          url = addQueryParameters(url, remainingParameters);
        } else {
          if ("data" in remainingParameters) {
            body = remainingParameters.data;
          } else {
            if (Object.keys(remainingParameters).length) {
              body = remainingParameters;
            }
          }
        }
        if (!headers["content-type"] && typeof body !== "undefined") {
          headers["content-type"] = "application/json; charset=utf-8";
        }
        if (["PATCH", "PUT"].includes(method) && typeof body === "undefined") {
          body = "";
        }
        return Object.assign(
          { method, url, headers },
          typeof body !== "undefined" ? { body } : null,
          options.request ? { request: options.request } : null,
        );
      }

      // pkg/dist-src/endpoint-with-defaults.js
      function endpointWithDefaults(defaults, route, options) {
        return parse(merge(defaults, route, options));
      }

      // pkg/dist-src/with-defaults.js
      function withDefaults(oldDefaults, newDefaults) {
        const DEFAULTS2 = merge(oldDefaults, newDefaults);
        const endpoint2 = endpointWithDefaults.bind(null, DEFAULTS2);
        return Object.assign(endpoint2, {
          DEFAULTS: DEFAULTS2,
          defaults: withDefaults.bind(null, DEFAULTS2),
          merge: merge.bind(null, DEFAULTS2),
          parse,
        });
      }

      // pkg/dist-src/index.js
      var endpoint = withDefaults(null, DEFAULTS);
      // Annotate the CommonJS export names for ESM import in node:
      0 && 0;

      /***/
    },

    /***/ 4528: /***/ (
      module,
      __unused_webpack_exports,
      __nccwpck_require__,
    ) => {
      "use strict";

      var __defProp = Object.defineProperty;
      var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
      var __getOwnPropNames = Object.getOwnPropertyNames;
      var __hasOwnProp = Object.prototype.hasOwnProperty;
      var __export = (target, all) => {
        for (var name in all)
          __defProp(target, name, { get: all[name], enumerable: true });
      };
      var __copyProps = (to, from, except, desc) => {
        if ((from && typeof from === "object") || typeof from === "function") {
          for (let key of __getOwnPropNames(from))
            if (!__hasOwnProp.call(to, key) && key !== except)
              __defProp(to, key, {
                get: () => from[key],
                enumerable:
                  !(desc = __getOwnPropDesc(from, key)) || desc.enumerable,
              });
        }
        return to;
      };
      var __toCommonJS = (mod) =>
        __copyProps(__defProp({}, "__esModule", { value: true }), mod);

      // pkg/dist-src/index.js
      var dist_src_exports = {};
      __export(dist_src_exports, {
        GraphqlResponseError: () => GraphqlResponseError,
        graphql: () => graphql2,
        withCustomRequest: () => withCustomRequest,
      });
      module.exports = __toCommonJS(dist_src_exports);
      var import_request3 = __nccwpck_require__(7979);
      var import_universal_user_agent = __nccwpck_require__(4930);

      // pkg/dist-src/version.js
      var VERSION = "7.0.1";

      // pkg/dist-src/with-defaults.js
      var import_request2 = __nccwpck_require__(7979);

      // pkg/dist-src/graphql.js
      var import_request = __nccwpck_require__(7979);

      // pkg/dist-src/error.js
      function _buildMessageForResponseErrors(data) {
        return (
          `Request failed due to following response errors:
` + data.errors.map((e) => ` - ${e.message}`).join("\n")
        );
      }
      var GraphqlResponseError = class extends Error {
        constructor(request2, headers, response) {
          super(_buildMessageForResponseErrors(response));
          this.request = request2;
          this.headers = headers;
          this.response = response;
          this.name = "GraphqlResponseError";
          this.errors = response.errors;
          this.data = response.data;
          if (Error.captureStackTrace) {
            Error.captureStackTrace(this, this.constructor);
          }
        }
      };

      // pkg/dist-src/graphql.js
      var NON_VARIABLE_OPTIONS = [
        "method",
        "baseUrl",
        "url",
        "headers",
        "request",
        "query",
        "mediaType",
      ];
      var FORBIDDEN_VARIABLE_OPTIONS = ["query", "method", "url"];
      var GHES_V3_SUFFIX_REGEX = /\/api\/v3\/?$/;
      function graphql(request2, query, options) {
        if (options) {
          if (typeof query === "string" && "query" in options) {
            return Promise.reject(
              new Error(
                `[@octokit/graphql] "query" cannot be used as variable name`,
              ),
            );
          }
          for (const key in options) {
            if (!FORBIDDEN_VARIABLE_OPTIONS.includes(key)) continue;
            return Promise.reject(
              new Error(
                `[@octokit/graphql] "${key}" cannot be used as variable name`,
              ),
            );
          }
        }
        const parsedOptions =
          typeof query === "string" ? Object.assign({ query }, options) : query;
        const requestOptions = Object.keys(parsedOptions).reduce(
          (result, key) => {
            if (NON_VARIABLE_OPTIONS.includes(key)) {
              result[key] = parsedOptions[key];
              return result;
            }
            if (!result.variables) {
              result.variables = {};
            }
            result.variables[key] = parsedOptions[key];
            return result;
          },
          {},
        );
        const baseUrl =
          parsedOptions.baseUrl || request2.endpoint.DEFAULTS.baseUrl;
        if (GHES_V3_SUFFIX_REGEX.test(baseUrl)) {
          requestOptions.url = baseUrl.replace(
            GHES_V3_SUFFIX_REGEX,
            "/api/graphql",
          );
        }
        return request2(requestOptions).then((response) => {
          if (response.data.errors) {
            const headers = {};
            for (const key of Object.keys(response.headers)) {
              headers[key] = response.headers[key];
            }
            throw new GraphqlResponseError(
              requestOptions,
              headers,
              response.data,
            );
          }
          return response.data.data;
        });
      }

      // pkg/dist-src/with-defaults.js
      function withDefaults(request2, newDefaults) {
        const newRequest = request2.defaults(newDefaults);
        const newApi = (query, options) => {
          return graphql(newRequest, query, options);
        };
        return Object.assign(newApi, {
          defaults: withDefaults.bind(null, newRequest),
          endpoint: newRequest.endpoint,
        });
      }

      // pkg/dist-src/index.js
      var graphql2 = withDefaults(import_request3.request, {
        headers: {
          "user-agent": `octokit-graphql.js/${VERSION} ${(0,
          import_universal_user_agent.getUserAgent)()}`,
        },
        method: "POST",
        url: "/graphql",
      });
      function withCustomRequest(customRequest) {
        return withDefaults(customRequest, {
          method: "POST",
          url: "/graphql",
        });
      }
      // Annotate the CommonJS export names for ESM import in node:
      0 && 0;

      /***/
    },

    /***/ 1369: /***/ (module) => {
      "use strict";

      var __defProp = Object.defineProperty;
      var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
      var __getOwnPropNames = Object.getOwnPropertyNames;
      var __hasOwnProp = Object.prototype.hasOwnProperty;
      var __export = (target, all) => {
        for (var name in all)
          __defProp(target, name, { get: all[name], enumerable: true });
      };
      var __copyProps = (to, from, except, desc) => {
        if ((from && typeof from === "object") || typeof from === "function") {
          for (let key of __getOwnPropNames(from))
            if (!__hasOwnProp.call(to, key) && key !== except)
              __defProp(to, key, {
                get: () => from[key],
                enumerable:
                  !(desc = __getOwnPropDesc(from, key)) || desc.enumerable,
              });
        }
        return to;
      };
      var __toCommonJS = (mod) =>
        __copyProps(__defProp({}, "__esModule", { value: true }), mod);

      // pkg/dist-src/index.js
      var dist_src_exports = {};
      __export(dist_src_exports, {
        composePaginateRest: () => composePaginateRest,
        isPaginatingEndpoint: () => isPaginatingEndpoint,
        paginateRest: () => paginateRest,
        paginatingEndpoints: () => paginatingEndpoints,
      });
      module.exports = __toCommonJS(dist_src_exports);

      // pkg/dist-src/version.js
      var VERSION = "8.0.0";

      // pkg/dist-src/normalize-paginated-list-response.js
      function normalizePaginatedListResponse(response) {
        if (!response.data) {
          return {
            ...response,
            data: [],
          };
        }
        const responseNeedsNormalization =
          "total_count" in response.data && !("url" in response.data);
        if (!responseNeedsNormalization) return response;
        const incompleteResults = response.data.incomplete_results;
        const repositorySelection = response.data.repository_selection;
        const totalCount = response.data.total_count;
        delete response.data.incomplete_results;
        delete response.data.repository_selection;
        delete response.data.total_count;
        const namespaceKey = Object.keys(response.data)[0];
        const data = response.data[namespaceKey];
        response.data = data;
        if (typeof incompleteResults !== "undefined") {
          response.data.incomplete_results = incompleteResults;
        }
        if (typeof repositorySelection !== "undefined") {
          response.data.repository_selection = repositorySelection;
        }
        response.data.total_count = totalCount;
        return response;
      }

      // pkg/dist-src/iterator.js
      function iterator(octokit, route, parameters) {
        const options =
          typeof route === "function"
            ? route.endpoint(parameters)
            : octokit.request.endpoint(route, parameters);
        const requestMethod =
          typeof route === "function" ? route : octokit.request;
        const method = options.method;
        const headers = options.headers;
        let url = options.url;
        return {
          [Symbol.asyncIterator]: () => ({
            async next() {
              if (!url) return { done: true };
              try {
                const response = await requestMethod({ method, url, headers });
                const normalizedResponse =
                  normalizePaginatedListResponse(response);
                url = ((normalizedResponse.headers.link || "").match(
                  /<([^>]+)>;\s*rel="next"/,
                ) || [])[1];
                return { value: normalizedResponse };
              } catch (error) {
                if (error.status !== 409) throw error;
                url = "";
                return {
                  value: {
                    status: 200,
                    headers: {},
                    data: [],
                  },
                };
              }
            },
          }),
        };
      }

      // pkg/dist-src/paginate.js
      function paginate(octokit, route, parameters, mapFn) {
        if (typeof parameters === "function") {
          mapFn = parameters;
          parameters = void 0;
        }
        return gather(
          octokit,
          [],
          iterator(octokit, route, parameters)[Symbol.asyncIterator](),
          mapFn,
        );
      }
      function gather(octokit, results, iterator2, mapFn) {
        return iterator2.next().then((result) => {
          if (result.done) {
            return results;
          }
          let earlyExit = false;
          function done() {
            earlyExit = true;
          }
          results = results.concat(
            mapFn ? mapFn(result.value, done) : result.value.data,
          );
          if (earlyExit) {
            return results;
          }
          return gather(octokit, results, iterator2, mapFn);
        });
      }

      // pkg/dist-src/compose-paginate.js
      var composePaginateRest = Object.assign(paginate, {
        iterator,
      });

      // pkg/dist-src/generated/paginating-endpoints.js
      var paginatingEndpoints = [
        "GET /app/hook/deliveries",
        "GET /app/installation-requests",
        "GET /app/installations",
        "GET /enterprises/{enterprise}/dependabot/alerts",
        "GET /enterprises/{enterprise}/secret-scanning/alerts",
        "GET /events",
        "GET /gists",
        "GET /gists/public",
        "GET /gists/starred",
        "GET /gists/{gist_id}/comments",
        "GET /gists/{gist_id}/commits",
        "GET /gists/{gist_id}/forks",
        "GET /installation/repositories",
        "GET /issues",
        "GET /licenses",
        "GET /marketplace_listing/plans",
        "GET /marketplace_listing/plans/{plan_id}/accounts",
        "GET /marketplace_listing/stubbed/plans",
        "GET /marketplace_listing/stubbed/plans/{plan_id}/accounts",
        "GET /networks/{owner}/{repo}/events",
        "GET /notifications",
        "GET /organizations",
        "GET /organizations/{org}/personal-access-token-requests",
        "GET /organizations/{org}/personal-access-token-requests/{pat_request_id}/repositories",
        "GET /organizations/{org}/personal-access-tokens",
        "GET /organizations/{org}/personal-access-tokens/{pat_id}/repositories",
        "GET /orgs/{org}/actions/cache/usage-by-repository",
        "GET /orgs/{org}/actions/permissions/repositories",
        "GET /orgs/{org}/actions/required_workflows",
        "GET /orgs/{org}/actions/runners",
        "GET /orgs/{org}/actions/secrets",
        "GET /orgs/{org}/actions/secrets/{secret_name}/repositories",
        "GET /orgs/{org}/actions/variables",
        "GET /orgs/{org}/actions/variables/{name}/repositories",
        "GET /orgs/{org}/blocks",
        "GET /orgs/{org}/code-scanning/alerts",
        "GET /orgs/{org}/codespaces",
        "GET /orgs/{org}/codespaces/secrets",
        "GET /orgs/{org}/codespaces/secrets/{secret_name}/repositories",
        "GET /orgs/{org}/dependabot/alerts",
        "GET /orgs/{org}/dependabot/secrets",
        "GET /orgs/{org}/dependabot/secrets/{secret_name}/repositories",
        "GET /orgs/{org}/events",
        "GET /orgs/{org}/failed_invitations",
        "GET /orgs/{org}/hooks",
        "GET /orgs/{org}/hooks/{hook_id}/deliveries",
        "GET /orgs/{org}/installations",
        "GET /orgs/{org}/invitations",
        "GET /orgs/{org}/invitations/{invitation_id}/teams",
        "GET /orgs/{org}/issues",
        "GET /orgs/{org}/members",
        "GET /orgs/{org}/members/{username}/codespaces",
        "GET /orgs/{org}/migrations",
        "GET /orgs/{org}/migrations/{migration_id}/repositories",
        "GET /orgs/{org}/outside_collaborators",
        "GET /orgs/{org}/packages",
        "GET /orgs/{org}/packages/{package_type}/{package_name}/versions",
        "GET /orgs/{org}/projects",
        "GET /orgs/{org}/public_members",
        "GET /orgs/{org}/repos",
        "GET /orgs/{org}/rulesets",
        "GET /orgs/{org}/secret-scanning/alerts",
        "GET /orgs/{org}/teams",
        "GET /orgs/{org}/teams/{team_slug}/discussions",
        "GET /orgs/{org}/teams/{team_slug}/discussions/{discussion_number}/comments",
        "GET /orgs/{org}/teams/{team_slug}/discussions/{discussion_number}/comments/{comment_number}/reactions",
        "GET /orgs/{org}/teams/{team_slug}/discussions/{discussion_number}/reactions",
        "GET /orgs/{org}/teams/{team_slug}/invitations",
        "GET /orgs/{org}/teams/{team_slug}/members",
        "GET /orgs/{org}/teams/{team_slug}/projects",
        "GET /orgs/{org}/teams/{team_slug}/repos",
        "GET /orgs/{org}/teams/{team_slug}/teams",
        "GET /projects/columns/{column_id}/cards",
        "GET /projects/{project_id}/collaborators",
        "GET /projects/{project_id}/columns",
        "GET /repos/{org}/{repo}/actions/required_workflows",
        "GET /repos/{owner}/{repo}/actions/artifacts",
        "GET /repos/{owner}/{repo}/actions/caches",
        "GET /repos/{owner}/{repo}/actions/organization-secrets",
        "GET /repos/{owner}/{repo}/actions/organization-variables",
        "GET /repos/{owner}/{repo}/actions/required_workflows/{required_workflow_id_for_repo}/runs",
        "GET /repos/{owner}/{repo}/actions/runners",
        "GET /repos/{owner}/{repo}/actions/runs",
        "GET /repos/{owner}/{repo}/actions/runs/{run_id}/artifacts",
        "GET /repos/{owner}/{repo}/actions/runs/{run_id}/attempts/{attempt_number}/jobs",
        "GET /repos/{owner}/{repo}/actions/runs/{run_id}/jobs",
        "GET /repos/{owner}/{repo}/actions/secrets",
        "GET /repos/{owner}/{repo}/actions/variables",
        "GET /repos/{owner}/{repo}/actions/workflows",
        "GET /repos/{owner}/{repo}/actions/workflows/{workflow_id}/runs",
        "GET /repos/{owner}/{repo}/assignees",
        "GET /repos/{owner}/{repo}/branches",
        "GET /repos/{owner}/{repo}/check-runs/{check_run_id}/annotations",
        "GET /repos/{owner}/{repo}/check-suites/{check_suite_id}/check-runs",
        "GET /repos/{owner}/{repo}/code-scanning/alerts",
        "GET /repos/{owner}/{repo}/code-scanning/alerts/{alert_number}/instances",
        "GET /repos/{owner}/{repo}/code-scanning/analyses",
        "GET /repos/{owner}/{repo}/codespaces",
        "GET /repos/{owner}/{repo}/codespaces/devcontainers",
        "GET /repos/{owner}/{repo}/codespaces/secrets",
        "GET /repos/{owner}/{repo}/collaborators",
        "GET /repos/{owner}/{repo}/comments",
        "GET /repos/{owner}/{repo}/comments/{comment_id}/reactions",
        "GET /repos/{owner}/{repo}/commits",
        "GET /repos/{owner}/{repo}/commits/{commit_sha}/comments",
        "GET /repos/{owner}/{repo}/commits/{commit_sha}/pulls",
        "GET /repos/{owner}/{repo}/commits/{ref}/check-runs",
        "GET /repos/{owner}/{repo}/commits/{ref}/check-suites",
        "GET /repos/{owner}/{repo}/commits/{ref}/status",
        "GET /repos/{owner}/{repo}/commits/{ref}/statuses",
        "GET /repos/{owner}/{repo}/contributors",
        "GET /repos/{owner}/{repo}/dependabot/alerts",
        "GET /repos/{owner}/{repo}/dependabot/secrets",
        "GET /repos/{owner}/{repo}/deployments",
        "GET /repos/{owner}/{repo}/deployments/{deployment_id}/statuses",
        "GET /repos/{owner}/{repo}/environments",
        "GET /repos/{owner}/{repo}/environments/{environment_name}/deployment-branch-policies",
        "GET /repos/{owner}/{repo}/environments/{environment_name}/deployment_protection_rules/apps",
        "GET /repos/{owner}/{repo}/events",
        "GET /repos/{owner}/{repo}/forks",
        "GET /repos/{owner}/{repo}/hooks",
        "GET /repos/{owner}/{repo}/hooks/{hook_id}/deliveries",
        "GET /repos/{owner}/{repo}/invitations",
        "GET /repos/{owner}/{repo}/issues",
        "GET /repos/{owner}/{repo}/issues/comments",
        "GET /repos/{owner}/{repo}/issues/comments/{comment_id}/reactions",
        "GET /repos/{owner}/{repo}/issues/events",
        "GET /repos/{owner}/{repo}/issues/{issue_number}/comments",
        "GET /repos/{owner}/{repo}/issues/{issue_number}/events",
        "GET /repos/{owner}/{repo}/issues/{issue_number}/labels",
        "GET /repos/{owner}/{repo}/issues/{issue_number}/reactions",
        "GET /repos/{owner}/{repo}/issues/{issue_number}/timeline",
        "GET /repos/{owner}/{repo}/keys",
        "GET /repos/{owner}/{repo}/labels",
        "GET /repos/{owner}/{repo}/milestones",
        "GET /repos/{owner}/{repo}/milestones/{milestone_number}/labels",
        "GET /repos/{owner}/{repo}/notifications",
        "GET /repos/{owner}/{repo}/pages/builds",
        "GET /repos/{owner}/{repo}/projects",
        "GET /repos/{owner}/{repo}/pulls",
        "GET /repos/{owner}/{repo}/pulls/comments",
        "GET /repos/{owner}/{repo}/pulls/comments/{comment_id}/reactions",
        "GET /repos/{owner}/{repo}/pulls/{pull_number}/comments",
        "GET /repos/{owner}/{repo}/pulls/{pull_number}/commits",
        "GET /repos/{owner}/{repo}/pulls/{pull_number}/files",
        "GET /repos/{owner}/{repo}/pulls/{pull_number}/reviews",
        "GET /repos/{owner}/{repo}/pulls/{pull_number}/reviews/{review_id}/comments",
        "GET /repos/{owner}/{repo}/releases",
        "GET /repos/{owner}/{repo}/releases/{release_id}/assets",
        "GET /repos/{owner}/{repo}/releases/{release_id}/reactions",
        "GET /repos/{owner}/{repo}/rules/branches/{branch}",
        "GET /repos/{owner}/{repo}/rulesets",
        "GET /repos/{owner}/{repo}/secret-scanning/alerts",
        "GET /repos/{owner}/{repo}/secret-scanning/alerts/{alert_number}/locations",
        "GET /repos/{owner}/{repo}/security-advisories",
        "GET /repos/{owner}/{repo}/stargazers",
        "GET /repos/{owner}/{repo}/subscribers",
        "GET /repos/{owner}/{repo}/tags",
        "GET /repos/{owner}/{repo}/teams",
        "GET /repos/{owner}/{repo}/topics",
        "GET /repositories",
        "GET /repositories/{repository_id}/environments/{environment_name}/secrets",
        "GET /repositories/{repository_id}/environments/{environment_name}/variables",
        "GET /search/code",
        "GET /search/commits",
        "GET /search/issues",
        "GET /search/labels",
        "GET /search/repositories",
        "GET /search/topics",
        "GET /search/users",
        "GET /teams/{team_id}/discussions",
        "GET /teams/{team_id}/discussions/{discussion_number}/comments",
        "GET /teams/{team_id}/discussions/{discussion_number}/comments/{comment_number}/reactions",
        "GET /teams/{team_id}/discussions/{discussion_number}/reactions",
        "GET /teams/{team_id}/invitations",
        "GET /teams/{team_id}/members",
        "GET /teams/{team_id}/projects",
        "GET /teams/{team_id}/repos",
        "GET /teams/{team_id}/teams",
        "GET /user/blocks",
        "GET /user/codespaces",
        "GET /user/codespaces/secrets",
        "GET /user/emails",
        "GET /user/followers",
        "GET /user/following",
        "GET /user/gpg_keys",
        "GET /user/installations",
        "GET /user/installations/{installation_id}/repositories",
        "GET /user/issues",
        "GET /user/keys",
        "GET /user/marketplace_purchases",
        "GET /user/marketplace_purchases/stubbed",
        "GET /user/memberships/orgs",
        "GET /user/migrations",
        "GET /user/migrations/{migration_id}/repositories",
        "GET /user/orgs",
        "GET /user/packages",
        "GET /user/packages/{package_type}/{package_name}/versions",
        "GET /user/public_emails",
        "GET /user/repos",
        "GET /user/repository_invitations",
        "GET /user/social_accounts",
        "GET /user/ssh_signing_keys",
        "GET /user/starred",
        "GET /user/subscriptions",
        "GET /user/teams",
        "GET /users",
        "GET /users/{username}/events",
        "GET /users/{username}/events/orgs/{org}",
        "GET /users/{username}/events/public",
        "GET /users/{username}/followers",
        "GET /users/{username}/following",
        "GET /users/{username}/gists",
        "GET /users/{username}/gpg_keys",
        "GET /users/{username}/keys",
        "GET /users/{username}/orgs",
        "GET /users/{username}/packages",
        "GET /users/{username}/projects",
        "GET /users/{username}/received_events",
        "GET /users/{username}/received_events/public",
        "GET /users/{username}/repos",
        "GET /users/{username}/social_accounts",
        "GET /users/{username}/ssh_signing_keys",
        "GET /users/{username}/starred",
        "GET /users/{username}/subscriptions",
      ];

      // pkg/dist-src/paginating-endpoints.js
      function isPaginatingEndpoint(arg) {
        if (typeof arg === "string") {
          return paginatingEndpoints.includes(arg);
        } else {
          return false;
        }
      }

      // pkg/dist-src/index.js
      function paginateRest(octokit) {
        return {
          paginate: Object.assign(paginate.bind(null, octokit), {
            iterator: iterator.bind(null, octokit),
          }),
        };
      }
      paginateRest.VERSION = VERSION;
      // Annotate the CommonJS export names for ESM import in node:
      0 && 0;

      /***/
    },

    /***/ 9680: /***/ (module) => {
      "use strict";

      var __defProp = Object.defineProperty;
      var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
      var __getOwnPropNames = Object.getOwnPropertyNames;
      var __hasOwnProp = Object.prototype.hasOwnProperty;
      var __export = (target, all) => {
        for (var name in all)
          __defProp(target, name, { get: all[name], enumerable: true });
      };
      var __copyProps = (to, from, except, desc) => {
        if ((from && typeof from === "object") || typeof from === "function") {
          for (let key of __getOwnPropNames(from))
            if (!__hasOwnProp.call(to, key) && key !== except)
              __defProp(to, key, {
                get: () => from[key],
                enumerable:
                  !(desc = __getOwnPropDesc(from, key)) || desc.enumerable,
              });
        }
        return to;
      };
      var __toCommonJS = (mod) =>
        __copyProps(__defProp({}, "__esModule", { value: true }), mod);

      // pkg/dist-src/index.js
      var dist_src_exports = {};
      __export(dist_src_exports, {
        requestLog: () => requestLog,
      });
      module.exports = __toCommonJS(dist_src_exports);

      // pkg/dist-src/version.js
      var VERSION = "4.0.0";

      // pkg/dist-src/index.js
      function requestLog(octokit) {
        octokit.hook.wrap("request", (request, options) => {
          octokit.log.debug("request", options);
          const start = Date.now();
          const requestOptions = octokit.request.endpoint.parse(options);
          const path = requestOptions.url.replace(options.baseUrl, "");
          return request(options)
            .then((response) => {
              octokit.log.info(
                `${requestOptions.method} ${path} - ${response.status} in ${
                  Date.now() - start
                }ms`,
              );
              return response;
            })
            .catch((error) => {
              octokit.log.info(
                `${requestOptions.method} ${path} - ${error.status} in ${
                  Date.now() - start
                }ms`,
              );
              throw error;
            });
        });
      }
      requestLog.VERSION = VERSION;
      // Annotate the CommonJS export names for ESM import in node:
      0 && 0;

      /***/
    },

    /***/ 2254: /***/ (module) => {
      "use strict";

      var __defProp = Object.defineProperty;
      var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
      var __getOwnPropNames = Object.getOwnPropertyNames;
      var __hasOwnProp = Object.prototype.hasOwnProperty;
      var __export = (target, all) => {
        for (var name in all)
          __defProp(target, name, { get: all[name], enumerable: true });
      };
      var __copyProps = (to, from, except, desc) => {
        if ((from && typeof from === "object") || typeof from === "function") {
          for (let key of __getOwnPropNames(from))
            if (!__hasOwnProp.call(to, key) && key !== except)
              __defProp(to, key, {
                get: () => from[key],
                enumerable:
                  !(desc = __getOwnPropDesc(from, key)) || desc.enumerable,
              });
        }
        return to;
      };
      var __toCommonJS = (mod) =>
        __copyProps(__defProp({}, "__esModule", { value: true }), mod);

      // pkg/dist-src/index.js
      var dist_src_exports = {};
      __export(dist_src_exports, {
        legacyRestEndpointMethods: () => legacyRestEndpointMethods,
        restEndpointMethods: () => restEndpointMethods,
      });
      module.exports = __toCommonJS(dist_src_exports);

      // pkg/dist-src/version.js
      var VERSION = "9.0.0";

      // pkg/dist-src/generated/endpoints.js
      var Endpoints = {
        actions: {
          addCustomLabelsToSelfHostedRunnerForOrg: [
            "POST /orgs/{org}/actions/runners/{runner_id}/labels",
          ],
          addCustomLabelsToSelfHostedRunnerForRepo: [
            "POST /repos/{owner}/{repo}/actions/runners/{runner_id}/labels",
          ],
          addSelectedRepoToOrgSecret: [
            "PUT /orgs/{org}/actions/secrets/{secret_name}/repositories/{repository_id}",
          ],
          addSelectedRepoToOrgVariable: [
            "PUT /orgs/{org}/actions/variables/{name}/repositories/{repository_id}",
          ],
          addSelectedRepoToRequiredWorkflow: [
            "PUT /orgs/{org}/actions/required_workflows/{required_workflow_id}/repositories/{repository_id}",
          ],
          approveWorkflowRun: [
            "POST /repos/{owner}/{repo}/actions/runs/{run_id}/approve",
          ],
          cancelWorkflowRun: [
            "POST /repos/{owner}/{repo}/actions/runs/{run_id}/cancel",
          ],
          createEnvironmentVariable: [
            "POST /repositories/{repository_id}/environments/{environment_name}/variables",
          ],
          createOrUpdateEnvironmentSecret: [
            "PUT /repositories/{repository_id}/environments/{environment_name}/secrets/{secret_name}",
          ],
          createOrUpdateOrgSecret: [
            "PUT /orgs/{org}/actions/secrets/{secret_name}",
          ],
          createOrUpdateRepoSecret: [
            "PUT /repos/{owner}/{repo}/actions/secrets/{secret_name}",
          ],
          createOrgVariable: ["POST /orgs/{org}/actions/variables"],
          createRegistrationTokenForOrg: [
            "POST /orgs/{org}/actions/runners/registration-token",
          ],
          createRegistrationTokenForRepo: [
            "POST /repos/{owner}/{repo}/actions/runners/registration-token",
          ],
          createRemoveTokenForOrg: [
            "POST /orgs/{org}/actions/runners/remove-token",
          ],
          createRemoveTokenForRepo: [
            "POST /repos/{owner}/{repo}/actions/runners/remove-token",
          ],
          createRepoVariable: ["POST /repos/{owner}/{repo}/actions/variables"],
          createRequiredWorkflow: [
            "POST /orgs/{org}/actions/required_workflows",
          ],
          createWorkflowDispatch: [
            "POST /repos/{owner}/{repo}/actions/workflows/{workflow_id}/dispatches",
          ],
          deleteActionsCacheById: [
            "DELETE /repos/{owner}/{repo}/actions/caches/{cache_id}",
          ],
          deleteActionsCacheByKey: [
            "DELETE /repos/{owner}/{repo}/actions/caches{?key,ref}",
          ],
          deleteArtifact: [
            "DELETE /repos/{owner}/{repo}/actions/artifacts/{artifact_id}",
          ],
          deleteEnvironmentSecret: [
            "DELETE /repositories/{repository_id}/environments/{environment_name}/secrets/{secret_name}",
          ],
          deleteEnvironmentVariable: [
            "DELETE /repositories/{repository_id}/environments/{environment_name}/variables/{name}",
          ],
          deleteOrgSecret: ["DELETE /orgs/{org}/actions/secrets/{secret_name}"],
          deleteOrgVariable: ["DELETE /orgs/{org}/actions/variables/{name}"],
          deleteRepoSecret: [
            "DELETE /repos/{owner}/{repo}/actions/secrets/{secret_name}",
          ],
          deleteRepoVariable: [
            "DELETE /repos/{owner}/{repo}/actions/variables/{name}",
          ],
          deleteRequiredWorkflow: [
            "DELETE /orgs/{org}/actions/required_workflows/{required_workflow_id}",
          ],
          deleteSelfHostedRunnerFromOrg: [
            "DELETE /orgs/{org}/actions/runners/{runner_id}",
          ],
          deleteSelfHostedRunnerFromRepo: [
            "DELETE /repos/{owner}/{repo}/actions/runners/{runner_id}",
          ],
          deleteWorkflowRun: [
            "DELETE /repos/{owner}/{repo}/actions/runs/{run_id}",
          ],
          deleteWorkflowRunLogs: [
            "DELETE /repos/{owner}/{repo}/actions/runs/{run_id}/logs",
          ],
          disableSelectedRepositoryGithubActionsOrganization: [
            "DELETE /orgs/{org}/actions/permissions/repositories/{repository_id}",
          ],
          disableWorkflow: [
            "PUT /repos/{owner}/{repo}/actions/workflows/{workflow_id}/disable",
          ],
          downloadArtifact: [
            "GET /repos/{owner}/{repo}/actions/artifacts/{artifact_id}/{archive_format}",
          ],
          downloadJobLogsForWorkflowRun: [
            "GET /repos/{owner}/{repo}/actions/jobs/{job_id}/logs",
          ],
          downloadWorkflowRunAttemptLogs: [
            "GET /repos/{owner}/{repo}/actions/runs/{run_id}/attempts/{attempt_number}/logs",
          ],
          downloadWorkflowRunLogs: [
            "GET /repos/{owner}/{repo}/actions/runs/{run_id}/logs",
          ],
          enableSelectedRepositoryGithubActionsOrganization: [
            "PUT /orgs/{org}/actions/permissions/repositories/{repository_id}",
          ],
          enableWorkflow: [
            "PUT /repos/{owner}/{repo}/actions/workflows/{workflow_id}/enable",
          ],
          generateRunnerJitconfigForOrg: [
            "POST /orgs/{org}/actions/runners/generate-jitconfig",
          ],
          generateRunnerJitconfigForRepo: [
            "POST /repos/{owner}/{repo}/actions/runners/generate-jitconfig",
          ],
          getActionsCacheList: ["GET /repos/{owner}/{repo}/actions/caches"],
          getActionsCacheUsage: [
            "GET /repos/{owner}/{repo}/actions/cache/usage",
          ],
          getActionsCacheUsageByRepoForOrg: [
            "GET /orgs/{org}/actions/cache/usage-by-repository",
          ],
          getActionsCacheUsageForOrg: ["GET /orgs/{org}/actions/cache/usage"],
          getAllowedActionsOrganization: [
            "GET /orgs/{org}/actions/permissions/selected-actions",
          ],
          getAllowedActionsRepository: [
            "GET /repos/{owner}/{repo}/actions/permissions/selected-actions",
          ],
          getArtifact: [
            "GET /repos/{owner}/{repo}/actions/artifacts/{artifact_id}",
          ],
          getEnvironmentPublicKey: [
            "GET /repositories/{repository_id}/environments/{environment_name}/secrets/public-key",
          ],
          getEnvironmentSecret: [
            "GET /repositories/{repository_id}/environments/{environment_name}/secrets/{secret_name}",
          ],
          getEnvironmentVariable: [
            "GET /repositories/{repository_id}/environments/{environment_name}/variables/{name}",
          ],
          getGithubActionsDefaultWorkflowPermissionsOrganization: [
            "GET /orgs/{org}/actions/permissions/workflow",
          ],
          getGithubActionsDefaultWorkflowPermissionsRepository: [
            "GET /repos/{owner}/{repo}/actions/permissions/workflow",
          ],
          getGithubActionsPermissionsOrganization: [
            "GET /orgs/{org}/actions/permissions",
          ],
          getGithubActionsPermissionsRepository: [
            "GET /repos/{owner}/{repo}/actions/permissions",
          ],
          getJobForWorkflowRun: [
            "GET /repos/{owner}/{repo}/actions/jobs/{job_id}",
          ],
          getOrgPublicKey: ["GET /orgs/{org}/actions/secrets/public-key"],
          getOrgSecret: ["GET /orgs/{org}/actions/secrets/{secret_name}"],
          getOrgVariable: ["GET /orgs/{org}/actions/variables/{name}"],
          getPendingDeploymentsForRun: [
            "GET /repos/{owner}/{repo}/actions/runs/{run_id}/pending_deployments",
          ],
          getRepoPermissions: [
            "GET /repos/{owner}/{repo}/actions/permissions",
            {},
            { renamed: ["actions", "getGithubActionsPermissionsRepository"] },
          ],
          getRepoPublicKey: [
            "GET /repos/{owner}/{repo}/actions/secrets/public-key",
          ],
          getRepoRequiredWorkflow: [
            "GET /repos/{org}/{repo}/actions/required_workflows/{required_workflow_id_for_repo}",
          ],
          getRepoRequiredWorkflowUsage: [
            "GET /repos/{org}/{repo}/actions/required_workflows/{required_workflow_id_for_repo}/timing",
          ],
          getRepoSecret: [
            "GET /repos/{owner}/{repo}/actions/secrets/{secret_name}",
          ],
          getRepoVariable: [
            "GET /repos/{owner}/{repo}/actions/variables/{name}",
          ],
          getRequiredWorkflow: [
            "GET /orgs/{org}/actions/required_workflows/{required_workflow_id}",
          ],
          getReviewsForRun: [
            "GET /repos/{owner}/{repo}/actions/runs/{run_id}/approvals",
          ],
          getSelfHostedRunnerForOrg: [
            "GET /orgs/{org}/actions/runners/{runner_id}",
          ],
          getSelfHostedRunnerForRepo: [
            "GET /repos/{owner}/{repo}/actions/runners/{runner_id}",
          ],
          getWorkflow: [
            "GET /repos/{owner}/{repo}/actions/workflows/{workflow_id}",
          ],
          getWorkflowAccessToRepository: [
            "GET /repos/{owner}/{repo}/actions/permissions/access",
          ],
          getWorkflowRun: ["GET /repos/{owner}/{repo}/actions/runs/{run_id}"],
          getWorkflowRunAttempt: [
            "GET /repos/{owner}/{repo}/actions/runs/{run_id}/attempts/{attempt_number}",
          ],
          getWorkflowRunUsage: [
            "GET /repos/{owner}/{repo}/actions/runs/{run_id}/timing",
          ],
          getWorkflowUsage: [
            "GET /repos/{owner}/{repo}/actions/workflows/{workflow_id}/timing",
          ],
          listArtifactsForRepo: ["GET /repos/{owner}/{repo}/actions/artifacts"],
          listEnvironmentSecrets: [
            "GET /repositories/{repository_id}/environments/{environment_name}/secrets",
          ],
          listEnvironmentVariables: [
            "GET /repositories/{repository_id}/environments/{environment_name}/variables",
          ],
          listJobsForWorkflowRun: [
            "GET /repos/{owner}/{repo}/actions/runs/{run_id}/jobs",
          ],
          listJobsForWorkflowRunAttempt: [
            "GET /repos/{owner}/{repo}/actions/runs/{run_id}/attempts/{attempt_number}/jobs",
          ],
          listLabelsForSelfHostedRunnerForOrg: [
            "GET /orgs/{org}/actions/runners/{runner_id}/labels",
          ],
          listLabelsForSelfHostedRunnerForRepo: [
            "GET /repos/{owner}/{repo}/actions/runners/{runner_id}/labels",
          ],
          listOrgSecrets: ["GET /orgs/{org}/actions/secrets"],
          listOrgVariables: ["GET /orgs/{org}/actions/variables"],
          listRepoOrganizationSecrets: [
            "GET /repos/{owner}/{repo}/actions/organization-secrets",
          ],
          listRepoOrganizationVariables: [
            "GET /repos/{owner}/{repo}/actions/organization-variables",
          ],
          listRepoRequiredWorkflows: [
            "GET /repos/{org}/{repo}/actions/required_workflows",
          ],
          listRepoSecrets: ["GET /repos/{owner}/{repo}/actions/secrets"],
          listRepoVariables: ["GET /repos/{owner}/{repo}/actions/variables"],
          listRepoWorkflows: ["GET /repos/{owner}/{repo}/actions/workflows"],
          listRequiredWorkflowRuns: [
            "GET /repos/{owner}/{repo}/actions/required_workflows/{required_workflow_id_for_repo}/runs",
          ],
          listRequiredWorkflows: ["GET /orgs/{org}/actions/required_workflows"],
          listRunnerApplicationsForOrg: [
            "GET /orgs/{org}/actions/runners/downloads",
          ],
          listRunnerApplicationsForRepo: [
            "GET /repos/{owner}/{repo}/actions/runners/downloads",
          ],
          listSelectedReposForOrgSecret: [
            "GET /orgs/{org}/actions/secrets/{secret_name}/repositories",
          ],
          listSelectedReposForOrgVariable: [
            "GET /orgs/{org}/actions/variables/{name}/repositories",
          ],
          listSelectedRepositoriesEnabledGithubActionsOrganization: [
            "GET /orgs/{org}/actions/permissions/repositories",
          ],
          listSelectedRepositoriesRequiredWorkflow: [
            "GET /orgs/{org}/actions/required_workflows/{required_workflow_id}/repositories",
          ],
          listSelfHostedRunnersForOrg: ["GET /orgs/{org}/actions/runners"],
          listSelfHostedRunnersForRepo: [
            "GET /repos/{owner}/{repo}/actions/runners",
          ],
          listWorkflowRunArtifacts: [
            "GET /repos/{owner}/{repo}/actions/runs/{run_id}/artifacts",
          ],
          listWorkflowRuns: [
            "GET /repos/{owner}/{repo}/actions/workflows/{workflow_id}/runs",
          ],
          listWorkflowRunsForRepo: ["GET /repos/{owner}/{repo}/actions/runs"],
          reRunJobForWorkflowRun: [
            "POST /repos/{owner}/{repo}/actions/jobs/{job_id}/rerun",
          ],
          reRunWorkflow: [
            "POST /repos/{owner}/{repo}/actions/runs/{run_id}/rerun",
          ],
          reRunWorkflowFailedJobs: [
            "POST /repos/{owner}/{repo}/actions/runs/{run_id}/rerun-failed-jobs",
          ],
          removeAllCustomLabelsFromSelfHostedRunnerForOrg: [
            "DELETE /orgs/{org}/actions/runners/{runner_id}/labels",
          ],
          removeAllCustomLabelsFromSelfHostedRunnerForRepo: [
            "DELETE /repos/{owner}/{repo}/actions/runners/{runner_id}/labels",
          ],
          removeCustomLabelFromSelfHostedRunnerForOrg: [
            "DELETE /orgs/{org}/actions/runners/{runner_id}/labels/{name}",
          ],
          removeCustomLabelFromSelfHostedRunnerForRepo: [
            "DELETE /repos/{owner}/{repo}/actions/runners/{runner_id}/labels/{name}",
          ],
          removeSelectedRepoFromOrgSecret: [
            "DELETE /orgs/{org}/actions/secrets/{secret_name}/repositories/{repository_id}",
          ],
          removeSelectedRepoFromOrgVariable: [
            "DELETE /orgs/{org}/actions/variables/{name}/repositories/{repository_id}",
          ],
          removeSelectedRepoFromRequiredWorkflow: [
            "DELETE /orgs/{org}/actions/required_workflows/{required_workflow_id}/repositories/{repository_id}",
          ],
          reviewCustomGatesForRun: [
            "POST /repos/{owner}/{repo}/actions/runs/{run_id}/deployment_protection_rule",
          ],
          reviewPendingDeploymentsForRun: [
            "POST /repos/{owner}/{repo}/actions/runs/{run_id}/pending_deployments",
          ],
          setAllowedActionsOrganization: [
            "PUT /orgs/{org}/actions/permissions/selected-actions",
          ],
          setAllowedActionsRepository: [
            "PUT /repos/{owner}/{repo}/actions/permissions/selected-actions",
          ],
          setCustomLabelsForSelfHostedRunnerForOrg: [
            "PUT /orgs/{org}/actions/runners/{runner_id}/labels",
          ],
          setCustomLabelsForSelfHostedRunnerForRepo: [
            "PUT /repos/{owner}/{repo}/actions/runners/{runner_id}/labels",
          ],
          setGithubActionsDefaultWorkflowPermissionsOrganization: [
            "PUT /orgs/{org}/actions/permissions/workflow",
          ],
          setGithubActionsDefaultWorkflowPermissionsRepository: [
            "PUT /repos/{owner}/{repo}/actions/permissions/workflow",
          ],
          setGithubActionsPermissionsOrganization: [
            "PUT /orgs/{org}/actions/permissions",
          ],
          setGithubActionsPermissionsRepository: [
            "PUT /repos/{owner}/{repo}/actions/permissions",
          ],
          setSelectedReposForOrgSecret: [
            "PUT /orgs/{org}/actions/secrets/{secret_name}/repositories",
          ],
          setSelectedReposForOrgVariable: [
            "PUT /orgs/{org}/actions/variables/{name}/repositories",
          ],
          setSelectedReposToRequiredWorkflow: [
            "PUT /orgs/{org}/actions/required_workflows/{required_workflow_id}/repositories",
          ],
          setSelectedRepositoriesEnabledGithubActionsOrganization: [
            "PUT /orgs/{org}/actions/permissions/repositories",
          ],
          setWorkflowAccessToRepository: [
            "PUT /repos/{owner}/{repo}/actions/permissions/access",
          ],
          updateEnvironmentVariable: [
            "PATCH /repositories/{repository_id}/environments/{environment_name}/variables/{name}",
          ],
          updateOrgVariable: ["PATCH /orgs/{org}/actions/variables/{name}"],
          updateRepoVariable: [
            "PATCH /repos/{owner}/{repo}/actions/variables/{name}",
          ],
          updateRequiredWorkflow: [
            "PATCH /orgs/{org}/actions/required_workflows/{required_workflow_id}",
          ],
        },
        activity: {
          checkRepoIsStarredByAuthenticatedUser: [
            "GET /user/starred/{owner}/{repo}",
          ],
          deleteRepoSubscription: ["DELETE /repos/{owner}/{repo}/subscription"],
          deleteThreadSubscription: [
            "DELETE /notifications/threads/{thread_id}/subscription",
          ],
          getFeeds: ["GET /feeds"],
          getRepoSubscription: ["GET /repos/{owner}/{repo}/subscription"],
          getThread: ["GET /notifications/threads/{thread_id}"],
          getThreadSubscriptionForAuthenticatedUser: [
            "GET /notifications/threads/{thread_id}/subscription",
          ],
          listEventsForAuthenticatedUser: ["GET /users/{username}/events"],
          listNotificationsForAuthenticatedUser: ["GET /notifications"],
          listOrgEventsForAuthenticatedUser: [
            "GET /users/{username}/events/orgs/{org}",
          ],
          listPublicEvents: ["GET /events"],
          listPublicEventsForRepoNetwork: [
            "GET /networks/{owner}/{repo}/events",
          ],
          listPublicEventsForUser: ["GET /users/{username}/events/public"],
          listPublicOrgEvents: ["GET /orgs/{org}/events"],
          listReceivedEventsForUser: ["GET /users/{username}/received_events"],
          listReceivedPublicEventsForUser: [
            "GET /users/{username}/received_events/public",
          ],
          listRepoEvents: ["GET /repos/{owner}/{repo}/events"],
          listRepoNotificationsForAuthenticatedUser: [
            "GET /repos/{owner}/{repo}/notifications",
          ],
          listReposStarredByAuthenticatedUser: ["GET /user/starred"],
          listReposStarredByUser: ["GET /users/{username}/starred"],
          listReposWatchedByUser: ["GET /users/{username}/subscriptions"],
          listStargazersForRepo: ["GET /repos/{owner}/{repo}/stargazers"],
          listWatchedReposForAuthenticatedUser: ["GET /user/subscriptions"],
          listWatchersForRepo: ["GET /repos/{owner}/{repo}/subscribers"],
          markNotificationsAsRead: ["PUT /notifications"],
          markRepoNotificationsAsRead: [
            "PUT /repos/{owner}/{repo}/notifications",
          ],
          markThreadAsRead: ["PATCH /notifications/threads/{thread_id}"],
          setRepoSubscription: ["PUT /repos/{owner}/{repo}/subscription"],
          setThreadSubscription: [
            "PUT /notifications/threads/{thread_id}/subscription",
          ],
          starRepoForAuthenticatedUser: ["PUT /user/starred/{owner}/{repo}"],
          unstarRepoForAuthenticatedUser: [
            "DELETE /user/starred/{owner}/{repo}",
          ],
        },
        apps: {
          addRepoToInstallation: [
            "PUT /user/installations/{installation_id}/repositories/{repository_id}",
            {},
            { renamed: ["apps", "addRepoToInstallationForAuthenticatedUser"] },
          ],
          addRepoToInstallationForAuthenticatedUser: [
            "PUT /user/installations/{installation_id}/repositories/{repository_id}",
          ],
          checkToken: ["POST /applications/{client_id}/token"],
          createFromManifest: ["POST /app-manifests/{code}/conversions"],
          createInstallationAccessToken: [
            "POST /app/installations/{installation_id}/access_tokens",
          ],
          deleteAuthorization: ["DELETE /applications/{client_id}/grant"],
          deleteInstallation: ["DELETE /app/installations/{installation_id}"],
          deleteToken: ["DELETE /applications/{client_id}/token"],
          getAuthenticated: ["GET /app"],
          getBySlug: ["GET /apps/{app_slug}"],
          getInstallation: ["GET /app/installations/{installation_id}"],
          getOrgInstallation: ["GET /orgs/{org}/installation"],
          getRepoInstallation: ["GET /repos/{owner}/{repo}/installation"],
          getSubscriptionPlanForAccount: [
            "GET /marketplace_listing/accounts/{account_id}",
          ],
          getSubscriptionPlanForAccountStubbed: [
            "GET /marketplace_listing/stubbed/accounts/{account_id}",
          ],
          getUserInstallation: ["GET /users/{username}/installation"],
          getWebhookConfigForApp: ["GET /app/hook/config"],
          getWebhookDelivery: ["GET /app/hook/deliveries/{delivery_id}"],
          listAccountsForPlan: [
            "GET /marketplace_listing/plans/{plan_id}/accounts",
          ],
          listAccountsForPlanStubbed: [
            "GET /marketplace_listing/stubbed/plans/{plan_id}/accounts",
          ],
          listInstallationReposForAuthenticatedUser: [
            "GET /user/installations/{installation_id}/repositories",
          ],
          listInstallationRequestsForAuthenticatedApp: [
            "GET /app/installation-requests",
          ],
          listInstallations: ["GET /app/installations"],
          listInstallationsForAuthenticatedUser: ["GET /user/installations"],
          listPlans: ["GET /marketplace_listing/plans"],
          listPlansStubbed: ["GET /marketplace_listing/stubbed/plans"],
          listReposAccessibleToInstallation: ["GET /installation/repositories"],
          listSubscriptionsForAuthenticatedUser: [
            "GET /user/marketplace_purchases",
          ],
          listSubscriptionsForAuthenticatedUserStubbed: [
            "GET /user/marketplace_purchases/stubbed",
          ],
          listWebhookDeliveries: ["GET /app/hook/deliveries"],
          redeliverWebhookDelivery: [
            "POST /app/hook/deliveries/{delivery_id}/attempts",
          ],
          removeRepoFromInstallation: [
            "DELETE /user/installations/{installation_id}/repositories/{repository_id}",
            {},
            {
              renamed: [
                "apps",
                "removeRepoFromInstallationForAuthenticatedUser",
              ],
            },
          ],
          removeRepoFromInstallationForAuthenticatedUser: [
            "DELETE /user/installations/{installation_id}/repositories/{repository_id}",
          ],
          resetToken: ["PATCH /applications/{client_id}/token"],
          revokeInstallationAccessToken: ["DELETE /installation/token"],
          scopeToken: ["POST /applications/{client_id}/token/scoped"],
          suspendInstallation: [
            "PUT /app/installations/{installation_id}/suspended",
          ],
          unsuspendInstallation: [
            "DELETE /app/installations/{installation_id}/suspended",
          ],
          updateWebhookConfigForApp: ["PATCH /app/hook/config"],
        },
        billing: {
          getGithubActionsBillingOrg: [
            "GET /orgs/{org}/settings/billing/actions",
          ],
          getGithubActionsBillingUser: [
            "GET /users/{username}/settings/billing/actions",
          ],
          getGithubPackagesBillingOrg: [
            "GET /orgs/{org}/settings/billing/packages",
          ],
          getGithubPackagesBillingUser: [
            "GET /users/{username}/settings/billing/packages",
          ],
          getSharedStorageBillingOrg: [
            "GET /orgs/{org}/settings/billing/shared-storage",
          ],
          getSharedStorageBillingUser: [
            "GET /users/{username}/settings/billing/shared-storage",
          ],
        },
        checks: {
          create: ["POST /repos/{owner}/{repo}/check-runs"],
          createSuite: ["POST /repos/{owner}/{repo}/check-suites"],
          get: ["GET /repos/{owner}/{repo}/check-runs/{check_run_id}"],
          getSuite: ["GET /repos/{owner}/{repo}/check-suites/{check_suite_id}"],
          listAnnotations: [
            "GET /repos/{owner}/{repo}/check-runs/{check_run_id}/annotations",
          ],
          listForRef: ["GET /repos/{owner}/{repo}/commits/{ref}/check-runs"],
          listForSuite: [
            "GET /repos/{owner}/{repo}/check-suites/{check_suite_id}/check-runs",
          ],
          listSuitesForRef: [
            "GET /repos/{owner}/{repo}/commits/{ref}/check-suites",
          ],
          rerequestRun: [
            "POST /repos/{owner}/{repo}/check-runs/{check_run_id}/rerequest",
          ],
          rerequestSuite: [
            "POST /repos/{owner}/{repo}/check-suites/{check_suite_id}/rerequest",
          ],
          setSuitesPreferences: [
            "PATCH /repos/{owner}/{repo}/check-suites/preferences",
          ],
          update: ["PATCH /repos/{owner}/{repo}/check-runs/{check_run_id}"],
        },
        codeScanning: {
          deleteAnalysis: [
            "DELETE /repos/{owner}/{repo}/code-scanning/analyses/{analysis_id}{?confirm_delete}",
          ],
          getAlert: [
            "GET /repos/{owner}/{repo}/code-scanning/alerts/{alert_number}",
            {},
            { renamedParameters: { alert_id: "alert_number" } },
          ],
          getAnalysis: [
            "GET /repos/{owner}/{repo}/code-scanning/analyses/{analysis_id}",
          ],
          getCodeqlDatabase: [
            "GET /repos/{owner}/{repo}/code-scanning/codeql/databases/{language}",
          ],
          getDefaultSetup: [
            "GET /repos/{owner}/{repo}/code-scanning/default-setup",
          ],
          getSarif: [
            "GET /repos/{owner}/{repo}/code-scanning/sarifs/{sarif_id}",
          ],
          listAlertInstances: [
            "GET /repos/{owner}/{repo}/code-scanning/alerts/{alert_number}/instances",
          ],
          listAlertsForOrg: ["GET /orgs/{org}/code-scanning/alerts"],
          listAlertsForRepo: ["GET /repos/{owner}/{repo}/code-scanning/alerts"],
          listAlertsInstances: [
            "GET /repos/{owner}/{repo}/code-scanning/alerts/{alert_number}/instances",
            {},
            { renamed: ["codeScanning", "listAlertInstances"] },
          ],
          listCodeqlDatabases: [
            "GET /repos/{owner}/{repo}/code-scanning/codeql/databases",
          ],
          listRecentAnalyses: [
            "GET /repos/{owner}/{repo}/code-scanning/analyses",
          ],
          updateAlert: [
            "PATCH /repos/{owner}/{repo}/code-scanning/alerts/{alert_number}",
          ],
          updateDefaultSetup: [
            "PATCH /repos/{owner}/{repo}/code-scanning/default-setup",
          ],
          uploadSarif: ["POST /repos/{owner}/{repo}/code-scanning/sarifs"],
        },
        codesOfConduct: {
          getAllCodesOfConduct: ["GET /codes_of_conduct"],
          getConductCode: ["GET /codes_of_conduct/{key}"],
        },
        codespaces: {
          addRepositoryForSecretForAuthenticatedUser: [
            "PUT /user/codespaces/secrets/{secret_name}/repositories/{repository_id}",
          ],
          addSelectedRepoToOrgSecret: [
            "PUT /orgs/{org}/codespaces/secrets/{secret_name}/repositories/{repository_id}",
          ],
          codespaceMachinesForAuthenticatedUser: [
            "GET /user/codespaces/{codespace_name}/machines",
          ],
          createForAuthenticatedUser: ["POST /user/codespaces"],
          createOrUpdateOrgSecret: [
            "PUT /orgs/{org}/codespaces/secrets/{secret_name}",
          ],
          createOrUpdateRepoSecret: [
            "PUT /repos/{owner}/{repo}/codespaces/secrets/{secret_name}",
          ],
          createOrUpdateSecretForAuthenticatedUser: [
            "PUT /user/codespaces/secrets/{secret_name}",
          ],
          createWithPrForAuthenticatedUser: [
            "POST /repos/{owner}/{repo}/pulls/{pull_number}/codespaces",
          ],
          createWithRepoForAuthenticatedUser: [
            "POST /repos/{owner}/{repo}/codespaces",
          ],
          deleteCodespacesBillingUsers: [
            "DELETE /orgs/{org}/codespaces/billing/selected_users",
          ],
          deleteForAuthenticatedUser: [
            "DELETE /user/codespaces/{codespace_name}",
          ],
          deleteFromOrganization: [
            "DELETE /orgs/{org}/members/{username}/codespaces/{codespace_name}",
          ],
          deleteOrgSecret: [
            "DELETE /orgs/{org}/codespaces/secrets/{secret_name}",
          ],
          deleteRepoSecret: [
            "DELETE /repos/{owner}/{repo}/codespaces/secrets/{secret_name}",
          ],
          deleteSecretForAuthenticatedUser: [
            "DELETE /user/codespaces/secrets/{secret_name}",
          ],
          exportForAuthenticatedUser: [
            "POST /user/codespaces/{codespace_name}/exports",
          ],
          getCodespacesForUserInOrg: [
            "GET /orgs/{org}/members/{username}/codespaces",
          ],
          getExportDetailsForAuthenticatedUser: [
            "GET /user/codespaces/{codespace_name}/exports/{export_id}",
          ],
          getForAuthenticatedUser: ["GET /user/codespaces/{codespace_name}"],
          getOrgPublicKey: ["GET /orgs/{org}/codespaces/secrets/public-key"],
          getOrgSecret: ["GET /orgs/{org}/codespaces/secrets/{secret_name}"],
          getPublicKeyForAuthenticatedUser: [
            "GET /user/codespaces/secrets/public-key",
          ],
          getRepoPublicKey: [
            "GET /repos/{owner}/{repo}/codespaces/secrets/public-key",
          ],
          getRepoSecret: [
            "GET /repos/{owner}/{repo}/codespaces/secrets/{secret_name}",
          ],
          getSecretForAuthenticatedUser: [
            "GET /user/codespaces/secrets/{secret_name}",
          ],
          listDevcontainersInRepositoryForAuthenticatedUser: [
            "GET /repos/{owner}/{repo}/codespaces/devcontainers",
          ],
          listForAuthenticatedUser: ["GET /user/codespaces"],
          listInOrganization: [
            "GET /orgs/{org}/codespaces",
            {},
            { renamedParameters: { org_id: "org" } },
          ],
          listInRepositoryForAuthenticatedUser: [
            "GET /repos/{owner}/{repo}/codespaces",
          ],
          listOrgSecrets: ["GET /orgs/{org}/codespaces/secrets"],
          listRepoSecrets: ["GET /repos/{owner}/{repo}/codespaces/secrets"],
          listRepositoriesForSecretForAuthenticatedUser: [
            "GET /user/codespaces/secrets/{secret_name}/repositories",
          ],
          listSecretsForAuthenticatedUser: ["GET /user/codespaces/secrets"],
          listSelectedReposForOrgSecret: [
            "GET /orgs/{org}/codespaces/secrets/{secret_name}/repositories",
          ],
          preFlightWithRepoForAuthenticatedUser: [
            "GET /repos/{owner}/{repo}/codespaces/new",
          ],
          publishForAuthenticatedUser: [
            "POST /user/codespaces/{codespace_name}/publish",
          ],
          removeRepositoryForSecretForAuthenticatedUser: [
            "DELETE /user/codespaces/secrets/{secret_name}/repositories/{repository_id}",
          ],
          removeSelectedRepoFromOrgSecret: [
            "DELETE /orgs/{org}/codespaces/secrets/{secret_name}/repositories/{repository_id}",
          ],
          repoMachinesForAuthenticatedUser: [
            "GET /repos/{owner}/{repo}/codespaces/machines",
          ],
          setCodespacesBilling: ["PUT /orgs/{org}/codespaces/billing"],
          setCodespacesBillingUsers: [
            "POST /orgs/{org}/codespaces/billing/selected_users",
          ],
          setRepositoriesForSecretForAuthenticatedUser: [
            "PUT /user/codespaces/secrets/{secret_name}/repositories",
          ],
          setSelectedReposForOrgSecret: [
            "PUT /orgs/{org}/codespaces/secrets/{secret_name}/repositories",
          ],
          startForAuthenticatedUser: [
            "POST /user/codespaces/{codespace_name}/start",
          ],
          stopForAuthenticatedUser: [
            "POST /user/codespaces/{codespace_name}/stop",
          ],
          stopInOrganization: [
            "POST /orgs/{org}/members/{username}/codespaces/{codespace_name}/stop",
          ],
          updateForAuthenticatedUser: [
            "PATCH /user/codespaces/{codespace_name}",
          ],
        },
        dependabot: {
          addSelectedRepoToOrgSecret: [
            "PUT /orgs/{org}/dependabot/secrets/{secret_name}/repositories/{repository_id}",
          ],
          createOrUpdateOrgSecret: [
            "PUT /orgs/{org}/dependabot/secrets/{secret_name}",
          ],
          createOrUpdateRepoSecret: [
            "PUT /repos/{owner}/{repo}/dependabot/secrets/{secret_name}",
          ],
          deleteOrgSecret: [
            "DELETE /orgs/{org}/dependabot/secrets/{secret_name}",
          ],
          deleteRepoSecret: [
            "DELETE /repos/{owner}/{repo}/dependabot/secrets/{secret_name}",
          ],
          getAlert: [
            "GET /repos/{owner}/{repo}/dependabot/alerts/{alert_number}",
          ],
          getOrgPublicKey: ["GET /orgs/{org}/dependabot/secrets/public-key"],
          getOrgSecret: ["GET /orgs/{org}/dependabot/secrets/{secret_name}"],
          getRepoPublicKey: [
            "GET /repos/{owner}/{repo}/dependabot/secrets/public-key",
          ],
          getRepoSecret: [
            "GET /repos/{owner}/{repo}/dependabot/secrets/{secret_name}",
          ],
          listAlertsForEnterprise: [
            "GET /enterprises/{enterprise}/dependabot/alerts",
          ],
          listAlertsForOrg: ["GET /orgs/{org}/dependabot/alerts"],
          listAlertsForRepo: ["GET /repos/{owner}/{repo}/dependabot/alerts"],
          listOrgSecrets: ["GET /orgs/{org}/dependabot/secrets"],
          listRepoSecrets: ["GET /repos/{owner}/{repo}/dependabot/secrets"],
          listSelectedReposForOrgSecret: [
            "GET /orgs/{org}/dependabot/secrets/{secret_name}/repositories",
          ],
          removeSelectedRepoFromOrgSecret: [
            "DELETE /orgs/{org}/dependabot/secrets/{secret_name}/repositories/{repository_id}",
          ],
          setSelectedReposForOrgSecret: [
            "PUT /orgs/{org}/dependabot/secrets/{secret_name}/repositories",
          ],
          updateAlert: [
            "PATCH /repos/{owner}/{repo}/dependabot/alerts/{alert_number}",
          ],
        },
        dependencyGraph: {
          createRepositorySnapshot: [
            "POST /repos/{owner}/{repo}/dependency-graph/snapshots",
          ],
          diffRange: [
            "GET /repos/{owner}/{repo}/dependency-graph/compare/{basehead}",
          ],
          exportSbom: ["GET /repos/{owner}/{repo}/dependency-graph/sbom"],
        },
        emojis: { get: ["GET /emojis"] },
        gists: {
          checkIsStarred: ["GET /gists/{gist_id}/star"],
          create: ["POST /gists"],
          createComment: ["POST /gists/{gist_id}/comments"],
          delete: ["DELETE /gists/{gist_id}"],
          deleteComment: ["DELETE /gists/{gist_id}/comments/{comment_id}"],
          fork: ["POST /gists/{gist_id}/forks"],
          get: ["GET /gists/{gist_id}"],
          getComment: ["GET /gists/{gist_id}/comments/{comment_id}"],
          getRevision: ["GET /gists/{gist_id}/{sha}"],
          list: ["GET /gists"],
          listComments: ["GET /gists/{gist_id}/comments"],
          listCommits: ["GET /gists/{gist_id}/commits"],
          listForUser: ["GET /users/{username}/gists"],
          listForks: ["GET /gists/{gist_id}/forks"],
          listPublic: ["GET /gists/public"],
          listStarred: ["GET /gists/starred"],
          star: ["PUT /gists/{gist_id}/star"],
          unstar: ["DELETE /gists/{gist_id}/star"],
          update: ["PATCH /gists/{gist_id}"],
          updateComment: ["PATCH /gists/{gist_id}/comments/{comment_id}"],
        },
        git: {
          createBlob: ["POST /repos/{owner}/{repo}/git/blobs"],
          createCommit: ["POST /repos/{owner}/{repo}/git/commits"],
          createRef: ["POST /repos/{owner}/{repo}/git/refs"],
          createTag: ["POST /repos/{owner}/{repo}/git/tags"],
          createTree: ["POST /repos/{owner}/{repo}/git/trees"],
          deleteRef: ["DELETE /repos/{owner}/{repo}/git/refs/{ref}"],
          getBlob: ["GET /repos/{owner}/{repo}/git/blobs/{file_sha}"],
          getCommit: ["GET /repos/{owner}/{repo}/git/commits/{commit_sha}"],
          getRef: ["GET /repos/{owner}/{repo}/git/ref/{ref}"],
          getTag: ["GET /repos/{owner}/{repo}/git/tags/{tag_sha}"],
          getTree: ["GET /repos/{owner}/{repo}/git/trees/{tree_sha}"],
          listMatchingRefs: [
            "GET /repos/{owner}/{repo}/git/matching-refs/{ref}",
          ],
          updateRef: ["PATCH /repos/{owner}/{repo}/git/refs/{ref}"],
        },
        gitignore: {
          getAllTemplates: ["GET /gitignore/templates"],
          getTemplate: ["GET /gitignore/templates/{name}"],
        },
        interactions: {
          getRestrictionsForAuthenticatedUser: ["GET /user/interaction-limits"],
          getRestrictionsForOrg: ["GET /orgs/{org}/interaction-limits"],
          getRestrictionsForRepo: [
            "GET /repos/{owner}/{repo}/interaction-limits",
          ],
          getRestrictionsForYourPublicRepos: [
            "GET /user/interaction-limits",
            {},
            {
              renamed: ["interactions", "getRestrictionsForAuthenticatedUser"],
            },
          ],
          removeRestrictionsForAuthenticatedUser: [
            "DELETE /user/interaction-limits",
          ],
          removeRestrictionsForOrg: ["DELETE /orgs/{org}/interaction-limits"],
          removeRestrictionsForRepo: [
            "DELETE /repos/{owner}/{repo}/interaction-limits",
          ],
          removeRestrictionsForYourPublicRepos: [
            "DELETE /user/interaction-limits",
            {},
            {
              renamed: [
                "interactions",
                "removeRestrictionsForAuthenticatedUser",
              ],
            },
          ],
          setRestrictionsForAuthenticatedUser: ["PUT /user/interaction-limits"],
          setRestrictionsForOrg: ["PUT /orgs/{org}/interaction-limits"],
          setRestrictionsForRepo: [
            "PUT /repos/{owner}/{repo}/interaction-limits",
          ],
          setRestrictionsForYourPublicRepos: [
            "PUT /user/interaction-limits",
            {},
            {
              renamed: ["interactions", "setRestrictionsForAuthenticatedUser"],
            },
          ],
        },
        issues: {
          addAssignees: [
            "POST /repos/{owner}/{repo}/issues/{issue_number}/assignees",
          ],
          addLabels: [
            "POST /repos/{owner}/{repo}/issues/{issue_number}/labels",
          ],
          checkUserCanBeAssigned: [
            "GET /repos/{owner}/{repo}/assignees/{assignee}",
          ],
          checkUserCanBeAssignedToIssue: [
            "GET /repos/{owner}/{repo}/issues/{issue_number}/assignees/{assignee}",
          ],
          create: ["POST /repos/{owner}/{repo}/issues"],
          createComment: [
            "POST /repos/{owner}/{repo}/issues/{issue_number}/comments",
          ],
          createLabel: ["POST /repos/{owner}/{repo}/labels"],
          createMilestone: ["POST /repos/{owner}/{repo}/milestones"],
          deleteComment: [
            "DELETE /repos/{owner}/{repo}/issues/comments/{comment_id}",
          ],
          deleteLabel: ["DELETE /repos/{owner}/{repo}/labels/{name}"],
          deleteMilestone: [
            "DELETE /repos/{owner}/{repo}/milestones/{milestone_number}",
          ],
          get: ["GET /repos/{owner}/{repo}/issues/{issue_number}"],
          getComment: [
            "GET /repos/{owner}/{repo}/issues/comments/{comment_id}",
          ],
          getEvent: ["GET /repos/{owner}/{repo}/issues/events/{event_id}"],
          getLabel: ["GET /repos/{owner}/{repo}/labels/{name}"],
          getMilestone: [
            "GET /repos/{owner}/{repo}/milestones/{milestone_number}",
          ],
          list: ["GET /issues"],
          listAssignees: ["GET /repos/{owner}/{repo}/assignees"],
          listComments: [
            "GET /repos/{owner}/{repo}/issues/{issue_number}/comments",
          ],
          listCommentsForRepo: ["GET /repos/{owner}/{repo}/issues/comments"],
          listEvents: [
            "GET /repos/{owner}/{repo}/issues/{issue_number}/events",
          ],
          listEventsForRepo: ["GET /repos/{owner}/{repo}/issues/events"],
          listEventsForTimeline: [
            "GET /repos/{owner}/{repo}/issues/{issue_number}/timeline",
          ],
          listForAuthenticatedUser: ["GET /user/issues"],
          listForOrg: ["GET /orgs/{org}/issues"],
          listForRepo: ["GET /repos/{owner}/{repo}/issues"],
          listLabelsForMilestone: [
            "GET /repos/{owner}/{repo}/milestones/{milestone_number}/labels",
          ],
          listLabelsForRepo: ["GET /repos/{owner}/{repo}/labels"],
          listLabelsOnIssue: [
            "GET /repos/{owner}/{repo}/issues/{issue_number}/labels",
          ],
          listMilestones: ["GET /repos/{owner}/{repo}/milestones"],
          lock: ["PUT /repos/{owner}/{repo}/issues/{issue_number}/lock"],
          removeAllLabels: [
            "DELETE /repos/{owner}/{repo}/issues/{issue_number}/labels",
          ],
          removeAssignees: [
            "DELETE /repos/{owner}/{repo}/issues/{issue_number}/assignees",
          ],
          removeLabel: [
            "DELETE /repos/{owner}/{repo}/issues/{issue_number}/labels/{name}",
          ],
          setLabels: ["PUT /repos/{owner}/{repo}/issues/{issue_number}/labels"],
          unlock: ["DELETE /repos/{owner}/{repo}/issues/{issue_number}/lock"],
          update: ["PATCH /repos/{owner}/{repo}/issues/{issue_number}"],
          updateComment: [
            "PATCH /repos/{owner}/{repo}/issues/comments/{comment_id}",
          ],
          updateLabel: ["PATCH /repos/{owner}/{repo}/labels/{name}"],
          updateMilestone: [
            "PATCH /repos/{owner}/{repo}/milestones/{milestone_number}",
          ],
        },
        licenses: {
          get: ["GET /licenses/{license}"],
          getAllCommonlyUsed: ["GET /licenses"],
          getForRepo: ["GET /repos/{owner}/{repo}/license"],
        },
        markdown: {
          render: ["POST /markdown"],
          renderRaw: [
            "POST /markdown/raw",
            { headers: { "content-type": "text/plain; charset=utf-8" } },
          ],
        },
        meta: {
          get: ["GET /meta"],
          getAllVersions: ["GET /versions"],
          getOctocat: ["GET /octocat"],
          getZen: ["GET /zen"],
          root: ["GET /"],
        },
        migrations: {
          cancelImport: ["DELETE /repos/{owner}/{repo}/import"],
          deleteArchiveForAuthenticatedUser: [
            "DELETE /user/migrations/{migration_id}/archive",
          ],
          deleteArchiveForOrg: [
            "DELETE /orgs/{org}/migrations/{migration_id}/archive",
          ],
          downloadArchiveForOrg: [
            "GET /orgs/{org}/migrations/{migration_id}/archive",
          ],
          getArchiveForAuthenticatedUser: [
            "GET /user/migrations/{migration_id}/archive",
          ],
          getCommitAuthors: ["GET /repos/{owner}/{repo}/import/authors"],
          getImportStatus: ["GET /repos/{owner}/{repo}/import"],
          getLargeFiles: ["GET /repos/{owner}/{repo}/import/large_files"],
          getStatusForAuthenticatedUser: [
            "GET /user/migrations/{migration_id}",
          ],
          getStatusForOrg: ["GET /orgs/{org}/migrations/{migration_id}"],
          listForAuthenticatedUser: ["GET /user/migrations"],
          listForOrg: ["GET /orgs/{org}/migrations"],
          listReposForAuthenticatedUser: [
            "GET /user/migrations/{migration_id}/repositories",
          ],
          listReposForOrg: [
            "GET /orgs/{org}/migrations/{migration_id}/repositories",
          ],
          listReposForUser: [
            "GET /user/migrations/{migration_id}/repositories",
            {},
            { renamed: ["migrations", "listReposForAuthenticatedUser"] },
          ],
          mapCommitAuthor: [
            "PATCH /repos/{owner}/{repo}/import/authors/{author_id}",
          ],
          setLfsPreference: ["PATCH /repos/{owner}/{repo}/import/lfs"],
          startForAuthenticatedUser: ["POST /user/migrations"],
          startForOrg: ["POST /orgs/{org}/migrations"],
          startImport: ["PUT /repos/{owner}/{repo}/import"],
          unlockRepoForAuthenticatedUser: [
            "DELETE /user/migrations/{migration_id}/repos/{repo_name}/lock",
          ],
          unlockRepoForOrg: [
            "DELETE /orgs/{org}/migrations/{migration_id}/repos/{repo_name}/lock",
          ],
          updateImport: ["PATCH /repos/{owner}/{repo}/import"],
        },
        orgs: {
          addSecurityManagerTeam: [
            "PUT /orgs/{org}/security-managers/teams/{team_slug}",
          ],
          blockUser: ["PUT /orgs/{org}/blocks/{username}"],
          cancelInvitation: ["DELETE /orgs/{org}/invitations/{invitation_id}"],
          checkBlockedUser: ["GET /orgs/{org}/blocks/{username}"],
          checkMembershipForUser: ["GET /orgs/{org}/members/{username}"],
          checkPublicMembershipForUser: [
            "GET /orgs/{org}/public_members/{username}",
          ],
          convertMemberToOutsideCollaborator: [
            "PUT /orgs/{org}/outside_collaborators/{username}",
          ],
          createInvitation: ["POST /orgs/{org}/invitations"],
          createWebhook: ["POST /orgs/{org}/hooks"],
          delete: ["DELETE /orgs/{org}"],
          deleteWebhook: ["DELETE /orgs/{org}/hooks/{hook_id}"],
          enableOrDisableSecurityProductOnAllOrgRepos: [
            "POST /orgs/{org}/{security_product}/{enablement}",
          ],
          get: ["GET /orgs/{org}"],
          getMembershipForAuthenticatedUser: [
            "GET /user/memberships/orgs/{org}",
          ],
          getMembershipForUser: ["GET /orgs/{org}/memberships/{username}"],
          getWebhook: ["GET /orgs/{org}/hooks/{hook_id}"],
          getWebhookConfigForOrg: ["GET /orgs/{org}/hooks/{hook_id}/config"],
          getWebhookDelivery: [
            "GET /orgs/{org}/hooks/{hook_id}/deliveries/{delivery_id}",
          ],
          list: ["GET /organizations"],
          listAppInstallations: ["GET /orgs/{org}/installations"],
          listBlockedUsers: ["GET /orgs/{org}/blocks"],
          listFailedInvitations: ["GET /orgs/{org}/failed_invitations"],
          listForAuthenticatedUser: ["GET /user/orgs"],
          listForUser: ["GET /users/{username}/orgs"],
          listInvitationTeams: [
            "GET /orgs/{org}/invitations/{invitation_id}/teams",
          ],
          listMembers: ["GET /orgs/{org}/members"],
          listMembershipsForAuthenticatedUser: ["GET /user/memberships/orgs"],
          listOutsideCollaborators: ["GET /orgs/{org}/outside_collaborators"],
          listPatGrantRepositories: [
            "GET /organizations/{org}/personal-access-tokens/{pat_id}/repositories",
          ],
          listPatGrantRequestRepositories: [
            "GET /organizations/{org}/personal-access-token-requests/{pat_request_id}/repositories",
          ],
          listPatGrantRequests: [
            "GET /organizations/{org}/personal-access-token-requests",
          ],
          listPatGrants: ["GET /organizations/{org}/personal-access-tokens"],
          listPendingInvitations: ["GET /orgs/{org}/invitations"],
          listPublicMembers: ["GET /orgs/{org}/public_members"],
          listSecurityManagerTeams: ["GET /orgs/{org}/security-managers"],
          listWebhookDeliveries: ["GET /orgs/{org}/hooks/{hook_id}/deliveries"],
          listWebhooks: ["GET /orgs/{org}/hooks"],
          pingWebhook: ["POST /orgs/{org}/hooks/{hook_id}/pings"],
          redeliverWebhookDelivery: [
            "POST /orgs/{org}/hooks/{hook_id}/deliveries/{delivery_id}/attempts",
          ],
          removeMember: ["DELETE /orgs/{org}/members/{username}"],
          removeMembershipForUser: [
            "DELETE /orgs/{org}/memberships/{username}",
          ],
          removeOutsideCollaborator: [
            "DELETE /orgs/{org}/outside_collaborators/{username}",
          ],
          removePublicMembershipForAuthenticatedUser: [
            "DELETE /orgs/{org}/public_members/{username}",
          ],
          removeSecurityManagerTeam: [
            "DELETE /orgs/{org}/security-managers/teams/{team_slug}",
          ],
          reviewPatGrantRequest: [
            "POST /organizations/{org}/personal-access-token-requests/{pat_request_id}",
          ],
          reviewPatGrantRequestsInBulk: [
            "POST /organizations/{org}/personal-access-token-requests",
          ],
          setMembershipForUser: ["PUT /orgs/{org}/memberships/{username}"],
          setPublicMembershipForAuthenticatedUser: [
            "PUT /orgs/{org}/public_members/{username}",
          ],
          unblockUser: ["DELETE /orgs/{org}/blocks/{username}"],
          update: ["PATCH /orgs/{org}"],
          updateMembershipForAuthenticatedUser: [
            "PATCH /user/memberships/orgs/{org}",
          ],
          updatePatAccess: [
            "POST /organizations/{org}/personal-access-tokens/{pat_id}",
          ],
          updatePatAccesses: [
            "POST /organizations/{org}/personal-access-tokens",
          ],
          updateWebhook: ["PATCH /orgs/{org}/hooks/{hook_id}"],
          updateWebhookConfigForOrg: [
            "PATCH /orgs/{org}/hooks/{hook_id}/config",
          ],
        },
        packages: {
          deletePackageForAuthenticatedUser: [
            "DELETE /user/packages/{package_type}/{package_name}",
          ],
          deletePackageForOrg: [
            "DELETE /orgs/{org}/packages/{package_type}/{package_name}",
          ],
          deletePackageForUser: [
            "DELETE /users/{username}/packages/{package_type}/{package_name}",
          ],
          deletePackageVersionForAuthenticatedUser: [
            "DELETE /user/packages/{package_type}/{package_name}/versions/{package_version_id}",
          ],
          deletePackageVersionForOrg: [
            "DELETE /orgs/{org}/packages/{package_type}/{package_name}/versions/{package_version_id}",
          ],
          deletePackageVersionForUser: [
            "DELETE /users/{username}/packages/{package_type}/{package_name}/versions/{package_version_id}",
          ],
          getAllPackageVersionsForAPackageOwnedByAnOrg: [
            "GET /orgs/{org}/packages/{package_type}/{package_name}/versions",
            {},
            {
              renamed: [
                "packages",
                "getAllPackageVersionsForPackageOwnedByOrg",
              ],
            },
          ],
          getAllPackageVersionsForAPackageOwnedByTheAuthenticatedUser: [
            "GET /user/packages/{package_type}/{package_name}/versions",
            {},
            {
              renamed: [
                "packages",
                "getAllPackageVersionsForPackageOwnedByAuthenticatedUser",
              ],
            },
          ],
          getAllPackageVersionsForPackageOwnedByAuthenticatedUser: [
            "GET /user/packages/{package_type}/{package_name}/versions",
          ],
          getAllPackageVersionsForPackageOwnedByOrg: [
            "GET /orgs/{org}/packages/{package_type}/{package_name}/versions",
          ],
          getAllPackageVersionsForPackageOwnedByUser: [
            "GET /users/{username}/packages/{package_type}/{package_name}/versions",
          ],
          getPackageForAuthenticatedUser: [
            "GET /user/packages/{package_type}/{package_name}",
          ],
          getPackageForOrganization: [
            "GET /orgs/{org}/packages/{package_type}/{package_name}",
          ],
          getPackageForUser: [
            "GET /users/{username}/packages/{package_type}/{package_name}",
          ],
          getPackageVersionForAuthenticatedUser: [
            "GET /user/packages/{package_type}/{package_name}/versions/{package_version_id}",
          ],
          getPackageVersionForOrganization: [
            "GET /orgs/{org}/packages/{package_type}/{package_name}/versions/{package_version_id}",
          ],
          getPackageVersionForUser: [
            "GET /users/{username}/packages/{package_type}/{package_name}/versions/{package_version_id}",
          ],
          listDockerMigrationConflictingPackagesForAuthenticatedUser: [
            "GET /user/docker/conflicts",
          ],
          listDockerMigrationConflictingPackagesForOrganization: [
            "GET /orgs/{org}/docker/conflicts",
          ],
          listDockerMigrationConflictingPackagesForUser: [
            "GET /users/{username}/docker/conflicts",
          ],
          listPackagesForAuthenticatedUser: ["GET /user/packages"],
          listPackagesForOrganization: ["GET /orgs/{org}/packages"],
          listPackagesForUser: ["GET /users/{username}/packages"],
          restorePackageForAuthenticatedUser: [
            "POST /user/packages/{package_type}/{package_name}/restore{?token}",
          ],
          restorePackageForOrg: [
            "POST /orgs/{org}/packages/{package_type}/{package_name}/restore{?token}",
          ],
          restorePackageForUser: [
            "POST /users/{username}/packages/{package_type}/{package_name}/restore{?token}",
          ],
          restorePackageVersionForAuthenticatedUser: [
            "POST /user/packages/{package_type}/{package_name}/versions/{package_version_id}/restore",
          ],
          restorePackageVersionForOrg: [
            "POST /orgs/{org}/packages/{package_type}/{package_name}/versions/{package_version_id}/restore",
          ],
          restorePackageVersionForUser: [
            "POST /users/{username}/packages/{package_type}/{package_name}/versions/{package_version_id}/restore",
          ],
        },
        projects: {
          addCollaborator: [
            "PUT /projects/{project_id}/collaborators/{username}",
          ],
          createCard: ["POST /projects/columns/{column_id}/cards"],
          createColumn: ["POST /projects/{project_id}/columns"],
          createForAuthenticatedUser: ["POST /user/projects"],
          createForOrg: ["POST /orgs/{org}/projects"],
          createForRepo: ["POST /repos/{owner}/{repo}/projects"],
          delete: ["DELETE /projects/{project_id}"],
          deleteCard: ["DELETE /projects/columns/cards/{card_id}"],
          deleteColumn: ["DELETE /projects/columns/{column_id}"],
          get: ["GET /projects/{project_id}"],
          getCard: ["GET /projects/columns/cards/{card_id}"],
          getColumn: ["GET /projects/columns/{column_id}"],
          getPermissionForUser: [
            "GET /projects/{project_id}/collaborators/{username}/permission",
          ],
          listCards: ["GET /projects/columns/{column_id}/cards"],
          listCollaborators: ["GET /projects/{project_id}/collaborators"],
          listColumns: ["GET /projects/{project_id}/columns"],
          listForOrg: ["GET /orgs/{org}/projects"],
          listForRepo: ["GET /repos/{owner}/{repo}/projects"],
          listForUser: ["GET /users/{username}/projects"],
          moveCard: ["POST /projects/columns/cards/{card_id}/moves"],
          moveColumn: ["POST /projects/columns/{column_id}/moves"],
          removeCollaborator: [
            "DELETE /projects/{project_id}/collaborators/{username}",
          ],
          update: ["PATCH /projects/{project_id}"],
          updateCard: ["PATCH /projects/columns/cards/{card_id}"],
          updateColumn: ["PATCH /projects/columns/{column_id}"],
        },
        pulls: {
          checkIfMerged: [
            "GET /repos/{owner}/{repo}/pulls/{pull_number}/merge",
          ],
          create: ["POST /repos/{owner}/{repo}/pulls"],
          createReplyForReviewComment: [
            "POST /repos/{owner}/{repo}/pulls/{pull_number}/comments/{comment_id}/replies",
          ],
          createReview: [
            "POST /repos/{owner}/{repo}/pulls/{pull_number}/reviews",
          ],
          createReviewComment: [
            "POST /repos/{owner}/{repo}/pulls/{pull_number}/comments",
          ],
          deletePendingReview: [
            "DELETE /repos/{owner}/{repo}/pulls/{pull_number}/reviews/{review_id}",
          ],
          deleteReviewComment: [
            "DELETE /repos/{owner}/{repo}/pulls/comments/{comment_id}",
          ],
          dismissReview: [
            "PUT /repos/{owner}/{repo}/pulls/{pull_number}/reviews/{review_id}/dismissals",
          ],
          get: ["GET /repos/{owner}/{repo}/pulls/{pull_number}"],
          getReview: [
            "GET /repos/{owner}/{repo}/pulls/{pull_number}/reviews/{review_id}",
          ],
          getReviewComment: [
            "GET /repos/{owner}/{repo}/pulls/comments/{comment_id}",
          ],
          list: ["GET /repos/{owner}/{repo}/pulls"],
          listCommentsForReview: [
            "GET /repos/{owner}/{repo}/pulls/{pull_number}/reviews/{review_id}/comments",
          ],
          listCommits: [
            "GET /repos/{owner}/{repo}/pulls/{pull_number}/commits",
          ],
          listFiles: ["GET /repos/{owner}/{repo}/pulls/{pull_number}/files"],
          listRequestedReviewers: [
            "GET /repos/{owner}/{repo}/pulls/{pull_number}/requested_reviewers",
          ],
          listReviewComments: [
            "GET /repos/{owner}/{repo}/pulls/{pull_number}/comments",
          ],
          listReviewCommentsForRepo: [
            "GET /repos/{owner}/{repo}/pulls/comments",
          ],
          listReviews: [
            "GET /repos/{owner}/{repo}/pulls/{pull_number}/reviews",
          ],
          merge: ["PUT /repos/{owner}/{repo}/pulls/{pull_number}/merge"],
          removeRequestedReviewers: [
            "DELETE /repos/{owner}/{repo}/pulls/{pull_number}/requested_reviewers",
          ],
          requestReviewers: [
            "POST /repos/{owner}/{repo}/pulls/{pull_number}/requested_reviewers",
          ],
          submitReview: [
            "POST /repos/{owner}/{repo}/pulls/{pull_number}/reviews/{review_id}/events",
          ],
          update: ["PATCH /repos/{owner}/{repo}/pulls/{pull_number}"],
          updateBranch: [
            "PUT /repos/{owner}/{repo}/pulls/{pull_number}/update-branch",
          ],
          updateReview: [
            "PUT /repos/{owner}/{repo}/pulls/{pull_number}/reviews/{review_id}",
          ],
          updateReviewComment: [
            "PATCH /repos/{owner}/{repo}/pulls/comments/{comment_id}",
          ],
        },
        rateLimit: { get: ["GET /rate_limit"] },
        reactions: {
          createForCommitComment: [
            "POST /repos/{owner}/{repo}/comments/{comment_id}/reactions",
          ],
          createForIssue: [
            "POST /repos/{owner}/{repo}/issues/{issue_number}/reactions",
          ],
          createForIssueComment: [
            "POST /repos/{owner}/{repo}/issues/comments/{comment_id}/reactions",
          ],
          createForPullRequestReviewComment: [
            "POST /repos/{owner}/{repo}/pulls/comments/{comment_id}/reactions",
          ],
          createForRelease: [
            "POST /repos/{owner}/{repo}/releases/{release_id}/reactions",
          ],
          createForTeamDiscussionCommentInOrg: [
            "POST /orgs/{org}/teams/{team_slug}/discussions/{discussion_number}/comments/{comment_number}/reactions",
          ],
          createForTeamDiscussionInOrg: [
            "POST /orgs/{org}/teams/{team_slug}/discussions/{discussion_number}/reactions",
          ],
          deleteForCommitComment: [
            "DELETE /repos/{owner}/{repo}/comments/{comment_id}/reactions/{reaction_id}",
          ],
          deleteForIssue: [
            "DELETE /repos/{owner}/{repo}/issues/{issue_number}/reactions/{reaction_id}",
          ],
          deleteForIssueComment: [
            "DELETE /repos/{owner}/{repo}/issues/comments/{comment_id}/reactions/{reaction_id}",
          ],
          deleteForPullRequestComment: [
            "DELETE /repos/{owner}/{repo}/pulls/comments/{comment_id}/reactions/{reaction_id}",
          ],
          deleteForRelease: [
            "DELETE /repos/{owner}/{repo}/releases/{release_id}/reactions/{reaction_id}",
          ],
          deleteForTeamDiscussion: [
            "DELETE /orgs/{org}/teams/{team_slug}/discussions/{discussion_number}/reactions/{reaction_id}",
          ],
          deleteForTeamDiscussionComment: [
            "DELETE /orgs/{org}/teams/{team_slug}/discussions/{discussion_number}/comments/{comment_number}/reactions/{reaction_id}",
          ],
          listForCommitComment: [
            "GET /repos/{owner}/{repo}/comments/{comment_id}/reactions",
          ],
          listForIssue: [
            "GET /repos/{owner}/{repo}/issues/{issue_number}/reactions",
          ],
          listForIssueComment: [
            "GET /repos/{owner}/{repo}/issues/comments/{comment_id}/reactions",
          ],
          listForPullRequestReviewComment: [
            "GET /repos/{owner}/{repo}/pulls/comments/{comment_id}/reactions",
          ],
          listForRelease: [
            "GET /repos/{owner}/{repo}/releases/{release_id}/reactions",
          ],
          listForTeamDiscussionCommentInOrg: [
            "GET /orgs/{org}/teams/{team_slug}/discussions/{discussion_number}/comments/{comment_number}/reactions",
          ],
          listForTeamDiscussionInOrg: [
            "GET /orgs/{org}/teams/{team_slug}/discussions/{discussion_number}/reactions",
          ],
        },
        repos: {
          acceptInvitation: [
            "PATCH /user/repository_invitations/{invitation_id}",
            {},
            { renamed: ["repos", "acceptInvitationForAuthenticatedUser"] },
          ],
          acceptInvitationForAuthenticatedUser: [
            "PATCH /user/repository_invitations/{invitation_id}",
          ],
          addAppAccessRestrictions: [
            "POST /repos/{owner}/{repo}/branches/{branch}/protection/restrictions/apps",
            {},
            { mapToData: "apps" },
          ],
          addCollaborator: [
            "PUT /repos/{owner}/{repo}/collaborators/{username}",
          ],
          addStatusCheckContexts: [
            "POST /repos/{owner}/{repo}/branches/{branch}/protection/required_status_checks/contexts",
            {},
            { mapToData: "contexts" },
          ],
          addTeamAccessRestrictions: [
            "POST /repos/{owner}/{repo}/branches/{branch}/protection/restrictions/teams",
            {},
            { mapToData: "teams" },
          ],
          addUserAccessRestrictions: [
            "POST /repos/{owner}/{repo}/branches/{branch}/protection/restrictions/users",
            {},
            { mapToData: "users" },
          ],
          checkCollaborator: [
            "GET /repos/{owner}/{repo}/collaborators/{username}",
          ],
          checkVulnerabilityAlerts: [
            "GET /repos/{owner}/{repo}/vulnerability-alerts",
          ],
          codeownersErrors: ["GET /repos/{owner}/{repo}/codeowners/errors"],
          compareCommits: ["GET /repos/{owner}/{repo}/compare/{base}...{head}"],
          compareCommitsWithBasehead: [
            "GET /repos/{owner}/{repo}/compare/{basehead}",
          ],
          createAutolink: ["POST /repos/{owner}/{repo}/autolinks"],
          createCommitComment: [
            "POST /repos/{owner}/{repo}/commits/{commit_sha}/comments",
          ],
          createCommitSignatureProtection: [
            "POST /repos/{owner}/{repo}/branches/{branch}/protection/required_signatures",
          ],
          createCommitStatus: ["POST /repos/{owner}/{repo}/statuses/{sha}"],
          createDeployKey: ["POST /repos/{owner}/{repo}/keys"],
          createDeployment: ["POST /repos/{owner}/{repo}/deployments"],
          createDeploymentBranchPolicy: [
            "POST /repos/{owner}/{repo}/environments/{environment_name}/deployment-branch-policies",
          ],
          createDeploymentProtectionRule: [
            "POST /repos/{owner}/{repo}/environments/{environment_name}/deployment_protection_rules",
          ],
          createDeploymentStatus: [
            "POST /repos/{owner}/{repo}/deployments/{deployment_id}/statuses",
          ],
          createDispatchEvent: ["POST /repos/{owner}/{repo}/dispatches"],
          createForAuthenticatedUser: ["POST /user/repos"],
          createFork: ["POST /repos/{owner}/{repo}/forks"],
          createInOrg: ["POST /orgs/{org}/repos"],
          createOrUpdateEnvironment: [
            "PUT /repos/{owner}/{repo}/environments/{environment_name}",
          ],
          createOrUpdateFileContents: [
            "PUT /repos/{owner}/{repo}/contents/{path}",
          ],
          createOrgRuleset: ["POST /orgs/{org}/rulesets"],
          createPagesDeployment: [
            "POST /repos/{owner}/{repo}/pages/deployment",
          ],
          createPagesSite: ["POST /repos/{owner}/{repo}/pages"],
          createRelease: ["POST /repos/{owner}/{repo}/releases"],
          createRepoRuleset: ["POST /repos/{owner}/{repo}/rulesets"],
          createTagProtection: ["POST /repos/{owner}/{repo}/tags/protection"],
          createUsingTemplate: [
            "POST /repos/{template_owner}/{template_repo}/generate",
          ],
          createWebhook: ["POST /repos/{owner}/{repo}/hooks"],
          declineInvitation: [
            "DELETE /user/repository_invitations/{invitation_id}",
            {},
            { renamed: ["repos", "declineInvitationForAuthenticatedUser"] },
          ],
          declineInvitationForAuthenticatedUser: [
            "DELETE /user/repository_invitations/{invitation_id}",
          ],
          delete: ["DELETE /repos/{owner}/{repo}"],
          deleteAccessRestrictions: [
            "DELETE /repos/{owner}/{repo}/branches/{branch}/protection/restrictions",
          ],
          deleteAdminBranchProtection: [
            "DELETE /repos/{owner}/{repo}/branches/{branch}/protection/enforce_admins",
          ],
          deleteAnEnvironment: [
            "DELETE /repos/{owner}/{repo}/environments/{environment_name}",
          ],
          deleteAutolink: [
            "DELETE /repos/{owner}/{repo}/autolinks/{autolink_id}",
          ],
          deleteBranchProtection: [
            "DELETE /repos/{owner}/{repo}/branches/{branch}/protection",
          ],
          deleteCommitComment: [
            "DELETE /repos/{owner}/{repo}/comments/{comment_id}",
          ],
          deleteCommitSignatureProtection: [
            "DELETE /repos/{owner}/{repo}/branches/{branch}/protection/required_signatures",
          ],
          deleteDeployKey: ["DELETE /repos/{owner}/{repo}/keys/{key_id}"],
          deleteDeployment: [
            "DELETE /repos/{owner}/{repo}/deployments/{deployment_id}",
          ],
          deleteDeploymentBranchPolicy: [
            "DELETE /repos/{owner}/{repo}/environments/{environment_name}/deployment-branch-policies/{branch_policy_id}",
          ],
          deleteFile: ["DELETE /repos/{owner}/{repo}/contents/{path}"],
          deleteInvitation: [
            "DELETE /repos/{owner}/{repo}/invitations/{invitation_id}",
          ],
          deleteOrgRuleset: ["DELETE /orgs/{org}/rulesets/{ruleset_id}"],
          deletePagesSite: ["DELETE /repos/{owner}/{repo}/pages"],
          deletePullRequestReviewProtection: [
            "DELETE /repos/{owner}/{repo}/branches/{branch}/protection/required_pull_request_reviews",
          ],
          deleteRelease: ["DELETE /repos/{owner}/{repo}/releases/{release_id}"],
          deleteReleaseAsset: [
            "DELETE /repos/{owner}/{repo}/releases/assets/{asset_id}",
          ],
          deleteRepoRuleset: [
            "DELETE /repos/{owner}/{repo}/rulesets/{ruleset_id}",
          ],
          deleteTagProtection: [
            "DELETE /repos/{owner}/{repo}/tags/protection/{tag_protection_id}",
          ],
          deleteWebhook: ["DELETE /repos/{owner}/{repo}/hooks/{hook_id}"],
          disableAutomatedSecurityFixes: [
            "DELETE /repos/{owner}/{repo}/automated-security-fixes",
          ],
          disableDeploymentProtectionRule: [
            "DELETE /repos/{owner}/{repo}/environments/{environment_name}/deployment_protection_rules/{protection_rule_id}",
          ],
          disableLfsForRepo: ["DELETE /repos/{owner}/{repo}/lfs"],
          disableVulnerabilityAlerts: [
            "DELETE /repos/{owner}/{repo}/vulnerability-alerts",
          ],
          downloadArchive: [
            "GET /repos/{owner}/{repo}/zipball/{ref}",
            {},
            { renamed: ["repos", "downloadZipballArchive"] },
          ],
          downloadTarballArchive: ["GET /repos/{owner}/{repo}/tarball/{ref}"],
          downloadZipballArchive: ["GET /repos/{owner}/{repo}/zipball/{ref}"],
          enableAutomatedSecurityFixes: [
            "PUT /repos/{owner}/{repo}/automated-security-fixes",
          ],
          enableLfsForRepo: ["PUT /repos/{owner}/{repo}/lfs"],
          enableVulnerabilityAlerts: [
            "PUT /repos/{owner}/{repo}/vulnerability-alerts",
          ],
          generateReleaseNotes: [
            "POST /repos/{owner}/{repo}/releases/generate-notes",
          ],
          get: ["GET /repos/{owner}/{repo}"],
          getAccessRestrictions: [
            "GET /repos/{owner}/{repo}/branches/{branch}/protection/restrictions",
          ],
          getAdminBranchProtection: [
            "GET /repos/{owner}/{repo}/branches/{branch}/protection/enforce_admins",
          ],
          getAllDeploymentProtectionRules: [
            "GET /repos/{owner}/{repo}/environments/{environment_name}/deployment_protection_rules",
          ],
          getAllEnvironments: ["GET /repos/{owner}/{repo}/environments"],
          getAllStatusCheckContexts: [
            "GET /repos/{owner}/{repo}/branches/{branch}/protection/required_status_checks/contexts",
          ],
          getAllTopics: ["GET /repos/{owner}/{repo}/topics"],
          getAppsWithAccessToProtectedBranch: [
            "GET /repos/{owner}/{repo}/branches/{branch}/protection/restrictions/apps",
          ],
          getAutolink: ["GET /repos/{owner}/{repo}/autolinks/{autolink_id}"],
          getBranch: ["GET /repos/{owner}/{repo}/branches/{branch}"],
          getBranchProtection: [
            "GET /repos/{owner}/{repo}/branches/{branch}/protection",
          ],
          getBranchRules: ["GET /repos/{owner}/{repo}/rules/branches/{branch}"],
          getClones: ["GET /repos/{owner}/{repo}/traffic/clones"],
          getCodeFrequencyStats: [
            "GET /repos/{owner}/{repo}/stats/code_frequency",
          ],
          getCollaboratorPermissionLevel: [
            "GET /repos/{owner}/{repo}/collaborators/{username}/permission",
          ],
          getCombinedStatusForRef: [
            "GET /repos/{owner}/{repo}/commits/{ref}/status",
          ],
          getCommit: ["GET /repos/{owner}/{repo}/commits/{ref}"],
          getCommitActivityStats: [
            "GET /repos/{owner}/{repo}/stats/commit_activity",
          ],
          getCommitComment: ["GET /repos/{owner}/{repo}/comments/{comment_id}"],
          getCommitSignatureProtection: [
            "GET /repos/{owner}/{repo}/branches/{branch}/protection/required_signatures",
          ],
          getCommunityProfileMetrics: [
            "GET /repos/{owner}/{repo}/community/profile",
          ],
          getContent: ["GET /repos/{owner}/{repo}/contents/{path}"],
          getContributorsStats: [
            "GET /repos/{owner}/{repo}/stats/contributors",
          ],
          getCustomDeploymentProtectionRule: [
            "GET /repos/{owner}/{repo}/environments/{environment_name}/deployment_protection_rules/{protection_rule_id}",
          ],
          getDeployKey: ["GET /repos/{owner}/{repo}/keys/{key_id}"],
          getDeployment: [
            "GET /repos/{owner}/{repo}/deployments/{deployment_id}",
          ],
          getDeploymentBranchPolicy: [
            "GET /repos/{owner}/{repo}/environments/{environment_name}/deployment-branch-policies/{branch_policy_id}",
          ],
          getDeploymentStatus: [
            "GET /repos/{owner}/{repo}/deployments/{deployment_id}/statuses/{status_id}",
          ],
          getEnvironment: [
            "GET /repos/{owner}/{repo}/environments/{environment_name}",
          ],
          getLatestPagesBuild: [
            "GET /repos/{owner}/{repo}/pages/builds/latest",
          ],
          getLatestRelease: ["GET /repos/{owner}/{repo}/releases/latest"],
          getOrgRuleset: ["GET /orgs/{org}/rulesets/{ruleset_id}"],
          getOrgRulesets: ["GET /orgs/{org}/rulesets"],
          getPages: ["GET /repos/{owner}/{repo}/pages"],
          getPagesBuild: ["GET /repos/{owner}/{repo}/pages/builds/{build_id}"],
          getPagesHealthCheck: ["GET /repos/{owner}/{repo}/pages/health"],
          getParticipationStats: [
            "GET /repos/{owner}/{repo}/stats/participation",
          ],
          getPullRequestReviewProtection: [
            "GET /repos/{owner}/{repo}/branches/{branch}/protection/required_pull_request_reviews",
          ],
          getPunchCardStats: ["GET /repos/{owner}/{repo}/stats/punch_card"],
          getReadme: ["GET /repos/{owner}/{repo}/readme"],
          getReadmeInDirectory: ["GET /repos/{owner}/{repo}/readme/{dir}"],
          getRelease: ["GET /repos/{owner}/{repo}/releases/{release_id}"],
          getReleaseAsset: [
            "GET /repos/{owner}/{repo}/releases/assets/{asset_id}",
          ],
          getReleaseByTag: ["GET /repos/{owner}/{repo}/releases/tags/{tag}"],
          getRepoRuleset: ["GET /repos/{owner}/{repo}/rulesets/{ruleset_id}"],
          getRepoRulesets: ["GET /repos/{owner}/{repo}/rulesets"],
          getStatusChecksProtection: [
            "GET /repos/{owner}/{repo}/branches/{branch}/protection/required_status_checks",
          ],
          getTeamsWithAccessToProtectedBranch: [
            "GET /repos/{owner}/{repo}/branches/{branch}/protection/restrictions/teams",
          ],
          getTopPaths: ["GET /repos/{owner}/{repo}/traffic/popular/paths"],
          getTopReferrers: [
            "GET /repos/{owner}/{repo}/traffic/popular/referrers",
          ],
          getUsersWithAccessToProtectedBranch: [
            "GET /repos/{owner}/{repo}/branches/{branch}/protection/restrictions/users",
          ],
          getViews: ["GET /repos/{owner}/{repo}/traffic/views"],
          getWebhook: ["GET /repos/{owner}/{repo}/hooks/{hook_id}"],
          getWebhookConfigForRepo: [
            "GET /repos/{owner}/{repo}/hooks/{hook_id}/config",
          ],
          getWebhookDelivery: [
            "GET /repos/{owner}/{repo}/hooks/{hook_id}/deliveries/{delivery_id}",
          ],
          listAutolinks: ["GET /repos/{owner}/{repo}/autolinks"],
          listBranches: ["GET /repos/{owner}/{repo}/branches"],
          listBranchesForHeadCommit: [
            "GET /repos/{owner}/{repo}/commits/{commit_sha}/branches-where-head",
          ],
          listCollaborators: ["GET /repos/{owner}/{repo}/collaborators"],
          listCommentsForCommit: [
            "GET /repos/{owner}/{repo}/commits/{commit_sha}/comments",
          ],
          listCommitCommentsForRepo: ["GET /repos/{owner}/{repo}/comments"],
          listCommitStatusesForRef: [
            "GET /repos/{owner}/{repo}/commits/{ref}/statuses",
          ],
          listCommits: ["GET /repos/{owner}/{repo}/commits"],
          listContributors: ["GET /repos/{owner}/{repo}/contributors"],
          listCustomDeploymentRuleIntegrations: [
            "GET /repos/{owner}/{repo}/environments/{environment_name}/deployment_protection_rules/apps",
          ],
          listDeployKeys: ["GET /repos/{owner}/{repo}/keys"],
          listDeploymentBranchPolicies: [
            "GET /repos/{owner}/{repo}/environments/{environment_name}/deployment-branch-policies",
          ],
          listDeploymentStatuses: [
            "GET /repos/{owner}/{repo}/deployments/{deployment_id}/statuses",
          ],
          listDeployments: ["GET /repos/{owner}/{repo}/deployments"],
          listForAuthenticatedUser: ["GET /user/repos"],
          listForOrg: ["GET /orgs/{org}/repos"],
          listForUser: ["GET /users/{username}/repos"],
          listForks: ["GET /repos/{owner}/{repo}/forks"],
          listInvitations: ["GET /repos/{owner}/{repo}/invitations"],
          listInvitationsForAuthenticatedUser: [
            "GET /user/repository_invitations",
          ],
          listLanguages: ["GET /repos/{owner}/{repo}/languages"],
          listPagesBuilds: ["GET /repos/{owner}/{repo}/pages/builds"],
          listPublic: ["GET /repositories"],
          listPullRequestsAssociatedWithCommit: [
            "GET /repos/{owner}/{repo}/commits/{commit_sha}/pulls",
          ],
          listReleaseAssets: [
            "GET /repos/{owner}/{repo}/releases/{release_id}/assets",
          ],
          listReleases: ["GET /repos/{owner}/{repo}/releases"],
          listTagProtection: ["GET /repos/{owner}/{repo}/tags/protection"],
          listTags: ["GET /repos/{owner}/{repo}/tags"],
          listTeams: ["GET /repos/{owner}/{repo}/teams"],
          listWebhookDeliveries: [
            "GET /repos/{owner}/{repo}/hooks/{hook_id}/deliveries",
          ],
          listWebhooks: ["GET /repos/{owner}/{repo}/hooks"],
          merge: ["POST /repos/{owner}/{repo}/merges"],
          mergeUpstream: ["POST /repos/{owner}/{repo}/merge-upstream"],
          pingWebhook: ["POST /repos/{owner}/{repo}/hooks/{hook_id}/pings"],
          redeliverWebhookDelivery: [
            "POST /repos/{owner}/{repo}/hooks/{hook_id}/deliveries/{delivery_id}/attempts",
          ],
          removeAppAccessRestrictions: [
            "DELETE /repos/{owner}/{repo}/branches/{branch}/protection/restrictions/apps",
            {},
            { mapToData: "apps" },
          ],
          removeCollaborator: [
            "DELETE /repos/{owner}/{repo}/collaborators/{username}",
          ],
          removeStatusCheckContexts: [
            "DELETE /repos/{owner}/{repo}/branches/{branch}/protection/required_status_checks/contexts",
            {},
            { mapToData: "contexts" },
          ],
          removeStatusCheckProtection: [
            "DELETE /repos/{owner}/{repo}/branches/{branch}/protection/required_status_checks",
          ],
          removeTeamAccessRestrictions: [
            "DELETE /repos/{owner}/{repo}/branches/{branch}/protection/restrictions/teams",
            {},
            { mapToData: "teams" },
          ],
          removeUserAccessRestrictions: [
            "DELETE /repos/{owner}/{repo}/branches/{branch}/protection/restrictions/users",
            {},
            { mapToData: "users" },
          ],
          renameBranch: ["POST /repos/{owner}/{repo}/branches/{branch}/rename"],
          replaceAllTopics: ["PUT /repos/{owner}/{repo}/topics"],
          requestPagesBuild: ["POST /repos/{owner}/{repo}/pages/builds"],
          setAdminBranchProtection: [
            "POST /repos/{owner}/{repo}/branches/{branch}/protection/enforce_admins",
          ],
          setAppAccessRestrictions: [
            "PUT /repos/{owner}/{repo}/branches/{branch}/protection/restrictions/apps",
            {},
            { mapToData: "apps" },
          ],
          setStatusCheckContexts: [
            "PUT /repos/{owner}/{repo}/branches/{branch}/protection/required_status_checks/contexts",
            {},
            { mapToData: "contexts" },
          ],
          setTeamAccessRestrictions: [
            "PUT /repos/{owner}/{repo}/branches/{branch}/protection/restrictions/teams",
            {},
            { mapToData: "teams" },
          ],
          setUserAccessRestrictions: [
            "PUT /repos/{owner}/{repo}/branches/{branch}/protection/restrictions/users",
            {},
            { mapToData: "users" },
          ],
          testPushWebhook: ["POST /repos/{owner}/{repo}/hooks/{hook_id}/tests"],
          transfer: ["POST /repos/{owner}/{repo}/transfer"],
          update: ["PATCH /repos/{owner}/{repo}"],
          updateBranchProtection: [
            "PUT /repos/{owner}/{repo}/branches/{branch}/protection",
          ],
          updateCommitComment: [
            "PATCH /repos/{owner}/{repo}/comments/{comment_id}",
          ],
          updateDeploymentBranchPolicy: [
            "PUT /repos/{owner}/{repo}/environments/{environment_name}/deployment-branch-policies/{branch_policy_id}",
          ],
          updateInformationAboutPagesSite: ["PUT /repos/{owner}/{repo}/pages"],
          updateInvitation: [
            "PATCH /repos/{owner}/{repo}/invitations/{invitation_id}",
          ],
          updateOrgRuleset: ["PUT /orgs/{org}/rulesets/{ruleset_id}"],
          updatePullRequestReviewProtection: [
            "PATCH /repos/{owner}/{repo}/branches/{branch}/protection/required_pull_request_reviews",
          ],
          updateRelease: ["PATCH /repos/{owner}/{repo}/releases/{release_id}"],
          updateReleaseAsset: [
            "PATCH /repos/{owner}/{repo}/releases/assets/{asset_id}",
          ],
          updateRepoRuleset: [
            "PUT /repos/{owner}/{repo}/rulesets/{ruleset_id}",
          ],
          updateStatusCheckPotection: [
            "PATCH /repos/{owner}/{repo}/branches/{branch}/protection/required_status_checks",
            {},
            { renamed: ["repos", "updateStatusCheckProtection"] },
          ],
          updateStatusCheckProtection: [
            "PATCH /repos/{owner}/{repo}/branches/{branch}/protection/required_status_checks",
          ],
          updateWebhook: ["PATCH /repos/{owner}/{repo}/hooks/{hook_id}"],
          updateWebhookConfigForRepo: [
            "PATCH /repos/{owner}/{repo}/hooks/{hook_id}/config",
          ],
          uploadReleaseAsset: [
            "POST /repos/{owner}/{repo}/releases/{release_id}/assets{?name,label}",
            { baseUrl: "https://uploads.github.com" },
          ],
        },
        search: {
          code: ["GET /search/code"],
          commits: ["GET /search/commits"],
          issuesAndPullRequests: ["GET /search/issues"],
          labels: ["GET /search/labels"],
          repos: ["GET /search/repositories"],
          topics: ["GET /search/topics"],
          users: ["GET /search/users"],
        },
        secretScanning: {
          getAlert: [
            "GET /repos/{owner}/{repo}/secret-scanning/alerts/{alert_number}",
          ],
          listAlertsForEnterprise: [
            "GET /enterprises/{enterprise}/secret-scanning/alerts",
          ],
          listAlertsForOrg: ["GET /orgs/{org}/secret-scanning/alerts"],
          listAlertsForRepo: [
            "GET /repos/{owner}/{repo}/secret-scanning/alerts",
          ],
          listLocationsForAlert: [
            "GET /repos/{owner}/{repo}/secret-scanning/alerts/{alert_number}/locations",
          ],
          updateAlert: [
            "PATCH /repos/{owner}/{repo}/secret-scanning/alerts/{alert_number}",
          ],
        },
        securityAdvisories: {
          createPrivateVulnerabilityReport: [
            "POST /repos/{owner}/{repo}/security-advisories/reports",
          ],
          createRepositoryAdvisory: [
            "POST /repos/{owner}/{repo}/security-advisories",
          ],
          getRepositoryAdvisory: [
            "GET /repos/{owner}/{repo}/security-advisories/{ghsa_id}",
          ],
          listRepositoryAdvisories: [
            "GET /repos/{owner}/{repo}/security-advisories",
          ],
          updateRepositoryAdvisory: [
            "PATCH /repos/{owner}/{repo}/security-advisories/{ghsa_id}",
          ],
        },
        teams: {
          addOrUpdateMembershipForUserInOrg: [
            "PUT /orgs/{org}/teams/{team_slug}/memberships/{username}",
          ],
          addOrUpdateProjectPermissionsInOrg: [
            "PUT /orgs/{org}/teams/{team_slug}/projects/{project_id}",
          ],
          addOrUpdateRepoPermissionsInOrg: [
            "PUT /orgs/{org}/teams/{team_slug}/repos/{owner}/{repo}",
          ],
          checkPermissionsForProjectInOrg: [
            "GET /orgs/{org}/teams/{team_slug}/projects/{project_id}",
          ],
          checkPermissionsForRepoInOrg: [
            "GET /orgs/{org}/teams/{team_slug}/repos/{owner}/{repo}",
          ],
          create: ["POST /orgs/{org}/teams"],
          createDiscussionCommentInOrg: [
            "POST /orgs/{org}/teams/{team_slug}/discussions/{discussion_number}/comments",
          ],
          createDiscussionInOrg: [
            "POST /orgs/{org}/teams/{team_slug}/discussions",
          ],
          deleteDiscussionCommentInOrg: [
            "DELETE /orgs/{org}/teams/{team_slug}/discussions/{discussion_number}/comments/{comment_number}",
          ],
          deleteDiscussionInOrg: [
            "DELETE /orgs/{org}/teams/{team_slug}/discussions/{discussion_number}",
          ],
          deleteInOrg: ["DELETE /orgs/{org}/teams/{team_slug}"],
          getByName: ["GET /orgs/{org}/teams/{team_slug}"],
          getDiscussionCommentInOrg: [
            "GET /orgs/{org}/teams/{team_slug}/discussions/{discussion_number}/comments/{comment_number}",
          ],
          getDiscussionInOrg: [
            "GET /orgs/{org}/teams/{team_slug}/discussions/{discussion_number}",
          ],
          getMembershipForUserInOrg: [
            "GET /orgs/{org}/teams/{team_slug}/memberships/{username}",
          ],
          list: ["GET /orgs/{org}/teams"],
          listChildInOrg: ["GET /orgs/{org}/teams/{team_slug}/teams"],
          listDiscussionCommentsInOrg: [
            "GET /orgs/{org}/teams/{team_slug}/discussions/{discussion_number}/comments",
          ],
          listDiscussionsInOrg: [
            "GET /orgs/{org}/teams/{team_slug}/discussions",
          ],
          listForAuthenticatedUser: ["GET /user/teams"],
          listMembersInOrg: ["GET /orgs/{org}/teams/{team_slug}/members"],
          listPendingInvitationsInOrg: [
            "GET /orgs/{org}/teams/{team_slug}/invitations",
          ],
          listProjectsInOrg: ["GET /orgs/{org}/teams/{team_slug}/projects"],
          listReposInOrg: ["GET /orgs/{org}/teams/{team_slug}/repos"],
          removeMembershipForUserInOrg: [
            "DELETE /orgs/{org}/teams/{team_slug}/memberships/{username}",
          ],
          removeProjectInOrg: [
            "DELETE /orgs/{org}/teams/{team_slug}/projects/{project_id}",
          ],
          removeRepoInOrg: [
            "DELETE /orgs/{org}/teams/{team_slug}/repos/{owner}/{repo}",
          ],
          updateDiscussionCommentInOrg: [
            "PATCH /orgs/{org}/teams/{team_slug}/discussions/{discussion_number}/comments/{comment_number}",
          ],
          updateDiscussionInOrg: [
            "PATCH /orgs/{org}/teams/{team_slug}/discussions/{discussion_number}",
          ],
          updateInOrg: ["PATCH /orgs/{org}/teams/{team_slug}"],
        },
        users: {
          addEmailForAuthenticated: [
            "POST /user/emails",
            {},
            { renamed: ["users", "addEmailForAuthenticatedUser"] },
          ],
          addEmailForAuthenticatedUser: ["POST /user/emails"],
          addSocialAccountForAuthenticatedUser: ["POST /user/social_accounts"],
          block: ["PUT /user/blocks/{username}"],
          checkBlocked: ["GET /user/blocks/{username}"],
          checkFollowingForUser: [
            "GET /users/{username}/following/{target_user}",
          ],
          checkPersonIsFollowedByAuthenticated: [
            "GET /user/following/{username}",
          ],
          createGpgKeyForAuthenticated: [
            "POST /user/gpg_keys",
            {},
            { renamed: ["users", "createGpgKeyForAuthenticatedUser"] },
          ],
          createGpgKeyForAuthenticatedUser: ["POST /user/gpg_keys"],
          createPublicSshKeyForAuthenticated: [
            "POST /user/keys",
            {},
            { renamed: ["users", "createPublicSshKeyForAuthenticatedUser"] },
          ],
          createPublicSshKeyForAuthenticatedUser: ["POST /user/keys"],
          createSshSigningKeyForAuthenticatedUser: [
            "POST /user/ssh_signing_keys",
          ],
          deleteEmailForAuthenticated: [
            "DELETE /user/emails",
            {},
            { renamed: ["users", "deleteEmailForAuthenticatedUser"] },
          ],
          deleteEmailForAuthenticatedUser: ["DELETE /user/emails"],
          deleteGpgKeyForAuthenticated: [
            "DELETE /user/gpg_keys/{gpg_key_id}",
            {},
            { renamed: ["users", "deleteGpgKeyForAuthenticatedUser"] },
          ],
          deleteGpgKeyForAuthenticatedUser: [
            "DELETE /user/gpg_keys/{gpg_key_id}",
          ],
          deletePublicSshKeyForAuthenticated: [
            "DELETE /user/keys/{key_id}",
            {},
            { renamed: ["users", "deletePublicSshKeyForAuthenticatedUser"] },
          ],
          deletePublicSshKeyForAuthenticatedUser: [
            "DELETE /user/keys/{key_id}",
          ],
          deleteSocialAccountForAuthenticatedUser: [
            "DELETE /user/social_accounts",
          ],
          deleteSshSigningKeyForAuthenticatedUser: [
            "DELETE /user/ssh_signing_keys/{ssh_signing_key_id}",
          ],
          follow: ["PUT /user/following/{username}"],
          getAuthenticated: ["GET /user"],
          getByUsername: ["GET /users/{username}"],
          getContextForUser: ["GET /users/{username}/hovercard"],
          getGpgKeyForAuthenticated: [
            "GET /user/gpg_keys/{gpg_key_id}",
            {},
            { renamed: ["users", "getGpgKeyForAuthenticatedUser"] },
          ],
          getGpgKeyForAuthenticatedUser: ["GET /user/gpg_keys/{gpg_key_id}"],
          getPublicSshKeyForAuthenticated: [
            "GET /user/keys/{key_id}",
            {},
            { renamed: ["users", "getPublicSshKeyForAuthenticatedUser"] },
          ],
          getPublicSshKeyForAuthenticatedUser: ["GET /user/keys/{key_id}"],
          getSshSigningKeyForAuthenticatedUser: [
            "GET /user/ssh_signing_keys/{ssh_signing_key_id}",
          ],
          list: ["GET /users"],
          listBlockedByAuthenticated: [
            "GET /user/blocks",
            {},
            { renamed: ["users", "listBlockedByAuthenticatedUser"] },
          ],
          listBlockedByAuthenticatedUser: ["GET /user/blocks"],
          listEmailsForAuthenticated: [
            "GET /user/emails",
            {},
            { renamed: ["users", "listEmailsForAuthenticatedUser"] },
          ],
          listEmailsForAuthenticatedUser: ["GET /user/emails"],
          listFollowedByAuthenticated: [
            "GET /user/following",
            {},
            { renamed: ["users", "listFollowedByAuthenticatedUser"] },
          ],
          listFollowedByAuthenticatedUser: ["GET /user/following"],
          listFollowersForAuthenticatedUser: ["GET /user/followers"],
          listFollowersForUser: ["GET /users/{username}/followers"],
          listFollowingForUser: ["GET /users/{username}/following"],
          listGpgKeysForAuthenticated: [
            "GET /user/gpg_keys",
            {},
            { renamed: ["users", "listGpgKeysForAuthenticatedUser"] },
          ],
          listGpgKeysForAuthenticatedUser: ["GET /user/gpg_keys"],
          listGpgKeysForUser: ["GET /users/{username}/gpg_keys"],
          listPublicEmailsForAuthenticated: [
            "GET /user/public_emails",
            {},
            { renamed: ["users", "listPublicEmailsForAuthenticatedUser"] },
          ],
          listPublicEmailsForAuthenticatedUser: ["GET /user/public_emails"],
          listPublicKeysForUser: ["GET /users/{username}/keys"],
          listPublicSshKeysForAuthenticated: [
            "GET /user/keys",
            {},
            { renamed: ["users", "listPublicSshKeysForAuthenticatedUser"] },
          ],
          listPublicSshKeysForAuthenticatedUser: ["GET /user/keys"],
          listSocialAccountsForAuthenticatedUser: ["GET /user/social_accounts"],
          listSocialAccountsForUser: ["GET /users/{username}/social_accounts"],
          listSshSigningKeysForAuthenticatedUser: [
            "GET /user/ssh_signing_keys",
          ],
          listSshSigningKeysForUser: ["GET /users/{username}/ssh_signing_keys"],
          setPrimaryEmailVisibilityForAuthenticated: [
            "PATCH /user/email/visibility",
            {},
            {
              renamed: [
                "users",
                "setPrimaryEmailVisibilityForAuthenticatedUser",
              ],
            },
          ],
          setPrimaryEmailVisibilityForAuthenticatedUser: [
            "PATCH /user/email/visibility",
          ],
          unblock: ["DELETE /user/blocks/{username}"],
          unfollow: ["DELETE /user/following/{username}"],
          updateAuthenticated: ["PATCH /user"],
        },
      };
      var endpoints_default = Endpoints;

      // pkg/dist-src/endpoints-to-methods.js
      var endpointMethodsMap = /* @__PURE__ */ new Map();
      for (const [scope, endpoints] of Object.entries(endpoints_default)) {
        for (const [methodName, endpoint] of Object.entries(endpoints)) {
          const [route, defaults, decorations] = endpoint;
          const [method, url] = route.split(/ /);
          const endpointDefaults = Object.assign(
            {
              method,
              url,
            },
            defaults,
          );
          if (!endpointMethodsMap.has(scope)) {
            endpointMethodsMap.set(scope, /* @__PURE__ */ new Map());
          }
          endpointMethodsMap.get(scope).set(methodName, {
            scope,
            methodName,
            endpointDefaults,
            decorations,
          });
        }
      }
      var handler = {
        get({ octokit, scope, cache }, methodName) {
          if (cache[methodName]) {
            return cache[methodName];
          }
          const { decorations, endpointDefaults } = endpointMethodsMap
            .get(scope)
            .get(methodName);
          if (decorations) {
            cache[methodName] = decorate(
              octokit,
              scope,
              methodName,
              endpointDefaults,
              decorations,
            );
          } else {
            cache[methodName] = octokit.request.defaults(endpointDefaults);
          }
          return cache[methodName];
        },
      };
      function endpointsToMethods(octokit) {
        const newMethods = {};
        for (const scope of endpointMethodsMap.keys()) {
          newMethods[scope] = new Proxy({ octokit, scope, cache: {} }, handler);
        }
        return newMethods;
      }
      function decorate(octokit, scope, methodName, defaults, decorations) {
        const requestWithDefaults = octokit.request.defaults(defaults);
        function withDecorations(...args) {
          let options = requestWithDefaults.endpoint.merge(...args);
          if (decorations.mapToData) {
            options = Object.assign({}, options, {
              data: options[decorations.mapToData],
              [decorations.mapToData]: void 0,
            });
            return requestWithDefaults(options);
          }
          if (decorations.renamed) {
            const [newScope, newMethodName] = decorations.renamed;
            octokit.log.warn(
              `octokit.${scope}.${methodName}() has been renamed to octokit.${newScope}.${newMethodName}()`,
            );
          }
          if (decorations.deprecated) {
            octokit.log.warn(decorations.deprecated);
          }
          if (decorations.renamedParameters) {
            const options2 = requestWithDefaults.endpoint.merge(...args);
            for (const [name, alias] of Object.entries(
              decorations.renamedParameters,
            )) {
              if (name in options2) {
                octokit.log.warn(
                  `"${name}" parameter is deprecated for "octokit.${scope}.${methodName}()". Use "${alias}" instead`,
                );
                if (!(alias in options2)) {
                  options2[alias] = options2[name];
                }
                delete options2[name];
              }
            }
            return requestWithDefaults(options2);
          }
          return requestWithDefaults(...args);
        }
        return Object.assign(withDecorations, requestWithDefaults);
      }

      // pkg/dist-src/index.js
      function restEndpointMethods(octokit) {
        const api = endpointsToMethods(octokit);
        return {
          rest: api,
        };
      }
      restEndpointMethods.VERSION = VERSION;
      function legacyRestEndpointMethods(octokit) {
        const api = endpointsToMethods(octokit);
        return {
          ...api,
          rest: api,
        };
      }
      legacyRestEndpointMethods.VERSION = VERSION;
      // Annotate the CommonJS export names for ESM import in node:
      0 && 0;

      /***/
    },

    /***/ 4478: /***/ (
      module,
      __unused_webpack_exports,
      __nccwpck_require__,
    ) => {
      "use strict";

      var __create = Object.create;
      var __defProp = Object.defineProperty;
      var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
      var __getOwnPropNames = Object.getOwnPropertyNames;
      var __getProtoOf = Object.getPrototypeOf;
      var __hasOwnProp = Object.prototype.hasOwnProperty;
      var __export = (target, all) => {
        for (var name in all)
          __defProp(target, name, { get: all[name], enumerable: true });
      };
      var __copyProps = (to, from, except, desc) => {
        if ((from && typeof from === "object") || typeof from === "function") {
          for (let key of __getOwnPropNames(from))
            if (!__hasOwnProp.call(to, key) && key !== except)
              __defProp(to, key, {
                get: () => from[key],
                enumerable:
                  !(desc = __getOwnPropDesc(from, key)) || desc.enumerable,
              });
        }
        return to;
      };
      var __toESM = (mod, isNodeMode, target) => (
        (target = mod != null ? __create(__getProtoOf(mod)) : {}),
        __copyProps(
          // If the importer is in node compatibility mode or this is not an ESM
          // file that has been converted to a CommonJS file using a Babel-
          // compatible transform (i.e. "__esModule" has not been set), then set
          // "default" to the CommonJS "module.exports" for node compatibility.
          isNodeMode || !mod || !mod.__esModule
            ? __defProp(target, "default", { value: mod, enumerable: true })
            : target,
          mod,
        )
      );
      var __toCommonJS = (mod) =>
        __copyProps(__defProp({}, "__esModule", { value: true }), mod);

      // pkg/dist-src/index.js
      var dist_src_exports = {};
      __export(dist_src_exports, {
        RequestError: () => RequestError,
      });
      module.exports = __toCommonJS(dist_src_exports);
      var import_deprecation = __nccwpck_require__(3595);
      var import_once = __toESM(__nccwpck_require__(9873));
      var logOnceCode = (0, import_once.default)((deprecation) =>
        console.warn(deprecation),
      );
      var logOnceHeaders = (0, import_once.default)((deprecation) =>
        console.warn(deprecation),
      );
      var RequestError = class extends Error {
        constructor(message, statusCode, options) {
          super(message);
          if (Error.captureStackTrace) {
            Error.captureStackTrace(this, this.constructor);
          }
          this.name = "HttpError";
          this.status = statusCode;
          let headers;
          if ("headers" in options && typeof options.headers !== "undefined") {
            headers = options.headers;
          }
          if ("response" in options) {
            this.response = options.response;
            headers = options.response.headers;
          }
          const requestCopy = Object.assign({}, options.request);
          if (options.request.headers.authorization) {
            requestCopy.headers = Object.assign({}, options.request.headers, {
              authorization: options.request.headers.authorization.replace(
                / .*$/,
                " [REDACTED]",
              ),
            });
          }
          requestCopy.url = requestCopy.url
            .replace(/\bclient_secret=\w+/g, "client_secret=[REDACTED]")
            .replace(/\baccess_token=\w+/g, "access_token=[REDACTED]");
          this.request = requestCopy;
          Object.defineProperty(this, "code", {
            get() {
              logOnceCode(
                new import_deprecation.Deprecation(
                  "[@octokit/request-error] `error.code` is deprecated, use `error.status`.",
                ),
              );
              return statusCode;
            },
          });
          Object.defineProperty(this, "headers", {
            get() {
              logOnceHeaders(
                new import_deprecation.Deprecation(
                  "[@octokit/request-error] `error.headers` is deprecated, use `error.response.headers`.",
                ),
              );
              return headers || {};
            },
          });
        }
      };
      // Annotate the CommonJS export names for ESM import in node:
      0 && 0;

      /***/
    },

    /***/ 7979: /***/ (
      module,
      __unused_webpack_exports,
      __nccwpck_require__,
    ) => {
      "use strict";

      var __defProp = Object.defineProperty;
      var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
      var __getOwnPropNames = Object.getOwnPropertyNames;
      var __hasOwnProp = Object.prototype.hasOwnProperty;
      var __export = (target, all) => {
        for (var name in all)
          __defProp(target, name, { get: all[name], enumerable: true });
      };
      var __copyProps = (to, from, except, desc) => {
        if ((from && typeof from === "object") || typeof from === "function") {
          for (let key of __getOwnPropNames(from))
            if (!__hasOwnProp.call(to, key) && key !== except)
              __defProp(to, key, {
                get: () => from[key],
                enumerable:
                  !(desc = __getOwnPropDesc(from, key)) || desc.enumerable,
              });
        }
        return to;
      };
      var __toCommonJS = (mod) =>
        __copyProps(__defProp({}, "__esModule", { value: true }), mod);

      // pkg/dist-src/index.js
      var dist_src_exports = {};
      __export(dist_src_exports, {
        request: () => request,
      });
      module.exports = __toCommonJS(dist_src_exports);
      var import_endpoint = __nccwpck_require__(679);
      var import_universal_user_agent = __nccwpck_require__(4930);

      // pkg/dist-src/version.js
      var VERSION = "8.1.1";

      // pkg/dist-src/fetch-wrapper.js
      var import_is_plain_object = __nccwpck_require__(366);
      var import_request_error = __nccwpck_require__(4478);

      // pkg/dist-src/get-buffer-response.js
      function getBufferResponse(response) {
        return response.arrayBuffer();
      }

      // pkg/dist-src/fetch-wrapper.js
      function fetchWrapper(requestOptions) {
        var _a, _b, _c;
        const log =
          requestOptions.request && requestOptions.request.log
            ? requestOptions.request.log
            : console;
        const parseSuccessResponseBody =
          ((_a = requestOptions.request) == null
            ? void 0
            : _a.parseSuccessResponseBody) !== false;
        if (
          (0, import_is_plain_object.isPlainObject)(requestOptions.body) ||
          Array.isArray(requestOptions.body)
        ) {
          requestOptions.body = JSON.stringify(requestOptions.body);
        }
        let headers = {};
        let status;
        let url;
        let { fetch } = globalThis;
        if ((_b = requestOptions.request) == null ? void 0 : _b.fetch) {
          fetch = requestOptions.request.fetch;
        }
        if (!fetch) {
          throw new Error(
            "fetch is not set. Please pass a fetch implementation as new Octokit({ request: { fetch }}). Learn more at https://github.com/octokit/octokit.js/#fetch-missing",
          );
        }
        return fetch(requestOptions.url, {
          method: requestOptions.method,
          body: requestOptions.body,
          headers: requestOptions.headers,
          signal: (_c = requestOptions.request) == null ? void 0 : _c.signal,
          // duplex must be set if request.body is ReadableStream or Async Iterables.
          // See https://fetch.spec.whatwg.org/#dom-requestinit-duplex.
          ...(requestOptions.body && { duplex: "half" }),
        })
          .then(async (response) => {
            url = response.url;
            status = response.status;
            for (const keyAndValue of response.headers) {
              headers[keyAndValue[0]] = keyAndValue[1];
            }
            if ("deprecation" in headers) {
              const matches =
                headers.link &&
                headers.link.match(/<([^>]+)>; rel="deprecation"/);
              const deprecationLink = matches && matches.pop();
              log.warn(
                `[@octokit/request] "${requestOptions.method} ${
                  requestOptions.url
                }" is deprecated. It is scheduled to be removed on ${
                  headers.sunset
                }${deprecationLink ? `. See ${deprecationLink}` : ""}`,
              );
            }
            if (status === 204 || status === 205) {
              return;
            }
            if (requestOptions.method === "HEAD") {
              if (status < 400) {
                return;
              }
              throw new import_request_error.RequestError(
                response.statusText,
                status,
                {
                  response: {
                    url,
                    status,
                    headers,
                    data: void 0,
                  },
                  request: requestOptions,
                },
              );
            }
            if (status === 304) {
              throw new import_request_error.RequestError(
                "Not modified",
                status,
                {
                  response: {
                    url,
                    status,
                    headers,
                    data: await getResponseData(response),
                  },
                  request: requestOptions,
                },
              );
            }
            if (status >= 400) {
              const data = await getResponseData(response);
              const error = new import_request_error.RequestError(
                toErrorMessage(data),
                status,
                {
                  response: {
                    url,
                    status,
                    headers,
                    data,
                  },
                  request: requestOptions,
                },
              );
              throw error;
            }
            return parseSuccessResponseBody
              ? await getResponseData(response)
              : response.body;
          })
          .then((data) => {
            return {
              status,
              url,
              headers,
              data,
            };
          })
          .catch((error) => {
            if (error instanceof import_request_error.RequestError) throw error;
            else if (error.name === "AbortError") throw error;
            throw new import_request_error.RequestError(error.message, 500, {
              request: requestOptions,
            });
          });
      }
      async function getResponseData(response) {
        const contentType = response.headers.get("content-type");
        if (/application\/json/.test(contentType)) {
          return response.json();
        }
        if (!contentType || /^text\/|charset=utf-8$/.test(contentType)) {
          return response.text();
        }
        return getBufferResponse(response);
      }
      function toErrorMessage(data) {
        if (typeof data === "string") return data;
        if ("message" in data) {
          if (Array.isArray(data.errors)) {
            return `${data.message}: ${data.errors
              .map(JSON.stringify)
              .join(", ")}`;
          }
          return data.message;
        }
        return `Unknown error: ${JSON.stringify(data)}`;
      }

      // pkg/dist-src/with-defaults.js
      function withDefaults(oldEndpoint, newDefaults) {
        const endpoint2 = oldEndpoint.defaults(newDefaults);
        const newApi = function (route, parameters) {
          const endpointOptions = endpoint2.merge(route, parameters);
          if (!endpointOptions.request || !endpointOptions.request.hook) {
            return fetchWrapper(endpoint2.parse(endpointOptions));
          }
          const request2 = (route2, parameters2) => {
            return fetchWrapper(
              endpoint2.parse(endpoint2.merge(route2, parameters2)),
            );
          };
          Object.assign(request2, {
            endpoint: endpoint2,
            defaults: withDefaults.bind(null, endpoint2),
          });
          return endpointOptions.request.hook(request2, endpointOptions);
        };
        return Object.assign(newApi, {
          endpoint: endpoint2,
          defaults: withDefaults.bind(null, endpoint2),
        });
      }

      // pkg/dist-src/index.js
      var request = withDefaults(import_endpoint.endpoint, {
        headers: {
          "user-agent": `octokit-request.js/${VERSION} ${(0,
          import_universal_user_agent.getUserAgent)()}`,
        },
      });
      // Annotate the CommonJS export names for ESM import in node:
      0 && 0;

      /***/
    },

    /***/ 3652: /***/ (
      module,
      __unused_webpack_exports,
      __nccwpck_require__,
    ) => {
      "use strict";

      var __defProp = Object.defineProperty;
      var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
      var __getOwnPropNames = Object.getOwnPropertyNames;
      var __hasOwnProp = Object.prototype.hasOwnProperty;
      var __export = (target, all) => {
        for (var name in all)
          __defProp(target, name, { get: all[name], enumerable: true });
      };
      var __copyProps = (to, from, except, desc) => {
        if ((from && typeof from === "object") || typeof from === "function") {
          for (let key of __getOwnPropNames(from))
            if (!__hasOwnProp.call(to, key) && key !== except)
              __defProp(to, key, {
                get: () => from[key],
                enumerable:
                  !(desc = __getOwnPropDesc(from, key)) || desc.enumerable,
              });
        }
        return to;
      };
      var __toCommonJS = (mod) =>
        __copyProps(__defProp({}, "__esModule", { value: true }), mod);

      // pkg/dist-src/index.js
      var dist_src_exports = {};
      __export(dist_src_exports, {
        Octokit: () => Octokit,
      });
      module.exports = __toCommonJS(dist_src_exports);
      var import_core = __nccwpck_require__(8989);
      var import_plugin_request_log = __nccwpck_require__(9680);
      var import_plugin_paginate_rest = __nccwpck_require__(1369);
      var import_plugin_rest_endpoint_methods = __nccwpck_require__(2254);

      // pkg/dist-src/version.js
      var VERSION = "20.0.1";

      // pkg/dist-src/index.js
      var Octokit = import_core.Octokit.plugin(
        import_plugin_request_log.requestLog,
        import_plugin_rest_endpoint_methods.legacyRestEndpointMethods,
        import_plugin_paginate_rest.paginateRest,
      ).defaults({
        userAgent: `octokit-rest.js/${VERSION}`,
      });
      // Annotate the CommonJS export names for ESM import in node:
      0 && 0;

      /***/
    },

    /***/ 9633: /***/ (
      module,
      __unused_webpack_exports,
      __nccwpck_require__,
    ) => {
      module.exports = {
        parallel: __nccwpck_require__(5916),
        serial: __nccwpck_require__(1166),
        serialOrdered: __nccwpck_require__(6132),
      };

      /***/
    },

    /***/ 6959: /***/ (module) => {
      // API
      module.exports = abort;

      /**
       * Aborts leftover active jobs
       *
       * @param {object} state - current state object
       */
      function abort(state) {
        Object.keys(state.jobs).forEach(clean.bind(state));

        // reset leftover jobs
        state.jobs = {};
      }

      /**
       * Cleans up leftover job by invoking abort function for the provided job id
       *
       * @this  state
       * @param {string|number} key - job id to abort
       */
      function clean(key) {
        if (typeof this.jobs[key] == "function") {
          this.jobs[key]();
        }
      }

      /***/
    },

    /***/ 9624: /***/ (
      module,
      __unused_webpack_exports,
      __nccwpck_require__,
    ) => {
      var defer = __nccwpck_require__(7534);

      // API
      module.exports = async;

      /**
       * Runs provided callback asynchronously
       * even if callback itself is not
       *
       * @param   {function} callback - callback to invoke
       * @returns {function} - augmented callback
       */
      function async(callback) {
        var isAsync = false;

        // check if async happened
        defer(function () {
          isAsync = true;
        });

        return function async_callback(err, result) {
          if (isAsync) {
            callback(err, result);
          } else {
            defer(function nextTick_callback() {
              callback(err, result);
            });
          }
        };
      }

      /***/
    },

    /***/ 7534: /***/ (module) => {
      module.exports = defer;

      /**
       * Runs provided function on next iteration of the event loop
       *
       * @param {function} fn - function to run
       */
      function defer(fn) {
        var nextTick =
          typeof setImmediate == "function"
            ? setImmediate
            : typeof process == "object" &&
              typeof process.nextTick == "function"
            ? process.nextTick
            : null;

        if (nextTick) {
          nextTick(fn);
        } else {
          setTimeout(fn, 0);
        }
      }

      /***/
    },

    /***/ 5718: /***/ (
      module,
      __unused_webpack_exports,
      __nccwpck_require__,
    ) => {
      var async = __nccwpck_require__(9624),
        abort = __nccwpck_require__(6959);
      // API
      module.exports = iterate;

      /**
       * Iterates over each job object
       *
       * @param {array|object} list - array or object (named list) to iterate over
       * @param {function} iterator - iterator to run
       * @param {object} state - current job status
       * @param {function} callback - invoked when all elements processed
       */
      function iterate(list, iterator, state, callback) {
        // store current index
        var key = state["keyedList"]
          ? state["keyedList"][state.index]
          : state.index;

        state.jobs[key] = runJob(
          iterator,
          key,
          list[key],
          function (error, output) {
            // don't repeat yourself
            // skip secondary callbacks
            if (!(key in state.jobs)) {
              return;
            }

            // clean up jobs
            delete state.jobs[key];

            if (error) {
              // don't process rest of the results
              // stop still active jobs
              // and reset the list
              abort(state);
            } else {
              state.results[key] = output;
            }

            // return salvaged results
            callback(error, state.results);
          },
        );
      }

      /**
       * Runs iterator over provided job element
       *
       * @param   {function} iterator - iterator to invoke
       * @param   {string|number} key - key/index of the element in the list of jobs
       * @param   {mixed} item - job description
       * @param   {function} callback - invoked after iterator is done with the job
       * @returns {function|mixed} - job abort function or something else
       */
      function runJob(iterator, key, item, callback) {
        var aborter;

        // allow shortcut if iterator expects only two arguments
        if (iterator.length == 2) {
          aborter = iterator(item, async(callback));
        }
        // otherwise go with full three arguments
        else {
          aborter = iterator(item, key, async(callback));
        }

        return aborter;
      }

      /***/
    },

    /***/ 2917: /***/ (module) => {
      // API
      module.exports = state;

      /**
       * Creates initial state object
       * for iteration over list
       *
       * @param   {array|object} list - list to iterate over
       * @param   {function|null} sortMethod - function to use for keys sort,
       *                                     or `null` to keep them as is
       * @returns {object} - initial state object
       */
      function state(list, sortMethod) {
        var isNamedList = !Array.isArray(list),
          initState = {
            index: 0,
            keyedList: isNamedList || sortMethod ? Object.keys(list) : null,
            jobs: {},
            results: isNamedList ? {} : [],
            size: isNamedList ? Object.keys(list).length : list.length,
          };
        if (sortMethod) {
          // sort array keys based on it's values
          // sort object's keys just on own merit
          initState.keyedList.sort(
            isNamedList
              ? sortMethod
              : function (a, b) {
                  return sortMethod(list[a], list[b]);
                },
          );
        }

        return initState;
      }

      /***/
    },

    /***/ 8509: /***/ (
      module,
      __unused_webpack_exports,
      __nccwpck_require__,
    ) => {
      var abort = __nccwpck_require__(6959),
        async = __nccwpck_require__(9624);
      // API
      module.exports = terminator;

      /**
       * Terminates jobs in the attached state context
       *
       * @this  AsyncKitState#
       * @param {function} callback - final callback to invoke after termination
       */
      function terminator(callback) {
        if (!Object.keys(this.jobs).length) {
          return;
        }

        // fast forward iteration index
        this.index = this.size;

        // abort jobs
        abort(this);

        // send back results we have so far
        async(callback)(null, this.results);
      }

      /***/
    },

    /***/ 5916: /***/ (
      module,
      __unused_webpack_exports,
      __nccwpck_require__,
    ) => {
      var iterate = __nccwpck_require__(5718),
        initState = __nccwpck_require__(2917),
        terminator = __nccwpck_require__(8509);
      // Public API
      module.exports = parallel;

      /**
       * Runs iterator over provided array elements in parallel
       *
       * @param   {array|object} list - array or object (named list) to iterate over
       * @param   {function} iterator - iterator to run
       * @param   {function} callback - invoked when all elements processed
       * @returns {function} - jobs terminator
       */
      function parallel(list, iterator, callback) {
        var state = initState(list);

        while (state.index < (state["keyedList"] || list).length) {
          iterate(list, iterator, state, function (error, result) {
            if (error) {
              callback(error, result);
              return;
            }

            // looks like it's the last one
            if (Object.keys(state.jobs).length === 0) {
              callback(null, state.results);
              return;
            }
          });

          state.index++;
        }

        return terminator.bind(state, callback);
      }

      /***/
    },

    /***/ 1166: /***/ (
      module,
      __unused_webpack_exports,
      __nccwpck_require__,
    ) => {
      var serialOrdered = __nccwpck_require__(6132);

      // Public API
      module.exports = serial;

      /**
       * Runs iterator over provided array elements in series
       *
       * @param   {array|object} list - array or object (named list) to iterate over
       * @param   {function} iterator - iterator to run
       * @param   {function} callback - invoked when all elements processed
       * @returns {function} - jobs terminator
       */
      function serial(list, iterator, callback) {
        return serialOrdered(list, iterator, null, callback);
      }

      /***/
    },

    /***/ 6132: /***/ (
      module,
      __unused_webpack_exports,
      __nccwpck_require__,
    ) => {
      var iterate = __nccwpck_require__(5718),
        initState = __nccwpck_require__(2917),
        terminator = __nccwpck_require__(8509);
      // Public API
      module.exports = serialOrdered;
      // sorting helpers
      module.exports.ascending = ascending;
      module.exports.descending = descending;

      /**
       * Runs iterator over provided sorted array elements in series
       *
       * @param   {array|object} list - array or object (named list) to iterate over
       * @param   {function} iterator - iterator to run
       * @param   {function} sortMethod - custom sort function
       * @param   {function} callback - invoked when all elements processed
       * @returns {function} - jobs terminator
       */
      function serialOrdered(list, iterator, sortMethod, callback) {
        var state = initState(list, sortMethod);

        iterate(list, iterator, state, function iteratorHandler(error, result) {
          if (error) {
            callback(error, result);
            return;
          }

          state.index++;

          // are we there yet?
          if (state.index < (state["keyedList"] || list).length) {
            iterate(list, iterator, state, iteratorHandler);
            return;
          }

          // done here
          callback(null, state.results);
        });

        return terminator.bind(state, callback);
      }

      /*
       * -- Sort methods
       */

      /**
       * sort helper to sort array elements in ascending order
       *
       * @param   {mixed} a - an item to compare
       * @param   {mixed} b - an item to compare
       * @returns {number} - comparison result
       */
      function ascending(a, b) {
        return a < b ? -1 : a > b ? 1 : 0;
      }

      /**
       * sort helper to sort array elements in descending order
       *
       * @param   {mixed} a - an item to compare
       * @param   {mixed} b - an item to compare
       * @returns {number} - comparison result
       */
      function descending(a, b) {
        return -1 * ascending(a, b);
      }

      /***/
    },

    /***/ 2748: /***/ (
      module,
      __unused_webpack_exports,
      __nccwpck_require__,
    ) => {
      module.exports = __nccwpck_require__(6321);

      /***/
    },

    /***/ 2990: /***/ (
      module,
      __unused_webpack_exports,
      __nccwpck_require__,
    ) => {
      "use strict";

      var utils = __nccwpck_require__(3971);
      var settle = __nccwpck_require__(9446);
      var buildFullPath = __nccwpck_require__(9452);
      var buildURL = __nccwpck_require__(1182);
      var http = __nccwpck_require__(3685);
      var https = __nccwpck_require__(5687);
      var httpFollow = __nccwpck_require__(1805).http;
      var httpsFollow = __nccwpck_require__(1805).https;
      var url = __nccwpck_require__(7310);
      var zlib = __nccwpck_require__(9796);
      var VERSION = __nccwpck_require__(2980).version;
      var createError = __nccwpck_require__(1388);
      var enhanceError = __nccwpck_require__(1041);
      var transitionalDefaults = __nccwpck_require__(5225);
      var Cancel = __nccwpck_require__(4661);

      var isHttps = /https:?/;

      /**
       *
       * @param {http.ClientRequestArgs} options
       * @param {AxiosProxyConfig} proxy
       * @param {string} location
       */
      function setProxy(options, proxy, location) {
        options.hostname = proxy.host;
        options.host = proxy.host;
        options.port = proxy.port;
        options.path = location;

        // Basic proxy authorization
        if (proxy.auth) {
          var base64 = Buffer.from(
            proxy.auth.username + ":" + proxy.auth.password,
            "utf8",
          ).toString("base64");
          options.headers["Proxy-Authorization"] = "Basic " + base64;
        }

        // If a proxy is used, any redirects must also pass through the proxy
        options.beforeRedirect = function beforeRedirect(redirection) {
          redirection.headers.host = redirection.host;
          setProxy(redirection, proxy, redirection.href);
        };
      }

      /*eslint consistent-return:0*/
      module.exports = function httpAdapter(config) {
        return new Promise(function dispatchHttpRequest(
          resolvePromise,
          rejectPromise,
        ) {
          var onCanceled;
          function done() {
            if (config.cancelToken) {
              config.cancelToken.unsubscribe(onCanceled);
            }

            if (config.signal) {
              config.signal.removeEventListener("abort", onCanceled);
            }
          }
          var resolve = function resolve(value) {
            done();
            resolvePromise(value);
          };
          var rejected = false;
          var reject = function reject(value) {
            done();
            rejected = true;
            rejectPromise(value);
          };
          var data = config.data;
          var headers = config.headers;
          var headerNames = {};

          Object.keys(headers).forEach(function storeLowerName(name) {
            headerNames[name.toLowerCase()] = name;
          });

          // Set User-Agent (required by some servers)
          // See https://github.com/axios/axios/issues/69
          if ("user-agent" in headerNames) {
            // User-Agent is specified; handle case where no UA header is desired
            if (!headers[headerNames["user-agent"]]) {
              delete headers[headerNames["user-agent"]];
            }
            // Otherwise, use specified value
          } else {
            // Only set header if it hasn't been set in config
            headers["User-Agent"] = "axios/" + VERSION;
          }

          if (data && !utils.isStream(data)) {
            if (Buffer.isBuffer(data)) {
              // Nothing to do...
            } else if (utils.isArrayBuffer(data)) {
              data = Buffer.from(new Uint8Array(data));
            } else if (utils.isString(data)) {
              data = Buffer.from(data, "utf-8");
            } else {
              return reject(
                createError(
                  "Data after transformation must be a string, an ArrayBuffer, a Buffer, or a Stream",
                  config,
                ),
              );
            }

            if (
              config.maxBodyLength > -1 &&
              data.length > config.maxBodyLength
            ) {
              return reject(
                createError(
                  "Request body larger than maxBodyLength limit",
                  config,
                ),
              );
            }

            // Add Content-Length header if data exists
            if (!headerNames["content-length"]) {
              headers["Content-Length"] = data.length;
            }
          }

          // HTTP basic authentication
          var auth = undefined;
          if (config.auth) {
            var username = config.auth.username || "";
            var password = config.auth.password || "";
            auth = username + ":" + password;
          }

          // Parse url
          var fullPath = buildFullPath(config.baseURL, config.url);
          var parsed = url.parse(fullPath);
          var protocol = parsed.protocol || "http:";

          if (!auth && parsed.auth) {
            var urlAuth = parsed.auth.split(":");
            var urlUsername = urlAuth[0] || "";
            var urlPassword = urlAuth[1] || "";
            auth = urlUsername + ":" + urlPassword;
          }

          if (auth && headerNames.authorization) {
            delete headers[headerNames.authorization];
          }

          var isHttpsRequest = isHttps.test(protocol);
          var agent = isHttpsRequest ? config.httpsAgent : config.httpAgent;

          try {
            buildURL(
              parsed.path,
              config.params,
              config.paramsSerializer,
            ).replace(/^\?/, "");
          } catch (err) {
            var customErr = new Error(err.message);
            customErr.config = config;
            customErr.url = config.url;
            customErr.exists = true;
            reject(customErr);
          }

          var options = {
            path: buildURL(
              parsed.path,
              config.params,
              config.paramsSerializer,
            ).replace(/^\?/, ""),
            method: config.method.toUpperCase(),
            headers: headers,
            agent: agent,
            agents: { http: config.httpAgent, https: config.httpsAgent },
            auth: auth,
          };

          if (config.socketPath) {
            options.socketPath = config.socketPath;
          } else {
            options.hostname = parsed.hostname;
            options.port = parsed.port;
          }

          var proxy = config.proxy;
          if (!proxy && proxy !== false) {
            var proxyEnv = protocol.slice(0, -1) + "_proxy";
            var proxyUrl =
              process.env[proxyEnv] || process.env[proxyEnv.toUpperCase()];
            if (proxyUrl) {
              var parsedProxyUrl = url.parse(proxyUrl);
              var noProxyEnv = process.env.no_proxy || process.env.NO_PROXY;
              var shouldProxy = true;

              if (noProxyEnv) {
                var noProxy = noProxyEnv.split(",").map(function trim(s) {
                  return s.trim();
                });

                shouldProxy = !noProxy.some(function proxyMatch(proxyElement) {
                  if (!proxyElement) {
                    return false;
                  }
                  if (proxyElement === "*") {
                    return true;
                  }
                  if (
                    proxyElement[0] === "." &&
                    parsed.hostname.substr(
                      parsed.hostname.length - proxyElement.length,
                    ) === proxyElement
                  ) {
                    return true;
                  }

                  return parsed.hostname === proxyElement;
                });
              }

              if (shouldProxy) {
                proxy = {
                  host: parsedProxyUrl.hostname,
                  port: parsedProxyUrl.port,
                  protocol: parsedProxyUrl.protocol,
                };

                if (parsedProxyUrl.auth) {
                  var proxyUrlAuth = parsedProxyUrl.auth.split(":");
                  proxy.auth = {
                    username: proxyUrlAuth[0],
                    password: proxyUrlAuth[1],
                  };
                }
              }
            }
          }

          if (proxy) {
            options.headers.host =
              parsed.hostname + (parsed.port ? ":" + parsed.port : "");
            setProxy(
              options,
              proxy,
              protocol +
                "//" +
                parsed.hostname +
                (parsed.port ? ":" + parsed.port : "") +
                options.path,
            );
          }

          var transport;
          var isHttpsProxy =
            isHttpsRequest && (proxy ? isHttps.test(proxy.protocol) : true);
          if (config.transport) {
            transport = config.transport;
          } else if (config.maxRedirects === 0) {
            transport = isHttpsProxy ? https : http;
          } else {
            if (config.maxRedirects) {
              options.maxRedirects = config.maxRedirects;
            }
            transport = isHttpsProxy ? httpsFollow : httpFollow;
          }

          if (config.maxBodyLength > -1) {
            options.maxBodyLength = config.maxBodyLength;
          }

          if (config.insecureHTTPParser) {
            options.insecureHTTPParser = config.insecureHTTPParser;
          }

          // Create the request
          var req = transport.request(options, function handleResponse(res) {
            if (req.aborted) return;

            // uncompress the response body transparently if required
            var stream = res;

            // return the last request in case of redirects
            var lastRequest = res.req || req;

            // if no content, is HEAD request or decompress disabled we should not decompress
            if (
              res.statusCode !== 204 &&
              lastRequest.method !== "HEAD" &&
              config.decompress !== false
            ) {
              switch (res.headers["content-encoding"]) {
                /*eslint default-case:0*/
                case "gzip":
                case "compress":
                case "deflate":
                  // add the unzipper to the body stream processing pipeline
                  stream = stream.pipe(zlib.createUnzip());

                  // remove the content-encoding in order to not confuse downstream operations
                  delete res.headers["content-encoding"];
                  break;
              }
            }

            var response = {
              status: res.statusCode,
              statusText: res.statusMessage,
              headers: res.headers,
              config: config,
              request: lastRequest,
            };

            if (config.responseType === "stream") {
              response.data = stream;
              settle(resolve, reject, response);
            } else {
              var responseBuffer = [];
              var totalResponseBytes = 0;
              stream.on("data", function handleStreamData(chunk) {
                responseBuffer.push(chunk);
                totalResponseBytes += chunk.length;

                // make sure the content length is not over the maxContentLength if specified
                if (
                  config.maxContentLength > -1 &&
                  totalResponseBytes > config.maxContentLength
                ) {
                  // stream.destoy() emit aborted event before calling reject() on Node.js v16
                  rejected = true;
                  stream.destroy();
                  reject(
                    createError(
                      "maxContentLength size of " +
                        config.maxContentLength +
                        " exceeded",
                      config,
                      null,
                      lastRequest,
                    ),
                  );
                }
              });

              stream.on("aborted", function handlerStreamAborted() {
                if (rejected) {
                  return;
                }
                stream.destroy();
                reject(
                  createError(
                    "error request aborted",
                    config,
                    "ERR_REQUEST_ABORTED",
                    lastRequest,
                  ),
                );
              });

              stream.on("error", function handleStreamError(err) {
                if (req.aborted) return;
                reject(enhanceError(err, config, null, lastRequest));
              });

              stream.on("end", function handleStreamEnd() {
                try {
                  var responseData =
                    responseBuffer.length === 1
                      ? responseBuffer[0]
                      : Buffer.concat(responseBuffer);
                  if (config.responseType !== "arraybuffer") {
                    responseData = responseData.toString(
                      config.responseEncoding,
                    );
                    if (
                      !config.responseEncoding ||
                      config.responseEncoding === "utf8"
                    ) {
                      responseData = utils.stripBOM(responseData);
                    }
                  }
                  response.data = responseData;
                } catch (err) {
                  reject(
                    enhanceError(
                      err,
                      config,
                      err.code,
                      response.request,
                      response,
                    ),
                  );
                }
                settle(resolve, reject, response);
              });
            }
          });

          // Handle errors
          req.on("error", function handleRequestError(err) {
            if (req.aborted && err.code !== "ERR_FR_TOO_MANY_REDIRECTS") return;
            reject(enhanceError(err, config, null, req));
          });

          // set tcp keep alive to prevent drop connection by peer
          req.on("socket", function handleRequestSocket(socket) {
            // default interval of sending ack packet is 1 minute
            socket.setKeepAlive(true, 1000 * 60);
          });

          // Handle request timeout
          if (config.timeout) {
            // This is forcing a int timeout to avoid problems if the `req` interface doesn't handle other types.
            var timeout = parseInt(config.timeout, 10);

            if (isNaN(timeout)) {
              reject(
                createError(
                  "error trying to parse `config.timeout` to int",
                  config,
                  "ERR_PARSE_TIMEOUT",
                  req,
                ),
              );

              return;
            }

            // Sometime, the response will be very slow, and does not respond, the connect event will be block by event loop system.
            // And timer callback will be fired, and abort() will be invoked before connection, then get "socket hang up" and code ECONNRESET.
            // At this time, if we have a large number of request, nodejs will hang up some socket on background. and the number will up and up.
            // And then these socket which be hang up will devoring CPU little by little.
            // ClientRequest.setTimeout will be fired on the specify milliseconds, and can make sure that abort() will be fired after connect.
            req.setTimeout(timeout, function handleRequestTimeout() {
              req.abort();
              var timeoutErrorMessage = "";
              if (config.timeoutErrorMessage) {
                timeoutErrorMessage = config.timeoutErrorMessage;
              } else {
                timeoutErrorMessage =
                  "timeout of " + config.timeout + "ms exceeded";
              }
              var transitional = config.transitional || transitionalDefaults;
              reject(
                createError(
                  timeoutErrorMessage,
                  config,
                  transitional.clarifyTimeoutError
                    ? "ETIMEDOUT"
                    : "ECONNABORTED",
                  req,
                ),
              );
            });
          }

          if (config.cancelToken || config.signal) {
            // Handle cancellation
            // eslint-disable-next-line func-names
            onCanceled = function (cancel) {
              if (req.aborted) return;

              req.abort();
              reject(
                !cancel || (cancel && cancel.type)
                  ? new Cancel("canceled")
                  : cancel,
              );
            };

            config.cancelToken && config.cancelToken.subscribe(onCanceled);
            if (config.signal) {
              config.signal.aborted
                ? onCanceled()
                : config.signal.addEventListener("abort", onCanceled);
            }
          }

          // Send the request
          if (utils.isStream(data)) {
            data
              .on("error", function handleStreamError(err) {
                reject(enhanceError(err, config, null, req));
              })
              .pipe(req);
          } else {
            req.end(data);
          }
        });
      };

      /***/
    },

    /***/ 90: /***/ (module, __unused_webpack_exports, __nccwpck_require__) => {
      "use strict";

      var utils = __nccwpck_require__(3971);
      var settle = __nccwpck_require__(9446);
      var cookies = __nccwpck_require__(4033);
      var buildURL = __nccwpck_require__(1182);
      var buildFullPath = __nccwpck_require__(9452);
      var parseHeaders = __nccwpck_require__(2441);
      var isURLSameOrigin = __nccwpck_require__(6882);
      var createError = __nccwpck_require__(1388);
      var transitionalDefaults = __nccwpck_require__(5225);
      var Cancel = __nccwpck_require__(4661);

      module.exports = function xhrAdapter(config) {
        return new Promise(function dispatchXhrRequest(resolve, reject) {
          var requestData = config.data;
          var requestHeaders = config.headers;
          var responseType = config.responseType;
          var onCanceled;
          function done() {
            if (config.cancelToken) {
              config.cancelToken.unsubscribe(onCanceled);
            }

            if (config.signal) {
              config.signal.removeEventListener("abort", onCanceled);
            }
          }

          if (utils.isFormData(requestData)) {
            delete requestHeaders["Content-Type"]; // Let the browser set it
          }

          var request = new XMLHttpRequest();

          // HTTP basic authentication
          if (config.auth) {
            var username = config.auth.username || "";
            var password = config.auth.password
              ? unescape(encodeURIComponent(config.auth.password))
              : "";
            requestHeaders.Authorization =
              "Basic " + btoa(username + ":" + password);
          }

          var fullPath = buildFullPath(config.baseURL, config.url);
          request.open(
            config.method.toUpperCase(),
            buildURL(fullPath, config.params, config.paramsSerializer),
            true,
          );

          // Set the request timeout in MS
          request.timeout = config.timeout;

          function onloadend() {
            if (!request) {
              return;
            }
            // Prepare the response
            var responseHeaders =
              "getAllResponseHeaders" in request
                ? parseHeaders(request.getAllResponseHeaders())
                : null;
            var responseData =
              !responseType ||
              responseType === "text" ||
              responseType === "json"
                ? request.responseText
                : request.response;
            var response = {
              data: responseData,
              status: request.status,
              statusText: request.statusText,
              headers: responseHeaders,
              config: config,
              request: request,
            };

            settle(
              function _resolve(value) {
                resolve(value);
                done();
              },
              function _reject(err) {
                reject(err);
                done();
              },
              response,
            );

            // Clean up request
            request = null;
          }

          if ("onloadend" in request) {
            // Use onloadend if available
            request.onloadend = onloadend;
          } else {
            // Listen for ready state to emulate onloadend
            request.onreadystatechange = function handleLoad() {
              if (!request || request.readyState !== 4) {
                return;
              }

              // The request errored out and we didn't get a response, this will be
              // handled by onerror instead
              // With one exception: request that using file: protocol, most browsers
              // will return status as 0 even though it's a successful request
              if (
                request.status === 0 &&
                !(
                  request.responseURL &&
                  request.responseURL.indexOf("file:") === 0
                )
              ) {
                return;
              }
              // readystate handler is calling before onerror or ontimeout handlers,
              // so we should call onloadend on the next 'tick'
              setTimeout(onloadend);
            };
          }

          // Handle browser request cancellation (as opposed to a manual cancellation)
          request.onabort = function handleAbort() {
            if (!request) {
              return;
            }

            reject(
              createError("Request aborted", config, "ECONNABORTED", request),
            );

            // Clean up request
            request = null;
          };

          // Handle low level network errors
          request.onerror = function handleError() {
            // Real errors are hidden from us by the browser
            // onerror should only fire if it's a network error
            reject(createError("Network Error", config, null, request));

            // Clean up request
            request = null;
          };

          // Handle timeout
          request.ontimeout = function handleTimeout() {
            var timeoutErrorMessage = config.timeout
              ? "timeout of " + config.timeout + "ms exceeded"
              : "timeout exceeded";
            var transitional = config.transitional || transitionalDefaults;
            if (config.timeoutErrorMessage) {
              timeoutErrorMessage = config.timeoutErrorMessage;
            }
            reject(
              createError(
                timeoutErrorMessage,
                config,
                transitional.clarifyTimeoutError ? "ETIMEDOUT" : "ECONNABORTED",
                request,
              ),
            );

            // Clean up request
            request = null;
          };

          // Add xsrf header
          // This is only done if running in a standard browser environment.
          // Specifically not if we're in a web worker, or react-native.
          if (utils.isStandardBrowserEnv()) {
            // Add xsrf header
            var xsrfValue =
              (config.withCredentials || isURLSameOrigin(fullPath)) &&
              config.xsrfCookieName
                ? cookies.read(config.xsrfCookieName)
                : undefined;

            if (xsrfValue) {
              requestHeaders[config.xsrfHeaderName] = xsrfValue;
            }
          }

          // Add headers to the request
          if ("setRequestHeader" in request) {
            utils.forEach(requestHeaders, function setRequestHeader(val, key) {
              if (
                typeof requestData === "undefined" &&
                key.toLowerCase() === "content-type"
              ) {
                // Remove Content-Type if data is undefined
                delete requestHeaders[key];
              } else {
                // Otherwise add header to the request
                request.setRequestHeader(key, val);
              }
            });
          }

          // Add withCredentials to request if needed
          if (!utils.isUndefined(config.withCredentials)) {
            request.withCredentials = !!config.withCredentials;
          }

          // Add responseType to request if needed
          if (responseType && responseType !== "json") {
            request.responseType = config.responseType;
          }

          // Handle progress if needed
          if (typeof config.onDownloadProgress === "function") {
            request.addEventListener("progress", config.onDownloadProgress);
          }

          // Not all browsers support upload events
          if (typeof config.onUploadProgress === "function" && request.upload) {
            request.upload.addEventListener(
              "progress",
              config.onUploadProgress,
            );
          }

          if (config.cancelToken || config.signal) {
            // Handle cancellation
            // eslint-disable-next-line func-names
            onCanceled = function (cancel) {
              if (!request) {
                return;
              }
              reject(
                !cancel || (cancel && cancel.type)
                  ? new Cancel("canceled")
                  : cancel,
              );
              request.abort();
              request = null;
            };

            config.cancelToken && config.cancelToken.subscribe(onCanceled);
            if (config.signal) {
              config.signal.aborted
                ? onCanceled()
                : config.signal.addEventListener("abort", onCanceled);
            }
          }

          if (!requestData) {
            requestData = null;
          }

          // Send the request
          request.send(requestData);
        });
      };

      /***/
    },

    /***/ 6321: /***/ (
      module,
      __unused_webpack_exports,
      __nccwpck_require__,
    ) => {
      "use strict";

      var utils = __nccwpck_require__(3971);
      var bind = __nccwpck_require__(9830);
      var Axios = __nccwpck_require__(9639);
      var mergeConfig = __nccwpck_require__(3672);
      var defaults = __nccwpck_require__(7383);

      /**
       * Create an instance of Axios
       *
       * @param {Object} defaultConfig The default config for the instance
       * @return {Axios} A new instance of Axios
       */
      function createInstance(defaultConfig) {
        var context = new Axios(defaultConfig);
        var instance = bind(Axios.prototype.request, context);

        // Copy axios.prototype to instance
        utils.extend(instance, Axios.prototype, context);

        // Copy context to instance
        utils.extend(instance, context);

        // Factory for creating new instances
        instance.create = function create(instanceConfig) {
          return createInstance(mergeConfig(defaultConfig, instanceConfig));
        };

        return instance;
      }

      // Create the default instance to be exported
      var axios = createInstance(defaults);

      // Expose Axios class to allow class inheritance
      axios.Axios = Axios;

      // Expose Cancel & CancelToken
      axios.Cancel = __nccwpck_require__(4661);
      axios.CancelToken = __nccwpck_require__(7453);
      axios.isCancel = __nccwpck_require__(7616);
      axios.VERSION = __nccwpck_require__(2980).version;

      // Expose all/spread
      axios.all = function all(promises) {
        return Promise.all(promises);
      };
      axios.spread = __nccwpck_require__(6068);

      // Expose isAxiosError
      axios.isAxiosError = __nccwpck_require__(6896);

      module.exports = axios;

      // Allow use of default import syntax in TypeScript
      module.exports["default"] = axios;

      /***/
    },

    /***/ 4661: /***/ (module) => {
      "use strict";

      /**
       * A `Cancel` is an object that is thrown when an operation is canceled.
       *
       * @class
       * @param {string=} message The message.
       */
      function Cancel(message) {
        this.message = message;
      }

      Cancel.prototype.toString = function toString() {
        return "Cancel" + (this.message ? ": " + this.message : "");
      };

      Cancel.prototype.__CANCEL__ = true;

      module.exports = Cancel;

      /***/
    },

    /***/ 7453: /***/ (
      module,
      __unused_webpack_exports,
      __nccwpck_require__,
    ) => {
      "use strict";

      var Cancel = __nccwpck_require__(4661);

      /**
       * A `CancelToken` is an object that can be used to request cancellation of an operation.
       *
       * @class
       * @param {Function} executor The executor function.
       */
      function CancelToken(executor) {
        if (typeof executor !== "function") {
          throw new TypeError("executor must be a function.");
        }

        var resolvePromise;

        this.promise = new Promise(function promiseExecutor(resolve) {
          resolvePromise = resolve;
        });

        var token = this;

        // eslint-disable-next-line func-names
        this.promise.then(function (cancel) {
          if (!token._listeners) return;

          var i;
          var l = token._listeners.length;

          for (i = 0; i < l; i++) {
            token._listeners[i](cancel);
          }
          token._listeners = null;
        });

        // eslint-disable-next-line func-names
        this.promise.then = function (onfulfilled) {
          var _resolve;
          // eslint-disable-next-line func-names
          var promise = new Promise(function (resolve) {
            token.subscribe(resolve);
            _resolve = resolve;
          }).then(onfulfilled);

          promise.cancel = function reject() {
            token.unsubscribe(_resolve);
          };

          return promise;
        };

        executor(function cancel(message) {
          if (token.reason) {
            // Cancellation has already been requested
            return;
          }

          token.reason = new Cancel(message);
          resolvePromise(token.reason);
        });
      }

      /**
       * Throws a `Cancel` if cancellation has been requested.
       */
      CancelToken.prototype.throwIfRequested = function throwIfRequested() {
        if (this.reason) {
          throw this.reason;
        }
      };

      /**
       * Subscribe to the cancel signal
       */

      CancelToken.prototype.subscribe = function subscribe(listener) {
        if (this.reason) {
          listener(this.reason);
          return;
        }

        if (this._listeners) {
          this._listeners.push(listener);
        } else {
          this._listeners = [listener];
        }
      };

      /**
       * Unsubscribe from the cancel signal
       */

      CancelToken.prototype.unsubscribe = function unsubscribe(listener) {
        if (!this._listeners) {
          return;
        }
        var index = this._listeners.indexOf(listener);
        if (index !== -1) {
          this._listeners.splice(index, 1);
        }
      };

      /**
       * Returns an object that contains a new `CancelToken` and a function that, when called,
       * cancels the `CancelToken`.
       */
      CancelToken.source = function source() {
        var cancel;
        var token = new CancelToken(function executor(c) {
          cancel = c;
        });
        return {
          token: token,
          cancel: cancel,
        };
      };

      module.exports = CancelToken;

      /***/
    },

    /***/ 7616: /***/ (module) => {
      "use strict";

      module.exports = function isCancel(value) {
        return !!(value && value.__CANCEL__);
      };

      /***/
    },

    /***/ 9639: /***/ (
      module,
      __unused_webpack_exports,
      __nccwpck_require__,
    ) => {
      "use strict";

      var utils = __nccwpck_require__(3971);
      var buildURL = __nccwpck_require__(1182);
      var InterceptorManager = __nccwpck_require__(6717);
      var dispatchRequest = __nccwpck_require__(663);
      var mergeConfig = __nccwpck_require__(3672);
      var validator = __nccwpck_require__(1962);

      var validators = validator.validators;
      /**
       * Create a new instance of Axios
       *
       * @param {Object} instanceConfig The default config for the instance
       */
      function Axios(instanceConfig) {
        this.defaults = instanceConfig;
        this.interceptors = {
          request: new InterceptorManager(),
          response: new InterceptorManager(),
        };
      }

      /**
       * Dispatch a request
       *
       * @param {Object} config The config specific for this request (merged with this.defaults)
       */
      Axios.prototype.request = function request(configOrUrl, config) {
        /*eslint no-param-reassign:0*/
        // Allow for axios('example/url'[, config]) a la fetch API
        if (typeof configOrUrl === "string") {
          config = config || {};
          config.url = configOrUrl;
        } else {
          config = configOrUrl || {};
        }

        config = mergeConfig(this.defaults, config);

        // Set config.method
        if (config.method) {
          config.method = config.method.toLowerCase();
        } else if (this.defaults.method) {
          config.method = this.defaults.method.toLowerCase();
        } else {
          config.method = "get";
        }

        var transitional = config.transitional;

        if (transitional !== undefined) {
          validator.assertOptions(
            transitional,
            {
              silentJSONParsing: validators.transitional(validators.boolean),
              forcedJSONParsing: validators.transitional(validators.boolean),
              clarifyTimeoutError: validators.transitional(validators.boolean),
            },
            false,
          );
        }

        // filter out skipped interceptors
        var requestInterceptorChain = [];
        var synchronousRequestInterceptors = true;
        this.interceptors.request.forEach(
          function unshiftRequestInterceptors(interceptor) {
            if (
              typeof interceptor.runWhen === "function" &&
              interceptor.runWhen(config) === false
            ) {
              return;
            }

            synchronousRequestInterceptors =
              synchronousRequestInterceptors && interceptor.synchronous;

            requestInterceptorChain.unshift(
              interceptor.fulfilled,
              interceptor.rejected,
            );
          },
        );

        var responseInterceptorChain = [];
        this.interceptors.response.forEach(
          function pushResponseInterceptors(interceptor) {
            responseInterceptorChain.push(
              interceptor.fulfilled,
              interceptor.rejected,
            );
          },
        );

        var promise;

        if (!synchronousRequestInterceptors) {
          var chain = [dispatchRequest, undefined];

          Array.prototype.unshift.apply(chain, requestInterceptorChain);
          chain = chain.concat(responseInterceptorChain);

          promise = Promise.resolve(config);
          while (chain.length) {
            promise = promise.then(chain.shift(), chain.shift());
          }

          return promise;
        }

        var newConfig = config;
        while (requestInterceptorChain.length) {
          var onFulfilled = requestInterceptorChain.shift();
          var onRejected = requestInterceptorChain.shift();
          try {
            newConfig = onFulfilled(newConfig);
          } catch (error) {
            onRejected(error);
            break;
          }
        }

        try {
          promise = dispatchRequest(newConfig);
        } catch (error) {
          return Promise.reject(error);
        }

        while (responseInterceptorChain.length) {
          promise = promise.then(
            responseInterceptorChain.shift(),
            responseInterceptorChain.shift(),
          );
        }

        return promise;
      };

      Axios.prototype.getUri = function getUri(config) {
        config = mergeConfig(this.defaults, config);
        return buildURL(
          config.url,
          config.params,
          config.paramsSerializer,
        ).replace(/^\?/, "");
      };

      // Provide aliases for supported request methods
      utils.forEach(
        ["delete", "get", "head", "options"],
        function forEachMethodNoData(method) {
          /*eslint func-names:0*/
          Axios.prototype[method] = function (url, config) {
            return this.request(
              mergeConfig(config || {}, {
                method: method,
                url: url,
                data: (config || {}).data,
              }),
            );
          };
        },
      );

      utils.forEach(
        ["post", "put", "patch"],
        function forEachMethodWithData(method) {
          /*eslint func-names:0*/
          Axios.prototype[method] = function (url, data, config) {
            return this.request(
              mergeConfig(config || {}, {
                method: method,
                url: url,
                data: data,
              }),
            );
          };
        },
      );

      module.exports = Axios;

      /***/
    },

    /***/ 6717: /***/ (
      module,
      __unused_webpack_exports,
      __nccwpck_require__,
    ) => {
      "use strict";

      var utils = __nccwpck_require__(3971);

      function InterceptorManager() {
        this.handlers = [];
      }

      /**
       * Add a new interceptor to the stack
       *
       * @param {Function} fulfilled The function to handle `then` for a `Promise`
       * @param {Function} rejected The function to handle `reject` for a `Promise`
       *
       * @return {Number} An ID used to remove interceptor later
       */
      InterceptorManager.prototype.use = function use(
        fulfilled,
        rejected,
        options,
      ) {
        this.handlers.push({
          fulfilled: fulfilled,
          rejected: rejected,
          synchronous: options ? options.synchronous : false,
          runWhen: options ? options.runWhen : null,
        });
        return this.handlers.length - 1;
      };

      /**
       * Remove an interceptor from the stack
       *
       * @param {Number} id The ID that was returned by `use`
       */
      InterceptorManager.prototype.eject = function eject(id) {
        if (this.handlers[id]) {
          this.handlers[id] = null;
        }
      };

      /**
       * Iterate over all the registered interceptors
       *
       * This method is particularly useful for skipping over any
       * interceptors that may have become `null` calling `eject`.
       *
       * @param {Function} fn The function to call for each interceptor
       */
      InterceptorManager.prototype.forEach = function forEach(fn) {
        utils.forEach(this.handlers, function forEachHandler(h) {
          if (h !== null) {
            fn(h);
          }
        });
      };

      module.exports = InterceptorManager;

      /***/
    },

    /***/ 9452: /***/ (
      module,
      __unused_webpack_exports,
      __nccwpck_require__,
    ) => {
      "use strict";

      var isAbsoluteURL = __nccwpck_require__(311);
      var combineURLs = __nccwpck_require__(8815);

      /**
       * Creates a new URL by combining the baseURL with the requestedURL,
       * only when the requestedURL is not already an absolute URL.
       * If the requestURL is absolute, this function returns the requestedURL untouched.
       *
       * @param {string} baseURL The base URL
       * @param {string} requestedURL Absolute or relative URL to combine
       * @returns {string} The combined full path
       */
      module.exports = function buildFullPath(baseURL, requestedURL) {
        if (baseURL && !isAbsoluteURL(requestedURL)) {
          return combineURLs(baseURL, requestedURL);
        }
        return requestedURL;
      };

      /***/
    },

    /***/ 1388: /***/ (
      module,
      __unused_webpack_exports,
      __nccwpck_require__,
    ) => {
      "use strict";

      var enhanceError = __nccwpck_require__(1041);

      /**
       * Create an Error with the specified message, config, error code, request and response.
       *
       * @param {string} message The error message.
       * @param {Object} config The config.
       * @param {string} [code] The error code (for example, 'ECONNABORTED').
       * @param {Object} [request] The request.
       * @param {Object} [response] The response.
       * @returns {Error} The created error.
       */
      module.exports = function createError(
        message,
        config,
        code,
        request,
        response,
      ) {
        var error = new Error(message);
        return enhanceError(error, config, code, request, response);
      };

      /***/
    },

    /***/ 663: /***/ (
      module,
      __unused_webpack_exports,
      __nccwpck_require__,
    ) => {
      "use strict";

      var utils = __nccwpck_require__(3971);
      var transformData = __nccwpck_require__(3385);
      var isCancel = __nccwpck_require__(7616);
      var defaults = __nccwpck_require__(7383);
      var Cancel = __nccwpck_require__(4661);

      /**
       * Throws a `Cancel` if cancellation has been requested.
       */
      function throwIfCancellationRequested(config) {
        if (config.cancelToken) {
          config.cancelToken.throwIfRequested();
        }

        if (config.signal && config.signal.aborted) {
          throw new Cancel("canceled");
        }
      }

      /**
       * Dispatch a request to the server using the configured adapter.
       *
       * @param {object} config The config that is to be used for the request
       * @returns {Promise} The Promise to be fulfilled
       */
      module.exports = function dispatchRequest(config) {
        throwIfCancellationRequested(config);

        // Ensure headers exist
        config.headers = config.headers || {};

        // Transform request data
        config.data = transformData.call(
          config,
          config.data,
          config.headers,
          config.transformRequest,
        );

        // Flatten headers
        config.headers = utils.merge(
          config.headers.common || {},
          config.headers[config.method] || {},
          config.headers,
        );

        utils.forEach(
          ["delete", "get", "head", "post", "put", "patch", "common"],
          function cleanHeaderConfig(method) {
            delete config.headers[method];
          },
        );

        var adapter = config.adapter || defaults.adapter;

        return adapter(config).then(
          function onAdapterResolution(response) {
            throwIfCancellationRequested(config);

            // Transform response data
            response.data = transformData.call(
              config,
              response.data,
              response.headers,
              config.transformResponse,
            );

            return response;
          },
          function onAdapterRejection(reason) {
            if (!isCancel(reason)) {
              throwIfCancellationRequested(config);

              // Transform response data
              if (reason && reason.response) {
                reason.response.data = transformData.call(
                  config,
                  reason.response.data,
                  reason.response.headers,
                  config.transformResponse,
                );
              }
            }

            return Promise.reject(reason);
          },
        );
      };

      /***/
    },

    /***/ 1041: /***/ (module) => {
      "use strict";

      /**
       * Update an Error with the specified config, error code, and response.
       *
       * @param {Error} error The error to update.
       * @param {Object} config The config.
       * @param {string} [code] The error code (for example, 'ECONNABORTED').
       * @param {Object} [request] The request.
       * @param {Object} [response] The response.
       * @returns {Error} The error.
       */
      module.exports = function enhanceError(
        error,
        config,
        code,
        request,
        response,
      ) {
        error.config = config;
        if (code) {
          error.code = code;
        }

        error.request = request;
        error.response = response;
        error.isAxiosError = true;

        error.toJSON = function toJSON() {
          return {
            // Standard
            message: this.message,
            name: this.name,
            // Microsoft
            description: this.description,
            number: this.number,
            // Mozilla
            fileName: this.fileName,
            lineNumber: this.lineNumber,
            columnNumber: this.columnNumber,
            stack: this.stack,
            // Axios
            config: this.config,
            code: this.code,
            status:
              this.response && this.response.status
                ? this.response.status
                : null,
          };
        };
        return error;
      };

      /***/
    },

    /***/ 3672: /***/ (
      module,
      __unused_webpack_exports,
      __nccwpck_require__,
    ) => {
      "use strict";

      var utils = __nccwpck_require__(3971);

      /**
       * Config-specific merge-function which creates a new config-object
       * by merging two configuration objects together.
       *
       * @param {Object} config1
       * @param {Object} config2
       * @returns {Object} New object resulting from merging config2 to config1
       */
      module.exports = function mergeConfig(config1, config2) {
        // eslint-disable-next-line no-param-reassign
        config2 = config2 || {};
        var config = {};

        function getMergedValue(target, source) {
          if (utils.isPlainObject(target) && utils.isPlainObject(source)) {
            return utils.merge(target, source);
          } else if (utils.isPlainObject(source)) {
            return utils.merge({}, source);
          } else if (utils.isArray(source)) {
            return source.slice();
          }
          return source;
        }

        // eslint-disable-next-line consistent-return
        function mergeDeepProperties(prop) {
          if (!utils.isUndefined(config2[prop])) {
            return getMergedValue(config1[prop], config2[prop]);
          } else if (!utils.isUndefined(config1[prop])) {
            return getMergedValue(undefined, config1[prop]);
          }
        }

        // eslint-disable-next-line consistent-return
        function valueFromConfig2(prop) {
          if (!utils.isUndefined(config2[prop])) {
            return getMergedValue(undefined, config2[prop]);
          }
        }

        // eslint-disable-next-line consistent-return
        function defaultToConfig2(prop) {
          if (!utils.isUndefined(config2[prop])) {
            return getMergedValue(undefined, config2[prop]);
          } else if (!utils.isUndefined(config1[prop])) {
            return getMergedValue(undefined, config1[prop]);
          }
        }

        // eslint-disable-next-line consistent-return
        function mergeDirectKeys(prop) {
          if (prop in config2) {
            return getMergedValue(config1[prop], config2[prop]);
          } else if (prop in config1) {
            return getMergedValue(undefined, config1[prop]);
          }
        }

        var mergeMap = {
          url: valueFromConfig2,
          method: valueFromConfig2,
          data: valueFromConfig2,
          baseURL: defaultToConfig2,
          transformRequest: defaultToConfig2,
          transformResponse: defaultToConfig2,
          paramsSerializer: defaultToConfig2,
          timeout: defaultToConfig2,
          timeoutMessage: defaultToConfig2,
          withCredentials: defaultToConfig2,
          adapter: defaultToConfig2,
          responseType: defaultToConfig2,
          xsrfCookieName: defaultToConfig2,
          xsrfHeaderName: defaultToConfig2,
          onUploadProgress: defaultToConfig2,
          onDownloadProgress: defaultToConfig2,
          decompress: defaultToConfig2,
          maxContentLength: defaultToConfig2,
          maxBodyLength: defaultToConfig2,
          transport: defaultToConfig2,
          httpAgent: defaultToConfig2,
          httpsAgent: defaultToConfig2,
          cancelToken: defaultToConfig2,
          socketPath: defaultToConfig2,
          responseEncoding: defaultToConfig2,
          validateStatus: mergeDirectKeys,
        };

        utils.forEach(
          Object.keys(config1).concat(Object.keys(config2)),
          function computeConfigValue(prop) {
            var merge = mergeMap[prop] || mergeDeepProperties;
            var configValue = merge(prop);
            (utils.isUndefined(configValue) && merge !== mergeDirectKeys) ||
              (config[prop] = configValue);
          },
        );

        return config;
      };

      /***/
    },

    /***/ 9446: /***/ (
      module,
      __unused_webpack_exports,
      __nccwpck_require__,
    ) => {
      "use strict";

      var createError = __nccwpck_require__(1388);

      /**
       * Resolve or reject a Promise based on response status.
       *
       * @param {Function} resolve A function that resolves the promise.
       * @param {Function} reject A function that rejects the promise.
       * @param {object} response The response.
       */
      module.exports = function settle(resolve, reject, response) {
        var validateStatus = response.config.validateStatus;
        if (
          !response.status ||
          !validateStatus ||
          validateStatus(response.status)
        ) {
          resolve(response);
        } else {
          reject(
            createError(
              "Request failed with status code " + response.status,
              response.config,
              null,
              response.request,
              response,
            ),
          );
        }
      };

      /***/
    },

    /***/ 3385: /***/ (
      module,
      __unused_webpack_exports,
      __nccwpck_require__,
    ) => {
      "use strict";

      var utils = __nccwpck_require__(3971);
      var defaults = __nccwpck_require__(7383);

      /**
       * Transform the data for a request or a response
       *
       * @param {Object|String} data The data to be transformed
       * @param {Array} headers The headers for the request or response
       * @param {Array|Function} fns A single function or Array of functions
       * @returns {*} The resulting transformed data
       */
      module.exports = function transformData(data, headers, fns) {
        var context = this || defaults;
        /*eslint no-param-reassign:0*/
        utils.forEach(fns, function transform(fn) {
          data = fn.call(context, data, headers);
        });

        return data;
      };

      /***/
    },

    /***/ 7383: /***/ (
      module,
      __unused_webpack_exports,
      __nccwpck_require__,
    ) => {
      "use strict";

      var utils = __nccwpck_require__(3971);
      var normalizeHeaderName = __nccwpck_require__(6220);
      var enhanceError = __nccwpck_require__(1041);
      var transitionalDefaults = __nccwpck_require__(5225);

      var DEFAULT_CONTENT_TYPE = {
        "Content-Type": "application/x-www-form-urlencoded",
      };

      function setContentTypeIfUnset(headers, value) {
        if (
          !utils.isUndefined(headers) &&
          utils.isUndefined(headers["Content-Type"])
        ) {
          headers["Content-Type"] = value;
        }
      }

      function getDefaultAdapter() {
        var adapter;
        if (typeof XMLHttpRequest !== "undefined") {
          // For browsers use XHR adapter
          adapter = __nccwpck_require__(90);
        } else if (
          typeof process !== "undefined" &&
          Object.prototype.toString.call(process) === "[object process]"
        ) {
          // For node use HTTP adapter
          adapter = __nccwpck_require__(2990);
        }
        return adapter;
      }

      function stringifySafely(rawValue, parser, encoder) {
        if (utils.isString(rawValue)) {
          try {
            (parser || JSON.parse)(rawValue);
            return utils.trim(rawValue);
          } catch (e) {
            if (e.name !== "SyntaxError") {
              throw e;
            }
          }
        }

        return (encoder || JSON.stringify)(rawValue);
      }

      var defaults = {
        transitional: transitionalDefaults,

        adapter: getDefaultAdapter(),

        transformRequest: [
          function transformRequest(data, headers) {
            normalizeHeaderName(headers, "Accept");
            normalizeHeaderName(headers, "Content-Type");

            if (
              utils.isFormData(data) ||
              utils.isArrayBuffer(data) ||
              utils.isBuffer(data) ||
              utils.isStream(data) ||
              utils.isFile(data) ||
              utils.isBlob(data)
            ) {
              return data;
            }
            if (utils.isArrayBufferView(data)) {
              return data.buffer;
            }
            if (utils.isURLSearchParams(data)) {
              setContentTypeIfUnset(
                headers,
                "application/x-www-form-urlencoded;charset=utf-8",
              );
              return data.toString();
            }
            if (
              utils.isObject(data) ||
              (headers && headers["Content-Type"] === "application/json")
            ) {
              setContentTypeIfUnset(headers, "application/json");
              return stringifySafely(data);
            }
            return data;
          },
        ],

        transformResponse: [
          function transformResponse(data) {
            var transitional = this.transitional || defaults.transitional;
            var silentJSONParsing =
              transitional && transitional.silentJSONParsing;
            var forcedJSONParsing =
              transitional && transitional.forcedJSONParsing;
            var strictJSONParsing =
              !silentJSONParsing && this.responseType === "json";

            if (
              strictJSONParsing ||
              (forcedJSONParsing && utils.isString(data) && data.length)
            ) {
              try {
                return JSON.parse(data);
              } catch (e) {
                if (strictJSONParsing) {
                  if (e.name === "SyntaxError") {
                    throw enhanceError(e, this, "E_JSON_PARSE");
                  }
                  throw e;
                }
              }
            }

            return data;
          },
        ],

        /**
         * A timeout in milliseconds to abort a request. If set to 0 (default) a
         * timeout is not created.
         */
        timeout: 0,

        xsrfCookieName: "XSRF-TOKEN",
        xsrfHeaderName: "X-XSRF-TOKEN",

        maxContentLength: -1,
        maxBodyLength: -1,

        validateStatus: function validateStatus(status) {
          return status >= 200 && status < 300;
        },

        headers: {
          common: {
            Accept: "application/json, text/plain, */*",
          },
        },
      };

      utils.forEach(
        ["delete", "get", "head"],
        function forEachMethodNoData(method) {
          defaults.headers[method] = {};
        },
      );

      utils.forEach(
        ["post", "put", "patch"],
        function forEachMethodWithData(method) {
          defaults.headers[method] = utils.merge(DEFAULT_CONTENT_TYPE);
        },
      );

      module.exports = defaults;

      /***/
    },

    /***/ 5225: /***/ (module) => {
      "use strict";

      module.exports = {
        silentJSONParsing: true,
        forcedJSONParsing: true,
        clarifyTimeoutError: false,
      };

      /***/
    },

    /***/ 2980: /***/ (module) => {
      module.exports = {
        version: "0.26.1",
      };

      /***/
    },

    /***/ 9830: /***/ (module) => {
      "use strict";

      module.exports = function bind(fn, thisArg) {
        return function wrap() {
          var args = new Array(arguments.length);
          for (var i = 0; i < args.length; i++) {
            args[i] = arguments[i];
          }
          return fn.apply(thisArg, args);
        };
      };

      /***/
    },

    /***/ 1182: /***/ (
      module,
      __unused_webpack_exports,
      __nccwpck_require__,
    ) => {
      "use strict";

      var utils = __nccwpck_require__(3971);

      function encode(val) {
        return encodeURIComponent(val)
          .replace(/%3A/gi, ":")
          .replace(/%24/g, "$")
          .replace(/%2C/gi, ",")
          .replace(/%20/g, "+")
          .replace(/%5B/gi, "[")
          .replace(/%5D/gi, "]");
      }

      /**
       * Build a URL by appending params to the end
       *
       * @param {string} url The base of the url (e.g., http://www.google.com)
       * @param {object} [params] The params to be appended
       * @returns {string} The formatted url
       */
      module.exports = function buildURL(url, params, paramsSerializer) {
        /*eslint no-param-reassign:0*/
        if (!params) {
          return url;
        }

        var serializedParams;
        if (paramsSerializer) {
          serializedParams = paramsSerializer(params);
        } else if (utils.isURLSearchParams(params)) {
          serializedParams = params.toString();
        } else {
          var parts = [];

          utils.forEach(params, function serialize(val, key) {
            if (val === null || typeof val === "undefined") {
              return;
            }

            if (utils.isArray(val)) {
              key = key + "[]";
            } else {
              val = [val];
            }

            utils.forEach(val, function parseValue(v) {
              if (utils.isDate(v)) {
                v = v.toISOString();
              } else if (utils.isObject(v)) {
                v = JSON.stringify(v);
              }
              parts.push(encode(key) + "=" + encode(v));
            });
          });

          serializedParams = parts.join("&");
        }

        if (serializedParams) {
          var hashmarkIndex = url.indexOf("#");
          if (hashmarkIndex !== -1) {
            url = url.slice(0, hashmarkIndex);
          }

          url += (url.indexOf("?") === -1 ? "?" : "&") + serializedParams;
        }

        return url;
      };

      /***/
    },

    /***/ 8815: /***/ (module) => {
      "use strict";

      /**
       * Creates a new URL by combining the specified URLs
       *
       * @param {string} baseURL The base URL
       * @param {string} relativeURL The relative URL
       * @returns {string} The combined URL
       */
      module.exports = function combineURLs(baseURL, relativeURL) {
        return relativeURL
          ? baseURL.replace(/\/+$/, "") + "/" + relativeURL.replace(/^\/+/, "")
          : baseURL;
      };

      /***/
    },

    /***/ 4033: /***/ (
      module,
      __unused_webpack_exports,
      __nccwpck_require__,
    ) => {
      "use strict";

      var utils = __nccwpck_require__(3971);

      module.exports = utils.isStandardBrowserEnv()
        ? // Standard browser envs support document.cookie
          (function standardBrowserEnv() {
            return {
              write: function write(
                name,
                value,
                expires,
                path,
                domain,
                secure,
              ) {
                var cookie = [];
                cookie.push(name + "=" + encodeURIComponent(value));

                if (utils.isNumber(expires)) {
                  cookie.push("expires=" + new Date(expires).toGMTString());
                }

                if (utils.isString(path)) {
                  cookie.push("path=" + path);
                }

                if (utils.isString(domain)) {
                  cookie.push("domain=" + domain);
                }

                if (secure === true) {
                  cookie.push("secure");
                }

                document.cookie = cookie.join("; ");
              },

              read: function read(name) {
                var match = document.cookie.match(
                  new RegExp("(^|;\\s*)(" + name + ")=([^;]*)"),
                );
                return match ? decodeURIComponent(match[3]) : null;
              },

              remove: function remove(name) {
                this.write(name, "", Date.now() - 86400000);
              },
            };
          })()
        : // Non standard browser env (web workers, react-native) lack needed support.
          (function nonStandardBrowserEnv() {
            return {
              write: function write() {},
              read: function read() {
                return null;
              },
              remove: function remove() {},
            };
          })();

      /***/
    },

    /***/ 311: /***/ (module) => {
      "use strict";

      /**
       * Determines whether the specified URL is absolute
       *
       * @param {string} url The URL to test
       * @returns {boolean} True if the specified URL is absolute, otherwise false
       */
      module.exports = function isAbsoluteURL(url) {
        // A URL is considered absolute if it begins with "<scheme>://" or "//" (protocol-relative URL).
        // RFC 3986 defines scheme name as a sequence of characters beginning with a letter and followed
        // by any combination of letters, digits, plus, period, or hyphen.
        return /^([a-z][a-z\d+\-.]*:)?\/\//i.test(url);
      };

      /***/
    },

    /***/ 6896: /***/ (
      module,
      __unused_webpack_exports,
      __nccwpck_require__,
    ) => {
      "use strict";

      var utils = __nccwpck_require__(3971);

      /**
       * Determines whether the payload is an error thrown by Axios
       *
       * @param {*} payload The value to test
       * @returns {boolean} True if the payload is an error thrown by Axios, otherwise false
       */
      module.exports = function isAxiosError(payload) {
        return utils.isObject(payload) && payload.isAxiosError === true;
      };

      /***/
    },

    /***/ 6882: /***/ (
      module,
      __unused_webpack_exports,
      __nccwpck_require__,
    ) => {
      "use strict";

      var utils = __nccwpck_require__(3971);

      module.exports = utils.isStandardBrowserEnv()
        ? // Standard browser envs have full support of the APIs needed to test
          // whether the request URL is of the same origin as current location.
          (function standardBrowserEnv() {
            var msie = /(msie|trident)/i.test(navigator.userAgent);
            var urlParsingNode = document.createElement("a");
            var originURL;

            /**
             * Parse a URL to discover it's components
             *
             * @param {String} url The URL to be parsed
             * @returns {Object}
             */
            function resolveURL(url) {
              var href = url;

              if (msie) {
                // IE needs attribute set twice to normalize properties
                urlParsingNode.setAttribute("href", href);
                href = urlParsingNode.href;
              }

              urlParsingNode.setAttribute("href", href);

              // urlParsingNode provides the UrlUtils interface - http://url.spec.whatwg.org/#urlutils
              return {
                href: urlParsingNode.href,
                protocol: urlParsingNode.protocol
                  ? urlParsingNode.protocol.replace(/:$/, "")
                  : "",
                host: urlParsingNode.host,
                search: urlParsingNode.search
                  ? urlParsingNode.search.replace(/^\?/, "")
                  : "",
                hash: urlParsingNode.hash
                  ? urlParsingNode.hash.replace(/^#/, "")
                  : "",
                hostname: urlParsingNode.hostname,
                port: urlParsingNode.port,
                pathname:
                  urlParsingNode.pathname.charAt(0) === "/"
                    ? urlParsingNode.pathname
                    : "/" + urlParsingNode.pathname,
              };
            }

            originURL = resolveURL(window.location.href);

            /**
             * Determine if a URL shares the same origin as the current location
             *
             * @param {String} requestURL The URL to test
             * @returns {boolean} True if URL shares the same origin, otherwise false
             */
            return function isURLSameOrigin(requestURL) {
              var parsed = utils.isString(requestURL)
                ? resolveURL(requestURL)
                : requestURL;
              return (
                parsed.protocol === originURL.protocol &&
                parsed.host === originURL.host
              );
            };
          })()
        : // Non standard browser envs (web workers, react-native) lack needed support.
          (function nonStandardBrowserEnv() {
            return function isURLSameOrigin() {
              return true;
            };
          })();

      /***/
    },

    /***/ 6220: /***/ (
      module,
      __unused_webpack_exports,
      __nccwpck_require__,
    ) => {
      "use strict";

      var utils = __nccwpck_require__(3971);

      module.exports = function normalizeHeaderName(headers, normalizedName) {
        utils.forEach(headers, function processHeader(value, name) {
          if (
            name !== normalizedName &&
            name.toUpperCase() === normalizedName.toUpperCase()
          ) {
            headers[normalizedName] = value;
            delete headers[name];
          }
        });
      };

      /***/
    },

    /***/ 2441: /***/ (
      module,
      __unused_webpack_exports,
      __nccwpck_require__,
    ) => {
      "use strict";

      var utils = __nccwpck_require__(3971);

      // Headers whose duplicates are ignored by node
      // c.f. https://nodejs.org/api/http.html#http_message_headers
      var ignoreDuplicateOf = [
        "age",
        "authorization",
        "content-length",
        "content-type",
        "etag",
        "expires",
        "from",
        "host",
        "if-modified-since",
        "if-unmodified-since",
        "last-modified",
        "location",
        "max-forwards",
        "proxy-authorization",
        "referer",
        "retry-after",
        "user-agent",
      ];

      /**
       * Parse headers into an object
       *
       * ```
       * Date: Wed, 27 Aug 2014 08:58:49 GMT
       * Content-Type: application/json
       * Connection: keep-alive
       * Transfer-Encoding: chunked
       * ```
       *
       * @param {String} headers Headers needing to be parsed
       * @returns {Object} Headers parsed into an object
       */
      module.exports = function parseHeaders(headers) {
        var parsed = {};
        var key;
        var val;
        var i;

        if (!headers) {
          return parsed;
        }

        utils.forEach(headers.split("\n"), function parser(line) {
          i = line.indexOf(":");
          key = utils.trim(line.substr(0, i)).toLowerCase();
          val = utils.trim(line.substr(i + 1));

          if (key) {
            if (parsed[key] && ignoreDuplicateOf.indexOf(key) >= 0) {
              return;
            }
            if (key === "set-cookie") {
              parsed[key] = (parsed[key] ? parsed[key] : []).concat([val]);
            } else {
              parsed[key] = parsed[key] ? parsed[key] + ", " + val : val;
            }
          }
        });

        return parsed;
      };

      /***/
    },

    /***/ 6068: /***/ (module) => {
      "use strict";

      /**
       * Syntactic sugar for invoking a function and expanding an array for arguments.
       *
       * Common use case would be to use `Function.prototype.apply`.
       *
       *  ```js
       *  function f(x, y, z) {}
       *  var args = [1, 2, 3];
       *  f.apply(null, args);
       *  ```
       *
       * With `spread` this example can be re-written.
       *
       *  ```js
       *  spread(function(x, y, z) {})([1, 2, 3]);
       *  ```
       *
       * @param {Function} callback
       * @returns {Function}
       */
      module.exports = function spread(callback) {
        return function wrap(arr) {
          return callback.apply(null, arr);
        };
      };

      /***/
    },

    /***/ 1962: /***/ (
      module,
      __unused_webpack_exports,
      __nccwpck_require__,
    ) => {
      "use strict";

      var VERSION = __nccwpck_require__(2980).version;

      var validators = {};

      // eslint-disable-next-line func-names
      ["object", "boolean", "number", "function", "string", "symbol"].forEach(
        function (type, i) {
          validators[type] = function validator(thing) {
            return typeof thing === type || "a" + (i < 1 ? "n " : " ") + type;
          };
        },
      );

      var deprecatedWarnings = {};

      /**
       * Transitional option validator
       * @param {function|boolean?} validator - set to false if the transitional option has been removed
       * @param {string?} version - deprecated version / removed since version
       * @param {string?} message - some message with additional info
       * @returns {function}
       */
      validators.transitional = function transitional(
        validator,
        version,
        message,
      ) {
        function formatMessage(opt, desc) {
          return (
            "[Axios v" +
            VERSION +
            "] Transitional option '" +
            opt +
            "'" +
            desc +
            (message ? ". " + message : "")
          );
        }

        // eslint-disable-next-line func-names
        return function (value, opt, opts) {
          if (validator === false) {
            throw new Error(
              formatMessage(
                opt,
                " has been removed" + (version ? " in " + version : ""),
              ),
            );
          }

          if (version && !deprecatedWarnings[opt]) {
            deprecatedWarnings[opt] = true;
            // eslint-disable-next-line no-console
            console.warn(
              formatMessage(
                opt,
                " has been deprecated since v" +
                  version +
                  " and will be removed in the near future",
              ),
            );
          }

          return validator ? validator(value, opt, opts) : true;
        };
      };

      /**
       * Assert object's properties type
       * @param {object} options
       * @param {object} schema
       * @param {boolean?} allowUnknown
       */

      function assertOptions(options, schema, allowUnknown) {
        if (typeof options !== "object") {
          throw new TypeError("options must be an object");
        }
        var keys = Object.keys(options);
        var i = keys.length;
        while (i-- > 0) {
          var opt = keys[i];
          var validator = schema[opt];
          if (validator) {
            var value = options[opt];
            var result = value === undefined || validator(value, opt, options);
            if (result !== true) {
              throw new TypeError("option " + opt + " must be " + result);
            }
            continue;
          }
          if (allowUnknown !== true) {
            throw Error("Unknown option " + opt);
          }
        }
      }

      module.exports = {
        assertOptions: assertOptions,
        validators: validators,
      };

      /***/
    },

    /***/ 3971: /***/ (
      module,
      __unused_webpack_exports,
      __nccwpck_require__,
    ) => {
      "use strict";

      var bind = __nccwpck_require__(9830);

      // utils is a library of generic helper functions non-specific to axios

      var toString = Object.prototype.toString;

      /**
       * Determine if a value is an Array
       *
       * @param {Object} val The value to test
       * @returns {boolean} True if value is an Array, otherwise false
       */
      function isArray(val) {
        return Array.isArray(val);
      }

      /**
       * Determine if a value is undefined
       *
       * @param {Object} val The value to test
       * @returns {boolean} True if the value is undefined, otherwise false
       */
      function isUndefined(val) {
        return typeof val === "undefined";
      }

      /**
       * Determine if a value is a Buffer
       *
       * @param {Object} val The value to test
       * @returns {boolean} True if value is a Buffer, otherwise false
       */
      function isBuffer(val) {
        return (
          val !== null &&
          !isUndefined(val) &&
          val.constructor !== null &&
          !isUndefined(val.constructor) &&
          typeof val.constructor.isBuffer === "function" &&
          val.constructor.isBuffer(val)
        );
      }

      /**
       * Determine if a value is an ArrayBuffer
       *
       * @param {Object} val The value to test
       * @returns {boolean} True if value is an ArrayBuffer, otherwise false
       */
      function isArrayBuffer(val) {
        return toString.call(val) === "[object ArrayBuffer]";
      }

      /**
       * Determine if a value is a FormData
       *
       * @param {Object} val The value to test
       * @returns {boolean} True if value is an FormData, otherwise false
       */
      function isFormData(val) {
        return toString.call(val) === "[object FormData]";
      }

      /**
       * Determine if a value is a view on an ArrayBuffer
       *
       * @param {Object} val The value to test
       * @returns {boolean} True if value is a view on an ArrayBuffer, otherwise false
       */
      function isArrayBufferView(val) {
        var result;
        if (typeof ArrayBuffer !== "undefined" && ArrayBuffer.isView) {
          result = ArrayBuffer.isView(val);
        } else {
          result = val && val.buffer && isArrayBuffer(val.buffer);
        }
        return result;
      }

      /**
       * Determine if a value is a String
       *
       * @param {Object} val The value to test
       * @returns {boolean} True if value is a String, otherwise false
       */
      function isString(val) {
        return typeof val === "string";
      }

      /**
       * Determine if a value is a Number
       *
       * @param {Object} val The value to test
       * @returns {boolean} True if value is a Number, otherwise false
       */
      function isNumber(val) {
        return typeof val === "number";
      }

      /**
       * Determine if a value is an Object
       *
       * @param {Object} val The value to test
       * @returns {boolean} True if value is an Object, otherwise false
       */
      function isObject(val) {
        return val !== null && typeof val === "object";
      }

      /**
       * Determine if a value is a plain Object
       *
       * @param {Object} val The value to test
       * @return {boolean} True if value is a plain Object, otherwise false
       */
      function isPlainObject(val) {
        if (toString.call(val) !== "[object Object]") {
          return false;
        }

        var prototype = Object.getPrototypeOf(val);
        return prototype === null || prototype === Object.prototype;
      }

      /**
       * Determine if a value is a Date
       *
       * @param {Object} val The value to test
       * @returns {boolean} True if value is a Date, otherwise false
       */
      function isDate(val) {
        return toString.call(val) === "[object Date]";
      }

      /**
       * Determine if a value is a File
       *
       * @param {Object} val The value to test
       * @returns {boolean} True if value is a File, otherwise false
       */
      function isFile(val) {
        return toString.call(val) === "[object File]";
      }

      /**
       * Determine if a value is a Blob
       *
       * @param {Object} val The value to test
       * @returns {boolean} True if value is a Blob, otherwise false
       */
      function isBlob(val) {
        return toString.call(val) === "[object Blob]";
      }

      /**
       * Determine if a value is a Function
       *
       * @param {Object} val The value to test
       * @returns {boolean} True if value is a Function, otherwise false
       */
      function isFunction(val) {
        return toString.call(val) === "[object Function]";
      }

      /**
       * Determine if a value is a Stream
       *
       * @param {Object} val The value to test
       * @returns {boolean} True if value is a Stream, otherwise false
       */
      function isStream(val) {
        return isObject(val) && isFunction(val.pipe);
      }

      /**
       * Determine if a value is a URLSearchParams object
       *
       * @param {Object} val The value to test
       * @returns {boolean} True if value is a URLSearchParams object, otherwise false
       */
      function isURLSearchParams(val) {
        return toString.call(val) === "[object URLSearchParams]";
      }

      /**
       * Trim excess whitespace off the beginning and end of a string
       *
       * @param {String} str The String to trim
       * @returns {String} The String freed of excess whitespace
       */
      function trim(str) {
        return str.trim ? str.trim() : str.replace(/^\s+|\s+$/g, "");
      }

      /**
       * Determine if we're running in a standard browser environment
       *
       * This allows axios to run in a web worker, and react-native.
       * Both environments support XMLHttpRequest, but not fully standard globals.
       *
       * web workers:
       *  typeof window -> undefined
       *  typeof document -> undefined
       *
       * react-native:
       *  navigator.product -> 'ReactNative'
       * nativescript
       *  navigator.product -> 'NativeScript' or 'NS'
       */
      function isStandardBrowserEnv() {
        if (
          typeof navigator !== "undefined" &&
          (navigator.product === "ReactNative" ||
            navigator.product === "NativeScript" ||
            navigator.product === "NS")
        ) {
          return false;
        }
        return typeof window !== "undefined" && typeof document !== "undefined";
      }

      /**
       * Iterate over an Array or an Object invoking a function for each item.
       *
       * If `obj` is an Array callback will be called passing
       * the value, index, and complete array for each item.
       *
       * If 'obj' is an Object callback will be called passing
       * the value, key, and complete object for each property.
       *
       * @param {Object|Array} obj The object to iterate
       * @param {Function} fn The callback to invoke for each item
       */
      function forEach(obj, fn) {
        // Don't bother if no value provided
        if (obj === null || typeof obj === "undefined") {
          return;
        }

        // Force an array if not already something iterable
        if (typeof obj !== "object") {
          /*eslint no-param-reassign:0*/
          obj = [obj];
        }

        if (isArray(obj)) {
          // Iterate over array values
          for (var i = 0, l = obj.length; i < l; i++) {
            fn.call(null, obj[i], i, obj);
          }
        } else {
          // Iterate over object keys
          for (var key in obj) {
            if (Object.prototype.hasOwnProperty.call(obj, key)) {
              fn.call(null, obj[key], key, obj);
            }
          }
        }
      }

      /**
       * Accepts varargs expecting each argument to be an object, then
       * immutably merges the properties of each object and returns result.
       *
       * When multiple objects contain the same key the later object in
       * the arguments list will take precedence.
       *
       * Example:
       *
       * ```js
       * var result = merge({foo: 123}, {foo: 456});
       * console.log(result.foo); // outputs 456
       * ```
       *
       * @param {Object} obj1 Object to merge
       * @returns {Object} Result of all merge properties
       */
      function merge(/* obj1, obj2, obj3, ... */) {
        var result = {};
        function assignValue(val, key) {
          if (isPlainObject(result[key]) && isPlainObject(val)) {
            result[key] = merge(result[key], val);
          } else if (isPlainObject(val)) {
            result[key] = merge({}, val);
          } else if (isArray(val)) {
            result[key] = val.slice();
          } else {
            result[key] = val;
          }
        }

        for (var i = 0, l = arguments.length; i < l; i++) {
          forEach(arguments[i], assignValue);
        }
        return result;
      }

      /**
       * Extends object a by mutably adding to it the properties of object b.
       *
       * @param {Object} a The object to be extended
       * @param {Object} b The object to copy properties from
       * @param {Object} thisArg The object to bind function to
       * @return {Object} The resulting value of object a
       */
      function extend(a, b, thisArg) {
        forEach(b, function assignValue(val, key) {
          if (thisArg && typeof val === "function") {
            a[key] = bind(val, thisArg);
          } else {
            a[key] = val;
          }
        });
        return a;
      }

      /**
       * Remove byte order marker. This catches EF BB BF (the UTF-8 BOM)
       *
       * @param {string} content with BOM
       * @return {string} content value without BOM
       */
      function stripBOM(content) {
        if (content.charCodeAt(0) === 0xfeff) {
          content = content.slice(1);
        }
        return content;
      }

      module.exports = {
        isArray: isArray,
        isArrayBuffer: isArrayBuffer,
        isBuffer: isBuffer,
        isFormData: isFormData,
        isArrayBufferView: isArrayBufferView,
        isString: isString,
        isNumber: isNumber,
        isObject: isObject,
        isPlainObject: isPlainObject,
        isUndefined: isUndefined,
        isDate: isDate,
        isFile: isFile,
        isBlob: isBlob,
        isFunction: isFunction,
        isStream: isStream,
        isURLSearchParams: isURLSearchParams,
        isStandardBrowserEnv: isStandardBrowserEnv,
        forEach: forEach,
        merge: merge,
        extend: extend,
        trim: trim,
        stripBOM: stripBOM,
      };

      /***/
    },

    /***/ 8555: /***/ (module) => {
      "use strict";

      module.exports = balanced;
      function balanced(a, b, str) {
        if (a instanceof RegExp) a = maybeMatch(a, str);
        if (b instanceof RegExp) b = maybeMatch(b, str);

        var r = range(a, b, str);

        return (
          r && {
            start: r[0],
            end: r[1],
            pre: str.slice(0, r[0]),
            body: str.slice(r[0] + a.length, r[1]),
            post: str.slice(r[1] + b.length),
          }
        );
      }

      function maybeMatch(reg, str) {
        var m = str.match(reg);
        return m ? m[0] : null;
      }

      balanced.range = range;
      function range(a, b, str) {
        var begs, beg, left, right, result;
        var ai = str.indexOf(a);
        var bi = str.indexOf(b, ai + 1);
        var i = ai;

        if (ai >= 0 && bi > 0) {
          if (a === b) {
            return [ai, bi];
          }
          begs = [];
          left = str.length;

          while (i >= 0 && !result) {
            if (i == ai) {
              begs.push(i);
              ai = str.indexOf(a, i + 1);
            } else if (begs.length == 1) {
              result = [begs.pop(), bi];
            } else {
              beg = begs.pop();
              if (beg < left) {
                left = beg;
                right = bi;
              }

              bi = str.indexOf(b, i + 1);
            }

            i = ai < bi && ai >= 0 ? ai : bi;
          }

          if (begs.length) {
            result = [left, right];
          }
        }

        return result;
      }

      /***/
    },

    /***/ 4910: /***/ (
      module,
      __unused_webpack_exports,
      __nccwpck_require__,
    ) => {
      var register = __nccwpck_require__(3272);
      var addHook = __nccwpck_require__(2090);
      var removeHook = __nccwpck_require__(9544);

      // bind with array of arguments: https://stackoverflow.com/a/21792913
      var bind = Function.bind;
      var bindable = bind.bind(bind);

      function bindApi(hook, state, name) {
        var removeHookRef = bindable(removeHook, null).apply(
          null,
          name ? [state, name] : [state],
        );
        hook.api = { remove: removeHookRef };
        hook.remove = removeHookRef;
        ["before", "error", "after", "wrap"].forEach(function (kind) {
          var args = name ? [state, kind, name] : [state, kind];
          hook[kind] = hook.api[kind] = bindable(addHook, null).apply(
            null,
            args,
          );
        });
      }

      function HookSingular() {
        var singularHookName = "h";
        var singularHookState = {
          registry: {},
        };
        var singularHook = register.bind(
          null,
          singularHookState,
          singularHookName,
        );
        bindApi(singularHook, singularHookState, singularHookName);
        return singularHook;
      }

      function HookCollection() {
        var state = {
          registry: {},
        };

        var hook = register.bind(null, state);
        bindApi(hook, state);

        return hook;
      }

      var collectionHookDeprecationMessageDisplayed = false;
      function Hook() {
        if (!collectionHookDeprecationMessageDisplayed) {
          console.warn(
            '[before-after-hook]: "Hook()" repurposing warning, use "Hook.Collection()". Read more: https://git.io/upgrade-before-after-hook-to-1.4',
          );
          collectionHookDeprecationMessageDisplayed = true;
        }
        return HookCollection();
      }

      Hook.Singular = HookSingular.bind();
      Hook.Collection = HookCollection.bind();

      module.exports = Hook;
      // expose constructors as a named property for TypeScript
      module.exports.Hook = Hook;
      module.exports.Singular = Hook.Singular;
      module.exports.Collection = Hook.Collection;

      /***/
    },

    /***/ 2090: /***/ (module) => {
      module.exports = addHook;

      function addHook(state, kind, name, hook) {
        var orig = hook;
        if (!state.registry[name]) {
          state.registry[name] = [];
        }

        if (kind === "before") {
          hook = function (method, options) {
            return Promise.resolve()
              .then(orig.bind(null, options))
              .then(method.bind(null, options));
          };
        }

        if (kind === "after") {
          hook = function (method, options) {
            var result;
            return Promise.resolve()
              .then(method.bind(null, options))
              .then(function (result_) {
                result = result_;
                return orig(result, options);
              })
              .then(function () {
                return result;
              });
          };
        }

        if (kind === "error") {
          hook = function (method, options) {
            return Promise.resolve()
              .then(method.bind(null, options))
              .catch(function (error) {
                return orig(error, options);
              });
          };
        }

        state.registry[name].push({
          hook: hook,
          orig: orig,
        });
      }

      /***/
    },

    /***/ 3272: /***/ (module) => {
      module.exports = register;

      function register(state, name, method, options) {
        if (typeof method !== "function") {
          throw new Error("method for before hook must be a function");
        }

        if (!options) {
          options = {};
        }

        if (Array.isArray(name)) {
          return name.reverse().reduce(function (callback, name) {
            return register.bind(null, state, name, callback, options);
          }, method)();
        }

        return Promise.resolve().then(function () {
          if (!state.registry[name]) {
            return method(options);
          }

          return state.registry[name].reduce(function (method, registered) {
            return registered.hook.bind(null, method, options);
          }, method)();
        });
      }

      /***/
    },

    /***/ 9544: /***/ (module) => {
      module.exports = removeHook;

      function removeHook(state, name, method) {
        if (!state.registry[name]) {
          return;
        }

        var index = state.registry[name]
          .map(function (registered) {
            return registered.orig;
          })
          .indexOf(method);

        if (index === -1) {
          return;
        }

        state.registry[name].splice(index, 1);
      }

      /***/
    },

    /***/ 4231: /***/ (
      module,
      __unused_webpack_exports,
      __nccwpck_require__,
    ) => {
      var balanced = __nccwpck_require__(8555);

      module.exports = expandTop;

      var escSlash = "\0SLASH" + Math.random() + "\0";
      var escOpen = "\0OPEN" + Math.random() + "\0";
      var escClose = "\0CLOSE" + Math.random() + "\0";
      var escComma = "\0COMMA" + Math.random() + "\0";
      var escPeriod = "\0PERIOD" + Math.random() + "\0";

      function numeric(str) {
        return parseInt(str, 10) == str ? parseInt(str, 10) : str.charCodeAt(0);
      }

      function escapeBraces(str) {
        return str
          .split("\\\\")
          .join(escSlash)
          .split("\\{")
          .join(escOpen)
          .split("\\}")
          .join(escClose)
          .split("\\,")
          .join(escComma)
          .split("\\.")
          .join(escPeriod);
      }

      function unescapeBraces(str) {
        return str
          .split(escSlash)
          .join("\\")
          .split(escOpen)
          .join("{")
          .split(escClose)
          .join("}")
          .split(escComma)
          .join(",")
          .split(escPeriod)
          .join(".");
      }

      // Basically just str.split(","), but handling cases
      // where we have nested braced sections, which should be
      // treated as individual members, like {a,{b,c},d}
      function parseCommaParts(str) {
        if (!str) return [""];

        var parts = [];
        var m = balanced("{", "}", str);

        if (!m) return str.split(",");

        var pre = m.pre;
        var body = m.body;
        var post = m.post;
        var p = pre.split(",");

        p[p.length - 1] += "{" + body + "}";
        var postParts = parseCommaParts(post);
        if (post.length) {
          p[p.length - 1] += postParts.shift();
          p.push.apply(p, postParts);
        }

        parts.push.apply(parts, p);

        return parts;
      }

      function expandTop(str) {
        if (!str) return [];

        // I don't know why Bash 4.3 does this, but it does.
        // Anything starting with {} will have the first two bytes preserved
        // but *only* at the top level, so {},a}b will not expand to anything,
        // but a{},b}c will be expanded to [a}c,abc].
        // One could argue that this is a bug in Bash, but since the goal of
        // this module is to match Bash's rules, we escape a leading {}
        if (str.substr(0, 2) === "{}") {
          str = "\\{\\}" + str.substr(2);
        }

        return expand(escapeBraces(str), true).map(unescapeBraces);
      }

      function embrace(str) {
        return "{" + str + "}";
      }
      function isPadded(el) {
        return /^-?0\d/.test(el);
      }

      function lte(i, y) {
        return i <= y;
      }
      function gte(i, y) {
        return i >= y;
      }

      function expand(str, isTop) {
        var expansions = [];

        var m = balanced("{", "}", str);
        if (!m) return [str];

        // no need to expand pre, since it is guaranteed to be free of brace-sets
        var pre = m.pre;
        var post = m.post.length ? expand(m.post, false) : [""];

        if (/\$$/.test(m.pre)) {
          for (var k = 0; k < post.length; k++) {
            var expansion = pre + "{" + m.body + "}" + post[k];
            expansions.push(expansion);
          }
        } else {
          var isNumericSequence = /^-?\d+\.\.-?\d+(?:\.\.-?\d+)?$/.test(m.body);
          var isAlphaSequence = /^[a-zA-Z]\.\.[a-zA-Z](?:\.\.-?\d+)?$/.test(
            m.body,
          );
          var isSequence = isNumericSequence || isAlphaSequence;
          var isOptions = m.body.indexOf(",") >= 0;
          if (!isSequence && !isOptions) {
            // {a},b}
            if (m.post.match(/,.*\}/)) {
              str = m.pre + "{" + m.body + escClose + m.post;
              return expand(str);
            }
            return [str];
          }

          var n;
          if (isSequence) {
            n = m.body.split(/\.\./);
          } else {
            n = parseCommaParts(m.body);
            if (n.length === 1) {
              // x{{a,b}}y ==> x{a}y x{b}y
              n = expand(n[0], false).map(embrace);
              if (n.length === 1) {
                return post.map(function (p) {
                  return m.pre + n[0] + p;
                });
              }
            }
          }

          // at this point, n is the parts, and we know it's not a comma set
          // with a single entry.
          var N;

          if (isSequence) {
            var x = numeric(n[0]);
            var y = numeric(n[1]);
            var width = Math.max(n[0].length, n[1].length);
            var incr = n.length == 3 ? Math.abs(numeric(n[2])) : 1;
            var test = lte;
            var reverse = y < x;
            if (reverse) {
              incr *= -1;
              test = gte;
            }
            var pad = n.some(isPadded);

            N = [];

            for (var i = x; test(i, y); i += incr) {
              var c;
              if (isAlphaSequence) {
                c = String.fromCharCode(i);
                if (c === "\\") c = "";
              } else {
                c = String(i);
                if (pad) {
                  var need = width - c.length;
                  if (need > 0) {
                    var z = new Array(need + 1).join("0");
                    if (i < 0) c = "-" + z + c.slice(1);
                    else c = z + c;
                  }
                }
              }
              N.push(c);
            }
          } else {
            N = [];

            for (var j = 0; j < n.length; j++) {
              N.push.apply(N, expand(n[j], false));
            }
          }

          for (var j = 0; j < N.length; j++) {
            for (var k = 0; k < post.length; k++) {
              var expansion = pre + N[j] + post[k];
              if (!isTop || isSequence || expansion) expansions.push(expansion);
            }
          }
        }

        return expansions;
      }

      /***/
    },

    /***/ 5127: /***/ (
      module,
      __unused_webpack_exports,
      __nccwpck_require__,
    ) => {
      var util = __nccwpck_require__(3837);
      var Stream = __nccwpck_require__(2781).Stream;
      var DelayedStream = __nccwpck_require__(4752);

      module.exports = CombinedStream;
      function CombinedStream() {
        this.writable = false;
        this.readable = true;
        this.dataSize = 0;
        this.maxDataSize = 2 * 1024 * 1024;
        this.pauseStreams = true;

        this._released = false;
        this._streams = [];
        this._currentStream = null;
        this._insideLoop = false;
        this._pendingNext = false;
      }
      util.inherits(CombinedStream, Stream);

      CombinedStream.create = function (options) {
        var combinedStream = new this();

        options = options || {};
        for (var option in options) {
          combinedStream[option] = options[option];
        }

        return combinedStream;
      };

      CombinedStream.isStreamLike = function (stream) {
        return (
          typeof stream !== "function" &&
          typeof stream !== "string" &&
          typeof stream !== "boolean" &&
          typeof stream !== "number" &&
          !Buffer.isBuffer(stream)
        );
      };

      CombinedStream.prototype.append = function (stream) {
        var isStreamLike = CombinedStream.isStreamLike(stream);

        if (isStreamLike) {
          if (!(stream instanceof DelayedStream)) {
            var newStream = DelayedStream.create(stream, {
              maxDataSize: Infinity,
              pauseStream: this.pauseStreams,
            });
            stream.on("data", this._checkDataSize.bind(this));
            stream = newStream;
          }

          this._handleErrors(stream);

          if (this.pauseStreams) {
            stream.pause();
          }
        }

        this._streams.push(stream);
        return this;
      };

      CombinedStream.prototype.pipe = function (dest, options) {
        Stream.prototype.pipe.call(this, dest, options);
        this.resume();
        return dest;
      };

      CombinedStream.prototype._getNext = function () {
        this._currentStream = null;

        if (this._insideLoop) {
          this._pendingNext = true;
          return; // defer call
        }

        this._insideLoop = true;
        try {
          do {
            this._pendingNext = false;
            this._realGetNext();
          } while (this._pendingNext);
        } finally {
          this._insideLoop = false;
        }
      };

      CombinedStream.prototype._realGetNext = function () {
        var stream = this._streams.shift();

        if (typeof stream == "undefined") {
          this.end();
          return;
        }

        if (typeof stream !== "function") {
          this._pipeNext(stream);
          return;
        }

        var getStream = stream;
        getStream(
          function (stream) {
            var isStreamLike = CombinedStream.isStreamLike(stream);
            if (isStreamLike) {
              stream.on("data", this._checkDataSize.bind(this));
              this._handleErrors(stream);
            }

            this._pipeNext(stream);
          }.bind(this),
        );
      };

      CombinedStream.prototype._pipeNext = function (stream) {
        this._currentStream = stream;

        var isStreamLike = CombinedStream.isStreamLike(stream);
        if (isStreamLike) {
          stream.on("end", this._getNext.bind(this));
          stream.pipe(this, { end: false });
          return;
        }

        var value = stream;
        this.write(value);
        this._getNext();
      };

      CombinedStream.prototype._handleErrors = function (stream) {
        var self = this;
        stream.on("error", function (err) {
          self._emitError(err);
        });
      };

      CombinedStream.prototype.write = function (data) {
        this.emit("data", data);
      };

      CombinedStream.prototype.pause = function () {
        if (!this.pauseStreams) {
          return;
        }

        if (
          this.pauseStreams &&
          this._currentStream &&
          typeof this._currentStream.pause == "function"
        )
          this._currentStream.pause();
        this.emit("pause");
      };

      CombinedStream.prototype.resume = function () {
        if (!this._released) {
          this._released = true;
          this.writable = true;
          this._getNext();
        }

        if (
          this.pauseStreams &&
          this._currentStream &&
          typeof this._currentStream.resume == "function"
        )
          this._currentStream.resume();
        this.emit("resume");
      };

      CombinedStream.prototype.end = function () {
        this._reset();
        this.emit("end");
      };

      CombinedStream.prototype.destroy = function () {
        this._reset();
        this.emit("close");
      };

      CombinedStream.prototype._reset = function () {
        this.writable = false;
        this._streams = [];
        this._currentStream = null;
      };

      CombinedStream.prototype._checkDataSize = function () {
        this._updateDataSize();
        if (this.dataSize <= this.maxDataSize) {
          return;
        }

        var message =
          "DelayedStream#maxDataSize of " +
          this.maxDataSize +
          " bytes exceeded.";
        this._emitError(new Error(message));
      };

      CombinedStream.prototype._updateDataSize = function () {
        this.dataSize = 0;

        var self = this;
        this._streams.forEach(function (stream) {
          if (!stream.dataSize) {
            return;
          }

          self.dataSize += stream.dataSize;
        });

        if (this._currentStream && this._currentStream.dataSize) {
          this.dataSize += this._currentStream.dataSize;
        }
      };

      CombinedStream.prototype._emitError = function (err) {
        this._reset();
        this.emit("error", err);
      };

      /***/
    },

    /***/ 4752: /***/ (
      module,
      __unused_webpack_exports,
      __nccwpck_require__,
    ) => {
      var Stream = __nccwpck_require__(2781).Stream;
      var util = __nccwpck_require__(3837);

      module.exports = DelayedStream;
      function DelayedStream() {
        this.source = null;
        this.dataSize = 0;
        this.maxDataSize = 1024 * 1024;
        this.pauseStream = true;

        this._maxDataSizeExceeded = false;
        this._released = false;
        this._bufferedEvents = [];
      }
      util.inherits(DelayedStream, Stream);

      DelayedStream.create = function (source, options) {
        var delayedStream = new this();

        options = options || {};
        for (var option in options) {
          delayedStream[option] = options[option];
        }

        delayedStream.source = source;

        var realEmit = source.emit;
        source.emit = function () {
          delayedStream._handleEmit(arguments);
          return realEmit.apply(source, arguments);
        };

        source.on("error", function () {});
        if (delayedStream.pauseStream) {
          source.pause();
        }

        return delayedStream;
      };

      Object.defineProperty(DelayedStream.prototype, "readable", {
        configurable: true,
        enumerable: true,
        get: function () {
          return this.source.readable;
        },
      });

      DelayedStream.prototype.setEncoding = function () {
        return this.source.setEncoding.apply(this.source, arguments);
      };

      DelayedStream.prototype.resume = function () {
        if (!this._released) {
          this.release();
        }

        this.source.resume();
      };

      DelayedStream.prototype.pause = function () {
        this.source.pause();
      };

      DelayedStream.prototype.release = function () {
        this._released = true;

        this._bufferedEvents.forEach(
          function (args) {
            this.emit.apply(this, args);
          }.bind(this),
        );
        this._bufferedEvents = [];
      };

      DelayedStream.prototype.pipe = function () {
        var r = Stream.prototype.pipe.apply(this, arguments);
        this.resume();
        return r;
      };

      DelayedStream.prototype._handleEmit = function (args) {
        if (this._released) {
          this.emit.apply(this, args);
          return;
        }

        if (args[0] === "data") {
          this.dataSize += args[1].length;
          this._checkIfMaxDataSizeExceeded();
        }

        this._bufferedEvents.push(args);
      };

      DelayedStream.prototype._checkIfMaxDataSizeExceeded = function () {
        if (this._maxDataSizeExceeded) {
          return;
        }

        if (this.dataSize <= this.maxDataSize) {
          return;
        }

        this._maxDataSizeExceeded = true;
        var message =
          "DelayedStream#maxDataSize of " +
          this.maxDataSize +
          " bytes exceeded.";
        this.emit("error", new Error(message));
      };

      /***/
    },

    /***/ 3595: /***/ (__unused_webpack_module, exports) => {
      "use strict";

      Object.defineProperty(exports, "__esModule", { value: true });

      class Deprecation extends Error {
        constructor(message) {
          super(message); // Maintains proper stack trace (only available on V8)

          /* istanbul ignore next */

          if (Error.captureStackTrace) {
            Error.captureStackTrace(this, this.constructor);
          }

          this.name = "Deprecation";
        }
      }

      exports.Deprecation = Deprecation;

      /***/
    },

    /***/ 9373: /***/ (
      module,
      __unused_webpack_exports,
      __nccwpck_require__,
    ) => {
      var debug;

      module.exports = function () {
        if (!debug) {
          try {
            /* eslint global-require: off */
            debug = __nccwpck_require__(7939)("follow-redirects");
          } catch (error) {
            /* */
          }
          if (typeof debug !== "function") {
            debug = function () {
              /* */
            };
          }
        }
        debug.apply(null, arguments);
      };

      /***/
    },

    /***/ 1805: /***/ (
      module,
      __unused_webpack_exports,
      __nccwpck_require__,
    ) => {
      var url = __nccwpck_require__(7310);
      var URL = url.URL;
      var http = __nccwpck_require__(3685);
      var https = __nccwpck_require__(5687);
      var Writable = __nccwpck_require__(2781).Writable;
      var assert = __nccwpck_require__(9491);
      var debug = __nccwpck_require__(9373);

      // Create handlers that pass events from native requests
      var events = [
        "abort",
        "aborted",
        "connect",
        "error",
        "socket",
        "timeout",
      ];
      var eventHandlers = Object.create(null);
      events.forEach(function (event) {
        eventHandlers[event] = function (arg1, arg2, arg3) {
          this._redirectable.emit(event, arg1, arg2, arg3);
        };
      });

      var InvalidUrlError = createErrorType(
        "ERR_INVALID_URL",
        "Invalid URL",
        TypeError,
      );
      // Error types with codes
      var RedirectionError = createErrorType(
        "ERR_FR_REDIRECTION_FAILURE",
        "Redirected request failed",
      );
      var TooManyRedirectsError = createErrorType(
        "ERR_FR_TOO_MANY_REDIRECTS",
        "Maximum number of redirects exceeded",
      );
      var MaxBodyLengthExceededError = createErrorType(
        "ERR_FR_MAX_BODY_LENGTH_EXCEEDED",
        "Request body larger than maxBodyLength limit",
      );
      var WriteAfterEndError = createErrorType(
        "ERR_STREAM_WRITE_AFTER_END",
        "write after end",
      );

      // An HTTP(S) request that can be redirected
      function RedirectableRequest(options, responseCallback) {
        // Initialize the request
        Writable.call(this);
        this._sanitizeOptions(options);
        this._options = options;
        this._ended = false;
        this._ending = false;
        this._redirectCount = 0;
        this._redirects = [];
        this._requestBodyLength = 0;
        this._requestBodyBuffers = [];

        // Attach a callback if passed
        if (responseCallback) {
          this.on("response", responseCallback);
        }

        // React to responses of native requests
        var self = this;
        this._onNativeResponse = function (response) {
          self._processResponse(response);
        };

        // Perform the first request
        this._performRequest();
      }
      RedirectableRequest.prototype = Object.create(Writable.prototype);

      RedirectableRequest.prototype.abort = function () {
        abortRequest(this._currentRequest);
        this.emit("abort");
      };

      // Writes buffered data to the current native request
      RedirectableRequest.prototype.write = function (
        data,
        encoding,
        callback,
      ) {
        // Writing is not allowed if end has been called
        if (this._ending) {
          throw new WriteAfterEndError();
        }

        // Validate input and shift parameters if necessary
        if (!isString(data) && !isBuffer(data)) {
          throw new TypeError("data should be a string, Buffer or Uint8Array");
        }
        if (isFunction(encoding)) {
          callback = encoding;
          encoding = null;
        }

        // Ignore empty buffers, since writing them doesn't invoke the callback
        // https://github.com/nodejs/node/issues/22066
        if (data.length === 0) {
          if (callback) {
            callback();
          }
          return;
        }
        // Only write when we don't exceed the maximum body length
        if (
          this._requestBodyLength + data.length <=
          this._options.maxBodyLength
        ) {
          this._requestBodyLength += data.length;
          this._requestBodyBuffers.push({ data: data, encoding: encoding });
          this._currentRequest.write(data, encoding, callback);
        }
        // Error when we exceed the maximum body length
        else {
          this.emit("error", new MaxBodyLengthExceededError());
          this.abort();
        }
      };

      // Ends the current native request
      RedirectableRequest.prototype.end = function (data, encoding, callback) {
        // Shift parameters if necessary
        if (isFunction(data)) {
          callback = data;
          data = encoding = null;
        } else if (isFunction(encoding)) {
          callback = encoding;
          encoding = null;
        }

        // Write data if needed and end
        if (!data) {
          this._ended = this._ending = true;
          this._currentRequest.end(null, null, callback);
        } else {
          var self = this;
          var currentRequest = this._currentRequest;
          this.write(data, encoding, function () {
            self._ended = true;
            currentRequest.end(null, null, callback);
          });
          this._ending = true;
        }
      };

      // Sets a header value on the current native request
      RedirectableRequest.prototype.setHeader = function (name, value) {
        this._options.headers[name] = value;
        this._currentRequest.setHeader(name, value);
      };

      // Clears a header value on the current native request
      RedirectableRequest.prototype.removeHeader = function (name) {
        delete this._options.headers[name];
        this._currentRequest.removeHeader(name);
      };

      // Global timeout for all underlying requests
      RedirectableRequest.prototype.setTimeout = function (msecs, callback) {
        var self = this;

        // Destroys the socket on timeout
        function destroyOnTimeout(socket) {
          socket.setTimeout(msecs);
          socket.removeListener("timeout", socket.destroy);
          socket.addListener("timeout", socket.destroy);
        }

        // Sets up a timer to trigger a timeout event
        function startTimer(socket) {
          if (self._timeout) {
            clearTimeout(self._timeout);
          }
          self._timeout = setTimeout(function () {
            self.emit("timeout");
            clearTimer();
          }, msecs);
          destroyOnTimeout(socket);
        }

        // Stops a timeout from triggering
        function clearTimer() {
          // Clear the timeout
          if (self._timeout) {
            clearTimeout(self._timeout);
            self._timeout = null;
          }

          // Clean up all attached listeners
          self.removeListener("abort", clearTimer);
          self.removeListener("error", clearTimer);
          self.removeListener("response", clearTimer);
          if (callback) {
            self.removeListener("timeout", callback);
          }
          if (!self.socket) {
            self._currentRequest.removeListener("socket", startTimer);
          }
        }

        // Attach callback if passed
        if (callback) {
          this.on("timeout", callback);
        }

        // Start the timer if or when the socket is opened
        if (this.socket) {
          startTimer(this.socket);
        } else {
          this._currentRequest.once("socket", startTimer);
        }

        // Clean up on events
        this.on("socket", destroyOnTimeout);
        this.on("abort", clearTimer);
        this.on("error", clearTimer);
        this.on("response", clearTimer);

        return this;
      };

      // Proxy all other public ClientRequest methods
      ["flushHeaders", "getHeader", "setNoDelay", "setSocketKeepAlive"].forEach(
        function (method) {
          RedirectableRequest.prototype[method] = function (a, b) {
            return this._currentRequest[method](a, b);
          };
        },
      );

      // Proxy all public ClientRequest properties
      ["aborted", "connection", "socket"].forEach(function (property) {
        Object.defineProperty(RedirectableRequest.prototype, property, {
          get: function () {
            return this._currentRequest[property];
          },
        });
      });

      RedirectableRequest.prototype._sanitizeOptions = function (options) {
        // Ensure headers are always present
        if (!options.headers) {
          options.headers = {};
        }

        // Since http.request treats host as an alias of hostname,
        // but the url module interprets host as hostname plus port,
        // eliminate the host property to avoid confusion.
        if (options.host) {
          // Use hostname if set, because it has precedence
          if (!options.hostname) {
            options.hostname = options.host;
          }
          delete options.host;
        }

        // Complete the URL object when necessary
        if (!options.pathname && options.path) {
          var searchPos = options.path.indexOf("?");
          if (searchPos < 0) {
            options.pathname = options.path;
          } else {
            options.pathname = options.path.substring(0, searchPos);
            options.search = options.path.substring(searchPos);
          }
        }
      };

      // Executes the next native request (initial or redirect)
      RedirectableRequest.prototype._performRequest = function () {
        // Load the native protocol
        var protocol = this._options.protocol;
        var nativeProtocol = this._options.nativeProtocols[protocol];
        if (!nativeProtocol) {
          this.emit("error", new TypeError("Unsupported protocol " + protocol));
          return;
        }

        // If specified, use the agent corresponding to the protocol
        // (HTTP and HTTPS use different types of agents)
        if (this._options.agents) {
          var scheme = protocol.slice(0, -1);
          this._options.agent = this._options.agents[scheme];
        }

        // Create the native request and set up its event handlers
        var request = (this._currentRequest = nativeProtocol.request(
          this._options,
          this._onNativeResponse,
        ));
        request._redirectable = this;
        for (var event of events) {
          request.on(event, eventHandlers[event]);
        }

        // RFC7230§5.3.1: When making a request directly to an origin server, […]
        // a client MUST send only the absolute path […] as the request-target.
        this._currentUrl = /^\//.test(this._options.path)
          ? url.format(this._options)
          : // When making a request to a proxy, […]
            // a client MUST send the target URI in absolute-form […].
            this._options.path;

        // End a redirected request
        // (The first request must be ended explicitly with RedirectableRequest#end)
        if (this._isRedirect) {
          // Write the request entity and end
          var i = 0;
          var self = this;
          var buffers = this._requestBodyBuffers;
          (function writeNext(error) {
            // Only write if this request has not been redirected yet
            /* istanbul ignore else */
            if (request === self._currentRequest) {
              // Report any write errors
              /* istanbul ignore if */
              if (error) {
                self.emit("error", error);
              }
              // Write the next buffer if there are still left
              else if (i < buffers.length) {
                var buffer = buffers[i++];
                /* istanbul ignore else */
                if (!request.finished) {
                  request.write(buffer.data, buffer.encoding, writeNext);
                }
              }
              // End the request if `end` has been called on us
              else if (self._ended) {
                request.end();
              }
            }
          })();
        }
      };

      // Processes a response from the current native request
      RedirectableRequest.prototype._processResponse = function (response) {
        // Store the redirected response
        var statusCode = response.statusCode;
        if (this._options.trackRedirects) {
          this._redirects.push({
            url: this._currentUrl,
            headers: response.headers,
            statusCode: statusCode,
          });
        }

        // RFC7231§6.4: The 3xx (Redirection) class of status code indicates
        // that further action needs to be taken by the user agent in order to
        // fulfill the request. If a Location header field is provided,
        // the user agent MAY automatically redirect its request to the URI
        // referenced by the Location field value,
        // even if the specific status code is not understood.

        // If the response is not a redirect; return it as-is
        var location = response.headers.location;
        if (
          !location ||
          this._options.followRedirects === false ||
          statusCode < 300 ||
          statusCode >= 400
        ) {
          response.responseUrl = this._currentUrl;
          response.redirects = this._redirects;
          this.emit("response", response);

          // Clean up
          this._requestBodyBuffers = [];
          return;
        }

        // The response is a redirect, so abort the current request
        abortRequest(this._currentRequest);
        // Discard the remainder of the response to avoid waiting for data
        response.destroy();

        // RFC7231§6.4: A client SHOULD detect and intervene
        // in cyclical redirections (i.e., "infinite" redirection loops).
        if (++this._redirectCount > this._options.maxRedirects) {
          this.emit("error", new TooManyRedirectsError());
          return;
        }

        // Store the request headers if applicable
        var requestHeaders;
        var beforeRedirect = this._options.beforeRedirect;
        if (beforeRedirect) {
          requestHeaders = Object.assign(
            {
              // The Host header was set by nativeProtocol.request
              Host: response.req.getHeader("host"),
            },
            this._options.headers,
          );
        }

        // RFC7231§6.4: Automatic redirection needs to done with
        // care for methods not known to be safe, […]
        // RFC7231§6.4.2–3: For historical reasons, a user agent MAY change
        // the request method from POST to GET for the subsequent request.
        var method = this._options.method;
        if (
          ((statusCode === 301 || statusCode === 302) &&
            this._options.method === "POST") ||
          // RFC7231§6.4.4: The 303 (See Other) status code indicates that
          // the server is redirecting the user agent to a different resource […]
          // A user agent can perform a retrieval request targeting that URI
          // (a GET or HEAD request if using HTTP) […]
          (statusCode === 303 && !/^(?:GET|HEAD)$/.test(this._options.method))
        ) {
          this._options.method = "GET";
          // Drop a possible entity and headers related to it
          this._requestBodyBuffers = [];
          removeMatchingHeaders(/^content-/i, this._options.headers);
        }

        // Drop the Host header, as the redirect might lead to a different host
        var currentHostHeader = removeMatchingHeaders(
          /^host$/i,
          this._options.headers,
        );

        // If the redirect is relative, carry over the host of the last request
        var currentUrlParts = url.parse(this._currentUrl);
        var currentHost = currentHostHeader || currentUrlParts.host;
        var currentUrl = /^\w+:/.test(location)
          ? this._currentUrl
          : url.format(Object.assign(currentUrlParts, { host: currentHost }));

        // Determine the URL of the redirection
        var redirectUrl;
        try {
          redirectUrl = url.resolve(currentUrl, location);
        } catch (cause) {
          this.emit("error", new RedirectionError({ cause: cause }));
          return;
        }

        // Create the redirected request
        debug("redirecting to", redirectUrl);
        this._isRedirect = true;
        var redirectUrlParts = url.parse(redirectUrl);
        Object.assign(this._options, redirectUrlParts);

        // Drop confidential headers when redirecting to a less secure protocol
        // or to a different domain that is not a superdomain
        if (
          (redirectUrlParts.protocol !== currentUrlParts.protocol &&
            redirectUrlParts.protocol !== "https:") ||
          (redirectUrlParts.host !== currentHost &&
            !isSubdomain(redirectUrlParts.host, currentHost))
        ) {
          removeMatchingHeaders(
            /^(?:authorization|cookie)$/i,
            this._options.headers,
          );
        }

        // Evaluate the beforeRedirect callback
        if (isFunction(beforeRedirect)) {
          var responseDetails = {
            headers: response.headers,
            statusCode: statusCode,
          };
          var requestDetails = {
            url: currentUrl,
            method: method,
            headers: requestHeaders,
          };
          try {
            beforeRedirect(this._options, responseDetails, requestDetails);
          } catch (err) {
            this.emit("error", err);
            return;
          }
          this._sanitizeOptions(this._options);
        }

        // Perform the redirected request
        try {
          this._performRequest();
        } catch (cause) {
          this.emit("error", new RedirectionError({ cause: cause }));
        }
      };

      // Wraps the key/value object of protocols with redirect functionality
      function wrap(protocols) {
        // Default settings
        var exports = {
          maxRedirects: 21,
          maxBodyLength: 10 * 1024 * 1024,
        };

        // Wrap each protocol
        var nativeProtocols = {};
        Object.keys(protocols).forEach(function (scheme) {
          var protocol = scheme + ":";
          var nativeProtocol = (nativeProtocols[protocol] = protocols[scheme]);
          var wrappedProtocol = (exports[scheme] =
            Object.create(nativeProtocol));

          // Executes a request, following redirects
          function request(input, options, callback) {
            // Parse parameters
            if (isString(input)) {
              var parsed;
              try {
                parsed = urlToOptions(new URL(input));
              } catch (err) {
                /* istanbul ignore next */
                parsed = url.parse(input);
              }
              if (!isString(parsed.protocol)) {
                throw new InvalidUrlError({ input });
              }
              input = parsed;
            } else if (URL && input instanceof URL) {
              input = urlToOptions(input);
            } else {
              callback = options;
              options = input;
              input = { protocol: protocol };
            }
            if (isFunction(options)) {
              callback = options;
              options = null;
            }

            // Set defaults
            options = Object.assign(
              {
                maxRedirects: exports.maxRedirects,
                maxBodyLength: exports.maxBodyLength,
              },
              input,
              options,
            );
            options.nativeProtocols = nativeProtocols;
            if (!isString(options.host) && !isString(options.hostname)) {
              options.hostname = "::1";
            }

            assert.equal(options.protocol, protocol, "protocol mismatch");
            debug("options", options);
            return new RedirectableRequest(options, callback);
          }

          // Executes a GET request, following redirects
          function get(input, options, callback) {
            var wrappedRequest = wrappedProtocol.request(
              input,
              options,
              callback,
            );
            wrappedRequest.end();
            return wrappedRequest;
          }

          // Expose the properties on the wrapped protocol
          Object.defineProperties(wrappedProtocol, {
            request: {
              value: request,
              configurable: true,
              enumerable: true,
              writable: true,
            },
            get: {
              value: get,
              configurable: true,
              enumerable: true,
              writable: true,
            },
          });
        });
        return exports;
      }

      /* istanbul ignore next */
      function noop() {
        /* empty */
      }

      // from https://github.com/nodejs/node/blob/master/lib/internal/url.js
      function urlToOptions(urlObject) {
        var options = {
          protocol: urlObject.protocol,
          hostname: urlObject.hostname.startsWith("[")
            ? /* istanbul ignore next */
              urlObject.hostname.slice(1, -1)
            : urlObject.hostname,
          hash: urlObject.hash,
          search: urlObject.search,
          pathname: urlObject.pathname,
          path: urlObject.pathname + urlObject.search,
          href: urlObject.href,
        };
        if (urlObject.port !== "") {
          options.port = Number(urlObject.port);
        }
        return options;
      }

      function removeMatchingHeaders(regex, headers) {
        var lastValue;
        for (var header in headers) {
          if (regex.test(header)) {
            lastValue = headers[header];
            delete headers[header];
          }
        }
        return lastValue === null || typeof lastValue === "undefined"
          ? undefined
          : String(lastValue).trim();
      }

      function createErrorType(code, message, baseClass) {
        // Create constructor
        function CustomError(properties) {
          Error.captureStackTrace(this, this.constructor);
          Object.assign(this, properties || {});
          this.code = code;
          this.message = this.cause
            ? message + ": " + this.cause.message
            : message;
        }

        // Attach constructor and set default properties
        CustomError.prototype = new (baseClass || Error)();
        CustomError.prototype.constructor = CustomError;
        CustomError.prototype.name = "Error [" + code + "]";
        return CustomError;
      }

      function abortRequest(request) {
        for (var event of events) {
          request.removeListener(event, eventHandlers[event]);
        }
        request.on("error", noop);
        request.abort();
      }

      function isSubdomain(subdomain, domain) {
        assert(isString(subdomain) && isString(domain));
        var dot = subdomain.length - domain.length - 1;
        return dot > 0 && subdomain[dot] === "." && subdomain.endsWith(domain);
      }

      function isString(value) {
        return typeof value === "string" || value instanceof String;
      }

      function isFunction(value) {
        return typeof value === "function";
      }

      function isBuffer(value) {
        return typeof value === "object" && "length" in value;
      }

      // Exports
      module.exports = wrap({ http: http, https: https });
      module.exports.wrap = wrap;

      /***/
    },

    /***/ 6872: /***/ (
      module,
      __unused_webpack_exports,
      __nccwpck_require__,
    ) => {
      var CombinedStream = __nccwpck_require__(5127);
      var util = __nccwpck_require__(3837);
      var path = __nccwpck_require__(1017);
      var http = __nccwpck_require__(3685);
      var https = __nccwpck_require__(5687);
      var parseUrl = __nccwpck_require__(7310).parse;
      var fs = __nccwpck_require__(7147);
      var Stream = __nccwpck_require__(2781).Stream;
      var mime = __nccwpck_require__(2834);
      var asynckit = __nccwpck_require__(9633);
      var populate = __nccwpck_require__(5630);

      // Public API
      module.exports = FormData;

      // make it a Stream
      util.inherits(FormData, CombinedStream);

      /**
       * Create readable "multipart/form-data" streams.
       * Can be used to submit forms
       * and file uploads to other web applications.
       *
       * @constructor
       * @param {Object} options - Properties to be added/overriden for FormData and CombinedStream
       */
      function FormData(options) {
        if (!(this instanceof FormData)) {
          return new FormData(options);
        }

        this._overheadLength = 0;
        this._valueLength = 0;
        this._valuesToMeasure = [];

        CombinedStream.call(this);

        options = options || {};
        for (var option in options) {
          this[option] = options[option];
        }
      }

      FormData.LINE_BREAK = "\r\n";
      FormData.DEFAULT_CONTENT_TYPE = "application/octet-stream";

      FormData.prototype.append = function (field, value, options) {
        options = options || {};

        // allow filename as single option
        if (typeof options == "string") {
          options = { filename: options };
        }

        var append = CombinedStream.prototype.append.bind(this);

        // all that streamy business can't handle numbers
        if (typeof value == "number") {
          value = "" + value;
        }

        // https://github.com/felixge/node-form-data/issues/38
        if (util.isArray(value)) {
          // Please convert your array into string
          // the way web server expects it
          this._error(new Error("Arrays are not supported."));
          return;
        }

        var header = this._multiPartHeader(field, value, options);
        var footer = this._multiPartFooter();

        append(header);
        append(value);
        append(footer);

        // pass along options.knownLength
        this._trackLength(header, value, options);
      };

      FormData.prototype._trackLength = function (header, value, options) {
        var valueLength = 0;

        // used w/ getLengthSync(), when length is known.
        // e.g. for streaming directly from a remote server,
        // w/ a known file a size, and not wanting to wait for
        // incoming file to finish to get its size.
        if (options.knownLength != null) {
          valueLength += +options.knownLength;
        } else if (Buffer.isBuffer(value)) {
          valueLength = value.length;
        } else if (typeof value === "string") {
          valueLength = Buffer.byteLength(value);
        }

        this._valueLength += valueLength;

        // @check why add CRLF? does this account for custom/multiple CRLFs?
        this._overheadLength +=
          Buffer.byteLength(header) + FormData.LINE_BREAK.length;

        // empty or either doesn't have path or not an http response or not a stream
        if (
          !value ||
          (!value.path &&
            !(value.readable && value.hasOwnProperty("httpVersion")) &&
            !(value instanceof Stream))
        ) {
          return;
        }

        // no need to bother with the length
        if (!options.knownLength) {
          this._valuesToMeasure.push(value);
        }
      };

      FormData.prototype._lengthRetriever = function (value, callback) {
        if (value.hasOwnProperty("fd")) {
          // take read range into a account
          // `end` = Infinity –> read file till the end
          //
          // TODO: Looks like there is bug in Node fs.createReadStream
          // it doesn't respect `end` options without `start` options
          // Fix it when node fixes it.
          // https://github.com/joyent/node/issues/7819
          if (
            value.end != undefined &&
            value.end != Infinity &&
            value.start != undefined
          ) {
            // when end specified
            // no need to calculate range
            // inclusive, starts with 0
            callback(null, value.end + 1 - (value.start ? value.start : 0));

            // not that fast snoopy
          } else {
            // still need to fetch file size from fs
            fs.stat(value.path, function (err, stat) {
              var fileSize;

              if (err) {
                callback(err);
                return;
              }

              // update final size based on the range options
              fileSize = stat.size - (value.start ? value.start : 0);
              callback(null, fileSize);
            });
          }

          // or http response
        } else if (value.hasOwnProperty("httpVersion")) {
          callback(null, +value.headers["content-length"]);

          // or request stream http://github.com/mikeal/request
        } else if (value.hasOwnProperty("httpModule")) {
          // wait till response come back
          value.on("response", function (response) {
            value.pause();
            callback(null, +response.headers["content-length"]);
          });
          value.resume();

          // something else
        } else {
          callback("Unknown stream");
        }
      };

      FormData.prototype._multiPartHeader = function (field, value, options) {
        // custom header specified (as string)?
        // it becomes responsible for boundary
        // (e.g. to handle extra CRLFs on .NET servers)
        if (typeof options.header == "string") {
          return options.header;
        }

        var contentDisposition = this._getContentDisposition(value, options);
        var contentType = this._getContentType(value, options);

        var contents = "";
        var headers = {
          // add custom disposition as third element or keep it two elements if not
          "Content-Disposition": ["form-data", 'name="' + field + '"'].concat(
            contentDisposition || [],
          ),
          // if no content type. allow it to be empty array
          "Content-Type": [].concat(contentType || []),
        };

        // allow custom headers.
        if (typeof options.header == "object") {
          populate(headers, options.header);
        }

        var header;
        for (var prop in headers) {
          if (!headers.hasOwnProperty(prop)) continue;
          header = headers[prop];

          // skip nullish headers.
          if (header == null) {
            continue;
          }

          // convert all headers to arrays.
          if (!Array.isArray(header)) {
            header = [header];
          }

          // add non-empty headers.
          if (header.length) {
            contents += prop + ": " + header.join("; ") + FormData.LINE_BREAK;
          }
        }

        return (
          "--" +
          this.getBoundary() +
          FormData.LINE_BREAK +
          contents +
          FormData.LINE_BREAK
        );
      };

      FormData.prototype._getContentDisposition = function (value, options) {
        var filename, contentDisposition;

        if (typeof options.filepath === "string") {
          // custom filepath for relative paths
          filename = path.normalize(options.filepath).replace(/\\/g, "/");
        } else if (options.filename || value.name || value.path) {
          // custom filename take precedence
          // formidable and the browser add a name property
          // fs- and request- streams have path property
          filename = path.basename(
            options.filename || value.name || value.path,
          );
        } else if (value.readable && value.hasOwnProperty("httpVersion")) {
          // or try http response
          filename = path.basename(value.client._httpMessage.path || "");
        }

        if (filename) {
          contentDisposition = 'filename="' + filename + '"';
        }

        return contentDisposition;
      };

      FormData.prototype._getContentType = function (value, options) {
        // use custom content-type above all
        var contentType = options.contentType;

        // or try `name` from formidable, browser
        if (!contentType && value.name) {
          contentType = mime.lookup(value.name);
        }

        // or try `path` from fs-, request- streams
        if (!contentType && value.path) {
          contentType = mime.lookup(value.path);
        }

        // or if it's http-reponse
        if (
          !contentType &&
          value.readable &&
          value.hasOwnProperty("httpVersion")
        ) {
          contentType = value.headers["content-type"];
        }

        // or guess it from the filepath or filename
        if (!contentType && (options.filepath || options.filename)) {
          contentType = mime.lookup(options.filepath || options.filename);
        }

        // fallback to the default content type if `value` is not simple value
        if (!contentType && typeof value == "object") {
          contentType = FormData.DEFAULT_CONTENT_TYPE;
        }

        return contentType;
      };

      FormData.prototype._multiPartFooter = function () {
        return function (next) {
          var footer = FormData.LINE_BREAK;

          var lastPart = this._streams.length === 0;
          if (lastPart) {
            footer += this._lastBoundary();
          }

          next(footer);
        }.bind(this);
      };

      FormData.prototype._lastBoundary = function () {
        return "--" + this.getBoundary() + "--" + FormData.LINE_BREAK;
      };

      FormData.prototype.getHeaders = function (userHeaders) {
        var header;
        var formHeaders = {
          "content-type": "multipart/form-data; boundary=" + this.getBoundary(),
        };

        for (header in userHeaders) {
          if (userHeaders.hasOwnProperty(header)) {
            formHeaders[header.toLowerCase()] = userHeaders[header];
          }
        }

        return formHeaders;
      };

      FormData.prototype.setBoundary = function (boundary) {
        this._boundary = boundary;
      };

      FormData.prototype.getBoundary = function () {
        if (!this._boundary) {
          this._generateBoundary();
        }

        return this._boundary;
      };

      FormData.prototype.getBuffer = function () {
        var dataBuffer = new Buffer.alloc(0);
        var boundary = this.getBoundary();

        // Create the form content. Add Line breaks to the end of data.
        for (var i = 0, len = this._streams.length; i < len; i++) {
          if (typeof this._streams[i] !== "function") {
            // Add content to the buffer.
            if (Buffer.isBuffer(this._streams[i])) {
              dataBuffer = Buffer.concat([dataBuffer, this._streams[i]]);
            } else {
              dataBuffer = Buffer.concat([
                dataBuffer,
                Buffer.from(this._streams[i]),
              ]);
            }

            // Add break after content.
            if (
              typeof this._streams[i] !== "string" ||
              this._streams[i].substring(2, boundary.length + 2) !== boundary
            ) {
              dataBuffer = Buffer.concat([
                dataBuffer,
                Buffer.from(FormData.LINE_BREAK),
              ]);
            }
          }
        }

        // Add the footer and return the Buffer object.
        return Buffer.concat([dataBuffer, Buffer.from(this._lastBoundary())]);
      };

      FormData.prototype._generateBoundary = function () {
        // This generates a 50 character boundary similar to those used by Firefox.
        // They are optimized for boyer-moore parsing.
        var boundary = "--------------------------";
        for (var i = 0; i < 24; i++) {
          boundary += Math.floor(Math.random() * 10).toString(16);
        }

        this._boundary = boundary;
      };

      // Note: getLengthSync DOESN'T calculate streams length
      // As workaround one can calculate file size manually
      // and add it as knownLength option
      FormData.prototype.getLengthSync = function () {
        var knownLength = this._overheadLength + this._valueLength;

        // Don't get confused, there are 3 "internal" streams for each keyval pair
        // so it basically checks if there is any value added to the form
        if (this._streams.length) {
          knownLength += this._lastBoundary().length;
        }

        // https://github.com/form-data/form-data/issues/40
        if (!this.hasKnownLength()) {
          // Some async length retrievers are present
          // therefore synchronous length calculation is false.
          // Please use getLength(callback) to get proper length
          this._error(
            new Error("Cannot calculate proper length in synchronous way."),
          );
        }

        return knownLength;
      };

      // Public API to check if length of added values is known
      // https://github.com/form-data/form-data/issues/196
      // https://github.com/form-data/form-data/issues/262
      FormData.prototype.hasKnownLength = function () {
        var hasKnownLength = true;

        if (this._valuesToMeasure.length) {
          hasKnownLength = false;
        }

        return hasKnownLength;
      };

      FormData.prototype.getLength = function (cb) {
        var knownLength = this._overheadLength + this._valueLength;

        if (this._streams.length) {
          knownLength += this._lastBoundary().length;
        }

        if (!this._valuesToMeasure.length) {
          process.nextTick(cb.bind(this, null, knownLength));
          return;
        }

        asynckit.parallel(
          this._valuesToMeasure,
          this._lengthRetriever,
          function (err, values) {
            if (err) {
              cb(err);
              return;
            }

            values.forEach(function (length) {
              knownLength += length;
            });

            cb(null, knownLength);
          },
        );
      };

      FormData.prototype.submit = function (params, cb) {
        var request,
          options,
          defaults = { method: "post" };
        // parse provided url if it's string
        // or treat it as options object
        if (typeof params == "string") {
          params = parseUrl(params);
          options = populate(
            {
              port: params.port,
              path: params.pathname,
              host: params.hostname,
              protocol: params.protocol,
            },
            defaults,
          );

          // use custom params
        } else {
          options = populate(params, defaults);
          // if no port provided use default one
          if (!options.port) {
            options.port = options.protocol == "https:" ? 443 : 80;
          }
        }

        // put that good code in getHeaders to some use
        options.headers = this.getHeaders(params.headers);

        // https if specified, fallback to http in any other case
        if (options.protocol == "https:") {
          request = https.request(options);
        } else {
          request = http.request(options);
        }

        // get content length and fire away
        this.getLength(
          function (err, length) {
            if (err && err !== "Unknown stream") {
              this._error(err);
              return;
            }

            // add content length
            if (length) {
              request.setHeader("Content-Length", length);
            }

            this.pipe(request);
            if (cb) {
              var onResponse;

              var callback = function (error, responce) {
                request.removeListener("error", callback);
                request.removeListener("response", onResponse);

                return cb.call(this, error, responce);
              };

              onResponse = callback.bind(this, null);

              request.on("error", callback);
              request.on("response", onResponse);
            }
          }.bind(this),
        );

        return request;
      };

      FormData.prototype._error = function (err) {
        if (!this.error) {
          this.error = err;
          this.pause();
          this.emit("error", err);
        }
      };

      FormData.prototype.toString = function () {
        return "[object FormData]";
      };

      /***/
    },

    /***/ 5630: /***/ (module) => {
      // populates missing values
      module.exports = function (dst, src) {
        Object.keys(src).forEach(function (prop) {
          dst[prop] = dst[prop] || src[prop];
        });

        return dst;
      };

      /***/
    },

    /***/ 366: /***/ (__unused_webpack_module, exports) => {
      "use strict";

      Object.defineProperty(exports, "__esModule", { value: true });

      /*!
       * is-plain-object <https://github.com/jonschlinkert/is-plain-object>
       *
       * Copyright (c) 2014-2017, Jon Schlinkert.
       * Released under the MIT License.
       */

      function isObject(o) {
        return Object.prototype.toString.call(o) === "[object Object]";
      }

      function isPlainObject(o) {
        var ctor, prot;

        if (isObject(o) === false) return false;

        // If has modified constructor
        ctor = o.constructor;
        if (ctor === undefined) return true;

        // If has modified prototype
        prot = ctor.prototype;
        if (isObject(prot) === false) return false;

        // If constructor does not have an Object-specific method
        if (prot.hasOwnProperty("isPrototypeOf") === false) {
          return false;
        }

        // Most likely a plain Object
        return true;
      }

      exports.isPlainObject = isPlainObject;

      /***/
    },

    /***/ 84: /***/ (module, __unused_webpack_exports, __nccwpck_require__) => {
      /*!
       * mime-db
       * Copyright(c) 2014 Jonathan Ong
       * Copyright(c) 2015-2022 Douglas Christopher Wilson
       * MIT Licensed
       */

      /**
       * Module exports.
       */

      module.exports = __nccwpck_require__(4558);

      /***/
    },

    /***/ 2834: /***/ (
      __unused_webpack_module,
      exports,
      __nccwpck_require__,
    ) => {
      "use strict";
      /*!
       * mime-types
       * Copyright(c) 2014 Jonathan Ong
       * Copyright(c) 2015 Douglas Christopher Wilson
       * MIT Licensed
       */

      /**
       * Module dependencies.
       * @private
       */

      var db = __nccwpck_require__(84);
      var extname = __nccwpck_require__(1017).extname;

      /**
       * Module variables.
       * @private
       */

      var EXTRACT_TYPE_REGEXP = /^\s*([^;\s]*)(?:;|\s|$)/;
      var TEXT_TYPE_REGEXP = /^text\//i;

      /**
       * Module exports.
       * @public
       */

      exports.charset = charset;
      exports.charsets = { lookup: charset };
      exports.contentType = contentType;
      exports.extension = extension;
      exports.extensions = Object.create(null);
      exports.lookup = lookup;
      exports.types = Object.create(null);

      // Populate the extensions/types maps
      populateMaps(exports.extensions, exports.types);

      /**
       * Get the default charset for a MIME type.
       *
       * @param {string} type
       * @return {boolean|string}
       */

      function charset(type) {
        if (!type || typeof type !== "string") {
          return false;
        }

        // TODO: use media-typer
        var match = EXTRACT_TYPE_REGEXP.exec(type);
        var mime = match && db[match[1].toLowerCase()];

        if (mime && mime.charset) {
          return mime.charset;
        }

        // default text/* to utf-8
        if (match && TEXT_TYPE_REGEXP.test(match[1])) {
          return "UTF-8";
        }

        return false;
      }

      /**
       * Create a full Content-Type header given a MIME type or extension.
       *
       * @param {string} str
       * @return {boolean|string}
       */

      function contentType(str) {
        // TODO: should this even be in this module?
        if (!str || typeof str !== "string") {
          return false;
        }

        var mime = str.indexOf("/") === -1 ? exports.lookup(str) : str;

        if (!mime) {
          return false;
        }

        // TODO: use content-type or other module
        if (mime.indexOf("charset") === -1) {
          var charset = exports.charset(mime);
          if (charset) mime += "; charset=" + charset.toLowerCase();
        }

        return mime;
      }

      /**
       * Get the default extension for a MIME type.
       *
       * @param {string} type
       * @return {boolean|string}
       */

      function extension(type) {
        if (!type || typeof type !== "string") {
          return false;
        }

        // TODO: use media-typer
        var match = EXTRACT_TYPE_REGEXP.exec(type);

        // get extensions
        var exts = match && exports.extensions[match[1].toLowerCase()];

        if (!exts || !exts.length) {
          return false;
        }

        return exts[0];
      }

      /**
       * Lookup the MIME type for a file path/extension.
       *
       * @param {string} path
       * @return {boolean|string}
       */

      function lookup(path) {
        if (!path || typeof path !== "string") {
          return false;
        }

        // get the extension ("ext" or ".ext" or full path)
        var extension = extname("x." + path)
          .toLowerCase()
          .substr(1);

        if (!extension) {
          return false;
        }

        return exports.types[extension] || false;
      }

      /**
       * Populate the extensions and types maps.
       * @private
       */

      function populateMaps(extensions, types) {
        // source preference (least -> most)
        var preference = ["nginx", "apache", undefined, "iana"];

        Object.keys(db).forEach(function forEachMimeType(type) {
          var mime = db[type];
          var exts = mime.extensions;

          if (!exts || !exts.length) {
            return;
          }

          // mime -> extensions
          extensions[type] = exts;

          // extension -> mime
          for (var i = 0; i < exts.length; i++) {
            var extension = exts[i];

            if (types[extension]) {
              var from = preference.indexOf(db[types[extension]].source);
              var to = preference.indexOf(mime.source);

              if (
                types[extension] !== "application/octet-stream" &&
                (from > to ||
                  (from === to &&
                    types[extension].substr(0, 12) === "application/"))
              ) {
                // skip the remapping
                continue;
              }
            }

            // set the extension -> mime
            types[extension] = type;
          }
        });
      }

      /***/
    },

    /***/ 9873: /***/ (
      module,
      __unused_webpack_exports,
      __nccwpck_require__,
    ) => {
      var wrappy = __nccwpck_require__(2509);
      module.exports = wrappy(once);
      module.exports.strict = wrappy(onceStrict);

      once.proto = once(function () {
        Object.defineProperty(Function.prototype, "once", {
          value: function () {
            return once(this);
          },
          configurable: true,
        });

        Object.defineProperty(Function.prototype, "onceStrict", {
          value: function () {
            return onceStrict(this);
          },
          configurable: true,
        });
      });

      function once(fn) {
        var f = function () {
          if (f.called) return f.value;
          f.called = true;
          return (f.value = fn.apply(this, arguments));
        };
        f.called = false;
        return f;
      }

      function onceStrict(fn) {
        var f = function () {
          if (f.called) throw new Error(f.onceError);
          f.called = true;
          return (f.value = fn.apply(this, arguments));
        };
        var name = fn.name || "Function wrapped with `once`";
        f.onceError = name + " shouldn't be called more than once";
        f.called = false;
        return f;
      }

      /***/
    },

    /***/ 4494: /***/ function (
      __unused_webpack_module,
      exports,
      __nccwpck_require__,
    ) {
      "use strict";

      /* tslint:disable */
      /* eslint-disable */
      /**
       * OpenAI API
       * APIs for sampling from and fine-tuning language models
       *
       * The version of the OpenAPI document: 1.3.0
       *
       *
       * NOTE: This class is auto generated by OpenAPI Generator (https://openapi-generator.tech).
       * https://openapi-generator.tech
       * Do not edit the class manually.
       */
      var __awaiter =
        (this && this.__awaiter) ||
        function (thisArg, _arguments, P, generator) {
          function adopt(value) {
            return value instanceof P
              ? value
              : new P(function (resolve) {
                  resolve(value);
                });
          }
          return new (P || (P = Promise))(function (resolve, reject) {
            function fulfilled(value) {
              try {
                step(generator.next(value));
              } catch (e) {
                reject(e);
              }
            }
            function rejected(value) {
              try {
                step(generator["throw"](value));
              } catch (e) {
                reject(e);
              }
            }
            function step(result) {
              result.done
                ? resolve(result.value)
                : adopt(result.value).then(fulfilled, rejected);
            }
            step(
              (generator = generator.apply(thisArg, _arguments || [])).next(),
            );
          });
        };
      Object.defineProperty(exports, "__esModule", { value: true });
      exports.OpenAIApi =
        exports.OpenAIApiFactory =
        exports.OpenAIApiFp =
        exports.OpenAIApiAxiosParamCreator =
        exports.CreateImageRequestResponseFormatEnum =
        exports.CreateImageRequestSizeEnum =
        exports.ChatCompletionResponseMessageRoleEnum =
        exports.ChatCompletionRequestMessageRoleEnum =
          void 0;
      const axios_1 = __nccwpck_require__(2748);
      // Some imports not used depending on template conditions
      // @ts-ignore
      const common_1 = __nccwpck_require__(9311);
      // @ts-ignore
      const base_1 = __nccwpck_require__(6654);
      exports.ChatCompletionRequestMessageRoleEnum = {
        System: "system",
        User: "user",
        Assistant: "assistant",
        Function: "function",
      };
      exports.ChatCompletionResponseMessageRoleEnum = {
        System: "system",
        User: "user",
        Assistant: "assistant",
        Function: "function",
      };
      exports.CreateImageRequestSizeEnum = {
        _256x256: "256x256",
        _512x512: "512x512",
        _1024x1024: "1024x1024",
      };
      exports.CreateImageRequestResponseFormatEnum = {
        Url: "url",
        B64Json: "b64_json",
      };
      /**
       * OpenAIApi - axios parameter creator
       * @export
       */
      exports.OpenAIApiAxiosParamCreator = function (configuration) {
        return {
          /**
           *
           * @summary Immediately cancel a fine-tune job.
           * @param {string} fineTuneId The ID of the fine-tune job to cancel
           * @param {*} [options] Override http request option.
           * @throws {RequiredError}
           */
          cancelFineTune: (fineTuneId, options = {}) =>
            __awaiter(this, void 0, void 0, function* () {
              // verify required parameter 'fineTuneId' is not null or undefined
              common_1.assertParamExists(
                "cancelFineTune",
                "fineTuneId",
                fineTuneId,
              );
              const localVarPath = `/fine-tunes/{fine_tune_id}/cancel`.replace(
                `{${"fine_tune_id"}}`,
                encodeURIComponent(String(fineTuneId)),
              );
              // use dummy base URL string because the URL constructor only accepts absolute URLs.
              const localVarUrlObj = new URL(
                localVarPath,
                common_1.DUMMY_BASE_URL,
              );
              let baseOptions;
              if (configuration) {
                baseOptions = configuration.baseOptions;
              }
              const localVarRequestOptions = Object.assign(
                Object.assign({ method: "POST" }, baseOptions),
                options,
              );
              const localVarHeaderParameter = {};
              const localVarQueryParameter = {};
              common_1.setSearchParams(localVarUrlObj, localVarQueryParameter);
              let headersFromBaseOptions =
                baseOptions && baseOptions.headers ? baseOptions.headers : {};
              localVarRequestOptions.headers = Object.assign(
                Object.assign(
                  Object.assign({}, localVarHeaderParameter),
                  headersFromBaseOptions,
                ),
                options.headers,
              );
              return {
                url: common_1.toPathString(localVarUrlObj),
                options: localVarRequestOptions,
              };
            }),
          /**
           *
           * @summary Answers the specified question using the provided documents and examples.  The endpoint first [searches](/docs/api-reference/searches) over provided documents or files to find relevant context. The relevant context is combined with the provided examples and question to create the prompt for [completion](/docs/api-reference/completions).
           * @param {CreateAnswerRequest} createAnswerRequest
           * @param {*} [options] Override http request option.
           * @deprecated
           * @throws {RequiredError}
           */
          createAnswer: (createAnswerRequest, options = {}) =>
            __awaiter(this, void 0, void 0, function* () {
              // verify required parameter 'createAnswerRequest' is not null or undefined
              common_1.assertParamExists(
                "createAnswer",
                "createAnswerRequest",
                createAnswerRequest,
              );
              const localVarPath = `/answers`;
              // use dummy base URL string because the URL constructor only accepts absolute URLs.
              const localVarUrlObj = new URL(
                localVarPath,
                common_1.DUMMY_BASE_URL,
              );
              let baseOptions;
              if (configuration) {
                baseOptions = configuration.baseOptions;
              }
              const localVarRequestOptions = Object.assign(
                Object.assign({ method: "POST" }, baseOptions),
                options,
              );
              const localVarHeaderParameter = {};
              const localVarQueryParameter = {};
              localVarHeaderParameter["Content-Type"] = "application/json";
              common_1.setSearchParams(localVarUrlObj, localVarQueryParameter);
              let headersFromBaseOptions =
                baseOptions && baseOptions.headers ? baseOptions.headers : {};
              localVarRequestOptions.headers = Object.assign(
                Object.assign(
                  Object.assign({}, localVarHeaderParameter),
                  headersFromBaseOptions,
                ),
                options.headers,
              );
              localVarRequestOptions.data = common_1.serializeDataIfNeeded(
                createAnswerRequest,
                localVarRequestOptions,
                configuration,
              );
              return {
                url: common_1.toPathString(localVarUrlObj),
                options: localVarRequestOptions,
              };
            }),
          /**
           *
           * @summary Creates a model response for the given chat conversation.
           * @param {CreateChatCompletionRequest} createChatCompletionRequest
           * @param {*} [options] Override http request option.
           * @throws {RequiredError}
           */
          createChatCompletion: (createChatCompletionRequest, options = {}) =>
            __awaiter(this, void 0, void 0, function* () {
              // verify required parameter 'createChatCompletionRequest' is not null or undefined
              common_1.assertParamExists(
                "createChatCompletion",
                "createChatCompletionRequest",
                createChatCompletionRequest,
              );
              const localVarPath = `/chat/completions`;
              // use dummy base URL string because the URL constructor only accepts absolute URLs.
              const localVarUrlObj = new URL(
                localVarPath,
                common_1.DUMMY_BASE_URL,
              );
              let baseOptions;
              if (configuration) {
                baseOptions = configuration.baseOptions;
              }
              const localVarRequestOptions = Object.assign(
                Object.assign({ method: "POST" }, baseOptions),
                options,
              );
              const localVarHeaderParameter = {};
              const localVarQueryParameter = {};
              localVarHeaderParameter["Content-Type"] = "application/json";
              common_1.setSearchParams(localVarUrlObj, localVarQueryParameter);
              let headersFromBaseOptions =
                baseOptions && baseOptions.headers ? baseOptions.headers : {};
              localVarRequestOptions.headers = Object.assign(
                Object.assign(
                  Object.assign({}, localVarHeaderParameter),
                  headersFromBaseOptions,
                ),
                options.headers,
              );
              localVarRequestOptions.data = common_1.serializeDataIfNeeded(
                createChatCompletionRequest,
                localVarRequestOptions,
                configuration,
              );
              return {
                url: common_1.toPathString(localVarUrlObj),
                options: localVarRequestOptions,
              };
            }),
          /**
           *
           * @summary Classifies the specified `query` using provided examples.  The endpoint first [searches](/docs/api-reference/searches) over the labeled examples to select the ones most relevant for the particular query. Then, the relevant examples are combined with the query to construct a prompt to produce the final label via the [completions](/docs/api-reference/completions) endpoint.  Labeled examples can be provided via an uploaded `file`, or explicitly listed in the request using the `examples` parameter for quick tests and small scale use cases.
           * @param {CreateClassificationRequest} createClassificationRequest
           * @param {*} [options] Override http request option.
           * @deprecated
           * @throws {RequiredError}
           */
          createClassification: (createClassificationRequest, options = {}) =>
            __awaiter(this, void 0, void 0, function* () {
              // verify required parameter 'createClassificationRequest' is not null or undefined
              common_1.assertParamExists(
                "createClassification",
                "createClassificationRequest",
                createClassificationRequest,
              );
              const localVarPath = `/classifications`;
              // use dummy base URL string because the URL constructor only accepts absolute URLs.
              const localVarUrlObj = new URL(
                localVarPath,
                common_1.DUMMY_BASE_URL,
              );
              let baseOptions;
              if (configuration) {
                baseOptions = configuration.baseOptions;
              }
              const localVarRequestOptions = Object.assign(
                Object.assign({ method: "POST" }, baseOptions),
                options,
              );
              const localVarHeaderParameter = {};
              const localVarQueryParameter = {};
              localVarHeaderParameter["Content-Type"] = "application/json";
              common_1.setSearchParams(localVarUrlObj, localVarQueryParameter);
              let headersFromBaseOptions =
                baseOptions && baseOptions.headers ? baseOptions.headers : {};
              localVarRequestOptions.headers = Object.assign(
                Object.assign(
                  Object.assign({}, localVarHeaderParameter),
                  headersFromBaseOptions,
                ),
                options.headers,
              );
              localVarRequestOptions.data = common_1.serializeDataIfNeeded(
                createClassificationRequest,
                localVarRequestOptions,
                configuration,
              );
              return {
                url: common_1.toPathString(localVarUrlObj),
                options: localVarRequestOptions,
              };
            }),
          /**
           *
           * @summary Creates a completion for the provided prompt and parameters.
           * @param {CreateCompletionRequest} createCompletionRequest
           * @param {*} [options] Override http request option.
           * @throws {RequiredError}
           */
          createCompletion: (createCompletionRequest, options = {}) =>
            __awaiter(this, void 0, void 0, function* () {
              // verify required parameter 'createCompletionRequest' is not null or undefined
              common_1.assertParamExists(
                "createCompletion",
                "createCompletionRequest",
                createCompletionRequest,
              );
              const localVarPath = `/completions`;
              // use dummy base URL string because the URL constructor only accepts absolute URLs.
              const localVarUrlObj = new URL(
                localVarPath,
                common_1.DUMMY_BASE_URL,
              );
              let baseOptions;
              if (configuration) {
                baseOptions = configuration.baseOptions;
              }
              const localVarRequestOptions = Object.assign(
                Object.assign({ method: "POST" }, baseOptions),
                options,
              );
              const localVarHeaderParameter = {};
              const localVarQueryParameter = {};
              localVarHeaderParameter["Content-Type"] = "application/json";
              common_1.setSearchParams(localVarUrlObj, localVarQueryParameter);
              let headersFromBaseOptions =
                baseOptions && baseOptions.headers ? baseOptions.headers : {};
              localVarRequestOptions.headers = Object.assign(
                Object.assign(
                  Object.assign({}, localVarHeaderParameter),
                  headersFromBaseOptions,
                ),
                options.headers,
              );
              localVarRequestOptions.data = common_1.serializeDataIfNeeded(
                createCompletionRequest,
                localVarRequestOptions,
                configuration,
              );
              return {
                url: common_1.toPathString(localVarUrlObj),
                options: localVarRequestOptions,
              };
            }),
          /**
           *
           * @summary Creates a new edit for the provided input, instruction, and parameters.
           * @param {CreateEditRequest} createEditRequest
           * @param {*} [options] Override http request option.
           * @throws {RequiredError}
           */
          createEdit: (createEditRequest, options = {}) =>
            __awaiter(this, void 0, void 0, function* () {
              // verify required parameter 'createEditRequest' is not null or undefined
              common_1.assertParamExists(
                "createEdit",
                "createEditRequest",
                createEditRequest,
              );
              const localVarPath = `/edits`;
              // use dummy base URL string because the URL constructor only accepts absolute URLs.
              const localVarUrlObj = new URL(
                localVarPath,
                common_1.DUMMY_BASE_URL,
              );
              let baseOptions;
              if (configuration) {
                baseOptions = configuration.baseOptions;
              }
              const localVarRequestOptions = Object.assign(
                Object.assign({ method: "POST" }, baseOptions),
                options,
              );
              const localVarHeaderParameter = {};
              const localVarQueryParameter = {};
              localVarHeaderParameter["Content-Type"] = "application/json";
              common_1.setSearchParams(localVarUrlObj, localVarQueryParameter);
              let headersFromBaseOptions =
                baseOptions && baseOptions.headers ? baseOptions.headers : {};
              localVarRequestOptions.headers = Object.assign(
                Object.assign(
                  Object.assign({}, localVarHeaderParameter),
                  headersFromBaseOptions,
                ),
                options.headers,
              );
              localVarRequestOptions.data = common_1.serializeDataIfNeeded(
                createEditRequest,
                localVarRequestOptions,
                configuration,
              );
              return {
                url: common_1.toPathString(localVarUrlObj),
                options: localVarRequestOptions,
              };
            }),
          /**
           *
           * @summary Creates an embedding vector representing the input text.
           * @param {CreateEmbeddingRequest} createEmbeddingRequest
           * @param {*} [options] Override http request option.
           * @throws {RequiredError}
           */
          createEmbedding: (createEmbeddingRequest, options = {}) =>
            __awaiter(this, void 0, void 0, function* () {
              // verify required parameter 'createEmbeddingRequest' is not null or undefined
              common_1.assertParamExists(
                "createEmbedding",
                "createEmbeddingRequest",
                createEmbeddingRequest,
              );
              const localVarPath = `/embeddings`;
              // use dummy base URL string because the URL constructor only accepts absolute URLs.
              const localVarUrlObj = new URL(
                localVarPath,
                common_1.DUMMY_BASE_URL,
              );
              let baseOptions;
              if (configuration) {
                baseOptions = configuration.baseOptions;
              }
              const localVarRequestOptions = Object.assign(
                Object.assign({ method: "POST" }, baseOptions),
                options,
              );
              const localVarHeaderParameter = {};
              const localVarQueryParameter = {};
              localVarHeaderParameter["Content-Type"] = "application/json";
              common_1.setSearchParams(localVarUrlObj, localVarQueryParameter);
              let headersFromBaseOptions =
                baseOptions && baseOptions.headers ? baseOptions.headers : {};
              localVarRequestOptions.headers = Object.assign(
                Object.assign(
                  Object.assign({}, localVarHeaderParameter),
                  headersFromBaseOptions,
                ),
                options.headers,
              );
              localVarRequestOptions.data = common_1.serializeDataIfNeeded(
                createEmbeddingRequest,
                localVarRequestOptions,
                configuration,
              );
              return {
                url: common_1.toPathString(localVarUrlObj),
                options: localVarRequestOptions,
              };
            }),
          /**
           *
           * @summary Upload a file that contains document(s) to be used across various endpoints/features. Currently, the size of all the files uploaded by one organization can be up to 1 GB. Please contact us if you need to increase the storage limit.
           * @param {File} file Name of the [JSON Lines](https://jsonlines.readthedocs.io/en/latest/) file to be uploaded.  If the &#x60;purpose&#x60; is set to \\\&quot;fine-tune\\\&quot;, each line is a JSON record with \\\&quot;prompt\\\&quot; and \\\&quot;completion\\\&quot; fields representing your [training examples](/docs/guides/fine-tuning/prepare-training-data).
           * @param {string} purpose The intended purpose of the uploaded documents.  Use \\\&quot;fine-tune\\\&quot; for [Fine-tuning](/docs/api-reference/fine-tunes). This allows us to validate the format of the uploaded file.
           * @param {*} [options] Override http request option.
           * @throws {RequiredError}
           */
          createFile: (file, purpose, options = {}) =>
            __awaiter(this, void 0, void 0, function* () {
              // verify required parameter 'file' is not null or undefined
              common_1.assertParamExists("createFile", "file", file);
              // verify required parameter 'purpose' is not null or undefined
              common_1.assertParamExists("createFile", "purpose", purpose);
              const localVarPath = `/files`;
              // use dummy base URL string because the URL constructor only accepts absolute URLs.
              const localVarUrlObj = new URL(
                localVarPath,
                common_1.DUMMY_BASE_URL,
              );
              let baseOptions;
              if (configuration) {
                baseOptions = configuration.baseOptions;
              }
              const localVarRequestOptions = Object.assign(
                Object.assign({ method: "POST" }, baseOptions),
                options,
              );
              const localVarHeaderParameter = {};
              const localVarQueryParameter = {};
              const localVarFormParams = new ((configuration &&
                configuration.formDataCtor) ||
                FormData)();
              if (file !== undefined) {
                localVarFormParams.append("file", file);
              }
              if (purpose !== undefined) {
                localVarFormParams.append("purpose", purpose);
              }
              localVarHeaderParameter["Content-Type"] = "multipart/form-data";
              common_1.setSearchParams(localVarUrlObj, localVarQueryParameter);
              let headersFromBaseOptions =
                baseOptions && baseOptions.headers ? baseOptions.headers : {};
              localVarRequestOptions.headers = Object.assign(
                Object.assign(
                  Object.assign(
                    Object.assign({}, localVarHeaderParameter),
                    localVarFormParams.getHeaders(),
                  ),
                  headersFromBaseOptions,
                ),
                options.headers,
              );
              localVarRequestOptions.data = localVarFormParams;
              return {
                url: common_1.toPathString(localVarUrlObj),
                options: localVarRequestOptions,
              };
            }),
          /**
           *
           * @summary Creates a job that fine-tunes a specified model from a given dataset.  Response includes details of the enqueued job including job status and the name of the fine-tuned models once complete.  [Learn more about Fine-tuning](/docs/guides/fine-tuning)
           * @param {CreateFineTuneRequest} createFineTuneRequest
           * @param {*} [options] Override http request option.
           * @throws {RequiredError}
           */
          createFineTune: (createFineTuneRequest, options = {}) =>
            __awaiter(this, void 0, void 0, function* () {
              // verify required parameter 'createFineTuneRequest' is not null or undefined
              common_1.assertParamExists(
                "createFineTune",
                "createFineTuneRequest",
                createFineTuneRequest,
              );
              const localVarPath = `/fine-tunes`;
              // use dummy base URL string because the URL constructor only accepts absolute URLs.
              const localVarUrlObj = new URL(
                localVarPath,
                common_1.DUMMY_BASE_URL,
              );
              let baseOptions;
              if (configuration) {
                baseOptions = configuration.baseOptions;
              }
              const localVarRequestOptions = Object.assign(
                Object.assign({ method: "POST" }, baseOptions),
                options,
              );
              const localVarHeaderParameter = {};
              const localVarQueryParameter = {};
              localVarHeaderParameter["Content-Type"] = "application/json";
              common_1.setSearchParams(localVarUrlObj, localVarQueryParameter);
              let headersFromBaseOptions =
                baseOptions && baseOptions.headers ? baseOptions.headers : {};
              localVarRequestOptions.headers = Object.assign(
                Object.assign(
                  Object.assign({}, localVarHeaderParameter),
                  headersFromBaseOptions,
                ),
                options.headers,
              );
              localVarRequestOptions.data = common_1.serializeDataIfNeeded(
                createFineTuneRequest,
                localVarRequestOptions,
                configuration,
              );
              return {
                url: common_1.toPathString(localVarUrlObj),
                options: localVarRequestOptions,
              };
            }),
          /**
           *
           * @summary Creates an image given a prompt.
           * @param {CreateImageRequest} createImageRequest
           * @param {*} [options] Override http request option.
           * @throws {RequiredError}
           */
          createImage: (createImageRequest, options = {}) =>
            __awaiter(this, void 0, void 0, function* () {
              // verify required parameter 'createImageRequest' is not null or undefined
              common_1.assertParamExists(
                "createImage",
                "createImageRequest",
                createImageRequest,
              );
              const localVarPath = `/images/generations`;
              // use dummy base URL string because the URL constructor only accepts absolute URLs.
              const localVarUrlObj = new URL(
                localVarPath,
                common_1.DUMMY_BASE_URL,
              );
              let baseOptions;
              if (configuration) {
                baseOptions = configuration.baseOptions;
              }
              const localVarRequestOptions = Object.assign(
                Object.assign({ method: "POST" }, baseOptions),
                options,
              );
              const localVarHeaderParameter = {};
              const localVarQueryParameter = {};
              localVarHeaderParameter["Content-Type"] = "application/json";
              common_1.setSearchParams(localVarUrlObj, localVarQueryParameter);
              let headersFromBaseOptions =
                baseOptions && baseOptions.headers ? baseOptions.headers : {};
              localVarRequestOptions.headers = Object.assign(
                Object.assign(
                  Object.assign({}, localVarHeaderParameter),
                  headersFromBaseOptions,
                ),
                options.headers,
              );
              localVarRequestOptions.data = common_1.serializeDataIfNeeded(
                createImageRequest,
                localVarRequestOptions,
                configuration,
              );
              return {
                url: common_1.toPathString(localVarUrlObj),
                options: localVarRequestOptions,
              };
            }),
          /**
           *
           * @summary Creates an edited or extended image given an original image and a prompt.
           * @param {File} image The image to edit. Must be a valid PNG file, less than 4MB, and square. If mask is not provided, image must have transparency, which will be used as the mask.
           * @param {string} prompt A text description of the desired image(s). The maximum length is 1000 characters.
           * @param {File} [mask] An additional image whose fully transparent areas (e.g. where alpha is zero) indicate where &#x60;image&#x60; should be edited. Must be a valid PNG file, less than 4MB, and have the same dimensions as &#x60;image&#x60;.
           * @param {number} [n] The number of images to generate. Must be between 1 and 10.
           * @param {string} [size] The size of the generated images. Must be one of &#x60;256x256&#x60;, &#x60;512x512&#x60;, or &#x60;1024x1024&#x60;.
           * @param {string} [responseFormat] The format in which the generated images are returned. Must be one of &#x60;url&#x60; or &#x60;b64_json&#x60;.
           * @param {string} [user] A unique identifier representing your end-user, which can help OpenAI to monitor and detect abuse. [Learn more](/docs/guides/safety-best-practices/end-user-ids).
           * @param {*} [options] Override http request option.
           * @throws {RequiredError}
           */
          createImageEdit: (
            image,
            prompt,
            mask,
            n,
            size,
            responseFormat,
            user,
            options = {},
          ) =>
            __awaiter(this, void 0, void 0, function* () {
              // verify required parameter 'image' is not null or undefined
              common_1.assertParamExists("createImageEdit", "image", image);
              // verify required parameter 'prompt' is not null or undefined
              common_1.assertParamExists("createImageEdit", "prompt", prompt);
              const localVarPath = `/images/edits`;
              // use dummy base URL string because the URL constructor only accepts absolute URLs.
              const localVarUrlObj = new URL(
                localVarPath,
                common_1.DUMMY_BASE_URL,
              );
              let baseOptions;
              if (configuration) {
                baseOptions = configuration.baseOptions;
              }
              const localVarRequestOptions = Object.assign(
                Object.assign({ method: "POST" }, baseOptions),
                options,
              );
              const localVarHeaderParameter = {};
              const localVarQueryParameter = {};
              const localVarFormParams = new ((configuration &&
                configuration.formDataCtor) ||
                FormData)();
              if (image !== undefined) {
                localVarFormParams.append("image", image);
              }
              if (mask !== undefined) {
                localVarFormParams.append("mask", mask);
              }
              if (prompt !== undefined) {
                localVarFormParams.append("prompt", prompt);
              }
              if (n !== undefined) {
                localVarFormParams.append("n", n);
              }
              if (size !== undefined) {
                localVarFormParams.append("size", size);
              }
              if (responseFormat !== undefined) {
                localVarFormParams.append("response_format", responseFormat);
              }
              if (user !== undefined) {
                localVarFormParams.append("user", user);
              }
              localVarHeaderParameter["Content-Type"] = "multipart/form-data";
              common_1.setSearchParams(localVarUrlObj, localVarQueryParameter);
              let headersFromBaseOptions =
                baseOptions && baseOptions.headers ? baseOptions.headers : {};
              localVarRequestOptions.headers = Object.assign(
                Object.assign(
                  Object.assign(
                    Object.assign({}, localVarHeaderParameter),
                    localVarFormParams.getHeaders(),
                  ),
                  headersFromBaseOptions,
                ),
                options.headers,
              );
              localVarRequestOptions.data = localVarFormParams;
              return {
                url: common_1.toPathString(localVarUrlObj),
                options: localVarRequestOptions,
              };
            }),
          /**
           *
           * @summary Creates a variation of a given image.
           * @param {File} image The image to use as the basis for the variation(s). Must be a valid PNG file, less than 4MB, and square.
           * @param {number} [n] The number of images to generate. Must be between 1 and 10.
           * @param {string} [size] The size of the generated images. Must be one of &#x60;256x256&#x60;, &#x60;512x512&#x60;, or &#x60;1024x1024&#x60;.
           * @param {string} [responseFormat] The format in which the generated images are returned. Must be one of &#x60;url&#x60; or &#x60;b64_json&#x60;.
           * @param {string} [user] A unique identifier representing your end-user, which can help OpenAI to monitor and detect abuse. [Learn more](/docs/guides/safety-best-practices/end-user-ids).
           * @param {*} [options] Override http request option.
           * @throws {RequiredError}
           */
          createImageVariation: (
            image,
            n,
            size,
            responseFormat,
            user,
            options = {},
          ) =>
            __awaiter(this, void 0, void 0, function* () {
              // verify required parameter 'image' is not null or undefined
              common_1.assertParamExists(
                "createImageVariation",
                "image",
                image,
              );
              const localVarPath = `/images/variations`;
              // use dummy base URL string because the URL constructor only accepts absolute URLs.
              const localVarUrlObj = new URL(
                localVarPath,
                common_1.DUMMY_BASE_URL,
              );
              let baseOptions;
              if (configuration) {
                baseOptions = configuration.baseOptions;
              }
              const localVarRequestOptions = Object.assign(
                Object.assign({ method: "POST" }, baseOptions),
                options,
              );
              const localVarHeaderParameter = {};
              const localVarQueryParameter = {};
              const localVarFormParams = new ((configuration &&
                configuration.formDataCtor) ||
                FormData)();
              if (image !== undefined) {
                localVarFormParams.append("image", image);
              }
              if (n !== undefined) {
                localVarFormParams.append("n", n);
              }
              if (size !== undefined) {
                localVarFormParams.append("size", size);
              }
              if (responseFormat !== undefined) {
                localVarFormParams.append("response_format", responseFormat);
              }
              if (user !== undefined) {
                localVarFormParams.append("user", user);
              }
              localVarHeaderParameter["Content-Type"] = "multipart/form-data";
              common_1.setSearchParams(localVarUrlObj, localVarQueryParameter);
              let headersFromBaseOptions =
                baseOptions && baseOptions.headers ? baseOptions.headers : {};
              localVarRequestOptions.headers = Object.assign(
                Object.assign(
                  Object.assign(
                    Object.assign({}, localVarHeaderParameter),
                    localVarFormParams.getHeaders(),
                  ),
                  headersFromBaseOptions,
                ),
                options.headers,
              );
              localVarRequestOptions.data = localVarFormParams;
              return {
                url: common_1.toPathString(localVarUrlObj),
                options: localVarRequestOptions,
              };
            }),
          /**
           *
           * @summary Classifies if text violates OpenAI\'s Content Policy
           * @param {CreateModerationRequest} createModerationRequest
           * @param {*} [options] Override http request option.
           * @throws {RequiredError}
           */
          createModeration: (createModerationRequest, options = {}) =>
            __awaiter(this, void 0, void 0, function* () {
              // verify required parameter 'createModerationRequest' is not null or undefined
              common_1.assertParamExists(
                "createModeration",
                "createModerationRequest",
                createModerationRequest,
              );
              const localVarPath = `/moderations`;
              // use dummy base URL string because the URL constructor only accepts absolute URLs.
              const localVarUrlObj = new URL(
                localVarPath,
                common_1.DUMMY_BASE_URL,
              );
              let baseOptions;
              if (configuration) {
                baseOptions = configuration.baseOptions;
              }
              const localVarRequestOptions = Object.assign(
                Object.assign({ method: "POST" }, baseOptions),
                options,
              );
              const localVarHeaderParameter = {};
              const localVarQueryParameter = {};
              localVarHeaderParameter["Content-Type"] = "application/json";
              common_1.setSearchParams(localVarUrlObj, localVarQueryParameter);
              let headersFromBaseOptions =
                baseOptions && baseOptions.headers ? baseOptions.headers : {};
              localVarRequestOptions.headers = Object.assign(
                Object.assign(
                  Object.assign({}, localVarHeaderParameter),
                  headersFromBaseOptions,
                ),
                options.headers,
              );
              localVarRequestOptions.data = common_1.serializeDataIfNeeded(
                createModerationRequest,
                localVarRequestOptions,
                configuration,
              );
              return {
                url: common_1.toPathString(localVarUrlObj),
                options: localVarRequestOptions,
              };
            }),
          /**
           *
           * @summary The search endpoint computes similarity scores between provided query and documents. Documents can be passed directly to the API if there are no more than 200 of them.  To go beyond the 200 document limit, documents can be processed offline and then used for efficient retrieval at query time. When `file` is set, the search endpoint searches over all the documents in the given file and returns up to the `max_rerank` number of documents. These documents will be returned along with their search scores.  The similarity score is a positive score that usually ranges from 0 to 300 (but can sometimes go higher), where a score above 200 usually means the document is semantically similar to the query.
           * @param {string} engineId The ID of the engine to use for this request.  You can select one of &#x60;ada&#x60;, &#x60;babbage&#x60;, &#x60;curie&#x60;, or &#x60;davinci&#x60;.
           * @param {CreateSearchRequest} createSearchRequest
           * @param {*} [options] Override http request option.
           * @deprecated
           * @throws {RequiredError}
           */
          createSearch: (engineId, createSearchRequest, options = {}) =>
            __awaiter(this, void 0, void 0, function* () {
              // verify required parameter 'engineId' is not null or undefined
              common_1.assertParamExists("createSearch", "engineId", engineId);
              // verify required parameter 'createSearchRequest' is not null or undefined
              common_1.assertParamExists(
                "createSearch",
                "createSearchRequest",
                createSearchRequest,
              );
              const localVarPath = `/engines/{engine_id}/search`.replace(
                `{${"engine_id"}}`,
                encodeURIComponent(String(engineId)),
              );
              // use dummy base URL string because the URL constructor only accepts absolute URLs.
              const localVarUrlObj = new URL(
                localVarPath,
                common_1.DUMMY_BASE_URL,
              );
              let baseOptions;
              if (configuration) {
                baseOptions = configuration.baseOptions;
              }
              const localVarRequestOptions = Object.assign(
                Object.assign({ method: "POST" }, baseOptions),
                options,
              );
              const localVarHeaderParameter = {};
              const localVarQueryParameter = {};
              localVarHeaderParameter["Content-Type"] = "application/json";
              common_1.setSearchParams(localVarUrlObj, localVarQueryParameter);
              let headersFromBaseOptions =
                baseOptions && baseOptions.headers ? baseOptions.headers : {};
              localVarRequestOptions.headers = Object.assign(
                Object.assign(
                  Object.assign({}, localVarHeaderParameter),
                  headersFromBaseOptions,
                ),
                options.headers,
              );
              localVarRequestOptions.data = common_1.serializeDataIfNeeded(
                createSearchRequest,
                localVarRequestOptions,
                configuration,
              );
              return {
                url: common_1.toPathString(localVarUrlObj),
                options: localVarRequestOptions,
              };
            }),
          /**
           *
           * @summary Transcribes audio into the input language.
           * @param {File} file The audio file object (not file name) to transcribe, in one of these formats: mp3, mp4, mpeg, mpga, m4a, wav, or webm.
           * @param {string} model ID of the model to use. Only &#x60;whisper-1&#x60; is currently available.
           * @param {string} [prompt] An optional text to guide the model\\\&#39;s style or continue a previous audio segment. The [prompt](/docs/guides/speech-to-text/prompting) should match the audio language.
           * @param {string} [responseFormat] The format of the transcript output, in one of these options: json, text, srt, verbose_json, or vtt.
           * @param {number} [temperature] The sampling temperature, between 0 and 1. Higher values like 0.8 will make the output more random, while lower values like 0.2 will make it more focused and deterministic. If set to 0, the model will use [log probability](https://en.wikipedia.org/wiki/Log_probability) to automatically increase the temperature until certain thresholds are hit.
           * @param {string} [language] The language of the input audio. Supplying the input language in [ISO-639-1](https://en.wikipedia.org/wiki/List_of_ISO_639-1_codes) format will improve accuracy and latency.
           * @param {*} [options] Override http request option.
           * @throws {RequiredError}
           */
          createTranscription: (
            file,
            model,
            prompt,
            responseFormat,
            temperature,
            language,
            options = {},
          ) =>
            __awaiter(this, void 0, void 0, function* () {
              // verify required parameter 'file' is not null or undefined
              common_1.assertParamExists("createTranscription", "file", file);
              // verify required parameter 'model' is not null or undefined
              common_1.assertParamExists("createTranscription", "model", model);
              const localVarPath = `/audio/transcriptions`;
              // use dummy base URL string because the URL constructor only accepts absolute URLs.
              const localVarUrlObj = new URL(
                localVarPath,
                common_1.DUMMY_BASE_URL,
              );
              let baseOptions;
              if (configuration) {
                baseOptions = configuration.baseOptions;
              }
              const localVarRequestOptions = Object.assign(
                Object.assign({ method: "POST" }, baseOptions),
                options,
              );
              const localVarHeaderParameter = {};
              const localVarQueryParameter = {};
              const localVarFormParams = new ((configuration &&
                configuration.formDataCtor) ||
                FormData)();
              if (file !== undefined) {
                localVarFormParams.append("file", file);
              }
              if (model !== undefined) {
                localVarFormParams.append("model", model);
              }
              if (prompt !== undefined) {
                localVarFormParams.append("prompt", prompt);
              }
              if (responseFormat !== undefined) {
                localVarFormParams.append("response_format", responseFormat);
              }
              if (temperature !== undefined) {
                localVarFormParams.append("temperature", temperature);
              }
              if (language !== undefined) {
                localVarFormParams.append("language", language);
              }
              localVarHeaderParameter["Content-Type"] = "multipart/form-data";
              common_1.setSearchParams(localVarUrlObj, localVarQueryParameter);
              let headersFromBaseOptions =
                baseOptions && baseOptions.headers ? baseOptions.headers : {};
              localVarRequestOptions.headers = Object.assign(
                Object.assign(
                  Object.assign(
                    Object.assign({}, localVarHeaderParameter),
                    localVarFormParams.getHeaders(),
                  ),
                  headersFromBaseOptions,
                ),
                options.headers,
              );
              localVarRequestOptions.data = localVarFormParams;
              return {
                url: common_1.toPathString(localVarUrlObj),
                options: localVarRequestOptions,
              };
            }),
          /**
           *
           * @summary Translates audio into into English.
           * @param {File} file The audio file object (not file name) translate, in one of these formats: mp3, mp4, mpeg, mpga, m4a, wav, or webm.
           * @param {string} model ID of the model to use. Only &#x60;whisper-1&#x60; is currently available.
           * @param {string} [prompt] An optional text to guide the model\\\&#39;s style or continue a previous audio segment. The [prompt](/docs/guides/speech-to-text/prompting) should be in English.
           * @param {string} [responseFormat] The format of the transcript output, in one of these options: json, text, srt, verbose_json, or vtt.
           * @param {number} [temperature] The sampling temperature, between 0 and 1. Higher values like 0.8 will make the output more random, while lower values like 0.2 will make it more focused and deterministic. If set to 0, the model will use [log probability](https://en.wikipedia.org/wiki/Log_probability) to automatically increase the temperature until certain thresholds are hit.
           * @param {*} [options] Override http request option.
           * @throws {RequiredError}
           */
          createTranslation: (
            file,
            model,
            prompt,
            responseFormat,
            temperature,
            options = {},
          ) =>
            __awaiter(this, void 0, void 0, function* () {
              // verify required parameter 'file' is not null or undefined
              common_1.assertParamExists("createTranslation", "file", file);
              // verify required parameter 'model' is not null or undefined
              common_1.assertParamExists("createTranslation", "model", model);
              const localVarPath = `/audio/translations`;
              // use dummy base URL string because the URL constructor only accepts absolute URLs.
              const localVarUrlObj = new URL(
                localVarPath,
                common_1.DUMMY_BASE_URL,
              );
              let baseOptions;
              if (configuration) {
                baseOptions = configuration.baseOptions;
              }
              const localVarRequestOptions = Object.assign(
                Object.assign({ method: "POST" }, baseOptions),
                options,
              );
              const localVarHeaderParameter = {};
              const localVarQueryParameter = {};
              const localVarFormParams = new ((configuration &&
                configuration.formDataCtor) ||
                FormData)();
              if (file !== undefined) {
                localVarFormParams.append("file", file);
              }
              if (model !== undefined) {
                localVarFormParams.append("model", model);
              }
              if (prompt !== undefined) {
                localVarFormParams.append("prompt", prompt);
              }
              if (responseFormat !== undefined) {
                localVarFormParams.append("response_format", responseFormat);
              }
              if (temperature !== undefined) {
                localVarFormParams.append("temperature", temperature);
              }
              localVarHeaderParameter["Content-Type"] = "multipart/form-data";
              common_1.setSearchParams(localVarUrlObj, localVarQueryParameter);
              let headersFromBaseOptions =
                baseOptions && baseOptions.headers ? baseOptions.headers : {};
              localVarRequestOptions.headers = Object.assign(
                Object.assign(
                  Object.assign(
                    Object.assign({}, localVarHeaderParameter),
                    localVarFormParams.getHeaders(),
                  ),
                  headersFromBaseOptions,
                ),
                options.headers,
              );
              localVarRequestOptions.data = localVarFormParams;
              return {
                url: common_1.toPathString(localVarUrlObj),
                options: localVarRequestOptions,
              };
            }),
          /**
           *
           * @summary Delete a file.
           * @param {string} fileId The ID of the file to use for this request
           * @param {*} [options] Override http request option.
           * @throws {RequiredError}
           */
          deleteFile: (fileId, options = {}) =>
            __awaiter(this, void 0, void 0, function* () {
              // verify required parameter 'fileId' is not null or undefined
              common_1.assertParamExists("deleteFile", "fileId", fileId);
              const localVarPath = `/files/{file_id}`.replace(
                `{${"file_id"}}`,
                encodeURIComponent(String(fileId)),
              );
              // use dummy base URL string because the URL constructor only accepts absolute URLs.
              const localVarUrlObj = new URL(
                localVarPath,
                common_1.DUMMY_BASE_URL,
              );
              let baseOptions;
              if (configuration) {
                baseOptions = configuration.baseOptions;
              }
              const localVarRequestOptions = Object.assign(
                Object.assign({ method: "DELETE" }, baseOptions),
                options,
              );
              const localVarHeaderParameter = {};
              const localVarQueryParameter = {};
              common_1.setSearchParams(localVarUrlObj, localVarQueryParameter);
              let headersFromBaseOptions =
                baseOptions && baseOptions.headers ? baseOptions.headers : {};
              localVarRequestOptions.headers = Object.assign(
                Object.assign(
                  Object.assign({}, localVarHeaderParameter),
                  headersFromBaseOptions,
                ),
                options.headers,
              );
              return {
                url: common_1.toPathString(localVarUrlObj),
                options: localVarRequestOptions,
              };
            }),
          /**
           *
           * @summary Delete a fine-tuned model. You must have the Owner role in your organization.
           * @param {string} model The model to delete
           * @param {*} [options] Override http request option.
           * @throws {RequiredError}
           */
          deleteModel: (model, options = {}) =>
            __awaiter(this, void 0, void 0, function* () {
              // verify required parameter 'model' is not null or undefined
              common_1.assertParamExists("deleteModel", "model", model);
              const localVarPath = `/models/{model}`.replace(
                `{${"model"}}`,
                encodeURIComponent(String(model)),
              );
              // use dummy base URL string because the URL constructor only accepts absolute URLs.
              const localVarUrlObj = new URL(
                localVarPath,
                common_1.DUMMY_BASE_URL,
              );
              let baseOptions;
              if (configuration) {
                baseOptions = configuration.baseOptions;
              }
              const localVarRequestOptions = Object.assign(
                Object.assign({ method: "DELETE" }, baseOptions),
                options,
              );
              const localVarHeaderParameter = {};
              const localVarQueryParameter = {};
              common_1.setSearchParams(localVarUrlObj, localVarQueryParameter);
              let headersFromBaseOptions =
                baseOptions && baseOptions.headers ? baseOptions.headers : {};
              localVarRequestOptions.headers = Object.assign(
                Object.assign(
                  Object.assign({}, localVarHeaderParameter),
                  headersFromBaseOptions,
                ),
                options.headers,
              );
              return {
                url: common_1.toPathString(localVarUrlObj),
                options: localVarRequestOptions,
              };
            }),
          /**
           *
           * @summary Returns the contents of the specified file
           * @param {string} fileId The ID of the file to use for this request
           * @param {*} [options] Override http request option.
           * @throws {RequiredError}
           */
          downloadFile: (fileId, options = {}) =>
            __awaiter(this, void 0, void 0, function* () {
              // verify required parameter 'fileId' is not null or undefined
              common_1.assertParamExists("downloadFile", "fileId", fileId);
              const localVarPath = `/files/{file_id}/content`.replace(
                `{${"file_id"}}`,
                encodeURIComponent(String(fileId)),
              );
              // use dummy base URL string because the URL constructor only accepts absolute URLs.
              const localVarUrlObj = new URL(
                localVarPath,
                common_1.DUMMY_BASE_URL,
              );
              let baseOptions;
              if (configuration) {
                baseOptions = configuration.baseOptions;
              }
              const localVarRequestOptions = Object.assign(
                Object.assign({ method: "GET" }, baseOptions),
                options,
              );
              const localVarHeaderParameter = {};
              const localVarQueryParameter = {};
              common_1.setSearchParams(localVarUrlObj, localVarQueryParameter);
              let headersFromBaseOptions =
                baseOptions && baseOptions.headers ? baseOptions.headers : {};
              localVarRequestOptions.headers = Object.assign(
                Object.assign(
                  Object.assign({}, localVarHeaderParameter),
                  headersFromBaseOptions,
                ),
                options.headers,
              );
              return {
                url: common_1.toPathString(localVarUrlObj),
                options: localVarRequestOptions,
              };
            }),
          /**
           *
           * @summary Lists the currently available (non-finetuned) models, and provides basic information about each one such as the owner and availability.
           * @param {*} [options] Override http request option.
           * @deprecated
           * @throws {RequiredError}
           */
          listEngines: (options = {}) =>
            __awaiter(this, void 0, void 0, function* () {
              const localVarPath = `/engines`;
              // use dummy base URL string because the URL constructor only accepts absolute URLs.
              const localVarUrlObj = new URL(
                localVarPath,
                common_1.DUMMY_BASE_URL,
              );
              let baseOptions;
              if (configuration) {
                baseOptions = configuration.baseOptions;
              }
              const localVarRequestOptions = Object.assign(
                Object.assign({ method: "GET" }, baseOptions),
                options,
              );
              const localVarHeaderParameter = {};
              const localVarQueryParameter = {};
              common_1.setSearchParams(localVarUrlObj, localVarQueryParameter);
              let headersFromBaseOptions =
                baseOptions && baseOptions.headers ? baseOptions.headers : {};
              localVarRequestOptions.headers = Object.assign(
                Object.assign(
                  Object.assign({}, localVarHeaderParameter),
                  headersFromBaseOptions,
                ),
                options.headers,
              );
              return {
                url: common_1.toPathString(localVarUrlObj),
                options: localVarRequestOptions,
              };
            }),
          /**
           *
           * @summary Returns a list of files that belong to the user\'s organization.
           * @param {*} [options] Override http request option.
           * @throws {RequiredError}
           */
          listFiles: (options = {}) =>
            __awaiter(this, void 0, void 0, function* () {
              const localVarPath = `/files`;
              // use dummy base URL string because the URL constructor only accepts absolute URLs.
              const localVarUrlObj = new URL(
                localVarPath,
                common_1.DUMMY_BASE_URL,
              );
              let baseOptions;
              if (configuration) {
                baseOptions = configuration.baseOptions;
              }
              const localVarRequestOptions = Object.assign(
                Object.assign({ method: "GET" }, baseOptions),
                options,
              );
              const localVarHeaderParameter = {};
              const localVarQueryParameter = {};
              common_1.setSearchParams(localVarUrlObj, localVarQueryParameter);
              let headersFromBaseOptions =
                baseOptions && baseOptions.headers ? baseOptions.headers : {};
              localVarRequestOptions.headers = Object.assign(
                Object.assign(
                  Object.assign({}, localVarHeaderParameter),
                  headersFromBaseOptions,
                ),
                options.headers,
              );
              return {
                url: common_1.toPathString(localVarUrlObj),
                options: localVarRequestOptions,
              };
            }),
          /**
           *
           * @summary Get fine-grained status updates for a fine-tune job.
           * @param {string} fineTuneId The ID of the fine-tune job to get events for.
           * @param {boolean} [stream] Whether to stream events for the fine-tune job. If set to true, events will be sent as data-only [server-sent events](https://developer.mozilla.org/en-US/docs/Web/API/Server-sent_events/Using_server-sent_events#Event_stream_format) as they become available. The stream will terminate with a &#x60;data: [DONE]&#x60; message when the job is finished (succeeded, cancelled, or failed).  If set to false, only events generated so far will be returned.
           * @param {*} [options] Override http request option.
           * @throws {RequiredError}
           */
          listFineTuneEvents: (fineTuneId, stream, options = {}) =>
            __awaiter(this, void 0, void 0, function* () {
              // verify required parameter 'fineTuneId' is not null or undefined
              common_1.assertParamExists(
                "listFineTuneEvents",
                "fineTuneId",
                fineTuneId,
              );
              const localVarPath = `/fine-tunes/{fine_tune_id}/events`.replace(
                `{${"fine_tune_id"}}`,
                encodeURIComponent(String(fineTuneId)),
              );
              // use dummy base URL string because the URL constructor only accepts absolute URLs.
              const localVarUrlObj = new URL(
                localVarPath,
                common_1.DUMMY_BASE_URL,
              );
              let baseOptions;
              if (configuration) {
                baseOptions = configuration.baseOptions;
              }
              const localVarRequestOptions = Object.assign(
                Object.assign({ method: "GET" }, baseOptions),
                options,
              );
              const localVarHeaderParameter = {};
              const localVarQueryParameter = {};
              if (stream !== undefined) {
                localVarQueryParameter["stream"] = stream;
              }
              common_1.setSearchParams(localVarUrlObj, localVarQueryParameter);
              let headersFromBaseOptions =
                baseOptions && baseOptions.headers ? baseOptions.headers : {};
              localVarRequestOptions.headers = Object.assign(
                Object.assign(
                  Object.assign({}, localVarHeaderParameter),
                  headersFromBaseOptions,
                ),
                options.headers,
              );
              return {
                url: common_1.toPathString(localVarUrlObj),
                options: localVarRequestOptions,
              };
            }),
          /**
           *
           * @summary List your organization\'s fine-tuning jobs
           * @param {*} [options] Override http request option.
           * @throws {RequiredError}
           */
          listFineTunes: (options = {}) =>
            __awaiter(this, void 0, void 0, function* () {
              const localVarPath = `/fine-tunes`;
              // use dummy base URL string because the URL constructor only accepts absolute URLs.
              const localVarUrlObj = new URL(
                localVarPath,
                common_1.DUMMY_BASE_URL,
              );
              let baseOptions;
              if (configuration) {
                baseOptions = configuration.baseOptions;
              }
              const localVarRequestOptions = Object.assign(
                Object.assign({ method: "GET" }, baseOptions),
                options,
              );
              const localVarHeaderParameter = {};
              const localVarQueryParameter = {};
              common_1.setSearchParams(localVarUrlObj, localVarQueryParameter);
              let headersFromBaseOptions =
                baseOptions && baseOptions.headers ? baseOptions.headers : {};
              localVarRequestOptions.headers = Object.assign(
                Object.assign(
                  Object.assign({}, localVarHeaderParameter),
                  headersFromBaseOptions,
                ),
                options.headers,
              );
              return {
                url: common_1.toPathString(localVarUrlObj),
                options: localVarRequestOptions,
              };
            }),
          /**
           *
           * @summary Lists the currently available models, and provides basic information about each one such as the owner and availability.
           * @param {*} [options] Override http request option.
           * @throws {RequiredError}
           */
          listModels: (options = {}) =>
            __awaiter(this, void 0, void 0, function* () {
              const localVarPath = `/models`;
              // use dummy base URL string because the URL constructor only accepts absolute URLs.
              const localVarUrlObj = new URL(
                localVarPath,
                common_1.DUMMY_BASE_URL,
              );
              let baseOptions;
              if (configuration) {
                baseOptions = configuration.baseOptions;
              }
              const localVarRequestOptions = Object.assign(
                Object.assign({ method: "GET" }, baseOptions),
                options,
              );
              const localVarHeaderParameter = {};
              const localVarQueryParameter = {};
              common_1.setSearchParams(localVarUrlObj, localVarQueryParameter);
              let headersFromBaseOptions =
                baseOptions && baseOptions.headers ? baseOptions.headers : {};
              localVarRequestOptions.headers = Object.assign(
                Object.assign(
                  Object.assign({}, localVarHeaderParameter),
                  headersFromBaseOptions,
                ),
                options.headers,
              );
              return {
                url: common_1.toPathString(localVarUrlObj),
                options: localVarRequestOptions,
              };
            }),
          /**
           *
           * @summary Retrieves a model instance, providing basic information about it such as the owner and availability.
           * @param {string} engineId The ID of the engine to use for this request
           * @param {*} [options] Override http request option.
           * @deprecated
           * @throws {RequiredError}
           */
          retrieveEngine: (engineId, options = {}) =>
            __awaiter(this, void 0, void 0, function* () {
              // verify required parameter 'engineId' is not null or undefined
              common_1.assertParamExists(
                "retrieveEngine",
                "engineId",
                engineId,
              );
              const localVarPath = `/engines/{engine_id}`.replace(
                `{${"engine_id"}}`,
                encodeURIComponent(String(engineId)),
              );
              // use dummy base URL string because the URL constructor only accepts absolute URLs.
              const localVarUrlObj = new URL(
                localVarPath,
                common_1.DUMMY_BASE_URL,
              );
              let baseOptions;
              if (configuration) {
                baseOptions = configuration.baseOptions;
              }
              const localVarRequestOptions = Object.assign(
                Object.assign({ method: "GET" }, baseOptions),
                options,
              );
              const localVarHeaderParameter = {};
              const localVarQueryParameter = {};
              common_1.setSearchParams(localVarUrlObj, localVarQueryParameter);
              let headersFromBaseOptions =
                baseOptions && baseOptions.headers ? baseOptions.headers : {};
              localVarRequestOptions.headers = Object.assign(
                Object.assign(
                  Object.assign({}, localVarHeaderParameter),
                  headersFromBaseOptions,
                ),
                options.headers,
              );
              return {
                url: common_1.toPathString(localVarUrlObj),
                options: localVarRequestOptions,
              };
            }),
          /**
           *
           * @summary Returns information about a specific file.
           * @param {string} fileId The ID of the file to use for this request
           * @param {*} [options] Override http request option.
           * @throws {RequiredError}
           */
          retrieveFile: (fileId, options = {}) =>
            __awaiter(this, void 0, void 0, function* () {
              // verify required parameter 'fileId' is not null or undefined
              common_1.assertParamExists("retrieveFile", "fileId", fileId);
              const localVarPath = `/files/{file_id}`.replace(
                `{${"file_id"}}`,
                encodeURIComponent(String(fileId)),
              );
              // use dummy base URL string because the URL constructor only accepts absolute URLs.
              const localVarUrlObj = new URL(
                localVarPath,
                common_1.DUMMY_BASE_URL,
              );
              let baseOptions;
              if (configuration) {
                baseOptions = configuration.baseOptions;
              }
              const localVarRequestOptions = Object.assign(
                Object.assign({ method: "GET" }, baseOptions),
                options,
              );
              const localVarHeaderParameter = {};
              const localVarQueryParameter = {};
              common_1.setSearchParams(localVarUrlObj, localVarQueryParameter);
              let headersFromBaseOptions =
                baseOptions && baseOptions.headers ? baseOptions.headers : {};
              localVarRequestOptions.headers = Object.assign(
                Object.assign(
                  Object.assign({}, localVarHeaderParameter),
                  headersFromBaseOptions,
                ),
                options.headers,
              );
              return {
                url: common_1.toPathString(localVarUrlObj),
                options: localVarRequestOptions,
              };
            }),
          /**
           *
           * @summary Gets info about the fine-tune job.  [Learn more about Fine-tuning](/docs/guides/fine-tuning)
           * @param {string} fineTuneId The ID of the fine-tune job
           * @param {*} [options] Override http request option.
           * @throws {RequiredError}
           */
          retrieveFineTune: (fineTuneId, options = {}) =>
            __awaiter(this, void 0, void 0, function* () {
              // verify required parameter 'fineTuneId' is not null or undefined
              common_1.assertParamExists(
                "retrieveFineTune",
                "fineTuneId",
                fineTuneId,
              );
              const localVarPath = `/fine-tunes/{fine_tune_id}`.replace(
                `{${"fine_tune_id"}}`,
                encodeURIComponent(String(fineTuneId)),
              );
              // use dummy base URL string because the URL constructor only accepts absolute URLs.
              const localVarUrlObj = new URL(
                localVarPath,
                common_1.DUMMY_BASE_URL,
              );
              let baseOptions;
              if (configuration) {
                baseOptions = configuration.baseOptions;
              }
              const localVarRequestOptions = Object.assign(
                Object.assign({ method: "GET" }, baseOptions),
                options,
              );
              const localVarHeaderParameter = {};
              const localVarQueryParameter = {};
              common_1.setSearchParams(localVarUrlObj, localVarQueryParameter);
              let headersFromBaseOptions =
                baseOptions && baseOptions.headers ? baseOptions.headers : {};
              localVarRequestOptions.headers = Object.assign(
                Object.assign(
                  Object.assign({}, localVarHeaderParameter),
                  headersFromBaseOptions,
                ),
                options.headers,
              );
              return {
                url: common_1.toPathString(localVarUrlObj),
                options: localVarRequestOptions,
              };
            }),
          /**
           *
           * @summary Retrieves a model instance, providing basic information about the model such as the owner and permissioning.
           * @param {string} model The ID of the model to use for this request
           * @param {*} [options] Override http request option.
           * @throws {RequiredError}
           */
          retrieveModel: (model, options = {}) =>
            __awaiter(this, void 0, void 0, function* () {
              // verify required parameter 'model' is not null or undefined
              common_1.assertParamExists("retrieveModel", "model", model);
              const localVarPath = `/models/{model}`.replace(
                `{${"model"}}`,
                encodeURIComponent(String(model)),
              );
              // use dummy base URL string because the URL constructor only accepts absolute URLs.
              const localVarUrlObj = new URL(
                localVarPath,
                common_1.DUMMY_BASE_URL,
              );
              let baseOptions;
              if (configuration) {
                baseOptions = configuration.baseOptions;
              }
              const localVarRequestOptions = Object.assign(
                Object.assign({ method: "GET" }, baseOptions),
                options,
              );
              const localVarHeaderParameter = {};
              const localVarQueryParameter = {};
              common_1.setSearchParams(localVarUrlObj, localVarQueryParameter);
              let headersFromBaseOptions =
                baseOptions && baseOptions.headers ? baseOptions.headers : {};
              localVarRequestOptions.headers = Object.assign(
                Object.assign(
                  Object.assign({}, localVarHeaderParameter),
                  headersFromBaseOptions,
                ),
                options.headers,
              );
              return {
                url: common_1.toPathString(localVarUrlObj),
                options: localVarRequestOptions,
              };
            }),
        };
      };
      /**
       * OpenAIApi - functional programming interface
       * @export
       */
      exports.OpenAIApiFp = function (configuration) {
        const localVarAxiosParamCreator =
          exports.OpenAIApiAxiosParamCreator(configuration);
        return {
          /**
           *
           * @summary Immediately cancel a fine-tune job.
           * @param {string} fineTuneId The ID of the fine-tune job to cancel
           * @param {*} [options] Override http request option.
           * @throws {RequiredError}
           */
          cancelFineTune(fineTuneId, options) {
            return __awaiter(this, void 0, void 0, function* () {
              const localVarAxiosArgs =
                yield localVarAxiosParamCreator.cancelFineTune(
                  fineTuneId,
                  options,
                );
              return common_1.createRequestFunction(
                localVarAxiosArgs,
                axios_1.default,
                base_1.BASE_PATH,
                configuration,
              );
            });
          },
          /**
           *
           * @summary Answers the specified question using the provided documents and examples.  The endpoint first [searches](/docs/api-reference/searches) over provided documents or files to find relevant context. The relevant context is combined with the provided examples and question to create the prompt for [completion](/docs/api-reference/completions).
           * @param {CreateAnswerRequest} createAnswerRequest
           * @param {*} [options] Override http request option.
           * @deprecated
           * @throws {RequiredError}
           */
          createAnswer(createAnswerRequest, options) {
            return __awaiter(this, void 0, void 0, function* () {
              const localVarAxiosArgs =
                yield localVarAxiosParamCreator.createAnswer(
                  createAnswerRequest,
                  options,
                );
              return common_1.createRequestFunction(
                localVarAxiosArgs,
                axios_1.default,
                base_1.BASE_PATH,
                configuration,
              );
            });
          },
          /**
           *
           * @summary Creates a model response for the given chat conversation.
           * @param {CreateChatCompletionRequest} createChatCompletionRequest
           * @param {*} [options] Override http request option.
           * @throws {RequiredError}
           */
          createChatCompletion(createChatCompletionRequest, options) {
            return __awaiter(this, void 0, void 0, function* () {
              const localVarAxiosArgs =
                yield localVarAxiosParamCreator.createChatCompletion(
                  createChatCompletionRequest,
                  options,
                );
              return common_1.createRequestFunction(
                localVarAxiosArgs,
                axios_1.default,
                base_1.BASE_PATH,
                configuration,
              );
            });
          },
          /**
           *
           * @summary Classifies the specified `query` using provided examples.  The endpoint first [searches](/docs/api-reference/searches) over the labeled examples to select the ones most relevant for the particular query. Then, the relevant examples are combined with the query to construct a prompt to produce the final label via the [completions](/docs/api-reference/completions) endpoint.  Labeled examples can be provided via an uploaded `file`, or explicitly listed in the request using the `examples` parameter for quick tests and small scale use cases.
           * @param {CreateClassificationRequest} createClassificationRequest
           * @param {*} [options] Override http request option.
           * @deprecated
           * @throws {RequiredError}
           */
          createClassification(createClassificationRequest, options) {
            return __awaiter(this, void 0, void 0, function* () {
              const localVarAxiosArgs =
                yield localVarAxiosParamCreator.createClassification(
                  createClassificationRequest,
                  options,
                );
              return common_1.createRequestFunction(
                localVarAxiosArgs,
                axios_1.default,
                base_1.BASE_PATH,
                configuration,
              );
            });
          },
          /**
           *
           * @summary Creates a completion for the provided prompt and parameters.
           * @param {CreateCompletionRequest} createCompletionRequest
           * @param {*} [options] Override http request option.
           * @throws {RequiredError}
           */
          createCompletion(createCompletionRequest, options) {
            return __awaiter(this, void 0, void 0, function* () {
              const localVarAxiosArgs =
                yield localVarAxiosParamCreator.createCompletion(
                  createCompletionRequest,
                  options,
                );
              return common_1.createRequestFunction(
                localVarAxiosArgs,
                axios_1.default,
                base_1.BASE_PATH,
                configuration,
              );
            });
          },
          /**
           *
           * @summary Creates a new edit for the provided input, instruction, and parameters.
           * @param {CreateEditRequest} createEditRequest
           * @param {*} [options] Override http request option.
           * @throws {RequiredError}
           */
          createEdit(createEditRequest, options) {
            return __awaiter(this, void 0, void 0, function* () {
              const localVarAxiosArgs =
                yield localVarAxiosParamCreator.createEdit(
                  createEditRequest,
                  options,
                );
              return common_1.createRequestFunction(
                localVarAxiosArgs,
                axios_1.default,
                base_1.BASE_PATH,
                configuration,
              );
            });
          },
          /**
           *
           * @summary Creates an embedding vector representing the input text.
           * @param {CreateEmbeddingRequest} createEmbeddingRequest
           * @param {*} [options] Override http request option.
           * @throws {RequiredError}
           */
          createEmbedding(createEmbeddingRequest, options) {
            return __awaiter(this, void 0, void 0, function* () {
              const localVarAxiosArgs =
                yield localVarAxiosParamCreator.createEmbedding(
                  createEmbeddingRequest,
                  options,
                );
              return common_1.createRequestFunction(
                localVarAxiosArgs,
                axios_1.default,
                base_1.BASE_PATH,
                configuration,
              );
            });
          },
          /**
           *
           * @summary Upload a file that contains document(s) to be used across various endpoints/features. Currently, the size of all the files uploaded by one organization can be up to 1 GB. Please contact us if you need to increase the storage limit.
           * @param {File} file Name of the [JSON Lines](https://jsonlines.readthedocs.io/en/latest/) file to be uploaded.  If the &#x60;purpose&#x60; is set to \\\&quot;fine-tune\\\&quot;, each line is a JSON record with \\\&quot;prompt\\\&quot; and \\\&quot;completion\\\&quot; fields representing your [training examples](/docs/guides/fine-tuning/prepare-training-data).
           * @param {string} purpose The intended purpose of the uploaded documents.  Use \\\&quot;fine-tune\\\&quot; for [Fine-tuning](/docs/api-reference/fine-tunes). This allows us to validate the format of the uploaded file.
           * @param {*} [options] Override http request option.
           * @throws {RequiredError}
           */
          createFile(file, purpose, options) {
            return __awaiter(this, void 0, void 0, function* () {
              const localVarAxiosArgs =
                yield localVarAxiosParamCreator.createFile(
                  file,
                  purpose,
                  options,
                );
              return common_1.createRequestFunction(
                localVarAxiosArgs,
                axios_1.default,
                base_1.BASE_PATH,
                configuration,
              );
            });
          },
          /**
           *
           * @summary Creates a job that fine-tunes a specified model from a given dataset.  Response includes details of the enqueued job including job status and the name of the fine-tuned models once complete.  [Learn more about Fine-tuning](/docs/guides/fine-tuning)
           * @param {CreateFineTuneRequest} createFineTuneRequest
           * @param {*} [options] Override http request option.
           * @throws {RequiredError}
           */
          createFineTune(createFineTuneRequest, options) {
            return __awaiter(this, void 0, void 0, function* () {
              const localVarAxiosArgs =
                yield localVarAxiosParamCreator.createFineTune(
                  createFineTuneRequest,
                  options,
                );
              return common_1.createRequestFunction(
                localVarAxiosArgs,
                axios_1.default,
                base_1.BASE_PATH,
                configuration,
              );
            });
          },
          /**
           *
           * @summary Creates an image given a prompt.
           * @param {CreateImageRequest} createImageRequest
           * @param {*} [options] Override http request option.
           * @throws {RequiredError}
           */
          createImage(createImageRequest, options) {
            return __awaiter(this, void 0, void 0, function* () {
              const localVarAxiosArgs =
                yield localVarAxiosParamCreator.createImage(
                  createImageRequest,
                  options,
                );
              return common_1.createRequestFunction(
                localVarAxiosArgs,
                axios_1.default,
                base_1.BASE_PATH,
                configuration,
              );
            });
          },
          /**
           *
           * @summary Creates an edited or extended image given an original image and a prompt.
           * @param {File} image The image to edit. Must be a valid PNG file, less than 4MB, and square. If mask is not provided, image must have transparency, which will be used as the mask.
           * @param {string} prompt A text description of the desired image(s). The maximum length is 1000 characters.
           * @param {File} [mask] An additional image whose fully transparent areas (e.g. where alpha is zero) indicate where &#x60;image&#x60; should be edited. Must be a valid PNG file, less than 4MB, and have the same dimensions as &#x60;image&#x60;.
           * @param {number} [n] The number of images to generate. Must be between 1 and 10.
           * @param {string} [size] The size of the generated images. Must be one of &#x60;256x256&#x60;, &#x60;512x512&#x60;, or &#x60;1024x1024&#x60;.
           * @param {string} [responseFormat] The format in which the generated images are returned. Must be one of &#x60;url&#x60; or &#x60;b64_json&#x60;.
           * @param {string} [user] A unique identifier representing your end-user, which can help OpenAI to monitor and detect abuse. [Learn more](/docs/guides/safety-best-practices/end-user-ids).
           * @param {*} [options] Override http request option.
           * @throws {RequiredError}
           */
          createImageEdit(
            image,
            prompt,
            mask,
            n,
            size,
            responseFormat,
            user,
            options,
          ) {
            return __awaiter(this, void 0, void 0, function* () {
              const localVarAxiosArgs =
                yield localVarAxiosParamCreator.createImageEdit(
                  image,
                  prompt,
                  mask,
                  n,
                  size,
                  responseFormat,
                  user,
                  options,
                );
              return common_1.createRequestFunction(
                localVarAxiosArgs,
                axios_1.default,
                base_1.BASE_PATH,
                configuration,
              );
            });
          },
          /**
           *
           * @summary Creates a variation of a given image.
           * @param {File} image The image to use as the basis for the variation(s). Must be a valid PNG file, less than 4MB, and square.
           * @param {number} [n] The number of images to generate. Must be between 1 and 10.
           * @param {string} [size] The size of the generated images. Must be one of &#x60;256x256&#x60;, &#x60;512x512&#x60;, or &#x60;1024x1024&#x60;.
           * @param {string} [responseFormat] The format in which the generated images are returned. Must be one of &#x60;url&#x60; or &#x60;b64_json&#x60;.
           * @param {string} [user] A unique identifier representing your end-user, which can help OpenAI to monitor and detect abuse. [Learn more](/docs/guides/safety-best-practices/end-user-ids).
           * @param {*} [options] Override http request option.
           * @throws {RequiredError}
           */
          createImageVariation(image, n, size, responseFormat, user, options) {
            return __awaiter(this, void 0, void 0, function* () {
              const localVarAxiosArgs =
                yield localVarAxiosParamCreator.createImageVariation(
                  image,
                  n,
                  size,
                  responseFormat,
                  user,
                  options,
                );
              return common_1.createRequestFunction(
                localVarAxiosArgs,
                axios_1.default,
                base_1.BASE_PATH,
                configuration,
              );
            });
          },
          /**
           *
           * @summary Classifies if text violates OpenAI\'s Content Policy
           * @param {CreateModerationRequest} createModerationRequest
           * @param {*} [options] Override http request option.
           * @throws {RequiredError}
           */
          createModeration(createModerationRequest, options) {
            return __awaiter(this, void 0, void 0, function* () {
              const localVarAxiosArgs =
                yield localVarAxiosParamCreator.createModeration(
                  createModerationRequest,
                  options,
                );
              return common_1.createRequestFunction(
                localVarAxiosArgs,
                axios_1.default,
                base_1.BASE_PATH,
                configuration,
              );
            });
          },
          /**
           *
           * @summary The search endpoint computes similarity scores between provided query and documents. Documents can be passed directly to the API if there are no more than 200 of them.  To go beyond the 200 document limit, documents can be processed offline and then used for efficient retrieval at query time. When `file` is set, the search endpoint searches over all the documents in the given file and returns up to the `max_rerank` number of documents. These documents will be returned along with their search scores.  The similarity score is a positive score that usually ranges from 0 to 300 (but can sometimes go higher), where a score above 200 usually means the document is semantically similar to the query.
           * @param {string} engineId The ID of the engine to use for this request.  You can select one of &#x60;ada&#x60;, &#x60;babbage&#x60;, &#x60;curie&#x60;, or &#x60;davinci&#x60;.
           * @param {CreateSearchRequest} createSearchRequest
           * @param {*} [options] Override http request option.
           * @deprecated
           * @throws {RequiredError}
           */
          createSearch(engineId, createSearchRequest, options) {
            return __awaiter(this, void 0, void 0, function* () {
              const localVarAxiosArgs =
                yield localVarAxiosParamCreator.createSearch(
                  engineId,
                  createSearchRequest,
                  options,
                );
              return common_1.createRequestFunction(
                localVarAxiosArgs,
                axios_1.default,
                base_1.BASE_PATH,
                configuration,
              );
            });
          },
          /**
           *
           * @summary Transcribes audio into the input language.
           * @param {File} file The audio file object (not file name) to transcribe, in one of these formats: mp3, mp4, mpeg, mpga, m4a, wav, or webm.
           * @param {string} model ID of the model to use. Only &#x60;whisper-1&#x60; is currently available.
           * @param {string} [prompt] An optional text to guide the model\\\&#39;s style or continue a previous audio segment. The [prompt](/docs/guides/speech-to-text/prompting) should match the audio language.
           * @param {string} [responseFormat] The format of the transcript output, in one of these options: json, text, srt, verbose_json, or vtt.
           * @param {number} [temperature] The sampling temperature, between 0 and 1. Higher values like 0.8 will make the output more random, while lower values like 0.2 will make it more focused and deterministic. If set to 0, the model will use [log probability](https://en.wikipedia.org/wiki/Log_probability) to automatically increase the temperature until certain thresholds are hit.
           * @param {string} [language] The language of the input audio. Supplying the input language in [ISO-639-1](https://en.wikipedia.org/wiki/List_of_ISO_639-1_codes) format will improve accuracy and latency.
           * @param {*} [options] Override http request option.
           * @throws {RequiredError}
           */
          createTranscription(
            file,
            model,
            prompt,
            responseFormat,
            temperature,
            language,
            options,
          ) {
            return __awaiter(this, void 0, void 0, function* () {
              const localVarAxiosArgs =
                yield localVarAxiosParamCreator.createTranscription(
                  file,
                  model,
                  prompt,
                  responseFormat,
                  temperature,
                  language,
                  options,
                );
              return common_1.createRequestFunction(
                localVarAxiosArgs,
                axios_1.default,
                base_1.BASE_PATH,
                configuration,
              );
            });
          },
          /**
           *
           * @summary Translates audio into into English.
           * @param {File} file The audio file object (not file name) translate, in one of these formats: mp3, mp4, mpeg, mpga, m4a, wav, or webm.
           * @param {string} model ID of the model to use. Only &#x60;whisper-1&#x60; is currently available.
           * @param {string} [prompt] An optional text to guide the model\\\&#39;s style or continue a previous audio segment. The [prompt](/docs/guides/speech-to-text/prompting) should be in English.
           * @param {string} [responseFormat] The format of the transcript output, in one of these options: json, text, srt, verbose_json, or vtt.
           * @param {number} [temperature] The sampling temperature, between 0 and 1. Higher values like 0.8 will make the output more random, while lower values like 0.2 will make it more focused and deterministic. If set to 0, the model will use [log probability](https://en.wikipedia.org/wiki/Log_probability) to automatically increase the temperature until certain thresholds are hit.
           * @param {*} [options] Override http request option.
           * @throws {RequiredError}
           */
          createTranslation(
            file,
            model,
            prompt,
            responseFormat,
            temperature,
            options,
          ) {
            return __awaiter(this, void 0, void 0, function* () {
              const localVarAxiosArgs =
                yield localVarAxiosParamCreator.createTranslation(
                  file,
                  model,
                  prompt,
                  responseFormat,
                  temperature,
                  options,
                );
              return common_1.createRequestFunction(
                localVarAxiosArgs,
                axios_1.default,
                base_1.BASE_PATH,
                configuration,
              );
            });
          },
          /**
           *
           * @summary Delete a file.
           * @param {string} fileId The ID of the file to use for this request
           * @param {*} [options] Override http request option.
           * @throws {RequiredError}
           */
          deleteFile(fileId, options) {
            return __awaiter(this, void 0, void 0, function* () {
              const localVarAxiosArgs =
                yield localVarAxiosParamCreator.deleteFile(fileId, options);
              return common_1.createRequestFunction(
                localVarAxiosArgs,
                axios_1.default,
                base_1.BASE_PATH,
                configuration,
              );
            });
          },
          /**
           *
           * @summary Delete a fine-tuned model. You must have the Owner role in your organization.
           * @param {string} model The model to delete
           * @param {*} [options] Override http request option.
           * @throws {RequiredError}
           */
          deleteModel(model, options) {
            return __awaiter(this, void 0, void 0, function* () {
              const localVarAxiosArgs =
                yield localVarAxiosParamCreator.deleteModel(model, options);
              return common_1.createRequestFunction(
                localVarAxiosArgs,
                axios_1.default,
                base_1.BASE_PATH,
                configuration,
              );
            });
          },
          /**
           *
           * @summary Returns the contents of the specified file
           * @param {string} fileId The ID of the file to use for this request
           * @param {*} [options] Override http request option.
           * @throws {RequiredError}
           */
          downloadFile(fileId, options) {
            return __awaiter(this, void 0, void 0, function* () {
              const localVarAxiosArgs =
                yield localVarAxiosParamCreator.downloadFile(fileId, options);
              return common_1.createRequestFunction(
                localVarAxiosArgs,
                axios_1.default,
                base_1.BASE_PATH,
                configuration,
              );
            });
          },
          /**
           *
           * @summary Lists the currently available (non-finetuned) models, and provides basic information about each one such as the owner and availability.
           * @param {*} [options] Override http request option.
           * @deprecated
           * @throws {RequiredError}
           */
          listEngines(options) {
            return __awaiter(this, void 0, void 0, function* () {
              const localVarAxiosArgs =
                yield localVarAxiosParamCreator.listEngines(options);
              return common_1.createRequestFunction(
                localVarAxiosArgs,
                axios_1.default,
                base_1.BASE_PATH,
                configuration,
              );
            });
          },
          /**
           *
           * @summary Returns a list of files that belong to the user\'s organization.
           * @param {*} [options] Override http request option.
           * @throws {RequiredError}
           */
          listFiles(options) {
            return __awaiter(this, void 0, void 0, function* () {
              const localVarAxiosArgs =
                yield localVarAxiosParamCreator.listFiles(options);
              return common_1.createRequestFunction(
                localVarAxiosArgs,
                axios_1.default,
                base_1.BASE_PATH,
                configuration,
              );
            });
          },
          /**
           *
           * @summary Get fine-grained status updates for a fine-tune job.
           * @param {string} fineTuneId The ID of the fine-tune job to get events for.
           * @param {boolean} [stream] Whether to stream events for the fine-tune job. If set to true, events will be sent as data-only [server-sent events](https://developer.mozilla.org/en-US/docs/Web/API/Server-sent_events/Using_server-sent_events#Event_stream_format) as they become available. The stream will terminate with a &#x60;data: [DONE]&#x60; message when the job is finished (succeeded, cancelled, or failed).  If set to false, only events generated so far will be returned.
           * @param {*} [options] Override http request option.
           * @throws {RequiredError}
           */
          listFineTuneEvents(fineTuneId, stream, options) {
            return __awaiter(this, void 0, void 0, function* () {
              const localVarAxiosArgs =
                yield localVarAxiosParamCreator.listFineTuneEvents(
                  fineTuneId,
                  stream,
                  options,
                );
              return common_1.createRequestFunction(
                localVarAxiosArgs,
                axios_1.default,
                base_1.BASE_PATH,
                configuration,
              );
            });
          },
          /**
           *
           * @summary List your organization\'s fine-tuning jobs
           * @param {*} [options] Override http request option.
           * @throws {RequiredError}
           */
          listFineTunes(options) {
            return __awaiter(this, void 0, void 0, function* () {
              const localVarAxiosArgs =
                yield localVarAxiosParamCreator.listFineTunes(options);
              return common_1.createRequestFunction(
                localVarAxiosArgs,
                axios_1.default,
                base_1.BASE_PATH,
                configuration,
              );
            });
          },
          /**
           *
           * @summary Lists the currently available models, and provides basic information about each one such as the owner and availability.
           * @param {*} [options] Override http request option.
           * @throws {RequiredError}
           */
          listModels(options) {
            return __awaiter(this, void 0, void 0, function* () {
              const localVarAxiosArgs =
                yield localVarAxiosParamCreator.listModels(options);
              return common_1.createRequestFunction(
                localVarAxiosArgs,
                axios_1.default,
                base_1.BASE_PATH,
                configuration,
              );
            });
          },
          /**
           *
           * @summary Retrieves a model instance, providing basic information about it such as the owner and availability.
           * @param {string} engineId The ID of the engine to use for this request
           * @param {*} [options] Override http request option.
           * @deprecated
           * @throws {RequiredError}
           */
          retrieveEngine(engineId, options) {
            return __awaiter(this, void 0, void 0, function* () {
              const localVarAxiosArgs =
                yield localVarAxiosParamCreator.retrieveEngine(
                  engineId,
                  options,
                );
              return common_1.createRequestFunction(
                localVarAxiosArgs,
                axios_1.default,
                base_1.BASE_PATH,
                configuration,
              );
            });
          },
          /**
           *
           * @summary Returns information about a specific file.
           * @param {string} fileId The ID of the file to use for this request
           * @param {*} [options] Override http request option.
           * @throws {RequiredError}
           */
          retrieveFile(fileId, options) {
            return __awaiter(this, void 0, void 0, function* () {
              const localVarAxiosArgs =
                yield localVarAxiosParamCreator.retrieveFile(fileId, options);
              return common_1.createRequestFunction(
                localVarAxiosArgs,
                axios_1.default,
                base_1.BASE_PATH,
                configuration,
              );
            });
          },
          /**
           *
           * @summary Gets info about the fine-tune job.  [Learn more about Fine-tuning](/docs/guides/fine-tuning)
           * @param {string} fineTuneId The ID of the fine-tune job
           * @param {*} [options] Override http request option.
           * @throws {RequiredError}
           */
          retrieveFineTune(fineTuneId, options) {
            return __awaiter(this, void 0, void 0, function* () {
              const localVarAxiosArgs =
                yield localVarAxiosParamCreator.retrieveFineTune(
                  fineTuneId,
                  options,
                );
              return common_1.createRequestFunction(
                localVarAxiosArgs,
                axios_1.default,
                base_1.BASE_PATH,
                configuration,
              );
            });
          },
          /**
           *
           * @summary Retrieves a model instance, providing basic information about the model such as the owner and permissioning.
           * @param {string} model The ID of the model to use for this request
           * @param {*} [options] Override http request option.
           * @throws {RequiredError}
           */
          retrieveModel(model, options) {
            return __awaiter(this, void 0, void 0, function* () {
              const localVarAxiosArgs =
                yield localVarAxiosParamCreator.retrieveModel(model, options);
              return common_1.createRequestFunction(
                localVarAxiosArgs,
                axios_1.default,
                base_1.BASE_PATH,
                configuration,
              );
            });
          },
        };
      };
      /**
       * OpenAIApi - factory interface
       * @export
       */
      exports.OpenAIApiFactory = function (configuration, basePath, axios) {
        const localVarFp = exports.OpenAIApiFp(configuration);
        return {
          /**
           *
           * @summary Immediately cancel a fine-tune job.
           * @param {string} fineTuneId The ID of the fine-tune job to cancel
           * @param {*} [options] Override http request option.
           * @throws {RequiredError}
           */
          cancelFineTune(fineTuneId, options) {
            return localVarFp
              .cancelFineTune(fineTuneId, options)
              .then((request) => request(axios, basePath));
          },
          /**
           *
           * @summary Answers the specified question using the provided documents and examples.  The endpoint first [searches](/docs/api-reference/searches) over provided documents or files to find relevant context. The relevant context is combined with the provided examples and question to create the prompt for [completion](/docs/api-reference/completions).
           * @param {CreateAnswerRequest} createAnswerRequest
           * @param {*} [options] Override http request option.
           * @deprecated
           * @throws {RequiredError}
           */
          createAnswer(createAnswerRequest, options) {
            return localVarFp
              .createAnswer(createAnswerRequest, options)
              .then((request) => request(axios, basePath));
          },
          /**
           *
           * @summary Creates a model response for the given chat conversation.
           * @param {CreateChatCompletionRequest} createChatCompletionRequest
           * @param {*} [options] Override http request option.
           * @throws {RequiredError}
           */
          createChatCompletion(createChatCompletionRequest, options) {
            return localVarFp
              .createChatCompletion(createChatCompletionRequest, options)
              .then((request) => request(axios, basePath));
          },
          /**
           *
           * @summary Classifies the specified `query` using provided examples.  The endpoint first [searches](/docs/api-reference/searches) over the labeled examples to select the ones most relevant for the particular query. Then, the relevant examples are combined with the query to construct a prompt to produce the final label via the [completions](/docs/api-reference/completions) endpoint.  Labeled examples can be provided via an uploaded `file`, or explicitly listed in the request using the `examples` parameter for quick tests and small scale use cases.
           * @param {CreateClassificationRequest} createClassificationRequest
           * @param {*} [options] Override http request option.
           * @deprecated
           * @throws {RequiredError}
           */
          createClassification(createClassificationRequest, options) {
            return localVarFp
              .createClassification(createClassificationRequest, options)
              .then((request) => request(axios, basePath));
          },
          /**
           *
           * @summary Creates a completion for the provided prompt and parameters.
           * @param {CreateCompletionRequest} createCompletionRequest
           * @param {*} [options] Override http request option.
           * @throws {RequiredError}
           */
          createCompletion(createCompletionRequest, options) {
            return localVarFp
              .createCompletion(createCompletionRequest, options)
              .then((request) => request(axios, basePath));
          },
          /**
           *
           * @summary Creates a new edit for the provided input, instruction, and parameters.
           * @param {CreateEditRequest} createEditRequest
           * @param {*} [options] Override http request option.
           * @throws {RequiredError}
           */
          createEdit(createEditRequest, options) {
            return localVarFp
              .createEdit(createEditRequest, options)
              .then((request) => request(axios, basePath));
          },
          /**
           *
           * @summary Creates an embedding vector representing the input text.
           * @param {CreateEmbeddingRequest} createEmbeddingRequest
           * @param {*} [options] Override http request option.
           * @throws {RequiredError}
           */
          createEmbedding(createEmbeddingRequest, options) {
            return localVarFp
              .createEmbedding(createEmbeddingRequest, options)
              .then((request) => request(axios, basePath));
          },
          /**
           *
           * @summary Upload a file that contains document(s) to be used across various endpoints/features. Currently, the size of all the files uploaded by one organization can be up to 1 GB. Please contact us if you need to increase the storage limit.
           * @param {File} file Name of the [JSON Lines](https://jsonlines.readthedocs.io/en/latest/) file to be uploaded.  If the &#x60;purpose&#x60; is set to \\\&quot;fine-tune\\\&quot;, each line is a JSON record with \\\&quot;prompt\\\&quot; and \\\&quot;completion\\\&quot; fields representing your [training examples](/docs/guides/fine-tuning/prepare-training-data).
           * @param {string} purpose The intended purpose of the uploaded documents.  Use \\\&quot;fine-tune\\\&quot; for [Fine-tuning](/docs/api-reference/fine-tunes). This allows us to validate the format of the uploaded file.
           * @param {*} [options] Override http request option.
           * @throws {RequiredError}
           */
          createFile(file, purpose, options) {
            return localVarFp
              .createFile(file, purpose, options)
              .then((request) => request(axios, basePath));
          },
          /**
           *
           * @summary Creates a job that fine-tunes a specified model from a given dataset.  Response includes details of the enqueued job including job status and the name of the fine-tuned models once complete.  [Learn more about Fine-tuning](/docs/guides/fine-tuning)
           * @param {CreateFineTuneRequest} createFineTuneRequest
           * @param {*} [options] Override http request option.
           * @throws {RequiredError}
           */
          createFineTune(createFineTuneRequest, options) {
            return localVarFp
              .createFineTune(createFineTuneRequest, options)
              .then((request) => request(axios, basePath));
          },
          /**
           *
           * @summary Creates an image given a prompt.
           * @param {CreateImageRequest} createImageRequest
           * @param {*} [options] Override http request option.
           * @throws {RequiredError}
           */
          createImage(createImageRequest, options) {
            return localVarFp
              .createImage(createImageRequest, options)
              .then((request) => request(axios, basePath));
          },
          /**
           *
           * @summary Creates an edited or extended image given an original image and a prompt.
           * @param {File} image The image to edit. Must be a valid PNG file, less than 4MB, and square. If mask is not provided, image must have transparency, which will be used as the mask.
           * @param {string} prompt A text description of the desired image(s). The maximum length is 1000 characters.
           * @param {File} [mask] An additional image whose fully transparent areas (e.g. where alpha is zero) indicate where &#x60;image&#x60; should be edited. Must be a valid PNG file, less than 4MB, and have the same dimensions as &#x60;image&#x60;.
           * @param {number} [n] The number of images to generate. Must be between 1 and 10.
           * @param {string} [size] The size of the generated images. Must be one of &#x60;256x256&#x60;, &#x60;512x512&#x60;, or &#x60;1024x1024&#x60;.
           * @param {string} [responseFormat] The format in which the generated images are returned. Must be one of &#x60;url&#x60; or &#x60;b64_json&#x60;.
           * @param {string} [user] A unique identifier representing your end-user, which can help OpenAI to monitor and detect abuse. [Learn more](/docs/guides/safety-best-practices/end-user-ids).
           * @param {*} [options] Override http request option.
           * @throws {RequiredError}
           */
          createImageEdit(
            image,
            prompt,
            mask,
            n,
            size,
            responseFormat,
            user,
            options,
          ) {
            return localVarFp
              .createImageEdit(
                image,
                prompt,
                mask,
                n,
                size,
                responseFormat,
                user,
                options,
              )
              .then((request) => request(axios, basePath));
          },
          /**
           *
           * @summary Creates a variation of a given image.
           * @param {File} image The image to use as the basis for the variation(s). Must be a valid PNG file, less than 4MB, and square.
           * @param {number} [n] The number of images to generate. Must be between 1 and 10.
           * @param {string} [size] The size of the generated images. Must be one of &#x60;256x256&#x60;, &#x60;512x512&#x60;, or &#x60;1024x1024&#x60;.
           * @param {string} [responseFormat] The format in which the generated images are returned. Must be one of &#x60;url&#x60; or &#x60;b64_json&#x60;.
           * @param {string} [user] A unique identifier representing your end-user, which can help OpenAI to monitor and detect abuse. [Learn more](/docs/guides/safety-best-practices/end-user-ids).
           * @param {*} [options] Override http request option.
           * @throws {RequiredError}
           */
          createImageVariation(image, n, size, responseFormat, user, options) {
            return localVarFp
              .createImageVariation(
                image,
                n,
                size,
                responseFormat,
                user,
                options,
              )
              .then((request) => request(axios, basePath));
          },
          /**
           *
           * @summary Classifies if text violates OpenAI\'s Content Policy
           * @param {CreateModerationRequest} createModerationRequest
           * @param {*} [options] Override http request option.
           * @throws {RequiredError}
           */
          createModeration(createModerationRequest, options) {
            return localVarFp
              .createModeration(createModerationRequest, options)
              .then((request) => request(axios, basePath));
          },
          /**
           *
           * @summary The search endpoint computes similarity scores between provided query and documents. Documents can be passed directly to the API if there are no more than 200 of them.  To go beyond the 200 document limit, documents can be processed offline and then used for efficient retrieval at query time. When `file` is set, the search endpoint searches over all the documents in the given file and returns up to the `max_rerank` number of documents. These documents will be returned along with their search scores.  The similarity score is a positive score that usually ranges from 0 to 300 (but can sometimes go higher), where a score above 200 usually means the document is semantically similar to the query.
           * @param {string} engineId The ID of the engine to use for this request.  You can select one of &#x60;ada&#x60;, &#x60;babbage&#x60;, &#x60;curie&#x60;, or &#x60;davinci&#x60;.
           * @param {CreateSearchRequest} createSearchRequest
           * @param {*} [options] Override http request option.
           * @deprecated
           * @throws {RequiredError}
           */
          createSearch(engineId, createSearchRequest, options) {
            return localVarFp
              .createSearch(engineId, createSearchRequest, options)
              .then((request) => request(axios, basePath));
          },
          /**
           *
           * @summary Transcribes audio into the input language.
           * @param {File} file The audio file object (not file name) to transcribe, in one of these formats: mp3, mp4, mpeg, mpga, m4a, wav, or webm.
           * @param {string} model ID of the model to use. Only &#x60;whisper-1&#x60; is currently available.
           * @param {string} [prompt] An optional text to guide the model\\\&#39;s style or continue a previous audio segment. The [prompt](/docs/guides/speech-to-text/prompting) should match the audio language.
           * @param {string} [responseFormat] The format of the transcript output, in one of these options: json, text, srt, verbose_json, or vtt.
           * @param {number} [temperature] The sampling temperature, between 0 and 1. Higher values like 0.8 will make the output more random, while lower values like 0.2 will make it more focused and deterministic. If set to 0, the model will use [log probability](https://en.wikipedia.org/wiki/Log_probability) to automatically increase the temperature until certain thresholds are hit.
           * @param {string} [language] The language of the input audio. Supplying the input language in [ISO-639-1](https://en.wikipedia.org/wiki/List_of_ISO_639-1_codes) format will improve accuracy and latency.
           * @param {*} [options] Override http request option.
           * @throws {RequiredError}
           */
          createTranscription(
            file,
            model,
            prompt,
            responseFormat,
            temperature,
            language,
            options,
          ) {
            return localVarFp
              .createTranscription(
                file,
                model,
                prompt,
                responseFormat,
                temperature,
                language,
                options,
              )
              .then((request) => request(axios, basePath));
          },
          /**
           *
           * @summary Translates audio into into English.
           * @param {File} file The audio file object (not file name) translate, in one of these formats: mp3, mp4, mpeg, mpga, m4a, wav, or webm.
           * @param {string} model ID of the model to use. Only &#x60;whisper-1&#x60; is currently available.
           * @param {string} [prompt] An optional text to guide the model\\\&#39;s style or continue a previous audio segment. The [prompt](/docs/guides/speech-to-text/prompting) should be in English.
           * @param {string} [responseFormat] The format of the transcript output, in one of these options: json, text, srt, verbose_json, or vtt.
           * @param {number} [temperature] The sampling temperature, between 0 and 1. Higher values like 0.8 will make the output more random, while lower values like 0.2 will make it more focused and deterministic. If set to 0, the model will use [log probability](https://en.wikipedia.org/wiki/Log_probability) to automatically increase the temperature until certain thresholds are hit.
           * @param {*} [options] Override http request option.
           * @throws {RequiredError}
           */
          createTranslation(
            file,
            model,
            prompt,
            responseFormat,
            temperature,
            options,
          ) {
            return localVarFp
              .createTranslation(
                file,
                model,
                prompt,
                responseFormat,
                temperature,
                options,
              )
              .then((request) => request(axios, basePath));
          },
          /**
           *
           * @summary Delete a file.
           * @param {string} fileId The ID of the file to use for this request
           * @param {*} [options] Override http request option.
           * @throws {RequiredError}
           */
          deleteFile(fileId, options) {
            return localVarFp
              .deleteFile(fileId, options)
              .then((request) => request(axios, basePath));
          },
          /**
           *
           * @summary Delete a fine-tuned model. You must have the Owner role in your organization.
           * @param {string} model The model to delete
           * @param {*} [options] Override http request option.
           * @throws {RequiredError}
           */
          deleteModel(model, options) {
            return localVarFp
              .deleteModel(model, options)
              .then((request) => request(axios, basePath));
          },
          /**
           *
           * @summary Returns the contents of the specified file
           * @param {string} fileId The ID of the file to use for this request
           * @param {*} [options] Override http request option.
           * @throws {RequiredError}
           */
          downloadFile(fileId, options) {
            return localVarFp
              .downloadFile(fileId, options)
              .then((request) => request(axios, basePath));
          },
          /**
           *
           * @summary Lists the currently available (non-finetuned) models, and provides basic information about each one such as the owner and availability.
           * @param {*} [options] Override http request option.
           * @deprecated
           * @throws {RequiredError}
           */
          listEngines(options) {
            return localVarFp
              .listEngines(options)
              .then((request) => request(axios, basePath));
          },
          /**
           *
           * @summary Returns a list of files that belong to the user\'s organization.
           * @param {*} [options] Override http request option.
           * @throws {RequiredError}
           */
          listFiles(options) {
            return localVarFp
              .listFiles(options)
              .then((request) => request(axios, basePath));
          },
          /**
           *
           * @summary Get fine-grained status updates for a fine-tune job.
           * @param {string} fineTuneId The ID of the fine-tune job to get events for.
           * @param {boolean} [stream] Whether to stream events for the fine-tune job. If set to true, events will be sent as data-only [server-sent events](https://developer.mozilla.org/en-US/docs/Web/API/Server-sent_events/Using_server-sent_events#Event_stream_format) as they become available. The stream will terminate with a &#x60;data: [DONE]&#x60; message when the job is finished (succeeded, cancelled, or failed).  If set to false, only events generated so far will be returned.
           * @param {*} [options] Override http request option.
           * @throws {RequiredError}
           */
          listFineTuneEvents(fineTuneId, stream, options) {
            return localVarFp
              .listFineTuneEvents(fineTuneId, stream, options)
              .then((request) => request(axios, basePath));
          },
          /**
           *
           * @summary List your organization\'s fine-tuning jobs
           * @param {*} [options] Override http request option.
           * @throws {RequiredError}
           */
          listFineTunes(options) {
            return localVarFp
              .listFineTunes(options)
              .then((request) => request(axios, basePath));
          },
          /**
           *
           * @summary Lists the currently available models, and provides basic information about each one such as the owner and availability.
           * @param {*} [options] Override http request option.
           * @throws {RequiredError}
           */
          listModels(options) {
            return localVarFp
              .listModels(options)
              .then((request) => request(axios, basePath));
          },
          /**
           *
           * @summary Retrieves a model instance, providing basic information about it such as the owner and availability.
           * @param {string} engineId The ID of the engine to use for this request
           * @param {*} [options] Override http request option.
           * @deprecated
           * @throws {RequiredError}
           */
          retrieveEngine(engineId, options) {
            return localVarFp
              .retrieveEngine(engineId, options)
              .then((request) => request(axios, basePath));
          },
          /**
           *
           * @summary Returns information about a specific file.
           * @param {string} fileId The ID of the file to use for this request
           * @param {*} [options] Override http request option.
           * @throws {RequiredError}
           */
          retrieveFile(fileId, options) {
            return localVarFp
              .retrieveFile(fileId, options)
              .then((request) => request(axios, basePath));
          },
          /**
           *
           * @summary Gets info about the fine-tune job.  [Learn more about Fine-tuning](/docs/guides/fine-tuning)
           * @param {string} fineTuneId The ID of the fine-tune job
           * @param {*} [options] Override http request option.
           * @throws {RequiredError}
           */
          retrieveFineTune(fineTuneId, options) {
            return localVarFp
              .retrieveFineTune(fineTuneId, options)
              .then((request) => request(axios, basePath));
          },
          /**
           *
           * @summary Retrieves a model instance, providing basic information about the model such as the owner and permissioning.
           * @param {string} model The ID of the model to use for this request
           * @param {*} [options] Override http request option.
           * @throws {RequiredError}
           */
          retrieveModel(model, options) {
            return localVarFp
              .retrieveModel(model, options)
              .then((request) => request(axios, basePath));
          },
        };
      };
      /**
       * OpenAIApi - object-oriented interface
       * @export
       * @class OpenAIApi
       * @extends {BaseAPI}
       */
      class OpenAIApi extends base_1.BaseAPI {
        /**
         *
         * @summary Immediately cancel a fine-tune job.
         * @param {string} fineTuneId The ID of the fine-tune job to cancel
         * @param {*} [options] Override http request option.
         * @throws {RequiredError}
         * @memberof OpenAIApi
         */
        cancelFineTune(fineTuneId, options) {
          return exports
            .OpenAIApiFp(this.configuration)
            .cancelFineTune(fineTuneId, options)
            .then((request) => request(this.axios, this.basePath));
        }
        /**
         *
         * @summary Answers the specified question using the provided documents and examples.  The endpoint first [searches](/docs/api-reference/searches) over provided documents or files to find relevant context. The relevant context is combined with the provided examples and question to create the prompt for [completion](/docs/api-reference/completions).
         * @param {CreateAnswerRequest} createAnswerRequest
         * @param {*} [options] Override http request option.
         * @deprecated
         * @throws {RequiredError}
         * @memberof OpenAIApi
         */
        createAnswer(createAnswerRequest, options) {
          return exports
            .OpenAIApiFp(this.configuration)
            .createAnswer(createAnswerRequest, options)
            .then((request) => request(this.axios, this.basePath));
        }
        /**
         *
         * @summary Creates a model response for the given chat conversation.
         * @param {CreateChatCompletionRequest} createChatCompletionRequest
         * @param {*} [options] Override http request option.
         * @throws {RequiredError}
         * @memberof OpenAIApi
         */
        createChatCompletion(createChatCompletionRequest, options) {
          return exports
            .OpenAIApiFp(this.configuration)
            .createChatCompletion(createChatCompletionRequest, options)
            .then((request) => request(this.axios, this.basePath));
        }
        /**
         *
         * @summary Classifies the specified `query` using provided examples.  The endpoint first [searches](/docs/api-reference/searches) over the labeled examples to select the ones most relevant for the particular query. Then, the relevant examples are combined with the query to construct a prompt to produce the final label via the [completions](/docs/api-reference/completions) endpoint.  Labeled examples can be provided via an uploaded `file`, or explicitly listed in the request using the `examples` parameter for quick tests and small scale use cases.
         * @param {CreateClassificationRequest} createClassificationRequest
         * @param {*} [options] Override http request option.
         * @deprecated
         * @throws {RequiredError}
         * @memberof OpenAIApi
         */
        createClassification(createClassificationRequest, options) {
          return exports
            .OpenAIApiFp(this.configuration)
            .createClassification(createClassificationRequest, options)
            .then((request) => request(this.axios, this.basePath));
        }
        /**
         *
         * @summary Creates a completion for the provided prompt and parameters.
         * @param {CreateCompletionRequest} createCompletionRequest
         * @param {*} [options] Override http request option.
         * @throws {RequiredError}
         * @memberof OpenAIApi
         */
        createCompletion(createCompletionRequest, options) {
          return exports
            .OpenAIApiFp(this.configuration)
            .createCompletion(createCompletionRequest, options)
            .then((request) => request(this.axios, this.basePath));
        }
        /**
         *
         * @summary Creates a new edit for the provided input, instruction, and parameters.
         * @param {CreateEditRequest} createEditRequest
         * @param {*} [options] Override http request option.
         * @throws {RequiredError}
         * @memberof OpenAIApi
         */
        createEdit(createEditRequest, options) {
          return exports
            .OpenAIApiFp(this.configuration)
            .createEdit(createEditRequest, options)
            .then((request) => request(this.axios, this.basePath));
        }
        /**
         *
         * @summary Creates an embedding vector representing the input text.
         * @param {CreateEmbeddingRequest} createEmbeddingRequest
         * @param {*} [options] Override http request option.
         * @throws {RequiredError}
         * @memberof OpenAIApi
         */
        createEmbedding(createEmbeddingRequest, options) {
          return exports
            .OpenAIApiFp(this.configuration)
            .createEmbedding(createEmbeddingRequest, options)
            .then((request) => request(this.axios, this.basePath));
        }
        /**
         *
         * @summary Upload a file that contains document(s) to be used across various endpoints/features. Currently, the size of all the files uploaded by one organization can be up to 1 GB. Please contact us if you need to increase the storage limit.
         * @param {File} file Name of the [JSON Lines](https://jsonlines.readthedocs.io/en/latest/) file to be uploaded.  If the &#x60;purpose&#x60; is set to \\\&quot;fine-tune\\\&quot;, each line is a JSON record with \\\&quot;prompt\\\&quot; and \\\&quot;completion\\\&quot; fields representing your [training examples](/docs/guides/fine-tuning/prepare-training-data).
         * @param {string} purpose The intended purpose of the uploaded documents.  Use \\\&quot;fine-tune\\\&quot; for [Fine-tuning](/docs/api-reference/fine-tunes). This allows us to validate the format of the uploaded file.
         * @param {*} [options] Override http request option.
         * @throws {RequiredError}
         * @memberof OpenAIApi
         */
        createFile(file, purpose, options) {
          return exports
            .OpenAIApiFp(this.configuration)
            .createFile(file, purpose, options)
            .then((request) => request(this.axios, this.basePath));
        }
        /**
         *
         * @summary Creates a job that fine-tunes a specified model from a given dataset.  Response includes details of the enqueued job including job status and the name of the fine-tuned models once complete.  [Learn more about Fine-tuning](/docs/guides/fine-tuning)
         * @param {CreateFineTuneRequest} createFineTuneRequest
         * @param {*} [options] Override http request option.
         * @throws {RequiredError}
         * @memberof OpenAIApi
         */
        createFineTune(createFineTuneRequest, options) {
          return exports
            .OpenAIApiFp(this.configuration)
            .createFineTune(createFineTuneRequest, options)
            .then((request) => request(this.axios, this.basePath));
        }
        /**
         *
         * @summary Creates an image given a prompt.
         * @param {CreateImageRequest} createImageRequest
         * @param {*} [options] Override http request option.
         * @throws {RequiredError}
         * @memberof OpenAIApi
         */
        createImage(createImageRequest, options) {
          return exports
            .OpenAIApiFp(this.configuration)
            .createImage(createImageRequest, options)
            .then((request) => request(this.axios, this.basePath));
        }
        /**
         *
         * @summary Creates an edited or extended image given an original image and a prompt.
         * @param {File} image The image to edit. Must be a valid PNG file, less than 4MB, and square. If mask is not provided, image must have transparency, which will be used as the mask.
         * @param {string} prompt A text description of the desired image(s). The maximum length is 1000 characters.
         * @param {File} [mask] An additional image whose fully transparent areas (e.g. where alpha is zero) indicate where &#x60;image&#x60; should be edited. Must be a valid PNG file, less than 4MB, and have the same dimensions as &#x60;image&#x60;.
         * @param {number} [n] The number of images to generate. Must be between 1 and 10.
         * @param {string} [size] The size of the generated images. Must be one of &#x60;256x256&#x60;, &#x60;512x512&#x60;, or &#x60;1024x1024&#x60;.
         * @param {string} [responseFormat] The format in which the generated images are returned. Must be one of &#x60;url&#x60; or &#x60;b64_json&#x60;.
         * @param {string} [user] A unique identifier representing your end-user, which can help OpenAI to monitor and detect abuse. [Learn more](/docs/guides/safety-best-practices/end-user-ids).
         * @param {*} [options] Override http request option.
         * @throws {RequiredError}
         * @memberof OpenAIApi
         */
        createImageEdit(
          image,
          prompt,
          mask,
          n,
          size,
          responseFormat,
          user,
          options,
        ) {
          return exports
            .OpenAIApiFp(this.configuration)
            .createImageEdit(
              image,
              prompt,
              mask,
              n,
              size,
              responseFormat,
              user,
              options,
            )
            .then((request) => request(this.axios, this.basePath));
        }
        /**
         *
         * @summary Creates a variation of a given image.
         * @param {File} image The image to use as the basis for the variation(s). Must be a valid PNG file, less than 4MB, and square.
         * @param {number} [n] The number of images to generate. Must be between 1 and 10.
         * @param {string} [size] The size of the generated images. Must be one of &#x60;256x256&#x60;, &#x60;512x512&#x60;, or &#x60;1024x1024&#x60;.
         * @param {string} [responseFormat] The format in which the generated images are returned. Must be one of &#x60;url&#x60; or &#x60;b64_json&#x60;.
         * @param {string} [user] A unique identifier representing your end-user, which can help OpenAI to monitor and detect abuse. [Learn more](/docs/guides/safety-best-practices/end-user-ids).
         * @param {*} [options] Override http request option.
         * @throws {RequiredError}
         * @memberof OpenAIApi
         */
        createImageVariation(image, n, size, responseFormat, user, options) {
          return exports
            .OpenAIApiFp(this.configuration)
            .createImageVariation(image, n, size, responseFormat, user, options)
            .then((request) => request(this.axios, this.basePath));
        }
        /**
         *
         * @summary Classifies if text violates OpenAI\'s Content Policy
         * @param {CreateModerationRequest} createModerationRequest
         * @param {*} [options] Override http request option.
         * @throws {RequiredError}
         * @memberof OpenAIApi
         */
        createModeration(createModerationRequest, options) {
          return exports
            .OpenAIApiFp(this.configuration)
            .createModeration(createModerationRequest, options)
            .then((request) => request(this.axios, this.basePath));
        }
        /**
         *
         * @summary The search endpoint computes similarity scores between provided query and documents. Documents can be passed directly to the API if there are no more than 200 of them.  To go beyond the 200 document limit, documents can be processed offline and then used for efficient retrieval at query time. When `file` is set, the search endpoint searches over all the documents in the given file and returns up to the `max_rerank` number of documents. These documents will be returned along with their search scores.  The similarity score is a positive score that usually ranges from 0 to 300 (but can sometimes go higher), where a score above 200 usually means the document is semantically similar to the query.
         * @param {string} engineId The ID of the engine to use for this request.  You can select one of &#x60;ada&#x60;, &#x60;babbage&#x60;, &#x60;curie&#x60;, or &#x60;davinci&#x60;.
         * @param {CreateSearchRequest} createSearchRequest
         * @param {*} [options] Override http request option.
         * @deprecated
         * @throws {RequiredError}
         * @memberof OpenAIApi
         */
        createSearch(engineId, createSearchRequest, options) {
          return exports
            .OpenAIApiFp(this.configuration)
            .createSearch(engineId, createSearchRequest, options)
            .then((request) => request(this.axios, this.basePath));
        }
        /**
         *
         * @summary Transcribes audio into the input language.
         * @param {File} file The audio file object (not file name) to transcribe, in one of these formats: mp3, mp4, mpeg, mpga, m4a, wav, or webm.
         * @param {string} model ID of the model to use. Only &#x60;whisper-1&#x60; is currently available.
         * @param {string} [prompt] An optional text to guide the model\\\&#39;s style or continue a previous audio segment. The [prompt](/docs/guides/speech-to-text/prompting) should match the audio language.
         * @param {string} [responseFormat] The format of the transcript output, in one of these options: json, text, srt, verbose_json, or vtt.
         * @param {number} [temperature] The sampling temperature, between 0 and 1. Higher values like 0.8 will make the output more random, while lower values like 0.2 will make it more focused and deterministic. If set to 0, the model will use [log probability](https://en.wikipedia.org/wiki/Log_probability) to automatically increase the temperature until certain thresholds are hit.
         * @param {string} [language] The language of the input audio. Supplying the input language in [ISO-639-1](https://en.wikipedia.org/wiki/List_of_ISO_639-1_codes) format will improve accuracy and latency.
         * @param {*} [options] Override http request option.
         * @throws {RequiredError}
         * @memberof OpenAIApi
         */
        createTranscription(
          file,
          model,
          prompt,
          responseFormat,
          temperature,
          language,
          options,
        ) {
          return exports
            .OpenAIApiFp(this.configuration)
            .createTranscription(
              file,
              model,
              prompt,
              responseFormat,
              temperature,
              language,
              options,
            )
            .then((request) => request(this.axios, this.basePath));
        }
        /**
         *
         * @summary Translates audio into into English.
         * @param {File} file The audio file object (not file name) translate, in one of these formats: mp3, mp4, mpeg, mpga, m4a, wav, or webm.
         * @param {string} model ID of the model to use. Only &#x60;whisper-1&#x60; is currently available.
         * @param {string} [prompt] An optional text to guide the model\\\&#39;s style or continue a previous audio segment. The [prompt](/docs/guides/speech-to-text/prompting) should be in English.
         * @param {string} [responseFormat] The format of the transcript output, in one of these options: json, text, srt, verbose_json, or vtt.
         * @param {number} [temperature] The sampling temperature, between 0 and 1. Higher values like 0.8 will make the output more random, while lower values like 0.2 will make it more focused and deterministic. If set to 0, the model will use [log probability](https://en.wikipedia.org/wiki/Log_probability) to automatically increase the temperature until certain thresholds are hit.
         * @param {*} [options] Override http request option.
         * @throws {RequiredError}
         * @memberof OpenAIApi
         */
        createTranslation(
          file,
          model,
          prompt,
          responseFormat,
          temperature,
          options,
        ) {
          return exports
            .OpenAIApiFp(this.configuration)
            .createTranslation(
              file,
              model,
              prompt,
              responseFormat,
              temperature,
              options,
            )
            .then((request) => request(this.axios, this.basePath));
        }
        /**
         *
         * @summary Delete a file.
         * @param {string} fileId The ID of the file to use for this request
         * @param {*} [options] Override http request option.
         * @throws {RequiredError}
         * @memberof OpenAIApi
         */
        deleteFile(fileId, options) {
          return exports
            .OpenAIApiFp(this.configuration)
            .deleteFile(fileId, options)
            .then((request) => request(this.axios, this.basePath));
        }
        /**
         *
         * @summary Delete a fine-tuned model. You must have the Owner role in your organization.
         * @param {string} model The model to delete
         * @param {*} [options] Override http request option.
         * @throws {RequiredError}
         * @memberof OpenAIApi
         */
        deleteModel(model, options) {
          return exports
            .OpenAIApiFp(this.configuration)
            .deleteModel(model, options)
            .then((request) => request(this.axios, this.basePath));
        }
        /**
         *
         * @summary Returns the contents of the specified file
         * @param {string} fileId The ID of the file to use for this request
         * @param {*} [options] Override http request option.
         * @throws {RequiredError}
         * @memberof OpenAIApi
         */
        downloadFile(fileId, options) {
          return exports
            .OpenAIApiFp(this.configuration)
            .downloadFile(fileId, options)
            .then((request) => request(this.axios, this.basePath));
        }
        /**
         *
         * @summary Lists the currently available (non-finetuned) models, and provides basic information about each one such as the owner and availability.
         * @param {*} [options] Override http request option.
         * @deprecated
         * @throws {RequiredError}
         * @memberof OpenAIApi
         */
        listEngines(options) {
          return exports
            .OpenAIApiFp(this.configuration)
            .listEngines(options)
            .then((request) => request(this.axios, this.basePath));
        }
        /**
         *
         * @summary Returns a list of files that belong to the user\'s organization.
         * @param {*} [options] Override http request option.
         * @throws {RequiredError}
         * @memberof OpenAIApi
         */
        listFiles(options) {
          return exports
            .OpenAIApiFp(this.configuration)
            .listFiles(options)
            .then((request) => request(this.axios, this.basePath));
        }
        /**
         *
         * @summary Get fine-grained status updates for a fine-tune job.
         * @param {string} fineTuneId The ID of the fine-tune job to get events for.
         * @param {boolean} [stream] Whether to stream events for the fine-tune job. If set to true, events will be sent as data-only [server-sent events](https://developer.mozilla.org/en-US/docs/Web/API/Server-sent_events/Using_server-sent_events#Event_stream_format) as they become available. The stream will terminate with a &#x60;data: [DONE]&#x60; message when the job is finished (succeeded, cancelled, or failed).  If set to false, only events generated so far will be returned.
         * @param {*} [options] Override http request option.
         * @throws {RequiredError}
         * @memberof OpenAIApi
         */
        listFineTuneEvents(fineTuneId, stream, options) {
          return exports
            .OpenAIApiFp(this.configuration)
            .listFineTuneEvents(fineTuneId, stream, options)
            .then((request) => request(this.axios, this.basePath));
        }
        /**
         *
         * @summary List your organization\'s fine-tuning jobs
         * @param {*} [options] Override http request option.
         * @throws {RequiredError}
         * @memberof OpenAIApi
         */
        listFineTunes(options) {
          return exports
            .OpenAIApiFp(this.configuration)
            .listFineTunes(options)
            .then((request) => request(this.axios, this.basePath));
        }
        /**
         *
         * @summary Lists the currently available models, and provides basic information about each one such as the owner and availability.
         * @param {*} [options] Override http request option.
         * @throws {RequiredError}
         * @memberof OpenAIApi
         */
        listModels(options) {
          return exports
            .OpenAIApiFp(this.configuration)
            .listModels(options)
            .then((request) => request(this.axios, this.basePath));
        }
        /**
         *
         * @summary Retrieves a model instance, providing basic information about it such as the owner and availability.
         * @param {string} engineId The ID of the engine to use for this request
         * @param {*} [options] Override http request option.
         * @deprecated
         * @throws {RequiredError}
         * @memberof OpenAIApi
         */
        retrieveEngine(engineId, options) {
          return exports
            .OpenAIApiFp(this.configuration)
            .retrieveEngine(engineId, options)
            .then((request) => request(this.axios, this.basePath));
        }
        /**
         *
         * @summary Returns information about a specific file.
         * @param {string} fileId The ID of the file to use for this request
         * @param {*} [options] Override http request option.
         * @throws {RequiredError}
         * @memberof OpenAIApi
         */
        retrieveFile(fileId, options) {
          return exports
            .OpenAIApiFp(this.configuration)
            .retrieveFile(fileId, options)
            .then((request) => request(this.axios, this.basePath));
        }
        /**
         *
         * @summary Gets info about the fine-tune job.  [Learn more about Fine-tuning](/docs/guides/fine-tuning)
         * @param {string} fineTuneId The ID of the fine-tune job
         * @param {*} [options] Override http request option.
         * @throws {RequiredError}
         * @memberof OpenAIApi
         */
        retrieveFineTune(fineTuneId, options) {
          return exports
            .OpenAIApiFp(this.configuration)
            .retrieveFineTune(fineTuneId, options)
            .then((request) => request(this.axios, this.basePath));
        }
        /**
         *
         * @summary Retrieves a model instance, providing basic information about the model such as the owner and permissioning.
         * @param {string} model The ID of the model to use for this request
         * @param {*} [options] Override http request option.
         * @throws {RequiredError}
         * @memberof OpenAIApi
         */
        retrieveModel(model, options) {
          return exports
            .OpenAIApiFp(this.configuration)
            .retrieveModel(model, options)
            .then((request) => request(this.axios, this.basePath));
        }
      }
      exports.OpenAIApi = OpenAIApi;

      /***/
    },

    /***/ 6654: /***/ (
      __unused_webpack_module,
      exports,
      __nccwpck_require__,
    ) => {
      "use strict";

      /* tslint:disable */
      /* eslint-disable */
      /**
       * OpenAI API
       * APIs for sampling from and fine-tuning language models
       *
       * The version of the OpenAPI document: 1.3.0
       *
       *
       * NOTE: This class is auto generated by OpenAPI Generator (https://openapi-generator.tech).
       * https://openapi-generator.tech
       * Do not edit the class manually.
       */
      Object.defineProperty(exports, "__esModule", { value: true });
      exports.RequiredError =
        exports.BaseAPI =
        exports.COLLECTION_FORMATS =
        exports.BASE_PATH =
          void 0;
      const axios_1 = __nccwpck_require__(2748);
      exports.BASE_PATH = "https://api.openai.com/v1".replace(/\/+$/, "");
      /**
       *
       * @export
       */
      exports.COLLECTION_FORMATS = {
        csv: ",",
        ssv: " ",
        tsv: "\t",
        pipes: "|",
      };
      /**
       *
       * @export
       * @class BaseAPI
       */
      class BaseAPI {
        constructor(
          configuration,
          basePath = exports.BASE_PATH,
          axios = axios_1.default,
        ) {
          this.basePath = basePath;
          this.axios = axios;
          if (configuration) {
            this.configuration = configuration;
            this.basePath = configuration.basePath || this.basePath;
          }
        }
      }
      exports.BaseAPI = BaseAPI;
      /**
       *
       * @export
       * @class RequiredError
       * @extends {Error}
       */
      class RequiredError extends Error {
        constructor(field, msg) {
          super(msg);
          this.field = field;
          this.name = "RequiredError";
        }
      }
      exports.RequiredError = RequiredError;

      /***/
    },

    /***/ 9311: /***/ function (
      __unused_webpack_module,
      exports,
      __nccwpck_require__,
    ) {
      "use strict";

      /* tslint:disable */
      /* eslint-disable */
      /**
       * OpenAI API
       * APIs for sampling from and fine-tuning language models
       *
       * The version of the OpenAPI document: 1.3.0
       *
       *
       * NOTE: This class is auto generated by OpenAPI Generator (https://openapi-generator.tech).
       * https://openapi-generator.tech
       * Do not edit the class manually.
       */
      var __awaiter =
        (this && this.__awaiter) ||
        function (thisArg, _arguments, P, generator) {
          function adopt(value) {
            return value instanceof P
              ? value
              : new P(function (resolve) {
                  resolve(value);
                });
          }
          return new (P || (P = Promise))(function (resolve, reject) {
            function fulfilled(value) {
              try {
                step(generator.next(value));
              } catch (e) {
                reject(e);
              }
            }
            function rejected(value) {
              try {
                step(generator["throw"](value));
              } catch (e) {
                reject(e);
              }
            }
            function step(result) {
              result.done
                ? resolve(result.value)
                : adopt(result.value).then(fulfilled, rejected);
            }
            step(
              (generator = generator.apply(thisArg, _arguments || [])).next(),
            );
          });
        };
      Object.defineProperty(exports, "__esModule", { value: true });
      exports.createRequestFunction =
        exports.toPathString =
        exports.serializeDataIfNeeded =
        exports.setSearchParams =
        exports.setOAuthToObject =
        exports.setBearerAuthToObject =
        exports.setBasicAuthToObject =
        exports.setApiKeyToObject =
        exports.assertParamExists =
        exports.DUMMY_BASE_URL =
          void 0;
      const base_1 = __nccwpck_require__(6654);
      /**
       *
       * @export
       */
      exports.DUMMY_BASE_URL = "https://example.com";
      /**
       *
       * @throws {RequiredError}
       * @export
       */
      exports.assertParamExists = function (
        functionName,
        paramName,
        paramValue,
      ) {
        if (paramValue === null || paramValue === undefined) {
          throw new base_1.RequiredError(
            paramName,
            `Required parameter ${paramName} was null or undefined when calling ${functionName}.`,
          );
        }
      };
      /**
       *
       * @export
       */
      exports.setApiKeyToObject = function (
        object,
        keyParamName,
        configuration,
      ) {
        return __awaiter(this, void 0, void 0, function* () {
          if (configuration && configuration.apiKey) {
            const localVarApiKeyValue =
              typeof configuration.apiKey === "function"
                ? yield configuration.apiKey(keyParamName)
                : yield configuration.apiKey;
            object[keyParamName] = localVarApiKeyValue;
          }
        });
      };
      /**
       *
       * @export
       */
      exports.setBasicAuthToObject = function (object, configuration) {
        if (
          configuration &&
          (configuration.username || configuration.password)
        ) {
          object["auth"] = {
            username: configuration.username,
            password: configuration.password,
          };
        }
      };
      /**
       *
       * @export
       */
      exports.setBearerAuthToObject = function (object, configuration) {
        return __awaiter(this, void 0, void 0, function* () {
          if (configuration && configuration.accessToken) {
            const accessToken =
              typeof configuration.accessToken === "function"
                ? yield configuration.accessToken()
                : yield configuration.accessToken;
            object["Authorization"] = "Bearer " + accessToken;
          }
        });
      };
      /**
       *
       * @export
       */
      exports.setOAuthToObject = function (
        object,
        name,
        scopes,
        configuration,
      ) {
        return __awaiter(this, void 0, void 0, function* () {
          if (configuration && configuration.accessToken) {
            const localVarAccessTokenValue =
              typeof configuration.accessToken === "function"
                ? yield configuration.accessToken(name, scopes)
                : yield configuration.accessToken;
            object["Authorization"] = "Bearer " + localVarAccessTokenValue;
          }
        });
      };
      function setFlattenedQueryParams(urlSearchParams, parameter, key = "") {
        if (parameter == null) return;
        if (typeof parameter === "object") {
          if (Array.isArray(parameter)) {
            parameter.forEach((item) =>
              setFlattenedQueryParams(urlSearchParams, item, key),
            );
          } else {
            Object.keys(parameter).forEach((currentKey) =>
              setFlattenedQueryParams(
                urlSearchParams,
                parameter[currentKey],
                `${key}${key !== "" ? "." : ""}${currentKey}`,
              ),
            );
          }
        } else {
          if (urlSearchParams.has(key)) {
            urlSearchParams.append(key, parameter);
          } else {
            urlSearchParams.set(key, parameter);
          }
        }
      }
      /**
       *
       * @export
       */
      exports.setSearchParams = function (url, ...objects) {
        const searchParams = new URLSearchParams(url.search);
        setFlattenedQueryParams(searchParams, objects);
        url.search = searchParams.toString();
      };
      /**
       *
       * @export
       */
      exports.serializeDataIfNeeded = function (
        value,
        requestOptions,
        configuration,
      ) {
        const nonString = typeof value !== "string";
        const needsSerialization =
          nonString && configuration && configuration.isJsonMime
            ? configuration.isJsonMime(requestOptions.headers["Content-Type"])
            : nonString;
        return needsSerialization
          ? JSON.stringify(value !== undefined ? value : {})
          : value || "";
      };
      /**
       *
       * @export
       */
      exports.toPathString = function (url) {
        return url.pathname + url.search + url.hash;
      };
      /**
       *
       * @export
       */
      exports.createRequestFunction = function (
        axiosArgs,
        globalAxios,
        BASE_PATH,
        configuration,
      ) {
        return (axios = globalAxios, basePath = BASE_PATH) => {
          const axiosRequestArgs = Object.assign(
            Object.assign({}, axiosArgs.options),
            {
              url:
                ((configuration === null || configuration === void 0
                  ? void 0
                  : configuration.basePath) || basePath) + axiosArgs.url,
            },
          );
          return axios.request(axiosRequestArgs);
        };
      };

      /***/
    },

    /***/ 6077: /***/ (
      __unused_webpack_module,
      exports,
      __nccwpck_require__,
    ) => {
      "use strict";

      /* tslint:disable */
      /* eslint-disable */
      /**
       * OpenAI API
       * APIs for sampling from and fine-tuning language models
       *
       * The version of the OpenAPI document: 1.3.0
       *
       *
       * NOTE: This class is auto generated by OpenAPI Generator (https://openapi-generator.tech).
       * https://openapi-generator.tech
       * Do not edit the class manually.
       */
      Object.defineProperty(exports, "__esModule", { value: true });
      exports.Configuration = void 0;
      const packageJson = __nccwpck_require__(7003);
      class Configuration {
        constructor(param = {}) {
          this.apiKey = param.apiKey;
          this.organization = param.organization;
          this.username = param.username;
          this.password = param.password;
          this.accessToken = param.accessToken;
          this.basePath = param.basePath;
          this.baseOptions = param.baseOptions;
          this.formDataCtor = param.formDataCtor;
          if (!this.baseOptions) {
            this.baseOptions = {};
          }
          this.baseOptions.headers = Object.assign(
            {
              "User-Agent": `OpenAI/NodeJS/${packageJson.version}`,
              Authorization: `Bearer ${this.apiKey}`,
            },
            this.baseOptions.headers,
          );
          if (this.organization) {
            this.baseOptions.headers["OpenAI-Organization"] = this.organization;
          }
          if (!this.formDataCtor) {
            this.formDataCtor = __nccwpck_require__(6872);
          }
        }
        /**
         * Check if the given MIME is a JSON MIME.
         * JSON MIME examples:
         *   application/json
         *   application/json; charset=UTF8
         *   APPLICATION/JSON
         *   application/vnd.company+json
         * @param mime - MIME (Multipurpose Internet Mail Extensions)
         * @return True if the given MIME is JSON, false otherwise.
         */
        isJsonMime(mime) {
          const jsonMime = new RegExp(
            "^(application/json|[^;/ \t]+/[^;/ \t]+[+]json)[ \t]*(;.*)?$",
            "i",
          );
          return (
            mime !== null &&
            (jsonMime.test(mime) ||
              mime.toLowerCase() === "application/json-patch+json")
          );
        }
      }
      exports.Configuration = Configuration;

      /***/
    },

    /***/ 4096: /***/ function (
      __unused_webpack_module,
      exports,
      __nccwpck_require__,
    ) {
      "use strict";

      /* tslint:disable */
      /* eslint-disable */
      /**
       * OpenAI API
       * APIs for sampling from and fine-tuning language models
       *
       * The version of the OpenAPI document: 1.3.0
       *
       *
       * NOTE: This class is auto generated by OpenAPI Generator (https://openapi-generator.tech).
       * https://openapi-generator.tech
       * Do not edit the class manually.
       */
      var __createBinding =
        (this && this.__createBinding) ||
        (Object.create
          ? function (o, m, k, k2) {
              if (k2 === undefined) k2 = k;
              Object.defineProperty(o, k2, {
                enumerable: true,
                get: function () {
                  return m[k];
                },
              });
            }
          : function (o, m, k, k2) {
              if (k2 === undefined) k2 = k;
              o[k2] = m[k];
            });
      var __exportStar =
        (this && this.__exportStar) ||
        function (m, exports) {
          for (var p in m)
            if (p !== "default" && !exports.hasOwnProperty(p))
              __createBinding(exports, m, p);
        };
      Object.defineProperty(exports, "__esModule", { value: true });
      __exportStar(__nccwpck_require__(4494), exports);
      __exportStar(__nccwpck_require__(6077), exports);

      /***/
    },

    /***/ 2347: /***/ (module) => {
      "use strict";
      function _typeof(obj) {
        "@babel/helpers - typeof";
        return (
          (_typeof =
            "function" == typeof Symbol && "symbol" == typeof Symbol.iterator
              ? function (obj) {
                  return typeof obj;
                }
              : function (obj) {
                  return obj &&
                    "function" == typeof Symbol &&
                    obj.constructor === Symbol &&
                    obj !== Symbol.prototype
                    ? "symbol"
                    : typeof obj;
                }),
          _typeof(obj)
        );
      }
      function _createForOfIteratorHelper(o, allowArrayLike) {
        var it =
          (typeof Symbol !== "undefined" && o[Symbol.iterator]) ||
          o["@@iterator"];
        if (!it) {
          if (
            Array.isArray(o) ||
            (it = _unsupportedIterableToArray(o)) ||
            (allowArrayLike && o && typeof o.length === "number")
          ) {
            if (it) o = it;
            var i = 0;
            var F = function F() {};
            return {
              s: F,
              n: function n() {
                if (i >= o.length) return { done: true };
                return { done: false, value: o[i++] };
              },
              e: function e(_e2) {
                throw _e2;
              },
              f: F,
            };
          }
          throw new TypeError(
            "Invalid attempt to iterate non-iterable instance.\nIn order to be iterable, non-array objects must have a [Symbol.iterator]() method.",
          );
        }
        var normalCompletion = true,
          didErr = false,
          err;
        return {
          s: function s() {
            it = it.call(o);
          },
          n: function n() {
            var step = it.next();
            normalCompletion = step.done;
            return step;
          },
          e: function e(_e3) {
            didErr = true;
            err = _e3;
          },
          f: function f() {
            try {
              if (!normalCompletion && it["return"] != null) it["return"]();
            } finally {
              if (didErr) throw err;
            }
          },
        };
      }
      function _defineProperty(obj, key, value) {
        key = _toPropertyKey(key);
        if (key in obj) {
          Object.defineProperty(obj, key, {
            value: value,
            enumerable: true,
            configurable: true,
            writable: true,
          });
        } else {
          obj[key] = value;
        }
        return obj;
      }
      function _toPropertyKey(arg) {
        var key = _toPrimitive(arg, "string");
        return _typeof(key) === "symbol" ? key : String(key);
      }
      function _toPrimitive(input, hint) {
        if (_typeof(input) !== "object" || input === null) return input;
        var prim = input[Symbol.toPrimitive];
        if (prim !== undefined) {
          var res = prim.call(input, hint || "default");
          if (_typeof(res) !== "object") return res;
          throw new TypeError("@@toPrimitive must return a primitive value.");
        }
        return (hint === "string" ? String : Number)(input);
      }
      function _slicedToArray(arr, i) {
        return (
          _arrayWithHoles(arr) ||
          _iterableToArrayLimit(arr, i) ||
          _unsupportedIterableToArray(arr, i) ||
          _nonIterableRest()
        );
      }
      function _nonIterableRest() {
        throw new TypeError(
          "Invalid attempt to destructure non-iterable instance.\nIn order to be iterable, non-array objects must have a [Symbol.iterator]() method.",
        );
      }
      function _unsupportedIterableToArray(o, minLen) {
        if (!o) return;
        if (typeof o === "string") return _arrayLikeToArray(o, minLen);
        var n = Object.prototype.toString.call(o).slice(8, -1);
        if (n === "Object" && o.constructor) n = o.constructor.name;
        if (n === "Map" || n === "Set") return Array.from(o);
        if (
          n === "Arguments" ||
          /^(?:Ui|I)nt(?:8|16|32)(?:Clamped)?Array$/.test(n)
        )
          return _arrayLikeToArray(o, minLen);
      }
      function _arrayLikeToArray(arr, len) {
        if (len == null || len > arr.length) len = arr.length;
        for (var i = 0, arr2 = new Array(len); i < len; i++) {
          arr2[i] = arr[i];
        }
        return arr2;
      }
      function _iterableToArrayLimit(arr, i) {
        var _i =
          null == arr
            ? null
            : ("undefined" != typeof Symbol && arr[Symbol.iterator]) ||
              arr["@@iterator"];
        if (null != _i) {
          var _s,
            _e,
            _x,
            _r,
            _arr = [],
            _n = !0,
            _d = !1;
          try {
            if (((_x = (_i = _i.call(arr)).next), 0 === i)) {
              if (Object(_i) !== _i) return;
              _n = !1;
            } else
              for (
                ;
                !(_n = (_s = _x.call(_i)).done) &&
                (_arr.push(_s.value), _arr.length !== i);
                _n = !0
              ) {}
          } catch (err) {
            (_d = !0), (_e = err);
          } finally {
            try {
              if (
                !_n &&
                null != _i["return"] &&
                ((_r = _i["return"]()), Object(_r) !== _r)
              )
                return;
            } finally {
              if (_d) throw _e;
            }
          }
          return _arr;
        }
      }
      function _arrayWithHoles(arr) {
        if (Array.isArray(arr)) return arr;
      }
      module.exports = function (input) {
        if (!input) return [];
        if (typeof input !== "string" || input.match(/^\s+$/)) return [];
        var lines = input.split("\n");
        if (lines.length === 0) return [];
        var files = [];
        var currentFile = null;
        var currentChunk = null;
        var deletedLineCounter = 0;
        var addedLineCounter = 0;
        var currentFileChanges = null;
        var normal = function normal(line) {
          var _currentChunk;
          (_currentChunk = currentChunk) === null || _currentChunk === void 0
            ? void 0
            : _currentChunk.changes.push({
                type: "normal",
                normal: true,
                ln1: deletedLineCounter++,
                ln2: addedLineCounter++,
                content: line,
              });
          currentFileChanges.oldLines--;
          currentFileChanges.newLines--;
        };
        var start = function start(line) {
          var _parseFiles;
          var _ref =
              (_parseFiles = parseFiles(line)) !== null &&
              _parseFiles !== void 0
                ? _parseFiles
                : [],
            _ref2 = _slicedToArray(_ref, 2),
            fromFileName = _ref2[0],
            toFileName = _ref2[1];
          currentFile = {
            chunks: [],
            deletions: 0,
            additions: 0,
            from: fromFileName,
            to: toFileName,
          };
          files.push(currentFile);
        };
        var restart = function restart() {
          if (!currentFile || currentFile.chunks.length) start();
        };
        var newFile = function newFile(_, match) {
          restart();
          currentFile["new"] = true;
          currentFile.newMode = match[1];
          currentFile.from = "/dev/null";
        };
        var deletedFile = function deletedFile(_, match) {
          restart();
          currentFile.deleted = true;
          currentFile.oldMode = match[1];
          currentFile.to = "/dev/null";
        };
        var oldMode = function oldMode(_, match) {
          restart();
          currentFile.oldMode = match[1];
        };
        var newMode = function newMode(_, match) {
          restart();
          currentFile.newMode = match[1];
        };
        var index = function index(line, match) {
          restart();
          currentFile.index = line.split(" ").slice(1);
          if (match[1]) {
            currentFile.oldMode = currentFile.newMode = match[1].trim();
          }
        };
        var fromFile = function fromFile(line) {
          restart();
          currentFile.from = parseOldOrNewFile(line);
        };
        var toFile = function toFile(line) {
          restart();
          currentFile.to = parseOldOrNewFile(line);
        };
        var toNumOfLines = function toNumOfLines(number) {
          return +(number || 1);
        };
        var chunk = function chunk(line, match) {
          if (!currentFile) {
            start(line);
          }
          var _match$slice = match.slice(1),
            _match$slice2 = _slicedToArray(_match$slice, 4),
            oldStart = _match$slice2[0],
            oldNumLines = _match$slice2[1],
            newStart = _match$slice2[2],
            newNumLines = _match$slice2[3];
          deletedLineCounter = +oldStart;
          addedLineCounter = +newStart;
          currentChunk = {
            content: line,
            changes: [],
            oldStart: +oldStart,
            oldLines: toNumOfLines(oldNumLines),
            newStart: +newStart,
            newLines: toNumOfLines(newNumLines),
          };
          currentFileChanges = {
            oldLines: toNumOfLines(oldNumLines),
            newLines: toNumOfLines(newNumLines),
          };
          currentFile.chunks.push(currentChunk);
        };
        var del = function del(line) {
          if (!currentChunk) return;
          currentChunk.changes.push({
            type: "del",
            del: true,
            ln: deletedLineCounter++,
            content: line,
          });
          currentFile.deletions++;
          currentFileChanges.oldLines--;
        };
        var add = function add(line) {
          if (!currentChunk) return;
          currentChunk.changes.push({
            type: "add",
            add: true,
            ln: addedLineCounter++,
            content: line,
          });
          currentFile.additions++;
          currentFileChanges.newLines--;
        };
        var eof = function eof(line) {
          var _currentChunk$changes3;
          if (!currentChunk) return;
          var _currentChunk$changes = currentChunk.changes.slice(-1),
            _currentChunk$changes2 = _slicedToArray(_currentChunk$changes, 1),
            mostRecentChange = _currentChunk$changes2[0];
          currentChunk.changes.push(
            ((_currentChunk$changes3 = { type: mostRecentChange.type }),
            _defineProperty(
              _currentChunk$changes3,
              mostRecentChange.type,
              true,
            ),
            _defineProperty(
              _currentChunk$changes3,
              "ln1",
              mostRecentChange.ln1,
            ),
            _defineProperty(
              _currentChunk$changes3,
              "ln2",
              mostRecentChange.ln2,
            ),
            _defineProperty(_currentChunk$changes3, "ln", mostRecentChange.ln),
            _defineProperty(_currentChunk$changes3, "content", line),
            _currentChunk$changes3),
          );
        };
        var schemaHeaders = [
          [/^diff\s/, start],
          [/^new file mode (\d+)$/, newFile],
          [/^deleted file mode (\d+)$/, deletedFile],
          [/^old mode (\d+)$/, oldMode],
          [/^new mode (\d+)$/, newMode],
          [/^index\s[\da-zA-Z]+\.\.[\da-zA-Z]+(\s(\d+))?$/, index],
          [/^---\s/, fromFile],
          [/^\+\+\+\s/, toFile],
          [/^@@\s+-(\d+),?(\d+)?\s+\+(\d+),?(\d+)?\s@@/, chunk],
          [/^\\ No newline at end of file$/, eof],
        ];
        var schemaContent = [
          [/^\\ No newline at end of file$/, eof],
          [/^-/, del],
          [/^\+/, add],
          [/^\s+/, normal],
        ];
        var parseContentLine = function parseContentLine(line) {
          for (
            var _i2 = 0, _schemaContent = schemaContent;
            _i2 < _schemaContent.length;
            _i2++
          ) {
            var _schemaContent$_i = _slicedToArray(_schemaContent[_i2], 2),
              pattern = _schemaContent$_i[0],
              handler = _schemaContent$_i[1];
            var match = line.match(pattern);
            if (match) {
              handler(line, match);
              break;
            }
          }
          if (
            currentFileChanges.oldLines === 0 &&
            currentFileChanges.newLines === 0
          ) {
            currentFileChanges = null;
          }
        };
        var parseHeaderLine = function parseHeaderLine(line) {
          for (
            var _i3 = 0, _schemaHeaders = schemaHeaders;
            _i3 < _schemaHeaders.length;
            _i3++
          ) {
            var _schemaHeaders$_i = _slicedToArray(_schemaHeaders[_i3], 2),
              pattern = _schemaHeaders$_i[0],
              handler = _schemaHeaders$_i[1];
            var match = line.match(pattern);
            if (match) {
              handler(line, match);
              break;
            }
          }
        };
        var parseLine = function parseLine(line) {
          if (currentFileChanges) {
            parseContentLine(line);
          } else {
            parseHeaderLine(line);
          }
          return;
        };
        var _iterator = _createForOfIteratorHelper(lines),
          _step;
        try {
          for (_iterator.s(); !(_step = _iterator.n()).done; ) {
            var line = _step.value;
            parseLine(line);
          }
        } catch (err) {
          _iterator.e(err);
        } finally {
          _iterator.f();
        }
        return files;
      };
      var fileNameDiffRegex =
        /(a|i|w|c|o|1|2)\/.*(?=["']? ["']?(b|i|w|c|o|1|2)\/)|(b|i|w|c|o|1|2)\/.*$/g;
      var gitFileHeaderRegex = /^(a|b|i|w|c|o|1|2)\//;
      var parseFiles = function parseFiles(line) {
        var fileNames =
          line === null || line === void 0
            ? void 0
            : line.match(fileNameDiffRegex);
        return fileNames === null || fileNames === void 0
          ? void 0
          : fileNames.map(function (fileName) {
              return fileName
                .replace(gitFileHeaderRegex, "")
                .replace(/("|')$/, "");
            });
      };
      var qoutedFileNameRegex = /^\\?['"]|\\?['"]$/g;
      var parseOldOrNewFile = function parseOldOrNewFile(line) {
        var fileName = leftTrimChars(line, "-+").trim();
        fileName = removeTimeStamp(fileName);
        return fileName
          .replace(qoutedFileNameRegex, "")
          .replace(gitFileHeaderRegex, "");
      };
      var leftTrimChars = function leftTrimChars(string, trimmingChars) {
        string = makeString(string);
        if (!trimmingChars && String.prototype.trimLeft)
          return string.trimLeft();
        var trimmingString = formTrimmingString(trimmingChars);
        return string.replace(new RegExp("^".concat(trimmingString, "+")), "");
      };
      var timeStampRegex =
        /\t.*|\d{4}-\d\d-\d\d\s\d\d:\d\d:\d\d(.\d+)?\s(\+|-)\d\d\d\d/;
      var removeTimeStamp = function removeTimeStamp(string) {
        var timeStamp = timeStampRegex.exec(string);
        if (timeStamp) {
          string = string.substring(0, timeStamp.index).trim();
        }
        return string;
      };
      var formTrimmingString = function formTrimmingString(trimmingChars) {
        if (trimmingChars === null || trimmingChars === undefined) return "\\s";
        else if (trimmingChars instanceof RegExp) return trimmingChars.source;
        return "[".concat(
          makeString(trimmingChars).replace(
            /([.*+?^=!:${}()|[\]/\\])/g,
            "\\$1",
          ),
          "]",
        );
      };
      var makeString = function makeString(itemToConvert) {
        return (
          (itemToConvert !== null && itemToConvert !== void 0
            ? itemToConvert
            : "") + ""
        );
      };

      /***/
    },

    /***/ 4249: /***/ (
      module,
      __unused_webpack_exports,
      __nccwpck_require__,
    ) => {
      module.exports = __nccwpck_require__(709);

      /***/
    },

    /***/ 709: /***/ (
      __unused_webpack_module,
      exports,
      __nccwpck_require__,
    ) => {
      "use strict";

      var net = __nccwpck_require__(1808);
      var tls = __nccwpck_require__(4404);
      var http = __nccwpck_require__(3685);
      var https = __nccwpck_require__(5687);
      var events = __nccwpck_require__(2361);
      var assert = __nccwpck_require__(9491);
      var util = __nccwpck_require__(3837);

      exports.httpOverHttp = httpOverHttp;
      exports.httpsOverHttp = httpsOverHttp;
      exports.httpOverHttps = httpOverHttps;
      exports.httpsOverHttps = httpsOverHttps;

      function httpOverHttp(options) {
        var agent = new TunnelingAgent(options);
        agent.request = http.request;
        return agent;
      }

      function httpsOverHttp(options) {
        var agent = new TunnelingAgent(options);
        agent.request = http.request;
        agent.createSocket = createSecureSocket;
        agent.defaultPort = 443;
        return agent;
      }

      function httpOverHttps(options) {
        var agent = new TunnelingAgent(options);
        agent.request = https.request;
        return agent;
      }

      function httpsOverHttps(options) {
        var agent = new TunnelingAgent(options);
        agent.request = https.request;
        agent.createSocket = createSecureSocket;
        agent.defaultPort = 443;
        return agent;
      }

      function TunnelingAgent(options) {
        var self = this;
        self.options = options || {};
        self.proxyOptions = self.options.proxy || {};
        self.maxSockets =
          self.options.maxSockets || http.Agent.defaultMaxSockets;
        self.requests = [];
        self.sockets = [];

        self.on("free", function onFree(socket, host, port, localAddress) {
          var options = toOptions(host, port, localAddress);
          for (var i = 0, len = self.requests.length; i < len; ++i) {
            var pending = self.requests[i];
            if (
              pending.host === options.host &&
              pending.port === options.port
            ) {
              // Detect the request to connect same origin server,
              // reuse the connection.
              self.requests.splice(i, 1);
              pending.request.onSocket(socket);
              return;
            }
          }
          socket.destroy();
          self.removeSocket(socket);
        });
      }
      util.inherits(TunnelingAgent, events.EventEmitter);

      TunnelingAgent.prototype.addRequest = function addRequest(
        req,
        host,
        port,
        localAddress,
      ) {
        var self = this;
        var options = mergeOptions(
          { request: req },
          self.options,
          toOptions(host, port, localAddress),
        );

        if (self.sockets.length >= this.maxSockets) {
          // We are over limit so we'll add it to the queue.
          self.requests.push(options);
          return;
        }

        // If we are under maxSockets create a new one.
        self.createSocket(options, function (socket) {
          socket.on("free", onFree);
          socket.on("close", onCloseOrRemove);
          socket.on("agentRemove", onCloseOrRemove);
          req.onSocket(socket);

          function onFree() {
            self.emit("free", socket, options);
          }

          function onCloseOrRemove(err) {
            self.removeSocket(socket);
            socket.removeListener("free", onFree);
            socket.removeListener("close", onCloseOrRemove);
            socket.removeListener("agentRemove", onCloseOrRemove);
          }
        });
      };

      TunnelingAgent.prototype.createSocket = function createSocket(
        options,
        cb,
      ) {
        var self = this;
        var placeholder = {};
        self.sockets.push(placeholder);

        var connectOptions = mergeOptions({}, self.proxyOptions, {
          method: "CONNECT",
          path: options.host + ":" + options.port,
          agent: false,
          headers: {
            host: options.host + ":" + options.port,
          },
        });
        if (options.localAddress) {
          connectOptions.localAddress = options.localAddress;
        }
        if (connectOptions.proxyAuth) {
          connectOptions.headers = connectOptions.headers || {};
          connectOptions.headers["Proxy-Authorization"] =
            "Basic " + new Buffer(connectOptions.proxyAuth).toString("base64");
        }

        debug("making CONNECT request");
        var connectReq = self.request(connectOptions);
        connectReq.useChunkedEncodingByDefault = false; // for v0.6
        connectReq.once("response", onResponse); // for v0.6
        connectReq.once("upgrade", onUpgrade); // for v0.6
        connectReq.once("connect", onConnect); // for v0.7 or later
        connectReq.once("error", onError);
        connectReq.end();

        function onResponse(res) {
          // Very hacky. This is necessary to avoid http-parser leaks.
          res.upgrade = true;
        }

        function onUpgrade(res, socket, head) {
          // Hacky.
          process.nextTick(function () {
            onConnect(res, socket, head);
          });
        }

        function onConnect(res, socket, head) {
          connectReq.removeAllListeners();
          socket.removeAllListeners();

          if (res.statusCode !== 200) {
            debug(
              "tunneling socket could not be established, statusCode=%d",
              res.statusCode,
            );
            socket.destroy();
            var error = new Error(
              "tunneling socket could not be established, " +
                "statusCode=" +
                res.statusCode,
            );
            error.code = "ECONNRESET";
            options.request.emit("error", error);
            self.removeSocket(placeholder);
            return;
          }
          if (head.length > 0) {
            debug("got illegal response body from proxy");
            socket.destroy();
            var error = new Error("got illegal response body from proxy");
            error.code = "ECONNRESET";
            options.request.emit("error", error);
            self.removeSocket(placeholder);
            return;
          }
          debug("tunneling connection has established");
          self.sockets[self.sockets.indexOf(placeholder)] = socket;
          return cb(socket);
        }

        function onError(cause) {
          connectReq.removeAllListeners();

          debug(
            "tunneling socket could not be established, cause=%s\n",
            cause.message,
            cause.stack,
          );
          var error = new Error(
            "tunneling socket could not be established, " +
              "cause=" +
              cause.message,
          );
          error.code = "ECONNRESET";
          options.request.emit("error", error);
          self.removeSocket(placeholder);
        }
      };

      TunnelingAgent.prototype.removeSocket = function removeSocket(socket) {
        var pos = this.sockets.indexOf(socket);
        if (pos === -1) {
          return;
        }
        this.sockets.splice(pos, 1);

        var pending = this.requests.shift();
        if (pending) {
          // If we have pending requests and a socket gets closed a new one
          // needs to be created to take over in the pool for the one that closed.
          this.createSocket(pending, function (socket) {
            pending.request.onSocket(socket);
          });
        }
      };

      function createSecureSocket(options, cb) {
        var self = this;
        TunnelingAgent.prototype.createSocket.call(
          self,
          options,
          function (socket) {
            var hostHeader = options.request.getHeader("host");
            var tlsOptions = mergeOptions({}, self.options, {
              socket: socket,
              servername: hostHeader
                ? hostHeader.replace(/:.*$/, "")
                : options.host,
            });

            // 0 is dummy port for v0.6
            var secureSocket = tls.connect(0, tlsOptions);
            self.sockets[self.sockets.indexOf(socket)] = secureSocket;
            cb(secureSocket);
          },
        );
      }

      function toOptions(host, port, localAddress) {
        if (typeof host === "string") {
          // since v0.10
          return {
            host: host,
            port: port,
            localAddress: localAddress,
          };
        }
        return host; // for v0.11 or later
      }

      function mergeOptions(target) {
        for (var i = 1, len = arguments.length; i < len; ++i) {
          var overrides = arguments[i];
          if (typeof overrides === "object") {
            var keys = Object.keys(overrides);
            for (var j = 0, keyLen = keys.length; j < keyLen; ++j) {
              var k = keys[j];
              if (overrides[k] !== undefined) {
                target[k] = overrides[k];
              }
            }
          }
        }
        return target;
      }

      var debug;
      if (process.env.NODE_DEBUG && /\btunnel\b/.test(process.env.NODE_DEBUG)) {
        debug = function () {
          var args = Array.prototype.slice.call(arguments);
          if (typeof args[0] === "string") {
            args[0] = "TUNNEL: " + args[0];
          } else {
            args.unshift("TUNNEL:");
          }
          console.error.apply(console, args);
        };
      } else {
        debug = function () {};
      }
      exports.debug = debug; // for test

      /***/
    },

    /***/ 4930: /***/ (__unused_webpack_module, exports) => {
      "use strict";

      Object.defineProperty(exports, "__esModule", { value: true });

      function getUserAgent() {
        if (typeof navigator === "object" && "userAgent" in navigator) {
          return navigator.userAgent;
        }

        if (typeof process === "object" && "version" in process) {
          return `Node.js/${process.version.substr(1)} (${process.platform}; ${
            process.arch
          })`;
        }

        return "<environment undetectable>";
      }

      exports.getUserAgent = getUserAgent;
      //# sourceMappingURL=index.js.map

      /***/
    },

    /***/ 2033: /***/ (
      __unused_webpack_module,
      exports,
      __nccwpck_require__,
    ) => {
      "use strict";

      Object.defineProperty(exports, "__esModule", {
        value: true,
      });
      Object.defineProperty(exports, "v1", {
        enumerable: true,
        get: function () {
          return _v.default;
        },
      });
      Object.defineProperty(exports, "v3", {
        enumerable: true,
        get: function () {
          return _v2.default;
        },
      });
      Object.defineProperty(exports, "v4", {
        enumerable: true,
        get: function () {
          return _v3.default;
        },
      });
      Object.defineProperty(exports, "v5", {
        enumerable: true,
        get: function () {
          return _v4.default;
        },
      });
      Object.defineProperty(exports, "NIL", {
        enumerable: true,
        get: function () {
          return _nil.default;
        },
      });
      Object.defineProperty(exports, "version", {
        enumerable: true,
        get: function () {
          return _version.default;
        },
      });
      Object.defineProperty(exports, "validate", {
        enumerable: true,
        get: function () {
          return _validate.default;
        },
      });
      Object.defineProperty(exports, "stringify", {
        enumerable: true,
        get: function () {
          return _stringify.default;
        },
      });
      Object.defineProperty(exports, "parse", {
        enumerable: true,
        get: function () {
          return _parse.default;
        },
      });

      var _v = _interopRequireDefault(__nccwpck_require__(9370));

      var _v2 = _interopRequireDefault(__nccwpck_require__(8638));

      var _v3 = _interopRequireDefault(__nccwpck_require__(3519));

      var _v4 = _interopRequireDefault(__nccwpck_require__(8239));

      var _nil = _interopRequireDefault(__nccwpck_require__(680));

      var _version = _interopRequireDefault(__nccwpck_require__(3609));

      var _validate = _interopRequireDefault(__nccwpck_require__(6009));

      var _stringify = _interopRequireDefault(__nccwpck_require__(9729));

      var _parse = _interopRequireDefault(__nccwpck_require__(8951));

      function _interopRequireDefault(obj) {
        return obj && obj.__esModule ? obj : { default: obj };
      }

      /***/
    },

    /***/ 7276: /***/ (
      __unused_webpack_module,
      exports,
      __nccwpck_require__,
    ) => {
      "use strict";

      Object.defineProperty(exports, "__esModule", {
        value: true,
      });
      exports["default"] = void 0;

      var _crypto = _interopRequireDefault(__nccwpck_require__(6113));

      function _interopRequireDefault(obj) {
        return obj && obj.__esModule ? obj : { default: obj };
      }

      function md5(bytes) {
        if (Array.isArray(bytes)) {
          bytes = Buffer.from(bytes);
        } else if (typeof bytes === "string") {
          bytes = Buffer.from(bytes, "utf8");
        }

        return _crypto.default.createHash("md5").update(bytes).digest();
      }

      var _default = md5;
      exports["default"] = _default;

      /***/
    },

    /***/ 680: /***/ (__unused_webpack_module, exports) => {
      "use strict";

      Object.defineProperty(exports, "__esModule", {
        value: true,
      });
      exports["default"] = void 0;
      var _default = "00000000-0000-0000-0000-000000000000";
      exports["default"] = _default;

      /***/
    },

    /***/ 8951: /***/ (
      __unused_webpack_module,
      exports,
      __nccwpck_require__,
    ) => {
      "use strict";

      Object.defineProperty(exports, "__esModule", {
        value: true,
      });
      exports["default"] = void 0;

      var _validate = _interopRequireDefault(__nccwpck_require__(6009));

      function _interopRequireDefault(obj) {
        return obj && obj.__esModule ? obj : { default: obj };
      }

      function parse(uuid) {
        if (!(0, _validate.default)(uuid)) {
          throw TypeError("Invalid UUID");
        }

        let v;
        const arr = new Uint8Array(16); // Parse ########-....-....-....-............

        arr[0] = (v = parseInt(uuid.slice(0, 8), 16)) >>> 24;
        arr[1] = (v >>> 16) & 0xff;
        arr[2] = (v >>> 8) & 0xff;
        arr[3] = v & 0xff; // Parse ........-####-....-....-............

        arr[4] = (v = parseInt(uuid.slice(9, 13), 16)) >>> 8;
        arr[5] = v & 0xff; // Parse ........-....-####-....-............

        arr[6] = (v = parseInt(uuid.slice(14, 18), 16)) >>> 8;
        arr[7] = v & 0xff; // Parse ........-....-....-####-............

        arr[8] = (v = parseInt(uuid.slice(19, 23), 16)) >>> 8;
        arr[9] = v & 0xff; // Parse ........-....-....-....-############
        // (Use "/" to avoid 32-bit truncation when bit-shifting high-order bytes)

        arr[10] =
          ((v = parseInt(uuid.slice(24, 36), 16)) / 0x10000000000) & 0xff;
        arr[11] = (v / 0x100000000) & 0xff;
        arr[12] = (v >>> 24) & 0xff;
        arr[13] = (v >>> 16) & 0xff;
        arr[14] = (v >>> 8) & 0xff;
        arr[15] = v & 0xff;
        return arr;
      }

      var _default = parse;
      exports["default"] = _default;

      /***/
    },

    /***/ 646: /***/ (__unused_webpack_module, exports) => {
      "use strict";

      Object.defineProperty(exports, "__esModule", {
        value: true,
      });
      exports["default"] = void 0;
      var _default =
        /^(?:[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}|00000000-0000-0000-0000-000000000000)$/i;
      exports["default"] = _default;

      /***/
    },

    /***/ 7548: /***/ (
      __unused_webpack_module,
      exports,
      __nccwpck_require__,
    ) => {
      "use strict";

      Object.defineProperty(exports, "__esModule", {
        value: true,
      });
      exports["default"] = rng;

      var _crypto = _interopRequireDefault(__nccwpck_require__(6113));

      function _interopRequireDefault(obj) {
        return obj && obj.__esModule ? obj : { default: obj };
      }

      const rnds8Pool = new Uint8Array(256); // # of random values to pre-allocate

      let poolPtr = rnds8Pool.length;

      function rng() {
        if (poolPtr > rnds8Pool.length - 16) {
          _crypto.default.randomFillSync(rnds8Pool);

          poolPtr = 0;
        }

        return rnds8Pool.slice(poolPtr, (poolPtr += 16));
      }

      /***/
    },

    /***/ 3557: /***/ (
      __unused_webpack_module,
      exports,
      __nccwpck_require__,
    ) => {
      "use strict";

      Object.defineProperty(exports, "__esModule", {
        value: true,
      });
      exports["default"] = void 0;

      var _crypto = _interopRequireDefault(__nccwpck_require__(6113));

      function _interopRequireDefault(obj) {
        return obj && obj.__esModule ? obj : { default: obj };
      }

      function sha1(bytes) {
        if (Array.isArray(bytes)) {
          bytes = Buffer.from(bytes);
        } else if (typeof bytes === "string") {
          bytes = Buffer.from(bytes, "utf8");
        }

        return _crypto.default.createHash("sha1").update(bytes).digest();
      }

      var _default = sha1;
      exports["default"] = _default;

      /***/
    },

    /***/ 9729: /***/ (
      __unused_webpack_module,
      exports,
      __nccwpck_require__,
    ) => {
      "use strict";

      Object.defineProperty(exports, "__esModule", {
        value: true,
      });
      exports["default"] = void 0;

      var _validate = _interopRequireDefault(__nccwpck_require__(6009));

      function _interopRequireDefault(obj) {
        return obj && obj.__esModule ? obj : { default: obj };
      }

      /**
       * Convert array of 16 byte values to UUID string format of the form:
       * XXXXXXXX-XXXX-XXXX-XXXX-XXXXXXXXXXXX
       */
      const byteToHex = [];

      for (let i = 0; i < 256; ++i) {
        byteToHex.push((i + 0x100).toString(16).substr(1));
      }

      function stringify(arr, offset = 0) {
        // Note: Be careful editing this code!  It's been tuned for performance
        // and works in ways you may not expect. See https://github.com/uuidjs/uuid/pull/434
        const uuid = (
          byteToHex[arr[offset + 0]] +
          byteToHex[arr[offset + 1]] +
          byteToHex[arr[offset + 2]] +
          byteToHex[arr[offset + 3]] +
          "-" +
          byteToHex[arr[offset + 4]] +
          byteToHex[arr[offset + 5]] +
          "-" +
          byteToHex[arr[offset + 6]] +
          byteToHex[arr[offset + 7]] +
          "-" +
          byteToHex[arr[offset + 8]] +
          byteToHex[arr[offset + 9]] +
          "-" +
          byteToHex[arr[offset + 10]] +
          byteToHex[arr[offset + 11]] +
          byteToHex[arr[offset + 12]] +
          byteToHex[arr[offset + 13]] +
          byteToHex[arr[offset + 14]] +
          byteToHex[arr[offset + 15]]
        ).toLowerCase(); // Consistency check for valid UUID.  If this throws, it's likely due to one
        // of the following:
        // - One or more input array values don't map to a hex octet (leading to
        // "undefined" in the uuid)
        // - Invalid input values for the RFC `version` or `variant` fields

        if (!(0, _validate.default)(uuid)) {
          throw TypeError("Stringified UUID is invalid");
        }

        return uuid;
      }

      var _default = stringify;
      exports["default"] = _default;

      /***/
    },

    /***/ 9370: /***/ (
      __unused_webpack_module,
      exports,
      __nccwpck_require__,
    ) => {
      "use strict";

      Object.defineProperty(exports, "__esModule", {
        value: true,
      });
      exports["default"] = void 0;

      var _rng = _interopRequireDefault(__nccwpck_require__(7548));

      var _stringify = _interopRequireDefault(__nccwpck_require__(9729));

      function _interopRequireDefault(obj) {
        return obj && obj.__esModule ? obj : { default: obj };
      }

      // **`v1()` - Generate time-based UUID**
      //
      // Inspired by https://github.com/LiosK/UUID.js
      // and http://docs.python.org/library/uuid.html
      let _nodeId;

      let _clockseq; // Previous uuid creation time

      let _lastMSecs = 0;
      let _lastNSecs = 0; // See https://github.com/uuidjs/uuid for API details

      function v1(options, buf, offset) {
        let i = (buf && offset) || 0;
        const b = buf || new Array(16);
        options = options || {};
        let node = options.node || _nodeId;
        let clockseq =
          options.clockseq !== undefined ? options.clockseq : _clockseq; // node and clockseq need to be initialized to random values if they're not
        // specified.  We do this lazily to minimize issues related to insufficient
        // system entropy.  See #189

        if (node == null || clockseq == null) {
          const seedBytes = options.random || (options.rng || _rng.default)();

          if (node == null) {
            // Per 4.5, create and 48-bit node id, (47 random bits + multicast bit = 1)
            node = _nodeId = [
              seedBytes[0] | 0x01,
              seedBytes[1],
              seedBytes[2],
              seedBytes[3],
              seedBytes[4],
              seedBytes[5],
            ];
          }

          if (clockseq == null) {
            // Per 4.2.2, randomize (14 bit) clockseq
            clockseq = _clockseq =
              ((seedBytes[6] << 8) | seedBytes[7]) & 0x3fff;
          }
        } // UUID timestamps are 100 nano-second units since the Gregorian epoch,
        // (1582-10-15 00:00).  JSNumbers aren't precise enough for this, so
        // time is handled internally as 'msecs' (integer milliseconds) and 'nsecs'
        // (100-nanoseconds offset from msecs) since unix epoch, 1970-01-01 00:00.

        let msecs = options.msecs !== undefined ? options.msecs : Date.now(); // Per 4.2.1.2, use count of uuid's generated during the current clock
        // cycle to simulate higher resolution clock

        let nsecs =
          options.nsecs !== undefined ? options.nsecs : _lastNSecs + 1; // Time since last uuid creation (in msecs)

        const dt = msecs - _lastMSecs + (nsecs - _lastNSecs) / 10000; // Per 4.2.1.2, Bump clockseq on clock regression

        if (dt < 0 && options.clockseq === undefined) {
          clockseq = (clockseq + 1) & 0x3fff;
        } // Reset nsecs if clock regresses (new clockseq) or we've moved onto a new
        // time interval

        if ((dt < 0 || msecs > _lastMSecs) && options.nsecs === undefined) {
          nsecs = 0;
        } // Per 4.2.1.2 Throw error if too many uuids are requested

        if (nsecs >= 10000) {
          throw new Error("uuid.v1(): Can't create more than 10M uuids/sec");
        }

        _lastMSecs = msecs;
        _lastNSecs = nsecs;
        _clockseq = clockseq; // Per 4.1.4 - Convert from unix epoch to Gregorian epoch

        msecs += 12219292800000; // `time_low`

        const tl = ((msecs & 0xfffffff) * 10000 + nsecs) % 0x100000000;
        b[i++] = (tl >>> 24) & 0xff;
        b[i++] = (tl >>> 16) & 0xff;
        b[i++] = (tl >>> 8) & 0xff;
        b[i++] = tl & 0xff; // `time_mid`

        const tmh = ((msecs / 0x100000000) * 10000) & 0xfffffff;
        b[i++] = (tmh >>> 8) & 0xff;
        b[i++] = tmh & 0xff; // `time_high_and_version`

        b[i++] = ((tmh >>> 24) & 0xf) | 0x10; // include version

        b[i++] = (tmh >>> 16) & 0xff; // `clock_seq_hi_and_reserved` (Per 4.2.2 - include variant)

        b[i++] = (clockseq >>> 8) | 0x80; // `clock_seq_low`

        b[i++] = clockseq & 0xff; // `node`

        for (let n = 0; n < 6; ++n) {
          b[i + n] = node[n];
        }

        return buf || (0, _stringify.default)(b);
      }

      var _default = v1;
      exports["default"] = _default;

      /***/
    },

    /***/ 8638: /***/ (
      __unused_webpack_module,
      exports,
      __nccwpck_require__,
    ) => {
      "use strict";

      Object.defineProperty(exports, "__esModule", {
        value: true,
      });
      exports["default"] = void 0;

      var _v = _interopRequireDefault(__nccwpck_require__(6694));

      var _md = _interopRequireDefault(__nccwpck_require__(7276));

      function _interopRequireDefault(obj) {
        return obj && obj.__esModule ? obj : { default: obj };
      }

      const v3 = (0, _v.default)("v3", 0x30, _md.default);
      var _default = v3;
      exports["default"] = _default;

      /***/
    },

    /***/ 6694: /***/ (
      __unused_webpack_module,
      exports,
      __nccwpck_require__,
    ) => {
      "use strict";

      Object.defineProperty(exports, "__esModule", {
        value: true,
      });
      exports["default"] = _default;
      exports.URL = exports.DNS = void 0;

      var _stringify = _interopRequireDefault(__nccwpck_require__(9729));

      var _parse = _interopRequireDefault(__nccwpck_require__(8951));

      function _interopRequireDefault(obj) {
        return obj && obj.__esModule ? obj : { default: obj };
      }

      function stringToBytes(str) {
        str = unescape(encodeURIComponent(str)); // UTF8 escape

        const bytes = [];

        for (let i = 0; i < str.length; ++i) {
          bytes.push(str.charCodeAt(i));
        }

        return bytes;
      }

      const DNS = "6ba7b810-9dad-11d1-80b4-00c04fd430c8";
      exports.DNS = DNS;
      const URL = "6ba7b811-9dad-11d1-80b4-00c04fd430c8";
      exports.URL = URL;

      function _default(name, version, hashfunc) {
        function generateUUID(value, namespace, buf, offset) {
          if (typeof value === "string") {
            value = stringToBytes(value);
          }

          if (typeof namespace === "string") {
            namespace = (0, _parse.default)(namespace);
          }

          if (namespace.length !== 16) {
            throw TypeError(
              "Namespace must be array-like (16 iterable integer values, 0-255)",
            );
          } // Compute hash of namespace and value, Per 4.3
          // Future: Use spread syntax when supported on all platforms, e.g. `bytes =
          // hashfunc([...namespace, ... value])`

          let bytes = new Uint8Array(16 + value.length);
          bytes.set(namespace);
          bytes.set(value, namespace.length);
          bytes = hashfunc(bytes);
          bytes[6] = (bytes[6] & 0x0f) | version;
          bytes[8] = (bytes[8] & 0x3f) | 0x80;

          if (buf) {
            offset = offset || 0;

            for (let i = 0; i < 16; ++i) {
              buf[offset + i] = bytes[i];
            }

            return buf;
          }

          return (0, _stringify.default)(bytes);
        } // Function#name is not settable on some platforms (#270)

        try {
          generateUUID.name = name; // eslint-disable-next-line no-empty
        } catch (err) {} // For CommonJS default export support

        generateUUID.DNS = DNS;
        generateUUID.URL = URL;
        return generateUUID;
      }

      /***/
    },

    /***/ 3519: /***/ (
      __unused_webpack_module,
      exports,
      __nccwpck_require__,
    ) => {
      "use strict";

      Object.defineProperty(exports, "__esModule", {
        value: true,
      });
      exports["default"] = void 0;

      var _rng = _interopRequireDefault(__nccwpck_require__(7548));

      var _stringify = _interopRequireDefault(__nccwpck_require__(9729));

      function _interopRequireDefault(obj) {
        return obj && obj.__esModule ? obj : { default: obj };
      }

      function v4(options, buf, offset) {
        options = options || {};

        const rnds = options.random || (options.rng || _rng.default)(); // Per 4.4, set bits for version and `clock_seq_hi_and_reserved`

        rnds[6] = (rnds[6] & 0x0f) | 0x40;
        rnds[8] = (rnds[8] & 0x3f) | 0x80; // Copy bytes to buffer, if provided

        if (buf) {
          offset = offset || 0;

          for (let i = 0; i < 16; ++i) {
            buf[offset + i] = rnds[i];
          }

          return buf;
        }

        return (0, _stringify.default)(rnds);
      }

      var _default = v4;
      exports["default"] = _default;

      /***/
    },

    /***/ 8239: /***/ (
      __unused_webpack_module,
      exports,
      __nccwpck_require__,
    ) => {
      "use strict";

      Object.defineProperty(exports, "__esModule", {
        value: true,
      });
      exports["default"] = void 0;

      var _v = _interopRequireDefault(__nccwpck_require__(6694));

      var _sha = _interopRequireDefault(__nccwpck_require__(3557));

      function _interopRequireDefault(obj) {
        return obj && obj.__esModule ? obj : { default: obj };
      }

      const v5 = (0, _v.default)("v5", 0x50, _sha.default);
      var _default = v5;
      exports["default"] = _default;

      /***/
    },

    /***/ 6009: /***/ (
      __unused_webpack_module,
      exports,
      __nccwpck_require__,
    ) => {
      "use strict";

      Object.defineProperty(exports, "__esModule", {
        value: true,
      });
      exports["default"] = void 0;

      var _regex = _interopRequireDefault(__nccwpck_require__(646));

      function _interopRequireDefault(obj) {
        return obj && obj.__esModule ? obj : { default: obj };
      }

      function validate(uuid) {
        return typeof uuid === "string" && _regex.default.test(uuid);
      }

      var _default = validate;
      exports["default"] = _default;

      /***/
    },

    /***/ 3609: /***/ (
      __unused_webpack_module,
      exports,
      __nccwpck_require__,
    ) => {
      "use strict";

      Object.defineProperty(exports, "__esModule", {
        value: true,
      });
      exports["default"] = void 0;

      var _validate = _interopRequireDefault(__nccwpck_require__(6009));

      function _interopRequireDefault(obj) {
        return obj && obj.__esModule ? obj : { default: obj };
      }

      function version(uuid) {
        if (!(0, _validate.default)(uuid)) {
          throw TypeError("Invalid UUID");
        }

        return parseInt(uuid.substr(14, 1), 16);
      }

      var _default = version;
      exports["default"] = _default;

      /***/
    },

    /***/ 2509: /***/ (module) => {
      // Returns a wrapper function that returns a wrapped callback
      // The wrapper function should do some stuff, and return a
      // presumably different callback function.
      // This makes sure that own properties are retained, so that
      // decorations and such are not lost along the way.
      module.exports = wrappy;
      function wrappy(fn, cb) {
        if (fn && cb) return wrappy(fn)(cb);

        if (typeof fn !== "function")
          throw new TypeError("need wrapper function");

        Object.keys(fn).forEach(function (k) {
          wrapper[k] = fn[k];
        });

        return wrapper;

        function wrapper() {
          var args = new Array(arguments.length);
          for (var i = 0; i < args.length; i++) {
            args[i] = arguments[i];
          }
          var ret = fn.apply(this, args);
          var cb = args[args.length - 1];
          if (typeof ret === "function" && ret !== cb) {
            Object.keys(cb).forEach(function (k) {
              ret[k] = cb[k];
            });
          }
          return ret;
        }
      }

      /***/
    },

    /***/ 7939: /***/ (module) => {
      module.exports = eval("require")("debug");

      /***/
    },

    /***/ 9491: /***/ (module) => {
      "use strict";
      module.exports = require("assert");

      /***/
    },

    /***/ 6113: /***/ (module) => {
      "use strict";
      module.exports = require("crypto");

      /***/
    },

    /***/ 2361: /***/ (module) => {
      "use strict";
      module.exports = require("events");

      /***/
    },

    /***/ 7147: /***/ (module) => {
      "use strict";
      module.exports = require("fs");

      /***/
    },

    /***/ 3685: /***/ (module) => {
      "use strict";
      module.exports = require("http");

      /***/
    },

    /***/ 5687: /***/ (module) => {
      "use strict";
      module.exports = require("https");

      /***/
    },

    /***/ 1808: /***/ (module) => {
      "use strict";
      module.exports = require("net");

      /***/
    },

    /***/ 2037: /***/ (module) => {
      "use strict";
      module.exports = require("os");

      /***/
    },

    /***/ 1017: /***/ (module) => {
      "use strict";
      module.exports = require("path");

      /***/
    },

    /***/ 2781: /***/ (module) => {
      "use strict";
      module.exports = require("stream");

      /***/
    },

    /***/ 4404: /***/ (module) => {
      "use strict";
      module.exports = require("tls");

      /***/
    },

    /***/ 7310: /***/ (module) => {
      "use strict";
      module.exports = require("url");

      /***/
    },

    /***/ 3837: /***/ (module) => {
      "use strict";
      module.exports = require("util");

      /***/
    },

    /***/ 9796: /***/ (module) => {
      "use strict";
      module.exports = require("zlib");

      /***/
    },

    /***/ 7165: /***/ (__unused_webpack_module, exports) => {
      "use strict";

      Object.defineProperty(exports, "__esModule", { value: true });
      exports.assertValidPattern = void 0;
      const MAX_PATTERN_LENGTH = 1024 * 64;
      const assertValidPattern = (pattern) => {
        if (typeof pattern !== "string") {
          throw new TypeError("invalid pattern");
        }
        if (pattern.length > MAX_PATTERN_LENGTH) {
          throw new TypeError("pattern is too long");
        }
      };
      exports.assertValidPattern = assertValidPattern;
      //# sourceMappingURL=assert-valid-pattern.js.map

      /***/
    },

    /***/ 3299: /***/ (
      __unused_webpack_module,
      exports,
      __nccwpck_require__,
    ) => {
      "use strict";

      // parse a single path portion
      Object.defineProperty(exports, "__esModule", { value: true });
      exports.AST = void 0;
      const brace_expressions_js_1 = __nccwpck_require__(6254);
      const unescape_js_1 = __nccwpck_require__(6146);
      const types = new Set(["!", "?", "+", "*", "@"]);
      const isExtglobType = (c) => types.has(c);
      // Patterns that get prepended to bind to the start of either the
      // entire string, or just a single path portion, to prevent dots
      // and/or traversal patterns, when needed.
      // Exts don't need the ^ or / bit, because the root binds that already.
      const startNoTraversal = "(?!(?:^|/)\\.\\.?(?:$|/))";
      const startNoDot = "(?!\\.)";
      // characters that indicate a start of pattern needs the "no dots" bit,
      // because a dot *might* be matched. ( is not in the list, because in
      // the case of a child extglob, it will handle the prevention itself.
      const addPatternStart = new Set(["[", "."]);
      // cases where traversal is A-OK, no dot prevention needed
      const justDots = new Set(["..", "."]);
      const reSpecials = new Set("().*{}+?[]^$\\!");
      const regExpEscape = (s) => s.replace(/[-[\]{}()*+?.,\\^$|#\s]/g, "\\$&");
      // any single thing other than /
      const qmark = "[^/]";
      // * => any number of characters
      const star = qmark + "*?";
      // use + when we need to ensure that *something* matches, because the * is
      // the only thing in the path portion.
      const starNoEmpty = qmark + "+?";
      // remove the \ chars that we added if we end up doing a nonmagic compare
      // const deslash = (s: string) => s.replace(/\\(.)/g, '$1')
      class AST {
        type;
        #root;
        #hasMagic;
        #uflag = false;
        #parts = [];
        #parent;
        #parentIndex;
        #negs;
        #filledNegs = false;
        #options;
        #toString;
        // set to true if it's an extglob with no children
        // (which really means one child of '')
        #emptyExt = false;
        constructor(type, parent, options = {}) {
          this.type = type;
          // extglobs are inherently magical
          if (type) this.#hasMagic = true;
          this.#parent = parent;
          this.#root = this.#parent ? this.#parent.#root : this;
          this.#options = this.#root === this ? options : this.#root.#options;
          this.#negs = this.#root === this ? [] : this.#root.#negs;
          if (type === "!" && !this.#root.#filledNegs) this.#negs.push(this);
          this.#parentIndex = this.#parent ? this.#parent.#parts.length : 0;
        }
        get hasMagic() {
          /* c8 ignore start */
          if (this.#hasMagic !== undefined) return this.#hasMagic;
          /* c8 ignore stop */
          for (const p of this.#parts) {
            if (typeof p === "string") continue;
            if (p.type || p.hasMagic) return (this.#hasMagic = true);
          }
          // note: will be undefined until we generate the regexp src and find out
          return this.#hasMagic;
        }
        // reconstructs the pattern
        toString() {
          if (this.#toString !== undefined) return this.#toString;
          if (!this.type) {
            return (this.#toString = this.#parts
              .map((p) => String(p))
              .join(""));
          } else {
            return (this.#toString =
              this.type +
              "(" +
              this.#parts.map((p) => String(p)).join("|") +
              ")");
          }
        }
        #fillNegs() {
          /* c8 ignore start */
          if (this !== this.#root) throw new Error("should only call on root");
          if (this.#filledNegs) return this;
          /* c8 ignore stop */
          // call toString() once to fill this out
          this.toString();
          this.#filledNegs = true;
          let n;
          while ((n = this.#negs.pop())) {
            if (n.type !== "!") continue;
            // walk up the tree, appending everthing that comes AFTER parentIndex
            let p = n;
            let pp = p.#parent;
            while (pp) {
              for (
                let i = p.#parentIndex + 1;
                !pp.type && i < pp.#parts.length;
                i++
              ) {
                for (const part of n.#parts) {
                  /* c8 ignore start */
                  if (typeof part === "string") {
                    throw new Error("string part in extglob AST??");
                  }
                  /* c8 ignore stop */
                  part.copyIn(pp.#parts[i]);
                }
              }
              p = pp;
              pp = p.#parent;
            }
          }
          return this;
        }
        push(...parts) {
          for (const p of parts) {
            if (p === "") continue;
            /* c8 ignore start */
            if (
              typeof p !== "string" &&
              !(p instanceof AST && p.#parent === this)
            ) {
              throw new Error("invalid part: " + p);
            }
            /* c8 ignore stop */
            this.#parts.push(p);
          }
        }
        toJSON() {
          const ret =
            this.type === null
              ? this.#parts
                  .slice()
                  .map((p) => (typeof p === "string" ? p : p.toJSON()))
              : [this.type, ...this.#parts.map((p) => p.toJSON())];
          if (this.isStart() && !this.type) ret.unshift([]);
          if (
            this.isEnd() &&
            (this === this.#root ||
              (this.#root.#filledNegs && this.#parent?.type === "!"))
          ) {
            ret.push({});
          }
          return ret;
        }
        isStart() {
          if (this.#root === this) return true;
          // if (this.type) return !!this.#parent?.isStart()
          if (!this.#parent?.isStart()) return false;
          if (this.#parentIndex === 0) return true;
          // if everything AHEAD of this is a negation, then it's still the "start"
          const p = this.#parent;
          for (let i = 0; i < this.#parentIndex; i++) {
            const pp = p.#parts[i];
            if (!(pp instanceof AST && pp.type === "!")) {
              return false;
            }
          }
          return true;
        }
        isEnd() {
          if (this.#root === this) return true;
          if (this.#parent?.type === "!") return true;
          if (!this.#parent?.isEnd()) return false;
          if (!this.type) return this.#parent?.isEnd();
          // if not root, it'll always have a parent
          /* c8 ignore start */
          const pl = this.#parent ? this.#parent.#parts.length : 0;
          /* c8 ignore stop */
          return this.#parentIndex === pl - 1;
        }
        copyIn(part) {
          if (typeof part === "string") this.push(part);
          else this.push(part.clone(this));
        }
        clone(parent) {
          const c = new AST(this.type, parent);
          for (const p of this.#parts) {
            c.copyIn(p);
          }
          return c;
        }
        static #parseAST(str, ast, pos, opt) {
          let escaping = false;
          let inBrace = false;
          let braceStart = -1;
          let braceNeg = false;
          if (ast.type === null) {
            // outside of a extglob, append until we find a start
            let i = pos;
            let acc = "";
            while (i < str.length) {
              const c = str.charAt(i++);
              // still accumulate escapes at this point, but we do ignore
              // starts that are escaped
              if (escaping || c === "\\") {
                escaping = !escaping;
                acc += c;
                continue;
              }
              if (inBrace) {
                if (i === braceStart + 1) {
                  if (c === "^" || c === "!") {
                    braceNeg = true;
                  }
                } else if (c === "]" && !(i === braceStart + 2 && braceNeg)) {
                  inBrace = false;
                }
                acc += c;
                continue;
              } else if (c === "[") {
                inBrace = true;
                braceStart = i;
                braceNeg = false;
                acc += c;
                continue;
              }
              if (!opt.noext && isExtglobType(c) && str.charAt(i) === "(") {
                ast.push(acc);
                acc = "";
                const ext = new AST(c, ast);
                i = AST.#parseAST(str, ext, i, opt);
                ast.push(ext);
                continue;
              }
              acc += c;
            }
            ast.push(acc);
            return i;
          }
          // some kind of extglob, pos is at the (
          // find the next | or )
          let i = pos + 1;
          let part = new AST(null, ast);
          const parts = [];
          let acc = "";
          while (i < str.length) {
            const c = str.charAt(i++);
            // still accumulate escapes at this point, but we do ignore
            // starts that are escaped
            if (escaping || c === "\\") {
              escaping = !escaping;
              acc += c;
              continue;
            }
            if (inBrace) {
              if (i === braceStart + 1) {
                if (c === "^" || c === "!") {
                  braceNeg = true;
                }
              } else if (c === "]" && !(i === braceStart + 2 && braceNeg)) {
                inBrace = false;
              }
              acc += c;
              continue;
            } else if (c === "[") {
              inBrace = true;
              braceStart = i;
              braceNeg = false;
              acc += c;
              continue;
            }
            if (isExtglobType(c) && str.charAt(i) === "(") {
              part.push(acc);
              acc = "";
              const ext = new AST(c, part);
              part.push(ext);
              i = AST.#parseAST(str, ext, i, opt);
              continue;
            }
            if (c === "|") {
              part.push(acc);
              acc = "";
              parts.push(part);
              part = new AST(null, ast);
              continue;
            }
            if (c === ")") {
              if (acc === "" && ast.#parts.length === 0) {
                ast.#emptyExt = true;
              }
              part.push(acc);
              acc = "";
              ast.push(...parts, part);
              return i;
            }
            acc += c;
          }
          // unfinished extglob
          // if we got here, it was a malformed extglob! not an extglob, but
          // maybe something else in there.
          ast.type = null;
          ast.#hasMagic = undefined;
          ast.#parts = [str.substring(pos - 1)];
          return i;
        }
        static fromGlob(pattern, options = {}) {
          const ast = new AST(null, undefined, options);
          AST.#parseAST(pattern, ast, 0, options);
          return ast;
        }
        // returns the regular expression if there's magic, or the unescaped
        // string if not.
        toMMPattern() {
          // should only be called on root
          /* c8 ignore start */
          if (this !== this.#root) return this.#root.toMMPattern();
          /* c8 ignore stop */
          const glob = this.toString();
          const [re, body, hasMagic, uflag] = this.toRegExpSource();
          // if we're in nocase mode, and not nocaseMagicOnly, then we do
          // still need a regular expression if we have to case-insensitively
          // match capital/lowercase characters.
          const anyMagic =
            hasMagic ||
            this.#hasMagic ||
            (this.#options.nocase &&
              !this.#options.nocaseMagicOnly &&
              glob.toUpperCase() !== glob.toLowerCase());
          if (!anyMagic) {
            return body;
          }
          const flags = (this.#options.nocase ? "i" : "") + (uflag ? "u" : "");
          return Object.assign(new RegExp(`^${re}$`, flags), {
            _src: re,
            _glob: glob,
          });
        }
        // returns the string match, the regexp source, whether there's magic
        // in the regexp (so a regular expression is required) and whether or
        // not the uflag is needed for the regular expression (for posix classes)
        // TODO: instead of injecting the start/end at this point, just return
        // the BODY of the regexp, along with the start/end portions suitable
        // for binding the start/end in either a joined full-path makeRe context
        // (where we bind to (^|/), or a standalone matchPart context (where
        // we bind to ^, and not /).  Otherwise slashes get duped!
        //
        // In part-matching mode, the start is:
        // - if not isStart: nothing
        // - if traversal possible, but not allowed: ^(?!\.\.?$)
        // - if dots allowed or not possible: ^
        // - if dots possible and not allowed: ^(?!\.)
        // end is:
        // - if not isEnd(): nothing
        // - else: $
        //
        // In full-path matching mode, we put the slash at the START of the
        // pattern, so start is:
        // - if first pattern: same as part-matching mode
        // - if not isStart(): nothing
        // - if traversal possible, but not allowed: /(?!\.\.?(?:$|/))
        // - if dots allowed or not possible: /
        // - if dots possible and not allowed: /(?!\.)
        // end is:
        // - if last pattern, same as part-matching mode
        // - else nothing
        //
        // Always put the (?:$|/) on negated tails, though, because that has to be
        // there to bind the end of the negated pattern portion, and it's easier to
        // just stick it in now rather than try to inject it later in the middle of
        // the pattern.
        //
        // We can just always return the same end, and leave it up to the caller
        // to know whether it's going to be used joined or in parts.
        // And, if the start is adjusted slightly, can do the same there:
        // - if not isStart: nothing
        // - if traversal possible, but not allowed: (?:/|^)(?!\.\.?$)
        // - if dots allowed or not possible: (?:/|^)
        // - if dots possible and not allowed: (?:/|^)(?!\.)
        //
        // But it's better to have a simpler binding without a conditional, for
        // performance, so probably better to return both start options.
        //
        // Then the caller just ignores the end if it's not the first pattern,
        // and the start always gets applied.
        //
        // But that's always going to be $ if it's the ending pattern, or nothing,
        // so the caller can just attach $ at the end of the pattern when building.
        //
        // So the todo is:
        // - better detect what kind of start is needed
        // - return both flavors of starting pattern
        // - attach $ at the end of the pattern when creating the actual RegExp
        //
        // Ah, but wait, no, that all only applies to the root when the first pattern
        // is not an extglob. If the first pattern IS an extglob, then we need all
        // that dot prevention biz to live in the extglob portions, because eg
        // +(*|.x*) can match .xy but not .yx.
        //
        // So, return the two flavors if it's #root and the first child is not an
        // AST, otherwise leave it to the child AST to handle it, and there,
        // use the (?:^|/) style of start binding.
        //
        // Even simplified further:
        // - Since the start for a join is eg /(?!\.) and the start for a part
        // is ^(?!\.), we can just prepend (?!\.) to the pattern (either root
        // or start or whatever) and prepend ^ or / at the Regexp construction.
        toRegExpSource(allowDot) {
          const dot = allowDot ?? !!this.#options.dot;
          if (this.#root === this) this.#fillNegs();
          if (!this.type) {
            const noEmpty = this.isStart() && this.isEnd();
            const src = this.#parts
              .map((p) => {
                const [re, _, hasMagic, uflag] =
                  typeof p === "string"
                    ? AST.#parseGlob(p, this.#hasMagic, noEmpty)
                    : p.toRegExpSource(allowDot);
                this.#hasMagic = this.#hasMagic || hasMagic;
                this.#uflag = this.#uflag || uflag;
                return re;
              })
              .join("");
            let start = "";
            if (this.isStart()) {
              if (typeof this.#parts[0] === "string") {
                // this is the string that will match the start of the pattern,
                // so we need to protect against dots and such.
                // '.' and '..' cannot match unless the pattern is that exactly,
                // even if it starts with . or dot:true is set.
                const dotTravAllowed =
                  this.#parts.length === 1 && justDots.has(this.#parts[0]);
                if (!dotTravAllowed) {
                  const aps = addPatternStart;
                  // check if we have a possibility of matching . or ..,
                  // and prevent that.
                  const needNoTrav =
                    // dots are allowed, and the pattern starts with [ or .
                    (dot && aps.has(src.charAt(0))) ||
                    // the pattern starts with \., and then [ or .
                    (src.startsWith("\\.") && aps.has(src.charAt(2))) ||
                    // the pattern starts with \.\., and then [ or .
                    (src.startsWith("\\.\\.") && aps.has(src.charAt(4)));
                  // no need to prevent dots if it can't match a dot, or if a
                  // sub-pattern will be preventing it anyway.
                  const needNoDot = !dot && !allowDot && aps.has(src.charAt(0));
                  start = needNoTrav
                    ? startNoTraversal
                    : needNoDot
                    ? startNoDot
                    : "";
                }
              }
            }
            // append the "end of path portion" pattern to negation tails
            let end = "";
            if (
              this.isEnd() &&
              this.#root.#filledNegs &&
              this.#parent?.type === "!"
            ) {
              end = "(?:$|\\/)";
            }
            const final = start + src + end;
            return [
              final,
              (0, unescape_js_1.unescape)(src),
              (this.#hasMagic = !!this.#hasMagic),
              this.#uflag,
            ];
          }
          // We need to calculate the body *twice* if it's a repeat pattern
          // at the start, once in nodot mode, then again in dot mode, so a
          // pattern like *(?) can match 'x.y'
          const repeated = this.type === "*" || this.type === "+";
          // some kind of extglob
          const start = this.type === "!" ? "(?:(?!(?:" : "(?:";
          let body = this.#partsToRegExp(dot);
          if (this.isStart() && this.isEnd() && !body && this.type !== "!") {
            // invalid extglob, has to at least be *something* present, if it's
            // the entire path portion.
            const s = this.toString();
            this.#parts = [s];
            this.type = null;
            this.#hasMagic = undefined;
            return [
              s,
              (0, unescape_js_1.unescape)(this.toString()),
              false,
              false,
            ];
          }
          // XXX abstract out this map method
          let bodyDotAllowed =
            !repeated || allowDot || dot || !startNoDot
              ? ""
              : this.#partsToRegExp(true);
          if (bodyDotAllowed === body) {
            bodyDotAllowed = "";
          }
          if (bodyDotAllowed) {
            body = `(?:${body})(?:${bodyDotAllowed})*?`;
          }
          // an empty !() is exactly equivalent to a starNoEmpty
          let final = "";
          if (this.type === "!" && this.#emptyExt) {
            final = (this.isStart() && !dot ? startNoDot : "") + starNoEmpty;
          } else {
            const close =
              this.type === "!"
                ? // !() must match something,but !(x) can match ''
                  "))" +
                  (this.isStart() && !dot && !allowDot ? startNoDot : "") +
                  star +
                  ")"
                : this.type === "@"
                ? ")"
                : this.type === "?"
                ? ")?"
                : this.type === "+" && bodyDotAllowed
                ? ")"
                : this.type === "*" && bodyDotAllowed
                ? `)?`
                : `)${this.type}`;
            final = start + body + close;
          }
          return [
            final,
            (0, unescape_js_1.unescape)(body),
            (this.#hasMagic = !!this.#hasMagic),
            this.#uflag,
          ];
        }
        #partsToRegExp(dot) {
          return this.#parts
            .map((p) => {
              // extglob ASTs should only contain parent ASTs
              /* c8 ignore start */
              if (typeof p === "string") {
                throw new Error("string type in extglob ast??");
              }
              /* c8 ignore stop */
              // can ignore hasMagic, because extglobs are already always magic
              const [re, _, _hasMagic, uflag] = p.toRegExpSource(dot);
              this.#uflag = this.#uflag || uflag;
              return re;
            })
            .filter((p) => !(this.isStart() && this.isEnd()) || !!p)
            .join("|");
        }
        static #parseGlob(glob, hasMagic, noEmpty = false) {
          let escaping = false;
          let re = "";
          let uflag = false;
          for (let i = 0; i < glob.length; i++) {
            const c = glob.charAt(i);
            if (escaping) {
              escaping = false;
              re += (reSpecials.has(c) ? "\\" : "") + c;
              continue;
            }
            if (c === "\\") {
              if (i === glob.length - 1) {
                re += "\\\\";
              } else {
                escaping = true;
              }
              continue;
            }
            if (c === "[") {
              const [src, needUflag, consumed, magic] = (0,
              brace_expressions_js_1.parseClass)(glob, i);
              if (consumed) {
                re += src;
                uflag = uflag || needUflag;
                i += consumed - 1;
                hasMagic = hasMagic || magic;
                continue;
              }
            }
            if (c === "*") {
              if (noEmpty && glob === "*") re += starNoEmpty;
              else re += star;
              hasMagic = true;
              continue;
            }
            if (c === "?") {
              re += qmark;
              hasMagic = true;
              continue;
            }
            re += regExpEscape(c);
          }
          return [re, (0, unescape_js_1.unescape)(glob), !!hasMagic, uflag];
        }
      }
      exports.AST = AST;
      //# sourceMappingURL=ast.js.map

      /***/
    },

    /***/ 6254: /***/ (__unused_webpack_module, exports) => {
      "use strict";

      // translate the various posix character classes into unicode properties
      // this works across all unicode locales
      Object.defineProperty(exports, "__esModule", { value: true });
      exports.parseClass = void 0;
      // { <posix class>: [<translation>, /u flag required, negated]
      const posixClasses = {
        "[:alnum:]": ["\\p{L}\\p{Nl}\\p{Nd}", true],
        "[:alpha:]": ["\\p{L}\\p{Nl}", true],
        "[:ascii:]": ["\\x" + "00-\\x" + "7f", false],
        "[:blank:]": ["\\p{Zs}\\t", true],
        "[:cntrl:]": ["\\p{Cc}", true],
        "[:digit:]": ["\\p{Nd}", true],
        "[:graph:]": ["\\p{Z}\\p{C}", true, true],
        "[:lower:]": ["\\p{Ll}", true],
        "[:print:]": ["\\p{C}", true],
        "[:punct:]": ["\\p{P}", true],
        "[:space:]": ["\\p{Z}\\t\\r\\n\\v\\f", true],
        "[:upper:]": ["\\p{Lu}", true],
        "[:word:]": ["\\p{L}\\p{Nl}\\p{Nd}\\p{Pc}", true],
        "[:xdigit:]": ["A-Fa-f0-9", false],
      };
      // only need to escape a few things inside of brace expressions
      // escapes: [ \ ] -
      const braceEscape = (s) => s.replace(/[[\]\\-]/g, "\\$&");
      // escape all regexp magic characters
      const regexpEscape = (s) => s.replace(/[-[\]{}()*+?.,\\^$|#\s]/g, "\\$&");
      // everything has already been escaped, we just have to join
      const rangesToString = (ranges) => ranges.join("");
      // takes a glob string at a posix brace expression, and returns
      // an equivalent regular expression source, and boolean indicating
      // whether the /u flag needs to be applied, and the number of chars
      // consumed to parse the character class.
      // This also removes out of order ranges, and returns ($.) if the
      // entire class just no good.
      const parseClass = (glob, position) => {
        const pos = position;
        /* c8 ignore start */
        if (glob.charAt(pos) !== "[") {
          throw new Error("not in a brace expression");
        }
        /* c8 ignore stop */
        const ranges = [];
        const negs = [];
        let i = pos + 1;
        let sawStart = false;
        let uflag = false;
        let escaping = false;
        let negate = false;
        let endPos = pos;
        let rangeStart = "";
        WHILE: while (i < glob.length) {
          const c = glob.charAt(i);
          if ((c === "!" || c === "^") && i === pos + 1) {
            negate = true;
            i++;
            continue;
          }
          if (c === "]" && sawStart && !escaping) {
            endPos = i + 1;
            break;
          }
          sawStart = true;
          if (c === "\\") {
            if (!escaping) {
              escaping = true;
              i++;
              continue;
            }
            // escaped \ char, fall through and treat like normal char
          }
          if (c === "[" && !escaping) {
            // either a posix class, a collation equivalent, or just a [
            for (const [cls, [unip, u, neg]] of Object.entries(posixClasses)) {
              if (glob.startsWith(cls, i)) {
                // invalid, [a-[] is fine, but not [a-[:alpha]]
                if (rangeStart) {
                  return ["$.", false, glob.length - pos, true];
                }
                i += cls.length;
                if (neg) negs.push(unip);
                else ranges.push(unip);
                uflag = uflag || u;
                continue WHILE;
              }
            }
          }
          // now it's just a normal character, effectively
          escaping = false;
          if (rangeStart) {
            // throw this range away if it's not valid, but others
            // can still match.
            if (c > rangeStart) {
              ranges.push(braceEscape(rangeStart) + "-" + braceEscape(c));
            } else if (c === rangeStart) {
              ranges.push(braceEscape(c));
            }
            rangeStart = "";
            i++;
            continue;
          }
          // now might be the start of a range.
          // can be either c-d or c-] or c<more...>] or c] at this point
          if (glob.startsWith("-]", i + 1)) {
            ranges.push(braceEscape(c + "-"));
            i += 2;
            continue;
          }
          if (glob.startsWith("-", i + 1)) {
            rangeStart = c;
            i += 2;
            continue;
          }
          // not the start of a range, just a single character
          ranges.push(braceEscape(c));
          i++;
        }
        if (endPos < i) {
          // didn't see the end of the class, not a valid class,
          // but might still be valid as a literal match.
          return ["", false, 0, false];
        }
        // if we got no ranges and no negates, then we have a range that
        // cannot possibly match anything, and that poisons the whole glob
        if (!ranges.length && !negs.length) {
          return ["$.", false, glob.length - pos, true];
        }
        // if we got one positive range, and it's a single character, then that's
        // not actually a magic pattern, it's just that one literal character.
        // we should not treat that as "magic", we should just return the literal
        // character. [_] is a perfectly valid way to escape glob magic chars.
        if (
          negs.length === 0 &&
          ranges.length === 1 &&
          /^\\?.$/.test(ranges[0]) &&
          !negate
        ) {
          const r = ranges[0].length === 2 ? ranges[0].slice(-1) : ranges[0];
          return [regexpEscape(r), false, endPos - pos, false];
        }
        const sranges =
          "[" + (negate ? "^" : "") + rangesToString(ranges) + "]";
        const snegs = "[" + (negate ? "" : "^") + rangesToString(negs) + "]";
        const comb =
          ranges.length && negs.length
            ? "(" + sranges + "|" + snegs + ")"
            : ranges.length
            ? sranges
            : snegs;
        return [comb, uflag, endPos - pos, true];
      };
      exports.parseClass = parseClass;
      //# sourceMappingURL=brace-expressions.js.map

      /***/
    },

    /***/ 4690: /***/ (__unused_webpack_module, exports) => {
      "use strict";

      Object.defineProperty(exports, "__esModule", { value: true });
      exports.escape = void 0;
      /**
       * Escape all magic characters in a glob pattern.
       *
       * If the {@link windowsPathsNoEscape | GlobOptions.windowsPathsNoEscape}
       * option is used, then characters are escaped by wrapping in `[]`, because
       * a magic character wrapped in a character class can only be satisfied by
       * that exact character.  In this mode, `\` is _not_ escaped, because it is
       * not interpreted as a magic character, but instead as a path separator.
       */
      const escape = (s, { windowsPathsNoEscape = false } = {}) => {
        // don't need to escape +@! because we escape the parens
        // that make those magic, and escaping ! as [!] isn't valid,
        // because [!]] is a valid glob class meaning not ']'.
        return windowsPathsNoEscape
          ? s.replace(/[?*()[\]]/g, "[$&]")
          : s.replace(/[?*()[\]\\]/g, "\\$&");
      };
      exports.escape = escape;
      //# sourceMappingURL=escape.js.map

      /***/
    },

    /***/ 9581: /***/ function (
      __unused_webpack_module,
      exports,
      __nccwpck_require__,
    ) {
      "use strict";

      var __importDefault =
        (this && this.__importDefault) ||
        function (mod) {
          return mod && mod.__esModule ? mod : { default: mod };
        };
      Object.defineProperty(exports, "__esModule", { value: true });
      exports.unescape =
        exports.escape =
        exports.AST =
        exports.Minimatch =
        exports.match =
        exports.makeRe =
        exports.braceExpand =
        exports.defaults =
        exports.filter =
        exports.GLOBSTAR =
        exports.sep =
        exports.minimatch =
          void 0;
      const brace_expansion_1 = __importDefault(__nccwpck_require__(4231));
      const assert_valid_pattern_js_1 = __nccwpck_require__(7165);
      const ast_js_1 = __nccwpck_require__(3299);
      const escape_js_1 = __nccwpck_require__(4690);
      const unescape_js_1 = __nccwpck_require__(6146);
      const minimatch = (p, pattern, options = {}) => {
        (0, assert_valid_pattern_js_1.assertValidPattern)(pattern);
        // shortcut: comments match nothing.
        if (!options.nocomment && pattern.charAt(0) === "#") {
          return false;
        }
        return new Minimatch(pattern, options).match(p);
      };
      exports.minimatch = minimatch;
      // Optimized checking for the most common glob patterns.
      const starDotExtRE = /^\*+([^+@!?\*\[\(]*)$/;
      const starDotExtTest = (ext) => (f) =>
        !f.startsWith(".") && f.endsWith(ext);
      const starDotExtTestDot = (ext) => (f) => f.endsWith(ext);
      const starDotExtTestNocase = (ext) => {
        ext = ext.toLowerCase();
        return (f) => !f.startsWith(".") && f.toLowerCase().endsWith(ext);
      };
      const starDotExtTestNocaseDot = (ext) => {
        ext = ext.toLowerCase();
        return (f) => f.toLowerCase().endsWith(ext);
      };
      const starDotStarRE = /^\*+\.\*+$/;
      const starDotStarTest = (f) => !f.startsWith(".") && f.includes(".");
      const starDotStarTestDot = (f) =>
        f !== "." && f !== ".." && f.includes(".");
      const dotStarRE = /^\.\*+$/;
      const dotStarTest = (f) => f !== "." && f !== ".." && f.startsWith(".");
      const starRE = /^\*+$/;
      const starTest = (f) => f.length !== 0 && !f.startsWith(".");
      const starTestDot = (f) => f.length !== 0 && f !== "." && f !== "..";
      const qmarksRE = /^\?+([^+@!?\*\[\(]*)?$/;
      const qmarksTestNocase = ([$0, ext = ""]) => {
        const noext = qmarksTestNoExt([$0]);
        if (!ext) return noext;
        ext = ext.toLowerCase();
        return (f) => noext(f) && f.toLowerCase().endsWith(ext);
      };
      const qmarksTestNocaseDot = ([$0, ext = ""]) => {
        const noext = qmarksTestNoExtDot([$0]);
        if (!ext) return noext;
        ext = ext.toLowerCase();
        return (f) => noext(f) && f.toLowerCase().endsWith(ext);
      };
      const qmarksTestDot = ([$0, ext = ""]) => {
        const noext = qmarksTestNoExtDot([$0]);
        return !ext ? noext : (f) => noext(f) && f.endsWith(ext);
      };
      const qmarksTest = ([$0, ext = ""]) => {
        const noext = qmarksTestNoExt([$0]);
        return !ext ? noext : (f) => noext(f) && f.endsWith(ext);
      };
      const qmarksTestNoExt = ([$0]) => {
        const len = $0.length;
        return (f) => f.length === len && !f.startsWith(".");
      };
      const qmarksTestNoExtDot = ([$0]) => {
        const len = $0.length;
        return (f) => f.length === len && f !== "." && f !== "..";
      };
      /* c8 ignore start */
      const defaultPlatform =
        typeof process === "object" && process
          ? (typeof process.env === "object" &&
              process.env &&
              process.env.__MINIMATCH_TESTING_PLATFORM__) ||
            process.platform
          : "posix";
      const path = {
        win32: { sep: "\\" },
        posix: { sep: "/" },
      };
      /* c8 ignore stop */
      exports.sep =
        defaultPlatform === "win32" ? path.win32.sep : path.posix.sep;
      exports.minimatch.sep = exports.sep;
      exports.GLOBSTAR = Symbol("globstar **");
      exports.minimatch.GLOBSTAR = exports.GLOBSTAR;
      // any single thing other than /
      // don't need to escape / when using new RegExp()
      const qmark = "[^/]";
      // * => any number of characters
      const star = qmark + "*?";
      // ** when dots are allowed.  Anything goes, except .. and .
      // not (^ or / followed by one or two dots followed by $ or /),
      // followed by anything, any number of times.
      const twoStarDot = "(?:(?!(?:\\/|^)(?:\\.{1,2})($|\\/)).)*?";
      // not a ^ or / followed by a dot,
      // followed by anything, any number of times.
      const twoStarNoDot = "(?:(?!(?:\\/|^)\\.).)*?";
      const filter =
        (pattern, options = {}) =>
        (p) =>
          (0, exports.minimatch)(p, pattern, options);
      exports.filter = filter;
      exports.minimatch.filter = exports.filter;
      const ext = (a, b = {}) => Object.assign({}, a, b);
      const defaults = (def) => {
        if (!def || typeof def !== "object" || !Object.keys(def).length) {
          return exports.minimatch;
        }
        const orig = exports.minimatch;
        const m = (p, pattern, options = {}) =>
          orig(p, pattern, ext(def, options));
        return Object.assign(m, {
          Minimatch: class Minimatch extends orig.Minimatch {
            constructor(pattern, options = {}) {
              super(pattern, ext(def, options));
            }
            static defaults(options) {
              return orig.defaults(ext(def, options)).Minimatch;
            }
          },
          AST: class AST extends orig.AST {
            /* c8 ignore start */
            constructor(type, parent, options = {}) {
              super(type, parent, ext(def, options));
            }
            /* c8 ignore stop */
            static fromGlob(pattern, options = {}) {
              return orig.AST.fromGlob(pattern, ext(def, options));
            }
          },
          unescape: (s, options = {}) => orig.unescape(s, ext(def, options)),
          escape: (s, options = {}) => orig.escape(s, ext(def, options)),
          filter: (pattern, options = {}) =>
            orig.filter(pattern, ext(def, options)),
          defaults: (options) => orig.defaults(ext(def, options)),
          makeRe: (pattern, options = {}) =>
            orig.makeRe(pattern, ext(def, options)),
          braceExpand: (pattern, options = {}) =>
            orig.braceExpand(pattern, ext(def, options)),
          match: (list, pattern, options = {}) =>
            orig.match(list, pattern, ext(def, options)),
          sep: orig.sep,
          GLOBSTAR: exports.GLOBSTAR,
        });
      };
      exports.defaults = defaults;
      exports.minimatch.defaults = exports.defaults;
      // Brace expansion:
      // a{b,c}d -> abd acd
      // a{b,}c -> abc ac
      // a{0..3}d -> a0d a1d a2d a3d
      // a{b,c{d,e}f}g -> abg acdfg acefg
      // a{b,c}d{e,f}g -> abdeg acdeg abdeg abdfg
      //
      // Invalid sets are not expanded.
      // a{2..}b -> a{2..}b
      // a{b}c -> a{b}c
      const braceExpand = (pattern, options = {}) => {
        (0, assert_valid_pattern_js_1.assertValidPattern)(pattern);
        // Thanks to Yeting Li <https://github.com/yetingli> for
        // improving this regexp to avoid a ReDOS vulnerability.
        if (options.nobrace || !/\{(?:(?!\{).)*\}/.test(pattern)) {
          // shortcut. no need to expand.
          return [pattern];
        }
        return (0, brace_expansion_1.default)(pattern);
      };
      exports.braceExpand = braceExpand;
      exports.minimatch.braceExpand = exports.braceExpand;
      // parse a component of the expanded set.
      // At this point, no pattern may contain "/" in it
      // so we're going to return a 2d array, where each entry is the full
      // pattern, split on '/', and then turned into a regular expression.
      // A regexp is made at the end which joins each array with an
      // escaped /, and another full one which joins each regexp with |.
      //
      // Following the lead of Bash 4.1, note that "**" only has special meaning
      // when it is the *only* thing in a path portion.  Otherwise, any series
      // of * is equivalent to a single *.  Globstar behavior is enabled by
      // default, and can be disabled by setting options.noglobstar.
      const makeRe = (pattern, options = {}) =>
        new Minimatch(pattern, options).makeRe();
      exports.makeRe = makeRe;
      exports.minimatch.makeRe = exports.makeRe;
      const match = (list, pattern, options = {}) => {
        const mm = new Minimatch(pattern, options);
        list = list.filter((f) => mm.match(f));
        if (mm.options.nonull && !list.length) {
          list.push(pattern);
        }
        return list;
      };
      exports.match = match;
      exports.minimatch.match = exports.match;
      // replace stuff like \* with *
      const globMagic = /[?*]|[+@!]\(.*?\)|\[|\]/;
      const regExpEscape = (s) => s.replace(/[-[\]{}()*+?.,\\^$|#\s]/g, "\\$&");
      class Minimatch {
        options;
        set;
        pattern;
        windowsPathsNoEscape;
        nonegate;
        negate;
        comment;
        empty;
        preserveMultipleSlashes;
        partial;
        globSet;
        globParts;
        nocase;
        isWindows;
        platform;
        windowsNoMagicRoot;
        regexp;
        constructor(pattern, options = {}) {
          (0, assert_valid_pattern_js_1.assertValidPattern)(pattern);
          options = options || {};
          this.options = options;
          this.pattern = pattern;
          this.platform = options.platform || defaultPlatform;
          this.isWindows = this.platform === "win32";
          this.windowsPathsNoEscape =
            !!options.windowsPathsNoEscape ||
            options.allowWindowsEscape === false;
          if (this.windowsPathsNoEscape) {
            this.pattern = this.pattern.replace(/\\/g, "/");
          }
          this.preserveMultipleSlashes = !!options.preserveMultipleSlashes;
          this.regexp = null;
          this.negate = false;
          this.nonegate = !!options.nonegate;
          this.comment = false;
          this.empty = false;
          this.partial = !!options.partial;
          this.nocase = !!this.options.nocase;
          this.windowsNoMagicRoot =
            options.windowsNoMagicRoot !== undefined
              ? options.windowsNoMagicRoot
              : !!(this.isWindows && this.nocase);
          this.globSet = [];
          this.globParts = [];
          this.set = [];
          // make the set of regexps etc.
          this.make();
        }
        hasMagic() {
          if (this.options.magicalBraces && this.set.length > 1) {
            return true;
          }
          for (const pattern of this.set) {
            for (const part of pattern) {
              if (typeof part !== "string") return true;
            }
          }
          return false;
        }
        debug(..._) {}
        make() {
          const pattern = this.pattern;
          const options = this.options;
          // empty patterns and comments match nothing.
          if (!options.nocomment && pattern.charAt(0) === "#") {
            this.comment = true;
            return;
          }
          if (!pattern) {
            this.empty = true;
            return;
          }
          // step 1: figure out negation, etc.
          this.parseNegate();
          // step 2: expand braces
          this.globSet = [...new Set(this.braceExpand())];
          if (options.debug) {
            this.debug = (...args) => console.error(...args);
          }
          this.debug(this.pattern, this.globSet);
          // step 3: now we have a set, so turn each one into a series of
          // path-portion matching patterns.
          // These will be regexps, except in the case of "**", which is
          // set to the GLOBSTAR object for globstar behavior,
          // and will not contain any / characters
          //
          // First, we preprocess to make the glob pattern sets a bit simpler
          // and deduped.  There are some perf-killing patterns that can cause
          // problems with a glob walk, but we can simplify them down a bit.
          const rawGlobParts = this.globSet.map((s) => this.slashSplit(s));
          this.globParts = this.preprocess(rawGlobParts);
          this.debug(this.pattern, this.globParts);
          // glob --> regexps
          let set = this.globParts.map((s, _, __) => {
            if (this.isWindows && this.windowsNoMagicRoot) {
              // check if it's a drive or unc path.
              const isUNC =
                s[0] === "" &&
                s[1] === "" &&
                (s[2] === "?" || !globMagic.test(s[2])) &&
                !globMagic.test(s[3]);
              const isDrive = /^[a-z]:/i.test(s[0]);
              if (isUNC) {
                return [
                  ...s.slice(0, 4),
                  ...s.slice(4).map((ss) => this.parse(ss)),
                ];
              } else if (isDrive) {
                return [s[0], ...s.slice(1).map((ss) => this.parse(ss))];
              }
            }
            return s.map((ss) => this.parse(ss));
          });
          this.debug(this.pattern, set);
          // filter out everything that didn't compile properly.
          this.set = set.filter((s) => s.indexOf(false) === -1);
          // do not treat the ? in UNC paths as magic
          if (this.isWindows) {
            for (let i = 0; i < this.set.length; i++) {
              const p = this.set[i];
              if (
                p[0] === "" &&
                p[1] === "" &&
                this.globParts[i][2] === "?" &&
                typeof p[3] === "string" &&
                /^[a-z]:$/i.test(p[3])
              ) {
                p[2] = "?";
              }
            }
          }
          this.debug(this.pattern, this.set);
        }
        // various transforms to equivalent pattern sets that are
        // faster to process in a filesystem walk.  The goal is to
        // eliminate what we can, and push all ** patterns as far
        // to the right as possible, even if it increases the number
        // of patterns that we have to process.
        preprocess(globParts) {
          // if we're not in globstar mode, then turn all ** into *
          if (this.options.noglobstar) {
            for (let i = 0; i < globParts.length; i++) {
              for (let j = 0; j < globParts[i].length; j++) {
                if (globParts[i][j] === "**") {
                  globParts[i][j] = "*";
                }
              }
            }
          }
          const { optimizationLevel = 1 } = this.options;
          if (optimizationLevel >= 2) {
            // aggressive optimization for the purpose of fs walking
            globParts = this.firstPhasePreProcess(globParts);
            globParts = this.secondPhasePreProcess(globParts);
          } else if (optimizationLevel >= 1) {
            // just basic optimizations to remove some .. parts
            globParts = this.levelOneOptimize(globParts);
          } else {
            globParts = this.adjascentGlobstarOptimize(globParts);
          }
          return globParts;
        }
        // just get rid of adjascent ** portions
        adjascentGlobstarOptimize(globParts) {
          return globParts.map((parts) => {
            let gs = -1;
            while (-1 !== (gs = parts.indexOf("**", gs + 1))) {
              let i = gs;
              while (parts[i + 1] === "**") {
                i++;
              }
              if (i !== gs) {
                parts.splice(gs, i - gs);
              }
            }
            return parts;
          });
        }
        // get rid of adjascent ** and resolve .. portions
        levelOneOptimize(globParts) {
          return globParts.map((parts) => {
            parts = parts.reduce((set, part) => {
              const prev = set[set.length - 1];
              if (part === "**" && prev === "**") {
                return set;
              }
              if (part === "..") {
                if (prev && prev !== ".." && prev !== "." && prev !== "**") {
                  set.pop();
                  return set;
                }
              }
              set.push(part);
              return set;
            }, []);
            return parts.length === 0 ? [""] : parts;
          });
        }
        levelTwoFileOptimize(parts) {
          if (!Array.isArray(parts)) {
            parts = this.slashSplit(parts);
          }
          let didSomething = false;
          do {
            didSomething = false;
            // <pre>/<e>/<rest> -> <pre>/<rest>
            if (!this.preserveMultipleSlashes) {
              for (let i = 1; i < parts.length - 1; i++) {
                const p = parts[i];
                // don't squeeze out UNC patterns
                if (i === 1 && p === "" && parts[0] === "") continue;
                if (p === "." || p === "") {
                  didSomething = true;
                  parts.splice(i, 1);
                  i--;
                }
              }
              if (
                parts[0] === "." &&
                parts.length === 2 &&
                (parts[1] === "." || parts[1] === "")
              ) {
                didSomething = true;
                parts.pop();
              }
            }
            // <pre>/<p>/../<rest> -> <pre>/<rest>
            let dd = 0;
            while (-1 !== (dd = parts.indexOf("..", dd + 1))) {
              const p = parts[dd - 1];
              if (p && p !== "." && p !== ".." && p !== "**") {
                didSomething = true;
                parts.splice(dd - 1, 2);
                dd -= 2;
              }
            }
          } while (didSomething);
          return parts.length === 0 ? [""] : parts;
        }
        // First phase: single-pattern processing
        // <pre> is 1 or more portions
        // <rest> is 1 or more portions
        // <p> is any portion other than ., .., '', or **
        // <e> is . or ''
        //
        // **/.. is *brutal* for filesystem walking performance, because
        // it effectively resets the recursive walk each time it occurs,
        // and ** cannot be reduced out by a .. pattern part like a regexp
        // or most strings (other than .., ., and '') can be.
        //
        // <pre>/**/../<p>/<p>/<rest> -> {<pre>/../<p>/<p>/<rest>,<pre>/**/<p>/<p>/<rest>}
        // <pre>/<e>/<rest> -> <pre>/<rest>
        // <pre>/<p>/../<rest> -> <pre>/<rest>
        // **/**/<rest> -> **/<rest>
        //
        // **/*/<rest> -> */**/<rest> <== not valid because ** doesn't follow
        // this WOULD be allowed if ** did follow symlinks, or * didn't
        firstPhasePreProcess(globParts) {
          let didSomething = false;
          do {
            didSomething = false;
            // <pre>/**/../<p>/<p>/<rest> -> {<pre>/../<p>/<p>/<rest>,<pre>/**/<p>/<p>/<rest>}
            for (let parts of globParts) {
              let gs = -1;
              while (-1 !== (gs = parts.indexOf("**", gs + 1))) {
                let gss = gs;
                while (parts[gss + 1] === "**") {
                  // <pre>/**/**/<rest> -> <pre>/**/<rest>
                  gss++;
                }
                // eg, if gs is 2 and gss is 4, that means we have 3 **
                // parts, and can remove 2 of them.
                if (gss > gs) {
                  parts.splice(gs + 1, gss - gs);
                }
                let next = parts[gs + 1];
                const p = parts[gs + 2];
                const p2 = parts[gs + 3];
                if (next !== "..") continue;
                if (
                  !p ||
                  p === "." ||
                  p === ".." ||
                  !p2 ||
                  p2 === "." ||
                  p2 === ".."
                ) {
                  continue;
                }
                didSomething = true;
                // edit parts in place, and push the new one
                parts.splice(gs, 1);
                const other = parts.slice(0);
                other[gs] = "**";
                globParts.push(other);
                gs--;
              }
              // <pre>/<e>/<rest> -> <pre>/<rest>
              if (!this.preserveMultipleSlashes) {
                for (let i = 1; i < parts.length - 1; i++) {
                  const p = parts[i];
                  // don't squeeze out UNC patterns
                  if (i === 1 && p === "" && parts[0] === "") continue;
                  if (p === "." || p === "") {
                    didSomething = true;
                    parts.splice(i, 1);
                    i--;
                  }
                }
                if (
                  parts[0] === "." &&
                  parts.length === 2 &&
                  (parts[1] === "." || parts[1] === "")
                ) {
                  didSomething = true;
                  parts.pop();
                }
              }
              // <pre>/<p>/../<rest> -> <pre>/<rest>
              let dd = 0;
              while (-1 !== (dd = parts.indexOf("..", dd + 1))) {
                const p = parts[dd - 1];
                if (p && p !== "." && p !== ".." && p !== "**") {
                  didSomething = true;
                  const needDot = dd === 1 && parts[dd + 1] === "**";
                  const splin = needDot ? ["."] : [];
                  parts.splice(dd - 1, 2, ...splin);
                  if (parts.length === 0) parts.push("");
                  dd -= 2;
                }
              }
            }
          } while (didSomething);
          return globParts;
        }
        // second phase: multi-pattern dedupes
        // {<pre>/*/<rest>,<pre>/<p>/<rest>} -> <pre>/*/<rest>
        // {<pre>/<rest>,<pre>/<rest>} -> <pre>/<rest>
        // {<pre>/**/<rest>,<pre>/<rest>} -> <pre>/**/<rest>
        //
        // {<pre>/**/<rest>,<pre>/**/<p>/<rest>} -> <pre>/**/<rest>
        // ^-- not valid because ** doens't follow symlinks
        secondPhasePreProcess(globParts) {
          for (let i = 0; i < globParts.length - 1; i++) {
            for (let j = i + 1; j < globParts.length; j++) {
              const matched = this.partsMatch(
                globParts[i],
                globParts[j],
                !this.preserveMultipleSlashes,
              );
              if (!matched) continue;
              globParts[i] = matched;
              globParts[j] = [];
            }
          }
          return globParts.filter((gs) => gs.length);
        }
        partsMatch(a, b, emptyGSMatch = false) {
          let ai = 0;
          let bi = 0;
          let result = [];
          let which = "";
          while (ai < a.length && bi < b.length) {
            if (a[ai] === b[bi]) {
              result.push(which === "b" ? b[bi] : a[ai]);
              ai++;
              bi++;
            } else if (emptyGSMatch && a[ai] === "**" && b[bi] === a[ai + 1]) {
              result.push(a[ai]);
              ai++;
            } else if (emptyGSMatch && b[bi] === "**" && a[ai] === b[bi + 1]) {
              result.push(b[bi]);
              bi++;
            } else if (
              a[ai] === "*" &&
              b[bi] &&
              (this.options.dot || !b[bi].startsWith(".")) &&
              b[bi] !== "**"
            ) {
              if (which === "b") return false;
              which = "a";
              result.push(a[ai]);
              ai++;
              bi++;
            } else if (
              b[bi] === "*" &&
              a[ai] &&
              (this.options.dot || !a[ai].startsWith(".")) &&
              a[ai] !== "**"
            ) {
              if (which === "a") return false;
              which = "b";
              result.push(b[bi]);
              ai++;
              bi++;
            } else {
              return false;
            }
          }
          // if we fall out of the loop, it means they two are identical
          // as long as their lengths match
          return a.length === b.length && result;
        }
        parseNegate() {
          if (this.nonegate) return;
          const pattern = this.pattern;
          let negate = false;
          let negateOffset = 0;
          for (
            let i = 0;
            i < pattern.length && pattern.charAt(i) === "!";
            i++
          ) {
            negate = !negate;
            negateOffset++;
          }
          if (negateOffset) this.pattern = pattern.slice(negateOffset);
          this.negate = negate;
        }
        // set partial to true to test if, for example,
        // "/a/b" matches the start of "/*/b/*/d"
        // Partial means, if you run out of file before you run
        // out of pattern, then that's fine, as long as all
        // the parts match.
        matchOne(file, pattern, partial = false) {
          const options = this.options;
          // UNC paths like //?/X:/... can match X:/... and vice versa
          // Drive letters in absolute drive or unc paths are always compared
          // case-insensitively.
          if (this.isWindows) {
            const fileDrive =
              typeof file[0] === "string" && /^[a-z]:$/i.test(file[0]);
            const fileUNC =
              !fileDrive &&
              file[0] === "" &&
              file[1] === "" &&
              file[2] === "?" &&
              /^[a-z]:$/i.test(file[3]);
            const patternDrive =
              typeof pattern[0] === "string" && /^[a-z]:$/i.test(pattern[0]);
            const patternUNC =
              !patternDrive &&
              pattern[0] === "" &&
              pattern[1] === "" &&
              pattern[2] === "?" &&
              typeof pattern[3] === "string" &&
              /^[a-z]:$/i.test(pattern[3]);
            const fdi = fileUNC ? 3 : fileDrive ? 0 : undefined;
            const pdi = patternUNC ? 3 : patternDrive ? 0 : undefined;
            if (typeof fdi === "number" && typeof pdi === "number") {
              const [fd, pd] = [file[fdi], pattern[pdi]];
              if (fd.toLowerCase() === pd.toLowerCase()) {
                pattern[pdi] = fd;
                if (pdi > fdi) {
                  pattern = pattern.slice(pdi);
                } else if (fdi > pdi) {
                  file = file.slice(fdi);
                }
              }
            }
          }
          // resolve and reduce . and .. portions in the file as well.
          // dont' need to do the second phase, because it's only one string[]
          const { optimizationLevel = 1 } = this.options;
          if (optimizationLevel >= 2) {
            file = this.levelTwoFileOptimize(file);
          }
          this.debug("matchOne", this, { file, pattern });
          this.debug("matchOne", file.length, pattern.length);
          for (
            var fi = 0, pi = 0, fl = file.length, pl = pattern.length;
            fi < fl && pi < pl;
            fi++, pi++
          ) {
            this.debug("matchOne loop");
            var p = pattern[pi];
            var f = file[fi];
            this.debug(pattern, p, f);
            // should be impossible.
            // some invalid regexp stuff in the set.
            /* c8 ignore start */
            if (p === false) {
              return false;
            }
            /* c8 ignore stop */
            if (p === exports.GLOBSTAR) {
              this.debug("GLOBSTAR", [pattern, p, f]);
              // "**"
              // a/**/b/**/c would match the following:
              // a/b/x/y/z/c
              // a/x/y/z/b/c
              // a/b/x/b/x/c
              // a/b/c
              // To do this, take the rest of the pattern after
              // the **, and see if it would match the file remainder.
              // If so, return success.
              // If not, the ** "swallows" a segment, and try again.
              // This is recursively awful.
              //
              // a/**/b/**/c matching a/b/x/y/z/c
              // - a matches a
              // - doublestar
              //   - matchOne(b/x/y/z/c, b/**/c)
              //     - b matches b
              //     - doublestar
              //       - matchOne(x/y/z/c, c) -> no
              //       - matchOne(y/z/c, c) -> no
              //       - matchOne(z/c, c) -> no
              //       - matchOne(c, c) yes, hit
              var fr = fi;
              var pr = pi + 1;
              if (pr === pl) {
                this.debug("** at the end");
                // a ** at the end will just swallow the rest.
                // We have found a match.
                // however, it will not swallow /.x, unless
                // options.dot is set.
                // . and .. are *never* matched by **, for explosively
                // exponential reasons.
                for (; fi < fl; fi++) {
                  if (
                    file[fi] === "." ||
                    file[fi] === ".." ||
                    (!options.dot && file[fi].charAt(0) === ".")
                  )
                    return false;
                }
                return true;
              }
              // ok, let's see if we can swallow whatever we can.
              while (fr < fl) {
                var swallowee = file[fr];
                this.debug(
                  "\nglobstar while",
                  file,
                  fr,
                  pattern,
                  pr,
                  swallowee,
                );
                // XXX remove this slice.  Just pass the start index.
                if (this.matchOne(file.slice(fr), pattern.slice(pr), partial)) {
                  this.debug("globstar found match!", fr, fl, swallowee);
                  // found a match.
                  return true;
                } else {
                  // can't swallow "." or ".." ever.
                  // can only swallow ".foo" when explicitly asked.
                  if (
                    swallowee === "." ||
                    swallowee === ".." ||
                    (!options.dot && swallowee.charAt(0) === ".")
                  ) {
                    this.debug("dot detected!", file, fr, pattern, pr);
                    break;
                  }
                  // ** swallows a segment, and continue.
                  this.debug("globstar swallow a segment, and continue");
                  fr++;
                }
              }
              // no match was found.
              // However, in partial mode, we can't say this is necessarily over.
              /* c8 ignore start */
              if (partial) {
                // ran out of file
                this.debug("\n>>> no match, partial?", file, fr, pattern, pr);
                if (fr === fl) {
                  return true;
                }
              }
              /* c8 ignore stop */
              return false;
            }
            // something other than **
            // non-magic patterns just have to match exactly
            // patterns with magic have been turned into regexps.
            let hit;
            if (typeof p === "string") {
              hit = f === p;
              this.debug("string match", p, f, hit);
            } else {
              hit = p.test(f);
              this.debug("pattern match", p, f, hit);
            }
            if (!hit) return false;
          }
          // Note: ending in / means that we'll get a final ""
          // at the end of the pattern.  This can only match a
          // corresponding "" at the end of the file.
          // If the file ends in /, then it can only match a
          // a pattern that ends in /, unless the pattern just
          // doesn't have any more for it. But, a/b/ should *not*
          // match "a/b/*", even though "" matches against the
          // [^/]*? pattern, except in partial mode, where it might
          // simply not be reached yet.
          // However, a/b/ should still satisfy a/*
          // now either we fell off the end of the pattern, or we're done.
          if (fi === fl && pi === pl) {
            // ran out of pattern and filename at the same time.
            // an exact hit!
            return true;
          } else if (fi === fl) {
            // ran out of file, but still had pattern left.
            // this is ok if we're doing the match as part of
            // a glob fs traversal.
            return partial;
          } else if (pi === pl) {
            // ran out of pattern, still have file left.
            // this is only acceptable if we're on the very last
            // empty segment of a file with a trailing slash.
            // a/* should match a/b/
            return fi === fl - 1 && file[fi] === "";
            /* c8 ignore start */
          } else {
            // should be unreachable.
            throw new Error("wtf?");
          }
          /* c8 ignore stop */
        }
        braceExpand() {
          return (0, exports.braceExpand)(this.pattern, this.options);
        }
        parse(pattern) {
          (0, assert_valid_pattern_js_1.assertValidPattern)(pattern);
          const options = this.options;
          // shortcuts
          if (pattern === "**") return exports.GLOBSTAR;
          if (pattern === "") return "";
          // far and away, the most common glob pattern parts are
          // *, *.*, and *.<ext>  Add a fast check method for those.
          let m;
          let fastTest = null;
          if ((m = pattern.match(starRE))) {
            fastTest = options.dot ? starTestDot : starTest;
          } else if ((m = pattern.match(starDotExtRE))) {
            fastTest = (
              options.nocase
                ? options.dot
                  ? starDotExtTestNocaseDot
                  : starDotExtTestNocase
                : options.dot
                ? starDotExtTestDot
                : starDotExtTest
            )(m[1]);
          } else if ((m = pattern.match(qmarksRE))) {
            fastTest = (
              options.nocase
                ? options.dot
                  ? qmarksTestNocaseDot
                  : qmarksTestNocase
                : options.dot
                ? qmarksTestDot
                : qmarksTest
            )(m);
          } else if ((m = pattern.match(starDotStarRE))) {
            fastTest = options.dot ? starDotStarTestDot : starDotStarTest;
          } else if ((m = pattern.match(dotStarRE))) {
            fastTest = dotStarTest;
          }
          const re = ast_js_1.AST.fromGlob(pattern, this.options).toMMPattern();
          return fastTest ? Object.assign(re, { test: fastTest }) : re;
        }
        makeRe() {
          if (this.regexp || this.regexp === false) return this.regexp;
          // at this point, this.set is a 2d array of partial
          // pattern strings, or "**".
          //
          // It's better to use .match().  This function shouldn't
          // be used, really, but it's pretty convenient sometimes,
          // when you just want to work with a regex.
          const set = this.set;
          if (!set.length) {
            this.regexp = false;
            return this.regexp;
          }
          const options = this.options;
          const twoStar = options.noglobstar
            ? star
            : options.dot
            ? twoStarDot
            : twoStarNoDot;
          const flags = new Set(options.nocase ? ["i"] : []);
          // regexpify non-globstar patterns
          // if ** is only item, then we just do one twoStar
          // if ** is first, and there are more, prepend (\/|twoStar\/)? to next
          // if ** is last, append (\/twoStar|) to previous
          // if ** is in the middle, append (\/|\/twoStar\/) to previous
          // then filter out GLOBSTAR symbols
          let re = set
            .map((pattern) => {
              const pp = pattern.map((p) => {
                if (p instanceof RegExp) {
                  for (const f of p.flags.split("")) flags.add(f);
                }
                return typeof p === "string"
                  ? regExpEscape(p)
                  : p === exports.GLOBSTAR
                  ? exports.GLOBSTAR
                  : p._src;
              });
              pp.forEach((p, i) => {
                const next = pp[i + 1];
                const prev = pp[i - 1];
                if (p !== exports.GLOBSTAR || prev === exports.GLOBSTAR) {
                  return;
                }
                if (prev === undefined) {
                  if (next !== undefined && next !== exports.GLOBSTAR) {
                    pp[i + 1] = "(?:\\/|" + twoStar + "\\/)?" + next;
                  } else {
                    pp[i] = twoStar;
                  }
                } else if (next === undefined) {
                  pp[i - 1] = prev + "(?:\\/|" + twoStar + ")?";
                } else if (next !== exports.GLOBSTAR) {
                  pp[i - 1] = prev + "(?:\\/|\\/" + twoStar + "\\/)" + next;
                  pp[i + 1] = exports.GLOBSTAR;
                }
              });
              return pp.filter((p) => p !== exports.GLOBSTAR).join("/");
            })
            .join("|");
          // need to wrap in parens if we had more than one thing with |,
          // otherwise only the first will be anchored to ^ and the last to $
          const [open, close] = set.length > 1 ? ["(?:", ")"] : ["", ""];
          // must match entire pattern
          // ending in a * or ** will make it less strict.
          re = "^" + open + re + close + "$";
          // can match anything, as long as it's not this.
          if (this.negate) re = "^(?!" + re + ").+$";
          try {
            this.regexp = new RegExp(re, [...flags].join(""));
            /* c8 ignore start */
          } catch (ex) {
            // should be impossible
            this.regexp = false;
          }
          /* c8 ignore stop */
          return this.regexp;
        }
        slashSplit(p) {
          // if p starts with // on windows, we preserve that
          // so that UNC paths aren't broken.  Otherwise, any number of
          // / characters are coalesced into one, unless
          // preserveMultipleSlashes is set to true.
          if (this.preserveMultipleSlashes) {
            return p.split("/");
          } else if (this.isWindows && /^\/\/[^\/]+/.test(p)) {
            // add an extra '' for the one we lose
            return ["", ...p.split(/\/+/)];
          } else {
            return p.split(/\/+/);
          }
        }
        match(f, partial = this.partial) {
          this.debug("match", f, this.pattern);
          // short-circuit in the case of busted things.
          // comments, etc.
          if (this.comment) {
            return false;
          }
          if (this.empty) {
            return f === "";
          }
          if (f === "/" && partial) {
            return true;
          }
          const options = this.options;
          // windows: need to use /, not \
          if (this.isWindows) {
            f = f.split("\\").join("/");
          }
          // treat the test path as a set of pathparts.
          const ff = this.slashSplit(f);
          this.debug(this.pattern, "split", ff);
          // just ONE of the pattern sets in this.set needs to match
          // in order for it to be valid.  If negating, then just one
          // match means that we have failed.
          // Either way, return on the first hit.
          const set = this.set;
          this.debug(this.pattern, "set", set);
          // Find the basename of the path by looking for the last non-empty segment
          let filename = ff[ff.length - 1];
          if (!filename) {
            for (let i = ff.length - 2; !filename && i >= 0; i--) {
              filename = ff[i];
            }
          }
          for (let i = 0; i < set.length; i++) {
            const pattern = set[i];
            let file = ff;
            if (options.matchBase && pattern.length === 1) {
              file = [filename];
            }
            const hit = this.matchOne(file, pattern, partial);
            if (hit) {
              if (options.flipNegate) {
                return true;
              }
              return !this.negate;
            }
          }
          // didn't get any hits.  this is success if it's a negative
          // pattern, failure otherwise.
          if (options.flipNegate) {
            return false;
          }
          return this.negate;
        }
        static defaults(def) {
          return exports.minimatch.defaults(def).Minimatch;
        }
      }
      exports.Minimatch = Minimatch;
      /* c8 ignore start */
      var ast_js_2 = __nccwpck_require__(3299);
      Object.defineProperty(exports, "AST", {
        enumerable: true,
        get: function () {
          return ast_js_2.AST;
        },
      });
      var escape_js_2 = __nccwpck_require__(4690);
      Object.defineProperty(exports, "escape", {
        enumerable: true,
        get: function () {
          return escape_js_2.escape;
        },
      });
      var unescape_js_2 = __nccwpck_require__(6146);
      Object.defineProperty(exports, "unescape", {
        enumerable: true,
        get: function () {
          return unescape_js_2.unescape;
        },
      });
      /* c8 ignore stop */
      exports.minimatch.AST = ast_js_1.AST;
      exports.minimatch.Minimatch = Minimatch;
      exports.minimatch.escape = escape_js_1.escape;
      exports.minimatch.unescape = unescape_js_1.unescape;
      //# sourceMappingURL=index.js.map

      /***/
    },

    /***/ 6146: /***/ (__unused_webpack_module, exports) => {
      "use strict";

      Object.defineProperty(exports, "__esModule", { value: true });
      exports.unescape = void 0;
      /**
       * Un-escape a string that has been escaped with {@link escape}.
       *
       * If the {@link windowsPathsNoEscape} option is used, then square-brace
       * escapes are removed, but not backslash escapes.  For example, it will turn
       * the string `'[*]'` into `*`, but it will not turn `'\\*'` into `'*'`,
       * becuase `\` is a path separator in `windowsPathsNoEscape` mode.
       *
       * When `windowsPathsNoEscape` is not set, then both brace escapes and
       * backslash escapes are removed.
       *
       * Slashes (and backslashes in `windowsPathsNoEscape` mode) cannot be escaped
       * or unescaped.
       */
      const unescape = (s, { windowsPathsNoEscape = false } = {}) => {
        return windowsPathsNoEscape
          ? s.replace(/\[([^\/\\])\]/g, "$1")
          : s
              .replace(/((?!\\).|^)\[([^\/\\])\]/g, "$1$2")
              .replace(/\\([^\/])/g, "$1");
      };
      exports.unescape = unescape;
      //# sourceMappingURL=unescape.js.map

      /***/
    },

    /***/ 4558: /***/ (module) => {
      "use strict";
      module.exports = JSON.parse(
        '{"application/1d-interleaved-parityfec":{"source":"iana"},"application/3gpdash-qoe-report+xml":{"source":"iana","charset":"UTF-8","compressible":true},"application/3gpp-ims+xml":{"source":"iana","compressible":true},"application/3gpphal+json":{"source":"iana","compressible":true},"application/3gpphalforms+json":{"source":"iana","compressible":true},"application/a2l":{"source":"iana"},"application/ace+cbor":{"source":"iana"},"application/activemessage":{"source":"iana"},"application/activity+json":{"source":"iana","compressible":true},"application/alto-costmap+json":{"source":"iana","compressible":true},"application/alto-costmapfilter+json":{"source":"iana","compressible":true},"application/alto-directory+json":{"source":"iana","compressible":true},"application/alto-endpointcost+json":{"source":"iana","compressible":true},"application/alto-endpointcostparams+json":{"source":"iana","compressible":true},"application/alto-endpointprop+json":{"source":"iana","compressible":true},"application/alto-endpointpropparams+json":{"source":"iana","compressible":true},"application/alto-error+json":{"source":"iana","compressible":true},"application/alto-networkmap+json":{"source":"iana","compressible":true},"application/alto-networkmapfilter+json":{"source":"iana","compressible":true},"application/alto-updatestreamcontrol+json":{"source":"iana","compressible":true},"application/alto-updatestreamparams+json":{"source":"iana","compressible":true},"application/aml":{"source":"iana"},"application/andrew-inset":{"source":"iana","extensions":["ez"]},"application/applefile":{"source":"iana"},"application/applixware":{"source":"apache","extensions":["aw"]},"application/at+jwt":{"source":"iana"},"application/atf":{"source":"iana"},"application/atfx":{"source":"iana"},"application/atom+xml":{"source":"iana","compressible":true,"extensions":["atom"]},"application/atomcat+xml":{"source":"iana","compressible":true,"extensions":["atomcat"]},"application/atomdeleted+xml":{"source":"iana","compressible":true,"extensions":["atomdeleted"]},"application/atomicmail":{"source":"iana"},"application/atomsvc+xml":{"source":"iana","compressible":true,"extensions":["atomsvc"]},"application/atsc-dwd+xml":{"source":"iana","compressible":true,"extensions":["dwd"]},"application/atsc-dynamic-event-message":{"source":"iana"},"application/atsc-held+xml":{"source":"iana","compressible":true,"extensions":["held"]},"application/atsc-rdt+json":{"source":"iana","compressible":true},"application/atsc-rsat+xml":{"source":"iana","compressible":true,"extensions":["rsat"]},"application/atxml":{"source":"iana"},"application/auth-policy+xml":{"source":"iana","compressible":true},"application/bacnet-xdd+zip":{"source":"iana","compressible":false},"application/batch-smtp":{"source":"iana"},"application/bdoc":{"compressible":false,"extensions":["bdoc"]},"application/beep+xml":{"source":"iana","charset":"UTF-8","compressible":true},"application/calendar+json":{"source":"iana","compressible":true},"application/calendar+xml":{"source":"iana","compressible":true,"extensions":["xcs"]},"application/call-completion":{"source":"iana"},"application/cals-1840":{"source":"iana"},"application/captive+json":{"source":"iana","compressible":true},"application/cbor":{"source":"iana"},"application/cbor-seq":{"source":"iana"},"application/cccex":{"source":"iana"},"application/ccmp+xml":{"source":"iana","compressible":true},"application/ccxml+xml":{"source":"iana","compressible":true,"extensions":["ccxml"]},"application/cdfx+xml":{"source":"iana","compressible":true,"extensions":["cdfx"]},"application/cdmi-capability":{"source":"iana","extensions":["cdmia"]},"application/cdmi-container":{"source":"iana","extensions":["cdmic"]},"application/cdmi-domain":{"source":"iana","extensions":["cdmid"]},"application/cdmi-object":{"source":"iana","extensions":["cdmio"]},"application/cdmi-queue":{"source":"iana","extensions":["cdmiq"]},"application/cdni":{"source":"iana"},"application/cea":{"source":"iana"},"application/cea-2018+xml":{"source":"iana","compressible":true},"application/cellml+xml":{"source":"iana","compressible":true},"application/cfw":{"source":"iana"},"application/city+json":{"source":"iana","compressible":true},"application/clr":{"source":"iana"},"application/clue+xml":{"source":"iana","compressible":true},"application/clue_info+xml":{"source":"iana","compressible":true},"application/cms":{"source":"iana"},"application/cnrp+xml":{"source":"iana","compressible":true},"application/coap-group+json":{"source":"iana","compressible":true},"application/coap-payload":{"source":"iana"},"application/commonground":{"source":"iana"},"application/conference-info+xml":{"source":"iana","compressible":true},"application/cose":{"source":"iana"},"application/cose-key":{"source":"iana"},"application/cose-key-set":{"source":"iana"},"application/cpl+xml":{"source":"iana","compressible":true,"extensions":["cpl"]},"application/csrattrs":{"source":"iana"},"application/csta+xml":{"source":"iana","compressible":true},"application/cstadata+xml":{"source":"iana","compressible":true},"application/csvm+json":{"source":"iana","compressible":true},"application/cu-seeme":{"source":"apache","extensions":["cu"]},"application/cwt":{"source":"iana"},"application/cybercash":{"source":"iana"},"application/dart":{"compressible":true},"application/dash+xml":{"source":"iana","compressible":true,"extensions":["mpd"]},"application/dash-patch+xml":{"source":"iana","compressible":true,"extensions":["mpp"]},"application/dashdelta":{"source":"iana"},"application/davmount+xml":{"source":"iana","compressible":true,"extensions":["davmount"]},"application/dca-rft":{"source":"iana"},"application/dcd":{"source":"iana"},"application/dec-dx":{"source":"iana"},"application/dialog-info+xml":{"source":"iana","compressible":true},"application/dicom":{"source":"iana"},"application/dicom+json":{"source":"iana","compressible":true},"application/dicom+xml":{"source":"iana","compressible":true},"application/dii":{"source":"iana"},"application/dit":{"source":"iana"},"application/dns":{"source":"iana"},"application/dns+json":{"source":"iana","compressible":true},"application/dns-message":{"source":"iana"},"application/docbook+xml":{"source":"apache","compressible":true,"extensions":["dbk"]},"application/dots+cbor":{"source":"iana"},"application/dskpp+xml":{"source":"iana","compressible":true},"application/dssc+der":{"source":"iana","extensions":["dssc"]},"application/dssc+xml":{"source":"iana","compressible":true,"extensions":["xdssc"]},"application/dvcs":{"source":"iana"},"application/ecmascript":{"source":"iana","compressible":true,"extensions":["es","ecma"]},"application/edi-consent":{"source":"iana"},"application/edi-x12":{"source":"iana","compressible":false},"application/edifact":{"source":"iana","compressible":false},"application/efi":{"source":"iana"},"application/elm+json":{"source":"iana","charset":"UTF-8","compressible":true},"application/elm+xml":{"source":"iana","compressible":true},"application/emergencycalldata.cap+xml":{"source":"iana","charset":"UTF-8","compressible":true},"application/emergencycalldata.comment+xml":{"source":"iana","compressible":true},"application/emergencycalldata.control+xml":{"source":"iana","compressible":true},"application/emergencycalldata.deviceinfo+xml":{"source":"iana","compressible":true},"application/emergencycalldata.ecall.msd":{"source":"iana"},"application/emergencycalldata.providerinfo+xml":{"source":"iana","compressible":true},"application/emergencycalldata.serviceinfo+xml":{"source":"iana","compressible":true},"application/emergencycalldata.subscriberinfo+xml":{"source":"iana","compressible":true},"application/emergencycalldata.veds+xml":{"source":"iana","compressible":true},"application/emma+xml":{"source":"iana","compressible":true,"extensions":["emma"]},"application/emotionml+xml":{"source":"iana","compressible":true,"extensions":["emotionml"]},"application/encaprtp":{"source":"iana"},"application/epp+xml":{"source":"iana","compressible":true},"application/epub+zip":{"source":"iana","compressible":false,"extensions":["epub"]},"application/eshop":{"source":"iana"},"application/exi":{"source":"iana","extensions":["exi"]},"application/expect-ct-report+json":{"source":"iana","compressible":true},"application/express":{"source":"iana","extensions":["exp"]},"application/fastinfoset":{"source":"iana"},"application/fastsoap":{"source":"iana"},"application/fdt+xml":{"source":"iana","compressible":true,"extensions":["fdt"]},"application/fhir+json":{"source":"iana","charset":"UTF-8","compressible":true},"application/fhir+xml":{"source":"iana","charset":"UTF-8","compressible":true},"application/fido.trusted-apps+json":{"compressible":true},"application/fits":{"source":"iana"},"application/flexfec":{"source":"iana"},"application/font-sfnt":{"source":"iana"},"application/font-tdpfr":{"source":"iana","extensions":["pfr"]},"application/font-woff":{"source":"iana","compressible":false},"application/framework-attributes+xml":{"source":"iana","compressible":true},"application/geo+json":{"source":"iana","compressible":true,"extensions":["geojson"]},"application/geo+json-seq":{"source":"iana"},"application/geopackage+sqlite3":{"source":"iana"},"application/geoxacml+xml":{"source":"iana","compressible":true},"application/gltf-buffer":{"source":"iana"},"application/gml+xml":{"source":"iana","compressible":true,"extensions":["gml"]},"application/gpx+xml":{"source":"apache","compressible":true,"extensions":["gpx"]},"application/gxf":{"source":"apache","extensions":["gxf"]},"application/gzip":{"source":"iana","compressible":false,"extensions":["gz"]},"application/h224":{"source":"iana"},"application/held+xml":{"source":"iana","compressible":true},"application/hjson":{"extensions":["hjson"]},"application/http":{"source":"iana"},"application/hyperstudio":{"source":"iana","extensions":["stk"]},"application/ibe-key-request+xml":{"source":"iana","compressible":true},"application/ibe-pkg-reply+xml":{"source":"iana","compressible":true},"application/ibe-pp-data":{"source":"iana"},"application/iges":{"source":"iana"},"application/im-iscomposing+xml":{"source":"iana","charset":"UTF-8","compressible":true},"application/index":{"source":"iana"},"application/index.cmd":{"source":"iana"},"application/index.obj":{"source":"iana"},"application/index.response":{"source":"iana"},"application/index.vnd":{"source":"iana"},"application/inkml+xml":{"source":"iana","compressible":true,"extensions":["ink","inkml"]},"application/iotp":{"source":"iana"},"application/ipfix":{"source":"iana","extensions":["ipfix"]},"application/ipp":{"source":"iana"},"application/isup":{"source":"iana"},"application/its+xml":{"source":"iana","compressible":true,"extensions":["its"]},"application/java-archive":{"source":"apache","compressible":false,"extensions":["jar","war","ear"]},"application/java-serialized-object":{"source":"apache","compressible":false,"extensions":["ser"]},"application/java-vm":{"source":"apache","compressible":false,"extensions":["class"]},"application/javascript":{"source":"iana","charset":"UTF-8","compressible":true,"extensions":["js","mjs"]},"application/jf2feed+json":{"source":"iana","compressible":true},"application/jose":{"source":"iana"},"application/jose+json":{"source":"iana","compressible":true},"application/jrd+json":{"source":"iana","compressible":true},"application/jscalendar+json":{"source":"iana","compressible":true},"application/json":{"source":"iana","charset":"UTF-8","compressible":true,"extensions":["json","map"]},"application/json-patch+json":{"source":"iana","compressible":true},"application/json-seq":{"source":"iana"},"application/json5":{"extensions":["json5"]},"application/jsonml+json":{"source":"apache","compressible":true,"extensions":["jsonml"]},"application/jwk+json":{"source":"iana","compressible":true},"application/jwk-set+json":{"source":"iana","compressible":true},"application/jwt":{"source":"iana"},"application/kpml-request+xml":{"source":"iana","compressible":true},"application/kpml-response+xml":{"source":"iana","compressible":true},"application/ld+json":{"source":"iana","compressible":true,"extensions":["jsonld"]},"application/lgr+xml":{"source":"iana","compressible":true,"extensions":["lgr"]},"application/link-format":{"source":"iana"},"application/load-control+xml":{"source":"iana","compressible":true},"application/lost+xml":{"source":"iana","compressible":true,"extensions":["lostxml"]},"application/lostsync+xml":{"source":"iana","compressible":true},"application/lpf+zip":{"source":"iana","compressible":false},"application/lxf":{"source":"iana"},"application/mac-binhex40":{"source":"iana","extensions":["hqx"]},"application/mac-compactpro":{"source":"apache","extensions":["cpt"]},"application/macwriteii":{"source":"iana"},"application/mads+xml":{"source":"iana","compressible":true,"extensions":["mads"]},"application/manifest+json":{"source":"iana","charset":"UTF-8","compressible":true,"extensions":["webmanifest"]},"application/marc":{"source":"iana","extensions":["mrc"]},"application/marcxml+xml":{"source":"iana","compressible":true,"extensions":["mrcx"]},"application/mathematica":{"source":"iana","extensions":["ma","nb","mb"]},"application/mathml+xml":{"source":"iana","compressible":true,"extensions":["mathml"]},"application/mathml-content+xml":{"source":"iana","compressible":true},"application/mathml-presentation+xml":{"source":"iana","compressible":true},"application/mbms-associated-procedure-description+xml":{"source":"iana","compressible":true},"application/mbms-deregister+xml":{"source":"iana","compressible":true},"application/mbms-envelope+xml":{"source":"iana","compressible":true},"application/mbms-msk+xml":{"source":"iana","compressible":true},"application/mbms-msk-response+xml":{"source":"iana","compressible":true},"application/mbms-protection-description+xml":{"source":"iana","compressible":true},"application/mbms-reception-report+xml":{"source":"iana","compressible":true},"application/mbms-register+xml":{"source":"iana","compressible":true},"application/mbms-register-response+xml":{"source":"iana","compressible":true},"application/mbms-schedule+xml":{"source":"iana","compressible":true},"application/mbms-user-service-description+xml":{"source":"iana","compressible":true},"application/mbox":{"source":"iana","extensions":["mbox"]},"application/media-policy-dataset+xml":{"source":"iana","compressible":true,"extensions":["mpf"]},"application/media_control+xml":{"source":"iana","compressible":true},"application/mediaservercontrol+xml":{"source":"iana","compressible":true,"extensions":["mscml"]},"application/merge-patch+json":{"source":"iana","compressible":true},"application/metalink+xml":{"source":"apache","compressible":true,"extensions":["metalink"]},"application/metalink4+xml":{"source":"iana","compressible":true,"extensions":["meta4"]},"application/mets+xml":{"source":"iana","compressible":true,"extensions":["mets"]},"application/mf4":{"source":"iana"},"application/mikey":{"source":"iana"},"application/mipc":{"source":"iana"},"application/missing-blocks+cbor-seq":{"source":"iana"},"application/mmt-aei+xml":{"source":"iana","compressible":true,"extensions":["maei"]},"application/mmt-usd+xml":{"source":"iana","compressible":true,"extensions":["musd"]},"application/mods+xml":{"source":"iana","compressible":true,"extensions":["mods"]},"application/moss-keys":{"source":"iana"},"application/moss-signature":{"source":"iana"},"application/mosskey-data":{"source":"iana"},"application/mosskey-request":{"source":"iana"},"application/mp21":{"source":"iana","extensions":["m21","mp21"]},"application/mp4":{"source":"iana","extensions":["mp4s","m4p"]},"application/mpeg4-generic":{"source":"iana"},"application/mpeg4-iod":{"source":"iana"},"application/mpeg4-iod-xmt":{"source":"iana"},"application/mrb-consumer+xml":{"source":"iana","compressible":true},"application/mrb-publish+xml":{"source":"iana","compressible":true},"application/msc-ivr+xml":{"source":"iana","charset":"UTF-8","compressible":true},"application/msc-mixer+xml":{"source":"iana","charset":"UTF-8","compressible":true},"application/msword":{"source":"iana","compressible":false,"extensions":["doc","dot"]},"application/mud+json":{"source":"iana","compressible":true},"application/multipart-core":{"source":"iana"},"application/mxf":{"source":"iana","extensions":["mxf"]},"application/n-quads":{"source":"iana","extensions":["nq"]},"application/n-triples":{"source":"iana","extensions":["nt"]},"application/nasdata":{"source":"iana"},"application/news-checkgroups":{"source":"iana","charset":"US-ASCII"},"application/news-groupinfo":{"source":"iana","charset":"US-ASCII"},"application/news-transmission":{"source":"iana"},"application/nlsml+xml":{"source":"iana","compressible":true},"application/node":{"source":"iana","extensions":["cjs"]},"application/nss":{"source":"iana"},"application/oauth-authz-req+jwt":{"source":"iana"},"application/oblivious-dns-message":{"source":"iana"},"application/ocsp-request":{"source":"iana"},"application/ocsp-response":{"source":"iana"},"application/octet-stream":{"source":"iana","compressible":false,"extensions":["bin","dms","lrf","mar","so","dist","distz","pkg","bpk","dump","elc","deploy","exe","dll","deb","dmg","iso","img","msi","msp","msm","buffer"]},"application/oda":{"source":"iana","extensions":["oda"]},"application/odm+xml":{"source":"iana","compressible":true},"application/odx":{"source":"iana"},"application/oebps-package+xml":{"source":"iana","compressible":true,"extensions":["opf"]},"application/ogg":{"source":"iana","compressible":false,"extensions":["ogx"]},"application/omdoc+xml":{"source":"apache","compressible":true,"extensions":["omdoc"]},"application/onenote":{"source":"apache","extensions":["onetoc","onetoc2","onetmp","onepkg"]},"application/opc-nodeset+xml":{"source":"iana","compressible":true},"application/oscore":{"source":"iana"},"application/oxps":{"source":"iana","extensions":["oxps"]},"application/p21":{"source":"iana"},"application/p21+zip":{"source":"iana","compressible":false},"application/p2p-overlay+xml":{"source":"iana","compressible":true,"extensions":["relo"]},"application/parityfec":{"source":"iana"},"application/passport":{"source":"iana"},"application/patch-ops-error+xml":{"source":"iana","compressible":true,"extensions":["xer"]},"application/pdf":{"source":"iana","compressible":false,"extensions":["pdf"]},"application/pdx":{"source":"iana"},"application/pem-certificate-chain":{"source":"iana"},"application/pgp-encrypted":{"source":"iana","compressible":false,"extensions":["pgp"]},"application/pgp-keys":{"source":"iana","extensions":["asc"]},"application/pgp-signature":{"source":"iana","extensions":["asc","sig"]},"application/pics-rules":{"source":"apache","extensions":["prf"]},"application/pidf+xml":{"source":"iana","charset":"UTF-8","compressible":true},"application/pidf-diff+xml":{"source":"iana","charset":"UTF-8","compressible":true},"application/pkcs10":{"source":"iana","extensions":["p10"]},"application/pkcs12":{"source":"iana"},"application/pkcs7-mime":{"source":"iana","extensions":["p7m","p7c"]},"application/pkcs7-signature":{"source":"iana","extensions":["p7s"]},"application/pkcs8":{"source":"iana","extensions":["p8"]},"application/pkcs8-encrypted":{"source":"iana"},"application/pkix-attr-cert":{"source":"iana","extensions":["ac"]},"application/pkix-cert":{"source":"iana","extensions":["cer"]},"application/pkix-crl":{"source":"iana","extensions":["crl"]},"application/pkix-pkipath":{"source":"iana","extensions":["pkipath"]},"application/pkixcmp":{"source":"iana","extensions":["pki"]},"application/pls+xml":{"source":"iana","compressible":true,"extensions":["pls"]},"application/poc-settings+xml":{"source":"iana","charset":"UTF-8","compressible":true},"application/postscript":{"source":"iana","compressible":true,"extensions":["ai","eps","ps"]},"application/ppsp-tracker+json":{"source":"iana","compressible":true},"application/problem+json":{"source":"iana","compressible":true},"application/problem+xml":{"source":"iana","compressible":true},"application/provenance+xml":{"source":"iana","compressible":true,"extensions":["provx"]},"application/prs.alvestrand.titrax-sheet":{"source":"iana"},"application/prs.cww":{"source":"iana","extensions":["cww"]},"application/prs.cyn":{"source":"iana","charset":"7-BIT"},"application/prs.hpub+zip":{"source":"iana","compressible":false},"application/prs.nprend":{"source":"iana"},"application/prs.plucker":{"source":"iana"},"application/prs.rdf-xml-crypt":{"source":"iana"},"application/prs.xsf+xml":{"source":"iana","compressible":true},"application/pskc+xml":{"source":"iana","compressible":true,"extensions":["pskcxml"]},"application/pvd+json":{"source":"iana","compressible":true},"application/qsig":{"source":"iana"},"application/raml+yaml":{"compressible":true,"extensions":["raml"]},"application/raptorfec":{"source":"iana"},"application/rdap+json":{"source":"iana","compressible":true},"application/rdf+xml":{"source":"iana","compressible":true,"extensions":["rdf","owl"]},"application/reginfo+xml":{"source":"iana","compressible":true,"extensions":["rif"]},"application/relax-ng-compact-syntax":{"source":"iana","extensions":["rnc"]},"application/remote-printing":{"source":"iana"},"application/reputon+json":{"source":"iana","compressible":true},"application/resource-lists+xml":{"source":"iana","compressible":true,"extensions":["rl"]},"application/resource-lists-diff+xml":{"source":"iana","compressible":true,"extensions":["rld"]},"application/rfc+xml":{"source":"iana","compressible":true},"application/riscos":{"source":"iana"},"application/rlmi+xml":{"source":"iana","compressible":true},"application/rls-services+xml":{"source":"iana","compressible":true,"extensions":["rs"]},"application/route-apd+xml":{"source":"iana","compressible":true,"extensions":["rapd"]},"application/route-s-tsid+xml":{"source":"iana","compressible":true,"extensions":["sls"]},"application/route-usd+xml":{"source":"iana","compressible":true,"extensions":["rusd"]},"application/rpki-ghostbusters":{"source":"iana","extensions":["gbr"]},"application/rpki-manifest":{"source":"iana","extensions":["mft"]},"application/rpki-publication":{"source":"iana"},"application/rpki-roa":{"source":"iana","extensions":["roa"]},"application/rpki-updown":{"source":"iana"},"application/rsd+xml":{"source":"apache","compressible":true,"extensions":["rsd"]},"application/rss+xml":{"source":"apache","compressible":true,"extensions":["rss"]},"application/rtf":{"source":"iana","compressible":true,"extensions":["rtf"]},"application/rtploopback":{"source":"iana"},"application/rtx":{"source":"iana"},"application/samlassertion+xml":{"source":"iana","compressible":true},"application/samlmetadata+xml":{"source":"iana","compressible":true},"application/sarif+json":{"source":"iana","compressible":true},"application/sarif-external-properties+json":{"source":"iana","compressible":true},"application/sbe":{"source":"iana"},"application/sbml+xml":{"source":"iana","compressible":true,"extensions":["sbml"]},"application/scaip+xml":{"source":"iana","compressible":true},"application/scim+json":{"source":"iana","compressible":true},"application/scvp-cv-request":{"source":"iana","extensions":["scq"]},"application/scvp-cv-response":{"source":"iana","extensions":["scs"]},"application/scvp-vp-request":{"source":"iana","extensions":["spq"]},"application/scvp-vp-response":{"source":"iana","extensions":["spp"]},"application/sdp":{"source":"iana","extensions":["sdp"]},"application/secevent+jwt":{"source":"iana"},"application/senml+cbor":{"source":"iana"},"application/senml+json":{"source":"iana","compressible":true},"application/senml+xml":{"source":"iana","compressible":true,"extensions":["senmlx"]},"application/senml-etch+cbor":{"source":"iana"},"application/senml-etch+json":{"source":"iana","compressible":true},"application/senml-exi":{"source":"iana"},"application/sensml+cbor":{"source":"iana"},"application/sensml+json":{"source":"iana","compressible":true},"application/sensml+xml":{"source":"iana","compressible":true,"extensions":["sensmlx"]},"application/sensml-exi":{"source":"iana"},"application/sep+xml":{"source":"iana","compressible":true},"application/sep-exi":{"source":"iana"},"application/session-info":{"source":"iana"},"application/set-payment":{"source":"iana"},"application/set-payment-initiation":{"source":"iana","extensions":["setpay"]},"application/set-registration":{"source":"iana"},"application/set-registration-initiation":{"source":"iana","extensions":["setreg"]},"application/sgml":{"source":"iana"},"application/sgml-open-catalog":{"source":"iana"},"application/shf+xml":{"source":"iana","compressible":true,"extensions":["shf"]},"application/sieve":{"source":"iana","extensions":["siv","sieve"]},"application/simple-filter+xml":{"source":"iana","compressible":true},"application/simple-message-summary":{"source":"iana"},"application/simplesymbolcontainer":{"source":"iana"},"application/sipc":{"source":"iana"},"application/slate":{"source":"iana"},"application/smil":{"source":"iana"},"application/smil+xml":{"source":"iana","compressible":true,"extensions":["smi","smil"]},"application/smpte336m":{"source":"iana"},"application/soap+fastinfoset":{"source":"iana"},"application/soap+xml":{"source":"iana","compressible":true},"application/sparql-query":{"source":"iana","extensions":["rq"]},"application/sparql-results+xml":{"source":"iana","compressible":true,"extensions":["srx"]},"application/spdx+json":{"source":"iana","compressible":true},"application/spirits-event+xml":{"source":"iana","compressible":true},"application/sql":{"source":"iana"},"application/srgs":{"source":"iana","extensions":["gram"]},"application/srgs+xml":{"source":"iana","compressible":true,"extensions":["grxml"]},"application/sru+xml":{"source":"iana","compressible":true,"extensions":["sru"]},"application/ssdl+xml":{"source":"apache","compressible":true,"extensions":["ssdl"]},"application/ssml+xml":{"source":"iana","compressible":true,"extensions":["ssml"]},"application/stix+json":{"source":"iana","compressible":true},"application/swid+xml":{"source":"iana","compressible":true,"extensions":["swidtag"]},"application/tamp-apex-update":{"source":"iana"},"application/tamp-apex-update-confirm":{"source":"iana"},"application/tamp-community-update":{"source":"iana"},"application/tamp-community-update-confirm":{"source":"iana"},"application/tamp-error":{"source":"iana"},"application/tamp-sequence-adjust":{"source":"iana"},"application/tamp-sequence-adjust-confirm":{"source":"iana"},"application/tamp-status-query":{"source":"iana"},"application/tamp-status-response":{"source":"iana"},"application/tamp-update":{"source":"iana"},"application/tamp-update-confirm":{"source":"iana"},"application/tar":{"compressible":true},"application/taxii+json":{"source":"iana","compressible":true},"application/td+json":{"source":"iana","compressible":true},"application/tei+xml":{"source":"iana","compressible":true,"extensions":["tei","teicorpus"]},"application/tetra_isi":{"source":"iana"},"application/thraud+xml":{"source":"iana","compressible":true,"extensions":["tfi"]},"application/timestamp-query":{"source":"iana"},"application/timestamp-reply":{"source":"iana"},"application/timestamped-data":{"source":"iana","extensions":["tsd"]},"application/tlsrpt+gzip":{"source":"iana"},"application/tlsrpt+json":{"source":"iana","compressible":true},"application/tnauthlist":{"source":"iana"},"application/token-introspection+jwt":{"source":"iana"},"application/toml":{"compressible":true,"extensions":["toml"]},"application/trickle-ice-sdpfrag":{"source":"iana"},"application/trig":{"source":"iana","extensions":["trig"]},"application/ttml+xml":{"source":"iana","compressible":true,"extensions":["ttml"]},"application/tve-trigger":{"source":"iana"},"application/tzif":{"source":"iana"},"application/tzif-leap":{"source":"iana"},"application/ubjson":{"compressible":false,"extensions":["ubj"]},"application/ulpfec":{"source":"iana"},"application/urc-grpsheet+xml":{"source":"iana","compressible":true},"application/urc-ressheet+xml":{"source":"iana","compressible":true,"extensions":["rsheet"]},"application/urc-targetdesc+xml":{"source":"iana","compressible":true,"extensions":["td"]},"application/urc-uisocketdesc+xml":{"source":"iana","compressible":true},"application/vcard+json":{"source":"iana","compressible":true},"application/vcard+xml":{"source":"iana","compressible":true},"application/vemmi":{"source":"iana"},"application/vividence.scriptfile":{"source":"apache"},"application/vnd.1000minds.decision-model+xml":{"source":"iana","compressible":true,"extensions":["1km"]},"application/vnd.3gpp-prose+xml":{"source":"iana","compressible":true},"application/vnd.3gpp-prose-pc3ch+xml":{"source":"iana","compressible":true},"application/vnd.3gpp-v2x-local-service-information":{"source":"iana"},"application/vnd.3gpp.5gnas":{"source":"iana"},"application/vnd.3gpp.access-transfer-events+xml":{"source":"iana","compressible":true},"application/vnd.3gpp.bsf+xml":{"source":"iana","compressible":true},"application/vnd.3gpp.gmop+xml":{"source":"iana","compressible":true},"application/vnd.3gpp.gtpc":{"source":"iana"},"application/vnd.3gpp.interworking-data":{"source":"iana"},"application/vnd.3gpp.lpp":{"source":"iana"},"application/vnd.3gpp.mc-signalling-ear":{"source":"iana"},"application/vnd.3gpp.mcdata-affiliation-command+xml":{"source":"iana","compressible":true},"application/vnd.3gpp.mcdata-info+xml":{"source":"iana","compressible":true},"application/vnd.3gpp.mcdata-payload":{"source":"iana"},"application/vnd.3gpp.mcdata-service-config+xml":{"source":"iana","compressible":true},"application/vnd.3gpp.mcdata-signalling":{"source":"iana"},"application/vnd.3gpp.mcdata-ue-config+xml":{"source":"iana","compressible":true},"application/vnd.3gpp.mcdata-user-profile+xml":{"source":"iana","compressible":true},"application/vnd.3gpp.mcptt-affiliation-command+xml":{"source":"iana","compressible":true},"application/vnd.3gpp.mcptt-floor-request+xml":{"source":"iana","compressible":true},"application/vnd.3gpp.mcptt-info+xml":{"source":"iana","compressible":true},"application/vnd.3gpp.mcptt-location-info+xml":{"source":"iana","compressible":true},"application/vnd.3gpp.mcptt-mbms-usage-info+xml":{"source":"iana","compressible":true},"application/vnd.3gpp.mcptt-service-config+xml":{"source":"iana","compressible":true},"application/vnd.3gpp.mcptt-signed+xml":{"source":"iana","compressible":true},"application/vnd.3gpp.mcptt-ue-config+xml":{"source":"iana","compressible":true},"application/vnd.3gpp.mcptt-ue-init-config+xml":{"source":"iana","compressible":true},"application/vnd.3gpp.mcptt-user-profile+xml":{"source":"iana","compressible":true},"application/vnd.3gpp.mcvideo-affiliation-command+xml":{"source":"iana","compressible":true},"application/vnd.3gpp.mcvideo-affiliation-info+xml":{"source":"iana","compressible":true},"application/vnd.3gpp.mcvideo-info+xml":{"source":"iana","compressible":true},"application/vnd.3gpp.mcvideo-location-info+xml":{"source":"iana","compressible":true},"application/vnd.3gpp.mcvideo-mbms-usage-info+xml":{"source":"iana","compressible":true},"application/vnd.3gpp.mcvideo-service-config+xml":{"source":"iana","compressible":true},"application/vnd.3gpp.mcvideo-transmission-request+xml":{"source":"iana","compressible":true},"application/vnd.3gpp.mcvideo-ue-config+xml":{"source":"iana","compressible":true},"application/vnd.3gpp.mcvideo-user-profile+xml":{"source":"iana","compressible":true},"application/vnd.3gpp.mid-call+xml":{"source":"iana","compressible":true},"application/vnd.3gpp.ngap":{"source":"iana"},"application/vnd.3gpp.pfcp":{"source":"iana"},"application/vnd.3gpp.pic-bw-large":{"source":"iana","extensions":["plb"]},"application/vnd.3gpp.pic-bw-small":{"source":"iana","extensions":["psb"]},"application/vnd.3gpp.pic-bw-var":{"source":"iana","extensions":["pvb"]},"application/vnd.3gpp.s1ap":{"source":"iana"},"application/vnd.3gpp.sms":{"source":"iana"},"application/vnd.3gpp.sms+xml":{"source":"iana","compressible":true},"application/vnd.3gpp.srvcc-ext+xml":{"source":"iana","compressible":true},"application/vnd.3gpp.srvcc-info+xml":{"source":"iana","compressible":true},"application/vnd.3gpp.state-and-event-info+xml":{"source":"iana","compressible":true},"application/vnd.3gpp.ussd+xml":{"source":"iana","compressible":true},"application/vnd.3gpp2.bcmcsinfo+xml":{"source":"iana","compressible":true},"application/vnd.3gpp2.sms":{"source":"iana"},"application/vnd.3gpp2.tcap":{"source":"iana","extensions":["tcap"]},"application/vnd.3lightssoftware.imagescal":{"source":"iana"},"application/vnd.3m.post-it-notes":{"source":"iana","extensions":["pwn"]},"application/vnd.accpac.simply.aso":{"source":"iana","extensions":["aso"]},"application/vnd.accpac.simply.imp":{"source":"iana","extensions":["imp"]},"application/vnd.acucobol":{"source":"iana","extensions":["acu"]},"application/vnd.acucorp":{"source":"iana","extensions":["atc","acutc"]},"application/vnd.adobe.air-application-installer-package+zip":{"source":"apache","compressible":false,"extensions":["air"]},"application/vnd.adobe.flash.movie":{"source":"iana"},"application/vnd.adobe.formscentral.fcdt":{"source":"iana","extensions":["fcdt"]},"application/vnd.adobe.fxp":{"source":"iana","extensions":["fxp","fxpl"]},"application/vnd.adobe.partial-upload":{"source":"iana"},"application/vnd.adobe.xdp+xml":{"source":"iana","compressible":true,"extensions":["xdp"]},"application/vnd.adobe.xfdf":{"source":"iana","extensions":["xfdf"]},"application/vnd.aether.imp":{"source":"iana"},"application/vnd.afpc.afplinedata":{"source":"iana"},"application/vnd.afpc.afplinedata-pagedef":{"source":"iana"},"application/vnd.afpc.cmoca-cmresource":{"source":"iana"},"application/vnd.afpc.foca-charset":{"source":"iana"},"application/vnd.afpc.foca-codedfont":{"source":"iana"},"application/vnd.afpc.foca-codepage":{"source":"iana"},"application/vnd.afpc.modca":{"source":"iana"},"application/vnd.afpc.modca-cmtable":{"source":"iana"},"application/vnd.afpc.modca-formdef":{"source":"iana"},"application/vnd.afpc.modca-mediummap":{"source":"iana"},"application/vnd.afpc.modca-objectcontainer":{"source":"iana"},"application/vnd.afpc.modca-overlay":{"source":"iana"},"application/vnd.afpc.modca-pagesegment":{"source":"iana"},"application/vnd.age":{"source":"iana","extensions":["age"]},"application/vnd.ah-barcode":{"source":"iana"},"application/vnd.ahead.space":{"source":"iana","extensions":["ahead"]},"application/vnd.airzip.filesecure.azf":{"source":"iana","extensions":["azf"]},"application/vnd.airzip.filesecure.azs":{"source":"iana","extensions":["azs"]},"application/vnd.amadeus+json":{"source":"iana","compressible":true},"application/vnd.amazon.ebook":{"source":"apache","extensions":["azw"]},"application/vnd.amazon.mobi8-ebook":{"source":"iana"},"application/vnd.americandynamics.acc":{"source":"iana","extensions":["acc"]},"application/vnd.amiga.ami":{"source":"iana","extensions":["ami"]},"application/vnd.amundsen.maze+xml":{"source":"iana","compressible":true},"application/vnd.android.ota":{"source":"iana"},"application/vnd.android.package-archive":{"source":"apache","compressible":false,"extensions":["apk"]},"application/vnd.anki":{"source":"iana"},"application/vnd.anser-web-certificate-issue-initiation":{"source":"iana","extensions":["cii"]},"application/vnd.anser-web-funds-transfer-initiation":{"source":"apache","extensions":["fti"]},"application/vnd.antix.game-component":{"source":"iana","extensions":["atx"]},"application/vnd.apache.arrow.file":{"source":"iana"},"application/vnd.apache.arrow.stream":{"source":"iana"},"application/vnd.apache.thrift.binary":{"source":"iana"},"application/vnd.apache.thrift.compact":{"source":"iana"},"application/vnd.apache.thrift.json":{"source":"iana"},"application/vnd.api+json":{"source":"iana","compressible":true},"application/vnd.aplextor.warrp+json":{"source":"iana","compressible":true},"application/vnd.apothekende.reservation+json":{"source":"iana","compressible":true},"application/vnd.apple.installer+xml":{"source":"iana","compressible":true,"extensions":["mpkg"]},"application/vnd.apple.keynote":{"source":"iana","extensions":["key"]},"application/vnd.apple.mpegurl":{"source":"iana","extensions":["m3u8"]},"application/vnd.apple.numbers":{"source":"iana","extensions":["numbers"]},"application/vnd.apple.pages":{"source":"iana","extensions":["pages"]},"application/vnd.apple.pkpass":{"compressible":false,"extensions":["pkpass"]},"application/vnd.arastra.swi":{"source":"iana"},"application/vnd.aristanetworks.swi":{"source":"iana","extensions":["swi"]},"application/vnd.artisan+json":{"source":"iana","compressible":true},"application/vnd.artsquare":{"source":"iana"},"application/vnd.astraea-software.iota":{"source":"iana","extensions":["iota"]},"application/vnd.audiograph":{"source":"iana","extensions":["aep"]},"application/vnd.autopackage":{"source":"iana"},"application/vnd.avalon+json":{"source":"iana","compressible":true},"application/vnd.avistar+xml":{"source":"iana","compressible":true},"application/vnd.balsamiq.bmml+xml":{"source":"iana","compressible":true,"extensions":["bmml"]},"application/vnd.balsamiq.bmpr":{"source":"iana"},"application/vnd.banana-accounting":{"source":"iana"},"application/vnd.bbf.usp.error":{"source":"iana"},"application/vnd.bbf.usp.msg":{"source":"iana"},"application/vnd.bbf.usp.msg+json":{"source":"iana","compressible":true},"application/vnd.bekitzur-stech+json":{"source":"iana","compressible":true},"application/vnd.bint.med-content":{"source":"iana"},"application/vnd.biopax.rdf+xml":{"source":"iana","compressible":true},"application/vnd.blink-idb-value-wrapper":{"source":"iana"},"application/vnd.blueice.multipass":{"source":"iana","extensions":["mpm"]},"application/vnd.bluetooth.ep.oob":{"source":"iana"},"application/vnd.bluetooth.le.oob":{"source":"iana"},"application/vnd.bmi":{"source":"iana","extensions":["bmi"]},"application/vnd.bpf":{"source":"iana"},"application/vnd.bpf3":{"source":"iana"},"application/vnd.businessobjects":{"source":"iana","extensions":["rep"]},"application/vnd.byu.uapi+json":{"source":"iana","compressible":true},"application/vnd.cab-jscript":{"source":"iana"},"application/vnd.canon-cpdl":{"source":"iana"},"application/vnd.canon-lips":{"source":"iana"},"application/vnd.capasystems-pg+json":{"source":"iana","compressible":true},"application/vnd.cendio.thinlinc.clientconf":{"source":"iana"},"application/vnd.century-systems.tcp_stream":{"source":"iana"},"application/vnd.chemdraw+xml":{"source":"iana","compressible":true,"extensions":["cdxml"]},"application/vnd.chess-pgn":{"source":"iana"},"application/vnd.chipnuts.karaoke-mmd":{"source":"iana","extensions":["mmd"]},"application/vnd.ciedi":{"source":"iana"},"application/vnd.cinderella":{"source":"iana","extensions":["cdy"]},"application/vnd.cirpack.isdn-ext":{"source":"iana"},"application/vnd.citationstyles.style+xml":{"source":"iana","compressible":true,"extensions":["csl"]},"application/vnd.claymore":{"source":"iana","extensions":["cla"]},"application/vnd.cloanto.rp9":{"source":"iana","extensions":["rp9"]},"application/vnd.clonk.c4group":{"source":"iana","extensions":["c4g","c4d","c4f","c4p","c4u"]},"application/vnd.cluetrust.cartomobile-config":{"source":"iana","extensions":["c11amc"]},"application/vnd.cluetrust.cartomobile-config-pkg":{"source":"iana","extensions":["c11amz"]},"application/vnd.coffeescript":{"source":"iana"},"application/vnd.collabio.xodocuments.document":{"source":"iana"},"application/vnd.collabio.xodocuments.document-template":{"source":"iana"},"application/vnd.collabio.xodocuments.presentation":{"source":"iana"},"application/vnd.collabio.xodocuments.presentation-template":{"source":"iana"},"application/vnd.collabio.xodocuments.spreadsheet":{"source":"iana"},"application/vnd.collabio.xodocuments.spreadsheet-template":{"source":"iana"},"application/vnd.collection+json":{"source":"iana","compressible":true},"application/vnd.collection.doc+json":{"source":"iana","compressible":true},"application/vnd.collection.next+json":{"source":"iana","compressible":true},"application/vnd.comicbook+zip":{"source":"iana","compressible":false},"application/vnd.comicbook-rar":{"source":"iana"},"application/vnd.commerce-battelle":{"source":"iana"},"application/vnd.commonspace":{"source":"iana","extensions":["csp"]},"application/vnd.contact.cmsg":{"source":"iana","extensions":["cdbcmsg"]},"application/vnd.coreos.ignition+json":{"source":"iana","compressible":true},"application/vnd.cosmocaller":{"source":"iana","extensions":["cmc"]},"application/vnd.crick.clicker":{"source":"iana","extensions":["clkx"]},"application/vnd.crick.clicker.keyboard":{"source":"iana","extensions":["clkk"]},"application/vnd.crick.clicker.palette":{"source":"iana","extensions":["clkp"]},"application/vnd.crick.clicker.template":{"source":"iana","extensions":["clkt"]},"application/vnd.crick.clicker.wordbank":{"source":"iana","extensions":["clkw"]},"application/vnd.criticaltools.wbs+xml":{"source":"iana","compressible":true,"extensions":["wbs"]},"application/vnd.cryptii.pipe+json":{"source":"iana","compressible":true},"application/vnd.crypto-shade-file":{"source":"iana"},"application/vnd.cryptomator.encrypted":{"source":"iana"},"application/vnd.cryptomator.vault":{"source":"iana"},"application/vnd.ctc-posml":{"source":"iana","extensions":["pml"]},"application/vnd.ctct.ws+xml":{"source":"iana","compressible":true},"application/vnd.cups-pdf":{"source":"iana"},"application/vnd.cups-postscript":{"source":"iana"},"application/vnd.cups-ppd":{"source":"iana","extensions":["ppd"]},"application/vnd.cups-raster":{"source":"iana"},"application/vnd.cups-raw":{"source":"iana"},"application/vnd.curl":{"source":"iana"},"application/vnd.curl.car":{"source":"apache","extensions":["car"]},"application/vnd.curl.pcurl":{"source":"apache","extensions":["pcurl"]},"application/vnd.cyan.dean.root+xml":{"source":"iana","compressible":true},"application/vnd.cybank":{"source":"iana"},"application/vnd.cyclonedx+json":{"source":"iana","compressible":true},"application/vnd.cyclonedx+xml":{"source":"iana","compressible":true},"application/vnd.d2l.coursepackage1p0+zip":{"source":"iana","compressible":false},"application/vnd.d3m-dataset":{"source":"iana"},"application/vnd.d3m-problem":{"source":"iana"},"application/vnd.dart":{"source":"iana","compressible":true,"extensions":["dart"]},"application/vnd.data-vision.rdz":{"source":"iana","extensions":["rdz"]},"application/vnd.datapackage+json":{"source":"iana","compressible":true},"application/vnd.dataresource+json":{"source":"iana","compressible":true},"application/vnd.dbf":{"source":"iana","extensions":["dbf"]},"application/vnd.debian.binary-package":{"source":"iana"},"application/vnd.dece.data":{"source":"iana","extensions":["uvf","uvvf","uvd","uvvd"]},"application/vnd.dece.ttml+xml":{"source":"iana","compressible":true,"extensions":["uvt","uvvt"]},"application/vnd.dece.unspecified":{"source":"iana","extensions":["uvx","uvvx"]},"application/vnd.dece.zip":{"source":"iana","extensions":["uvz","uvvz"]},"application/vnd.denovo.fcselayout-link":{"source":"iana","extensions":["fe_launch"]},"application/vnd.desmume.movie":{"source":"iana"},"application/vnd.dir-bi.plate-dl-nosuffix":{"source":"iana"},"application/vnd.dm.delegation+xml":{"source":"iana","compressible":true},"application/vnd.dna":{"source":"iana","extensions":["dna"]},"application/vnd.document+json":{"source":"iana","compressible":true},"application/vnd.dolby.mlp":{"source":"apache","extensions":["mlp"]},"application/vnd.dolby.mobile.1":{"source":"iana"},"application/vnd.dolby.mobile.2":{"source":"iana"},"application/vnd.doremir.scorecloud-binary-document":{"source":"iana"},"application/vnd.dpgraph":{"source":"iana","extensions":["dpg"]},"application/vnd.dreamfactory":{"source":"iana","extensions":["dfac"]},"application/vnd.drive+json":{"source":"iana","compressible":true},"application/vnd.ds-keypoint":{"source":"apache","extensions":["kpxx"]},"application/vnd.dtg.local":{"source":"iana"},"application/vnd.dtg.local.flash":{"source":"iana"},"application/vnd.dtg.local.html":{"source":"iana"},"application/vnd.dvb.ait":{"source":"iana","extensions":["ait"]},"application/vnd.dvb.dvbisl+xml":{"source":"iana","compressible":true},"application/vnd.dvb.dvbj":{"source":"iana"},"application/vnd.dvb.esgcontainer":{"source":"iana"},"application/vnd.dvb.ipdcdftnotifaccess":{"source":"iana"},"application/vnd.dvb.ipdcesgaccess":{"source":"iana"},"application/vnd.dvb.ipdcesgaccess2":{"source":"iana"},"application/vnd.dvb.ipdcesgpdd":{"source":"iana"},"application/vnd.dvb.ipdcroaming":{"source":"iana"},"application/vnd.dvb.iptv.alfec-base":{"source":"iana"},"application/vnd.dvb.iptv.alfec-enhancement":{"source":"iana"},"application/vnd.dvb.notif-aggregate-root+xml":{"source":"iana","compressible":true},"application/vnd.dvb.notif-container+xml":{"source":"iana","compressible":true},"application/vnd.dvb.notif-generic+xml":{"source":"iana","compressible":true},"application/vnd.dvb.notif-ia-msglist+xml":{"source":"iana","compressible":true},"application/vnd.dvb.notif-ia-registration-request+xml":{"source":"iana","compressible":true},"application/vnd.dvb.notif-ia-registration-response+xml":{"source":"iana","compressible":true},"application/vnd.dvb.notif-init+xml":{"source":"iana","compressible":true},"application/vnd.dvb.pfr":{"source":"iana"},"application/vnd.dvb.service":{"source":"iana","extensions":["svc"]},"application/vnd.dxr":{"source":"iana"},"application/vnd.dynageo":{"source":"iana","extensions":["geo"]},"application/vnd.dzr":{"source":"iana"},"application/vnd.easykaraoke.cdgdownload":{"source":"iana"},"application/vnd.ecdis-update":{"source":"iana"},"application/vnd.ecip.rlp":{"source":"iana"},"application/vnd.eclipse.ditto+json":{"source":"iana","compressible":true},"application/vnd.ecowin.chart":{"source":"iana","extensions":["mag"]},"application/vnd.ecowin.filerequest":{"source":"iana"},"application/vnd.ecowin.fileupdate":{"source":"iana"},"application/vnd.ecowin.series":{"source":"iana"},"application/vnd.ecowin.seriesrequest":{"source":"iana"},"application/vnd.ecowin.seriesupdate":{"source":"iana"},"application/vnd.efi.img":{"source":"iana"},"application/vnd.efi.iso":{"source":"iana"},"application/vnd.emclient.accessrequest+xml":{"source":"iana","compressible":true},"application/vnd.enliven":{"source":"iana","extensions":["nml"]},"application/vnd.enphase.envoy":{"source":"iana"},"application/vnd.eprints.data+xml":{"source":"iana","compressible":true},"application/vnd.epson.esf":{"source":"iana","extensions":["esf"]},"application/vnd.epson.msf":{"source":"iana","extensions":["msf"]},"application/vnd.epson.quickanime":{"source":"iana","extensions":["qam"]},"application/vnd.epson.salt":{"source":"iana","extensions":["slt"]},"application/vnd.epson.ssf":{"source":"iana","extensions":["ssf"]},"application/vnd.ericsson.quickcall":{"source":"iana"},"application/vnd.espass-espass+zip":{"source":"iana","compressible":false},"application/vnd.eszigno3+xml":{"source":"iana","compressible":true,"extensions":["es3","et3"]},"application/vnd.etsi.aoc+xml":{"source":"iana","compressible":true},"application/vnd.etsi.asic-e+zip":{"source":"iana","compressible":false},"application/vnd.etsi.asic-s+zip":{"source":"iana","compressible":false},"application/vnd.etsi.cug+xml":{"source":"iana","compressible":true},"application/vnd.etsi.iptvcommand+xml":{"source":"iana","compressible":true},"application/vnd.etsi.iptvdiscovery+xml":{"source":"iana","compressible":true},"application/vnd.etsi.iptvprofile+xml":{"source":"iana","compressible":true},"application/vnd.etsi.iptvsad-bc+xml":{"source":"iana","compressible":true},"application/vnd.etsi.iptvsad-cod+xml":{"source":"iana","compressible":true},"application/vnd.etsi.iptvsad-npvr+xml":{"source":"iana","compressible":true},"application/vnd.etsi.iptvservice+xml":{"source":"iana","compressible":true},"application/vnd.etsi.iptvsync+xml":{"source":"iana","compressible":true},"application/vnd.etsi.iptvueprofile+xml":{"source":"iana","compressible":true},"application/vnd.etsi.mcid+xml":{"source":"iana","compressible":true},"application/vnd.etsi.mheg5":{"source":"iana"},"application/vnd.etsi.overload-control-policy-dataset+xml":{"source":"iana","compressible":true},"application/vnd.etsi.pstn+xml":{"source":"iana","compressible":true},"application/vnd.etsi.sci+xml":{"source":"iana","compressible":true},"application/vnd.etsi.simservs+xml":{"source":"iana","compressible":true},"application/vnd.etsi.timestamp-token":{"source":"iana"},"application/vnd.etsi.tsl+xml":{"source":"iana","compressible":true},"application/vnd.etsi.tsl.der":{"source":"iana"},"application/vnd.eu.kasparian.car+json":{"source":"iana","compressible":true},"application/vnd.eudora.data":{"source":"iana"},"application/vnd.evolv.ecig.profile":{"source":"iana"},"application/vnd.evolv.ecig.settings":{"source":"iana"},"application/vnd.evolv.ecig.theme":{"source":"iana"},"application/vnd.exstream-empower+zip":{"source":"iana","compressible":false},"application/vnd.exstream-package":{"source":"iana"},"application/vnd.ezpix-album":{"source":"iana","extensions":["ez2"]},"application/vnd.ezpix-package":{"source":"iana","extensions":["ez3"]},"application/vnd.f-secure.mobile":{"source":"iana"},"application/vnd.familysearch.gedcom+zip":{"source":"iana","compressible":false},"application/vnd.fastcopy-disk-image":{"source":"iana"},"application/vnd.fdf":{"source":"iana","extensions":["fdf"]},"application/vnd.fdsn.mseed":{"source":"iana","extensions":["mseed"]},"application/vnd.fdsn.seed":{"source":"iana","extensions":["seed","dataless"]},"application/vnd.ffsns":{"source":"iana"},"application/vnd.ficlab.flb+zip":{"source":"iana","compressible":false},"application/vnd.filmit.zfc":{"source":"iana"},"application/vnd.fints":{"source":"iana"},"application/vnd.firemonkeys.cloudcell":{"source":"iana"},"application/vnd.flographit":{"source":"iana","extensions":["gph"]},"application/vnd.fluxtime.clip":{"source":"iana","extensions":["ftc"]},"application/vnd.font-fontforge-sfd":{"source":"iana"},"application/vnd.framemaker":{"source":"iana","extensions":["fm","frame","maker","book"]},"application/vnd.frogans.fnc":{"source":"iana","extensions":["fnc"]},"application/vnd.frogans.ltf":{"source":"iana","extensions":["ltf"]},"application/vnd.fsc.weblaunch":{"source":"iana","extensions":["fsc"]},"application/vnd.fujifilm.fb.docuworks":{"source":"iana"},"application/vnd.fujifilm.fb.docuworks.binder":{"source":"iana"},"application/vnd.fujifilm.fb.docuworks.container":{"source":"iana"},"application/vnd.fujifilm.fb.jfi+xml":{"source":"iana","compressible":true},"application/vnd.fujitsu.oasys":{"source":"iana","extensions":["oas"]},"application/vnd.fujitsu.oasys2":{"source":"iana","extensions":["oa2"]},"application/vnd.fujitsu.oasys3":{"source":"iana","extensions":["oa3"]},"application/vnd.fujitsu.oasysgp":{"source":"iana","extensions":["fg5"]},"application/vnd.fujitsu.oasysprs":{"source":"iana","extensions":["bh2"]},"application/vnd.fujixerox.art-ex":{"source":"iana"},"application/vnd.fujixerox.art4":{"source":"iana"},"application/vnd.fujixerox.ddd":{"source":"iana","extensions":["ddd"]},"application/vnd.fujixerox.docuworks":{"source":"iana","extensions":["xdw"]},"application/vnd.fujixerox.docuworks.binder":{"source":"iana","extensions":["xbd"]},"application/vnd.fujixerox.docuworks.container":{"source":"iana"},"application/vnd.fujixerox.hbpl":{"source":"iana"},"application/vnd.fut-misnet":{"source":"iana"},"application/vnd.futoin+cbor":{"source":"iana"},"application/vnd.futoin+json":{"source":"iana","compressible":true},"application/vnd.fuzzysheet":{"source":"iana","extensions":["fzs"]},"application/vnd.genomatix.tuxedo":{"source":"iana","extensions":["txd"]},"application/vnd.gentics.grd+json":{"source":"iana","compressible":true},"application/vnd.geo+json":{"source":"iana","compressible":true},"application/vnd.geocube+xml":{"source":"iana","compressible":true},"application/vnd.geogebra.file":{"source":"iana","extensions":["ggb"]},"application/vnd.geogebra.slides":{"source":"iana"},"application/vnd.geogebra.tool":{"source":"iana","extensions":["ggt"]},"application/vnd.geometry-explorer":{"source":"iana","extensions":["gex","gre"]},"application/vnd.geonext":{"source":"iana","extensions":["gxt"]},"application/vnd.geoplan":{"source":"iana","extensions":["g2w"]},"application/vnd.geospace":{"source":"iana","extensions":["g3w"]},"application/vnd.gerber":{"source":"iana"},"application/vnd.globalplatform.card-content-mgt":{"source":"iana"},"application/vnd.globalplatform.card-content-mgt-response":{"source":"iana"},"application/vnd.gmx":{"source":"iana","extensions":["gmx"]},"application/vnd.google-apps.document":{"compressible":false,"extensions":["gdoc"]},"application/vnd.google-apps.presentation":{"compressible":false,"extensions":["gslides"]},"application/vnd.google-apps.spreadsheet":{"compressible":false,"extensions":["gsheet"]},"application/vnd.google-earth.kml+xml":{"source":"iana","compressible":true,"extensions":["kml"]},"application/vnd.google-earth.kmz":{"source":"iana","compressible":false,"extensions":["kmz"]},"application/vnd.gov.sk.e-form+xml":{"source":"iana","compressible":true},"application/vnd.gov.sk.e-form+zip":{"source":"iana","compressible":false},"application/vnd.gov.sk.xmldatacontainer+xml":{"source":"iana","compressible":true},"application/vnd.grafeq":{"source":"iana","extensions":["gqf","gqs"]},"application/vnd.gridmp":{"source":"iana"},"application/vnd.groove-account":{"source":"iana","extensions":["gac"]},"application/vnd.groove-help":{"source":"iana","extensions":["ghf"]},"application/vnd.groove-identity-message":{"source":"iana","extensions":["gim"]},"application/vnd.groove-injector":{"source":"iana","extensions":["grv"]},"application/vnd.groove-tool-message":{"source":"iana","extensions":["gtm"]},"application/vnd.groove-tool-template":{"source":"iana","extensions":["tpl"]},"application/vnd.groove-vcard":{"source":"iana","extensions":["vcg"]},"application/vnd.hal+json":{"source":"iana","compressible":true},"application/vnd.hal+xml":{"source":"iana","compressible":true,"extensions":["hal"]},"application/vnd.handheld-entertainment+xml":{"source":"iana","compressible":true,"extensions":["zmm"]},"application/vnd.hbci":{"source":"iana","extensions":["hbci"]},"application/vnd.hc+json":{"source":"iana","compressible":true},"application/vnd.hcl-bireports":{"source":"iana"},"application/vnd.hdt":{"source":"iana"},"application/vnd.heroku+json":{"source":"iana","compressible":true},"application/vnd.hhe.lesson-player":{"source":"iana","extensions":["les"]},"application/vnd.hl7cda+xml":{"source":"iana","charset":"UTF-8","compressible":true},"application/vnd.hl7v2+xml":{"source":"iana","charset":"UTF-8","compressible":true},"application/vnd.hp-hpgl":{"source":"iana","extensions":["hpgl"]},"application/vnd.hp-hpid":{"source":"iana","extensions":["hpid"]},"application/vnd.hp-hps":{"source":"iana","extensions":["hps"]},"application/vnd.hp-jlyt":{"source":"iana","extensions":["jlt"]},"application/vnd.hp-pcl":{"source":"iana","extensions":["pcl"]},"application/vnd.hp-pclxl":{"source":"iana","extensions":["pclxl"]},"application/vnd.httphone":{"source":"iana"},"application/vnd.hydrostatix.sof-data":{"source":"iana","extensions":["sfd-hdstx"]},"application/vnd.hyper+json":{"source":"iana","compressible":true},"application/vnd.hyper-item+json":{"source":"iana","compressible":true},"application/vnd.hyperdrive+json":{"source":"iana","compressible":true},"application/vnd.hzn-3d-crossword":{"source":"iana"},"application/vnd.ibm.afplinedata":{"source":"iana"},"application/vnd.ibm.electronic-media":{"source":"iana"},"application/vnd.ibm.minipay":{"source":"iana","extensions":["mpy"]},"application/vnd.ibm.modcap":{"source":"iana","extensions":["afp","listafp","list3820"]},"application/vnd.ibm.rights-management":{"source":"iana","extensions":["irm"]},"application/vnd.ibm.secure-container":{"source":"iana","extensions":["sc"]},"application/vnd.iccprofile":{"source":"iana","extensions":["icc","icm"]},"application/vnd.ieee.1905":{"source":"iana"},"application/vnd.igloader":{"source":"iana","extensions":["igl"]},"application/vnd.imagemeter.folder+zip":{"source":"iana","compressible":false},"application/vnd.imagemeter.image+zip":{"source":"iana","compressible":false},"application/vnd.immervision-ivp":{"source":"iana","extensions":["ivp"]},"application/vnd.immervision-ivu":{"source":"iana","extensions":["ivu"]},"application/vnd.ims.imsccv1p1":{"source":"iana"},"application/vnd.ims.imsccv1p2":{"source":"iana"},"application/vnd.ims.imsccv1p3":{"source":"iana"},"application/vnd.ims.lis.v2.result+json":{"source":"iana","compressible":true},"application/vnd.ims.lti.v2.toolconsumerprofile+json":{"source":"iana","compressible":true},"application/vnd.ims.lti.v2.toolproxy+json":{"source":"iana","compressible":true},"application/vnd.ims.lti.v2.toolproxy.id+json":{"source":"iana","compressible":true},"application/vnd.ims.lti.v2.toolsettings+json":{"source":"iana","compressible":true},"application/vnd.ims.lti.v2.toolsettings.simple+json":{"source":"iana","compressible":true},"application/vnd.informedcontrol.rms+xml":{"source":"iana","compressible":true},"application/vnd.informix-visionary":{"source":"iana"},"application/vnd.infotech.project":{"source":"iana"},"application/vnd.infotech.project+xml":{"source":"iana","compressible":true},"application/vnd.innopath.wamp.notification":{"source":"iana"},"application/vnd.insors.igm":{"source":"iana","extensions":["igm"]},"application/vnd.intercon.formnet":{"source":"iana","extensions":["xpw","xpx"]},"application/vnd.intergeo":{"source":"iana","extensions":["i2g"]},"application/vnd.intertrust.digibox":{"source":"iana"},"application/vnd.intertrust.nncp":{"source":"iana"},"application/vnd.intu.qbo":{"source":"iana","extensions":["qbo"]},"application/vnd.intu.qfx":{"source":"iana","extensions":["qfx"]},"application/vnd.iptc.g2.catalogitem+xml":{"source":"iana","compressible":true},"application/vnd.iptc.g2.conceptitem+xml":{"source":"iana","compressible":true},"application/vnd.iptc.g2.knowledgeitem+xml":{"source":"iana","compressible":true},"application/vnd.iptc.g2.newsitem+xml":{"source":"iana","compressible":true},"application/vnd.iptc.g2.newsmessage+xml":{"source":"iana","compressible":true},"application/vnd.iptc.g2.packageitem+xml":{"source":"iana","compressible":true},"application/vnd.iptc.g2.planningitem+xml":{"source":"iana","compressible":true},"application/vnd.ipunplugged.rcprofile":{"source":"iana","extensions":["rcprofile"]},"application/vnd.irepository.package+xml":{"source":"iana","compressible":true,"extensions":["irp"]},"application/vnd.is-xpr":{"source":"iana","extensions":["xpr"]},"application/vnd.isac.fcs":{"source":"iana","extensions":["fcs"]},"application/vnd.iso11783-10+zip":{"source":"iana","compressible":false},"application/vnd.jam":{"source":"iana","extensions":["jam"]},"application/vnd.japannet-directory-service":{"source":"iana"},"application/vnd.japannet-jpnstore-wakeup":{"source":"iana"},"application/vnd.japannet-payment-wakeup":{"source":"iana"},"application/vnd.japannet-registration":{"source":"iana"},"application/vnd.japannet-registration-wakeup":{"source":"iana"},"application/vnd.japannet-setstore-wakeup":{"source":"iana"},"application/vnd.japannet-verification":{"source":"iana"},"application/vnd.japannet-verification-wakeup":{"source":"iana"},"application/vnd.jcp.javame.midlet-rms":{"source":"iana","extensions":["rms"]},"application/vnd.jisp":{"source":"iana","extensions":["jisp"]},"application/vnd.joost.joda-archive":{"source":"iana","extensions":["joda"]},"application/vnd.jsk.isdn-ngn":{"source":"iana"},"application/vnd.kahootz":{"source":"iana","extensions":["ktz","ktr"]},"application/vnd.kde.karbon":{"source":"iana","extensions":["karbon"]},"application/vnd.kde.kchart":{"source":"iana","extensions":["chrt"]},"application/vnd.kde.kformula":{"source":"iana","extensions":["kfo"]},"application/vnd.kde.kivio":{"source":"iana","extensions":["flw"]},"application/vnd.kde.kontour":{"source":"iana","extensions":["kon"]},"application/vnd.kde.kpresenter":{"source":"iana","extensions":["kpr","kpt"]},"application/vnd.kde.kspread":{"source":"iana","extensions":["ksp"]},"application/vnd.kde.kword":{"source":"iana","extensions":["kwd","kwt"]},"application/vnd.kenameaapp":{"source":"iana","extensions":["htke"]},"application/vnd.kidspiration":{"source":"iana","extensions":["kia"]},"application/vnd.kinar":{"source":"iana","extensions":["kne","knp"]},"application/vnd.koan":{"source":"iana","extensions":["skp","skd","skt","skm"]},"application/vnd.kodak-descriptor":{"source":"iana","extensions":["sse"]},"application/vnd.las":{"source":"iana"},"application/vnd.las.las+json":{"source":"iana","compressible":true},"application/vnd.las.las+xml":{"source":"iana","compressible":true,"extensions":["lasxml"]},"application/vnd.laszip":{"source":"iana"},"application/vnd.leap+json":{"source":"iana","compressible":true},"application/vnd.liberty-request+xml":{"source":"iana","compressible":true},"application/vnd.llamagraphics.life-balance.desktop":{"source":"iana","extensions":["lbd"]},"application/vnd.llamagraphics.life-balance.exchange+xml":{"source":"iana","compressible":true,"extensions":["lbe"]},"application/vnd.logipipe.circuit+zip":{"source":"iana","compressible":false},"application/vnd.loom":{"source":"iana"},"application/vnd.lotus-1-2-3":{"source":"iana","extensions":["123"]},"application/vnd.lotus-approach":{"source":"iana","extensions":["apr"]},"application/vnd.lotus-freelance":{"source":"iana","extensions":["pre"]},"application/vnd.lotus-notes":{"source":"iana","extensions":["nsf"]},"application/vnd.lotus-organizer":{"source":"iana","extensions":["org"]},"application/vnd.lotus-screencam":{"source":"iana","extensions":["scm"]},"application/vnd.lotus-wordpro":{"source":"iana","extensions":["lwp"]},"application/vnd.macports.portpkg":{"source":"iana","extensions":["portpkg"]},"application/vnd.mapbox-vector-tile":{"source":"iana","extensions":["mvt"]},"application/vnd.marlin.drm.actiontoken+xml":{"source":"iana","compressible":true},"application/vnd.marlin.drm.conftoken+xml":{"source":"iana","compressible":true},"application/vnd.marlin.drm.license+xml":{"source":"iana","compressible":true},"application/vnd.marlin.drm.mdcf":{"source":"iana"},"application/vnd.mason+json":{"source":"iana","compressible":true},"application/vnd.maxar.archive.3tz+zip":{"source":"iana","compressible":false},"application/vnd.maxmind.maxmind-db":{"source":"iana"},"application/vnd.mcd":{"source":"iana","extensions":["mcd"]},"application/vnd.medcalcdata":{"source":"iana","extensions":["mc1"]},"application/vnd.mediastation.cdkey":{"source":"iana","extensions":["cdkey"]},"application/vnd.meridian-slingshot":{"source":"iana"},"application/vnd.mfer":{"source":"iana","extensions":["mwf"]},"application/vnd.mfmp":{"source":"iana","extensions":["mfm"]},"application/vnd.micro+json":{"source":"iana","compressible":true},"application/vnd.micrografx.flo":{"source":"iana","extensions":["flo"]},"application/vnd.micrografx.igx":{"source":"iana","extensions":["igx"]},"application/vnd.microsoft.portable-executable":{"source":"iana"},"application/vnd.microsoft.windows.thumbnail-cache":{"source":"iana"},"application/vnd.miele+json":{"source":"iana","compressible":true},"application/vnd.mif":{"source":"iana","extensions":["mif"]},"application/vnd.minisoft-hp3000-save":{"source":"iana"},"application/vnd.mitsubishi.misty-guard.trustweb":{"source":"iana"},"application/vnd.mobius.daf":{"source":"iana","extensions":["daf"]},"application/vnd.mobius.dis":{"source":"iana","extensions":["dis"]},"application/vnd.mobius.mbk":{"source":"iana","extensions":["mbk"]},"application/vnd.mobius.mqy":{"source":"iana","extensions":["mqy"]},"application/vnd.mobius.msl":{"source":"iana","extensions":["msl"]},"application/vnd.mobius.plc":{"source":"iana","extensions":["plc"]},"application/vnd.mobius.txf":{"source":"iana","extensions":["txf"]},"application/vnd.mophun.application":{"source":"iana","extensions":["mpn"]},"application/vnd.mophun.certificate":{"source":"iana","extensions":["mpc"]},"application/vnd.motorola.flexsuite":{"source":"iana"},"application/vnd.motorola.flexsuite.adsi":{"source":"iana"},"application/vnd.motorola.flexsuite.fis":{"source":"iana"},"application/vnd.motorola.flexsuite.gotap":{"source":"iana"},"application/vnd.motorola.flexsuite.kmr":{"source":"iana"},"application/vnd.motorola.flexsuite.ttc":{"source":"iana"},"application/vnd.motorola.flexsuite.wem":{"source":"iana"},"application/vnd.motorola.iprm":{"source":"iana"},"application/vnd.mozilla.xul+xml":{"source":"iana","compressible":true,"extensions":["xul"]},"application/vnd.ms-3mfdocument":{"source":"iana"},"application/vnd.ms-artgalry":{"source":"iana","extensions":["cil"]},"application/vnd.ms-asf":{"source":"iana"},"application/vnd.ms-cab-compressed":{"source":"iana","extensions":["cab"]},"application/vnd.ms-color.iccprofile":{"source":"apache"},"application/vnd.ms-excel":{"source":"iana","compressible":false,"extensions":["xls","xlm","xla","xlc","xlt","xlw"]},"application/vnd.ms-excel.addin.macroenabled.12":{"source":"iana","extensions":["xlam"]},"application/vnd.ms-excel.sheet.binary.macroenabled.12":{"source":"iana","extensions":["xlsb"]},"application/vnd.ms-excel.sheet.macroenabled.12":{"source":"iana","extensions":["xlsm"]},"application/vnd.ms-excel.template.macroenabled.12":{"source":"iana","extensions":["xltm"]},"application/vnd.ms-fontobject":{"source":"iana","compressible":true,"extensions":["eot"]},"application/vnd.ms-htmlhelp":{"source":"iana","extensions":["chm"]},"application/vnd.ms-ims":{"source":"iana","extensions":["ims"]},"application/vnd.ms-lrm":{"source":"iana","extensions":["lrm"]},"application/vnd.ms-office.activex+xml":{"source":"iana","compressible":true},"application/vnd.ms-officetheme":{"source":"iana","extensions":["thmx"]},"application/vnd.ms-opentype":{"source":"apache","compressible":true},"application/vnd.ms-outlook":{"compressible":false,"extensions":["msg"]},"application/vnd.ms-package.obfuscated-opentype":{"source":"apache"},"application/vnd.ms-pki.seccat":{"source":"apache","extensions":["cat"]},"application/vnd.ms-pki.stl":{"source":"apache","extensions":["stl"]},"application/vnd.ms-playready.initiator+xml":{"source":"iana","compressible":true},"application/vnd.ms-powerpoint":{"source":"iana","compressible":false,"extensions":["ppt","pps","pot"]},"application/vnd.ms-powerpoint.addin.macroenabled.12":{"source":"iana","extensions":["ppam"]},"application/vnd.ms-powerpoint.presentation.macroenabled.12":{"source":"iana","extensions":["pptm"]},"application/vnd.ms-powerpoint.slide.macroenabled.12":{"source":"iana","extensions":["sldm"]},"application/vnd.ms-powerpoint.slideshow.macroenabled.12":{"source":"iana","extensions":["ppsm"]},"application/vnd.ms-powerpoint.template.macroenabled.12":{"source":"iana","extensions":["potm"]},"application/vnd.ms-printdevicecapabilities+xml":{"source":"iana","compressible":true},"application/vnd.ms-printing.printticket+xml":{"source":"apache","compressible":true},"application/vnd.ms-printschematicket+xml":{"source":"iana","compressible":true},"application/vnd.ms-project":{"source":"iana","extensions":["mpp","mpt"]},"application/vnd.ms-tnef":{"source":"iana"},"application/vnd.ms-windows.devicepairing":{"source":"iana"},"application/vnd.ms-windows.nwprinting.oob":{"source":"iana"},"application/vnd.ms-windows.printerpairing":{"source":"iana"},"application/vnd.ms-windows.wsd.oob":{"source":"iana"},"application/vnd.ms-wmdrm.lic-chlg-req":{"source":"iana"},"application/vnd.ms-wmdrm.lic-resp":{"source":"iana"},"application/vnd.ms-wmdrm.meter-chlg-req":{"source":"iana"},"application/vnd.ms-wmdrm.meter-resp":{"source":"iana"},"application/vnd.ms-word.document.macroenabled.12":{"source":"iana","extensions":["docm"]},"application/vnd.ms-word.template.macroenabled.12":{"source":"iana","extensions":["dotm"]},"application/vnd.ms-works":{"source":"iana","extensions":["wps","wks","wcm","wdb"]},"application/vnd.ms-wpl":{"source":"iana","extensions":["wpl"]},"application/vnd.ms-xpsdocument":{"source":"iana","compressible":false,"extensions":["xps"]},"application/vnd.msa-disk-image":{"source":"iana"},"application/vnd.mseq":{"source":"iana","extensions":["mseq"]},"application/vnd.msign":{"source":"iana"},"application/vnd.multiad.creator":{"source":"iana"},"application/vnd.multiad.creator.cif":{"source":"iana"},"application/vnd.music-niff":{"source":"iana"},"application/vnd.musician":{"source":"iana","extensions":["mus"]},"application/vnd.muvee.style":{"source":"iana","extensions":["msty"]},"application/vnd.mynfc":{"source":"iana","extensions":["taglet"]},"application/vnd.nacamar.ybrid+json":{"source":"iana","compressible":true},"application/vnd.ncd.control":{"source":"iana"},"application/vnd.ncd.reference":{"source":"iana"},"application/vnd.nearst.inv+json":{"source":"iana","compressible":true},"application/vnd.nebumind.line":{"source":"iana"},"application/vnd.nervana":{"source":"iana"},"application/vnd.netfpx":{"source":"iana"},"application/vnd.neurolanguage.nlu":{"source":"iana","extensions":["nlu"]},"application/vnd.nimn":{"source":"iana"},"application/vnd.nintendo.nitro.rom":{"source":"iana"},"application/vnd.nintendo.snes.rom":{"source":"iana"},"application/vnd.nitf":{"source":"iana","extensions":["ntf","nitf"]},"application/vnd.noblenet-directory":{"source":"iana","extensions":["nnd"]},"application/vnd.noblenet-sealer":{"source":"iana","extensions":["nns"]},"application/vnd.noblenet-web":{"source":"iana","extensions":["nnw"]},"application/vnd.nokia.catalogs":{"source":"iana"},"application/vnd.nokia.conml+wbxml":{"source":"iana"},"application/vnd.nokia.conml+xml":{"source":"iana","compressible":true},"application/vnd.nokia.iptv.config+xml":{"source":"iana","compressible":true},"application/vnd.nokia.isds-radio-presets":{"source":"iana"},"application/vnd.nokia.landmark+wbxml":{"source":"iana"},"application/vnd.nokia.landmark+xml":{"source":"iana","compressible":true},"application/vnd.nokia.landmarkcollection+xml":{"source":"iana","compressible":true},"application/vnd.nokia.n-gage.ac+xml":{"source":"iana","compressible":true,"extensions":["ac"]},"application/vnd.nokia.n-gage.data":{"source":"iana","extensions":["ngdat"]},"application/vnd.nokia.n-gage.symbian.install":{"source":"iana","extensions":["n-gage"]},"application/vnd.nokia.ncd":{"source":"iana"},"application/vnd.nokia.pcd+wbxml":{"source":"iana"},"application/vnd.nokia.pcd+xml":{"source":"iana","compressible":true},"application/vnd.nokia.radio-preset":{"source":"iana","extensions":["rpst"]},"application/vnd.nokia.radio-presets":{"source":"iana","extensions":["rpss"]},"application/vnd.novadigm.edm":{"source":"iana","extensions":["edm"]},"application/vnd.novadigm.edx":{"source":"iana","extensions":["edx"]},"application/vnd.novadigm.ext":{"source":"iana","extensions":["ext"]},"application/vnd.ntt-local.content-share":{"source":"iana"},"application/vnd.ntt-local.file-transfer":{"source":"iana"},"application/vnd.ntt-local.ogw_remote-access":{"source":"iana"},"application/vnd.ntt-local.sip-ta_remote":{"source":"iana"},"application/vnd.ntt-local.sip-ta_tcp_stream":{"source":"iana"},"application/vnd.oasis.opendocument.chart":{"source":"iana","extensions":["odc"]},"application/vnd.oasis.opendocument.chart-template":{"source":"iana","extensions":["otc"]},"application/vnd.oasis.opendocument.database":{"source":"iana","extensions":["odb"]},"application/vnd.oasis.opendocument.formula":{"source":"iana","extensions":["odf"]},"application/vnd.oasis.opendocument.formula-template":{"source":"iana","extensions":["odft"]},"application/vnd.oasis.opendocument.graphics":{"source":"iana","compressible":false,"extensions":["odg"]},"application/vnd.oasis.opendocument.graphics-template":{"source":"iana","extensions":["otg"]},"application/vnd.oasis.opendocument.image":{"source":"iana","extensions":["odi"]},"application/vnd.oasis.opendocument.image-template":{"source":"iana","extensions":["oti"]},"application/vnd.oasis.opendocument.presentation":{"source":"iana","compressible":false,"extensions":["odp"]},"application/vnd.oasis.opendocument.presentation-template":{"source":"iana","extensions":["otp"]},"application/vnd.oasis.opendocument.spreadsheet":{"source":"iana","compressible":false,"extensions":["ods"]},"application/vnd.oasis.opendocument.spreadsheet-template":{"source":"iana","extensions":["ots"]},"application/vnd.oasis.opendocument.text":{"source":"iana","compressible":false,"extensions":["odt"]},"application/vnd.oasis.opendocument.text-master":{"source":"iana","extensions":["odm"]},"application/vnd.oasis.opendocument.text-template":{"source":"iana","extensions":["ott"]},"application/vnd.oasis.opendocument.text-web":{"source":"iana","extensions":["oth"]},"application/vnd.obn":{"source":"iana"},"application/vnd.ocf+cbor":{"source":"iana"},"application/vnd.oci.image.manifest.v1+json":{"source":"iana","compressible":true},"application/vnd.oftn.l10n+json":{"source":"iana","compressible":true},"application/vnd.oipf.contentaccessdownload+xml":{"source":"iana","compressible":true},"application/vnd.oipf.contentaccessstreaming+xml":{"source":"iana","compressible":true},"application/vnd.oipf.cspg-hexbinary":{"source":"iana"},"application/vnd.oipf.dae.svg+xml":{"source":"iana","compressible":true},"application/vnd.oipf.dae.xhtml+xml":{"source":"iana","compressible":true},"application/vnd.oipf.mippvcontrolmessage+xml":{"source":"iana","compressible":true},"application/vnd.oipf.pae.gem":{"source":"iana"},"application/vnd.oipf.spdiscovery+xml":{"source":"iana","compressible":true},"application/vnd.oipf.spdlist+xml":{"source":"iana","compressible":true},"application/vnd.oipf.ueprofile+xml":{"source":"iana","compressible":true},"application/vnd.oipf.userprofile+xml":{"source":"iana","compressible":true},"application/vnd.olpc-sugar":{"source":"iana","extensions":["xo"]},"application/vnd.oma-scws-config":{"source":"iana"},"application/vnd.oma-scws-http-request":{"source":"iana"},"application/vnd.oma-scws-http-response":{"source":"iana"},"application/vnd.oma.bcast.associated-procedure-parameter+xml":{"source":"iana","compressible":true},"application/vnd.oma.bcast.drm-trigger+xml":{"source":"iana","compressible":true},"application/vnd.oma.bcast.imd+xml":{"source":"iana","compressible":true},"application/vnd.oma.bcast.ltkm":{"source":"iana"},"application/vnd.oma.bcast.notification+xml":{"source":"iana","compressible":true},"application/vnd.oma.bcast.provisioningtrigger":{"source":"iana"},"application/vnd.oma.bcast.sgboot":{"source":"iana"},"application/vnd.oma.bcast.sgdd+xml":{"source":"iana","compressible":true},"application/vnd.oma.bcast.sgdu":{"source":"iana"},"application/vnd.oma.bcast.simple-symbol-container":{"source":"iana"},"application/vnd.oma.bcast.smartcard-trigger+xml":{"source":"iana","compressible":true},"application/vnd.oma.bcast.sprov+xml":{"source":"iana","compressible":true},"application/vnd.oma.bcast.stkm":{"source":"iana"},"application/vnd.oma.cab-address-book+xml":{"source":"iana","compressible":true},"application/vnd.oma.cab-feature-handler+xml":{"source":"iana","compressible":true},"application/vnd.oma.cab-pcc+xml":{"source":"iana","compressible":true},"application/vnd.oma.cab-subs-invite+xml":{"source":"iana","compressible":true},"application/vnd.oma.cab-user-prefs+xml":{"source":"iana","compressible":true},"application/vnd.oma.dcd":{"source":"iana"},"application/vnd.oma.dcdc":{"source":"iana"},"application/vnd.oma.dd2+xml":{"source":"iana","compressible":true,"extensions":["dd2"]},"application/vnd.oma.drm.risd+xml":{"source":"iana","compressible":true},"application/vnd.oma.group-usage-list+xml":{"source":"iana","compressible":true},"application/vnd.oma.lwm2m+cbor":{"source":"iana"},"application/vnd.oma.lwm2m+json":{"source":"iana","compressible":true},"application/vnd.oma.lwm2m+tlv":{"source":"iana"},"application/vnd.oma.pal+xml":{"source":"iana","compressible":true},"application/vnd.oma.poc.detailed-progress-report+xml":{"source":"iana","compressible":true},"application/vnd.oma.poc.final-report+xml":{"source":"iana","compressible":true},"application/vnd.oma.poc.groups+xml":{"source":"iana","compressible":true},"application/vnd.oma.poc.invocation-descriptor+xml":{"source":"iana","compressible":true},"application/vnd.oma.poc.optimized-progress-report+xml":{"source":"iana","compressible":true},"application/vnd.oma.push":{"source":"iana"},"application/vnd.oma.scidm.messages+xml":{"source":"iana","compressible":true},"application/vnd.oma.xcap-directory+xml":{"source":"iana","compressible":true},"application/vnd.omads-email+xml":{"source":"iana","charset":"UTF-8","compressible":true},"application/vnd.omads-file+xml":{"source":"iana","charset":"UTF-8","compressible":true},"application/vnd.omads-folder+xml":{"source":"iana","charset":"UTF-8","compressible":true},"application/vnd.omaloc-supl-init":{"source":"iana"},"application/vnd.onepager":{"source":"iana"},"application/vnd.onepagertamp":{"source":"iana"},"application/vnd.onepagertamx":{"source":"iana"},"application/vnd.onepagertat":{"source":"iana"},"application/vnd.onepagertatp":{"source":"iana"},"application/vnd.onepagertatx":{"source":"iana"},"application/vnd.openblox.game+xml":{"source":"iana","compressible":true,"extensions":["obgx"]},"application/vnd.openblox.game-binary":{"source":"iana"},"application/vnd.openeye.oeb":{"source":"iana"},"application/vnd.openofficeorg.extension":{"source":"apache","extensions":["oxt"]},"application/vnd.openstreetmap.data+xml":{"source":"iana","compressible":true,"extensions":["osm"]},"application/vnd.opentimestamps.ots":{"source":"iana"},"application/vnd.openxmlformats-officedocument.custom-properties+xml":{"source":"iana","compressible":true},"application/vnd.openxmlformats-officedocument.customxmlproperties+xml":{"source":"iana","compressible":true},"application/vnd.openxmlformats-officedocument.drawing+xml":{"source":"iana","compressible":true},"application/vnd.openxmlformats-officedocument.drawingml.chart+xml":{"source":"iana","compressible":true},"application/vnd.openxmlformats-officedocument.drawingml.chartshapes+xml":{"source":"iana","compressible":true},"application/vnd.openxmlformats-officedocument.drawingml.diagramcolors+xml":{"source":"iana","compressible":true},"application/vnd.openxmlformats-officedocument.drawingml.diagramdata+xml":{"source":"iana","compressible":true},"application/vnd.openxmlformats-officedocument.drawingml.diagramlayout+xml":{"source":"iana","compressible":true},"application/vnd.openxmlformats-officedocument.drawingml.diagramstyle+xml":{"source":"iana","compressible":true},"application/vnd.openxmlformats-officedocument.extended-properties+xml":{"source":"iana","compressible":true},"application/vnd.openxmlformats-officedocument.presentationml.commentauthors+xml":{"source":"iana","compressible":true},"application/vnd.openxmlformats-officedocument.presentationml.comments+xml":{"source":"iana","compressible":true},"application/vnd.openxmlformats-officedocument.presentationml.handoutmaster+xml":{"source":"iana","compressible":true},"application/vnd.openxmlformats-officedocument.presentationml.notesmaster+xml":{"source":"iana","compressible":true},"application/vnd.openxmlformats-officedocument.presentationml.notesslide+xml":{"source":"iana","compressible":true},"application/vnd.openxmlformats-officedocument.presentationml.presentation":{"source":"iana","compressible":false,"extensions":["pptx"]},"application/vnd.openxmlformats-officedocument.presentationml.presentation.main+xml":{"source":"iana","compressible":true},"application/vnd.openxmlformats-officedocument.presentationml.presprops+xml":{"source":"iana","compressible":true},"application/vnd.openxmlformats-officedocument.presentationml.slide":{"source":"iana","extensions":["sldx"]},"application/vnd.openxmlformats-officedocument.presentationml.slide+xml":{"source":"iana","compressible":true},"application/vnd.openxmlformats-officedocument.presentationml.slidelayout+xml":{"source":"iana","compressible":true},"application/vnd.openxmlformats-officedocument.presentationml.slidemaster+xml":{"source":"iana","compressible":true},"application/vnd.openxmlformats-officedocument.presentationml.slideshow":{"source":"iana","extensions":["ppsx"]},"application/vnd.openxmlformats-officedocument.presentationml.slideshow.main+xml":{"source":"iana","compressible":true},"application/vnd.openxmlformats-officedocument.presentationml.slideupdateinfo+xml":{"source":"iana","compressible":true},"application/vnd.openxmlformats-officedocument.presentationml.tablestyles+xml":{"source":"iana","compressible":true},"application/vnd.openxmlformats-officedocument.presentationml.tags+xml":{"source":"iana","compressible":true},"application/vnd.openxmlformats-officedocument.presentationml.template":{"source":"iana","extensions":["potx"]},"application/vnd.openxmlformats-officedocument.presentationml.template.main+xml":{"source":"iana","compressible":true},"application/vnd.openxmlformats-officedocument.presentationml.viewprops+xml":{"source":"iana","compressible":true},"application/vnd.openxmlformats-officedocument.spreadsheetml.calcchain+xml":{"source":"iana","compressible":true},"application/vnd.openxmlformats-officedocument.spreadsheetml.chartsheet+xml":{"source":"iana","compressible":true},"application/vnd.openxmlformats-officedocument.spreadsheetml.comments+xml":{"source":"iana","compressible":true},"application/vnd.openxmlformats-officedocument.spreadsheetml.connections+xml":{"source":"iana","compressible":true},"application/vnd.openxmlformats-officedocument.spreadsheetml.dialogsheet+xml":{"source":"iana","compressible":true},"application/vnd.openxmlformats-officedocument.spreadsheetml.externallink+xml":{"source":"iana","compressible":true},"application/vnd.openxmlformats-officedocument.spreadsheetml.pivotcachedefinition+xml":{"source":"iana","compressible":true},"application/vnd.openxmlformats-officedocument.spreadsheetml.pivotcacherecords+xml":{"source":"iana","compressible":true},"application/vnd.openxmlformats-officedocument.spreadsheetml.pivottable+xml":{"source":"iana","compressible":true},"application/vnd.openxmlformats-officedocument.spreadsheetml.querytable+xml":{"source":"iana","compressible":true},"application/vnd.openxmlformats-officedocument.spreadsheetml.revisionheaders+xml":{"source":"iana","compressible":true},"application/vnd.openxmlformats-officedocument.spreadsheetml.revisionlog+xml":{"source":"iana","compressible":true},"application/vnd.openxmlformats-officedocument.spreadsheetml.sharedstrings+xml":{"source":"iana","compressible":true},"application/vnd.openxmlformats-officedocument.spreadsheetml.sheet":{"source":"iana","compressible":false,"extensions":["xlsx"]},"application/vnd.openxmlformats-officedocument.spreadsheetml.sheet.main+xml":{"source":"iana","compressible":true},"application/vnd.openxmlformats-officedocument.spreadsheetml.sheetmetadata+xml":{"source":"iana","compressible":true},"application/vnd.openxmlformats-officedocument.spreadsheetml.styles+xml":{"source":"iana","compressible":true},"application/vnd.openxmlformats-officedocument.spreadsheetml.table+xml":{"source":"iana","compressible":true},"application/vnd.openxmlformats-officedocument.spreadsheetml.tablesinglecells+xml":{"source":"iana","compressible":true},"application/vnd.openxmlformats-officedocument.spreadsheetml.template":{"source":"iana","extensions":["xltx"]},"application/vnd.openxmlformats-officedocument.spreadsheetml.template.main+xml":{"source":"iana","compressible":true},"application/vnd.openxmlformats-officedocument.spreadsheetml.usernames+xml":{"source":"iana","compressible":true},"application/vnd.openxmlformats-officedocument.spreadsheetml.volatiledependencies+xml":{"source":"iana","compressible":true},"application/vnd.openxmlformats-officedocument.spreadsheetml.worksheet+xml":{"source":"iana","compressible":true},"application/vnd.openxmlformats-officedocument.theme+xml":{"source":"iana","compressible":true},"application/vnd.openxmlformats-officedocument.themeoverride+xml":{"source":"iana","compressible":true},"application/vnd.openxmlformats-officedocument.vmldrawing":{"source":"iana"},"application/vnd.openxmlformats-officedocument.wordprocessingml.comments+xml":{"source":"iana","compressible":true},"application/vnd.openxmlformats-officedocument.wordprocessingml.document":{"source":"iana","compressible":false,"extensions":["docx"]},"application/vnd.openxmlformats-officedocument.wordprocessingml.document.glossary+xml":{"source":"iana","compressible":true},"application/vnd.openxmlformats-officedocument.wordprocessingml.document.main+xml":{"source":"iana","compressible":true},"application/vnd.openxmlformats-officedocument.wordprocessingml.endnotes+xml":{"source":"iana","compressible":true},"application/vnd.openxmlformats-officedocument.wordprocessingml.fonttable+xml":{"source":"iana","compressible":true},"application/vnd.openxmlformats-officedocument.wordprocessingml.footer+xml":{"source":"iana","compressible":true},"application/vnd.openxmlformats-officedocument.wordprocessingml.footnotes+xml":{"source":"iana","compressible":true},"application/vnd.openxmlformats-officedocument.wordprocessingml.numbering+xml":{"source":"iana","compressible":true},"application/vnd.openxmlformats-officedocument.wordprocessingml.settings+xml":{"source":"iana","compressible":true},"application/vnd.openxmlformats-officedocument.wordprocessingml.styles+xml":{"source":"iana","compressible":true},"application/vnd.openxmlformats-officedocument.wordprocessingml.template":{"source":"iana","extensions":["dotx"]},"application/vnd.openxmlformats-officedocument.wordprocessingml.template.main+xml":{"source":"iana","compressible":true},"application/vnd.openxmlformats-officedocument.wordprocessingml.websettings+xml":{"source":"iana","compressible":true},"application/vnd.openxmlformats-package.core-properties+xml":{"source":"iana","compressible":true},"application/vnd.openxmlformats-package.digital-signature-xmlsignature+xml":{"source":"iana","compressible":true},"application/vnd.openxmlformats-package.relationships+xml":{"source":"iana","compressible":true},"application/vnd.oracle.resource+json":{"source":"iana","compressible":true},"application/vnd.orange.indata":{"source":"iana"},"application/vnd.osa.netdeploy":{"source":"iana"},"application/vnd.osgeo.mapguide.package":{"source":"iana","extensions":["mgp"]},"application/vnd.osgi.bundle":{"source":"iana"},"application/vnd.osgi.dp":{"source":"iana","extensions":["dp"]},"application/vnd.osgi.subsystem":{"source":"iana","extensions":["esa"]},"application/vnd.otps.ct-kip+xml":{"source":"iana","compressible":true},"application/vnd.oxli.countgraph":{"source":"iana"},"application/vnd.pagerduty+json":{"source":"iana","compressible":true},"application/vnd.palm":{"source":"iana","extensions":["pdb","pqa","oprc"]},"application/vnd.panoply":{"source":"iana"},"application/vnd.paos.xml":{"source":"iana"},"application/vnd.patentdive":{"source":"iana"},"application/vnd.patientecommsdoc":{"source":"iana"},"application/vnd.pawaafile":{"source":"iana","extensions":["paw"]},"application/vnd.pcos":{"source":"iana"},"application/vnd.pg.format":{"source":"iana","extensions":["str"]},"application/vnd.pg.osasli":{"source":"iana","extensions":["ei6"]},"application/vnd.piaccess.application-licence":{"source":"iana"},"application/vnd.picsel":{"source":"iana","extensions":["efif"]},"application/vnd.pmi.widget":{"source":"iana","extensions":["wg"]},"application/vnd.poc.group-advertisement+xml":{"source":"iana","compressible":true},"application/vnd.pocketlearn":{"source":"iana","extensions":["plf"]},"application/vnd.powerbuilder6":{"source":"iana","extensions":["pbd"]},"application/vnd.powerbuilder6-s":{"source":"iana"},"application/vnd.powerbuilder7":{"source":"iana"},"application/vnd.powerbuilder7-s":{"source":"iana"},"application/vnd.powerbuilder75":{"source":"iana"},"application/vnd.powerbuilder75-s":{"source":"iana"},"application/vnd.preminet":{"source":"iana"},"application/vnd.previewsystems.box":{"source":"iana","extensions":["box"]},"application/vnd.proteus.magazine":{"source":"iana","extensions":["mgz"]},"application/vnd.psfs":{"source":"iana"},"application/vnd.publishare-delta-tree":{"source":"iana","extensions":["qps"]},"application/vnd.pvi.ptid1":{"source":"iana","extensions":["ptid"]},"application/vnd.pwg-multiplexed":{"source":"iana"},"application/vnd.pwg-xhtml-print+xml":{"source":"iana","compressible":true},"application/vnd.qualcomm.brew-app-res":{"source":"iana"},"application/vnd.quarantainenet":{"source":"iana"},"application/vnd.quark.quarkxpress":{"source":"iana","extensions":["qxd","qxt","qwd","qwt","qxl","qxb"]},"application/vnd.quobject-quoxdocument":{"source":"iana"},"application/vnd.radisys.moml+xml":{"source":"iana","compressible":true},"application/vnd.radisys.msml+xml":{"source":"iana","compressible":true},"application/vnd.radisys.msml-audit+xml":{"source":"iana","compressible":true},"application/vnd.radisys.msml-audit-conf+xml":{"source":"iana","compressible":true},"application/vnd.radisys.msml-audit-conn+xml":{"source":"iana","compressible":true},"application/vnd.radisys.msml-audit-dialog+xml":{"source":"iana","compressible":true},"application/vnd.radisys.msml-audit-stream+xml":{"source":"iana","compressible":true},"application/vnd.radisys.msml-conf+xml":{"source":"iana","compressible":true},"application/vnd.radisys.msml-dialog+xml":{"source":"iana","compressible":true},"application/vnd.radisys.msml-dialog-base+xml":{"source":"iana","compressible":true},"application/vnd.radisys.msml-dialog-fax-detect+xml":{"source":"iana","compressible":true},"application/vnd.radisys.msml-dialog-fax-sendrecv+xml":{"source":"iana","compressible":true},"application/vnd.radisys.msml-dialog-group+xml":{"source":"iana","compressible":true},"application/vnd.radisys.msml-dialog-speech+xml":{"source":"iana","compressible":true},"application/vnd.radisys.msml-dialog-transform+xml":{"source":"iana","compressible":true},"application/vnd.rainstor.data":{"source":"iana"},"application/vnd.rapid":{"source":"iana"},"application/vnd.rar":{"source":"iana","extensions":["rar"]},"application/vnd.realvnc.bed":{"source":"iana","extensions":["bed"]},"application/vnd.recordare.musicxml":{"source":"iana","extensions":["mxl"]},"application/vnd.recordare.musicxml+xml":{"source":"iana","compressible":true,"extensions":["musicxml"]},"application/vnd.renlearn.rlprint":{"source":"iana"},"application/vnd.resilient.logic":{"source":"iana"},"application/vnd.restful+json":{"source":"iana","compressible":true},"application/vnd.rig.cryptonote":{"source":"iana","extensions":["cryptonote"]},"application/vnd.rim.cod":{"source":"apache","extensions":["cod"]},"application/vnd.rn-realmedia":{"source":"apache","extensions":["rm"]},"application/vnd.rn-realmedia-vbr":{"source":"apache","extensions":["rmvb"]},"application/vnd.route66.link66+xml":{"source":"iana","compressible":true,"extensions":["link66"]},"application/vnd.rs-274x":{"source":"iana"},"application/vnd.ruckus.download":{"source":"iana"},"application/vnd.s3sms":{"source":"iana"},"application/vnd.sailingtracker.track":{"source":"iana","extensions":["st"]},"application/vnd.sar":{"source":"iana"},"application/vnd.sbm.cid":{"source":"iana"},"application/vnd.sbm.mid2":{"source":"iana"},"application/vnd.scribus":{"source":"iana"},"application/vnd.sealed.3df":{"source":"iana"},"application/vnd.sealed.csf":{"source":"iana"},"application/vnd.sealed.doc":{"source":"iana"},"application/vnd.sealed.eml":{"source":"iana"},"application/vnd.sealed.mht":{"source":"iana"},"application/vnd.sealed.net":{"source":"iana"},"application/vnd.sealed.ppt":{"source":"iana"},"application/vnd.sealed.tiff":{"source":"iana"},"application/vnd.sealed.xls":{"source":"iana"},"application/vnd.sealedmedia.softseal.html":{"source":"iana"},"application/vnd.sealedmedia.softseal.pdf":{"source":"iana"},"application/vnd.seemail":{"source":"iana","extensions":["see"]},"application/vnd.seis+json":{"source":"iana","compressible":true},"application/vnd.sema":{"source":"iana","extensions":["sema"]},"application/vnd.semd":{"source":"iana","extensions":["semd"]},"application/vnd.semf":{"source":"iana","extensions":["semf"]},"application/vnd.shade-save-file":{"source":"iana"},"application/vnd.shana.informed.formdata":{"source":"iana","extensions":["ifm"]},"application/vnd.shana.informed.formtemplate":{"source":"iana","extensions":["itp"]},"application/vnd.shana.informed.interchange":{"source":"iana","extensions":["iif"]},"application/vnd.shana.informed.package":{"source":"iana","extensions":["ipk"]},"application/vnd.shootproof+json":{"source":"iana","compressible":true},"application/vnd.shopkick+json":{"source":"iana","compressible":true},"application/vnd.shp":{"source":"iana"},"application/vnd.shx":{"source":"iana"},"application/vnd.sigrok.session":{"source":"iana"},"application/vnd.simtech-mindmapper":{"source":"iana","extensions":["twd","twds"]},"application/vnd.siren+json":{"source":"iana","compressible":true},"application/vnd.smaf":{"source":"iana","extensions":["mmf"]},"application/vnd.smart.notebook":{"source":"iana"},"application/vnd.smart.teacher":{"source":"iana","extensions":["teacher"]},"application/vnd.snesdev-page-table":{"source":"iana"},"application/vnd.software602.filler.form+xml":{"source":"iana","compressible":true,"extensions":["fo"]},"application/vnd.software602.filler.form-xml-zip":{"source":"iana"},"application/vnd.solent.sdkm+xml":{"source":"iana","compressible":true,"extensions":["sdkm","sdkd"]},"application/vnd.spotfire.dxp":{"source":"iana","extensions":["dxp"]},"application/vnd.spotfire.sfs":{"source":"iana","extensions":["sfs"]},"application/vnd.sqlite3":{"source":"iana"},"application/vnd.sss-cod":{"source":"iana"},"application/vnd.sss-dtf":{"source":"iana"},"application/vnd.sss-ntf":{"source":"iana"},"application/vnd.stardivision.calc":{"source":"apache","extensions":["sdc"]},"application/vnd.stardivision.draw":{"source":"apache","extensions":["sda"]},"application/vnd.stardivision.impress":{"source":"apache","extensions":["sdd"]},"application/vnd.stardivision.math":{"source":"apache","extensions":["smf"]},"application/vnd.stardivision.writer":{"source":"apache","extensions":["sdw","vor"]},"application/vnd.stardivision.writer-global":{"source":"apache","extensions":["sgl"]},"application/vnd.stepmania.package":{"source":"iana","extensions":["smzip"]},"application/vnd.stepmania.stepchart":{"source":"iana","extensions":["sm"]},"application/vnd.street-stream":{"source":"iana"},"application/vnd.sun.wadl+xml":{"source":"iana","compressible":true,"extensions":["wadl"]},"application/vnd.sun.xml.calc":{"source":"apache","extensions":["sxc"]},"application/vnd.sun.xml.calc.template":{"source":"apache","extensions":["stc"]},"application/vnd.sun.xml.draw":{"source":"apache","extensions":["sxd"]},"application/vnd.sun.xml.draw.template":{"source":"apache","extensions":["std"]},"application/vnd.sun.xml.impress":{"source":"apache","extensions":["sxi"]},"application/vnd.sun.xml.impress.template":{"source":"apache","extensions":["sti"]},"application/vnd.sun.xml.math":{"source":"apache","extensions":["sxm"]},"application/vnd.sun.xml.writer":{"source":"apache","extensions":["sxw"]},"application/vnd.sun.xml.writer.global":{"source":"apache","extensions":["sxg"]},"application/vnd.sun.xml.writer.template":{"source":"apache","extensions":["stw"]},"application/vnd.sus-calendar":{"source":"iana","extensions":["sus","susp"]},"application/vnd.svd":{"source":"iana","extensions":["svd"]},"application/vnd.swiftview-ics":{"source":"iana"},"application/vnd.sycle+xml":{"source":"iana","compressible":true},"application/vnd.syft+json":{"source":"iana","compressible":true},"application/vnd.symbian.install":{"source":"apache","extensions":["sis","sisx"]},"application/vnd.syncml+xml":{"source":"iana","charset":"UTF-8","compressible":true,"extensions":["xsm"]},"application/vnd.syncml.dm+wbxml":{"source":"iana","charset":"UTF-8","extensions":["bdm"]},"application/vnd.syncml.dm+xml":{"source":"iana","charset":"UTF-8","compressible":true,"extensions":["xdm"]},"application/vnd.syncml.dm.notification":{"source":"iana"},"application/vnd.syncml.dmddf+wbxml":{"source":"iana"},"application/vnd.syncml.dmddf+xml":{"source":"iana","charset":"UTF-8","compressible":true,"extensions":["ddf"]},"application/vnd.syncml.dmtnds+wbxml":{"source":"iana"},"application/vnd.syncml.dmtnds+xml":{"source":"iana","charset":"UTF-8","compressible":true},"application/vnd.syncml.ds.notification":{"source":"iana"},"application/vnd.tableschema+json":{"source":"iana","compressible":true},"application/vnd.tao.intent-module-archive":{"source":"iana","extensions":["tao"]},"application/vnd.tcpdump.pcap":{"source":"iana","extensions":["pcap","cap","dmp"]},"application/vnd.think-cell.ppttc+json":{"source":"iana","compressible":true},"application/vnd.tmd.mediaflex.api+xml":{"source":"iana","compressible":true},"application/vnd.tml":{"source":"iana"},"application/vnd.tmobile-livetv":{"source":"iana","extensions":["tmo"]},"application/vnd.tri.onesource":{"source":"iana"},"application/vnd.trid.tpt":{"source":"iana","extensions":["tpt"]},"application/vnd.triscape.mxs":{"source":"iana","extensions":["mxs"]},"application/vnd.trueapp":{"source":"iana","extensions":["tra"]},"application/vnd.truedoc":{"source":"iana"},"application/vnd.ubisoft.webplayer":{"source":"iana"},"application/vnd.ufdl":{"source":"iana","extensions":["ufd","ufdl"]},"application/vnd.uiq.theme":{"source":"iana","extensions":["utz"]},"application/vnd.umajin":{"source":"iana","extensions":["umj"]},"application/vnd.unity":{"source":"iana","extensions":["unityweb"]},"application/vnd.uoml+xml":{"source":"iana","compressible":true,"extensions":["uoml"]},"application/vnd.uplanet.alert":{"source":"iana"},"application/vnd.uplanet.alert-wbxml":{"source":"iana"},"application/vnd.uplanet.bearer-choice":{"source":"iana"},"application/vnd.uplanet.bearer-choice-wbxml":{"source":"iana"},"application/vnd.uplanet.cacheop":{"source":"iana"},"application/vnd.uplanet.cacheop-wbxml":{"source":"iana"},"application/vnd.uplanet.channel":{"source":"iana"},"application/vnd.uplanet.channel-wbxml":{"source":"iana"},"application/vnd.uplanet.list":{"source":"iana"},"application/vnd.uplanet.list-wbxml":{"source":"iana"},"application/vnd.uplanet.listcmd":{"source":"iana"},"application/vnd.uplanet.listcmd-wbxml":{"source":"iana"},"application/vnd.uplanet.signal":{"source":"iana"},"application/vnd.uri-map":{"source":"iana"},"application/vnd.valve.source.material":{"source":"iana"},"application/vnd.vcx":{"source":"iana","extensions":["vcx"]},"application/vnd.vd-study":{"source":"iana"},"application/vnd.vectorworks":{"source":"iana"},"application/vnd.vel+json":{"source":"iana","compressible":true},"application/vnd.verimatrix.vcas":{"source":"iana"},"application/vnd.veritone.aion+json":{"source":"iana","compressible":true},"application/vnd.veryant.thin":{"source":"iana"},"application/vnd.ves.encrypted":{"source":"iana"},"application/vnd.vidsoft.vidconference":{"source":"iana"},"application/vnd.visio":{"source":"iana","extensions":["vsd","vst","vss","vsw"]},"application/vnd.visionary":{"source":"iana","extensions":["vis"]},"application/vnd.vividence.scriptfile":{"source":"iana"},"application/vnd.vsf":{"source":"iana","extensions":["vsf"]},"application/vnd.wap.sic":{"source":"iana"},"application/vnd.wap.slc":{"source":"iana"},"application/vnd.wap.wbxml":{"source":"iana","charset":"UTF-8","extensions":["wbxml"]},"application/vnd.wap.wmlc":{"source":"iana","extensions":["wmlc"]},"application/vnd.wap.wmlscriptc":{"source":"iana","extensions":["wmlsc"]},"application/vnd.webturbo":{"source":"iana","extensions":["wtb"]},"application/vnd.wfa.dpp":{"source":"iana"},"application/vnd.wfa.p2p":{"source":"iana"},"application/vnd.wfa.wsc":{"source":"iana"},"application/vnd.windows.devicepairing":{"source":"iana"},"application/vnd.wmc":{"source":"iana"},"application/vnd.wmf.bootstrap":{"source":"iana"},"application/vnd.wolfram.mathematica":{"source":"iana"},"application/vnd.wolfram.mathematica.package":{"source":"iana"},"application/vnd.wolfram.player":{"source":"iana","extensions":["nbp"]},"application/vnd.wordperfect":{"source":"iana","extensions":["wpd"]},"application/vnd.wqd":{"source":"iana","extensions":["wqd"]},"application/vnd.wrq-hp3000-labelled":{"source":"iana"},"application/vnd.wt.stf":{"source":"iana","extensions":["stf"]},"application/vnd.wv.csp+wbxml":{"source":"iana"},"application/vnd.wv.csp+xml":{"source":"iana","compressible":true},"application/vnd.wv.ssp+xml":{"source":"iana","compressible":true},"application/vnd.xacml+json":{"source":"iana","compressible":true},"application/vnd.xara":{"source":"iana","extensions":["xar"]},"application/vnd.xfdl":{"source":"iana","extensions":["xfdl"]},"application/vnd.xfdl.webform":{"source":"iana"},"application/vnd.xmi+xml":{"source":"iana","compressible":true},"application/vnd.xmpie.cpkg":{"source":"iana"},"application/vnd.xmpie.dpkg":{"source":"iana"},"application/vnd.xmpie.plan":{"source":"iana"},"application/vnd.xmpie.ppkg":{"source":"iana"},"application/vnd.xmpie.xlim":{"source":"iana"},"application/vnd.yamaha.hv-dic":{"source":"iana","extensions":["hvd"]},"application/vnd.yamaha.hv-script":{"source":"iana","extensions":["hvs"]},"application/vnd.yamaha.hv-voice":{"source":"iana","extensions":["hvp"]},"application/vnd.yamaha.openscoreformat":{"source":"iana","extensions":["osf"]},"application/vnd.yamaha.openscoreformat.osfpvg+xml":{"source":"iana","compressible":true,"extensions":["osfpvg"]},"application/vnd.yamaha.remote-setup":{"source":"iana"},"application/vnd.yamaha.smaf-audio":{"source":"iana","extensions":["saf"]},"application/vnd.yamaha.smaf-phrase":{"source":"iana","extensions":["spf"]},"application/vnd.yamaha.through-ngn":{"source":"iana"},"application/vnd.yamaha.tunnel-udpencap":{"source":"iana"},"application/vnd.yaoweme":{"source":"iana"},"application/vnd.yellowriver-custom-menu":{"source":"iana","extensions":["cmp"]},"application/vnd.youtube.yt":{"source":"iana"},"application/vnd.zul":{"source":"iana","extensions":["zir","zirz"]},"application/vnd.zzazz.deck+xml":{"source":"iana","compressible":true,"extensions":["zaz"]},"application/voicexml+xml":{"source":"iana","compressible":true,"extensions":["vxml"]},"application/voucher-cms+json":{"source":"iana","compressible":true},"application/vq-rtcpxr":{"source":"iana"},"application/wasm":{"source":"iana","compressible":true,"extensions":["wasm"]},"application/watcherinfo+xml":{"source":"iana","compressible":true,"extensions":["wif"]},"application/webpush-options+json":{"source":"iana","compressible":true},"application/whoispp-query":{"source":"iana"},"application/whoispp-response":{"source":"iana"},"application/widget":{"source":"iana","extensions":["wgt"]},"application/winhlp":{"source":"apache","extensions":["hlp"]},"application/wita":{"source":"iana"},"application/wordperfect5.1":{"source":"iana"},"application/wsdl+xml":{"source":"iana","compressible":true,"extensions":["wsdl"]},"application/wspolicy+xml":{"source":"iana","compressible":true,"extensions":["wspolicy"]},"application/x-7z-compressed":{"source":"apache","compressible":false,"extensions":["7z"]},"application/x-abiword":{"source":"apache","extensions":["abw"]},"application/x-ace-compressed":{"source":"apache","extensions":["ace"]},"application/x-amf":{"source":"apache"},"application/x-apple-diskimage":{"source":"apache","extensions":["dmg"]},"application/x-arj":{"compressible":false,"extensions":["arj"]},"application/x-authorware-bin":{"source":"apache","extensions":["aab","x32","u32","vox"]},"application/x-authorware-map":{"source":"apache","extensions":["aam"]},"application/x-authorware-seg":{"source":"apache","extensions":["aas"]},"application/x-bcpio":{"source":"apache","extensions":["bcpio"]},"application/x-bdoc":{"compressible":false,"extensions":["bdoc"]},"application/x-bittorrent":{"source":"apache","extensions":["torrent"]},"application/x-blorb":{"source":"apache","extensions":["blb","blorb"]},"application/x-bzip":{"source":"apache","compressible":false,"extensions":["bz"]},"application/x-bzip2":{"source":"apache","compressible":false,"extensions":["bz2","boz"]},"application/x-cbr":{"source":"apache","extensions":["cbr","cba","cbt","cbz","cb7"]},"application/x-cdlink":{"source":"apache","extensions":["vcd"]},"application/x-cfs-compressed":{"source":"apache","extensions":["cfs"]},"application/x-chat":{"source":"apache","extensions":["chat"]},"application/x-chess-pgn":{"source":"apache","extensions":["pgn"]},"application/x-chrome-extension":{"extensions":["crx"]},"application/x-cocoa":{"source":"nginx","extensions":["cco"]},"application/x-compress":{"source":"apache"},"application/x-conference":{"source":"apache","extensions":["nsc"]},"application/x-cpio":{"source":"apache","extensions":["cpio"]},"application/x-csh":{"source":"apache","extensions":["csh"]},"application/x-deb":{"compressible":false},"application/x-debian-package":{"source":"apache","extensions":["deb","udeb"]},"application/x-dgc-compressed":{"source":"apache","extensions":["dgc"]},"application/x-director":{"source":"apache","extensions":["dir","dcr","dxr","cst","cct","cxt","w3d","fgd","swa"]},"application/x-doom":{"source":"apache","extensions":["wad"]},"application/x-dtbncx+xml":{"source":"apache","compressible":true,"extensions":["ncx"]},"application/x-dtbook+xml":{"source":"apache","compressible":true,"extensions":["dtb"]},"application/x-dtbresource+xml":{"source":"apache","compressible":true,"extensions":["res"]},"application/x-dvi":{"source":"apache","compressible":false,"extensions":["dvi"]},"application/x-envoy":{"source":"apache","extensions":["evy"]},"application/x-eva":{"source":"apache","extensions":["eva"]},"application/x-font-bdf":{"source":"apache","extensions":["bdf"]},"application/x-font-dos":{"source":"apache"},"application/x-font-framemaker":{"source":"apache"},"application/x-font-ghostscript":{"source":"apache","extensions":["gsf"]},"application/x-font-libgrx":{"source":"apache"},"application/x-font-linux-psf":{"source":"apache","extensions":["psf"]},"application/x-font-pcf":{"source":"apache","extensions":["pcf"]},"application/x-font-snf":{"source":"apache","extensions":["snf"]},"application/x-font-speedo":{"source":"apache"},"application/x-font-sunos-news":{"source":"apache"},"application/x-font-type1":{"source":"apache","extensions":["pfa","pfb","pfm","afm"]},"application/x-font-vfont":{"source":"apache"},"application/x-freearc":{"source":"apache","extensions":["arc"]},"application/x-futuresplash":{"source":"apache","extensions":["spl"]},"application/x-gca-compressed":{"source":"apache","extensions":["gca"]},"application/x-glulx":{"source":"apache","extensions":["ulx"]},"application/x-gnumeric":{"source":"apache","extensions":["gnumeric"]},"application/x-gramps-xml":{"source":"apache","extensions":["gramps"]},"application/x-gtar":{"source":"apache","extensions":["gtar"]},"application/x-gzip":{"source":"apache"},"application/x-hdf":{"source":"apache","extensions":["hdf"]},"application/x-httpd-php":{"compressible":true,"extensions":["php"]},"application/x-install-instructions":{"source":"apache","extensions":["install"]},"application/x-iso9660-image":{"source":"apache","extensions":["iso"]},"application/x-iwork-keynote-sffkey":{"extensions":["key"]},"application/x-iwork-numbers-sffnumbers":{"extensions":["numbers"]},"application/x-iwork-pages-sffpages":{"extensions":["pages"]},"application/x-java-archive-diff":{"source":"nginx","extensions":["jardiff"]},"application/x-java-jnlp-file":{"source":"apache","compressible":false,"extensions":["jnlp"]},"application/x-javascript":{"compressible":true},"application/x-keepass2":{"extensions":["kdbx"]},"application/x-latex":{"source":"apache","compressible":false,"extensions":["latex"]},"application/x-lua-bytecode":{"extensions":["luac"]},"application/x-lzh-compressed":{"source":"apache","extensions":["lzh","lha"]},"application/x-makeself":{"source":"nginx","extensions":["run"]},"application/x-mie":{"source":"apache","extensions":["mie"]},"application/x-mobipocket-ebook":{"source":"apache","extensions":["prc","mobi"]},"application/x-mpegurl":{"compressible":false},"application/x-ms-application":{"source":"apache","extensions":["application"]},"application/x-ms-shortcut":{"source":"apache","extensions":["lnk"]},"application/x-ms-wmd":{"source":"apache","extensions":["wmd"]},"application/x-ms-wmz":{"source":"apache","extensions":["wmz"]},"application/x-ms-xbap":{"source":"apache","extensions":["xbap"]},"application/x-msaccess":{"source":"apache","extensions":["mdb"]},"application/x-msbinder":{"source":"apache","extensions":["obd"]},"application/x-mscardfile":{"source":"apache","extensions":["crd"]},"application/x-msclip":{"source":"apache","extensions":["clp"]},"application/x-msdos-program":{"extensions":["exe"]},"application/x-msdownload":{"source":"apache","extensions":["exe","dll","com","bat","msi"]},"application/x-msmediaview":{"source":"apache","extensions":["mvb","m13","m14"]},"application/x-msmetafile":{"source":"apache","extensions":["wmf","wmz","emf","emz"]},"application/x-msmoney":{"source":"apache","extensions":["mny"]},"application/x-mspublisher":{"source":"apache","extensions":["pub"]},"application/x-msschedule":{"source":"apache","extensions":["scd"]},"application/x-msterminal":{"source":"apache","extensions":["trm"]},"application/x-mswrite":{"source":"apache","extensions":["wri"]},"application/x-netcdf":{"source":"apache","extensions":["nc","cdf"]},"application/x-ns-proxy-autoconfig":{"compressible":true,"extensions":["pac"]},"application/x-nzb":{"source":"apache","extensions":["nzb"]},"application/x-perl":{"source":"nginx","extensions":["pl","pm"]},"application/x-pilot":{"source":"nginx","extensions":["prc","pdb"]},"application/x-pkcs12":{"source":"apache","compressible":false,"extensions":["p12","pfx"]},"application/x-pkcs7-certificates":{"source":"apache","extensions":["p7b","spc"]},"application/x-pkcs7-certreqresp":{"source":"apache","extensions":["p7r"]},"application/x-pki-message":{"source":"iana"},"application/x-rar-compressed":{"source":"apache","compressible":false,"extensions":["rar"]},"application/x-redhat-package-manager":{"source":"nginx","extensions":["rpm"]},"application/x-research-info-systems":{"source":"apache","extensions":["ris"]},"application/x-sea":{"source":"nginx","extensions":["sea"]},"application/x-sh":{"source":"apache","compressible":true,"extensions":["sh"]},"application/x-shar":{"source":"apache","extensions":["shar"]},"application/x-shockwave-flash":{"source":"apache","compressible":false,"extensions":["swf"]},"application/x-silverlight-app":{"source":"apache","extensions":["xap"]},"application/x-sql":{"source":"apache","extensions":["sql"]},"application/x-stuffit":{"source":"apache","compressible":false,"extensions":["sit"]},"application/x-stuffitx":{"source":"apache","extensions":["sitx"]},"application/x-subrip":{"source":"apache","extensions":["srt"]},"application/x-sv4cpio":{"source":"apache","extensions":["sv4cpio"]},"application/x-sv4crc":{"source":"apache","extensions":["sv4crc"]},"application/x-t3vm-image":{"source":"apache","extensions":["t3"]},"application/x-tads":{"source":"apache","extensions":["gam"]},"application/x-tar":{"source":"apache","compressible":true,"extensions":["tar"]},"application/x-tcl":{"source":"apache","extensions":["tcl","tk"]},"application/x-tex":{"source":"apache","extensions":["tex"]},"application/x-tex-tfm":{"source":"apache","extensions":["tfm"]},"application/x-texinfo":{"source":"apache","extensions":["texinfo","texi"]},"application/x-tgif":{"source":"apache","extensions":["obj"]},"application/x-ustar":{"source":"apache","extensions":["ustar"]},"application/x-virtualbox-hdd":{"compressible":true,"extensions":["hdd"]},"application/x-virtualbox-ova":{"compressible":true,"extensions":["ova"]},"application/x-virtualbox-ovf":{"compressible":true,"extensions":["ovf"]},"application/x-virtualbox-vbox":{"compressible":true,"extensions":["vbox"]},"application/x-virtualbox-vbox-extpack":{"compressible":false,"extensions":["vbox-extpack"]},"application/x-virtualbox-vdi":{"compressible":true,"extensions":["vdi"]},"application/x-virtualbox-vhd":{"compressible":true,"extensions":["vhd"]},"application/x-virtualbox-vmdk":{"compressible":true,"extensions":["vmdk"]},"application/x-wais-source":{"source":"apache","extensions":["src"]},"application/x-web-app-manifest+json":{"compressible":true,"extensions":["webapp"]},"application/x-www-form-urlencoded":{"source":"iana","compressible":true},"application/x-x509-ca-cert":{"source":"iana","extensions":["der","crt","pem"]},"application/x-x509-ca-ra-cert":{"source":"iana"},"application/x-x509-next-ca-cert":{"source":"iana"},"application/x-xfig":{"source":"apache","extensions":["fig"]},"application/x-xliff+xml":{"source":"apache","compressible":true,"extensions":["xlf"]},"application/x-xpinstall":{"source":"apache","compressible":false,"extensions":["xpi"]},"application/x-xz":{"source":"apache","extensions":["xz"]},"application/x-zmachine":{"source":"apache","extensions":["z1","z2","z3","z4","z5","z6","z7","z8"]},"application/x400-bp":{"source":"iana"},"application/xacml+xml":{"source":"iana","compressible":true},"application/xaml+xml":{"source":"apache","compressible":true,"extensions":["xaml"]},"application/xcap-att+xml":{"source":"iana","compressible":true,"extensions":["xav"]},"application/xcap-caps+xml":{"source":"iana","compressible":true,"extensions":["xca"]},"application/xcap-diff+xml":{"source":"iana","compressible":true,"extensions":["xdf"]},"application/xcap-el+xml":{"source":"iana","compressible":true,"extensions":["xel"]},"application/xcap-error+xml":{"source":"iana","compressible":true},"application/xcap-ns+xml":{"source":"iana","compressible":true,"extensions":["xns"]},"application/xcon-conference-info+xml":{"source":"iana","compressible":true},"application/xcon-conference-info-diff+xml":{"source":"iana","compressible":true},"application/xenc+xml":{"source":"iana","compressible":true,"extensions":["xenc"]},"application/xhtml+xml":{"source":"iana","compressible":true,"extensions":["xhtml","xht"]},"application/xhtml-voice+xml":{"source":"apache","compressible":true},"application/xliff+xml":{"source":"iana","compressible":true,"extensions":["xlf"]},"application/xml":{"source":"iana","compressible":true,"extensions":["xml","xsl","xsd","rng"]},"application/xml-dtd":{"source":"iana","compressible":true,"extensions":["dtd"]},"application/xml-external-parsed-entity":{"source":"iana"},"application/xml-patch+xml":{"source":"iana","compressible":true},"application/xmpp+xml":{"source":"iana","compressible":true},"application/xop+xml":{"source":"iana","compressible":true,"extensions":["xop"]},"application/xproc+xml":{"source":"apache","compressible":true,"extensions":["xpl"]},"application/xslt+xml":{"source":"iana","compressible":true,"extensions":["xsl","xslt"]},"application/xspf+xml":{"source":"apache","compressible":true,"extensions":["xspf"]},"application/xv+xml":{"source":"iana","compressible":true,"extensions":["mxml","xhvml","xvml","xvm"]},"application/yang":{"source":"iana","extensions":["yang"]},"application/yang-data+json":{"source":"iana","compressible":true},"application/yang-data+xml":{"source":"iana","compressible":true},"application/yang-patch+json":{"source":"iana","compressible":true},"application/yang-patch+xml":{"source":"iana","compressible":true},"application/yin+xml":{"source":"iana","compressible":true,"extensions":["yin"]},"application/zip":{"source":"iana","compressible":false,"extensions":["zip"]},"application/zlib":{"source":"iana"},"application/zstd":{"source":"iana"},"audio/1d-interleaved-parityfec":{"source":"iana"},"audio/32kadpcm":{"source":"iana"},"audio/3gpp":{"source":"iana","compressible":false,"extensions":["3gpp"]},"audio/3gpp2":{"source":"iana"},"audio/aac":{"source":"iana"},"audio/ac3":{"source":"iana"},"audio/adpcm":{"source":"apache","extensions":["adp"]},"audio/amr":{"source":"iana","extensions":["amr"]},"audio/amr-wb":{"source":"iana"},"audio/amr-wb+":{"source":"iana"},"audio/aptx":{"source":"iana"},"audio/asc":{"source":"iana"},"audio/atrac-advanced-lossless":{"source":"iana"},"audio/atrac-x":{"source":"iana"},"audio/atrac3":{"source":"iana"},"audio/basic":{"source":"iana","compressible":false,"extensions":["au","snd"]},"audio/bv16":{"source":"iana"},"audio/bv32":{"source":"iana"},"audio/clearmode":{"source":"iana"},"audio/cn":{"source":"iana"},"audio/dat12":{"source":"iana"},"audio/dls":{"source":"iana"},"audio/dsr-es201108":{"source":"iana"},"audio/dsr-es202050":{"source":"iana"},"audio/dsr-es202211":{"source":"iana"},"audio/dsr-es202212":{"source":"iana"},"audio/dv":{"source":"iana"},"audio/dvi4":{"source":"iana"},"audio/eac3":{"source":"iana"},"audio/encaprtp":{"source":"iana"},"audio/evrc":{"source":"iana"},"audio/evrc-qcp":{"source":"iana"},"audio/evrc0":{"source":"iana"},"audio/evrc1":{"source":"iana"},"audio/evrcb":{"source":"iana"},"audio/evrcb0":{"source":"iana"},"audio/evrcb1":{"source":"iana"},"audio/evrcnw":{"source":"iana"},"audio/evrcnw0":{"source":"iana"},"audio/evrcnw1":{"source":"iana"},"audio/evrcwb":{"source":"iana"},"audio/evrcwb0":{"source":"iana"},"audio/evrcwb1":{"source":"iana"},"audio/evs":{"source":"iana"},"audio/flexfec":{"source":"iana"},"audio/fwdred":{"source":"iana"},"audio/g711-0":{"source":"iana"},"audio/g719":{"source":"iana"},"audio/g722":{"source":"iana"},"audio/g7221":{"source":"iana"},"audio/g723":{"source":"iana"},"audio/g726-16":{"source":"iana"},"audio/g726-24":{"source":"iana"},"audio/g726-32":{"source":"iana"},"audio/g726-40":{"source":"iana"},"audio/g728":{"source":"iana"},"audio/g729":{"source":"iana"},"audio/g7291":{"source":"iana"},"audio/g729d":{"source":"iana"},"audio/g729e":{"source":"iana"},"audio/gsm":{"source":"iana"},"audio/gsm-efr":{"source":"iana"},"audio/gsm-hr-08":{"source":"iana"},"audio/ilbc":{"source":"iana"},"audio/ip-mr_v2.5":{"source":"iana"},"audio/isac":{"source":"apache"},"audio/l16":{"source":"iana"},"audio/l20":{"source":"iana"},"audio/l24":{"source":"iana","compressible":false},"audio/l8":{"source":"iana"},"audio/lpc":{"source":"iana"},"audio/melp":{"source":"iana"},"audio/melp1200":{"source":"iana"},"audio/melp2400":{"source":"iana"},"audio/melp600":{"source":"iana"},"audio/mhas":{"source":"iana"},"audio/midi":{"source":"apache","extensions":["mid","midi","kar","rmi"]},"audio/mobile-xmf":{"source":"iana","extensions":["mxmf"]},"audio/mp3":{"compressible":false,"extensions":["mp3"]},"audio/mp4":{"source":"iana","compressible":false,"extensions":["m4a","mp4a"]},"audio/mp4a-latm":{"source":"iana"},"audio/mpa":{"source":"iana"},"audio/mpa-robust":{"source":"iana"},"audio/mpeg":{"source":"iana","compressible":false,"extensions":["mpga","mp2","mp2a","mp3","m2a","m3a"]},"audio/mpeg4-generic":{"source":"iana"},"audio/musepack":{"source":"apache"},"audio/ogg":{"source":"iana","compressible":false,"extensions":["oga","ogg","spx","opus"]},"audio/opus":{"source":"iana"},"audio/parityfec":{"source":"iana"},"audio/pcma":{"source":"iana"},"audio/pcma-wb":{"source":"iana"},"audio/pcmu":{"source":"iana"},"audio/pcmu-wb":{"source":"iana"},"audio/prs.sid":{"source":"iana"},"audio/qcelp":{"source":"iana"},"audio/raptorfec":{"source":"iana"},"audio/red":{"source":"iana"},"audio/rtp-enc-aescm128":{"source":"iana"},"audio/rtp-midi":{"source":"iana"},"audio/rtploopback":{"source":"iana"},"audio/rtx":{"source":"iana"},"audio/s3m":{"source":"apache","extensions":["s3m"]},"audio/scip":{"source":"iana"},"audio/silk":{"source":"apache","extensions":["sil"]},"audio/smv":{"source":"iana"},"audio/smv-qcp":{"source":"iana"},"audio/smv0":{"source":"iana"},"audio/sofa":{"source":"iana"},"audio/sp-midi":{"source":"iana"},"audio/speex":{"source":"iana"},"audio/t140c":{"source":"iana"},"audio/t38":{"source":"iana"},"audio/telephone-event":{"source":"iana"},"audio/tetra_acelp":{"source":"iana"},"audio/tetra_acelp_bb":{"source":"iana"},"audio/tone":{"source":"iana"},"audio/tsvcis":{"source":"iana"},"audio/uemclip":{"source":"iana"},"audio/ulpfec":{"source":"iana"},"audio/usac":{"source":"iana"},"audio/vdvi":{"source":"iana"},"audio/vmr-wb":{"source":"iana"},"audio/vnd.3gpp.iufp":{"source":"iana"},"audio/vnd.4sb":{"source":"iana"},"audio/vnd.audiokoz":{"source":"iana"},"audio/vnd.celp":{"source":"iana"},"audio/vnd.cisco.nse":{"source":"iana"},"audio/vnd.cmles.radio-events":{"source":"iana"},"audio/vnd.cns.anp1":{"source":"iana"},"audio/vnd.cns.inf1":{"source":"iana"},"audio/vnd.dece.audio":{"source":"iana","extensions":["uva","uvva"]},"audio/vnd.digital-winds":{"source":"iana","extensions":["eol"]},"audio/vnd.dlna.adts":{"source":"iana"},"audio/vnd.dolby.heaac.1":{"source":"iana"},"audio/vnd.dolby.heaac.2":{"source":"iana"},"audio/vnd.dolby.mlp":{"source":"iana"},"audio/vnd.dolby.mps":{"source":"iana"},"audio/vnd.dolby.pl2":{"source":"iana"},"audio/vnd.dolby.pl2x":{"source":"iana"},"audio/vnd.dolby.pl2z":{"source":"iana"},"audio/vnd.dolby.pulse.1":{"source":"iana"},"audio/vnd.dra":{"source":"iana","extensions":["dra"]},"audio/vnd.dts":{"source":"iana","extensions":["dts"]},"audio/vnd.dts.hd":{"source":"iana","extensions":["dtshd"]},"audio/vnd.dts.uhd":{"source":"iana"},"audio/vnd.dvb.file":{"source":"iana"},"audio/vnd.everad.plj":{"source":"iana"},"audio/vnd.hns.audio":{"source":"iana"},"audio/vnd.lucent.voice":{"source":"iana","extensions":["lvp"]},"audio/vnd.ms-playready.media.pya":{"source":"iana","extensions":["pya"]},"audio/vnd.nokia.mobile-xmf":{"source":"iana"},"audio/vnd.nortel.vbk":{"source":"iana"},"audio/vnd.nuera.ecelp4800":{"source":"iana","extensions":["ecelp4800"]},"audio/vnd.nuera.ecelp7470":{"source":"iana","extensions":["ecelp7470"]},"audio/vnd.nuera.ecelp9600":{"source":"iana","extensions":["ecelp9600"]},"audio/vnd.octel.sbc":{"source":"iana"},"audio/vnd.presonus.multitrack":{"source":"iana"},"audio/vnd.qcelp":{"source":"iana"},"audio/vnd.rhetorex.32kadpcm":{"source":"iana"},"audio/vnd.rip":{"source":"iana","extensions":["rip"]},"audio/vnd.rn-realaudio":{"compressible":false},"audio/vnd.sealedmedia.softseal.mpeg":{"source":"iana"},"audio/vnd.vmx.cvsd":{"source":"iana"},"audio/vnd.wave":{"compressible":false},"audio/vorbis":{"source":"iana","compressible":false},"audio/vorbis-config":{"source":"iana"},"audio/wav":{"compressible":false,"extensions":["wav"]},"audio/wave":{"compressible":false,"extensions":["wav"]},"audio/webm":{"source":"apache","compressible":false,"extensions":["weba"]},"audio/x-aac":{"source":"apache","compressible":false,"extensions":["aac"]},"audio/x-aiff":{"source":"apache","extensions":["aif","aiff","aifc"]},"audio/x-caf":{"source":"apache","compressible":false,"extensions":["caf"]},"audio/x-flac":{"source":"apache","extensions":["flac"]},"audio/x-m4a":{"source":"nginx","extensions":["m4a"]},"audio/x-matroska":{"source":"apache","extensions":["mka"]},"audio/x-mpegurl":{"source":"apache","extensions":["m3u"]},"audio/x-ms-wax":{"source":"apache","extensions":["wax"]},"audio/x-ms-wma":{"source":"apache","extensions":["wma"]},"audio/x-pn-realaudio":{"source":"apache","extensions":["ram","ra"]},"audio/x-pn-realaudio-plugin":{"source":"apache","extensions":["rmp"]},"audio/x-realaudio":{"source":"nginx","extensions":["ra"]},"audio/x-tta":{"source":"apache"},"audio/x-wav":{"source":"apache","extensions":["wav"]},"audio/xm":{"source":"apache","extensions":["xm"]},"chemical/x-cdx":{"source":"apache","extensions":["cdx"]},"chemical/x-cif":{"source":"apache","extensions":["cif"]},"chemical/x-cmdf":{"source":"apache","extensions":["cmdf"]},"chemical/x-cml":{"source":"apache","extensions":["cml"]},"chemical/x-csml":{"source":"apache","extensions":["csml"]},"chemical/x-pdb":{"source":"apache"},"chemical/x-xyz":{"source":"apache","extensions":["xyz"]},"font/collection":{"source":"iana","extensions":["ttc"]},"font/otf":{"source":"iana","compressible":true,"extensions":["otf"]},"font/sfnt":{"source":"iana"},"font/ttf":{"source":"iana","compressible":true,"extensions":["ttf"]},"font/woff":{"source":"iana","extensions":["woff"]},"font/woff2":{"source":"iana","extensions":["woff2"]},"image/aces":{"source":"iana","extensions":["exr"]},"image/apng":{"compressible":false,"extensions":["apng"]},"image/avci":{"source":"iana","extensions":["avci"]},"image/avcs":{"source":"iana","extensions":["avcs"]},"image/avif":{"source":"iana","compressible":false,"extensions":["avif"]},"image/bmp":{"source":"iana","compressible":true,"extensions":["bmp"]},"image/cgm":{"source":"iana","extensions":["cgm"]},"image/dicom-rle":{"source":"iana","extensions":["drle"]},"image/emf":{"source":"iana","extensions":["emf"]},"image/fits":{"source":"iana","extensions":["fits"]},"image/g3fax":{"source":"iana","extensions":["g3"]},"image/gif":{"source":"iana","compressible":false,"extensions":["gif"]},"image/heic":{"source":"iana","extensions":["heic"]},"image/heic-sequence":{"source":"iana","extensions":["heics"]},"image/heif":{"source":"iana","extensions":["heif"]},"image/heif-sequence":{"source":"iana","extensions":["heifs"]},"image/hej2k":{"source":"iana","extensions":["hej2"]},"image/hsj2":{"source":"iana","extensions":["hsj2"]},"image/ief":{"source":"iana","extensions":["ief"]},"image/jls":{"source":"iana","extensions":["jls"]},"image/jp2":{"source":"iana","compressible":false,"extensions":["jp2","jpg2"]},"image/jpeg":{"source":"iana","compressible":false,"extensions":["jpeg","jpg","jpe"]},"image/jph":{"source":"iana","extensions":["jph"]},"image/jphc":{"source":"iana","extensions":["jhc"]},"image/jpm":{"source":"iana","compressible":false,"extensions":["jpm"]},"image/jpx":{"source":"iana","compressible":false,"extensions":["jpx","jpf"]},"image/jxr":{"source":"iana","extensions":["jxr"]},"image/jxra":{"source":"iana","extensions":["jxra"]},"image/jxrs":{"source":"iana","extensions":["jxrs"]},"image/jxs":{"source":"iana","extensions":["jxs"]},"image/jxsc":{"source":"iana","extensions":["jxsc"]},"image/jxsi":{"source":"iana","extensions":["jxsi"]},"image/jxss":{"source":"iana","extensions":["jxss"]},"image/ktx":{"source":"iana","extensions":["ktx"]},"image/ktx2":{"source":"iana","extensions":["ktx2"]},"image/naplps":{"source":"iana"},"image/pjpeg":{"compressible":false},"image/png":{"source":"iana","compressible":false,"extensions":["png"]},"image/prs.btif":{"source":"iana","extensions":["btif"]},"image/prs.pti":{"source":"iana","extensions":["pti"]},"image/pwg-raster":{"source":"iana"},"image/sgi":{"source":"apache","extensions":["sgi"]},"image/svg+xml":{"source":"iana","compressible":true,"extensions":["svg","svgz"]},"image/t38":{"source":"iana","extensions":["t38"]},"image/tiff":{"source":"iana","compressible":false,"extensions":["tif","tiff"]},"image/tiff-fx":{"source":"iana","extensions":["tfx"]},"image/vnd.adobe.photoshop":{"source":"iana","compressible":true,"extensions":["psd"]},"image/vnd.airzip.accelerator.azv":{"source":"iana","extensions":["azv"]},"image/vnd.cns.inf2":{"source":"iana"},"image/vnd.dece.graphic":{"source":"iana","extensions":["uvi","uvvi","uvg","uvvg"]},"image/vnd.djvu":{"source":"iana","extensions":["djvu","djv"]},"image/vnd.dvb.subtitle":{"source":"iana","extensions":["sub"]},"image/vnd.dwg":{"source":"iana","extensions":["dwg"]},"image/vnd.dxf":{"source":"iana","extensions":["dxf"]},"image/vnd.fastbidsheet":{"source":"iana","extensions":["fbs"]},"image/vnd.fpx":{"source":"iana","extensions":["fpx"]},"image/vnd.fst":{"source":"iana","extensions":["fst"]},"image/vnd.fujixerox.edmics-mmr":{"source":"iana","extensions":["mmr"]},"image/vnd.fujixerox.edmics-rlc":{"source":"iana","extensions":["rlc"]},"image/vnd.globalgraphics.pgb":{"source":"iana"},"image/vnd.microsoft.icon":{"source":"iana","compressible":true,"extensions":["ico"]},"image/vnd.mix":{"source":"iana"},"image/vnd.mozilla.apng":{"source":"iana"},"image/vnd.ms-dds":{"compressible":true,"extensions":["dds"]},"image/vnd.ms-modi":{"source":"iana","extensions":["mdi"]},"image/vnd.ms-photo":{"source":"apache","extensions":["wdp"]},"image/vnd.net-fpx":{"source":"iana","extensions":["npx"]},"image/vnd.pco.b16":{"source":"iana","extensions":["b16"]},"image/vnd.radiance":{"source":"iana"},"image/vnd.sealed.png":{"source":"iana"},"image/vnd.sealedmedia.softseal.gif":{"source":"iana"},"image/vnd.sealedmedia.softseal.jpg":{"source":"iana"},"image/vnd.svf":{"source":"iana"},"image/vnd.tencent.tap":{"source":"iana","extensions":["tap"]},"image/vnd.valve.source.texture":{"source":"iana","extensions":["vtf"]},"image/vnd.wap.wbmp":{"source":"iana","extensions":["wbmp"]},"image/vnd.xiff":{"source":"iana","extensions":["xif"]},"image/vnd.zbrush.pcx":{"source":"iana","extensions":["pcx"]},"image/webp":{"source":"apache","extensions":["webp"]},"image/wmf":{"source":"iana","extensions":["wmf"]},"image/x-3ds":{"source":"apache","extensions":["3ds"]},"image/x-cmu-raster":{"source":"apache","extensions":["ras"]},"image/x-cmx":{"source":"apache","extensions":["cmx"]},"image/x-freehand":{"source":"apache","extensions":["fh","fhc","fh4","fh5","fh7"]},"image/x-icon":{"source":"apache","compressible":true,"extensions":["ico"]},"image/x-jng":{"source":"nginx","extensions":["jng"]},"image/x-mrsid-image":{"source":"apache","extensions":["sid"]},"image/x-ms-bmp":{"source":"nginx","compressible":true,"extensions":["bmp"]},"image/x-pcx":{"source":"apache","extensions":["pcx"]},"image/x-pict":{"source":"apache","extensions":["pic","pct"]},"image/x-portable-anymap":{"source":"apache","extensions":["pnm"]},"image/x-portable-bitmap":{"source":"apache","extensions":["pbm"]},"image/x-portable-graymap":{"source":"apache","extensions":["pgm"]},"image/x-portable-pixmap":{"source":"apache","extensions":["ppm"]},"image/x-rgb":{"source":"apache","extensions":["rgb"]},"image/x-tga":{"source":"apache","extensions":["tga"]},"image/x-xbitmap":{"source":"apache","extensions":["xbm"]},"image/x-xcf":{"compressible":false},"image/x-xpixmap":{"source":"apache","extensions":["xpm"]},"image/x-xwindowdump":{"source":"apache","extensions":["xwd"]},"message/cpim":{"source":"iana"},"message/delivery-status":{"source":"iana"},"message/disposition-notification":{"source":"iana","extensions":["disposition-notification"]},"message/external-body":{"source":"iana"},"message/feedback-report":{"source":"iana"},"message/global":{"source":"iana","extensions":["u8msg"]},"message/global-delivery-status":{"source":"iana","extensions":["u8dsn"]},"message/global-disposition-notification":{"source":"iana","extensions":["u8mdn"]},"message/global-headers":{"source":"iana","extensions":["u8hdr"]},"message/http":{"source":"iana","compressible":false},"message/imdn+xml":{"source":"iana","compressible":true},"message/news":{"source":"iana"},"message/partial":{"source":"iana","compressible":false},"message/rfc822":{"source":"iana","compressible":true,"extensions":["eml","mime"]},"message/s-http":{"source":"iana"},"message/sip":{"source":"iana"},"message/sipfrag":{"source":"iana"},"message/tracking-status":{"source":"iana"},"message/vnd.si.simp":{"source":"iana"},"message/vnd.wfa.wsc":{"source":"iana","extensions":["wsc"]},"model/3mf":{"source":"iana","extensions":["3mf"]},"model/e57":{"source":"iana"},"model/gltf+json":{"source":"iana","compressible":true,"extensions":["gltf"]},"model/gltf-binary":{"source":"iana","compressible":true,"extensions":["glb"]},"model/iges":{"source":"iana","compressible":false,"extensions":["igs","iges"]},"model/mesh":{"source":"iana","compressible":false,"extensions":["msh","mesh","silo"]},"model/mtl":{"source":"iana","extensions":["mtl"]},"model/obj":{"source":"iana","extensions":["obj"]},"model/step":{"source":"iana"},"model/step+xml":{"source":"iana","compressible":true,"extensions":["stpx"]},"model/step+zip":{"source":"iana","compressible":false,"extensions":["stpz"]},"model/step-xml+zip":{"source":"iana","compressible":false,"extensions":["stpxz"]},"model/stl":{"source":"iana","extensions":["stl"]},"model/vnd.collada+xml":{"source":"iana","compressible":true,"extensions":["dae"]},"model/vnd.dwf":{"source":"iana","extensions":["dwf"]},"model/vnd.flatland.3dml":{"source":"iana"},"model/vnd.gdl":{"source":"iana","extensions":["gdl"]},"model/vnd.gs-gdl":{"source":"apache"},"model/vnd.gs.gdl":{"source":"iana"},"model/vnd.gtw":{"source":"iana","extensions":["gtw"]},"model/vnd.moml+xml":{"source":"iana","compressible":true},"model/vnd.mts":{"source":"iana","extensions":["mts"]},"model/vnd.opengex":{"source":"iana","extensions":["ogex"]},"model/vnd.parasolid.transmit.binary":{"source":"iana","extensions":["x_b"]},"model/vnd.parasolid.transmit.text":{"source":"iana","extensions":["x_t"]},"model/vnd.pytha.pyox":{"source":"iana"},"model/vnd.rosette.annotated-data-model":{"source":"iana"},"model/vnd.sap.vds":{"source":"iana","extensions":["vds"]},"model/vnd.usdz+zip":{"source":"iana","compressible":false,"extensions":["usdz"]},"model/vnd.valve.source.compiled-map":{"source":"iana","extensions":["bsp"]},"model/vnd.vtu":{"source":"iana","extensions":["vtu"]},"model/vrml":{"source":"iana","compressible":false,"extensions":["wrl","vrml"]},"model/x3d+binary":{"source":"apache","compressible":false,"extensions":["x3db","x3dbz"]},"model/x3d+fastinfoset":{"source":"iana","extensions":["x3db"]},"model/x3d+vrml":{"source":"apache","compressible":false,"extensions":["x3dv","x3dvz"]},"model/x3d+xml":{"source":"iana","compressible":true,"extensions":["x3d","x3dz"]},"model/x3d-vrml":{"source":"iana","extensions":["x3dv"]},"multipart/alternative":{"source":"iana","compressible":false},"multipart/appledouble":{"source":"iana"},"multipart/byteranges":{"source":"iana"},"multipart/digest":{"source":"iana"},"multipart/encrypted":{"source":"iana","compressible":false},"multipart/form-data":{"source":"iana","compressible":false},"multipart/header-set":{"source":"iana"},"multipart/mixed":{"source":"iana"},"multipart/multilingual":{"source":"iana"},"multipart/parallel":{"source":"iana"},"multipart/related":{"source":"iana","compressible":false},"multipart/report":{"source":"iana"},"multipart/signed":{"source":"iana","compressible":false},"multipart/vnd.bint.med-plus":{"source":"iana"},"multipart/voice-message":{"source":"iana"},"multipart/x-mixed-replace":{"source":"iana"},"text/1d-interleaved-parityfec":{"source":"iana"},"text/cache-manifest":{"source":"iana","compressible":true,"extensions":["appcache","manifest"]},"text/calendar":{"source":"iana","extensions":["ics","ifb"]},"text/calender":{"compressible":true},"text/cmd":{"compressible":true},"text/coffeescript":{"extensions":["coffee","litcoffee"]},"text/cql":{"source":"iana"},"text/cql-expression":{"source":"iana"},"text/cql-identifier":{"source":"iana"},"text/css":{"source":"iana","charset":"UTF-8","compressible":true,"extensions":["css"]},"text/csv":{"source":"iana","compressible":true,"extensions":["csv"]},"text/csv-schema":{"source":"iana"},"text/directory":{"source":"iana"},"text/dns":{"source":"iana"},"text/ecmascript":{"source":"iana"},"text/encaprtp":{"source":"iana"},"text/enriched":{"source":"iana"},"text/fhirpath":{"source":"iana"},"text/flexfec":{"source":"iana"},"text/fwdred":{"source":"iana"},"text/gff3":{"source":"iana"},"text/grammar-ref-list":{"source":"iana"},"text/html":{"source":"iana","compressible":true,"extensions":["html","htm","shtml"]},"text/jade":{"extensions":["jade"]},"text/javascript":{"source":"iana","compressible":true},"text/jcr-cnd":{"source":"iana"},"text/jsx":{"compressible":true,"extensions":["jsx"]},"text/less":{"compressible":true,"extensions":["less"]},"text/markdown":{"source":"iana","compressible":true,"extensions":["markdown","md"]},"text/mathml":{"source":"nginx","extensions":["mml"]},"text/mdx":{"compressible":true,"extensions":["mdx"]},"text/mizar":{"source":"iana"},"text/n3":{"source":"iana","charset":"UTF-8","compressible":true,"extensions":["n3"]},"text/parameters":{"source":"iana","charset":"UTF-8"},"text/parityfec":{"source":"iana"},"text/plain":{"source":"iana","compressible":true,"extensions":["txt","text","conf","def","list","log","in","ini"]},"text/provenance-notation":{"source":"iana","charset":"UTF-8"},"text/prs.fallenstein.rst":{"source":"iana"},"text/prs.lines.tag":{"source":"iana","extensions":["dsc"]},"text/prs.prop.logic":{"source":"iana"},"text/raptorfec":{"source":"iana"},"text/red":{"source":"iana"},"text/rfc822-headers":{"source":"iana"},"text/richtext":{"source":"iana","compressible":true,"extensions":["rtx"]},"text/rtf":{"source":"iana","compressible":true,"extensions":["rtf"]},"text/rtp-enc-aescm128":{"source":"iana"},"text/rtploopback":{"source":"iana"},"text/rtx":{"source":"iana"},"text/sgml":{"source":"iana","extensions":["sgml","sgm"]},"text/shaclc":{"source":"iana"},"text/shex":{"source":"iana","extensions":["shex"]},"text/slim":{"extensions":["slim","slm"]},"text/spdx":{"source":"iana","extensions":["spdx"]},"text/strings":{"source":"iana"},"text/stylus":{"extensions":["stylus","styl"]},"text/t140":{"source":"iana"},"text/tab-separated-values":{"source":"iana","compressible":true,"extensions":["tsv"]},"text/troff":{"source":"iana","extensions":["t","tr","roff","man","me","ms"]},"text/turtle":{"source":"iana","charset":"UTF-8","extensions":["ttl"]},"text/ulpfec":{"source":"iana"},"text/uri-list":{"source":"iana","compressible":true,"extensions":["uri","uris","urls"]},"text/vcard":{"source":"iana","compressible":true,"extensions":["vcard"]},"text/vnd.a":{"source":"iana"},"text/vnd.abc":{"source":"iana"},"text/vnd.ascii-art":{"source":"iana"},"text/vnd.curl":{"source":"iana","extensions":["curl"]},"text/vnd.curl.dcurl":{"source":"apache","extensions":["dcurl"]},"text/vnd.curl.mcurl":{"source":"apache","extensions":["mcurl"]},"text/vnd.curl.scurl":{"source":"apache","extensions":["scurl"]},"text/vnd.debian.copyright":{"source":"iana","charset":"UTF-8"},"text/vnd.dmclientscript":{"source":"iana"},"text/vnd.dvb.subtitle":{"source":"iana","extensions":["sub"]},"text/vnd.esmertec.theme-descriptor":{"source":"iana","charset":"UTF-8"},"text/vnd.familysearch.gedcom":{"source":"iana","extensions":["ged"]},"text/vnd.ficlab.flt":{"source":"iana"},"text/vnd.fly":{"source":"iana","extensions":["fly"]},"text/vnd.fmi.flexstor":{"source":"iana","extensions":["flx"]},"text/vnd.gml":{"source":"iana"},"text/vnd.graphviz":{"source":"iana","extensions":["gv"]},"text/vnd.hans":{"source":"iana"},"text/vnd.hgl":{"source":"iana"},"text/vnd.in3d.3dml":{"source":"iana","extensions":["3dml"]},"text/vnd.in3d.spot":{"source":"iana","extensions":["spot"]},"text/vnd.iptc.newsml":{"source":"iana"},"text/vnd.iptc.nitf":{"source":"iana"},"text/vnd.latex-z":{"source":"iana"},"text/vnd.motorola.reflex":{"source":"iana"},"text/vnd.ms-mediapackage":{"source":"iana"},"text/vnd.net2phone.commcenter.command":{"source":"iana"},"text/vnd.radisys.msml-basic-layout":{"source":"iana"},"text/vnd.senx.warpscript":{"source":"iana"},"text/vnd.si.uricatalogue":{"source":"iana"},"text/vnd.sosi":{"source":"iana"},"text/vnd.sun.j2me.app-descriptor":{"source":"iana","charset":"UTF-8","extensions":["jad"]},"text/vnd.trolltech.linguist":{"source":"iana","charset":"UTF-8"},"text/vnd.wap.si":{"source":"iana"},"text/vnd.wap.sl":{"source":"iana"},"text/vnd.wap.wml":{"source":"iana","extensions":["wml"]},"text/vnd.wap.wmlscript":{"source":"iana","extensions":["wmls"]},"text/vtt":{"source":"iana","charset":"UTF-8","compressible":true,"extensions":["vtt"]},"text/x-asm":{"source":"apache","extensions":["s","asm"]},"text/x-c":{"source":"apache","extensions":["c","cc","cxx","cpp","h","hh","dic"]},"text/x-component":{"source":"nginx","extensions":["htc"]},"text/x-fortran":{"source":"apache","extensions":["f","for","f77","f90"]},"text/x-gwt-rpc":{"compressible":true},"text/x-handlebars-template":{"extensions":["hbs"]},"text/x-java-source":{"source":"apache","extensions":["java"]},"text/x-jquery-tmpl":{"compressible":true},"text/x-lua":{"extensions":["lua"]},"text/x-markdown":{"compressible":true,"extensions":["mkd"]},"text/x-nfo":{"source":"apache","extensions":["nfo"]},"text/x-opml":{"source":"apache","extensions":["opml"]},"text/x-org":{"compressible":true,"extensions":["org"]},"text/x-pascal":{"source":"apache","extensions":["p","pas"]},"text/x-processing":{"compressible":true,"extensions":["pde"]},"text/x-sass":{"extensions":["sass"]},"text/x-scss":{"extensions":["scss"]},"text/x-setext":{"source":"apache","extensions":["etx"]},"text/x-sfv":{"source":"apache","extensions":["sfv"]},"text/x-suse-ymp":{"compressible":true,"extensions":["ymp"]},"text/x-uuencode":{"source":"apache","extensions":["uu"]},"text/x-vcalendar":{"source":"apache","extensions":["vcs"]},"text/x-vcard":{"source":"apache","extensions":["vcf"]},"text/xml":{"source":"iana","compressible":true,"extensions":["xml"]},"text/xml-external-parsed-entity":{"source":"iana"},"text/yaml":{"compressible":true,"extensions":["yaml","yml"]},"video/1d-interleaved-parityfec":{"source":"iana"},"video/3gpp":{"source":"iana","extensions":["3gp","3gpp"]},"video/3gpp-tt":{"source":"iana"},"video/3gpp2":{"source":"iana","extensions":["3g2"]},"video/av1":{"source":"iana"},"video/bmpeg":{"source":"iana"},"video/bt656":{"source":"iana"},"video/celb":{"source":"iana"},"video/dv":{"source":"iana"},"video/encaprtp":{"source":"iana"},"video/ffv1":{"source":"iana"},"video/flexfec":{"source":"iana"},"video/h261":{"source":"iana","extensions":["h261"]},"video/h263":{"source":"iana","extensions":["h263"]},"video/h263-1998":{"source":"iana"},"video/h263-2000":{"source":"iana"},"video/h264":{"source":"iana","extensions":["h264"]},"video/h264-rcdo":{"source":"iana"},"video/h264-svc":{"source":"iana"},"video/h265":{"source":"iana"},"video/iso.segment":{"source":"iana","extensions":["m4s"]},"video/jpeg":{"source":"iana","extensions":["jpgv"]},"video/jpeg2000":{"source":"iana"},"video/jpm":{"source":"apache","extensions":["jpm","jpgm"]},"video/jxsv":{"source":"iana"},"video/mj2":{"source":"iana","extensions":["mj2","mjp2"]},"video/mp1s":{"source":"iana"},"video/mp2p":{"source":"iana"},"video/mp2t":{"source":"iana","extensions":["ts"]},"video/mp4":{"source":"iana","compressible":false,"extensions":["mp4","mp4v","mpg4"]},"video/mp4v-es":{"source":"iana"},"video/mpeg":{"source":"iana","compressible":false,"extensions":["mpeg","mpg","mpe","m1v","m2v"]},"video/mpeg4-generic":{"source":"iana"},"video/mpv":{"source":"iana"},"video/nv":{"source":"iana"},"video/ogg":{"source":"iana","compressible":false,"extensions":["ogv"]},"video/parityfec":{"source":"iana"},"video/pointer":{"source":"iana"},"video/quicktime":{"source":"iana","compressible":false,"extensions":["qt","mov"]},"video/raptorfec":{"source":"iana"},"video/raw":{"source":"iana"},"video/rtp-enc-aescm128":{"source":"iana"},"video/rtploopback":{"source":"iana"},"video/rtx":{"source":"iana"},"video/scip":{"source":"iana"},"video/smpte291":{"source":"iana"},"video/smpte292m":{"source":"iana"},"video/ulpfec":{"source":"iana"},"video/vc1":{"source":"iana"},"video/vc2":{"source":"iana"},"video/vnd.cctv":{"source":"iana"},"video/vnd.dece.hd":{"source":"iana","extensions":["uvh","uvvh"]},"video/vnd.dece.mobile":{"source":"iana","extensions":["uvm","uvvm"]},"video/vnd.dece.mp4":{"source":"iana"},"video/vnd.dece.pd":{"source":"iana","extensions":["uvp","uvvp"]},"video/vnd.dece.sd":{"source":"iana","extensions":["uvs","uvvs"]},"video/vnd.dece.video":{"source":"iana","extensions":["uvv","uvvv"]},"video/vnd.directv.mpeg":{"source":"iana"},"video/vnd.directv.mpeg-tts":{"source":"iana"},"video/vnd.dlna.mpeg-tts":{"source":"iana"},"video/vnd.dvb.file":{"source":"iana","extensions":["dvb"]},"video/vnd.fvt":{"source":"iana","extensions":["fvt"]},"video/vnd.hns.video":{"source":"iana"},"video/vnd.iptvforum.1dparityfec-1010":{"source":"iana"},"video/vnd.iptvforum.1dparityfec-2005":{"source":"iana"},"video/vnd.iptvforum.2dparityfec-1010":{"source":"iana"},"video/vnd.iptvforum.2dparityfec-2005":{"source":"iana"},"video/vnd.iptvforum.ttsavc":{"source":"iana"},"video/vnd.iptvforum.ttsmpeg2":{"source":"iana"},"video/vnd.motorola.video":{"source":"iana"},"video/vnd.motorola.videop":{"source":"iana"},"video/vnd.mpegurl":{"source":"iana","extensions":["mxu","m4u"]},"video/vnd.ms-playready.media.pyv":{"source":"iana","extensions":["pyv"]},"video/vnd.nokia.interleaved-multimedia":{"source":"iana"},"video/vnd.nokia.mp4vr":{"source":"iana"},"video/vnd.nokia.videovoip":{"source":"iana"},"video/vnd.objectvideo":{"source":"iana"},"video/vnd.radgamettools.bink":{"source":"iana"},"video/vnd.radgamettools.smacker":{"source":"iana"},"video/vnd.sealed.mpeg1":{"source":"iana"},"video/vnd.sealed.mpeg4":{"source":"iana"},"video/vnd.sealed.swf":{"source":"iana"},"video/vnd.sealedmedia.softseal.mov":{"source":"iana"},"video/vnd.uvvu.mp4":{"source":"iana","extensions":["uvu","uvvu"]},"video/vnd.vivo":{"source":"iana","extensions":["viv"]},"video/vnd.youtube.yt":{"source":"iana"},"video/vp8":{"source":"iana"},"video/vp9":{"source":"iana"},"video/webm":{"source":"apache","compressible":false,"extensions":["webm"]},"video/x-f4v":{"source":"apache","extensions":["f4v"]},"video/x-fli":{"source":"apache","extensions":["fli"]},"video/x-flv":{"source":"apache","compressible":false,"extensions":["flv"]},"video/x-m4v":{"source":"apache","extensions":["m4v"]},"video/x-matroska":{"source":"apache","compressible":false,"extensions":["mkv","mk3d","mks"]},"video/x-mng":{"source":"apache","extensions":["mng"]},"video/x-ms-asf":{"source":"apache","extensions":["asf","asx"]},"video/x-ms-vob":{"source":"apache","extensions":["vob"]},"video/x-ms-wm":{"source":"apache","extensions":["wm"]},"video/x-ms-wmv":{"source":"apache","compressible":false,"extensions":["wmv"]},"video/x-ms-wmx":{"source":"apache","extensions":["wmx"]},"video/x-ms-wvx":{"source":"apache","extensions":["wvx"]},"video/x-msvideo":{"source":"apache","extensions":["avi"]},"video/x-sgi-movie":{"source":"apache","extensions":["movie"]},"video/x-smv":{"source":"apache","extensions":["smv"]},"x-conference/x-cooltalk":{"source":"apache","extensions":["ice"]},"x-shader/x-fragment":{"compressible":true},"x-shader/x-vertex":{"compressible":true}}',
      );

      /***/
    },

    /***/ 7003: /***/ (module) => {
      "use strict";
      module.exports = JSON.parse(
        '{"name":"openai","version":"3.3.0","description":"Node.js library for the OpenAI API","repository":{"type":"git","url":"git@github.com:openai/openai-node.git"},"keywords":["openai","open","ai","gpt-3","gpt3"],"author":"OpenAI","license":"MIT","main":"./dist/index.js","types":"./dist/index.d.ts","scripts":{"build":"tsc --outDir dist/"},"dependencies":{"axios":"^0.26.0","form-data":"^4.0.0"},"devDependencies":{"@types/node":"^12.11.5","typescript":"^3.6.4"}}',
      );

      /***/
    },

    /******/
  };
  /************************************************************************/
  /******/ // The module cache
  /******/ var __webpack_module_cache__ = {};
  /******/
  /******/ // The require function
  /******/ function __nccwpck_require__(moduleId) {
    /******/ // Check if module is in cache
    /******/ var cachedModule = __webpack_module_cache__[moduleId];
    /******/ if (cachedModule !== undefined) {
      /******/ return cachedModule.exports;
      /******/
    }
    /******/ // Create a new module (and put it into the cache)
    /******/ var module = (__webpack_module_cache__[moduleId] = {
      /******/ // no module.id needed
      /******/ // no module.loaded needed
      /******/ exports: {},
      /******/
    });
    /******/
    /******/ // Execute the module function
    /******/ var threw = true;
    /******/ try {
      /******/ __webpack_modules__[moduleId].call(
        module.exports,
        module,
        module.exports,
        __nccwpck_require__,
      );
      /******/ threw = false;
      /******/
    } finally {
      /******/ if (threw) delete __webpack_module_cache__[moduleId];
      /******/
    }
    /******/
    /******/ // Return the exports of the module
    /******/ return module.exports;
    /******/
  }
  /******/
  /************************************************************************/
  /******/ /* webpack/runtime/compat */
  /******/
  /******/ if (typeof __nccwpck_require__ !== "undefined")
    __nccwpck_require__.ab = __dirname + "/";
  /******/
  /************************************************************************/
  /******/
  /******/ // startup
  /******/ // Load entry module and return exports
  /******/ // This entry module is referenced by other modules so it can't be inlined
  /******/ var __webpack_exports__ = __nccwpck_require__(5634);
  /******/ module.exports = __webpack_exports__;
  /******/
  /******/
})();
//# sourceMappingURL=index.js.map
