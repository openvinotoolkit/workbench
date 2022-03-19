#!/bin/bash

set -e

echo "[*] Cleaning up /front"
rm -rf /front/*

echo "[*] Copying the built frontend to /front"
cp -r "${PROJECT_ROOT}"/dist/* /front

echo "[+] Done, exiting"
