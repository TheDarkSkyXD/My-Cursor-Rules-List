# get-rules

An npm utility to quickly download and install the latest `.mdc` rule files for AI-assisted coding tools (like Cursor) from John Lindquist's [get-rules](https://github.com/johnlindquist/get-rules) repository.

## Installation

Install the tool globally using npm:

```bash
npm install -g get-rules
```
Or, if you prefer to use it on a per-project basis without global installation, you can use `npx`:
```bash
npx get-rules
```

## Usage

Navigate to the root directory of your project where you want to install/update the rules, and then run:

```bash
get-rules
```

This will:
1. Connect to the GitHub API to fetch the list of files in the [johnlindquist/get-rules](https://github.com/johnlindquist/get-rules) repository.
2. Identify all `.mdc` (Markdown Custom) rule files in the root of that repository.
3. Create a `.cursor/rules` directory in your current working directory (if it doesn't exist).
4. Download each `.mdc` file into `.cursor/rules`, skipping any that already exist locally. This ensures you always get the latest versions of new rules without overwriting local modifications to existing ones unless you manually delete them first.

## How it Works

This tool is a self-contained Node.js script. It directly interacts with the GitHub API to list repository contents and then downloads the necessary `.mdc` files. It does not rely on external shell scripts like `curl`, `bash`, or `powershell`.

## Contributing

Issues and pull requests are welcome! Please feel free to contribute to the [get-rules repository](https://github.com/johnlindquist/get-rules).

For the rules themselves, please contribute to the [get-rules repository](https://github.com/johnlindquist/get-rules).

## License

MIT License - Copyright (c) John Lindquist 