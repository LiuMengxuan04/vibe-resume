# Third-party notices

The live-preview editor adapts the three-panel interface, stylesheet, translations,
selection/annotation shell, staged-edit protocol, undo/save workflow, draft recovery
and AI handoff from [PPT Master](https://github.com/hugohe3/ppt-master), commit
`78759bf62e9a1ef43e926ff9e50afa4cfe9a63cb`:

- `skills/ppt-master/scripts/svg_editor/static/{index.html,style.css,app.js}`
- `skills/ppt-master/scripts/svg_editor/{server.py,annotations.py}`
- `skills/ppt-master/scripts/check_annotations.py`

The HTML DOM canvas, source-preserving HTML patches and Node.js server are the
adaptation boundaries. The PDF exporter remains VibeResume's existing exporter.

## PPT Master — MIT License

Copyright (c) 2025-2026 Hugo He

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.
