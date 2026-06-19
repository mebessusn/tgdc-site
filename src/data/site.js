/* ============================================================
   Site content + helpers.

   The editable COPY now lives in site.json so the CMS (/admin) can
   edit it. This file just re-exports it and adds the code-only bits
   (text helpers + the ASCII art), which aren't meant to be edited
   in the CMS.
   ============================================================ */

import data from './site.json';

export const SITE = data;

/* ---- text helpers ---- */
export const fmt = (s = '') => String(s).replace(/\*([^*]+)\*/g, '<em>$1</em>');
export const mailto = (email, subject) =>
  `mailto:${email}` + (subject ? `?subject=${encodeURIComponent(subject)}` : '');

/* ---- ASCII game "screenshots" (code-only) ---- */
export const ASCII = {
  fantasy: String.raw`
                  /\
                 /  \
                 |  |
                 |  |
                 |  |
             ____|  |____
            '----.  .----'
                 |  |
                 |  |
                 |__|
                .(    ).
   ..:////::..  '------'  ..::\\\\:..
     a knight, sworn to the last light`,
  horror: String.raw`
      /\        /\        /\
     /  \      /  \      /  \
    /    \    /    \    /    \
   /______\  /______\  /______\
      ||         ||         ||
              .        .
             (  o    o  )
              .    ^   .
                '----'
   something is awake in the woods`,
};

export const SCENE_META = {
  fantasy: { theme: 'ember', file: 'beyond_the_veil.txt' },
  horror:  { theme: 'cold',  file: 'it_only_gets_darker.txt' },
};
