# Responsive architecture

AWS infrastructure summary: https://docs.google.com/drawings/d/1DL2FtF_p4vFMJJ6TunzNYGOQo4w7ZDHBuMZo-E-Ya88

Generated from: https://github.com/davidcarboni/template

## Infrastructure build inputs

Create the following files under `.infrastructure/secrets/`

 ### `aws.sh`

export AWS_PROFILE=alwayson

### `github.sh`

export PERSONAL_ACCESS_TOKEN=ghp_xxxx (Personal Accees Token with `repo` scope)
export OWNER=GreenerSoftware
export REPO=fullyresponsive
