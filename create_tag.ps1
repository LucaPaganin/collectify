$tagMessage = $args[0]
if (-not $tagMessage) {
    Write-Host "Usage: create_tag.ps1 <tag-message>"
    exit 1
}
$tagValue = "v" + (Get-Date -Format "yyyyMMddHHmmss")
Write-Host "Creating tag: $tagValue with message: $tagMessage"

git tag -a $tagValue -m $tagMessage
Write-Host "Tag $tagValue created successfully with message: $tagMessage"
git push origin $tagValue
Write-Host "Tag $tagValue pushed to origin successfully."