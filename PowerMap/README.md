# PowerMap Static Site – GitHub Actions Versioning & Deployment

This repository is a static HTML site with automated deployment to GitHub Pages and versioned builds managed via Git tags and GitHub Actions.

## Features

- Deploys the current site to the `gh-pages` branch automatically on every push to `main`
- Supports selective deployment using `deploy.json` to control which version is published (e.g., `v2.0.0` or `latest`)
- Automatically saves versioned builds under `versions/PowerMap_<version>/` when a tag is pushed. (No need to manually copy files into the `versions/` folder)
- Automatically deletes the corresponding `versions/` folder when a version tag is deleted

---


## Customizing Deployment with `deploy.json`

You can control what version of the site is deployed by editing the `deploy.json` file in the root of the repository.

#### Example

To deploy the latest development files from the root (default behavior):

```json
{
  "deploy": "latest"
}
```
To deploy a specific tagged version, for example v2.0.0, update the file to:
```json
{
  "deploy": "v2.0.0"
}
```
## GitHub Pages Deployment

The site is deployed automatically via GitHub Actions whenever:

- You push to the `main` branch
- You create or delete a version tag
- You update the `deploy.json` file to change which version is deployed

The deployment system reads the `deploy.json` file to determine which version of the site to publish.

- If `"deploy": "latest"` → the root files are deployed (latest dev state)
- If `"deploy": "vX.X.X"` → the corresponding folder under `versions/PowerMap_vX.X.X/` is deployed

If the specified version doesn't exist, the deployment gracefully falls back to `latest`.
The deployed site is served from the `gh-pages` branch.

### URL of Deployed Site
```bash
https://idataVisualizationLab.github.io/PowerMap/
```


## GitHub Actions Workflow

The deployment and versioning behavior is defined in:
```bash
.github/workflows/deploy.yml
```
This workflow:

- Creates version folders inside `versions/` on tag push
- Deletes corresponding version folders on tag deletion
- Selectively deploys either a specific version or the latest based on `deploy.json`
- Pushes the selected version to the `gh-pages` branch for public access


## Add a New Version (Tag)
To create a new version (for example, `v2.0.0`), use the following commands:
```bash
# Ensure your changes are committed and pushed to main first
git tag v2.0.0
git push origin v2.0.0
```
> **🚨 Important:** Tags must include the `v` prefix (e.g., `v1.0.0`, `v2.0.0`) to work correctly with the automated workflow.

#### This will:

- Copy the current project files into versions/PowerMap_v2.0.0/
- Commit that folder into the main branch automatically via GitHub Actions
- Redeploy the site to GitHub Pages (excluding the versions/ folder)
- You do not need to manually copy files into the versions/ folder — the GitHub workflow handles it.

## Delete a Version
To delete a previously created version:
```bash
git tag -d v2.0.0
git push origin :refs/tags/v2.0.0
```
#### This will:
- Trigger a GitHub Action that automatically deletes the folder versions/PowerMap_v2.0.0 from the main branch




