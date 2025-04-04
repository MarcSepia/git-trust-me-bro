// The module 'vscode' contains the VS Code extensibility API
// Import the module and reference it with the alias vscode in your code below
import * as vscode from 'vscode';
import { GitExtension, Repository } from './git'; // Import Repository type

export function activate(context: vscode.ExtensionContext) {
	const gitExtension = vscode.extensions.getExtension<GitExtension>('vscode.git');

	if (!gitExtension) {
		vscode.window.showErrorMessage('Git extension not available');
		return;
	}

	const git = gitExtension.exports.getAPI(1);

	// Register the command: "gitNoVerify.commit"
	const disposable = vscode.commands.registerCommand('gitNoVerify.commit', async (repository?: Repository) => {
		let repo: Repository | undefined;

		if (repository && repository.rootUri) {
			// Handle case where resource is directly a repository object
			repo = git.repositories.find(r => r.rootUri.fsPath === repository.rootUri.fsPath);
		}

		if (!repo) {
			// If no repository was determined, fallback to showing the dropdown
			const repositories = git.repositories;

			if (repositories.length === 0) {
				vscode.window.showErrorMessage('No Git repositories available');
				return;
			}

			const repoItems = repositories.map((repo) => {
				const repoName = repo.rootUri.path.split('/').pop() || 'Unknown';
				const branchName = repo.state.HEAD?.name || 'detached';
				return {
					label: repoName,
					description: branchName,
					repo
				};
			});

			const selectedRepo = await vscode.window.showQuickPick(repoItems, {
				placeHolder: 'Select a repository to commit'
			});

			if (!selectedRepo) {
				vscode.window.showInformationMessage('No repository selected');
				return;
			}

			repo = selectedRepo.repo;
		}

		if (!repo) {
			vscode.window.showErrorMessage('Could not determine the repository');
			return;
		}

		// Get the message the user has written in the input box
		const message = repo.inputBox.value;
		if (!message || message.trim() === '') {
			vscode.window.showWarningMessage('No commit message');
			return;
		}

		try {
			// Call the commit API with parameter override to add --no-verify
			await repo.commit(message, { noVerify: true });

			repo.inputBox.value = '';
			vscode.window.showInformationMessage('Commit without verification completed');
		} catch (error) {
			vscode.window.showErrorMessage(`Error while committing: ${error.message}`);
		}

	});

	context.subscriptions.push(disposable);

	// Register the test command
	const test = vscode.commands.registerCommand('gitNoVerify.test', async () => {

		vscode.window.showInformationMessage('Extension initialized');
	});

	context.subscriptions.push(test);
}


// This method is called when your extension is deactivated
export function deactivate() { }
