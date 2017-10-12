# Mining Rig Runner

You should use LFS for this repository: https://help.github.com/articles/installing-git-large-file-storage/

## How to deploy rig

0. Enable ssh: `sudo apt-get install openssh-server`
0. Add "%min ALL=(ALL) NOPASSWD: ALL" `sudo visudo`
0. Then Run Ansible configuration script for all rigs : `cd ansible && ansible-playbook rig.yml`