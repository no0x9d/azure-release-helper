# azure release helper

> [!WARNING]  
> Alpha level software to explore azure api. Creation of releases is untested.

## Setup
To install via local git repo:

```bash
git clone <URL>
npx tsc
npm link
```

To install globally via npm
```bash
npm install -g no0x9d/azure-release-helper
```

### configuration
To make it easier to use when you configure the base values via environment variables

example: For the project in `https://dev.azure.com/My-Org/My-Project` you can configure the 
following environment variables

```bash
AZURE_PERSONAL_ACCESS_TOKEN=1234567890abcdefghijklmnop
AZURE_BASE_URL=https://dev.azure.com/My-Org
AZURE_PROJECT=My-Project
```



## Usage
To run:

### create releases

```bash
azrh create --definition 12 --base 3456
```

To create a new release a release definition must be provided.
Optionally a base release can be set and all versions will be 
copied over from this release instead of using the default 
version from the release definition.

In the first step all environments with a manual deploy can be selected.

In the second step the versions for the release artifacts can be customized.

### compare releases

```bash
azrh compare <release1> [release2]
```
release 1 and 2 are azure devops ids of the releases you want to compare. 
You can get a release id from the last part of the url.

If release 2 is omitted the release is compared against the default versions of the 
release definition.
