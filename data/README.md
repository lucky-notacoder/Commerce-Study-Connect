# Course and Chapter Data Structure

This folder organizes all course and chapter data by level for easy maintenance.

## Folder Structure

```
data/
├── ca-foundation/
│   ├── courses.js           # CA Foundation subjects and details
│   ├── chapters.js          # CA Foundation chapter lists
│   ├── chapter-details.js   # CA Foundation chapter content
│   └── README.md
├── cma-foundation/
│   ├── courses.js           # CMA Foundation subjects and details
│   ├── chapters.js          # CMA Foundation chapter lists
│   ├── chapter-details.js   # CMA Foundation chapter content
│   └── README.md
├── ca-inter/
│   ├── courses.js           # CA Intermediate subjects and details
│   └── README.md
├── cma-inter/
│   ├── courses.js           # CMA Intermediate subjects and details
│   └── README.md
├── ca-final/
│   ├── courses.js           # CA Final subjects and details
│   └── README.md
├── cma-final/
│   ├── courses.js           # CMA Final subjects and details
│   └── README.md
└── README.md (this file)
```

## How It Works

1. **Root Level Aggregators**: 
   - `courses-data.js` - Loads all course.js files and merges them into `window.courseCatalog`
   - `subjects-data.js` - Loads all chapters.js files and merges them into `window.subjectChapters`
   - `chapter-info-data.js` - Loads all chapter-details.js files and merges them into `window.chapterDetails`

2. **HTML Pages**: All HTML pages load data files in this order:
   - Individual level course files (ca-foundation/courses.js, etc.)
   - Root courses aggregator (courses-data.js)
   - Individual level chapter list files (ca-foundation/chapters.js, etc.)
   - Root chapters aggregator (subjects-data.js)
   - Individual level chapter details files (ca-foundation/chapter-details.js, etc.)
   - Root chapter details aggregator (chapter-info-data.js)

3. **Adding New Data**:
   - Edit the `courses.js` files in each level folder to add/update subjects
   - Edit the `chapters.js` files in each level folder to add/update chapter lists
   - Edit the `chapter-details.js` files in each level folder to add/update chapter content
   - The root aggregators automatically pick up changes

## Notes

- Foundation levels include courses.js, chapters.js, and chapter-details.js
- Intermediate and Final levels only have courses.js (no chapter data yet)
- Add chapter data to intermediate/final levels by creating chapters.js and chapter-details.js files as needed
