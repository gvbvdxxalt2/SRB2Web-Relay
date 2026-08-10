class SRB2WebRelayVersion {

    //Avoid changing this because it checks this and will (probably) refuse to connect if it mismatch.
    static RELAY_PROTOCOL = "SRB2W_QRTC_V1"; //SRB2 Web - Quick WebRTC - V1

    static get HTTPContent() {
        return {
            protocol: SRB2WebRelayVersion.RELAY_PROTOCOL
        };
    }
}

module.exports = SRB2WebRelayVersion;