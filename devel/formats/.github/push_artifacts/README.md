# push_artifacts
A shell script for pushing build artifacts to a remote GitHub repository

## Installation

```bash
git submodule add https://github.com/kaitai-io/push_artifacts.git
```

## Git commit information

Make sure you set up the Git identity before running the script, otherwise
Git will ask you to "tell it who you are". This can be done using `git config`:

```bash
git config --global user.name 'Kaitai Bot'
git config --global user.email 'kaitai-bot@kaitai.io'
```

See [`git commit` > Commit information](https://git-scm.com/docs/git-commit#_commit_information)
for more info.

For _kaitai-io_ repositories, this can be set by running:

```bash
./git_config_kaitai_bot
```

## Pulling the latest version from dependent projects

If you want to fetch the latest `master` version from
a dependent repo that has `push_artifacts` as a submodule,
run this:

```bash
git pull --recurse-submodule
git submodule update --remote push_artifacts
```
