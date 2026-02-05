import { writable, type Writable, get } from 'svelte/store';

export enum MediaStreamStatusEnum {
    INIT = "init",
    CONNECTED = "connected",
    DISCONNECTED = "disconnected",
}
export const onFrameChangeStore: Writable<{ blob: Blob }> = writable({ blob: new Blob() });

export const mediaDevices = writable<MediaDeviceInfo[]>([]);
export const mediaStreamStatus = writable(MediaStreamStatusEnum.INIT);
export const mediaStream = writable<MediaStream | null>(null);

const isSecureCameraContext = () => {
    if (typeof window === "undefined") return true;
    if (window.isSecureContext) return true;
    const host = window.location.hostname;
    return host === "localhost" || host === "127.0.0.1";
};

const buildVideoConstraints = (mediaDevicedID?: string) => {
    if (mediaDevicedID) {
        return {
            width: 1024,
            height: 1024,
            deviceId: { exact: mediaDevicedID },
        };
    }
    return {
        width: 1024,
        height: 1024,
        facingMode: "user",
    };
};

const ensureCameraAvailable = () => {
    if (!navigator?.mediaDevices?.getUserMedia) {
        throw new Error("Camera access is not available in this browser or context.");
    }
    if (!isSecureCameraContext()) {
        throw new Error("Camera access requires HTTPS or localhost. Open the app on https:// or localhost.");
    }
};

export const mediaStreamActions = {
    async enumerateDevices() {
        // console.log("Enumerating devices");
        await navigator.mediaDevices.enumerateDevices()
            .then(devices => {
                const cameras = devices.filter(device => device.kind === 'videoinput');
                mediaDevices.set(cameras);
            })
            .catch(err => {
                console.error(err);
            });
    },
    async start(mediaDevicedID?: string) {
        ensureCameraAvailable();
        const constraints = {
            audio: false,
            video: buildVideoConstraints(mediaDevicedID)
        };

        await navigator.mediaDevices
            .getUserMedia(constraints)
            .then(async (stream) => {
                mediaStreamStatus.set(MediaStreamStatusEnum.CONNECTED);
                mediaStream.set(stream);
                await mediaStreamActions.enumerateDevices();
            })
            .catch((err) => {
                console.error(`${err.name}: ${err.message}`);
                mediaStreamStatus.set(MediaStreamStatusEnum.DISCONNECTED);
                mediaStream.set(null);
                throw err;
            });
    },
    async startScreenCapture() {
        const displayMediaOptions = {
            video: {
                displaySurface: "window",
            },
            audio: false,
            surfaceSwitching: "include"
        };


        let captureStream = null;

        try {
            captureStream = await navigator.mediaDevices.getDisplayMedia(displayMediaOptions);
            const videoTrack = captureStream.getVideoTracks()[0];

            console.log("Track settings:");
            console.log(JSON.stringify(videoTrack.getSettings(), null, 2));
            console.log("Track constraints:");
            console.log(JSON.stringify(videoTrack.getConstraints(), null, 2));
            mediaStreamStatus.set(MediaStreamStatusEnum.CONNECTED);
            mediaStream.set(captureStream)
        } catch (err) {
            console.error(err);
        }

    },
    async switchCamera(mediaDevicedID: string) {
        if (get(mediaStreamStatus) !== MediaStreamStatusEnum.CONNECTED) {
            return;
        }
        ensureCameraAvailable();
        const constraints = {
            audio: false,
            video: buildVideoConstraints(mediaDevicedID)
        };
        await navigator.mediaDevices
            .getUserMedia(constraints)
            .then((stream) => {
                mediaStreamStatus.set(MediaStreamStatusEnum.CONNECTED);
                mediaStream.set(stream)
            })
            .catch((err) => {
                console.error(`${err.name}: ${err.message}`);
            });
    },
    async stop() {
        const current = get(mediaStream);
        if (current) {
            current.getTracks().forEach((track) => track.stop());
        }
        mediaStreamStatus.set(MediaStreamStatusEnum.DISCONNECTED);
        mediaStream.set(null);
    },
};