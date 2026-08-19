# Course, Chapter, and Test Data Structure

This folder organizes all course data by level so each course family can be
maintained separately.

## Folder Structure

Every level folder now follows the same shape:

```text
data/
  ca-foundation/
    courses.js
    chapters.js
    chapter-details.js
    tests.js
    README.md
  cma-foundation/
    courses.js
    chapters.js
    chapter-details.js
    tests.js
    README.md
  ca-inter/
    courses.js
    chapters.js
    chapter-details.js
    tests.js
    README.md
  cma-inter/
    courses.js
    chapters.js
    chapter-details.js
    tests.js
    README.md
  ca-final/
    courses.js
    chapters.js
    chapter-details.js
    tests.js
    README.md
  cma-final/
    courses.js
    chapters.js
    chapter-details.js
    tests.js
    README.md
```

## How It Works

- `courses-data.js` merges all level `courses.js` files into `window.courseCatalog`.
- `subjects-data.js` merges all level `chapters.js` files into `window.subjectChapters`.
- `chapter-info-data.js` merges all level `chapter-details.js` files into `window.chapterDetails`.
- `test-data.js` merges all level `tests.js` files into `window.testData`.

## Adding New Data

- Add or update subjects in the matching `courses.js`.
- Add chapter names in the matching `chapters.js`.
- Add chapter content in the matching `chapter-details.js`.
- Add MCQs in the matching `tests.js`.
