const Main = imports.ui.main;
const Mainloop = imports.mainloop;
const St = imports.gi.St;

// const

const panelHeight = 28;

const interval = 200;

const containerDefaults = {
    affectsInputRegion: false,
    affectsStruts: false,
    trackFullscreen: false,
};

const containerParams = {
    style_class: 'bg-color',
    reactive: false,
    can_focus: false,
    track_hover: false
};

// vars

let onWindowGrabBegin = null;
let onWindowGrabEnd = null;

let activeWindow = null;
let activeDisplay = null;

let container;
let zones = [
    [0, 576],
    [576 + 1, 576 + 1 + 768],
    [576 + 1 + 768 + 1, 1920]
];

let loop = false;

// custom functions

function loopAction() {
    if (loop) {
        let pos = getPos(activeWindow);

        zones.forEach((zone) => {
            if (pos >= zone[0] && pos <= zone[1]) {
                container.set_x(zone[0] + 1);
                container.set_y(panelHeight);
                container.set_width(zone[1] - zone[0] - 2);
                container.set_height(activeDisplay.get_size()[1] - panelHeight - 1);
            }
        });

        Mainloop.timeout_add(interval, loopAction);
    }
}


function getPos(metaGrabOp) {
    return metaGrabOp.get_frame_rect().x
        + metaGrabOp.get_frame_rect().width / 2;
}

function hideContainer() {
    container.set_x(100000);
    container.set_y(100000);
    container.set_width(0);
    container.set_height(0);
}

function grab_op_begin(metaDisplay, metaWindow, metaGrabOp, gpointer) {
    try {
        activeWindow = metaGrabOp;
        activeDisplay = metaDisplay;
        loop = true;

        loopAction();
    } catch (e) {
    }
}

function grab_op_end(metaDisplay, metaWindow, metaGrabOp, gpointer) {
    try {
        hideContainer();

        loop = false;
        let pos = getPos(metaGrabOp);

        zones.forEach((zone) => {
            if (pos >= zone[0] && pos <= zone[1]) {
                metaGrabOp.move_resize_frame(
                    false,
                    zone[0],
                    panelHeight,
                    zone[1] - zone[0],
                    metaDisplay.get_size()[1] - panelHeight + 1
                );
            }
        });
    } catch (e) {
    }
}

function createContainer() {
    container = new St.Bin(containerParams);

    hideContainer();
}

// main functions

function enable() {
    onWindowGrabBegin = global.display.connect(
        'grab-op-begin',
        grab_op_begin
    );

    onWindowGrabEnd = global.display.connect(
        'grab-op-end',
        grab_op_end
    );

    Main.layoutManager.addChrome(container, containerDefaults);
}

function disable() {
    global.display.disconnect(onWindowGrabBegin);
    global.display.disconnect(onWindowGrabEnd);

    Main.layoutManager.removeChrome(container);
}

function init() {
    createContainer();
}