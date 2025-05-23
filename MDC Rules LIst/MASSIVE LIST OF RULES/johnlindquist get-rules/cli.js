#!/usr/bin/env node

const https = require("https");
const fs = require("fs");
const path = require("path");
const os = require("os");

const DEFAULT_ORG = "johnlindquist";
const DEFAULT_REPO = "get-rules";
const RULES_PATH = ".cursor/rules";

// Parse optional org/repo argument
const userArg = process.argv[2];
let org = DEFAULT_ORG;
let repo = DEFAULT_REPO;
if (userArg && /^[^/]+\/[^/]+$/.test(userArg)) {
	[org, repo] = userArg.split("/");
	console.log(`Using custom repo: ${org}/${repo}`);
} else if (userArg) {
	console.warn(
		`Ignoring invalid argument '${userArg}'. Expected format: org/repo`,
	);
}

const GITHUB_API_URL = `https://api.github.com/repos/${org}/${repo}/contents/${RULES_PATH}`;
const DEST_DIR_NAME = RULES_PATH; // Relative to current working directory

// Helper function to make an HTTPS GET request and parse JSON response
function httpsGetJson(url) {
	return new Promise((resolve, reject) => {
		const options = {
			headers: {
				"User-Agent":
					"get-rules-npm-script/1.0.0 (github.com/johnlindquist/get-rules)",
			},
		};
		https
			.get(url, options, (res) => {
				if (res.statusCode < 200 || res.statusCode >= 300) {
					return reject(
						new Error(
							`GitHub API request failed: ${res.statusCode} for ${url}`,
						),
					);
				}
				let rawData = "";
				res.on("data", (chunk) => (rawData += chunk));
				res.on("end", () => {
					try {
						resolve(JSON.parse(rawData));
					} catch (e) {
						reject(new Error(`Failed to parse JSON from ${url}: ${e.message}`));
					}
				});
			})
			.on("error", (err) => {
				reject(new Error(`HTTPS request error for ${url}: ${err.message}`));
			});
	});
}

// Helper function to download a file
function downloadFile(fileUrl, destinationPath) {
	return new Promise((resolve, reject) => {
		const fileStream = fs.createWriteStream(destinationPath);
		const options = {
			headers: {
				"User-Agent":
					"get-rules-npm-script/1.0.0 (github.com/johnlindquist/get-rules)",
			},
		};
		https
			.get(fileUrl, options, (response) => {
				if (response.statusCode < 200 || response.statusCode >= 300) {
					fs.unlink(destinationPath, () => {}); // Clean up empty file on error
					return reject(
						new Error(
							`Failed to download ${fileUrl}. Status: ${response.statusCode}`,
						),
					);
				}
				response.pipe(fileStream);
				fileStream.on("finish", () => {
					fileStream.close(resolve);
				});
			})
			.on("error", (err) => {
				fs.unlink(destinationPath, () => {}); // Clean up if error occurs
				reject(new Error(`Error downloading ${fileUrl}: ${err.message}`));
			});
	});
}

async function main() {
	const absoluteDestDir = path.resolve(process.cwd(), DEST_DIR_NAME);
	console.log(`Attempting to install rules to ${absoluteDestDir}`);

	try {
		// 1. Ensure destination directory exists
		if (!fs.existsSync(absoluteDestDir)) {
			fs.mkdirSync(absoluteDestDir, { recursive: true });
			console.log(`Created directory: ${absoluteDestDir}`);
		} else {
			console.log(`Directory ${absoluteDestDir} already exists.`);
		}

		// 2. Fetch file list from GitHub API
		console.log(
			"Fetching rule file list from GitHub (johnlindquist/get-rules)...",
		);
		const repoContents = await httpsGetJson(GITHUB_API_URL);

		if (!Array.isArray(repoContents)) {
			console.error(
				"Error: GitHub API did not return an array of files. Response:",
				repoContents,
			);
			process.exit(1);
		}

		const mdcFiles = repoContents.filter(
			(item) => item.type === "file" && item.name && item.name.endsWith(".mdc"),
		);

		if (mdcFiles.length === 0) {
			console.log("No .mdc files found in the repository's root.");
			process.exit(0);
		}

		console.log(`Found ${mdcFiles.length} .mdc rule file(s).`);

		// 3. Download each .mdc file
		let updatedCount = 0;

		for (const fileItem of mdcFiles) {
			const fileName = fileItem.name;
			const destFilePath = path.join(absoluteDestDir, fileName);
			const remoteFileUrl = fileItem.download_url;

			if (!remoteFileUrl) {
				console.warn(
					`  - Skipping ${fileName}: no download_url found (this is unexpected for a file).`,
				);
				continue;
			}

			if (fs.existsSync(destFilePath)) {
				// Move the existing file to a temp directory
				const tempDir = os.tmpdir();
				const tempFilePath = path.join(tempDir, `${fileName}.${Date.now()}`);
				fs.renameSync(destFilePath, tempFilePath);
				console.log(`  - ${fileName} existed, moved to temp: ${tempFilePath}`);
			}
			console.log(`  - Downloading ${fileName}...`);
			try {
				await downloadFile(remoteFileUrl, destFilePath);
				updatedCount++;
			} catch (downloadError) {
				console.error(
					`    Failed to download ${fileName}: ${downloadError.message}`,
				);
			}
		}

		console.log("\n--- Summary ---");
		console.log(`Updated:    ${updatedCount} file(s)`);
		console.log(`Total .mdc files processed: ${mdcFiles.length}`);
		console.log(`All rules should now be in ${absoluteDestDir}`);
		console.log("\n✅ Rules update process finished.");
	} catch (error) {
		console.error("\n❌ An error occurred during the rules download process:");
		console.error(error.message);
		process.exit(1);
	}
}

main();
