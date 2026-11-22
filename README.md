# Jarvis To-Do

A fast, offline-first to-do list with a modern glassmorphism UI. It is a fully static single-page app with no backend: every task, the task order, the theme and the filters are saved in your browser's `localStorage`.

Built with **Vite**, **React 19**, **TypeScript**, **Tailwind CSS v4**, **Motion** (animations) and **dnd-kit** (drag and drop).

## Features

- **Tasks**: add, edit (inline), delete, and complete or reopen tasks. Deleting a task or clearing done tasks shows an **undo** toast.
- **Filters**: All / Active / Done (with live counts), filter by tag, and instant search across titles and tags.
- **Priorities and tags**: High, Medium or Low priority shown as colour-coded chips and an accent bar. Tags are clickable to filter.
- **Quick-add syntax**: type `Ship v2 #work !high` and the tag and priority are picked out of the title automatically (`!high`, `!med`, `!low`, or `!h`, `!m`, `!l`).
- **Due dates**: friendly labels (Today, Tomorrow, weekday, date) with overdue highlighting. The sidebar shows how many tasks are due today and how many are overdue.
- **Drag to reorder**: with a mouse, touch, or the keyboard (focus the grip handle, press Space, use the arrow keys, then Space to drop). You can also press <kbd>Alt</kbd>+<kbd>↑</kbd>/<kbd>↓</kbd> on a focused task.
- **Keyboard shortcuts**: a full cheatsheet opens with <kbd>?</kbd> (see below).
- **Themes**: dark and light themes with a saved preference and no flash of the wrong theme on load. The switch cross-fades using the View Transitions API where the browser supports it.
- **Design**: layered frosted-glass surfaces, an aurora gradient backdrop with film grain, Inter and Space Grotesk type, a progress ring, and animated empty states.
- **Responsive**: a two-column desktop layout (overview sidebar plus list) and a compact single-column layout on mobile.
- **Accessible**: semantic landmarks, labelled controls, visible focus rings, a screen-reader live region for actions, a native `<dialog>` for the cheatsheet, and announced drag and drop. It respects `prefers-reduced-motion`.
- **Robust persistence**: stored data is validated on load (malformed entries are dropped), and changes sync across open tabs.

### Keyboard shortcuts

| Keys | Action |
| --- | --- |
| <kbd>N</kbd> | Focus the new-task input |
| <kbd>/</kbd> | Search |
| <kbd>1</kbd> <kbd>2</kbd> <kbd>3</kbd> | All / Active / Done |
| <kbd>J</kbd> / <kbd>↓</kbd>, <kbd>K</kbd> / <kbd>↑</kbd> | Next / previous task |
| <kbd>X</kbd> or <kbd>Space</kbd> | Complete or reopen the focused task |
| <kbd>E</kbd> or <kbd>Enter</kbd> | Edit the focused task |
| <kbd>Delete</kbd> / <kbd>Backspace</kbd> | Delete the focused task |
| <kbd>Alt</kbd> + <kbd>↑</kbd>/<kbd>↓</kbd> | Move the focused task |
| <kbd>U</kbd> or <kbd>Ctrl</kbd>/<kbd>⌘</kbd> + <kbd>Z</kbd> | Undo a delete |
| <kbd>T</kbd> | Toggle theme |
| <kbd>?</kbd> | Show all shortcuts |
| <kbd>Esc</kbd> | Cancel an edit, clear a field, or leave a field |

## Getting started

Requires Node.js 20.19+ (or 22.12+).

```bash
npm install
npm run dev       # start the dev server at http://localhost:5173
```

## Scripts

| Script | Description |
| --- | --- |
| `npm run dev` | Start the Vite dev server with hot module replacement |
| `npm run build` | Type-check (`tsc -b`) and create a production build in `dist/` |
| `npm run preview` | Serve the production build locally |
| `npm run typecheck` | Type-check only |

## Deployment

The output in `dist/` is plain static files. On Vercel, import the project and the Vite preset is detected automatically (build command `npm run build`, output directory `dist`). No environment variables or server are needed. Any other static host (Netlify, Cloudflare Pages, GitHub Pages, S3) works the same way.

## Project structure

```
src/
├── App.tsx                 # App shell: state wiring, shortcuts, layout
├── main.tsx                # Entry point (fonts, styles, React root)
├── index.css               # Tailwind v4 theme, glass surfaces, animations
├── types.ts                # Domain types (Task, Priority, Filters, …)
├── components/
│   ├── Header.tsx, Sidebar.tsx, Backdrop.tsx, ThemeToggle.tsx
│   ├── TaskComposer.tsx    # New-task form with quick-add parsing
│   ├── FilterBar.tsx       # Status segmented control, search, tag chips
│   ├── TaskList.tsx        # dnd-kit sortable list + AnimatePresence
│   ├── TaskItem.tsx        # Task row (checkbox, meta chips, actions)
│   ├── TaskEditor.tsx      # Inline edit form
│   ├── EmptyState.tsx, UndoToast.tsx, ShortcutsDialog.tsx
│   └── ui/                 # Kbd, PriorityPicker, ProgressRing
├── hooks/
│   ├── useTasks.ts         # Task CRUD, reorder, restore
│   ├── usePersistentState.ts  # Validated localStorage state + cross-tab sync
│   ├── useTheme.ts, useShortcuts.ts, useAnnouncer.ts
└── lib/
    ├── tasks.ts            # Parsing, validation, filtering, stats
    ├── date.ts, storage.ts, dom.ts, shortcuts.ts, id.ts, cn.ts
```

## Data and privacy

All data lives under the `jarvis-todo:v1:*` keys in `localStorage` and never leaves your browser. Clearing site data resets the app.
