# GotG [![Travis Build Status](https://img.shields.io/travis/phi-fell/march?label=Travis&style=flat)](https://travis-ci.org/phi-fell/march) [![GitHub Build Status](https://img.shields.io/github/workflow/status/phi-fell/march/run%20CI?label=CI)](https://github.com/phi-fell/march/actions?query=workflow%3A%22run+CI%22)

[![ko-fi](https://www.ko-fi.com/img/githubbutton_sm.svg)](https://ko-fi.com/P5P31LH97)

-----
Repo for [GotG](https://gotg.io)
-----
For developement:
1. install node and npm
2. clone the repo
4. run setup_dev.sh (e.g. on ubuntu: "sh setup_dev.sh")
5. to build and run: "npm run dev" (you will likely need root to listen on port 80, so use sudo)
-----
For production (https):
1. install node and npm
2. clone the repo
3. ensure the program will be able to bind to ports (e.g. by "sudo setcap CAP_NET_BIND_SERVICE=+eip $(which node)" or using authbind)
4. run setup_prod.sh
5. enter an admin token when prompted
6. enter an SSL directory path (e.g. '/etc/letsencrypt/live/gotg.io/')
7. enter a key filename (defaults to 'privkey.pem')
8. enter a cert filename (defaults to 'cert.pem')
-----
To run on Windows:
1. install node and npm (i.e. use the node windows installer)
2. run windows_setup.bat
3. run run_dev.bat for an http dev server (prod server instructions and .bat file may be added later)
4. visit http://localhost
