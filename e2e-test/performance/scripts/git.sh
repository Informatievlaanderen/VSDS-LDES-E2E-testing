

function git-clone() {
    CURRENT_DIR=`pwd`

    REPO=$1
    NAME=${2-""}
    WORK_DIR=${3-""}

    if [ ! -z "$WORK_DIR" ]; then
        cd $WORK_DIR
    fi

    git clone $REPO $NAME

    cd $CURRENT_DIR
}
