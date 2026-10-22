/* ===== POST PAGE =====
   URL format:  post.html?p=my-post-slug   ->  loads  posts/my-post-slug.md

   Markdown file format:
   ---
   title: My post title
   category: Computational Chemistry
   tags: [docking, drug-repurposing, bcr-abl]
   date: 2026-10-22
   description: One sentence summary (used for link previews)
   ---
   Your markdown here...
*/

(function () {
    'use strict';

    const POSTS_DIR = './posts';

    // ---------- mobile menu (same behavior as index) ----------
    const menuBtn = document.querySelector('.menu-toggle');
    const nav = document.getElementById('site-nav');
    if (menuBtn && nav) {
        menuBtn.addEventListener('click', () => {
            const open = nav.classList.toggle('open');
            menuBtn.classList.toggle('active', open);
            menuBtn.setAttribute('aria-expanded', String(open));
        });
    }

    // ---------- helpers ----------
    const $ = (id) => document.getElementById(id);

    function showError() {
        $('post').hidden = true;
        $('postError').hidden = false;
        document.title = 'Post not found - Amir Hossein Gholizadeh';
    }

    // Minimal front matter parser: "key: value" lines, tags as [a, b] or a, b

function parseFrontMatter(text) {
    const match = text.match(/^---\s*\r?\n([\s\S]*?)\r?\n---\s*(?:\r?\n|$)/);
    if (!match) {
        return { meta: {}, body: text };
    }

    const meta = {};

    match[1].split(/\r?\n/).forEach((line) => {
        const i = line.indexOf(':');
        if (i === -1) return;

        const key = line.slice(0, i).trim().toLowerCase();
        let val = line.slice(i + 1).trim();

        // Remove surrounding quotes.
        val = val.replace(/^(['"])(.*)\1$/, '$2');

        if (key === 'tags') {
            val = val
                .replace(/^\[|\]$/g, '')
                .split(',')
                .map(t => t.trim().replace(/^#/, '').replace(/^(['"])(.*)\1$/, '$2'))
                .filter(Boolean);
        }

        meta[key] = val;
    });

    return {
        meta,
        body: text.slice(match[0].length)
    };
}


    function formatDate(str) {
        const d = new Date(str + 'T00:00:00');
        if (isNaN(d)) return str || '';
        return d.toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });
    }

    function readingTime(text) {
        const words = text.trim().split(/\s+/).length;
        return Math.max(1, Math.round(words / 220)) + ' min read';
    }

    // ---------- load post ----------
    const slug = new URLSearchParams(location.search).get('p');

    if (!slug || !/^[a-z0-9_-]+$/i.test(slug)) {
        showError();
        return;
    }

    fetch(`${POSTS_DIR}/${slug}.md`)
        .then((res) => {
            if (!res.ok) throw new Error('not found');
            return res.text();
        })
        .then((raw) => render(parseFrontMatter(raw)))
        .catch(showError);

    function render({ meta, body }) {
        const title = meta.title || slug;
        const url = location.href;

        // title + meta
        document.title = `${title} - Amir Hossein Gholizadeh`;
        const desc = document.querySelector('meta[name="description"]');
        if (desc && meta.description) desc.setAttribute('content', meta.description);

        $('postTitle').textContent = title;
        $('postDate').textContent = formatDate(meta.date);
        if (meta.date) $('postDate').setAttribute('datetime', meta.date);
        $('postReadTime').textContent = readingTime(body);

        // category -> links to the posts index filtered by category
        const cat = $('postCategory');
        if (meta.category) {
            cat.textContent = meta.category;
            cat.href = `./posts/?category=${encodeURIComponent(meta.category)}`;
        } else {
            cat.hidden = true;
        }

        // #tags
        const tagBox = $('postTags');
        (meta.tags || []).forEach((t) => {
            const el = document.createElement('span');
            el.className = 'post-tag';
            el.textContent = '#' + t;
            tagBox.appendChild(el);
        });

        // markdown -> sanitized HTML
        const html = marked.parse(body, { gfm: true, breaks: false });
        $('postBody').innerHTML = DOMPurify.sanitize(html);

        // open external links in a new tab
        $('postBody').querySelectorAll('a[href^="http"]').forEach((a) => {
            a.target = '_blank';
            a.rel = 'noopener noreferrer';
        });

        $('post').hidden = false;
        setupShare(title, url);
        setupLove(slug);
    }

    // ---------- share ----------
    function setupShare(title, url) {
        const u = encodeURIComponent(url);
        const t = encodeURIComponent(title);

        $('shareX').href = `https://twitter.com/intent/tweet?text=${t}&url=${u}`;
        $('shareTelegram').href = `https://t.me/share/url?url=${u}&text=${t}`;
        $('shareLinkedIn').href = `https://www.linkedin.com/sharing/share-offsite/?url=${u}`;
        $('shareWhatsApp').href = `https://wa.me/?text=${t}%20${u}`;

        const toast = $('copyToast');
        $('shareCopy').addEventListener('click', async () => {
            try {
                await navigator.clipboard.writeText(url);
                toast.textContent = 'link copied';
            } catch (e) {
                toast.textContent = 'copy failed';
            }
            toast.classList.add('show');
            setTimeout(() => toast.classList.remove('show'), 1800);
        });
    }

    // ---------- "Loved it" (saved per browser) ----------
    function setupLove(slug) {
        const btn = $('loveBtn');
        const key = 'loved:' + slug;

        const read = () => {
            try { return localStorage.getItem(key) === '1'; } catch (e) { return false; }
        };
        const write = (on) => {
            try { on ? localStorage.setItem(key, '1') : localStorage.removeItem(key); } catch (e) { /* storage blocked */ }
        };

        btn.setAttribute('aria-pressed', String(read()));

        btn.addEventListener('click', () => {
            const on = btn.getAttribute('aria-pressed') !== 'true';
            btn.setAttribute('aria-pressed', String(on));
            write(on);
            btn.classList.remove('pop');
            void btn.offsetWidth; // restart animation
            if (on) btn.classList.add('pop');
        });
    }
})();
