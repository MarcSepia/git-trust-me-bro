// The module 'vscode' contains the VS Code extensibility API
// Import the module and reference it with the alias vscode in your code below
import * as vscode from 'vscode';

export function activate(context: vscode.ExtensionContext) {
	const gitExtension = vscode.extensions.getExtension('vscode.git');
	if (!gitExtension) {
		vscode.window.showErrorMessage('Extensión de Git no disponible');
		return;
	}

	const git = gitExtension.exports.getAPI(1);

	// Registramos el comando: "gitNoVerify.commit"
	const disposable = vscode.commands.registerCommand('gitNoVerify.commit', async (resource?: any) => {
		let repo;

		if (resource) {
			// If executed from the SCM GUI, determine the repository from the resource
			if (resource.resourceUri) {
				// Handle case where resource has a resourceUri property
				repo = git.repositories.find(r => resource.resourceUri.fsPath.startsWith(r.rootUri.fsPath));
			} else if (resource.rootUri) {
				// Handle case where resource is directly a repository object
				repo = git.repositories.find(r => r.rootUri.fsPath === resource.rootUri.fsPath);
			}
		}

		if (!repo) {
			// If no repository was determined, fallback to showing the dropdown
			const repositories = git.repositories;

			if (repositories.length === 0) {
				vscode.window.showErrorMessage('No hay repositorios Git disponibles');
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
				placeHolder: 'Selecciona un repositorio para hacer commit'
			});

			if (!selectedRepo) {
				vscode.window.showInformationMessage('No se seleccionó ningún repositorio');
				return;
			}

			repo = selectedRepo.repo;
		}

		if (!repo) {
			vscode.window.showErrorMessage('No se pudo determinar el repositorio');
			return;
		}

		// Example: Show the selected repository's path and branch in the console
		console.log(`Repositorio seleccionado: ${repo.rootUri.path}, Rama: ${repo.state.HEAD?.name}`);

		// Obtenemos el mensaje que el usuario ha escrito en la caja de texto
		const message = repo.inputBox.value;
		if (!message || message.trim() === '') {
			vscode.window.showWarningMessage('No hay mensaje de commit');
			return;
		}

		try {
			// Llamamos a la API de commit, pero con un override de parámetros 
			// para que añada --no-verify
			await repo.commit(message, { noVerify: true });

			// Limpia la inputBox (opcional)
			repo.inputBox.value = '';
			vscode.window.showInformationMessage('Commit sin verificación realizado');
		} catch (error: any) {
			vscode.window.showErrorMessage(`Error al hacer commit: ${error.message}`);
		}

	});

	context.subscriptions.push(disposable);

	// Registramos el comando: "gitNoVerify.commit"
	const test = vscode.commands.registerCommand('gitNoVerify.test', async () => {

		vscode.window.showInformationMessage('Extension initialized');
	});

	context.subscriptions.push(test);
}


// This method is called when your extension is deactivated
export function deactivate() { }
