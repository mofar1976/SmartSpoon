# Third-party licensing

SmartSpoon's original code is licensed under MIT. That license does not replace
the licenses of dependencies, model weights, container software or external APIs.

## Review scope (10 October 2026)

The [dependency inventory](.github/dependency-licenses.json) records every package
entry in both npm lockfiles, including development and platform-specific entries.
License identifiers come from lockfile metadata. `busboy@1.6.0` and
`streamsearch@1.1.0` omit that metadata; their installed LICENSE files were checked
and contain the MIT terms. This is an inventory and targeted review, not a claim
that every upstream source file or redistributed binary has been legally audited.

| Component | License / terms | Source |
| --- | --- | --- |
| Angular, NestJS, NgRx, Tailwind, RxJS, Mongoose | MIT (installed package metadata) | npm lockfiles and upstream package notices |
| Google GenAI SDK | Apache-2.0 | npm lockfile and installed package license |
| Python / Pillow | Python license family / HPND-style Pillow license | [Pillow license](https://github.com/python-pillow/Pillow/blob/main/LICENSE) |
| Ollama | MIT | [Ollama license](https://github.com/ollama/ollama/blob/main/LICENSE) |
| Qwen3-VL-4B-Instruct | Apache-2.0 | [Official model card](https://huggingface.co/Qwen/Qwen3-VL-4B-Instruct) |
| MongoDB Community Server | SSPL-1.0 | [MongoDB licensing](https://www.mongodb.com/legal/licensing/community-edition) |
| Gemini API | External service terms, not the project MIT license | [Gemini API terms](https://ai.google.dev/gemini-api/terms) |

The dependency inventory also includes BSD, ISC, Apache, MPL-2.0, Python-2.0,
CC-BY-4.0 and other upstream identifiers. MPL-2.0 entries are development tooling;
keep upstream notices and satisfy source obligations if redistributing modified
covered files. Preserve attribution required by CC-BY dependencies. The frontend
production build generates `3rdpartylicenses.txt`; retain it with build artifacts.
Node/npm distributions retain their upstream notices. Container base images have
additional notices of their own.

MongoDB is started as a separate service from its official image; its server is
not relicensed under MIT. Review its [SSPL FAQ](https://www.mongodb.com/legal/licensing/server-side-public-license/faq)
before offering MongoDB itself as a service or redistributing changed server code.

Model weights are downloaded separately, not committed or bundled with SmartSpoon.
Check the license delivered with the exact model artifact you download, including
any future replacement or quantization. Preserve required notices when distributing
weights or dependencies. README screenshots are original app captures using
synthetic demo responses and an original illustration, covered by this project's
license; they contain no third-party photographs.

Update the inventory and review relevant license changes when dependencies change.
