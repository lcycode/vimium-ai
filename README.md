<a name="readme"></a><h2 align="center">
  <img src="icons/icon128.png" width="32" height="32" alt="" />
  <span style="color: #2f508e;">Vim</span>ium <span style="color: #a55e18;">AI</span> - All by Keyboard
</h2>

[📖 中文版说明 · Chinese README](README-zh.md)

> **AI command bar**
>
> Set an API key in the options page, then press `:` — just like Vim's command line — to start a
> **continuous multi-turn conversation** with a large language model. The model reads the current page,
> so it can help you **understand the page, explain concepts, and translate text**. The conversation
> keeps a single context per page and continues across turns; **refreshing the page resets the context**.
>
> This is a **personal fork** of Vimium C, released under the same Apache-2.0 license
> (with MIT / CC-BY-SA parts), and is **not** the official project; the upstream is credited in the
> Copyright section at the end of this file. It stays fully inert until you set an API key.

[![Version](https://img.shields.io/github/v/release/lcycode/vimium-ai?logo=GitHub&label=lcycode%2Fvimium-ai&color=critical
  )](https://github.com/lcycode/vimium-ai/releases)
[![Apache-2.0 license](https://img.shields.io/badge/license-Apache--2.0-blue)](LICENSE.txt)
[![GitHub stars](https://img.shields.io/github/stars/lcycode/vimium-ai?logo=GitHub&labelColor=181717&color=critical
  )](https://github.com/lcycode/vimium-ai/stargazers)

A <span style="color: #a55e18;">C</span>ustomized
  [<span style="color: #2f508e;">Vim</span>ium](https://github.com/philc/vimium)
  (to click web page content and manipulate browser windows using only keyboard)
  having [**c**ontextual mapping](https://github.com/gdh1995/vimium-c/wiki/Map-a-key-to-different-commands-on-different-websites),
  [global short**c**uts](https://github.com/gdh1995/vimium-c/wiki/Trigger-commands-in-an-input-box#user-content-shortcut),
  [**c**ommand sequences](https://github.com/gdh1995/vimium-c/wiki/Auto-run-a-tree-of-commands),
  **C**hinese support
  and [inje**c**tion](https://github.com/gdh1995/vimium-c/wiki/Inject-into-other-extensions) functionality,
  in <span style="color: #a55e18;">**C**</span>-style code for qui**c**ker action and less resource **c**ost.

It (the released version) supports the new Microsoft Edge, Google Chrome and other Chromium-based browsers
  whose core versions are >= 102, and has a perfect support for a recent Firefox (since version 101.0, desktop).
It can even run on Microsoft Edge (EdgeHTML), though there're still some errors.
If re-compiled from the source code, Vimium AI is able to support Chromium 32~108 and Firefox 63~100.

Some old code of Vimium C was under the MIT license,
and you may get it in https://github.com/gdh1995/vimium-c/tree/MIT-licensed-v1 .

An old name of this project is "Vimium++", which has been given up on 2018-08-21.


# Keyboard Bindings
_This section is modified from [philc/vimium 's](https://github.com/philc/vimium#keyboard-bindings)._

Modifier keys are specified as `<c-x>`, `<m-x>`, and `<a-x>` for Ctrl+x, Meta+x, and Alt+x respectively.
For Shift+X and Ctrl+Shift+X, just type `X` and `<c-s-x>`.
See the next section for how to customize these bindings.

Once you have Vimium AI installed, you can see this list of key bindings at any time by typing `?`.

Interacting with the AI command bar:

    :           open the AI command bar and start a conversation
    <enter>     send the current message
    <s-enter>   insert a newline
    <esc>       close the AI command bar

The model reads the current page, so you can ask it to explain concepts,
translate text, or summarize what you're reading. The conversation keeps a
single context per page and continues across turns; refreshing the page
resets the context.

Navigating the current page:

    ?       show the help dialog for a list of all available keys
    h       scroll left
    j       scroll down
    k       scroll up
    l       scroll right
    gg      scroll to top of the page
    G       scroll to bottom of the page
    d       scroll down half a page
    u       scroll up half a page
    f       show hints for links and buttons to open in the current tab
    F       show link hints and open a link in a new tab
    r       reload
    gs      view source
    i       enter insert mode -- all commands will be ignored until you hit Esc to exit
    yy      copy the current url to the clipboard
    yf      copy a link url to the clipboard
    gf      cycle forward to the next frame
    gF      focus the main/top frame

Navigating to new pages:

    o       open URL, bookmark, or history entry, on an English letter "o"
    O       open URL, bookmark, history entry in a new tab, on an English letter "O"
    b       open bookmark
    B       open bookmark in a new tab

Using find:

    /       enter find mode
              -- type your search query and hit enter to search, or Esc to cancel
    n       cycle forward to the next find match
    N       cycle backward to the previous find match

For advanced usage, see [regular expressions](https://github.com/philc/vimium/wiki/Find-Mode) on the wiki.

Navigating your history:

    H       go back in history
    L       go forward in history

Manipulating tabs:

    J, gT   go one tab left
    K, gt   go one tab right
    g0      go to the first tab. Use `ng0` to go to n-th tab, on `g` and a number character of `0`
    g$      go to the last tab
    ^       visit the previously-visited tab
    t       create tab
    yt      duplicate current tab
    x       close current tab
    X       restore closed tab (i.e. unwind the `x` command)
    T       search through your open tabs
    W       move current tab to new window
    <a-p>   pin/unpin current tab

Using marks:

    ma, mA  set local mark "a" (global mark "A")
    `a, `A  jump to local mark "a" (global mark "A")
    ``      jump back to the position before the previous jump
              -- that is, before the previous gg, G, n, N, / or `a

Additional advanced browsing commands:

    ]], [[  follow the link labeled "next or ">" ("previous" or "<">)
              - helpful for browsing paginated sites
    <a-f>   open multiple links in a new tab
    gi      focus the first (or n-th) text input box on the page. Use <tab> to cycle through options.
    gu      go up one level in the URL hierarchy
    gU      go up to root of the URL hierarchy
    ge      edit the current URL
    gE      edit the current URL and open in a new tab
    zH      scroll all the way left
    zL      scroll all the way right
    v       enter visual mode; use p/P to paste-and-go, use y to yank, use v/c/V to toggle visual/line/caret modes
    V       enter visual line mode
    yc      select a first word of a sentence and enter visual mode

Vimium AI supports command repetition so, for example, hitting `5t` will open 5 tabs in rapid succession. `<esc>`
(or `<c-[>`) will clear any partial commands in the queue and will also exit insert and find modes.

There are some advanced commands which aren't documented here; refer to the help dialog (type `?`) for a full list.


# Custom Key Mappings
_This section is modified from [philc/vimium 's](https://github.com/philc/vimium#custom-key-mappings)._

When you have just installed Vimium AI, it will open a new tab to show its default key mappings,
and you may also open Vimium AI's options page and press `?` (usually it's `Shift+/`) to show those mappings again.

You may remap or unmap any of the default key bindings in the "Custom key mappings" on the options page.

Enter one of the following key mapping commands per line:

* `map <key> command`: Maps a _key_ to a Vimium AI command. Overrides web pages' default behavior (if any).
* `mapKey <key> <another_key>`: Let Vimium AI treat _key_ as _another key_. Can not affect your browser or web pages.
* `unmap <key>`: Unmaps a key and restores the default behavior (if any).
* `unmapAll`: Unmaps all bindings. This is useful if you want to completely wipe Vimium AI's default commands and start
  from scratch with your own setup.

Examples:

* `map r reload` maps the r key to reloading the page.
* `map <c-d> scrollPageDown` maps Ctrl+D to scrolling the page down.
* `unmap r` removes any mapping for the r key.
* `unmap <c-d>` removes any mapping for Ctrl+D and restores web page or browser's default behavior.
* `unmap g0` removes any mapping for a `g` key and a next `0` key.

Available Vimium AI commands can be found via the "Show available commands" link or `?` key on the options page.
The command name appears to the right of the description in parenthesis.

You can add comments to key mappings by starting a line with `"` or `#`, or a space character and a next `#` in a line.

The following special keys are available for mapping:

* `<c-*>`, `<a-*>`, `<s-*>`, `<m-*>` for Ctrl, Alt, Shift, and Meta (Command on macOS) respectively with any key.
  Replace `*` with the key name of choice.
* `<left>`, `<right>`, `<up>`, `<down>` for the arrow keys.
* `<f1>` through `<f12>` for the function keys.
* `<space>` for the space key.
* `<tab>`, `<enter>`, `<delete>`, `<backspace>`, `<insert>`, `<home>` and `<end>` for non-printable keys

Here're some advanced usages which are different with philc/vimium:

* <kbd>Shift</kbd> are automatically detected, so, `&` corresponds to <kbd>Shift+7</kbd> on an English QWERTY keyboard.
  * However, if a single key is longer than 1 character, please wrap it with `<`+`>` and insert a `s-`
  * If you want to trigger a key when multiple modifier keys are pressed, sort `a/c/m/s-` prefixes by letter order
  * For example, these keys are valid names: `<s-left>`, `<c-j>`, `<a-s-k>`, `<a-#>` and `<a-?>`
* `mapKey <key:o> <another_key>` makes _key_ work as another key only in a special mode named Vomnibar
  * `mapKey` rules always take effect before matching a key with `map` rules
  * some other modes are list in https://github.com/gdh1995/vimium-c/wiki/Use-in-another-keyboard-layout#per-mode-mapkey
* `map <key:i> command` makes _key_ trigger the command in insert mode only, but not the default normal mode
* since v1.99.98, `map! <single_key>` maps _key_ in both normal mode and insert mode, if only it's not a long sequence
  * For example, `map! jj` is invalid, but `map! <home>` and `map! <c-j>` are suitable
* `unmap` can only unmap a manually-mapped key or a default key, so a second `unmap <key>` may result in an error
  * You may use `unmap!` when you're not sure whether a key has been mapped before
* number keys (`0`-`9` and `-`) are mapped to "count prefix" of commands by default, so won't be passed to web pages.
  * And then, even after `unmapAll`, they will be automatically added back on a next `map`
  * you may write `unmap 0` to unmap it explicitly


# Project Introduction

__<span style="color: #2f508e;">Vim</span>ium <span style="color: #a55e18;">AI</span>:__

* [Chinese description](README-zh.md)
* a web extension for Firefox, Microsoft Edge and Google Chrome that provides keyboard-based navigation and control
    of the web, in the spirit of the Vim editor.
* add some powerful functions and provide more configurable details and convenience.
* here is its [Apache-2.0 license](LICENSE.txt) and [privacy policy](PRIVACY-POLICY.md)
* the initial code is forked from [philc/vimium:master](https://github.com/philc/vimium) on 2014.
* customized after translating it from CoffeeScript into JavaScript and then TypeScript.

__Other extensions supporting Vimium C:__

* PDF Viewer for Vimium C
  * built from (modified) [PDF.js](https://github.com/mozilla/pdf.js/),
    and is a replacement for the extension named [PDF Viewer](
      https://chrome.google.com/webstore/detail/pdf-viewer/oemmndcbldboiebfnladdacbdfmadadm)
  * visit it on [Chrome Web Store](
      https://chrome.google.com/webstore/detail/pdf-viewer-for-vimium-c/nacjakoppgmdcpemlfnfegmlhipddanj)
  * Project home: [vimium-c-helpers/pdf-viewer](https://github.com/gdh1995/vimium-c-helpers/tree/master/pdf-viewer)
* NewTab Adapter
  * take over browser's new tab settings and open another configurable URL
  * visit it on [Firefox Add-ons](https://addons.mozilla.org/firefox/addon/newtab-adapter/?src=external-vc-readme) /
    [Chrome Web Store](https://chrome.google.com/webstore/detail/newtab-adapter/cglpcedifkgalfdklahhcchnjepcckfn)
  * project home: [vimium-c-helpers/newtab](https://github.com/gdh1995/vimium-c-helpers/tree/master/newtab#readme)
* Shortcut Forwarding Tool
  * provide 32 configurable shortcuts and forward them to another extension like Vimium C
  * visit it on
    [Firefox Add-ons](https://addons.mozilla.org/firefox/addon/shortcut-forwarding-tool/?src=external-vc-readme) /
    [Chrome Web Store](
      https://chrome.google.com/webstore/detail/shortcut-forwarding-tool/clnalilglegcjmlgenoppklmfppddien)
  * project home: [vimium-c-helpers/shortcuts](https://github.com/gdh1995/vimium-c-helpers/tree/master/shortcuts#readme)
* Modified Weidu New Tab
  * a modified and lite version of [www.weidunewtab.com](http://www.weidunewtab.com/) (or
      [www.newtabplus.com](http://www.newtabplus.com/) ), with Chinese translation only
  * it does not take over browser's new tab settings; if needed then [NewTab Adapter](
      https://chrome.google.com/webstore/detail/newtab-adapter/cglpcedifkgalfdklahhcchnjepcckfn) is recommended
  * visit it on [Chrome Web Store](
      https://chrome.google.com/webstore/detail/微度新标签页修改版/hdnehngglnbnehkfcidabjckinphnief)


<a name="changelog"></a>

# Release Notes

Refer to [RELEASE-NOTES.md](RELEASE-NOTES.md).

#### Known Issues

There're some known issues on previous or latest versions of Chromium-based browsers,
and please read https://github.com/gdh1995/vimium-c/wiki/Known-issues-on-various-versions-of-Chrome
  for more information.


# Building

If you want to compile this project manually, then you need a Node.js 13+ and npm. Please run:

``` bash
npm install typescript
npm install pngjs # only needed for Chromium-based browsers
node scripts/tsc
# ./scripts/make.sh vimium_c-debug.zip
```

`gulp local` can also compile files in place (using configurable build options),
while `gulp dist` compiles and minimizes files into `dist/`.

The options including `MinCVer` and `BTypes` in [gulp.tsconfig.json](scripts/gulp.tsconfig.json)
  are used to control supported target browsers and set a minimum browser version.

# Thanks & Licenses

The translation files in [_locales/](https://github.com/gdh1995/vimium-c/tree/master/_locales) belong to
  [CC-BY-SA-4.0](https://creativecommons.org/licenses/by-sa/4.0/),
except some of those English sentences which are the same as [philc/vimium](https://github.com/philc/vimium)'s
  are under Vimium's MIT license.

* [Vimium](https://github.com/philc/vimium):
  Copyright (c) 2010 Phil Crosby, Ilya Sukhar.
  Licensed under the [MIT license](https://github.com/philc/vimium/blob/master/MIT-LICENSE.txt).
* [TypeScript](https://github.com/Microsoft/TypeScript):
    and modified `es.d.ts`, `es/*`, `dom.d.ts` and `chrome.d.ts` in `types/`:
  Copyright (c) Microsoft Corporation (All rights reserved).
  Licensed under the [Apache License 2.0](https://github.com/microsoft/TypeScript/blob/master/LICENSE.txt).
  See more on [www.typescriptlang.org](http://www.typescriptlang.org/).
* [Viewer.js](https://github.com/fengyuanchen/viewerjs)
  ([Modified](https://github.com/gdh1995/viewerjs)):
  Copyright (c) 2015-present Chen Fengyuan.
  Licensed under the [MIT license](https://github.com/fengyuanchen/viewerjs/blob/master/LICENSE).
* [JavaScript Expression Evaluator](https://github.com/silentmatt/expr-eval)
  ([Modified](https://github.com/gdh1995/js-expression-eval)):
  Copyright (c) 2015 Matthew Crumley.
  Licensed under the [MIT license](
    https://github.com/silentmatt/expr-eval/blob/4327f05412a3046a9b527b6ec3b50843cb0428e8/LICENSE.txt).
* The orange picture in the icon is from https://pixabay.com/vectors/orange-fruit-mandarin-citrus-fruit-158258/
* [Weidu New Tab](http://www.weidunewtab.com/):
  Copyright (c) 2012 Hangzhou Zola Network Co., Ltd. All rights reserved.
* [PDF.js](https://github.com/mozilla/pdf.js/):
  Copyright (c) Mozilla and individual contributors.
  Licensed under the [Apache License 2.0](https://github.com/mozilla/pdf.js/blob/master/LICENSE).

---

# Copyright

Vimium C — Copyright © Gong Dahan (gdh1995). Upstream:
[github.com/gdh1995/vimium-c](https://github.com/gdh1995/vimium-c).

vimium-ai — additional modifications © lcycode (2026), hosted at
[github.com/lcycode/vimium-ai](https://github.com/lcycode/vimium-ai).

Both are released under the [Apache-2.0 license](LICENSE.txt), with MIT-licensed
code (before 2023-07-15) and CC-BY-SA-4.0 translations. See [NOTICE](NOTICE) for
the full attribution.
