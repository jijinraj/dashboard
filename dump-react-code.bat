@echo off
setlocal EnableExtensions EnableDelayedExpansion

set "ROOT=%~dp0"
set "OUT=%ROOT%dump_code.txt"
set "PS1=%ROOT%dump-react-code.ps1"

REM --- write a clean ps1 (no echo/parenthesis pitfalls) ---
> "%PS1%" (
  rem (file created)
)

call :w "$ErrorActionPreference = 'Stop'"
call :w "$root = '%ROOT%'.TrimEnd('\')"
call :w "$out  = '%OUT%'"
call :w "$src  = Join-Path $root 'src'"

call :w "$ignoreDirs = @('\node_modules\','\dist\','\build\','\out\','\coverage\','\.git\','\.next\','\.turbo\','\.vite\','\storybook-static\')"
call :w "$extOk = @('.js','.jsx','.ts','.tsx','.mjs','.cjs','.json','.yml','.yaml','.md')"
call :w "$rootPatterns = @('package.json','package-lock.json','yarn.lock','pnpm-lock.yaml','vite.config.*','next.config.*','webpack.config.*','babel.config.*','postcss.config.*','tailwind.config.*','tsconfig*.json','jsconfig.json','eslint.config.*','.env','.env.*','.env.example','.gitignore','.npmrc','.nvmrc','.editorconfig','.eslintrc','.eslintrc.*','.eslintignore','.prettierrc','.prettierrc.*','.prettierignore','README.md','LICENSE')"

call :w "Set-Content -Path $out -Encoding UTF8 -Value @('===== React Project Code Dump =====',('Root: ' + $root),('Generated: ' + (Get-Date)),'')"

call :w "$rootFiles = Get-ChildItem -LiteralPath $root -File -Force | Where-Object {"
call :w "  $name = $_.Name"
call :w "  foreach($p in $rootPatterns){ if($name -like $p){ return $true } }"
call :w "  return $false"
call :w "} | Sort-Object FullName"

call :w "if(Test-Path -LiteralPath $src){"
call :w "  $srcFiles = Get-ChildItem -LiteralPath $src -Recurse -File -Force | Where-Object {"
call :w "    $full = $_.FullName"
call :w "    foreach($bad in $ignoreDirs){ if($full -like ('*' + $bad + '*')){ return $false } }"
call :w "    if($_.Name -like '*.min.*'){ return $false }"
call :w "    $ext = $_.Extension.ToLower()"
call :w "    if($ext -eq '.css'){ return $false }"
call :w "    return ($extOk -contains $ext)"
call :w "  } | Sort-Object FullName"
call :w "} else { $srcFiles = @() }"

call :w "$counts = ('Root configs: ' + $rootFiles.Count + ' | Src files: ' + $srcFiles.Count)"
call :w "Write-Host $counts"
call :w "Add-Content -Path $out -Encoding UTF8 -Value $counts"
call :w "Add-Content -Path $out -Encoding UTF8 -Value ''"

call :w "function DumpFile($f){"
call :w "  $rel = $f.FullName.Substring($root.Length).TrimStart('\') -replace '\\','/'"
call :w "  Add-Content -Path $out -Encoding UTF8 -Value ('='*70)"
call :w "  Add-Content -Path $out -Encoding UTF8 -Value $rel"
call :w "  Add-Content -Path $out -Encoding UTF8 -Value ('='*70)"
call :w "  $txt = Get-Content -LiteralPath $f.FullName -Raw"
call :w "  Add-Content -Path $out -Encoding UTF8 -Value $txt"
call :w "  Add-Content -Path $out -Encoding UTF8 -Value ''"
call :w "}"

call :w "Add-Content -Path $out -Encoding UTF8 -Value '### ROOT CONFIG FILES'"
call :w "Add-Content -Path $out -Encoding UTF8 -Value ''"
call :w "foreach($f in $rootFiles){ DumpFile $f }"

call :w "Add-Content -Path $out -Encoding UTF8 -Value '### SRC FILES'"
call :w "Add-Content -Path $out -Encoding UTF8 -Value ''"
call :w "foreach($f in $srcFiles){ DumpFile $f }"

call :w "Write-Host ('DONE -> ' + $out)"

REM --- run it ---
powershell -NoProfile -ExecutionPolicy Bypass -File "%PS1%"
if errorlevel 1 (
  echo.
  echo ❌ PowerShell failed. Open "%PS1%" and paste the error here.
  exit /b 1
)

echo.
echo ✅ Created: %OUT%
exit /b 0

:w
>> "%PS1%" <nul set /p ="%~1"
>> "%PS1%" echo(
exit /b 0
