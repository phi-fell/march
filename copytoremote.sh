#!/bin/bash
scp -r /mnt/c/repo/march/src/* phi@gotg.phi.ac:gotg_js/src/
scp -r /mnt/c/repo/march/site/* phi@gotg.phi.ac:gotg_js/site/
scp -r /mnt/c/repo/march/res/* phi@gotg.phi.ac:gotg_js/res/
scp /mnt/c/repo/march/package.json phi@gotg.phi.ac:gotg_js/package.json
scp /mnt/c/repo/march/package-lock.json phi@gotg.phi.ac:gotg_js/package-lock.json
scp /mnt/c/repo/march/tsconfig.json phi@gotg.phi.ac:gotg_js/tsconfig.json