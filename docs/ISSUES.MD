# Known Issues
[[Bug](https://github.com/npm/cli/issues/3136)] Arguments are not correctly passed from CLI to npm script (npm 7, Windows, Powershell)
- Workaround - If using < Node 20, add an additional `--` when passing arguments  
-- Example run  
`npm run caweb start -- -- --multisite`  
instead of  
`npm run caweb start -- --multisite`