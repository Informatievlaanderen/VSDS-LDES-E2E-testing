#!/usr/bin/env bash

function maven_build() {
    CURRENT_DIR=`pwd`
    POM_PATH=$1

    cd $POM_PATH
    mvn install

    cd $CURRENT_DIR
}