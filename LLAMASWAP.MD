# Uithub-local dump – fullstackwebdev-llama-swap-3acace8 – 2025-11-17T18:21:24.554126+00:00
# ≈ 118261 tokens

### Makefile
# Define variables for the application
APP_NAME = llama-swap
BUILD_DIR = build

# Get the current Git hash
GIT_HASH := $(shell git rev-parse --short HEAD)
ifneq ($(shell git status --porcelain),)
    # There are untracked changes
    GIT_HASH := $(GIT_HASH)+
endif

# Capture the current build date in RFC3339 format
BUILD_DATE := $(shell date -u +"%Y-%m-%dT%H:%M:%SZ")

# Default target: Builds binaries for both OSX and Linux
all: mac linux simple-responder

# Clean build directory
clean:
	rm -rf $(BUILD_DIR)

proxy/ui_dist/placeholder.txt:
	mkdir -p proxy/ui_dist
	touch $@

# use cached test results while developing
test-dev: proxy/ui_dist/placeholder.txt
	go test -short ./proxy/...
	staticcheck ./proxy/... || true

test: proxy/ui_dist/placeholder.txt
	go test -short -count=1 ./proxy/...

# for CI - full test (takes longer)
test-all: proxy/ui_dist/placeholder.txt
	go test -race -count=1 ./proxy/...

ui/node_modules:
	cd ui && npm install

# build react UI
ui: ui/node_modules
	cd ui && npm run build

# Build OSX binary
mac: ui
	@echo "Building Mac binary..."
	GOOS=darwin GOARCH=arm64 go build -ldflags="-X main.commit=${GIT_HASH} -X main.version=local_${GIT_HASH} -X main.date=${BUILD_DATE}" -o $(BUILD_DIR)/$(APP_NAME)-darwin-arm64

# Build Linux binary
linux: ui
	@echo "Building Linux binary..."
	GOOS=linux GOARCH=amd64 go build -ldflags="-X main.commit=${GIT_HASH} -X main.version=local_${GIT_HASH} -X main.date=${BUILD_DATE}" -o $(BUILD_DIR)/$(APP_NAME)-linux-amd64
	GOOS=linux GOARCH=arm64 go build -ldflags="-X main.commit=${GIT_HASH} -X main.version=local_${GIT_HASH} -X main.date=${BUILD_DATE}" -o $(BUILD_DIR)/$(APP_NAME)-linux-arm64

# Build Windows binary
windows: ui
	@echo "Building Windows binary..."
	GOOS=windows GOARCH=amd64 go build -ldflags="-X main.commit=${GIT_HASH} -X main.version=local_${GIT_HASH} -X main.date=${BUILD_DATE}" -o $(BUILD_DIR)/$(APP_NAME)-windows-amd64.exe

# for testing proxy.Process
simple-responder:
	@echo "Building simple responder"
	GOOS=darwin GOARCH=arm64 go build -o $(BUILD_DIR)/simple-responder_darwin_arm64 cmd/simple-responder/simple-responder.go
	GOOS=linux GOARCH=amd64 go build -o $(BUILD_DIR)/simple-responder_linux_amd64 cmd/simple-responder/simple-responder.go

simple-responder-windows:
	@echo "Building simple responder for windows"
	GOOS=windows GOARCH=amd64 go build -o $(BUILD_DIR)/simple-responder.exe cmd/simple-responder/simple-responder.go

# Ensure build directory exists
$(BUILD_DIR):
	mkdir -p $(BUILD_DIR)

# Create a new release tag
release:
	@echo "Checking for unstaged changes..."
	@if [ -n "$(shell git status --porcelain)" ]; then \
		echo "Error: There are unstaged changes. Please commit or stash your changes before creating a release tag." >&2; \
		exit 1; \
	fi

# Get the highest tag in v{number} format, increment it, and create a new tag
	@highest_tag=$$(git tag --sort=-v:refname | grep -E '^v[0-9]+$$' | head -n 1 || echo "v0"); \
	new_tag="v$$(( $${highest_tag#v} + 1 ))"; \
	echo "tagging new version: $$new_tag"; \
	git tag "$$new_tag";

GOOS ?= $(shell go env GOOS 2>/dev/null || echo linux)
GOARCH ?= $(shell go env GOARCH 2>/dev/null || echo amd64)
wol-proxy: $(BUILD_DIR)
	@echo "Building wol-proxy"
	go build -o $(BUILD_DIR)/wol-proxy-$(GOOS)-$(GOARCH)-$(shell date +%Y-%m-%d) cmd/wol-proxy/wol-proxy.go

# Phony targets
.PHONY: all clean ui mac linux windows simple-responder simple-responder-windows test test-all test-dev wol-proxy


### LICENSE.md
MIT License

Copyright (c) 2024 Benson Wong

Permission is hereby granted, free of charge, to any person obtaining a copy of this software and associated documentation files (the “Software”), to deal in the Software without restriction, including without limitation the rights to use, copy, modify, merge, publish, distribute, sublicense, and/or sell copies of the Software, and to permit persons to whom the Software is furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED “AS IS”, WITHOUT WARRANTY OF ANY KIND, EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.

### config.example.yaml
# add this modeline for validation in vscode
# yaml-language-server: $schema=https://raw.githubusercontent.com/mostlygeek/llama-swap/refs/heads/main/config-schema.json
#
# llama-swap YAML configuration example
# -------------------------------------
#
# 💡 Tip - Use an LLM with this file!
# ====================================
#  This example configuration is written to be LLM friendly. Try
#  copying this file into an LLM and asking it to explain or generate
#  sections for you.
# ====================================

# Usage notes:
# - Below are all the available configuration options for llama-swap.
# - Settings noted as "required" must be in your configuration file
# - Settings noted as "optional" can be omitted

# healthCheckTimeout: number of seconds to wait for a model to be ready to serve requests
# - optional, default: 120
# - minimum value is 15 seconds, anything less will be set to this value
healthCheckTimeout: 500

# logLevel: sets the logging value
# - optional, default: info
# - Valid log levels: debug, info, warn, error
logLevel: info

# logTimeFormat: enables and sets the logging timestamp format
# - optional, default (disabled): ""
# - Valid values: "", "ansic", "unixdate", "rubydate", "rfc822", "rfc822z",
#   "rfc850", "rfc1123", "rfc1123z", "rfc3339", "rfc3339nano", "kitchen",
#   "stamp", "stampmilli", "stampmicro", and "stampnano".
# - For more info, read: https://pkg.go.dev/time#pkg-constants
logTimeFormat: ""

# metricsMaxInMemory: maximum number of metrics to keep in memory
# - optional, default: 1000
# - controls how many metrics are stored in memory before older ones are discarded
# - useful for limiting memory usage when processing large volumes of metrics
metricsMaxInMemory: 1000

# startPort: sets the starting port number for the automatic ${PORT} macro.
# - optional, default: 5800
# - the ${PORT} macro can be used in model.cmd and model.proxy settings
# - it is automatically incremented for every model that uses it
startPort: 10001

# sendLoadingState: inject loading status updates into the reasoning (thinking)
# field
# - optional, default: false
# - when true, a stream of loading messages will be sent to the client in the
#   reasoning field so chat UIs can show that loading is in progress.
# - see #366 for more details
sendLoadingState: true

# includeAliasesInList: present aliases within the /v1/models OpenAI API listing
# - optional, default: false
# - when true, model aliases will be output to the API model listing duplicating
#   all fields except for Id so chat UIs can use the alias equivalent to the original.
includeAliasesInList: false

# macros: a dictionary of string substitutions
# - optional, default: empty dictionary
# - macros are reusable snippets
# - used in a model's cmd, cmdStop, proxy, checkEndpoint, filters.stripParams
# - useful for reducing common configuration settings
# - macro names are strings and must be less than 64 characters
# - macro names must match the regex ^[a-zA-Z0-9_-]+$
# - macro names must not be a reserved name: PORT or MODEL_ID
# - macro values can be numbers, bools, or strings
# - macros can contain other macros, but they must be defined before they are used
macros:
  # Example of a multi-line macro
  "latest-llama": >
    /path/to/llama-server/llama-server-ec9e0301
    --port ${PORT}

  "default_ctx": 4096

  # Example of macro-in-macro usage. macros can contain other macros
  # but they must be previously declared.
  "default_args": "--ctx-size ${default_ctx}"

# models: a dictionary of model configurations
# - required
# - each key is the model's ID, used in API requests
# - model settings have default values that are used if they are not defined here
# - the model's ID is available in the ${MODEL_ID} macro, also available in macros defined above
# - below are examples of the all the settings a model can have
models:
  # keys are the model names used in API requests
  "llama":
    # macros: a dictionary of string substitutions specific to this model
    # - optional, default: empty dictionary
    # - macros defined here override macros defined in the global macros section
    # - model level macros follow the same rules as global macros
    macros:
      "default_ctx": 16384
      "temp": 0.7

    # cmd: the command to run to start the inference server.
    # - required
    # - it is just a string, similar to what you would run on the CLI
    # - using `|` allows for comments in the command, these will be parsed out
    # - macros can be used within cmd
    cmd: |
      # ${latest-llama} is a macro that is defined above
      ${latest-llama}
      --model path/to/llama-8B-Q4_K_M.gguf
      --ctx-size ${default_ctx}
      --temperature ${temp}

    # name: a display name for the model
    # - optional, default: empty string
    # - if set, it will be used in the v1/models API response
    # - if not set, it will be omitted in the JSON model record
    name: "llama 3.1 8B"

    # description: a description for the model
    # - optional, default: empty string
    # - if set, it will be used in the v1/models API response
    # - if not set, it will be omitted in the JSON model record
    description: "A small but capable model used for quick testing"

    # env: define an array of environment variables to inject into cmd's environment
    # - optional, default: empty array
    # - each value is a single string
    # - in the format: ENV_NAME=value
    env:
      - "CUDA_VISIBLE_DEVICES=0,1,2"

    # proxy: the URL where llama-swap routes API requests
    # - optional, default: http://localhost:${PORT}
    # - if you used ${PORT} in cmd this can be omitted
    # - if you use a custom port in cmd this *must* be set
    proxy: http://127.0.0.1:8999

    # aliases: alternative model names that this model configuration is used for
    # - optional, default: empty array
    # - aliases must be unique globally
    # - useful for impersonating a specific model
    aliases:
      - "gpt-4o-mini"
      - "gpt-3.5-turbo"

    # checkEndpoint: URL path to check if the server is ready
    # - optional, default: /health
    # - endpoint is expected to return an HTTP 200 response
    # - all requests wait until the endpoint is ready or fails
    # - use "none" to skip endpoint health checking
    checkEndpoint: /custom-endpoint

    # ttl: automatically unload the model after ttl seconds
    # - optional, default: 0
    # - ttl values must be a value greater than 0
    # - a value of 0 disables automatic unloading of the model
    ttl: 60

    # useModelName: override the model name that is sent to upstream server
    # - optional, default: ""
    # - useful for when the upstream server expects a specific model name that
    #   is different from the model's ID
    useModelName: "qwen:qwq"

    # filters: a dictionary of filter settings
    # - optional, default: empty dictionary
    # - only stripParams is currently supported
    filters:
      # stripParams: a comma separated list of parameters to remove from the request
      # - optional, default: ""
      # - useful for server side enforcement of sampling parameters
      # - the `model` parameter can never be removed
      # - can be any JSON key in the request body
      # - recommended to stick to sampling parameters
      stripParams: "temperature, top_p, top_k"

    # metadata: a dictionary of arbitrary values that are included in /v1/models
    # - optional, default: empty dictionary
    # - while metadata can contains complex types it is recommended to keep it simple
    # - metadata is only passed through in /v1/models responses
    metadata:
      # port will remain an integer
      port: ${PORT}

      # the ${temp} macro will remain a float
      temperature: ${temp}
      note: "The ${MODEL_ID} is running on port ${PORT} temp=${temp}, context=${default_ctx}"

      a_list:
        - 1
        - 1.23
        - "macros are OK in list and dictionary types: ${MODEL_ID}"

      an_obj:
        a: "1"
        b: 2
        # objects can contain complex types with macro substitution
        # becomes: c: [0.7, false, "model: llama"]
        c: ["${temp}", false, "model: ${MODEL_ID}"]

    # concurrencyLimit: overrides the allowed number of active parallel requests to a model
    # - optional, default: 0
    # - useful for limiting the number of active parallel requests a model can process
    # - must be set per model
    # - any number greater than 0 will override the internal default value of 10
    # - any requests that exceeds the limit will receive an HTTP 429 Too Many Requests response
    # - recommended to be omitted and the default used
    concurrencyLimit: 0

    # sendLoadingState: overrides the global sendLoadingState setting for this model
    # - optional, default: undefined (use global setting)
    sendLoadingState: false

  # Unlisted model example:
  "qwen-unlisted":
    # unlisted: boolean, true or false
    # - optional, default: false
    # - unlisted models do not show up in /v1/models api requests
    # - can be requested as normal through all apis
    unlisted: true
    cmd: llama-server --port ${PORT} -m Llama-3.2-1B-Instruct-Q4_K_M.gguf -ngl 0

  # Docker example:
  # container runtimes like Docker and Podman can be used reliably with
  # a combination of cmd, cmdStop, and ${MODEL_ID}
  "docker-llama":
    proxy: "http://127.0.0.1:${PORT}"
    cmd: |
      docker run --name ${MODEL_ID}
      --init --rm -p ${PORT}:8080 -v /mnt/nvme/models:/models
      ghcr.io/ggml-org/llama.cpp:server
      --model '/models/Qwen2.5-Coder-0.5B-Instruct-Q4_K_M.gguf'

    # cmdStop: command to run to stop the model gracefully
    # - optional, default: ""
    # - useful for stopping commands managed by another system
    # - the upstream's process id is available in the ${PID} macro
    #
    # When empty, llama-swap has this default behaviour:
    # - on POSIX systems: a SIGTERM signal is sent
    # - on Windows, calls taskkill to stop the process
    # - processes have 5 seconds to shutdown until forceful termination is attempted
    cmdStop: docker stop ${MODEL_ID}

# groups: a dictionary of group settings
# - optional, default: empty dictionary
# - provides advanced controls over model swapping behaviour
# - using groups some models can be kept loaded indefinitely, while others are swapped out
# - model IDs must be defined in the Models section
# - a model can only be a member of one group
# - group behaviour is controlled via the `swap`, `exclusive` and `persistent` fields
# - see issue #109 for details
#
# NOTE: the example below uses model names that are not defined above for demonstration purposes
groups:
  # group1 works the same as the default behaviour of llama-swap where only one model is allowed
  # to run a time across the whole llama-swap instance
  "group1":
    # swap: controls the model swapping behaviour in within the group
    # - optional, default: true
    # - true : only one model is allowed to run at a time
    # - false: all models can run together, no swapping
    swap: true

    # exclusive: controls how the group affects other groups
    # - optional, default: true
    # - true: causes all other groups to unload when this group runs a model
    # - false: does not affect other groups
    exclusive: true

    # members references the models defined above
    # required
    members:
      - "llama"
      - "qwen-unlisted"

  # Example:
  # - in group2 all models can run at the same time
  # - when a different group is loaded it causes all running models in this group to unload
  "group2":
    swap: false

    # exclusive: false does not unload other groups when a model in group2 is requested
    # - the models in group2 will be loaded but will not unload any other groups
    exclusive: false
    members:
      - "docker-llama"
      - "modelA"
      - "modelB"

  # Example:
  # - a persistent group, prevents other groups from unloading it
  "forever":
    # persistent: prevents over groups from unloading the models in this group
    # - optional, default: false
    # - does not affect individual model behaviour
    persistent: true

    # set swap/exclusive to false to prevent swapping inside the group
    # and the unloading of other groups
    swap: false
    exclusive: false
    members:
      - "forever-modelA"
      - "forever-modelB"
      - "forever-modelc"

# hooks: a dictionary of event triggers and actions
# - optional, default: empty dictionary
# - the only supported hook is on_startup
hooks:
  # on_startup: a dictionary of actions to perform on startup
  # - optional, default: empty dictionary
  # - the only supported action is preload
  on_startup:
    # preload: a list of model ids to load on startup
    # - optional, default: empty list
    # - model names must match keys in the models sections
    # - when preloading multiple models at once, define a group
    #   otherwise models will be loaded and swapped out
    preload:
      - "llama"


### .coderabbit.yaml
# yaml-language-server: $schema=https://coderabbit.ai/integrations/schema.v2.json
language: "en-US"
early_access: false
reviews:
  profile: "chill"
  request_changes_workflow: false
  high_level_summary: true
  poem: false
  review_status: true
  collapse_walkthrough: false
  auto_review:
    enabled: true
    drafts: false
chat:
  auto_reply: true


### .goreleaser.yaml
version: 2

builds:
  - env:
      - CGO_ENABLED=0
    goos:
      - linux
      - darwin
      - freebsd
      - windows
    goarch:
      - amd64
      - arm64
    ignore:
      - goos: freebsd
        goarch: arm64
      - goos: windows
        goarch: arm64

archives:
  - id: default
    formats:
      - tar.gz
    name_template: "{{ .ProjectName }}_{{ .Version }}_{{ .Os }}_{{ .Arch }}"
    builds_info:
      group: root
      owner: root
    format_overrides:
      # use zip format for windows
      - goos: windows
        formats:
          - zip

### go.sum
github.com/billziss-gh/golib v0.2.0 h1:NyvcAQdfvM8xokKkKotiligKjKXzuQD4PPykg1nKc/8=
github.com/billziss-gh/golib v0.2.0/go.mod h1:mZpUYANXZkDKSnyYbX9gfnyxwe0ddRhUtfXcsD5r8dw=
github.com/bytedance/sonic v1.11.6 h1:oUp34TzMlL+OY1OUWxHqsdkgC/Zfc85zGqw9siXjrc0=
github.com/bytedance/sonic v1.11.6/go.mod h1:LysEHSvpvDySVdC2f87zGWf6CIKJcAvqab1ZaiQtds4=
github.com/bytedance/sonic/loader v0.1.1 h1:c+e5Pt1k/cy5wMveRDyk2X4B9hF4g7an8N3zCYjJFNM=
github.com/bytedance/sonic/loader v0.1.1/go.mod h1:ncP89zfokxS5LZrJxl5z0UJcsk4M4yY2JpfqGeCtNLU=
github.com/cloudwego/base64x v0.1.4 h1:jwCgWpFanWmN8xoIUHa2rtzmkd5J2plF/dnLS6Xd/0Y=
github.com/cloudwego/base64x v0.1.4/go.mod h1:0zlkT4Wn5C6NdauXdJRhSKRlJvmclQ1hhJgA0rcu/8w=
github.com/cloudwego/iasm v0.2.0 h1:1KNIy1I1H9hNNFEEH3DVnI4UujN+1zjpuk6gwHLTssg=
github.com/cloudwego/iasm v0.2.0/go.mod h1:8rXZaNYT2n95jn+zTI1sDr+IgcD2GVs0nlbbQPiEFhY=
github.com/davecgh/go-spew v1.1.0/go.mod h1:J7Y8YcW2NihsgmVo/mv3lAwl/skON4iLHjSsI+c5H38=
github.com/davecgh/go-spew v1.1.1 h1:vj9j/u1bqnvCEfJOwUhtlOARqs3+rkHYY13jYWTU97c=
github.com/davecgh/go-spew v1.1.1/go.mod h1:J7Y8YcW2NihsgmVo/mv3lAwl/skON4iLHjSsI+c5H38=
github.com/fsnotify/fsnotify v1.9.0 h1:2Ml+OJNzbYCTzsxtv8vKSFD9PbJjmhYF14k/jKC7S9k=
github.com/fsnotify/fsnotify v1.9.0/go.mod h1:8jBTzvmWwFyi3Pb8djgCCO5IBqzKJ/Jwo8TRcHyHii0=
github.com/gabriel-vasile/mimetype v1.4.3 h1:in2uUcidCuFcDKtdcBxlR0rJ1+fsokWf+uqxgUFjbI0=
github.com/gabriel-vasile/mimetype v1.4.3/go.mod h1:d8uq/6HKRL6CGdk+aubisF/M5GcPfT7nKyLpA0lbSSk=
github.com/gin-contrib/sse v0.1.0 h1:Y/yl/+YNO8GZSjAhjMsSuLt29uWRFHdHYUb5lYOV9qE=
github.com/gin-contrib/sse v0.1.0/go.mod h1:RHrZQHXnP2xjPF+u1gW/2HnVO7nvIa9PG3Gm+fLHvGI=
github.com/gin-gonic/gin v1.10.0 h1:nTuyha1TYqgedzytsKYqna+DfLos46nTv2ygFy86HFU=
github.com/gin-gonic/gin v1.10.0/go.mod h1:4PMNQiOhvDRa013RKVbsiNwoyezlm2rm0uX/T7kzp5Y=
github.com/go-playground/assert/v2 v2.2.0 h1:JvknZsQTYeFEAhQwI4qEt9cyV5ONwRHC+lYKSsYSR8s=
github.com/go-playground/assert/v2 v2.2.0/go.mod h1:VDjEfimB/XKnb+ZQfWdccd7VUvScMdVu0Titje2rxJ4=
github.com/go-playground/locales v0.14.1 h1:EWaQ/wswjilfKLTECiXz7Rh+3BjFhfDFKv/oXslEjJA=
github.com/go-playground/locales v0.14.1/go.mod h1:hxrqLVvrK65+Rwrd5Fc6F2O76J/NuW9t0sjnWqG1slY=
github.com/go-playground/universal-translator v0.18.1 h1:Bcnm0ZwsGyWbCzImXv+pAJnYK9S473LQFuzCbDbfSFY=
github.com/go-playground/universal-translator v0.18.1/go.mod h1:xekY+UJKNuX9WP91TpwSH2VMlDf28Uj24BCp08ZFTUY=
github.com/go-playground/validator/v10 v10.20.0 h1:K9ISHbSaI0lyB2eWMPJo+kOS/FBExVwjEviJTixqxL8=
github.com/go-playground/validator/v10 v10.20.0/go.mod h1:dbuPbCMFw/DrkbEynArYaCwl3amGuJotoKCe95atGMM=
github.com/goccy/go-json v0.10.2 h1:CrxCmQqYDkv1z7lO7Wbh2HN93uovUHgrECaO5ZrCXAU=
github.com/goccy/go-json v0.10.2/go.mod h1:6MelG93GURQebXPDq3khkgXZkazVtN9CRI+MGFi0w8I=
github.com/google/go-cmp v0.5.5 h1:Khx7svrCpmxxtHBq5j2mp/xVjsi8hQMfNLvJFAlrGgU=
github.com/google/go-cmp v0.5.5/go.mod h1:v8dTdLbMG2kIc/vJvl+f65V22dbkXbowE6jgT/gNBxE=
github.com/google/gofuzz v1.0.0/go.mod h1:dBl0BpW6vV/+mYPU4Po3pmUjxk6FQPldtuIdl/M65Eg=
github.com/json-iterator/go v1.1.12 h1:PV8peI4a0ysnczrg+LtxykD8LfKY9ML6u2jnxaEnrnM=
github.com/json-iterator/go v1.1.12/go.mod h1:e30LSqwooZae/UwlEbR2852Gd8hjQvJoHmT4TnhNGBo=
github.com/klauspost/cpuid/v2 v2.0.9/go.mod h1:FInQzS24/EEf25PyTYn52gqo7WaD8xa0213Md/qVLRg=
github.com/klauspost/cpuid/v2 v2.2.7 h1:ZWSB3igEs+d0qvnxR/ZBzXVmxkgt8DdzP6m9pfuVLDM=
github.com/klauspost/cpuid/v2 v2.2.7/go.mod h1:Lcz8mBdAVJIBVzewtcLocK12l3Y+JytZYpaMropDUws=
github.com/knz/go-libedit v1.10.1/go.mod h1:MZTVkCWyz0oBc7JOWP3wNAzd002ZbM/5hgShxwh4x8M=
github.com/leodido/go-urn v1.4.0 h1:WT9HwE9SGECu3lg4d/dIA+jxlljEa1/ffXKmRjqdmIQ=
github.com/leodido/go-urn v1.4.0/go.mod h1:bvxc+MVxLKB4z00jd1z+Dvzr47oO32F/QSNjSBOlFxI=
github.com/mattn/go-isatty v0.0.20 h1:xfD0iDuEKnDkl03q4limB+vH+GxLEtL/jb4xVJSWWEY=
github.com/mattn/go-isatty v0.0.20/go.mod h1:W+V8PltTTMOvKvAeJH7IuucS94S2C6jfK/D7dTCTo3Y=
github.com/modern-go/concurrent v0.0.0-20180228061459-e0a39a4cb421/go.mod h1:6dJC0mAP4ikYIbvyc7fijjWJddQyLn8Ig3JB5CqoB9Q=
github.com/modern-go/concurrent v0.0.0-20180306012644-bacd9c7ef1dd h1:TRLaZ9cD/w8PVh93nsPXa1VrQ6jlwL5oN8l14QlcNfg=
github.com/modern-go/concurrent v0.0.0-20180306012644-bacd9c7ef1dd/go.mod h1:6dJC0mAP4ikYIbvyc7fijjWJddQyLn8Ig3JB5CqoB9Q=
github.com/modern-go/reflect2 v1.0.2 h1:xBagoLtFs94CBntxluKeaWgTMpvLxC4ur3nMaC9Gz0M=
github.com/modern-go/reflect2 v1.0.2/go.mod h1:yWuevngMOJpCy52FWWMvUC8ws7m/LJsjYzDa0/r8luk=
github.com/pelletier/go-toml/v2 v2.2.2 h1:aYUidT7k73Pcl9nb2gScu7NSrKCSHIDE89b3+6Wq+LM=
github.com/pelletier/go-toml/v2 v2.2.2/go.mod h1:1t835xjRzz80PqgE6HHgN2JOsmgYu/h4qDAS4n929Rs=
github.com/pmezard/go-difflib v1.0.0 h1:4DBwDE0NGyQoBHbLQYPwSUPoCMWR5BEzIk/f1lZbAQM=
github.com/pmezard/go-difflib v1.0.0/go.mod h1:iKH77koFhYxTK1pcRnkKkqfTogsbg7gZNVY4sRDYZ/4=
github.com/stretchr/objx v0.1.0/go.mod h1:HFkY916IF+rwdDfMAkV7OtwuqBVzrE8GR6GFx+wExME=
github.com/stretchr/objx v0.4.0/go.mod h1:YvHI0jy2hoMjB+UWwv71VJQ9isScKT/TqJzVSSt89Yw=
github.com/stretchr/objx v0.5.0/go.mod h1:Yh+to48EsGEfYuaHDzXPcE3xhTkx73EhmCGUpEOglKo=
github.com/stretchr/objx v0.5.2/go.mod h1:FRsXN1f5AsAjCGJKqEizvkpNtU+EGNCLh3NxZ/8L+MA=
github.com/stretchr/testify v1.3.0/go.mod h1:M5WIy9Dh21IEIfnGCwXGc5bZfKNJtfHm1UVUgZn+9EI=
github.com/stretchr/testify v1.7.0/go.mod h1:6Fq8oRcR53rry900zMqJjRRixrwX3KX962/h/Wwjteg=
github.com/stretchr/testify v1.7.1/go.mod h1:6Fq8oRcR53rry900zMqJjRRixrwX3KX962/h/Wwjteg=
github.com/stretchr/testify v1.8.0/go.mod h1:yNjHg4UonilssWZ8iaSj1OCr/vHnekPRkoO+kdMU+MU=
github.com/stretchr/testify v1.8.1/go.mod h1:w2LPCIKwWwSfY2zedu0+kehJoqGctiVI29o6fzry7u4=
github.com/stretchr/testify v1.8.4/go.mod h1:sz/lmYIOXD/1dqDmKjjqLyZ2RngseejIcXlSw2iwfAo=
github.com/stretchr/testify v1.9.0 h1:HtqpIVDClZ4nwg75+f6Lvsy/wHu+3BoSGCbBAcpTsTg=
github.com/stretchr/testify v1.9.0/go.mod h1:r2ic/lqez/lEtzL7wO/rwa5dbSLXVDPFyf8C91i36aY=
github.com/tidwall/gjson v1.14.2/go.mod h1:/wbyibRr2FHMks5tjHJ5F8dMZh3AcwJEMf5vlfC0lxk=
github.com/tidwall/gjson v1.18.0 h1:FIDeeyB800efLX89e5a8Y0BNH+LOngJyGrIWxG2FKQY=
github.com/tidwall/gjson v1.18.0/go.mod h1:/wbyibRr2FHMks5tjHJ5F8dMZh3AcwJEMf5vlfC0lxk=
github.com/tidwall/match v1.1.1 h1:+Ho715JplO36QYgwN9PGYNhgZvoUSc9X2c80KVTi+GA=
github.com/tidwall/match v1.1.1/go.mod h1:eRSPERbgtNPcGhD8UCthc6PmLEQXEWd3PRB5JTxsfmM=
github.com/tidwall/pretty v1.2.0/go.mod h1:ITEVvHYasfjBbM0u2Pg8T2nJnzm8xPwvNhhsoaGGjNU=
github.com/tidwall/pretty v1.2.1 h1:qjsOFOWWQl+N3RsoF5/ssm1pHmJJwhjlSbZ51I6wMl4=
github.com/tidwall/pretty v1.2.1/go.mod h1:ITEVvHYasfjBbM0u2Pg8T2nJnzm8xPwvNhhsoaGGjNU=
github.com/tidwall/sjson v1.2.5 h1:kLy8mja+1c9jlljvWTlSazM7cKDRfJuR/bOJhcY5NcY=
github.com/tidwall/sjson v1.2.5/go.mod h1:Fvgq9kS/6ociJEDnK0Fk1cpYF4FIW6ZF7LAe+6jwd28=
github.com/twitchyliquid64/golang-asm v0.15.1 h1:SU5vSMR7hnwNxj24w34ZyCi/FmDZTkS4MhqMhdFk5YI=
github.com/twitchyliquid64/golang-asm v0.15.1/go.mod h1:a1lVb/DtPvCB8fslRZhAngC2+aY1QWCk3Cedj/Gdt08=
github.com/ugorji/go/codec v1.2.12 h1:9LC83zGrHhuUA9l16C9AHXAqEV/2wBQ4nkvumAE65EE=
github.com/ugorji/go/codec v1.2.12/go.mod h1:UNopzCgEMSXjBc6AOMqYvWC1ktqTAfzJZUZgYf6w6lg=
golang.org/x/arch v0.0.0-20210923205945-b76863e36670/go.mod h1:5om86z9Hs0C8fWVUuoMHwpExlXzs5Tkyp9hOrfG7pp8=
golang.org/x/arch v0.8.0 h1:3wRIsP3pM4yUptoR96otTUOXI367OS0+c9eeRi9doIc=
golang.org/x/arch v0.8.0/go.mod h1:FEVrYAQjsQXMVJ1nsMoVVXPZg6p2JE2mx8psSWTDQys=
golang.org/x/crypto v0.36.0 h1:AnAEvhDddvBdpY+uR+MyHmuZzzNqXSe/GvuDeob5L34=
golang.org/x/crypto v0.36.0/go.mod h1:Y4J0ReaxCR1IMaabaSMugxJES1EpwhBHhv2bDHklZvc=
golang.org/x/net v0.38.0 h1:vRMAPTMaeGqVhG5QyLJHqNDwecKTomGeqbnfZyKlBI8=
golang.org/x/net v0.38.0/go.mod h1:ivrbrMbzFq5J41QOQh0siUuly180yBYtLp+CKbEaFx8=
golang.org/x/sys v0.5.0/go.mod h1:oPkhp1MJrh7nUepCBck5+mAzfO9JrbApNNgaTdGDITg=
golang.org/x/sys v0.6.0/go.mod h1:oPkhp1MJrh7nUepCBck5+mAzfO9JrbApNNgaTdGDITg=
golang.org/x/sys v0.31.0 h1:ioabZlmFYtWhL+TRYpcnNlLwhyxaM9kWTDEmfnprqik=
golang.org/x/sys v0.31.0/go.mod h1:BJP2sWEmIv4KK5OTEluFJCKSidICx8ciO85XgH3Ak8k=
golang.org/x/text v0.23.0 h1:D71I7dUrlY+VX0gQShAThNGHFxZ13dGLBHQLVl1mJlY=
golang.org/x/text v0.23.0/go.mod h1:/BLNzu4aZCJ1+kcD0DNRotWKage4q2rGVAg4o22unh4=
golang.org/x/xerrors v0.0.0-20191204190536-9bdfabe68543 h1:E7g+9GITq07hpfrRu66IVDexMakfv52eLZ2CXBWiKr4=
golang.org/x/xerrors v0.0.0-20191204190536-9bdfabe68543/go.mod h1:I/5z698sn9Ka8TeJc9MKroUUfqBBauWjQqLJ2OPfmY0=
google.golang.org/protobuf v1.34.1 h1:9ddQBjfCyZPOHPUiPxpYESBLc+T8P3E+Vo4IbKZgFWg=
google.golang.org/protobuf v1.34.1/go.mod h1:c6P6GXX6sHbq/GpV6MGZEdwhWPcYBgnhAHhKbcUYpos=
gopkg.in/check.v1 v0.0.0-20161208181325-20d25e280405 h1:yhCVgyC4o1eVCa2tZl7eS0r+SDo693bJlVdllGtEeKM=
gopkg.in/check.v1 v0.0.0-20161208181325-20d25e280405/go.mod h1:Co6ibVJAznAaIkqp8huTwlJQCZ016jof/cbN4VW5Yz0=
gopkg.in/yaml.v3 v3.0.0-20200313102051-9f266ea9e77c/go.mod h1:K4uyk7z7BCEPqu6E+C64Yfv1cQ7kz7rIZviUmN+EgEM=
gopkg.in/yaml.v3 v3.0.1 h1:fxVm/GzAzEWqLHuvctI91KS9hhNmmWOoWu0XTYJS7CA=
gopkg.in/yaml.v3 v3.0.1/go.mod h1:K4uyk7z7BCEPqu6E+C64Yfv1cQ7kz7rIZviUmN+EgEM=
nullprogram.com/x/optparse v1.0.0/go.mod h1:KdyPE+Igbe0jQUrVfMqDMeJQIJZEuyV7pjYmp6pbG50=
rsc.io/pdf v0.1.1/go.mod h1:n8OzWcQ6Sp37PL01nO98y4iUCRdTGarVfzxY20ICaU4=


### llama-swap.go
package main

import (
	"context"
	"flag"
	"fmt"
	"log"
	"net/http"
	"os"
	"os/signal"
	"path/filepath"
	"syscall"
	"time"

	"github.com/fsnotify/fsnotify"
	"github.com/gin-gonic/gin"
	"github.com/mostlygeek/llama-swap/event"
	"github.com/mostlygeek/llama-swap/proxy"
	"github.com/mostlygeek/llama-swap/proxy/config"
)

var (
	version string = "0"
	commit  string = "abcd1234"
	date    string = "unknown"
)

func main() {
	// Define a command-line flag for the port
	configPath := flag.String("config", "config.yaml", "config file name")
	listenStr := flag.String("listen", "", "listen ip/port")
	certFile := flag.String("tls-cert-file", "", "TLS certificate file")
	keyFile := flag.String("tls-key-file", "", "TLS key file")
	showVersion := flag.Bool("version", false, "show version of build")
	watchConfig := flag.Bool("watch-config", false, "Automatically reload config file on change")

	flag.Parse() // Parse the command-line flags

	if *showVersion {
		fmt.Printf("version: %s (%s), built at %s\n", version, commit, date)
		os.Exit(0)
	}

	conf, err := config.LoadConfig(*configPath)
	if err != nil {
		fmt.Printf("Error loading config: %v\n", err)
		os.Exit(1)
	}

	if len(conf.Profiles) > 0 {
		fmt.Println("WARNING: Profile functionality has been removed in favor of Groups. See the README for more information.")
	}

	if mode := os.Getenv("GIN_MODE"); mode != "" {
		gin.SetMode(mode)
	} else {
		gin.SetMode(gin.ReleaseMode)
	}

	// Validate TLS flags.
	var useTLS = (*certFile != "" && *keyFile != "")
	if (*certFile != "" && *keyFile == "") ||
		(*certFile == "" && *keyFile != "") {
		fmt.Println("Error: Both --tls-cert-file and --tls-key-file must be provided for TLS.")
		os.Exit(1)
	}

	// Set default ports.
	if *listenStr == "" {
		defaultPort := ":8080"
		if useTLS {
			defaultPort = ":8443"
		}
		listenStr = &defaultPort
	}

	// Setup channels for server management
	exitChan := make(chan struct{})
	sigChan := make(chan os.Signal, 1)
	signal.Notify(sigChan, syscall.SIGINT, syscall.SIGTERM)

	// Create server with initial handler
	srv := &http.Server{
		Addr: *listenStr,
	}

	// Support for watching config and reloading when it changes
	reloadProxyManager := func() {
		if currentPM, ok := srv.Handler.(*proxy.ProxyManager); ok {
			conf, err = config.LoadConfig(*configPath)
			if err != nil {
				fmt.Printf("Warning, unable to reload configuration: %v\n", err)
				return
			}

			fmt.Println("Configuration Changed")
			currentPM.Shutdown()
			srv.Handler = proxy.New(conf)
			fmt.Println("Configuration Reloaded")

			// wait a few seconds and tell any UI to reload
			time.AfterFunc(3*time.Second, func() {
				event.Emit(proxy.ConfigFileChangedEvent{
					ReloadingState: proxy.ReloadingStateEnd,
				})
			})
		} else {
			conf, err = config.LoadConfig(*configPath)
			if err != nil {
				fmt.Printf("Error, unable to load configuration: %v\n", err)
				os.Exit(1)
			}
			srv.Handler = proxy.New(conf)
		}
	}

	// load the initial proxy manager
	reloadProxyManager()
	debouncedReload := debounce(time.Second, reloadProxyManager)
	if *watchConfig {
		defer event.On(func(e proxy.ConfigFileChangedEvent) {
			if e.ReloadingState == proxy.ReloadingStateStart {
				debouncedReload()
			}
		})()

		fmt.Println("Watching Configuration for changes")
		go func() {
			absConfigPath, err := filepath.Abs(*configPath)
			if err != nil {
				fmt.Printf("Error getting absolute path for watching config file: %v\n", err)
				return
			}
			watcher, err := fsnotify.NewWatcher()
			if err != nil {
				fmt.Printf("Error creating file watcher: %v. File watching disabled.\n", err)
				return
			}

			configDir := filepath.Dir(absConfigPath)
			err = watcher.Add(configDir)
			if err != nil {
				fmt.Printf("Error adding config path directory (%s) to watcher: %v. File watching disabled.", configDir, err)
				return
			}

			defer watcher.Close()
			for {
				select {
				case changeEvent := <-watcher.Events:
					if changeEvent.Name == absConfigPath && (changeEvent.Has(fsnotify.Write) || changeEvent.Has(fsnotify.Create) || changeEvent.Has(fsnotify.Remove)) {
						event.Emit(proxy.ConfigFileChangedEvent{
							ReloadingState: proxy.ReloadingStateStart,
						})
					} else if changeEvent.Name == filepath.Join(configDir, "..data") && changeEvent.Has(fsnotify.Create) {
						// the change for k8s configmap
						event.Emit(proxy.ConfigFileChangedEvent{
							ReloadingState: proxy.ReloadingStateStart,
						})
					}

				case err := <-watcher.Errors:
					log.Printf("File watcher error: %v", err)
				}
			}
		}()
	}

	// shutdown on signal
	go func() {
		sig := <-sigChan
		fmt.Printf("Received signal %v, shutting down...\n", sig)
		ctx, cancel := context.WithTimeout(context.Background(), time.Second*5)
		defer cancel()

		if pm, ok := srv.Handler.(*proxy.ProxyManager); ok {
			pm.Shutdown()
		} else {
			fmt.Println("srv.Handler is not of type *proxy.ProxyManager")
		}

		if err := srv.Shutdown(ctx); err != nil {
			fmt.Printf("Server shutdown error: %v\n", err)
		}
		close(exitChan)
	}()

	// Start server
	go func() {
		var err error
		if useTLS {
			fmt.Printf("llama-swap listening with TLS on https://%s\n", *listenStr)
			err = srv.ListenAndServeTLS(*certFile, *keyFile)
		} else {
			fmt.Printf("llama-swap listening on http://%s\n", *listenStr)
			err = srv.ListenAndServe()
		}
		if err != nil && err != http.ErrServerClosed {
			log.Fatalf("Fatal server error: %v\n", err)
		}
	}()

	// Wait for exit signal
	<-exitChan
}

func debounce(interval time.Duration, f func()) func() {
	var timer *time.Timer
	return func() {
		if timer != nil {
			timer.Stop()
		}
		timer = time.AfterFunc(interval, f)
	}
}


### README.md
![llama-swap header image](header2.png)
![GitHub Downloads (all assets, all releases)](https://img.shields.io/github/downloads/mostlygeek/llama-swap/total)
![GitHub Actions Workflow Status](https://img.shields.io/github/actions/workflow/status/mostlygeek/llama-swap/go-ci.yml)
![GitHub Repo stars](https://img.shields.io/github/stars/mostlygeek/llama-swap)

# llama-swap

Run multiple LLM models on your machine and hot-swap between them as needed. llama-swap works with any OpenAI API-compatible server, giving you the flexibility to switch models without restarting your applications.

Built in Go for performance and simplicity, llama-swap has zero dependencies and is incredibly easy to set up. Get started in minutes - just one binary and one configuration file.

## Features:

- ✅ Easy to deploy and configure: one binary, one configuration file. no external dependencies
- ✅ On-demand model switching
- ✅ Use any local OpenAI compatible server (llama.cpp, vllm, tabbyAPI, etc)
  - future proof, upgrade your inference servers at any time.
- ✅ OpenAI API supported endpoints:
  - `v1/completions`
  - `v1/chat/completions`
  - `v1/embeddings`
  - `v1/audio/speech` ([#36](https://github.com/mostlygeek/llama-swap/issues/36))
  - `v1/audio/transcriptions` ([docs](https://github.com/mostlygeek/llama-swap/issues/41#issuecomment-2722637867))
- ✅ llama-server (llama.cpp) supported endpoints
  - `v1/rerank`, `v1/reranking`, `/rerank`
  - `/infill` - for code infilling
  - `/completion` - for completion endpoint
- ✅ llama-swap API
  - `/ui` - web UI
  - `/upstream/:model_id` - direct access to upstream server ([demo](https://github.com/mostlygeek/llama-swap/pull/31))
  - `/models/unload` - manually unload running models ([#58](https://github.com/mostlygeek/llama-swap/issues/58))
  - `/running` - list currently running models ([#61](https://github.com/mostlygeek/llama-swap/issues/61))
  - `/log` - remote log monitoring
  - `/health` - just returns "OK"
- ✅ Customizable
  - Run multiple models at once with `Groups` ([#107](https://github.com/mostlygeek/llama-swap/issues/107))
  - Automatic unloading of models after timeout by setting a `ttl`
  - Reliable Docker and Podman support using `cmd` and `cmdStop` together
  - Preload models on startup with `hooks` ([#235](https://github.com/mostlygeek/llama-swap/pull/235))

### Web UI

llama-swap includes a real time web interface for monitoring logs and controlling models:

<img width="1164" height="745" alt="image" src="https://github.com/user-attachments/assets/bacf3f9d-819f-430b-9ed2-1bfaa8d54579" />


The Activity Page shows recent requests:

<img width="1360" height="963" alt="image" src="https://github.com/user-attachments/assets/5f3edee6-d03a-4ae5-ae06-b20ac1f135bd" />

## Installation

llama-swap can be installed in multiple ways

1. Docker
2. Homebrew (OSX and Linux)
3. WinGet
4. From release binaries
5. From source

### Docker Install ([download images](https://github.com/mostlygeek/llama-swap/pkgs/container/llama-swap))

Nightly container images with llama-swap and llama-server are built for multiple platforms (cuda, vulkan, intel, etc).

```shell
$ docker pull ghcr.io/mostlygeek/llama-swap:cuda

# run with a custom configuration and models directory
$ docker run -it --rm --runtime nvidia -p 9292:8080 \
 -v /path/to/models:/models \
 -v /path/to/custom/config.yaml:/app/config.yaml \
 ghcr.io/mostlygeek/llama-swap:cuda
```

<details>
<summary>
more examples
</summary>

```shell
# pull latest images per platform
docker pull ghcr.io/mostlygeek/llama-swap:cpu
docker pull ghcr.io/mostlygeek/llama-swap:cuda
docker pull ghcr.io/mostlygeek/llama-swap:vulkan
docker pull ghcr.io/mostlygeek/llama-swap:intel
docker pull ghcr.io/mostlygeek/llama-swap:musa

# tagged llama-swap, platform and llama-server version images
docker pull ghcr.io/mostlygeek/llama-swap:v166-cuda-b6795

```

</details>

### Homebrew Install (macOS/Linux)

```shell
brew tap mostlygeek/llama-swap
brew install llama-swap
llama-swap --config path/to/config.yaml --listen localhost:8080
```

### WinGet Install (Windows)

> [!NOTE]
> WinGet is maintained by community contributor [Dvd-Znf](https://github.com/Dvd-Znf) ([#327](https://github.com/mostlygeek/llama-swap/issues/327)). It is not an official part of llama-swap.

```shell
# install
C:\> winget install llama-swap

# upgrade
C:\> winget upgrade llama-swap
```

### Pre-built Binaries

Binaries are available on the [release](https://github.com/mostlygeek/llama-swap/releases) page for Linux, Mac, Windows and FreeBSD.

### Building from source

1. Building requires Go and Node.js (for UI).
1. `git clone https://github.com/mostlygeek/llama-swap.git`
1. `make clean all`
1. look in the `build/` subdirectory for the llama-swap binary

## Configuration

```yaml
# minimum viable config.yaml

models:
  model1:
    cmd: llama-server --port ${PORT} --model /path/to/model.gguf
```

That's all you need to get started:

1. `models` - holds all model configurations
2. `model1` - the ID used in API calls
3. `cmd` - the command to run to start the server.
4. `${PORT}` - an automatically assigned port number

Almost all configuration settings are optional and can be added one step at a time:

- Advanced features
  - `groups` to run multiple models at once
  - `hooks` to run things on startup
  - `macros` reusable snippets
- Model customization
  - `ttl` to automatically unload models
  - `aliases` to use familiar model names (e.g., "gpt-4o-mini")
  - `env` to pass custom environment variables to inference servers
  - `cmdStop` gracefully stop Docker/Podman containers
  - `useModelName` to override model names sent to upstream servers
  - `${PORT}` automatic port variables for dynamic port assignment
  - `filters` rewrite parts of requests before sending to the upstream server

See the [configuration documentation](docs/configuration.md) for all options.

## How does llama-swap work?

When a request is made to an OpenAI compatible endpoint, llama-swap will extract the `model` value and load the appropriate server configuration to serve it. If the wrong upstream server is running, it will be replaced with the correct one. This is where the "swap" part comes in. The upstream server is automatically swapped to handle the request correctly.

In the most basic configuration llama-swap handles one model at a time. For more advanced use cases, the `groups` feature allows multiple models to be loaded at the same time. You have complete control over how your system resources are used.

## Reverse Proxy Configuration (nginx)

If you deploy llama-swap behind nginx, disable response buffering for streaming endpoints. By default, nginx buffers responses which breaks Server‑Sent Events (SSE) and streaming chat completion. ([#236](https://github.com/mostlygeek/llama-swap/issues/236))

Recommended nginx configuration snippets:

```nginx
# SSE for UI events/logs
location /api/events {
    proxy_pass http://your-llama-swap-backend;
    proxy_buffering off;
    proxy_cache off;
}

# Streaming chat completions (stream=true)
location /v1/chat/completions {
    proxy_pass http://your-llama-swap-backend;
    proxy_buffering off;
    proxy_cache off;
}
```

As a safeguard, llama-swap also sets `X-Accel-Buffering: no` on SSE responses. However, explicitly disabling `proxy_buffering` at your reverse proxy is still recommended for reliable streaming behavior.

## Monitoring Logs on the CLI

```shell
# sends up to the last 10KB of logs
curl http://host/logs'

# streams combined logs
curl -Ns 'http://host/logs/stream'

# just llama-swap's logs
curl -Ns 'http://host/logs/stream/proxy'

# just upstream's logs
curl -Ns 'http://host/logs/stream/upstream'

# stream and filter logs with linux pipes
curl -Ns http://host/logs/stream | grep 'eval time'

# skips history and just streams new log entries
curl -Ns 'http://host/logs/stream?no-history'
```

## Do I need to use llama.cpp's server (llama-server)?

Any OpenAI compatible server would work. llama-swap was originally designed for llama-server and it is the best supported.

For Python based inference servers like vllm or tabbyAPI it is recommended to run them via podman or docker. This provides clean environment isolation as well as responding correctly to `SIGTERM` signals for proper shutdown.

## Star History

> [!NOTE]
> ⭐️ Star this project to help others discover it!

[![Star History Chart](https://api.star-history.com/svg?repos=mostlygeek/llama-swap&type=Date)](https://www.star-history.com/#mostlygeek/llama-swap&Date)


### CLAUDE.md
# Project: llama-swap

## Project Description:

llama-swap is a light weight, transparent proxy server that provides automatic model swapping to llama.cpp's server.

## Tech stack

- golang
- typescript, vite and react for UI (ui/)

## Testing

- `make test-dev` - Use this when making iterative changes. Runs `go test` and `staticcheck`. Fix any static checking errors. Use this only when changes are made to any code under the `proxy/` directory
- `make test-all` - runs at the end before completing work. Includes long running concurrency tests.

## Workflow Tasks

### Plan Improvements

Work plans are located in ai-plans/. Plans written by the user may be incomplete, contain inconsistencies or errors.

When the user asks to improve a plan follow these guidelines for expanding and improving it.

- Identify any inconsistencies.
- Expand plans out to be detailed specification of requirements and changes to be made.
- Plans should have at least these sections:
  - Title - very short, describes changes
  - Overview: A more detailed summary of goal and outcomes desired
  - Design Requirements: Detailed descriptions of what needs to be done
  - Testing Plan: Tests to be implemented
  - Checklist: A detailed list of changes to be made

Look for "plan expansion" as explicit instructions to improve a plan.

### Implementation of plans

When the user says "paint it", respond with "commencing automated assembly". Then implement the changes as described by the plan. Update the checklist as you complete items.

## General Rules

- when summarizing changes only include details that require further action (action items)
- when there are no action items, just say "Done."


### .gitignore
.aider*
.env
build/
dist/
.vscode
.DS_Store
.dev/


### models/README.md
TODO improve these docs

1. Download a llama-server suitable for your architecture
1. Fetch some small models for testing / swapping between
    - `huggingface-cli download bartowski/Qwen2.5-1.5B-Instruct-GGUF --include "Qwen2.5-1.5B-Instruct-Q4_K_M.gguf" --local-dir ./`
    - `huggingface-cli download bartowski/Llama-3.2-1B-Instruct-GGUF --include "Llama-3.2-1B-Instruct-Q4_K_M.gguf" --local-dir ./`
1. Create a new config.yaml file (see `config.example.yaml`) pointing to the models

### models/.gitignore
*
!.gitignore
!README.md

### ui/vite.config.ts
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), tailwindcss()],
  base: "/ui/",
  build: {
    outDir: "../proxy/ui_dist",
    assetsDir: "assets",
  },
  server: {
    proxy: {
      "/api": "http://localhost:8080", // Proxy API calls to Go backend during development
      "/logs": "http://localhost:8080",
      "/upstream": "http://localhost:8080",
      "/unload": "http://localhost:8080",
    },
  },
});


### ui/index.html
<!doctype html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <link rel="icon" type="image/png" href="/favicon-96x96.png" sizes="96x96" />
    <link rel="icon" type="image/svg+xml" href="/favicon.svg" />
    <link rel="shortcut icon" href="/favicon.ico" />
    <link rel="apple-touch-icon" sizes="180x180" href="/apple-touch-icon.png" />
    <link rel="manifest" href="/site.webmanifest" />
    <title>llama-swap</title>
  </head>
  <body >
    <div id="root"></div>
    <script type="module" src="/src/main.tsx"></script>
  </body>
</html>


### ui/README.md
# React + TypeScript + Vite

This template provides a minimal setup to get React working in Vite with HMR and some ESLint rules.

Currently, two official plugins are available:

- [@vitejs/plugin-react](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react) uses [Babel](https://babeljs.io/) for Fast Refresh
- [@vitejs/plugin-react-swc](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react-swc) uses [SWC](https://swc.rs/) for Fast Refresh

## Expanding the ESLint configuration

If you are developing a production application, we recommend updating the configuration to enable type-aware lint rules:

```js
export default tseslint.config({
  extends: [
    // Remove ...tseslint.configs.recommended and replace with this
    ...tseslint.configs.recommendedTypeChecked,
    // Alternatively, use this for stricter rules
    ...tseslint.configs.strictTypeChecked,
    // Optionally, add this for stylistic rules
    ...tseslint.configs.stylisticTypeChecked,
  ],
  languageOptions: {
    // other options...
    parserOptions: {
      project: ['./tsconfig.node.json', './tsconfig.app.json'],
      tsconfigRootDir: import.meta.dirname,
    },
  },
})
```

You can also install [eslint-plugin-react-x](https://github.com/Rel1cx/eslint-react/tree/main/packages/plugins/eslint-plugin-react-x) and [eslint-plugin-react-dom](https://github.com/Rel1cx/eslint-react/tree/main/packages/plugins/eslint-plugin-react-dom) for React-specific lint rules:

```js
// eslint.config.js
import reactX from 'eslint-plugin-react-x'
import reactDom from 'eslint-plugin-react-dom'

export default tseslint.config({
  plugins: {
    // Add the react-x and react-dom plugins
    'react-x': reactX,
    'react-dom': reactDom,
  },
  rules: {
    // other rules...
    // Enable its recommended typescript rules
    ...reactX.configs['recommended-typescript'].rules,
    ...reactDom.configs.recommended.rules,
  },
})
```


### ui/eslint.config.js
import js from '@eslint/js'
import globals from 'globals'
import reactHooks from 'eslint-plugin-react-hooks'
import reactRefresh from 'eslint-plugin-react-refresh'
import tseslint from 'typescript-eslint'

export default tseslint.config(
  { ignores: ['dist'] },
  {
    extends: [js.configs.recommended, ...tseslint.configs.recommended],
    files: ['**/*.{ts,tsx}'],
    languageOptions: {
      ecmaVersion: 2020,
      globals: globals.browser,
    },
    plugins: {
      'react-hooks': reactHooks,
      'react-refresh': reactRefresh,
    },
    rules: {
      ...reactHooks.configs.recommended.rules,
      'react-refresh/only-export-components': [
        'warn',
        { allowConstantExport: true },
      ],
    },
  },
)


### ui/.gitignore
.vite
# Logs
logs
*.log
npm-debug.log*
yarn-debug.log*
yarn-error.log*
pnpm-debug.log*
lerna-debug.log*

node_modules
dist
dist-ssr
*.local

# Editor directories and files
.vscode/*
!.vscode/extensions.json
.idea
.DS_Store
*.suo
*.ntvs*
*.njsproj
*.sln
*.sw?


### ui/src/App.css
#root {
  max-width: 1280px;
  margin: 0 auto;
  padding: 2rem;
  text-align: center;
}


### ui/src/vite-env.d.ts
/// <reference types="vite/client" />


### ui/src/main.tsx
import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import "./index.css";
import App from "./App.tsx";
import { ThemeProvider } from "./contexts/ThemeProvider";
import { APIProvider } from "./contexts/APIProvider";

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <ThemeProvider>
      <APIProvider>
        <App />
      </APIProvider>
    </ThemeProvider>
  </StrictMode>
);


### ui/src/App.tsx
import { useEffect } from "react";
import { Navigate, Route, BrowserRouter as Router, Routes } from "react-router-dom";
import { Header } from "./components/Header";
import { useAPI } from "./contexts/APIProvider";
import { useTheme } from "./contexts/ThemeProvider";
import ActivityPage from "./pages/Activity";
import LogViewerPage from "./pages/LogViewer";
import ModelPage from "./pages/Models";

function App() {
  const { setConnectionState } = useTheme();

  const { connectionStatus } = useAPI();

  // Synchronize the window.title connections state with the actual connection state
  useEffect(() => {
    setConnectionState(connectionStatus);
  }, [connectionStatus]);

  return (
    <Router basename="/ui/">
      <div className="flex flex-col h-screen">
        <Header />

        <main className="flex-1 overflow-auto p-4">
          <Routes>
            <Route path="/" element={<LogViewerPage />} />
            <Route path="/models" element={<ModelPage />} />
            <Route path="/activity" element={<ActivityPage />} />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </main>
      </div>
    </Router>
  );
}

export default App;


### ui/src/index.css
@import "tailwindcss";
@custom-variant dark (&:where([data-theme=dark], [data-theme=dark] *));

@theme {
  --color-background: rgba(252, 252, 249, 1);
  --color-surface: rgba(255, 255, 253, 1);

  /* text colors */
  --color-txtmain: rgba(19, 52, 59, 1);
  --color-txtsecondary: rgba(98, 108, 113, 1);
  --color-navlink-active: rgba(245, 245, 245, 1);

  --color-primary: rgba(50, 184, 198, 1);

  --color-primary-hover: rgba(29, 116, 128, 1);
  --color-primary-active: rgba(26, 104, 115, 1);
  --color-secondary: rgba(94, 82, 64, 0.12);
  --color-secondary-hover: rgba(94, 82, 64, 0.2);
  --color-secondary-active: rgba(94, 82, 64, 0.25);
  --color-border: rgba(94, 82, 64, 0.3);
  --color-btn-primary-text: rgba(252, 252, 249, 1);
  --color-card-border: rgba(94, 82, 64, 0.12);
  --color-card-border-inner: rgba(94, 82, 64, 0.12);
  --color-error: rgba(192, 21, 47, 1);
  --color-success: rgba(33, 128, 141, 1);
  --color-warning: rgb(244, 155, 0);
  --color-info: rgba(98, 108, 113, 1);
  --color-focus-ring: rgba(33, 128, 141, 0.4);
  --color-select-caret: rgba(19, 52, 59, 0.8);
  --color-btn-border: rgba(94, 82, 64, 0.7);
}

@layer theme {
  /* over ride theme for dark mode */
  [data-theme="dark"] {
    --color-background: rgba(31, 33, 33, 1);
    --color-surface: rgba(38, 40, 40, 1);
    /* text colors */
    --color-txtmain: rgba(245, 245, 245, 1);
    --color-txtsecondary: rgba(167, 169, 169, 0.7);

    --color-navlink-active: rgba(245, 245, 245, 1);

    --color-primary: rgba(33, 128, 141, 1);
    --color-primary-hover: rgba(45, 166, 178, 1);
    --color-primary-active: rgba(41, 150, 161, 1);
    --color-secondary: rgba(119, 124, 124, 0.15);
    --color-secondary-hover: rgba(119, 124, 124, 0.25);
    --color-secondary-active: rgba(119, 124, 124, 0.3);
    --color-border: rgba(119, 124, 124, 0.3);
    --color-error: rgba(255, 84, 89, 1);
    --color-success: rgba(50, 184, 198, 1);
    --color-warning: rgb(244, 155, 0);
    --color-info: rgba(167, 169, 169, 1);
    --color-focus-ring: rgba(50, 184, 198, 0.4);
    --color-btn-primary-text: rgba(19, 52, 59, 1);
    --color-card-border: rgba(119, 124, 124, 0.2);
    --color-card-border-inner: rgba(119, 124, 124, 0.15);
    --shadow-inset-sm: inset 0 1px 0 rgba(255, 255, 255, 0.1), inset 0 -1px 0 rgba(0, 0, 0, 0.15);
    --button-border-secondary: rgba(119, 124, 124, 0.2);
  }
}

@layer base {
  body {
    /* example of how colors using theme colors*/
    @apply bg-background text-txtmain;
  }

  h1 {
    @apply text-4xl text-txtmain font-bold pb-4;
  }
  h2 {
    @apply text-3xl text-txtmain font-bold pb-4;
  }
  h3 {
    @apply text-2xl text-txtmain font-bold pb-4;
  }
  h4 {
    @apply text-xl text-txtmain font-bold pb-4;
  }
  h5 {
    @apply text-lg text-txtmain font-bold pb-4;
  }
  h6 {
    @apply text-base text-txtmain font-bold pb-4;
  }
}

/* define CSS classes here for specific types of components */
@layer components {
  .container {
    @apply px-4;
  }

  /* Tables */
  table th {
    @apply p-2 font-semibold;
  }
  table td {
    @apply p-2;
  }

  /* Navigation Header */

  .navlink {
    @apply text-txtsecondary hover:bg-secondary hover:text-txtmain rounded-lg p-2;
  }
  .navlink.active {
    @apply bg-primary text-navlink-active;
  }

  /* Card component */
  .card {
    @apply bg-surface rounded-lg border border-card-border shadow-sm overflow-hidden p-4;
  }

  .card:hover {
    @apply shadow-md;
  }

  .card__body {
    @apply p-4;
  }

  .card__header,
  .card__footer {
    @apply p-4 border-b border-card-border-inner;
  }

  /* Status Badges */
  .status {
    @apply inline-block px-2 py-1 text-xs font-medium rounded-lg;
  }

  .status--ready {
    @apply bg-success/10 text-success;
  }

  .status--starting,
  .status--stopping {
    @apply bg-warning/10 text-warning;
  }

  .status--stopped {
    @apply bg-error/10 text-error;
  }

  /* Buttons */
  .btn {
    @apply bg-surface py-2 px-4 text-sm rounded-md border transition-colors duration-200 border-btn-border;
  }

  .btn:hover {
    cursor: pointer;
  }

  .btn--sm {
    @apply px-2 py-0.5 text-xs;
  }

  .btn:disabled {
    @apply opacity-50 cursor-not-allowed;
  }
}

@layer utilities {
  .ml-2 {
    margin-left: 0.5rem;
  }

  .my-8 {
    margin-top: 2rem;
    margin-bottom: 2rem;
  }
}


### ui/src/pages/Activity.tsx
import { useMemo } from "react";
import { useAPI } from "../contexts/APIProvider";

const formatSpeed = (speed: number): string => {
  return speed < 0 ? "unknown" : speed.toFixed(2) + " t/s";
};

const formatDuration = (ms: number): string => {
  return (ms / 1000).toFixed(2) + "s";
};

const formatRelativeTime = (timestamp: string): string => {
  const now = new Date();
  const date = new Date(timestamp);
  const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);

  // Handle future dates by returning "just now"
  if (diffInSeconds < 5) {
    return "now";
  }

  if (diffInSeconds < 60) {
    return `${diffInSeconds}s ago`;
  }

  const diffInMinutes = Math.floor(diffInSeconds / 60);
  if (diffInMinutes < 60) {
    return `${diffInMinutes}m ago`;
  }

  const diffInHours = Math.floor(diffInMinutes / 60);
  if (diffInHours < 24) {
    return `${diffInHours}h ago`;
  }

  return "a while ago";
};

const ActivityPage = () => {
  const { metrics } = useAPI();
  const sortedMetrics = useMemo(() => {
    return [...metrics].sort((a, b) => b.id - a.id);
  }, [metrics]);

  return (
    <div className="p-2">
      <h1 className="text-2xl font-bold">Activity</h1>

      {metrics.length === 0 && (
        <div className="text-center py-8">
          <p className="text-gray-600">No metrics data available</p>
        </div>
      )}
      {metrics.length > 0 && (
        <div className="card overflow-auto">
          <table className="min-w-full divide-y">
            <thead className="border-gray-200 dark:border-white/10">
              <tr className="text-left text-xs uppercase tracking-wider">
                <th className="px-6 py-3">ID</th>
                <th className="px-6 py-3">Time</th>
                <th className="px-6 py-3">Model</th>
                <th className="px-6 py-3">
                  Cached <Tooltip content="prompt tokens from cache" />
                </th>
                <th className="px-6 py-3">
                  Prompt <Tooltip content="new prompt tokens processed" />
                </th>
                <th className="px-6 py-3">Generated</th>
                <th className="px-6 py-3">Prompt Processing</th>
                <th className="px-6 py-3">Generation Speed</th>
                <th className="px-6 py-3">Duration</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {sortedMetrics.map((metric) => (
                <tr key={metric.id} className="whitespace-nowrap text-sm border-gray-200 dark:border-white/10">
                  <td className="px-4 py-4">{metric.id + 1 /* un-zero index */}</td>
                  <td className="px-6 py-4">{formatRelativeTime(metric.timestamp)}</td>
                  <td className="px-6 py-4">{metric.model}</td>
                  <td className="px-6 py-4">{metric.cache_tokens > 0 ? metric.cache_tokens.toLocaleString() : "-"}</td>
                  <td className="px-6 py-4">{metric.input_tokens.toLocaleString()}</td>
                  <td className="px-6 py-4">{metric.output_tokens.toLocaleString()}</td>
                  <td className="px-6 py-4">{formatSpeed(metric.prompt_per_second)}</td>
                  <td className="px-6 py-4">{formatSpeed(metric.tokens_per_second)}</td>
                  <td className="px-6 py-4">{formatDuration(metric.duration_ms)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

interface TooltipProps {
  content: string;
}

const Tooltip: React.FC<TooltipProps> = ({ content }) => {
  return (
    <div className="relative group inline-block">
      ⓘ
      <div
        className="absolute top-full left-1/2 transform -translate-x-1/2 mt-2
                     px-3 py-2 bg-gray-900 text-white text-sm rounded-md
                     opacity-0 group-hover:opacity-100 transition-opacity
                     duration-200 pointer-events-none whitespace-nowrap z-50 normal-case"
      >
        {content}
        <div
          className="absolute bottom-full left-1/2 transform -translate-x-1/2
                       border-4 border-transparent border-b-gray-900"
        ></div>
      </div>
    </div>
  );
};

export default ActivityPage;


### ui/src/pages/Models.tsx
import { useState, useCallback, useMemo } from "react";
import { useAPI } from "../contexts/APIProvider";
import { LogPanel } from "./LogViewer";
import { usePersistentState } from "../hooks/usePersistentState";
import { Panel, PanelGroup, PanelResizeHandle } from "react-resizable-panels";
import { useTheme } from "../contexts/ThemeProvider";
import { RiEyeFill, RiEyeOffFill, RiSwapBoxFill, RiEjectLine, RiMenuFill } from "react-icons/ri";

export default function ModelsPage() {
  const { isNarrow } = useTheme();
  const direction = isNarrow ? "vertical" : "horizontal";
  const { upstreamLogs } = useAPI();

  return (
    <PanelGroup direction={direction} className="gap-2" autoSaveId={"models-panel-group"}>
      <Panel id="models" defaultSize={50} minSize={isNarrow ? 0 : 25} maxSize={100} collapsible={isNarrow}>
        <ModelsPanel />
      </Panel>

      <PanelResizeHandle
        className={
          direction === "horizontal"
            ? "w-2 h-full bg-primary hover:bg-success transition-colors rounded"
            : "w-full h-2 bg-primary hover:bg-success transition-colors rounded"
        }
      />
      <Panel collapsible={true} defaultSize={50} minSize={0}>
        <div className="flex flex-col h-full space-y-4">
          {direction === "horizontal" && <StatsPanel />}
          <div className="flex-1 min-h-0">
            <LogPanel id="modelsupstream" title="Upstream Logs" logData={upstreamLogs} />
          </div>
        </div>
      </Panel>
    </PanelGroup>
  );
}

function ModelsPanel() {
  const { models, loadModel, unloadAllModels, unloadSingleModel } = useAPI();
  const { isNarrow } = useTheme();
  const [isUnloading, setIsUnloading] = useState(false);
  const [showUnlisted, setShowUnlisted] = usePersistentState("showUnlisted", true);
  const [showIdorName, setShowIdorName] = usePersistentState<"id" | "name">("showIdorName", "id"); // true = show ID, false = show name
  const [menuOpen, setMenuOpen] = useState(false);

  const filteredModels = useMemo(() => {
    return models.filter((model) => showUnlisted || !model.unlisted);
  }, [models, showUnlisted]);

  const handleUnloadAllModels = useCallback(async () => {
    setIsUnloading(true);
    try {
      await unloadAllModels();
    } catch (e) {
      console.error(e);
    } finally {
      setTimeout(() => {
        setIsUnloading(false);
      }, 1000);
    }
  }, [unloadAllModels]);

  const toggleIdorName = useCallback(() => {
    setShowIdorName((prev) => (prev === "name" ? "id" : "name"));
  }, [showIdorName]);

  return (
    <div className="card h-full flex flex-col">
      <div className="shrink-0">
        <div className="flex justify-between items-baseline">
          <h2 className={isNarrow ? "text-xl" : ""}>Models</h2>
          {isNarrow && (
            <div className="relative">
              <button className="btn text-base flex items-center gap-2 py-1" onClick={() => setMenuOpen(!menuOpen)}>
                <RiMenuFill size="20" />
              </button>
              {menuOpen && (
                <div className="absolute right-0 mt-2 w-48 bg-surface border border-gray-200 dark:border-white/10 rounded shadow-lg z-20">
                  <button
                    className="w-full text-left px-4 py-2 hover:bg-secondary-hover flex items-center gap-2"
                    onClick={() => {
                      toggleIdorName();
                      setMenuOpen(false);
                    }}
                  >
                    <RiSwapBoxFill size="20" /> {showIdorName === "id" ? "Show Name" : "Show ID"}
                  </button>
                  <button
                    className="w-full text-left px-4 py-2 hover:bg-secondary-hover flex items-center gap-2"
                    onClick={() => {
                      setShowUnlisted(!showUnlisted);
                      setMenuOpen(false);
                    }}
                  >
                    {showUnlisted ? <RiEyeOffFill size="20" /> : <RiEyeFill size="20" />}{" "}
                    {showUnlisted ? "Hide Unlisted" : "Show Unlisted"}
                  </button>
                  <button
                    className="w-full text-left px-4 py-2 hover:bg-secondary-hover flex items-center gap-2"
                    onClick={() => {
                      handleUnloadAllModels();
                      setMenuOpen(false);
                    }}
                    disabled={isUnloading}
                  >
                    <RiEjectLine size="24" /> {isUnloading ? "Unloading..." : "Unload All"}
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
        {!isNarrow && (
          <div className="flex justify-between">
            <div className="flex gap-2">
              <button
                className="btn text-base flex items-center gap-2"
                onClick={toggleIdorName}
                style={{ lineHeight: "1.2" }}
              >
                <RiSwapBoxFill size="20" /> {showIdorName === "id" ? "ID" : "Name"}
              </button>

              <button
                className="btn text-base flex items-center gap-2"
                onClick={() => setShowUnlisted(!showUnlisted)}
                style={{ lineHeight: "1.2" }}
              >
                {showUnlisted ? <RiEyeFill size="20" /> : <RiEyeOffFill size="20" />} unlisted
              </button>
            </div>
            <button
              className="btn text-base flex items-center gap-2"
              onClick={handleUnloadAllModels}
              disabled={isUnloading}
            >
              <RiEjectLine size="24" /> {isUnloading ? "Unloading..." : "Unload All"}
            </button>
          </div>
        )}
      </div>

      <div className="flex-1 overflow-y-auto">
        <table className="w-full">
          <thead className="sticky top-0 bg-card z-10">
            <tr className="text-left border-b border-gray-200 dark:border-white/10 bg-surface">
              <th>{showIdorName === "id" ? "Model ID" : "Name"}</th>
              <th></th>
              <th>State</th>
            </tr>
          </thead>
          <tbody>
            {filteredModels.map((model) => (
              <tr key={model.id} className="border-b hover:bg-secondary-hover border-gray-200">
                <td className={`${model.unlisted ? "text-txtsecondary" : ""}`}>
                  <a href={`/upstream/${model.id}/`} className="font-semibold" target="_blank">
                    {showIdorName === "id" ? model.id : model.name !== "" ? model.name : model.id}
                  </a>

                  {!!model.description && (
                    <p className={model.unlisted ? "text-opacity-70" : ""}>
                      <em>{model.description}</em>
                    </p>
                  )}
                </td>
                <td className="w-12">
                  {model.state === "stopped" ? (
                    <button className="btn btn--sm" onClick={() => loadModel(model.id)}>
                      Load
                    </button>
                  ) : (
                    <button
                      className="btn btn--sm"
                      onClick={() => unloadSingleModel(model.id)}
                      disabled={model.state !== "ready"}
                    >
                      Unload
                    </button>
                  )}
                </td>
                <td className="w-20">
                  <span className={`w-16 text-center status status--${model.state}`}>{model.state}</span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

interface HistogramData {
  bins: number[];
  min: number;
  max: number;
  binSize: number;
  p99: number;
  p95: number;
  p50: number;
}

function TokenHistogram({ data }: { data: HistogramData }) {
  const { bins, min, max, p50, p95, p99 } = data;
  const maxCount = Math.max(...bins);

  const height = 120;
  const padding = { top: 10, right: 15, bottom: 25, left: 45 };

  // Use viewBox for responsive sizing
  const viewBoxWidth = 600;
  const chartWidth = viewBoxWidth - padding.left - padding.right;
  const chartHeight = height - padding.top - padding.bottom;

  const barWidth = chartWidth / bins.length;
  const range = max - min;

  // Calculate x position for a given value
  const getXPosition = (value: number) => {
    return padding.left + ((value - min) / range) * chartWidth;
  };

  return (
    <div className="mt-2 w-full">
      <svg
        viewBox={`0 0 ${viewBoxWidth} ${height}`}
        className="w-full h-auto"
        preserveAspectRatio="xMidYMid meet"
      >
        {/* Y-axis */}
        <line
          x1={padding.left}
          y1={padding.top}
          x2={padding.left}
          y2={height - padding.bottom}
          stroke="currentColor"
          strokeWidth="1"
          opacity="0.3"
        />

        {/* X-axis */}
        <line
          x1={padding.left}
          y1={height - padding.bottom}
          x2={viewBoxWidth - padding.right}
          y2={height - padding.bottom}
          stroke="currentColor"
          strokeWidth="1"
          opacity="0.3"
        />

        {/* Histogram bars */}
        {bins.map((count, i) => {
          const barHeight = maxCount > 0 ? (count / maxCount) * chartHeight : 0;
          const x = padding.left + i * barWidth;
          const y = height - padding.bottom - barHeight;
          const binStart = min + i * data.binSize;
          const binEnd = binStart + data.binSize;

          return (
            <g key={i}>
              <rect
                x={x}
                y={y}
                width={Math.max(barWidth - 1, 1)}
                height={barHeight}
                fill="currentColor"
                opacity="0.6"
                className="text-blue-500 dark:text-blue-400 hover:opacity-90 transition-opacity cursor-pointer"
              />
              <title>{`${binStart.toFixed(1)} - ${binEnd.toFixed(1)} tokens/sec\nCount: ${count}`}</title>
            </g>
          );
        })}

        {/* Percentile lines */}
        <line
          x1={getXPosition(p50)}
          y1={padding.top}
          x2={getXPosition(p50)}
          y2={height - padding.bottom}
          stroke="currentColor"
          strokeWidth="2"
          strokeDasharray="4 2"
          opacity="0.7"
          className="text-gray-600 dark:text-gray-400"
        />

        <line
          x1={getXPosition(p95)}
          y1={padding.top}
          x2={getXPosition(p95)}
          y2={height - padding.bottom}
          stroke="currentColor"
          strokeWidth="2"
          strokeDasharray="4 2"
          opacity="0.7"
          className="text-orange-500 dark:text-orange-400"
        />

        <line
          x1={getXPosition(p99)}
          y1={padding.top}
          x2={getXPosition(p99)}
          y2={height - padding.bottom}
          stroke="currentColor"
          strokeWidth="2"
          strokeDasharray="4 2"
          opacity="0.7"
          className="text-green-500 dark:text-green-400"
        />

        {/* X-axis labels */}
        <text
          x={padding.left}
          y={height - 5}
          fontSize="10"
          fill="currentColor"
          opacity="0.6"
          textAnchor="start"
        >
          {min.toFixed(1)}
        </text>

        <text
          x={viewBoxWidth - padding.right}
          y={height - 5}
          fontSize="10"
          fill="currentColor"
          opacity="0.6"
          textAnchor="end"
        >
          {max.toFixed(1)}
        </text>

        {/* X-axis label */}
        <text
          x={padding.left + chartWidth / 2}
          y={height - 2}
          fontSize="10"
          fill="currentColor"
          opacity="0.6"
          textAnchor="middle"
        >
          Tokens/Second Distribution
        </text>
      </svg>
    </div>
  );
}

function StatsPanel() {
  const { metrics } = useAPI();

  const [totalRequests, totalInputTokens, totalOutputTokens, tokenStats, histogramData] = useMemo(() => {
    const totalRequests = metrics.length;
    if (totalRequests === 0) {
      return [0, 0, 0, { p99: 0, p95: 0, p50: 0 }, null];
    }
    const totalInputTokens = metrics.reduce((sum, m) => sum + m.input_tokens, 0);
    const totalOutputTokens = metrics.reduce((sum, m) => sum + m.output_tokens, 0);

    // Calculate token statistics using output_tokens and duration_ms
    // Filter out metrics with invalid duration or output tokens
    const validMetrics = metrics.filter((m) => m.duration_ms > 0 && m.output_tokens > 0);
    if (validMetrics.length === 0) {
      return [totalRequests, totalInputTokens, totalOutputTokens, { p99: 0, p95: 0, p50: 0 }, null];
    }

    // Calculate tokens/second for each valid metric
    const tokensPerSecond = validMetrics.map((m) => m.output_tokens / (m.duration_ms / 1000));

    // Sort for percentile calculation
    const sortedTokensPerSecond = [...tokensPerSecond].sort((a, b) => a - b);

    // Calculate percentiles - showing speed thresholds where X% of requests are SLOWER (below)
    // P99: 99% of requests are slower than this speed (99th percentile - fast requests)
    // P95: 95% of requests are slower than this speed (95th percentile)
    // P50: 50% of requests are slower than this speed (median)
    const p99 = sortedTokensPerSecond[Math.floor(sortedTokensPerSecond.length * 0.99)];
    const p95 = sortedTokensPerSecond[Math.floor(sortedTokensPerSecond.length * 0.95)];
    const p50 = sortedTokensPerSecond[Math.floor(sortedTokensPerSecond.length * 0.5)];

    // Create histogram data
    const min = Math.min(...tokensPerSecond);
    const max = Math.max(...tokensPerSecond);
    const binCount = Math.min(30, Math.max(10, Math.floor(tokensPerSecond.length / 5))); // Adaptive bin count
    const binSize = (max - min) / binCount;

    const bins = Array(binCount).fill(0);
    tokensPerSecond.forEach((value) => {
      const binIndex = Math.min(Math.floor((value - min) / binSize), binCount - 1);
      bins[binIndex]++;
    });

    const histogramData = {
      bins,
      min,
      max,
      binSize,
      p99,
      p95,
      p50,
    };

    return [
      totalRequests,
      totalInputTokens,
      totalOutputTokens,
      {
        p99: p99.toFixed(2),
        p95: p95.toFixed(2),
        p50: p50.toFixed(2),
      },
      histogramData,
    ];
  }, [metrics]);

  const nf = new Intl.NumberFormat();

  return (
    <div className="card">
      <div className="rounded-lg overflow-hidden border border-card-border-inner">
        <table className="min-w-full divide-y divide-card-border-inner">
          <thead className="bg-secondary">
            <tr>
              <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-txtmain">
                Requests
              </th>
              <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-txtmain border-l border-card-border-inner">
                Processed
              </th>
              <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-txtmain border-l border-card-border-inner">
                Generated
              </th>
              <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-txtmain border-l border-card-border-inner">
                Token Stats (tokens/sec)
              </th>
            </tr>
          </thead>

          <tbody className="bg-surface divide-y divide-card-border-inner">
            <tr className="hover:bg-secondary">
              <td className="px-4 py-4 text-sm font-semibold text-gray-900 dark:text-white">{totalRequests}</td>

              <td className="px-4 py-4 text-sm text-gray-700 dark:text-gray-300 border-l border-gray-200 dark:border-white/10">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-medium">{nf.format(totalInputTokens)}</span>
                  <span className="text-xs text-gray-500 dark:text-gray-400">tokens</span>
                </div>
              </td>

              <td className="px-4 py-4 text-sm text-gray-700 dark:text-gray-300 border-l border-gray-200 dark:border-white/10">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-medium">{nf.format(totalOutputTokens)}</span>
                  <span className="text-xs text-gray-500 dark:text-gray-400">tokens</span>
                </div>
              </td>

              <td className="px-4 py-4 border-l border-gray-200 dark:border-white/10">
                <div className="space-y-3">
                  <div className="grid grid-cols-3 gap-2 items-center">
                    <div className="text-center">
                      <div className="text-xs text-gray-500 dark:text-gray-400">P50</div>
                      <div className="mt-1 inline-block rounded-full bg-gray-100 dark:bg-white/5 px-3 py-1 text-sm font-semibold text-gray-800 dark:text-white">
                        {tokenStats.p50}
                      </div>
                    </div>

                    <div className="text-center">
                      <div className="text-xs text-gray-500 dark:text-gray-400">P95</div>
                      <div className="mt-1 inline-block rounded-full bg-gray-100 dark:bg-white/5 px-3 py-1 text-sm font-semibold text-gray-800 dark:text-white">
                        {tokenStats.p95}
                      </div>
                    </div>

                    <div className="text-center">
                      <div className="text-xs text-gray-500 dark:text-gray-400">P99</div>
                      <div className="mt-1 inline-block rounded-full bg-gray-100 dark:bg-white/5 px-3 py-1 text-sm font-semibold text-gray-800 dark:text-white">
                        {tokenStats.p99}
                      </div>
                    </div>
                  </div>
                  {histogramData && <TokenHistogram data={histogramData} />}
                </div>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  );
}


### ui/src/pages/LogViewer.tsx
import { useState, useEffect, useRef, useMemo, useCallback } from "react";
import { useAPI } from "../contexts/APIProvider";
import { usePersistentState } from "../hooks/usePersistentState";
import { Panel, PanelGroup, PanelResizeHandle } from "react-resizable-panels";
import {
  RiTextWrap,
  RiAlignJustify,
  RiFontSize,
  RiMenuSearchLine,
  RiMenuSearchFill,
  RiCloseCircleFill,
} from "react-icons/ri";
import { useTheme } from "../contexts/ThemeProvider";

const LogViewer = () => {
  const { proxyLogs, upstreamLogs } = useAPI();
  const { screenWidth } = useTheme();
  const direction = screenWidth === "xs" || screenWidth === "sm" ? "vertical" : "horizontal";

  return (
    <PanelGroup direction={direction} className="gap-2" autoSaveId="logviewer-panel-group">
      <Panel id="proxy" defaultSize={50} minSize={5} maxSize={100} collapsible={true}>
        <LogPanel id="proxy" title="Proxy Logs" logData={proxyLogs} />
      </Panel>
      <PanelResizeHandle
        className={
          direction === "horizontal"
            ? "w-2 h-full bg-primary hover:bg-success transition-colors rounded"
            : "w-full h-2 bg-primary hover:bg-success transition-colors rounded"
        }
      />
      <Panel id="upstream" defaultSize={50} minSize={5} maxSize={100} collapsible={true}>
        <LogPanel id="upstream" title="Upstream Logs" logData={upstreamLogs} />
      </Panel>
    </PanelGroup>
  );
};

interface LogPanelProps {
  id: string;
  title: string;
  logData: string;
}
export const LogPanel = ({ id, title, logData }: LogPanelProps) => {
  const [filterRegex, setFilterRegex] = useState("");
  const [fontSize, setFontSize] = usePersistentState<"xxs" | "xs" | "small" | "normal">(
    `logPanel-${id}-fontSize`,
    "normal"
  );
  const [wrapText, setTextWrap] = usePersistentState(`logPanel-${id}-wrapText`, false);
  const [showFilter, setShowFilter] = usePersistentState(`logPanel-${id}-showFilter`, false);

  const textWrapClass = useMemo(() => {
    return wrapText ? "whitespace-pre-wrap" : "whitespace-pre";
  }, [wrapText]);

  const toggleFontSize = useCallback(() => {
    setFontSize((prev) => {
      switch (prev) {
        case "xxs":
          return "xs";
        case "xs":
          return "small";
        case "small":
          return "normal";
        case "normal":
          return "xxs";
      }
    });
  }, []);

  const toggleWrapText = useCallback(() => {
    setTextWrap((prev) => !prev);
  }, []);

  const toggleFilter = useCallback(() => {
    if (showFilter) {
      setShowFilter(false);
      setFilterRegex(""); // Clear filter when closing
    } else {
      setShowFilter(true);
    }
  }, [filterRegex, setFilterRegex, showFilter]);

  const fontSizeClass = useMemo(() => {
    switch (fontSize) {
      case "xxs":
        return "text-[0.5rem]"; // 0.5rem (8px)
      case "xs":
        return "text-[0.75rem]"; // 0.75rem (12px)
      case "small":
        return "text-[0.875rem]"; // 0.875rem (14px)
      case "normal":
        return "text-base"; // 1rem (16px)
    }
  }, [fontSize]);

  const filteredLogs = useMemo(() => {
    if (!filterRegex) return logData;
    try {
      const regex = new RegExp(filterRegex, "i");
      const lines = logData.split("\n");
      const filtered = lines.filter((line) => regex.test(line));
      return filtered.join("\n");
    } catch (e) {
      return logData; // Return unfiltered if regex is invalid
    }
  }, [logData, filterRegex]);

  // auto scroll to bottom
  const preTagRef = useRef<HTMLPreElement>(null);
  useEffect(() => {
    if (!preTagRef.current) return;
    preTagRef.current.scrollTop = preTagRef.current.scrollHeight;
  }, [filteredLogs]);

  return (
    <div className="rounded-lg overflow-hidden flex flex-col bg-gray-950/5 dark:bg-white/10 h-full p-1">
      <div className="p-4">
        <div className="flex items-center justify-between">
          <h3 className="m-0 text-lg p-0">{title}</h3>

          <div className="flex gap-2 items-center">
            <button className="btn border-0" onClick={toggleFontSize}>
              <RiFontSize />
            </button>
            <button className="btn border-0" onClick={toggleWrapText}>
              {wrapText ? <RiTextWrap /> : <RiAlignJustify />}
            </button>
            <button className="btn border-0" onClick={toggleFilter}>
              {showFilter ? <RiMenuSearchFill /> : <RiMenuSearchLine />}
            </button>
          </div>
        </div>

        {/* Filtering Options - Full width on mobile, normal on desktop */}
        {showFilter && (
          <div className="mt-2 w-full">
            <div className="flex gap-2 items-center w-full">
              <input
                type="text"
                className="w-full text-sm border border-gray-950/10 dark:border-white/5 p-2 rounded outline-none"
                placeholder="Filter logs..."
                value={filterRegex}
                onChange={(e) => setFilterRegex(e.target.value)}
              />
              <button className="pl-2" onClick={() => setFilterRegex("")}>
                <RiCloseCircleFill size="24" />
              </button>
            </div>
          </div>
        )}
      </div>
      <div className="rounded-lg bg-background font-mono text-sm flex-1 overflow-hidden">
        <pre ref={preTagRef} className={`${textWrapClass} ${fontSizeClass} h-full overflow-auto p-4`}>
          {filteredLogs}
        </pre>
      </div>
    </div>
  );
};
export default LogViewer;


### ui/src/components/ConnectionStatus.tsx
import { useAPI } from "../contexts/APIProvider";
import { useMemo } from "react";

const ConnectionStatusIcon = () => {
  const { connectionStatus } = useAPI();

  const eventStatusColor = useMemo(() => {
    switch (connectionStatus) {
      case "connected":
        return "bg-emerald-500";
      case "connecting":
        return "bg-amber-500";
      case "disconnected":
      default:
        return "bg-red-500";
    }
  }, [connectionStatus]);

  return (
    <div className="flex items-center" title={`event stream: ${connectionStatus}`}>
      <span className={`inline-block w-3 h-3 rounded-full ${eventStatusColor} mr-2`}></span>
    </div>
  );
};

export default ConnectionStatusIcon;


### ui/src/components/Header.tsx
import { useCallback } from "react";
import { RiMoonFill, RiSunFill } from "react-icons/ri";
import { NavLink, type NavLinkRenderProps } from "react-router-dom";
import { useTheme } from "../contexts/ThemeProvider";
import ConnectionStatusIcon from "./ConnectionStatus";

export function Header() {
  const { screenWidth, toggleTheme, isDarkMode, appTitle, setAppTitle, isNarrow } = useTheme();
  const handleTitleChange = useCallback(
    (newTitle: string) => {
      setAppTitle(newTitle.replace(/\n/g, "").trim().substring(0, 64) || "llama-swap");
    },
    [setAppTitle]
  );

  const navLinkClass = ({ isActive }: NavLinkRenderProps) =>
    `text-gray-600 hover:text-black dark:text-gray-300 dark:hover:text-gray-100 p-1 ${isActive ? "font-semibold" : ""}`;

  return (
    <header className={`flex items-center justify-between bg-surface border-b border-border px-4 ${isNarrow ? "py-1 h-[60px]" : "p-2 h-[75px]"}`}>
      {screenWidth !== "xs" && screenWidth !== "sm" && (
        <h1
          contentEditable
          suppressContentEditableWarning
          className="p-0 outline-none hover:bg-gray-100 dark:hover:bg-gray-700 rounded"
          onBlur={(e) => handleTitleChange(e.currentTarget.textContent || "(set title)")}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              e.preventDefault();
              handleTitleChange(e.currentTarget.textContent || "(set title)");
              e.currentTarget.blur();
            }
          }}
        >
          {appTitle}
        </h1>
      )}

      <menu className="flex items-center gap-4">
        <NavLink to="/" className={navLinkClass} type="button">
          Logs
        </NavLink>
        <NavLink to="/models" className={navLinkClass} type="button">
          Models
        </NavLink>
        <NavLink to="/activity" className={navLinkClass} type="button">
          Activity
        </NavLink>
        <button className="" onClick={toggleTheme}>
          {isDarkMode ? <RiMoonFill /> : <RiSunFill />}
        </button>
        <ConnectionStatusIcon />
      </menu>
    </header>
  );
}


### ui/src/contexts/APIProvider.tsx
import { createContext, useState, useContext, useEffect, useCallback, useMemo, type ReactNode } from "react";
import type { ConnectionState } from "../lib/types";

type ModelStatus = "ready" | "starting" | "stopping" | "stopped" | "shutdown" | "unknown";
const LOG_LENGTH_LIMIT = 1024 * 100; /* 100KB of log data */

export interface Model {
  id: string;
  state: ModelStatus;
  name: string;
  description: string;
  unlisted: boolean;
}

interface APIProviderType {
  models: Model[];
  listModels: () => Promise<Model[]>;
  unloadAllModels: () => Promise<void>;
  unloadSingleModel: (model: string) => Promise<void>;
  loadModel: (model: string) => Promise<void>;
  enableAPIEvents: (enabled: boolean) => void;
  proxyLogs: string;
  upstreamLogs: string;
  metrics: Metrics[];
  connectionStatus: ConnectionState;
}

interface Metrics {
  id: number;
  timestamp: string;
  model: string;
  cache_tokens: number;
  input_tokens: number;
  output_tokens: number;
  prompt_per_second: number;
  tokens_per_second: number;
  duration_ms: number;
}

interface LogData {
  source: "upstream" | "proxy";
  data: string;
}
interface APIEventEnvelope {
  type: "modelStatus" | "logData" | "metrics";
  data: string;
}

const APIContext = createContext<APIProviderType | undefined>(undefined);
type APIProviderProps = {
  children: ReactNode;
  autoStartAPIEvents?: boolean;
};

let apiEventSource: EventSource | null = null;

export function APIProvider({ children, autoStartAPIEvents = true }: APIProviderProps) {
  const [proxyLogs, setProxyLogs] = useState("");
  const [upstreamLogs, setUpstreamLogs] = useState("");
  const [metrics, setMetrics] = useState<Metrics[]>([]);
  const [connectionStatus, setConnectionState] = useState<ConnectionState>("disconnected");
  //const apiEventSource = useRef<EventSource | null>(null);

  const [models, setModels] = useState<Model[]>([]);

  const appendLog = useCallback((newData: string, setter: React.Dispatch<React.SetStateAction<string>>) => {
    setter((prev) => {
      const updatedLog = prev + newData;
      return updatedLog.length > LOG_LENGTH_LIMIT ? updatedLog.slice(-LOG_LENGTH_LIMIT) : updatedLog;
    });
  }, []);

  const enableAPIEvents = useCallback((enabled: boolean) => {
    if (!enabled) {
      apiEventSource?.close();
      apiEventSource = null;
      setMetrics([]);
      return;
    }

    let retryCount = 0;
    const initialDelay = 1000; // 1 second

    const connect = () => {
      apiEventSource?.close();
      apiEventSource = new EventSource("/api/events");

      setConnectionState("connecting");

      apiEventSource.onopen = () => {
        // clear everything out on connect to keep things in sync
        setProxyLogs("");
        setUpstreamLogs("");
        setMetrics([]); // clear metrics on reconnect
        setModels([]); // clear models on reconnect
        retryCount = 0;
        setConnectionState("connected");
      };

      apiEventSource.onmessage = (e: MessageEvent) => {
        try {
          const message = JSON.parse(e.data) as APIEventEnvelope;
          switch (message.type) {
            case "modelStatus":
              {
                const models = JSON.parse(message.data) as Model[];

                // sort models by name and id
                models.sort((a, b) => {
                  return (a.name + a.id).localeCompare(b.name + b.id);
                });

                setModels(models);
              }
              break;

            case "logData":
              const logData = JSON.parse(message.data) as LogData;
              switch (logData.source) {
                case "proxy":
                  appendLog(logData.data, setProxyLogs);
                  break;
                case "upstream":
                  appendLog(logData.data, setUpstreamLogs);
                  break;
              }
              break;

            case "metrics":
              {
                const newMetrics = JSON.parse(message.data) as Metrics[];
                setMetrics((prevMetrics) => {
                  return [...newMetrics, ...prevMetrics];
                });
              }
              break;
          }
        } catch (err) {
          console.error(e.data, err);
        }
      };

      apiEventSource.onerror = () => {
        apiEventSource?.close();
        retryCount++;
        const delay = Math.min(initialDelay * Math.pow(2, retryCount - 1), 5000);
        setConnectionState("disconnected");
        setTimeout(connect, delay);
      };
    };

    connect();
  }, []);

  useEffect(() => {
    if (autoStartAPIEvents) {
      enableAPIEvents(true);
    }

    return () => {
      enableAPIEvents(false);
    };
  }, [enableAPIEvents, autoStartAPIEvents]);

  const listModels = useCallback(async (): Promise<Model[]> => {
    try {
      const response = await fetch("/api/models/");
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      const data = await response.json();
      return data || [];
    } catch (error) {
      console.error("Failed to fetch models:", error);
      return []; // Return empty array as fallback
    }
  }, []);

  const unloadAllModels = useCallback(async () => {
    try {
      const response = await fetch(`/api/models/unload`, {
        method: "POST",
      });
      if (!response.ok) {
        throw new Error(`Failed to unload models: ${response.status}`);
      }
    } catch (error) {
      console.error("Failed to unload models:", error);
      throw error; // Re-throw to let calling code handle it
    }
  }, []);

  const unloadSingleModel = useCallback(async (model: string) => {
    try {
      const response = await fetch(`/api/models/unload/${model}`, {
        method: "POST",
      });
      if (!response.ok) {
        throw new Error(`Failed to unload model: ${response.status}`);
      }
    } catch (error) {
      console.error("Failed to unload model", model, error);
      throw error;
    }
  }, []);

  const loadModel = useCallback(async (model: string) => {
    try {
      const response = await fetch(`/upstream/${model}/`, {
        method: "GET",
      });
      if (!response.ok) {
        throw new Error(`Failed to load model: ${response.status}`);
      }
    } catch (error) {
      console.error("Failed to load model:", error);
      throw error; // Re-throw to let calling code handle it
    }
  }, []);

  const value = useMemo(
    () => ({
      models,
      listModels,
      unloadAllModels,
      unloadSingleModel,
      loadModel,
      enableAPIEvents,
      proxyLogs,
      upstreamLogs,
      metrics,
      connectionStatus,
    }),
    [models, listModels, unloadAllModels, loadModel, enableAPIEvents, proxyLogs, upstreamLogs, metrics]
  );

  return <APIContext.Provider value={value}>{children}</APIContext.Provider>;
}

export function useAPI() {
  const context = useContext(APIContext);
  if (context === undefined) {
    throw new Error("useAPI must be used within an APIProvider");
  }
  return context;
}


### ui/src/contexts/ThemeProvider.tsx
import { createContext, useContext, useEffect, type ReactNode, useMemo, useState } from "react";
import { usePersistentState } from "../hooks/usePersistentState";
import type { ConnectionState } from "../lib/types";

type ScreenWidth = "xs" | "sm" | "md" | "lg" | "xl" | "2xl";
type ThemeContextType = {
  isDarkMode: boolean;
  screenWidth: ScreenWidth;
  isNarrow: boolean;
  toggleTheme: () => void;

  // for managing the window title and connection state information
  appTitle: string;
  setAppTitle: (title: string) => void;
  setConnectionState: (state: ConnectionState) => void;
};

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

type ThemeProviderProps = {
  children: ReactNode;
};

export function ThemeProvider({ children }: ThemeProviderProps) {
  const [appTitle, setAppTitle] = usePersistentState("app-title", "llama-swap");
  const [connectionState, setConnectionState] = useState<ConnectionState>("disconnected");

  /**
   * Set the document.title with informative information
   */
  useEffect(() => {
    const connectionIcon = connectionState === "connecting" ? "🟡" : connectionState === "connected" ? "🟢" : "🔴";
    document.title = connectionIcon + " " + appTitle; // Set initial title
  }, [appTitle, connectionState]);

  const [isDarkMode, setIsDarkMode] = usePersistentState<boolean>("theme", false);
  const [screenWidth, setScreenWidth] = useState<ScreenWidth>("md"); // Default to md

  // matches tailwind classes
  // https://tailwindcss.com/docs/responsive-design
  useEffect(() => {
    const checkInnerWidth = () => {
      const innerWidth = window.innerWidth;
      if (innerWidth < 640) {
        setScreenWidth("xs");
      } else if (innerWidth < 768) {
        setScreenWidth("sm");
      } else if (innerWidth < 1024) {
        setScreenWidth("md");
      } else if (innerWidth < 1280) {
        setScreenWidth("lg");
      } else if (innerWidth < 1536) {
        setScreenWidth("xl");
      } else {
        setScreenWidth("2xl");
      }
    };

    checkInnerWidth();
    window.addEventListener("resize", checkInnerWidth);

    return () => window.removeEventListener("resize", checkInnerWidth);
  }, []);

  useEffect(() => {
    document.documentElement.setAttribute("data-theme", isDarkMode ? "dark" : "light");
  }, [isDarkMode]);

  const toggleTheme = () => setIsDarkMode((prev) => !prev);
  const isNarrow = useMemo(() => {
    return screenWidth === "xs" || screenWidth === "sm" || screenWidth === "md";
  }, [screenWidth]);

  return (
    <ThemeContext.Provider
      value={{
        isDarkMode,
        toggleTheme,
        screenWidth,
        isNarrow,
        appTitle,
        setAppTitle,
        setConnectionState,
      }}
    >
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme(): ThemeContextType {
  const context = useContext(ThemeContext);
  if (context === undefined) {
    throw new Error("useTheme must be used within a ThemeProvider");
  }
  return context;
}


### ui/src/lib/types.ts
export type ConnectionState = "connected" | "connecting" | "disconnected";


### ui/src/hooks/usePersistentState.ts
import { useState, useEffect, useCallback } from "react";

export function usePersistentState<T>(key: string, initialValue: T): [T, (value: T | ((prevState: T) => T)) => void] {
  const [state, setState] = useState<T>(() => {
    if (typeof window === "undefined") return initialValue;
    try {
      const saved = localStorage.getItem(key);
      return saved !== null ? JSON.parse(saved) : initialValue;
    } catch (e) {
      console.error(`Error parsing stored value for ${key}`, e);
      return initialValue;
    }
  });

  const setPersistentState = useCallback(
    (value: T | ((prevState: T) => T)) => {
      setState((prev) => {
        const nextValue = typeof value === "function" ? (value as (prevState: T) => T)(prev) : value;
        try {
          localStorage.setItem(key, JSON.stringify(nextValue));
        } catch (e) {
          console.error(`Error saving value for ${key}`, e);
        }
        return nextValue;
      });
    },
    [key]
  );

  useEffect(() => {
    try {
      localStorage.setItem(key, JSON.stringify(state));
    } catch (e) {
      console.error(`Error saving value for ${key}`, e);
    }
  }, [key, state]);

  return [state, setPersistentState];
}


### event/event.go
// Copyright (c) Roman Atachiants and contributors. All rights reserved.
// Licensed under the MIT license. See LICENSE file in the project root for details.

package event

import (
	"context"
	"fmt"
	"reflect"
	"sort"
	"strings"
	"sync"
	"sync/atomic"
)

// Event represents an event contract
type Event interface {
	Type() uint32
}

// registry holds an immutable sorted array of event mappings
type registry struct {
	keys []uint32 // Event types (sorted)
	grps []any    // Corresponding subscribers
}

// ------------------------------------- Dispatcher -------------------------------------

// Dispatcher represents an event dispatcher.
type Dispatcher struct {
	subs     atomic.Pointer[registry] // Atomic pointer to immutable array
	done     chan struct{}            // Cancellation
	maxQueue int                      // Maximum queue size per consumer
	mu       sync.Mutex               // Only for writes (subscribe/unsubscribe)
}

// NewDispatcher creates a new dispatcher of events.
func NewDispatcher() *Dispatcher {
	return NewDispatcherConfig(50000)
}

// NewDispatcherConfig creates a new dispatcher with configurable max queue size
func NewDispatcherConfig(maxQueue int) *Dispatcher {
	d := &Dispatcher{
		done:     make(chan struct{}),
		maxQueue: maxQueue,
	}

	d.subs.Store(&registry{
		keys: make([]uint32, 0, 16),
		grps: make([]any, 0, 16),
	})
	return d
}

// Close closes the dispatcher
func (d *Dispatcher) Close() error {
	close(d.done)
	return nil
}

// isClosed returns whether the dispatcher is closed or not
func (d *Dispatcher) isClosed() bool {
	select {
	case <-d.done:
		return true
	default:
		return false
	}
}

// findGroup performs a lock-free binary search for the event type
func (d *Dispatcher) findGroup(eventType uint32) any {
	reg := d.subs.Load()
	keys := reg.keys

	// Inlined binary search for better cache locality
	left, right := 0, len(keys)
	for left < right {
		mid := left + (right-left)/2
		if keys[mid] < eventType {
			left = mid + 1
		} else {
			right = mid
		}
	}

	if left < len(keys) && keys[left] == eventType {
		return reg.grps[left]
	}
	return nil
}

// Subscribe subscribes to an event, the type of the event will be automatically
// inferred from the provided type. Must be constant for this to work.
func Subscribe[T Event](broker *Dispatcher, handler func(T)) context.CancelFunc {
	var event T
	return SubscribeTo(broker, event.Type(), handler)
}

// SubscribeTo subscribes to an event with the specified event type.
func SubscribeTo[T Event](broker *Dispatcher, eventType uint32, handler func(T)) context.CancelFunc {
	if broker.isClosed() {
		panic(errClosed)
	}

	broker.mu.Lock()
	defer broker.mu.Unlock()

	// Check if group already exists
	if existing := broker.findGroup(eventType); existing != nil {
		grp := groupOf[T](eventType, existing)
		sub := grp.Add(handler)
		return func() {
			grp.Del(sub)
		}
	}

	// Create new group
	grp := &group[T]{cond: sync.NewCond(new(sync.Mutex)), maxQueue: broker.maxQueue}
	sub := grp.Add(handler)

	// Copy-on-write: insert new entry in sorted position
	old := broker.subs.Load()
	idx := sort.Search(len(old.keys), func(i int) bool {
		return old.keys[i] >= eventType
	})

	// Create new arrays with space for one more element
	newKeys := make([]uint32, len(old.keys)+1)
	newGrps := make([]any, len(old.grps)+1)

	// Copy elements before insertion point
	copy(newKeys[:idx], old.keys[:idx])
	copy(newGrps[:idx], old.grps[:idx])

	// Insert new element
	newKeys[idx] = eventType
	newGrps[idx] = grp

	// Copy elements after insertion point
	copy(newKeys[idx+1:], old.keys[idx:])
	copy(newGrps[idx+1:], old.grps[idx:])

	// Atomically store the new registry (mutex ensures no concurrent writers)
	newReg := &registry{keys: newKeys, grps: newGrps}
	broker.subs.Store(newReg)

	return func() {
		grp.Del(sub)
	}
}

// Publish writes an event into the dispatcher
func Publish[T Event](broker *Dispatcher, ev T) {
	eventType := ev.Type()
	if sub := broker.findGroup(eventType); sub != nil {
		group := groupOf[T](eventType, sub)
		group.Broadcast(ev)
	}
}

// Count counts the number of subscribers, this is for testing only.
func (d *Dispatcher) count(eventType uint32) int {
	if group := d.findGroup(eventType); group != nil {
		return group.(interface{ Count() int }).Count()
	}
	return 0
}

// groupOf casts the subscriber group to the specified generic type
func groupOf[T Event](eventType uint32, subs any) *group[T] {
	if group, ok := subs.(*group[T]); ok {
		return group
	}

	panic(errConflict[T](eventType, subs))
}

// ------------------------------------- Subscriber -------------------------------------

// consumer represents a consumer with a message queue
type consumer[T Event] struct {
	queue []T  // Current work queue
	stop  bool // Stop signal
}

// Listen listens to the event queue and processes events
func (s *consumer[T]) Listen(c *sync.Cond, fn func(T)) {
	pending := make([]T, 0, 128)

	for {
		c.L.Lock()
		for len(s.queue) == 0 {
			switch {
			case s.stop:
				c.L.Unlock()
				return
			default:
				c.Wait()
			}
		}

		// Swap buffers and reset the current queue
		temp := s.queue
		s.queue = pending[:0]
		pending = temp
		c.L.Unlock()

		// Outside of the critical section, process the work
		for _, event := range pending {
			fn(event)
		}

		// Notify potential publishers waiting due to backpressure
		c.Broadcast()
	}
}

// ------------------------------------- Subscriber Group -------------------------------------

// group represents a consumer group
type group[T Event] struct {
	cond     *sync.Cond
	subs     []*consumer[T]
	maxQueue int // Maximum queue size per consumer
	maxLen   int // Current maximum queue length across all consumers
}

// Broadcast sends an event to all consumers
func (s *group[T]) Broadcast(ev T) {
	s.cond.L.Lock()
	defer s.cond.L.Unlock()

	// Calculate current maximum queue length
	s.maxLen = 0
	for _, sub := range s.subs {
		if len(sub.queue) > s.maxLen {
			s.maxLen = len(sub.queue)
		}
	}

	// Backpressure: wait if queues are full
	for s.maxLen >= s.maxQueue {
		s.cond.Wait()

		// Recalculate after wakeup
		s.maxLen = 0
		for _, sub := range s.subs {
			if len(sub.queue) > s.maxLen {
				s.maxLen = len(sub.queue)
			}
		}
	}

	// Add event to all queues and track new maximum
	newMax := 0
	for _, sub := range s.subs {
		sub.queue = append(sub.queue, ev)
		if len(sub.queue) > newMax {
			newMax = len(sub.queue)
		}
	}
	s.maxLen = newMax
	s.cond.Broadcast() // Wake consumers
}

// Add adds a subscriber to the list
func (s *group[T]) Add(handler func(T)) *consumer[T] {
	sub := &consumer[T]{
		queue: make([]T, 0, 64),
	}

	// Add the consumer to the list of active consumers
	s.cond.L.Lock()
	s.subs = append(s.subs, sub)
	s.cond.L.Unlock()

	// Start listening
	go sub.Listen(s.cond, handler)
	return sub
}

// Del removes a subscriber from the list
func (s *group[T]) Del(sub *consumer[T]) {
	s.cond.L.Lock()
	defer s.cond.L.Unlock()

	// Search and remove the subscriber
	sub.stop = true
	for i, v := range s.subs {
		if v == sub {
			copy(s.subs[i:], s.subs[i+1:])
			s.subs = s.subs[:len(s.subs)-1]
			break
		}
	}
}

// ------------------------------------- Debugging -------------------------------------

var errClosed = fmt.Errorf("event dispatcher is closed")

// Count returns the number of subscribers in this group
func (s *group[T]) Count() int {
	return len(s.subs)
}

// String returns string representation of the type
func (s *group[T]) String() string {
	typ := reflect.TypeOf(s).String()
	idx := strings.LastIndex(typ, "/")
	typ = typ[idx+1 : len(typ)-1]
	return typ
}

// errConflict returns a conflict message
func errConflict[T any](eventType uint32, existing any) string {
	var want T
	return fmt.Sprintf(
		"conflicting event type, want=<%T>, registered=<%s>, event=0x%v",
		want, existing, eventType,
	)
}


### event/event_test.go
// Copyright (c) Roman Atachiants and contributore. All rights reserved.
// Licensed under the MIT license. See LICENSE file in the project root for detaile.

package event

import (
	"fmt"
	"sync"
	"sync/atomic"
	"testing"
	"time"

	"github.com/stretchr/testify/assert"
)

func TestPublish(t *testing.T) {
	d := NewDispatcher()
	var wg sync.WaitGroup

	// Subscribe, must be received in order
	var count int64
	defer Subscribe(d, func(ev MyEvent1) {
		assert.Equal(t, int(atomic.AddInt64(&count, 1)), ev.Number)
		wg.Done()
	})()

	// Publish
	wg.Add(3)
	Publish(d, MyEvent1{Number: 1})
	Publish(d, MyEvent1{Number: 2})
	Publish(d, MyEvent1{Number: 3})

	// Wait and check
	wg.Wait()
	assert.Equal(t, int64(3), count)
}

func TestUnsubscribe(t *testing.T) {
	d := NewDispatcher()
	assert.Equal(t, 0, d.count(TypeEvent1))
	unsubscribe := Subscribe(d, func(ev MyEvent1) {
		// Nothing
	})

	assert.Equal(t, 1, d.count(TypeEvent1))
	unsubscribe()
	assert.Equal(t, 0, d.count(TypeEvent1))
}

func TestConcurrent(t *testing.T) {
	const max = 1000000
	var count int64
	var wg sync.WaitGroup
	wg.Add(1)

	d := NewDispatcher()
	defer Subscribe(d, func(ev MyEvent1) {
		if current := atomic.AddInt64(&count, 1); current == max {
			wg.Done()
		}
	})()

	// Asynchronously publish
	go func() {
		for i := 0; i < max; i++ {
			Publish(d, MyEvent1{})
		}
	}()

	defer Subscribe(d, func(ev MyEvent1) {
		// Subscriber that does nothing
	})()

	wg.Wait()
	assert.Equal(t, max, int(count))
}

func TestSubscribeDifferentType(t *testing.T) {
	d := NewDispatcher()
	assert.Panics(t, func() {
		SubscribeTo(d, TypeEvent1, func(ev MyEvent1) {})
		SubscribeTo(d, TypeEvent1, func(ev MyEvent2) {})
	})
}

func TestPublishDifferentType(t *testing.T) {
	d := NewDispatcher()
	assert.Panics(t, func() {
		SubscribeTo(d, TypeEvent1, func(ev MyEvent2) {})
		Publish(d, MyEvent1{})
	})
}

func TestCloseDispatcher(t *testing.T) {
	d := NewDispatcher()
	defer SubscribeTo(d, TypeEvent1, func(ev MyEvent2) {})()

	assert.NoError(t, d.Close())
	assert.Panics(t, func() {
		SubscribeTo(d, TypeEvent1, func(ev MyEvent2) {})
	})
}

func TestMatrix(t *testing.T) {
	const amount = 1000
	for _, subs := range []int{1, 10, 100} {
		for _, topics := range []int{1, 10} {
			expected := subs * topics * amount
			t.Run(fmt.Sprintf("%dx%d", topics, subs), func(t *testing.T) {
				var count atomic.Int64
				var wg sync.WaitGroup
				wg.Add(expected)

				d := NewDispatcher()
				for i := 0; i < subs; i++ {
					for id := 0; id < topics; id++ {
						defer SubscribeTo(d, uint32(id), func(ev MyEvent3) {
							count.Add(1)
							wg.Done()
						})()
					}
				}

				for n := 0; n < amount; n++ {
					for id := 0; id < topics; id++ {
						go Publish(d, MyEvent3{ID: id})
					}
				}

				wg.Wait()
				assert.Equal(t, expected, int(count.Load()))
			})
		}
	}
}

func TestConcurrentSubscriptionRace(t *testing.T) {
	// This test specifically targets the race condition that occurs when multiple
	// goroutines try to subscribe to different event types simultaneously.
	// Without the CAS loop, subscriptions could be lost due to registry corruption.

	const numGoroutines = 100
	const numEventTypes = 50

	d := NewDispatcher()
	defer d.Close()

	var wg sync.WaitGroup
	var receivedCount int64
	var subscribedTypes sync.Map // Thread-safe map

	wg.Add(numGoroutines)

	// Start multiple goroutines that subscribe to different event types concurrently
	for i := 0; i < numGoroutines; i++ {
		go func(goroutineID int) {
			defer wg.Done()

			// Each goroutine subscribes to a unique event type
			eventType := uint32(goroutineID%numEventTypes + 1000) // Offset to avoid collision with other tests

			// Subscribe to the event type
			SubscribeTo(d, eventType, func(ev MyEvent3) {
				atomic.AddInt64(&receivedCount, 1)
			})

			// Record that this type was subscribed
			subscribedTypes.Store(eventType, true)
		}(i)
	}

	// Wait for all subscriptions to complete
	wg.Wait()

	// Count the number of unique event types subscribed
	expectedTypes := 0
	subscribedTypes.Range(func(key, value interface{}) bool {
		expectedTypes++
		return true
	})

	// Small delay to ensure all subscriptions are fully processed
	time.Sleep(10 * time.Millisecond)

	// Publish events to each subscribed type
	subscribedTypes.Range(func(key, value interface{}) bool {
		eventType := key.(uint32)
		Publish(d, MyEvent3{ID: int(eventType)})
		return true
	})

	// Wait for all events to be processed
	time.Sleep(50 * time.Millisecond)

	// Verify that we received at least the expected number of events
	// (there might be more if multiple goroutines subscribed to the same event type)
	received := atomic.LoadInt64(&receivedCount)
	assert.GreaterOrEqual(t, int(received), expectedTypes,
		"Should have received at least %d events, got %d", expectedTypes, received)

	// Verify that we have the expected number of unique event types
	assert.Equal(t, numEventTypes, expectedTypes,
		"Should have exactly %d unique event types", numEventTypes)
}

func TestConcurrentHandlerRegistration(t *testing.T) {
	const numGoroutines = 100

	// Test concurrent subscriptions to the same event type
	t.Run("SameEventType", func(t *testing.T) {
		d := NewDispatcher()
		var handlerCount int64
		var wg sync.WaitGroup

		// Start multiple goroutines subscribing to the same event type (0x1)
		for i := 0; i < numGoroutines; i++ {
			wg.Add(1)
			go func() {
				defer wg.Done()
				SubscribeTo(d, uint32(0x1), func(ev MyEvent1) {
					atomic.AddInt64(&handlerCount, 1)
				})
			}()
		}

		wg.Wait()

		// Verify all handlers were registered by publishing an event
		atomic.StoreInt64(&handlerCount, 0)
		Publish(d, MyEvent1{})

		// Small delay to ensure all handlers have executed
		time.Sleep(10 * time.Millisecond)

		assert.Equal(t, int64(numGoroutines), atomic.LoadInt64(&handlerCount),
			"Not all handlers were registered due to race condition")
	})

	// Test concurrent subscriptions to different event types
	t.Run("DifferentEventTypes", func(t *testing.T) {
		d := NewDispatcher()
		var wg sync.WaitGroup
		receivedEvents := make(map[uint32]*int64)

		// Create multiple event types and subscribe concurrently
		for i := 0; i < numGoroutines; i++ {
			eventType := uint32(100 + i)
			counter := new(int64)
			receivedEvents[eventType] = counter

			wg.Add(1)
			go func(et uint32, cnt *int64) {
				defer wg.Done()
				SubscribeTo(d, et, func(ev MyEvent3) {
					atomic.AddInt64(cnt, 1)
				})
			}(eventType, counter)
		}

		wg.Wait()

		// Publish events to all types
		for eventType := uint32(100); eventType < uint32(100+numGoroutines); eventType++ {
			Publish(d, MyEvent3{ID: int(eventType)})
		}

		// Small delay to ensure all handlers have executed
		time.Sleep(10 * time.Millisecond)

		// Verify all event types received their events
		for eventType, counter := range receivedEvents {
			assert.Equal(t, int64(1), atomic.LoadInt64(counter),
				"Event type %d did not receive its event", eventType)
		}
	})
}

func TestBackpressure(t *testing.T) {
	d := NewDispatcher()
	d.maxQueue = 10

	var processedCount int64
	unsub := SubscribeTo(d, uint32(0x200), func(ev MyEvent3) {
		atomic.AddInt64(&processedCount, 1)
	})
	defer unsub()

	const eventsToPublish = 1000
	for i := 0; i < eventsToPublish; i++ {
		Publish(d, MyEvent3{ID: 0x200})
	}

	time.Sleep(100 * time.Millisecond)

	// Verify all events were eventually processed
	finalProcessed := atomic.LoadInt64(&processedCount)
	assert.Equal(t, int64(eventsToPublish), finalProcessed)
	t.Logf("Events processed: %d/%d", finalProcessed, eventsToPublish)
}

// ------------------------------------- Test Events -------------------------------------

const (
	TypeEvent1 = 0x1
	TypeEvent2 = 0x2
)

type MyEvent1 struct {
	Number int
}

func (t MyEvent1) Type() uint32 { return TypeEvent1 }

type MyEvent2 struct {
	Text string
}

func (t MyEvent2) Type() uint32 { return TypeEvent2 }

type MyEvent3 struct {
	ID int
}

func (t MyEvent3) Type() uint32 { return uint32(t.ID) }


### event/default_test.go
// Copyright (c) Roman Atachiants and contributore. All rights reserved.
// Licensed under the MIT license. See LICENSE file in the project root for detaile.

package event

import (
	"sync"
	"sync/atomic"
	"testing"

	"github.com/stretchr/testify/assert"
)

/*
cpu: 13th Gen Intel(R) Core(TM) i7-13700K
BenchmarkSubcribeConcurrent-24    	 1826686	       606.3 ns/op	    1648 B/op	       5 allocs/op
*/
func BenchmarkSubscribeConcurrent(b *testing.B) {
	d := NewDispatcher()
	b.ReportAllocs()
	b.ResetTimer()

	b.RunParallel(func(pb *testing.PB) {
		for pb.Next() {
			unsub := Subscribe(d, func(ev MyEvent1) {})
			unsub()
		}
	})
}

func TestDefaultPublish(t *testing.T) {
	var wg sync.WaitGroup

	// Subscribe
	var count int64
	defer On(func(ev MyEvent1) {
		atomic.AddInt64(&count, 1)
		wg.Done()
	})()

	defer OnType(TypeEvent1, func(ev MyEvent1) {
		atomic.AddInt64(&count, 1)
		wg.Done()
	})()

	// Publish
	wg.Add(4)
	Emit(MyEvent1{})
	Emit(MyEvent1{})

	// Wait and check
	wg.Wait()
	assert.Equal(t, int64(4), count)
}


### event/README.md
The code in `event` was originally a part of https://github.com/kelindar/event (v1.5.2)

The original code uses a `time.Ticker` to process the event queue which caused a large increase in CPU usage ([#189](https://github.com/mostlygeek/llama-swap/issues/189)). This code was ported to remove the ticker and instead be more event driven.


### event/default.go
// Copyright (c) Roman Atachiants and contributore. All rights reserved.
// Licensed under the MIT license. See LICENSE file in the project root for detaile.

package event

import (
	"context"
)

// Default initializes a default in-process dispatcher
var Default = NewDispatcherConfig(25000)

// On subscribes to an event, the type of the event will be automatically
// inferred from the provided type. Must be constant for this to work. This
// functions same way as Subscribe() but uses the default dispatcher instead.
func On[T Event](handler func(T)) context.CancelFunc {
	return Subscribe(Default, handler)
}

// OnType subscribes to an event with the specified event type. This functions
// same way as SubscribeTo() but uses the default dispatcher instead.
func OnType[T Event](eventType uint32, handler func(T)) context.CancelFunc {
	return SubscribeTo(Default, eventType, handler)
}

// Emit writes an event into the dispatcher. This functions same way as
// Publish() but uses the default dispatcher instead.
func Emit[T Event](ev T) {
	Publish(Default, ev)
}


### docs/configuration.md
# config.yaml

llama-swap is designed to be very simple: one binary, one configuration file.

## minimal viable config

```yaml
models:
  model1:
    cmd: llama-server --port ${PORT} --model /path/to/model.gguf
```

This is enough to launch `llama-server` to serve `model1`. Of course, llama-swap is about making it possible to serve many models:

```yaml
models:
  model1:
    cmd: llama-server --port ${PORT} -m /path/to/model.gguf
  model2:
    cmd: llama-server --port ${PORT} -m /path/to/another_model.gguf
  model3:
    cmd: llama-server --port ${PORT} -m /path/to/third_model.gguf
```

With this configuration models will be hot swapped and loaded on demand. The special `${PORT}` macro provides a unique port per model. Useful if you want to run multiple models at the same time with the `groups` feature.

## Advanced control with `cmd`

llama-swap is also about customizability. You can use any CLI flag available:

```yaml
models:
  model1:
    cmd: | # support for multi-line
      llama-server --PORT ${PORT} -m /path/to/model.gguf
      --ctx-size 8192
      --jinja
      --cache-type-k q8_0
      --cache-type-v q8_0
```

## Support for any OpenAI API compatible server

llama-swap supports any OpenAI API compatible server. If you can run it on the CLI llama-swap will be able to manage it. Even if it's run in Docker or Podman containers.

```yaml
models:
  "Q3-30B-CODER-VLLM":
    name: "Qwen3 30B Coder vllm AWQ (Q3-30B-CODER-VLLM)"
    # cmdStop provides a reliable way to stop containers
    cmdStop: docker stop vllm-coder
    cmd: |
      docker run --init --rm --name vllm-coder
        --runtime=nvidia --gpus '"device=2,3"'
        --shm-size=16g
        -v /mnt/nvme/vllm-cache:/root/.cache
        -v /mnt/ssd-extra/models:/models -p ${PORT}:8000
        vllm/vllm-openai:v0.10.0
        --model "/models/cpatonn/Qwen3-Coder-30B-A3B-Instruct-AWQ"
        --served-model-name "Q3-30B-CODER-VLLM"
        --enable-expert-parallel
        --swap-space 16
        --max-num-seqs 512
        --max-model-len 65536
        --max-seq-len-to-capture 65536
        --gpu-memory-utilization 0.9
        --tensor-parallel-size 2
        --trust-remote-code
```

## Many more features..

llama-swap supports many more features to customize how you want to manage your environment.

| Feature   | Description                                    |
| --------- | ---------------------------------------------- |
| `ttl`     | automatic unloading of models after a timeout  |
| `macros`  | reusable snippets to use in configurations     |
| `groups`  | run multiple models at a time                  |
| `hooks`   | event driven functionality                     |
| `env`     | define environment variables per model         |
| `aliases` | serve a model with different names             |
| `filters` | modify requests before sending to the upstream |
| `...`     | And many more tweaks                           |

## Full Configuration Example

> [!NOTE]
> This is a copy of `config.example.yaml`. Always check that for the most up to date examples.

```yaml
# llama-swap YAML configuration example
# -------------------------------------
#
# 💡 Tip - Use an LLM with this file!
# ====================================
#  This example configuration is written to be LLM friendly. Try
#  copying this file into an LLM and asking it to explain or generate
#  sections for you.
# ====================================

# Usage notes:
# - Below are all the available configuration options for llama-swap.
# - Settings noted as "required" must be in your configuration file
# - Settings noted as "optional" can be omitted

# healthCheckTimeout: number of seconds to wait for a model to be ready to serve requests
# - optional, default: 120
# - minimum value is 15 seconds, anything less will be set to this value
healthCheckTimeout: 500

# logLevel: sets the logging value
# - optional, default: info
# - Valid log levels: debug, info, warn, error
logLevel: info

# metricsMaxInMemory: maximum number of metrics to keep in memory
# - optional, default: 1000
# - controls how many metrics are stored in memory before older ones are discarded
# - useful for limiting memory usage when processing large volumes of metrics
metricsMaxInMemory: 1000

# startPort: sets the starting port number for the automatic ${PORT} macro.
# - optional, default: 5800
# - the ${PORT} macro can be used in model.cmd and model.proxy settings
# - it is automatically incremented for every model that uses it
startPort: 10001

# macros: a dictionary of string substitutions
# - optional, default: empty dictionary
# - macros are reusable snippets
# - used in a model's cmd, cmdStop, proxy, checkEndpoint, filters.stripParams
# - useful for reducing common configuration settings
# - macro names are strings and must be less than 64 characters
# - macro names must match the regex ^[a-zA-Z0-9_-]+$
# - macro names must not be a reserved name: PORT or MODEL_ID
# - macro values can be numbers, bools, or strings
# - macros can contain other macros, but they must be defined before they are used
macros:
  # Example of a multi-line macro
  "latest-llama": >
    /path/to/llama-server/llama-server-ec9e0301
    --port ${PORT}

  "default_ctx": 4096

  # Example of macro-in-macro usage. macros can contain other macros
  # but they must be previously declared.
  "default_args": "--ctx-size ${default_ctx}"

# models: a dictionary of model configurations
# - required
# - each key is the model's ID, used in API requests
# - model settings have default values that are used if they are not defined here
# - the model's ID is available in the ${MODEL_ID} macro, also available in macros defined above
# - below are examples of the all the settings a model can have
models:
  # keys are the model names used in API requests
  "llama":
    # macros: a dictionary of string substitutions specific to this model
    # - optional, default: empty dictionary
    # - macros defined here override macros defined in the global macros section
    # - model level macros follow the same rules as global macros
    macros:
      "default_ctx": 16384
      "temp": 0.7

    # cmd: the command to run to start the inference server.
    # - required
    # - it is just a string, similar to what you would run on the CLI
    # - using `|` allows for comments in the command, these will be parsed out
    # - macros can be used within cmd
    cmd: |
      # ${latest-llama} is a macro that is defined above
      ${latest-llama}
      --model path/to/llama-8B-Q4_K_M.gguf
      --ctx-size ${default_ctx}
      --temperature ${temp}

    # name: a display name for the model
    # - optional, default: empty string
    # - if set, it will be used in the v1/models API response
    # - if not set, it will be omitted in the JSON model record
    name: "llama 3.1 8B"

    # description: a description for the model
    # - optional, default: empty string
    # - if set, it will be used in the v1/models API response
    # - if not set, it will be omitted in the JSON model record
    description: "A small but capable model used for quick testing"

    # env: define an array of environment variables to inject into cmd's environment
    # - optional, default: empty array
    # - each value is a single string
    # - in the format: ENV_NAME=value
    env:
      - "CUDA_VISIBLE_DEVICES=0,1,2"

    # proxy: the URL where llama-swap routes API requests
    # - optional, default: http://localhost:${PORT}
    # - if you used ${PORT} in cmd this can be omitted
    # - if you use a custom port in cmd this *must* be set
    proxy: http://127.0.0.1:8999

    # aliases: alternative model names that this model configuration is used for
    # - optional, default: empty array
    # - aliases must be unique globally
    # - useful for impersonating a specific model
    aliases:
      - "gpt-4o-mini"
      - "gpt-3.5-turbo"

    # checkEndpoint: URL path to check if the server is ready
    # - optional, default: /health
    # - endpoint is expected to return an HTTP 200 response
    # - all requests wait until the endpoint is ready or fails
    # - use "none" to skip endpoint health checking
    checkEndpoint: /custom-endpoint

    # ttl: automatically unload the model after ttl seconds
    # - optional, default: 0
    # - ttl values must be a value greater than 0
    # - a value of 0 disables automatic unloading of the model
    ttl: 60

    # useModelName: override the model name that is sent to upstream server
    # - optional, default: ""
    # - useful for when the upstream server expects a specific model name that
    #   is different from the model's ID
    useModelName: "qwen:qwq"

    # filters: a dictionary of filter settings
    # - optional, default: empty dictionary
    # - only stripParams is currently supported
    filters:
      # stripParams: a comma separated list of parameters to remove from the request
      # - optional, default: ""
      # - useful for server side enforcement of sampling parameters
      # - the `model` parameter can never be removed
      # - can be any JSON key in the request body
      # - recommended to stick to sampling parameters
      stripParams: "temperature, top_p, top_k"

    # metadata: a dictionary of arbitrary values that are included in /v1/models
    # - optional, default: empty dictionary
    # - while metadata can contains complex types it is recommended to keep it simple
    # - metadata is only passed through in /v1/models responses
    metadata:
      # port will remain an integer
      port: ${PORT}

      # the ${temp} macro will remain a float
      temperature: ${temp}
      note: "The ${MODEL_ID} is running on port ${PORT} temp=${temp}, context=${default_ctx}"

      a_list:
        - 1
        - 1.23
        - "macros are OK in list and dictionary types: ${MODEL_ID}"

      an_obj:
        a: "1"
        b: 2
        # objects can contain complex types with macro substitution
        # becomes: c: [0.7, false, "model: llama"]
        c: ["${temp}", false, "model: ${MODEL_ID}"]

    # concurrencyLimit: overrides the allowed number of active parallel requests to a model
    # - optional, default: 0
    # - useful for limiting the number of active parallel requests a model can process
    # - must be set per model
    # - any number greater than 0 will override the internal default value of 10
    # - any requests that exceeds the limit will receive an HTTP 429 Too Many Requests response
    # - recommended to be omitted and the default used
    concurrencyLimit: 0

  # Unlisted model example:
  "qwen-unlisted":
    # unlisted: boolean, true or false
    # - optional, default: false
    # - unlisted models do not show up in /v1/models api requests
    # - can be requested as normal through all apis
    unlisted: true
    cmd: llama-server --port ${PORT} -m Llama-3.2-1B-Instruct-Q4_K_M.gguf -ngl 0

  # Docker example:
  # container runtimes like Docker and Podman can be used reliably with
  # a combination of cmd, cmdStop, and ${MODEL_ID}
  "docker-llama":
    proxy: "http://127.0.0.1:${PORT}"
    cmd: |
      docker run --name ${MODEL_ID}
      --init --rm -p ${PORT}:8080 -v /mnt/nvme/models:/models
      ghcr.io/ggml-org/llama.cpp:server
      --model '/models/Qwen2.5-Coder-0.5B-Instruct-Q4_K_M.gguf'

    # cmdStop: command to run to stop the model gracefully
    # - optional, default: ""
    # - useful for stopping commands managed by another system
    # - the upstream's process id is available in the ${PID} macro
    #
    # When empty, llama-swap has this default behaviour:
    # - on POSIX systems: a SIGTERM signal is sent
    # - on Windows, calls taskkill to stop the process
    # - processes have 5 seconds to shutdown until forceful termination is attempted
    cmdStop: docker stop ${MODEL_ID}

# groups: a dictionary of group settings
# - optional, default: empty dictionary
# - provides advanced controls over model swapping behaviour
# - using groups some models can be kept loaded indefinitely, while others are swapped out
# - model IDs must be defined in the Models section
# - a model can only be a member of one group
# - group behaviour is controlled via the `swap`, `exclusive` and `persistent` fields
# - see issue #109 for details
#
# NOTE: the example below uses model names that are not defined above for demonstration purposes
groups:
  # group1 works the same as the default behaviour of llama-swap where only one model is allowed
  # to run a time across the whole llama-swap instance
  "group1":
    # swap: controls the model swapping behaviour in within the group
    # - optional, default: true
    # - true : only one model is allowed to run at a time
    # - false: all models can run together, no swapping
    swap: true

    # exclusive: controls how the group affects other groups
    # - optional, default: true
    # - true: causes all other groups to unload when this group runs a model
    # - false: does not affect other groups
    exclusive: true

    # members references the models defined above
    # required
    members:
      - "llama"
      - "qwen-unlisted"

  # Example:
  # - in group2 all models can run at the same time
  # - when a different group is loaded it causes all running models in this group to unload
  "group2":
    swap: false

    # exclusive: false does not unload other groups when a model in group2 is requested
    # - the models in group2 will be loaded but will not unload any other groups
    exclusive: false
    members:
      - "docker-llama"
      - "modelA"
      - "modelB"

  # Example:
  # - a persistent group, prevents other groups from unloading it
  "forever":
    # persistent: prevents over groups from unloading the models in this group
    # - optional, default: false
    # - does not affect individual model behaviour
    persistent: true

    # set swap/exclusive to false to prevent swapping inside the group
    # and the unloading of other groups
    swap: false
    exclusive: false
    members:
      - "forever-modelA"
      - "forever-modelB"
      - "forever-modelc"

# hooks: a dictionary of event triggers and actions
# - optional, default: empty dictionary
# - the only supported hook is on_startup
hooks:
  # on_startup: a dictionary of actions to perform on startup
  # - optional, default: empty dictionary
  # - the only supported action is preload
  on_startup:
    # preload: a list of model ids to load on startup
    # - optional, default: empty list
    # - model names must match keys in the models sections
    # - when preloading multiple models at once, define a group
    #   otherwise models will be loaded and swapped out
    preload:
      - "llama"
```


### docs/examples/README.md
# Example Configs and Use Cases

A collections of usecases and examples for getting the most out of llama-swap.

* [Speculative Decoding](speculative-decoding/README.md) - using a small draft model can increase inference speeds from 20% to 40%. This example includes a configurations Qwen2.5-Coder-32B (2.5x increase) and Llama-3.1-70B (1.4x increase) in the best cases.
* [Optimizing Code Generation](benchmark-snakegame/README.md) - find the optimal settings for your machine. This example demonstrates defining multiple configurations and testing which one is fastest.

### docs/examples/speculative-decoding/README.md
# Speculative Decoding

Speculative decoding can significantly improve the tokens per second. However, this comes at the cost of increased VRAM usage for the draft model. The examples provided are based on a server with three P40s and one 3090.

## Coding Use Case

This example uses Qwen2.5 Coder 32B with the 0.5B model as a draft. A quantization of Q8_0 was chosen for the draft model, as quantization has a greater impact on smaller models.

The models used are:

* [Bartowski Qwen2.5-Coder-32B-Instruct](https://huggingface.co/bartowski/Qwen2.5-Coder-32B-Instruct-GGUF)
* [Bartowski Qwen2.5-Coder-0.5B-Instruct](https://huggingface.co/bartowski/Qwen2.5-Coder-0.5B-Instruct-GGUF)

The llama-swap configuration is as follows:

```yaml
models:
  "qwen-coder-32b-q4":
    # main model on 3090, draft on P40 #1
    cmd: >
      /mnt/nvme/llama-server/llama-server-be0e35
      --host 127.0.0.1 --port 9503
      --flash-attn --metrics
      --slots
      --model /mnt/nvme/models/Qwen2.5-Coder-32B-Instruct-Q4_K_M.gguf
      -ngl 99
      --ctx-size 19000
      --model-draft /mnt/nvme/models/Qwen2.5-Coder-0.5B-Instruct-Q8_0.gguf
      -ngld 99
      --draft-max 16
      --draft-min 4
      --draft-p-min 0.4
      --device CUDA0
      --device-draft CUDA1
    proxy: "http://127.0.0.1:9503"
```

In this configuration, two GPUs are used: a 3090 (CUDA0) for the main model and a P40 (CUDA1) for the draft model. Although both models can fit on the 3090, relocating the draft model to the P40 freed up space for a larger context size. Despite the P40 being about 1/3rd the speed of the 3090, the small model still improved tokens per second.

Multiple tests were run with various parameters, and the fastest result was chosen for the configuration. In all tests, the 0.5B model produced the largest improvements to tokens per second.

Baseline: 33.92 tokens/second on 3090 without a draft model.

| draft-max | draft-min | draft-p-min | python | TS | swift |
|-----------|-----------|-------------|--------|----|-------|
| 16 | 1 | 0.9 | 71.64 | 55.55 | 48.06 |
| 16 | 1 | 0.4 | 83.21 | 58.55 | 45.50 |
| 16 | 1 | 0.1 | 79.72 | 55.66 | 43.94 |
| 16 | 2 | 0.9 | 68.47 | 55.13 | 43.12 |
| 16 | 2 | 0.4 | 82.82 | 57.42 | 48.83 |
| 16 | 2 | 0.1 | 81.68 | 51.37 | 45.72 |
| 16 | 4 | 0.9 | 66.44 | 48.49 | 42.40 |
| 16 | 4 | 0.4 | _83.62_ (fastest)| _58.29_ | _50.17_ |
| 16 | 4 | 0.1 | 82.46 | 51.45 | 40.71 |
| 8 | 1 | 0.4 | 67.07 | 55.17 | 48.46 |
| 4 | 1 | 0.4 | 50.13 | 44.96 | 40.79 |

The test script can be found in this [gist](https://gist.github.com/mostlygeek/da429769796ac8a111142e75660820f1). It is a simple curl script that prompts generating a snake game in Python, TypeScript, or Swift. Evaluation metrics were pulled from llama.cpp's logs.

```bash
for lang in "python" "typescript" "swift"; do
    echo "Generating Snake Game in $lang using $model"
    curl -s --url http://localhost:8080/v1/chat/completions -d "{\"messages\": [{\"role\": \"system\", \"content\": \"you only write code.\"}, {\"role\": \"user\", \"content\": \"write snake game in $lang\"}], \"temperature\": 0.1, \"model\":\"$model\"}" > /dev/null
done
```

Python consistently outperformed Swift in all tests, likely due to the 0.5B draft model being more proficient in generating Python code accepted by the larger 32B model.

## Chat

This configuration is for a regular chat use case. It produces approximately 13 tokens/second in typical use, up from ~9 tokens/second with only the 3xP40s. This is great news for P40 owners.

The models used are:

* [Bartowski Meta-Llama-3.1-70B-Instruct-GGUF](https://huggingface.co/bartowski/Meta-Llama-3.1-70B-Instruct-GGUF)
* [Bartowski Llama-3.2-3B-Instruct-GGUF](https://huggingface.co/bartowski/Llama-3.2-3B-Instruct-GGUF)

```yaml
models:
  "llama-70B":
    cmd: >
      /mnt/nvme/llama-server/llama-server-be0e35
      --host 127.0.0.1 --port 9602
      --flash-attn --metrics
      --split-mode row
      --ctx-size 80000
      --model /mnt/nvme/models/Meta-Llama-3.1-70B-Instruct-Q4_K_L.gguf
      -ngl 99
      --model-draft /mnt/nvme/models/Llama-3.2-3B-Instruct-Q4_K_M.gguf
      -ngld 99
      --draft-max 16
      --draft-min 1
      --draft-p-min 0.4
      --device-draft CUDA0
      --tensor-split 0,1,1,1
```

In this configuration, Llama-3.1-70B is split across three P40s, and Llama-3.2-3B is on the 3090.

Some flags deserve further explanation:

* `--split-mode row` - increases inference speeds using multiple P40s by about 30%. This is a P40-specific feature.
* `--tensor-split 0,1,1,1` - controls how the main model is split across the GPUs. This means 0% on the 3090 and an even split across the P40s. A value of `--tensor-split 0,5,4,1` would mean 0% on the 3090, 50%, 40%, and 10% respectively across the other P40s. However, this would exceed the available VRAM.
* `--ctx-size 80000` - the maximum context size that can fit in the remaining VRAM.

## What is CUDA0, CUDA1, CUDA2, CUDA3?

These devices are the IDs used by llama.cpp.

```bash
$ ./llama-server --list-devices
ggml_cuda_init: GGML_CUDA_FORCE_MMQ:    no
ggml_cuda_init: GGML_CUDA_FORCE_CUBLAS: no
ggml_cuda_init: found 4 CUDA devices:
  Device 0: NVIDIA GeForce RTX 3090, compute capability 8.6, VMM: yes
  Device 1: Tesla P40, compute capability 6.1, VMM: yes
  Device 2: Tesla P40, compute capability 6.1, VMM: yes
  Device 3: Tesla P40, compute capability 6.1, VMM: yes
Available devices:
  CUDA0: NVIDIA GeForce RTX 3090 (24154 MiB, 23892 MiB free)
  CUDA1: Tesla P40 (24438 MiB, 24290 MiB free)
  CUDA2: Tesla P40 (24438 MiB, 24290 MiB free)
  CUDA3: Tesla P40 (24438 MiB, 24290 MiB free)
```

### docs/examples/restart-on-config-change/README.md
# Restart llama-swap on config change

Sometimes editing the configuration file can take a bit of trail and error to get a model configuration tuned just right. The `watch-and-restart.sh` script can be used to watch `config.yaml` for changes and restart `llama-swap` when it detects a change.

```bash
#!/bin/bash
#
# A simple watch and restart llama-swap when its configuration
# file changes. Useful for trying out configuration changes
# without manually restarting the server each time.
if [ -z "$1" ]; then
    echo "Usage: $0 <path to config.yaml>"
    exit 1
fi

while true; do
    # Start the process again
    ./llama-swap-linux-amd64 -config $1 -listen :1867 &
    PID=$!
    echo "Started llama-swap with PID $PID"

    # Wait for modifications in the specified directory or file
    inotifywait -e modify "$1"

    # Check if process exists before sending signal
    if kill -0 $PID 2>/dev/null; then
        echo "Sending SIGTERM to $PID"
        kill -SIGTERM $PID
        wait $PID
    else
        echo "Process $PID no longer exists"
    fi
    sleep 1
done
```

## Usage and output example

```bash
$ ./watch-and-restart.sh config.yaml
Started llama-swap with PID 495455
Setting up watches.
Watches established.
llama-swap listening on :1867
Sending SIGTERM to 495455
Shutting down llama-swap
Started llama-swap with PID 495486
Setting up watches.
Watches established.
llama-swap listening on :1867
```


### docs/examples/aider-qwq-coder/aider.model.settings.yml
- name: "openai/QwQ"
  edit_format: diff
  extra_params:
    max_tokens: 16384
    top_p: 0.95
    top_k: 40
    presence_penalty: 0.1
    repetition_penalty: 1
    num_ctx: 16384
  use_temperature: 0.6
  reasoning_tag: think
  weak_model_name: "openai/qwen-coder-32B"
  editor_model_name: "openai/qwen-coder-32B"

- name: "openai/qwen-coder-32B"
  edit_format: diff
  extra_params:
    max_tokens: 16384
    top_p: 0.8
    top_k: 20
    repetition_penalty: 1.05
  use_temperature: 0.6
  reasoning_tag: think
  editor_edit_format: editor-diff
  editor_model_name: "openai/qwen-coder-32B"



### docs/examples/aider-qwq-coder/aider.model.settings.dualgpu.yml
# this makes use of llama-swap's profile feature to
# keep the architect and editor models in VRAM on different GPUs

- name: "openai/aider:QwQ"
  edit_format: diff
  extra_params:
    max_tokens: 16384
    top_p: 0.95
    top_k: 40
    presence_penalty: 0.1
    repetition_penalty: 1
    num_ctx: 16384
  use_temperature: 0.6
  reasoning_tag: think
  weak_model_name: "openai/aider:qwen-coder-32B"
  editor_model_name: "openai/aider:qwen-coder-32B"

- name: "openai/aider:qwen-coder-32B"
  edit_format: diff
  extra_params:
    max_tokens: 16384
    top_p: 0.8
    top_k: 20
    repetition_penalty: 1.05
  use_temperature: 0.6
  reasoning_tag: think
  editor_edit_format: editor-diff
  editor_model_name: "openai/aider:qwen-coder-32B"

### docs/examples/aider-qwq-coder/llama-swap.yaml
healthCheckTimeout: 300
logLevel: debug

profiles:
    aider:
      - qwen-coder-32B
      - QwQ

models:
  "qwen-coder-32B":
    env:
      - "CUDA_VISIBLE_DEVICES=0"
    aliases:
      - coder
    proxy: "http://127.0.0.1:8999"

    # set appropriate paths for your environment
    cmd: >
      /path/to/llama-server
      --host 127.0.0.1 --port 8999 --flash-attn --slots
      --ctx-size 16000
      --ctx-size-draft 16000
      --model /path/to/Qwen2.5-Coder-32B-Instruct-Q4_K_M.gguf
      --model-draft /path/to/Qwen2.5-Coder-1.5B-Instruct-Q8_0.gguf
      -ngl 99 -ngld 99
      --draft-max 16 --draft-min 4 --draft-p-min 0.4
      --cache-type-k q8_0 --cache-type-v q8_0
  "QwQ":
    env:
      - "CUDA_VISIBLE_DEVICES=1"
    proxy: "http://127.0.0.1:9503"

    # set appropriate paths for your environment
    cmd: >
      /path/to/llama-server
      --host 127.0.0.1 --port 9503
      --flash-attn --metrics
      --slots
      --model /path/to/Qwen_QwQ-32B-Q4_K_M.gguf
      --cache-type-k q8_0 --cache-type-v q8_0
      --ctx-size 32000
      --samplers "top_k;top_p;min_p;temperature;dry;typ_p;xtc"
      --temp 0.6
      --repeat-penalty 1.1
      --dry-multiplier 0.5
      --min-p 0.01
      --top-k 40
      --top-p 0.95
      -ngl 99 -ngld 99

### docs/examples/aider-qwq-coder/README.md
# aider, QwQ, Qwen-Coder 2.5 and llama-swap

This guide show how to use aider and llama-swap to get a 100% local coding co-pilot setup. The focus is on the trickest part which is configuring aider, llama-swap and llama-server to work together.

## Here's what you you need:

- aider - [installation docs](https://aider.chat/docs/install.html)
- llama-server - [download latest release](https://github.com/ggml-org/llama.cpp/releases)
- llama-swap - [download latest release](https://github.com/mostlygeek/llama-swap/releases)
- [QwQ 32B](https://huggingface.co/bartowski/Qwen_QwQ-32B-GGUF) and [Qwen Coder 2.5 32B](https://huggingface.co/bartowski/Qwen2.5-Coder-32B-Instruct-GGUF) models
- 24GB VRAM video card

## Running aider

The goal is getting this command line to work:

```sh
aider --architect \
    --no-show-model-warnings \
    --model openai/QwQ \
    --editor-model openai/qwen-coder-32B \
    --model-settings-file aider.model.settings.yml \
    --openai-api-key "sk-na" \
    --openai-api-base "http://10.0.1.24:8080/v1" \
```

Set `--openai-api-base` to the IP and port where your llama-swap is running.

## Create an aider model settings file

```yaml
# aider.model.settings.yml

#
# !!! important: model names must match llama-swap configuration names !!!
#

- name: "openai/QwQ"
  edit_format: diff
  extra_params:
    max_tokens: 16384
    top_p: 0.95
    top_k: 40
    presence_penalty: 0.1
    repetition_penalty: 1
    num_ctx: 16384
  use_temperature: 0.6
  reasoning_tag: think
  weak_model_name: "openai/qwen-coder-32B"
  editor_model_name: "openai/qwen-coder-32B"

- name: "openai/qwen-coder-32B"
  edit_format: diff
  extra_params:
    max_tokens: 16384
    top_p: 0.8
    top_k: 20
    repetition_penalty: 1.05
  use_temperature: 0.6
  reasoning_tag: think
  editor_edit_format: editor-diff
  editor_model_name: "openai/qwen-coder-32B"
```

## llama-swap configuration

```yaml
# config.yaml

# The parameters are tweaked to fit model+context into 24GB VRAM GPUs
models:
  "qwen-coder-32B":
    proxy: "http://127.0.0.1:8999"
    cmd: >
      /path/to/llama-server
      --host 127.0.0.1 --port 8999 --flash-attn --slots
      --ctx-size 16000
      --cache-type-k q8_0 --cache-type-v q8_0
       -ngl 99
      --model /path/to/Qwen2.5-Coder-32B-Instruct-Q4_K_M.gguf

  "QwQ":
    proxy: "http://127.0.0.1:9503"
    cmd: >
      /path/to/llama-server
      --host 127.0.0.1 --port 9503 --flash-attn --metrics--slots
      --cache-type-k q8_0 --cache-type-v q8_0
      --ctx-size 32000
      --samplers "top_k;top_p;min_p;temperature;dry;typ_p;xtc"
      --temp 0.6 --repeat-penalty 1.1 --dry-multiplier 0.5
      --min-p 0.01 --top-k 40 --top-p 0.95
      -ngl 99
      --model /mnt/nvme/models/bartowski/Qwen_QwQ-32B-Q4_K_M.gguf
```

## Advanced, Dual GPU Configuration

If you have _dual 24GB GPUs_ you can use llama-swap profiles to avoid swapping between QwQ and Qwen Coder.

In llama-swap's configuration file:

1. add a `profiles` section with `aider` as the profile name
2. using the `env` field to specify the GPU IDs for each model

```yaml
# config.yaml

# Add a profile for aider
profiles:
  aider:
    - qwen-coder-32B
    - QwQ

models:
  "qwen-coder-32B":
    # manually set the GPU to run on
    env:
      - "CUDA_VISIBLE_DEVICES=0"
    proxy: "http://127.0.0.1:8999"
    cmd: /path/to/llama-server ...

  "QwQ":
    # manually set the GPU to run on
    env:
      - "CUDA_VISIBLE_DEVICES=1"
    proxy: "http://127.0.0.1:9503"
    cmd: /path/to/llama-server ...
```

Append the profile tag, `aider:`, to the model names in the model settings file

```yaml
# aider.model.settings.yml
- name: "openai/aider:QwQ"
  weak_model_name: "openai/aider:qwen-coder-32B-aider"
  editor_model_name: "openai/aider:qwen-coder-32B-aider"

- name: "openai/aider:qwen-coder-32B"
  editor_model_name: "openai/aider:qwen-coder-32B-aider"
```

Run aider with:

```sh
$ aider --architect \
    --no-show-model-warnings \
    --model openai/aider:QwQ \
    --editor-model openai/aider:qwen-coder-32B \
    --config aider.conf.yml \
    --model-settings-file aider.model.settings.yml
    --openai-api-key "sk-na" \
    --openai-api-base "http://10.0.1.24:8080/v1"
```


### docs/examples/benchmark-snakegame/README.md
# Optimizing Code Generation with llama-swap

Finding the best mix of settings for your hardware can be time consuming. This example demonstrates using a custom configuration file to automate testing different scenarios to find the an optimal configuration.

The benchmark writes a snake game in Python, TypeScript, and Swift using the Qwen 2.5 Coder models. The experiments were done using a 3090 and a P40.

**Benchmark Scenarios**

Three scenarios are tested:

- 3090-only: Just the main model on the 3090
- 3090-with-draft: the main and draft models on the 3090
- 3090-P40-draft: the main model on the 3090 with the draft model offloaded to the P40

**Available Devices**

Use the following command to list available devices IDs for the configuration:

```
$ /mnt/nvme/llama-server/llama-server-f3252055 --list-devices
ggml_cuda_init: GGML_CUDA_FORCE_MMQ:    no
ggml_cuda_init: GGML_CUDA_FORCE_CUBLAS: no
ggml_cuda_init: found 4 CUDA devices:
  Device 0: NVIDIA GeForce RTX 3090, compute capability 8.6, VMM: yes
  Device 1: Tesla P40, compute capability 6.1, VMM: yes
  Device 2: Tesla P40, compute capability 6.1, VMM: yes
  Device 3: Tesla P40, compute capability 6.1, VMM: yes
Available devices:
  CUDA0: NVIDIA GeForce RTX 3090 (24154 MiB, 406 MiB free)
  CUDA1: Tesla P40 (24438 MiB, 22942 MiB free)
  CUDA2: Tesla P40 (24438 MiB, 24144 MiB free)
  CUDA3: Tesla P40 (24438 MiB, 24144 MiB free)
```

**Configuration**

The configuration file, `benchmark-config.yaml`, defines the three scenarios:

```yaml
models:
  "3090-only":
    proxy: "http://127.0.0.1:9503"
    cmd: >
      /mnt/nvme/llama-server/llama-server-f3252055
      --host 127.0.0.1 --port 9503
      --flash-attn
      --slots

      --model /mnt/nvme/models/Qwen2.5-Coder-32B-Instruct-Q4_K_M.gguf
      -ngl 99
      --device CUDA0

      --ctx-size 32768
      --cache-type-k q8_0 --cache-type-v q8_0

  "3090-with-draft":
    proxy: "http://127.0.0.1:9503"
    # --ctx-size 28500 max that can fit on 3090 after draft model
    cmd: >
      /mnt/nvme/llama-server/llama-server-f3252055
      --host 127.0.0.1 --port 9503
      --flash-attn
      --slots

      --model /mnt/nvme/models/Qwen2.5-Coder-32B-Instruct-Q4_K_M.gguf
      -ngl 99
      --device CUDA0

      --model-draft /mnt/nvme/models/Qwen2.5-Coder-0.5B-Instruct-Q8_0.gguf
      -ngld 99
      --draft-max 16
      --draft-min 4
      --draft-p-min 0.4
      --device-draft CUDA0

      --ctx-size 28500
      --cache-type-k q8_0 --cache-type-v q8_0

  "3090-P40-draft":
    proxy: "http://127.0.0.1:9503"
    cmd: >
      /mnt/nvme/llama-server/llama-server-f3252055
      --host 127.0.0.1 --port 9503
      --flash-attn --metrics
      --slots
      --model /mnt/nvme/models/Qwen2.5-Coder-32B-Instruct-Q4_K_M.gguf
      -ngl 99
      --device CUDA0

      --model-draft /mnt/nvme/models/Qwen2.5-Coder-0.5B-Instruct-Q8_0.gguf
      -ngld 99
      --draft-max 16
      --draft-min 4
      --draft-p-min 0.4
      --device-draft CUDA1

      --ctx-size 32768
      --cache-type-k q8_0 --cache-type-v q8_0
```

> Note in the `3090-with-draft` scenario the `--ctx-size` had to be reduced from 32768 to to accommodate the draft model.


**Running the Benchmark**

To run the benchmark, execute the following commands:

1. `llama-swap -config benchmark-config.yaml`
1. `./run-benchmark.sh http://localhost:8080 "3090-only" "3090-with-draft" "3090-P40-draft"`

The [benchmark script](run-benchmark.sh) generates a CSV output of the results, which can be converted to a Markdown table for readability.

**Results (tokens/second)**

| model           | python | typescript | swift |
|-----------------|--------|------------|-------|
| 3090-only       | 34.03  | 34.01      | 34.01 |
| 3090-with-draft | 106.65 | 70.48      | 57.89 |
| 3090-P40-draft  | 81.54  | 60.35      | 46.50 |

Many different factors, like the programming language, can have big impacts on the performance gains. However, with a custom configuration file for benchmarking it is easy to test the different variations to discover what's best for your hardware.

Happy coding!

### docs/examples/benchmark-snakegame/run-benchmark.sh
#!/usr/bin/env bash

# This script generates a CSV file showing the token/second for generating a Snake Game in python, typescript and swift
# It was created to test the effects of speculative decoding and the various draft settings on performance.
#
# Writing code with a low temperature seems to provide fairly consistent logic.
#
# Usage: ./benchmark.sh <url> <model1> [model2 ...]
# Example: ./benchmark.sh http://localhost:8080 model1 model2

if [ "$#" -lt 2 ]; then
    echo "Usage: $0 <url> <model1> [model2 ...]"
    exit 1
fi

url=$1; shift

echo "model,python,typescript,swift"

for model in "$@"; do

    echo -n "$model,"

    for lang in "python" "typescript" "swift"; do
        # expects a llama.cpp after PR https://github.com/ggerganov/llama.cpp/pull/10548
        # (Dec 3rd/2024)
        time=$(curl -s --url "$url/v1/chat/completions" -d "{\"messages\": [{\"role\": \"system\", \"content\": \"you only write code.\"}, {\"role\": \"user\", \"content\": \"write snake game in $lang\"}], \"top_k\": 1, \"timings_per_token\":true, \"model\":\"$model\"}" | jq -r .timings.predicted_per_second)

        if [ $? -ne 0 ]; then
            time="error"
            exit 1
        fi

        if [ "$lang" != "swift" ]; then
            printf "%0.2f tps," $time
        else
            printf "%0.2f tps\n" $time
        fi
    done
done

### ai-plans/issue-264-add-metadata.md
# Add Model Metadata Support with Typed Macros

## Overview

Implement support for arbitrary metadata on model configurations that can be exposed through the `/v1/models` API endpoint. This feature extends the existing macro system to support scalar types (string, int, float, bool) instead of only strings, enabling type-safe metadata values.

The metadata will be schemaless, allowing users to define any key-value pairs they need. Macro substitution will work within metadata values, preserving types when macros are used directly and converting to strings when macros are interpolated within strings.

## Design Requirements

### 1. Enhanced Macro System

**Current State:**

- Macros are defined as `map[string]string` at both global and model levels
- Only string substitution is supported
- Macros are replaced in: `cmd`, `cmdStop`, `proxy`, `checkEndpoint`, `filters.stripParams`

**Required Changes:**

- Change `MacroList` type from `map[string]string` to `map[string]any`
- Support scalar types: `string`, `int`, `float64`, `bool`
- Implement type-preserving macro substitution:
  - Direct macro usage (`key: ${macro}`) preserves the macro's type
  - Interpolated usage (`key: "text ${macro}"`) converts to string
- Add validation to ensure macro values are scalar types only
- Update existing macro substitution logic in [proxy/config/config.go](proxy/config/config.go) to handle `any` types

**Implementation Details:**

- Create a generic helper function to perform macro substitution that:
  - Takes a value of type `any`
  - Recursively processes maps, slices, and scalar values
  - Replaces `${macro_name}` patterns with macro values
  - Preserves types for direct substitution
  - Converts to strings for interpolated substitution
- Update `validateMacro()` function to accept `any` type and validate scalar types
- Maintain backward compatibility with existing string-only macros

### 2. Metadata Field in ModelConfig

**Location:** [proxy/config/model_config.go](proxy/config/model_config.go)

**Required Changes:**

- Add `Metadata map[string]any` field to `ModelConfig` struct
- Support YAML unmarshaling of arbitrary structures (maps, arrays, scalars)
- Apply macro substitution to metadata values during config loading

**Schema Requirements:**

- Metadata is optional (default: empty/nil map)
- Supports nested structures (objects within objects, arrays, etc.)
- All string values within metadata undergo macro substitution
- Type preservation rules apply as described above

### 3. Macro Substitution in Metadata

**Location:** [proxy/config/config.go](proxy/config/config.go) in `LoadConfigFromReader()`

**Process Flow:**

1. After loading YAML configuration
2. After model-level and global macro merging
3. Apply macro substitution to `ModelConfig.Metadata` field
4. Use the same merged macros available to `cmd`, `proxy`, etc.
5. Process recursively through all nested structures

**Substitution Rules:**

- `port: ${PORT}` → keeps integer type from PORT macro
- `temperature: ${temp}` → keeps float type from temp macro
- `note: "Running on ${PORT}"` → converts to string `"Running on 10001"`
- Arrays and nested objects are processed recursively
- Unknown macros should cause configuration load error (consistent with existing behavior)

### 4. API Response Updates

**Location:** [proxy/proxymanager.go:350](proxy/proxymanager.go#L350) `listModelsHandler()`

**Current Behavior:**

- Returns model records with: `id`, `object`, `created`, `owned_by`
- Optionally includes: `name`, `description`

**Required Changes:**

- Add metadata to each model record under the key `llamaswap_meta`
- Only include `llamaswap_meta` if metadata is non-empty
- Preserve all types when marshaling to JSON
- Maintain existing sorting by model ID

**Example Response:**

```json
{
  "object": "list",
  "data": [
    {
      "id": "llama",
      "object": "model",
      "created": 1234567890,
      "owned_by": "llama-swap",
      "name": "llama 3.1 8B",
      "description": "A small but capable model",
      "llamaswap_meta": {
        "port": 10001,
        "temperature": 0.7,
        "note": "The llama is running on port 10001 temp=0.7, context=16384",
        "a_list": [1, 1.23, "macros are OK in list and dictionary types: llama"],
        "an_obj": {
          "a": "1",
          "b": 2,
          "c": [0.7, false, "model: llama"]
        }
      }
    }
  ]
}
```

### 5. Validation and Error Handling

**Macro Validation:**

- Extend `validateMacro()` to accept values of type `any`
- Verify macro values are scalar types: `string`, `int`, `float64`, `bool`
- Reject complex types (maps, slices, structs) as macro values
- Maintain existing validation for macro names and lengths

**Configuration Loading:**

- Fail fast if unknown macros are found in metadata
- Provide clear error messages indicating which model and field contains errors
- Ensure macros in metadata follow same rules as macros in cmd/proxy fields

## Testing Plan

### Test 1: Model-Level Macros with Different Types

**File:** [proxy/config/model_config_test.go](proxy/config/model_config_test.go)

**Test Cases:**

- Define model with macros of each scalar type
- Verify metadata correctly substitutes and preserves types
- Test direct substitution (`port: ${PORT}`)
- Test string interpolation (`note: "Port is ${PORT}"`)
- Verify nested objects and arrays work correctly

### Test 2: Global and Model Macro Precedence

**File:** [proxy/config/config_test.go](proxy/config/config_test.go)

**Test Cases:**

- Define same macro at global and model level with different types
- Verify model-level macro takes precedence
- Test metadata uses correct macro value
- Verify type is preserved from the winning macro

### Test 3: Macro Validation

**File:** [proxy/config/config_test.go](proxy/config/config_test.go)

**Test Cases:**

- Test that complex types (maps, arrays) are rejected as macro values
  - Verify error message includes: macro name and type that was rejected
- Test that scalar types (string, int, float, bool) are accepted
  - Each type should load without error
- Test macro name validation still works with `any` types
  - Invalid characters, reserved names, length limits should still be enforced

### Test 4: Metadata in API Response

**File:** [proxy/proxymanager_test.go](proxy/proxymanager_test.go)

**Existing Test:** `TestProxyManager_ListModelsHandler`

**Test Cases:**

- Model with metadata → verify `llamaswap_meta` key appears
- Model without metadata → verify `llamaswap_meta` key is absent
- Verify all types are correctly marshaled to JSON
- Verify nested structures are preserved
- Verify macro substitution has occurred before serialization

### Test 5: Unknown Macros in Metadata

**File:** [proxy/config/config_test.go](proxy/config/config_test.go)

**Test Cases:**

- Use undefined macro in metadata
- Verify configuration loading fails with clear error
- Error should indicate model name and that macro is undefined

### Test 6: Recursive Substitution

**File:** [proxy/config/config_test.go](proxy/config/config_test.go)

**Test Cases:**

- Metadata with deeply nested structures
- Arrays containing objects with macros
- Objects containing arrays with macros
- Mixed string interpolation and direct substitution at various nesting levels

## Checklist

### Configuration Schema Changes

- [x] Change `MacroList` type from `map[string]string` to `map[string]any` in [proxy/config/config.go:19](proxy/config/config.go#L19)
- [x] Add `Metadata map[string]any` field to `ModelConfig` struct in [proxy/config/model_config.go:37](proxy/config/model_config.go#L37)
- [x] Update `validateMacro()` function signature to accept `any` type for values
- [x] Add validation logic to ensure macro values are scalar types only

### Macro Substitution Logic

- [x] Create generic recursive function `substituteMetadataMacros()` to handle `any` types
- [x] Implement type-preserving direct substitution logic
- [x] Implement string interpolation with type conversion
- [x] Handle maps: recursively process all values
- [x] Handle slices: recursively process all elements
- [x] Handle scalar types: perform string-based macro substitution if value is string
- [x] Integrate macro substitution into `LoadConfigFromReader()` after existing macro expansion
- [x] Update existing macro substitution calls to use merged macros with correct types

### API Response Changes

- [x] Modify `listModelsHandler()` in [proxy/proxymanager.go:350](proxy/proxymanager.go#L350)
- [x] Add `llamaswap_meta` field to model records when metadata exists
- [x] Ensure empty metadata results in omitted `llamaswap_meta` key
- [x] Verify JSON marshaling preserves all types correctly

### Testing - Config Package

- [x] Add test for string macros in metadata: [proxy/config/config_test.go](proxy/config/config_test.go)
- [x] Add test for int macros in metadata: [proxy/config/config_test.go](proxy/config/config_test.go)
- [x] Add test for float macros in metadata: [proxy/config/config_test.go](proxy/config/config_test.go)
- [x] Add test for bool macros in metadata: [proxy/config/config_test.go](proxy/config/config_test.go)
- [x] Add test for string interpolation in metadata: [proxy/config/config_test.go](proxy/config/config_test.go)
- [x] Add test for model-level macro precedence: [proxy/config/config_test.go](proxy/config/config_test.go)
- [x] Add test for nested structures in metadata: [proxy/config/config_test.go](proxy/config/config_test.go)
- [x] Add test for unknown macro in metadata (should error): [proxy/config/config_test.go](proxy/config/config_test.go)
- [x] Add test for invalid macro type validation: [proxy/config/config_test.go](proxy/config/config_test.go)

### Testing - Model Config Package

- [x] Add test cases to [proxy/config/model_config_test.go](proxy/config/model_config_test.go) for metadata unmarshaling
- [x] Test metadata with various scalar types
- [x] Test metadata with nested objects and arrays

### Testing - Proxy Manager

- [x] Update `TestProxyManager_ListModelsHandler` in [proxy/proxymanager_test.go](proxy/proxymanager_test.go)
- [x] Add test case for model with metadata
- [x] Add test case for model without metadata
- [x] Verify `llamaswap_meta` key presence/absence
- [x] Verify type preservation in JSON output
- [x] Verify macro substitution has occurred

### Documentation

- [x] Verify [config.example.yaml](config.example.yaml) already has complete metadata examples (lines 149-171)
- [x] No additional documentation needed per project instructions

## Known Issues and Considerations

### Inconsistencies

None identified. The plan references the correct existing example in [config.example.yaml:149-171](config.example.yaml#L149-L171).

### Design Decisions

1. **Why `llamaswap_meta` instead of merging into record?**

   - Avoids potential collisions with OpenAI API standard fields
   - Makes it clear this is llama-swap specific metadata
   - Easier for clients to distinguish standard vs. custom fields

2. **Why support nested structures?**

   - Provides maximum flexibility for users
   - Aligns with the schemaless design principle
   - Example config already demonstrates this capability

3. **Why validate macro types?**
   - Prevents confusing behavior (e.g., substituting a map)
   - Makes configuration errors explicit at load time
   - Simpler implementation and testing


### ai-plans/issue-336-macro-in-macro.md
# Improve macro-in-macro support

**Status: COMPLETED ✅**

## Title

Fix macro substitution ordering by preserving definition order using ordered YAML parsing

## Overview

The current macro implementation uses `map[string]any` which does not preserve insertion order. This causes issues when macros reference other macros - if macro `B` contains `${A}` but `B` is processed before `A`, the reference won't be substituted, leading to "unknown macro" errors.

**Goal:** Ensure macros are substituted in definition order (LIFO - last in, first out) to allow macros to reliably reference previously-defined macros.

**Outcomes:**
- Macros can reference other macros defined earlier in the config
- Macro substitution is deterministic and order-dependent
- Single-pass substitution prevents circular dependencies
- Use `yaml.Node` from `gopkg.in/yaml.v3` to preserve macro definition order
- All existing tests pass
- New tests validate substitution order and self-reference detection

## Design Requirements

### 1. YAML Parsing Strategy
- **Continue using:** `gopkg.in/yaml.v3` (current library)
- **Use:** `yaml.Node` for ordered parsing of macros
- **Reason:** `yaml.Node` preserves document structure and order, avoiding need for migration

### 2. Data Structure Changes

#### Current Implementation (config.go:19)
```go
type MacroList map[string]any
```

#### New Implementation
```go
type MacroList []MacroEntry

type MacroEntry struct {
    Name  string
    Value any
}
```

**Implementation Note:** Parse macros using `yaml.Node` to extract key-value pairs in document order, then construct the ordered `MacroList`.

### 3. Macro Substitution Order Rules

The substitution must follow this hierarchy (from most specific to least):

1. **Reserved macros** (last): `PORT`, `MODEL_ID` - substituted last, highest priority
2. **Model-level macros** (middle): Defined in specific model config, overrides global
3. **Global macros** (first): Defined at config root level

Within each level, macros are substituted in **reverse definition order** (LIFO):
- The last macro defined is substituted first
- This allows later macros to reference earlier ones
- Single-pass substitution prevents circular dependencies

### 4. Macro Reference Rules

**Allowed:**
- Macro can reference any macro defined **before** it (earlier in the file)
- Model macros can reference global macros
- Macros can reference reserved macros (`${PORT}`, `${MODEL_ID}`)

**Prohibited:**
- Macro cannot reference itself (e.g., `foo: "value ${foo}"`)
- Macro cannot reference macros defined **after** it
- No circular references (prevented by single-pass, ordered substitution)

### 5. Validation Requirements

Add validation to detect:
- **Self-references:** Macro value contains reference to its own name
- **Unknown macros:** After substitution, any remaining `${...}` references

Error messages should be clear:
```
macro 'foo' contains self-reference
unknown macro '${bar}' in model.cmd
```

### 6. Implementation Changes

#### Files to Modify

1. **[proxy/config/config.go](proxy/config/config.go)**
   - Line 19: Change `MacroList` type definition
   - Line 69: Update `Macros MacroList` field
   - Line 153-157: Update macro validation loop to work with ordered structure
   - Line 175-188: Update model-level macro validation
   - Line 181-188: **NEW** Implement proper macro merging respecting order
   - Line 193-202: **NEW** Implement ordered macro substitution in LIFO order
   - Line 389-415: Update `validateMacro` to detect self-references
   - Line 420-475: Update `substituteMetadataMacros` to accept ordered MacroList

2. **[proxy/config/model_config.go](proxy/config/model_config.go)**
   - Line 33: Update `Macros MacroList` field type

3. **All test files**
   - Update test fixtures to use ordered macro definitions
   - Ensure tests specify macro order explicitly

#### Core Algorithm

Replace the macro substitution logic in [config.go:181-252](proxy/config/config.go#L181-L252) with:

```go
// Merge global config and model macros. Model macros take precedence
mergedMacros := make(MacroList, 0, len(config.Macros)+len(modelConfig.Macros)+2)

// Add global macros first
for _, entry := range config.Macros {
	mergedMacros = append(mergedMacros, entry)
}

// Add model macros (can override global)
for _, entry := range modelConfig.Macros {
	// Remove any existing global macro with same name
	found := false
	for i, existing := range mergedMacros {
		if existing.Name == entry.Name {
			mergedMacros[i] = entry // Override
			found = true
			break
		}
	}
	if !found {
		mergedMacros = append(mergedMacros, entry)
	}
}

// Add reserved MODEL_ID macro at the end
mergedMacros = append(mergedMacros, MacroEntry{Name: "MODEL_ID", Value: modelId})

// Check if PORT macro is needed
if strings.Contains(modelConfig.Cmd, "${PORT}") || strings.Contains(modelConfig.Proxy, "${PORT}") || strings.Contains(modelConfig.CmdStop, "${PORT}") {
	// enforce ${PORT} used in both cmd and proxy
	if !strings.Contains(modelConfig.Cmd, "${PORT}") && strings.Contains(modelConfig.Proxy, "${PORT}") {
		return Config{}, fmt.Errorf("model %s: proxy uses ${PORT} but cmd does not - ${PORT} is only available when used in cmd", modelId)
	}

	// Add PORT macro to the end (highest priority)
	mergedMacros = append(mergedMacros, MacroEntry{Name: "PORT", Value: nextPort})
	nextPort++
}

// Single-pass substitution: Substitute all macros in LIFO order (last defined first)
// This allows later macros to reference earlier ones
for i := len(mergedMacros) - 1; i >= 0; i-- {
	entry := mergedMacros[i]
	macroSlug := fmt.Sprintf("${%s}", entry.Name)
	macroStr := fmt.Sprintf("%v", entry.Value)

	// Substitute in command fields
	modelConfig.Cmd = strings.ReplaceAll(modelConfig.Cmd, macroSlug, macroStr)
	modelConfig.CmdStop = strings.ReplaceAll(modelConfig.CmdStop, macroSlug, macroStr)
	modelConfig.Proxy = strings.ReplaceAll(modelConfig.Proxy, macroSlug, macroStr)
	modelConfig.CheckEndpoint = strings.ReplaceAll(modelConfig.CheckEndpoint, macroSlug, macroStr)
	modelConfig.Filters.StripParams = strings.ReplaceAll(modelConfig.Filters.StripParams, macroSlug, macroStr)

	// Substitute in metadata (recursive)
	if len(modelConfig.Metadata) > 0 {
		var err error
		modelConfig.Metadata, err = substituteMacroInValue(modelConfig.Metadata, entry.Name, entry.Value)
		if err != nil {
			return Config{}, fmt.Errorf("model %s metadata: %s", modelId, err.Error())
		}
	}
}
```

Add this new helper function to replace `substituteMetadataMacros`:

```go
// substituteMacroInValue recursively substitutes a single macro in a value structure
// This is called once per macro, allowing LIFO substitution order
func substituteMacroInValue(value any, macroName string, macroValue any) (any, error) {
	macroSlug := fmt.Sprintf("${%s}", macroName)
	macroStr := fmt.Sprintf("%v", macroValue)

	switch v := value.(type) {
	case string:
		// Check if this is a direct macro substitution
		if v == macroSlug {
			return macroValue, nil
		}
		// Handle string interpolation
		if strings.Contains(v, macroSlug) {
			return strings.ReplaceAll(v, macroSlug, macroStr), nil
		}
		return v, nil

	case map[string]any:
		// Recursively process map values
		newMap := make(map[string]any)
		for key, val := range v {
			newVal, err := substituteMacroInValue(val, macroName, macroValue)
			if err != nil {
				return nil, err
			}
			newMap[key] = newVal
		}
		return newMap, nil

	case []any:
		// Recursively process slice elements
		newSlice := make([]any, len(v))
		for i, val := range v {
			newVal, err := substituteMacroInValue(val, macroName, macroValue)
			if err != nil {
				return nil, err
			}
			newSlice[i] = newVal
		}
		return newSlice, nil

	default:
		// Return scalar types as-is
		return value, nil
	}
}
```

### 7. Self-Reference Detection

Add to `validateMacro` function:

```go
func validateMacro(name string, value any) error {
    // ... existing validation ...

    // Check for self-reference
    if str, ok := value.(string); ok {
        macroSlug := fmt.Sprintf("${%s}", name)
        if strings.Contains(str, macroSlug) {
            return fmt.Errorf("macro '%s' contains self-reference", name)
        }
    }

    return nil
}
```

## Testing Plan

### 1. Migration Tests
- **Test:** All existing macro tests still pass after YAML library migration
- **Files:** All `*_test.go` files with macro tests

### 2. Macro Order Tests

#### Test: Macro-in-macro substitution order
```yaml
macros:
  "A": "value-A"
  "B": "prefix-${A}-suffix"

models:
  test:
    cmd: "echo ${B}"
```
**Expected:** `cmd` becomes `"echo prefix-value-A-suffix"`

#### Test: LIFO substitution order
```yaml
macros:
  "base": "/models"
  "path": "${base}/llama"
  "full": "${path}/model.gguf"

models:
  test:
    cmd: "load ${full}"
```
**Expected:** `cmd` becomes `"load /models/llama/model.gguf"`

#### Test: Model macro overrides global
```yaml
macros:
  "tag": "global"
  "msg": "value-${tag}"

models:
  test:
    macros:
      "tag": "model-level"
    cmd: "echo ${msg}"
```
**Expected:** `cmd` becomes `"echo value-model-level"` (model macro overrides global)

### 3. Reserved Macro Tests

#### Test: MODEL_ID substituted in macro
```yaml
macros:
  "podman-llama": "podman run --name ${MODEL_ID} ghcr.io/ggml-org/llama.cpp:server-cuda"

models:
  my-model:
    cmd: "${podman-llama} -m model.gguf"
```
**Expected:** `cmd` becomes `"podman run --name my-model ghcr.io/ggml-org/llama.cpp:server-cuda -m model.gguf"`

### 4. Error Detection Tests

#### Test: Self-reference detection
```yaml
macros:
  "recursive": "value-${recursive}"
```
**Expected:** Error: `macro 'recursive' contains self-reference`

#### Test: Undefined macro reference
```yaml
macros:
  "A": "value-${UNDEFINED}"
```
**Expected:** Error: `unknown macro '${UNDEFINED}' found in macros.A` (or similar)

### 5. Regression Tests
- Run all existing macro tests: `TestConfig_MacroReplacement`, `TestConfig_MacroReservedNames`, etc.
- Ensure all pass without modification (except test fixtures if needed)

## Checklist

### Phase 1: Data Structure Changes
- [ ] Implement custom `UnmarshalYAML` method for `MacroList` that uses `yaml.Node`
- [ ] Define new ordered `MacroList` type as `[]MacroEntry`
- [ ] Update `MacroList` type definition in [config.go](proxy/config/config.go#L19)
- [ ] Update `Config.Macros` field type in [config.go](proxy/config/config.go#L69)
- [ ] Update `ModelConfig.Macros` field type in [model_config.go](proxy/config/model_config.go#L33)
- [ ] Implement helper functions:
  - [ ] `func (ml MacroList) Get(name string) (any, bool)` - lookup by name
  - [ ] `func (ml MacroList) Set(name string, value any) MacroList` - add/override entry
  - [ ] `func (ml MacroList) ToMap() map[string]any` - convert to map if needed

### Phase 2: Macro Validation Updates
- [ ] Update macro validation loop at [config.go:153-157](proxy/config/config.go#L153-L157)
- [ ] Update model macro validation at [config.go:175-179](proxy/config/config.go#L175-L179)
- [ ] Add self-reference detection to `validateMacro` function [config.go:389](proxy/config/config.go#L389)
- [ ] Test self-reference detection with new test case

### Phase 3: Macro Substitution Algorithm
- [ ] Implement ordered macro merging (global → model → reserved) at [config.go:181-188](proxy/config/config.go#L181-L188)
- [ ] Implement single-pass LIFO substitution loop (reverse iteration) at [config.go:193-202](proxy/config/config.go#L193-L202)
  - [ ] Substitute in all string fields (cmd, cmdStop, proxy, checkEndpoint, stripParams)
  - [ ] Substitute in metadata within same loop
- [ ] Ensure `MODEL_ID` is added to merged macros before substitution
- [ ] Ensure `PORT` is added after port assignment (if needed)
- [ ] Replace `substituteMetadataMacros` with new `substituteMacroInValue` function that processes one macro at a time [config.go:420](proxy/config/config.go#L420)
- [ ] Remove old metadata substitution code that was separate from main loop [config.go:245-251](proxy/config/config.go#L245-L251)

### Phase 4: Testing
- [ ] Run `make test-dev` - fix any static checking errors
- [ ] Add test: macro-in-macro basic substitution
- [ ] Add test: LIFO substitution order with 3+ macro levels
- [ ] Add test: MODEL_ID in global macro used by model
- [ ] Add test: PORT in global macro used by model
- [ ] Add test: model macro overrides global macro in substitution
- [ ] Add test: self-reference detection error
- [ ] Add test: undefined macro reference error
- [ ] Verify all existing macro tests pass: `TestConfig_Macro*`
- [ ] Run `make test-all` - ensure all tests including concurrency tests pass

### Phase 5: Documentation
- [ ] Update plan status in this file (mark completed)
- [ ] Update CLAUDE.md if macro behavior needs documentation
- [ ] Verify no new error messages need user documentation

## Bug Example (Original Issue)

```yaml
macros:
  "podman-llama": >
    podman run --name ${MODEL_ID}
    --init --rm -p ${PORT}:8080 -v /home/alex/ai/models:/models:z --gpus=all
    ghcr.io/ggml-org/llama.cpp:server-cuda

  "standard-options": >
    --no-mmap --jinja

  "kv8": >
    -fa on -ctk q8_0 -ctv q8_0
```

**Current Bug:**
- During macro substitution, if `${MODEL_ID}` is processed before `${podman-llama}`, the `${MODEL_ID}` reference inside `podman-llama` remains unsubstituted
- Results in error: `unknown macro '${MODEL_ID}' found in model.cmd`

**After Fix:**
- Macros substituted in LIFO order: `kv8` → `standard-options` → `podman-llama`
- `MODEL_ID` is a reserved macro, substituted last (after all user macros)
- `${MODEL_ID}` inside `podman-llama` is correctly replaced with the model name


### cmd/simple-responder/simple-responder.go
package main

import (
	"flag"
	"fmt"
	"io"
	"log"
	"net/http"
	"os"
	"os/signal"
	"syscall"
	"time"

	"github.com/gin-gonic/gin"
	"github.com/tidwall/gjson"
)

func main() {
	gin.SetMode(gin.TestMode)
	// Define a command-line flag for the port
	port := flag.String("port", "8080", "port to listen on")
	expectedModel := flag.String("model", "TheExpectedModel", "model name to expect")

	// Define a command-line flag for the response message
	responseMessage := flag.String("respond", "hi", "message to respond with")

	silent := flag.Bool("silent", false, "disable all logging")

	ignoreSigTerm := flag.Bool("ignore-sig-term", false, "ignore SIGTERM signal")

	flag.Parse() // Parse the command-line flags

	// Create a new Gin router
	r := gin.New()

	// Set up the handler function using the provided response message
	r.POST("/v1/chat/completions", func(c *gin.Context) {
		bodyBytes, _ := io.ReadAll(c.Request.Body)

		// Check if streaming is requested
		// Query is checked instead of JSON body since that event stream conflicts with other tests
		isStreaming := c.Query("stream") == "true"

		if isStreaming {
			// Set headers for streaming
			c.Header("Content-Type", "text/event-stream")
			c.Header("Cache-Control", "no-cache")
			c.Header("Connection", "keep-alive")
			c.Header("Transfer-Encoding", "chunked")

			// add a wait to simulate a slow query
			if wait, err := time.ParseDuration(c.Query("wait")); err == nil {
				time.Sleep(wait)
			}

			// Send 10 "asdf" tokens
			for i := 0; i < 10; i++ {
				data := gin.H{
					"created": time.Now().Unix(),
					"choices": []gin.H{
						{
							"index": 0,
							"delta": gin.H{
								"content": "asdf",
							},
							"finish_reason": nil,
						},
					},
				}
				c.SSEvent("message", data)
				c.Writer.Flush()
			}

			// Send final data with usage info
			finalData := gin.H{
				"usage": gin.H{
					"completion_tokens": 10,
					"prompt_tokens":     25,
					"total_tokens":      35,
				},
				// add timings to simulate llama.cpp
				"timings": gin.H{
					"prompt_n":             25,
					"prompt_ms":            13,
					"predicted_n":          10,
					"predicted_ms":         17,
					"predicted_per_second": 10,
				},
			}
			c.SSEvent("message", finalData)
			c.Writer.Flush()

			// Send [DONE]
			c.SSEvent("message", "[DONE]")
			c.Writer.Flush()
		} else {
			c.Header("Content-Type", "application/json")

			// add a wait to simulate a slow query
			if wait, err := time.ParseDuration(c.Query("wait")); err == nil {
				time.Sleep(wait)
			}

			c.JSON(http.StatusOK, gin.H{
				"responseMessage":  *responseMessage,
				"h_content_length": c.Request.Header.Get("Content-Length"),
				"request_body":     string(bodyBytes),
				"usage": gin.H{
					"completion_tokens": 10,
					"prompt_tokens":     25,
					"total_tokens":      35,
				},
				"timings": gin.H{
					"prompt_n":             25,
					"prompt_ms":            13,
					"predicted_n":          10,
					"predicted_ms":         17,
					"predicted_per_second": 10,
				},
			})
		}
	})

	// for issue #62 to check model name strips profile slug
	// has to be one of the openAI API endpoints that llama-swap proxies
	// curl http://localhost:8080/v1/audio/speech -d '{"model":"profile:TheExpectedModel"}'
	r.POST("/v1/audio/speech", func(c *gin.Context) {
		body, err := io.ReadAll(c.Request.Body)
		if err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to read request body"})
			return
		}
		defer c.Request.Body.Close()
		modelName := gjson.GetBytes(body, "model").String()
		if modelName != *expectedModel {
			c.JSON(http.StatusBadRequest, gin.H{"error": fmt.Sprintf("Invalid model: %s, expected: %s", modelName, *expectedModel)})
			return
		} else {
			c.JSON(http.StatusOK, gin.H{"message": "ok"})
		}
	})

	r.POST("/v1/completions", func(c *gin.Context) {
		c.Header("Content-Type", "application/json")
		c.JSON(http.StatusOK, gin.H{
			"responseMessage": *responseMessage,
			"usage": gin.H{
				"completion_tokens": 10,
				"prompt_tokens":     25,
				"total_tokens":      35,
			},
		})

	})

	// llama-server compatibility: /completion
	r.POST("/completion", func(c *gin.Context) {
		c.Header("Content-Type", "application/json")
		c.JSON(http.StatusOK, gin.H{
			"responseMessage": *responseMessage,
			"usage": gin.H{
				"completion_tokens": 10,
				"prompt_tokens":     25,
				"total_tokens":      35,
			},
		})
	})

	// issue #41
	r.POST("/v1/audio/transcriptions", func(c *gin.Context) {
		// Parse the multipart form
		if err := c.Request.ParseMultipartForm(10 << 20); err != nil { // 10 MB max memory
			c.JSON(http.StatusBadRequest, gin.H{"error": fmt.Sprintf("Error parsing multipart form: %s", err)})
			return
		}

		// Get the model from the form values
		model := c.Request.FormValue("model")

		if model == "" {
			c.JSON(http.StatusBadRequest, gin.H{"error": "Missing model parameter"})
			return
		}

		// Get the file from the form
		file, _, err := c.Request.FormFile("file")
		if err != nil {
			c.JSON(http.StatusBadRequest, gin.H{"error": fmt.Sprintf("Error getting file: %s", err)})
			return
		}
		defer file.Close()

		// Read the file content to get its size
		fileBytes, err := io.ReadAll(file)
		if err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": fmt.Sprintf("Error reading file: %s", err)})
			return
		}

		fileSize := len(fileBytes)

		// Return a JSON response with the model and transcription text including file size
		c.JSON(http.StatusOK, gin.H{
			"text":  fmt.Sprintf("The length of the file is %d bytes", fileSize),
			"model": model,

			// expose some header values for testing
			"h_content_type":   c.GetHeader("Content-Type"),
			"h_content_length": c.GetHeader("Content-Length"),
		})
	})

	r.GET("/slow-respond", func(c *gin.Context) {
		echo := c.Query("echo")
		delay := c.Query("delay")

		if echo == "" {
			echo = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789"
		}

		// Parse the duration
		if delay == "" {
			delay = "100ms"
		}

		t, err := time.ParseDuration(delay)
		if err != nil {
			c.Header("Content-Type", "text/plain")
			c.String(http.StatusBadRequest, fmt.Sprintf("Invalid duration: %s", err))
			return
		}

		c.Header("Content-Type", "text/plain")
		for _, char := range echo {
			c.Writer.Write([]byte(string(char)))
			c.Writer.Flush()

			// wait
			<-time.After(t)
		}
	})

	r.GET("/test", func(c *gin.Context) {
		c.Header("Content-Type", "text/plain")
		c.String(200, *responseMessage)
	})

	r.GET("/env", func(c *gin.Context) {
		c.Header("Content-Type", "text/plain")
		c.String(200, *responseMessage)

		// Get environment variables
		envVars := os.Environ()

		// Write each environment variable to the response
		for _, envVar := range envVars {
			c.String(200, envVar)
		}
	})

	// Set up the /health endpoint handler function
	r.GET("/health", func(c *gin.Context) {
		c.Header("Content-Type", "application/json")
		c.JSON(200, gin.H{"status": "ok"})
	})

	r.GET("/", func(c *gin.Context) {
		c.Header("Content-Type", "text/plain")
		c.String(200, fmt.Sprintf("%s %s", c.Request.Method, c.Request.URL.Path))
	})

	address := "127.0.0.1:" + *port // Address with the specified port

	srv := &http.Server{
		Addr:    address,
		Handler: r.Handler(),
	}

	// Disable logging if the --silent flag is set
	if *silent {
		gin.SetMode(gin.ReleaseMode)
		gin.DefaultWriter = io.Discard
		log.SetOutput(io.Discard)
	}

	if !*silent {
		fmt.Printf("My PID: %d\n", os.Getpid())
	}

	go func() {
		log.Printf("simple-responder listening on %s\n", address)
		// service connections
		if err := srv.ListenAndServe(); err != nil && err != http.ErrServerClosed {
			log.Fatalf("simple-responder err: %s\n", err)
		}
	}()

	// Wait for interrupt signal to gracefully shutdown the server with
	// a timeout of 5 seconds.
	sigChan := make(chan os.Signal, 1)
	// kill (no param) default send syscall.SIGTERM
	// kill -2 is syscall.SIGINT
	// kill -9 is syscall.SIGKILL but can't be catch, so don't need add it
	signal.Notify(sigChan, syscall.SIGINT, syscall.SIGTERM)

	countSigInt := 0

runloop:
	for {
		signal := <-sigChan
		switch signal {
		case syscall.SIGINT:
			countSigInt++
			if countSigInt > 1 {
				break runloop
			} else {
				log.Println("Received SIGINT, send another SIGINT to shutdown")
			}
		case syscall.SIGTERM:
			if *ignoreSigTerm {
				log.Println("Ignoring SIGTERM")
			} else {
				log.Println("Received SIGTERM, shutting down")
				break runloop
			}
		default:
			break runloop
		}
	}

	log.Println("simple-responder shutting down")
}


### cmd/wol-proxy/wol-proxy.go
package main

import (
	"bufio"
	"context"
	_ "embed"
	"errors"
	"flag"
	"fmt"
	"io"
	"log/slog"
	"net"
	"net/http"
	"net/http/httputil"
	"net/url"
	"os"
	"os/signal"
	"strings"
	"sync"
	"time"
)

//go:embed index.html
var loadingPageHTML string

var (
	flagMac      = flag.String("mac", "", "mac address to send WoL packet to")
	flagUpstream = flag.String("upstream", "", "upstream proxy address to send requests to")
	flagListen   = flag.String("listen", ":8080", "listen address to listen on")
	flagLog      = flag.String("log", "info", "log level (debug, info, warn, error)")
	flagTimeout  = flag.Int("timeout", 60, "seconds requests wait for upstream response before failing")
)

func main() {
	flag.Parse()

	switch *flagLog {
	case "debug":
		slog.SetLogLoggerLevel(slog.LevelDebug)
	case "info":
		slog.SetLogLoggerLevel(slog.LevelInfo)
	case "warn":
		slog.SetLogLoggerLevel(slog.LevelWarn)
	case "error":
		slog.SetLogLoggerLevel(slog.LevelError)
	default:
		slog.Error("invalid log level", "logLevel", *flagLog)
		return
	}

	// Validate flags
	if *flagListen == "" {
		slog.Error("listen address is required")
		return
	}

	if *flagMac == "" {
		slog.Error("mac address is required")
		return
	}

	if *flagTimeout < 1 {
		slog.Error("timeout must be greater than 0")
		return
	}

	var upstreamURL *url.URL
	var err error
	// validate mac address
	if _, err = net.ParseMAC(*flagMac); err != nil {
		slog.Error("invalid mac address", "error", err)
		return
	}

	if *flagUpstream == "" {
		slog.Error("upstream proxy address is required")
		return
	} else {
		upstreamURL, err = url.ParseRequestURI(*flagUpstream)
		if err != nil {
			slog.Error("error parsing upstream url", "error", err)
			return
		}
	}

	proxy := newProxy(upstreamURL)
	server := &http.Server{
		Addr:    *flagListen,
		Handler: proxy,
	}

	// start the server
	go func() {
		slog.Info("server starting on", "address", *flagListen)
		if err := server.ListenAndServe(); err != nil {
			slog.Error("error starting server", "error", err)
		}
	}()

	// graceful shutdown
	ctx, _ := signal.NotifyContext(context.Background(), os.Interrupt)
	<-ctx.Done()
	server.Close()
}

type upstreamStatus string

const (
	notready upstreamStatus = "not ready"
	ready    upstreamStatus = "ready"
)

type proxyServer struct {
	upstreamProxy *httputil.ReverseProxy
	failCount     int
	statusMutex   sync.RWMutex
	status        upstreamStatus
}

func newProxy(url *url.URL) *proxyServer {
	p := httputil.NewSingleHostReverseProxy(url)
	proxy := &proxyServer{
		upstreamProxy: p,
		status:        notready,
		failCount:     0,
	}

	// start a goroutine to monitor upstream status via SSE
	go func() {
		eventsUrl := url.Scheme + "://" + url.Host + "/api/events"
		client := &http.Client{
			Timeout: 0, // No timeout for SSE connection
		}

		waitDuration := 10 * time.Second

		for {
			slog.Debug("connecting to SSE endpoint", "url", eventsUrl)

			req, err := http.NewRequest("GET", eventsUrl, nil)
			if err != nil {
				slog.Warn("failed to create SSE request", "error", err)
				proxy.setStatus(notready)
				proxy.incFail(1)
				time.Sleep(waitDuration)
				continue
			}

			req.Header.Set("Accept", "text/event-stream")
			req.Header.Set("Cache-Control", "no-cache")
			req.Header.Set("Connection", "keep-alive")

			resp, err := client.Do(req)
			if err != nil {
				slog.Error("failed to connect to SSE endpoint", "error", err)
				proxy.setStatus(notready)
				proxy.incFail(1)
				time.Sleep(10 * time.Second)
				continue
			}

			if resp.StatusCode != http.StatusOK {
				slog.Warn("SSE endpoint returned non-OK status", "status", resp.StatusCode)
				_, _ = io.Copy(io.Discard, resp.Body)
				_ = resp.Body.Close()
				proxy.setStatus(notready)
				proxy.incFail(1)
				time.Sleep(10 * time.Second)
				continue
			}

			// Successfully connected to SSE endpoint
			slog.Info("connected to SSE endpoint, upstream ready")
			proxy.setStatus(ready)
			proxy.resetFailures()

			// Read from the SSE stream to detect disconnection
			scanner := bufio.NewScanner(resp.Body)

			// use a fairly large buffer to avoid scanner errors when reading large SSE events
			buf := make([]byte, 0, 1024*1024*2)
			scanner.Buffer(buf, 1024*1024*2)
			events := 0
			if slog.Default().Enabled(context.Background(), slog.LevelDebug) {
				fmt.Print("Events: ")
			}
			for scanner.Scan() {
				if slog.Default().Enabled(context.Background(), slog.LevelDebug) {
					// Just read the events to keep connection alive
					// We don't need to process the event data
					events++
					fmt.Printf("%d, ", events)
				}
			}
			fmt.Println()
			if err := scanner.Err(); err != nil {
				slog.Error("error reading from SSE stream", "error", err)
			}

			// Connection closed or error occurred
			_ = resp.Body.Close()
			slog.Info("SSE connection closed, upstream not ready")
			proxy.setStatus(notready)
			proxy.incFail(1)

			// Wait before reconnecting
			time.Sleep(waitDuration)
		}
	}()

	return proxy
}

func (p *proxyServer) ServeHTTP(w http.ResponseWriter, r *http.Request) {
	if r.Method == "GET" && r.URL.Path == "/status" {
		status := string(p.getStatus())
		failCount := p.getFailures()
		w.Header().Set("Content-Type", "text/plain")
		w.WriteHeader(200)
		fmt.Fprintf(w, "status: %s\n", status)
		fmt.Fprintf(w, "failures: %d\n", failCount)
		return
	}

	if p.getStatus() == notready {
		path := r.URL.Path
		if strings.HasPrefix(path, "/api/events") {
			slog.Debug("Skipping wake up", "req", path)
			w.WriteHeader(http.StatusNoContent)
			return
		}

		slog.Info("upstream not ready, sending magic packet", "req", path, "from", r.RemoteAddr)
		if err := sendMagicPacket(*flagMac); err != nil {
			slog.Warn("failed to send magic WoL packet", "error", err)
		}

		// For root or UI path requests, return loading page with status polling
		// the web page will do the polling and redirect when ready
		if path == "/" || strings.HasPrefix(path, "/ui/") {
			w.Header().Set("Content-Type", "text/html; charset=utf-8")
			w.WriteHeader(http.StatusOK)
			fmt.Fprint(w, loadingPageHTML)
			return
		}

		ticker := time.NewTicker(250 * time.Millisecond)
		timeout, cancel := context.WithTimeout(context.Background(), time.Duration(*flagTimeout)*time.Second)
		defer cancel()
	loop:
		for {
			select {
			case <-timeout.Done():
				slog.Info("timeout waiting for upstream to be ready")
				http.Error(w, "timeout", http.StatusRequestTimeout)
				return
			case <-ticker.C:
				if p.getStatus() == ready {
					ticker.Stop()
					break loop
				}
			}
		}
	}

	p.upstreamProxy.ServeHTTP(w, r)
}

func (p *proxyServer) getStatus() upstreamStatus {
	p.statusMutex.RLock()
	defer p.statusMutex.RUnlock()
	return p.status
}

func (p *proxyServer) setStatus(status upstreamStatus) {
	p.statusMutex.Lock()
	defer p.statusMutex.Unlock()
	p.status = status
}

func (p *proxyServer) incFail(num int) {
	p.statusMutex.Lock()
	defer p.statusMutex.Unlock()
	p.failCount += num
}

func (p *proxyServer) getFailures() int {
	p.statusMutex.RLock()
	defer p.statusMutex.RUnlock()
	return p.failCount
}

func (p *proxyServer) resetFailures() {
	p.statusMutex.Lock()
	defer p.statusMutex.Unlock()
	p.failCount = 0
}

func sendMagicPacket(macAddr string) error {
	hwAddr, err := net.ParseMAC(macAddr)
	if err != nil {
		return err
	}

	if len(hwAddr) != 6 {
		return errors.New("invalid MAC address")
	}

	// Create the magic packet.
	packet := make([]byte, 102)
	// Add 6 bytes of 0xFF.
	for i := 0; i < 6; i++ {
		packet[i] = 0xFF
	}
	// Repeat the MAC address 16 times.
	for i := 1; i <= 16; i++ {
		copy(packet[i*6:], hwAddr)
	}

	// Send the packet using UDP.
	addr := net.UDPAddr{
		IP:   net.IPv4bcast,
		Port: 9,
	}
	conn, err := net.DialUDP("udp", nil, &addr)
	if err != nil {
		return err
	}
	defer conn.Close()

	_, err = conn.Write(packet)
	return err
}


### cmd/wol-proxy/index.html
<!DOCTYPE html>
<html>
<head>
<meta charset="utf-8">
<title>Loading...</title>
<style>
body {
    font-family: sans-serif;
    display: flex;
    justify-content: center;
    align-items: center;
    height: 100vh;
    margin: 0;
    background: #f5f5f5;
}
.loader {
    text-align: center;
}
.stats {
    font-size: 18px;
    color: #333;
    margin: 20px 0;
}
.stats-label {
    color: #666;
    font-size: 14px;
}
</style>
</head>
<body>
<div class="loader">
    <p>Waking up upstream server...</p>
    <div class="stats">
        <div><span class="stats-label">Time elapsed:</span> <span id="elapsed">0s</span></div>
        <div><span id="attempts">&nbsp;</span></div>
    </div>
</div>
<script>
var startTime = Date.now();
var attempts = 0;

setInterval(function() {
    var elapsed = (Date.now() - startTime) / 1000;
    document.getElementById('elapsed').textContent = elapsed.toFixed(1) + 's';
}, 100);

// Check status every second
setInterval(function() {
    attempts++;
    var dots = '.'.repeat((attempts % 10) || 10);
    document.getElementById('attempts').textContent = dots;

    fetch('/status')
        .then(function(r) { return r.text(); })
        .then(function(t) {
            if (t.indexOf('status: ready') !== -1) {
                location.reload();
            }
        })
        .catch(function() {});
}, 1000);
</script>
</body>
</html>


### cmd/wol-proxy/README.md
# wol-proxy

wol-proxy automatically wakes up a suspended llama-swap server using Wake-on-LAN when requests are received.

When a request arrives and llama-swap is unavailable, wol-proxy sends a WOL packet and holds the request until the server becomes available. If the server doesn't respond within the timeout period (default: 60 seconds), the request is dropped.

This utility helps conserve energy by allowing GPU-heavy servers to remain suspended when idle, as they can consume hundreds of watts even when not actively processing requests.

## Usage

```shell
# minimal
$ ./wol-proxy -mac BA:DC:0F:FE:E0:00 -upstream http://192.168.1.13:8080

# everything
$ ./wol-proxy -mac BA:DC:0F:FE:E0:00 -upstream http://192.168.1.13:8080 \
    # use debug log level
    -log debug \
    # altenerative listening port
    -listen localhost:9999 \
    # seconds to hold requests waiting for upstream to be ready
    -timeout 30
```

## API

`GET /status` - that's it. Everything else is proxied to the upstream server.


### cmd/misc/process-cmd-test/main.go
package main

import (
	"context"
	"errors"
	"fmt"
	"os"
	"os/exec"
	"os/signal"
	"syscall"
	"time"
)

/*
**
Test how exec.Cmd.CommandContext behaves under certain conditions:*

  - process is killed externally, what happens with cmd.Wait() *
    ✔︎ it returns. catches crashes.*

  - process ignores SIGTERM*
    ✔︎ `kill()` is called after cmd.WaitDelay*

  - this process exits, what happens with children (kill -9 <this process' pid>)*
    x they stick around. have to be manually killed.*

  - .WithTimeout()'s cancel is called *
    ✔︎ process is killed after it ignores sigterm, cmd.Wait() catches it.*

  - parent receives SIGINT/SIGTERM, what happens
    ✔︎ waits for child process to exit, then exits gracefully.
*/
func main() {

	// swap between these to use kill -9 <pid> on the cli to sim external crash
	ctx, cancel := context.WithCancel(context.Background())
	//ctx, cancel := context.WithTimeout(context.Background(), 1000*time.Millisecond)
	defer cancel()

	//cmd := exec.CommandContext(ctx, "sleep", "1")
	cmd := exec.CommandContext(ctx,
		"../../build/simple-responder_darwin_arm64",
		//"-ignore-sig-term", /* so it doesn't exit on receiving SIGTERM, test cmd.WaitTimeout */
	)
	cmd.Stdin = os.Stdin
	cmd.Stdout = os.Stdout
	cmd.Stderr = os.Stderr

	// set a wait delay before signing sig kill
	cmd.WaitDelay = 500 * time.Millisecond
	cmd.Cancel = func() error {
		fmt.Println("✔︎ Cancel() called, sending SIGTERM")
		cmd.Process.Signal(syscall.SIGTERM)

		//return nil

		// this error is returned by cmd.Wait(), and can be used to
		// single an error when the process couldn't be normally terminated
		// but since a SIGTERM is sent, it's probably ok to return a nil
		// as WaitDelay timing out will override the any error set here.
		//
		// test by enabling/disabling -ignore-sig-term on the process
		// with -ignore-sig-term enabled, cmd.Wait() will have "signal: killed"
		// without it, it will show the "new error from cancel"
		return errors.New("error from cmd.Cancel()") // sets error returned by cmd.Wait()
	}

	if err := cmd.Start(); err != nil {
		fmt.Println("Error starting process:", err)
		return
	}

	// catch signals. Calls cancel() which will cause cmd.Wait() to return and
	// this program to eventually exit gracefully.
	sigChan := make(chan os.Signal, 1)
	signal.Notify(sigChan, syscall.SIGINT, syscall.SIGTERM)
	go func() {
		signal := <-sigChan
		fmt.Printf("✔︎ Received signal: %d, Killing process... with cancel before exiting\n", signal)
		cancel()
	}()

	fmt.Printf("✔︎ Parent Pid: %d, Process Pid: %d\n", os.Getpid(), cmd.Process.Pid)
	fmt.Println("✔︎ Process started, cmd.Wait() ... ")
	if err := cmd.Wait(); err != nil {
		fmt.Println("✔︎ cmd.Wait returned, Error:", err)
	} else {
		fmt.Println("✔︎ cmd.Wait returned, Process exited on its own")
	}
	fmt.Println("✔︎ Child process exited, Done.")
}


### cmd/misc/test-rerank/README.md
The rerank-test.json data is from https://github.com/ggerganov/llama.cpp/pull/9510

To run it:
> curl http://127.0.0.1:8080/v1/rerank -H "Content-Type: application/json" -d @reranker-test.json  -v | jq .

### cmd/misc/benchmark-chatcompletion/main.go
package main

// created for issue: #252 https://github.com/mostlygeek/llama-swap/issues/252
// this simple benchmark tool sends a lot of small chat completion requests to llama-swap
// to make sure all the requests are accounted for.
//
// requests can be sent in parallel, and the tool will report the results.
// usage: go run main.go -baseurl http://localhost:8080/v1 -model llama3 -requests 1000 -par 5

import (
	"bytes"
	"flag"
	"fmt"
	"io"
	"log"
	"net/http"
	"os"
	"sync"
	"time"
)

func main() {
	// ----- CLI arguments ----------------------------------------------------
	var (
		baseurl         string
		modelName       string
		totalRequests   int
		parallelization int
	)

	flag.StringVar(&baseurl, "baseurl", "http://localhost:8080/v1", "Base URL of the API (e.g., https://api.example.com)")
	flag.StringVar(&modelName, "model", "", "Model name to use")
	flag.IntVar(&totalRequests, "requests", 1, "Total number of requests to send")
	flag.IntVar(&parallelization, "par", 1, "Maximum number of concurrent requests")
	flag.Parse()

	if baseurl == "" || modelName == "" {
		fmt.Println("Error: both -baseurl and -model are required.")
		flag.Usage()
		os.Exit(1)
	}
	if totalRequests <= 0 {
		fmt.Println("Error: -requests must be greater than 0.")
		os.Exit(1)
	}
	if parallelization <= 0 {
		fmt.Println("Error: -parallelization must be greater than 0.")
		os.Exit(1)
	}

	// ----- HTTP client -------------------------------------------------------
	client := &http.Client{
		Timeout: 30 * time.Second,
	}

	// ----- Tracking response codes -------------------------------------------
	statusCounts := make(map[int]int) // map[statusCode]count
	var mu sync.Mutex                 // protects statusCounts

	// ----- Request queue (buffered channel) ----------------------------------
	requests := make(chan int, 10) // Buffered channel with capacity 10

	// Goroutine to fill the request queue
	go func() {
		for i := 0; i < totalRequests; i++ {
			requests <- i + 1
		}
		close(requests)
	}()

	// ----- Worker pool -------------------------------------------------------
	var wg sync.WaitGroup
	for i := 0; i < parallelization; i++ {
		wg.Add(1)
		go func(workerID int) {
			defer wg.Done()

			for reqID := range requests {
				// Build request payload as a single line JSON string
				payload := `{"model":"` + modelName + `","max_tokens":100,"stream":false,"messages":[{"role":"user","content":"write a snake game in python"}]}`

				// Send POST request
				req, err := http.NewRequest(http.MethodPost,
					fmt.Sprintf("%s/chat/completions", baseurl),
					bytes.NewReader([]byte(payload)))
				if err != nil {
					log.Printf("[worker %d][req %d] request creation error: %v", workerID, reqID, err)
					mu.Lock()
					statusCounts[-1]++
					mu.Unlock()
					continue
				}
				req.Header.Set("Content-Type", "application/json")

				resp, err := client.Do(req)
				if err != nil {
					log.Printf("[worker %d][req %d] HTTP request error: %v", workerID, reqID, err)
					mu.Lock()
					statusCounts[-1]++
					mu.Unlock()
					continue
				}
				io.Copy(io.Discard, resp.Body)
				resp.Body.Close()

				// Record status code
				mu.Lock()
				statusCounts[resp.StatusCode]++
				mu.Unlock()
			}
		}(i + 1)
	}

	// ----- Status ticker (prints every second) -------------------------------
	done := make(chan struct{})
	tickerDone := make(chan struct{})
	go func() {
		ticker := time.NewTicker(1 * time.Second)
		startTime := time.Now()
		for {
			select {
			case <-ticker.C:
				mu.Lock()
				// Compute how many requests have completed so far
				completed := 0
				for _, cnt := range statusCounts {
					completed += cnt
				}
				// Calculate duration and progress
				duration := time.Since(startTime)
				progress := completed * 100 / totalRequests
				fmt.Printf("Duration: %v, Completed: %d%% requests\n", duration, progress)
				mu.Unlock()
			case <-done:
				duration := time.Since(startTime)
				fmt.Printf("Duration: %v, Completed: %d%% requests\n", duration, 100)
				close(tickerDone)
				return
			}
		}
	}()

	// Wait for all workers to finish
	wg.Wait()
	close(done)  // stops the status-update goroutine
	<-tickerDone // give ticker time to finish / print

	// ----- Summary ------------------------------------------------------------
	fmt.Println("\n\n=== HTTP response code summary ===")
	mu.Lock()
	for code, cnt := range statusCounts {
		if code == -1 {
			fmt.Printf("Client-side errors (no HTTP response): %d\n", cnt)
		} else {
			fmt.Printf("%d : %d\n", code, cnt)
		}
	}
	mu.Unlock()
}


### proxy/sanitize_cors.go
package proxy

import (
	"strings"
)

func isTokenChar(r rune) bool {
	switch {
	case r >= 'a' && r <= 'z':
	case r >= 'A' && r <= 'Z':
	case r >= '0' && r <= '9':
	case strings.ContainsRune("!#$%&'*+-.^_`|~", r):
	default:
		return false
	}
	return true
}

func SanitizeAccessControlRequestHeaderValues(headerValues string) string {
	parts := strings.Split(headerValues, ",")
	valid := make([]string, 0, len(parts))

	for _, p := range parts {
		v := strings.TrimSpace(p)
		if v == "" {
			continue
		}

		validPart := true
		for _, c := range v {
			if !isTokenChar(c) {
				validPart = false
				break
			}
		}

		if validPart {
			valid = append(valid, v)
		}
	}

	return strings.Join(valid, ", ")
}


### proxy/logMonitor_test.go
package proxy

import (
	"bytes"
	"io"
	"strings"
	"sync"
	"testing"
	"time"
)

func TestLogMonitor(t *testing.T) {
	logMonitor := NewLogMonitorWriter(io.Discard)

	// A WaitGroup is used to wait for all the expected writes to complete
	var wg sync.WaitGroup

	client1Messages := make([]byte, 0)
	client2Messages := make([]byte, 0)

	defer logMonitor.OnLogData(func(data []byte) {
		client1Messages = append(client1Messages, data...)
		wg.Done()
	})()

	defer logMonitor.OnLogData(func(data []byte) {
		client2Messages = append(client2Messages, data...)
		wg.Done()
	})()

	wg.Add(6) // 2 x 3 writes

	logMonitor.Write([]byte("1"))
	logMonitor.Write([]byte("2"))
	logMonitor.Write([]byte("3"))

	// wait for all writes to complete
	wg.Wait()

	// Check the buffer
	expectedHistory := "123"
	history := string(logMonitor.GetHistory())

	if history != expectedHistory {
		t.Errorf("Expected history: %s, got: %s", expectedHistory, history)
	}

	c1Data := string(client1Messages)
	if c1Data != expectedHistory {
		t.Errorf("Client1 expected %s, got: %s", expectedHistory, c1Data)
	}

	c2Data := string(client2Messages)
	if c2Data != expectedHistory {
		t.Errorf("Client2 expected %s, got: %s", expectedHistory, c2Data)
	}
}

func TestWrite_ImmutableBuffer(t *testing.T) {
	// Create a new LogMonitor instance
	lm := NewLogMonitorWriter(io.Discard)

	// Prepare a message to write
	msg := []byte("Hello, World!")
	lenmsg := len(msg)

	// Write the message to the LogMonitor
	n, err := lm.Write(msg)
	if err != nil {
		t.Fatalf("Write failed: %v", err)
	}

	if n != lenmsg {
		t.Errorf("Expected %d bytes written but got %d", lenmsg, n)
	}

	// Change the original message
	msg[0] = 'B' // This should not affect the buffer

	// Get the history from the LogMonitor
	history := lm.GetHistory()

	// Check that the history contains the original message, not the modified one
	expected := []byte("Hello, World!")
	if !bytes.Equal(history, expected) {
		t.Errorf("Expected history to be %q, got %q", expected, history)
	}
}

func TestWrite_LogTimeFormat(t *testing.T) {
	// Create a new LogMonitor instance
	lm := NewLogMonitorWriter(io.Discard)

	// Enable timestamps
	lm.timeFormat = time.RFC3339

	// Write the message to the LogMonitor
	lm.Info("Hello, World!")

	// Get the history from the LogMonitor
	history := lm.GetHistory()

	timestamp := ""
	fields := strings.Fields(string(history))
	if len(fields) > 0 {
		timestamp = fields[0]
	} else {
		t.Fatalf("Cannot extract string from history")
	}

	_, err := time.Parse(time.RFC3339, timestamp)
	if err != nil {
		t.Fatalf("Cannot find timestamp: %v", err)
	}
}


### proxy/proxymanager_test.go
package proxy

import (
	"bytes"
	"context"
	"encoding/json"
	"fmt"
	"math/rand"
	"mime/multipart"
	"net/http"
	"net/http/httptest"
	"strconv"
	"strings"
	"sync"
	"testing"
	"time"

	"github.com/mostlygeek/llama-swap/event"
	"github.com/mostlygeek/llama-swap/proxy/config"
	"github.com/stretchr/testify/assert"
	"github.com/tidwall/gjson"
)

// TestResponseRecorder adds CloseNotify to httptest.ResponseRecorder.
// "If you want to write your own tests around streams you will need a Recorder that can handle CloseNotifier."
// The tests can panic otherwise:
// panic: interface conversion: *httptest.ResponseRecorder is not http.CloseNotifier: missing method CloseNotify
// See: https://github.com/gin-gonic/gin/issues/1815
// TestResponseRecorder is taken from gin's own tests: https://github.com/gin-gonic/gin/blob/ce20f107f5dc498ec7489d7739541a25dcd48463/context_test.go#L1747-L1765
type TestResponseRecorder struct {
	*httptest.ResponseRecorder
	closeChannel chan bool
}

func (r *TestResponseRecorder) CloseNotify() <-chan bool {
	return r.closeChannel
}

func (r *TestResponseRecorder) closeClient() {
	r.closeChannel <- true
}

func CreateTestResponseRecorder() *TestResponseRecorder {
	return &TestResponseRecorder{
		httptest.NewRecorder(),
		make(chan bool, 1),
	}
}

func TestProxyManager_SwapProcessCorrectly(t *testing.T) {
	config := config.AddDefaultGroupToConfig(config.Config{
		HealthCheckTimeout: 15,
		Models: map[string]config.ModelConfig{
			"model1": getTestSimpleResponderConfig("model1"),
			"model2": getTestSimpleResponderConfig("model2"),
		},
		LogLevel: "error",
	})

	proxy := New(config)
	defer proxy.StopProcesses(StopWaitForInflightRequest)

	for _, modelName := range []string{"model1", "model2"} {
		reqBody := fmt.Sprintf(`{"model":"%s"}`, modelName)
		req := httptest.NewRequest("POST", "/v1/chat/completions", bytes.NewBufferString(reqBody))
		w := CreateTestResponseRecorder()

		proxy.ServeHTTP(w, req)
		assert.Equal(t, http.StatusOK, w.Code)
		assert.Contains(t, w.Body.String(), modelName)
	}
}
func TestProxyManager_SwapMultiProcess(t *testing.T) {
	config := config.AddDefaultGroupToConfig(config.Config{
		HealthCheckTimeout: 15,
		Models: map[string]config.ModelConfig{
			"model1": getTestSimpleResponderConfig("model1"),
			"model2": getTestSimpleResponderConfig("model2"),
		},
		LogLevel: "error",
		Groups: map[string]config.GroupConfig{
			"G1": {
				Swap:      true,
				Exclusive: false,
				Members:   []string{"model1"},
			},
			"G2": {
				Swap:      true,
				Exclusive: false,
				Members:   []string{"model2"},
			},
		},
	})

	proxy := New(config)
	defer proxy.StopProcesses(StopWaitForInflightRequest)

	tests := []string{"model1", "model2"}
	for _, requestedModel := range tests {
		t.Run(requestedModel, func(t *testing.T) {
			reqBody := fmt.Sprintf(`{"model":"%s"}`, requestedModel)
			req := httptest.NewRequest("POST", "/v1/chat/completions", bytes.NewBufferString(reqBody))
			w := CreateTestResponseRecorder()

			proxy.ServeHTTP(w, req)
			assert.Equal(t, http.StatusOK, w.Code)
			assert.Contains(t, w.Body.String(), requestedModel)
		})
	}

	// make sure there's two loaded models
	assert.Equal(t, proxy.findGroupByModelName("model1").processes["model1"].CurrentState(), StateReady)
	assert.Equal(t, proxy.findGroupByModelName("model2").processes["model2"].CurrentState(), StateReady)
}

// Test that a persistent group is not affected by the swapping behaviour of
// other groups.
func TestProxyManager_PersistentGroupsAreNotSwapped(t *testing.T) {
	config := config.AddDefaultGroupToConfig(config.Config{
		HealthCheckTimeout: 15,
		Models: map[string]config.ModelConfig{
			"model1": getTestSimpleResponderConfig("model1"), // goes into the default group
			"model2": getTestSimpleResponderConfig("model2"),
		},
		LogLevel: "error",
		Groups: map[string]config.GroupConfig{
			// the forever group is persistent and should not be affected by model1
			"forever": {
				Swap:       true,
				Exclusive:  false,
				Persistent: true,
				Members:    []string{"model2"},
			},
		},
	})

	proxy := New(config)
	defer proxy.StopProcesses(StopWaitForInflightRequest)

	// make requests to load all models, loading model1 should not affect model2
	tests := []string{"model2", "model1"}
	for _, requestedModel := range tests {
		reqBody := fmt.Sprintf(`{"model":"%s"}`, requestedModel)
		req := httptest.NewRequest("POST", "/v1/chat/completions", bytes.NewBufferString(reqBody))
		w := CreateTestResponseRecorder()

		proxy.ServeHTTP(w, req)
		assert.Equal(t, http.StatusOK, w.Code)
		assert.Contains(t, w.Body.String(), requestedModel)
	}

	assert.Equal(t, proxy.findGroupByModelName("model2").processes["model2"].CurrentState(), StateReady)
	assert.Equal(t, proxy.findGroupByModelName("model1").processes["model1"].CurrentState(), StateReady)
}

// When a request for a different model comes in ProxyManager should wait until
// the first request is complete before swapping. Both requests should complete
func TestProxyManager_SwapMultiProcessParallelRequests(t *testing.T) {
	if testing.Short() {
		t.Skip("skipping slow test")
	}

	config := config.AddDefaultGroupToConfig(config.Config{
		HealthCheckTimeout: 15,
		Models: map[string]config.ModelConfig{
			"model1": getTestSimpleResponderConfig("model1"),
			"model2": getTestSimpleResponderConfig("model2"),
			"model3": getTestSimpleResponderConfig("model3"),
		},
		LogLevel: "error",
	})

	proxy := New(config)
	defer proxy.StopProcesses(StopWaitForInflightRequest)

	results := map[string]string{}

	var wg sync.WaitGroup
	var mu sync.Mutex

	for key := range config.Models {
		wg.Add(1)
		go func(key string) {
			defer wg.Done()

			reqBody := fmt.Sprintf(`{"model":"%s"}`, key)
			req := httptest.NewRequest("POST", "/v1/chat/completions?wait=1000ms", bytes.NewBufferString(reqBody))
			w := CreateTestResponseRecorder()

			proxy.ServeHTTP(w, req)

			if w.Code != http.StatusOK {
				t.Errorf("Expected status OK, got %d for key %s", w.Code, key)
			}

			mu.Lock()
			var response map[string]interface{}
			assert.NoError(t, json.Unmarshal(w.Body.Bytes(), &response))
			result, ok := response["responseMessage"].(string)
			assert.Equal(t, ok, true)
			results[key] = result
			mu.Unlock()
		}(key)

		<-time.After(time.Millisecond)
	}

	wg.Wait()
	assert.Len(t, results, len(config.Models))

	for key, result := range results {
		assert.Equal(t, key, result)
	}
}

func TestProxyManager_ListModelsHandler(t *testing.T) {

	model1Config := getTestSimpleResponderConfig("model1")
	model1Config.Name = "Model 1"
	model1Config.Description = "Model 1 description is used for testing"

	model2Config := getTestSimpleResponderConfig("model2")
	model2Config.Name = "     " // empty whitespace only strings will get ignored
	model2Config.Description = "  "

	config := config.Config{
		HealthCheckTimeout: 15,
		Models: map[string]config.ModelConfig{
			"model1": model1Config,
			"model2": model2Config,
			"model3": getTestSimpleResponderConfig("model3"),
		},
		LogLevel: "error",
	}

	proxy := New(config)

	// Create a test request
	req := httptest.NewRequest("GET", "/v1/models", nil)
	req.Header.Add("Origin", "i-am-the-origin")
	w := CreateTestResponseRecorder()

	// Call the listModelsHandler
	proxy.ServeHTTP(w, req)

	// Check the response status code
	assert.Equal(t, http.StatusOK, w.Code)

	// Check for Access-Control-Allow-Origin
	assert.Equal(t, req.Header.Get("Origin"), w.Result().Header.Get("Access-Control-Allow-Origin"))

	// Parse the JSON response
	var response struct {
		Data []map[string]interface{} `json:"data"`
	}

	if err := json.Unmarshal(w.Body.Bytes(), &response); err != nil {
		t.Fatalf("Failed to parse JSON response: %v", err)
	}

	// Check the number of models returned
	assert.Len(t, response.Data, 3)

	// Check the details of each model
	expectedModels := map[string]struct{}{
		"model1": {},
		"model2": {},
		"model3": {},
	}

	// make all models
	for _, model := range response.Data {
		modelID, ok := model["id"].(string)
		assert.True(t, ok, "model ID should be a string")
		_, exists := expectedModels[modelID]
		assert.True(t, exists, "unexpected model ID: %s", modelID)
		delete(expectedModels, modelID)

		object, ok := model["object"].(string)
		assert.True(t, ok, "object should be a string")
		assert.Equal(t, "model", object)

		created, ok := model["created"].(float64)
		assert.True(t, ok, "created should be a number")
		assert.Greater(t, created, float64(0)) // Assuming the timestamp is positive

		ownedBy, ok := model["owned_by"].(string)
		assert.True(t, ok, "owned_by should be a string")
		assert.Equal(t, "llama-swap", ownedBy)

		// check for optional name and description
		if modelID == "model1" {
			name, ok := model["name"].(string)
			assert.True(t, ok, "name should be a string")
			assert.Equal(t, "Model 1", name)
			description, ok := model["description"].(string)
			assert.True(t, ok, "description should be a string")
			assert.Equal(t, "Model 1 description is used for testing", description)
		} else {
			_, exists := model["name"]
			assert.False(t, exists, "unexpected name field for model: %s", modelID)
			_, exists = model["description"]
			assert.False(t, exists, "unexpected description field for model: %s", modelID)
		}
	}

	// Ensure all expected models were returned
	assert.Empty(t, expectedModels, "not all expected models were returned")
}

func TestProxyManager_ListModelsHandler_WithMetadata(t *testing.T) {
	// Process config through LoadConfigFromReader to apply macro substitution
	configYaml := `
healthCheckTimeout: 15
logLevel: error
startPort: 10000
models:
  model1:
    cmd: /path/to/server -p ${PORT}
    macros:
      PORT_NUM: 10001
      TEMP: 0.7
      NAME: "llama"
    metadata:
      port: ${PORT_NUM}
      temperature: ${TEMP}
      enabled: true
      note: "Running on port ${PORT_NUM}"
      nested:
        value: ${TEMP}
  model2:
    cmd: /path/to/server -p ${PORT}
`
	processedConfig, err := config.LoadConfigFromReader(strings.NewReader(configYaml))
	assert.NoError(t, err)

	proxy := New(processedConfig)

	req := httptest.NewRequest("GET", "/v1/models", nil)
	w := CreateTestResponseRecorder()
	proxy.ServeHTTP(w, req)

	assert.Equal(t, http.StatusOK, w.Code)

	var response struct {
		Data []map[string]any `json:"data"`
	}

	err = json.Unmarshal(w.Body.Bytes(), &response)
	assert.NoError(t, err)
	assert.Len(t, response.Data, 2)

	// Find model1 and model2 in response
	var model1Data, model2Data map[string]any
	for _, model := range response.Data {
		if model["id"] == "model1" {
			model1Data = model
		} else if model["id"] == "model2" {
			model2Data = model
		}
	}

	// Verify model1 has llamaswap_meta
	assert.NotNil(t, model1Data)
	meta, exists := model1Data["meta"]
	if !assert.True(t, exists, "model1 should have meta key") {
		t.FailNow()
	}

	metaMap := meta.(map[string]any)

	lsmeta, exists := metaMap["llamaswap"]
	if !assert.True(t, exists, "model1 should have meta.llamaswap key") {
		t.FailNow()
	}

	lsmetamap := lsmeta.(map[string]any)

	// Verify type preservation
	assert.Equal(t, float64(10001), lsmetamap["port"]) // JSON numbers are float64
	assert.Equal(t, 0.7, lsmetamap["temperature"])
	assert.Equal(t, true, lsmetamap["enabled"])
	// Verify string interpolation
	assert.Equal(t, "Running on port 10001", lsmetamap["note"])
	// Verify nested structure
	nested := lsmetamap["nested"].(map[string]any)
	assert.Equal(t, 0.7, nested["value"])

	// Verify model2 does NOT have llamaswap_meta
	assert.NotNil(t, model2Data)
	_, exists = model2Data["llamaswap_meta"]
	assert.False(t, exists, "model2 should not have llamaswap_meta")
}

func TestProxyManager_ListModelsHandler_SortedByID(t *testing.T) {
	// Intentionally add models in non-sorted order and with an unlisted model
	config := config.Config{
		HealthCheckTimeout: 15,
		Models: map[string]config.ModelConfig{
			"zeta":  getTestSimpleResponderConfig("zeta"),
			"alpha": getTestSimpleResponderConfig("alpha"),
			"beta":  getTestSimpleResponderConfig("beta"),
			"hidden": func() config.ModelConfig {
				mc := getTestSimpleResponderConfig("hidden")
				mc.Unlisted = true
				return mc
			}(),
		},
		LogLevel: "error",
	}

	proxy := New(config)

	// Request models list
	req := httptest.NewRequest("GET", "/v1/models", nil)
	w := CreateTestResponseRecorder()
	proxy.ServeHTTP(w, req)

	assert.Equal(t, http.StatusOK, w.Code)

	var response struct {
		Data []map[string]interface{} `json:"data"`
	}
	if err := json.Unmarshal(w.Body.Bytes(), &response); err != nil {
		t.Fatalf("Failed to parse JSON response: %v", err)
	}

	// We expect only the listed models in sorted order by id
	expectedOrder := []string{"alpha", "beta", "zeta"}
	if assert.Len(t, response.Data, len(expectedOrder), "unexpected number of listed models") {
		got := make([]string, 0, len(response.Data))
		for _, m := range response.Data {
			id, _ := m["id"].(string)
			got = append(got, id)
		}
		assert.Equal(t, expectedOrder, got, "models should be sorted by id ascending")
	}
}

func TestProxyManager_ListModelsHandler_IncludeAliasesInList(t *testing.T) {
	// Configure alias
	config := config.Config{
		HealthCheckTimeout:   15,
		IncludeAliasesInList: true,
		Models: map[string]config.ModelConfig{
			"model1": func() config.ModelConfig {
				mc := getTestSimpleResponderConfig("model1")
				mc.Name = "Model 1"
				mc.Aliases = []string{"alias1"}
				return mc
			}(),
		},
		LogLevel: "error",
	}

	proxy := New(config)

	// Request models list
	req := httptest.NewRequest("GET", "/v1/models", nil)
	w := CreateTestResponseRecorder()
	proxy.ServeHTTP(w, req)

	assert.Equal(t, http.StatusOK, w.Code)

	var response struct {
		Data []map[string]interface{} `json:"data"`
	}
	if err := json.Unmarshal(w.Body.Bytes(), &response); err != nil {
		t.Fatalf("Failed to parse JSON response: %v", err)
	}

	// We expect both base id and alias
	var model1Data, alias1Data map[string]any
	for _, model := range response.Data {
		if model["id"] == "model1" {
			model1Data = model
		} else if model["id"] == "alias1" {
			alias1Data = model
		}
	}

	// Verify model1 has name
	assert.NotNil(t, model1Data)
	_, exists := model1Data["name"]
	if !assert.True(t, exists, "model1 should have name key") {
		t.FailNow()
	}
	name1, ok := model1Data["name"].(string)
	assert.True(t, ok, "name1 should be a string")

	// Verify alias1 has name
	assert.NotNil(t, alias1Data)
	_, exists = alias1Data["name"]
	if !assert.True(t, exists, "alias1 should have name key") {
		t.FailNow()
	}
	name2, ok := alias1Data["name"].(string)
	assert.True(t, ok, "name2 should be a string")

	// Name keys should match
	assert.Equal(t, name1, name2)
}

func TestProxyManager_Shutdown(t *testing.T) {
	// make broken model configurations
	model1Config := getTestSimpleResponderConfigPort("model1", 9991)
	model1Config.Proxy = "http://localhost:10001/"

	model2Config := getTestSimpleResponderConfigPort("model2", 9992)
	model2Config.Proxy = "http://localhost:10002/"

	model3Config := getTestSimpleResponderConfigPort("model3", 9993)
	model3Config.Proxy = "http://localhost:10003/"

	config := config.AddDefaultGroupToConfig(config.Config{
		HealthCheckTimeout: 15,
		Models: map[string]config.ModelConfig{
			"model1": model1Config,
			"model2": model2Config,
			"model3": model3Config,
		},
		LogLevel: "error",
		Groups: map[string]config.GroupConfig{
			"test": {
				Swap:    false,
				Members: []string{"model1", "model2", "model3"},
			},
		},
	})

	proxy := New(config)

	// Start all the processes
	var wg sync.WaitGroup
	for _, modelName := range []string{"model1", "model2", "model3"} {
		wg.Add(1)
		go func(modelName string) {
			defer wg.Done()
			reqBody := fmt.Sprintf(`{"model":"%s"}`, modelName)
			req := httptest.NewRequest("POST", "/v1/chat/completions", bytes.NewBufferString(reqBody))
			w := CreateTestResponseRecorder()

			// send a request to trigger the proxy to load ... this should hang waiting for start up
			proxy.ServeHTTP(w, req)
			assert.Equal(t, http.StatusBadGateway, w.Code)
			assert.Contains(t, w.Body.String(), "health check interrupted due to shutdown")
		}(modelName)
	}

	go func() {
		<-time.After(time.Second)
		proxy.Shutdown()
	}()
	wg.Wait()
}

func TestProxyManager_Unload(t *testing.T) {
	conf := config.AddDefaultGroupToConfig(config.Config{
		HealthCheckTimeout: 15,
		Models: map[string]config.ModelConfig{
			"model1": getTestSimpleResponderConfig("model1"),
		},
		LogLevel: "error",
	})

	proxy := New(conf)
	reqBody := fmt.Sprintf(`{"model":"%s"}`, "model1")
	req := httptest.NewRequest("POST", "/v1/chat/completions", bytes.NewBufferString(reqBody))
	w := CreateTestResponseRecorder()
	proxy.ServeHTTP(w, req)

	assert.Equal(t, proxy.processGroups[config.DEFAULT_GROUP_ID].processes["model1"].CurrentState(), StateReady)
	req = httptest.NewRequest("GET", "/unload", nil)
	w = CreateTestResponseRecorder()
	proxy.ServeHTTP(w, req)
	assert.Equal(t, http.StatusOK, w.Code)
	assert.Equal(t, w.Body.String(), "OK")

	select {
	case <-proxy.processGroups[config.DEFAULT_GROUP_ID].processes["model1"].cmdWaitChan:
		// good
	case <-time.After(2 * time.Second):
		t.Fatal("timeout waiting for model1 to stop")
	}
	assert.Equal(t, proxy.processGroups[config.DEFAULT_GROUP_ID].processes["model1"].CurrentState(), StateStopped)
}

func TestProxyManager_UnloadSingleModel(t *testing.T) {
	const testGroupId = "testGroup"
	config := config.AddDefaultGroupToConfig(config.Config{
		HealthCheckTimeout: 15,
		Models: map[string]config.ModelConfig{
			"model1": getTestSimpleResponderConfig("model1"),
			"model2": getTestSimpleResponderConfig("model2"),
		},
		Groups: map[string]config.GroupConfig{
			testGroupId: {
				Swap:    false,
				Members: []string{"model1", "model2"},
			},
		},
		LogLevel: "error",
	})

	proxy := New(config)
	defer proxy.StopProcesses(StopImmediately)

	// start both model
	for _, modelName := range []string{"model1", "model2"} {
		reqBody := fmt.Sprintf(`{"model":"%s"}`, modelName)
		req := httptest.NewRequest("POST", "/v1/chat/completions", bytes.NewBufferString(reqBody))
		w := CreateTestResponseRecorder()
		proxy.ServeHTTP(w, req)
	}

	assert.Equal(t, StateReady, proxy.processGroups[testGroupId].processes["model1"].CurrentState())
	assert.Equal(t, StateReady, proxy.processGroups[testGroupId].processes["model2"].CurrentState())

	req := httptest.NewRequest("POST", "/api/models/unload/model1", nil)
	w := CreateTestResponseRecorder()
	proxy.ServeHTTP(w, req)
	assert.Equal(t, http.StatusOK, w.Code)
	if !assert.Equal(t, w.Body.String(), "OK") {
		t.FailNow()
	}

	select {
	case <-proxy.processGroups[testGroupId].processes["model1"].cmdWaitChan:
		// good
	case <-time.After(2 * time.Second):
		t.Fatal("timeout waiting for model1 to stop")
	}

	assert.Equal(t, proxy.processGroups[testGroupId].processes["model1"].CurrentState(), StateStopped)
	assert.Equal(t, proxy.processGroups[testGroupId].processes["model2"].CurrentState(), StateReady)
}

// Test issue #61 `Listing the current list of models and the loaded model.`
func TestProxyManager_RunningEndpoint(t *testing.T) {
	// Shared configuration
	config := config.AddDefaultGroupToConfig(config.Config{
		HealthCheckTimeout: 15,
		Models: map[string]config.ModelConfig{
			"model1": getTestSimpleResponderConfig("model1"),
			"model2": getTestSimpleResponderConfig("model2"),
		},
		LogLevel: "warn",
	})

	// Define a helper struct to parse the JSON response.
	type RunningResponse struct {
		Running []struct {
			Model string `json:"model"`
			State string `json:"state"`
		} `json:"running"`
	}

	// Create proxy once for all tests
	proxy := New(config)
	defer proxy.StopProcesses(StopWaitForInflightRequest)

	t.Run("no models loaded", func(t *testing.T) {
		req := httptest.NewRequest("GET", "/running", nil)
		w := CreateTestResponseRecorder()
		proxy.ServeHTTP(w, req)

		assert.Equal(t, http.StatusOK, w.Code)

		var response RunningResponse

		// Check if this is a valid JSON object.
		assert.NoError(t, json.Unmarshal(w.Body.Bytes(), &response))

		// We should have an empty running array here.
		assert.Empty(t, response.Running, "expected no running models")
	})

	t.Run("single model loaded", func(t *testing.T) {
		// Load just a model.
		reqBody := `{"model":"model1"}`
		req := httptest.NewRequest("POST", "/v1/chat/completions", bytes.NewBufferString(reqBody))
		w := CreateTestResponseRecorder()
		proxy.ServeHTTP(w, req)
		assert.Equal(t, http.StatusOK, w.Code)

		// Simulate browser call for the `/running` endpoint.
		req = httptest.NewRequest("GET", "/running", nil)
		w = CreateTestResponseRecorder()
		proxy.ServeHTTP(w, req)

		var response RunningResponse
		assert.NoError(t, json.Unmarshal(w.Body.Bytes(), &response))

		// Check if we have a single array element.
		assert.Len(t, response.Running, 1)

		// Is this the right model?
		assert.Equal(t, "model1", response.Running[0].Model)

		// Is the model loaded?
		assert.Equal(t, "ready", response.Running[0].State)
	})
}

func TestProxyManager_AudioTranscriptionHandler(t *testing.T) {
	config := config.AddDefaultGroupToConfig(config.Config{
		HealthCheckTimeout: 15,
		Models: map[string]config.ModelConfig{
			"TheExpectedModel": getTestSimpleResponderConfig("TheExpectedModel"),
		},
		LogLevel: "error",
	})

	proxy := New(config)
	defer proxy.StopProcesses(StopWaitForInflightRequest)

	// Create a buffer with multipart form data
	var b bytes.Buffer
	w := multipart.NewWriter(&b)

	// Add the model field
	fw, err := w.CreateFormField("model")
	assert.NoError(t, err)
	_, err = fw.Write([]byte("TheExpectedModel"))
	assert.NoError(t, err)

	// Add a file field
	fw, err = w.CreateFormFile("file", "test.mp3")
	assert.NoError(t, err)
	// Generate random content length between 10 and 20
	contentLength := rand.Intn(11) + 10 // 10 to 20
	content := make([]byte, contentLength)
	_, err = fw.Write(content)
	assert.NoError(t, err)
	w.Close()

	// Create the request with the multipart form data
	req := httptest.NewRequest("POST", "/v1/audio/transcriptions", &b)
	req.Header.Set("Content-Type", w.FormDataContentType())
	rec := CreateTestResponseRecorder()
	proxy.ServeHTTP(rec, req)

	// Verify the response
	assert.Equal(t, http.StatusOK, rec.Code)
	var response map[string]string
	err = json.Unmarshal(rec.Body.Bytes(), &response)
	assert.NoError(t, err)
	assert.Equal(t, "TheExpectedModel", response["model"])
	assert.Equal(t, response["text"], fmt.Sprintf("The length of the file is %d bytes", contentLength)) // matches simple-responder
	assert.Equal(t, strconv.Itoa(370+contentLength), response["h_content_length"])
}

// Test useModelName in configuration sends overrides what is sent to upstream
func TestProxyManager_UseModelName(t *testing.T) {
	upstreamModelName := "upstreamModel"
	modelConfig := getTestSimpleResponderConfig(upstreamModelName)
	modelConfig.UseModelName = upstreamModelName

	conf := config.AddDefaultGroupToConfig(config.Config{
		HealthCheckTimeout: 15,
		Models: map[string]config.ModelConfig{
			"model1": modelConfig,
		},
		LogLevel: "error",
	})

	proxy := New(conf)
	defer proxy.StopProcesses(StopWaitForInflightRequest)

	requestedModel := "model1"

	t.Run("useModelName over rides requested model: /v1/chat/completions", func(t *testing.T) {
		reqBody := fmt.Sprintf(`{"model":"%s"}`, requestedModel)
		req := httptest.NewRequest("POST", "/v1/chat/completions", bytes.NewBufferString(reqBody))
		w := CreateTestResponseRecorder()

		proxy.ServeHTTP(w, req)
		assert.Equal(t, http.StatusOK, w.Code)
		assert.Contains(t, w.Body.String(), upstreamModelName)

		// make sure the content length was set correctly
		// simple-responder will return the content length it got in the response
		body := w.Body.Bytes()
		contentLength := int(gjson.GetBytes(body, "h_content_length").Int())
		assert.Equal(t, len(fmt.Sprintf(`{"model":"%s"}`, upstreamModelName)), contentLength)
	})

	t.Run("useModelName over rides requested model: /v1/audio/transcriptions", func(t *testing.T) {
		// Create a buffer with multipart form data
		var b bytes.Buffer
		w := multipart.NewWriter(&b)

		// Add the model field
		fw, err := w.CreateFormField("model")
		assert.NoError(t, err)
		_, err = fw.Write([]byte(requestedModel))
		assert.NoError(t, err)

		// Add a file field
		fw, err = w.CreateFormFile("file", "test.mp3")
		assert.NoError(t, err)
		_, err = fw.Write([]byte("test"))
		assert.NoError(t, err)
		w.Close()

		// Create the request with the multipart form data
		req := httptest.NewRequest("POST", "/v1/audio/transcriptions", &b)
		req.Header.Set("Content-Type", w.FormDataContentType())
		rec := CreateTestResponseRecorder()
		proxy.ServeHTTP(rec, req)

		// Verify the response
		assert.Equal(t, http.StatusOK, rec.Code)
		var response map[string]string
		err = json.Unmarshal(rec.Body.Bytes(), &response)
		assert.NoError(t, err)
		assert.Equal(t, upstreamModelName, response["model"])
	})
}

func TestProxyManager_CORSOptionsHandler(t *testing.T) {
	config := config.AddDefaultGroupToConfig(config.Config{
		HealthCheckTimeout: 15,
		Models: map[string]config.ModelConfig{
			"model1": getTestSimpleResponderConfig("model1"),
		},
		LogLevel: "error",
	})

	tests := []struct {
		name            string
		method          string
		requestHeaders  map[string]string
		expectedStatus  int
		expectedHeaders map[string]string
	}{
		{
			name:           "OPTIONS with no headers",
			method:         "OPTIONS",
			expectedStatus: http.StatusNoContent,
			expectedHeaders: map[string]string{
				"Access-Control-Allow-Origin":  "*",
				"Access-Control-Allow-Methods": "GET, POST, PUT, PATCH, DELETE, OPTIONS",
				"Access-Control-Allow-Headers": "Content-Type, Authorization, Accept, X-Requested-With",
			},
		},
		{
			name:   "OPTIONS with specific headers",
			method: "OPTIONS",
			requestHeaders: map[string]string{
				"Access-Control-Request-Headers": "X-Custom-Header, Some-Other-Header",
			},
			expectedStatus: http.StatusNoContent,
			expectedHeaders: map[string]string{
				"Access-Control-Allow-Origin":  "*",
				"Access-Control-Allow-Methods": "GET, POST, PUT, PATCH, DELETE, OPTIONS",
				"Access-Control-Allow-Headers": "X-Custom-Header, Some-Other-Header",
			},
		},
		{
			name:           "Non-OPTIONS request",
			method:         "GET",
			expectedStatus: http.StatusNotFound, // Since we don't have a GET route defined
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			proxy := New(config)
			defer proxy.StopProcesses(StopWaitForInflightRequest)

			req := httptest.NewRequest(tt.method, "/v1/chat/completions", nil)
			for k, v := range tt.requestHeaders {
				req.Header.Set(k, v)
			}

			w := CreateTestResponseRecorder()
			proxy.ServeHTTP(w, req)

			assert.Equal(t, tt.expectedStatus, w.Code)

			for header, expectedValue := range tt.expectedHeaders {
				assert.Equal(t, expectedValue, w.Header().Get(header))
			}
		})
	}
}

func TestProxyManager_Upstream(t *testing.T) {
	configStr := fmt.Sprintf(`
logLevel: error
models:
  model1:
    cmd: %s -port ${PORT} -silent -respond model1
    aliases: [model-alias]
`, getSimpleResponderPath())

	config, err := config.LoadConfigFromReader(strings.NewReader(configStr))
	assert.NoError(t, err)

	proxy := New(config)
	defer proxy.StopProcesses(StopWaitForInflightRequest)
	t.Run("main model name", func(t *testing.T) {
		req := httptest.NewRequest("GET", "/upstream/model1/test", nil)
		rec := CreateTestResponseRecorder()
		proxy.ServeHTTP(rec, req)
		assert.Equal(t, http.StatusOK, rec.Code)
		assert.Equal(t, "model1", rec.Body.String())
	})

	t.Run("model alias", func(t *testing.T) {
		req := httptest.NewRequest("GET", "/upstream/model-alias/test", nil)
		rec := CreateTestResponseRecorder()
		proxy.ServeHTTP(rec, req)
		assert.Equal(t, http.StatusOK, rec.Code)
		assert.Equal(t, "model1", rec.Body.String())
	})
}

func TestProxyManager_ChatContentLength(t *testing.T) {
	config := config.AddDefaultGroupToConfig(config.Config{
		HealthCheckTimeout: 15,
		Models: map[string]config.ModelConfig{
			"model1": getTestSimpleResponderConfig("model1"),
		},
		LogLevel: "error",
	})

	proxy := New(config)
	defer proxy.StopProcesses(StopWaitForInflightRequest)

	reqBody := fmt.Sprintf(`{"model":"%s", "x": "this is just some content to push the length out a bit"}`, "model1")
	req := httptest.NewRequest("POST", "/v1/chat/completions", bytes.NewBufferString(reqBody))
	w := CreateTestResponseRecorder()

	proxy.ServeHTTP(w, req)
	assert.Equal(t, http.StatusOK, w.Code)
	var response map[string]interface{}
	assert.NoError(t, json.Unmarshal(w.Body.Bytes(), &response))
	assert.Equal(t, "81", response["h_content_length"])
	assert.Equal(t, "model1", response["responseMessage"])
}

func TestProxyManager_FiltersStripParams(t *testing.T) {
	modelConfig := getTestSimpleResponderConfig("model1")
	modelConfig.Filters = config.ModelFilters{
		StripParams: "temperature, model, stream",
	}

	config := config.AddDefaultGroupToConfig(config.Config{
		HealthCheckTimeout: 15,
		LogLevel:           "error",
		Models: map[string]config.ModelConfig{
			"model1": modelConfig,
		},
	})

	proxy := New(config)
	defer proxy.StopProcesses(StopWaitForInflightRequest)
	reqBody := `{"model":"model1", "temperature":0.1, "x_param":"123", "y_param":"abc", "stream":true}`
	req := httptest.NewRequest("POST", "/v1/chat/completions", bytes.NewBufferString(reqBody))
	w := CreateTestResponseRecorder()

	proxy.ServeHTTP(w, req)
	assert.Equal(t, http.StatusOK, w.Code)
	var response map[string]interface{}
	assert.NoError(t, json.Unmarshal(w.Body.Bytes(), &response))

	// `temperature` and `stream` are gone but model remains
	assert.Equal(t, `{"model":"model1", "x_param":"123", "y_param":"abc"}`, response["request_body"])

	// assert.Nil(t, response["temperature"])
	// assert.Equal(t, "123", response["x_param"])
	// assert.Equal(t, "abc", response["y_param"])
	// t.Logf("%v", response)
}

func TestProxyManager_HealthEndpoint(t *testing.T) {
	config := config.AddDefaultGroupToConfig(config.Config{
		HealthCheckTimeout: 15,
		Models: map[string]config.ModelConfig{
			"model1": getTestSimpleResponderConfig("model1"),
		},
		LogLevel: "error",
	})

	proxy := New(config)
	defer proxy.StopProcesses(StopWaitForInflightRequest)
	req := httptest.NewRequest("GET", "/health", nil)
	rec := CreateTestResponseRecorder()
	proxy.ServeHTTP(rec, req)
	assert.Equal(t, http.StatusOK, rec.Code)
	assert.Equal(t, "OK", rec.Body.String())
}

// Ensure the custom llama-server /completion endpoint proxies correctly
func TestProxyManager_CompletionEndpoint(t *testing.T) {
	config := config.AddDefaultGroupToConfig(config.Config{
		HealthCheckTimeout: 15,
		Models: map[string]config.ModelConfig{
			"model1": getTestSimpleResponderConfig("model1"),
		},
		LogLevel: "error",
	})

	proxy := New(config)
	defer proxy.StopProcesses(StopWaitForInflightRequest)

	reqBody := `{"model":"model1"}`
	req := httptest.NewRequest("POST", "/completion", bytes.NewBufferString(reqBody))
	w := CreateTestResponseRecorder()

	proxy.ServeHTTP(w, req)
	assert.Equal(t, http.StatusOK, w.Code)
	assert.Contains(t, w.Body.String(), "model1")
}

func TestProxyManager_StartupHooks(t *testing.T) {

	// using real YAML as the configuration has gotten more complex
	// is the right approach as LoadConfigFromReader() does a lot more
	// than parse YAML now. Eventually migrate all tests to use this approach
	configStr := strings.Replace(`
logLevel: error
hooks:
  on_startup:
    preload:
      - model1
      - model2
groups:
  preloadTestGroup:
    swap: false
    members:
       - model1
       - model2
models:
  model1:
    cmd: ${simpleresponderpath} --port ${PORT} --silent --respond model1
  model2:
      cmd: ${simpleresponderpath} --port ${PORT} --silent --respond model2
`, "${simpleresponderpath}", simpleResponderPath, -1)

	// Create a test model configuration
	config, err := config.LoadConfigFromReader(strings.NewReader(configStr))
	if !assert.NoError(t, err, "Invalid configuration") {
		return
	}

	preloadChan := make(chan ModelPreloadedEvent, 2) // buffer for 2 expected events

	unsub := event.On(func(e ModelPreloadedEvent) {
		preloadChan <- e
	})

	defer unsub()

	// Create the proxy which should trigger preloading
	proxy := New(config)
	defer proxy.StopProcesses(StopWaitForInflightRequest)

	for i := 0; i < 2; i++ {
		select {
		case <-preloadChan:
		case <-time.After(5 * time.Second):
			t.Fatal("timed out waiting for models to preload")
		}
	}
	// make sure they are both loaded
	_, foundGroup := proxy.processGroups["preloadTestGroup"]
	if !assert.True(t, foundGroup, "preloadTestGroup should exist") {
		return
	}
	assert.Equal(t, StateReady, proxy.processGroups["preloadTestGroup"].processes["model1"].CurrentState())
	assert.Equal(t, StateReady, proxy.processGroups["preloadTestGroup"].processes["model2"].CurrentState())
}

func TestProxyManager_StreamingEndpointsReturnNoBufferingHeader(t *testing.T) {
	config := config.AddDefaultGroupToConfig(config.Config{
		HealthCheckTimeout: 15,
		Models: map[string]config.ModelConfig{
			"model1": getTestSimpleResponderConfig("model1"),
		},
		LogLevel: "error",
	})

	proxy := New(config)
	defer proxy.StopProcesses(StopWaitForInflightRequest)

	endpoints := []string{
		"/api/events",
		"/logs/stream",
		"/logs/stream/proxy",
		"/logs/stream/upstream",
	}

	for _, endpoint := range endpoints {
		t.Run(endpoint, func(t *testing.T) {
			ctx, cancel := context.WithTimeout(context.Background(), 100*time.Millisecond)
			defer cancel()

			req := httptest.NewRequest("GET", endpoint, nil)
			req = req.WithContext(ctx)
			rec := CreateTestResponseRecorder()

			// Run handler in goroutine and wait for context timeout
			done := make(chan struct{})
			go func() {
				defer close(done)
				proxy.ServeHTTP(rec, req)
			}()

			// Wait for either the handler to complete or context to timeout
			<-ctx.Done()

			// At this point, the handler has either finished or been cancelled
			// Wait for the goroutine to fully exit before reading
			<-done

			// Now it's safe to read from rec - no more concurrent writes
			assert.Equal(t, http.StatusOK, rec.Code)
			assert.Equal(t, "no", rec.Header().Get("X-Accel-Buffering"))
		})
	}
}

func TestProxyManager_ProxiedStreamingEndpointReturnsNoBufferingHeader(t *testing.T) {
	config := config.AddDefaultGroupToConfig(config.Config{
		HealthCheckTimeout: 15,
		Models: map[string]config.ModelConfig{
			"streaming-model": getTestSimpleResponderConfig("streaming-model"),
		},
		LogLevel: "error",
	})

	proxy := New(config)
	defer proxy.StopProcesses(StopWaitForInflightRequest)

	// Make a streaming request
	reqBody := `{"model":"streaming-model"}`
	// simple-responder will return text/event-stream when stream=true is in the query
	req := httptest.NewRequest("POST", "/v1/chat/completions?stream=true", bytes.NewBufferString(reqBody))
	rec := CreateTestResponseRecorder()

	proxy.ServeHTTP(rec, req)

	assert.Equal(t, http.StatusOK, rec.Code)
	assert.Equal(t, "no", rec.Header().Get("X-Accel-Buffering"))
	assert.Contains(t, rec.Header().Get("Content-Type"), "text/event-stream")
}


### proxy/logMonitor.go
package proxy

import (
	"container/ring"
	"context"
	"fmt"
	"io"
	"os"
	"sync"
	"time"

	"github.com/mostlygeek/llama-swap/event"
)

type LogLevel int

const (
	LevelDebug LogLevel = iota
	LevelInfo
	LevelWarn
	LevelError
)

type LogMonitor struct {
	eventbus *event.Dispatcher
	mu       sync.RWMutex
	buffer   *ring.Ring
	bufferMu sync.RWMutex

	// typically this can be os.Stdout
	stdout io.Writer

	// logging levels
	level  LogLevel
	prefix string

	// timestamps
	timeFormat string
}

func NewLogMonitor() *LogMonitor {
	return NewLogMonitorWriter(os.Stdout)
}

func NewLogMonitorWriter(stdout io.Writer) *LogMonitor {
	return &LogMonitor{
		eventbus:   event.NewDispatcherConfig(1000),
		buffer:     ring.New(10 * 1024), // keep 10KB of buffered logs
		stdout:     stdout,
		level:      LevelInfo,
		prefix:     "",
		timeFormat: "",
	}
}

func (w *LogMonitor) Write(p []byte) (n int, err error) {
	if len(p) == 0 {
		return 0, nil
	}

	n, err = w.stdout.Write(p)
	if err != nil {
		return n, err
	}

	w.bufferMu.Lock()
	bufferCopy := make([]byte, len(p))
	copy(bufferCopy, p)
	w.buffer.Value = bufferCopy
	w.buffer = w.buffer.Next()
	w.bufferMu.Unlock()

	w.broadcast(bufferCopy)
	return n, nil
}

func (w *LogMonitor) GetHistory() []byte {
	w.bufferMu.RLock()
	defer w.bufferMu.RUnlock()

	var history []byte
	w.buffer.Do(func(p any) {
		if p != nil {
			if content, ok := p.([]byte); ok {
				history = append(history, content...)
			}
		}
	})
	return history
}

func (w *LogMonitor) OnLogData(callback func(data []byte)) context.CancelFunc {
	return event.Subscribe(w.eventbus, func(e LogDataEvent) {
		callback(e.Data)
	})
}

func (w *LogMonitor) broadcast(msg []byte) {
	event.Publish(w.eventbus, LogDataEvent{Data: msg})
}

func (w *LogMonitor) SetPrefix(prefix string) {
	w.mu.Lock()
	defer w.mu.Unlock()
	w.prefix = prefix
}

func (w *LogMonitor) SetLogLevel(level LogLevel) {
	w.mu.Lock()
	defer w.mu.Unlock()
	w.level = level
}

func (w *LogMonitor) SetLogTimeFormat(timeFormat string) {
	w.mu.Lock()
	defer w.mu.Unlock()
	w.timeFormat = timeFormat
}

func (w *LogMonitor) formatMessage(level string, msg string) []byte {
	prefix := ""
	if w.prefix != "" {
		prefix = fmt.Sprintf("[%s] ", w.prefix)
	}
	timestamp := ""
	if w.timeFormat != "" {
		timestamp = fmt.Sprintf("%s ", time.Now().Format(w.timeFormat))
	}
	return []byte(fmt.Sprintf("%s%s[%s] %s\n", timestamp, prefix, level, msg))
}

func (w *LogMonitor) log(level LogLevel, msg string) {
	if level < w.level {
		return
	}
	w.Write(w.formatMessage(level.String(), msg))
}

func (w *LogMonitor) Debug(msg string) {
	w.log(LevelDebug, msg)
}

func (w *LogMonitor) Info(msg string) {
	w.log(LevelInfo, msg)
}

func (w *LogMonitor) Warn(msg string) {
	w.log(LevelWarn, msg)
}

func (w *LogMonitor) Error(msg string) {
	w.log(LevelError, msg)
}

func (w *LogMonitor) Debugf(format string, args ...interface{}) {
	w.log(LevelDebug, fmt.Sprintf(format, args...))
}

func (w *LogMonitor) Infof(format string, args ...interface{}) {
	w.log(LevelInfo, fmt.Sprintf(format, args...))
}

func (w *LogMonitor) Warnf(format string, args ...interface{}) {
	w.log(LevelWarn, fmt.Sprintf(format, args...))
}

func (w *LogMonitor) Errorf(format string, args ...interface{}) {
	w.log(LevelError, fmt.Sprintf(format, args...))
}

func (l LogLevel) String() string {
	switch l {
	case LevelDebug:
		return "DEBUG"
	case LevelInfo:
		return "INFO"
	case LevelWarn:
		return "WARN"
	case LevelError:
		return "ERROR"
	default:
		return "UNKNOWN"
	}
}


### proxy/events.go
package proxy

// package level registry of the different event types

const ProcessStateChangeEventID = 0x01
const ChatCompletionStatsEventID = 0x02
const ConfigFileChangedEventID = 0x03
const LogDataEventID = 0x04
const TokenMetricsEventID = 0x05
const ModelPreloadedEventID = 0x06

type ProcessStateChangeEvent struct {
	ProcessName string
	NewState    ProcessState
	OldState    ProcessState
}

func (e ProcessStateChangeEvent) Type() uint32 {
	return ProcessStateChangeEventID
}

type ChatCompletionStats struct {
	TokensGenerated int
}

func (e ChatCompletionStats) Type() uint32 {
	return ChatCompletionStatsEventID
}

type ReloadingState int

const (
	ReloadingStateStart ReloadingState = iota
	ReloadingStateEnd
)

type ConfigFileChangedEvent struct {
	ReloadingState ReloadingState
}

func (e ConfigFileChangedEvent) Type() uint32 {
	return ConfigFileChangedEventID
}

type LogDataEvent struct {
	Data []byte
}

func (e LogDataEvent) Type() uint32 {
	return LogDataEventID
}

type ModelPreloadedEvent struct {
	ModelName string
	Success   bool
}

func (e ModelPreloadedEvent) Type() uint32 {
	return ModelPreloadedEventID
}


### proxy/helpers_test.go
package proxy

import (
	"fmt"
	"os"
	"path/filepath"
	"runtime"
	"sync"
	"testing"

	"github.com/gin-gonic/gin"
	"github.com/mostlygeek/llama-swap/proxy/config"
	"gopkg.in/yaml.v3"
)

var (
	nextTestPort        int = 12000
	portMutex           sync.Mutex
	testLogger          = NewLogMonitorWriter(os.Stdout)
	simpleResponderPath = getSimpleResponderPath()
)

// Check if the binary exists
func TestMain(m *testing.M) {
	binaryPath := getSimpleResponderPath()
	if _, err := os.Stat(binaryPath); os.IsNotExist(err) {
		fmt.Printf("simple-responder not found at %s, did you `make simple-responder`?\n", binaryPath)
		os.Exit(1)
	}

	gin.SetMode(gin.TestMode)

	switch os.Getenv("LOG_LEVEL") {
	case "debug":
		testLogger.SetLogLevel(LevelDebug)
	case "warn":
		testLogger.SetLogLevel(LevelWarn)
	case "info":
		testLogger.SetLogLevel(LevelInfo)
	default:
		testLogger.SetLogLevel(LevelWarn)
	}

	m.Run()
}

// Helper function to get the binary path
func getSimpleResponderPath() string {
	goos := runtime.GOOS
	goarch := runtime.GOARCH

	if goos == "windows" {
		return filepath.Join("..", "build", "simple-responder.exe")
	} else {
		return filepath.Join("..", "build", fmt.Sprintf("simple-responder_%s_%s", goos, goarch))
	}
}

func getTestPort() int {
	portMutex.Lock()
	defer portMutex.Unlock()

	port := nextTestPort
	nextTestPort++

	return port
}

func getTestSimpleResponderConfig(expectedMessage string) config.ModelConfig {
	return getTestSimpleResponderConfigPort(expectedMessage, getTestPort())
}

func getTestSimpleResponderConfigPort(expectedMessage string, port int) config.ModelConfig {
	// Create a YAML string with just the values we want to set
	yamlStr := fmt.Sprintf(`
cmd: '%s --port %d --silent --respond %s'
proxy: "http://127.0.0.1:%d"
`, simpleResponderPath, port, expectedMessage, port)

	var cfg config.ModelConfig
	if err := yaml.Unmarshal([]byte(yamlStr), &cfg); err != nil {
		panic(fmt.Sprintf("failed to unmarshal test config: %v in [%s]", err, yamlStr))
	}

	return cfg
}


### proxy/metrics_monitor_test.go
package proxy

import (
	"encoding/json"
	"net/http"
	"net/http/httptest"
	"sync"
	"testing"
	"time"

	"github.com/gin-gonic/gin"
	"github.com/mostlygeek/llama-swap/event"
	"github.com/stretchr/testify/assert"
)

func TestMetricsMonitor_AddMetrics(t *testing.T) {
	t.Run("adds metrics and assigns ID", func(t *testing.T) {
		mm := newMetricsMonitor(testLogger, 10)

		metric := TokenMetrics{
			Model:        "test-model",
			InputTokens:  100,
			OutputTokens: 50,
		}

		mm.addMetrics(metric)

		metrics := mm.getMetrics()
		assert.Equal(t, 1, len(metrics))
		assert.Equal(t, 0, metrics[0].ID)
		assert.Equal(t, "test-model", metrics[0].Model)
		assert.Equal(t, 100, metrics[0].InputTokens)
		assert.Equal(t, 50, metrics[0].OutputTokens)
	})

	t.Run("increments ID for each metric", func(t *testing.T) {
		mm := newMetricsMonitor(testLogger, 10)

		for i := 0; i < 5; i++ {
			mm.addMetrics(TokenMetrics{Model: "model"})
		}

		metrics := mm.getMetrics()
		assert.Equal(t, 5, len(metrics))
		for i := 0; i < 5; i++ {
			assert.Equal(t, i, metrics[i].ID)
		}
	})

	t.Run("respects max metrics limit", func(t *testing.T) {
		mm := newMetricsMonitor(testLogger, 3)

		// Add 5 metrics
		for i := 0; i < 5; i++ {
			mm.addMetrics(TokenMetrics{
				Model:       "model",
				InputTokens: i,
			})
		}

		metrics := mm.getMetrics()
		assert.Equal(t, 3, len(metrics))

		// Should keep the last 3 metrics (IDs 2, 3, 4)
		assert.Equal(t, 2, metrics[0].ID)
		assert.Equal(t, 3, metrics[1].ID)
		assert.Equal(t, 4, metrics[2].ID)
	})

	t.Run("emits TokenMetricsEvent", func(t *testing.T) {
		mm := newMetricsMonitor(testLogger, 10)

		receivedEvent := make(chan TokenMetricsEvent, 1)
		cancel := event.On(func(e TokenMetricsEvent) {
			receivedEvent <- e
		})
		defer cancel()

		metric := TokenMetrics{
			Model:        "test-model",
			InputTokens:  100,
			OutputTokens: 50,
		}

		mm.addMetrics(metric)

		select {
		case evt := <-receivedEvent:
			assert.Equal(t, 0, evt.Metrics.ID)
			assert.Equal(t, "test-model", evt.Metrics.Model)
			assert.Equal(t, 100, evt.Metrics.InputTokens)
			assert.Equal(t, 50, evt.Metrics.OutputTokens)
		case <-time.After(1 * time.Second):
			t.Fatal("timeout waiting for event")
		}
	})
}

func TestMetricsMonitor_GetMetrics(t *testing.T) {
	t.Run("returns empty slice when no metrics", func(t *testing.T) {
		mm := newMetricsMonitor(testLogger, 10)
		metrics := mm.getMetrics()
		assert.NotNil(t, metrics)
		assert.Equal(t, 0, len(metrics))
	})

	t.Run("returns copy of metrics", func(t *testing.T) {
		mm := newMetricsMonitor(testLogger, 10)
		mm.addMetrics(TokenMetrics{Model: "model1"})
		mm.addMetrics(TokenMetrics{Model: "model2"})

		metrics1 := mm.getMetrics()
		metrics2 := mm.getMetrics()

		// Verify we got copies
		assert.Equal(t, 2, len(metrics1))
		assert.Equal(t, 2, len(metrics2))

		// Modify the returned slice shouldn't affect the original
		metrics1[0].Model = "modified"
		metrics3 := mm.getMetrics()
		assert.Equal(t, "model1", metrics3[0].Model)
	})
}

func TestMetricsMonitor_GetMetricsJSON(t *testing.T) {
	t.Run("returns valid JSON for empty metrics", func(t *testing.T) {
		mm := newMetricsMonitor(testLogger, 10)
		jsonData, err := mm.getMetricsJSON()
		assert.NoError(t, err)
		assert.NotNil(t, jsonData)

		var metrics []TokenMetrics
		err = json.Unmarshal(jsonData, &metrics)
		assert.NoError(t, err)
		assert.Equal(t, 0, len(metrics))
	})

	t.Run("returns valid JSON with metrics", func(t *testing.T) {
		mm := newMetricsMonitor(testLogger, 10)
		mm.addMetrics(TokenMetrics{
			Model:           "model1",
			InputTokens:     100,
			OutputTokens:    50,
			TokensPerSecond: 25.5,
		})
		mm.addMetrics(TokenMetrics{
			Model:           "model2",
			InputTokens:     200,
			OutputTokens:    100,
			TokensPerSecond: 30.0,
		})

		jsonData, err := mm.getMetricsJSON()
		assert.NoError(t, err)

		var metrics []TokenMetrics
		err = json.Unmarshal(jsonData, &metrics)
		assert.NoError(t, err)
		assert.Equal(t, 2, len(metrics))
		assert.Equal(t, "model1", metrics[0].Model)
		assert.Equal(t, "model2", metrics[1].Model)
	})
}

func TestMetricsMonitor_WrapHandler(t *testing.T) {
	t.Run("successful non-streaming request with usage data", func(t *testing.T) {
		mm := newMetricsMonitor(testLogger, 10)

		responseBody := `{
			"usage": {
				"prompt_tokens": 100,
				"completion_tokens": 50
			}
		}`

		nextHandler := func(modelID string, w http.ResponseWriter, r *http.Request) error {
			w.Header().Set("Content-Type", "application/json")
			w.WriteHeader(http.StatusOK)
			w.Write([]byte(responseBody))
			return nil
		}

		req := httptest.NewRequest("POST", "/test", nil)
		rec := httptest.NewRecorder()
		ginCtx, _ := gin.CreateTestContext(rec)

		err := mm.wrapHandler("test-model", ginCtx.Writer, req, nextHandler)
		assert.NoError(t, err)

		metrics := mm.getMetrics()
		assert.Equal(t, 1, len(metrics))
		assert.Equal(t, "test-model", metrics[0].Model)
		assert.Equal(t, 100, metrics[0].InputTokens)
		assert.Equal(t, 50, metrics[0].OutputTokens)
	})

	t.Run("successful request with timings data", func(t *testing.T) {
		mm := newMetricsMonitor(testLogger, 10)

		responseBody := `{
			"timings": {
				"prompt_n": 100,
				"predicted_n": 50,
				"prompt_per_second": 150.5,
				"predicted_per_second": 25.5,
				"prompt_ms": 500.0,
				"predicted_ms": 1500.0,
				"cache_n": 20
			}
		}`

		nextHandler := func(modelID string, w http.ResponseWriter, r *http.Request) error {
			w.Header().Set("Content-Type", "application/json")
			w.WriteHeader(http.StatusOK)
			w.Write([]byte(responseBody))
			return nil
		}

		req := httptest.NewRequest("POST", "/test", nil)
		rec := httptest.NewRecorder()
		ginCtx, _ := gin.CreateTestContext(rec)

		err := mm.wrapHandler("test-model", ginCtx.Writer, req, nextHandler)
		assert.NoError(t, err)

		metrics := mm.getMetrics()
		assert.Equal(t, 1, len(metrics))
		assert.Equal(t, "test-model", metrics[0].Model)
		assert.Equal(t, 100, metrics[0].InputTokens)
		assert.Equal(t, 50, metrics[0].OutputTokens)
		assert.Equal(t, 20, metrics[0].CachedTokens)
		assert.Equal(t, 150.5, metrics[0].PromptPerSecond)
		assert.Equal(t, 25.5, metrics[0].TokensPerSecond)
		assert.Equal(t, 2000, metrics[0].DurationMs) // 500 + 1500
	})

	t.Run("streaming request with SSE format", func(t *testing.T) {
		mm := newMetricsMonitor(testLogger, 10)

		// Note: SSE format requires proper line breaks - each data line followed by blank line
		responseBody := `data: {"choices":[{"text":"Hello"}]}

data: {"choices":[{"text":" World"}]}

data: {"usage":{"prompt_tokens":10,"completion_tokens":20},"timings":{"prompt_n":10,"predicted_n":20,"prompt_per_second":100.0,"predicted_per_second":50.0,"prompt_ms":100.0,"predicted_ms":400.0}}

data: [DONE]

`

		nextHandler := func(modelID string, w http.ResponseWriter, r *http.Request) error {
			w.Header().Set("Content-Type", "text/event-stream")
			w.WriteHeader(http.StatusOK)
			w.Write([]byte(responseBody))
			return nil
		}

		req := httptest.NewRequest("POST", "/test", nil)
		rec := httptest.NewRecorder()
		ginCtx, _ := gin.CreateTestContext(rec)

		err := mm.wrapHandler("test-model", ginCtx.Writer, req, nextHandler)
		assert.NoError(t, err)

		metrics := mm.getMetrics()
		assert.Equal(t, 1, len(metrics))
		assert.Equal(t, "test-model", metrics[0].Model)
		// When timings data is present, it takes precedence
		assert.Equal(t, 10, metrics[0].InputTokens)
		assert.Equal(t, 20, metrics[0].OutputTokens)
	})

	t.Run("non-OK status code does not record metrics", func(t *testing.T) {
		mm := newMetricsMonitor(testLogger, 10)

		nextHandler := func(modelID string, w http.ResponseWriter, r *http.Request) error {
			w.WriteHeader(http.StatusBadRequest)
			w.Write([]byte("error"))
			return nil
		}

		req := httptest.NewRequest("POST", "/test", nil)
		rec := httptest.NewRecorder()
		ginCtx, _ := gin.CreateTestContext(rec)

		err := mm.wrapHandler("test-model", ginCtx.Writer, req, nextHandler)
		assert.NoError(t, err)

		metrics := mm.getMetrics()
		assert.Equal(t, 0, len(metrics))
	})

	t.Run("empty response body does not record metrics", func(t *testing.T) {
		mm := newMetricsMonitor(testLogger, 10)

		nextHandler := func(modelID string, w http.ResponseWriter, r *http.Request) error {
			w.WriteHeader(http.StatusOK)
			return nil
		}

		req := httptest.NewRequest("POST", "/test", nil)
		rec := httptest.NewRecorder()
		ginCtx, _ := gin.CreateTestContext(rec)

		err := mm.wrapHandler("test-model", ginCtx.Writer, req, nextHandler)
		assert.NoError(t, err)

		metrics := mm.getMetrics()
		assert.Equal(t, 0, len(metrics))
	})

	t.Run("invalid JSON does not record metrics", func(t *testing.T) {
		mm := newMetricsMonitor(testLogger, 10)

		nextHandler := func(modelID string, w http.ResponseWriter, r *http.Request) error {
			w.Header().Set("Content-Type", "application/json")
			w.WriteHeader(http.StatusOK)
			w.Write([]byte("not valid json"))
			return nil
		}

		req := httptest.NewRequest("POST", "/test", nil)
		rec := httptest.NewRecorder()
		ginCtx, _ := gin.CreateTestContext(rec)

		err := mm.wrapHandler("test-model", ginCtx.Writer, req, nextHandler)
		assert.NoError(t, err) // Errors after response is sent are logged, not returned

		metrics := mm.getMetrics()
		assert.Equal(t, 0, len(metrics))
	})

	t.Run("next handler error is propagated", func(t *testing.T) {
		mm := newMetricsMonitor(testLogger, 10)

		expectedErr := assert.AnError
		nextHandler := func(modelID string, w http.ResponseWriter, r *http.Request) error {
			return expectedErr
		}

		req := httptest.NewRequest("POST", "/test", nil)
		rec := httptest.NewRecorder()
		ginCtx, _ := gin.CreateTestContext(rec)

		err := mm.wrapHandler("test-model", ginCtx.Writer, req, nextHandler)
		assert.Equal(t, expectedErr, err)

		metrics := mm.getMetrics()
		assert.Equal(t, 0, len(metrics))
	})

	t.Run("response without usage or timings does not record metrics", func(t *testing.T) {
		mm := newMetricsMonitor(testLogger, 10)

		responseBody := `{"result": "ok"}`

		nextHandler := func(modelID string, w http.ResponseWriter, r *http.Request) error {
			w.Header().Set("Content-Type", "application/json")
			w.WriteHeader(http.StatusOK)
			w.Write([]byte(responseBody))
			return nil
		}

		req := httptest.NewRequest("POST", "/test", nil)
		rec := httptest.NewRecorder()
		ginCtx, _ := gin.CreateTestContext(rec)

		err := mm.wrapHandler("test-model", ginCtx.Writer, req, nextHandler)
		assert.NoError(t, err) // Errors after response is sent are logged, not returned

		metrics := mm.getMetrics()
		assert.Equal(t, 0, len(metrics))
	})
}

func TestMetricsMonitor_ResponseBodyCopier(t *testing.T) {
	t.Run("captures response body", func(t *testing.T) {
		rec := httptest.NewRecorder()
		ginCtx, _ := gin.CreateTestContext(rec)
		copier := newBodyCopier(ginCtx.Writer)

		testData := []byte("test response body")
		n, err := copier.Write(testData)

		assert.NoError(t, err)
		assert.Equal(t, len(testData), n)
		assert.Equal(t, testData, copier.body.Bytes())
		assert.Equal(t, string(testData), rec.Body.String())
	})

	t.Run("sets start time on first write", func(t *testing.T) {
		rec := httptest.NewRecorder()
		ginCtx, _ := gin.CreateTestContext(rec)
		copier := newBodyCopier(ginCtx.Writer)

		assert.True(t, copier.StartTime().IsZero())

		copier.Write([]byte("test"))

		assert.False(t, copier.StartTime().IsZero())
	})

	t.Run("preserves headers", func(t *testing.T) {
		rec := httptest.NewRecorder()
		ginCtx, _ := gin.CreateTestContext(rec)
		copier := newBodyCopier(ginCtx.Writer)

		copier.Header().Set("X-Test", "value")

		assert.Equal(t, "value", rec.Header().Get("X-Test"))
	})

	t.Run("preserves status code", func(t *testing.T) {
		rec := httptest.NewRecorder()
		ginCtx, _ := gin.CreateTestContext(rec)
		copier := newBodyCopier(ginCtx.Writer)

		copier.WriteHeader(http.StatusCreated)

		// Gin's ResponseWriter tracks status internally
		assert.Equal(t, http.StatusCreated, copier.Status())
	})
}

func TestMetricsMonitor_Concurrent(t *testing.T) {
	t.Run("concurrent addMetrics is safe", func(t *testing.T) {
		mm := newMetricsMonitor(testLogger, 1000)

		var wg sync.WaitGroup
		numGoroutines := 10
		metricsPerGoroutine := 100

		for i := 0; i < numGoroutines; i++ {
			wg.Add(1)
			go func(id int) {
				defer wg.Done()
				for j := 0; j < metricsPerGoroutine; j++ {
					mm.addMetrics(TokenMetrics{
						Model:        "test-model",
						InputTokens:  id*1000 + j,
						OutputTokens: j,
					})
				}
			}(i)
		}

		wg.Wait()

		metrics := mm.getMetrics()
		assert.Equal(t, numGoroutines*metricsPerGoroutine, len(metrics))
	})

	t.Run("concurrent reads and writes are safe", func(t *testing.T) {
		mm := newMetricsMonitor(testLogger, 100)

		done := make(chan bool)

		// Writer goroutine
		go func() {
			for i := 0; i < 50; i++ {
				mm.addMetrics(TokenMetrics{Model: "test-model"})
				time.Sleep(1 * time.Millisecond)
			}
			done <- true
		}()

		// Multiple reader goroutines
		var wg sync.WaitGroup
		for i := 0; i < 5; i++ {
			wg.Add(1)
			go func() {
				defer wg.Done()
				for j := 0; j < 20; j++ {
					_ = mm.getMetrics()
					_, _ = mm.getMetricsJSON()
					time.Sleep(2 * time.Millisecond)
				}
			}()
		}

		<-done
		wg.Wait()

		// Final check
		metrics := mm.getMetrics()
		assert.Equal(t, 50, len(metrics))
	})
}

func TestMetricsMonitor_ParseMetrics(t *testing.T) {
	t.Run("prefers timings over usage data", func(t *testing.T) {
		mm := newMetricsMonitor(testLogger, 10)

		// Timings should take precedence over usage
		responseBody := `{
			"usage": {
				"prompt_tokens": 50,
				"completion_tokens": 25
			},
			"timings": {
				"prompt_n": 100,
				"predicted_n": 50,
				"prompt_per_second": 150.5,
				"predicted_per_second": 25.5,
				"prompt_ms": 500.0,
				"predicted_ms": 1500.0
			}
		}`

		nextHandler := func(modelID string, w http.ResponseWriter, r *http.Request) error {
			w.Header().Set("Content-Type", "application/json")
			w.WriteHeader(http.StatusOK)
			w.Write([]byte(responseBody))
			return nil
		}

		req := httptest.NewRequest("POST", "/test", nil)
		rec := httptest.NewRecorder()
		ginCtx, _ := gin.CreateTestContext(rec)

		err := mm.wrapHandler("test-model", ginCtx.Writer, req, nextHandler)
		assert.NoError(t, err)

		metrics := mm.getMetrics()
		assert.Equal(t, 1, len(metrics))
		// Should use timings values, not usage values
		assert.Equal(t, 100, metrics[0].InputTokens)
		assert.Equal(t, 50, metrics[0].OutputTokens)
	})

	t.Run("handles missing cache_n in timings", func(t *testing.T) {
		mm := newMetricsMonitor(testLogger, 10)

		responseBody := `{
			"timings": {
				"prompt_n": 100,
				"predicted_n": 50,
				"prompt_per_second": 150.5,
				"predicted_per_second": 25.5,
				"prompt_ms": 500.0,
				"predicted_ms": 1500.0
			}
		}`

		nextHandler := func(modelID string, w http.ResponseWriter, r *http.Request) error {
			w.Header().Set("Content-Type", "application/json")
			w.WriteHeader(http.StatusOK)
			w.Write([]byte(responseBody))
			return nil
		}

		req := httptest.NewRequest("POST", "/test", nil)
		rec := httptest.NewRecorder()
		ginCtx, _ := gin.CreateTestContext(rec)

		err := mm.wrapHandler("test-model", ginCtx.Writer, req, nextHandler)
		assert.NoError(t, err)

		metrics := mm.getMetrics()
		assert.Equal(t, 1, len(metrics))
		assert.Equal(t, -1, metrics[0].CachedTokens) // Default value when not present
	})
}

func TestMetricsMonitor_StreamingResponse(t *testing.T) {
	t.Run("finds metrics in last valid SSE data", func(t *testing.T) {
		mm := newMetricsMonitor(testLogger, 10)

		// Metrics should be found in the last data line before [DONE]
		responseBody := `data: {"choices":[{"text":"First"}]}

data: {"choices":[{"text":"Second"}]}

data: {"usage":{"prompt_tokens":100,"completion_tokens":50}}

data: [DONE]

`

		nextHandler := func(modelID string, w http.ResponseWriter, r *http.Request) error {
			w.Header().Set("Content-Type", "text/event-stream")
			w.WriteHeader(http.StatusOK)
			w.Write([]byte(responseBody))
			return nil
		}

		req := httptest.NewRequest("POST", "/test", nil)
		rec := httptest.NewRecorder()
		ginCtx, _ := gin.CreateTestContext(rec)

		err := mm.wrapHandler("test-model", ginCtx.Writer, req, nextHandler)
		assert.NoError(t, err)

		metrics := mm.getMetrics()
		assert.Equal(t, 1, len(metrics))
		assert.Equal(t, 100, metrics[0].InputTokens)
		assert.Equal(t, 50, metrics[0].OutputTokens)
	})

	t.Run("handles streaming with no valid JSON", func(t *testing.T) {
		mm := newMetricsMonitor(testLogger, 10)

		responseBody := `data: not json

data: [DONE]

`

		nextHandler := func(modelID string, w http.ResponseWriter, r *http.Request) error {
			w.Header().Set("Content-Type", "text/event-stream")
			w.WriteHeader(http.StatusOK)
			w.Write([]byte(responseBody))
			return nil
		}

		req := httptest.NewRequest("POST", "/test", nil)
		rec := httptest.NewRecorder()
		ginCtx, _ := gin.CreateTestContext(rec)

		err := mm.wrapHandler("test-model", ginCtx.Writer, req, nextHandler)
		assert.NoError(t, err) // Errors after response is sent are logged, not returned

		metrics := mm.getMetrics()
		assert.Equal(t, 0, len(metrics))
	})

	t.Run("handles empty streaming response", func(t *testing.T) {
		mm := newMetricsMonitor(testLogger, 10)

		responseBody := ``

		nextHandler := func(modelID string, w http.ResponseWriter, r *http.Request) error {
			w.Header().Set("Content-Type", "text/event-stream")
			w.WriteHeader(http.StatusOK)
			w.Write([]byte(responseBody))
			return nil
		}

		req := httptest.NewRequest("POST", "/test", nil)
		rec := httptest.NewRecorder()
		ginCtx, _ := gin.CreateTestContext(rec)

		err := mm.wrapHandler("test-model", ginCtx.Writer, req, nextHandler)
		// Empty body should not trigger WrapHandler processing
		assert.NoError(t, err)

		metrics := mm.getMetrics()
		assert.Equal(t, 0, len(metrics))
	})
}

// Benchmark tests
func BenchmarkMetricsMonitor_AddMetrics(b *testing.B) {
	mm := newMetricsMonitor(testLogger, 1000)

	metric := TokenMetrics{
		Model:           "test-model",
		CachedTokens:    100,
		InputTokens:     500,
		OutputTokens:    250,
		PromptPerSecond: 1200.5,
		TokensPerSecond: 45.8,
		DurationMs:      5000,
		Timestamp:       time.Now(),
	}

	b.ResetTimer()
	for i := 0; i < b.N; i++ {
		mm.addMetrics(metric)
	}
}

func BenchmarkMetricsMonitor_AddMetrics_SmallBuffer(b *testing.B) {
	// Test performance with a smaller buffer where wrapping occurs more frequently
	mm := newMetricsMonitor(testLogger, 100)

	metric := TokenMetrics{
		Model:           "test-model",
		CachedTokens:    100,
		InputTokens:     500,
		OutputTokens:    250,
		PromptPerSecond: 1200.5,
		TokensPerSecond: 45.8,
		DurationMs:      5000,
		Timestamp:       time.Now(),
	}

	b.ResetTimer()
	for i := 0; i < b.N; i++ {
		mm.addMetrics(metric)
	}
}


### proxy/processgroup_test.go
package proxy

import (
	"bytes"
	"net/http"
	"net/http/httptest"
	"sync"
	"testing"

	"github.com/mostlygeek/llama-swap/proxy/config"
	"github.com/stretchr/testify/assert"
)

var processGroupTestConfig = config.AddDefaultGroupToConfig(config.Config{
	HealthCheckTimeout: 15,
	Models: map[string]config.ModelConfig{
		"model1": getTestSimpleResponderConfig("model1"),
		"model2": getTestSimpleResponderConfig("model2"),
		"model3": getTestSimpleResponderConfig("model3"),
		"model4": getTestSimpleResponderConfig("model4"),
		"model5": getTestSimpleResponderConfig("model5"),
	},
	Groups: map[string]config.GroupConfig{
		"G1": {
			Swap:      true,
			Exclusive: true,
			Members:   []string{"model1", "model2"},
		},
		"G2": {
			Swap:      false,
			Exclusive: true,
			Members:   []string{"model3", "model4"},
		},
	},
})

func TestProcessGroup_DefaultHasCorrectModel(t *testing.T) {
	pg := NewProcessGroup(config.DEFAULT_GROUP_ID, processGroupTestConfig, testLogger, testLogger)
	assert.True(t, pg.HasMember("model5"))
}

func TestProcessGroup_HasMember(t *testing.T) {
	pg := NewProcessGroup("G1", processGroupTestConfig, testLogger, testLogger)
	assert.True(t, pg.HasMember("model1"))
	assert.True(t, pg.HasMember("model2"))
	assert.False(t, pg.HasMember("model3"))
}

// TestProcessGroup_ProxyRequestSwapIsTrueParallel tests that when swap is true
// and multiple requests are made in parallel, only one process is running at a time.
func TestProcessGroup_ProxyRequestSwapIsTrueParallel(t *testing.T) {
	var processGroupTestConfig = config.AddDefaultGroupToConfig(config.Config{
		HealthCheckTimeout: 15,
		Models: map[string]config.ModelConfig{
			// use the same listening so if a model is already running, it will fail
			// this is a way to test that swap isolation is working
			// properly when there are parallel requests made at the
			// same time.
			"model1": getTestSimpleResponderConfigPort("model1", 9832),
			"model2": getTestSimpleResponderConfigPort("model2", 9832),
			"model3": getTestSimpleResponderConfigPort("model3", 9832),
			"model4": getTestSimpleResponderConfigPort("model4", 9832),
			"model5": getTestSimpleResponderConfigPort("model5", 9832),
		},
		Groups: map[string]config.GroupConfig{
			"G1": {
				Swap:    true,
				Members: []string{"model1", "model2", "model3", "model4", "model5"},
			},
		},
	})

	pg := NewProcessGroup("G1", processGroupTestConfig, testLogger, testLogger)
	defer pg.StopProcesses(StopWaitForInflightRequest)

	tests := []string{"model1", "model2", "model3", "model4", "model5"}

	var wg sync.WaitGroup

	wg.Add(len(tests))
	for _, modelName := range tests {
		go func(modelName string) {
			defer wg.Done()
			req := httptest.NewRequest("POST", "/v1/chat/completions", nil)
			w := httptest.NewRecorder()
			assert.NoError(t, pg.ProxyRequest(modelName, w, req))
			assert.Equal(t, http.StatusOK, w.Code)
			assert.Contains(t, w.Body.String(), modelName)
		}(modelName)
	}
	wg.Wait()
}

func TestProcessGroup_ProxyRequestSwapIsFalse(t *testing.T) {
	pg := NewProcessGroup("G2", processGroupTestConfig, testLogger, testLogger)
	defer pg.StopProcesses(StopWaitForInflightRequest)

	tests := []string{"model3", "model4"}

	for _, modelName := range tests {
		t.Run(modelName, func(t *testing.T) {
			reqBody := `{"x", "y"}`
			req := httptest.NewRequest("POST", "/v1/chat/completions", bytes.NewBufferString(reqBody))
			w := httptest.NewRecorder()
			assert.NoError(t, pg.ProxyRequest(modelName, w, req))
			assert.Equal(t, http.StatusOK, w.Code)
			assert.Contains(t, w.Body.String(), modelName)
		})
	}

	// make sure all the processes are running
	for _, process := range pg.processes {
		assert.Equal(t, StateReady, process.CurrentState())
	}
}


### proxy/ui_embed.go
package proxy

import (
	"embed"
	"io/fs"
	"net/http"
)

//go:embed ui_dist
var reactStaticFS embed.FS

// GetReactFS returns the embedded React filesystem
func GetReactFS() (http.FileSystem, error) {
	subFS, err := fs.Sub(reactStaticFS, "ui_dist")
	if err != nil {
		return nil, err
	}
	return http.FS(subFS), nil
}

// GetReactIndexHTML returns the main index.html for the React app
func GetReactIndexHTML() ([]byte, error) {
	return reactStaticFS.ReadFile("ui_dist/index.html")
}


### proxy/proxymanager.go
package proxy

import (
	"bytes"
	"context"
	"fmt"
	"io"
	"mime/multipart"
	"net/http"
	"os"
	"sort"
	"strconv"
	"strings"
	"sync"
	"time"

	"github.com/gin-gonic/gin"
	"github.com/mostlygeek/llama-swap/event"
	"github.com/mostlygeek/llama-swap/proxy/config"
	"github.com/tidwall/gjson"
	"github.com/tidwall/sjson"
)

const (
	PROFILE_SPLIT_CHAR = ":"
)

type proxyCtxKey string

type ProxyManager struct {
	sync.Mutex

	config    config.Config
	ginEngine *gin.Engine

	// logging
	proxyLogger    *LogMonitor
	upstreamLogger *LogMonitor
	muxLogger      *LogMonitor

	metricsMonitor *metricsMonitor

	processGroups map[string]*ProcessGroup

	// shutdown signaling
	shutdownCtx    context.Context
	shutdownCancel context.CancelFunc
}

func New(config config.Config) *ProxyManager {
	// set up loggers
	stdoutLogger := NewLogMonitorWriter(os.Stdout)
	upstreamLogger := NewLogMonitorWriter(stdoutLogger)
	proxyLogger := NewLogMonitorWriter(stdoutLogger)

	if config.LogRequests {
		proxyLogger.Warn("LogRequests configuration is deprecated. Use logLevel instead.")
	}

	switch strings.ToLower(strings.TrimSpace(config.LogLevel)) {
	case "debug":
		proxyLogger.SetLogLevel(LevelDebug)
		upstreamLogger.SetLogLevel(LevelDebug)
	case "info":
		proxyLogger.SetLogLevel(LevelInfo)
		upstreamLogger.SetLogLevel(LevelInfo)
	case "warn":
		proxyLogger.SetLogLevel(LevelWarn)
		upstreamLogger.SetLogLevel(LevelWarn)
	case "error":
		proxyLogger.SetLogLevel(LevelError)
		upstreamLogger.SetLogLevel(LevelError)
	default:
		proxyLogger.SetLogLevel(LevelInfo)
		upstreamLogger.SetLogLevel(LevelInfo)
	}

	// see: https://go.dev/src/time/format.go
	timeFormats := map[string]string{
		"ansic":       time.ANSIC,
		"unixdate":    time.UnixDate,
		"rubydate":    time.RubyDate,
		"rfc822":      time.RFC822,
		"rfc822z":     time.RFC822Z,
		"rfc850":      time.RFC850,
		"rfc1123":     time.RFC1123,
		"rfc1123z":    time.RFC1123Z,
		"rfc3339":     time.RFC3339,
		"rfc3339nano": time.RFC3339Nano,
		"kitchen":     time.Kitchen,
		"stamp":       time.Stamp,
		"stampmilli":  time.StampMilli,
		"stampmicro":  time.StampMicro,
		"stampnano":   time.StampNano,
	}

	if timeFormat, ok := timeFormats[strings.ToLower(strings.TrimSpace(config.LogTimeFormat))]; ok {
		proxyLogger.SetLogTimeFormat(timeFormat)
		upstreamLogger.SetLogTimeFormat(timeFormat)
	}

	shutdownCtx, shutdownCancel := context.WithCancel(context.Background())

	var maxMetrics int
	if config.MetricsMaxInMemory <= 0 {
		maxMetrics = 1000 // Default fallback
	} else {
		maxMetrics = config.MetricsMaxInMemory
	}

	pm := &ProxyManager{
		config:    config,
		ginEngine: gin.New(),

		proxyLogger:    proxyLogger,
		muxLogger:      stdoutLogger,
		upstreamLogger: upstreamLogger,

		metricsMonitor: newMetricsMonitor(proxyLogger, maxMetrics),

		processGroups: make(map[string]*ProcessGroup),

		shutdownCtx:    shutdownCtx,
		shutdownCancel: shutdownCancel,
	}

	// create the process groups
	for groupID := range config.Groups {
		processGroup := NewProcessGroup(groupID, config, proxyLogger, upstreamLogger)
		pm.processGroups[groupID] = processGroup
	}

	pm.setupGinEngine()

	// run any startup hooks
	if len(config.Hooks.OnStartup.Preload) > 0 {
		// do it in the background, don't block startup -- not sure if good idea yet
		go func() {
			discardWriter := &DiscardWriter{}
			for _, realModelName := range config.Hooks.OnStartup.Preload {
				proxyLogger.Infof("Preloading model: %s", realModelName)
				processGroup, _, err := pm.swapProcessGroup(realModelName)

				if err != nil {
					event.Emit(ModelPreloadedEvent{
						ModelName: realModelName,
						Success:   false,
					})
					proxyLogger.Errorf("Failed to preload model %s: %v", realModelName, err)
					continue
				} else {
					req, _ := http.NewRequest("GET", "/", nil)
					processGroup.ProxyRequest(realModelName, discardWriter, req)
					event.Emit(ModelPreloadedEvent{
						ModelName: realModelName,
						Success:   true,
					})
				}
			}
		}()
	}

	return pm
}

func (pm *ProxyManager) setupGinEngine() {

	pm.ginEngine.Use(func(c *gin.Context) {

		// don't log the Wake on Lan proxy health check
		if c.Request.URL.Path == "/wol-health" {
			c.Next()
			return
		}

		// Start timer
		start := time.Now()

		// capture these because /upstream/:model rewrites them in c.Next()
		clientIP := c.ClientIP()
		method := c.Request.Method
		path := c.Request.URL.Path

		// Process request
		c.Next()

		// Stop timer
		duration := time.Since(start)

		statusCode := c.Writer.Status()
		bodySize := c.Writer.Size()

		pm.proxyLogger.Infof("Request %s \"%s %s %s\" %d %d \"%s\" %v",
			clientIP,
			method,
			path,
			c.Request.Proto,
			statusCode,
			bodySize,
			c.Request.UserAgent(),
			duration,
		)
	})

	// see: issue: #81, #77 and #42 for CORS issues
	// respond with permissive OPTIONS for any endpoint
	pm.ginEngine.Use(func(c *gin.Context) {
		if c.Request.Method == "OPTIONS" {
			c.Header("Access-Control-Allow-Origin", "*")
			c.Header("Access-Control-Allow-Methods", "GET, POST, PUT, PATCH, DELETE, OPTIONS")

			// allow whatever the client requested by default
			if headers := c.Request.Header.Get("Access-Control-Request-Headers"); headers != "" {
				sanitized := SanitizeAccessControlRequestHeaderValues(headers)
				c.Header("Access-Control-Allow-Headers", sanitized)
			} else {
				c.Header(
					"Access-Control-Allow-Headers",
					"Content-Type, Authorization, Accept, X-Requested-With",
				)
			}
			c.Header("Access-Control-Max-Age", "86400")
			c.AbortWithStatus(http.StatusNoContent)
			return
		}
		c.Next()
	})

	// Set up routes using the Gin engine
	pm.ginEngine.POST("/v1/chat/completions", pm.proxyOAIHandler)
	// Support legacy /v1/completions api, see issue #12
	pm.ginEngine.POST("/v1/completions", pm.proxyOAIHandler)

	// Support embeddings and reranking
	pm.ginEngine.POST("/v1/embeddings", pm.proxyOAIHandler)

	// llama-server's /reranking endpoint + aliases
	pm.ginEngine.POST("/reranking", pm.proxyOAIHandler)
	pm.ginEngine.POST("/rerank", pm.proxyOAIHandler)
	pm.ginEngine.POST("/v1/rerank", pm.proxyOAIHandler)
	pm.ginEngine.POST("/v1/reranking", pm.proxyOAIHandler)

	// llama-server's /infill endpoint for code infilling
	pm.ginEngine.POST("/infill", pm.proxyOAIHandler)

	// llama-server's /completion endpoint
	pm.ginEngine.POST("/completion", pm.proxyOAIHandler)

	// Support audio/speech endpoint
	pm.ginEngine.POST("/v1/audio/speech", pm.proxyOAIHandler)
	pm.ginEngine.POST("/v1/audio/transcriptions", pm.proxyOAIPostFormHandler)

	pm.ginEngine.GET("/v1/models", pm.listModelsHandler)

	// in proxymanager_loghandlers.go
	pm.ginEngine.GET("/logs", pm.sendLogsHandlers)
	pm.ginEngine.GET("/logs/stream", pm.streamLogsHandler)
	pm.ginEngine.GET("/logs/stream/:logMonitorID", pm.streamLogsHandler)

	/**
	 * User Interface Endpoints
	 */
	pm.ginEngine.GET("/", func(c *gin.Context) {
		c.Redirect(http.StatusFound, "/ui")
	})

	pm.ginEngine.GET("/upstream", func(c *gin.Context) {
		c.Redirect(http.StatusFound, "/ui/models")
	})
	pm.ginEngine.Any("/upstream/*upstreamPath", pm.proxyToUpstream)
	pm.ginEngine.GET("/unload", pm.unloadAllModelsHandler)
	pm.ginEngine.GET("/running", pm.listRunningProcessesHandler)
	pm.ginEngine.GET("/health", func(c *gin.Context) {
		c.String(http.StatusOK, "OK")
	})

	// see cmd/wol-proxy/wol-proxy.go, not logged
	pm.ginEngine.GET("/wol-health", func(c *gin.Context) {
		c.String(http.StatusOK, "OK")
	})

	pm.ginEngine.GET("/favicon.ico", func(c *gin.Context) {
		if data, err := reactStaticFS.ReadFile("ui_dist/favicon.ico"); err == nil {
			c.Data(http.StatusOK, "image/x-icon", data)
		} else {
			c.String(http.StatusInternalServerError, err.Error())
		}
	})

	reactFS, err := GetReactFS()
	if err != nil {
		pm.proxyLogger.Errorf("Failed to load React filesystem: %v", err)
	} else {

		// serve files that exist under /ui/*
		pm.ginEngine.StaticFS("/ui", reactFS)

		// server SPA for UI under /ui/*
		pm.ginEngine.NoRoute(func(c *gin.Context) {
			if !strings.HasPrefix(c.Request.URL.Path, "/ui") {
				c.AbortWithStatus(http.StatusNotFound)
				return
			}

			file, err := reactFS.Open("index.html")
			if err != nil {
				c.String(http.StatusInternalServerError, err.Error())
				return
			}
			defer file.Close()
			http.ServeContent(c.Writer, c.Request, "index.html", time.Now(), file)

		})
	}

	// see: proxymanager_api.go
	// add API handler functions
	addApiHandlers(pm)

	// Disable console color for testing
	gin.DisableConsoleColor()
}

// ServeHTTP implements http.Handler interface
func (pm *ProxyManager) ServeHTTP(w http.ResponseWriter, r *http.Request) {
	pm.ginEngine.ServeHTTP(w, r)
}

// StopProcesses acquires a lock and stops all running upstream processes.
// This is the public method safe for concurrent calls.
// Unlike Shutdown, this method only stops the processes but doesn't perform
// a complete shutdown, allowing for process replacement without full termination.
func (pm *ProxyManager) StopProcesses(strategy StopStrategy) {
	pm.Lock()
	defer pm.Unlock()

	// stop Processes in parallel
	var wg sync.WaitGroup
	for _, processGroup := range pm.processGroups {
		wg.Add(1)
		go func(processGroup *ProcessGroup) {
			defer wg.Done()
			processGroup.StopProcesses(strategy)
		}(processGroup)
	}

	wg.Wait()
}

// Shutdown stops all processes managed by this ProxyManager
func (pm *ProxyManager) Shutdown() {
	pm.Lock()
	defer pm.Unlock()

	pm.proxyLogger.Debug("Shutdown() called in proxy manager")

	var wg sync.WaitGroup
	// Send shutdown signal to all process in groups
	for _, processGroup := range pm.processGroups {
		wg.Add(1)
		go func(processGroup *ProcessGroup) {
			defer wg.Done()
			processGroup.Shutdown()
		}(processGroup)
	}
	wg.Wait()
	pm.shutdownCancel()
}

func (pm *ProxyManager) swapProcessGroup(requestedModel string) (*ProcessGroup, string, error) {
	// de-alias the real model name and get a real one
	realModelName, found := pm.config.RealModelName(requestedModel)
	if !found {
		return nil, realModelName, fmt.Errorf("could not find real modelID for %s", requestedModel)
	}

	processGroup := pm.findGroupByModelName(realModelName)
	if processGroup == nil {
		return nil, realModelName, fmt.Errorf("could not find process group for model %s", requestedModel)
	}

	if processGroup.exclusive {
		pm.proxyLogger.Debugf("Exclusive mode for group %s, stopping other process groups", processGroup.id)
		for groupId, otherGroup := range pm.processGroups {
			if groupId != processGroup.id && !otherGroup.persistent {
				otherGroup.StopProcesses(StopWaitForInflightRequest)
			}
		}
	}

	return processGroup, realModelName, nil
}

func (pm *ProxyManager) listModelsHandler(c *gin.Context) {
	data := make([]gin.H, 0, len(pm.config.Models))
	createdTime := time.Now().Unix()

	for id, modelConfig := range pm.config.Models {
		if modelConfig.Unlisted {
			continue
		}

		newRecord := func(modelId string) gin.H {
			record := gin.H{
				"id":       modelId,
				"object":   "model",
				"created":  createdTime,
				"owned_by": "llama-swap",
			}

			if name := strings.TrimSpace(modelConfig.Name); name != "" {
				record["name"] = name
			}
			if desc := strings.TrimSpace(modelConfig.Description); desc != "" {
				record["description"] = desc
			}

			// Add metadata if present
			if len(modelConfig.Metadata) > 0 {
				record["meta"] = gin.H{
					"llamaswap": modelConfig.Metadata,
				}
			}
			return record
		}

		data = append(data, newRecord(id))

		// Include aliases
		if pm.config.IncludeAliasesInList {
			for _, alias := range modelConfig.Aliases {
				if alias := strings.TrimSpace(alias); alias != "" {
					data = append(data, newRecord(alias))
				}
			}
		}
	}

	// Sort by the "id" key
	sort.Slice(data, func(i, j int) bool {
		si, _ := data[i]["id"].(string)
		sj, _ := data[j]["id"].(string)
		return si < sj
	})

	// Set CORS headers if origin exists
	if origin := c.GetHeader("Origin"); origin != "" {
		c.Header("Access-Control-Allow-Origin", origin)
	}

	// Use gin's JSON method which handles content-type and encoding
	c.JSON(http.StatusOK, gin.H{
		"object": "list",
		"data":   data,
	})
}

func (pm *ProxyManager) proxyToUpstream(c *gin.Context) {
	upstreamPath := c.Param("upstreamPath")

	// split the upstream path by / and search for the model name
	parts := strings.Split(strings.TrimSpace(upstreamPath), "/")
	if len(parts) == 0 {
		pm.sendErrorResponse(c, http.StatusBadRequest, "model id required in path")
		return
	}

	modelFound := false
	searchModelName := ""
	var modelName, remainingPath string
	for i, part := range parts {
		if parts[i] == "" {
			continue
		}

		if searchModelName == "" {
			searchModelName = part
		} else {
			searchModelName = searchModelName + "/" + parts[i]
		}

		if real, ok := pm.config.RealModelName(searchModelName); ok {
			modelName = real
			remainingPath = "/" + strings.Join(parts[i+1:], "/")
			modelFound = true

			// Check if this is exactly a model name with no additional path
			// and doesn't end with a trailing slash
			if remainingPath == "/" && !strings.HasSuffix(upstreamPath, "/") {
				// Build new URL with query parameters preserved
				newPath := "/upstream/" + searchModelName + "/"
				if c.Request.URL.RawQuery != "" {
					newPath += "?" + c.Request.URL.RawQuery
				}

				// Use 308 for non-GET/HEAD requests to preserve method
				if c.Request.Method == http.MethodGet || c.Request.Method == http.MethodHead {
					c.Redirect(http.StatusMovedPermanently, newPath)
				} else {
					c.Redirect(http.StatusPermanentRedirect, newPath)
				}
				return
			}
			break
		}
	}

	if !modelFound {
		pm.sendErrorResponse(c, http.StatusBadRequest, "model id required in path")
		return
	}

	processGroup, realModelName, err := pm.swapProcessGroup(modelName)
	if err != nil {
		pm.sendErrorResponse(c, http.StatusInternalServerError, fmt.Sprintf("error swapping process group: %s", err.Error()))
		return
	}

	// rewrite the path
	originalPath := c.Request.URL.Path
	c.Request.URL.Path = remainingPath

	// attempt to record metrics if it is a POST request
	if pm.metricsMonitor != nil && c.Request.Method == "POST" {
		if err := pm.metricsMonitor.wrapHandler(realModelName, c.Writer, c.Request, processGroup.ProxyRequest); err != nil {
			pm.sendErrorResponse(c, http.StatusInternalServerError, fmt.Sprintf("error proxying metrics wrapped request: %s", err.Error()))
			pm.proxyLogger.Errorf("Error proxying wrapped upstream request for model %s, path=%s", realModelName, originalPath)
			return
		}
	} else {
		if err := processGroup.ProxyRequest(realModelName, c.Writer, c.Request); err != nil {
			pm.sendErrorResponse(c, http.StatusInternalServerError, fmt.Sprintf("error proxying request: %s", err.Error()))
			pm.proxyLogger.Errorf("Error proxying upstream request for model %s, path=%s", realModelName, originalPath)
			return
		}
	}
}

func (pm *ProxyManager) proxyOAIHandler(c *gin.Context) {
	bodyBytes, err := io.ReadAll(c.Request.Body)
	if err != nil {
		pm.sendErrorResponse(c, http.StatusBadRequest, "could not ready request body")
		return
	}

	requestedModel := gjson.GetBytes(bodyBytes, "model").String()
	if requestedModel == "" {
		pm.sendErrorResponse(c, http.StatusBadRequest, "missing or invalid 'model' key")
		return
	}

	realModelName, found := pm.config.RealModelName(requestedModel)
	if !found {
		pm.sendErrorResponse(c, http.StatusBadRequest, fmt.Sprintf("could not find real modelID for %s", requestedModel))
		return
	}

	processGroup, _, err := pm.swapProcessGroup(realModelName)
	if err != nil {
		pm.sendErrorResponse(c, http.StatusInternalServerError, fmt.Sprintf("error swapping process group: %s", err.Error()))
		return
	}

	// issue #69 allow custom model names to be sent to upstream
	useModelName := pm.config.Models[realModelName].UseModelName
	if useModelName != "" {
		bodyBytes, err = sjson.SetBytes(bodyBytes, "model", useModelName)
		if err != nil {
			pm.sendErrorResponse(c, http.StatusInternalServerError, fmt.Sprintf("error rewriting model name in JSON: %s", err.Error()))
			return
		}
	}

	// issue #174 strip parameters from the JSON body
	stripParams, err := pm.config.Models[realModelName].Filters.SanitizedStripParams()
	if err != nil { // just log it and continue
		pm.proxyLogger.Errorf("Error sanitizing strip params string: %s, %s", pm.config.Models[realModelName].Filters.StripParams, err.Error())
	} else {
		for _, param := range stripParams {
			pm.proxyLogger.Debugf("<%s> stripping param: %s", realModelName, param)
			bodyBytes, err = sjson.DeleteBytes(bodyBytes, param)
			if err != nil {
				pm.sendErrorResponse(c, http.StatusInternalServerError, fmt.Sprintf("error deleting parameter %s from request", param))
				return
			}
		}
	}

	c.Request.Body = io.NopCloser(bytes.NewBuffer(bodyBytes))

	// dechunk it as we already have all the body bytes see issue #11
	c.Request.Header.Del("transfer-encoding")
	c.Request.Header.Set("content-length", strconv.Itoa(len(bodyBytes)))
	c.Request.ContentLength = int64(len(bodyBytes))

	// issue #366 extract values that downstream handlers may need
	isStreaming := gjson.GetBytes(bodyBytes, "stream").Bool()
	ctx := context.WithValue(c.Request.Context(), proxyCtxKey("streaming"), isStreaming)
	ctx = context.WithValue(ctx, proxyCtxKey("model"), realModelName)
	c.Request = c.Request.WithContext(ctx)

	if pm.metricsMonitor != nil && c.Request.Method == "POST" {
		if err := pm.metricsMonitor.wrapHandler(realModelName, c.Writer, c.Request, processGroup.ProxyRequest); err != nil {
			pm.sendErrorResponse(c, http.StatusInternalServerError, fmt.Sprintf("error proxying metrics wrapped request: %s", err.Error()))
			pm.proxyLogger.Errorf("Error Proxying Metrics Wrapped Request for processGroup %s and model %s", processGroup.id, realModelName)
			return
		}
	} else {
		if err := processGroup.ProxyRequest(realModelName, c.Writer, c.Request); err != nil {
			pm.sendErrorResponse(c, http.StatusInternalServerError, fmt.Sprintf("error proxying request: %s", err.Error()))
			pm.proxyLogger.Errorf("Error Proxying Request for processGroup %s and model %s", processGroup.id, realModelName)
			return
		}
	}
}

func (pm *ProxyManager) proxyOAIPostFormHandler(c *gin.Context) {
	// Parse multipart form
	if err := c.Request.ParseMultipartForm(32 << 20); err != nil { // 32MB max memory, larger files go to tmp disk
		pm.sendErrorResponse(c, http.StatusBadRequest, fmt.Sprintf("error parsing multipart form: %s", err.Error()))
		return
	}

	// Get model parameter from the form
	requestedModel := c.Request.FormValue("model")
	if requestedModel == "" {
		pm.sendErrorResponse(c, http.StatusBadRequest, "missing or invalid 'model' parameter in form data")
		return
	}

	processGroup, realModelName, err := pm.swapProcessGroup(requestedModel)
	if err != nil {
		pm.sendErrorResponse(c, http.StatusInternalServerError, fmt.Sprintf("error swapping process group: %s", err.Error()))
		return
	}

	// We need to reconstruct the multipart form in any case since the body is consumed
	// Create a new buffer for the reconstructed request
	var requestBuffer bytes.Buffer
	multipartWriter := multipart.NewWriter(&requestBuffer)

	// Copy all form values
	for key, values := range c.Request.MultipartForm.Value {
		for _, value := range values {
			fieldValue := value
			// If this is the model field and we have a profile, use just the model name
			if key == "model" {
				// # issue #69 allow custom model names to be sent to upstream
				useModelName := pm.config.Models[realModelName].UseModelName

				if useModelName != "" {
					fieldValue = useModelName
				} else {
					fieldValue = requestedModel
				}
			}
			field, err := multipartWriter.CreateFormField(key)
			if err != nil {
				pm.sendErrorResponse(c, http.StatusInternalServerError, "error recreating form field")
				return
			}
			if _, err = field.Write([]byte(fieldValue)); err != nil {
				pm.sendErrorResponse(c, http.StatusInternalServerError, "error writing form field")
				return
			}
		}
	}

	// Copy all files from the original request
	for key, fileHeaders := range c.Request.MultipartForm.File {
		for _, fileHeader := range fileHeaders {
			formFile, err := multipartWriter.CreateFormFile(key, fileHeader.Filename)
			if err != nil {
				pm.sendErrorResponse(c, http.StatusInternalServerError, "error recreating form file")
				return
			}

			file, err := fileHeader.Open()
			if err != nil {
				pm.sendErrorResponse(c, http.StatusInternalServerError, "error opening uploaded file")
				return
			}

			if _, err = io.Copy(formFile, file); err != nil {
				file.Close()
				pm.sendErrorResponse(c, http.StatusInternalServerError, "error copying file data")
				return
			}
			file.Close()
		}
	}

	// Close the multipart writer to finalize the form
	if err := multipartWriter.Close(); err != nil {
		pm.sendErrorResponse(c, http.StatusInternalServerError, "error finalizing multipart form")
		return
	}

	// Create a new request with the reconstructed form data
	modifiedReq, err := http.NewRequestWithContext(
		c.Request.Context(),
		c.Request.Method,
		c.Request.URL.String(),
		&requestBuffer,
	)
	if err != nil {
		pm.sendErrorResponse(c, http.StatusInternalServerError, "error creating modified request")
		return
	}

	// Copy the headers from the original request
	modifiedReq.Header = c.Request.Header.Clone()
	modifiedReq.Header.Set("Content-Type", multipartWriter.FormDataContentType())

	// set the content length of the body
	modifiedReq.Header.Set("Content-Length", strconv.Itoa(requestBuffer.Len()))
	modifiedReq.ContentLength = int64(requestBuffer.Len())

	// Use the modified request for proxying
	if err := processGroup.ProxyRequest(realModelName, c.Writer, modifiedReq); err != nil {
		pm.sendErrorResponse(c, http.StatusInternalServerError, fmt.Sprintf("error proxying request: %s", err.Error()))
		pm.proxyLogger.Errorf("Error Proxying Request for processGroup %s and model %s", processGroup.id, realModelName)
		return
	}
}

func (pm *ProxyManager) sendErrorResponse(c *gin.Context, statusCode int, message string) {
	acceptHeader := c.GetHeader("Accept")

	if strings.Contains(acceptHeader, "application/json") {
		c.JSON(statusCode, gin.H{"error": message})
	} else {
		c.String(statusCode, message)
	}
}

func (pm *ProxyManager) unloadAllModelsHandler(c *gin.Context) {
	pm.StopProcesses(StopImmediately)
	c.String(http.StatusOK, "OK")
}

func (pm *ProxyManager) listRunningProcessesHandler(context *gin.Context) {
	context.Header("Content-Type", "application/json")
	runningProcesses := make([]gin.H, 0) // Default to an empty response.

	for _, processGroup := range pm.processGroups {
		for _, process := range processGroup.processes {
			if process.CurrentState() == StateReady {
				runningProcesses = append(runningProcesses, gin.H{
					"model": process.ID,
					"state": process.state,
				})
			}
		}
	}

	// Put the results under the `running` key.
	response := gin.H{
		"running": runningProcesses,
	}

	context.JSON(http.StatusOK, response) // Always return 200 OK
}

func (pm *ProxyManager) findGroupByModelName(modelName string) *ProcessGroup {
	for _, group := range pm.processGroups {
		if group.HasMember(modelName) {
			return group
		}
	}
	return nil
}


### proxy/processgroup.go
package proxy

import (
	"fmt"
	"net/http"
	"slices"
	"sync"

	"github.com/mostlygeek/llama-swap/proxy/config"
)

type ProcessGroup struct {
	sync.Mutex

	config     config.Config
	id         string
	swap       bool
	exclusive  bool
	persistent bool

	proxyLogger    *LogMonitor
	upstreamLogger *LogMonitor

	// map of current processes
	processes       map[string]*Process
	lastUsedProcess string
}

func NewProcessGroup(id string, config config.Config, proxyLogger *LogMonitor, upstreamLogger *LogMonitor) *ProcessGroup {
	groupConfig, ok := config.Groups[id]
	if !ok {
		panic("Unable to find configuration for group id: " + id)
	}

	pg := &ProcessGroup{
		id:             id,
		config:         config,
		swap:           groupConfig.Swap,
		exclusive:      groupConfig.Exclusive,
		persistent:     groupConfig.Persistent,
		proxyLogger:    proxyLogger,
		upstreamLogger: upstreamLogger,
		processes:      make(map[string]*Process),
	}

	// Create a Process for each member in the group
	for _, modelID := range groupConfig.Members {
		modelConfig, modelID, _ := pg.config.FindConfig(modelID)
		process := NewProcess(modelID, pg.config.HealthCheckTimeout, modelConfig, pg.upstreamLogger, pg.proxyLogger)
		pg.processes[modelID] = process
	}

	return pg
}

// ProxyRequest proxies a request to the specified model
func (pg *ProcessGroup) ProxyRequest(modelID string, writer http.ResponseWriter, request *http.Request) error {
	if !pg.HasMember(modelID) {
		return fmt.Errorf("model %s not part of group %s", modelID, pg.id)
	}

	if pg.swap {
		pg.Lock()
		if pg.lastUsedProcess != modelID {

			// is there something already running?
			if pg.lastUsedProcess != "" {
				pg.processes[pg.lastUsedProcess].Stop()
			}

			// wait for the request to the new model to be fully handled
			// and prevent race conditions see issue #277
			pg.processes[modelID].ProxyRequest(writer, request)
			pg.lastUsedProcess = modelID

			// short circuit and exit
			pg.Unlock()
			return nil
		}
		pg.Unlock()
	}

	pg.processes[modelID].ProxyRequest(writer, request)
	return nil
}

func (pg *ProcessGroup) HasMember(modelName string) bool {
	return slices.Contains(pg.config.Groups[pg.id].Members, modelName)
}

func (pg *ProcessGroup) StopProcess(modelID string, strategy StopStrategy) error {
	pg.Lock()

	process, exists := pg.processes[modelID]
	if !exists {
		pg.Unlock()
		return fmt.Errorf("process not found for %s", modelID)
	}

	if pg.lastUsedProcess == modelID {
		pg.lastUsedProcess = ""
	}
	pg.Unlock()

	switch strategy {
	case StopImmediately:
		process.StopImmediately()
	default:
		process.Stop()
	}
	return nil
}

func (pg *ProcessGroup) StopProcesses(strategy StopStrategy) {
	pg.Lock()
	defer pg.Unlock()

	if len(pg.processes) == 0 {
		return
	}

	// stop Processes in parallel
	var wg sync.WaitGroup
	for _, process := range pg.processes {
		wg.Add(1)
		go func(process *Process) {
			defer wg.Done()
			switch strategy {
			case StopImmediately:
				process.StopImmediately()
			default:
				process.Stop()
			}
		}(process)
	}
	wg.Wait()
}

func (pg *ProcessGroup) Shutdown() {
	var wg sync.WaitGroup
	for _, process := range pg.processes {
		wg.Add(1)
		go func(process *Process) {
			defer wg.Done()
			process.Shutdown()
		}(process)
	}
	wg.Wait()
}


### proxy/metrics_monitor.go
package proxy

import (
	"bytes"
	"encoding/json"
	"fmt"
	"io"
	"net/http"
	"strings"
	"sync"
	"time"

	"github.com/gin-gonic/gin"
	"github.com/mostlygeek/llama-swap/event"
	"github.com/tidwall/gjson"
)

// TokenMetrics represents parsed token statistics from llama-server logs
type TokenMetrics struct {
	ID              int       `json:"id"`
	Timestamp       time.Time `json:"timestamp"`
	Model           string    `json:"model"`
	CachedTokens    int       `json:"cache_tokens"`
	InputTokens     int       `json:"input_tokens"`
	OutputTokens    int       `json:"output_tokens"`
	PromptPerSecond float64   `json:"prompt_per_second"`
	TokensPerSecond float64   `json:"tokens_per_second"`
	DurationMs      int       `json:"duration_ms"`
}

// TokenMetricsEvent represents a token metrics event
type TokenMetricsEvent struct {
	Metrics TokenMetrics
}

func (e TokenMetricsEvent) Type() uint32 {
	return TokenMetricsEventID // defined in events.go
}

// metricsMonitor parses llama-server output for token statistics
type metricsMonitor struct {
	mu         sync.RWMutex
	metrics    []TokenMetrics
	maxMetrics int
	nextID     int
	logger     *LogMonitor
}

func newMetricsMonitor(logger *LogMonitor, maxMetrics int) *metricsMonitor {
	mp := &metricsMonitor{
		logger:     logger,
		maxMetrics: maxMetrics,
	}

	return mp
}

// addMetrics adds a new metric to the collection and publishes an event
func (mp *metricsMonitor) addMetrics(metric TokenMetrics) {
	mp.mu.Lock()
	defer mp.mu.Unlock()

	metric.ID = mp.nextID
	mp.nextID++
	mp.metrics = append(mp.metrics, metric)
	if len(mp.metrics) > mp.maxMetrics {
		mp.metrics = mp.metrics[len(mp.metrics)-mp.maxMetrics:]
	}
	event.Emit(TokenMetricsEvent{Metrics: metric})
}

// getMetrics returns a copy of the current metrics
func (mp *metricsMonitor) getMetrics() []TokenMetrics {
	mp.mu.RLock()
	defer mp.mu.RUnlock()

	result := make([]TokenMetrics, len(mp.metrics))
	copy(result, mp.metrics)
	return result
}

// getMetricsJSON returns metrics as JSON
func (mp *metricsMonitor) getMetricsJSON() ([]byte, error) {
	mp.mu.RLock()
	defer mp.mu.RUnlock()
	return json.Marshal(mp.metrics)
}

// wrapHandler wraps the proxy handler to extract token metrics
// if wrapHandler returns an error it is safe to assume that no
// data was sent to the client
func (mp *metricsMonitor) wrapHandler(
	modelID string,
	writer gin.ResponseWriter,
	request *http.Request,
	next func(modelID string, w http.ResponseWriter, r *http.Request) error,
) error {
	recorder := newBodyCopier(writer)
	if err := next(modelID, recorder, request); err != nil {
		return err
	}

	// after this point we have to assume that data was sent to the client
	// and we can only log errors but not send them to clients

	if recorder.Status() != http.StatusOK {
		mp.logger.Warnf("metrics skipped, HTTP status=%d, path=%s", recorder.Status(), request.URL.Path)
		return nil
	}

	body := recorder.body.Bytes()
	if len(body) == 0 {
		mp.logger.Warn("metrics skipped, empty body")
		return nil
	}

	if strings.Contains(recorder.Header().Get("Content-Type"), "text/event-stream") {
		if tm, err := processStreamingResponse(modelID, recorder.StartTime(), body); err != nil {
			mp.logger.Warnf("error processing streaming response: %v, path=%s", err, request.URL.Path)
		} else {
			mp.addMetrics(tm)
		}
	} else {
		if gjson.ValidBytes(body) {
			if tm, err := parseMetrics(modelID, recorder.StartTime(), gjson.ParseBytes(body)); err != nil {
				mp.logger.Warnf("error parsing metrics: %v, path=%s", err, request.URL.Path)
			} else {
				mp.addMetrics(tm)
			}
		} else {
			mp.logger.Warnf("metrics skipped, invalid JSON in response body path=%s", request.URL.Path)
		}
	}

	return nil
}

func processStreamingResponse(modelID string, start time.Time, body []byte) (TokenMetrics, error) {
	// Iterate **backwards** through the body looking for the data payload with
	// usage data. This avoids allocating a slice of all lines via bytes.Split.

	// Start from the end of the body and scan backwards for newlines
	pos := len(body)
	for pos > 0 {
		// Find the previous newline (or start of body)
		lineStart := bytes.LastIndexByte(body[:pos], '\n')
		if lineStart == -1 {
			lineStart = 0
		} else {
			lineStart++ // Move past the newline
		}

		line := bytes.TrimSpace(body[lineStart:pos])
		pos = lineStart - 1 // Move position before the newline for next iteration

		if len(line) == 0 {
			continue
		}

		// SSE payload always follows "data:"
		prefix := []byte("data:")
		if !bytes.HasPrefix(line, prefix) {
			continue
		}
		data := bytes.TrimSpace(line[len(prefix):])

		if len(data) == 0 {
			continue
		}

		if bytes.Equal(data, []byte("[DONE]")) {
			// [DONE] line itself contains nothing of interest.
			continue
		}

		if gjson.ValidBytes(data) {
			return parseMetrics(modelID, start, gjson.ParseBytes(data))
		}
	}

	return TokenMetrics{}, fmt.Errorf("no valid JSON data found in stream")
}

func parseMetrics(modelID string, start time.Time, jsonData gjson.Result) (TokenMetrics, error) {
	usage := jsonData.Get("usage")
	timings := jsonData.Get("timings")
	if !usage.Exists() && !timings.Exists() {
		return TokenMetrics{}, fmt.Errorf("no usage or timings data found")
	}
	// default values
	cachedTokens := -1 // unknown or missing data
	outputTokens := 0
	inputTokens := 0

	// timings data
	tokensPerSecond := -1.0
	promptPerSecond := -1.0
	durationMs := int(time.Since(start).Milliseconds())

	if usage.Exists() {
		outputTokens = int(jsonData.Get("usage.completion_tokens").Int())
		inputTokens = int(jsonData.Get("usage.prompt_tokens").Int())
	}

	// use llama-server's timing data for tok/sec and duration as it is more accurate
	if timings.Exists() {
		inputTokens = int(jsonData.Get("timings.prompt_n").Int())
		outputTokens = int(jsonData.Get("timings.predicted_n").Int())
		promptPerSecond = jsonData.Get("timings.prompt_per_second").Float()
		tokensPerSecond = jsonData.Get("timings.predicted_per_second").Float()
		durationMs = int(jsonData.Get("timings.prompt_ms").Float() + jsonData.Get("timings.predicted_ms").Float())

		if cachedValue := jsonData.Get("timings.cache_n"); cachedValue.Exists() {
			cachedTokens = int(cachedValue.Int())
		}
	}

	return TokenMetrics{
		Timestamp:       time.Now(),
		Model:           modelID,
		CachedTokens:    cachedTokens,
		InputTokens:     inputTokens,
		OutputTokens:    outputTokens,
		PromptPerSecond: promptPerSecond,
		TokensPerSecond: tokensPerSecond,
		DurationMs:      durationMs,
	}, nil
}

// responseBodyCopier records the response body and writes to the original response writer
// while also capturing it in a buffer for later processing
type responseBodyCopier struct {
	gin.ResponseWriter
	body  *bytes.Buffer
	tee   io.Writer
	start time.Time
}

func newBodyCopier(w gin.ResponseWriter) *responseBodyCopier {
	bodyBuffer := &bytes.Buffer{}
	return &responseBodyCopier{
		ResponseWriter: w,
		body:           bodyBuffer,
		tee:            io.MultiWriter(w, bodyBuffer),
	}
}

func (w *responseBodyCopier) Write(b []byte) (int, error) {
	if w.start.IsZero() {
		w.start = time.Now()
	}

	// Single write operation that writes to both the response and buffer
	return w.tee.Write(b)
}

func (w *responseBodyCopier) WriteHeader(statusCode int) {
	w.ResponseWriter.WriteHeader(statusCode)
}

func (w *responseBodyCopier) Header() http.Header {
	return w.ResponseWriter.Header()
}

func (w *responseBodyCopier) StartTime() time.Time {
	return w.start
}


### proxy/sanitize_cors_test.go
package proxy

import "testing"

func TestSanitizeAccessControlRequestHeaderValues(t *testing.T) {
	tests := []struct {
		name     string
		input    string
		expected string
	}{
		{
			name:     "empty string",
			input:    "",
			expected: "",
		},
		{
			name:     "whitespace only",
			input:    "   ",
			expected: "",
		},
		{
			name:     "single valid value",
			input:    "content-type",
			expected: "content-type",
		},
		{
			name:     "multiple valid values",
			input:    "content-type, authorization, x-requested-with",
			expected: "content-type, authorization, x-requested-with",
		},
		{
			name:     "values with extra spaces",
			input:    "  content-type  ,  authorization  ",
			expected: "content-type, authorization",
		},
		{
			name:     "values with tabs",
			input:    "content-type,\tauthorization",
			expected: "content-type, authorization",
		},
		{
			name:     "values with invalid characters",
			input:    "content-type, auth\n, x-requested-with\r",
			expected: "content-type, auth, x-requested-with",
		},
		{
			name:     "empty values in list",
			input:    "content-type,,authorization",
			expected: "content-type, authorization",
		},
		{
			name:     "leading and trailing commas",
			input:    ",content-type,authorization,",
			expected: "content-type, authorization",
		},
		{
			name:     "mixed valid and invalid values",
			input:    "content-type, \x00invalid, x-requested-with",
			expected: "content-type, x-requested-with",
		},
		{
			name:     "mixed case values",
			input:    "Content-Type, my-Valid-Header, Another-hEader",
			expected: "Content-Type, my-Valid-Header, Another-hEader",
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			got := SanitizeAccessControlRequestHeaderValues(tt.input)
			if got != tt.expected {
				t.Errorf("SanitizeAccessControlRequestHeaderValues(%q) = %q, want %q",
					tt.input, got, tt.expected)
			}
		})
	}
}


### proxy/discardWriter.go
package proxy

import "net/http"

// Custom discard writer that implements http.ResponseWriter but just discards everything
type DiscardWriter struct {
	header http.Header
	status int
}

func (w *DiscardWriter) Header() http.Header {
	if w.header == nil {
		w.header = make(http.Header)
	}
	return w.header
}

func (w *DiscardWriter) Write(data []byte) (int, error) {
	return len(data), nil
}

func (w *DiscardWriter) WriteHeader(code int) {
	w.status = code
}

// Satisfy the http.Flusher interface for streaming responses
func (w *DiscardWriter) Flush() {}


### proxy/proxymanager_api.go
package proxy

import (
	"context"
	"encoding/json"
	"fmt"
	"net/http"
	"sort"
	"strings"

	"github.com/gin-gonic/gin"
	"github.com/mostlygeek/llama-swap/event"
)

type Model struct {
	Id          string `json:"id"`
	Name        string `json:"name"`
	Description string `json:"description"`
	State       string `json:"state"`
	Unlisted    bool   `json:"unlisted"`
}

func addApiHandlers(pm *ProxyManager) {
	// Add API endpoints for React to consume
	apiGroup := pm.ginEngine.Group("/api")
	{
		apiGroup.POST("/models/unload", pm.apiUnloadAllModels)
		apiGroup.POST("/models/unload/*model", pm.apiUnloadSingleModelHandler)
		apiGroup.GET("/events", pm.apiSendEvents)
		apiGroup.GET("/metrics", pm.apiGetMetrics)
	}
}

func (pm *ProxyManager) apiUnloadAllModels(c *gin.Context) {
	pm.StopProcesses(StopImmediately)
	c.JSON(http.StatusOK, gin.H{"msg": "ok"})
}

func (pm *ProxyManager) getModelStatus() []Model {
	// Extract keys and sort them
	models := []Model{}

	modelIDs := make([]string, 0, len(pm.config.Models))
	for modelID := range pm.config.Models {
		modelIDs = append(modelIDs, modelID)
	}
	sort.Strings(modelIDs)

	// Iterate over sorted keys
	for _, modelID := range modelIDs {
		// Get process state
		processGroup := pm.findGroupByModelName(modelID)
		state := "unknown"
		if processGroup != nil {
			process := processGroup.processes[modelID]
			if process != nil {
				var stateStr string
				switch process.CurrentState() {
				case StateReady:
					stateStr = "ready"
				case StateStarting:
					stateStr = "starting"
				case StateStopping:
					stateStr = "stopping"
				case StateShutdown:
					stateStr = "shutdown"
				case StateStopped:
					stateStr = "stopped"
				default:
					stateStr = "unknown"
				}
				state = stateStr
			}
		}
		models = append(models, Model{
			Id:          modelID,
			Name:        pm.config.Models[modelID].Name,
			Description: pm.config.Models[modelID].Description,
			State:       state,
			Unlisted:    pm.config.Models[modelID].Unlisted,
		})
	}

	return models
}

type messageType string

const (
	msgTypeModelStatus messageType = "modelStatus"
	msgTypeLogData     messageType = "logData"
	msgTypeMetrics     messageType = "metrics"
)

type messageEnvelope struct {
	Type messageType `json:"type"`
	Data string      `json:"data"`
}

// sends a stream of different message types that happen on the server
func (pm *ProxyManager) apiSendEvents(c *gin.Context) {
	c.Header("Content-Type", "text/event-stream")
	c.Header("Cache-Control", "no-cache")
	c.Header("Connection", "keep-alive")
	c.Header("X-Content-Type-Options", "nosniff")
	// prevent nginx from buffering SSE
	c.Header("X-Accel-Buffering", "no")

	sendBuffer := make(chan messageEnvelope, 25)
	ctx, cancel := context.WithCancel(c.Request.Context())
	sendModels := func() {
		data, err := json.Marshal(pm.getModelStatus())
		if err == nil {
			msg := messageEnvelope{Type: msgTypeModelStatus, Data: string(data)}
			select {
			case sendBuffer <- msg:
			case <-ctx.Done():
				return
			default:
			}

		}
	}

	sendLogData := func(source string, data []byte) {
		data, err := json.Marshal(gin.H{
			"source": source,
			"data":   string(data),
		})
		if err == nil {
			select {
			case sendBuffer <- messageEnvelope{Type: msgTypeLogData, Data: string(data)}:
			case <-ctx.Done():
				return
			default:
			}
		}
	}

	sendMetrics := func(metrics []TokenMetrics) {
		jsonData, err := json.Marshal(metrics)
		if err == nil {
			select {
			case sendBuffer <- messageEnvelope{Type: msgTypeMetrics, Data: string(jsonData)}:
			case <-ctx.Done():
				return
			default:
			}
		}
	}

	/**
	 * Send updated models list
	 */
	defer event.On(func(e ProcessStateChangeEvent) {
		sendModels()
	})()
	defer event.On(func(e ConfigFileChangedEvent) {
		sendModels()
	})()

	/**
	 * Send Log data
	 */
	defer pm.proxyLogger.OnLogData(func(data []byte) {
		sendLogData("proxy", data)
	})()
	defer pm.upstreamLogger.OnLogData(func(data []byte) {
		sendLogData("upstream", data)
	})()

	/**
	 * Send Metrics data
	 */
	defer event.On(func(e TokenMetricsEvent) {
		sendMetrics([]TokenMetrics{e.Metrics})
	})()

	// send initial batch of data
	sendLogData("proxy", pm.proxyLogger.GetHistory())
	sendLogData("upstream", pm.upstreamLogger.GetHistory())
	sendModels()
	sendMetrics(pm.metricsMonitor.getMetrics())

	for {
		select {
		case <-c.Request.Context().Done():
			cancel()
			return
		case <-pm.shutdownCtx.Done():
			cancel()
			return
		case msg := <-sendBuffer:
			c.SSEvent("message", msg)
			c.Writer.Flush()
		}
	}
}

func (pm *ProxyManager) apiGetMetrics(c *gin.Context) {
	jsonData, err := pm.metricsMonitor.getMetricsJSON()
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "failed to get metrics"})
		return
	}
	c.Data(http.StatusOK, "application/json", jsonData)
}

func (pm *ProxyManager) apiUnloadSingleModelHandler(c *gin.Context) {
	requestedModel := strings.TrimPrefix(c.Param("model"), "/")
	realModelName, found := pm.config.RealModelName(requestedModel)
	if !found {
		pm.sendErrorResponse(c, http.StatusNotFound, "Model not found")
		return
	}

	processGroup := pm.findGroupByModelName(realModelName)
	if processGroup == nil {
		pm.sendErrorResponse(c, http.StatusInternalServerError, fmt.Sprintf("process group not found for model %s", requestedModel))
		return
	}

	if err := processGroup.StopProcess(realModelName, StopImmediately); err != nil {
		pm.sendErrorResponse(c, http.StatusInternalServerError, fmt.Sprintf("error stopping process: %s", err.Error()))
		return
	} else {
		c.String(http.StatusOK, "OK")
	}
}


### proxy/proxymanager_loghandlers.go
package proxy

import (
	"context"
	"fmt"
	"net/http"
	"strings"

	"github.com/gin-gonic/gin"
)

func (pm *ProxyManager) sendLogsHandlers(c *gin.Context) {
	accept := c.GetHeader("Accept")
	if strings.Contains(accept, "text/html") {
		c.Redirect(http.StatusFound, "/ui/")
	} else {
		c.Header("Content-Type", "text/plain")
		history := pm.muxLogger.GetHistory()
		_, err := c.Writer.Write(history)
		if err != nil {
			c.AbortWithError(http.StatusInternalServerError, err)
			return
		}
	}
}

func (pm *ProxyManager) streamLogsHandler(c *gin.Context) {
	c.Header("Content-Type", "text/plain")
	c.Header("Transfer-Encoding", "chunked")
	c.Header("X-Content-Type-Options", "nosniff")
	// prevent nginx from buffering streamed logs
	c.Header("X-Accel-Buffering", "no")

	logMonitorId := c.Param("logMonitorID")
	logger, err := pm.getLogger(logMonitorId)
	if err != nil {
		c.String(http.StatusBadRequest, err.Error())
		return
	}

	flusher, ok := c.Writer.(http.Flusher)
	if !ok {
		c.AbortWithError(http.StatusInternalServerError, fmt.Errorf("streaming unsupported"))
		return
	}

	_, skipHistory := c.GetQuery("no-history")
	// Send history first if not skipped

	if !skipHistory {
		history := logger.GetHistory()
		if len(history) != 0 {
			c.Writer.Write(history)
			flusher.Flush()
		}
	}

	sendChan := make(chan []byte, 10)
	ctx, cancel := context.WithCancel(c.Request.Context())
	defer logger.OnLogData(func(data []byte) {
		select {
		case sendChan <- data:
		case <-ctx.Done():
			return
		default:
		}
	})()

	for {
		select {
		case <-c.Request.Context().Done():
			cancel()
			return
		case <-pm.shutdownCtx.Done():
			cancel()
			return
		case data := <-sendChan:
			c.Writer.Write(data)
			flusher.Flush()
		}
	}
}

// getLogger searches for the appropriate logger based on the logMonitorId
func (pm *ProxyManager) getLogger(logMonitorId string) (*LogMonitor, error) {
	var logger *LogMonitor

	if logMonitorId == "" {
		// maintain the default
		logger = pm.muxLogger
	} else if logMonitorId == "proxy" {
		logger = pm.proxyLogger
	} else if logMonitorId == "upstream" {
		logger = pm.upstreamLogger
	} else {
		return nil, fmt.Errorf("invalid logger. Use 'proxy' or 'upstream'")
	}

	return logger, nil
}


### proxy/process.go
package proxy

import (
	"context"
	"encoding/json"
	"errors"
	"fmt"
	"math/rand"
	"net"
	"net/http"
	"net/http/httputil"
	"net/url"
	"os/exec"
	"strings"
	"sync"
	"sync/atomic"
	"syscall"
	"time"

	"github.com/mostlygeek/llama-swap/event"
	"github.com/mostlygeek/llama-swap/proxy/config"
)

type ProcessState string

const (
	StateStopped  ProcessState = ProcessState("stopped")
	StateStarting ProcessState = ProcessState("starting")
	StateReady    ProcessState = ProcessState("ready")
	StateStopping ProcessState = ProcessState("stopping")

	// process is shutdown and will not be restarted
	StateShutdown ProcessState = ProcessState("shutdown")
)

type StopStrategy int

const (
	StopImmediately StopStrategy = iota
	StopWaitForInflightRequest
)

type Process struct {
	ID           string
	config       config.ModelConfig
	cmd          *exec.Cmd
	reverseProxy *httputil.ReverseProxy

	// PR #155 called to cancel the upstream process
	cmdMutex       sync.RWMutex
	cancelUpstream context.CancelFunc

	// closed when command exits
	cmdWaitChan chan struct{}

	processLogger *LogMonitor
	proxyLogger   *LogMonitor

	healthCheckTimeout      int
	healthCheckLoopInterval time.Duration

	lastRequestHandledMutex sync.RWMutex
	lastRequestHandled      time.Time

	stateMutex sync.RWMutex
	state      ProcessState

	inFlightRequests      sync.WaitGroup
	inFlightRequestsCount atomic.Int32

	// used to block on multiple start() calls
	waitStarting sync.WaitGroup

	// for managing concurrency limits
	concurrencyLimitSemaphore chan struct{}

	// used for testing to override the default value
	gracefulStopTimeout time.Duration

	// track the number of failed starts
	failedStartCount int
}

func NewProcess(ID string, healthCheckTimeout int, config config.ModelConfig, processLogger *LogMonitor, proxyLogger *LogMonitor) *Process {
	concurrentLimit := 10
	if config.ConcurrencyLimit > 0 {
		concurrentLimit = config.ConcurrencyLimit
	}

	// Setup the reverse proxy.
	proxyURL, err := url.Parse(config.Proxy)
	if err != nil {
		proxyLogger.Errorf("<%s> invalid proxy URL %q: %v", ID, config.Proxy, err)
	}

	var reverseProxy *httputil.ReverseProxy
	if proxyURL != nil {
		reverseProxy = httputil.NewSingleHostReverseProxy(proxyURL)
		reverseProxy.ModifyResponse = func(resp *http.Response) error {
			// prevent nginx from buffering streaming responses (e.g., SSE)
			if strings.Contains(strings.ToLower(resp.Header.Get("Content-Type")), "text/event-stream") {
				resp.Header.Set("X-Accel-Buffering", "no")
			}
			return nil
		}
	}

	return &Process{
		ID:                      ID,
		config:                  config,
		cmd:                     nil,
		reverseProxy:            reverseProxy,
		cancelUpstream:          nil,
		processLogger:           processLogger,
		proxyLogger:             proxyLogger,
		healthCheckTimeout:      healthCheckTimeout,
		healthCheckLoopInterval: 5 * time.Second, /* default, can not be set by user - used for testing */
		state:                   StateStopped,

		// concurrency limit
		concurrencyLimitSemaphore: make(chan struct{}, concurrentLimit),

		// To be removed when migration over exec.CommandContext is complete
		// stop timeout
		gracefulStopTimeout: 10 * time.Second,
		cmdWaitChan:         make(chan struct{}),
	}
}

// LogMonitor returns the log monitor associated with the process.
func (p *Process) LogMonitor() *LogMonitor {
	return p.processLogger
}

// setLastRequestHandled sets the last request handled time in a thread-safe manner.
func (p *Process) setLastRequestHandled(t time.Time) {
	p.lastRequestHandledMutex.Lock()
	defer p.lastRequestHandledMutex.Unlock()
	p.lastRequestHandled = t
}

// getLastRequestHandled gets the last request handled time in a thread-safe manner.
func (p *Process) getLastRequestHandled() time.Time {
	p.lastRequestHandledMutex.RLock()
	defer p.lastRequestHandledMutex.RUnlock()
	return p.lastRequestHandled
}

// custom error types for swapping state
var (
	ErrExpectedStateMismatch  = errors.New("expected state mismatch")
	ErrInvalidStateTransition = errors.New("invalid state transition")
)

// swapState performs a compare and swap of the state atomically. It returns the current state
// and an error if the swap failed.
func (p *Process) swapState(expectedState, newState ProcessState) (ProcessState, error) {
	p.stateMutex.Lock()
	defer p.stateMutex.Unlock()

	if p.state != expectedState {
		p.proxyLogger.Warnf("<%s> swapState() Unexpected current state %s, expected %s", p.ID, p.state, expectedState)
		return p.state, ErrExpectedStateMismatch
	}

	if !isValidTransition(p.state, newState) {
		p.proxyLogger.Warnf("<%s> swapState() Invalid state transition from %s to %s", p.ID, p.state, newState)
		return p.state, ErrInvalidStateTransition
	}

	p.state = newState

	// Atomically increment waitStarting when entering StateStarting
	// This ensures any thread that sees StateStarting will also see the WaitGroup counter incremented
	if newState == StateStarting {
		p.waitStarting.Add(1)
	}

	p.proxyLogger.Debugf("<%s> swapState() State transitioned from %s to %s", p.ID, expectedState, newState)
	event.Emit(ProcessStateChangeEvent{ProcessName: p.ID, NewState: newState, OldState: expectedState})
	return p.state, nil
}

// Helper function to encapsulate transition rules
func isValidTransition(from, to ProcessState) bool {
	switch from {
	case StateStopped:
		return to == StateStarting
	case StateStarting:
		return to == StateReady || to == StateStopping || to == StateStopped
	case StateReady:
		return to == StateStopping
	case StateStopping:
		return to == StateStopped || to == StateShutdown
	case StateShutdown:
		return false // No transitions allowed from these states
	}
	return false
}

func (p *Process) CurrentState() ProcessState {
	p.stateMutex.RLock()
	defer p.stateMutex.RUnlock()
	return p.state
}

// forceState forces the process state to the new state with mutex protection.
// This should only be used in exceptional cases where the normal state transition
// validation via swapState() cannot be used.
func (p *Process) forceState(newState ProcessState) {
	p.stateMutex.Lock()
	defer p.stateMutex.Unlock()
	p.state = newState
}

// start starts the upstream command, checks the health endpoint, and sets the state to Ready
// it is a private method because starting is automatic but stopping can be called
// at any time.
func (p *Process) start() error {

	if p.config.Proxy == "" {
		return fmt.Errorf("can not start(), upstream proxy missing")
	}

	args, err := p.config.SanitizedCommand()
	if err != nil {
		return fmt.Errorf("unable to get sanitized command: %v", err)
	}

	if curState, err := p.swapState(StateStopped, StateStarting); err != nil {
		if err == ErrExpectedStateMismatch {
			// already starting, just wait for it to complete and expect
			// it to be be in the Ready start after. If not, return an error
			if curState == StateStarting {
				p.waitStarting.Wait()
				if state := p.CurrentState(); state == StateReady {
					return nil
				} else {
					return fmt.Errorf("process was already starting but wound up in state %v", state)
				}
			} else {
				return fmt.Errorf("processes was in state %v when start() was called", curState)
			}
		} else {
			return fmt.Errorf("failed to set Process state to starting: current state: %v, error: %v", curState, err)
		}
	}

	// waitStarting.Add(1) is now called atomically in swapState() when transitioning to StateStarting
	defer p.waitStarting.Done()
	cmdContext, ctxCancelUpstream := context.WithCancel(context.Background())

	p.cmd = exec.CommandContext(cmdContext, args[0], args[1:]...)
	p.cmd.Stdout = p.processLogger
	p.cmd.Stderr = p.processLogger
	p.cmd.Env = append(p.cmd.Environ(), p.config.Env...)
	p.cmd.Cancel = p.cmdStopUpstreamProcess
	p.cmd.WaitDelay = p.gracefulStopTimeout

	p.cmdMutex.Lock()
	p.cancelUpstream = ctxCancelUpstream
	p.cmdWaitChan = make(chan struct{})
	p.cmdMutex.Unlock()

	p.failedStartCount++ // this will be reset to zero when the process has successfully started

	p.proxyLogger.Debugf("<%s> Executing start command: %s, env: %s", p.ID, strings.Join(args, " "), strings.Join(p.config.Env, ", "))
	err = p.cmd.Start()

	// Set process state to failed
	if err != nil {
		if curState, swapErr := p.swapState(StateStarting, StateStopped); swapErr != nil {
			p.forceState(StateStopped) // force it into a stopped state
			return fmt.Errorf(
				"failed to start command '%s' and state swap failed. command error: %v, current state: %v, state swap error: %v",
				strings.Join(args, " "), err, curState, swapErr,
			)
		}
		return fmt.Errorf("start() failed for command '%s': %v", strings.Join(args, " "), err)
	}

	// Capture the exit error for later signalling
	go p.waitForCmd()

	// One of three things can happen at this stage:
	// 1. The command exits unexpectedly
	// 2. The health check fails
	// 3. The health check passes
	//
	// only in the third case will the process be considered Ready to accept
	<-time.After(250 * time.Millisecond) // give process a bit of time to start

	checkStartTime := time.Now()
	maxDuration := time.Second * time.Duration(p.healthCheckTimeout)
	checkEndpoint := strings.TrimSpace(p.config.CheckEndpoint)

	// a "none" means don't check for health ... I could have picked a better word :facepalm:
	if checkEndpoint != "none" {
		proxyTo := p.config.Proxy
		healthURL, err := url.JoinPath(proxyTo, checkEndpoint)
		if err != nil {
			return fmt.Errorf("failed to create health check URL proxy=%s and checkEndpoint=%s", proxyTo, checkEndpoint)
		}

		// Ready Check loop
		for {
			currentState := p.CurrentState()
			if currentState != StateStarting {
				if currentState == StateStopped {
					return fmt.Errorf("upstream command exited prematurely but successfully")
				}
				return errors.New("health check interrupted due to shutdown")
			}

			if time.Since(checkStartTime) > maxDuration {
				p.stopCommand()
				return fmt.Errorf("health check timed out after %vs", maxDuration.Seconds())
			}

			if err := p.checkHealthEndpoint(healthURL); err == nil {
				p.proxyLogger.Infof("<%s> Health check passed on %s", p.ID, healthURL)
				break
			} else {
				if strings.Contains(err.Error(), "connection refused") {
					ttl := time.Until(checkStartTime.Add(maxDuration))
					p.proxyLogger.Debugf("<%s> Connection refused on %s, giving up in %.0fs (normal during startup)", p.ID, healthURL, ttl.Seconds())
				} else {
					p.proxyLogger.Debugf("<%s> Health check error on %s, %v (normal during startup)", p.ID, healthURL, err)
				}
			}
			<-time.After(p.healthCheckLoopInterval)
		}
	}

	if p.config.UnloadAfter > 0 {
		// start a goroutine to check every second if
		// the process should be stopped
		go func() {
			maxDuration := time.Duration(p.config.UnloadAfter) * time.Second

			for range time.Tick(time.Second) {
				if p.CurrentState() != StateReady {
					return
				}

				// skip the TTL check if there are inflight requests
				if p.inFlightRequestsCount.Load() != 0 {
					continue
				}

				if time.Since(p.getLastRequestHandled()) > maxDuration {
					p.proxyLogger.Infof("<%s> Unloading model, TTL of %ds reached", p.ID, p.config.UnloadAfter)
					p.Stop()
					return
				}
			}
		}()
	}

	if curState, err := p.swapState(StateStarting, StateReady); err != nil {
		return fmt.Errorf("failed to set Process state to ready: current state: %v, error: %v", curState, err)
	} else {
		p.failedStartCount = 0
		return nil
	}
}

// Stop will wait for inflight requests to complete before stopping the process.
func (p *Process) Stop() {
	if !isValidTransition(p.CurrentState(), StateStopping) {
		return
	}

	// wait for any inflight requests before proceeding
	p.proxyLogger.Debugf("<%s> Stop(): Waiting for inflight requests to complete", p.ID)
	p.inFlightRequests.Wait()
	p.StopImmediately()
}

// StopImmediately will transition the process to the stopping state and stop the process with a SIGTERM.
// If the process does not stop within the specified timeout, it will be forcefully stopped with a SIGKILL.
func (p *Process) StopImmediately() {
	if !isValidTransition(p.CurrentState(), StateStopping) {
		return
	}

	p.proxyLogger.Debugf("<%s> Stopping process, current state: %s", p.ID, p.CurrentState())
	if curState, err := p.swapState(StateReady, StateStopping); err != nil {
		p.proxyLogger.Infof("<%s> Stop() Ready -> StateStopping err: %v, current state: %v", p.ID, err, curState)
		return
	}

	p.stopCommand()
}

// Shutdown is called when llama-swap is shutting down. It will give a little bit
// of time for any inflight requests to complete before shutting down. If the Process
// is in the state of starting, it will cancel it and shut it down. Once a process is in
// the StateShutdown state, it can not be started again.
func (p *Process) Shutdown() {
	if !isValidTransition(p.CurrentState(), StateStopping) {
		return
	}

	p.stopCommand()
	// just force it to this state since there is no recovery from shutdown
	p.forceState(StateShutdown)
}

// stopCommand will send a SIGTERM to the process and wait for it to exit.
// If it does not exit within 5 seconds, it will send a SIGKILL.
func (p *Process) stopCommand() {
	stopStartTime := time.Now()
	defer func() {
		p.proxyLogger.Debugf("<%s> stopCommand took %v", p.ID, time.Since(stopStartTime))
	}()

	p.cmdMutex.RLock()
	cancelUpstream := p.cancelUpstream
	cmdWaitChan := p.cmdWaitChan
	p.cmdMutex.RUnlock()

	if cancelUpstream == nil {
		p.proxyLogger.Errorf("<%s> stopCommand has a nil p.cancelUpstream()", p.ID)
		return
	}

	cancelUpstream()
	<-cmdWaitChan
}

func (p *Process) checkHealthEndpoint(healthURL string) error {

	client := &http.Client{
		// wait a short time for a tcp connection to be established
		Transport: &http.Transport{
			DialContext: (&net.Dialer{
				Timeout: 500 * time.Millisecond,
			}).DialContext,
		},

		// give a long time to respond to the health check endpoint
		// after the connection is established. See issue: 276
		Timeout: 5000 * time.Millisecond,
	}

	req, err := http.NewRequest("GET", healthURL, nil)
	if err != nil {
		return err
	}

	resp, err := client.Do(req)
	if err != nil {
		return err
	}
	defer resp.Body.Close()

	// got a response but it was not an OK
	if resp.StatusCode != http.StatusOK {
		return fmt.Errorf("status code: %d", resp.StatusCode)
	}

	return nil
}

func (p *Process) ProxyRequest(w http.ResponseWriter, r *http.Request) {

	if p.reverseProxy == nil {
		http.Error(w, fmt.Sprintf("No reverse proxy available for %s", p.ID), http.StatusInternalServerError)
		return
	}

	requestBeginTime := time.Now()
	var startDuration time.Duration

	// prevent new requests from being made while stopping or irrecoverable
	currentState := p.CurrentState()
	if currentState == StateShutdown || currentState == StateStopping {
		http.Error(w, fmt.Sprintf("Process can not ProxyRequest, state is %s", currentState), http.StatusServiceUnavailable)
		return
	}

	select {
	case p.concurrencyLimitSemaphore <- struct{}{}:
		defer func() { <-p.concurrencyLimitSemaphore }()
	default:
		http.Error(w, "Too many requests", http.StatusTooManyRequests)
		return
	}

	p.inFlightRequests.Add(1)
	p.inFlightRequestsCount.Add(1)
	defer func() {
		p.setLastRequestHandled(time.Now())
		p.inFlightRequestsCount.Add(-1)
		p.inFlightRequests.Done()
	}()

	// for #366
	// - extract streaming param from request context, should have been set by proxymanager
	var srw *statusResponseWriter
	swapCtx, cancelLoadCtx := context.WithCancel(r.Context())
	// start the process on demand
	if p.CurrentState() != StateReady {
		// start a goroutine to stream loading status messages into the response writer
		// add a sync so the streaming client only runs when the goroutine has exited

		isStreaming, _ := r.Context().Value(proxyCtxKey("streaming")).(bool)
		if p.config.SendLoadingState != nil && *p.config.SendLoadingState && isStreaming {
			srw = newStatusResponseWriter(p, w)
			go srw.statusUpdates(swapCtx)
		} else {
			p.proxyLogger.Debugf("<%s> SendLoadingState is nil or false, not streaming loading state", p.ID)
		}

		beginStartTime := time.Now()
		if err := p.start(); err != nil {
			errstr := fmt.Sprintf("unable to start process: %s", err)
			cancelLoadCtx()
			if srw != nil {
				srw.sendData(fmt.Sprintf("Unable to swap model err: %s\n", errstr))
				// Wait for statusUpdates goroutine to finish writing its deferred "Done!" messages
				// before closing the connection. Without this, the connection would close before
				// the goroutine can write its cleanup messages, causing incomplete SSE output.
				srw.waitForCompletion(100 * time.Millisecond)
			} else {
				http.Error(w, errstr, http.StatusBadGateway)
			}
			return
		}
		startDuration = time.Since(beginStartTime)
	}

	// should trigger srw to stop sending loading events ...
	cancelLoadCtx()

	// recover from http.ErrAbortHandler panics that can occur when the client
	// disconnects before the response is sent
	defer func() {
		if r := recover(); r != nil {
			if r == http.ErrAbortHandler {
				p.proxyLogger.Infof("<%s> recovered from client disconnection during streaming", p.ID)
			} else {
				p.proxyLogger.Infof("<%s> recovered from panic: %v", p.ID, r)
			}
		}
	}()

	if srw != nil {
		// Wait for the goroutine to finish writing its final messages
		const completionTimeout = 1 * time.Second
		if !srw.waitForCompletion(completionTimeout) {
			p.proxyLogger.Warnf("<%s> status updates goroutine did not complete within %v, proceeding with proxy request", p.ID, completionTimeout)
		}
		p.reverseProxy.ServeHTTP(srw, r)
	} else {
		p.reverseProxy.ServeHTTP(w, r)
	}

	totalTime := time.Since(requestBeginTime)
	p.proxyLogger.Debugf("<%s> request %s - start: %v, total: %v",
		p.ID, r.RequestURI, startDuration, totalTime)
}

// waitForCmd waits for the command to exit and handles exit conditions depending on current state
func (p *Process) waitForCmd() {
	exitErr := p.cmd.Wait()
	p.proxyLogger.Debugf("<%s> cmd.Wait() returned error: %v", p.ID, exitErr)

	if exitErr != nil {
		if errno, ok := exitErr.(syscall.Errno); ok {
			p.proxyLogger.Errorf("<%s> errno >> %v", p.ID, errno)
		} else if exitError, ok := exitErr.(*exec.ExitError); ok {
			if strings.Contains(exitError.String(), "signal: terminated") {
				p.proxyLogger.Debugf("<%s> Process stopped OK", p.ID)
			} else if strings.Contains(exitError.String(), "signal: interrupt") {
				p.proxyLogger.Debugf("<%s> Process interrupted OK", p.ID)
			} else {
				p.proxyLogger.Warnf("<%s> ExitError >> %v, exit code: %d", p.ID, exitError, exitError.ExitCode())
			}
		} else {
			if exitErr.Error() != "context canceled" /* this is normal */ {
				p.proxyLogger.Errorf("<%s> Process exited >> %v", p.ID, exitErr)
			}
		}
	}

	currentState := p.CurrentState()
	switch currentState {
	case StateStopping:
		if curState, err := p.swapState(StateStopping, StateStopped); err != nil {
			p.proxyLogger.Errorf("<%s> Process exited but could not swap to StateStopped. curState=%s, err: %v", p.ID, curState, err)
			p.forceState(StateStopped)
		}
	default:
		p.proxyLogger.Infof("<%s> process exited but not StateStopping, current state: %s", p.ID, currentState)
		p.forceState(StateStopped) // force it to be in this state
	}

	p.cmdMutex.Lock()
	close(p.cmdWaitChan)
	p.cmdMutex.Unlock()
}

// cmdStopUpstreamProcess attemps to stop the upstream process gracefully
func (p *Process) cmdStopUpstreamProcess() error {
	p.processLogger.Debugf("<%s> cmdStopUpstreamProcess() initiating graceful stop of upstream process", p.ID)

	// this should never happen ...
	if p.cmd == nil || p.cmd.Process == nil {
		p.proxyLogger.Debugf("<%s> cmd or cmd.Process is nil (normal during config reload)", p.ID)
		return fmt.Errorf("<%s> process is nil or cmd is nil, skipping graceful stop", p.ID)
	}

	if p.config.CmdStop != "" {
		// replace ${PID} with the pid of the process
		stopArgs, err := config.SanitizeCommand(strings.ReplaceAll(p.config.CmdStop, "${PID}", fmt.Sprintf("%d", p.cmd.Process.Pid)))
		if err != nil {
			p.proxyLogger.Errorf("<%s> Failed to sanitize stop command: %v", p.ID, err)
			return err
		}

		p.proxyLogger.Debugf("<%s> Executing stop command: %s", p.ID, strings.Join(stopArgs, " "))

		stopCmd := exec.Command(stopArgs[0], stopArgs[1:]...)
		stopCmd.Stdout = p.processLogger
		stopCmd.Stderr = p.processLogger
		stopCmd.Env = p.cmd.Env

		if err := stopCmd.Run(); err != nil {
			p.proxyLogger.Errorf("<%s> Failed to exec stop command: %v", p.ID, err)
			return err
		}
	} else {
		if err := p.cmd.Process.Signal(syscall.SIGTERM); err != nil {
			p.proxyLogger.Errorf("<%s> Failed to send SIGTERM to process: %v", p.ID, err)
			return err
		}
	}

	return nil
}

var loadingRemarks = []string{
	"Still faster than your last standup meeting...",
	"Reticulating splines...",
	"Waking up the hamsters...",
	"Teaching the model manners...",
	"Convincing the GPU to participate...",
	"Loading weights (they're heavy)...",
	"Herding electrons...",
	"Compiling excuses for the delay...",
	"Downloading more RAM...",
	"Asking the model nicely to boot up...",
	"Bribing CUDA with cookies...",
	"Still loading (blame VRAM)...",
	"The model is fashionably late...",
	"Warming up those tensors...",
	"Making the neural net do push-ups...",
	"Your patience is appreciated (really)...",
	"Almost there (probably)...",
	"Loading like it's 1999...",
	"The model forgot where it put its keys...",
	"Quantum tunneling through layers...",
	"Negotiating with the PCIe bus...",
	"Defrosting frozen parameters...",
	"Teaching attention heads to focus...",
	"Running the matrix (slowly)...",
	"Untangling transformer blocks...",
	"Calibrating the flux capacitor...",
	"Spinning up the probability wheels...",
	"Waiting for the GPU to wake from its nap...",
	"Converting caffeine to compute...",
	"Allocating virtual patience...",
	"Performing arcane CUDA rituals...",
	"The model is stuck in traffic...",
	"Inflating embeddings...",
	"Summoning computational demons...",
	"Pleading with the OOM killer...",
	"Calculating the meaning of life (still at 42)...",
	"Training the training wheels...",
	"Optimizing the optimizer...",
	"Bootstrapping the bootstrapper...",
	"Loading loading screen...",
	"Processing processing logs...",
	"Buffering buffer overflow jokes...",
	"The model hit snooze...",
	"Debugging the debugger...",
	"Compiling the compiler...",
	"Parsing the parser (meta)...",
	"Tokenizing tokens...",
	"Encoding the encoder...",
	"Hashing hash browns...",
	"Forking spoons (not forks)...",
	"The model is contemplating existence...",
	"Transcending dimensional barriers...",
	"Invoking elder tensor gods...",
	"Unfurling probability clouds...",
	"Synchronizing parallel universes...",
	"The GPU is having second thoughts...",
	"Recalibrating reality matrices...",
	"Time is an illusion, loading doubly so...",
	"Convincing bits to flip themselves...",
	"The model is reading its own documentation...",
}

type statusResponseWriter struct {
	hasWritten bool
	writer     http.ResponseWriter
	process    *Process
	wg         sync.WaitGroup // Track goroutine completion
	start      time.Time
}

func newStatusResponseWriter(p *Process, w http.ResponseWriter) *statusResponseWriter {
	s := &statusResponseWriter{
		writer:  w,
		process: p,
		start:   time.Now(),
	}

	s.Header().Set("Content-Type", "text/event-stream") // SSE
	s.Header().Set("Cache-Control", "no-cache")         // no-cache
	s.Header().Set("Connection", "keep-alive")          // keep-alive
	s.WriteHeader(http.StatusOK)                        // send status code 200
	s.sendLine("━━━━━")
	s.sendLine(fmt.Sprintf("llama-swap loading model: %s", p.ID))
	return s
}

// statusUpdates sends status updates to the client while the model is loading
func (s *statusResponseWriter) statusUpdates(ctx context.Context) {
	s.wg.Add(1)
	defer s.wg.Done()

	// Recover from panics caused by client disconnection
	// Note: recover() only works within the same goroutine, so we need it here
	defer func() {
		if r := recover(); r != nil {
			s.process.proxyLogger.Debugf("<%s> statusUpdates recovered from panic (likely client disconnect): %v", s.process.ID, r)
		}
	}()

	defer func() {
		duration := time.Since(s.start)
		s.sendLine(fmt.Sprintf("\nDone! (%.2fs)", duration.Seconds()))
		s.sendLine("━━━━━")
		s.sendLine(" ")
	}()

	// Create a shuffled copy of loadingRemarks
	remarks := make([]string, len(loadingRemarks))
	copy(remarks, loadingRemarks)
	rand.Shuffle(len(remarks), func(i, j int) {
		remarks[i], remarks[j] = remarks[j], remarks[i]
	})
	ri := 0

	// Pick a random duration to send a remark
	nextRemarkIn := time.Duration(2+rand.Intn(4)) * time.Second
	lastRemarkTime := time.Now()

	ticker := time.NewTicker(time.Second)
	defer ticker.Stop() // Ensure ticker is stopped to prevent resource leak
	for {
		select {
		case <-ctx.Done():
			return
		case <-ticker.C:
			if s.process.CurrentState() == StateReady {
				return
			}

			// Check if it's time for a snarky remark
			if time.Since(lastRemarkTime) >= nextRemarkIn {
				remark := remarks[ri%len(remarks)]
				ri++
				s.sendLine(fmt.Sprintf("\n%s", remark))
				lastRemarkTime = time.Now()
				// Pick a new random duration for the next remark
				nextRemarkIn = time.Duration(5+rand.Intn(5)) * time.Second
			} else {
				s.sendData(".")
			}
		}
	}
}

// waitForCompletion waits for the statusUpdates goroutine to finish
func (s *statusResponseWriter) waitForCompletion(timeout time.Duration) bool {
	done := make(chan struct{})
	go func() {
		s.wg.Wait()
		close(done)
	}()

	select {
	case <-done:
		return true
	case <-time.After(timeout):
		return false
	}
}

func (s *statusResponseWriter) sendLine(line string) {
	s.sendData(line + "\n")
}

func (s *statusResponseWriter) sendData(data string) {
	// Create the proper SSE JSON structure
	type Delta struct {
		ReasoningContent string `json:"reasoning_content"`
	}
	type Choice struct {
		Delta Delta `json:"delta"`
	}
	type SSEMessage struct {
		Choices []Choice `json:"choices"`
	}

	msg := SSEMessage{
		Choices: []Choice{
			{
				Delta: Delta{
					ReasoningContent: data,
				},
			},
		},
	}

	jsonData, err := json.Marshal(msg)
	if err != nil {
		s.process.proxyLogger.Errorf("<%s> Failed to marshal SSE message: %v", s.process.ID, err)
		return
	}

	// Write SSE formatted data, panic if not able to write
	_, err = fmt.Fprintf(s.writer, "data: %s\n\n", jsonData)
	if err != nil {
		panic(fmt.Sprintf("<%s> Failed to write SSE data: %v", s.process.ID, err))
	}
	s.Flush()
}

func (s *statusResponseWriter) Header() http.Header {
	return s.writer.Header()
}

func (s *statusResponseWriter) Write(data []byte) (int, error) {
	return s.writer.Write(data)
}

func (s *statusResponseWriter) WriteHeader(statusCode int) {
	if s.hasWritten {
		return
	}
	s.hasWritten = true
	s.writer.WriteHeader(statusCode)
	s.Flush()
}

// Add Flush method
func (s *statusResponseWriter) Flush() {
	if flusher, ok := s.writer.(http.Flusher); ok {
		flusher.Flush()
	}
}


### proxy/.gitignore
ui_dist/*

### proxy/process_test.go
package proxy

import (
	"fmt"
	"net/http"
	"net/http/httptest"
	"os"
	"runtime"
	"sync"
	"testing"
	"time"

	"github.com/mostlygeek/llama-swap/proxy/config"
	"github.com/stretchr/testify/assert"
)

var (
	debugLogger = NewLogMonitorWriter(os.Stdout)
)

func init() {
	// flip to help with debugging tests
	if false {
		debugLogger.SetLogLevel(LevelDebug)
	} else {
		debugLogger.SetLogLevel(LevelError)
	}
}

func TestProcess_AutomaticallyStartsUpstream(t *testing.T) {

	expectedMessage := "testing91931"
	config := getTestSimpleResponderConfig(expectedMessage)

	// Create a process
	process := NewProcess("test-process", 5, config, debugLogger, debugLogger)
	defer process.Stop()

	req := httptest.NewRequest("GET", "/test", nil)
	w := httptest.NewRecorder()

	// process is automatically started
	assert.Equal(t, StateStopped, process.CurrentState())
	process.ProxyRequest(w, req)
	assert.Equal(t, StateReady, process.CurrentState())

	assert.Equal(t, http.StatusOK, w.Code, "Expected status code %d, got %d", http.StatusOK, w.Code)
	assert.Contains(t, w.Body.String(), expectedMessage)

	// Stop the process
	process.Stop()

	req = httptest.NewRequest("GET", "/", nil)
	w = httptest.NewRecorder()

	// Proxy the request
	process.ProxyRequest(w, req)

	// should have automatically started the process again
	if w.Code != http.StatusOK {
		t.Errorf("Expected status code %d, got %d", http.StatusOK, w.Code)
	}
}

// TestProcess_WaitOnMultipleStarts tests that multiple concurrent requests
// are all handled successfully, even though they all may ask for the process to .start()
func TestProcess_WaitOnMultipleStarts(t *testing.T) {

	expectedMessage := "testing91931"
	config := getTestSimpleResponderConfig(expectedMessage)

	process := NewProcess("test-process", 5, config, debugLogger, debugLogger)
	defer process.Stop()

	var wg sync.WaitGroup
	for i := 0; i < 5; i++ {
		wg.Add(1)
		go func(reqID int) {
			defer wg.Done()
			req := httptest.NewRequest("GET", "/test", nil)
			w := httptest.NewRecorder()
			process.ProxyRequest(w, req)
			assert.Equal(t, http.StatusOK, w.Code, "Worker %d got wrong HTTP code", reqID)
			assert.Contains(t, w.Body.String(), expectedMessage, "Worker %d got wrong message", reqID)
		}(i)
	}
	wg.Wait()
	assert.Equal(t, StateReady, process.CurrentState())
}

// test that the automatic start returns the expected error type
func TestProcess_BrokenModelConfig(t *testing.T) {
	// Create a process configuration
	config := config.ModelConfig{
		Cmd:           "nonexistent-command",
		Proxy:         "http://127.0.0.1:9913",
		CheckEndpoint: "/health",
	}

	process := NewProcess("broken", 1, config, debugLogger, debugLogger)

	req := httptest.NewRequest("GET", "/", nil)
	w := httptest.NewRecorder()
	process.ProxyRequest(w, req)
	assert.Equal(t, http.StatusBadGateway, w.Code)
	assert.Contains(t, w.Body.String(), "unable to start process")

	w = httptest.NewRecorder()
	process.ProxyRequest(w, req)
	assert.Equal(t, http.StatusBadGateway, w.Code)
	assert.Contains(t, w.Body.String(), "start() failed for command 'nonexistent-command':")
}

func TestProcess_UnloadAfterTTL(t *testing.T) {
	if testing.Short() {
		t.Skip("skipping long auto unload TTL test")
	}

	expectedMessage := "I_sense_imminent_danger"
	config := getTestSimpleResponderConfig(expectedMessage)
	assert.Equal(t, 0, config.UnloadAfter)
	config.UnloadAfter = 3 // seconds
	assert.Equal(t, 3, config.UnloadAfter)

	process := NewProcess("ttl_test", 2, config, debugLogger, debugLogger)
	defer process.Stop()

	// this should take 4 seconds
	req1 := httptest.NewRequest("GET", "/slow-respond?echo=1234&delay=1000ms", nil)
	req2 := httptest.NewRequest("GET", "/test", nil)

	w := httptest.NewRecorder()

	// Proxy the request (auto start) with a slow response that takes longer than config.UnloadAfter
	process.ProxyRequest(w, req1)

	t.Log("sending slow first request (4 seconds)")
	assert.Equal(t, http.StatusOK, w.Code, "Expected status code %d, got %d", http.StatusOK, w.Code)
	assert.Contains(t, w.Body.String(), "1234")
	assert.Equal(t, StateReady, process.CurrentState())

	// ensure the TTL timeout does not race slow requests (see issue #25)
	t.Log("sending second request (1 second)")
	time.Sleep(time.Second)
	w = httptest.NewRecorder()
	process.ProxyRequest(w, req2)
	assert.Equal(t, http.StatusOK, w.Code, "Expected status code %d, got %d", http.StatusOK, w.Code)
	assert.Contains(t, w.Body.String(), expectedMessage)
	assert.Equal(t, StateReady, process.CurrentState())

	// wait 5 seconds
	t.Log("sleep 5 seconds and check if unloaded")
	time.Sleep(5 * time.Second)
	assert.Equal(t, StateStopped, process.CurrentState())
}

func TestProcess_LowTTLValue(t *testing.T) {
	if true { // change this code to run this ...
		t.Skip("skipping test, edit process_test.go to run it ")
	}

	config := getTestSimpleResponderConfig("fast_ttl")
	assert.Equal(t, 0, config.UnloadAfter)
	config.UnloadAfter = 1 // second
	assert.Equal(t, 1, config.UnloadAfter)

	process := NewProcess("ttl", 2, config, debugLogger, debugLogger)
	defer process.Stop()

	for i := 0; i < 100; i++ {
		t.Logf("Waiting before sending request %d", i)
		time.Sleep(1500 * time.Millisecond)

		expected := fmt.Sprintf("echo=test_%d", i)
		req := httptest.NewRequest("GET", fmt.Sprintf("/slow-respond?echo=%s&delay=50ms", expected), nil)
		w := httptest.NewRecorder()
		process.ProxyRequest(w, req)
		assert.Equal(t, http.StatusOK, w.Code)
		assert.Contains(t, w.Body.String(), expected)
	}

}

// issue #19
// This test makes sure using Process.Stop() does not affect pending HTTP
// requests. All HTTP requests in this test should complete successfully.
func TestProcess_HTTPRequestsHaveTimeToFinish(t *testing.T) {
	if testing.Short() {
		t.Skip("skipping slow test")
	}

	expectedMessage := "12345"
	config := getTestSimpleResponderConfig(expectedMessage)
	process := NewProcess("t", 10, config, debugLogger, debugLogger)
	defer process.Stop()

	results := map[string]string{
		"12345": "",
		"abcde": "",
		"fghij": "",
	}

	var wg sync.WaitGroup
	var mu sync.Mutex

	for key := range results {
		wg.Add(1)
		go func(key string) {
			defer wg.Done()
			// send a request where simple-responder is will wait 300ms before responding
			// this will simulate an in-progress request.
			req := httptest.NewRequest("GET", fmt.Sprintf("/slow-respond?echo=%s&delay=300ms", key), nil)
			w := httptest.NewRecorder()

			process.ProxyRequest(w, req)

			if w.Code != http.StatusOK {
				t.Errorf("Expected status OK, got %d for key %s", w.Code, key)
			}

			mu.Lock()
			results[key] = w.Body.String()
			mu.Unlock()

		}(key)
	}

	// Stop the process while requests are still being processed
	go func() {
		<-time.After(150 * time.Millisecond)
		process.Stop()
	}()

	wg.Wait()

	for key, result := range results {
		assert.Equal(t, key, result)
	}
}

func TestProcess_SwapState(t *testing.T) {
	tests := []struct {
		name           string
		currentState   ProcessState
		expectedState  ProcessState
		newState       ProcessState
		expectedError  error
		expectedResult ProcessState
	}{
		{"Stopped to Starting", StateStopped, StateStopped, StateStarting, nil, StateStarting},
		{"Starting to Ready", StateStarting, StateStarting, StateReady, nil, StateReady},
		{"Starting to Stopping", StateStarting, StateStarting, StateStopping, nil, StateStopping},
		{"Starting to Stopped", StateStarting, StateStarting, StateStopped, nil, StateStopped},
		{"Ready to Stopping", StateReady, StateReady, StateStopping, nil, StateStopping},
		{"Stopping to Stopped", StateStopping, StateStopping, StateStopped, nil, StateStopped},
		{"Stopping to Shutdown", StateStopping, StateStopping, StateShutdown, nil, StateShutdown},
		{"Stopped to Ready", StateStopped, StateStopped, StateReady, ErrInvalidStateTransition, StateStopped},
		{"Ready to Starting", StateReady, StateReady, StateStarting, ErrInvalidStateTransition, StateReady},
		{"Stopping to Ready", StateStopping, StateStopping, StateReady, ErrInvalidStateTransition, StateStopping},
		{"Shutdown to Stopped", StateShutdown, StateShutdown, StateStopped, ErrInvalidStateTransition, StateShutdown},
		{"Shutdown to Starting", StateShutdown, StateShutdown, StateStarting, ErrInvalidStateTransition, StateShutdown},
		{"Expected state mismatch", StateStopped, StateStarting, StateStarting, ErrExpectedStateMismatch, StateStopped},
	}

	for _, test := range tests {
		t.Run(test.name, func(t *testing.T) {
			p := NewProcess("test", 10, getTestSimpleResponderConfig("test"), debugLogger, debugLogger)
			p.state = test.currentState

			resultState, err := p.swapState(test.expectedState, test.newState)
			if err != nil && test.expectedError == nil {
				t.Errorf("Unexpected error: %v", err)
			} else if err == nil && test.expectedError != nil {
				t.Errorf("Expected error: %v, but got none", test.expectedError)
			} else if err != nil && test.expectedError != nil {
				if err.Error() != test.expectedError.Error() {
					t.Errorf("Expected error: %v, got: %v", test.expectedError, err)
				}
			}

			if resultState != test.expectedResult {
				t.Errorf("Expected state: %v, got: %v", test.expectedResult, resultState)
			}
		})
	}
}

func TestProcess_ShutdownInterruptsHealthCheck(t *testing.T) {
	if testing.Short() {
		t.Skip("skipping long shutdown test")
	}

	expectedMessage := "testing91931"

	// make a config where the healthcheck will always fail because port is wrong
	config := getTestSimpleResponderConfigPort(expectedMessage, 9999)
	config.Proxy = "http://localhost:9998/test"

	healthCheckTTLSeconds := 30
	process := NewProcess("test-process", healthCheckTTLSeconds, config, debugLogger, debugLogger)

	// make it a lot faster
	process.healthCheckLoopInterval = time.Second

	// start a goroutine to simulate a shutdown
	var wg sync.WaitGroup
	go func() {
		defer wg.Done()
		<-time.After(time.Millisecond * 500)
		process.Shutdown()
	}()
	wg.Add(1)

	// start the process, this is a blocking call
	err := process.start()

	wg.Wait()
	assert.ErrorContains(t, err, "health check interrupted due to shutdown")
	assert.Equal(t, StateShutdown, process.CurrentState())
}

func TestProcess_ExitInterruptsHealthCheck(t *testing.T) {
	if testing.Short() {
		t.Skip("skipping Exit Interrupts Health Check test")
	}

	// should run and exit but interrupt the long checkHealthTimeout
	checkHealthTimeout := 5
	config := config.ModelConfig{
		Cmd:           "sleep 1",
		Proxy:         "http://127.0.0.1:9913",
		CheckEndpoint: "/health",
	}

	process := NewProcess("sleepy", checkHealthTimeout, config, debugLogger, debugLogger)
	process.healthCheckLoopInterval = time.Second // make it faster
	err := process.start()
	assert.Equal(t, "upstream command exited prematurely but successfully", err.Error())
	assert.Equal(t, process.CurrentState(), StateStopped)
}

func TestProcess_ConcurrencyLimit(t *testing.T) {
	if testing.Short() {
		t.Skip("skipping long concurrency limit test")
	}

	expectedMessage := "concurrency_limit_test"
	config := getTestSimpleResponderConfig(expectedMessage)

	// only allow 1 concurrent request at a time
	config.ConcurrencyLimit = 1

	process := NewProcess("ttl_test", 2, config, debugLogger, debugLogger)
	assert.Equal(t, 1, cap(process.concurrencyLimitSemaphore))
	defer process.Stop()

	// launch a goroutine first to take up the semaphore
	go func() {
		req1 := httptest.NewRequest("GET", "/slow-respond?echo=12345&delay=75ms", nil)
		w := httptest.NewRecorder()
		process.ProxyRequest(w, req1)
		assert.Equal(t, http.StatusOK, w.Code)
	}()

	// let the goroutine start
	<-time.After(time.Millisecond * 25)

	denied := httptest.NewRequest("GET", "/test", nil)
	w := httptest.NewRecorder()
	process.ProxyRequest(w, denied)
	assert.Equal(t, http.StatusTooManyRequests, w.Code)
}

func TestProcess_StopImmediately(t *testing.T) {
	expectedMessage := "test_stop_immediate"
	config := getTestSimpleResponderConfig(expectedMessage)

	process := NewProcess("stop_immediate", 2, config, debugLogger, debugLogger)
	defer process.Stop()

	err := process.start()
	assert.Nil(t, err)
	assert.Equal(t, process.CurrentState(), StateReady)
	go func() {
		// slow, but will get killed by StopImmediate
		req := httptest.NewRequest("GET", "/slow-respond?echo=12345&delay=1s", nil)
		w := httptest.NewRecorder()
		process.ProxyRequest(w, req)
	}()
	<-time.After(time.Millisecond)
	process.StopImmediately()
	assert.Equal(t, process.CurrentState(), StateStopped)
}

// Test that SIGKILL is sent when gracefulStopTimeout is reached and properly terminates
// the upstream command
func TestProcess_ForceStopWithKill(t *testing.T) {
	if runtime.GOOS == "windows" {
		t.Skip("skipping SIGTERM test on Windows ")
	}

	expectedMessage := "test_sigkill"
	binaryPath := getSimpleResponderPath()
	port := getTestPort()

	conf := config.ModelConfig{
		// note --ignore-sig-term which ignores the SIGTERM signal so a SIGKILL must be sent
		// to force the process to exit
		Cmd:           fmt.Sprintf("%s --port %d --respond %s --silent --ignore-sig-term", binaryPath, port, expectedMessage),
		Proxy:         fmt.Sprintf("http://127.0.0.1:%d", port),
		CheckEndpoint: "/health",
	}

	process := NewProcess("stop_immediate", 2, conf, debugLogger, debugLogger)
	defer process.Stop()

	// reduce to make testing go faster
	process.gracefulStopTimeout = time.Second

	err := process.start()
	assert.Nil(t, err)
	assert.Equal(t, process.CurrentState(), StateReady)

	waitChan := make(chan struct{})
	go func() {
		// slow, but will get killed by StopImmediate
		req := httptest.NewRequest("GET", "/slow-respond?echo=12345&delay=2s", nil)
		w := httptest.NewRecorder()
		process.ProxyRequest(w, req)

		// StatusOK because that was already sent before the kill
		assert.Equal(t, http.StatusOK, w.Code)

		// unexpected EOF because the kill happened, the "1" is sent before the kill
		// then the unexpected EOF is sent after the kill
		if runtime.GOOS == "windows" {
			assert.Contains(t, w.Body.String(), "wsarecv: An existing connection was forcibly closed by the remote host")
		} else {
			// Upstream may be killed mid-response.
			// Assert an incomplete or partial response.
			assert.NotEqual(t, "12345", w.Body.String())
		}

		close(waitChan)
	}()

	<-time.After(time.Millisecond)
	process.StopImmediately()
	assert.Equal(t, process.CurrentState(), StateStopped)

	// the request should have been interrupted by SIGKILL
	<-waitChan
}

func TestProcess_StopCmd(t *testing.T) {
	conf := getTestSimpleResponderConfig("test_stop_cmd")

	if runtime.GOOS == "windows" {
		conf.CmdStop = "taskkill /f /t /pid ${PID}"
	} else {
		conf.CmdStop = "kill -TERM ${PID}"
	}

	process := NewProcess("testStopCmd", 2, conf, debugLogger, debugLogger)
	defer process.Stop()

	err := process.start()
	assert.Nil(t, err)
	assert.Equal(t, process.CurrentState(), StateReady)
	process.StopImmediately()
	assert.Equal(t, process.CurrentState(), StateStopped)
}

func TestProcess_EnvironmentSetCorrectly(t *testing.T) {
	expectedMessage := "test_env_not_emptied"
	conf := getTestSimpleResponderConfig(expectedMessage)

	// ensure that the the default config does not blank out the inherited environment
	configWEnv := conf

	// ensure the additiona variables are appended to the process' environment
	configWEnv.Env = append(configWEnv.Env, "TEST_ENV1=1", "TEST_ENV2=2")

	process1 := NewProcess("env_test", 2, conf, debugLogger, debugLogger)
	process2 := NewProcess("env_test", 2, configWEnv, debugLogger, debugLogger)

	process1.start()
	defer process1.Stop()
	process2.start()
	defer process2.Stop()

	assert.NotZero(t, len(process1.cmd.Environ()))
	assert.NotZero(t, len(process2.cmd.Environ()))
	assert.Equal(t, len(process1.cmd.Environ())+2, len(process2.cmd.Environ()), "process2 should have 2 more environment variables than process1")

}

// TestProcess_ReverseProxyPanicIsHandled tests that panics from
// httputil.ReverseProxy in Process.ProxyRequest(w, r) do not bubble up and are
// handled appropriately.
//
// httputil.ReverseProxy will panic with http.ErrAbortHandler when it has sent headers
// can't copy the body. This can be caused by a client disconnecting before the full
// response is sent from some reason.
//
// bug: https://github.com/mostlygeek/llama-swap/issues/362
// see: https://github.com/golang/go/issues/23643 (where panic was added to httputil.ReverseProxy)
func TestProcess_ReverseProxyPanicIsHandled(t *testing.T) {
	// Add defer/recover to catch any panics that aren't handled by ProxyRequest
	// If this recover() is hit, it means ProxyRequest didn't handle the panic properly
	defer func() {
		if r := recover(); r != nil {
			t.Fatalf("ProxyRequest should handle panics from reverseProxy.ServeHTTP, but panic was not caught: %v", r)
		}
	}()

	expectedMessage := "panic_test"
	config := getTestSimpleResponderConfig(expectedMessage)

	process := NewProcess("panic-test", 5, config, debugLogger, debugLogger)
	defer process.Stop()

	// Start the process
	err := process.start()
	assert.Nil(t, err)
	assert.Equal(t, StateReady, process.CurrentState())

	// Create a custom ResponseWriter that simulates a client disconnect
	// by panicking when Write is called after headers are sent
	panicWriter := &panicOnWriteResponseWriter{
		ResponseRecorder: httptest.NewRecorder(),
		shouldPanic:      true,
	}

	// Make a request that will trigger the panic
	req := httptest.NewRequest("GET", "/slow-respond?echo=test&delay=100ms", nil)

	// This should panic inside reverseProxy.ServeHTTP when the panicWriter.Write() is called.
	// ProxyRequest should catch and handle this panic gracefully.
	process.ProxyRequest(panicWriter, req)

	// If we get here, the panic was properly recovered in ProxyRequest
	// The process should still be in a ready state
	assert.Equal(t, StateReady, process.CurrentState())
}

// panicOnWriteResponseWriter is a ResponseWriter that panics on Write
// to simulate a client disconnect after headers are sent
// used by: TestProcess_ReverseProxyPanicIsHandled
type panicOnWriteResponseWriter struct {
	*httptest.ResponseRecorder
	shouldPanic   bool
	headerWritten bool
}

func (w *panicOnWriteResponseWriter) WriteHeader(statusCode int) {
	w.headerWritten = true
	w.ResponseRecorder.WriteHeader(statusCode)
}

func (w *panicOnWriteResponseWriter) Write(b []byte) (int, error) {
	if w.shouldPanic && w.headerWritten {
		// Simulate the panic that httputil.ReverseProxy throws
		panic(http.ErrAbortHandler)
	}
	return w.ResponseRecorder.Write(b)
}


### proxy/config/config.go
package config

import (
	"fmt"
	"io"
	"net/url"
	"os"
	"regexp"
	"runtime"
	"sort"
	"strings"

	"github.com/billziss-gh/golib/shlex"
	"gopkg.in/yaml.v3"
)

const DEFAULT_GROUP_ID = "(default)"

type MacroEntry struct {
	Name  string
	Value any
}

type MacroList []MacroEntry

// UnmarshalYAML implements custom YAML unmarshaling that preserves macro definition order
func (ml *MacroList) UnmarshalYAML(value *yaml.Node) error {
	if value.Kind != yaml.MappingNode {
		return fmt.Errorf("macros must be a mapping")
	}

	// yaml.Node.Content for a mapping contains alternating key/value nodes
	entries := make([]MacroEntry, 0, len(value.Content)/2)
	for i := 0; i < len(value.Content); i += 2 {
		keyNode := value.Content[i]
		valueNode := value.Content[i+1]

		var name string
		if err := keyNode.Decode(&name); err != nil {
			return fmt.Errorf("failed to decode macro name: %w", err)
		}

		var val any
		if err := valueNode.Decode(&val); err != nil {
			return fmt.Errorf("failed to decode macro value for '%s': %w", name, err)
		}

		entries = append(entries, MacroEntry{Name: name, Value: val})
	}

	*ml = entries
	return nil
}

// Get retrieves a macro value by name
func (ml MacroList) Get(name string) (any, bool) {
	for _, entry := range ml {
		if entry.Name == name {
			return entry.Value, true
		}
	}
	return nil, false
}

// ToMap converts MacroList to a map (for backward compatibility if needed)
func (ml MacroList) ToMap() map[string]any {
	result := make(map[string]any, len(ml))
	for _, entry := range ml {
		result[entry.Name] = entry.Value
	}
	return result
}

type GroupConfig struct {
	Swap       bool     `yaml:"swap"`
	Exclusive  bool     `yaml:"exclusive"`
	Persistent bool     `yaml:"persistent"`
	Members    []string `yaml:"members"`
}

var (
	macroNameRegex    = regexp.MustCompile(`^[a-zA-Z0-9_-]+$`)
	macroPatternRegex = regexp.MustCompile(`\$\{([a-zA-Z0-9_-]+)\}`)
)

// set default values for GroupConfig
func (c *GroupConfig) UnmarshalYAML(unmarshal func(interface{}) error) error {
	type rawGroupConfig GroupConfig
	defaults := rawGroupConfig{
		Swap:       true,
		Exclusive:  true,
		Persistent: false,
		Members:    []string{},
	}

	if err := unmarshal(&defaults); err != nil {
		return err
	}

	*c = GroupConfig(defaults)
	return nil
}

type HooksConfig struct {
	OnStartup HookOnStartup `yaml:"on_startup"`
}

type HookOnStartup struct {
	Preload []string `yaml:"preload"`
}

type Config struct {
	HealthCheckTimeout int                    `yaml:"healthCheckTimeout"`
	LogRequests        bool                   `yaml:"logRequests"`
	LogLevel           string                 `yaml:"logLevel"`
	LogTimeFormat      string                 `yaml:"logTimeFormat"`
	MetricsMaxInMemory int                    `yaml:"metricsMaxInMemory"`
	Models             map[string]ModelConfig `yaml:"models"` /* key is model ID */
	Profiles           map[string][]string    `yaml:"profiles"`
	Groups             map[string]GroupConfig `yaml:"groups"` /* key is group ID */

	// for key/value replacements in model's cmd, cmdStop, proxy, checkEndPoint
	Macros MacroList `yaml:"macros"`

	// map aliases to actual model IDs
	aliases map[string]string

	// automatic port assignments
	StartPort int `yaml:"startPort"`

	// hooks, see: #209
	Hooks HooksConfig `yaml:"hooks"`

	// send loading state in reasoning
	SendLoadingState bool `yaml:"sendLoadingState"`

	// present aliases to /v1/models OpenAI API listing
	IncludeAliasesInList bool `yaml:"includeAliasesInList"`
}

func (c *Config) RealModelName(search string) (string, bool) {
	if _, found := c.Models[search]; found {
		return search, true
	} else if name, found := c.aliases[search]; found {
		return name, found
	} else {
		return "", false
	}
}

func (c *Config) FindConfig(modelName string) (ModelConfig, string, bool) {
	if realName, found := c.RealModelName(modelName); !found {
		return ModelConfig{}, "", false
	} else {
		return c.Models[realName], realName, true
	}
}

func LoadConfig(path string) (Config, error) {
	file, err := os.Open(path)
	if err != nil {
		return Config{}, err
	}
	defer file.Close()
	return LoadConfigFromReader(file)
}

func LoadConfigFromReader(r io.Reader) (Config, error) {
	data, err := io.ReadAll(r)
	if err != nil {
		return Config{}, err
	}

	// default configuration values
	config := Config{
		HealthCheckTimeout: 120,
		StartPort:          5800,
		LogLevel:           "info",
		LogTimeFormat:      "",
		MetricsMaxInMemory: 1000,
	}
	err = yaml.Unmarshal(data, &config)
	if err != nil {
		return Config{}, err
	}

	if config.HealthCheckTimeout < 15 {
		// set a minimum of 15 seconds
		config.HealthCheckTimeout = 15
	}

	if config.StartPort < 1 {
		return Config{}, fmt.Errorf("startPort must be greater than 1")
	}

	// Populate the aliases map
	config.aliases = make(map[string]string)
	for modelName, modelConfig := range config.Models {
		for _, alias := range modelConfig.Aliases {
			if _, found := config.aliases[alias]; found {
				return Config{}, fmt.Errorf("duplicate alias %s found in model: %s", alias, modelName)
			}
			config.aliases[alias] = modelName
		}
	}

	/* check macro constraint rules:

	- name must fit the regex ^[a-zA-Z0-9_-]+$
	- names must be less than 64 characters (no reason, just cause)
	- name can not be any reserved macros: PORT, MODEL_ID
	- macro values must be less than 1024 characters
	*/
	for _, macro := range config.Macros {
		if err = validateMacro(macro.Name, macro.Value); err != nil {
			return Config{}, err
		}
	}

	// Get and sort all model IDs first, makes testing more consistent
	modelIds := make([]string, 0, len(config.Models))
	for modelId := range config.Models {
		modelIds = append(modelIds, modelId)
	}
	sort.Strings(modelIds) // This guarantees stable iteration order

	nextPort := config.StartPort
	for _, modelId := range modelIds {
		modelConfig := config.Models[modelId]

		// Strip comments from command fields before macro expansion
		modelConfig.Cmd = StripComments(modelConfig.Cmd)
		modelConfig.CmdStop = StripComments(modelConfig.CmdStop)

		// validate model macros
		for _, macro := range modelConfig.Macros {
			if err = validateMacro(macro.Name, macro.Value); err != nil {
				return Config{}, fmt.Errorf("model %s: %s", modelId, err.Error())
			}
		}

		// Merge global config and model macros. Model macros take precedence
		mergedMacros := make(MacroList, 0, len(config.Macros)+len(modelConfig.Macros))
		mergedMacros = append(mergedMacros, MacroEntry{Name: "MODEL_ID", Value: modelId})

		// Add global macros first
		mergedMacros = append(mergedMacros, config.Macros...)

		// Add model macros (can override global)
		for _, entry := range modelConfig.Macros {
			// Remove any existing global macro with same name
			found := false
			for i, existing := range mergedMacros {
				if existing.Name == entry.Name {
					mergedMacros[i] = entry // Override
					found = true
					break
				}
			}
			if !found {
				mergedMacros = append(mergedMacros, entry)
			}
		}

		// First pass: Substitute user-defined macros in reverse order (LIFO - last defined first)
		// This allows later macros to reference earlier ones
		for i := len(mergedMacros) - 1; i >= 0; i-- {
			entry := mergedMacros[i]
			macroSlug := fmt.Sprintf("${%s}", entry.Name)
			macroStr := fmt.Sprintf("%v", entry.Value)

			// Substitute in command fields
			modelConfig.Cmd = strings.ReplaceAll(modelConfig.Cmd, macroSlug, macroStr)
			modelConfig.CmdStop = strings.ReplaceAll(modelConfig.CmdStop, macroSlug, macroStr)
			modelConfig.Proxy = strings.ReplaceAll(modelConfig.Proxy, macroSlug, macroStr)
			modelConfig.CheckEndpoint = strings.ReplaceAll(modelConfig.CheckEndpoint, macroSlug, macroStr)
			modelConfig.Filters.StripParams = strings.ReplaceAll(modelConfig.Filters.StripParams, macroSlug, macroStr)

			// Substitute in metadata (recursive)
			if len(modelConfig.Metadata) > 0 {
				var err error
				result, err := substituteMacroInValue(modelConfig.Metadata, entry.Name, entry.Value)
				if err != nil {
					return Config{}, fmt.Errorf("model %s metadata: %s", modelId, err.Error())
				}
				modelConfig.Metadata = result.(map[string]any)
			}
		}

		// Final pass: check if PORT macro is needed after macro expansion
		// ${PORT} is a resource on the local machine so a new port is only allocated
		// if it is required in either cmd or proxy keys
		cmdHasPort := strings.Contains(modelConfig.Cmd, "${PORT}")
		proxyHasPort := strings.Contains(modelConfig.Proxy, "${PORT}")
		if cmdHasPort || proxyHasPort { // either has it
			if !cmdHasPort && proxyHasPort { // but both don't have it
				return Config{}, fmt.Errorf("model %s: proxy uses ${PORT} but cmd does not - ${PORT} is only available when used in cmd", modelId)
			}

			// Add PORT macro and substitute it
			portEntry := MacroEntry{Name: "PORT", Value: nextPort}
			macroSlug := "${PORT}"
			macroStr := fmt.Sprintf("%v", nextPort)

			modelConfig.Cmd = strings.ReplaceAll(modelConfig.Cmd, macroSlug, macroStr)
			modelConfig.CmdStop = strings.ReplaceAll(modelConfig.CmdStop, macroSlug, macroStr)
			modelConfig.Proxy = strings.ReplaceAll(modelConfig.Proxy, macroSlug, macroStr)

			// Substitute PORT in metadata
			if len(modelConfig.Metadata) > 0 {
				var err error
				result, err := substituteMacroInValue(modelConfig.Metadata, portEntry.Name, portEntry.Value)
				if err != nil {
					return Config{}, fmt.Errorf("model %s metadata: %s", modelId, err.Error())
				}
				modelConfig.Metadata = result.(map[string]any)
			}

			nextPort++
		}

		// make sure there are no unknown macros that have not been replaced
		fieldMap := map[string]string{
			"cmd":                 modelConfig.Cmd,
			"cmdStop":             modelConfig.CmdStop,
			"proxy":               modelConfig.Proxy,
			"checkEndpoint":       modelConfig.CheckEndpoint,
			"filters.stripParams": modelConfig.Filters.StripParams,
		}

		for fieldName, fieldValue := range fieldMap {
			matches := macroPatternRegex.FindAllStringSubmatch(fieldValue, -1)
			for _, match := range matches {
				macroName := match[1]
				if macroName == "PID" && fieldName == "cmdStop" {
					continue // this is ok, has to be replaced by process later
				}
				// Reserved macros are always valid (they should have been substituted already)
				if macroName == "PORT" || macroName == "MODEL_ID" {
					return Config{}, fmt.Errorf("macro '${%s}' should have been substituted in %s.%s", macroName, modelId, fieldName)
				}
				// Any other macro is unknown
				return Config{}, fmt.Errorf("unknown macro '${%s}' found in %s.%s", macroName, modelId, fieldName)
			}
		}

		// Check for unknown macros in metadata
		if len(modelConfig.Metadata) > 0 {
			if err := validateMetadataForUnknownMacros(modelConfig.Metadata, modelId); err != nil {
				return Config{}, err
			}
		}

		// Validate the proxy URL.
		if _, err := url.Parse(modelConfig.Proxy); err != nil {
			return Config{}, fmt.Errorf(
				"model %s: invalid proxy URL: %w", modelId, err,
			)
		}

		// if sendLoadingState is nil, set it to the global config value
		// see #366
		if modelConfig.SendLoadingState == nil {
			v := config.SendLoadingState // copy it
			modelConfig.SendLoadingState = &v
		}

		config.Models[modelId] = modelConfig
	}

	config = AddDefaultGroupToConfig(config)
	// check that members are all unique in the groups
	memberUsage := make(map[string]string) // maps member to group it appears in
	for groupID, groupConfig := range config.Groups {
		prevSet := make(map[string]bool)
		for _, member := range groupConfig.Members {
			// Check for duplicates within this group
			if _, found := prevSet[member]; found {
				return Config{}, fmt.Errorf("duplicate model member %s found in group: %s", member, groupID)
			}
			prevSet[member] = true

			// Check if member is used in another group
			if existingGroup, exists := memberUsage[member]; exists {
				return Config{}, fmt.Errorf("model member %s is used in multiple groups: %s and %s", member, existingGroup, groupID)
			}
			memberUsage[member] = groupID
		}
	}

	// clean up hooks preload
	if len(config.Hooks.OnStartup.Preload) > 0 {
		var toPreload []string
		for _, modelID := range config.Hooks.OnStartup.Preload {
			modelID = strings.TrimSpace(modelID)
			if modelID == "" {
				continue
			}
			if real, found := config.RealModelName(modelID); found {
				toPreload = append(toPreload, real)
			}
		}

		config.Hooks.OnStartup.Preload = toPreload
	}

	return config, nil
}

// rewrites the yaml to include a default group with any orphaned models
func AddDefaultGroupToConfig(config Config) Config {

	if config.Groups == nil {
		config.Groups = make(map[string]GroupConfig)
	}

	defaultGroup := GroupConfig{
		Swap:      true,
		Exclusive: true,
		Members:   []string{},
	}
	// if groups is empty, create a default group and put
	// all models into it
	if len(config.Groups) == 0 {
		for modelName := range config.Models {
			defaultGroup.Members = append(defaultGroup.Members, modelName)
		}
	} else {
		// iterate over existing group members and add non-grouped models into the default group
		for modelName := range config.Models {
			foundModel := false
		found:
			// search for the model in existing groups
			for _, groupConfig := range config.Groups {
				for _, member := range groupConfig.Members {
					if member == modelName {
						foundModel = true
						break found
					}
				}
			}

			if !foundModel {
				defaultGroup.Members = append(defaultGroup.Members, modelName)
			}
		}
	}

	sort.Strings(defaultGroup.Members) // make consistent ordering for testing
	config.Groups[DEFAULT_GROUP_ID] = defaultGroup

	return config
}

func SanitizeCommand(cmdStr string) ([]string, error) {
	var cleanedLines []string
	for _, line := range strings.Split(cmdStr, "\n") {
		trimmed := strings.TrimSpace(line)
		// Skip comment lines
		if strings.HasPrefix(trimmed, "#") {
			continue
		}
		// Handle trailing backslashes by replacing with space
		if strings.HasSuffix(trimmed, "\\") {
			cleanedLines = append(cleanedLines, strings.TrimSuffix(trimmed, "\\")+" ")
		} else {
			cleanedLines = append(cleanedLines, line)
		}
	}

	// put it back together
	cmdStr = strings.Join(cleanedLines, "\n")

	// Split the command into arguments
	var args []string
	if runtime.GOOS == "windows" {
		args = shlex.Windows.Split(cmdStr)
	} else {
		args = shlex.Posix.Split(cmdStr)
	}

	// Ensure the command is not empty
	if len(args) == 0 {
		return nil, fmt.Errorf("empty command")
	}

	return args, nil
}

func StripComments(cmdStr string) string {
	var cleanedLines []string
	for _, line := range strings.Split(cmdStr, "\n") {
		trimmed := strings.TrimSpace(line)
		// Skip comment lines
		if strings.HasPrefix(trimmed, "#") {
			continue
		}
		cleanedLines = append(cleanedLines, line)
	}
	return strings.Join(cleanedLines, "\n")
}

// validateMacro validates macro name and value constraints
func validateMacro(name string, value any) error {
	if len(name) >= 64 {
		return fmt.Errorf("macro name '%s' exceeds maximum length of 63 characters", name)
	}
	if !macroNameRegex.MatchString(name) {
		return fmt.Errorf("macro name '%s' contains invalid characters, must match pattern ^[a-zA-Z0-9_-]+$", name)
	}

	// Validate that value is a scalar type
	switch v := value.(type) {
	case string:
		if len(v) >= 1024 {
			return fmt.Errorf("macro value for '%s' exceeds maximum length of 1024 characters", name)
		}
		// Check for self-reference
		macroSlug := fmt.Sprintf("${%s}", name)
		if strings.Contains(v, macroSlug) {
			return fmt.Errorf("macro '%s' contains self-reference", name)
		}
	case int, int8, int16, int32, int64, uint, uint8, uint16, uint32, uint64, float32, float64, bool:
		// These types are allowed
	default:
		return fmt.Errorf("macro '%s' has invalid type %T, must be a scalar type (string, int, float, or bool)", name, value)
	}

	switch name {
	case "PORT", "MODEL_ID":
		return fmt.Errorf("macro name '%s' is reserved", name)
	}

	return nil
}

// validateMetadataForUnknownMacros recursively checks for any remaining macro references in metadata
func validateMetadataForUnknownMacros(value any, modelId string) error {
	switch v := value.(type) {
	case string:
		matches := macroPatternRegex.FindAllStringSubmatch(v, -1)
		for _, match := range matches {
			macroName := match[1]
			return fmt.Errorf("model %s metadata: unknown macro '${%s}'", modelId, macroName)
		}
		return nil

	case map[string]any:
		for _, val := range v {
			if err := validateMetadataForUnknownMacros(val, modelId); err != nil {
				return err
			}
		}
		return nil

	case []any:
		for _, val := range v {
			if err := validateMetadataForUnknownMacros(val, modelId); err != nil {
				return err
			}
		}
		return nil

	default:
		// Scalar types don't contain macros
		return nil
	}
}

// substituteMacroInValue recursively substitutes a single macro in a value structure
// This is called once per macro, allowing LIFO substitution order
func substituteMacroInValue(value any, macroName string, macroValue any) (any, error) {
	macroSlug := fmt.Sprintf("${%s}", macroName)
	macroStr := fmt.Sprintf("%v", macroValue)

	switch v := value.(type) {
	case string:
		// Check if this is a direct macro substitution
		if v == macroSlug {
			return macroValue, nil
		}
		// Handle string interpolation
		if strings.Contains(v, macroSlug) {
			return strings.ReplaceAll(v, macroSlug, macroStr), nil
		}
		return v, nil

	case map[string]any:
		// Recursively process map values
		newMap := make(map[string]any)
		for key, val := range v {
			newVal, err := substituteMacroInValue(val, macroName, macroValue)
			if err != nil {
				return nil, err
			}
			newMap[key] = newVal
		}
		return newMap, nil

	case []any:
		// Recursively process slice elements
		newSlice := make([]any, len(v))
		for i, val := range v {
			newVal, err := substituteMacroInValue(val, macroName, macroValue)
			if err != nil {
				return nil, err
			}
			newSlice[i] = newVal
		}
		return newSlice, nil

	default:
		// Return scalar types as-is
		return value, nil
	}
}


### proxy/config/model_config_test.go
package config

import (
	"fmt"
	"strings"
	"testing"

	"github.com/stretchr/testify/assert"
)

func TestConfig_ModelConfigSanitizedCommand(t *testing.T) {
	config := &ModelConfig{
		Cmd: `python model1.py \
    --arg1 value1 \
    --arg2 value2`,
	}

	args, err := config.SanitizedCommand()
	assert.NoError(t, err)
	assert.Equal(t, []string{"python", "model1.py", "--arg1", "value1", "--arg2", "value2"}, args)
}

func TestConfig_ModelFilters(t *testing.T) {
	content := `
macros:
  default_strip: "temperature, top_p"
models:
  model1:
    cmd: path/to/cmd --port ${PORT}
    filters:
      # macros inserted and list is cleaned of duplicates and empty strings
      stripParams: "model, top_k, top_k, temperature, ${default_strip}, , ,"
  # check for strip_params (legacy field name) compatibility
  legacy:
    cmd: path/to/cmd --port ${PORT}
    filters:
      strip_params: "model, top_k, top_k, temperature, ${default_strip}, , ,"
`
	config, err := LoadConfigFromReader(strings.NewReader(content))
	assert.NoError(t, err)
	for modelId, modelConfig := range config.Models {
		t.Run(fmt.Sprintf("Testing macros in filters for model %s", modelId), func(t *testing.T) {
			assert.Equal(t, "model, top_k, top_k, temperature, temperature, top_p, , ,", modelConfig.Filters.StripParams)
			sanitized, err := modelConfig.Filters.SanitizedStripParams()
			if assert.NoError(t, err) {
				// model has been removed
				// empty strings have been removed
				// duplicates have been removed
				assert.Equal(t, []string{"temperature", "top_k", "top_p"}, sanitized)
			}
		})
	}
}

func TestConfig_ModelSendLoadingState(t *testing.T) {
	content := `
sendLoadingState: true
models:
  model1:
    cmd: path/to/cmd --port ${PORT}
    sendLoadingState: false
  model2:
    cmd: path/to/cmd --port ${PORT}
`
	config, err := LoadConfigFromReader(strings.NewReader(content))
	assert.NoError(t, err)
	assert.True(t, config.SendLoadingState)
	if assert.NotNil(t, config.Models["model1"].SendLoadingState) {
		assert.False(t, *config.Models["model1"].SendLoadingState)
	}
	if assert.NotNil(t, config.Models["model2"].SendLoadingState) {
		assert.True(t, *config.Models["model2"].SendLoadingState)
	}
}


### proxy/config/macro_in_macro_test.go
package config

import (
	"strings"
	"testing"

	"github.com/stretchr/testify/assert"
)

// Test macro-in-macro basic substitution
func TestConfig_MacroInMacroBasic(t *testing.T) {
	content := `
startPort: 10000
macros:
  "A": "value-A"
  "B": "prefix-${A}-suffix"

models:
  test:
    cmd: echo ${B}
    proxy: http://localhost:8080
`

	config, err := LoadConfigFromReader(strings.NewReader(content))
	assert.NoError(t, err)
	assert.Equal(t, "echo prefix-value-A-suffix", config.Models["test"].Cmd)
}

// Test LIFO substitution order with 3+ macro levels
func TestConfig_MacroInMacroLIFOOrder(t *testing.T) {
	content := `
startPort: 10000
macros:
  "base": "/models"
  "path": "${base}/llama"
  "full": "${path}/model.gguf"

models:
  test:
    cmd: load ${full}
    proxy: http://localhost:8080
`

	config, err := LoadConfigFromReader(strings.NewReader(content))
	assert.NoError(t, err)
	assert.Equal(t, "load /models/llama/model.gguf", config.Models["test"].Cmd)
}

// Test MODEL_ID in global macro used by model
func TestConfig_ModelIdInGlobalMacro(t *testing.T) {
	content := `
startPort: 10000
macros:
  "podman-llama": "podman run --name ${MODEL_ID} ghcr.io/ggml-org/llama.cpp:server-cuda"

models:
  my-model:
    cmd: ${podman-llama} -m model.gguf
    proxy: http://localhost:8080
`

	config, err := LoadConfigFromReader(strings.NewReader(content))
	assert.NoError(t, err)
	assert.Equal(t, "podman run --name my-model ghcr.io/ggml-org/llama.cpp:server-cuda -m model.gguf", config.Models["my-model"].Cmd)
}

// Test model macro overrides global macro in substitution
func TestConfig_ModelMacroOverridesGlobal(t *testing.T) {
	content := `
startPort: 10000
macros:
  "tag": "global"
  "msg": "value-${tag}"

models:
  test:
    macros:
      "tag": "model-level"
    cmd: echo ${msg}
    proxy: http://localhost:8080
`

	config, err := LoadConfigFromReader(strings.NewReader(content))
	assert.NoError(t, err)
	assert.Equal(t, "echo value-model-level", config.Models["test"].Cmd)
}

// Test self-reference detection error
func TestConfig_SelfReferenceDetection(t *testing.T) {
	content := `
startPort: 10000
macros:
  "recursive": "value-${recursive}"

models:
  test:
    cmd: echo ${recursive}
    proxy: http://localhost:8080
`

	_, err := LoadConfigFromReader(strings.NewReader(content))
	assert.Error(t, err)
	assert.Contains(t, err.Error(), "recursive")
	assert.Contains(t, err.Error(), "self-reference")
}

// Test undefined macro reference error
func TestConfig_UndefinedMacroReference(t *testing.T) {
	content := `
startPort: 10000
macros:
  "A": "value-${UNDEFINED}"

models:
  test:
    cmd: echo ${A}
    proxy: http://localhost:8080
`

	_, err := LoadConfigFromReader(strings.NewReader(content))
	assert.Error(t, err)
	assert.Contains(t, err.Error(), "UNDEFINED")
}


### proxy/config/model_config.go
package config

import (
	"errors"
	"runtime"
	"slices"
	"strings"
)

type ModelConfig struct {
	Cmd           string   `yaml:"cmd"`
	CmdStop       string   `yaml:"cmdStop"`
	Proxy         string   `yaml:"proxy"`
	Aliases       []string `yaml:"aliases"`
	Env           []string `yaml:"env"`
	CheckEndpoint string   `yaml:"checkEndpoint"`
	UnloadAfter   int      `yaml:"ttl"`
	Unlisted      bool     `yaml:"unlisted"`
	UseModelName  string   `yaml:"useModelName"`

	// #179 for /v1/models
	Name        string `yaml:"name"`
	Description string `yaml:"description"`

	// Limit concurrency of HTTP requests to process
	ConcurrencyLimit int `yaml:"concurrencyLimit"`

	// Model filters see issue #174
	Filters ModelFilters `yaml:"filters"`

	// Macros: see #264
	// Model level macros take precedence over the global macros
	Macros MacroList `yaml:"macros"`

	// Metadata: see #264
	// Arbitrary metadata that can be exposed through the API
	Metadata map[string]any `yaml:"metadata"`

	// override global setting
	SendLoadingState *bool `yaml:"sendLoadingState"`
}

func (m *ModelConfig) UnmarshalYAML(unmarshal func(interface{}) error) error {
	type rawModelConfig ModelConfig
	defaults := rawModelConfig{
		Cmd:              "",
		CmdStop:          "",
		Proxy:            "http://localhost:${PORT}",
		Aliases:          []string{},
		Env:              []string{},
		CheckEndpoint:    "/health",
		UnloadAfter:      0,
		Unlisted:         false,
		UseModelName:     "",
		ConcurrencyLimit: 0,
		Name:             "",
		Description:      "",
	}

	// the default cmdStop to taskkill /f /t /pid ${PID}
	if runtime.GOOS == "windows" {
		defaults.CmdStop = "taskkill /f /t /pid ${PID}"
	}

	if err := unmarshal(&defaults); err != nil {
		return err
	}

	*m = ModelConfig(defaults)
	return nil
}

func (m *ModelConfig) SanitizedCommand() ([]string, error) {
	return SanitizeCommand(m.Cmd)
}

// ModelFilters see issue #174
type ModelFilters struct {
	StripParams string `yaml:"stripParams"`
}

func (m *ModelFilters) UnmarshalYAML(unmarshal func(interface{}) error) error {
	type rawModelFilters ModelFilters
	defaults := rawModelFilters{
		StripParams: "",
	}

	if err := unmarshal(&defaults); err != nil {
		return err
	}

	// Try to unmarshal with the old field name for backwards compatibility
	if defaults.StripParams == "" {
		var legacy struct {
			StripParams string `yaml:"strip_params"`
		}
		if legacyErr := unmarshal(&legacy); legacyErr != nil {
			return errors.New("failed to unmarshal legacy filters.strip_params: " + legacyErr.Error())
		}
		defaults.StripParams = legacy.StripParams
	}

	*m = ModelFilters(defaults)
	return nil
}

func (f ModelFilters) SanitizedStripParams() ([]string, error) {
	if f.StripParams == "" {
		return nil, nil
	}

	params := strings.Split(f.StripParams, ",")
	cleaned := make([]string, 0, len(params))
	seen := make(map[string]bool)

	for _, param := range params {
		trimmed := strings.TrimSpace(param)
		if trimmed == "model" || trimmed == "" || seen[trimmed] {
			continue
		}
		seen[trimmed] = true
		cleaned = append(cleaned, trimmed)
	}

	// sort cleaned
	slices.Sort(cleaned)
	return cleaned, nil
}


### proxy/config/config_test.go
package config

import (
	"slices"
	"strings"
	"testing"

	"github.com/stretchr/testify/assert"
)

func TestConfig_GroupMemberIsUnique(t *testing.T) {
	content := `
models:
  model1:
    cmd: path/to/cmd --arg1 one
    proxy: "http://localhost:8080"
  model2:
    cmd: path/to/cmd --arg1 one
    proxy: "http://localhost:8081"
    checkEndpoint: "/"
  model3:
    cmd: path/to/cmd --arg1 one
    proxy: "http://localhost:8081"
    checkEndpoint: "/"

healthCheckTimeout: 15
groups:
  group1:
    swap: true
    exclusive: false
    members: ["model2"]
  group2:
    swap: true
    exclusive: false
    members: ["model2"]
`
	// Load the config and verify
	_, err := LoadConfigFromReader(strings.NewReader(content))

	// a Contains as order of the map is not guaranteed
	assert.Contains(t, err.Error(), "model member model2 is used in multiple groups:")
}

func TestConfig_ModelAliasesAreUnique(t *testing.T) {
	content := `
models:
  model1:
    cmd: path/to/cmd --arg1 one
    proxy: "http://localhost:8080"
    aliases:
      - m1
  model2:
    cmd: path/to/cmd --arg1 one
    proxy: "http://localhost:8081"
    checkEndpoint: "/"
    aliases:
      - m1
      - m2
`
	// Load the config and verify
	_, err := LoadConfigFromReader(strings.NewReader(content))

	// this is a contains because it could be `model1` or `model2` depending on the order
	// go decided on the order of the map
	assert.Contains(t, err.Error(), "duplicate alias m1 found in model: model")
}

func TestConfig_FindConfig(t *testing.T) {

	// TODO?
	// make make this shared between the different tests
	config := &Config{
		Models: map[string]ModelConfig{
			"model1": {
				Cmd:           "python model1.py",
				Proxy:         "http://localhost:8080",
				Aliases:       []string{"m1", "model-one"},
				Env:           []string{"VAR1=value1", "VAR2=value2"},
				CheckEndpoint: "/health",
			},
			"model2": {
				Cmd:           "python model2.py",
				Proxy:         "http://localhost:8081",
				Aliases:       []string{"m2", "model-two"},
				Env:           []string{"VAR3=value3", "VAR4=value4"},
				CheckEndpoint: "/status",
			},
		},
		HealthCheckTimeout: 10,
		aliases: map[string]string{
			"m1":        "model1",
			"model-one": "model1",
			"m2":        "model2",
		},
	}

	// Test finding a model by its name
	modelConfig, modelId, found := config.FindConfig("model1")
	assert.True(t, found)
	assert.Equal(t, "model1", modelId)
	assert.Equal(t, config.Models["model1"], modelConfig)

	// Test finding a model by its alias
	modelConfig, modelId, found = config.FindConfig("m1")
	assert.True(t, found)
	assert.Equal(t, "model1", modelId)
	assert.Equal(t, config.Models["model1"], modelConfig)

	// Test finding a model that does not exist
	modelConfig, modelId, found = config.FindConfig("model3")
	assert.False(t, found)
	assert.Equal(t, "", modelId)
	assert.Equal(t, ModelConfig{}, modelConfig)
}

func TestConfig_AutomaticPortAssignments(t *testing.T) {

	t.Run("Default Port Ranges", func(t *testing.T) {
		content := ``
		config, err := LoadConfigFromReader(strings.NewReader(content))
		if !assert.NoError(t, err) {
			t.Fatalf("Failed to load config: %v", err)
		}

		assert.Equal(t, 5800, config.StartPort)
	})
	t.Run("User specific port ranges", func(t *testing.T) {
		content := `startPort: 1000`
		config, err := LoadConfigFromReader(strings.NewReader(content))
		if !assert.NoError(t, err) {
			t.Fatalf("Failed to load config: %v", err)
		}

		assert.Equal(t, 1000, config.StartPort)
	})

	t.Run("Invalid start port", func(t *testing.T) {
		content := `startPort: abcd`
		_, err := LoadConfigFromReader(strings.NewReader(content))
		assert.NotNil(t, err)
	})

	t.Run("start port must be greater than 1", func(t *testing.T) {
		content := `startPort: -99`
		_, err := LoadConfigFromReader(strings.NewReader(content))
		assert.NotNil(t, err)
	})

	t.Run("Automatic port assignments", func(t *testing.T) {
		content := `
startPort: 5800
models:
  model1:
    cmd: svr --port ${PORT}
  model2:
    cmd: svr --port ${PORT}
    proxy: "http://172.11.22.33:${PORT}"
  model3:
    cmd: svr --port 1999
    proxy: "http://1.2.3.4:1999"
`
		config, err := LoadConfigFromReader(strings.NewReader(content))
		if !assert.NoError(t, err) {
			t.Fatalf("Failed to load config: %v", err)
		}

		assert.Equal(t, 5800, config.StartPort)
		assert.Equal(t, "svr --port 5800", config.Models["model1"].Cmd)
		assert.Equal(t, "http://localhost:5800", config.Models["model1"].Proxy)

		assert.Equal(t, "svr --port 5801", config.Models["model2"].Cmd)
		assert.Equal(t, "http://172.11.22.33:5801", config.Models["model2"].Proxy)

		assert.Equal(t, "svr --port 1999", config.Models["model3"].Cmd)
		assert.Equal(t, "http://1.2.3.4:1999", config.Models["model3"].Proxy)

	})

	t.Run("Proxy value required if no ${PORT} in cmd", func(t *testing.T) {
		content := `
models:
  model1:
    cmd: svr --port 111
`
		_, err := LoadConfigFromReader(strings.NewReader(content))
		assert.Equal(t, "model model1: proxy uses ${PORT} but cmd does not - ${PORT} is only available when used in cmd", err.Error())
	})
}

func TestConfig_MacroReplacement(t *testing.T) {
	content := `
startPort: 9990
macros:
  svr-path: "path/to/server"
  argOne: "--arg1"
  argTwo: "--arg2"
  autoPort: "--port ${PORT}"
  overriddenByModelMacro: failed

models:
  model1:
    macros:
      overriddenByModelMacro: success
    cmd: |
      ${svr-path} ${argTwo}
      # the automatic ${PORT} is replaced
      ${autoPort}
      ${argOne}
      --arg3 three
      --overridden ${overriddenByModelMacro}
    cmdStop: |
      /path/to/stop.sh --port ${PORT} ${argTwo}
`

	config, err := LoadConfigFromReader(strings.NewReader(content))
	if !assert.NoError(t, err) {
		t.FailNow()
	}
	sanitizedCmd, err := SanitizeCommand(config.Models["model1"].Cmd)
	assert.NoError(t, err)
	assert.Equal(t, "path/to/server --arg2 --port 9990 --arg1 --arg3 three --overridden success", strings.Join(sanitizedCmd, " "))

	sanitizedCmdStop, err := SanitizeCommand(config.Models["model1"].CmdStop)
	assert.NoError(t, err)
	assert.Equal(t, "/path/to/stop.sh --port 9990 --arg2", strings.Join(sanitizedCmdStop, " "))
}

func TestConfig_MacroReservedNames(t *testing.T) {

	tests := []struct {
		name          string
		config        string
		expectedError string
	}{
		{
			name: "global macro named PORT",
			config: `
macros:
  PORT: "1111"
`,
			expectedError: "macro name 'PORT' is reserved",
		},
		{
			name: "global macro named MODEL_ID",
			config: `
macros:
  MODEL_ID: model1
`,
			expectedError: "macro name 'MODEL_ID' is reserved",
		},
		{
			name: "model macro named PORT",
			config: `
models:
  model1:
    macros:
      PORT: 1111
`,
			expectedError: "model model1: macro name 'PORT' is reserved",
		},

		{
			name: "model macro named MODEL_ID",
			config: `
models:
  model1:
    macros:
      MODEL_ID: model1
`,
			expectedError: "model model1: macro name 'MODEL_ID' is reserved",
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			_, err := LoadConfigFromReader(strings.NewReader(tt.config))
			assert.NotNil(t, err)
			assert.Equal(t, tt.expectedError, err.Error())
		})
	}
}

func TestConfig_MacroErrorOnUnknownMacros(t *testing.T) {
	tests := []struct {
		name    string
		field   string
		content string
	}{
		{
			name:  "unknown macro in cmd",
			field: "cmd",
			content: `
startPort: 9990
macros:
  svr-path: "path/to/server"
models:
  model1:
    cmd: |
      ${svr-path} --port ${PORT}
      ${unknownMacro}
`,
		},
		{
			name:  "unknown macro in cmdStop",
			field: "cmdStop",
			content: `
startPort: 9990
macros:
  svr-path: "path/to/server"
models:
  model1:
    cmd: "${svr-path} --port ${PORT}"
    cmdStop: "kill ${unknownMacro}"
`,
		},
		{
			name:  "unknown macro in proxy",
			field: "proxy",
			content: `
startPort: 9990
macros:
  svr-path: "path/to/server"
models:
  model1:
    cmd: "${svr-path} --port ${PORT}"
    proxy: "http://${unknownMacro}:${PORT}"
`,
		},
		{
			name:  "unknown macro in checkEndpoint",
			field: "checkEndpoint",
			content: `
startPort: 9990
macros:
  svr-path: "path/to/server"
models:
  model1:
    cmd: "${svr-path} --port ${PORT}"
    checkEndpoint: "http://localhost:${unknownMacro}/health"
`,
		},
		{
			name:  "unknown macro in filters.stripParams",
			field: "filters.stripParams",
			content: `
startPort: 9990
macros:
  svr-path: "path/to/server"
models:
  model1:
    cmd: "${svr-path} --port ${PORT}"
    filters:
      stripParams: "model,${unknownMacro}"
`,
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			_, err := LoadConfigFromReader(strings.NewReader(tt.content))
			if assert.Error(t, err) {
				assert.Contains(t, err.Error(), "unknown macro '${unknownMacro}' found in model1."+tt.field)
			}
			//t.Log(err)
		})
	}
}
func TestStripComments(t *testing.T) {
	tests := []struct {
		name     string
		input    string
		expected string
	}{
		{
			name:     "no comments",
			input:    "echo hello\necho world",
			expected: "echo hello\necho world",
		},
		{
			name:     "single comment line",
			input:    "# this is a comment\necho hello",
			expected: "echo hello",
		},
		{
			name:     "multiple comment lines",
			input:    "# comment 1\necho hello\n# comment 2\necho world",
			expected: "echo hello\necho world",
		},
		{
			name:     "comment with spaces",
			input:    "   # indented comment\necho hello",
			expected: "echo hello",
		},
		{
			name:     "empty lines preserved",
			input:    "echo hello\n\necho world",
			expected: "echo hello\n\necho world",
		},
		{
			name:     "only comments",
			input:    "# comment 1\n# comment 2",
			expected: "",
		},
		{
			name:     "empty string",
			input:    "",
			expected: "",
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			result := StripComments(tt.input)
			if result != tt.expected {
				t.Errorf("StripComments() = %q, expected %q", result, tt.expected)
			}
		})
	}
}

func TestConfig_MacroInCommentStrippedBeforeExpansion(t *testing.T) {
	// Test case that reproduces the original bug where a macro in a comment
	// would get expanded and cause the comment text to be included in the command
	content := `
startPort: 9990
macros:
  "latest-llama": >
    /user/llama.cpp/build/bin/llama-server
    --port ${PORT}

models:
  "test-model":
    cmd: |
      # ${latest-llama} is a macro that is defined above
      ${latest-llama}
      --model /path/to/model.gguf
      -ngl 99
`

	config, err := LoadConfigFromReader(strings.NewReader(content))
	assert.NoError(t, err)

	// Get the sanitized command
	sanitizedCmd, err := SanitizeCommand(config.Models["test-model"].Cmd)
	assert.NoError(t, err)

	// Join the command for easier inspection
	cmdStr := strings.Join(sanitizedCmd, " ")

	// Verify that comment text is NOT present in the final command as separate arguments
	commentWords := []string{"is", "macro", "that", "defined", "above"}
	for _, word := range commentWords {
		found := slices.Contains(sanitizedCmd, word)
		assert.False(t, found, "Comment text '%s' should not be present as a separate argument in final command", word)
	}

	// Verify that the actual command components ARE present
	expectedParts := []string{
		"/user/llama.cpp/build/bin/llama-server",
		"--port",
		"9990",
		"--model",
		"/path/to/model.gguf",
		"-ngl",
		"99",
	}

	for _, part := range expectedParts {
		assert.Contains(t, cmdStr, part, "Expected command part '%s' not found in final command", part)
	}

	// Verify the server path appears exactly once (not duplicated due to macro expansion)
	serverPath := "/user/llama.cpp/build/bin/llama-server"
	count := strings.Count(cmdStr, serverPath)
	assert.Equal(t, 1, count, "Expected exactly 1 occurrence of server path, found %d", count)

	// Verify the expected final command structure
	expectedCmd := "/user/llama.cpp/build/bin/llama-server --port 9990 --model /path/to/model.gguf -ngl 99"
	assert.Equal(t, expectedCmd, cmdStr, "Final command does not match expected structure")
}

func TestConfig_MacroModelId(t *testing.T) {
	content := `
startPort: 9000
macros:
  "docker-llama": docker run --name ${MODEL_ID} -p ${PORT}:8080 docker_img
  "docker-stop": docker stop ${MODEL_ID}

models:
  model1:
    cmd: /path/to/server -p ${PORT} -hf ${MODEL_ID}

  model2:
    cmd: ${docker-llama}
    cmdStop: ${docker-stop}

  author/model:F16:
    cmd: /path/to/server -p ${PORT} -hf ${MODEL_ID}
    cmdStop: stop
`

	config, err := LoadConfigFromReader(strings.NewReader(content))
	assert.NoError(t, err)
	sanitizedCmd, err := SanitizeCommand(config.Models["model1"].Cmd)
	assert.NoError(t, err)
	assert.Equal(t, "/path/to/server -p 9001 -hf model1", strings.Join(sanitizedCmd, " "))

	dockerStopMacro, found := config.Macros.Get("docker-stop")
	assert.True(t, found)
	assert.Equal(t, "docker stop ${MODEL_ID}", dockerStopMacro)

	sanitizedCmd2, err := SanitizeCommand(config.Models["model2"].Cmd)
	assert.NoError(t, err)
	assert.Equal(t, "docker run --name model2 -p 9002:8080 docker_img", strings.Join(sanitizedCmd2, " "))

	sanitizedCmdStop, err := SanitizeCommand(config.Models["model2"].CmdStop)
	assert.NoError(t, err)
	assert.Equal(t, "docker stop model2", strings.Join(sanitizedCmdStop, " "))

	sanitizedCmd3, err := SanitizeCommand(config.Models["author/model:F16"].Cmd)
	assert.NoError(t, err)
	assert.Equal(t, "/path/to/server -p 9000 -hf author/model:F16", strings.Join(sanitizedCmd3, " "))
}

func TestConfig_TypedMacrosInMetadata(t *testing.T) {
	content := `
startPort: 10000
macros:
  PORT_NUM: 10001
  TEMP: 0.7
  ENABLED: true
  NAME: "llama model"
  CTX: 16384

models:
  test-model:
    cmd: /path/to/server -p ${PORT}
    metadata:
      port: ${PORT_NUM}
      temperature: ${TEMP}
      enabled: ${ENABLED}
      model_name: ${NAME}
      context: ${CTX}
      note: "Running on port ${PORT_NUM} with temp ${TEMP} and context ${CTX}"
`

	config, err := LoadConfigFromReader(strings.NewReader(content))
	assert.NoError(t, err)

	meta := config.Models["test-model"].Metadata
	assert.NotNil(t, meta)

	// Verify direct substitution preserves types
	assert.Equal(t, 10001, meta["port"])
	assert.Equal(t, 0.7, meta["temperature"])
	assert.Equal(t, true, meta["enabled"])
	assert.Equal(t, "llama model", meta["model_name"])
	assert.Equal(t, 16384, meta["context"])

	// Verify string interpolation converts to string
	assert.Equal(t, "Running on port 10001 with temp 0.7 and context 16384", meta["note"])
}

func TestConfig_NestedStructuresInMetadata(t *testing.T) {
	content := `
startPort: 10000
macros:
  TEMP: 0.7

models:
  test-model:
    cmd: /path/to/server -p ${PORT}
    metadata:
      config:
        port: ${PORT}
        temperature: ${TEMP}
      tags: ["model:${MODEL_ID}", "port:${PORT}"]
      nested:
        deep:
          value: ${TEMP}
`

	config, err := LoadConfigFromReader(strings.NewReader(content))
	assert.NoError(t, err)

	meta := config.Models["test-model"].Metadata
	assert.NotNil(t, meta)

	// Verify nested objects
	configMap := meta["config"].(map[string]any)
	assert.Equal(t, 10000, configMap["port"])
	assert.Equal(t, 0.7, configMap["temperature"])

	// Verify arrays
	tags := meta["tags"].([]any)
	assert.Equal(t, "model:test-model", tags[0])
	assert.Equal(t, "port:10000", tags[1])

	// Verify deeply nested structures
	nested := meta["nested"].(map[string]any)
	deep := nested["deep"].(map[string]any)
	assert.Equal(t, 0.7, deep["value"])
}

func TestConfig_ModelLevelMacroPrecedenceInMetadata(t *testing.T) {
	content := `
startPort: 10000
macros:
  TEMP: 0.5
  GLOBAL_VAL: "global"

models:
  test-model:
    cmd: /path/to/server -p ${PORT}
    macros:
      TEMP: 0.9
      LOCAL_VAL: "local"
    metadata:
      temperature: ${TEMP}
      global: ${GLOBAL_VAL}
      local: ${LOCAL_VAL}
`

	config, err := LoadConfigFromReader(strings.NewReader(content))
	assert.NoError(t, err)

	meta := config.Models["test-model"].Metadata
	assert.NotNil(t, meta)

	// Model-level macro should override global
	assert.Equal(t, 0.9, meta["temperature"])
	// Global macro should be accessible
	assert.Equal(t, "global", meta["global"])
	// Model-level macro should be accessible
	assert.Equal(t, "local", meta["local"])
}

func TestConfig_UnknownMacroInMetadata(t *testing.T) {
	content := `
startPort: 10000
models:
  test-model:
    cmd: /path/to/server -p ${PORT}
    metadata:
      value: ${UNKNOWN_MACRO}
`

	_, err := LoadConfigFromReader(strings.NewReader(content))
	assert.Error(t, err)
	assert.Contains(t, err.Error(), "test-model")
	assert.Contains(t, err.Error(), "UNKNOWN_MACRO")
}

func TestConfig_InvalidMacroType(t *testing.T) {
	content := `
startPort: 10000
macros:
  INVALID:
    nested: value

models:
  test-model:
    cmd: /path/to/server -p ${PORT}
`

	_, err := LoadConfigFromReader(strings.NewReader(content))
	assert.Error(t, err)
	assert.Contains(t, err.Error(), "INVALID")
	assert.Contains(t, err.Error(), "must be a scalar type")
}

func TestConfig_MacroTypeValidation(t *testing.T) {
	tests := []struct {
		name      string
		yaml      string
		shouldErr bool
	}{
		{
			name: "string macro",
			yaml: `
startPort: 10000
macros:
  STR: "test"
models:
  test-model:
    cmd: /path/to/server -p ${PORT}
`,
			shouldErr: false,
		},
		{
			name: "int macro",
			yaml: `
startPort: 10000
macros:
  NUM: 42
models:
  test-model:
    cmd: /path/to/server -p ${PORT}
`,
			shouldErr: false,
		},
		{
			name: "float macro",
			yaml: `
startPort: 10000
macros:
  FLOAT: 3.14
models:
  test-model:
    cmd: /path/to/server -p ${PORT}
`,
			shouldErr: false,
		},
		{
			name: "bool macro",
			yaml: `
startPort: 10000
macros:
  BOOL: true
models:
  test-model:
    cmd: /path/to/server -p ${PORT}
`,
			shouldErr: false,
		},
		{
			name: "array macro (invalid)",
			yaml: `
startPort: 10000
macros:
  ARR: [1, 2, 3]
models:
  test-model:
    cmd: /path/to/server -p ${PORT}
`,
			shouldErr: true,
		},
		{
			name: "map macro (invalid)",
			yaml: `
startPort: 10000
macros:
  MAP:
    key: value
models:
  test-model:
    cmd: /path/to/server -p ${PORT}
`,
			shouldErr: true,
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			_, err := LoadConfigFromReader(strings.NewReader(tt.yaml))
			if tt.shouldErr {
				assert.Error(t, err)
			} else {
				assert.NoError(t, err)
			}
		})
	}
}


### proxy/config/config_windows_test.go
//go:build windows

package config

import (
	"os"
	"path/filepath"
	"strings"
	"testing"

	"github.com/stretchr/testify/assert"
)

func TestConfig_SanitizeCommand(t *testing.T) {
	// does not support single quoted strings like in config_posix_test.go
	args, err := SanitizeCommand(`python model1.py \

	-a "double quotes" \
	-s
	--arg3 123 \

	   # comment 2
	--arg4 '"string in string"'



	# this will get stripped out as well as the white space above
	-c "'single quoted'"
	`)
	assert.NoError(t, err)
	assert.Equal(t, []string{
		"python", "model1.py",
		"-a", "double quotes",
		"-s",
		"--arg3", "123",
		"--arg4", "'string in string'", // this is a little weird but the lexer says so...?
		"-c", `'single quoted'`,
	}, args)

	// Test an empty command
	args, err = SanitizeCommand("")
	assert.Error(t, err)
	assert.Nil(t, args)
}

func TestConfig_DefaultValuesWindows(t *testing.T) {
	content := `
models:
  model1:
    cmd: path/to/cmd --port ${PORT}
`

	config, err := LoadConfigFromReader(strings.NewReader(content))
	assert.NoError(t, err)
	assert.Equal(t, 120, config.HealthCheckTimeout)
	assert.Equal(t, 5800, config.StartPort)
	assert.Equal(t, "info", config.LogLevel)
	assert.Equal(t, "", config.LogTimeFormat)

	// Test default group exists
	defaultGroup, exists := config.Groups["(default)"]
	assert.True(t, exists, "default group should exist")
	if assert.NotNil(t, defaultGroup, "default group should not be nil") {
		assert.Equal(t, true, defaultGroup.Swap)
		assert.Equal(t, true, defaultGroup.Exclusive)
		assert.Equal(t, false, defaultGroup.Persistent)
		assert.Equal(t, []string{"model1"}, defaultGroup.Members)
	}

	model1, exists := config.Models["model1"]
	assert.True(t, exists, "model1 should exist")
	if assert.NotNil(t, model1, "model1 should not be nil") {
		assert.Equal(t, "path/to/cmd --port 5800", model1.Cmd) // has the port replaced
		assert.Equal(t, "taskkill /f /t /pid ${PID}", model1.CmdStop)
		assert.Equal(t, "http://localhost:5800", model1.Proxy)
		assert.Equal(t, "/health", model1.CheckEndpoint)
		assert.Equal(t, []string{}, model1.Aliases)
		assert.Equal(t, []string{}, model1.Env)
		assert.Equal(t, 0, model1.UnloadAfter)
		assert.Equal(t, false, model1.Unlisted)
		assert.Equal(t, "", model1.UseModelName)
		assert.Equal(t, 0, model1.ConcurrencyLimit)
	}

	// default empty filter exists
	assert.Equal(t, "", model1.Filters.StripParams)
}

func TestConfig_LoadWindows(t *testing.T) {
	// Create a temporary YAML file for testing
	tempDir, err := os.MkdirTemp("", "test-config")
	if err != nil {
		t.Fatalf("Failed to create temporary directory: %v", err)
	}
	defer os.RemoveAll(tempDir)

	tempFile := filepath.Join(tempDir, "config.yaml")
	content := `
macros:
  svr-path: "path/to/server"
models:
  model1:
    cmd: path/to/cmd --arg1 one
    proxy: "http://localhost:8080"
    aliases:
      - "m1"
      - "model-one"
    env:
      - "VAR1=value1"
      - "VAR2=value2"
    checkEndpoint: "/health"
  model2:
    cmd: ${svr-path} --arg1 one
    proxy: "http://localhost:8081"
    aliases:
      - "m2"
    checkEndpoint: "/"
  model3:
    cmd: path/to/cmd --arg1 one
    proxy: "http://localhost:8081"
    aliases:
      - "mthree"
    checkEndpoint: "/"
  model4:
    cmd: path/to/cmd --arg1 one
    proxy: "http://localhost:8082"
    checkEndpoint: "/"

healthCheckTimeout: 15
profiles:
  test:
    - model1
    - model2
groups:
  group1:
    swap: true
    exclusive: false
    members: ["model2"]
  forever:
    exclusive: false
    persistent: true
    members:
      - "model4"
`

	if err := os.WriteFile(tempFile, []byte(content), 0644); err != nil {
		t.Fatalf("Failed to write temporary file: %v", err)
	}

	// Load the config and verify
	config, err := LoadConfig(tempFile)
	if err != nil {
		t.Fatalf("Failed to load config: %v", err)
	}

	modelLoadingState := false

	expected := Config{
		LogLevel:      "info",
		LogTimeFormat: "",
		StartPort:     5800,
		Macros: MacroList{
			{"svr-path", "path/to/server"},
		},
		SendLoadingState: false,
		Models: map[string]ModelConfig{
			"model1": {
				Cmd:              "path/to/cmd --arg1 one",
				CmdStop:          "taskkill /f /t /pid ${PID}",
				Proxy:            "http://localhost:8080",
				Aliases:          []string{"m1", "model-one"},
				Env:              []string{"VAR1=value1", "VAR2=value2"},
				CheckEndpoint:    "/health",
				SendLoadingState: &modelLoadingState,
			},
			"model2": {
				Cmd:              "path/to/server --arg1 one",
				CmdStop:          "taskkill /f /t /pid ${PID}",
				Proxy:            "http://localhost:8081",
				Aliases:          []string{"m2"},
				Env:              []string{},
				CheckEndpoint:    "/",
				SendLoadingState: &modelLoadingState,
			},
			"model3": {
				Cmd:              "path/to/cmd --arg1 one",
				CmdStop:          "taskkill /f /t /pid ${PID}",
				Proxy:            "http://localhost:8081",
				Aliases:          []string{"mthree"},
				Env:              []string{},
				CheckEndpoint:    "/",
				SendLoadingState: &modelLoadingState,
			},
			"model4": {
				Cmd:              "path/to/cmd --arg1 one",
				CmdStop:          "taskkill /f /t /pid ${PID}",
				Proxy:            "http://localhost:8082",
				CheckEndpoint:    "/",
				Aliases:          []string{},
				Env:              []string{},
				SendLoadingState: &modelLoadingState,
			},
		},
		HealthCheckTimeout: 15,
		MetricsMaxInMemory: 1000,
		Profiles: map[string][]string{
			"test": {"model1", "model2"},
		},
		aliases: map[string]string{
			"m1":        "model1",
			"model-one": "model1",
			"m2":        "model2",
			"mthree":    "model3",
		},
		Groups: map[string]GroupConfig{
			DEFAULT_GROUP_ID: {
				Swap:      true,
				Exclusive: true,
				Members:   []string{"model1", "model3"},
			},
			"group1": {
				Swap:      true,
				Exclusive: false,
				Members:   []string{"model2"},
			},
			"forever": {
				Swap:       true,
				Exclusive:  false,
				Persistent: true,
				Members:    []string{"model4"},
			},
		},
	}

	assert.Equal(t, expected, config)

	realname, found := config.RealModelName("m1")
	assert.True(t, found)
	assert.Equal(t, "model1", realname)
}


### proxy/config/config_posix_test.go
//go:build !windows

package config

import (
	"os"
	"path/filepath"
	"strings"
	"testing"

	"github.com/stretchr/testify/assert"
)

func TestConfig_SanitizeCommand(t *testing.T) {
	// Test a command with spaces and newlines
	args, err := SanitizeCommand(`python model1.py \
		-a "double quotes" \
		--arg2 'single quotes'
		-s
		# comment 1
		--arg3 123 \

		  # comment 2
		--arg4 '"string in string"'


		# this will get stripped out as well as the white space above
		-c "'single quoted'"
		`)
	assert.NoError(t, err)
	assert.Equal(t, []string{
		"python", "model1.py",
		"-a", "double quotes",
		"--arg2", "single quotes",
		"-s",
		"--arg3", "123",
		"--arg4", `"string in string"`,
		"-c", `'single quoted'`,
	}, args)

	// Test an empty command
	args, err = SanitizeCommand("")
	assert.Error(t, err)
	assert.Nil(t, args)
}

// Test the default values are automatically set for global, model and group configurations
// after loading the configuration
func TestConfig_DefaultValuesPosix(t *testing.T) {
	content := `
models:
  model1:
    cmd: path/to/cmd --port ${PORT}
`

	config, err := LoadConfigFromReader(strings.NewReader(content))
	assert.NoError(t, err)
	assert.Equal(t, 120, config.HealthCheckTimeout)
	assert.Equal(t, 5800, config.StartPort)
	assert.Equal(t, "info", config.LogLevel)
	assert.Equal(t, "", config.LogTimeFormat)

	// Test default group exists
	defaultGroup, exists := config.Groups["(default)"]
	assert.True(t, exists, "default group should exist")
	if assert.NotNil(t, defaultGroup, "default group should not be nil") {
		assert.Equal(t, true, defaultGroup.Swap)
		assert.Equal(t, true, defaultGroup.Exclusive)
		assert.Equal(t, false, defaultGroup.Persistent)
		assert.Equal(t, []string{"model1"}, defaultGroup.Members)
	}

	model1, exists := config.Models["model1"]
	assert.True(t, exists, "model1 should exist")
	if assert.NotNil(t, model1, "model1 should not be nil") {
		assert.Equal(t, "path/to/cmd --port 5800", model1.Cmd) // has the port replaced
		assert.Equal(t, "", model1.CmdStop)
		assert.Equal(t, "http://localhost:5800", model1.Proxy)
		assert.Equal(t, "/health", model1.CheckEndpoint)
		assert.Equal(t, []string{}, model1.Aliases)
		assert.Equal(t, []string{}, model1.Env)
		assert.Equal(t, 0, model1.UnloadAfter)
		assert.Equal(t, false, model1.Unlisted)
		assert.Equal(t, "", model1.UseModelName)
		assert.Equal(t, 0, model1.ConcurrencyLimit)
	}

	// default empty filter exists
	assert.Equal(t, "", model1.Filters.StripParams)
}

func TestConfig_LoadPosix(t *testing.T) {
	// Create a temporary YAML file for testing
	tempDir, err := os.MkdirTemp("", "test-config")
	if err != nil {
		t.Fatalf("Failed to create temporary directory: %v", err)
	}
	defer os.RemoveAll(tempDir)

	tempFile := filepath.Join(tempDir, "config.yaml")
	content := `
macros:
  svr-path: "path/to/server"
hooks:
  on_startup:
    preload: ["model1", "model2"]
models:
  model1:
    cmd: path/to/cmd --arg1 one
    proxy: "http://localhost:8080"
    name: "Model 1"
    description: "This is model 1"
    aliases:
      - "m1"
      - "model-one"
    env:
      - "VAR1=value1"
      - "VAR2=value2"
    checkEndpoint: "/health"
  model2:
    cmd: ${svr-path} --arg1 one
    proxy: "http://localhost:8081"
    aliases:
      - "m2"
    checkEndpoint: "/"
  model3:
    cmd: path/to/cmd --arg1 one
    proxy: "http://localhost:8081"
    aliases:
      - "mthree"
    checkEndpoint: "/"
  model4:
    cmd: path/to/cmd --arg1 one
    proxy: "http://localhost:8082"
    checkEndpoint: "/"

healthCheckTimeout: 15
profiles:
  test:
    - model1
    - model2
groups:
  group1:
    swap: true
    exclusive: false
    members: ["model2"]
  forever:
    exclusive: false
    persistent: true
    members:
      - "model4"
`

	if err := os.WriteFile(tempFile, []byte(content), 0644); err != nil {
		t.Fatalf("Failed to write temporary file: %v", err)
	}

	// Load the config and verify
	config, err := LoadConfig(tempFile)
	if err != nil {
		t.Fatalf("Failed to load config: %v", err)
	}

	modelLoadingState := false

	expected := Config{
		LogLevel:      "info",
		LogTimeFormat: "",
		StartPort:     5800,
		Macros: MacroList{
			{"svr-path", "path/to/server"},
		},
		Hooks: HooksConfig{
			OnStartup: HookOnStartup{
				Preload: []string{"model1", "model2"},
			},
		},
		SendLoadingState: false,
		Models: map[string]ModelConfig{
			"model1": {
				Cmd:              "path/to/cmd --arg1 one",
				Proxy:            "http://localhost:8080",
				Aliases:          []string{"m1", "model-one"},
				Env:              []string{"VAR1=value1", "VAR2=value2"},
				CheckEndpoint:    "/health",
				Name:             "Model 1",
				Description:      "This is model 1",
				SendLoadingState: &modelLoadingState,
			},
			"model2": {
				Cmd:              "path/to/server --arg1 one",
				Proxy:            "http://localhost:8081",
				Aliases:          []string{"m2"},
				Env:              []string{},
				CheckEndpoint:    "/",
				SendLoadingState: &modelLoadingState,
			},
			"model3": {
				Cmd:              "path/to/cmd --arg1 one",
				Proxy:            "http://localhost:8081",
				Aliases:          []string{"mthree"},
				Env:              []string{},
				CheckEndpoint:    "/",
				SendLoadingState: &modelLoadingState,
			},
			"model4": {
				Cmd:              "path/to/cmd --arg1 one",
				Proxy:            "http://localhost:8082",
				CheckEndpoint:    "/",
				Aliases:          []string{},
				Env:              []string{},
				SendLoadingState: &modelLoadingState,
			},
		},
		HealthCheckTimeout: 15,
		MetricsMaxInMemory: 1000,
		Profiles: map[string][]string{
			"test": {"model1", "model2"},
		},
		aliases: map[string]string{
			"m1":        "model1",
			"model-one": "model1",
			"m2":        "model2",
			"mthree":    "model3",
		},
		Groups: map[string]GroupConfig{
			DEFAULT_GROUP_ID: {
				Swap:      true,
				Exclusive: true,
				Members:   []string{"model1", "model3"},
			},
			"group1": {
				Swap:      true,
				Exclusive: false,
				Members:   []string{"model2"},
			},
			"forever": {
				Swap:       true,
				Exclusive:  false,
				Persistent: true,
				Members:    []string{"model4"},
			},
		},
	}

	assert.Equal(t, expected, config)

	realname, found := config.RealModelName("m1")
	assert.True(t, found)
	assert.Equal(t, "model1", realname)
}


### .github/workflows/closeinactive.yml
# https://docs.github.com/en/actions/use-cases-and-examples/project-management/closing-inactive-issues
name: Close inactive issues
on:
  schedule:
    - cron: "32 1 * * *"

jobs:
  close-issues:
    runs-on: ubuntu-latest
    permissions:
      issues: write
      pull-requests: write
    steps:
      - uses: actions/stale@v9
        with:
          days-before-issue-stale: 14
          days-before-issue-close: 14
          stale-issue-label: "stale"
          stale-issue-message: "This issue is stale because it has been open for 2 weeks with no activity."
          close-issue-message: "This issue was closed because it has been inactive for 2 weeks since being marked as stale."
          days-before-pr-stale: -1
          days-before-pr-close: -1
          repo-token: ${{ secrets.GITHUB_TOKEN }}


### .github/workflows/go-ci-windows.yml
name: Windows CI

on:
  push:
    branches: [ "main" ]

  pull_request:
    branches: [ "main" ]

  # Allows manual triggering of the workflow
  workflow_dispatch:

jobs:

  run-tests:
    runs-on: windows-latest
    steps:
    - uses: actions/checkout@v4

    - name: Set up Go
      uses: actions/setup-go@v4
      with:
        go-version: '1.23'

    # cache simple-responder to save the build time
    - name: Restore Simple Responder
      id: restore-simple-responder
      uses: actions/cache/restore@v4
      with:
        path: ./build
        key: ${{ runner.os }}-simple-responder-${{ hashFiles('misc/simple-responder/simple-responder.go') }}

    # necessary for testing proxy/Process swapping
    - name: Create simple-responder
      if: steps.restore-simple-responder.outputs.cache-hit != 'true'
      shell: bash
      run: make simple-responder-windows

    - name: Save Simple Responder
      # nothing new to save ... skip this step
      if: steps.restore-simple-responder.outputs.cache-hit != 'true'
      id: save-simple-responder
      uses: actions/cache/save@v4
      with:
        path: ./build
        key: ${{ runner.os }}-simple-responder-${{ hashFiles('misc/simple-responder/simple-responder.go') }}

    - name: Test all
      shell: bash
      run: make test-all

### .github/workflows/release.yml
name: goreleaser

on:
  push:
    tags:
      - '*'

  # Allows manual triggering of the workflow
  workflow_dispatch:
    inputs:
      tag:
        description: 'Tag version to release (e.g. v144)'
        required: true

permissions:
  contents: write

jobs:
  goreleaser:
    runs-on: ubuntu-latest
    steps:
      -
        name: Checkout
        uses: actions/checkout@v4
        with:
          fetch-depth: 0
          ref: ${{ github.event.inputs.tag || github.ref }}
      -
        name: Set up Go
        uses: actions/setup-go@v5
      -
        name: Set up Node.js
        uses: actions/setup-node@v4
        with:
          node-version: '23'
      -
        name: Install dependencies and build UI
        run: |
          cd ui
          npm ci
          npm run build

      -
        name: Run GoReleaser
        uses: goreleaser/goreleaser-action@v6
        with:
          # either 'goreleaser' (default) or 'goreleaser-pro'
          distribution: goreleaser
          # 'latest', 'nightly', or a semver
          version: '~> v2'
          args: release --clean
        env:
          GITHUB_TOKEN: ${{ secrets.GITHUB_TOKEN }}

  trigger-tap-update:
    runs-on: ubuntu-latest
    needs: goreleaser
    steps:
      - name: "Resolve tag to dispatch"
        id: tag
        run: |
          if [[ "${{ github.event_name }}" == "workflow_dispatch" ]]; then
            echo "tag=${{ github.event.inputs.tag }}" >> "$GITHUB_OUTPUT"
          else
            echo "tag=${{ github.ref_name }}" >> "$GITHUB_OUTPUT"
          fi

      - name: "Trigger tap repository update"
        uses: peter-evans/repository-dispatch@v2
        with:
          token: ${{ secrets.TAP_REPO_PAT }}
          repository: mostlygeek/homebrew-llama-swap
          event-type: new-release
          client-payload: |
            {
              "release": {
                "tag_name": "${{ steps.tag.outputs.tag }}"
              }
            }

### .github/workflows/go-ci.yml
name: Linux CI

on:
  push:
    branches: [ "main" ]

  pull_request:
    branches: [ "main" ]

  # Allows manual triggering of the workflow
  workflow_dispatch:

jobs:

  run-tests:
    runs-on: ubuntu-latest
    steps:
    - uses: actions/checkout@v4

    - name: Set up Go
      uses: actions/setup-go@v4
      with:
        go-version: '1.23'

    # Only run in this linux based runner
    - name: Check Formatting
      run: |
        if [ "$(gofmt -l . | grep -v 'event/.*_test.go' | wc -l)" -gt 0 ]; then
          gofmt -l . | grep -v 'event/.*_test.go'
          exit 1
        fi
    # cache simple-responder to save the build time
    - name: Restore Simple Responder
      id: restore-simple-responder
      uses: actions/cache/restore@v4
      with:
        path: ./build
        key: ${{ runner.os }}-simple-responder-${{ hashFiles('misc/simple-responder/simple-responder.go') }}

    # necessary for testing proxy/Process swapping
    - name: Create simple-responder
      run: make simple-responder

    - name: Save Simple Responder
      # nothing new to save ... skip this step
      if: steps.restore-simple-responder.outputs.cache-hit != 'true'
      id: save-simple-responder
      uses: actions/cache/save@v4
      with:
        path: ./build
        key: ${{ runner.os }}-simple-responder-${{ hashFiles('misc/simple-responder/simple-responder.go') }}

    - name: Test all
      run: make test-all

### .github/workflows/config-schema.yml
name: Validate JSON Schema

on:
  pull_request:
    paths:
      - "config-schema.json"
  push:
    branches:
      - main
    paths:
      - "config-schema.json"

  workflow_dispatch:

jobs:
  validate-schema:
    runs-on: ubuntu-latest
    steps:
      - name: Checkout code
        uses: actions/checkout@v4

      - name: Validate JSON Schema
        run: |
          # Check if the file is valid JSON
          if ! jq empty config-schema.json 2>/dev/null; then
            echo "Error: config-schema.json is not valid JSON"
            exit 1
          fi

          # Validate that it's a valid JSON Schema
          # Check for required $schema field
          if ! jq -e '."$schema"' config-schema.json > /dev/null; then
            echo "Warning: config-schema.json should have a \$schema field"
          fi

          # Check that it has either properties or definitions
          if ! jq -e '.properties or .definitions or ."$defs"' config-schema.json > /dev/null; then
            echo "Warning: JSON Schema should contain properties, definitions, or \$defs"
          fi

          echo "✓ config-schema.json is valid"


### .github/workflows/containers.yml
name: Build Containers

on:
  # time has no specific meaning, trying to time it after
  # the llama.cpp daily packages are published
  # https://github.com/ggml-org/llama.cpp/blob/master/.github/workflows/docker.yml
  schedule:
    - cron: "37 5 * * *"

  # Allows manual triggering of the workflow
  workflow_dispatch:

jobs:
  build-and-push:
    runs-on: ubuntu-latest
    strategy:
      matrix:
        platform: [intel, cuda, vulkan, cpu, musa]
      fail-fast: false
    steps:
      - name: Checkout code
        uses: actions/checkout@v4

      - name: Log in to GitHub Container Registry
        uses: docker/login-action@v2
        with:
          registry: ghcr.io
          username: ${{ github.actor }}
          password: ${{ secrets.GITHUB_TOKEN }}

      - name: Run build-container
        env:
          GITHUB_TOKEN: ${{ secrets.GITHUB_TOKEN }}
        run: ./docker/build-container.sh ${{ matrix.platform }} true

  # note make sure mostlygeek/llama-swap has admin rights to the llama-swap package
  # see: https://github.com/actions/delete-package-versions/issues/74
  delete-untagged-containers:
    needs: build-and-push
    runs-on: ubuntu-latest
    steps:
      - uses: actions/delete-package-versions@v5
        with:
          package-name: 'llama-swap'
          package-type: 'container'
          delete-only-untagged-versions: 'true'


### .github/ISSUE_TEMPLATE/bug-report.md
---
name: Bug Report
about: I found a defect
title: ''
labels: 'unconfirmed bug'
assignees: ''

---
> [!IMPORTANT]
> If you have questions about llama-swap please post in the Q&A in Discussions. Use bug reports when you've found a defect and wish to discuss a fix.

**Describe the bug**
A clear and concise description of what the bug is.

**Expected behaviour**
A clear and concise description of what you expected to happen.

**Operating system and version**

- OS: (linux, osx, windows, freebsd, etc)
- GPUs: (list architecture)

**My Configuration**

```yaml
# copy / paste your configuration here
```

**Proxy Logs**

```
# copy / paste from /logs
```

**Upstream Logs**

```
# copy/paste from /logs
```


### scripts/install.sh
#!/bin/sh
# This script installs llama-swap on Linux.
# It detects the current operating system architecture and installs the appropriate version of llama-swap.

set -eu

LLAMA_SWAP_DEFAULT_ADDRESS=${LLAMA_SWAP_DEFAULT_ADDRESS:-"127.0.0.1:8080"}

red="$( (/usr/bin/tput bold || :; /usr/bin/tput setaf 1 || :) 2>&-)"
plain="$( (/usr/bin/tput sgr0 || :) 2>&-)"

status() { echo ">>> $*" >&2; }
error() { echo "${red}ERROR:${plain} $*"; exit 1; }
warning() { echo "${red}WARNING:${plain} $*"; }

available() { command -v "$1" >/dev/null; }
require() {
    _MISSING=''
    for TOOL in "$@"; do
        if ! available "$TOOL"; then
            _MISSING="$_MISSING $TOOL"
        fi
    done

    echo "$_MISSING"
}

SUDO=
if [ "$(id -u)" -ne 0 ]; then
    if ! available sudo; then
        error "This script requires superuser permissions. Please re-run as root."
    fi

    SUDO="sudo"
fi

NEEDS=$(require tee tar python3 mktemp)
if [ -n "$NEEDS" ]; then
    status "ERROR: The following tools are required but missing:"
    for NEED in $NEEDS; do
        echo "  - $NEED"
    done
    exit 1
fi

[ "$(uname -s)" = "Linux" ] || error 'This script is intended to run on Linux only.'

ARCH=$(uname -m)
case "$ARCH" in
    x86_64) ARCH="amd64" ;;
    aarch64|arm64) ARCH="arm64" ;;
    *) error "Unsupported architecture: $ARCH" ;;
esac

IS_WSL2=false

KERN=$(uname -r)
case "$KERN" in
    *icrosoft*WSL2 | *icrosoft*wsl2) IS_WSL2=true;;
    *icrosoft) error "Microsoft WSL1 is not currently supported. Please use WSL2 with 'wsl --set-version <distro> 2'" ;;
    *) ;;
esac

download_binary() {
    ASSET_NAME="linux_$ARCH"

    TMPDIR=$(mktemp -d)
    trap 'rm -rf "${TMPDIR}"' EXIT INT TERM HUP
    PYTHON_SCRIPT=$(cat <<EOF
import os
import json
import sys
import urllib.request

ASSET_NAME = "${ASSET_NAME}"

with urllib.request.urlopen("https://api.github.com/repos/mostlygeek/llama-swap/releases/latest") as resp:
    data = json.load(resp)
    for asset in data.get("assets", []):
        if ASSET_NAME in asset.get("name", ""):
            url = asset["browser_download_url"]
            break
    else:
        print("ERROR: Matching asset not found.", file=sys.stderr)
        exit(1)

print("Downloading:", url, file=sys.stderr)
output_path = os.path.join("${TMPDIR}", "llama-swap.tar.gz")
urllib.request.urlretrieve(url, output_path)
print(output_path)
EOF
)

    TARFILE=$(python3 -c "$PYTHON_SCRIPT")
    if [ ! -f "$TARFILE" ]; then
        error "Failed to download binary."
    fi

    status "Extracting to /usr/local/bin"
    $SUDO tar -xzf "$TARFILE" -C /usr/local/bin llama-swap
}
download_binary

configure_systemd() {
    if ! id llama-swap >/dev/null 2>&1; then
        status "Creating llama-swap user..."
        $SUDO useradd -r -s /bin/false -U -m -d /usr/share/llama-swap llama-swap
    fi
    if getent group render >/dev/null 2>&1; then
        status "Adding llama-swap user to render group..."
        $SUDO usermod -a -G render llama-swap
    fi
    if getent group video >/dev/null 2>&1; then
        status "Adding llama-swap user to video group..."
        $SUDO usermod -a -G video llama-swap
    fi
    if getent group docker >/dev/null 2>&1; then
        status "Adding llama-swap user to docker group..."
        $SUDO usermod -a -G docker llama-swap
    fi

    status "Adding current user to llama-swap group..."
    $SUDO usermod -a -G llama-swap "$(whoami)"

    if [ ! -f "/usr/share/llama-swap/config.yaml" ]; then
        status "Creating default config.yaml..."
        cat <<EOF | $SUDO -u llama-swap tee /usr/share/llama-swap/config.yaml >/dev/null
# default 15s likely to fail for default models due to downloading models
healthCheckTimeout: 60

models:
  "qwen2.5":
    cmd: |
      docker run
        --rm
        -p \${PORT}:8080
        --name qwen2.5
      ghcr.io/ggml-org/llama.cpp:server
        -hf bartowski/Qwen2.5-0.5B-Instruct-GGUF:Q4_K_M
    cmdStop: docker stop qwen2.5

  "smollm2":
    cmd: |
      docker run
        --rm
        -p \${PORT}:8080
        --name smollm2
      ghcr.io/ggml-org/llama.cpp:server
        -hf bartowski/SmolLM2-135M-Instruct-GGUF:Q4_K_M
    cmdStop: docker stop smollm2
EOF
    fi

    status "Creating llama-swap systemd service..."
    cat <<EOF | $SUDO tee /etc/systemd/system/llama-swap.service >/dev/null
[Unit]
Description=llama-swap
After=network.target

[Service]
User=llama-swap
Group=llama-swap

# set this to match your environment
ExecStart=/usr/local/bin/llama-swap --config /usr/share/llama-swap/config.yaml --watch-config -listen ${LLAMA_SWAP_DEFAULT_ADDRESS}

Restart=on-failure
RestartSec=3
StartLimitBurst=3
StartLimitInterval=30

[Install]
WantedBy=multi-user.target
EOF
    SYSTEMCTL_RUNNING="$(systemctl is-system-running || true)"
    case $SYSTEMCTL_RUNNING in
        running|degraded)
            status "Enabling and starting llama-swap service..."
            $SUDO systemctl daemon-reload
            $SUDO systemctl enable llama-swap

            start_service() { $SUDO systemctl restart llama-swap; }
            trap start_service EXIT
            ;;
        *)
            warning "systemd is not running"
            if [ "$IS_WSL2" = true ]; then
                warning "see https://learn.microsoft.com/en-us/windows/wsl/systemd#how-to-enable-systemd to enable it"
            fi
            ;;
    esac
}

if available systemctl; then
    configure_systemd
fi

install_success() {
    status "The llama-swap API is now available at http://${LLAMA_SWAP_DEFAULT_ADDRESS}"
    status 'Customize the config file at /usr/share/llama-swap/config.yaml.'
    status 'Install complete.'
}

# WSL2 only supports GPUs via nvidia passthrough
# so check for nvidia-smi to determine if GPU is available
if [ "$IS_WSL2" = true ]; then
    if available nvidia-smi && [ -n "$(nvidia-smi | grep -o "CUDA Version: [0-9]*\.[0-9]*")" ]; then
        status "Nvidia GPU detected."
    fi
    exit 0
fi

install_success


### scripts/uninstall.sh
#!/bin/sh
# This script uninstalls llama-swap on Linux.
# It removes the binary, systemd service, config.yaml (optional), and llama-swap user and group.

set -eu

red="$( (/usr/bin/tput bold || :; /usr/bin/tput setaf 1 || :) 2>&-)"
plain="$( (/usr/bin/tput sgr0 || :) 2>&-)"

status() { echo ">>> $*" >&2; }
error() { echo "${red}ERROR:${plain} $*"; exit 1; }
warning() { echo "${red}WARNING:${plain} $*"; }

available() { command -v $1 >/dev/null; }

SUDO=
if [ "$(id -u)" -ne 0 ]; then
    if ! available sudo; then
        error "This script requires superuser permissions. Please re-run as root."
    fi

    SUDO="sudo"
fi

configure_systemd() {
    status "Stopping llama-swap service..."
    $SUDO systemctl stop llama-swap

    status "Disabling llama-swap service..."
    $SUDO systemctl disable llama-swap
}
if available systemctl; then
    configure_systemd
fi

if available llama-swap; then
    status "Removing llama-swap binary..."
    $SUDO rm $(which llama-swap)
fi

if [ -f "/usr/share/llama-swap/config.yaml" ]; then
    while true; do
        printf "Delete config.yaml (/usr/share/llama-swap/config.yaml)? [y/N] " >&2
        read answer
        case "$answer" in
            [Yy]* ) 
                $SUDO rm -r /usr/share/llama-swap
                break
                ;;
            [Nn]* | "" ) 
                break
                ;;
            * ) 
                echo "Invalid input. Please enter y or n."
                ;;
        esac
    done
fi

if id llama-swap >/dev/null 2>&1; then
    status "Removing llama-swap user..."
    $SUDO userdel llama-swap
fi

if getent group llama-swap >/dev/null 2>&1; then
    status "Removing llama-swap group..."
    $SUDO groupdel llama-swap
fi


### docker/llama-swap.Containerfile
ARG BASE_TAG=server-cuda
FROM ghcr.io/ggml-org/llama.cpp:${BASE_TAG}

# has to be after the FROM
ARG LS_VER=170

# Set default UID/GID arguments
ARG UID=10001
ARG GID=10001
ARG USER_HOME=/app

# Add user/group
ENV HOME=$USER_HOME
RUN if [ $UID -ne 0 ]; then \
      if [ $GID -ne 0 ]; then \
        groupadd --system --gid $GID app; \
      fi; \
      useradd --system --uid $UID --gid $GID \
      --home $USER_HOME app; \
    fi

# Handle paths
RUN mkdir --parents $HOME /app
RUN chown --recursive $UID:$GID $HOME /app

# Switch user
USER $UID:$GID

WORKDIR /app
RUN \
    curl -LO https://github.com/mostlygeek/llama-swap/releases/download/v"${LS_VER}"/llama-swap_"${LS_VER}"_linux_amd64.tar.gz && \
    tar -zxf llama-swap_"${LS_VER}"_linux_amd64.tar.gz && \
    rm llama-swap_"${LS_VER}"_linux_amd64.tar.gz

COPY --chown=$UID:$GID config.example.yaml /app/config.yaml

HEALTHCHECK CMD curl -f http://localhost:8080/ || exit 1
ENTRYPOINT [ "/app/llama-swap", "-config", "/app/config.yaml" ]


### docker/config.example.yaml
healthCheckTimeout: 300
logRequests: true
metricsMaxInMemory: 1000

models:
  "qwen2.5":
    proxy: "http://127.0.0.1:9999"
    cmd: >
      /app/llama-server
      -hf bartowski/Qwen2.5-0.5B-Instruct-GGUF:Q4_K_M
      --port 9999

  "smollm2":
    proxy: "http://127.0.0.1:9999"
    cmd: >
      /app/llama-server
      -hf bartowski/SmolLM2-135M-Instruct-GGUF:Q4_K_M
      --port 9999

### docker/build-container.sh
#!/bin/bash

cd $(dirname "$0")

ARCH=$1
PUSH_IMAGES=${2:-false}

# List of allowed architectures
ALLOWED_ARCHS=("intel" "vulkan" "musa" "cuda" "cpu")

# Check if ARCH is in the allowed list
if [[ ! " ${ALLOWED_ARCHS[@]} " =~ " ${ARCH} " ]]; then
  echo "Error: ARCH must be one of the following: ${ALLOWED_ARCHS[@]}"
  exit 1
fi

# Check if GITHUB_TOKEN is set and not empty
if [[ -z "$GITHUB_TOKEN" ]]; then
  echo "Error: GITHUB_TOKEN is not set or is empty."
  exit 1
fi

# the most recent llama-swap tag
# have to strip out the 'v' due to .tar.gz file naming
LS_VER=$(curl -s https://api.github.com/repos/mostlygeek/llama-swap/releases/latest | jq -r .tag_name | sed 's/v//')

if [ "$ARCH" == "cpu" ]; then
    # cpu only containers just use the server tag
    LCPP_TAG=$(curl -s -H "Authorization: Bearer $GITHUB_TOKEN" \
        "https://api.github.com/users/ggml-org/packages/container/llama.cpp/versions" \
        | jq -r '.[] | select(.metadata.container.tags[] | startswith("server")) | .metadata.container.tags[]' \
        | sort -r | head -n1 | awk -F '-' '{print $3}')
    BASE_TAG=server-${LCPP_TAG}
else
    LCPP_TAG=$(curl -s -H "Authorization: Bearer $GITHUB_TOKEN" \
        "https://api.github.com/users/ggml-org/packages/container/llama.cpp/versions" \
        | jq -r --arg arch "$ARCH" '.[] | select(.metadata.container.tags[] | startswith("server-\($arch)")) | .metadata.container.tags[]' \
        | sort -r | head -n1 | awk -F '-' '{print $3}')
    BASE_TAG=server-${ARCH}-${LCPP_TAG}
fi

# Abort if LCPP_TAG is empty.
if [[ -z "$LCPP_TAG" ]]; then
    echo "Abort: Could not find llama-server container for arch: $ARCH"
    exit 1
fi

CONTAINER_TAG="ghcr.io/mostlygeek/llama-swap:v${LS_VER}-${ARCH}-${LCPP_TAG}"
CONTAINER_LATEST="ghcr.io/mostlygeek/llama-swap:${ARCH}"
echo "Building ${CONTAINER_TAG} $LS_VER"
docker build -f llama-swap.Containerfile --build-arg BASE_TAG=${BASE_TAG} --build-arg LS_VER=${LS_VER} -t ${CONTAINER_TAG} -t ${CONTAINER_LATEST} .
if [ "$PUSH_IMAGES" == "true" ]; then
  docker push ${CONTAINER_TAG}
  docker push ${CONTAINER_LATEST}
fi


