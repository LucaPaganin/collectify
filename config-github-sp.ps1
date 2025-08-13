$resourceGroupName = "collectify"
$subscriptionId = "a9c90e17-e1f9-4d01-885e-fdbc3057dfe8"

az ad sp create-for-rbac --name "collectify-github-actions" --role contributor `
--scopes "/subscriptions/${subscriptionId}/resourceGroups/${resourceGroupName}" `
--sdk-auth