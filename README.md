# Project Context Manager

A VS Code extension to manage project-specific extension recommendations and context.

## Features

- Quickly select a project folder from your workspace.
- Reads `.vscode/extensions.json` in the selected project and shows recommended/unwanted extensions.
- (If using `.project-context.json` as in some variants, reads enable/disable extension lists per project.)
- Displays which extensions to enable or disable for the selected project.
- Option to open the Extensions panel directly from the recommendations dialog.

## Usage

1. Open a workspace folder in VS Code.
2. Run the command: **Project Context Manager: Select Project** (from the Command Palette).
3. Select a subfolder (project) from the list.
4. The extension will read `.vscode/extensions.json` in that folder and show which extensions to enable or disable.

## Example `.vscode/extensions.json`

```json
{
  "recommendations": [
    "ms-python.python",
    "esbenp.prettier-vscode"
  ],
  "unwantedRecommendations": [
    "some.unwanted-extension"
  ]
}
```

## Development

- Run `pnpm install` to install dependencies.
- Use `pnpm compile` to build the extension.
- Use `pnpm test` to run unit tests.

## License

MIT
