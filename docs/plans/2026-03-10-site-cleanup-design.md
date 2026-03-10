# Site Cleanup Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Remove all unused template content, collections, plugins, and frontend dependencies from the Jekyll site.

**Architecture:** Surgical deletion of sample content, unused collections, dead plugins, and the Plotly.js dependency. No structural changes to layouts or styling.

**Tech Stack:** Jekyll, SCSS, JavaScript (jQuery)

---

### Task 1: Delete sample blog posts

**Files:**
- Delete: `_posts/2012-08-14-blog-post-1.md`
- Delete: `_posts/2013-08-14-blog-post-2.md`
- Delete: `_posts/2014-08-14-blog-post-3.md`
- Delete: `_posts/2015-08-14-blog-post-4.md`
- Delete: `_posts/2199-01-01-future-post.md`

**Step 1: Delete all sample blog posts**

```bash
rm _posts/2012-08-14-blog-post-1.md _posts/2013-08-14-blog-post-2.md _posts/2014-08-14-blog-post-3.md _posts/2015-08-14-blog-post-4.md _posts/2199-01-01-future-post.md
```

**Step 2: Verify _posts directory is empty**

```bash
ls _posts/
```

Expected: empty or directory not found

---

### Task 2: Delete sample talks, teaching, portfolio content and talkmap files

**Files:**
- Delete: `_talks/2012-03-01-talk-1.md`
- Delete: `_talks/2013-03-01-tutorial-1.md`
- Delete: `_talks/2014-02-01-talk-2.md`
- Delete: `_talks/2014-03-01-talk-3.md`
- Delete: `_teaching/2014-spring-teaching-1.md`
- Delete: `_teaching/2015-spring-teaching-2.md`
- Delete: `_portfolio/portfolio-1.md`
- Delete: `_portfolio/portfolio-2.html`
- Delete: `talkmap.ipynb`
- Delete: `talkmap.py`
- Delete: `talkmap_out.ipynb`
- Delete: `talkmap/` (directory)

**Step 1: Delete all sample collection content and talkmap files**

```bash
rm _talks/2012-03-01-talk-1.md _talks/2013-03-01-tutorial-1.md _talks/2014-02-01-talk-2.md _talks/2014-03-01-talk-3.md
rm _teaching/2014-spring-teaching-1.md _teaching/2015-spring-teaching-2.md
rm _portfolio/portfolio-1.md _portfolio/portfolio-2.html
rm talkmap.ipynb talkmap.py talkmap_out.ipynb
rm -r talkmap/
```

**Step 2: Verify directories are empty**

```bash
ls _talks/ _teaching/ _portfolio/ 2>/dev/null
ls talkmap* 2>/dev/null
```

Expected: empty or not found

---

### Task 3: Delete unused pages

**Files:**
- Delete: `_pages/markdown.md`
- Delete: `_pages/non-menu-page.md`
- Delete: `_pages/talkmap.html`
- Delete: `_pages/collection-archive.html`
- Delete: `_pages/google-site.html`
- Delete: `_pages/portfolio.html`
- Delete: `_pages/talks.html`
- Delete: `_pages/teaching.html`

**Step 1: Delete template/unused pages**

```bash
rm _pages/markdown.md _pages/non-menu-page.md _pages/talkmap.html _pages/collection-archive.html _pages/google-site.html _pages/portfolio.html _pages/talks.html _pages/teaching.html
```

**Step 2: Verify remaining pages are the real ones**

```bash
ls _pages/
```

Expected: `about.md`, `cv.md`, `cv-json.md`, `404.md`, `terms.md`, `sitemap.md`, `publication.html`

---

### Task 4: Remove unused collections from _config.yml

**Files:**
- Modify: `_config.yml:216-228` (collections block)
- Modify: `_config.yml:232-286` (defaults block)

**Step 1: Remove talks, teaching, portfolio from collections**

Change the collections block (lines 216-228) from:

```yaml
collections:
  teaching:
    output: true
    permalink: /:collection/:path/
  publications:
    output: true
    permalink: /:collection/:path/
  portfolio:
    output: true
    permalink: /:collection/:path/
  talks:
    output: true
    permalink: /:collection/:path/
```

To:

```yaml
collections:
  publications:
    output: true
    permalink: /:collection/:path/
```

**Step 2: Remove defaults for deleted collections**

Remove the `# _posts`, `# _teaching`, `# _portfolio`, and `# _talks` defaults blocks (lines 233-286), keeping only `# _pages` and `# _publications`.

**Step 3: Remove unused plugins from plugins and whitelist**

Remove `jekyll-gist`, `jekyll-paginate`, and `jemoji` from both the `plugins:` list (lines 302-308) and the `whitelist:` list (lines 311-317).

---

### Task 5: Clean up Gemfile

**Files:**
- Modify: `Gemfile`

**Step 1: Remove jemoji from Gemfile**

Remove the line `gem 'jemoji'` from the `:jekyll_plugins` group. (`jekyll-gist` and `jekyll-paginate` are not in the Gemfile, only in _config.yml.)

---

### Task 6: Remove Plotly.js

**Files:**
- Modify: `_includes/footer/custom.html` (remove Plotly CDN line)
- Modify: `assets/js/_main.js` (remove Plotly import and initialization block, lines 50-82)
- Delete: `assets/js/theme.js` (entire file is Plotly theme data)

**Step 1: Remove Plotly CDN from footer**

In `_includes/footer/custom.html`, remove line 8:
```html
<script defer src='https://cdnjs.cloudflare.com/ajax/libs/plotly.js/3.0.1/plotly.min.js'></script>
```

**Step 2: Remove Plotly code from _main.js**

In `assets/js/_main.js`, remove the entire Plotly section (lines 50-82):
- The comment block "Plotly integration script..."
- The import statement
- The `plotlyElements` variable and the entire `if` block

**Step 3: Delete theme.js**

```bash
rm assets/js/theme.js
```

---

### Task 7: Remove talk.html layout

**Files:**
- Delete: `_layouts/talk.html`

**Step 1: Delete the talk layout**

```bash
rm _layouts/talk.html
```

This layout was only used by the talks collection defaults.

---

### Task 8: Clean up single.html layout

**Files:**
- Modify: `_layouts/single.html:37-38` (remove teaching conditional)

**Step 1: Remove teaching branch from single.html**

In `_layouts/single.html`, remove the teaching conditional (lines 37-38):
```liquid
{% if page.collection == 'teaching' %}
  <p> {{ page.type }}, <i>{{ page.venue }}</i>, {{ page.date | default: "1900-01-01" | date: "%Y" }} </p>
```

Change `{% elsif page.collection == 'publications' %}` to `{% if page.collection == 'publications' %}`.

---

### Task 9: Add .DS_Store to .gitignore

**Files:**
- Modify: `.gitignore`

**Step 1: Add .DS_Store pattern**

Add `.DS_Store` to `.gitignore`.

---

### Task 10: Build and verify

**Step 1: Run Jekyll build to verify no errors**

```bash
bundle exec jekyll build 2>&1
```

Expected: Build succeeds with no errors.

**Step 2: Verify the site still has publications**

```bash
ls _site/publications/ 2>/dev/null | head -5
```

Expected: Publication directories present.
