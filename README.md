# cdk-for-terraform

  Your cdktf typescript project is ready!

  cat help              Print this message

  Compile:
  ```console
    npm run compile     Compile typescript code to javascript (or "npm run watch")
    npm run watch       Watch for changes and compile typescript in the background
    npm run build       cdktf get and compile typescript
  ```

  Synthesize:
    cdktf synth         Synthesize Terraform resources from stacks to cdktf.out/ (ready for 'terraform apply')

  Diff:
    cdktf diff          Perform a diff (terraform plan) for the given stack

  Deploy:
    cdktf deploy        Deploy the given stack

  Destroy:
    cdktf destroy       Destroy the stack


 Upgrades:
 ```console
   npm run get           Import/update Terraform providers and modules (you should check-in this directory)
   npm run upgrade       Upgrade cdktf modules to latest version
   npm run upgrade:next  Upgrade cdktf modules to latest "@next" version (last commit)
 ```

 Use Prebuilt Providers:

  You can add one or multiple of the prebuilt providers listed below:

```console
  npm install -a @cdktf/provider-aws
  npm install -a @cdktf/provider-google
  npm install -a @cdktf/provider-azurerm
  npm install -a @cdktf/provider-docker
  npm install -a @cdktf/provider-github
  npm install -a @cdktf/provider-null
```
  Check for an up to date list here https://github.com/terraform-cdk-providers
