$assetDestination = Join-Path (Get-Location) 'assets/imagens/questoes/3-ano/desafio-12/missao-1/ilustracoes-geradas'
New-Item -ItemType Directory -Path $assetDestination -Force | Out-Null
Copy-Item -LiteralPath 'C:\Users\ednei\.codex\generated_images\01a12271-622c-7272-b884-81ac31ca0edb\exec-76753e8c-a83d-452d-a9cf-636dbb3e9448.png' -Destination (Join-Path $assetDestination 'apple.png')
Copy-Item -LiteralPath 'C:\Users\ednei\.codex\generated_images\01a12271-622c-7272-b884-81ac31ca0edb\exec-5ab5cae4-7dba-429a-b207-5b9265534b38.png' -Destination (Join-Path $assetDestination 'basket.png')
Copy-Item -LiteralPath 'C:\Users\ednei\.codex\generated_images\01a12271-622c-7272-b884-81ac31ca0edb\exec-d8667e07-2e02-4346-b307-34bd16cc2d63.png' -Destination (Join-Path $assetDestination 'candy.png')
Copy-Item -LiteralPath 'C:\Users\ednei\.codex\generated_images\01a12271-622c-7272-b884-81ac31ca0edb\exec-49873fcb-46ee-4b36-bf33-04c7651016e4.png' -Destination (Join-Path $assetDestination 'chocolate.png')
Copy-Item -LiteralPath 'C:\Users\ednei\.codex\generated_images\01a12271-622c-7272-b884-81ac31ca0edb\exec-c30e9d66-243f-4449-bf3a-e285578d14ea.png' -Destination (Join-Path $assetDestination 'flower.png')
Copy-Item -LiteralPath 'C:\Users\ednei\.codex\generated_images\01a12271-622c-7272-b884-81ac31ca0edb\exec-c9f46d59-ceee-4070-be2d-5996074666aa.png' -Destination (Join-Path $assetDestination 'box.png')
Get-ChildItem -LiteralPath $assetDestination | Select-Object Name,Length
