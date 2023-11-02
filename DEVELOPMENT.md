# Development Instructions

## Installations

### Node.js and NPM

Like a browser, Node.js runs JavaScript; akin to `python <file-name>`, now we have `node <file-name>`, though for this project we'll never the `node` command. NPM manages packages/dependencies. Download from https://nodejs.org/en. If already downloaded, ensure Node.js is about version `>= 18` and NPM `>= 9`.

```
node --version
npm --version
```

### Git

Version `>= 2.3`

```
git --version
```

Clone repository in a working directory (only need to do this once for every machine).

```
git clone https://github.com/staylor7/rare-diseases.git
# OR
git clone git@github.com:staylor7/rare-diseases.git
```

Can use commands to control repository, but https://desktop.github.com/ makes this easy with a GUI.

```
git pull
git switch <branch-name>

git add <files, directory, etc.>
git commit -m "<message>"
git push
```

### Project Dependencies

```
npm i
```

Run development server. See https://vitejs.dev/

```
npm run dev
```

## Development

Never touch `node_modules` (dependencies live here), `package-lock.json` (a more detailed listing of dependency versions than in `package.json`), `dist` (build folder from running `npm run build`). Can always undo changes using Git and reinstall dependencies.

## Documenation TO-DOs

- More detail
- Prettier
- ESLint
- VSCode for `staylor`?
- Troubleshooting
